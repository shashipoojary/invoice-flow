import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getDodoPaymentClient } from '@/lib/dodo-payment';
import { getAuthenticatedUser } from '@/lib/auth-middleware';

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

    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
    }

    // Get Dodo Payment client
    const dodoClient = getDodoPaymentClient();
    if (!dodoClient) {
      return NextResponse.json({ 
        error: 'Payment service not configured' 
      }, { status: 500 });
    }

    // Verify payment status
    const verification = await dodoClient.verifyPayment(paymentId);

    if (!verification.success) {
      return NextResponse.json({ 
        error: verification.error || 'Failed to verify payment' 
      }, { status: 500 });
    }

    // Check if payment is successful
    const isSuccess = verification.status === 'succeeded' || 
                     verification.status === 'completed' ||
                     verification.status === 'paid';

    if (isSuccess) {
      // Get billing record to find plan (try both session_id and payment_id)
      const { data: billingRecord } = await supabaseAdmin
        .from('billing_records')
        .select('*')
        .or(`stripe_session_id.eq.${paymentId},metadata->>session_id.eq.${paymentId}`)
        .eq('user_id', user.id)
        .single();

      if (billingRecord) {
        // Get plan from metadata or amount
        const metadata = billingRecord.metadata || {};
        let plan = metadata.plan || 'monthly';
        
        // Fallback: determine plan from amount if not in metadata
        if (!metadata.plan) {
          if (billingRecord.amount === 0.50) {
            plan = 'pay_per_invoice';
          } else if (billingRecord.amount === 9.00) {
            plan = 'monthly';
          }
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
          status: verification.status,
          message: 'Payment verified. Subscription update may be processed by webhook.',
        });
      }
    }

    return NextResponse.json({
      success: true,
      status: verification.status,
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}

