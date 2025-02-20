import { NextRequest, NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";
import { db } from "@/lib/prisma";

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Fetch orders for the user
    const user = await db.user.findUnique({
      where: { email },
      include: {
        orders: {
          include: {
            orderItems: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!user || user.orders.length === 0) {
      return NextResponse.json({ error: "No orders found for this email" }, { status: 404 });
    }

    // Send the email
    const msg = {
      to: email,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL as string,
        name: "Official Rendunks Store",
      },
      subject: "Your Order History - Rendunks Store",
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px; background-color: #f7f7f7;">
          <div style="text-align: center; background-color: #000; padding: 10px;">
            <h1 style="color: #FFD700; margin: 0;">Rendunks Store</h1>
            <p style="color: #ffffff; font-size: 14px;">Official Merchandise & Gear</p>
          </div>
    
          <h2 style="color: #333; text-align: center;">Thank You for Shopping with Rendunks Store!</h2>
          <p style="color: #555; text-align: center;">Here is your order history:</p>
    
          ${user.orders
            .map(
              (order) => `
              <div style="background: #fff; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
                <h3 style="color: #222;">Order #${order.id}</h3>
                <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
                <p><strong>Total Price:</strong> RM${(order.totalPriceInCents / 100).toFixed(2)}</p>
                <p><strong>Shipping Address:</strong> ${order.shippingAddress}</p>
    
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                  <thead>
                    <tr style="background: #000; color: #FFD700; text-align: left;">
                      <th style="padding: 8px; border: 1px solid #ddd;">Product</th>
                      <th style="padding: 8px; border: 1px solid #ddd;">Size</th>
                      <th style="padding: 8px; border: 1px solid #ddd;">Color</th>
                      <th style="padding: 8px; border: 1px solid #ddd;">Quantity</th>
                      <th style="padding: 8px; border: 1px solid #ddd;">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${order.orderItems
                      .map(
                        (item) => `
                        <tr style="background: #f9f9f9;">
                          <td style="padding: 8px; border: 1px solid #ddd;">${item.productName}</td>
                          <td style="padding: 8px; border: 1px solid #ddd;">${item.size || "N/A"}</td>
                          <td style="padding: 8px; border: 1px solid #ddd;">${item.color || "N/A"}</td>
                          <td style="padding: 8px; border: 1px solid #ddd;">${item.quantity}</td>
                          <td style="padding: 8px; border: 1px solid #ddd;">RM${(item.priceAtOrder / 100).toFixed(2)}</td>
                        </tr>
                      `
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>
            `
            )
            .join("")}
    
          <p style="text-align: center; color: #555; font-size: 14px;">If you have any questions, feel free to <a href="mailto:support@rendunks.com" style="color: #000; font-weight: bold;">contact us</a>.</p>
    
          <div style="text-align: center; background-color: #000; padding: 10px; margin-top: 20px;">
            <p style="color: #FFD700; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Rendunks Store. All rights reserved.</p>
          </div>
        </div>
      `,
    };
    

    await sgMail.send(msg);

    return NextResponse.json({ message: "Email sent successfully" }, { status: 200 });
  } catch (error) {
    console.error("SendGrid Error:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
