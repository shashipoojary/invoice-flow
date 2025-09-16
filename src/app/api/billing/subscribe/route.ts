// Required env vars: STRIPE_SECRET_KEY, NEXT_PUBLIC_APP_URL
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Get user from auth header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { plan = 'monthly' } = body

    // Define subscription plans
    const plans = {
      monthly: {
        price: 999, // ₹9.99 per month
        name: 'Monthly Plan',
        description: 'Unlimited invoices per month'
      },
      yearly: {
        price: 9999, // ₹99.99 per year
        name: 'Yearly Plan',
        description: 'Unlimited invoices per year (2 months free)'
      }
    }

    const selectedPlan = plans[plan as keyof typeof plans]
    if (!selectedPlan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Create Stripe checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'inr',
          product_data: {
            name: `InvoiceFlow Pro - ${selectedPlan.name}`,
            description: selectedPlan.description
          },
          unit_amount: selectedPlan.price,
          recurring: {
            interval: plan === 'monthly' ? 'month' : 'year'
          }
        },
        quantity: 1
      }],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscription=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscription=cancelled`,
      customer_email: user.email,
      metadata: {
        user_id: user.id,
        plan: plan
      }
    })

    // Record billing record
    await supabase
      .from('billing_records')
      .insert({
        user_id: user.id,
        type: 'subscription',
        amount: selectedPlan.price / 100, // Convert from paise
        currency: 'INR',
        stripe_session_id: session.id,
        status: 'pending'
      })

    return NextResponse.json({
      session_id: session.id,
      checkout_url: session.url
    })

  } catch (error) {
    console.error('Error creating subscription:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
