import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Shared webhook handler for Resend webhooks
async function handleWebhook(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📥 Webhook received:', { type: body.type, email_id: body.data?.email_id });
    
    // Handle different webhook formats (Resend, SendGrid, etc.)
    let reminderId = null;
    let status = 'sent';
    let failureReason = null;

    // Resend webhook format
    if (body.type === 'email.delivered') {
      status = 'delivered';
      reminderId = body.data?.email_id;
    } else if (body.type === 'email.bounced') {
      status = 'bounced';
      failureReason = body.data?.reason || 'Email bounced';
      reminderId = body.data?.email_id;
    } else if (body.type === 'email.complained') {
      status = 'failed';
      failureReason = 'Email marked as spam';
      reminderId = body.data?.email_id;
    } else if (body.type === 'email.failed') {
      status = 'failed';
      failureReason = body.data?.reason || 'Email delivery failed';
      reminderId = body.data?.email_id;
    }

    if (!reminderId) {
      console.error('❌ No email_id found in webhook:', body);
      return NextResponse.json({ error: 'No reminder ID found in webhook' }, { status: 400 });
    }

    // Find reminder by email_id
    const { data: reminder, error: findError } = await supabaseAdmin
      .from('invoice_reminders')
      .select('id')
      .eq('email_id', reminderId)
      .single();

    if (findError || !reminder) {
      console.error('❌ Reminder not found for email ID:', reminderId);
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 });
    }

    // Update reminder status
    const { error: updateError } = await supabaseAdmin
      .from('invoice_reminders')
      .update({
        reminder_status: status,
        failure_reason: failureReason,
        updated_at: new Date().toISOString()
      })
      .eq('id', reminder.id);

    if (updateError) {
      console.error('❌ Error updating reminder status:', updateError);
      return NextResponse.json({ error: 'Failed to update reminder status' }, { status: 500 });
    }

    console.log('✅ Webhook processed successfully:', { reminderId: reminder.id, status });
    return NextResponse.json({ 
      success: true, 
      message: 'Reminder status updated from webhook'
    });

  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST endpoint - handles both webhooks (from Resend) and manual updates
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // If it has 'type' field, it's a webhook from Resend
    if (body.type) {
      return handleWebhook(request);
    }
    
    // Otherwise, it's a manual update (existing POST handler)
    const { reminderId, status, failureReason } = body;

    if (!reminderId || !status) {
      return NextResponse.json({ error: 'Reminder ID and status are required' }, { status: 400 });
    }

    // Validate status
    const validStatuses = ['sent', 'delivered', 'failed', 'bounced', 'scheduled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Update reminder status
    const { data, error } = await supabaseAdmin
      .from('invoice_reminders')
      .update({
        reminder_status: status,
        failure_reason: failureReason || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', reminderId)
      .select()
      .single();

    if (error) {
      console.error('Error updating reminder status:', error);
      return NextResponse.json({ error: 'Failed to update reminder status' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Reminder status updated successfully',
      reminder: data
    });

  } catch (error) {
    console.error('Error updating reminder status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT endpoint - also handles webhooks (for compatibility)
export async function PUT(request: NextRequest) {
  return handleWebhook(request);
}
