import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateReceiptPDF } from '@/lib/receipt-pdf-generator';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let publicToken = searchParams.get('public_token');

    if (!publicToken) {
      return NextResponse.json({ error: 'Public token is required' }, { status: 400 });
    }

    // Handle double encoding - decode multiple times if needed
    let decodedToken = publicToken;
    try {
      // Try decoding multiple times to handle double/triple encoding
      decodedToken = decodeURIComponent(publicToken);
      if (decodedToken.includes('%')) {
        decodedToken = decodeURIComponent(decodedToken);
      }
    } catch (e) {
      // If decoding fails, use original
      decodedToken = publicToken;
    }
    
    console.log('Receipt API - Original token:', publicToken);
    console.log('Receipt API - Decoded token:', decodedToken);
    console.log('Receipt API - Token length:', publicToken.length, 'Decoded length:', decodedToken.length);

    // Fetch invoice by public token
    // Try multiple approaches to handle URL encoding issues
    let { data: invoice, error } = await supabaseAdmin
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
      .eq('public_token', decodedToken)
      .single();

    // If decoded token fails, try with original token
    if (error && decodedToken !== publicToken) {
      console.log('Receipt API - Trying with original token:', publicToken);
      const retryResult = await supabaseAdmin
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
        .eq('public_token', publicToken)
        .single();
      
      invoice = retryResult.data;
      error = retryResult.error;
    }
    
    // If both fail, try with double decoded version (handle double encoding)
    if (error) {
      const doubleDecodedToken = decodeURIComponent(decodedToken);
      console.log('Receipt API - Trying with double decoded token:', doubleDecodedToken);
      const retryResult = await supabaseAdmin
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
        .eq('public_token', doubleDecodedToken)
        .single();
      
      invoice = retryResult.data;
      error = retryResult.error;
    }

    if (error) {
      console.error('Receipt API - Database error:', error);
      console.error('Receipt API - Error code:', error.code);
      console.error('Receipt API - Error message:', error.message);
      return NextResponse.json({ 
        error: 'Invoice not found', 
        details: error.message,
        token: publicToken.substring(0, 20) + '...' // Log partial token for debugging
      }, { status: 404 });
    }

    if (!invoice) {
      console.error('Receipt API - Invoice is null after query');
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    console.log('Receipt API - Invoice found:', invoice.invoice_number, 'Status:', invoice.status);

    // Only generate receipt if invoice is paid
    if (invoice.status !== 'paid') {
      console.log('Receipt API - Invoice not paid, status:', invoice.status);
      return NextResponse.json({ 
        error: 'Receipt is only available for paid invoices',
        currentStatus: invoice.status
      }, { status: 400 });
    }

    // Fetch invoice items
    const { data: itemsData } = await supabaseAdmin
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoice.id);

    // Fetch user settings for business details
    const { data: settingsData, error: settingsError } = await supabaseAdmin
      .from('user_settings')
      .select('*')
      .eq('user_id', invoice.user_id)
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.warn('Warning: Could not fetch user settings:', settingsError);
      // Continue with defaults if settings not found
    }

    // Map invoice data to match Invoice interface
    const mappedInvoice = {
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      issueDate: invoice.issue_date || invoice.created_at,
      dueDate: invoice.due_date,
      clientName: invoice.clients?.name || 'Client',
      clientEmail: invoice.clients?.email || '',
      clientCompany: invoice.clients?.company || '',
      clientPhone: invoice.clients?.phone || '',
      clientAddress: invoice.clients?.address || '',
      items: (itemsData || []).map((item: any) => ({
        id: item.id || String(Math.random()),
        description: item.description || 'Service',
        rate: Number(item.rate || item.line_total || 0),
        amount: Number(item.amount || item.line_total || 0),
      })),
      subtotal: invoice.subtotal || 0,
      discount: invoice.discount || 0,
      taxAmount: invoice.tax_amount || 0,
      total: invoice.total || 0,
      lateFees: invoice.late_fees || 0,
      totalWithLateFees: invoice.total_with_late_fees || invoice.total || 0,
      status: invoice.status,
      notes: invoice.notes || '',
    };

    // Map business settings
    const businessSettings = {
      businessName: settingsData?.business_name || 'Business',
      businessEmail: settingsData?.business_email || '',
      businessPhone: settingsData?.business_phone || '',
      address: settingsData?.business_address || '',
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
      paymentNotes: settingsData?.payment_notes || '',
    };

    // Generate receipt PDF
    console.log('Receipt API - Generating receipt PDF for invoice:', invoice.invoice_number);
    console.log('Receipt API - Mapped invoice:', {
      invoiceNumber: mappedInvoice.invoiceNumber,
      total: mappedInvoice.total,
      itemsCount: mappedInvoice.items.length,
      hasClientName: !!mappedInvoice.clientName,
    });
    console.log('Receipt API - Business settings:', {
      businessName: businessSettings.businessName,
      hasEmail: !!businessSettings.businessEmail,
    });
    
    // Validate required fields before PDF generation
    if (!mappedInvoice.invoiceNumber) {
      throw new Error('Invoice number is missing');
    }
    if (!businessSettings.businessName) {
      console.warn('Receipt API - Business name missing, using default');
      businessSettings.businessName = 'Business';
    }
    
    try {
      console.log('Receipt API - Calling generateReceiptPDF...');
      const pdfBytes = await generateReceiptPDF(mappedInvoice, businessSettings);
      console.log('Receipt API - PDF generated successfully, size:', pdfBytes.length);
      
      if (!pdfBytes || pdfBytes.length === 0) {
        throw new Error('PDF generation returned empty result');
      }

      // Convert Uint8Array to ArrayBuffer for NextResponse
      const pdfBuffer = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer;

      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="receipt-${invoice.invoice_number}.pdf"`,
        },
      });
    } catch (pdfError) {
      console.error('Receipt API - PDF generation error:', pdfError);
      console.error('Receipt API - PDF error stack:', pdfError instanceof Error ? pdfError.stack : 'No stack trace');
      throw pdfError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error('Receipt API - Top level error:', error);
    console.error('Receipt API - Error type:', typeof error);
    console.error('Receipt API - Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Return detailed error for debugging
    return NextResponse.json(
      { 
        error: 'Failed to generate receipt', 
        details: error instanceof Error ? error.message : String(error),
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined,
        errorType: error instanceof Error ? error.constructor.name : typeof error
      },
      { status: 500 }
    );
  }
}

