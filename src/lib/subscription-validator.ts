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
 * Check if Pay Per Invoice user has free invoices remaining
 * Returns: { hasFreeInvoices: boolean, freeInvoicesRemaining: number }
 */
export async function getPayPerInvoiceFreeStatus(userId: string): Promise<{ hasFreeInvoices: boolean; freeInvoicesRemaining: number }> {
  const plan = await getUserPlan(userId);
  
  if (plan !== 'pay_per_invoice') {
    return { hasFreeInvoices: false, freeInvoicesRemaining: 0 };
  }
  
  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('pay_per_invoice_activated_at')
    .eq('id', userId)
    .single();
  
  if (!userData?.pay_per_invoice_activated_at) {
    return { hasFreeInvoices: true, freeInvoicesRemaining: 5 };
  }
  
  const { count } = await supabaseAdmin
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', userData.pay_per_invoice_activated_at)
    .neq('status', 'draft');
  
  const used = count || 0;
  const freeInvoicesRemaining = Math.max(0, 5 - used);
  
  return {
    hasFreeInvoices: freeInvoicesRemaining > 0,
    freeInvoicesRemaining
  };
}

/**
 * Count free plan invoices for a user (shared logic for canCreateInvoice and getUsageStats)
 * This ensures both functions use the exact same counting logic
 */
async function countFreePlanInvoices(userId: string): Promise<number> {
  const { start, end } = getCurrentMonthBoundaries();
  
  // First, get all invoices in current month (non-draft only)
  const { data: monthlyInvoices } = await supabaseAdmin
    .from('invoices')
    .select('id, created_at')
    .eq('user_id', userId)
    .gte('created_at', start)
    .lte('created_at', end)
    .neq('status', 'draft');
  
  if (!monthlyInvoices || monthlyInvoices.length === 0) {
    return 0;
  }
  
  const invoiceIds = monthlyInvoices.map(inv => inv.id);
  
  // Get all billing records for these invoices (charged invoices = pay_per_invoice invoices)
  const { data: billingRecords } = await supabaseAdmin
    .from('billing_records')
    .select('invoice_id')
    .eq('user_id', userId)
    .eq('type', 'per_invoice_fee')
    .in('invoice_id', invoiceIds);
  
  const chargedInvoiceIds = new Set((billingRecords || []).map(br => br.invoice_id));
  
  // Also check pay_per_invoice_activated_at - if it exists and invoice was created after it, exclude it
  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('pay_per_invoice_activated_at')
    .eq('id', userId)
    .single();
  
  // Count only invoices that:
  // 1. Don't have billing records (not charged = free plan invoices)
  // 2. Were created before pay_per_invoice_activated_at (if it exists)
  return monthlyInvoices.filter(inv => {
    // Exclude if has billing record (was charged = pay_per_invoice invoice)
    if (chargedInvoiceIds.has(inv.id)) {
      return false;
    }
    
    // Exclude if created after pay_per_invoice activation (if activation date exists)
    if (userData?.pay_per_invoice_activated_at) {
      const invoiceDate = new Date(inv.created_at);
      const activationDate = new Date(userData.pay_per_invoice_activated_at);
      if (invoiceDate >= activationDate) {
        return false; // Invoice was created during/after pay_per_invoice period
      }
    }
    
    return true; // This is a free plan invoice
  }).length;
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

  // Free plan: Check monthly invoice limit using shared counting logic
  const used = await countFreePlanInvoices(userId);
  const limit = 5;

  // Allow if used is less than limit (e.g., used=4, limit=5 means 1 remaining)
  // Block only when used equals or exceeds limit (e.g., used=5, limit=5 means 0 remaining)
  if (used >= limit) {
    return {
      allowed: false,
      reason: 'Free plan limit reached. You can create up to 5 invoices per month. Please upgrade to create more invoices.',
      limitType: 'invoices'
    };
  }

  // used < limit, so there's remaining capacity - allow creation
  return { allowed: true };
}

/**
 * Check if user can create a client
 * FREE PLAN & PAY_PER_INVOICE: Max 1 client
 * MONTHLY PLAN: Unlimited clients
 */
export async function canCreateClient(userId: string): Promise<ValidationResult> {
  const plan = await getUserPlan(userId);

  // Only monthly plan has unlimited clients
  // pay_per_invoice has same limits as free plan (1 client)
  if (plan === 'monthly') {
    return { allowed: true };
  }

  // Free plan and pay_per_invoice: Check client limit (1 client)
  const { count } = await supabaseAdmin
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  const used = count || 0;
  const limit = 1;

  if (used >= limit) {
    return {
      allowed: false,
      reason: plan === 'pay_per_invoice' 
        ? 'Pay Per Invoice plan limit reached. You can create up to 1 client. Please upgrade to Monthly plan to create unlimited clients.'
        : 'Free plan limit reached. You can create up to 1 client. Please upgrade to create more clients.',
      limitType: 'clients'
    };
  }

  return { allowed: true };
}

/**
 * Check if user can create an estimate
 * FREE PLAN & PAY_PER_INVOICE: Max 1 estimate
 * MONTHLY PLAN: Unlimited estimates
 */
export async function canCreateEstimate(userId: string): Promise<ValidationResult> {
  const plan = await getUserPlan(userId);

  // Only monthly plan has unlimited estimates
  // pay_per_invoice has same limits as free plan (1 estimate)
  if (plan === 'monthly') {
    return { allowed: true };
  }

  // Free plan and pay_per_invoice: Check estimate limit (1 estimate)
  const { count } = await supabaseAdmin
    .from('estimates')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  const used = count || 0;
  const limit = 1;

  if (used >= limit) {
    return {
      allowed: false,
      reason: plan === 'pay_per_invoice'
        ? 'Pay Per Invoice plan limit reached. You can create up to 1 estimate. Please upgrade to Monthly plan to create unlimited estimates.'
        : 'Free plan limit reached. You can create up to 1 estimate. Please upgrade to create more estimates.',
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
    // For free plan: Use shared counting function to ensure consistency with canCreateInvoice
    invoiceCount = await countFreePlanInvoices(userId);
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
      // Free and pay_per_invoice: 1 client limit, Monthly: unlimited (null)
      limit: (plan === 'free' || plan === 'pay_per_invoice') ? 1 : null,
      used: clientCount || 0
    },
    estimates: {
      // Free and pay_per_invoice: 1 estimate limit, Monthly: unlimited (null)
      limit: (plan === 'free' || plan === 'pay_per_invoice') ? 1 : null,
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

