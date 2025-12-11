import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/supabase';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { comment } = await request.json();

    // Fetch estimate
    const { data: estimate, error: estimateError } = await supabaseAdmin
      .from('estimates')
      .select(`
        *,
        clients (
          name,
          email
        )
      `)
      .eq('id', id)
      .single();

    if (estimateError) {
      console.error('Error fetching estimate:', estimateError);
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
    }

    if (!estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
    }

    // Check if already approved or rejected
    if (estimate.approval_status === 'approved' || estimate.approval_status === 'rejected') {
      return NextResponse.json({ 
        error: `Estimate has already been ${estimate.approval_status}` 
      }, { status: 400 });
    }

    // Update estimate approval status
    const { error: updateError } = await supabaseAdmin
      .from('estimates')
      .update({
        approval_status: 'approved',
        status: 'approved',
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error approving estimate:', updateError);
      return NextResponse.json({ error: 'Failed to approve estimate' }, { status: 500 });
    }

    // Log approval event
    await supabaseAdmin.from('estimate_events').insert({
      estimate_id: id,
      type: 'approved',
      metadata: { comment: comment || '' }
    });

    // Fetch user settings to send notification
    const { data: settings } = await supabaseAdmin
      .from('user_settings')
      .select('business_email, email_from_address')
      .eq('user_id', estimate.user_id)
      .single();

    // Send notification email to user
    if (settings && process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: settings.email_from_address || `FlowInvoicer <noreply@${process.env.RESEND_DOMAIN || 'resend.dev'}>`,
          to: settings.business_email,
          subject: `Estimate ${estimate.estimate_number} Approved`,
          html: `
            <!DOCTYPE html>
            <html>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #10b981;">Estimate Approved!</h2>
                <p>Great news! Your estimate <strong>${estimate.estimate_number}</strong> has been approved by <strong>${estimate.clients?.name || 'Client'}</strong>.</p>
                ${comment ? `<p><strong>Client Comment:</strong> ${comment}</p>` : ''}
                <p>You can now convert this estimate to an invoice.</p>
              </body>
            </html>
          `,
        });
      } catch (emailError) {
        console.error('Error sending approval notification:', emailError);
      }
    }

    return NextResponse.json({ success: true, message: 'Estimate approved successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error approving estimate:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

