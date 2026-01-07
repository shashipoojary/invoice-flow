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
 * Check if user can enable a reminder
 * FREE PLAN: Max 4 auto reminders per month (global limit, not per invoice)
 */
export async function canEnableReminder(userId: string): Promise<ValidationResult> {
  const plan = await getUserPlan(userId);

  if (plan === 'monthly' || plan === 'pay_per_invoice') {
    return { allowed: true };
  }

  // Free plan: Check monthly reminder limit (global)
  const { start, end } = getCurrentMonthBoundaries();
  
  // Count reminders sent this month
  // Try reminder_history view first (if it exists)
  let used = 0;
  try {
    const { count: historyCount } = await supabaseAdmin
      .from('reminder_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('reminder_status', 'sent')
      .gte('sent_at', start)
      .lte('sent_at', end);
    if (historyCount !== null) {
      used = historyCount;
    }
  } catch (e) {
    // reminder_history view might not exist, use invoice_reminders join
    const { count } = await supabaseAdmin
      .from('invoice_reminders')
      .select('*, invoices!inner(user_id)', { count: 'exact', head: true })
      .eq('invoices.user_id', userId)
      .eq('reminder_status', 'sent')
      .gte('sent_at', start)
      .lte('sent_at', end);
    used = count || 0;
  }

  const limit = 4;

  if (used >= limit) {
    return {
      allowed: false,
      reason: 'Free plan limit reached. You can send up to 4 auto reminders per month. Please upgrade for unlimited reminders.',
      limitType: 'reminders'
    };
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
 * Check if user can customize
 * FREE PLAN: Customization disabled
 */
export function canCustomize(plan: SubscriptionPlan): ValidationResult {
  if (plan === 'free') {
    return {
      allowed: false,
      reason: 'Customization is only available on paid plans. Please upgrade to customize your invoices.',
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

  // Get reminder count for current month
  const { count: reminderCount } = await supabaseAdmin
    .from('reminder_history')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('sent_at', start)
    .lte('sent_at', end);

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
      limit: plan === 'free' ? 4 : null,
      used: reminderCount || 0
    },
    templates: {
      enabled: plan === 'free' ? 1 : 3, // Free: only template 1, Paid: all 3
      total: 3
    },
    customization: plan !== 'free'
  };
}

