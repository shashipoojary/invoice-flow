import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-middleware';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Verify estimate belongs to user and is in draft status
    const { data: existingEstimate, error: fetchError } = await supabaseAdmin
      .from('estimates')
      .select('id, status, user_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingEstimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
    }

    if (existingEstimate.status !== 'draft') {
      return NextResponse.json({ 
        error: 'Only draft estimates can be edited' 
      }, { status: 400 });
    }

    // Extract data from request
    const {
      clientId,
      items,
      subtotal,
      discount = 0,
      taxRate = 0,
      notes = '',
      issueDate,
      expiryDate,
      currency
    } = body;

    if (!clientId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ 
        error: 'Client and at least one item are required' 
      }, { status: 400 });
    }

    // Calculate tax amount
    const afterDiscount = subtotal - discount;
    const taxAmount = afterDiscount * (taxRate / 100);
    const total = afterDiscount + taxAmount;

    // Get user's base currency from settings
    const { data: userSettings } = await supabaseAdmin
      .from('user_settings')
      .select('base_currency')
      .eq('user_id', user.id)
      .single();
    
    const baseCurrency = userSettings?.base_currency || 'USD';
    const estimateCurrency = currency || baseCurrency;

    // Update estimate
    const { data: updatedEstimate, error: updateError } = await supabaseAdmin
      .from('estimates')
      .update({
        client_id: clientId,
        currency: estimateCurrency,
        subtotal: subtotal,
        discount: discount,
        tax: taxAmount,
        total: total,
        notes: notes || null,
        issue_date: issueDate || null,
        expiry_date: expiryDate || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating estimate:', updateError);
      return NextResponse.json({ error: 'Failed to update estimate' }, { status: 500 });
    }

    // Delete existing items
    const { error: deleteItemsError } = await supabaseAdmin
      .from('estimate_items')
      .delete()
      .eq('estimate_id', id);

    if (deleteItemsError) {
      console.error('Error deleting estimate items:', deleteItemsError);
      return NextResponse.json({ error: 'Failed to update estimate items' }, { status: 500 });
    }

    // Insert new items
    const estimateItems = items.map((item: any) => ({
      estimate_id: id,
      description: item.description,
      qty: item.qty || 1,
      rate: item.rate,
      line_total: (item.rate || 0) * (item.qty || 1)
    }));

    const { error: insertItemsError } = await supabaseAdmin
      .from('estimate_items')
      .insert(estimateItems);

    if (insertItemsError) {
      console.error('Error inserting estimate items:', insertItemsError);
      return NextResponse.json({ error: 'Failed to update estimate items' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      estimate: updatedEstimate
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error updating estimate:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}

