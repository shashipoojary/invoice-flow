import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-middleware';

// POST - Write off amount and mark invoice as paid
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: invoiceId } = await params;
    const { writeOffAmount, notes } = await request.json();

    if (!writeOffAmount || writeOffAmount < 0) {
      return NextResponse.json({ error: 'Valid write-off amount is required' }, { status: 400 });
    }

    // Verify invoice belongs to user
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .select('id, status, total, due_date, late_fees')
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Check if invoice is already marked as paid
    if (invoice.status === 'paid') {
      return NextResponse.json({ 
        error: 'Invoice is already marked as fully paid.' 
      }, { status: 400 });
    }

    // Get existing payments to calculate total paid
    const { data: existingPayments } = await supabaseAdmin
      .from('invoice_payments')
      .select('amount')
      .eq('invoice_id', invoiceId);

    const totalPaid = (existingPayments || []).reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
    const remainingBalance = invoice.total - totalPaid;
    
    // Calculate late fees if invoice is overdue
    let lateFeesAmount = 0;
    
    if (invoice.due_date && invoice.late_fees) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(invoice.due_date);
      dueDate.setHours(0, 0, 0, 0);
      const isOverdue = dueDate < today && invoice.status !== 'paid';
      
      if (isOverdue) {
        try {
          const lateFeesSettings = typeof invoice.late_fees === 'string' 
            ? JSON.parse(invoice.late_fees) 
            : invoice.late_fees;
          
          if (lateFeesSettings && lateFeesSettings.enabled) {
            const daysOverdue = Math.round((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
            const gracePeriod = lateFeesSettings.gracePeriod || 0;
            
            if (daysOverdue > gracePeriod) {
              if (lateFeesSettings.type === 'percentage') {
                lateFeesAmount = remainingBalance * ((lateFeesSettings.amount || 0) / 100);
              } else if (lateFeesSettings.type === 'fixed') {
                lateFeesAmount = lateFeesSettings.amount || 0;
              }
            }
          }
        } catch (e) {
          console.error('Error parsing late fees:', e);
        }
      }
    }
    
    const totalPayable = invoice.total + lateFeesAmount;
    const totalOwed = totalPayable - totalPaid;

    // Validate write-off amount
    if (writeOffAmount > totalOwed) {
      return NextResponse.json({ 
        error: `Write-off amount cannot exceed total owed (including late fees) of $${totalOwed.toFixed(2)}` 
      }, { status: 400 });
    }

    // Update invoice with write-off amount and mark as paid
    const { data: updatedInvoice, error: updateError } = await supabaseAdmin
      .from('invoices')
      .update({ 
        status: 'paid',
        write_off_amount: parseFloat(writeOffAmount.toString()),
        write_off_notes: notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating invoice:', updateError);
      return NextResponse.json({ error: 'Failed to write off invoice' }, { status: 500 });
    }

    // Log paid event with write-off
    try {
      await supabaseAdmin.from('invoice_events').insert({ 
        invoice_id: invoiceId, 
        type: 'paid',
        metadata: { writeOffAmount: parseFloat(writeOffAmount.toString()), notes: notes || null }
      });
    } catch {}

    // Cancel scheduled reminders
    try {
      await supabaseAdmin
        .from('invoice_reminders')
        .update({
          reminder_status: 'cancelled',
          failure_reason: 'Invoice marked as paid with write-off - scheduled reminders cancelled'
        })
        .eq('invoice_id', invoiceId)
        .eq('reminder_status', 'scheduled');
    } catch (reminderError) {
      console.error('Error updating reminders:', reminderError);
    }

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
      writeOffAmount: parseFloat(writeOffAmount.toString()),
      totalPaid,
      totalOwed,
      lateFeesAmount
    });

  } catch (error) {
    console.error('Error in write-off:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}




