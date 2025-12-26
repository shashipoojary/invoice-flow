import { supabaseAdmin } from './supabase';

export interface PaymentData {
  totalPaid: number;
  remainingBalance: number;
  payments: Array<{
    id: string;
    amount: number;
    payment_date: string;
    payment_method?: string;
    notes?: string;
    created_at: string;
  }>;
}

/**
 * Fetches payment data for an invoice
 * Returns null if invoice is paid or has no payments
 */
export async function getInvoicePaymentData(invoiceId: string, invoiceTotal: number, invoiceStatus: string): Promise<PaymentData | null> {
  // If invoice is already marked as paid, return null (no partial payments)
  if (invoiceStatus === 'paid') {
    return null;
  }

  try {
    const { data: payments, error } = await supabaseAdmin
      .from('invoice_payments')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('payment_date', { ascending: false });

    if (error) {
      console.error('Error fetching payments:', error);
      return null;
    }

    if (!payments || payments.length === 0) {
      return null;
    }

    const totalPaid = payments.reduce((sum, payment) => sum + parseFloat(payment.amount.toString()), 0);
    const remainingBalance = invoiceTotal - totalPaid;

    return {
      totalPaid,
      remainingBalance: Math.max(0, remainingBalance), // Ensure non-negative
      payments: payments.map(p => ({
        id: p.id,
        amount: parseFloat(p.amount.toString()),
        payment_date: p.payment_date,
        payment_method: p.payment_method || undefined,
        notes: p.notes || undefined,
        created_at: p.created_at
      }))
    };
  } catch (error) {
    console.error('Error in getInvoicePaymentData:', error);
    return null;
  }
}

/**
 * Calculates the actual amount due considering partial payments
 */
export function calculateAmountDue(invoiceTotal: number, paymentData: PaymentData | null, lateFeeAmount: number = 0): number {
  if (!paymentData) {
    return invoiceTotal + lateFeeAmount;
  }
  return Math.max(0, paymentData.remainingBalance + lateFeeAmount);
}

