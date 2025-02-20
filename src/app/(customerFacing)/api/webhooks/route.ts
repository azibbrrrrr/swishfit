import { decreaseStock } from "@/actions/stockService";
import { db } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

// Define the TypeScript interface for line items
interface Item {
  price: {
    unit_amount: number;
    product: {
      name: string;
      metadata: {
        productId: string;
        size?: string;
        color?: string;
      };
    };
  };
  quantity: number;
}

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

      let user = await db.user.findUnique({
        where: { email: session.customer_email },
      });

      if (!user) {
        user = await db.user.create({
          data: { email: session.customer_email },
        });
      }

      const shippingAddressString = [
        session?.shipping_details?.address?.line1,
        session?.shipping_details?.address?.city,
        session?.shipping_details?.address?.state,
        session?.shipping_details?.address?.postal_code,
        session?.shipping_details?.address?.country,
      ]
        .filter(Boolean)
        .join("\n");

      const retrieveSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ["line_items.data.price.product"],
      });
      
      const lineItems = retrieveSession?.line_items?.data
        ?.filter((item) => item.price !== null && typeof item.price.product !== "string" && !("deleted" in item.price.product))
        .map((item) => ({
          price: {
            unit_amount: item.price!.unit_amount!,
            product: {
              name: (item.price!.product as Stripe.Product).name,
              metadata: (item.price!.product as Stripe.Product).metadata as {
                productId: string;
                size?: string;
                color?: string;
              },
            },
          },
          quantity: item.quantity!,
        })) as Item[];

      if (!lineItems || lineItems.length === 0) {
        console.error("No line items found");
        return new NextResponse("Bad Request: No line items", { status: 400 });
      }

      try {
        const order = await db.order.create({
          data: {
            userId: user.id,
            totalPriceInCents: amount_total!,
            shippingAddress: shippingAddressString,
            orderItems: {
              create: lineItems.map((item: Item) => ({
                productId: item.price.product.metadata.productId,
                productName: item.price.product.name,
                quantity: item.quantity,
                priceAtOrder: item.price.unit_amount,
                size: item.price.product.metadata.size || null,
                color: item.price.product.metadata.color || null,
              })),
            },
          },
        });

        console.log("Order saved successfully:", order);

        const decreaseStockPromises = lineItems.map(async (item: Item) => {
          const { productId, size, color } = item.price.product.metadata;
          const quantity = item.quantity;

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

        const orderHtml = `
          <h2>Thank You for Your Purchase!</h2>
          <p><strong>Total Price:</strong> RM${(amount_total! / 100).toFixed(2)}</p>
          <p><strong>Shipping Address:</strong> ${shippingAddressString}</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="background: black; color: gold;">
              <th style="padding: 8px;">Product</th>
              <th style="padding: 8px;">Size</th>
              <th style="padding: 8px;">Color</th>
              <th style="padding: 8px;">Quantity</th>
              <th style="padding: 8px;">Price</th>
            </tr>
            ${lineItems.map((item: Item) => `
                <tr style="background: #f9f9f9;">
                  <td style="padding: 8px;">${item.price.product.name}</td>
                  <td style="padding: 8px;">${item.price.product.metadata.size || "N/A"}</td>
                  <td style="padding: 8px;">${item.price.product.metadata.color || "N/A"}</td>
                  <td style="padding: 8px;">${item.quantity}</td>
                  <td style="padding: 8px;">RM${(item.price.unit_amount! / 100).toFixed(2)}</td>
                </tr>
              `
              )
              .join("")}
          </table>
          <p>We appreciate your support! If you have any questions, feel free to <a href="mailto:support@rendunks.com">contact us</a>.</p>
        `;

        await sgMail.send({
          to: session.customer_email,
          from: { email: process.env.SENDGRID_FROM_EMAIL!, name: "Rendunks Store" },
          subject: "Your Order Confirmation - Rendunks Store",
          html: orderHtml,
        });

        console.log("Order confirmation email sent to:", session.customer_email);
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
