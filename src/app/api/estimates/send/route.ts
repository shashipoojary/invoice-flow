import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-middleware';
import { getBaseUrlFromRequest } from '@/lib/get-base-url';

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

    // Generate simple estimate email (we'll enhance this later)
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Estimate ${estimate.estimate_number}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="margin: 0 0 10px 0; color: #1f2937;">Estimate ${estimate.estimate_number}</h1>
            <p style="margin: 0; color: #6b7280;">From ${settings.business_name || 'Your Business'}</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 20px;">
            <p>Dear ${estimate.clients.name},</p>
            <p>Please find attached the estimate for your review.</p>
            <p><strong>Total Amount:</strong> $${parseFloat(estimate.total).toFixed(2)}</p>
            ${estimate.expiry_date ? `<p><strong>Valid Until:</strong> ${new Date(estimate.expiry_date).toLocaleDateString()}</p>` : ''}
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${publicUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">View & Approve Estimate</a>
          </div>

          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            You can approve or reject this estimate by clicking the link above.
          </p>
        </body>
      </html>
    `;

    // Send email
    if (process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: settings.email_from_address || `FlowInvoicer <noreply@${process.env.RESEND_DOMAIN || 'resend.dev'}>`,
          to: estimate.clients.email,
          subject: `Estimate ${estimate.estimate_number} - Please Review`,
          html: emailHtml,
        });
      } catch (emailError: any) {
        console.error('Error sending estimate email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ success: true, message: 'Estimate sent successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error sending estimate:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

