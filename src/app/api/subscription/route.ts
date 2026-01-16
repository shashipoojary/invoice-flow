import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getDodoPaymentClient } from '@/lib/dodo-payment';

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    
    // Get the user from the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user subscription data
    const { data: profile, error } = await supabase
      .from('users')
      .select('subscription_plan, subscription_status, next_billing_date, subscription_cancels_at_period_end, subscription_cancelled_at')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching subscription:', error);
      return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
    }

    // Check if subscription should be cancelled (next_billing_date has passed)
    let finalStatus = profile?.subscription_status || 'active';
    let finalPlan = profile?.subscription_plan || 'free';
    const nextBilling = profile?.next_billing_date ? new Date(profile.next_billing_date) : null;
    const now = new Date();

    // If subscription is set to cancel at period end and billing date has passed, cancel it
    if (profile?.subscription_cancels_at_period_end && nextBilling && now >= nextBilling) {
      console.log(`🛑 Subscription billing period ended, cancelling subscription for user ${user.id}`);
      
      // Update to free plan
      await supabaseAdmin
        .from('users')
        .update({
          subscription_plan: 'free',
          subscription_status: 'cancelled',
          subscription_cancels_at_period_end: false,
          next_billing_date: null,
          dodo_subscription_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      finalStatus = 'cancelled';
      finalPlan = 'free';
    }

    return NextResponse.json({
      plan: finalPlan,
      status: finalStatus,
      nextBilling: profile?.next_billing_date || null,
      cancelsAtPeriodEnd: profile?.subscription_cancels_at_period_end || false
    });
  } catch (error) {
    console.error('Subscription API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    
    // Get the user from the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { plan } = body;

    // Validate plan
    const validPlans = ['free', 'monthly', 'pay_per_invoice'];
    if (!validPlans.includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Get current user subscription data
    const { data: currentUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('subscription_plan, subscription_status, dodo_subscription_id, dodo_customer_id, pay_per_invoice_activated_at, next_billing_date')
      .eq('id', user.id)
      .single();

    if (fetchError) {
      console.error('Error fetching current subscription:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch current subscription' }, { status: 500 });
    }

    const currentPlan = currentUser?.subscription_plan || 'free';
    const isCancelling = (currentPlan === 'monthly' || currentPlan === 'pay_per_invoice') && plan === 'free';
    const currentNextBillingDate = currentUser?.next_billing_date ? new Date(currentUser.next_billing_date) : null;
    const now = new Date();

    // Handle cancellation: Cancel at end of billing period (user can use until next_billing_date)
    if (isCancelling) {
      console.log(`🛑 Scheduling subscription cancellation for user ${user.id} (from ${currentPlan} to free)`);
      
      // For monthly subscriptions: Cancel at end of period (no immediate cancellation)
      // User can use subscription until next_billing_date, then it becomes free
      if (currentPlan === 'monthly' && currentUser?.dodo_subscription_id) {
        const dodoClient = getDodoPaymentClient();
        if (dodoClient) {
          console.log(`   Scheduling cancellation at end of billing period: ${currentUser.dodo_subscription_id}`);
          // Cancel subscription in Dodo Payment (this should prevent renewal, not immediate cancellation)
          const cancelResult = await dodoClient.cancelSubscription(currentUser.dodo_subscription_id);
          if (cancelResult.success) {
            console.log(`   ✅ Subscription cancellation scheduled in Dodo Payment`);
          } else {
            console.log(`   ⚠️ Could not schedule cancellation in Dodo Payment, but continuing with local scheduling: ${cancelResult.error}`);
          }
        } else {
          console.log(`   ⚠️ Dodo Payment client not available, continuing with local cancellation scheduling`);
        }
      }

      // For Pay Per Invoice: Immediate cancellation (no recurring billing)
      // User can still use features until they switch, but no more charges
    }

    // Calculate next billing date based on plan
    let calculatedNextBillingDate = null;
    if (plan === 'monthly') {
      const nextBilling = new Date();
      nextBilling.setMonth(nextBilling.getMonth() + 1);
      calculatedNextBillingDate = nextBilling.toISOString();
    }

    // Prepare update data
    const updateData: any = {
      subscription_plan: plan,
      subscription_status: 'active', // Keep active until billing period ends
      next_billing_date: calculatedNextBillingDate,
      updated_at: new Date().toISOString()
    };

    // Handle cancellation-specific updates
    if (isCancelling) {
      if (currentPlan === 'monthly') {
        // Monthly: Cancel at end of period (user can use until next_billing_date)
        // Keep subscription active until next_billing_date, then it becomes free
        updateData.subscription_cancelled_at = new Date().toISOString();
        updateData.subscription_cancels_at_period_end = true;
        // Keep current next_billing_date (don't change it - user paid until then)
        updateData.next_billing_date = currentNextBillingDate ? currentNextBillingDate.toISOString() : null;
        // Keep dodo_subscription_id until period ends (for tracking)
        // Status remains 'active' until next_billing_date passes
      } else if (currentPlan === 'pay_per_invoice') {
        // Pay Per Invoice: Immediate cancellation (no recurring billing anyway)
        updateData.subscription_plan = 'free';
        updateData.subscription_status = 'cancelled';
        updateData.subscription_cancelled_at = new Date().toISOString();
        updateData.subscription_cancels_at_period_end = false;
        // Keep payment method for easy reactivation
      }
    } else {
      // Not cancelling - clear cancellation flags
      updateData.subscription_cancelled_at = null;
      updateData.subscription_cancels_at_period_end = false;
    }

    // If switching to Pay Per Invoice, set activation date (for tracking free invoices)
    if (plan === 'pay_per_invoice') {
      // Only set activation date if not already set (first time switching to Pay Per Invoice)
      if (!currentUser?.pay_per_invoice_activated_at) {
        updateData.pay_per_invoice_activated_at = new Date().toISOString();
      }
      // Clear cancellation timestamp if reactivating
      updateData.subscription_cancelled_at = null;
    }

    // If switching to monthly, clear cancellation timestamp
    if (plan === 'monthly') {
      updateData.subscription_cancelled_at = null;
    }

    // Update subscription
    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating subscription:', updateError);
      return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
    }

    console.log(`✅ Subscription updated: ${currentPlan} → ${plan} (status: ${updateData.subscription_status})`);

    // Get updated user data to return accurate info
    const { data: updatedUser } = await supabaseAdmin
      .from('users')
      .select('subscription_plan, subscription_status, next_billing_date, subscription_cancels_at_period_end')
      .eq('id', user.id)
      .single();

    return NextResponse.json({ 
      success: true,
      plan: updatedUser?.subscription_plan || plan,
      status: updatedUser?.subscription_status || updateData.subscription_status,
      nextBilling: updatedUser?.next_billing_date || calculatedNextBillingDate,
      cancelled: isCancelling,
      cancelsAtPeriodEnd: updatedUser?.subscription_cancels_at_period_end || false
    });
  } catch (error) {
    console.error('Subscription update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

