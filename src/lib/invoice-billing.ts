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
  invoiceNumber: string,
  invoiceData?: { template?: number; reminderCount?: number; primaryColor?: string; secondaryColor?: string; invoiceType?: 'fast' | 'detailed' }
): Promise<{ success: boolean; error?: string; paymentId?: string; paymentLink?: string; automatic?: boolean }> {
  try {
    console.log(`💳 chargeForInvoice called: userId=${userId}, invoiceId=${invoiceId}, invoiceNumber=${invoiceNumber}, type=${invoiceData?.invoiceType || 'detailed'}`);
    
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

    // FOR FAST INVOICES: Always check free invoices first (skip premium feature check)
    if (invoiceData?.invoiceType === 'fast') {
      console.log(`⚡ Fast invoice detected - checking free invoices first`);
      
      const { data: userWithActivation } = await supabaseAdmin
        .from('users')
        .select('pay_per_invoice_activated_at')
        .eq('id', userId)
        .single();

      if (userWithActivation?.pay_per_invoice_activated_at) {
        // Count only FAST invoices created after switching to Pay Per Invoice
        const { count: fastInvoiceCount } = await supabaseAdmin
          .from('invoices')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('type', 'fast') // Only count fast invoices
          .gte('created_at', userWithActivation.pay_per_invoice_activated_at)
          .neq('status', 'draft'); // Only count non-draft invoices

        const freeInvoiceLimit = 5;
        
        if ((fastInvoiceCount || 0) < freeInvoiceLimit) {
          console.log(`🎁 Free fast invoice! User has ${fastInvoiceCount || 0}/${freeInvoiceLimit} free fast invoices. This invoice is free.`);
          // This is one of the first 5 fast invoices - no charge
          return { success: true }; // Success but no charge
        }
        
        console.log(`💰 User has used ${fastInvoiceCount || 0} free fast invoices. Charging for this fast invoice.`);
      } else {
        // If activation date not set, set it to now and give first 5 free
        console.log(`⚠️ Pay Per Invoice activation date not set. Setting it now and giving first 5 fast invoices free.`);
        await supabaseAdmin
          .from('users')
          .update({ pay_per_invoice_activated_at: new Date().toISOString() })
          .eq('id', userId);
        
        // This is the first fast invoice - free
        return { success: true }; // Success but no charge
      }
    } else {
      // FOR DETAILED INVOICES: Check template first
      // Get template from invoiceData or fetch from database
      let invoiceTemplate = invoiceData?.template;
      if (!invoiceTemplate) {
        const { data: invoice } = await supabaseAdmin
          .from('invoices')
          .select('theme')
          .eq('id', invoiceId)
          .single();
        
        if (invoice?.theme) {
          const theme = typeof invoice.theme === 'string' ? JSON.parse(invoice.theme) : invoice.theme;
          invoiceTemplate = theme.template || 1;
        } else {
          invoiceTemplate = 1; // Default to template 1
        }
      }
      
      // TEMPLATE 1 DETAILED INVOICES: Check free limit first (same as fast invoices)
      // They count against the 5 free limit, but are free if within limit
      if (invoiceTemplate === 1) {
        console.log(`📄 Template 1 detailed invoice detected - checking free invoice limit first`);
        
        const { data: userWithActivation } = await supabaseAdmin
          .from('users')
          .select('pay_per_invoice_activated_at')
          .eq('id', userId)
          .single();

        if (userWithActivation?.pay_per_invoice_activated_at) {
          // Count all invoices that use the free limit: fast + template 1 detailed
          // Get all non-draft invoices created after activation
          const { data: allInvoices } = await supabaseAdmin
            .from('invoices')
            .select('id, type, theme')
            .eq('user_id', userId)
            .gte('created_at', userWithActivation.pay_per_invoice_activated_at)
            .neq('status', 'draft');
          
          let freeInvoiceCount = 0;
          if (allInvoices) {
            for (const inv of allInvoices) {
              // Skip if this is the current invoice (don't count it yet)
              if (inv.id === invoiceId) {
                continue;
              }
              
              // Count fast invoices
              if (inv.type === 'fast') {
                freeInvoiceCount++;
              } else if (inv.type === 'detailed') {
                // Count template 1 detailed invoices
                let template = 1;
                if (inv.theme) {
                  const theme = typeof inv.theme === 'string' ? JSON.parse(inv.theme) : inv.theme;
                  template = theme.template || 1;
                }
                if (template === 1) {
                  freeInvoiceCount++;
                }
                // Other detailed invoices (template 2/3) charge immediately, don't count
              }
            }
          }
          
          const freeInvoiceLimit = 5;
          
          if (freeInvoiceCount < freeInvoiceLimit) {
            console.log(`🎁 Free template 1 invoice! User has ${freeInvoiceCount}/${freeInvoiceLimit} free invoices used. This invoice is free.`);
            // Within free limit - no charge
            return { success: true }; // Success but no charge
          }
          
          console.log(`💰 User has used ${freeInvoiceCount}/${freeInvoiceLimit} free invoices. Template 1 detailed invoice limit exhausted. Charging $0.50.`);
          // Free limit exhausted - proceed to charge
        } else {
          // If activation date not set, set it to now and give first 5 free
          console.log(`⚠️ Pay Per Invoice activation date not set. Setting it now and giving first 5 invoices free.`);
          await supabaseAdmin
            .from('users')
            .update({ pay_per_invoice_activated_at: new Date().toISOString() })
            .eq('id', userId);
          
          // This is the first invoice - free
          return { success: true }; // Success but no charge
        }
      }
      
      // FOR OTHER TEMPLATES: Keep existing logic (premium features = charge immediately)
      // Check if invoice uses premium features (template 2/3 OR more than 4 reminders OR premium colors)
      const usesPremiumTemplate = invoiceTemplate !== 1;
      const usesPremiumReminders = invoiceData?.reminderCount && invoiceData.reminderCount > 4;
      
      // Check for premium colors (beyond first 4 presets)
      const colorPresets = [
        { name: 'Purple', primary: '#5C2D91', secondary: '#8B5CF6' },
        { name: 'Blue', primary: '#1E40AF', secondary: '#3B82F6' },
        { name: 'Green', primary: '#059669', secondary: '#10B981' },
        { name: 'Red', primary: '#DC2626', secondary: '#EF4444' },
        { name: 'Orange', primary: '#EA580C', secondary: '#F97316' },
        { name: 'Pink', primary: '#DB2777', secondary: '#EC4899' },
        { name: 'Indigo', primary: '#4338CA', secondary: '#6366F1' },
        { name: 'Teal', primary: '#0D9488', secondary: '#14B8A6' },
        { name: 'Black', primary: '#1F2937', secondary: '#374151' },
        { name: 'Dark Gray', primary: '#374151', secondary: '#6B7280' },
        { name: 'Navy', primary: '#1E3A8A', secondary: '#3B82F6' },
        { name: 'Emerald', primary: '#047857', secondary: '#10B981' },
        { name: 'Rose', primary: '#BE185D', secondary: '#F43F5E' },
        { name: 'Amber', primary: '#D97706', secondary: '#F59E0B' },
        { name: 'Cyan', primary: '#0891B2', secondary: '#06B6D4' },
        { name: 'Violet', primary: '#7C2D12', secondary: '#A855F7' }
      ];
      
      // Get invoice theme colors from invoiceData or fetch from database
      let primaryColor = invoiceData?.primaryColor;
      let secondaryColor = invoiceData?.secondaryColor;
      
      if (!primaryColor || !secondaryColor) {
        const { data: invoice } = await supabaseAdmin
          .from('invoices')
          .select('theme')
          .eq('id', invoiceId)
          .single();
        
        if (invoice?.theme) {
          const theme = typeof invoice.theme === 'string' ? JSON.parse(invoice.theme) : invoice.theme;
          primaryColor = theme.primary_color || theme.primaryColor;
          secondaryColor = theme.secondary_color || theme.secondaryColor;
        }
      }
      
      // Check if colors match any of the first 4 presets
      const matchesFirstFour = primaryColor && secondaryColor && colorPresets.slice(0, 4).some(preset => 
        preset.primary === primaryColor && preset.secondary === secondaryColor
      );
      
      // Check if colors match any premium preset (index 4+)
      const matchesPremiumPreset = primaryColor && secondaryColor && colorPresets.slice(4).some(preset => 
        preset.primary === primaryColor && preset.secondary === secondaryColor
      );
      
      // Also check if individual colors are from premium presets
      const usesPremiumColor = primaryColor && secondaryColor && !matchesFirstFour && (
        matchesPremiumPreset ||
        colorPresets.slice(4).some(p => p.primary === primaryColor || p.secondary === primaryColor) ||
        colorPresets.slice(4).some(p => p.primary === secondaryColor || p.secondary === secondaryColor)
      );
      
      const hasPremiumFeatures = usesPremiumTemplate || usesPremiumReminders || usesPremiumColor;
      
      if (hasPremiumFeatures) {
        // Premium features = charge immediately, skip free invoice check
        console.log(`💎 Premium features detected (template: ${invoiceData?.template}, reminders: ${invoiceData?.reminderCount}, colors: ${usesPremiumColor ? 'premium' : 'basic'}). Charging $0.50 immediately.`);
      } else {
        // Basic features = check free invoice count (for detailed invoices)
        const { data: userWithActivation } = await supabaseAdmin
          .from('users')
          .select('pay_per_invoice_activated_at')
          .eq('id', userId)
          .single();

        if (userWithActivation?.pay_per_invoice_activated_at) {
          // Count non-draft invoices created after switching to Pay Per Invoice
          const { count: freeInvoiceCount } = await supabaseAdmin
            .from('invoices')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('created_at', userWithActivation.pay_per_invoice_activated_at)
            .neq('status', 'draft'); // Only count non-draft invoices

          const freeInvoiceLimit = 5;
          
          if ((freeInvoiceCount || 0) < freeInvoiceLimit) {
            console.log(`🎁 Free invoice! User has ${freeInvoiceCount || 0}/${freeInvoiceLimit} free invoices. This invoice is free.`);
            // This is one of the first 5 invoices - no charge
            return { success: true }; // Success but no charge
          }
          
          console.log(`💰 User has used ${freeInvoiceCount || 0} free invoices. Charging for this invoice.`);
        } else {
          // If activation date not set, set it to now and give first 5 free
          console.log(`⚠️ Pay Per Invoice activation date not set. Setting it now and giving first 5 invoices free.`);
          await supabaseAdmin
            .from('users')
            .update({ pay_per_invoice_activated_at: new Date().toISOString() })
            .eq('id', userId);
          
          // This is the first invoice - free
          return { success: true }; // Success but no charge
        }
      }
    }

    // Get Dodo Payment client
    const dodoClient = getDodoPaymentClient();
    if (!dodoClient) {
      console.error(`❌ Dodo Payment client not available. Check DODO_PAYMENT_API_KEY environment variable.`);
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
        error: 'Payment service not configured. Invoice created but billing pending. Please configure DODO_PAYMENT_API_KEY.',
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
      console.log(`   2. Complete the $0.06 payment setup`);
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

