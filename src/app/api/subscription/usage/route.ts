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

    // For Pay Per Invoice: Calculate free vs charged invoices
    let payPerInvoiceInfo = null;
    if (plan === 'pay_per_invoice') {
      const totalInvoices = usageStats.invoices.used;
      const freeInvoicesUsed = Math.min(totalInvoices, 5); // First 5 are free
      const chargedInvoices = Math.max(0, totalInvoices - 5); // Invoices after first 5
      const totalCharged = chargedInvoices * 0.5; // $0.50 per invoice
      
      payPerInvoiceInfo = {
        totalInvoices,
        freeInvoicesUsed,
        freeInvoicesRemaining: Math.max(0, 5 - totalInvoices),
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
      payPerInvoice: payPerInvoiceInfo,
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

