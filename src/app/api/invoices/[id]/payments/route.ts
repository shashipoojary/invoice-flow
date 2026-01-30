import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-middleware';

// GET - Fetch all payments for an invoice
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: invoiceId } = await params;

    // Verify invoice belongs to user
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .select('id, status, total')
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Fetch all payments for this invoice
    const { data: payments, error: paymentsError } = await supabaseAdmin
      .from('invoice_payments')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('payment_date', { ascending: false });

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError);
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
    }

    // Calculate total paid and remaining balance
    const totalPaid = (payments || []).reduce((sum, payment) => sum + parseFloat(payment.amount.toString()), 0);
    const remainingBalance = invoice.total - totalPaid;
    
    // Calculate late fees if invoice is overdue
    let lateFeesAmount = 0;
    let totalPayable = invoice.total;
    
    // Fetch invoice with late fees data
    const { data: invoiceWithLateFees } = await supabaseAdmin
      .from('invoices')
      .select('due_date, late_fees, status')
      .eq('id', invoiceId)
      .single();
    
    if (invoiceWithLateFees && invoiceWithLateFees.due_date && invoiceWithLateFees.late_fees) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(invoiceWithLateFees.due_date);
      dueDate.setHours(0, 0, 0, 0);
      const isOverdue = dueDate < today && invoiceWithLateFees.status !== 'paid';
      
      if (isOverdue) {
        try {
          const lateFeesSettings = typeof invoiceWithLateFees.late_fees === 'string' 
            ? JSON.parse(invoiceWithLateFees.late_fees) 
            : invoiceWithLateFees.late_fees;
          
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
              // Total payable = invoice.total + late fees (for reference)
              // But what's actually owed = remainingBalance + lateFeesAmount
              totalPayable = invoice.total + lateFeesAmount;
            }
          }
        } catch (e) {
          console.error('Error parsing late fees:', e);
        }
      }
    }
    
    // What's actually remaining = remaining balance + late fees
    const finalRemainingBalance = Math.max(0, remainingBalance + lateFeesAmount);

    return NextResponse.json({
      payments: payments || [],
      totalPaid,
      remainingBalance: finalRemainingBalance,
      invoiceTotal: invoice.total,
      lateFeesAmount,
      totalPayable
    });

  } catch (error) {
    console.error('Error in GET payments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add a new payment
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
    const { amount, paymentDate, paymentMethod, notes } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid payment amount is required' }, { status: 400 });
    }

    // Verify invoice belongs to user and is not already fully paid
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
        error: 'Invoice is already marked as fully paid. Cannot add partial payments.' 
      }, { status: 400 });
    }

    // Get existing payments to calculate total
    const { data: existingPayments } = await supabaseAdmin
      .from('invoice_payments')
      .select('amount')
      .eq('invoice_id', invoiceId);

    const totalPaid = (existingPayments || []).reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
    const remainingBalance = invoice.total - totalPaid;
    
    // Calculate late fees if invoice is overdue
    let lateFeesAmount = 0;
    let totalPayable = invoice.total;
    
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
                // For percentage-based: calculate late fee on remaining balance (after partial payments)
                lateFeesAmount = remainingBalance * ((lateFeesSettings.amount || 0) / 100);
              } else if (lateFeesSettings.type === 'fixed') {
                // For fixed: late fee is a fixed amount regardless of partial payments
                lateFeesAmount = lateFeesSettings.amount || 0;
              }
            }
          }
        } catch (e) {
          console.error('Error parsing late fees:', e);
        }
      }
    }
    
    // Calculate total payable: remaining balance + late fees (what's actually owed now)
    // For fixed late fees: lateFeesAmount is fixed
    // For percentage late fees: lateFeesAmount is calculated on remaining balance
    const actualTotalPayable = remainingBalance + lateFeesAmount;
    
    const newTotalPaid = totalPaid + parseFloat(amount.toString());

    // Check if payment would exceed what's actually owed (remaining balance + late fees)
    if (parseFloat(amount.toString()) > actualTotalPayable) {
      return NextResponse.json({ 
        error: `Payment amount exceeds total payable (including late fees). Maximum payment allowed: $${actualTotalPayable.toFixed(2)}` 
      }, { status: 400 });
    }

    // Insert payment
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('invoice_payments')
      .insert({
        invoice_id: invoiceId,
        user_id: user.id,
        amount: parseFloat(amount.toString()),
        payment_date: paymentDate || new Date().toISOString().split('T')[0],
        payment_method: paymentMethod || null,
        notes: notes || null
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment:', paymentError);
      return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
    }

    // Handle scheduled reminders based on payment status
    // Partial payments should affect scheduled reminders (but NOT sent or cancelled reminders)
    try {
      // Get invoice status to check if it's sent/cancelled (these should NOT be affected)
      const { data: invoiceData } = await supabaseAdmin
        .from('invoices')
        .select('status')
        .eq('id', invoiceId)
        .single();

      const invoiceStatus = invoiceData?.status;

      // Calculate new remaining balance after payment
      const newRemainingBalance = invoice.total - newTotalPaid;
      
      // Recalculate late fees after payment (for percentage-based fees, recalculate on new remaining balance)
      let finalLateFees = lateFeesAmount;
      
      if (invoice.due_date && invoice.late_fees && lateFeesAmount > 0) {
        try {
          const lateFeesSettings = typeof invoice.late_fees === 'string' 
            ? JSON.parse(invoice.late_fees) 
            : invoice.late_fees;
          
          if (lateFeesSettings && lateFeesSettings.enabled && lateFeesSettings.type === 'percentage') {
            // For percentage-based: recalculate late fees on new remaining balance
            finalLateFees = newRemainingBalance * ((lateFeesSettings.amount || 0) / 100);
          }
          // For fixed late fees: keep the same amount
        } catch (e) {
          // Keep original lateFeesAmount
        }
      }
      
      // What's actually remaining = new remaining balance + recalculated late fees
      const finalRemainingBalance = Math.max(0, newRemainingBalance + finalLateFees);
      // Total payable = what was originally owed (invoice.total + late fees at that time)
      // But for checking if fully paid, we check if remaining balance + late fees = 0
      const finalTotalPayable = invoice.total + finalLateFees;

      // Check if invoice is now fully paid (including late fees)
      // Invoice is fully paid when: remaining balance + late fees = 0 (i.e., finalRemainingBalance = 0)
      // OR when totalPaid >= (invoice.total + late fees)
      if (finalRemainingBalance <= 0 || newTotalPaid >= finalTotalPayable) {
        // Auto-mark invoice as paid if fully paid
        await supabaseAdmin
          .from('invoices')
          .update({ status: 'paid', updated_at: new Date().toISOString() })
          .eq('id', invoiceId);

        // Log paid event
        try {
          await supabaseAdmin.from('invoice_events').insert({ 
            invoice_id: invoiceId, 
            type: 'paid' 
          });
        } catch {}

        // Cancel ONLY scheduled reminders (not sent, cancelled, or other statuses)
        // Sent reminders should remain unchanged as they were already sent
        // Cancelled reminders should remain unchanged
        await supabaseAdmin
          .from('invoice_reminders')
          .update({
            reminder_status: 'cancelled',
            failure_reason: 'Invoice fully paid via partial payments - scheduled reminders cancelled'
          })
          .eq('invoice_id', invoiceId)
          .eq('reminder_status', 'scheduled'); // Only update scheduled reminders, not sent/cancelled
      } else {
        // Partial payment added but invoice not fully paid
        // Update scheduled reminders to reflect partial payment (they will use remaining balance when sent)
        // IMPORTANT: Only affect scheduled reminders, NOT sent or cancelled reminders
        // Also, only affect if invoice is NOT "sent" or "cancelled" status
        if (invoiceStatus !== 'sent' && invoiceStatus !== 'cancelled') {
          // Scheduled reminders will automatically use the updated remaining balance when sent
          // (the auto-send route fetches payments dynamically)
          // We don't need to update the reminder records themselves, but we ensure they exist
          // and will use the correct remaining balance when processed
          // The reminder history page also fetches payments dynamically, so it will show correct amounts
          
          // Note: Scheduled reminders don't need to be updated in the database because:
          // 1. Auto-send route fetches payments dynamically when sending
          // 2. Reminder history page fetches payments dynamically when displaying
          // 3. The remaining balance is calculated from invoice.total - totalPaid
          // So scheduled reminders will automatically reflect partial payments
        }
      }
    } catch (reminderError) {
      console.error('Error updating reminders after payment:', reminderError);
      // Don't fail the payment if reminder update fails
    }

    // Calculate values outside try-catch for return statement
    const newRemainingBalance = invoice.total - newTotalPaid;
    let finalLateFees = lateFeesAmount;
    
    if (invoice.due_date && invoice.late_fees && lateFeesAmount > 0) {
      try {
        const lateFeesSettings = typeof invoice.late_fees === 'string' 
          ? JSON.parse(invoice.late_fees) 
          : invoice.late_fees;
        
        if (lateFeesSettings && lateFeesSettings.enabled && lateFeesSettings.type === 'percentage') {
          finalLateFees = newRemainingBalance * ((lateFeesSettings.amount || 0) / 100);
        }
      } catch (e) {
        // Keep original lateFeesAmount
      }
    }
    
    const finalTotalPayable = invoice.total + finalLateFees;
    const finalRemainingBalance = Math.max(0, newRemainingBalance + finalLateFees);

    return NextResponse.json({
      success: true,
      payment,
      totalPaid: newTotalPaid,
      remainingBalance: finalRemainingBalance,
      lateFeesAmount: finalLateFees,
      totalPayable: finalTotalPayable,
      isFullyPaid: finalRemainingBalance <= 0 || newTotalPaid >= finalTotalPayable
    });

  } catch (error) {
    console.error('Error in POST payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove a payment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: invoiceId } = await params;
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');

    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
    }

    // Verify invoice belongs to user
    const { data: invoice } = await supabaseAdmin
      .from('invoices')
      .select('id, user_id, total, due_date, late_fees, status')
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .single();

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Delete payment
    const { error: deleteError } = await supabaseAdmin
      .from('invoice_payments')
      .delete()
      .eq('id', paymentId)
      .eq('invoice_id', invoiceId);

    if (deleteError) {
      console.error('Error deleting payment:', deleteError);
      return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 });
    }

    // Recalculate totals and update invoice status if needed
    const { data: remainingPayments } = await supabaseAdmin
      .from('invoice_payments')
      .select('amount')
      .eq('invoice_id', invoiceId);

    const totalPaid = (remainingPayments || []).reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
    const remainingBalance = invoice.total - totalPaid;
    
    // Calculate late fees if invoice is overdue
    let lateFeesAmount = 0;
    let totalPayable = invoice.total;
    
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
              totalPayable = invoice.total + lateFeesAmount;
            }
          }
        } catch (e) {
          console.error('Error parsing late fees:', e);
        }
      }
    }
    
    const finalRemainingBalance = Math.max(0, totalPayable - totalPaid);

    // If invoice was marked as paid but now has remaining balance (including late fees), change status back to sent/pending
    if (invoice.status === 'paid' && totalPaid < totalPayable) {
      await supabaseAdmin
        .from('invoices')
        .update({ status: 'sent', updated_at: new Date().toISOString() })
        .eq('id', invoiceId);
    }

    return NextResponse.json({
      success: true,
      totalPaid,
      remainingBalance: finalRemainingBalance,
      lateFeesAmount,
      totalPayable
    });

  } catch (error) {
    console.error('Error in DELETE payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

