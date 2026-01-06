import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getDodoPaymentClient, getPlanAmount } from '@/lib/dodo-payment';
import { getAuthenticatedUser } from '@/lib/auth-middleware';

/**
 * Create payment checkout session for subscription upgrade
 * POST /api/payments/checkout
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { plan } = body;

    // Validate plan
    const validPlans = ['monthly', 'pay_per_invoice'];
    if (!validPlans.includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Pay Per Invoice plan does NOT require upfront payment
    // It charges $0.50 per invoice when invoices are created/sent
    if (plan === 'pay_per_invoice') {
      // Directly update subscription without payment
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          subscription_plan: 'pay_per_invoice',
          subscription_status: 'active',
          next_billing_date: null, // No recurring billing
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating subscription:', updateError);
        return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        plan: 'pay_per_invoice',
        message: 'Pay Per Invoice plan activated. You will be charged $0.50 per invoice when you create or send invoices.',
        requiresPayment: false
      });
    }

    // Monthly plan requires upfront payment of $9
    const amount = getPlanAmount(plan as 'monthly');
    if (amount <= 0) {
      return NextResponse.json({ error: 'Invalid plan amount' }, { status: 400 });
    }

    // Get user details - try to get from users table, but fallback to auth user data
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('email, name')
      .eq('id', user.id)
      .single();

    // If user doesn't exist in users table, use auth user data as fallback
    const userEmail = profile?.email || user.email || '';
    const userName = profile?.name || user.user_metadata?.full_name || user.user_metadata?.name || 'User';

    if (!userEmail) {
      console.error('No email found for user:', user.id);
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }

    // Get Dodo Payment client
    const dodoClient = getDodoPaymentClient();
    if (!dodoClient) {
      return NextResponse.json({ 
        error: 'Payment service not configured. Please contact support.' 
      }, { status: 500 });
    }

    // Get base URL for redirects
    let baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || '';
    if (!baseUrl && process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`;
    }
    if (!baseUrl) {
      const origin = request.headers.get('origin');
      if (origin) {
        baseUrl = origin;
      }
    }
    if (!baseUrl) {
      const forwardedHost = request.headers.get('x-forwarded-host');
      if (forwardedHost) {
        baseUrl = `https://${forwardedHost}`;
      }
    }
    if (!baseUrl) {
      baseUrl = 'http://localhost:3000';
    }

    // Create payment link
    const paymentResult = await dodoClient.createPaymentLink({
      amount,
      currency: 'USD',
      description: `Upgrade to ${plan === 'monthly' ? 'Monthly' : 'Pay Per Invoice'} plan`,
      customerEmail: userEmail,
      customerName: userName,
      metadata: {
        userId: user.id,
        plan,
        type: 'subscription_upgrade',
      },
      successUrl: `${baseUrl}/dashboard/profile?payment=success&session_id={PAYMENT_ID}`,
      cancelUrl: `${baseUrl}/dashboard/profile?payment=cancelled`,
    });

    if (!paymentResult.success || !paymentResult.paymentLink) {
      return NextResponse.json({ 
        error: paymentResult.error || 'Failed to create payment link' 
      }, { status: 500 });
    }

    // Store payment session in database for tracking
    const { error: sessionError } = await supabaseAdmin
      .from('billing_records')
      .insert({
        user_id: user.id,
        type: 'subscription',
        amount: amount,
        currency: 'USD',
        stripe_session_id: paymentResult.paymentId, // Reusing field name for Dodo payment ID
        status: 'pending',
      });

    if (sessionError) {
      console.error('Error storing payment session:', sessionError);
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      success: true,
      paymentLink: paymentResult.paymentLink,
      paymentId: paymentResult.paymentId,
    });
  } catch (error: any) {
    console.error('Payment checkout error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}

