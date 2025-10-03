import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('invoices')
      .select('id, invoiceNumber, status, dueDate')
      .limit(1);

    if (testError) {
      console.error('Database test error:', testError);
      return NextResponse.json({ 
        error: 'Database connection failed', 
        details: testError.message 
      }, { status: 500 });
    }

    // Test if reminder columns exist
    const { data: columnTest, error: columnError } = await supabase
      .from('invoices')
      .select('id, reminder_count, last_reminder_sent')
      .limit(1);

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      testData: testData,
      columnTest: columnTest,
      columnError: columnError?.message || 'No error',
      reminderColumnsExist: !columnError
    });

  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
