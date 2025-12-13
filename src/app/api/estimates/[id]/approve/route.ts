import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/supabase';
import { getBaseUrlFromRequest } from '@/lib/get-base-url';
import { generateEstimateApprovalEmailTemplate } from '@/lib/email-templates';
import { isOwnerRequest } from '@/lib/estimate-owner-detection';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let comment = '';
    try {
      const body = await request.json();
      comment = body.comment || '';
    } catch (e) {
      // Request body might be empty, that's okay
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

    // CRITICAL: Prevent owner from approving their own estimate
    // This works even in incognito mode by checking referer and other signals
    const isOwner = await isOwnerRequest(request, estimate.user_id);
    if (isOwner) {
      console.warn(`[SECURITY] Owner attempted to approve their own estimate. Estimate ID: ${id}, User ID: ${estimate.user_id}`);
      return NextResponse.json({ 
        error: 'You cannot approve your own estimate. Only clients can approve estimates.' 
      }, { status: 403 });
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
      const { data: settings } = await supabaseAdmin
        .from('user_settings')
        .select('business_email, email_from_address')
        .eq('user_id', estimate.user_id)
        .single();
      userEmail = settings?.business_email || '';
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
        console.error('RESEND_API_KEY is not configured. Cannot send approval notification email.');
      } else {
        try {
          // Get base URL for dashboard link
          const baseUrl = getBaseUrlFromRequest(request);
          const dashboardUrl = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://invoice-flow-vert.vercel.app';
          
          // Generate clean, modern email template
          const emailHtml = generateEstimateApprovalEmailTemplate(
            estimate.estimate_number,
            estimate.clients?.name || 'Client',
            comment || null,
            dashboardUrl
          );

          // Use email_from_address if available, otherwise use Resend default
          const fromAddress = settings?.email_from_address || 'onboarding@resend.dev';

          console.log('Sending approval notification email:', {
            to: userEmail,
            from: fromAddress,
            estimateNumber: estimate.estimate_number
          });

          const emailResult = await resend.emails.send({
            from: fromAddress,
            to: userEmail,
            subject: `Estimate ${estimate.estimate_number} Approved`,
            html: emailHtml,
          });

          console.log('Approval notification email sent successfully:', emailResult);
        } catch (emailError: any) {
          console.error('Error sending approval notification:', emailError);
          console.error('Email error details:', {
            message: emailError?.message,
            name: emailError?.name,
            stack: emailError?.stack
          });
          // Don't fail the request if email fails, but log it
        }
      }
    } else {
      console.warn('No user email found for estimate approval notification. User ID:', estimate.user_id);
    }

    return NextResponse.json({ success: true, message: 'Estimate approved successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error approving estimate:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

