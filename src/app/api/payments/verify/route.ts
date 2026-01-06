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
      // Get billing record to find plan
      const { data: billingRecord } = await supabaseAdmin
        .from('billing_records')
        .select('*')
        .eq('stripe_session_id', paymentId) // Reusing field for Dodo payment ID
        .eq('user_id', user.id)
        .single();

      if (billingRecord && billingRecord.status === 'pending') {
        // Update billing record
        await supabaseAdmin
          .from('billing_records')
          .update({
            status: 'paid',
            updated_at: new Date().toISOString(),
          })
          .eq('id', billingRecord.id);

        // Determine plan from amount
        let plan = 'monthly';
        if (billingRecord.amount === 0.50) {
          plan = 'pay_per_invoice';
        }

        // Update subscription
        let nextBillingDate = null;
        if (plan === 'monthly') {
          const nextBilling = new Date();
          nextBilling.setMonth(nextBilling.getMonth() + 1);
          nextBillingDate = nextBilling.toISOString();
        }

        await supabaseAdmin
          .from('users')
          .update({
            subscription_plan: plan,
            subscription_status: 'active',
            next_billing_date: nextBillingDate,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        return NextResponse.json({
          success: true,
          status: 'paid',
          plan,
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

