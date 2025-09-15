import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_demo', {
  apiVersion: '2023-10-16'
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { invoiceId, publicToken } = body

    // Fetch invoice data
    let query = supabase
      .from('invoices')
      .select(`
        *,
        clients:client_id (
          name,
          email,
          company
        )
      `)

    if (publicToken) {
      query = query.eq('public_token', publicToken)
    } else {
      query = query.eq('id', invoiceId)
    }

    const { data: invoice, error } = await query.single()

    if (error || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (invoice.status === 'paid') {
      return NextResponse.json({ error: 'Invoice already paid' }, { status: 400 })
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Invoice ${invoice.invoice_number}`,
              description: invoice.description,
              metadata: {
                invoice_id: invoice.id,
                invoice_number: invoice.invoice_number
              }
            },
            unit_amount: Math.round(invoice.total * 100) // Convert to cents
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/invoice/${invoice.public_token}?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/invoice/${invoice.public_token}?payment=cancelled`,
      customer_email: invoice.clients.email,
      metadata: {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number
      }
    })

    // Update invoice with Stripe session ID
    await supabase
      .from('invoices')
      .update({ 
        stripe_session_id: session.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoice.id)

    return NextResponse.json({ 
      success: true, 
      sessionId: session.id,
      url: session.url 
    })

  } catch (error) {
    console.error('Error creating Stripe session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
