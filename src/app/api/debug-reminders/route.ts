import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get all reminders for debugging
    const { data: reminders, error } = await supabaseAdmin
      .from('invoice_reminders')
      .select(`
        *,
        invoices (
          invoice_number,
          status,
          reminder_settings,
          payment_terms,
          updated_at
        )
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      reminders,
      count: reminders?.length || 0
    });

  } catch (error) {
    console.error('Debug reminders error:', error);
    return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 });
  }
}

