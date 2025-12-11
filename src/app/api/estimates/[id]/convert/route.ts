import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-middleware';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Fetch estimate with items
    const { data: estimate, error: estimateError } = await supabaseAdmin
      .from('estimates')
      .select(`
        *,
        clients (
          id,
          name,
          email,
          company,
          phone,
          address
        ),
        estimate_items (
          id,
          description,
          qty,
          rate,
          line_total
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (estimateError || !estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
    }

    if (estimate.status !== 'approved') {
      return NextResponse.json({ error: 'Only approved estimates can be converted to invoices' }, { status: 400 });
    }

    // Generate invoice number
    const { data: invoiceNumberData, error: invoiceNumberError } = await supabase
      .rpc('generate_invoice_number', { user_uuid: user.id });

    if (invoiceNumberError) {
      return NextResponse.json({ error: 'Failed to generate invoice number' }, { status: 500 });
    }

    // Generate public token
    const { data: publicTokenData, error: tokenError } = await supabase
      .rpc('generate_public_token');

    if (tokenError) {
      return NextResponse.json({ error: 'Failed to generate public token' }, { status: 500 });
    }

    // Create invoice from estimate
    const invoice = {
      user_id: user.id,
      client_id: estimate.client_id,
      invoice_number: invoiceNumberData,
      public_token: publicTokenData,
      subtotal: estimate.subtotal,
      discount: estimate.discount,
      tax: estimate.tax,
      total: estimate.total,
      status: 'draft',
      issue_date: estimate.issue_date || new Date().toISOString().split('T')[0],
      due_date: estimate.expiry_date || null, // Use expiry date as due date
      notes: estimate.notes || '',
      type: 'detailed',
      payment_terms: estimate.payment_terms,
      theme: estimate.theme,
      branding: estimate.branding,
    };

    const { data: newInvoice, error: insertError } = await supabase
      .from('invoices')
      .insert(invoice)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating invoice:', insertError);
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
    }

    // Create invoice items from estimate items
    const invoiceItems = estimate.estimate_items.map((item: any) => ({
      invoice_id: newInvoice.id,
      description: item.description,
      rate: item.rate,
      line_total: item.line_total,
    }));

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(invoiceItems);

    if (itemsError) {
      console.error('Error creating invoice items:', itemsError);
      // Rollback invoice creation
      await supabase.from('invoices').delete().eq('id', newInvoice.id);
      return NextResponse.json({ error: 'Failed to create invoice items' }, { status: 500 });
    }

    // Update estimate to mark as converted
    await supabaseAdmin
      .from('estimates')
      .update({
        status: 'converted',
        converted_to_invoice_id: newInvoice.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    // Log conversion event
    await supabaseAdmin.from('estimate_events').insert({
      estimate_id: id,
      user_id: user.id,
      type: 'converted',
      metadata: { invoice_id: newInvoice.id }
    });

    return NextResponse.json({ 
      success: true, 
      invoice: {
        id: newInvoice.id,
        invoiceNumber: newInvoice.invoice_number
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error converting estimate:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

