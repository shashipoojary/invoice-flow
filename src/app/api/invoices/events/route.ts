import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { invoiceId, type, metadata } = await req.json();
    if (!invoiceId || !type) {
      return NextResponse.json({ error: 'invoiceId and type are required' }, { status: 400 });
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


