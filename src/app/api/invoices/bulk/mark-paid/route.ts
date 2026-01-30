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

    const { invoiceIds, paymentMethods } = await request.json();

    if (!paymentMethods || typeof paymentMethods !== 'object') {
      return NextResponse.json({ error: 'Payment methods object is required' }, { status: 400 });
    }

    // Validate that all invoice IDs have payment methods
    const missingMethods = invoiceIds.filter((id: string) => !paymentMethods[id] || !paymentMethods[id].trim());
    if (missingMethods.length > 0) {
      return NextResponse.json({ 
        error: `Payment method is required for all invoices. Missing for: ${missingMethods.join(', ')}` 
      }, { status: 400 });
    }

    if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return NextResponse.json({ error: 'invoiceIds array is required' }, { status: 400 });
    }

    // Verify all invoices belong to user and are not already paid
    const { data: invoices, error: invoicesError } = await supabaseAdmin
      .from('invoices')
      .select('id, invoice_number, status, total, due_date, late_fees')
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const paymentDate = new Date().toISOString().split('T')[0];
    const results = [];

    // Process each invoice individually to calculate remaining balance and late fees
    for (const invoice of invoices) {
      try {
        // Get existing payments to calculate total paid
        const { data: existingPayments } = await supabaseAdmin
          .from('invoice_payments')
          .select('amount')
          .eq('invoice_id', invoice.id);

        const totalPaid = (existingPayments || []).reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
        const remainingBalance = invoice.total - totalPaid;
        
        // Calculate late fees if invoice is overdue
        let lateFeesAmount = 0;
        
        if (invoice.due_date && invoice.late_fees) {
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
                    // Calculate late fee on remaining balance (after partial payments)
                    lateFeesAmount = remainingBalance * ((lateFeesSettings.amount || 0) / 100);
                  } else if (lateFeesSettings.type === 'fixed') {
                    lateFeesAmount = lateFeesSettings.amount || 0;
                  }
                }
              }
            } catch (e) {
              console.error('Error parsing late fees for invoice', invoice.id, ':', e);
            }
          }
        }
        
        // Calculate amount to pay: remaining balance + late fees
        const amountToPay = remainingBalance + lateFeesAmount;

        // Only create payment if there's an amount to pay
        if (amountToPay > 0) {
          // Get payment method for this specific invoice
          const invoicePaymentMethod = paymentMethods[invoice.id] || 'Bulk Mark as Paid';
          
          // Record payment for remaining balance + late fees
          const { error: paymentError } = await supabaseAdmin
            .from('invoice_payments')
            .insert({
              invoice_id: invoice.id,
              user_id: user.id,
              amount: amountToPay,
              payment_date: paymentDate,
              payment_method: invoicePaymentMethod,
              notes: 'Marked as paid via bulk action'
            });

          if (paymentError) {
            console.error(`Error recording payment for invoice ${invoice.id}:`, paymentError);
            results.push({ invoiceId: invoice.id, invoiceNumber: invoice.invoice_number, success: false, error: 'Failed to record payment' });
            continue;
          }
        }

        // Update invoice status to 'paid'
        const { error: updateError } = await supabaseAdmin
          .from('invoices')
          .update({ 
            status: 'paid',
            updated_at: new Date().toISOString()
          })
          .eq('id', invoice.id);

        if (updateError) {
          console.error(`Error updating invoice ${invoice.id}:`, updateError);
          results.push({ invoiceId: invoice.id, invoiceNumber: invoice.invoice_number, success: false, error: 'Failed to update status' });
          continue;
        }

        results.push({ invoiceId: invoice.id, invoiceNumber: invoice.invoice_number, success: true, amountPaid: amountToPay });
      } catch (error) {
        console.error(`Error processing invoice ${invoice.id}:`, error);
        results.push({ invoiceId: invoice.id, invoiceNumber: invoice.invoice_number, success: false, error: 'Processing error' });
      }
    }

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    if (successful.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to mark any invoices as paid',
        details: failed
      }, { status: 500 });
    }

    // Log events for successfully processed invoices
    const events = successful.map(result => ({
      invoice_id: result.invoiceId,
      user_id: user.id,
      type: 'paid',
      metadata: { bulk: true }
    }));

    if (events.length > 0) {
      try {
        await supabaseAdmin.from('invoice_events').insert(events);
      } catch (eventError) {
        console.error('Error logging events:', eventError);
        // Don't fail the request if event logging fails
      }
    }

    // Cancel scheduled reminders for successfully processed invoices
    if (successful.length > 0) {
      try {
        await supabaseAdmin
          .from('invoice_reminders')
          .update({
            reminder_status: 'cancelled',
            failure_reason: 'Invoice marked as paid via bulk action - scheduled reminders cancelled'
          })
          .in('invoice_id', successful.map(r => r.invoiceId))
          .eq('reminder_status', 'scheduled');
      } catch (reminderError) {
        console.error('Error updating reminders:', reminderError);
        // Don't fail the request if reminder update fails
      }
    }

    return NextResponse.json({
      success: true,
      count: successful.length,
      failed: failed.length,
      invoiceNumbers: successful.map(r => r.invoiceNumber),
      results: results
    });

  } catch (error) {
    console.error('Error in bulk mark paid:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}




