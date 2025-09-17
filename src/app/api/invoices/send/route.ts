import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { invoiceId, message } = await request.json();

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
          company
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

    // Generate invoice URL
    const invoiceUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invoice/${invoice.public_token}`;

    // Email content
    const emailSubject = `Invoice ${invoice.invoice_number} from ${settings.business_name || 'Your Business'}`;
    
    const emailBody = `
Dear ${invoice.clients.name},

${message || `Please find your invoice ${invoice.invoice_number} attached.`}

Invoice Details:
- Invoice Number: ${invoice.invoice_number}
- Amount: ₹${invoice.total.toLocaleString()}
- Due Date: ${new Date(invoice.due_date).toLocaleDateString('en-IN')}

You can view and download your invoice here: ${invoiceUrl}

Payment Methods:
${settings.paypal_email ? `- PayPal: ${settings.paypal_email}` : ''}
${settings.venmo_id ? `- Venmo: ${settings.venmo_id}` : ''}
${settings.google_pay_upi ? `- Google Pay/UPI: ${settings.google_pay_upi}` : ''}
${settings.bank_account ? `- Bank Transfer: ${settings.bank_account}` : ''}
${settings.payment_notes ? `- Other: ${settings.payment_notes}` : ''}

Thank you for your business!

Best regards,
${settings.business_name || 'Your Business'}
${settings.email || user.email}
    `.trim();

    // For now, we'll simulate email sending
    // In production, you would integrate with an email service like Resend, SendGrid, etc.
    console.log('Email would be sent to:', invoice.clients.email);
    console.log('Subject:', emailSubject);
    console.log('Body:', emailBody);

    // Update invoice status to 'sent'
    const { error: updateError } = await supabase
      .from('invoices')
      .update({ 
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', invoiceId);

    if (updateError) {
      console.error('Error updating invoice status:', updateError);
    }

    // Simulate successful email sending
    return NextResponse.json({ 
      success: true, 
      message: 'Invoice sent successfully',
      invoiceUrl 
    });

  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json({ error: 'Failed to send invoice' }, { status: 500 });
  }
}
