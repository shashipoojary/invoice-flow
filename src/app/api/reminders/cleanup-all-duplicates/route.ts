import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Aggressive cleanup of ALL duplicate reminders
 * This removes duplicates keeping only the most recent one per invoice+type+status
 */
export async function POST(request: NextRequest) {
  try {
    // Get ALL reminders
    const { data: allReminders, error: fetchError } = await supabaseAdmin
      .from('invoice_reminders')
      .select('id, invoice_id, reminder_type, reminder_status, created_at, sent_at')
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
      const key = `${reminder.invoice_id}-${reminder.reminder_type || 'friendly'}-${reminder.reminder_status || 'sent'}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(reminder);
    }

    // Find duplicates (groups with more than 1 reminder)
    const duplicateIds: string[] = [];
    const summary: Record<string, number> = {};
    
    for (const [key, reminders] of grouped.entries()) {
      if (reminders.length > 1) {
        // Sort by created_at descending (most recent first)
        reminders.sort((a, b) => {
          const dateA = new Date(a.created_at || a.sent_at || 0).getTime();
          const dateB = new Date(b.created_at || b.sent_at || 0).getTime();
          return dateB - dateA; // Descending - most recent first
        });
        
        // Keep the first (most recent), delete all others
        const duplicates = reminders.slice(1);
        duplicateIds.push(...duplicates.map(r => r.id));
        
        const statusKey = reminders[0].reminder_status || 'sent';
        summary[statusKey] = (summary[statusKey] || 0) + duplicates.length;
        
        console.log(`Found ${duplicates.length} duplicate(s) for ${key} - keeping most recent, removing others`);
      }
    }

    if (duplicateIds.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No duplicates found',
        duplicatesRemoved: 0,
        summary: {}
      });
    }

    // Delete duplicates in batches (PostgreSQL has limits on IN clause)
    const batchSize = 100;
    let deletedCount = 0;
    
    for (let i = 0; i < duplicateIds.length; i += batchSize) {
      const batch = duplicateIds.slice(i, i + batchSize);
      const { error: deleteError } = await supabaseAdmin
        .from('invoice_reminders')
        .delete()
        .in('id', batch);

      if (deleteError) {
        console.error(`Error deleting batch ${i / batchSize + 1}:`, deleteError);
      } else {
        deletedCount += batch.length;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Cleaned up ${deletedCount} duplicate reminder(s)`,
      duplicatesRemoved: deletedCount,
      summary
    });

  } catch (error) {
    console.error('Error in cleanup-all-duplicates:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

