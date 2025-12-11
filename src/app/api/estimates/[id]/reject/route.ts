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
    const { reason, comment } = await request.json();

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

    if (estimateError || !estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
    }

    // Update estimate rejection status
    const { error: updateError } = await supabaseAdmin
      .from('estimates')
      .update({
        approval_status: 'rejected',
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejection_reason: reason || comment || '',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error rejecting estimate:', updateError);
      return NextResponse.json({ error: 'Failed to reject estimate' }, { status: 500 });
    }

    // Log rejection event
    await supabaseAdmin.from('estimate_events').insert({
      estimate_id: id,
      type: 'rejected',
      metadata: { reason: reason || '', comment: comment || '' }
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
          subject: `Estimate ${estimate.estimate_number} Rejected`,
          html: `
            <!DOCTYPE html>
            <html>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #ef4444;">Estimate Rejected</h2>
                <p>Your estimate <strong>${estimate.estimate_number}</strong> has been rejected by <strong>${estimate.clients.name}</strong>.</p>
                ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
                ${comment ? `<p><strong>Client Comment:</strong> ${comment}</p>` : ''}
                <p>You may want to revise the estimate and send a new one.</p>
              </body>
            </html>
          `,
        });
      } catch (emailError) {
        console.error('Error sending rejection notification:', emailError);
      }
    }

    return NextResponse.json({ success: true, message: 'Estimate rejected' }, { status: 200 });
  } catch (error: any) {
    console.error('Error rejecting estimate:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

