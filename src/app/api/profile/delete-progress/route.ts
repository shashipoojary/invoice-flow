import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function DELETE(request: NextRequest) {
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

    // Delete all user data but keep the account
    const userId = user.id;

    // Delete in order to respect foreign key constraints
    const deleteOperations = [
      // Delete invoice items first (they reference invoices)
      supabase.from('invoice_items').delete().eq('user_id', userId),
      
      // Delete invoice reminders
      supabase.from('invoice_reminders').delete().eq('user_id', userId),
      
      // Delete reminder tracking
      supabase.from('reminder_tracking').delete().eq('user_id', userId),
      
      // Delete payments
      supabase.from('payments').delete().eq('user_id', userId),
      
      // Delete invoices
      supabase.from('invoices').delete().eq('user_id', userId),
      
      // Delete clients
      supabase.from('clients').delete().eq('user_id', userId),
      
      // Delete business settings
      supabase.from('business_settings').delete().eq('user_id', userId),
      
      // Delete contact messages
      supabase.from('contact_messages').delete().eq('user_id', userId),
      
      // Update user profile to reset (but keep the account)
      supabase.from('users').update({
        name: null,
        phone: null,
        company: null,
        address: null,
        subscription_plan: 'free',
        subscription_status: 'active',
        next_billing_date: null,
        updated_at: new Date().toISOString()
      }).eq('id', userId)
    ];

    // Execute all delete operations
    const results = await Promise.all(deleteOperations);
    
    // Check if any operation failed
    const hasErrors = results.some(result => result.error);
    if (hasErrors) {
      console.error('Some delete operations failed:', results);
      return NextResponse.json({ error: 'Failed to delete some data' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'All data deleted successfully. Account preserved.',
      deletedCount: results.length
    });
  } catch (error) {
    console.error('Delete progress error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
