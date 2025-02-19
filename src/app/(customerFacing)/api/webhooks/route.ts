import { decreaseStock } from "@/actions/stockService";
import { db } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

export const POST = async (req: NextRequest) => {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("Stripe-Signature") as string;

    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      console.log("[webhooks_POST]", session);
      const { amount_total } = session;

      if (!session.customer_email) {
        console.error("Missing email");
        return new NextResponse("Bad Request: Missing email", { status: 400 });
      }

      // Retrieve or create user
      let user = await db.user.findUnique({
        where: { email: session.customer_email },
      });

      if (!user) {
        user = await db.user.create({
          data: { email: session.customer_email },
        });
      }

      // Fetch shipping address
      const shippingAddressString = [
        session?.shipping_details?.address?.line1,
        session?.shipping_details?.address?.city,
        session?.shipping_details?.address?.state,
        session?.shipping_details?.address?.postal_code,
        session?.shipping_details?.address?.country,
      ]
        .filter(Boolean)
        .join("\n");

      // Retrieve session with expanded line items
      const retrieveSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ["line_items.data.price.product"],
      });

      // Fetch line items from Stripe
      const lineItems = retrieveSession?.line_items?.data;

      if (!lineItems || lineItems.length === 0) {
        console.error("No line items found");
        return new NextResponse("Bad Request: No line items", { status: 400 });
      }

      try {
        // Create the order in the database
        const order = await db.order.create({
          data: {
            userId: user.id,
            totalPriceInCents: amount_total!,
            shippingAddress: shippingAddressString,
            orderItems: {
              create: lineItems.map((item: any) => ({
                productId: item.price.product?.metadata?.productId as string,
                productName: item.price.product?.name as string,
                quantity: item.quantity!,
                priceAtOrder: item.price.unit_amount!,
                size: item.price.product?.metadata?.size || null,
                color: item.price.product?.metadata?.color || null,
              })),
            },
          },
        });

        console.log("Order saved successfully:", order);

        // Decrease stock for each product variation
        const decreaseStockPromises = lineItems.map(async (item: any) => {
            const productId = item.price.product?.metadata?.productId as string;
            const size = item.price.product?.metadata?.size || undefined;
            const color = item.price.product?.metadata?.color || undefined;
            const quantity = item.quantity!;
            
            // 🔥 Debugging: Log values before updating
            console.log(`Decreasing stock for Product ID: ${productId}, Size: ${size}, Color: ${color}, Quantity: ${quantity}`);
            
            if (!productId) {
                console.error("❌ Missing productId in metadata, skipping stock update");
                return;
            }
            
            try {
                await decreaseStock(productId, { size, color }, quantity);
                console.log(`✅ Stock decreased for ${productId} (Size: ${size}, Color: ${color})`);
            } catch (stockError) {
                console.error(`❌ Failed to decrease stock for ${productId}:`, stockError);
            }
            });
            
            await Promise.all(decreaseStockPromises);
          
      } catch (dbError) {
        console.error("Database transaction error:", dbError);
        return new NextResponse("Internal Server Error", { status: 500 });
      }
    }

    return new NextResponse("Order created", { status: 200 });
  } catch (err) {
    console.error("Webhook error:", err);
    return new NextResponse("Webhook processing failed", { status: 500 });
  }
};
