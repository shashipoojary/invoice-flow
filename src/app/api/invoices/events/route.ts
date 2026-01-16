import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get('type');
    const days = parseInt(searchParams.get('days') || '7');
    
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);
    
    // First, get all invoice IDs belonging to the authenticated user
    const { data: userInvoices, error: invoicesError } = await supabaseAdmin
      .from('invoices')
      .select('id')
      .eq('user_id', user.id);
    
    if (invoicesError) {
      return NextResponse.json({ error: 'Failed to fetch user invoices' }, { status: 500 });
    }
    
    // If user has no invoices, return empty array
    if (!userInvoices || userInvoices.length === 0) {
      return NextResponse.json({ events: [] }, { status: 200 });
    }
    
    const invoiceIds = userInvoices.map(inv => inv.id);
    
    // Now fetch events only for the user's invoices
    let query = supabaseAdmin
      .from('invoice_events')
      .select('*, invoices(id, invoice_number, status, client_id, clients(name))')
      .in('invoice_id', invoiceIds) // CRITICAL: Only get events for user's invoices
      .gte('created_at', sinceDate.toISOString())
      .order('created_at', { ascending: false });
    
    if (type) {
      query = query.eq('type', type);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ events: data || [] }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { invoiceId, type, metadata } = await req.json();
    if (!invoiceId || !type) {
      return NextResponse.json({ error: 'invoiceId and type are required' }, { status: 400 });
    }
    
    // CRITICAL: For privacy and legal compliance, do not track any activities for paid invoices
    const { data: invoice } = await supabaseAdmin
      .from('invoices')
      .select('status')
      .eq('id', invoiceId)
      .single();
    
    if (invoice && invoice.status === 'paid') {
      // Silently skip logging for paid invoices - return success to avoid client errors
      return NextResponse.json({ ok: true, skipped: true, reason: 'Invoice is paid - activity tracking disabled' }, { status: 200 });
    }
    
    // For privacy reasons, only log "viewed_by_customer" once per day per invoice
    if (type === 'viewed_by_customer') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Check if a view event already exists for this invoice today
      const { data: existingEvents } = await supabaseAdmin
        .from('invoice_events')
        .select('id')
        .eq('invoice_id', invoiceId)
        .eq('type', 'viewed_by_customer')
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString())
        .limit(1);
      
      // If a view event already exists today, don't create another one
      if (existingEvents && existingEvents.length > 0) {
        return NextResponse.json({ ok: true, event: existingEvents[0], skipped: true }, { status: 200 });
      }
    }
    
    const { data, error } = await supabaseAdmin.from('invoice_events').insert({ invoice_id: invoiceId, type, metadata: metadata || {} }).select().single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, event: data }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}


