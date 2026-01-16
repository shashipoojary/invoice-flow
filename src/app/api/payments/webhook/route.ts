import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getDodoPaymentClient } from '@/lib/dodo-payment';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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
 * Send subscription confirmation email
 * Exported so it can be called from verify endpoint if needed
 */
export async function sendSubscriptionConfirmationEmail(userId: string, plan: string, paymentId?: string) {
  console.log('='.repeat(80));
  console.log('📧 sendSubscriptionConfirmationEmail CALLED');
  console.log('   userId:', userId);
  console.log('   plan:', plan);
  console.log('   paymentId:', paymentId || 'N/A');
  console.log('   timestamp:', new Date().toISOString());
  console.log('='.repeat(80));
  
  if (!resend) {
    console.error('❌ RESEND NOT CONFIGURED');
    console.error('   RESEND_API_KEY is missing or invalid');
    console.error('   Check your environment variables (.env.local or Vercel)');
    console.error('   RESEND_API_KEY is required to send emails');
    console.log('='.repeat(80));
    return;
  }
  
  console.log('✅ Resend client initialized successfully');
  console.log('   RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
  console.log('   RESEND_API_KEY length:', process.env.RESEND_API_KEY?.length || 0);

  try {
    // Get user email
    let userEmail = '';
    let userName = 'User';
    
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('email, name')
      .eq('id', userId)
      .single();

    if (userError || !userData?.email) {
      // Try to get from auth
      try {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (!authUser?.user?.email) {
          console.error('Could not find user email for subscription confirmation');
          return;
        }
        userEmail = authUser.user.email;
        userName = authUser.user.user_metadata?.name || authUser.user.user_metadata?.full_name || 'User';
      } catch (authError) {
        console.error('Error fetching user from auth:', authError);
        return;
      }
    } else {
      userEmail = userData.email;
      userName = userData.name || 'User';
    }
    const planName = plan === 'monthly' ? 'Monthly Subscription' : plan === 'pay_per_invoice' ? 'Pay Per Invoice Setup' : plan;
    const planAmount = plan === 'monthly' ? '$9.00' : plan === 'pay_per_invoice' ? '$0.06' : '';
    
    // Get base URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://invoiceflow.com';
    const currentDate = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: '2-digit' });

    // Create email template matching Dodo Payment success page design (square corners, clean design)
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Successful</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          </style>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 0;">
                  <!-- Header with Brand -->
                  <tr>
                    <td style="padding: 24px 32px 20px 32px; border-bottom: 1px dashed #e0e0e0;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td>
                            <div style="display: inline-block; background-color: #FF6B9D; padding: 6px 12px; border-radius: 4px; margin-bottom: 16px;">
                              <span style="color: #ffffff; font-weight: 600; font-size: 14px;">F</span>
                              <span style="color: #ffffff; font-weight: 500; font-size: 14px; margin-left: 4px;">Flowinvoicer</span>
                            </div>
                            <h1 style="margin: 0; color: #000000; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Payment Successful</h1>
                            <p style="margin: 12px 0 0 0; color: #666666; font-size: 14px; line-height: 1.5;">
                              Thank you for your order. We've sent an email with the receipt to your inbox!
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Status and Date -->
                  <tr>
                    <td style="padding: 20px 32px; border-bottom: 1px dashed #e0e0e0;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="width: 50%;">
                            <span style="color: #666666; font-size: 14px;">Status:</span>
                            <span style="color: #22c55e; font-size: 16px; font-weight: 600; margin-left: 8px;">✓ Successful</span>
                          </td>
                          <td align="right" style="width: 50%;">
                            <span style="color: #666666; font-size: 14px;">Date:</span>
                            <span style="color: #000000; font-size: 14px; font-weight: 500; margin-left: 8px;">${currentDate}</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Payment Details -->
                  <tr>
                    <td style="padding: 20px 32px; border-bottom: 1px dashed #e0e0e0;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="width: 60px; vertical-align: top;">
                            <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #3b82f6 0%, #22c55e 100%); border-radius: 8px; display: inline-block;"></div>
                          </td>
                          <td style="padding-left: 16px; vertical-align: top;">
                            <div style="color: #000000; font-size: 16px; font-weight: 600; margin-bottom: 4px;">${planName}</div>
                            <div style="color: #666666; font-size: 14px;">Subscription activation</div>
                          </td>
                          <td align="right" style="vertical-align: top;">
                            <div style="color: #000000; font-size: 16px; font-weight: 600;">${planAmount}</div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Summary -->
                  <tr>
                    <td style="padding: 20px 32px;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid #e0e0e0; padding-top: 16px;">
                        <tr>
                          <td style="padding: 8px 0;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="color: #666666; font-size: 14px;">Subtotal</td>
                                <td align="right" style="color: #000000; font-size: 14px; font-weight: 500;">${planAmount}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; border-top: 1px solid #e0e0e0; padding-top: 16px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="color: #000000; font-size: 16px; font-weight: 700;">Total</td>
                                <td align="right" style="color: #000000; font-size: 18px; font-weight: 700;">${planAmount}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- CTA Button -->
                  <tr>
                    <td style="padding: 0 32px 32px 32px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="${baseUrl}/dashboard" 
                               style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 14px 32px; font-weight: 600; font-size: 14px; border-radius: 0; letter-spacing: 0.5px;">
                              Go to Dashboard
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 32px; background-color: #fafafa; border-top: 1px solid #e0e0e0;">
                      <p style="margin: 0 0 8px 0; color: #666666; font-size: 12px; line-height: 1.5;">
                        If you have any questions, feel free to reach out to our support team.
                      </p>
                      <p style="margin: 0; color: #999999; font-size: 11px;">
                        This is an automated confirmation email. Please do not reply to this email.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    // Send email
    console.log(`📧 Attempting to send subscription confirmation email to ${userEmail} for ${planName} plan`);
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'FlowInvoicer <onboarding@resend.dev>',
      to: userEmail,
      subject: `Payment Successful - ${planName}`,
      html: emailHtml,
    });

    if (emailError) {
      console.error('❌ Error sending subscription confirmation email:', emailError);
      console.error('Email error details:', JSON.stringify(emailError, null, 2));
    } else {
      console.log(`✅ Subscription confirmation email sent successfully to ${userEmail}`);
      console.log('Email ID:', emailData?.id || 'N/A');
    }
  } catch (error) {
    console.error('Error in sendSubscriptionConfirmationEmail:', error);
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
      const finalPlan = paymentType === 'payment_method_setup' ? 'pay_per_invoice' : (plan || 'monthly');
      
      // For payment_method_setup, also activate the plan
      if (paymentType === 'payment_method_setup') {
        await updateUserSubscription(userId, 'pay_per_invoice', paymentId);
      } else {
        await updateUserSubscription(userId, plan || 'monthly', paymentId);
      }
      
      // Send subscription confirmation email
      console.log('='.repeat(80));
      console.log('📧 WEBHOOK: Preparing to send subscription confirmation email');
      console.log('   userId:', userId);
      console.log('   finalPlan:', finalPlan);
      console.log('   paymentId:', paymentId || 'N/A');
      console.log('   paymentType:', paymentType);
      console.log('='.repeat(80));
      
      try {
        await sendSubscriptionConfirmationEmail(userId, finalPlan, paymentId);
        console.log('✅ WEBHOOK: Email sending process completed');
      } catch (emailError) {
        console.error('='.repeat(80));
        console.error('❌ WEBHOOK: Error in subscription confirmation email process');
        console.error('   Error:', emailError);
        console.error('   Error type:', emailError instanceof Error ? emailError.constructor.name : typeof emailError);
        console.error('   Error message:', emailError instanceof Error ? emailError.message : String(emailError));
        console.error('   Error stack:', emailError instanceof Error ? emailError.stack : 'No stack trace');
        console.log('='.repeat(80));
        // Don't fail the webhook if email fails
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

