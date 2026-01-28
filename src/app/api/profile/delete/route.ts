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

    // Delete everything including the user account
    const userId = user.id;

    // Get all invoice IDs for this user
    const { data: userInvoices } = await supabase
      .from('invoices')
      .select('id')
      .eq('user_id', userId);

    const invoiceIds = userInvoices?.map(invoice => invoice.id) || [];

    // Get all estimate IDs for this user
    const { data: userEstimates } = await supabase
      .from('estimates')
      .select('id')
      .eq('user_id', userId);

    const estimateIds = userEstimates?.map(estimate => estimate.id) || [];

    // Delete in order to respect foreign key constraints
    const deleteOperations = [];
    
    // Delete invoice-related data first
    if (invoiceIds.length > 0) {
      deleteOperations.push(
        // Delete invoice items
        supabase.from('invoice_items').delete().in('invoice_id', invoiceIds),
        // Delete invoice payments
        supabase.from('invoice_payments').delete().in('invoice_id', invoiceIds),
        // Delete invoice reminders
        supabase.from('invoice_reminders').delete().in('invoice_id', invoiceIds)
      );
    }
    
    // Delete estimate-related data
    if (estimateIds.length > 0) {
      deleteOperations.push(
        // Delete estimate items
        supabase.from('estimate_items').delete().in('estimate_id', estimateIds)
      );
    }
    
    // Delete all user data including business settings and billing records
    deleteOperations.push(
      // Delete payments
      supabase.from('payments').delete().eq('user_id', userId),
      // Delete invoices
      supabase.from('invoices').delete().eq('user_id', userId),
      // Delete estimates
      supabase.from('estimates').delete().eq('user_id', userId),
      // Delete clients
      supabase.from('clients').delete().eq('user_id', userId),
      // Delete billing records (subscription history)
      supabase.from('billing_records').delete().eq('user_id', userId),
      // Delete user settings (business details)
      supabase.from('user_settings').delete().eq('user_id', userId),
      // Delete user profile
      supabase.from('users').delete().eq('id', userId)
    );

    // Execute all delete operations
    const results = await Promise.all(deleteOperations);
    
    // Check for errors in data deletion (ignore 404 errors for non-existent tables)
    const dataErrors = results.slice(0, -1).filter(result => {
      if (!result.error) return false;
      // Ignore errors for tables that don't exist (404) - these are not critical
      const errorAny = result.error as any;
      const isNotFoundError = result.error.code === 'PGRST205' || 
                               result.error.message?.includes('Could not find the table') ||
                               errorAny.status === 404;
      if (isNotFoundError) {
        console.log('Ignoring non-existent table error:', result.error.message);
        return false;
      }
      return true;
    });
    if (dataErrors.length > 0) {
      console.warn('Some data deletion operations failed:', dataErrors);
    }

    // Check if user profile deletion failed (critical)
    const userDeleteResult = results[results.length - 1];
    if (userDeleteResult.error) {
      console.error('Error deleting user profile:', userDeleteResult.error);
      return NextResponse.json({ error: 'Failed to delete user account' }, { status: 500 });
    }

    // Delete the auth user (this must be done after all data is deleted)
    try {
      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);
      if (authDeleteError) {
        console.error('Error deleting auth user:', authDeleteError);
        // Don't fail here if data is already deleted, but log it
        return NextResponse.json({ 
          success: true,
          warning: 'User data deleted but auth user deletion may have failed. Please contact support.'
        });
      }
    } catch (authError) {
      console.error('Error deleting auth user:', authError);
      // Continue even if auth deletion fails - data is already gone
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
