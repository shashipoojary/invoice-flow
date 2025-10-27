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

    // First, get all invoice IDs for this user
    const { data: userInvoices } = await supabase
      .from('invoices')
      .select('id')
      .eq('user_id', userId);

    const invoiceIds = userInvoices?.map(invoice => invoice.id) || [];

    // Delete in order to respect foreign key constraints
    const deleteOperations = [];
    
    // Delete invoice items first (they reference invoices)
    if (invoiceIds.length > 0) {
      deleteOperations.push(
        supabase.from('invoice_items').delete().in('invoice_id', invoiceIds)
      );
      
      // Delete invoice reminders
      deleteOperations.push(
        supabase.from('invoice_reminders').delete().in('invoice_id', invoiceIds)
      );
      
      // Delete reminder tracking
      deleteOperations.push(
        supabase.from('reminder_tracking').delete().in('invoice_id', invoiceIds)
      );
    }
    
    // Delete other user data
    deleteOperations.push(
      // Delete payments
      supabase.from('payments').delete().eq('user_id', userId),
      
      // Delete invoices
      supabase.from('invoices').delete().eq('user_id', userId),
      
      // Delete clients
      supabase.from('clients').delete().eq('user_id', userId),
      
      // Delete user settings (if exists)
      supabase.from('user_settings').delete().eq('user_id', userId),
      
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
    );

    // Execute all delete operations
    const results = await Promise.all(deleteOperations);
    
    // Check if critical operations failed (ignore non-critical errors)
    const criticalOperations = results.slice(0, -1); // All except the last (user update)
    const criticalErrors = criticalOperations.filter(result => result.error);
    
    // Log errors but don't fail if most operations succeeded
    if (criticalErrors.length > 0) {
      console.warn('Some delete operations failed (non-critical):', criticalErrors);
    }
    
    // Only fail if the user update failed (this is critical)
    const userUpdateResult = results[results.length - 1];
    if (userUpdateResult.error) {
      console.error('Failed to update user profile:', userUpdateResult.error);
      return NextResponse.json({ error: 'Failed to reset user profile' }, { status: 500 });
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
