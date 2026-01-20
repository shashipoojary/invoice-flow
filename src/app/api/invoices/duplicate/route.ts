import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-middleware';
import { canCreateInvoice } from '@/lib/subscription-validator';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invoiceId } = await request.json();

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    // IMPORTANT: ALWAYS check subscription limits for duplication
    // Duplication creates a NEW draft invoice that can be edited and used for future invoices
    // Even if the original invoice was sent/paid, the duplicate is a new invoice that counts toward limits
    const limitCheck = await canCreateInvoice(user.id);
    if (!limitCheck.allowed) {
      return NextResponse.json({ 
        error: limitCheck.reason || 'Subscription limit reached',
        limitReached: true,
        limitType: limitCheck.limitType || 'invoices'
      }, { status: 403 });
    }

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    // Fetch the original invoice with all related data
    const { data: originalInvoice, error: fetchError } = await supabaseAdmin
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
          line_total,
          qty
        )
      `)
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !originalInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Generate new invoice number
    const { data: invoiceNumberData, error: invoiceNumberError } = await supabaseAdmin
      .rpc('generate_invoice_number', { user_uuid: user.id });

    if (invoiceNumberError || !invoiceNumberData) {
      console.error('Invoice number generation error:', invoiceNumberError);
      return NextResponse.json({ error: 'Failed to generate invoice number' }, { status: 500 });
    }

    // Generate new public token
    const { data: publicTokenData, error: tokenError } = await supabaseAdmin
      .rpc('generate_public_token');

    if (tokenError || !publicTokenData) {
      console.error('Public token generation error:', tokenError);
      return NextResponse.json({ error: 'Failed to generate public token' }, { status: 500 });
    }

    // Calculate new dates (issue date = today, due date = 30 days from today by default)
    const today = new Date();
    const issueDate = today.toISOString().split('T')[0];
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + 30);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    // Helper function to ensure JSON fields are properly stringified
    const stringifyIfNeeded = (value: any): string | null => {
      if (!value) return null;
      if (typeof value === 'string') {
        // Already a string, but verify it's valid JSON
        try {
          JSON.parse(value);
          return value;
        } catch {
          // Not valid JSON, wrap it
          return JSON.stringify(value);
        }
      }
      // It's an object, stringify it
      return JSON.stringify(value);
    };

    const invoiceType = originalInvoice.type || 'detailed';
    
    // Create duplicated invoice (reset to draft status)
    const duplicatedInvoice = {
      user_id: user.id,
      client_id: originalInvoice.client_id,
      invoice_number: invoiceNumberData,
      public_token: publicTokenData,
      subtotal: originalInvoice.subtotal,
      discount: originalInvoice.discount || 0,
      total: originalInvoice.total,
      status: 'draft', // Always start as draft
      issue_date: issueDate,
      due_date: dueDateStr,
      notes: originalInvoice.notes || '',
      type: invoiceType,
      // Copy all enhanced fields - for fast invoices, set to null; for detailed, stringify properly
      payment_terms: invoiceType === 'fast' ? null : stringifyIfNeeded(originalInvoice.payment_terms),
      late_fees: invoiceType === 'fast' ? null : stringifyIfNeeded(originalInvoice.late_fees),
      reminder_settings: invoiceType === 'fast' ? null : stringifyIfNeeded(originalInvoice.reminder_settings),
      theme: invoiceType === 'fast' ? null : stringifyIfNeeded(originalInvoice.theme),
    };

    // Insert duplicated invoice
    const { data: newInvoice, error: insertError } = await supabaseAdmin
      .from('invoices')
      .insert(duplicatedInvoice)
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
      console.error('Invoice duplication error:', insertError);
      console.error('Invoice data attempted:', JSON.stringify(duplicatedInvoice, null, 2));
      
      // Check if it's a subscription limit error from database trigger
      if (insertError.code === 'P0001' || insertError.message?.includes('Subscription limit')) {
        return NextResponse.json({ 
          error: insertError.message || 'Subscription limit reached. Free plan users can create up to 5 invoices per month. Please upgrade to create more invoices.',
          limitReached: true,
          limitType: 'invoices'
        }, { status: 403 });
      }
      
      return NextResponse.json({ 
        error: 'Failed to duplicate invoice',
        details: insertError.message 
      }, { status: 500 });
    }

    // Duplicate invoice items
    if (originalInvoice.invoice_items && originalInvoice.invoice_items.length > 0) {
      const invoiceItems = originalInvoice.invoice_items.map((item: any) => ({
        invoice_id: newInvoice.id,
        description: item.description,
        rate: item.rate,
        line_total: item.line_total || item.rate,
        qty: item.qty || 1,
      }));

      const { error: itemsError } = await supabaseAdmin
        .from('invoice_items')
        .insert(invoiceItems);

      if (itemsError) {
        console.error('Invoice items duplication error:', itemsError);
        // Rollback invoice creation
        await supabaseAdmin.from('invoices').delete().eq('id', newInvoice.id);
        return NextResponse.json({ error: 'Failed to duplicate invoice items' }, { status: 500 });
      }
    }

    // Fetch the complete duplicated invoice with items
    const { data: completeInvoice, error: fetchCompleteError } = await supabaseAdmin
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
          line_total,
          qty
        )
      `)
      .eq('id', newInvoice.id)
      .single();

    if (fetchCompleteError) {
      console.error('Invoice fetch error:', fetchCompleteError);
      return NextResponse.json({ error: 'Failed to fetch duplicated invoice' }, { status: 500 });
    }

    // Map database fields to frontend interface
    const mappedInvoice = {
      ...completeInvoice,
      invoiceNumber: completeInvoice.invoice_number,
      dueDate: completeInvoice.due_date,
      issueDate: completeInvoice.issue_date,
      createdAt: completeInvoice.created_at,
      client: completeInvoice.clients,
      items: (completeInvoice.invoice_items || []).map((item: any) => ({
        id: item.id,
        description: item.description,
        amount: item.line_total || item.rate
      })),
      // Parse JSON fields
      paymentTerms: completeInvoice.type === 'fast' ? undefined : 
        (completeInvoice.payment_terms ? JSON.parse(completeInvoice.payment_terms) : 
        { enabled: true, terms: 'Net 30' }),
      lateFees: completeInvoice.type === 'fast' ? undefined : 
        (completeInvoice.late_fees ? JSON.parse(completeInvoice.late_fees) : 
        { enabled: true, type: 'fixed', amount: 50, gracePeriod: 7 }),
      reminders: completeInvoice.type === 'fast' ? undefined : 
        (completeInvoice.reminder_settings ? JSON.parse(completeInvoice.reminder_settings) : 
        { enabled: false, useSystemDefaults: true, rules: [] }),
      theme: completeInvoice.type === 'fast' ? undefined : 
        (completeInvoice.theme ? JSON.parse(completeInvoice.theme) : undefined),
    };

    // Log created event
    try { 
      await supabaseAdmin.from('invoice_events').insert({ 
        invoice_id: completeInvoice.id, 
        type: 'created',
        metadata: { duplicated_from: invoiceId }
      }); 
    } catch {}

    return NextResponse.json({ 
      success: true, 
      invoice: mappedInvoice,
      message: 'Invoice duplicated successfully' 
    });

  } catch (error) {
    console.error('Invoice duplication error:', error);
    return NextResponse.json({ error: 'Failed to duplicate invoice' }, { status: 500 });
  }
}

