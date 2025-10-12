import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const invoiceData = await request.json();

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      status: 'draft',
      issue_date: invoiceData.issue_date || new Date().toISOString().split('T')[0],
      due_date: invoiceData.due_date,
      notes: invoiceData.notes || '',
      type: invoiceData.type || 'detailed',
      // New enhanced fields - only for detailed invoices
      payment_terms: invoiceData.type === 'fast' ? null : (invoiceData.payment_terms ? JSON.stringify(invoiceData.payment_terms) : null),
      late_fees: invoiceData.type === 'fast' ? null : (invoiceData.late_fees ? JSON.stringify(invoiceData.late_fees) : null),
      reminder_settings: invoiceData.type === 'fast' ? null : (invoiceData.reminders ? JSON.stringify(invoiceData.reminders) : JSON.stringify({ enabled: false, useSystemDefaults: true, customRules: [] })),
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
