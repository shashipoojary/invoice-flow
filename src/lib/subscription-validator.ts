/**
 * Comprehensive Subscription Plan Validator
 * 
 * This is the SOURCE OF TRUTH for all subscription plan restrictions.
 * All limits are enforced strictly - no hidden allowances.
 */

import { supabaseAdmin } from './supabase';

export type SubscriptionPlan = 'free' | 'monthly' | 'pay_per_invoice';

export interface SubscriptionLimits {
  invoices: { limit: number | null; used: number };
  clients: { limit: number | null; used: number };
  estimates: { limit: number | null; used: number };
  reminders: { limit: number | null; used: number };
  templates: { enabled: number; total: number };
  customization: boolean;
}

export interface ValidationResult {
  allowed: boolean;
  reason?: string;
  limitType?: 'invoices' | 'clients' | 'estimates' | 'reminders' | 'templates' | 'customization';
}

/**
 * Get user's subscription plan
 */
export async function getUserPlan(userId: string): Promise<SubscriptionPlan> {
  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('subscription_plan')
    .eq('id', userId)
    .single();

  return (profile?.subscription_plan as SubscriptionPlan) || 'free';
}

/**
 * Get current month boundaries
 */
function getCurrentMonthBoundaries() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return {
    start: startOfMonth.toISOString(),
    end: endOfMonth.toISOString()
  };
}

/**
 * Check if user can create an invoice
 * FREE PLAN: Max 5 invoices per month (includes fast, detailed, and estimate conversions)
 */
export async function canCreateInvoice(userId: string): Promise<ValidationResult> {
  const plan = await getUserPlan(userId);

  if (plan === 'monthly' || plan === 'pay_per_invoice') {
    return { allowed: true };
  }

  // Free plan: Check monthly invoice limit
  const { start, end } = getCurrentMonthBoundaries();
  const { count } = await supabaseAdmin
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', start)
    .lte('created_at', end);

  const used = count || 0;
  const limit = 5;

  if (used >= limit) {
    return {
      allowed: false,
      reason: 'Free plan limit reached. You can create up to 5 invoices per month. Please upgrade to create more invoices.',
      limitType: 'invoices'
    };
  }

  return { allowed: true };
}

/**
 * Check if user can create a client
 * FREE PLAN: Max 1 client
 */
export async function canCreateClient(userId: string): Promise<ValidationResult> {
  const plan = await getUserPlan(userId);

  if (plan === 'monthly' || plan === 'pay_per_invoice') {
    return { allowed: true };
  }

  // Free plan: Check client limit
  const { count } = await supabaseAdmin
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  const used = count || 0;
  const limit = 1;

  if (used >= limit) {
    return {
      allowed: false,
      reason: 'Free plan limit reached. You can create up to 1 client. Please upgrade to create more clients.',
      limitType: 'clients'
    };
  }

  return { allowed: true };
}

/**
 * Check if user can create an estimate
 * FREE PLAN: Max 1 estimate
 */
export async function canCreateEstimate(userId: string): Promise<ValidationResult> {
  const plan = await getUserPlan(userId);

  if (plan === 'monthly' || plan === 'pay_per_invoice') {
    return { allowed: true };
  }

  // Free plan: Check estimate limit
  const { count } = await supabaseAdmin
    .from('estimates')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  const used = count || 0;
  const limit = 1;

  if (used >= limit) {
    return {
      allowed: false,
      reason: 'Free plan limit reached. You can create up to 1 estimate. Please upgrade to create more estimates.',
      limitType: 'estimates'
    };
  }

  return { allowed: true };
}

/**
 * Check if user can enable a reminder for a specific invoice
 * FREE PLAN: Max 4 reminders per invoice (smart reminders = 4)
 * Can use this for up to 5 invoices (5 × 4 = 20 total reminders)
 */
export async function canEnableReminder(userId: string, invoiceId?: string): Promise<ValidationResult> {
  const plan = await getUserPlan(userId);

  if (plan === 'monthly' || plan === 'pay_per_invoice') {
    return { allowed: true };
  }

  // Free plan: Check if invoice already has 4 reminders
  // If invoiceId is provided, check that specific invoice
  // If not provided, this is a general check (for UI purposes)
  if (invoiceId) {
    const { count, error } = await supabaseAdmin
      .from('invoice_reminders')
      .select('*', { count: 'exact', head: true })
      .eq('invoice_id', invoiceId)
      .eq('reminder_status', 'sent');
    
    if (error) {
      console.error('Error counting reminders for invoice:', error);
      return { allowed: true }; // Allow on error
    }
    
    const limit = 4; // 4 reminders per invoice for free plan
    if ((count || 0) >= limit) {
      return {
        allowed: false,
        reason: 'Free plan limit reached. You can send up to 4 reminders per invoice. Please upgrade for unlimited reminders.',
        limitType: 'reminders'
      };
    }
  }

  return { allowed: true };
}

