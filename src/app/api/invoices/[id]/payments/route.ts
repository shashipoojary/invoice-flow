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

    return NextResponse.json({
      payments: payments || [],
      totalPaid,
      remainingBalance,
      invoiceTotal: invoice.total
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
      .select('id, status, total')
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
    const newTotalPaid = totalPaid + parseFloat(amount.toString());

    // Check if payment would exceed invoice total
    if (newTotalPaid > invoice.total) {
      return NextResponse.json({ 
        error: `Payment amount exceeds invoice total. Maximum payment allowed: $${(invoice.total - totalPaid).toFixed(2)}` 
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

    // Check if invoice is now fully paid
    if (newTotalPaid >= invoice.total) {
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
      try {
        await supabaseAdmin
          .from('invoice_reminders')
          .update({
            reminder_status: 'cancelled',
            failure_reason: 'Invoice fully paid via partial payments - scheduled reminders cancelled'
          })
          .eq('invoice_id', invoiceId)
          .eq('reminder_status', 'scheduled'); // Only update scheduled reminders, not sent/cancelled
      } catch {}
    }

    return NextResponse.json({
      success: true,
      payment,
      totalPaid: newTotalPaid,
      remainingBalance: invoice.total - newTotalPaid,
      isFullyPaid: newTotalPaid >= invoice.total
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
      .select('id, user_id')
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
    const { data: invoiceData } = await supabaseAdmin
      .from('invoices')
      .select('total, status')
      .eq('id', invoiceId)
      .single();

    // If invoice was marked as paid but now has remaining balance, change status back to sent/pending
    if (invoiceData && invoiceData.status === 'paid' && totalPaid < invoiceData.total) {
      await supabaseAdmin
        .from('invoices')
        .update({ status: 'sent', updated_at: new Date().toISOString() })
        .eq('id', invoiceId);
    }

    return NextResponse.json({
      success: true,
      totalPaid,
      remainingBalance: invoiceData ? invoiceData.total - totalPaid : 0
    });

  } catch (error) {
    console.error('Error in DELETE payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

