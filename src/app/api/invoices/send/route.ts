import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-middleware';
import { generateTemplatePDFBlob } from '@/lib/template-pdf-generator';
import { getEmailTemplate } from '@/lib/email-templates';
import { getBaseUrlFromRequest } from '@/lib/get-base-url';
import { chargeForInvoice } from '@/lib/invoice-billing';
import { enqueueBackgroundJob } from '@/lib/queue-helper';
import { createScheduledReminders } from '@/lib/reminder-scheduler';

const resend = new Resend(process.env.RESEND_API_KEY);

// Legacy function wrapper for backward compatibility (now uses shared utility)
async function createScheduledRemindersWrapper(invoiceId: string, reminderSettings: any, dueDate: string, paymentTerms?: any, invoiceStatus?: string, updatedAt?: string) {
  return createScheduledReminders(invoiceId, reminderSettings, dueDate, paymentTerms, invoiceStatus, updatedAt);
}

// Export wrapper for use in this file
const createScheduledRemindersLocal = createScheduledRemindersWrapper;

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

    // Try to enqueue job if queue is enabled
    // Feature flag: ENABLE_ASYNC_QUEUE must be 'true' to use queue
    const useQueue = process.env.ENABLE_ASYNC_QUEUE === 'true';

    if (useQueue) {
      const queueResult = await enqueueBackgroundJob(
        'send_invoice',
        {
          invoiceId,
          clientEmail,
          clientName,
          userId: user.id,
        },
        {
          retries: 3,
          deduplicationId: `send_invoice_${invoiceId}_${Date.now()}`,
        }
      );

      if (queueResult.queued) {
        // Job queued successfully, return immediately
        console.log(`✅ Invoice ${invoiceId} queued for sending (jobId: ${queueResult.jobId})`);
        return NextResponse.json({
          success: true,
          queued: true,
          jobId: queueResult.jobId,
          message: 'Invoice queued for sending',
        });
      }

      // Queue failed, log and fall through to sync processing
      console.warn('Queue failed, falling back to synchronous processing:', queueResult.error);
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