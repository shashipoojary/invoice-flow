import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-middleware';
import { getBaseUrlFromRequest } from '@/lib/get-base-url';
import { generateEstimateEmailTemplate } from '@/lib/email-templates';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { estimateId } = await request.json();

    if (!estimateId) {
      return NextResponse.json({ error: 'Estimate ID is required' }, { status: 400 });
    }

    // Fetch estimate with client and items
    const { data: estimate, error: estimateError } = await supabaseAdmin
      .from('estimates')
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
        estimate_items (
          id,
          description,
          qty,
          rate,
          line_total
        )
      `)
      .eq('id', estimateId)
      .eq('user_id', user.id)
      .single();

    if (estimateError || !estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
    }

    // Fetch business settings
    const { data: settings } = await supabaseAdmin
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!settings) {
      return NextResponse.json({ error: 'Business settings not found' }, { status: 404 });
    }

    // Update estimate status to 'sent'
    const { error: updateError } = await supabaseAdmin
      .from('estimates')
      .update({ 
        status: 'sent',
        updated_at: new Date().toISOString()
      })
      .eq('id', estimateId);

    if (updateError) {
      console.error('Error updating estimate status:', updateError);
      return NextResponse.json({ error: 'Failed to update estimate status' }, { status: 500 });
    }

    // Log sent event
    await supabaseAdmin.from('estimate_events').insert({
      estimate_id: estimateId,
      user_id: user.id,
      type: 'sent',
      metadata: {}
    });

    // Generate public URL
    const baseUrl = getBaseUrlFromRequest(request);
    if (!baseUrl) {
      return NextResponse.json({ error: 'Base URL not configured' }, { status: 500 });
    }
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    const encodedToken = encodeURIComponent(estimate.public_token);
    const publicUrl = `${cleanBaseUrl}/estimate/${encodedToken}`;

    // Generate estimate email using the modern template
    const businessSettings = {
      businessName: settings.business_name || 'Your Business',
      businessEmail: settings.business_email || '',
      businessPhone: settings.business_phone || '',
      address: settings.business_address || '',
      paypalEmail: settings.paypal_email || '',
      cashappId: settings.cashapp_id || '',
      venmoId: settings.venmo_id || '',
      googlePayUpi: settings.google_pay_upi || '',
      applePayId: settings.apple_pay_id || '',
      bankAccount: settings.bank_account || '',
      bankIfscSwift: settings.bank_ifsc_swift || '',
      bankIban: settings.bank_iban || '',
      stripeAccount: settings.stripe_account || '',
      paymentNotes: settings.payment_notes || ''
    };

    const estimateData = {
      estimate_number: estimate.estimate_number,
      total: parseFloat(estimate.total),
      issue_date: estimate.issue_date || new Date().toISOString().split('T')[0],
      expiry_date: estimate.expiry_date || undefined,
      notes: estimate.notes || undefined,
      clients: {
        name: estimate.clients.name,
        email: estimate.clients.email,
        company: estimate.clients.company || undefined
      },
      estimate_items: estimate.estimate_items.map((item: any) => ({
        description: item.description,
        qty: item.qty || 1,
        rate: item.rate,
        line_total: item.line_total
      }))
    };

    const emailHtml = generateEstimateEmailTemplate(estimateData, businessSettings, publicUrl);

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ 
        error: 'Email service not configured. Please add RESEND_API_KEY to environment variables.' 
      }, { status: 500 });
    }

    if (!estimate.clients?.email) {
      return NextResponse.json({ 
        error: 'Client email address is missing' 
      }, { status: 400 });
    }

    // Use Resend free plan default email address (same as invoice)
    const fromAddress = `${businessSettings.businessName || 'FlowInvoicer'} <onboarding@resend.dev>`;

    // Send email with Resend
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [estimate.clients.email],
      subject: `Estimate ${estimate.estimate_number} - Please Review`,
      html: emailHtml,
    });

    if (error) {
      console.error('Resend email error:', error);
      return NextResponse.json({ 
        error: 'Failed to send email',
        details: error.message || JSON.stringify(error)
      }, { status: 500 });
    }

    console.log('Estimate email sent successfully. Email ID:', data?.id);

    return NextResponse.json({ 
      success: true, 
      message: 'Estimate sent successfully',
      emailSent: true,
      emailId: data?.id
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error sending estimate:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

