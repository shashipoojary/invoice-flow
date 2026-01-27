import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-middleware';

// POST - Bulk mark invoices as paid
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invoiceIds } = await request.json();

    if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return NextResponse.json({ error: 'invoiceIds array is required' }, { status: 400 });
    }

    // Verify all invoices belong to user and are not already paid
    const { data: invoices, error: invoicesError } = await supabaseAdmin
      .from('invoices')
      .select('id, invoice_number, status')
      .eq('user_id', user.id)
      .in('id', invoiceIds)
      .neq('status', 'paid');

    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError);
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
    }

    if (!invoices || invoices.length === 0) {
      return NextResponse.json({ error: 'No valid invoices found to mark as paid' }, { status: 400 });
    }

    // Update all invoices to 'paid' status
    const { error: updateError } = await supabaseAdmin
      .from('invoices')
      .update({ 
        status: 'paid',
        updated_at: new Date().toISOString()
      })
      .in('id', invoices.map(inv => inv.id));

    if (updateError) {
      console.error('Error updating invoices:', updateError);
      return NextResponse.json({ error: 'Failed to mark invoices as paid' }, { status: 500 });
    }

    // Log events for each invoice
    const events = invoices.map(invoice => ({
      invoice_id: invoice.id,
      user_id: user.id,
      type: 'paid',
      metadata: { bulk: true }
    }));

    try {
      await supabaseAdmin.from('invoice_events').insert(events);
    } catch (eventError) {
      console.error('Error logging events:', eventError);
      // Don't fail the request if event logging fails
    }

    // Cancel scheduled reminders for all invoices
    try {
      await supabaseAdmin
        .from('invoice_reminders')
        .update({
          reminder_status: 'cancelled',
          failure_reason: 'Invoice marked as paid via bulk action - scheduled reminders cancelled'
        })
        .in('invoice_id', invoices.map(inv => inv.id))
        .eq('reminder_status', 'scheduled');
    } catch (reminderError) {
      console.error('Error updating reminders:', reminderError);
      // Don't fail the request if reminder update fails
    }

    return NextResponse.json({
      success: true,
      count: invoices.length,
      invoiceNumbers: invoices.map(inv => inv.invoice_number)
    });

  } catch (error) {
    console.error('Error in bulk mark paid:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}



