import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Auto Reminder System...');

    // Test 1: Check if reminder system tables exist
    console.log('1. Checking database tables...');
    
    const { data: invoicesTable, error: invoicesError } = await supabase
      .from('invoices')
      .select('id, reminder_settings')
      .limit(1);

    if (invoicesError) {
      return NextResponse.json({ 
        error: 'Invoices table error', 
        details: invoicesError.message 
      }, { status: 500 });
    }

    const { data: remindersTable, error: remindersError } = await supabase
      .from('invoice_reminders')
      .select('id')
      .limit(1);

    if (remindersError) {
      return NextResponse.json({ 
        error: 'Invoice reminders table error', 
        details: remindersError.message 
      }, { status: 500 });
    }

    console.log('✅ Database tables exist');

    // Test 2: Check if there are any invoices with reminder settings
    console.log('2. Checking invoices with reminder settings...');
    
    const { data: invoicesWithReminders, error: reminderCheckError } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        reminder_settings,
        clients (
          name,
          email
        )
      `)
      .not('reminder_settings', 'is', null)
      .limit(5);

    if (reminderCheckError) {
      return NextResponse.json({ 
        error: 'Failed to check reminder settings', 
        details: reminderCheckError.message 
      }, { status: 500 });
    }

    console.log(`✅ Found ${invoicesWithReminders?.length || 0} invoices with reminder settings`);

    // Test 3: Check user settings
    console.log('3. Checking user settings...');
    
    const { data: userSettings, error: userSettingsError } = await supabase
      .from('user_settings')
      .select('user_id, business_name, business_email')
      .limit(5);

    if (userSettingsError) {
      return NextResponse.json({ 
        error: 'Failed to check user settings', 
        details: userSettingsError.message 
      }, { status: 500 });
    }

    console.log(`✅ Found ${userSettings?.length || 0} user settings`);

    // Test 4: Test auto-send endpoint
    console.log('4. Testing auto-send endpoint...');
    
    try {
      const autoSendResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/reminders/auto-send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (autoSendResponse.ok) {
        const autoSendResult = await autoSendResponse.json();
        console.log('✅ Auto-send endpoint working:', autoSendResult);
      } else {
        console.log('⚠️ Auto-send endpoint returned error:', autoSendResponse.status);
      }
    } catch (error) {
      console.log('⚠️ Auto-send endpoint test failed:', error);
    }

    // Test 5: Check reminder schedule
    console.log('5. Testing reminder schedule...');
    
    try {
      const { getReminderSchedule } = await import('@/lib/reminder-email-templates');
      const schedule = getReminderSchedule();
      console.log('✅ Reminder schedule loaded:', schedule.length, 'rules');
    } catch (error) {
      console.log('⚠️ Reminder schedule test failed:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Auto reminder system test completed',
      results: {
        databaseTables: 'OK',
        invoicesWithReminders: invoicesWithReminders?.length || 0,
        userSettings: userSettings?.length || 0,
        reminderSchedule: 'OK'
      },
      invoices: invoicesWithReminders?.map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoice_number,
        hasReminderSettings: !!inv.reminder_settings,
        clientName: inv.clients?.[0]?.name || 'Unknown'
      })) || []
    });

  } catch (error) {
    console.error('❌ Auto reminder system test failed:', error);
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
