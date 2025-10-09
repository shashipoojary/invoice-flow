import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const dateRange = searchParams.get('dateRange') || '30';

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(dateRange));

    // Get reminder statistics
    const { data: reminders, error: remindersError } = await supabase
      .from('invoice_reminders')
      .select(`
        *,
        invoices (
          total,
          status,
          due_date
        )
      `)
      .eq('invoices.user_id', userId)
      .gte('sent_at', startDate.toISOString())
      .lte('sent_at', endDate.toISOString());

    if (remindersError) {
      console.error('Error fetching reminder stats:', remindersError);
      return NextResponse.json({ error: 'Failed to fetch reminder statistics' }, { status: 500 });
    }

    // Calculate statistics
    const totalSent = reminders?.length || 0;
    const byType = {
      friendly: reminders?.filter(r => r.reminder_type === 'friendly').length || 0,
      polite: reminders?.filter(r => r.reminder_type === 'polite').length || 0,
      firm: reminders?.filter(r => r.reminder_type === 'firm').length || 0,
      urgent: reminders?.filter(r => r.reminder_type === 'urgent').length || 0,
    };

    const byStatus = {
      paid: reminders?.filter(r => r.invoices?.status === 'paid').length || 0,
      sent: reminders?.filter(r => r.invoices?.status === 'sent').length || 0,
      overdue: reminders?.filter(r => r.invoices?.status === 'overdue').length || 0,
    };

    const totalRevenue = reminders
      ?.filter(r => r.invoices?.status === 'paid')
      .reduce((sum, r) => sum + (r.invoices?.total || 0), 0) || 0;

    const successRate = totalSent > 0 ? (byStatus.paid / totalSent) * 100 : 0;

    // Get recent activity
    const recentReminders = reminders
      ?.sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime())
      .slice(0, 10) || [];

    return NextResponse.json({
      success: true,
      stats: {
        totalSent,
        successRate,
        byType,
        byStatus,
        totalRevenue,
        averageResponseTime: 0 // TODO: Calculate based on payment timing
      },
      recentReminders
    });

  } catch (error) {
    console.error('Error in reminder stats API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
