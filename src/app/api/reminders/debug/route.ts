import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get all invoices for the user for debugging
    const { data: allInvoices, error: allError } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        due_date,
        status,
        total,
        created_at,
        clients (
          name,
          email
        )
      `)
      .eq('user_id', userId)
      .order('due_date', { ascending: false });

    if (allError) {
      console.error('Error fetching all invoices:', allError);
      return NextResponse.json({ 
        error: 'Failed to fetch invoices', 
        details: allError.message,
        code: allError.code 
      }, { status: 500 });
    }

    const today = new Date();
    const debugInfo = {
      userId,
      totalInvoices: allInvoices?.length || 0,
      today: today.toISOString(),
      invoices: allInvoices?.map(invoice => ({
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        status: invoice.status,
        dueDate: invoice.due_date,
        isOverdue: new Date(invoice.due_date) < today,
        daysOverdue: Math.floor((today.getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24)),
        reminderCount: 0, // Will be 0 until migration is run
         clientName: invoice.clients?.[0]?.name || 'No client',
         clientEmail: invoice.clients?.[0]?.email || 'No email'
      })) || []
    };

    // Filter for overdue invoices
    const overdueInvoices = debugInfo.invoices.filter(invoice => 
      invoice.status === 'sent' && invoice.isOverdue
    );

    return NextResponse.json({
      success: true,
      debug: debugInfo,
      overdueCount: overdueInvoices.length,
      overdueInvoices: overdueInvoices
    });

  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
