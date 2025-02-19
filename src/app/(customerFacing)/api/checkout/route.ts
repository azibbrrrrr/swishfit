import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const { cartItems, email } = await req.json();

    if (!cartItems || !email) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email,
      shipping_address_collection: {
        allowed_countries: ["MY"],
      },
      line_items: cartItems.map((cartItem: any) => ({
        price_data: {
          currency: 'myr',
          product_data: {
            name: cartItem.item.name, // Use correct field
            metadata: {
              productId: cartItem.item.id,
              ...(cartItem.size && { size: cartItem.size }),
              ...(cartItem.color && { color: cartItem.color }),
            },
          },
          unit_amount: cartItem.item.priceInCents, // // Price is already in cents
        },
        quantity: cartItem.quantity,
      })),
      success_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/payment_success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/cart`,
    });

    return NextResponse.json({ sessionUrl: session.url }, { headers: corsHeaders });
  } catch (err) {
    console.error('[checkout_POST]', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
