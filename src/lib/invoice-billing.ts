/**
 * Invoice Billing Logic
 * Handles per-invoice charges for "Pay Per Invoice" plan users
 */

import { supabaseAdmin } from './supabase';
import { getDodoPaymentClient } from './dodo-payment';

/**
 * Charge user for invoice creation/sending (Pay Per Invoice plan)
 * This is called when a user with "pay_per_invoice" plan creates or sends an invoice
 */
export async function chargeForInvoice(
  userId: string,
  invoiceId: string,
  invoiceNumber: string
): Promise<{ success: boolean; error?: string; paymentId?: string; paymentLink?: string; automatic?: boolean }> {
  try {
    console.log(`💳 chargeForInvoice called: userId=${userId}, invoiceId=${invoiceId}, invoiceNumber=${invoiceNumber}`);
    
    // Get user's subscription plan
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('subscription_plan')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error(`❌ User not found: ${userId}`, userError);
      return { success: false, error: 'User not found' };
    }

    console.log(`📋 User subscription plan: ${user.subscription_plan}`);

    // Only charge if user is on "pay_per_invoice" plan
    if (user.subscription_plan !== 'pay_per_invoice') {
      console.log(`ℹ️ User not on pay_per_invoice plan (${user.subscription_plan}), skipping charge`);
      return { success: true }; // No charge needed for other plans
    }
    
    console.log(`✅ User is on pay_per_invoice plan, proceeding with charge...`);

    // Check if this invoice has already been charged
    const { data: existingCharge } = await supabaseAdmin
      .from('billing_records')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'per_invoice_fee')
      .eq('invoice_id', invoiceId)
      .eq('status', 'paid')
      .single();

    if (existingCharge) {
      // Already charged for this invoice
      return { success: true };
    }

    // Get Dodo Payment client
    const dodoClient = getDodoPaymentClient();
    if (!dodoClient) {
      // If payment service not configured, create a pending billing record
      await supabaseAdmin
        .from('billing_records')
        .insert({
          user_id: userId,
          invoice_id: invoiceId,
          type: 'per_invoice_fee',
          amount: 0.50,
          currency: 'USD',
          status: 'pending',
        });

      return {
        success: false,
        error: 'Payment service not configured. Invoice created but billing pending.',
      };
    }

    // Get user details including saved payment method
    let { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('name, dodo_customer_id, dodo_payment_method_id')
      .eq('id', userId)
      .single();

    // Get email from auth.users (users table doesn't have email column)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
    const userEmail = authUser?.user?.email || '';
    const userName = authUser?.user?.user_metadata?.full_name || authUser?.user?.user_metadata?.name || '';

    // If user profile doesn't exist in users table, use auth user data
    if (!userProfile || profileError) {
      console.warn(`⚠️ User profile not found in users table, using auth.users data: ${userId}`, profileError);
      
      if (authError || !authUser?.user) {
        console.error(`❌ User not found in auth.users: ${userId}`, authError);
        return {
          success: false,
          error: 'User not found',
        };
      }

      // Create profile object from auth user data
      userProfile = {
        name: userName,
        dodo_customer_id: null,
        dodo_payment_method_id: null,
      };

      console.log(`✅ Using auth user data:`, {
        email: userEmail,
        name: userName,
      });
    }

    // Add email to userProfile (for use in payment calls)
    const userProfileWithEmail = {
      ...userProfile,
      email: userEmail,
      name: userProfile.name || userName,
    };

    console.log(`👤 User profile:`, {
      email: userProfileWithEmail.email,
      name: userProfileWithEmail.name,
      hasCustomerId: !!userProfileWithEmail.dodo_customer_id,
      customerId: userProfileWithEmail.dodo_customer_id || 'NOT SET',
      hasPaymentMethod: !!userProfileWithEmail.dodo_payment_method_id,
    });

    // Check if user has saved payment method (Option 1: Automatic charging)
    if (userProfileWithEmail.dodo_customer_id) {
      console.log(`✅ Customer ID found: ${userProfileWithEmail.dodo_customer_id} - Using automatic charging`);
      // User has saved payment method - charge directly using customer ID
      console.log(`💳 Attempting automatic charge for customer: ${userProfile.dodo_customer_id}`);
      
      // Try to charge customer directly (automatic, no user interaction)
      const paymentResult = await dodoClient.chargeCustomer({
        customerId: userProfile.dodo_customer_id,
        amount: 0.50,
        currency: 'USD',
        description: `Invoice fee for ${invoiceNumber}`,
        metadata: {
          userId,
          invoiceId,
          invoiceNumber,
          type: 'per_invoice_fee',
        },
      });

      if (!paymentResult.success || !paymentResult.paymentId) {
        // Create pending billing record
        await supabaseAdmin
          .from('billing_records')
          .insert({
            user_id: userId,
            invoice_id: invoiceId,
            type: 'per_invoice_fee',
            amount: 0.50,
            currency: 'USD',
            status: 'pending',
          });

        return {
          success: false,
          error: paymentResult.error || 'Failed to process automatic charge. Invoice sent but billing pending.',
        };
      }

      // Create billing record
      await supabaseAdmin
        .from('billing_records')
        .insert({
          user_id: userId,
          invoice_id: invoiceId,
          type: 'per_invoice_fee',
          amount: 0.50,
          currency: 'USD',
          stripe_session_id: paymentResult.paymentId,
          status: 'pending', // Will be updated to 'paid' by webhook
        });

      // Note: Payment will be processed automatically by Dodo Payment
      // Webhook will confirm payment and update billing record status
      
      return {
        success: true,
        paymentId: paymentResult.paymentId,
        automatic: true, // Indicates automatic charge
      };
    } else {
      // No saved payment method - create payment link (user needs to pay manually)
      // This is fallback for users who haven't set up payment method yet
      console.log(`⚠️ No customer ID found - User needs to set up payment method first`);
      console.log(`💡 To enable automatic charging, user must:`);
      console.log(`   1. Select "Pay Per Invoice" plan`);
      console.log(`   2. Complete the $0.01 payment setup`);
      console.log(`   3. This saves their payment method for future automatic charges`);
      
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://invoice-flow-vert.vercel.app';

      const paymentResult = await dodoClient.createPaymentLink({
        amount: 0.50,
        currency: 'USD',
        description: `Invoice fee for ${invoiceNumber}`,
        customerEmail: userProfileWithEmail.email || '',
        customerName: userProfileWithEmail.name || 'User',
        metadata: {
          userId,
          invoiceId,
          invoiceNumber,
          type: 'per_invoice_fee',
        },
        successUrl: `${baseUrl}/dashboard/invoices?payment=success&invoice_id=${invoiceId}`,
        cancelUrl: `${baseUrl}/dashboard/invoices?payment=cancelled`,
      });

      if (!paymentResult.success || !paymentResult.paymentId) {
        await supabaseAdmin
          .from('billing_records')
          .insert({
            user_id: userId,
            invoice_id: invoiceId,
            type: 'per_invoice_fee',
            amount: 0.50,
            currency: 'USD',
            status: 'pending',
          });

        return {
          success: false,
          error: paymentResult.error || 'Failed to create payment link. Invoice sent but billing pending.',
        };
      }

      // Create billing record
      await supabaseAdmin
        .from('billing_records')
        .insert({
          user_id: userId,
          invoice_id: invoiceId,
          type: 'per_invoice_fee',
          amount: 0.50,
          currency: 'USD',
          stripe_session_id: paymentResult.paymentId,
          status: 'pending',
        });

      return {
        success: true,
        paymentId: paymentResult.paymentId,
        paymentLink: paymentResult.paymentLink, // User needs to pay via this link
        automatic: false, // Manual payment required
      };
    }
  } catch (error: any) {
    console.error('Error charging for invoice:', error);
    return {
      success: false,
      error: error.message || 'Failed to process invoice charge',
    };
  }
}

