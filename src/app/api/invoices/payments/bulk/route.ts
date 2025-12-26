import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-middleware';

// GET - Fetch payment data for multiple invoices in bulk
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

    // Fetch all invoices to verify ownership and get totals
    const { data: invoices, error: invoicesError } = await supabaseAdmin
      .from('invoices')
      .select('id, total, status')
      .eq('user_id', user.id)
      .in('id', invoiceIds);

    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError);
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
    }

    if (!invoices || invoices.length === 0) {
      return NextResponse.json({ payments: {} });
    }

    // Fetch all payments for these invoices in one query
    const { data: payments, error: paymentsError } = await supabaseAdmin
      .from('invoice_payments')
      .select('invoice_id, amount')
      .in('invoice_id', invoiceIds);

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError);
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
    }

    // Calculate totals for each invoice
    const paymentMap: Record<string, { totalPaid: number; remainingBalance: number }> = {};

    invoices.forEach(invoice => {
      // Skip if invoice is already paid (no partial payments)
      if (invoice.status === 'paid') {
        return;
      }

      const invoicePayments = (payments || []).filter(p => p.invoice_id === invoice.id);
      const totalPaid = invoicePayments.reduce((sum, payment) => sum + parseFloat(payment.amount.toString()), 0);
      const remainingBalance = invoice.total - totalPaid;

      // Only include if there are actual payments
      if (totalPaid > 0) {
        paymentMap[invoice.id] = {
          totalPaid,
          remainingBalance: Math.max(0, remainingBalance)
        };
      }
    });

    return NextResponse.json({ payments: paymentMap });

  } catch (error) {
    console.error('Error in bulk payments fetch:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

