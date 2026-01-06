import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getDodoPaymentClient } from '@/lib/dodo-payment';

/**
 * Dodo Payment Webhook Handler
 * Handles payment success/failure events from Dodo Payment
 * POST /api/payments/webhook
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('x-dodo-signature') || '';
    const webhookSecret = process.env.DODO_PAYMENT_WEBHOOK_SECRET;

    // Verify webhook signature if secret is configured
    if (webhookSecret) {
      const dodoClient = getDodoPaymentClient();
      if (dodoClient && !dodoClient.verifyWebhookSignature(body, signature, webhookSecret)) {
        console.error('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const event = JSON.parse(body);

    console.log('Dodo Payment webhook event:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'payment.succeeded':
      case 'payment.completed':
        await handlePaymentSuccess(event.data);
        break;

      case 'payment.failed':
      case 'payment.cancelled':
        await handlePaymentFailure(event.data);
        break;

      default:
        console.log('Unhandled webhook event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ 
      error: error.message || 'Webhook processing failed' 
    }, { status: 500 });
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(paymentData: any) {
  try {
    const paymentId = paymentData.id || paymentData.payment_id;
    const metadata = paymentData.metadata || {};
    const userId = metadata.userId;
    const plan = metadata.plan;

    if (!userId || !plan) {
      console.error('Missing userId or plan in payment metadata');
      return;
    }

    // Update billing record
    const { error: billingError } = await supabaseAdmin
      .from('billing_records')
      .update({
        status: 'paid',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_session_id', paymentId) // Reusing field for Dodo payment ID
      .eq('status', 'pending');

    if (billingError) {
      console.error('Error updating billing record:', billingError);
    }

    // Update user subscription
    let nextBillingDate = null;
    if (plan === 'monthly') {
      const nextBilling = new Date();
      nextBilling.setMonth(nextBilling.getMonth() + 1);
      nextBillingDate = nextBilling.toISOString();
    }

    const { error: subscriptionError } = await supabaseAdmin
      .from('users')
      .update({
        subscription_plan: plan,
        subscription_status: 'active',
        next_billing_date: nextBillingDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (subscriptionError) {
      console.error('Error updating subscription:', subscriptionError);
    } else {
      console.log(`✅ Subscription updated for user ${userId} to ${plan} plan`);
    }
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailure(paymentData: any) {
  try {
    const paymentId = paymentData.id || paymentData.payment_id;

    // Update billing record
    await supabaseAdmin
      .from('billing_records')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_session_id', paymentId) // Reusing field for Dodo payment ID
      .eq('status', 'pending');

    console.log(`❌ Payment failed for payment ID: ${paymentId}`);
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

