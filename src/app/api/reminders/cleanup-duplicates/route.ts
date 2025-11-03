import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Cleanup duplicate reminders for invoices
 * This endpoint removes duplicate scheduled/failed reminders, keeping only the most recent one per invoice+type
 */
export async function POST(request: NextRequest) {
  try {
    // Get all reminders grouped by invoice_id, reminder_type, and reminder_status
    const { data: allReminders, error: fetchError } = await supabaseAdmin
      .from('invoice_reminders')
      .select('id, invoice_id, reminder_type, reminder_status, created_at')
      .in('reminder_status', ['scheduled', 'failed'])
      .order('invoice_id')
      .order('reminder_type')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching reminders:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 });
    }

    if (!allReminders || allReminders.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No reminders to clean up',
        duplicatesRemoved: 0
      });
    }

    // Group by invoice_id + reminder_type + reminder_status
    const grouped = new Map<string, any[]>();
    
    for (const reminder of allReminders) {
      const key = `${reminder.invoice_id}-${reminder.reminder_type}-${reminder.reminder_status}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(reminder);
    }

    // Find duplicates (groups with more than 1 reminder)
    const duplicateIds: string[] = [];
    
    for (const [key, reminders] of grouped.entries()) {
      if (reminders.length > 1) {
        // Keep the most recent one (first in array since we ordered by created_at DESC)
        // Delete all others
        const duplicates = reminders.slice(1);
        duplicateIds.push(...duplicates.map(r => r.id));
        console.log(`Found ${duplicates.length} duplicate(s) for ${key} - keeping most recent, removing others`);
      }
    }

    if (duplicateIds.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No duplicates found',
        duplicatesRemoved: 0
      });
    }

    // Delete duplicates
    const { error: deleteError } = await supabaseAdmin
      .from('invoice_reminders')
      .delete()
      .in('id', duplicateIds);

    if (deleteError) {
      console.error('Error deleting duplicates:', deleteError);
      return NextResponse.json({ 
        error: 'Failed to delete duplicates',
        details: deleteError.message
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Cleaned up ${duplicateIds.length} duplicate reminder(s)`,
      duplicatesRemoved: duplicateIds.length
    });

  } catch (error) {
    console.error('Error in cleanup-duplicates:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

