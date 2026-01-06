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
): Promise<{ success: boolean; error?: string; paymentId?: string }> {
  try {
    // Get user's subscription plan
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('subscription_plan')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return { success: false, error: 'User not found' };
    }

    // Only charge if user is on "pay_per_invoice" plan
    if (user.subscription_plan !== 'pay_per_invoice') {
      return { success: true }; // No charge needed for other plans
    }

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
      // Admin can process manually later
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

    // Get user details for payment
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('email, name')
      .eq('id', userId)
      .single();

    // Get base URL for redirects (not needed for automatic charge, but included for metadata)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://invoice-flow-vert.vercel.app';

    // Create payment link for $0.50
    const paymentResult = await dodoClient.createPaymentLink({
      amount: 0.50,
      currency: 'USD',
      description: `Invoice fee for ${invoiceNumber}`,
      customerEmail: profile?.email || '',
      customerName: profile?.name || 'User',
      metadata: {
        userId,
        invoiceId,
        invoiceNumber,
        type: 'per_invoice_fee',
      },
      successUrl: `${baseUrl}/dashboard/invoices?payment=success`,
      cancelUrl: `${baseUrl}/dashboard/invoices?payment=cancelled`,
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
        error: paymentResult.error || 'Failed to create payment. Invoice created but billing pending.',
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
        stripe_session_id: paymentResult.paymentId, // Reusing field for Dodo payment ID
        status: 'pending',
      });

    // For automatic charging, we could process payment immediately
    // But for now, we'll create a payment link and let webhook handle it
    // In production, you might want to charge immediately via API

    return {
      success: true,
      paymentId: paymentResult.paymentId,
    };
  } catch (error: any) {
    console.error('Error charging for invoice:', error);
    return {
      success: false,
      error: error.message || 'Failed to process invoice charge',
    };
  }
}

