import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getDodoPaymentClient } from '@/lib/dodo-payment';
import { getAuthenticatedUser } from '@/lib/auth-middleware';
import { sendSubscriptionConfirmationEmail } from '../webhook/route';

/**
 * Verify payment status and update subscription
 * GET /api/payments/verify?payment_id=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('payment_id');
    const statusFromUrl = searchParams.get('status'); // Dodo Payment adds this to redirect URL

    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
    }
    
    // Check if payment_id is still a placeholder (not replaced by Dodo Payment)
    if (paymentId.includes('{') || paymentId.includes('PAYMENT_ID') || paymentId.includes('CHECKOUT_SESSION_ID')) {
      console.error('Payment ID is still a placeholder:', paymentId);
      return NextResponse.json({ 
        error: 'Invalid payment ID. Payment may not have been processed correctly.',
        message: 'Please check your subscription status. The webhook will process the payment automatically.'
      }, { status: 400 });
    }

    // Get Dodo Payment client
    const dodoClient = getDodoPaymentClient();
    if (!dodoClient) {
      return NextResponse.json({ 
        error: 'Payment service not configured' 
      }, { status: 500 });
    }

    // If status is already provided in URL (from Dodo Payment redirect), trust it
    // Otherwise, verify with API
    let verificationStatus: string | null = statusFromUrl || null;
    let isSuccess = false;

    // Handle "active" status as success (for subscriptions)
    if (statusFromUrl === 'succeeded' || statusFromUrl === 'completed' || statusFromUrl === 'paid' || statusFromUrl === 'active') {
      // Trust the status from URL
      verificationStatus = statusFromUrl;
      isSuccess = true;
      console.log(`Payment status from URL: ${statusFromUrl} - trusting it`);
    } else {
      // Verify payment status via API
      const verification = await dodoClient.verifyPayment(paymentId);

      if (!verification.success) {
        console.error('Payment verification failed:', verification.error);
        return NextResponse.json({ 
          error: verification.error || 'Failed to verify payment' 
        }, { status: 500 });
      }

      verificationStatus = verification.status || null;
      // Check if payment is successful (including "active" for subscriptions)
      isSuccess = verificationStatus === 'succeeded' || 
                   verificationStatus === 'completed' ||
                   verificationStatus === 'paid' ||
                   verificationStatus === 'active';
    }

    if (isSuccess) {
      // Get billing record to find plan
      // Try multiple approaches:
      // 1. Direct match with payment_id
      // 2. Match with checkout session ID (if payment_id is actually a checkout session ID)
      // 3. Also try to get checkout session ID from Dodo Payment API if payment_id is a payment ID
      let billingRecord = null;
      
      // First, try direct match
      const { data: directMatch } = await supabaseAdmin
        .from('billing_records')
        .select('*')
        .eq('stripe_session_id', paymentId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (directMatch) {
        billingRecord = directMatch;
      } else {
        // If not found, try to get checkout session ID from payment
        // Dodo Payment might return payment_id in URL, but billing record was created with checkout session ID
        try {
          const dodoClient = getDodoPaymentClient();
          if (dodoClient) {
            // Try to get payment details to find checkout session ID
            const paymentResponse = await fetch(
              `${dodoClient['baseUrl']}/payments/${paymentId}`,
              {
                headers: {
                  'Authorization': `Bearer ${process.env.DODO_PAYMENT_API_KEY}`,
                },
              }
            );
            
            if (paymentResponse.ok) {
              const paymentData = await paymentResponse.json();
              const checkoutSessionId = paymentData.checkout_session_id || paymentData.session_id;
              
              if (checkoutSessionId) {
                // Try to find billing record with checkout session ID
                const { data: sessionMatch } = await supabaseAdmin
                  .from('billing_records')
                  .select('*')
                  .eq('stripe_session_id', checkoutSessionId)
                  .eq('user_id', user.id)
                  .maybeSingle();
                
                if (sessionMatch) {
                  billingRecord = sessionMatch;
                  // Update billing record to also include payment_id for future lookups
                  // Store both IDs in stripe_session_id (format: "payment_id|session_id")
                  await supabaseAdmin
                    .from('billing_records')
                    .update({
                      stripe_session_id: `${paymentId}|${checkoutSessionId}`,
                      updated_at: new Date().toISOString(),
                    })
                    .eq('id', billingRecord.id);
                }
              }
            }
          }
        } catch (error) {
          console.log('Could not fetch payment details to find checkout session ID:', error);
        }
        
        // If still not found, try to find by user_id and amount (for recent payments)
        // This handles cases where webhook already processed but billing record wasn't found by ID
        if (!billingRecord) {
          const { data: recentMatch } = await supabaseAdmin
            .from('billing_records')
            .select('*')
            .eq('user_id', user.id)
            .in('status', ['pending', 'paid']) // Check both pending and paid (webhook might have already updated)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (recentMatch) {
            billingRecord = recentMatch;
            // Update with payment_id for future lookups (store both IDs)
            const existingSessionId = recentMatch.stripe_session_id || '';
            const updatedSessionId = existingSessionId.includes('|') 
              ? `${paymentId}|${existingSessionId.split('|')[1]}` // Keep original session ID, add payment ID
              : `${paymentId}|${existingSessionId}`; // Add both IDs
              
            await supabaseAdmin
              .from('billing_records')
              .update({
                stripe_session_id: updatedSessionId,
                updated_at: new Date().toISOString(),
              })
              .eq('id', recentMatch.id);
          }
        }
      }

      if (billingRecord) {
        // Determine plan from amount (since billing_records doesn't have metadata)
        let plan = 'monthly'; // Default
        if (billingRecord.amount === 0.06 || billingRecord.amount === 0.01) {
          // $0.06 (or $0.01) = payment method setup for pay_per_invoice
          plan = 'pay_per_invoice';
        } else if (billingRecord.amount === 0.50) {
          plan = 'pay_per_invoice';
        } else if (billingRecord.amount === 9.00) {
          plan = 'monthly';
        }

        // Update billing record if still pending
        if (billingRecord.status === 'pending') {
          await supabaseAdmin
            .from('billing_records')
            .update({
              status: 'paid',
              updated_at: new Date().toISOString(),
            })
            .eq('id', billingRecord.id);
        }

        // For payment method setup ($0.06 or $0.01), try to extract customer ID from payment
        const amount = parseFloat(billingRecord.amount.toString());
        if (amount === 0.06 || amount === 0.01) {
          // Try to get customer ID from Dodo Payment
          const dodoClient = getDodoPaymentClient();
          if (dodoClient) {
            try {
              // Try to get checkout session to extract customer ID
              const sessionResponse = await fetch(
                `${dodoClient['baseUrl']}/checkouts/${paymentId}`,
                {
                  headers: {
                    'Authorization': `Bearer ${process.env.DODO_PAYMENT_API_KEY}`,
                  },
                }
              );
              
              if (sessionResponse.ok) {
                const sessionData = await sessionResponse.json();
                const customerId = sessionData.customer_id || sessionData.customer?.id;
                if (customerId) {
                  await supabaseAdmin
                    .from('users')
                    .update({
                      dodo_customer_id: customerId,
                      payment_method_saved_at: new Date().toISOString(),
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', user.id);
                  console.log(`✅ Saved customer ID for automatic charging: ${customerId}`);
                }
              }
            } catch (error) {
              console.error('Error fetching customer ID:', error);
            }
          }
        }

        // Update subscription
        let nextBillingDate = null;
        if (plan === 'monthly') {
          const nextBilling = new Date();
          nextBilling.setMonth(nextBilling.getMonth() + 1);
          nextBillingDate = nextBilling.toISOString();
        }

        const { error: subscriptionError, data: updatedUser } = await supabaseAdmin
          .from('users')
          .update({
            subscription_plan: plan,
            subscription_status: 'active',
            next_billing_date: nextBillingDate,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)
          .select();

        if (subscriptionError) {
          console.error('Error updating subscription:', subscriptionError);
          return NextResponse.json({
            success: false,
            error: 'Failed to update subscription',
          }, { status: 500 });
        }

        console.log(`✅ Subscription updated for user ${user.id} to ${plan} plan via verify endpoint`);
        
        // Send subscription confirmation email (only on success)
        console.log('='.repeat(80));
        console.log('📧 VERIFY ENDPOINT: Preparing to send subscription confirmation email');
        console.log('   userId:', user.id);
        console.log('   plan:', plan);
        console.log('   paymentId:', paymentId || 'N/A');
        console.log('='.repeat(80));
        
        try {
          await sendSubscriptionConfirmationEmail(user.id, plan, paymentId);
          console.log('✅ VERIFY ENDPOINT: Email sending process completed');
        } catch (emailError) {
          console.error('='.repeat(80));
          console.error('❌ VERIFY ENDPOINT: Error sending subscription confirmation email');
          console.error('   Error:', emailError);
          console.error('   Error type:', emailError instanceof Error ? emailError.constructor.name : typeof emailError);
          console.error('   Error message:', emailError instanceof Error ? emailError.message : String(emailError));
          console.log('='.repeat(80));
          // Don't fail the request if email fails - webhook will also try to send it
        }

        return NextResponse.json({
          success: true,
          status: 'paid',
          plan,
        });
      } else {
        console.log('No billing record found for payment:', paymentId);
        // Still return success if payment is verified, webhook might handle it
        return NextResponse.json({
          success: true,
          status: verificationStatus || 'unknown',
          message: 'Payment verified. Subscription update may be processed by webhook.',
        });
      }
    }

    return NextResponse.json({
      success: true,
      status: verificationStatus || 'unknown',
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}

