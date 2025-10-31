import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { invoiceId, type, metadata } = await req.json();
    if (!invoiceId || !type) {
      return NextResponse.json({ error: 'invoiceId and type are required' }, { status: 400 });
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


