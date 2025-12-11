import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { estimateId, type, metadata } = await request.json();

    if (!estimateId || !type) {
      return NextResponse.json({ error: 'Estimate ID and event type are required' }, { status: 400 });
    }

    // Insert event
    const { error } = await supabaseAdmin.from('estimate_events').insert({
      estimate_id: estimateId,
      type: type,
      metadata: metadata || {}
    });

    if (error) {
      console.error('Error logging estimate event:', error);
      return NextResponse.json({ error: 'Failed to log event' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error in estimate events API:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

