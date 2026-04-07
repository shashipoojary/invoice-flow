import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentMonthBoundaries, getUsageStats } from '@/lib/subscription-validator';
import { computeIncludedPoolUsed } from '@/lib/pay-per-invoice-display';

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

    // Get user subscription plan
    const { data: profile } = await supabase
      .from('users')
      .select('subscription_plan')
      .eq('id', user.id)
      .single();

    // Get comprehensive usage stats
    const usageStats = await getUsageStats(user.id);
    const plan = profile?.subscription_plan || 'free';

    // Free plan: show pay-per premium charges this month separately (e.g. user paid $0.50 for a template while on free tier)
    let freePlanPremiumCharges: { count: number; totalCharged: string } | null = null;
    if (plan === 'free') {
      const { start, end } = getCurrentMonthBoundaries();
      const { data: monthBilling } = await supabase
        .from('billing_records')
        .select('invoice_id, amount')
        .eq('user_id', user.id)
        .eq('type', 'per_invoice_fee')
        .gte('created_at', start)
        .lte('created_at', end);
      if (monthBilling && monthBilling.length > 0) {
        const byInvoice = new Map<string, number>();
        for (const row of monthBilling) {
          const id = row.invoice_id as string;
          const amt = parseFloat(String(row.amount));
          byInvoice.set(id, (byInvoice.get(id) || 0) + amt);
        }
        const total = Array.from(byInvoice.values()).reduce((a, b) => a + b, 0);
        freePlanPremiumCharges = {
          count: byInvoice.size,
          totalCharged: total.toFixed(2),
        };
      }
    }

    // For Pay Per Invoice: included 5 sends vs premium charges (source of truth: billing_records)
    let payPerInvoiceInfo = null;
    if (plan === 'pay_per_invoice') {
      const { data: userData } = await supabase
        .from('users')
        .select('pay_per_invoice_activated_at')
        .eq('id', user.id)
        .single();

      if (!userData?.pay_per_invoice_activated_at) {
        payPerInvoiceInfo = {
          totalInvoices: 0,
          freeInvoicesUsed: 0,
          freeInvoicesRemaining: 5,
          chargedInvoices: 0,
          totalCharged: '0.00',
        };
      } else {
        const { data: allInvoices } = await supabase
          .from('invoices')
          .select('id')
          .eq('user_id', user.id)
          .gte('created_at', userData.pay_per_invoice_activated_at)
          .neq('status', 'draft');

        if (!allInvoices || allInvoices.length === 0) {
          payPerInvoiceInfo = {
            totalInvoices: 0,
            freeInvoicesUsed: 0,
            freeInvoicesRemaining: 5,
            chargedInvoices: 0,
            totalCharged: '0.00',
          };
        } else {
          const invoiceIds = allInvoices.map((inv) => inv.id);

          const { data: billingRecords } = await supabase
            .from('billing_records')
            .select('invoice_id, amount, status')
            .eq('user_id', user.id)
            .eq('type', 'per_invoice_fee')
            .in('status', ['pending', 'paid'])
            .in('invoice_id', invoiceIds);

          const chargedInvoiceIds = new Set((billingRecords || []).map((br) => br.invoice_id));
          const chargedInvoices = chargedInvoiceIds.size;
          const totalCharged = (billingRecords || []).reduce(
            (sum, record) => sum + parseFloat(record.amount.toString()),
            0
          );

          const { data: allInvoicesWithDetails } = await supabase
            .from('invoices')
            .select('id, type, theme, reminder_count, reminder_settings, created_at')
            .eq('user_id', user.id)
            .gte('created_at', userData.pay_per_invoice_activated_at)
            .neq('status', 'draft')
            .order('created_at', { ascending: true });

          const { includedUsed, includedRemaining } = computeIncludedPoolUsed(
            allInvoicesWithDetails || [],
            chargedInvoiceIds
          );

          payPerInvoiceInfo = {
            totalInvoices: allInvoices.length,
            freeInvoicesUsed: includedUsed,
            freeInvoicesRemaining: includedRemaining,
            chargedInvoices,
            totalCharged: totalCharged.toFixed(2),
          };
        }
      }
    }

    const response = NextResponse.json({
      plan,
      // Invoice usage
      limit: usageStats.invoices.limit,
      used: usageStats.invoices.used,
      remaining: usageStats.invoices.limit ? Math.max(0, usageStats.invoices.limit - usageStats.invoices.used) : null,
      canCreateInvoice: plan === 'free' ? (usageStats.invoices.limit !== null && usageStats.invoices.used < usageStats.invoices.limit) : true,
      freePlanPremiumCharges,
      // Pay Per Invoice specific info
      payPerInvoice: payPerInvoiceInfo ? {
        ...payPerInvoiceInfo,
        freeInvoicesRemaining: payPerInvoiceInfo.freeInvoicesRemaining,
      } : null,
      // Additional usage stats
      clients: {
        limit: usageStats.clients.limit,
        used: usageStats.clients.used,
        remaining: usageStats.clients.limit ? Math.max(0, usageStats.clients.limit - usageStats.clients.used) : null
      },
      estimates: {
        limit: usageStats.estimates.limit,
        used: usageStats.estimates.used,
        remaining: usageStats.estimates.limit ? Math.max(0, usageStats.estimates.limit - usageStats.estimates.used) : null
      },
      reminders: {
        limit: usageStats.reminders.limit,
        used: usageStats.reminders.used,
        remaining: usageStats.reminders.limit ? Math.max(0, usageStats.reminders.limit - usageStats.reminders.used) : null
      },
      templates: usageStats.templates,
      customization: usageStats.customization
    });
    
    // Don't cache subscription usage - it changes frequently
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('Subscription usage API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

