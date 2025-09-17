import { NextRequest, NextResponse } from 'next/server';
import { pdf } from '@react-pdf/renderer';
import { generateInvoicePDF } from '@/lib/pdf-generator';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { invoiceId } = await request.json();

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

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

    // Fetch invoice data
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        clients (
          id,
          name,
          email,
          company,
          address
        )
      `)
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Fetch business settings
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (settingsError || !settings) {
      return NextResponse.json({ error: 'Business settings not found' }, { status: 404 });
    }

    // Transform data for PDF
    const invoiceData = {
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      client: {
        name: invoice.clients.name,
        email: invoice.clients.email,
        company: invoice.clients.company,
        address: invoice.clients.address,
      },
      items: invoice.items || [],
      subtotal: invoice.subtotal,
      taxRate: invoice.tax_rate,
      taxAmount: invoice.tax_amount,
      total: invoice.total,
      status: invoice.status,
      dueDate: invoice.due_date,
      createdAt: invoice.created_at,
      notes: invoice.notes,
    };

    const businessInfo = {
      businessName: settings.business_name || 'Your Business',
      logo: settings.logo,
      address: settings.address || '',
      email: settings.email || user.email || '',
      paypalEmail: settings.paypal_email,
      venmoId: settings.venmo_id,
      googlePayUpi: settings.google_pay_upi,
      bankAccount: settings.bank_account,
      bankIfscSwift: settings.bank_ifsc_swift,
      bankIban: settings.bank_iban,
      paymentNotes: settings.payment_notes,
    };

    // Generate PDF
    const pdfStream = await pdf(generateInvoicePDF(invoiceData, businessInfo)).toBlob();

    // Return PDF as response
    return new NextResponse(pdfStream, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoice_number}.pdf"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
