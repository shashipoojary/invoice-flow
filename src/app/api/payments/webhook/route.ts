// Required env vars: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

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

    const supabase = createServerClient()

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session, supabase)
        break

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent, supabase)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice, supabase)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session, supabase: any) {
  const { metadata } = session
  const invoiceId = metadata?.invoice_id
  const type = metadata?.type

  if (!invoiceId) {
    console.error('No invoice_id in session metadata')
    return
  }

  // Record payment
  await supabase
    .from('payments')
    .insert({
      invoice_id: invoiceId,
      user_id: metadata?.user_id,
      provider: 'stripe',
      provider_payment_id: session.payment_intent as string,
      amount: session.amount_total! / 100, // Convert from cents
      currency: session.currency!,
      status: 'succeeded',
      metadata: {
        session_id: session.id,
        customer_email: session.customer_details?.email
      }
    })

  if (type === 'platform_fee') {
    // Update billing record
    await supabase
      .from('billing_records')
      .update({ status: 'paid' })
      .eq('invoice_id', invoiceId)
      .eq('type', 'per_invoice_fee')

    // Update invoice status to sent if it was pending
    await supabase
      .from('invoices')
      .update({ status: 'sent' })
      .eq('id', invoiceId)
      .eq('status', 'draft')

  } else if (type === 'invoice_payment') {
    // Update invoice status to paid
    await supabase
      .from('invoices')
      .update({ status: 'paid' })
      .eq('id', invoiceId)

    // Send payment confirmation email
    await sendPaymentConfirmationEmail(invoiceId, supabase)
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent, supabase: any) {
  // Handle direct payment intents if needed
  console.log('Payment intent succeeded:', paymentIntent.id)
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice, supabase: any) {
  // Handle subscription payments
  console.log('Invoice payment succeeded:', invoice.id)
}

async function sendPaymentConfirmationEmail(invoiceId: string, supabase: any) {
  try {
    // Fetch invoice details
    const { data: invoice } = await supabase
      .from('invoices')
      .select(`
        *,
        clients (*)
      `)
      .eq('id', invoiceId)
      .single()

    if (!invoice) return

    // Get user settings
    const { data: userSettings } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', invoice.user_id)
      .single()

    const businessName = userSettings?.business_name || 'Your Business'
    const businessEmail = userSettings?.business_email

    // Send confirmation email to client
    const emailData = {
      from: `InvoiceFlow Pro <noreply@${process.env.RESEND_DOMAIN || 'invoiceflowpro.com'}>`,
      to: [invoice.clients.email],
      subject: `Payment Received - Invoice ${invoice.invoice_number}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #22c55e;">
            <h2 style="color: #15803d; margin: 0;">Payment Received!</h2>
            <p style="margin: 10px 0 0 0; color: #166534;">Thank you for your payment</p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <p>Dear ${invoice.clients.name},</p>
            
            <p>We have successfully received your payment for invoice <strong>${invoice.invoice_number}</strong>.</p>
            
            <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold;">Payment Details:</p>
              <p style="margin: 5px 0;">Invoice #: ${invoice.invoice_number}</p>
              <p style="margin: 5px 0;">Amount Paid: ₹${invoice.total.toLocaleString()}</p>
              <p style="margin: 5px 0;">Payment Date: ${new Date().toLocaleDateString()}</p>
            </div>
            
            <p>Your invoice has been marked as paid. Thank you for your business!</p>
            
            <p>Best regards,<br>${businessName}</p>
          </div>
        </div>
      `
    }

    // Note: You'll need to implement email sending here
    // For now, just log the email data
    console.log('Payment confirmation email:', emailData)

  } catch (error) {
    console.error('Error sending payment confirmation email:', error)
  }
}
