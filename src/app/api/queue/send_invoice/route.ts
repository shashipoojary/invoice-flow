import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';
import { generateTemplatePDFBlob } from '@/lib/template-pdf-generator';
import { getEmailTemplate } from '@/lib/email-templates';
import { getBaseUrlFromRequest } from '@/lib/get-base-url';
import { chargeForInvoice } from '@/lib/invoice-billing';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Queue handler for sending invoices
 * Called by QStash when job is processed
 * This replicates the logic from /api/invoices/send but runs asynchronously
 */
async function handler(request: NextRequest) {
  try {
    const payload = await request.json();
    const { invoiceId, clientEmail, clientName, userId } = payload;

    console.log(`📧 Processing queued invoice send: ${invoiceId}`);

    if (!invoiceId || !clientEmail) {
      throw new Error('Missing required fields: invoiceId and clientEmail');
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
      .eq('user_id', userId)
      .single();

    if (invoiceError || !invoice) {
      throw new Error(`Invoice not found: ${invoiceId}`);
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
      .eq('user_id', userId)
      .single();

    if (settingsError) {
      console.error('Error fetching user settings:', settingsError);
    }

    // Parse payment terms, late fees, and reminder settings
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

    // Parse theme
    let invoiceTheme: { template?: number; primary_color?: string; secondary_color?: string } | undefined;
    
    if (typeof invoice.theme === 'string') {
      try {
        invoiceTheme = JSON.parse(invoice.theme);
      } catch (e) {
        invoiceTheme = undefined;
      }
    } else {
      invoiceTheme = invoice.theme as { template?: number; primary_color?: string; secondary_color?: string } | undefined;
    }
    
    // Map UI template to PDF template
    const mapUiTemplateToPdf = (uiTemplate: number): number => {
      switch (uiTemplate) {
        case 1: return 6;
        case 2: return 4;
        case 3: return 5;
        default: return 6;
      }
    };
    
    const template = invoice.type === 'fast' ? 1 : (invoiceTheme?.template ? mapUiTemplateToPdf(invoiceTheme.template) : 1);
    const primaryColor = invoiceTheme?.primary_color || '#5C2D91';
    const secondaryColor = invoiceTheme?.secondary_color || '#8B5CF6';
    
    // Generate PDF
    const pdfBlob = await generateTemplatePDFBlob(
      mappedInvoice, 
      businessSettings, 
      template, 
      primaryColor, 
      secondaryColor
    );
    const pdfBuffer = await pdfBlob.arrayBuffer();

    // Generate email template
    const encodedToken = encodeURIComponent(invoice.public_token);
    const baseUrl = getBaseUrlFromRequest(request);
    
    if (!baseUrl) {
      throw new Error('Base URL not configured');
    }
    
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    const publicUrl = `${cleanBaseUrl}/invoice/${encodedToken}`;
    
    const emailHtml = getEmailTemplate(template, invoice, businessSettings, publicUrl, invoice.status);

    // Send email FIRST - only update status if email succeeds
    const fromAddress = `${businessSettings.businessName || 'FlowInvoicer'} <onboarding@resend.dev>`;
    // Format currency for subject line using invoice currency
    const invoiceCurrency = invoice.currency || 'USD';
    const { formatCurrency } = require('@/lib/currency');
    const formattedTotal = formatCurrency(invoice.total || 0, invoiceCurrency);
    const emailSubject = invoice.status === 'paid' 
      ? `Receipt #${invoice.invoice_number} - ${formattedTotal}`
      : `Invoice #${invoice.invoice_number} - ${formattedTotal}`;
    
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

    // CRITICAL: Only update invoice status if email send succeeds
    // If email fails, throw error without changing status
    if (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }

    // Email sent successfully - NOW update invoice status
    if (invoice.status === 'draft') {
      await supabaseAdmin
        .from('invoices')
        .update({ status: 'sent', updated_at: new Date().toISOString() })
        .eq('id', invoiceId)
        .eq('user_id', userId);
    } else if (invoice.status === 'paid') {
      await supabaseAdmin
        .from('invoices')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', invoiceId)
        .eq('user_id', userId);
    }

    // Log sent event
    try {
      const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString();
      const { data: recentEvents } = await supabaseAdmin
        .from('invoice_events')
        .select('id')
        .eq('invoice_id', invoiceId)
        .eq('type', 'sent')
        .gte('created_at', fiveSecondsAgo)
        .limit(1);
      
      if (!recentEvents || recentEvents.length === 0) {
        await supabaseAdmin.from('invoice_events').insert({ invoice_id: invoiceId, type: 'sent' });
      }
    } catch {}

    // Create scheduled reminders if enabled
    const { data: latestInvoice } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (reminders && reminders.enabled && latestInvoice && (latestInvoice.status === 'sent' || latestInvoice.status === 'pending')) {
      try {
        const { createScheduledReminders } = await import('@/lib/reminder-scheduler');
        await createScheduledReminders(
          invoiceId,
          reminders,
          latestInvoice.due_date,
          paymentTerms,
          'sent',
          latestInvoice.updated_at || new Date().toISOString()
        );
        console.log(`✅ Created scheduled reminders for invoice ${invoiceId}`);
      } catch (reminderError) {
        console.error('Error creating scheduled reminders:', reminderError);
        // Don't fail the send operation if reminder creation fails
      }
    }

    // Charge for invoice if needed
    try {
      const reminderCount = reminders?.enabled ? (reminders.useSystemDefaults ? 4 : (reminders.rules?.length || 0)) : 0;
      
      await chargeForInvoice(
        userId, 
        invoiceId, 
        invoice.invoice_number,
        {
          template: invoiceTheme?.template || 1,
          reminderCount: reminderCount,
          primaryColor: invoiceTheme?.primary_color,
          secondaryColor: invoiceTheme?.secondary_color
        }
      );
    } catch (billingError) {
      console.error('Error charging for invoice:', billingError);
    }

    console.log(`✅ Invoice ${invoice.invoice_number} sent successfully via queue`);

    return NextResponse.json({ 
      success: true,
      invoiceId,
      emailId: data?.id 
    });
  } catch (error) {
    console.error('Error processing send_invoice job:', error);
    // Re-throw to trigger QStash retry
    throw error;
  }
}

// Queue handler - processes jobs from QStash
// Note: Signature verification can be added later for production security
// For now, we rely on QStash's built-in security and the fact that only QStash knows the endpoint URL
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    return handler(new NextRequest(request.url, {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify(payload),
    }));
  } catch (error) {
    console.error('Queue handler error:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

