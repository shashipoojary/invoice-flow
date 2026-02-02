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
      
      if (!userData?.pay_per_invoice_activated_at) {
        // No activation date - user hasn't created any invoices yet on pay_per_invoice plan
        payPerInvoiceInfo = {
          totalInvoices: 0,
          freeInvoicesUsed: 0,
          freeInvoicesRemaining: 5,
          chargedInvoices: 0,
          totalCharged: '0.00',
          template1DetailedInvoices: 0
        };
      } else {
        // Get all non-draft invoices created after activation (for total count and billing records)
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
            template1DetailedInvoices: 0
          };
        } else {
          const invoiceIds = allInvoices.map(inv => inv.id);
          
          // Get all billing records (pending OR paid) for these invoices
          // If a billing record exists, it means the invoice was charged
          const { data: billingRecords } = await supabase
            .from('billing_records')
            .select('invoice_id, amount, status')
            .eq('user_id', user.id)
            .eq('type', 'per_invoice_fee')
            .in('status', ['pending', 'paid'])
            .in('invoice_id', invoiceIds);
          
          const chargedInvoiceIds = new Set((billingRecords || []).map(br => br.invoice_id));
          const chargedInvoices = chargedInvoiceIds.size;
          const totalCharged = (billingRecords || [])
            .reduce((sum, record) => sum + parseFloat(record.amount.toString()), 0);
          
          // Count free invoices (matching chargeForInvoice logic)
          // The 5 free invoices are shared between:
          // 1. Fast invoices (always use free first)
          // 2. Detailed invoices that are NOT template 1 and DON'T have premium features
          // Template 1 detailed invoices are ALWAYS free and don't count against the limit
          
          // Get all invoices with their details to check template and premium features
          // Order by created_at to count in chronological order
          // Note: type column might not exist in older schemas, so we'll infer it from other fields
          const { data: allInvoicesWithDetails } = await supabase
            .from('invoices')
            .select('id, type, theme, reminder_count, reminder_settings, created_at')
            .eq('user_id', user.id)
            .gte('created_at', userData.pay_per_invoice_activated_at)
            .neq('status', 'draft')
            .order('created_at', { ascending: true });
          
          let fastInvoicesCount = 0;
          let template1DetailedInvoicesCount = 0;
          
          if (allInvoicesWithDetails) {
            // Count invoices in chronological order (first 5 eligible invoices are free)
            for (const inv of allInvoicesWithDetails) {
              // Determine invoice type: if type field exists, use it; otherwise infer from other fields
              // Fast invoices have no reminder_settings, payment_terms, or late_fees
              // Detailed invoices have at least one of these fields
              let invoiceType = inv.type;
              if (!invoiceType) {
                // Infer type: if reminder_settings exists and is not null/empty, it's detailed
                // Otherwise, check if theme exists (detailed invoices have themes)
                if (inv.reminder_settings) {
                  invoiceType = 'detailed';
                } else if (inv.theme) {
                  // Check if theme is not empty
                  try {
                    const theme = typeof inv.theme === 'string' ? JSON.parse(inv.theme) : inv.theme;
                    if (theme && Object.keys(theme).length > 0) {
                      invoiceType = 'detailed';
                    } else {
                      invoiceType = 'fast'; // Empty theme = fast invoice
                    }
                  } catch (e) {
                    invoiceType = 'fast'; // If theme parsing fails, assume fast
                  }
                } else {
                  invoiceType = 'fast'; // No theme = fast invoice
                }
              }
              
              if (invoiceType === 'fast') {
                // Fast invoices count against free limit (up to 5)
                fastInvoicesCount++;
              } else if (invoiceType === 'detailed') {
                // Get template from theme JSONB field
                let template = 1; // Default to template 1
                if (inv.theme) {
                  try {
                    const theme = typeof inv.theme === 'string' ? JSON.parse(inv.theme) : inv.theme;
                    template = theme.template || 1;
                  } catch (e) {
                    // If parsing fails, default to template 1
                    template = 1;
                  }
                }
                
                // Template 1 detailed invoices count against the 5 free limit
                if (template === 1) {
                  template1DetailedInvoicesCount++;
                }
                // Other templates (2, 3) have premium features and charge immediately
                // They don't count against the free limit, so we skip them
              }
            }
          }
          
          // Count against free limit: fast invoices + template 1 detailed invoices
          // Template 1 detailed invoices are free (not charged) but count against the 5 free limit
          const totalFreeInvoicesUsed = fastInvoicesCount + template1DetailedInvoicesCount;
          const freeInvoicesUsed = Math.min(totalFreeInvoicesUsed, 5);
          const freeInvoicesRemaining = Math.max(0, 5 - freeInvoicesUsed);
          
          const totalInvoices = allInvoices.length;
          
          payPerInvoiceInfo = {
            totalInvoices,
            freeInvoicesUsed,
            freeInvoicesRemaining,
            chargedInvoices,
            totalCharged: totalCharged.toFixed(2),
            template1DetailedInvoices: template1DetailedInvoicesCount // Always free, don't count against limit
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

