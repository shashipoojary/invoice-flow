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
    if (!invoiceData.due_date || !invoiceData.items || invoiceData.items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate items
    for (const item of invoiceData.items) {
      if (!item.description || !item.rate || item.rate <= 0) {
        return NextResponse.json({ error: 'Invalid item data' }, { status: 400 });
      }
    }

    let clientId = invoiceData.client_id;

    // Handle new client creation if no client_id provided
    if (!clientId && invoiceData.client_data) {
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
          user_id: user.id,
          name: invoiceData.client_data.name,
          email: invoiceData.client_data.email,
          company: invoiceData.client_data.company || null,
          phone: invoiceData.client_data.phone || null,
          address: invoiceData.client_data.address || null,
        })
        .select('id')
        .single();

      if (clientError) {
        console.error('Client creation error:', clientError);
        return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
      }

      clientId = newClient.id;
    }

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID or client data required' }, { status: 400 });
    }

    // Verify client belongs to user (security check)
    const { data: client, error: clientCheckError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single();

    if (clientCheckError || !client) {
      return NextResponse.json({ error: 'Client not found or access denied' }, { status: 403 });
    }

    // Calculate totals
    const subtotal = invoiceData.items.reduce((sum: number, item: { rate: number }) => sum + item.rate, 0);
    const discount = invoiceData.discount || 0;
    const total = subtotal - discount;

    // Generate invoice number using database function
    const { data: invoiceNumberData, error: invoiceNumberError } = await supabase
      .rpc('generate_invoice_number', { user_uuid: user.id });

    if (invoiceNumberError) {
      console.error('Invoice number generation error:', invoiceNumberError);
      return NextResponse.json({ error: 'Failed to generate invoice number' }, { status: 500 });
    }

    // Generate public token using database function
    const { data: publicTokenData, error: tokenError } = await supabase
      .rpc('generate_public_token');

    if (tokenError) {
      console.error('Public token generation error:', tokenError);
      return NextResponse.json({ error: 'Failed to generate public token' }, { status: 500 });
    }

    // Prepare invoice data
    const invoice = {
      user_id: user.id,
      client_id: clientId,
      invoice_number: invoiceNumberData,
      public_token: publicTokenData,
      subtotal,
      discount,
      total,
      status: 'draft',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: invoiceData.due_date,
      notes: invoiceData.notes || '',
      type: invoiceData.type || 'detailed', // Add invoice type
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
          phone,
          address
        )
      `)
      .single();

    if (insertError) {
      console.error('Invoice creation error:', insertError);
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
    }

    // Insert invoice items
    const invoiceItems = invoiceData.items.map((item: { description: string; rate: number; line_total: number }) => ({
      invoice_id: newInvoice.id,
      description: item.description,
      rate: item.rate,
      line_total: item.rate,
    }));

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(invoiceItems);

    if (itemsError) {
      console.error('Invoice items creation error:', itemsError);
      // Rollback invoice creation
      await supabase.from('invoices').delete().eq('id', newInvoice.id);
      return NextResponse.json({ error: 'Failed to create invoice items' }, { status: 500 });
    }

    // Fetch the complete invoice with items
    const { data: completeInvoice, error: fetchError } = await supabase
      .from('invoices')
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
        invoice_items (
          id,
          description,
          rate,
          line_total
        )
      `)
      .eq('id', newInvoice.id)
      .single();

    if (fetchError) {
      console.error('Invoice fetch error:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch complete invoice' }, { status: 500 });
    }

    // Map database fields to frontend interface
    const mappedInvoice = {
      ...completeInvoice,
      invoiceNumber: completeInvoice.invoice_number,
      dueDate: completeInvoice.due_date,
      createdAt: completeInvoice.created_at,
      client: completeInvoice.clients,
      items: (completeInvoice.invoice_items || []).map((item: { id: string; description: string; line_total: number }) => ({
        id: item.id,
        description: item.description,
        amount: item.line_total
      }))
    };

    return NextResponse.json({ 
      success: true, 
      invoice: mappedInvoice,
      message: 'Invoice created successfully' 
    });

  } catch (error) {
    console.error('Invoice creation error:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
