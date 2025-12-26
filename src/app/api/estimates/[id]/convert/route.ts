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
    
    // Get invoice type and template from request body
    let body: any = {};
    try {
      body = await request.json();
    } catch (e) {
      console.error('Error parsing request body:', e);
      // Default values if body parsing fails - this is OK, we'll use defaults
      body = {};
    }
    const invoiceType: 'fast' | 'detailed' = body.invoiceType || 'detailed';
    const template: number | undefined = body.template; // PDF template number (1 for fast, 4/5/6 for detailed)
    
    console.log('Conversion request - invoiceType:', invoiceType, 'template:', template);

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

    // Parse estimate theme if it's a string
    let parsedEstimateTheme: any = null;
    if (estimate.theme) {
      try {
        parsedEstimateTheme = typeof estimate.theme === 'string' ? JSON.parse(estimate.theme) : estimate.theme;
      } catch (e) {
        console.error('Error parsing estimate theme:', e);
        parsedEstimateTheme = null;
      }
    }

    // Prepare theme based on invoice type and template
    let invoiceTheme = null;
    if (invoiceType === 'detailed' && template) {
      // For detailed invoices, store template in theme
      invoiceTheme = {
        template: template, // PDF template number (4, 5, or 6)
        primary_color: parsedEstimateTheme?.primary_color || '#5C2D91',
        secondary_color: parsedEstimateTheme?.secondary_color || '#8B5CF6',
        accent_color: parsedEstimateTheme?.accent_color || '#3B82F6'
      };
    }

    // Parse payment_terms if it's a string
    let paymentTerms = null;
    if (invoiceType !== 'fast' && estimate.payment_terms) {
      try {
        paymentTerms = typeof estimate.payment_terms === 'string' ? estimate.payment_terms : JSON.stringify(estimate.payment_terms);
      } catch (e) {
        console.error('Error processing payment_terms:', e);
        paymentTerms = null;
      }
    }

    // Parse branding if it's a string
    let branding = null;
    if (estimate.branding) {
      try {
        branding = typeof estimate.branding === 'string' ? estimate.branding : JSON.stringify(estimate.branding);
      } catch (e) {
        console.error('Error processing branding:', e);
        branding = null;
      }
    }

    // Create invoice from estimate
    const invoice = {
      user_id: user.id,
      client_id: estimate.client_id,
      invoice_number: invoiceNumberData,
      public_token: publicTokenData,
      subtotal: estimate.subtotal,
      discount: estimate.discount || 0,
      tax: estimate.tax || 0,
      total: estimate.total,
      status: 'draft',
      issue_date: estimate.issue_date || new Date().toISOString().split('T')[0],
      due_date: estimate.expiry_date || null, // Use expiry date as due date
      notes: estimate.notes || null,
      type: invoiceType, // 'fast' or 'detailed'
      payment_terms: paymentTerms,
      theme: invoiceType === 'fast' ? null : (invoiceTheme ? JSON.stringify(invoiceTheme) : (estimate.theme ? (typeof estimate.theme === 'string' ? estimate.theme : JSON.stringify(estimate.theme)) : null)),
      branding: branding,
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
    if (!estimate.estimate_items || estimate.estimate_items.length === 0) {
      console.error('No estimate items found');
      // Rollback invoice creation
      await supabase.from('invoices').delete().eq('id', newInvoice.id);
      return NextResponse.json({ error: 'Estimate has no items to convert' }, { status: 400 });
    }

    const invoiceItems = estimate.estimate_items.map((item: any) => ({
      invoice_id: newInvoice.id,
      description: item.description || 'Item',
      qty: item.qty || 1,
      rate: item.rate || 0,
      line_total: item.line_total || 0,
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

    // Determine template name for response
    const templateName = invoiceType === 'fast' 
      ? 'Fast Invoice' 
      : template === 6 ? 'Minimal' : template === 4 ? 'Modern' : template === 5 ? 'Creative' : 'Default';

    return NextResponse.json({ 
      success: true, 
      invoice: {
        id: newInvoice.id,
        invoiceNumber: newInvoice.invoice_number,
        type: invoiceType,
        template: templateName
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error converting estimate:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ 
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

