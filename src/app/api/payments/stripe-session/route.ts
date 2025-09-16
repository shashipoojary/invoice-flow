// Required env vars: STRIPE_SECRET_KEY, NEXT_PUBLIC_APP_URL
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      invoiceId, 
      amount, 
      currency = 'inr',
      type = 'invoice_payment', // 'invoice_payment' | 'platform_fee'
      metadata = {}
    } = body

    if (!invoiceId || !amount) {
      return NextResponse.json({ error: 'Invoice ID and amount are required' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: currency,
          product_data: {
            name: type === 'invoice_payment' ? 'Invoice Payment' : 'Platform Fee',
            description: type === 'invoice_payment' 
              ? `Payment for invoice ${invoiceId}` 
              : `Platform fee for invoice ${invoiceId}`
          },
          unit_amount: Math.round(amount * 100) // Convert to smallest currency unit
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancelled`,
      metadata: {
        invoice_id: invoiceId,
        type: type,
        ...metadata
      }
    })

    return NextResponse.json({
      session_id: session.id,
      checkout_url: session.url
    })

  } catch (error) {
    console.error('Error creating Stripe session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
