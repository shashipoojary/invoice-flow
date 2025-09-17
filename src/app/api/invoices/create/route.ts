import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const invoiceData = await request.json();

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate required fields
    if (!invoiceData.clientId || !invoiceData.dueDate || !invoiceData.items || invoiceData.items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Calculate totals
    const subtotal = invoiceData.items.reduce((sum: number, item: { rate?: number }) => sum + (item.rate || 0), 0);
    const taxRate = invoiceData.taxRate || 0.1;
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    // Generate invoice number
    const { data: lastInvoice } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let invoiceNumber = 'INV-001';
    if (lastInvoice) {
      const lastNumber = parseInt(lastInvoice.invoice_number.split('-')[1]);
      invoiceNumber = `INV-${String(lastNumber + 1).padStart(3, '0')}`;
    }

    // Generate public token
    const publicToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // Prepare invoice data
    const invoice = {
      user_id: user.id,
      client_id: invoiceData.clientId,
      invoice_number: invoiceNumber,
      public_token: publicToken,
      items: invoiceData.items,
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total,
      status: invoiceData.status || 'draft',
      due_date: invoiceData.dueDate,
      notes: invoiceData.notes || '',
      created_at: new Date().toISOString(),
    };

    // Insert invoice
    const { data: newInvoice, error: insertError } = await supabase
      .from('invoices')
      .insert(invoice)
      .select(`
        *,
        clients (
          id,
          name,
          email,
          company,
          address
        )
      `)
      .single();

    if (insertError) {
      console.error('Invoice creation error:', insertError);
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      invoice: newInvoice,
      message: 'Invoice created successfully' 
    });

  } catch (error) {
    console.error('Invoice creation error:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