/**
 * Check if user can use a template
 * FREE PLAN: Only template 1 enabled, all others locked
 */
export async function canUseTemplate(userId: string, templateId: number): Promise<ValidationResult> {
  const plan = await getUserPlan(userId);

  // Free plan: Only template 1 is allowed
  if (plan === 'free' && templateId !== 1) {
    return {
      allowed: false,
      reason: 'Free plan users can only use template 1. Please upgrade to access all templates.',
      limitType: 'templates'
    };
  }

  return { allowed: true };
}

/**
 * Check if user can use a specific color preset
 * FREE PLAN: Only first 4 color presets allowed
 * PAID PLANS: All color presets allowed
 */
export function canUseColorPreset(plan: SubscriptionPlan, presetIndex: number): ValidationResult {
  if (plan === 'free' && presetIndex >= 4) {
    return {
      allowed: false,
      reason: 'Free plan users can only use the first 4 color presets. Please upgrade to access all color options.',
      limitType: 'customization'
    };
  }
  return { allowed: true };
}

/**
 * Get comprehensive usage stats for a user
 */
export async function getUsageStats(userId: string): Promise<SubscriptionLimits> {
  const plan = await getUserPlan(userId);
  const { start, end } = getCurrentMonthBoundaries();

  // For Pay Per Invoice: Count invoices created after activation (not just current month)
  let invoiceCount = 0;
  if (plan === 'pay_per_invoice') {
    // Get activation date
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('pay_per_invoice_activated_at')
      .eq('id', userId)
      .single();
    
    if (userData?.pay_per_invoice_activated_at) {
      // Count non-draft invoices created after activation
      const { count } = await supabaseAdmin
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', userData.pay_per_invoice_activated_at)
        .neq('status', 'draft'); // Only count non-draft invoices
      invoiceCount = count || 0;
    } else {
      // If no activation date, count all non-draft invoices (fallback)
      const { count } = await supabaseAdmin
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .neq('status', 'draft');
      invoiceCount = count || 0;
    }
  } else {
    // For free plan: Count invoices for current month
    const { count } = await supabaseAdmin
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', start)
      .lte('created_at', end);
    invoiceCount = count || 0;
  }

  // Get total client count
  const { count: clientCount } = await supabaseAdmin
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  // Get total estimate count
  const { count: estimateCount } = await supabaseAdmin
    .from('estimates')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  // Get reminder count: For free plan, count total reminders sent (4 per invoice, up to 5 invoices = 20 total)
  let reminderCount = 0;
  if (plan === 'free') {
    // Get all invoice IDs for this user
    const { data: userInvoices } = await supabaseAdmin
      .from('invoices')
      .select('id')
      .eq('user_id', userId);
    
    if (userInvoices && userInvoices.length > 0) {
      const invoiceIds = userInvoices.map(inv => inv.id);
      
      // Count total reminders sent for all invoices
      const { count, error } = await supabaseAdmin
        .from('invoice_reminders')
        .select('*', { count: 'exact', head: true })
        .in('invoice_id', invoiceIds)
        .eq('reminder_status', 'sent');
      
      if (!error && count !== null) {
        reminderCount = count;
      }
    }
  }

  return {
    invoices: {
      limit: plan === 'free' ? 5 : null,
      used: invoiceCount || 0
    },
    clients: {
      limit: plan === 'free' ? 1 : null,
      used: clientCount || 0
    },
    estimates: {
      limit: plan === 'free' ? 1 : null,
      used: estimateCount || 0
    },
    reminders: {
      limit: plan === 'free' ? 20 : null, // 4 reminders per invoice × 5 invoices = 20 total for free plan
      used: reminderCount || 0
    },
    templates: {
      enabled: plan === 'free' ? 1 : 3, // Free: only template 1, Paid: all 3
      total: 3
    },
    customization: plan !== 'free'
  };
}

