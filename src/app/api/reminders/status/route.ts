import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Shared webhook handler for Resend webhooks
export async function handleWebhook(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📥 Webhook received:', JSON.stringify({ 
      type: body.type, 
      email_id: body.data?.email_id,
      data_keys: body.data ? Object.keys(body.data) : []
    }, null, 2));
    
    // Handle different webhook formats (Resend, SendGrid, etc.)
    let reminderId = null;
    let status = 'sent';
    let failureReason = null;

    // Resend webhook format
    // Resend sends email_id in body.data.email_id for webhooks
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
      console.error('❌ No email_id found in webhook. Full body:', JSON.stringify(body, null, 2));
      return NextResponse.json({ 
        error: 'No reminder ID found in webhook',
        received_data: {
          type: body.type,
          has_data: !!body.data,
          data_keys: body.data ? Object.keys(body.data) : []
        }
      }, { status: 400 });
    }

    console.log('🔍 Looking up reminder with email_id:', reminderId);

    // Find reminder by email_id (exact match first)
    let { data: reminder, error: findError } = await supabaseAdmin
      .from('invoice_reminders')
      .select('id, email_id, reminder_status')
      .eq('email_id', reminderId)
      .single();

    // If not found, try to find by partial match (in case of formatting differences)
    if (findError || !reminder) {
      console.log('⚠️ Exact match not found, trying alternative lookup...');
      const { data: alternativeReminders, error: altError } = await supabaseAdmin
        .from('invoice_reminders')
        .select('id, email_id, reminder_status')
        .ilike('email_id', `%${reminderId}%`)
        .limit(5);
      
      if (altError) {
        console.error('❌ Error in alternative lookup:', altError);
      } else if (alternativeReminders && alternativeReminders.length > 0) {
        console.log('✅ Found reminder with partial match:', alternativeReminders[0]);
        reminder = alternativeReminders[0];
        findError = null;
      }
    }

    // If still not found, log debugging info
    if (findError && findError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('❌ Database error finding reminder:', findError);
      const { data: allReminders } = await supabaseAdmin
        .from('invoice_reminders')
        .select('id, email_id, reminder_status')
        .limit(10);
      console.log('📋 Recent reminders (for debugging):', allReminders?.map(r => ({ id: r.id, email_id: r.email_id })));
      
      return NextResponse.json({ 
        error: 'Database error finding reminder',
        details: findError.message,
        email_id_searched: reminderId
      }, { status: 500 });
    }

    if (!reminder) {
      console.error('❌ Reminder not found for email ID:', reminderId);
      // Check if there are any reminders at all
      const { count } = await supabaseAdmin
        .from('invoice_reminders')
        .select('*', { count: 'exact', head: true });
      console.log('📊 Total reminders in database:', count);
      
      return NextResponse.json({ 
        error: 'Reminder not found',
        email_id_searched: reminderId,
        total_reminders: count
      }, { status: 404 });
    }

    console.log('✅ Found reminder:', { id: reminder.id, current_status: reminder.reminder_status });

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
      return NextResponse.json({ 
        error: 'Failed to update reminder status',
        details: updateError.message
      }, { status: 500 });
    }

    console.log('✅ Webhook processed successfully:', { reminderId: reminder.id, status, email_id: reminderId });
    return NextResponse.json({ 
      success: true, 
      message: 'Reminder status updated from webhook',
      reminder_id: reminder.id,
      status: status
    });

  } catch (error: any) {
    console.error('❌ Error processing webhook:', error);
    console.error('❌ Error stack:', error?.stack);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error?.message || 'Unknown error',
      type: error?.name || 'Error'
    }, { status: 500 });
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
