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
    
    // First, get all estimate IDs belonging to the authenticated user
    const { data: userEstimates, error: estimatesError } = await supabaseAdmin
      .from('estimates')
      .select('id')
      .eq('user_id', user.id);
    
    if (estimatesError) {
      return NextResponse.json({ error: 'Failed to fetch user estimates' }, { status: 500 });
    }
    
    // If user has no estimates, return empty array
    if (!userEstimates || userEstimates.length === 0) {
      return NextResponse.json({ events: [] }, { status: 200 });
    }
    
    const estimateIds = userEstimates.map(est => est.id);
    
    // Now fetch events only for the user's estimates
    let query = supabaseAdmin
      .from('estimate_events')
      .select('*, estimates(id, estimate_number, status, approval_status, client_id, clients(name))')
      .in('estimate_id', estimateIds) // CRITICAL: Only get events for user's estimates
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

