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

    // Pay Per Invoice plan: Collect payment method for automatic charging (Option 1)
    // We charge $0.06 (minimum ₹5 required by Dodo Payments) to collect and save payment method
    if (plan === 'pay_per_invoice') {
      // Check if user already has a saved payment method
      const { data: userProfile } = await supabaseAdmin
        .from('users')
        .select('dodo_customer_id, dodo_payment_method_id')
        .eq('id', user.id)
        .single();

      // If payment method already saved, activate plan immediately
      if (userProfile?.dodo_customer_id && userProfile?.dodo_payment_method_id) {
        // Prepare update data
        const updateData: any = {
          subscription_plan: 'pay_per_invoice',
          subscription_status: 'active',
          next_billing_date: null,
          updated_at: new Date().toISOString()
        };

        // Set activation date for tracking free invoices (first time only)
        const { data: existingUser } = await supabaseAdmin
          .from('users')
          .select('pay_per_invoice_activated_at')
          .eq('id', user.id)
          .single();
        
        if (!existingUser?.pay_per_invoice_activated_at) {
          updateData.pay_per_invoice_activated_at = new Date().toISOString();
        }

        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update(updateData)
          .eq('id', user.id);

        if (updateError) {
          console.error('Error updating subscription:', updateError);
          return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          plan: 'pay_per_invoice',
          message: 'Pay Per Invoice plan activated. You will be charged $0.50 per invoice automatically.',
          requiresPayment: false
        });
      }

      // No payment method saved - create checkout to collect it
      // Charge minimum required amount to collect payment method (Dodo Payments requires minimum ₹5 ≈ $0.06)
      // This will be credited toward first invoice
      const setupAmount = 0.06; // Minimum $0.06 (₹5) required by Dodo Payments
      
      const dodoClient = getDodoPaymentClient();
      if (!dodoClient) {
        return NextResponse.json({ 
          error: 'Payment service not configured. Please contact support.' 
        }, { status: 500 });
      }

      // Get user details
      const { data: profile } = await supabaseAdmin
        .from('users')
        .select('email, name')
        .eq('id', user.id)
        .single();

      const userEmail = profile?.email || user.email || '';
      const userName = profile?.name || user.user_metadata?.full_name || 'User';

      if (!userEmail) {
        return NextResponse.json({ error: 'User email not found' }, { status: 400 });
      }

      // Determine base URL
      let baseUrl = request.headers.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
      baseUrl += `://${request.headers.get('x-forwarded-host')}`;
      if (!baseUrl || baseUrl.includes('localhost')) {
        baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      }

      // Create checkout session to collect payment method
      // Use separate product ID for Pay Per Invoice setup if available
      // Otherwise, createPaymentLink will create a product dynamically
      const payPerInvoiceSetupProductId = process.env.DODO_PAYMENT_PAY_PER_INVOICE_SETUP_PRODUCT_ID;
      
      const paymentResult = await dodoClient.createPaymentLink({
        amount: setupAmount,
        currency: 'USD',
        description: 'Pay Per Invoice Setup - Payment Method Collection ($0.06 will be credited toward your first invoice)',
        customerEmail: userEmail,
        customerName: userName,
        metadata: {
          userId: user.id,
          plan: 'pay_per_invoice',
          type: 'payment_method_setup', // Different from subscription_upgrade
        },
        successUrl: `${baseUrl}/dashboard/profile?payment=success&setup=pay_per_invoice&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${baseUrl}/dashboard/profile?payment=cancelled`,
        failureUrl: `${baseUrl}/dashboard/profile?payment=failed&setup=pay_per_invoice&error=Payment failed. Please try again.`,
        productId: payPerInvoiceSetupProductId, // Use separate product for Pay Per Invoice setup
      });

      if (!paymentResult.success || !paymentResult.paymentLink) {
        return NextResponse.json({
          error: paymentResult.error || 'Failed to create payment setup session'
        }, { status: 500 });
      }

      // Store setup session in billing_records
      await supabaseAdmin
        .from('billing_records')
        .insert({
          user_id: user.id,
          type: 'subscription',
          amount: setupAmount,
          currency: 'USD',
          stripe_session_id: paymentResult.paymentId,
          status: 'pending',
        });

      return NextResponse.json({
        success: true,
        paymentLink: paymentResult.paymentLink,
        paymentId: paymentResult.paymentId,
        requiresPayment: true,
        message: 'Please complete payment method setup to activate Pay Per Invoice plan. The $0.06 charge will be credited toward your first invoice.'
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
    // Note: Dodo Payment may redirect to return_url (successUrl) even on failure with status parameter
    // So we'll handle both success and failure in the same URL and check the status
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
      // Use return_url that handles both success and failure via status parameter
      successUrl: `${baseUrl}/dashboard/profile?payment=success&session_id={PAYMENT_ID}&plan=${plan}&status={STATUS}`,
      cancelUrl: `${baseUrl}/dashboard/profile?payment=cancelled&plan=${plan}`,
      // Also set failure_url in case Dodo Payment supports it
      failureUrl: `${baseUrl}/dashboard/profile?payment=failed&plan=${plan}&error=Payment failed. Please try again.&status=failed`,
    });

    if (!paymentResult.success || !paymentResult.paymentLink) {
      return NextResponse.json({ 
        error: paymentResult.error || 'Failed to create payment link' 
      }, { status: 500 });
    }

    // Store payment session in database for tracking
    // Note: billing_records table doesn't have metadata column, so we store plan info in a separate way
    const { error: sessionError } = await supabaseAdmin
      .from('billing_records')
      .insert({
        user_id: user.id,
        type: 'subscription',
        amount: amount,
        currency: 'USD',
        stripe_session_id: paymentResult.paymentId, // Store session ID for lookup
        status: 'pending',
        // Store plan info in stripe_session_id format: "session_id|plan" for lookup
        // Or we can query by user_id and amount to find the plan
      });

    if (sessionError) {
      console.error('Error storing payment session:', sessionError);
      // Don't fail the request, just log the error
    } else {
      console.log('✅ Payment session stored:', {
        sessionId: paymentResult.paymentId,
        userId: user.id,
        plan,
      });
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

