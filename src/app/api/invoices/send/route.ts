import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-middleware';
import { generateTemplatePDFBlob } from '@/lib/template-pdf-generator';
import { getEmailTemplate } from '@/lib/email-templates';
import { getBaseUrlFromRequest } from '@/lib/get-base-url';
import { chargeForInvoice } from '@/lib/invoice-billing';

const resend = new Resend(process.env.RESEND_API_KEY);

// Function to create scheduled reminders
async function createScheduledReminders(invoiceId: string, reminderSettings: any, dueDate: string, paymentTerms?: any, invoiceStatus?: string, updatedAt?: string) {
  try {
    // CRITICAL: Do not schedule reminders for draft or paid invoices
    if (invoiceStatus === 'draft' || invoiceStatus === 'paid') {
      console.log(`⏭️ Skipping reminder scheduling for invoice ${invoiceId} - invoice is in ${invoiceStatus} status`);
      // Delete any existing scheduled reminders for draft or paid invoices
      await supabaseAdmin
        .from('invoice_reminders')
        .delete()
        .eq('invoice_id', invoiceId)
        .eq('reminder_status', 'scheduled');
      return;
    }

    // Parse payment terms if it's a string
    let parsedPaymentTerms = paymentTerms;
    if (typeof paymentTerms === 'string') {
      try {
        parsedPaymentTerms = JSON.parse(paymentTerms);
      } catch (e) {
        console.error('Failed to parse payment terms:', e);
        parsedPaymentTerms = null;
      }
    }
    
    // For "Due on Receipt" invoices, use updated_at (when sent) as base date, otherwise use due_date
    let baseDate = new Date(dueDate);
    if (parsedPaymentTerms?.enabled && (parsedPaymentTerms.terms === 'Due on Receipt' || parsedPaymentTerms.defaultOption === 'Due on Receipt') && invoiceStatus !== 'draft' && updatedAt) {
      baseDate = new Date(updatedAt);
    }
    
    // First, aggressively delete any existing scheduled reminders and duplicate failed reminders for this invoice
    // This prevents duplicates when invoice is sent multiple times or updated
    const { data: existingReminders } = await supabaseAdmin
      .from('invoice_reminders')
      .select('id, reminder_type, reminder_status, created_at')
      .eq('invoice_id', invoiceId);
    
    if (existingReminders && existingReminders.length > 0) {
      // Delete ALL scheduled reminders (they will be recreated below)
      await supabaseAdmin
        .from('invoice_reminders')
        .delete()
        .eq('invoice_id', invoiceId)
        .eq('reminder_status', 'scheduled');
      
      // Clean up duplicate failed reminders (keep only most recent per type)
      const failedByType = new Map<string, any[]>();
      for (const reminder of existingReminders) {
        if (reminder.reminder_status === 'failed') {
          const key = reminder.reminder_type || 'friendly';
          if (!failedByType.has(key)) {
            failedByType.set(key, []);
          }
          failedByType.get(key)!.push(reminder);
        }
      }
      
      // Delete duplicate failed reminders (keep most recent)
      for (const [type, reminders] of failedByType.entries()) {
        if (reminders.length > 1) {
          // Sort by created_at descending
          reminders.sort((a, b) => {
            const dateA = new Date(a.created_at || 0).getTime();
            const dateB = new Date(b.created_at || 0).getTime();
            return dateB - dateA;
          });
          // Keep first (most recent), delete rest
          const duplicateIds = reminders.slice(1).map(r => r.id);
          if (duplicateIds.length > 0) {
            await supabaseAdmin
              .from('invoice_reminders')
              .delete()
              .in('id', duplicateIds);
          }
        }
      }
    }
    
    const scheduledReminders = [];

    // Check useSystemDefaults flag FIRST - if true, use smart reminders regardless of custom rules
    if (reminderSettings.useSystemDefaults) {
      // Smart reminder system - adapts based on payment terms
      let smartSchedule: Array<{ type: string; days: number }> = [];
      
      // Use already parsed payment terms from above
      const paymentTerm = parsedPaymentTerms?.terms || parsedPaymentTerms?.defaultOption || 'Net 30';
      
      if (paymentTerm === 'Due on Receipt') {
        // Due on Receipt: All reminders after due date
        smartSchedule = [
          { type: 'friendly', days: 1 },  // 1 day after
          { type: 'polite', days: 3 },   // 3 days after
          { type: 'firm', days: 7 },     // 7 days after
          { type: 'urgent', days: 14 }   // 14 days after
        ];
      } else if (paymentTerm === 'Net 15') {
        // Net 15: Reminders before and after due date
        smartSchedule = [
          { type: 'friendly', days: -7 }, // 7 days before
          { type: 'polite', days: -3 },   // 3 days before
          { type: 'firm', days: 1 },     // 1 day after
          { type: 'urgent', days: 7 }    // 7 days after
        ];
      } else if (paymentTerm === 'Net 30') {
        // Net 30: More time before, reminders before and after
        smartSchedule = [
          { type: 'friendly', days: -14 }, // 14 days before
          { type: 'polite', days: -7 },   // 7 days before
          { type: 'firm', days: 1 },     // 1 day after
          { type: 'urgent', days: 7 }    // 7 days after
        ];
      } else if (paymentTerm === '2/10 Net 30') {
        // 2/10 Net 30: Before discount period, after discount, and overdue
        smartSchedule = [
          { type: 'friendly', days: -2 }, // 2 days before (remind about discount)
          { type: 'polite', days: 1 },    // 1 day after discount period
          { type: 'firm', days: 7 },     // 7 days after due
          { type: 'urgent', days: 14 }   // 14 days after due
        ];
      } else {
        // Default for other payment terms: Generic smart schedule
        // Try to extract number of days from custom terms
        const daysMatch = paymentTerm.match(/(\d+)/);
        const netDays = daysMatch ? parseInt(daysMatch[1]) : 30;
        
        if (netDays <= 15) {
          // Short terms: More frequent reminders
          smartSchedule = [
            { type: 'friendly', days: -7 },
            { type: 'polite', days: -3 },
            { type: 'firm', days: 1 },
            { type: 'urgent', days: 7 }
          ];
        } else {
          // Longer terms: More time before due
          smartSchedule = [
            { type: 'friendly', days: -14 },
            { type: 'polite', days: -7 },
            { type: 'firm', days: 1 },
            { type: 'urgent', days: 7 }
          ];
        }
      }

      for (const reminder of smartSchedule) {
        const scheduledDate = new Date(baseDate);
        scheduledDate.setDate(scheduledDate.getDate() + reminder.days);
        
        // Validate the scheduled date is valid
        if (isNaN(scheduledDate.getTime())) {
          console.error(`Invalid scheduled date calculated for smart reminder:`, reminder);
          continue; // Skip invalid reminders instead of failing
        }
        
        scheduledReminders.push({
          invoice_id: invoiceId,
          reminder_type: reminder.type,
          overdue_days: reminder.days,
          sent_at: scheduledDate.toISOString(),
          reminder_status: 'scheduled',
          email_id: null
        });
      }
    } else if (reminderSettings.customRules && reminderSettings.customRules.length > 0) {
      // Use custom reminder rules (only if useSystemDefaults is false)
      const enabledRules = reminderSettings.customRules.filter((rule: any) => rule.enabled);
      
      // Create reminders with their scheduled dates first
      const remindersWithDates = enabledRules.map((rule: any) => {
        const scheduledDate = new Date(baseDate);
        
        // Validate rule days is a valid number
        const days = typeof rule.days === 'number' && !isNaN(rule.days) ? rule.days : 0;
        
        // Fix scheduling logic: for "before" reminders, subtract days; for "after", add days
        if (rule.type === 'before') {
          scheduledDate.setDate(scheduledDate.getDate() - days);
        } else {
          scheduledDate.setDate(scheduledDate.getDate() + days);
        }
        
        // Validate the scheduled date is valid
        if (isNaN(scheduledDate.getTime())) {
          console.error(`Invalid scheduled date calculated for rule:`, rule);
          throw new Error(`Invalid scheduled date for reminder rule with ${days} days`);
        }
        
        return {
          rule,
          scheduledDate,
          overdue_days: rule.type === 'before' ? -days : days
        };
      });
      
      // Sort by scheduled date (earliest first) to get correct chronological order
      remindersWithDates.sort((a: any, b: any) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
      
      // Determine reminder types based on chronological sequence
      const reminderTypes = ['friendly', 'polite', 'firm', 'urgent'];
      
      for (let i = 0; i < remindersWithDates.length; i++) {
        const { rule, scheduledDate, overdue_days } = remindersWithDates[i];
        
        // Assign reminder type based on chronological sequence (friendly -> polite -> firm -> urgent)
        const reminderType = reminderTypes[Math.min(i, reminderTypes.length - 1)];
        
        scheduledReminders.push({
          invoice_id: invoiceId,
          reminder_type: reminderType,
          overdue_days,
          sent_at: scheduledDate.toISOString(),
          reminder_status: 'scheduled',
          email_id: null
        });
      }
    }

    // Insert scheduled reminders
    if (scheduledReminders.length > 0) {
      const { error } = await supabaseAdmin
        .from('invoice_reminders')
        .insert(scheduledReminders);

      if (error) {
        console.error('Error creating scheduled reminders:', error);
        throw error;
      }

      console.log(`Created ${scheduledReminders.length} scheduled reminders for invoice ${invoiceId}`);
    }
  } catch (error) {
    console.error('Error in createScheduledReminders:', error);
    throw error;
  }
}

if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY not found in environment variables');
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invoiceId, clientEmail, clientName } = await request.json();

    // Debug: Log the received data
    console.log('Send Invoice - Received data:', { invoiceId, clientEmail, clientName });

    if (!invoiceId || !clientEmail) {
      console.log('Send Invoice - Missing required fields:', { invoiceId, clientEmail });
      return NextResponse.json({ 
        error: 'Invoice ID and client email are required' 
      }, { status: 400 });
    }

    // Fetch invoice with client data
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .select(`
        *,
        clients (
          name,
          email,
          company,
          phone,
          address
        )
      `)
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ 
        error: 'Invoice not found' 
      }, { status: 404 });
    }

    // Fetch invoice items
    const { data: itemsData, error: itemsError } = await supabaseAdmin
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId);

    if (itemsError) {
      console.error('Error fetching invoice items:', itemsError);
    }

    // Fetch user settings for business details
    const { data: settingsData, error: settingsError } = await supabaseAdmin
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (settingsError) {
      console.error('Error fetching user settings:', settingsError);
    }

    // Parse payment terms, late fees, and reminder settings from JSON strings
    let paymentTerms = null;
    let lateFees = null;
    let reminders = null;
    
    if (invoice.payment_terms) {
      try {
        paymentTerms = typeof invoice.payment_terms === 'string' 
          ? JSON.parse(invoice.payment_terms) 
          : invoice.payment_terms;
      } catch (e) {
        console.log('Failed to parse payment_terms:', e);
      }
    }
    
    if (invoice.late_fees) {
      try {
        lateFees = typeof invoice.late_fees === 'string' 
          ? JSON.parse(invoice.late_fees) 
          : invoice.late_fees;
      } catch (e) {
        console.log('Failed to parse late_fees:', e);
      }
    }
    
    if (invoice.reminder_settings) {
      try {
        reminders = typeof invoice.reminder_settings === 'string' 
          ? JSON.parse(invoice.reminder_settings) 
          : invoice.reminder_settings;
      } catch (e) {
        console.log('Failed to parse reminder_settings:', e);
      }
    }

    // Prepare invoice data for PDF generation
    const mappedInvoice = {
      ...invoice,
      invoiceNumber: invoice.invoice_number,
      dueDate: invoice.due_date,
      createdAt: invoice.created_at,
      issueDate: invoice.issue_date,
      client: invoice.clients,
      items: (itemsData || []).map(item => ({
        id: item.id,
        description: item.description,
        amount: item.line_total
      })),
      taxRate: invoice.tax_rate || 0,
      taxAmount: invoice.tax_amount || 0,
      notes: invoice.notes,
      paymentTerms,
      lateFees,
      reminders
    };

    // Prepare business settings for PDF
    const businessSettings = {
      businessName: settingsData?.business_name || 'Your Business Name',
      businessEmail: settingsData?.business_email || '',
      businessPhone: settingsData?.business_phone || '',
      address: settingsData?.business_address || '',
      website: settingsData?.website || '',
      logo: settingsData?.logo || '',
      paypalEmail: settingsData?.paypal_email || '',
      cashappId: settingsData?.cashapp_id || '',
      venmoId: settingsData?.venmo_id || '',
      googlePayUpi: settingsData?.google_pay_upi || '',
      applePayId: settingsData?.apple_pay_id || '',
      bankAccount: settingsData?.bank_account || '',
      bankIfscSwift: settingsData?.bank_ifsc_swift || '',
      bankIban: settingsData?.bank_iban || '',
      stripeAccount: settingsData?.stripe_account || '',
      paymentNotes: settingsData?.payment_notes || ''
    };

    // Debug: Log the data being passed to PDF generation
    console.log('Email PDF - Mapped Invoice:', JSON.stringify(mappedInvoice, null, 2));
    console.log('Email PDF - Business Settings:', JSON.stringify(businessSettings, null, 2));
    console.log('Email PDF - Logo URL:', businessSettings.logo);

    // Generate PDF with template
    let invoiceTheme: { template?: number; primary_color?: string; secondary_color?: string } | undefined;
    
    // Parse theme if it's a JSON string
    if (typeof invoice.theme === 'string') {
      try {
        invoiceTheme = JSON.parse(invoice.theme);
      } catch (e) {
        console.log('Failed to parse theme JSON:', e);
        invoiceTheme = undefined;
      }
    } else {
      invoiceTheme = invoice.theme as { template?: number; primary_color?: string; secondary_color?: string } | undefined;
    }
    
    // Map UI template (1, 2, 3) to PDF template (6, 4, 5) for PDF generation
    const mapUiTemplateToPdf = (uiTemplate: number): number => {
      switch (uiTemplate) {
        case 1: return 6; // Minimal -> Template 6
        case 2: return 4; // Modern -> Template 4
        case 3: return 5; // Creative -> Template 5
        default: return 6;
      }
    };
    // Use template 1 (FastInvoiceTemplate) for fast invoices, otherwise map UI template to PDF template
    const template = invoice.type === 'fast' ? 1 : (invoiceTheme?.template ? mapUiTemplateToPdf(invoiceTheme.template) : 1);
    const primaryColor = invoiceTheme?.primary_color || '#5C2D91';
    const secondaryColor = invoiceTheme?.secondary_color || '#8B5CF6';
    
    console.log(`Email Template Logic - Invoice Type: ${invoice.type}, Theme Template: ${invoiceTheme?.template}, Selected Template: ${template}`);
    
    const pdfBlob = await generateTemplatePDFBlob(
      mappedInvoice, 
      businessSettings, 
      template, 
      primaryColor, 
      secondaryColor
    );
    const pdfBuffer = await pdfBlob.arrayBuffer();

    // Generate template-specific email using the new email templates
    // Properly encode the public token to handle special characters like + and =
    const encodedToken = encodeURIComponent(invoice.public_token);
    // Get base URL using utility function that handles all fallbacks properly
    const baseUrl = getBaseUrlFromRequest(request);
    
    // Log for debugging
    console.log('Base URL Debug:', {
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      VERCEL_URL: process.env.VERCEL_URL,
      NODE_ENV: process.env.NODE_ENV,
      resolvedBaseUrl: baseUrl,
      requestHost: request.headers.get('host'),
      xForwardedHost: request.headers.get('x-forwarded-host')
    });
    
    if (!baseUrl) {
      console.error('Base URL not configured. Please set NEXT_PUBLIC_APP_URL environment variable.');
      return NextResponse.json({ 
        error: 'Base URL not configured. Please set NEXT_PUBLIC_APP_URL environment variable.' 
      }, { status: 500 });
    }
    
    // Ensure baseUrl doesn't end with slash
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    const publicUrl = `${cleanBaseUrl}/invoice/${encodedToken}`;
    
    console.log('Generated public URL:', publicUrl);
    // Pass invoice status to hide payment methods for paid invoices
    const emailHtml = getEmailTemplate(template, invoice, businessSettings, publicUrl, invoice.status);

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ 
        error: 'Email service not configured. Please add RESEND_API_KEY to environment variables.' 
      }, { status: 500 });
    }

    // Ensure invoice status is set to 'sent' immediately for drafts
    // But preserve 'paid' status if invoice was already marked as paid
    if (invoice.status === 'draft') {
      await supabaseAdmin
        .from('invoices')
        .update({ status: 'sent', updated_at: new Date().toISOString() })
        .eq('id', invoiceId)
        .eq('user_id', user.id);
      // Reflect in local invoice object for response mapping
      invoice.status = 'sent';
    } else if (invoice.status === 'paid') {
      // Keep paid status but update timestamp
      await supabaseAdmin
        .from('invoices')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', invoiceId)
        .eq('user_id', user.id);
    }

    // Use Resend free plan default email address
    const fromAddress = `${businessSettings.businessName || 'FlowInvoicer'} <onboarding@resend.dev>`;

    // Send email with Resend
    // Use "Receipt" in subject for paid invoices, "Invoice" for others
    const emailSubject = invoice.status === 'paid' 
      ? `Receipt #${invoice.invoice_number} - $${invoice.total.toFixed(2)}`
      : `Invoice #${invoice.invoice_number} - $${invoice.total.toFixed(2)}`;
    
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [clientEmail],
      subject: emailSubject,
      html: emailHtml,
      attachments: [
        {
          filename: invoice.status === 'paid' 
            ? `Receipt-${invoice.invoice_number}.pdf`
            : `Invoice-${invoice.invoice_number}.pdf`,
          content: Buffer.from(pdfBuffer),
        },
      ],
    });

    if (error) {
      console.error('Resend email error:', error);
      return NextResponse.json({ 
        error: 'Failed to send email' 
      }, { status: 500 });
    }

    // Fetch the latest invoice after sending to return up-to-date status
    const { data: latest, error: latestError } = await supabaseAdmin
      .from('invoices')
      .select('*')
        .eq('id', invoiceId)
      .eq('user_id', user.id)
      .single();

    // Log sent event - check for recent duplicate to prevent multiple entries
    try {
      const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString();
      const { data: recentEvents } = await supabaseAdmin
        .from('invoice_events')
        .select('id')
        .eq('invoice_id', invoiceId)
        .eq('type', 'sent')
        .gte('created_at', fiveSecondsAgo)
        .limit(1);
      
      // Only insert if no recent 'sent' event exists (within last 5 seconds)
      if (!recentEvents || recentEvents.length === 0) {
        await supabaseAdmin.from('invoice_events').insert({ invoice_id: invoiceId, type: 'sent' });
      }
    } catch {}

    // Create scheduled reminders if enabled (check latest invoice status after update)
    const finalInvoice = latest || invoice;
    if (reminders && reminders.enabled && (finalInvoice.status === 'sent' || finalInvoice.status === 'pending')) {
      try {
        // Always recreate scheduled reminders when invoice is sent
        // The createScheduledReminders function handles deleting old scheduled reminders
        // This ensures reminders are rescheduled if invoice is sent again
        await createScheduledReminders(
          invoiceId,
          reminders,
          finalInvoice.due_date,
          paymentTerms,
          'sent',
          finalInvoice.updated_at || new Date().toISOString()
        );
        console.log(`✅ Created scheduled reminders for invoice ${invoiceId}`);
      } catch (reminderError) {
        console.error('Error creating scheduled reminders:', reminderError);
        // Don't fail the send operation if reminder creation fails
      }
    }

    const latestMapped = latest ? {
      ...latest,
      invoiceNumber: latest.invoice_number,
      dueDate: latest.due_date,
      createdAt: latest.created_at,
      updatedAt: latest.updated_at,
    } : null;

    // Charge for invoice if user is on "pay_per_invoice" plan
    // Charge when invoice is sent (not when created as draft)
    console.log(`💰 Attempting to charge for invoice: ${invoiceId} (${invoice.invoice_number})`);
    try {
      // Get template, reminder count, and colors for premium feature detection
      // invoiceTheme and reminders are already parsed above
      const reminderCount = reminders?.enabled ? (reminders.useSystemDefaults ? 4 : (reminders.rules?.length || 0)) : 0;
      
      const chargeResult = await chargeForInvoice(
        user.id, 
        invoiceId, 
        invoice.invoice_number,
        {
          template: invoiceTheme?.template || 1,
          reminderCount: reminderCount,
          primaryColor: invoiceTheme?.primary_color,
          secondaryColor: invoiceTheme?.secondary_color
        }
      );
      if (chargeResult.success) {
        console.log(`✅ Charge initiated successfully:`, {
          paymentId: chargeResult.paymentId,
          automatic: chargeResult.automatic,
          paymentLink: chargeResult.paymentLink ? 'Link created' : 'No link',
        });
      } else {
        console.error(`❌ Charge failed:`, chargeResult.error);
      }
      // Don't fail send if billing fails - just log it
    } catch (billingError) {
      console.error('❌ Error charging for invoice:', billingError);
      // Invoice is still sent, billing will be handled separately
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Invoice sent successfully',
      emailId: data?.id,
      invoice: latestMapped || mappedInvoice,
    });

  } catch (error) {
    console.error('Send invoice error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}