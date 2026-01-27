import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-middleware';
import { canCreateEstimate } from '@/lib/subscription-validator';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const estimateData = await request.json();
    const { clientId, items, discount = 0, notes, issueDate, expiryDate, paymentTerms, theme, currency } = estimateData;

    // Validate required fields
    if (!clientId || !items || items.length === 0) {
      return NextResponse.json({ error: 'Client and items are required' }, { status: 400 });
    }

    // Check subscription limits BEFORE creating estimate
    const limitCheck = await canCreateEstimate(user.id);
    if (!limitCheck.allowed) {
      return NextResponse.json({ 
        error: limitCheck.reason || 'Subscription limit reached',
        limitReached: true,
        limitType: limitCheck.limitType
      }, { status: 403 });
    }

    // Verify client belongs to user
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: { rate: number; qty?: number }) => {
      const qty = item.qty || 1;
      return sum + (item.rate * qty);
    }, 0);
    
    const taxRate = estimateData.taxRate || 0;
    const taxAmount = (subtotal - discount) * (taxRate / 100);
    const total = subtotal - discount + taxAmount;

    // Generate estimate number using database function
    const { data: estimateNumberData, error: estimateNumberError } = await supabase
      .rpc('generate_estimate_number', { user_uuid: user.id });

    if (estimateNumberError) {
      console.error('Estimate number generation error:', estimateNumberError);
      return NextResponse.json({ error: 'Failed to generate estimate number' }, { status: 500 });
    }

    // Generate public token using database function
    const { data: publicTokenData, error: tokenError } = await supabase
      .rpc('generate_public_token');

    if (tokenError) {
      console.error('Public token generation error:', tokenError);
      return NextResponse.json({ error: 'Failed to generate public token' }, { status: 500 });
    }

    // Get user's base currency from settings
    const { data: userSettings } = await supabase
      .from('user_settings')
      .select('base_currency')
      .eq('user_id', user.id)
      .single();
    
    const baseCurrency = userSettings?.base_currency || 'USD';
    const estimateCurrency = currency || baseCurrency;

    // Prepare estimate data
    const estimate = {
      user_id: user.id,
      client_id: clientId,
      estimate_number: estimateNumberData,
      public_token: publicTokenData,
      currency: estimateCurrency,
      subtotal,
      discount,
      tax: taxAmount,
      total,
      status: 'draft',
      approval_status: 'pending',
      issue_date: issueDate || new Date().toISOString().split('T')[0],
      expiry_date: expiryDate || null,
      notes: notes || '',
      payment_terms: paymentTerms ? JSON.stringify(paymentTerms) : null,
      theme: theme ? JSON.stringify(theme) : null,
      branding: JSON.stringify({}),
    };

    // Insert estimate
    const { data: newEstimate, error: insertError } = await supabase
      .from('estimates')
      .insert(estimate)
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
      console.error('Estimate creation error:', insertError);
      
      // Check if error is from subscription limit trigger
      if (insertError.message && insertError.message.includes('Subscription limit reached')) {
        return NextResponse.json({ 
          error: insertError.message || 'Subscription limit reached',
          limitReached: true,
          limitType: 'estimates'
        }, { status: 403 });
      }
      
      return NextResponse.json({ error: 'Failed to create estimate' }, { status: 500 });
    }

    // Insert estimate items
    const estimateItems = items.map((item: { description: string; rate: number; qty?: number }) => {
      const qty = item.qty || 1;
      return {
        estimate_id: newEstimate.id,
        description: item.description,
        qty,
        rate: item.rate,
        line_total: item.rate * qty,
      };
    });

    const { error: itemsError } = await supabase
      .from('estimate_items')
      .insert(estimateItems);

    if (itemsError) {
      console.error('Estimate items creation error:', itemsError);
      // Rollback estimate creation
      await supabase.from('estimates').delete().eq('id', newEstimate.id);
      return NextResponse.json({ error: 'Failed to create estimate items' }, { status: 500 });
    }

    // Fetch the complete estimate with items
    const { data: completeEstimate, error: fetchError } = await supabase
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
      .eq('id', newEstimate.id)
      .single();

    if (fetchError) {
      console.error('Error fetching complete estimate:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch estimate' }, { status: 500 });
    }

    // Map to frontend format
    const mappedEstimate = {
      id: completeEstimate.id,
      estimateNumber: completeEstimate.estimate_number,
      clientId: completeEstimate.client_id,
      client: completeEstimate.clients,
      items: completeEstimate.estimate_items.map((item: any) => ({
        id: item.id,
        description: item.description,
        rate: item.rate,
        qty: item.qty,
        amount: item.line_total,
      })),
      subtotal: parseFloat(completeEstimate.subtotal),
      discount: parseFloat(completeEstimate.discount || 0),
      taxRate: estimateData.taxRate || 0,
      taxAmount: parseFloat(completeEstimate.tax || 0),
      total: parseFloat(completeEstimate.total),
      status: completeEstimate.status,
      approvalStatus: completeEstimate.approval_status,
      expiryDate: completeEstimate.expiry_date,
      createdAt: completeEstimate.created_at,
      updatedAt: completeEstimate.updated_at,
      notes: completeEstimate.notes,
      clientName: completeEstimate.clients.name,
      clientEmail: completeEstimate.clients.email,
      clientCompany: completeEstimate.clients.company,
      clientAddress: completeEstimate.clients.address,
      issueDate: completeEstimate.issue_date,
      paymentTerms: completeEstimate.payment_terms ? JSON.parse(completeEstimate.payment_terms) : null,
      theme: completeEstimate.theme ? JSON.parse(completeEstimate.theme) : null,
      currency: completeEstimate.currency || baseCurrency,
    };

    return NextResponse.json({ estimate: mappedEstimate }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating estimate:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

