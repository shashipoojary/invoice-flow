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

    const { reason } = await request.json();

    if (!reason || reason.trim() === '') {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
    }

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

    // Update estimate rejection status
    const { error: updateError } = await supabaseAdmin
      .from('estimates')
      .update({
        approval_status: 'rejected',
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejection_reason: reason || '',
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
      metadata: { reason: reason || '' }
    });

    // Fetch user email for notification (try auth email first, then business_email)
    let userEmail = '';
    try {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(estimate.user_id);
      userEmail = authUser?.user?.email || '';
    } catch (error) {
      console.error('Error fetching user email from auth:', error);
    }

    // If no auth email, try business_email from settings
    if (!userEmail) {
      const { data: settingsData } = await supabaseAdmin
        .from('user_settings')
        .select('business_email, email_from_address')
        .eq('user_id', estimate.user_id)
        .single();
      userEmail = settingsData?.business_email || '';
    }

    // Fetch email_from_address for from address
    const { data: settings } = await supabaseAdmin
      .from('user_settings')
      .select('email_from_address')
      .eq('user_id', estimate.user_id)
      .single();

    // Send notification email to user if we have an email
    if (userEmail) {
      if (!process.env.RESEND_API_KEY) {
        console.error('RESEND_API_KEY is not configured. Cannot send rejection notification email.');
      } else {
        try {
          // Use email_from_address if available, otherwise use Resend default
          const fromAddress = settings?.email_from_address || 'onboarding@resend.dev';
          
          console.log('Sending rejection notification email:', {
            to: userEmail,
            from: fromAddress,
            estimateNumber: estimate.estimate_number
          });

          const emailResult = await resend.emails.send({
            from: fromAddress,
            to: userEmail,
            subject: `Estimate ${estimate.estimate_number} Rejected`,
            html: `
              <!DOCTYPE html>
              <html>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #ef4444;">Estimate Rejected</h2>
                  <p>Your estimate <strong>${estimate.estimate_number}</strong> has been rejected by <strong>${estimate.clients?.name || 'Client'}</strong>.</p>
                  <p><strong>Reason:</strong> ${reason}</p>
                  <p>You may want to revise the estimate and send a new one.</p>
                </body>
              </html>
            `,
          });

          console.log('Rejection notification email sent successfully:', emailResult);
        } catch (emailError: any) {
          console.error('Error sending rejection notification:', emailError);
          console.error('Email error details:', {
            message: emailError?.message,
            name: emailError?.name,
            stack: emailError?.stack
          });
          // Don't fail the request if email fails, but log it
        }
      }
    } else {
      console.warn('No user email found for estimate rejection notification. User ID:', estimate.user_id);
    }

    return NextResponse.json({ success: true, message: 'Estimate rejected' }, { status: 200 });
  } catch (error: any) {
    console.error('Error rejecting estimate:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

