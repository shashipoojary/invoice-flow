import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { reminderId, status, failureReason } = await request.json();

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

// Webhook endpoint for email service providers
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
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
      return NextResponse.json({ error: 'No reminder ID found in webhook' }, { status: 400 });
    }

    // Find reminder by email_id
    const { data: reminder, error: findError } = await supabaseAdmin
      .from('invoice_reminders')
      .select('id')
      .eq('email_id', reminderId)
      .single();

    if (findError || !reminder) {
      console.error('Reminder not found for email ID:', reminderId);
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
      console.error('Error updating reminder status:', updateError);
      return NextResponse.json({ error: 'Failed to update reminder status' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Reminder status updated from webhook'
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
