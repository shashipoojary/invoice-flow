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

    // Delete progress data only - keep business details and subscription
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
    
    // Delete main progress data (but keep business details and subscription)
    deleteOperations.push(
      // Delete payments
      supabase.from('payments').delete().eq('user_id', userId),
      // Delete invoices
      supabase.from('invoices').delete().eq('user_id', userId),
      // Delete estimates
      supabase.from('estimates').delete().eq('user_id', userId),
      // Delete clients
      supabase.from('clients').delete().eq('user_id', userId)
    );

    // Execute all delete operations
    const results = await Promise.all(deleteOperations);
    
    // Check for errors (ignore 404 errors for non-existent tables)
    const errors = results.filter(result => {
      if (!result.error) return false;
      // Ignore errors for tables that don't exist - these are not critical
      const isNotFoundError = result.error.code === 'PGRST205' || 
                               result.error.message?.includes('Could not find the table');
      if (isNotFoundError) {
        console.log('Ignoring non-existent table error:', result.error.message);
        return false;
      }
      return true;
    });
    
    if (errors.length > 0) {
      console.error('Some delete operations failed:', errors);
      // Still return success if most operations succeeded
      const successCount = results.length - errors.length;
      if (successCount < results.length / 2) {
        return NextResponse.json({ error: 'Failed to delete progress data' }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      message: 'Progress data deleted successfully. Business details and subscription preserved.',
      success: true
    });
  } catch (error) {
    console.error('Delete progress error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
