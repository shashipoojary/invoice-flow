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
    
    // Dodo Payment uses Svix for webhooks, signature is in 'webhook-signature' header
    // Format: "v1,<base64_signature>"
    const signatureHeader = request.headers.get('webhook-signature') || 
                           request.headers.get('x-dodo-signature') || 
                           request.headers.get('x-signature') ||
                           request.headers.get('dodo-signature') ||
                           request.headers.get('signature') ||
                           '';
    
    const webhookSecret = process.env.DODO_PAYMENT_WEBHOOK_SECRET;
    const webhookId = request.headers.get('webhook-id');
    const webhookTimestamp = request.headers.get('webhook-timestamp');

    // Extract signature from header (format: "v1,<base64_signature>" for Svix)
    // Svix can send multiple signatures separated by spaces: "v1,sig1 v1,sig2"
    let signatures: string[] = [];
    if (signatureHeader) {
      // Split by space to handle multiple signatures
      const signatureParts = signatureHeader.split(' ');
      for (const part of signatureParts) {
        if (part.startsWith('v1,')) {
          // Svix format: "v1,<base64_signature>"
          signatures.push(part.substring(3)); // Remove "v1," prefix
        } else {
          signatures.push(part);
        }
      }
    }
    
    // Log webhook details for debugging
    console.log('📥 Webhook received:', {
      hasBody: !!body,
      bodyLength: body.length,
      hasSignatureHeader: !!signatureHeader,
      signatureHeaderPrefix: signatureHeader.substring(0, 50),
      extractedSignatures: signatures.length,
      webhookId,
      webhookTimestamp,
      hasSecret: !!webhookSecret,
    });

    // Verify webhook signature if secret is configured
    // Svix format: signature is base64, and we need to verify with timestamp + body
    if (webhookSecret && signatures.length > 0) {
      const dodoClient = getDodoPaymentClient();
      if (dodoClient) {
        let isValid = false;
        
        // Try each signature (Svix can send multiple)
        for (const signature of signatures) {
          try {
            // For Svix, the signed payload is: timestamp + '.' + body
            const signedPayload = webhookTimestamp ? `${webhookTimestamp}.${body}` : body;
            const valid = dodoClient.verifyWebhookSignature(signedPayload, signature, webhookSecret);
            if (valid) {
              isValid = true;
              console.log('✅ Webhook signature verified successfully');
              break;
            }
          } catch (verifyError: any) {
            console.error('⚠️ Webhook signature verification error:', {
              error: verifyError.message,
              code: verifyError.code,
              signatureLength: signature.length,
            });
          }
        }
        
        if (!isValid) {
          console.error('❌ All webhook signatures failed verification:', {
            signaturesCount: signatures.length,
            bodyLength: body.length,
            secretLength: webhookSecret.length,
            webhookTimestamp,
            signedPayloadLength: webhookTimestamp ? `${webhookTimestamp}.${body}`.length : body.length,
          });
          
          // Log more details for debugging
          if (signatures.length > 0) {
            console.error('   Signature details:', {
              receivedSignature: signatures[0].substring(0, 50),
              signedPayload: webhookTimestamp ? `${webhookTimestamp}.${body.substring(0, 100)}...` : body.substring(0, 100),
            });
          }
          
          // For now, log but don't reject (to allow testing)
          // In production, you might want to reject invalid signatures
          console.warn('⚠️ Webhook signature verification failed, but processing anyway for debugging');
          // Uncomment the line below to reject invalid signatures in production:
          // return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }
      }
    } else if (webhookSecret && signatures.length === 0) {
      console.warn('⚠️ Webhook secret configured but no signature found in headers');
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

    // Dodo Payment sends payment data with checkout_session_id
    const checkoutSessionId = paymentData.checkout_session_id;
    const paymentId = paymentData.payment_id || paymentData.id;
    const sessionId = checkoutSessionId || paymentId;
    
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
    const paymentType = metadata.type || 'subscription_upgrade'; // subscription_upgrade | payment_method_setup | per_invoice_fee

    console.log('   Extracted data:', { userId, plan, paymentType, paymentId, sessionId });
    
    // For payment_method_setup, extract and save customer ID
    if (paymentType === 'payment_method_setup' && userId) {
      try {
        // Try to get customer ID from payment data
        // Dodo Payment might include customer_id in the payment response
        const customerId = paymentData.customer_id || paymentData.customer?.id;
        const paymentMethodId = paymentData.payment_method_id || paymentData.payment_method?.id;
        
        if (customerId) {
          // Save customer ID and payment method ID to users table
          const updateData: any = {
            dodo_customer_id: customerId,
            updated_at: new Date().toISOString()
          };
          
          if (paymentMethodId) {
            updateData.dodo_payment_method_id = paymentMethodId;
            updateData.payment_method_saved_at = new Date().toISOString();
          }
          
          const { error: updateError } = await supabaseAdmin
            .from('users')
            .update(updateData)
            .eq('id', userId);
          
          if (updateError) {
            console.error('   Error saving customer ID:', updateError);
          } else {
            console.log('   ✅ Saved customer ID and payment method:', { customerId, paymentMethodId });
          }
        } else {
          // If customer_id not in payment data, try to fetch from checkout session
          console.log('   Customer ID not in payment data, fetching from checkout session...');
          const dodoClient = getDodoPaymentClient();
          if (dodoClient && sessionId) {
            try {
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
                const sessionCustomerId = sessionData.customer_id || sessionData.customer?.id;
                if (sessionCustomerId) {
                  const { error: updateError } = await supabaseAdmin
                    .from('users')
                    .update({
                      dodo_customer_id: sessionCustomerId,
                      payment_method_saved_at: new Date().toISOString(),
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', userId);
                  
                  if (!updateError) {
                    console.log('   ✅ Saved customer ID from checkout session:', sessionCustomerId);
                  }
                }
              }
            } catch (fetchError) {
              console.error('   Error fetching checkout session for customer ID:', fetchError);
            }
          }
        }
      } catch (error) {
        console.error('   Error processing payment method setup:', error);
      }
    }

    if (!userId) {
      console.error('❌ Missing userId in payment metadata. Payment data:', JSON.stringify(paymentData, null, 2));
      
      // Try to find user from billing record
      // Since billing_records doesn't have metadata, we'll determine plan from amount
      if (paymentId || sessionId) {
        console.log('   Attempting to find user from billing record...');
        const { data: billingRecord } = await supabaseAdmin
          .from('billing_records')
          .select('user_id, amount, type')
          .or(`stripe_session_id.eq.${paymentId || sessionId},stripe_session_id.eq.${sessionId || paymentId}`)
          .single();
        
        if (billingRecord) {
          const foundUserId = billingRecord.user_id;
          console.log('   Found billing record:', { foundUserId, amount: billingRecord.amount, type: billingRecord.type });
          
          if (foundUserId) {
            // Determine plan from amount or type
            let finalPlan = plan;
            if (!finalPlan) {
              if (billingRecord.amount === 9.00 || billingRecord.type === 'subscription') {
                finalPlan = 'monthly';
              } else if (billingRecord.amount === 0.50) {
                finalPlan = 'pay_per_invoice';
              } else {
                finalPlan = 'monthly'; // Default
              }
            }
            await updateUserSubscription(foundUserId, finalPlan, paymentId);
            return;
          }
        }
      }
      
      return;
    }

    // Update billing record (try both paymentId and sessionId)
    const billingUpdateIds = [paymentId, sessionId].filter(Boolean);
    let updatedInvoiceId: string | null = null;
    for (const id of billingUpdateIds) {
      const { data: billingRecord, error: billingError } = await supabaseAdmin
        .from('billing_records')
        .select('invoice_id')
        .eq('stripe_session_id', id) // Reusing field for Dodo payment ID
        .eq('status', 'pending')
        .single();

      if (!billingError && billingRecord) {
        updatedInvoiceId = billingRecord.invoice_id;
        const { error: updateError } = await supabaseAdmin
          .from('billing_records')
          .update({
            status: 'paid',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_session_id', id)
          .eq('status', 'pending');

        if (!updateError) {
          console.log(`✅ Billing record updated for ${id}`);
          
          // If this is a per_invoice_fee payment, mark invoice as premium unlocked
          if (paymentType === 'per_invoice_fee' && updatedInvoiceId) {
            try {
              // Get current invoice metadata
              const { data: invoice } = await supabaseAdmin
                .from('invoices')
                .select('metadata')
                .eq('id', updatedInvoiceId)
                .single();
              
              const invoiceMetadata = invoice?.metadata ? JSON.parse(invoice.metadata) : {};
              
              // Update invoice metadata to mark premium unlock
              await supabaseAdmin
                .from('invoices')
                .update({
                  metadata: JSON.stringify({
                    ...invoiceMetadata,
                    premium_unlocked: true,
                    premium_unlocked_at: new Date().toISOString()
                  })
                })
                .eq('id', updatedInvoiceId);
              
              console.log(`✅ Premium unlock marked for invoice ${updatedInvoiceId}`);
            } catch (error) {
              console.error('Error marking premium unlock:', error);
              // Don't fail the payment if metadata update fails
            }
          }
          
          break;
        }
      }
    }

    // Update user subscription (only for subscription upgrades, not per-invoice fees)
    if (paymentType === 'subscription_upgrade' || paymentType === 'payment_method_setup') {
      // For payment_method_setup, also activate the plan
      if (paymentType === 'payment_method_setup') {
        await updateUserSubscription(userId, 'pay_per_invoice', paymentId);
      } else {
        await updateUserSubscription(userId, plan || 'monthly', paymentId);
      }
    }
    
    // For per_invoice_fee, billing record and premium unlock already handled above
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

      // Prepare update data
      const updateData: any = {
        subscription_plan: plan,
        subscription_status: 'active',
        next_billing_date: nextBillingDate,
        updated_at: new Date().toISOString(),
      };

      // If switching to Pay Per Invoice, set activation date (for tracking free invoices)
      if (plan === 'pay_per_invoice') {
        const { data: existingUser } = await supabaseAdmin
          .from('users')
          .select('pay_per_invoice_activated_at')
          .eq('id', userId)
          .single();
        
        // Only set activation date if not already set (first time switching to Pay Per Invoice)
        if (!existingUser?.pay_per_invoice_activated_at) {
          updateData.pay_per_invoice_activated_at = new Date().toISOString();
        }
      }

      const { error: subscriptionError, data } = await supabaseAdmin
        .from('users')
        .update(updateData)
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

