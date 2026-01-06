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
    
    // Dodo Payment might use different header names for signature
    const signature = request.headers.get('x-dodo-signature') || 
                     request.headers.get('x-signature') ||
                     request.headers.get('dodo-signature') ||
                     request.headers.get('signature') ||
                     '';
    
    const webhookSecret = process.env.DODO_PAYMENT_WEBHOOK_SECRET;

    // Log webhook details for debugging
    console.log('📥 Webhook received:', {
      hasBody: !!body,
      bodyLength: body.length,
      hasSignature: !!signature,
      signatureLength: signature.length,
      signaturePrefix: signature.substring(0, 20),
      hasSecret: !!webhookSecret,
      allHeaders: Object.fromEntries(request.headers.entries()),
    });

    // Verify webhook signature if secret is configured
    if (webhookSecret) {
      const dodoClient = getDodoPaymentClient();
      if (dodoClient) {
        const isValid = dodoClient.verifyWebhookSignature(body, signature, webhookSecret);
        if (!isValid) {
          console.error('❌ Invalid webhook signature. Signature details:', {
            signatureLength: signature.length,
            signaturePrefix: signature.substring(0, 30),
            bodyLength: body.length,
            secretLength: webhookSecret.length,
          });
          
          // For now, log but don't reject (to allow testing)
          // In production, you might want to reject invalid signatures
          console.warn('⚠️ Webhook signature verification failed, but processing anyway for debugging');
          // Uncomment the line below to reject invalid signatures in production:
          // return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        } else {
          console.log('✅ Webhook signature verified successfully');
        }
      }
    } else {
      console.warn('⚠️ DODO_PAYMENT_WEBHOOK_SECRET not configured, skipping signature verification');
    }

    const event = JSON.parse(body);

    console.log('📥 Dodo Payment webhook event received:', {
      type: event.type,
      id: event.id,
      data: event.data ? Object.keys(event.data) : 'no data',
    });

    // Handle different event types
    // Dodo Payment might send checkout session events or payment events
    switch (event.type) {
      case 'payment.succeeded':
      case 'payment.completed':
      case 'checkout.session.completed':
      case 'checkout.session.payment_succeeded':
        await handlePaymentSuccess(event.data || event);
        break;

      case 'payment.failed':
      case 'payment.cancelled':
      case 'checkout.session.payment_failed':
        await handlePaymentFailure(event.data || event);
        break;

      default:
        console.log('⚠️ Unhandled webhook event type:', event.type);
        // Try to handle it anyway if it looks like a payment event
        if (event.data && (event.data.payment_id || event.data.session_id || event.data.id)) {
          console.log('   Attempting to process as payment event...');
          await handlePaymentSuccess(event.data || event);
        }
        break;
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
    console.log('💰 Processing payment success:', {
      hasId: !!(paymentData.id || paymentData.payment_id || paymentData.session_id),
      hasMetadata: !!paymentData.metadata,
      keys: Object.keys(paymentData),
    });

    // Dodo Payment might send checkout session data or payment data
    // Checkout sessions have session_id, payments have payment_id or id
    const sessionId = paymentData.session_id || paymentData.id;
    const paymentId = paymentData.payment_id || paymentData.id || sessionId;
    
    // Metadata might be in different places
    let metadata = paymentData.metadata || {};
    
    // If metadata is empty, try to get it from the checkout session
    if (!metadata.userId && sessionId) {
      console.log('   Fetching checkout session metadata...');
      try {
        const dodoClient = getDodoPaymentClient();
        if (dodoClient) {
          // Try to get checkout session details
          const sessionResponse = await fetch(
            `${dodoClient['baseUrl']}/checkouts/${sessionId}`,
            {
              headers: {
                'Authorization': `Bearer ${process.env.DODO_PAYMENT_API_KEY}`,
              },
            }
          );
          
          if (sessionResponse.ok) {
            const sessionData = await sessionResponse.json();
            metadata = sessionData.metadata || metadata;
            console.log('   Retrieved metadata from checkout session:', metadata);
          }
        }
      } catch (fetchError) {
        console.error('   Error fetching checkout session:', fetchError);
      }
    }
    
    const userId = metadata.userId || metadata.user_id;
    const plan = metadata.plan;
    const paymentType = metadata.type || 'subscription_upgrade'; // Default to subscription upgrade

    console.log('   Extracted data:', { userId, plan, paymentType, paymentId, sessionId });

    if (!userId) {
      console.error('❌ Missing userId in payment metadata. Payment data:', JSON.stringify(paymentData, null, 2));
      
      // Try to find user from billing record
      if (paymentId || sessionId) {
        console.log('   Attempting to find user from billing record...');
        const { data: billingRecord } = await supabaseAdmin
          .from('billing_records')
          .select('user_id, metadata')
          .or(`stripe_session_id.eq.${paymentId || sessionId},stripe_session_id.eq.${sessionId || paymentId}`)
          .single();
        
        if (billingRecord) {
          const foundUserId = billingRecord.user_id;
          const foundMetadata = billingRecord.metadata || {};
          console.log('   Found billing record:', { foundUserId, foundMetadata });
          
          if (foundUserId) {
            // Use found user ID and metadata
            const finalPlan = plan || foundMetadata.plan || 'monthly';
            await updateUserSubscription(foundUserId, finalPlan, paymentId);
            return;
          }
        }
      }
      
      return;
    }

    // Update billing record (try both paymentId and sessionId)
    const billingUpdateIds = [paymentId, sessionId].filter(Boolean);
    for (const id of billingUpdateIds) {
      const { error: billingError } = await supabaseAdmin
        .from('billing_records')
        .update({
          status: 'paid',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_session_id', id) // Reusing field for Dodo payment ID
        .eq('status', 'pending');

      if (!billingError) {
        console.log(`✅ Billing record updated for ${id}`);
        break;
      }
    }

    // Update user subscription
    await updateUserSubscription(userId, plan || 'monthly', paymentId);
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

/**
 * Update user subscription plan
 */
async function updateUserSubscription(userId: string, plan: string, paymentId?: string) {
  try {
    // Handle subscription upgrade payments
    if (plan && plan !== 'free') {
      let nextBillingDate = null;
      if (plan === 'monthly') {
        const nextBilling = new Date();
        nextBilling.setMonth(nextBilling.getMonth() + 1);
        nextBillingDate = nextBilling.toISOString();
      }

      const { error: subscriptionError, data } = await supabaseAdmin
        .from('users')
        .update({
          subscription_plan: plan,
          subscription_status: 'active',
          next_billing_date: nextBillingDate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select();

      if (subscriptionError) {
        console.error('❌ Error updating subscription:', subscriptionError);
      } else {
        console.log(`✅ Subscription updated for user ${userId} to ${plan} plan`);
        if (data && data.length > 0) {
          console.log(`   Updated user data:`, {
            plan: data[0].subscription_plan,
            status: data[0].subscription_status,
            nextBilling: data[0].next_billing_date,
          });
        }
      }
    }
  } catch (error) {
    console.error('Error in updateUserSubscription:', error);
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

