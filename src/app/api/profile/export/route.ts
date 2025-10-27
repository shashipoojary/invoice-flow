import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    
    // Get the user from the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.error('Export API: No authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Export API: Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Export API: User authenticated:', user.id);

    // Get format from query parameters
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';

    // Get all user data
    console.log('Export API: Fetching user data...');
    const [profileResult, invoicesResult, clientsResult, paymentsResult, settingsResult] = await Promise.all([
      supabase.from('users').select('*').eq('id', user.id).single(),
      supabase.from('invoices').select('*').eq('user_id', user.id),
      supabase.from('clients').select('*').eq('user_id', user.id),
      supabase.from('payments').select('*').eq('user_id', user.id),
      supabase.from('user_settings').select('*').eq('user_id', user.id)
    ]);
    
    console.log('Export API: Data fetch results:', {
      profile: !!profileResult.data,
      invoices: invoicesResult.data?.length || 0,
      clients: clientsResult.data?.length || 0,
      payments: paymentsResult.data?.length || 0,
      settings: !!settingsResult.data
    });

    // Get invoice items for all user invoices
    const invoiceIds = invoicesResult.data?.map(invoice => invoice.id) || [];
    let itemsResult: any = { data: [] };
    
    if (invoiceIds.length > 0) {
      try {
        itemsResult = await supabase.from('invoice_items').select('*').in('invoice_id', invoiceIds);
        if (itemsResult.error) {
          console.error('Error fetching invoice items:', itemsResult.error);
          itemsResult = { data: [] };
        }
      } catch (error) {
        console.error('Error fetching invoice items:', error);
        itemsResult = { data: [] };
      }
    }

    // Create business report data
    const businessReport = {
      reportInfo: {
        businessName: (settingsResult.data as any)?.[0]?.business_name || 'Your Business',
        generatedAt: new Date().toISOString(),
        period: 'All Time'
      },
      profile: profileResult.data || {},
      invoices: invoicesResult.data || [],
      clients: clientsResult.data || [],
      payments: paymentsResult.data || [],
      invoiceItems: itemsResult.data || [],
      settings: settingsResult.data || {},
      summary: {
        totalInvoices: invoicesResult.data?.length || 0,
        totalClients: clientsResult.data?.length || 0,
        totalRevenue: invoicesResult.data?.reduce((sum, invoice) => sum + (invoice.total || 0), 0) || 0,
        paidInvoices: invoicesResult.data?.filter(inv => inv.status === 'paid').length || 0,
        pendingInvoices: invoicesResult.data?.filter(inv => inv.status === 'pending').length || 0,
        overdueInvoices: invoicesResult.data?.filter(inv => inv.status === 'overdue').length || 0
      }
    };

    // Generate export data based on format
    let exportData;
    let contentType;
    let fileExtension;
    
    try {
      switch (format.toLowerCase()) {
        case 'json':
          exportData = JSON.stringify(businessReport, null, 2);
          contentType = 'application/json';
          fileExtension = 'json';
          break;
        case 'csv':
        default:
          exportData = generateCSVReport(businessReport);
          contentType = 'text/csv; charset=utf-8';
          fileExtension = 'csv';
          break;
      }
    } catch (error) {
      console.error(`Error generating ${format} report:`, error);
      // Return a simple fallback based on format
      if (format === 'json') {
        exportData = JSON.stringify({ error: 'Export failed', message: (error as Error).message }, null, 2);
        contentType = 'application/json';
        fileExtension = 'json';
      } else {
        exportData = `Business Financial Report\nGenerated: ${new Date().toISOString()}\nBusiness: ${businessReport.reportInfo?.businessName || 'Your Business'}\n\nExport Error: ${(error as Error).message}\n\nPlease try again or contact support if the issue persists.`;
        contentType = 'text/plain';
        fileExtension = 'txt';
      }
    }

    // Return file based on format
    return new NextResponse(exportData, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="business-report-${new Date().toISOString().split('T')[0]}.${fileExtension}"`
      }
    });
  } catch (error) {
    console.error('Data export error:', error);
    
    // Try to return a simple fallback export
    try {
      const fallbackCsv = `Business Financial Report\nGenerated: ${new Date().toISOString()}\nBusiness: Your Business\n\nExport Error: ${(error as Error).message}\n\nPlease try again or contact support if the issue persists.`;
      
      return new NextResponse(fallbackCsv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="business-report-error-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    } catch (fallbackError) {
      console.error('Fallback export also failed:', fallbackError);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
}

// Helper function to generate CSV report
function generateCSVReport(report: any) {
  let csv = '';
  
  // Header
  csv += `Business Financial Report\n`;
  csv += `Generated: ${report.reportInfo.generatedAt}\n`;
  csv += `Business: ${report.reportInfo.businessName}\n`;
  csv += `Period: ${report.reportInfo.period}\n\n`;
  
  // Summary
  csv += `SUMMARY\n`;
  csv += `Total Invoices,${report.summary.totalInvoices}\n`;
  csv += `Total Clients,${report.summary.totalClients}\n`;
  csv += `Total Revenue,${report.summary.totalRevenue}\n`;
  csv += `Paid Invoices,${report.summary.paidInvoices}\n`;
  csv += `Pending Invoices,${report.summary.pendingInvoices}\n`;
  csv += `Overdue Invoices,${report.summary.overdueInvoices}\n\n`;
  
  // Invoices
  if (report.invoices.length > 0) {
    csv += `INVOICES\n`;
    csv += `Invoice Number,Client,Amount,Status,Due Date,Created Date\n`;
    report.invoices.forEach((invoice: any) => {
      csv += `${invoice.invoice_number || ''},${invoice.client_name || ''},${invoice.total || 0},${invoice.status || ''},${invoice.due_date || ''},${invoice.created_at || ''}\n`;
    });
    csv += `\n`;
  }
  
  // Clients
  if (report.clients.length > 0) {
    csv += `CLIENTS\n`;
    csv += `Name,Email,Company,Phone,Address,Created Date\n`;
    report.clients.forEach((client: any) => {
      csv += `${client.name || ''},${client.email || ''},${client.company || ''},${client.phone || ''},${client.address || ''},${client.created_at || ''}\n`;
    });
    csv += `\n`;
  }
  
  // Payments
  if (report.payments.length > 0) {
    csv += `PAYMENTS\n`;
    csv += `Invoice ID,Amount,Provider,Status,Date\n`;
    report.payments.forEach((payment: any) => {
      csv += `${payment.invoice_id || ''},${payment.amount || 0},${payment.provider || ''},${payment.status || ''},${payment.created_at || ''}\n`;
    });
  }
  
  return csv;
}