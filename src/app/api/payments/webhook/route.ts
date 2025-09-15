import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_demo', {
  apiVersion: '2023-10-16'
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_demo'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.payment_status === 'paid') {
          // Update invoice status to paid
          const { error } = await supabase
            .from('invoices')
            .update({ 
              status: 'paid',
              updated_at: new Date().toISOString()
            })
            .eq('stripe_session_id', session.id)

          if (error) {
            console.error('Error updating invoice status:', error)
            return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
          }

          console.log(`Invoice paid: ${session.metadata?.invoice_number}`)
        }
        break

      case 'payment_intent.payment_failed':
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('Payment failed:', paymentIntent.id)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
