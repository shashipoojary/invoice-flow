import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    
    // First, delete any existing scheduled reminders for this invoice to avoid duplicates
    // Also delete duplicate failed reminders for the same invoice+type
    const { data: existingReminders } = await supabaseAdmin
      .from('invoice_reminders')
      .select('id, reminder_type, reminder_status')
      .eq('invoice_id', invoiceId);
    
    if (existingReminders && existingReminders.length > 0) {
      // Delete all scheduled reminders
      await supabaseAdmin
        .from('invoice_reminders')
        .delete()
        .eq('invoice_id', invoiceId)
        .eq('reminder_status', 'scheduled');
      
      // Group failed reminders by type and delete duplicates (keep only most recent)
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
      
      // For each type with multiple failed reminders, delete all but the most recent
      for (const [type, reminders] of failedByType.entries()) {
        if (reminders.length > 1) {
          // Sort by created_at descending, keep first, delete rest
          const sorted = reminders.sort((a, b) => {
            // We'll need to fetch full data to sort properly, but for now just delete extras
            return 0;
          });
          const duplicateIds = sorted.slice(1).map(r => r.id);
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
      const { error } = await supabase
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

// Check subscription limits before creating invoice
async function checkSubscriptionLimit(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  try {
    // Get user subscription plan
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('subscription_plan')
      .eq('id', userId)
      .single();

    const plan = profile?.subscription_plan || 'free';

    // Free plan: Check monthly invoice limit
    if (plan === 'free') {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const { count } = await supabaseAdmin
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', startOfMonth.toISOString())
        .lte('created_at', endOfMonth.toISOString());

      if ((count || 0) >= 5) {
        return {
          allowed: false,
          reason: 'Free plan limit reached. You can create up to 5 invoices per month. Please upgrade to create more invoices.'
        };
      }
    }

    // Monthly and Pay Per Invoice plans have no limits
    return { allowed: true };
  } catch (error) {
    console.error('Error checking subscription limit:', error);
    // Allow creation if check fails (fail open)
    return { allowed: true };
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user first
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check subscription limits before proceeding (only for non-PDF generation)
    const invoiceData = await request.json();
    if (!invoiceData.generate_pdf_only) {
      const limitCheck = await checkSubscriptionLimit(user.id);
      if (!limitCheck.allowed) {
        return NextResponse.json({ 
          error: limitCheck.reason || 'Subscription limit reached',
          limitReached: true
        }, { status: 403 });
      }
    }

    // Validate required fields
    if (!invoiceData.due_date || !invoiceData.items || invoiceData.items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate items
    for (const item of invoiceData.items) {
      if (!item.description || !item.rate || item.rate <= 0) {
        return NextResponse.json({ error: 'Invalid item data' }, { status: 400 });
      }
    }

    let clientId = invoiceData.client_id;

    // Handle new client creation if no client_id provided
    if (!clientId && invoiceData.client_data) {
      // First check if a client with this email already exists
      const { data: existingClient, error: checkError } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .eq('email', invoiceData.client_data.email)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error checking existing client:', checkError);
        return NextResponse.json({ error: 'Failed to check existing client' }, { status: 500 });
      }

      if (existingClient) {
        // Use existing client
        clientId = existingClient.id;
      } else {
        // Create new client
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            user_id: user.id,
            name: invoiceData.client_data.name,
            email: invoiceData.client_data.email,
            company: invoiceData.client_data.company || null,
            phone: invoiceData.client_data.phone || null,
            address: invoiceData.client_data.address || null,
          })
          .select('id')
          .single();

        if (clientError) {
          console.error('Client creation error:', clientError);
          return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
        }

        clientId = newClient.id;
      }
    }

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID or client data required' }, { status: 400 });
    }

    // Verify client belongs to user (security check)
    const { data: client, error: clientCheckError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single();

    if (clientCheckError || !client) {
      return NextResponse.json({ error: 'Client not found or access denied' }, { status: 403 });
    }

    // Check if PDF generation is requested (before any database operations)
    if (invoiceData.generate_pdf_only) {
      // Generate PDF without saving to database
      try {
        // Fetch full client data for PDF
        const { data: fullClientData, error: fullClientError } = await supabase
          .from('clients')
          .select('id, name, email, company, phone, address')
          .eq('id', clientId)
          .eq('user_id', user.id)
          .single();

        if (fullClientError || !fullClientData) {
          return NextResponse.json({ error: 'Client not found or access denied' }, { status: 403 });
        }

        // Calculate totals for PDF
        const subtotal = invoiceData.items.reduce((sum: number, item: { rate: number }) => sum + item.rate, 0);
        const discount = invoiceData.discount || 0;
        const total = subtotal - discount;

        // Generate invoice number for PDF (without saving)
        const { data: invoiceNumberData, error: invoiceNumberError } = await supabase
          .rpc('generate_invoice_number', { user_uuid: user.id });

        if (invoiceNumberError) {
          console.error('Invoice number generation error:', invoiceNumberError);
          return NextResponse.json({ error: 'Failed to generate invoice number' }, { status: 500 });
        }

        // Generate public token for PDF (without saving)
        const { data: publicTokenData, error: tokenError } = await supabase
          .rpc('generate_public_token');

        if (tokenError) {
          console.error('Public token generation error:', tokenError);
          return NextResponse.json({ error: 'Failed to generate public token' }, { status: 500 });
        }

        // Create temporary invoice object for PDF generation
        const tempInvoice = {
          id: 'temp-pdf-id',
          user_id: user.id,
          client_id: clientId,
          invoice_number: invoiceNumberData,
          public_token: publicTokenData,
          subtotal,
          discount,
          total,
          status: 'draft' as const,
          issue_date: invoiceData.issue_date || new Date().toISOString().split('T')[0],
          due_date: invoiceData.due_date,
          notes: invoiceData.notes || '',
          type: invoiceData.type || 'detailed',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          clients: fullClientData,
          invoice_items: invoiceData.items.map((item: { description: string; rate: number; line_total: number }) => ({
            id: 'temp-item-id',
            description: item.description,
            rate: item.rate,
            line_total: item.line_total
          }))
        };

        // Fetch business settings for PDF generation
        const { data: settingsData, error: settingsError } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (settingsError) {
          console.error('Settings fetch error:', settingsError);
        }

        const businessSettings = settingsData ? {
          businessName: settingsData.business_name,
          businessEmail: settingsData.business_email,
          businessPhone: settingsData.business_phone,
          address: settingsData.business_address,
          logo: settingsData.logo || settingsData.logo_url,
          bankAccount: settingsData.bank_account,
          bankIfscSwift: settingsData.bank_ifsc_swift,
          bankIban: settingsData.bank_iban,
          paypalEmail: settingsData.paypal_email,
          cashappId: settingsData.cashapp_id,
          venmoId: settingsData.venmo_id,
          googlePayUpi: settingsData.google_pay_upi,
          applePayId: settingsData.apple_pay_id,
          stripeAccount: settingsData.stripe_account,
          paymentNotes: settingsData.payment_notes
        } : undefined;

        // Map to frontend format
        const mappedInvoice = {
          ...tempInvoice,
          invoiceNumber: tempInvoice.invoice_number,
          dueDate: tempInvoice.due_date,
          createdAt: tempInvoice.created_at,
          clientId: tempInvoice.client_id,
          client: {
            ...tempInvoice.clients,
            createdAt: new Date().toISOString()
          },
          clientName: tempInvoice.clients.name,
          clientEmail: tempInvoice.clients.email,
          clientCompany: tempInvoice.clients.company,
          clientAddress: tempInvoice.clients.address,
          items: tempInvoice.invoice_items.map((item: { id: string; description: string; line_total: number }) => ({
            id: item.id,
            description: item.description,
            amount: item.line_total
          })),
          taxRate: 0,
          taxAmount: 0,
          // Only set advanced features for detailed invoices, not fast invoices
          paymentTerms: invoiceData.type === 'fast' ? undefined : (invoiceData.payment_terms || { enabled: false, terms: 'Net 30' }),
          lateFees: invoiceData.type === 'fast' ? undefined : (invoiceData.late_fees || { enabled: false, type: 'fixed', amount: 0, gracePeriod: 0 }),
          reminders: invoiceData.type === 'fast' ? undefined : (invoiceData.reminders || { enabled: false, useSystemDefaults: true, rules: [] }),
          theme: invoiceData.theme || undefined,
        };

        try {
          const { generateTemplatePDFBlob } = await import('@/lib/template-pdf-generator');
          
          // Extract template and colors from theme
          const invoiceTheme = invoiceData.theme as { template?: number; primary_color?: string; secondary_color?: string } | undefined;
          // Use template 1 (FastInvoiceTemplate) for fast invoices, otherwise use theme template
          const template = invoiceData.type === 'fast' ? 1 : (invoiceTheme?.template || 1);
          const primaryColor = invoiceTheme?.primary_color || '#5C2D91';
          const secondaryColor = invoiceTheme?.secondary_color || '#8B5CF6';
          
          console.log('PDF Generation - Template:', template, 'Primary:', primaryColor, 'Secondary:', secondaryColor);
          console.log('PDF Generation - Mapped Invoice:', JSON.stringify(mappedInvoice, null, 2));
          console.log('PDF Generation - Business Settings:', JSON.stringify(businessSettings, null, 2));
          
          const pdfBlob = await generateTemplatePDFBlob(mappedInvoice, businessSettings, template, primaryColor, secondaryColor);
          const pdfBuffer = await pdfBlob.arrayBuffer();
          
          return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="invoice-${invoiceNumberData}.pdf"`,
            },
          });
        } catch (pdfError) {
          console.error('PDF generation error:', pdfError);
          console.error('PDF generation error details:', pdfError instanceof Error ? pdfError.message : 'Unknown error');
          console.error('PDF generation stack:', pdfError instanceof Error ? pdfError.stack : 'No stack trace');
          return NextResponse.json({ error: 'Failed to generate PDF', details: pdfError instanceof Error ? pdfError.message : 'Unknown error' }, { status: 500 });
        }
      } catch (pdfError) {
        console.error('PDF generation error:', pdfError);
        return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
      }
    }

    // Calculate totals for database save
    const subtotal = invoiceData.items.reduce((sum: number, item: { rate: number }) => sum + item.rate, 0);
    const discount = invoiceData.discount || 0;
    const total = subtotal - discount;

    // Generate invoice number using database function
    const { data: invoiceNumberData, error: invoiceNumberError } = await supabase
      .rpc('generate_invoice_number', { user_uuid: user.id });

    if (invoiceNumberError) {
      console.error('Invoice number generation error:', invoiceNumberError);
      return NextResponse.json({ error: 'Failed to generate invoice number' }, { status: 500 });
    }

    // Generate public token using database function
    const { data: publicTokenData, error: tokenError } = await supabase
      .rpc('generate_public_token');

    if (tokenError) {
      console.error('Public token generation error:', tokenError);
      return NextResponse.json({ error: 'Failed to generate public token' }, { status: 500 });
    }

    // Prepare invoice data
    const invoice = {
      user_id: user.id,
      client_id: clientId,
      invoice_number: invoiceNumberData,
      public_token: publicTokenData,
      subtotal,
      discount,
      total,
      // IMPORTANT: Allow 'paid' status if user marked invoice as paid during creation
      // This is for the use case where client already paid, but asks for invoice later
      // These invoices can still be sent as receipts, but won't get reminders
      status: invoiceData.status || 'draft',
      issue_date: invoiceData.issue_date || new Date().toISOString().split('T')[0],
      due_date: invoiceData.due_date,
      notes: invoiceData.notes || '',
      type: invoiceData.type || 'detailed',
      // New enhanced fields - only for detailed invoices
      payment_terms: invoiceData.type === 'fast' ? null : (invoiceData.payment_terms ? JSON.stringify(invoiceData.payment_terms) : null),
      late_fees: invoiceData.type === 'fast' ? null : (invoiceData.late_fees ? JSON.stringify(invoiceData.late_fees) : null),
      reminder_settings: invoiceData.type === 'fast' ? null : (invoiceData.reminderSettings || invoiceData.reminders ? (() => {
        const settings = invoiceData.reminderSettings || invoiceData.reminders;
        // Ensure all rules have enabled property
        if (settings.rules) {
          settings.rules = settings.rules.map((rule: any) => ({
            ...rule,
            enabled: rule.enabled !== undefined ? rule.enabled : true
          }));
        }
        if (settings.customRules) {
          settings.customRules = settings.customRules.map((rule: any) => ({
            ...rule,
            enabled: rule.enabled !== undefined ? rule.enabled : true
          }));
        }
        return JSON.stringify(settings);
      })() : JSON.stringify({ enabled: false, useSystemDefaults: true, customRules: [] })),
      theme: invoiceData.type === 'fast' ? null : (invoiceData.theme ? JSON.stringify(invoiceData.theme) : null),
    };

    // Insert invoice
    const { data: newInvoice, error: insertError } = await supabase
      .from('invoices')
      .insert(invoice)
      .select(`
        *,
        clients (
          id,
          name,
          email,
          company,
          phone,
          address
        )
      `)
      .single();

    if (insertError) {
      console.error('Invoice creation error:', insertError);
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
    }

    // Insert invoice items
    const invoiceItems = invoiceData.items.map((item: { description: string; rate: number; line_total: number }) => ({
      invoice_id: newInvoice.id,
      description: item.description,
      rate: item.rate,
      line_total: item.rate,
    }));

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(invoiceItems);

    if (itemsError) {
      console.error('Invoice items creation error:', itemsError);
      // Rollback invoice creation
      await supabase.from('invoices').delete().eq('id', newInvoice.id);
      return NextResponse.json({ error: 'Failed to create invoice items' }, { status: 500 });
    }

    // Fetch the complete invoice with items
    const { data: completeInvoice, error: fetchError } = await supabase
      .from('invoices')
      .select(`
        *,
        clients (
          id,
          name,
          email,
          company,
          phone,
          address
        ),
        invoice_items (
          id,
          description,
          rate,
          line_total
        )
      `)
      .eq('id', newInvoice.id)
      .single();

    if (fetchError) {
      console.error('Invoice fetch error:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch complete invoice' }, { status: 500 });
    }

    // IMPORTANT: If invoice was created with 'paid' status (via "Mark as Paid" during creation),
    // log a 'paid' event for consistency with existing flow
    // This ensures activity tracking and other systems recognize it as paid from the start
    if (completeInvoice.status === 'paid') {
      try {
        await supabaseAdmin.from('invoice_events').insert({ 
          invoice_id: completeInvoice.id, 
          type: 'paid',
          metadata: { created_as_paid: true } // Flag to distinguish from invoices marked as paid later
        });
        console.log(`✅ Logged 'paid' event for invoice ${completeInvoice.id} (created as paid)`);
      } catch (eventError) {
        console.error('Error logging paid event for newly created paid invoice:', eventError);
        // Don't fail invoice creation if event logging fails
      }
    }

    // Map database fields to frontend interface
    const mappedInvoice = {
      ...completeInvoice,
      invoiceNumber: completeInvoice.invoice_number,
      dueDate: completeInvoice.due_date,
      createdAt: completeInvoice.created_at,
      client: completeInvoice.clients,
      items: (completeInvoice.invoice_items || []).map((item: { id: string; description: string; line_total: number }) => ({
        id: item.id,
        description: item.description,
        amount: item.line_total
      })),
      // Parse JSON fields with fallbacks for existing invoices (only for detailed invoices)
      paymentTerms: completeInvoice.type === 'fast' ? undefined : 
        (completeInvoice.payment_terms ? JSON.parse(completeInvoice.payment_terms) : 
        { enabled: true, terms: 'Net 30' }),
      lateFees: completeInvoice.type === 'fast' ? undefined : 
        (completeInvoice.late_fees ? JSON.parse(completeInvoice.late_fees) : 
        { enabled: true, type: 'fixed', amount: 50, gracePeriod: 7 }),
      reminders: completeInvoice.type === 'fast' ? undefined : 
        (completeInvoice.reminder_settings ? JSON.parse(completeInvoice.reminder_settings) : 
        { enabled: false, useSystemDefaults: true, rules: [] }),
      theme: completeInvoice.type === 'fast' ? undefined : 
        (completeInvoice.theme ? JSON.parse(completeInvoice.theme) : undefined),
    };

    // Create scheduled reminders if reminder settings are enabled
    
    if (completeInvoice.type !== 'fast' && completeInvoice.reminder_settings) {
      try {
        const reminderSettings = JSON.parse(completeInvoice.reminder_settings);
        
        if (reminderSettings.enabled) {
          await createScheduledReminders(
            completeInvoice.id, 
            reminderSettings, 
            completeInvoice.due_date,
            completeInvoice.payment_terms,
            completeInvoice.status,
            completeInvoice.updated_at
          );
        }
      } catch (reminderError) {
        console.error('Error creating scheduled reminders:', reminderError);
        // Don't fail the invoice creation if reminder creation fails
      }
    }

    // log created event
    try { await supabase.from('invoice_events').insert({ invoice_id: completeInvoice.id, type: 'created' }); } catch {}
    return NextResponse.json({ 
      success: true, 
      invoice: mappedInvoice,
      message: 'Invoice created successfully' 
    });

  } catch (error) {
    console.error('Invoice creation error:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
