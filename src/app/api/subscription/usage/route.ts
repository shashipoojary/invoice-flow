import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUsageStats } from '@/lib/subscription-validator';

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

    // For Pay Per Invoice: Calculate free vs charged invoices based on actual billing records
    let payPerInvoiceInfo = null;
    if (plan === 'pay_per_invoice') {
      // Get activation date to count invoices correctly
      const { data: userData } = await supabase
        .from('users')
        .select('pay_per_invoice_activated_at')
        .eq('id', user.id)
        .single();
      
      // Get all non-draft invoices created after activation
      const { data: allInvoices } = await supabase
        .from('invoices')
        .select('id')
        .eq('user_id', user.id)
        .neq('status', 'draft');
      
      // Filter by activation date if set
      let invoicesToCount = allInvoices || [];
      if (userData?.pay_per_invoice_activated_at) {
        invoicesToCount = invoicesToCount.filter(inv => {
          // We need to check created_at, but we only have id
          // So we'll fetch the invoices with created_at
          return true; // Will filter below
        });
        
        // Re-fetch with date filter
        const { data: filteredInvoices } = await supabase
          .from('invoices')
          .select('id, created_at')
          .eq('user_id', user.id)
          .gte('created_at', userData.pay_per_invoice_activated_at)
          .neq('status', 'draft');
        
        invoicesToCount = filteredInvoices || [];
      }
      
      const totalInvoices = invoicesToCount.length;
      
      // Get all billing records (pending OR paid) for these invoices
      // If a billing record exists, it means the invoice was charged (even if payment is still pending)
      const invoiceIds = invoicesToCount.map(inv => inv.id);
      let chargedInvoices = 0;
      let totalCharged = 0;
      
      if (invoiceIds.length > 0) {
        const { data: billingRecords } = await supabase
          .from('billing_records')
          .select('invoice_id, amount, status')
          .eq('user_id', user.id)
          .eq('type', 'per_invoice_fee')
          .in('status', ['pending', 'paid']) // Count both pending and paid
          .in('invoice_id', invoiceIds);
        
        chargedInvoices = billingRecords?.length || 0;
        // Count amount for both pending and paid records (pending will become paid)
        totalCharged = (billingRecords || [])
          .reduce((sum, record) => sum + parseFloat(record.amount.toString()), 0);
      }
      
      // Free invoices = total invoices - charged invoices (but max 5 free)
      const freeInvoicesUsed = Math.min(totalInvoices - chargedInvoices, 5);
      const freeInvoicesRemaining = Math.max(0, 5 - freeInvoicesUsed);
      
      payPerInvoiceInfo = {
        totalInvoices,
        freeInvoicesUsed,
        freeInvoicesRemaining,
        chargedInvoices,
        totalCharged: totalCharged.toFixed(2)
      };
    }

    const response = NextResponse.json({
      plan,
      // Invoice usage
      limit: usageStats.invoices.limit,
      used: usageStats.invoices.used,
      remaining: usageStats.invoices.limit ? Math.max(0, usageStats.invoices.limit - usageStats.invoices.used) : null,
      canCreateInvoice: plan === 'free' ? (usageStats.invoices.limit !== null && usageStats.invoices.used < usageStats.invoices.limit) : true,
      // Pay Per Invoice specific info
      payPerInvoice: payPerInvoiceInfo ? {
        ...payPerInvoiceInfo,
        freeInvoicesRemaining: payPerInvoiceInfo.freeInvoicesRemaining
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

