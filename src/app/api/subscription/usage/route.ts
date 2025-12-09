import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    
    // Get the user from the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user subscription plan
    const { data: profile } = await supabase
      .from('users')
      .select('subscription_plan')
      .eq('id', user.id)
      .single();

    const plan = profile?.subscription_plan || 'free';

    // Get current month's invoice count
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const { count: invoiceCount } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth.toISOString())
      .lte('created_at', endOfMonth.toISOString());

    // Get total invoices sent (for pay_per_invoice tracking)
    const { count: totalSentCount } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'sent');

    // Calculate limits based on plan
    let limit = null;
    let used = invoiceCount || 0;
    let remaining = null;

    if (plan === 'free') {
      limit = 5;
      remaining = Math.max(0, limit - used);
    } else if (plan === 'monthly') {
      limit = null; // Unlimited
      remaining = null;
    } else if (plan === 'pay_per_invoice') {
      // For pay_per_invoice, we track sent invoices
      used = totalSentCount || 0;
      limit = null; // No limit, but charges per invoice
    }

    return NextResponse.json({
      plan,
      limit,
      used,
      remaining,
      canCreateInvoice: plan === 'free' ? (limit !== null && used < limit) : true
    });
  } catch (error) {
    console.error('Subscription usage API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

