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

    // Format order details for email
    const ordersHtml = user.orders
      .map(
        (order) => `
      <h3>Order #${order.id}</h3>
      <p><strong>Orders Created:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
      <p><strong>Total Price:</strong> RM${(order.totalPriceInCents / 100).toFixed(2)}</p>
      <p><strong>Shipping Address:</strong> ${order.shippingAddress}</p>
      <table border="1" width="100%" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">
        <tr>
          <th>Image</th>
          <th>Product</th>
          <th>Size</th>
          <th>Color</th>
          <th>Quantity</th>
          <th>Price</th>
        </tr>
        ${order.orderItems
          .map(
            (item) => `
          <tr>
            <td><img src="${item.product.imagePath}" alt="${item.productName}" width="50" height="50"></td>
            <td>${item.productName}</td>
            <td>${item.size || "N/A"}</td>
            <td>${item.color || "N/A"}</td>
            <td>${item.quantity}</td>
            <td>$${(item.priceAtOrder / 100).toFixed(2)}</td>
          </tr>
        `
          )
          .join("")}
      </table>
      <hr/>
    `
      )
      .join("");

    // Send the email
    const msg = {
      to: email,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL as string,
        name: "Official Rendunks Store",
      },
      subject: "Your Order History - Rendunks Store",
      html: `
        <h2>Thank you for shopping with Rendunks Store!</h2>
        <p>Here are your past orders:</p>
        ${ordersHtml}
        <p>If you have any questions, feel free to contact us.</p>
      `,
    };

    await sgMail.send(msg);

    return NextResponse.json({ message: "Email sent successfully" }, { status: 200 });
  } catch (error) {
    console.error("SendGrid Error:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
