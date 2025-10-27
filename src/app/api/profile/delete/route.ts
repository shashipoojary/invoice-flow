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

    // Delete all user data in correct order to respect foreign key constraints
    const userId = user.id;

    // First, get all invoice IDs for this user
    const { data: userInvoices } = await supabase
      .from('invoices')
      .select('id')
      .eq('user_id', userId);

    const invoiceIds = userInvoices?.map(invoice => invoice.id) || [];

    // Delete in order to respect foreign key constraints
    const deleteOperations = [
      // Delete invoice items first (they reference invoices)
      supabase.from('invoice_items').delete().in('invoice_id', invoiceIds),
      
      // Delete invoice reminders
      supabase.from('invoice_reminders').delete().in('invoice_id', invoiceIds),
      
      // Delete reminder tracking
      supabase.from('reminder_tracking').delete().in('invoice_id', invoiceIds),
      
      // Delete payments
      supabase.from('payments').delete().eq('user_id', userId),
      
      // Delete invoices
      supabase.from('invoices').delete().eq('user_id', userId),
      
      // Delete clients
      supabase.from('clients').delete().eq('user_id', userId),
      
      // Delete user settings
      supabase.from('user_settings').delete().eq('user_id', userId),
      
      // Finally, delete the user profile (this will cascade to auth.users)
      supabase.from('users').delete().eq('id', userId)
    ];

    // Execute all delete operations
    const results = await Promise.all(deleteOperations);
    
    // Log any errors but don't fail unless critical
    const criticalOperations = results.slice(0, -1); // All except the last (user delete)
    const criticalErrors = criticalOperations.filter(result => result.error);
    
    if (criticalErrors.length > 0) {
      console.warn('Some delete operations failed (non-critical):', criticalErrors);
    }

    // Check if user deletion failed (this is critical)
    const userDeleteResult = results[results.length - 1];
    if (userDeleteResult.error) {
      console.error('Error deleting user profile:', userDeleteResult.error);
      return NextResponse.json({ error: 'Failed to delete user account' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
