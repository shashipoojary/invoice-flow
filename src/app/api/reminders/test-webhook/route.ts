import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Test endpoint to simulate a Resend webhook call
 * This allows you to test the webhook without waiting for Resend to send it
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email_id, event_type = 'email.delivered' } = body;

    // If email_id not provided, get the most recent reminder with an email_id
    let targetEmailId = email_id;

    if (!targetEmailId) {
      console.log('📋 No email_id provided, fetching most recent reminder...');
      const { data: recentReminder, error: fetchError } = await supabaseAdmin
        .from('invoice_reminders')
        .select('id, email_id, reminder_status, sent_at')
        .not('email_id', 'is', null)
        .order('sent_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError || !recentReminder) {
        return NextResponse.json({
          error: 'No reminders found with email_id',
          suggestion: 'Send a reminder first, then test the webhook',
          details: fetchError?.message
        }, { status: 404 });
      }

      targetEmailId = recentReminder.email_id;
      console.log('✅ Found recent reminder:', {
        id: recentReminder.id,
        email_id: targetEmailId,
        current_status: recentReminder.reminder_status
      });
    }

    // Simulate Resend webhook payload
    const webhookPayload = {
      type: event_type,
      data: {
        email_id: targetEmailId
      }
    };

    console.log('🧪 Simulating webhook call with payload:', webhookPayload);

    // Call the webhook handler directly by importing it
    // We'll create a new request with the webhook payload
    const webhookUrl = new URL('/api/reminders/status', request.url);
    const mockRequest = new NextRequest(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload)
    });

    // Import and call the webhook handler
    const { handleWebhook } = await import('../status/route');
    const webhookResponse = await handleWebhook(mockRequest);
    const webhookResult = await webhookResponse.json();

    return NextResponse.json({
      success: webhookResponse.ok,
      message: 'Webhook test completed',
      test_details: {
        email_id_used: targetEmailId,
        event_type: event_type,
        webhook_payload: webhookPayload
      },
      webhook_response: {
        status: webhookResponse.status,
        status_text: webhookResponse.statusText,
        body: webhookResult
      }
    });

  } catch (error: any) {
    console.error('❌ Error testing webhook:', error);
    return NextResponse.json({
      error: 'Failed to test webhook',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// GET endpoint to list recent reminders for testing
export async function GET() {
  try {
    const { data: reminders, error } = await supabaseAdmin
      .from('invoice_reminders')
      .select('id, email_id, reminder_status, sent_at, reminder_type')
      .not('email_id', 'is', null)
      .order('sent_at', { ascending: false })
      .limit(10);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Recent reminders with email_id',
      reminders: reminders || [],
      usage: {
        test_webhook: 'POST /api/reminders/test-webhook with { "email_id": "..." } or empty body to use most recent',
        test_delivered: 'POST /api/reminders/test-webhook with { "event_type": "email.delivered" }',
        test_bounced: 'POST /api/reminders/test-webhook with { "event_type": "email.bounced" }'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

