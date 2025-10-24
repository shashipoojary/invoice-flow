import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

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

    // Get format from query parameters
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';

    // Get all user data with error handling
    const [profileResult, invoicesResult, clientsResult, paymentsResult, settingsResult] = await Promise.all([
      supabase.from('users').select('*').eq('id', user.id).single(),
      supabase.from('invoices').select('*').eq('user_id', user.id),
      supabase.from('clients').select('*').eq('user_id', user.id),
      supabase.from('payments').select('*').eq('user_id', user.id),
      supabase.from('business_settings').select('*').eq('user_id', user.id)
    ]);

    // Handle potential errors in data fetching
    if (profileResult.error) {
      console.error('Error fetching profile:', profileResult.error);
    }
    if (invoicesResult.error) {
      console.error('Error fetching invoices:', invoicesResult.error);
    }
    if (clientsResult.error) {
      console.error('Error fetching clients:', clientsResult.error);
    }
    if (paymentsResult.error) {
      console.error('Error fetching payments:', paymentsResult.error);
    }
    if (settingsResult.error) {
      console.error('Error fetching settings:', settingsResult.error);
    }

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

    // Process data for business reports with safe defaults
    const invoices = invoicesResult.data || [];
    const clients = clientsResult.data || [];
    const payments = paymentsResult.data || [];
    const invoiceItems = itemsResult.data || [];
    const businessSettings = settingsResult.data || [];
    const profile = profileResult.data || {};

    // Generate comprehensive business report with safe data access
    const businessReport = {
      // Header Information
      reportInfo: {
        generatedDate: new Date().toISOString(),
        reportType: 'Business Financial Report',
        period: `${new Date().getFullYear()}`,
        businessName: businessSettings[0]?.business_name || profile?.company || 'Your Business',
        businessEmail: user.email,
        reportId: `RPT-${Date.now()}`
      },

      // Executive Summary
      executiveSummary: {
        totalInvoices: invoices.length,
        totalRevenue: invoices.reduce((sum, inv) => sum + (inv.total || 0), 0),
        totalClients: clients.length,
        paidInvoices: invoices.filter(inv => inv.status === 'paid').length,
        pendingInvoices: invoices.filter(inv => inv.status === 'pending' || inv.status === 'sent').length,
        overdueInvoices: invoices.filter(inv => {
          if (inv.status !== 'pending' && inv.status !== 'sent') return false;
          const dueDate = new Date(inv.due_date);
          return dueDate < new Date();
        }).length
      },

      // Revenue Analysis
      revenueAnalysis: {
        monthlyRevenue: generateMonthlyRevenue(invoices),
        clientRevenue: generateClientRevenue(invoices, clients),
        paymentMethods: generatePaymentAnalysis(payments),
        taxSummary: generateTaxSummary(invoices)
      },

      // Invoice Details (Tax Ready)
      invoiceDetails: invoices.map(invoice => {
        const items = invoiceItems.filter((item: any) => item.invoice_id === invoice.id);
        const client = clients.find(c => c.id === invoice.client_id);
        
        return {
          invoiceNumber: invoice.invoice_number,
          clientName: client?.name || 'Unknown Client',
          clientEmail: client?.email || '',
          issueDate: invoice.created_at,
          dueDate: invoice.due_date,
          status: invoice.status,
          subtotal: invoice.subtotal,
          tax: invoice.tax || 0,
          discount: invoice.discount || 0,
          total: invoice.total,
          currency: invoice.currency || 'USD',
          items: items.map((item: any) => ({
            description: item.description,
            quantity: item.qty,
            rate: item.rate,
            lineTotal: item.line_total
          })),
          paymentStatus: getPaymentStatus(invoice, payments),
          overdueDays: getOverdueDays(invoice)
        };
      }),

      // Client Analysis
      clientAnalysis: clients.map(client => {
        const clientInvoices = invoices.filter(inv => inv.client_id === client.id);
        const totalRevenue = clientInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
        
        return {
          clientName: client.name,
          email: client.email,
          company: client.company,
          phone: client.phone,
          totalInvoices: clientInvoices.length,
          totalRevenue: totalRevenue,
          lastInvoiceDate: clientInvoices.length > 0 
            ? new Date(Math.max(...clientInvoices.map(inv => new Date(inv.created_at).getTime())))
            : null,
          averageInvoiceValue: clientInvoices.length > 0 ? totalRevenue / clientInvoices.length : 0
        };
      }),

      // Payment Reconciliation
      paymentReconciliation: {
        totalPayments: payments.length,
        totalAmountReceived: payments.reduce((sum, payment) => sum + (payment.amount || 0), 0),
        paymentBreakdown: generatePaymentBreakdown(payments),
        outstandingAmount: calculateOutstandingAmount(invoices, payments)
      },

      // Tax Information
      taxInformation: {
        totalTaxCollected: invoices.reduce((sum, inv) => sum + (inv.tax || 0), 0),
        taxableRevenue: invoices.reduce((sum, inv) => sum + (inv.subtotal || 0), 0),
        taxRate: calculateAverageTaxRate(invoices),
        quarterlyBreakdown: generateQuarterlyTaxBreakdown(invoices)
      },

      // Business Settings
      businessSettings: businessSettings[0] || {},

      // Raw Data (for backup)
      rawData: {
        invoices: invoices,
        clients: clients,
        payments: payments,
        invoiceItems: invoiceItems
      }
    };

    // Generate export data based on format
    let exportData;
    let contentType;
    let fileExtension;
    
    try {
      switch (format.toLowerCase()) {
        case 'pdf':
          exportData = generatePDFReport(businessReport);
          contentType = 'application/pdf';
          fileExtension = 'pdf';
          break;
        case 'xlsx':
          exportData = generateExcelReport(businessReport);
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          fileExtension = 'xlsx';
          break;
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

// Helper functions for report generation
function generateMonthlyRevenue(invoices: any[]) {
  try {
    const monthlyData: { [key: string]: number } = {};
    
    if (!Array.isArray(invoices)) return [];
    
    invoices.forEach(invoice => {
      if (invoice && invoice.status === 'paid' && invoice.created_at) {
        try {
          const month = new Date(invoice.created_at).toISOString().substring(0, 7);
          monthlyData[month] = (monthlyData[month] || 0) + (invoice.total || 0);
        } catch (dateError) {
          console.error('Error processing invoice date:', dateError);
        }
      }
    });
    
    return Object.entries(monthlyData).map(([month, revenue]) => ({
      month,
      revenue
    }));
  } catch (error) {
    console.error('Error generating monthly revenue:', error);
    return [];
  }
}

function generateClientRevenue(invoices: any[], clients: any[]) {
  try {
    const clientRevenue: { [key: string]: { name: string; revenue: number; invoices: number } } = {};
    
    if (!Array.isArray(invoices) || !Array.isArray(clients)) return [];
    
    invoices.forEach(invoice => {
      if (invoice && invoice.status === 'paid') {
        const client = clients.find(c => c && c.id === invoice.client_id);
        const clientName = client?.name || 'Unknown';
        
        if (!clientRevenue[clientName]) {
          clientRevenue[clientName] = { name: clientName, revenue: 0, invoices: 0 };
        }
        
        clientRevenue[clientName].revenue += invoice.total || 0;
        clientRevenue[clientName].invoices += 1;
      }
    });
    
    return Object.values(clientRevenue).sort((a, b) => b.revenue - a.revenue);
  } catch (error) {
    console.error('Error generating client revenue:', error);
    return [];
  }
}

function generatePaymentAnalysis(payments: any[]) {
  try {
    const methods: { [key: string]: number } = {};
    
    if (!Array.isArray(payments)) return [];
    
    payments.forEach(payment => {
      if (payment) {
        const method = payment.payment_method || 'Unknown';
        methods[method] = (methods[method] || 0) + (payment.amount || 0);
      }
    });
    
    return Object.entries(methods).map(([method, amount]) => ({
      method,
      amount
    }));
  } catch (error) {
    console.error('Error generating payment analysis:', error);
    return [];
  }
}

function generateTaxSummary(invoices: any[]) {
  try {
    if (!Array.isArray(invoices)) {
      return {
        totalTaxCollected: 0,
        taxableRevenue: 0,
        averageTaxRate: 0
      };
    }
    
    return {
      totalTaxCollected: invoices.reduce((sum, inv) => sum + (inv?.tax || 0), 0),
      taxableRevenue: invoices.reduce((sum, inv) => sum + (inv?.subtotal || 0), 0),
      averageTaxRate: calculateAverageTaxRate(invoices)
    };
  } catch (error) {
    console.error('Error generating tax summary:', error);
    return {
      totalTaxCollected: 0,
      taxableRevenue: 0,
      averageTaxRate: 0
    };
  }
}

function calculateAverageTaxRate(invoices: any[]) {
  try {
    if (!Array.isArray(invoices)) return 0;
    
    const totalTax = invoices.reduce((sum, inv) => sum + (inv?.tax || 0), 0);
    const totalSubtotal = invoices.reduce((sum, inv) => sum + (inv?.subtotal || 0), 0);
    return totalSubtotal > 0 ? (totalTax / totalSubtotal) * 100 : 0;
  } catch (error) {
    console.error('Error calculating average tax rate:', error);
    return 0;
  }
}

function getPaymentStatus(invoice: any, payments: any[]) {
  try {
    if (!invoice || !Array.isArray(payments)) return 'Unknown';
    const invoicePayments = payments.filter(p => p && p.invoice_id === invoice.id);
    return invoicePayments.length > 0 ? 'Paid' : 'Unpaid';
  } catch (error) {
    console.error('Error getting payment status:', error);
    return 'Unknown';
  }
}

function getOverdueDays(invoice: any) {
  try {
    if (!invoice || invoice.status === 'paid') return 0;
    if (!invoice.due_date) return 0;
    
    const dueDate = new Date(invoice.due_date);
    const today = new Date();
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  } catch (error) {
    console.error('Error calculating overdue days:', error);
    return 0;
  }
}

function generatePaymentBreakdown(payments: any[]) {
  try {
    const breakdown: { [key: string]: { count: number; amount: number } } = {};
    
    if (!Array.isArray(payments)) return breakdown;
    
    payments.forEach(payment => {
      if (payment) {
        const method = payment.payment_method || 'Unknown';
        if (!breakdown[method]) {
          breakdown[method] = { count: 0, amount: 0 };
        }
        breakdown[method].count += 1;
        breakdown[method].amount += payment.amount || 0;
      }
    });
    
    return breakdown;
  } catch (error) {
    console.error('Error generating payment breakdown:', error);
    return {};
  }
}

function calculateOutstandingAmount(invoices: any[], payments: any[]) {
  try {
    if (!Array.isArray(invoices) || !Array.isArray(payments)) return 0;
    
    const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv?.total || 0), 0);
    const totalPaid = payments.reduce((sum, payment) => sum + (payment?.amount || 0), 0);
    return totalInvoiced - totalPaid;
  } catch (error) {
    console.error('Error calculating outstanding amount:', error);
    return 0;
  }
}

function generateQuarterlyTaxBreakdown(invoices: any[]) {
  try {
    const quarters: { [key: string]: { revenue: number; tax: number } } = {};
    
    if (!Array.isArray(invoices)) return [];
    
    invoices.forEach(invoice => {
      if (invoice && invoice.created_at) {
        try {
          const date = new Date(invoice.created_at);
          const quarter = `Q${Math.ceil((date.getMonth() + 1) / 3)}-${date.getFullYear()}`;
          
          if (!quarters[quarter]) {
            quarters[quarter] = { revenue: 0, tax: 0 };
          }
          
          quarters[quarter].revenue += invoice.subtotal || 0;
          quarters[quarter].tax += invoice.tax || 0;
        } catch (dateError) {
          console.error('Error processing invoice date for quarterly breakdown:', dateError);
        }
      }
    });
    
    return Object.entries(quarters).map(([quarter, data]) => ({
      quarter,
      ...data
    }));
  } catch (error) {
    console.error('Error generating quarterly tax breakdown:', error);
    return [];
  }
}

function generatePDFReport(report: any) {
  try {
    console.log('Starting PDF generation with report:', report);
    // Create a new PDF document with modern styling
    const doc = new jsPDF();
    
    // Set up modern fonts and colors
    doc.setFont('helvetica');
    
    // Simple header first
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text('Business Financial Report', 105, 30, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated ${new Date().toLocaleDateString()}`, 105, 40, { align: 'center' });
    doc.text(`${report.reportInfo?.businessName || 'Your Business'}`, 105, 47, { align: 'center' });
    
    let yPosition = 70;
    
    // Executive Summary
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', 20, yPosition);
    yPosition += 20;
    
    // Simple summary data
    const summaryData = [
      ['Total Invoices', report.executiveSummary?.totalInvoices || 0],
      ['Total Revenue', `$${(report.executiveSummary?.totalRevenue || 0).toLocaleString()}`],
      ['Total Clients', report.executiveSummary?.totalClients || 0],
      ['Paid Invoices', report.executiveSummary?.paidInvoices || 0],
      ['Pending Invoices', report.executiveSummary?.pendingInvoices || 0],
      ['Overdue Invoices', report.executiveSummary?.overdueInvoices || 0]
    ];
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    
    summaryData.forEach(([label, value]) => {
      doc.text(`${label}:`, 20, yPosition);
      doc.text(value.toString(), 120, yPosition);
      yPosition += 10;
    });
    
    yPosition += 20;
    
    // Tax Information
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text('Tax Information', 20, yPosition);
    yPosition += 20;
    
    const taxData = [
      ['Total Tax Collected', `$${(report.taxInformation?.totalTaxCollected || 0).toLocaleString()}`],
      ['Taxable Revenue', `$${(report.taxInformation?.taxableRevenue || 0).toLocaleString()}`],
      ['Average Tax Rate', `${(report.taxInformation?.taxRate || 0).toFixed(2)}%`]
    ];
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    
    taxData.forEach(([label, value]) => {
      doc.text(`${label}:`, 20, yPosition);
      doc.text(value.toString(), 120, yPosition);
      yPosition += 10;
    });
    
    yPosition += 20;
    
    // Payment Reconciliation
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Reconciliation', 20, yPosition);
    yPosition += 20;
    
    const paymentData = [
      ['Total Payments', report.paymentReconciliation?.totalPayments || 0],
      ['Amount Received', `$${(report.paymentReconciliation?.totalAmountReceived || 0).toLocaleString()}`],
      ['Outstanding', `$${(report.paymentReconciliation?.outstandingAmount || 0).toLocaleString()}`]
    ];
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    
    paymentData.forEach(([label, value]) => {
      doc.text(`${label}:`, 20, yPosition);
      doc.text(value.toString(), 120, yPosition);
      yPosition += 10;
    });
    
    yPosition += 20;
    
    // Invoice Details
    if (report.invoiceDetails && report.invoiceDetails.length > 0) {
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text('Invoice Details', 20, yPosition);
      yPosition += 20;
      
      const recentInvoices = report.invoiceDetails.slice(0, 15);
      
      // Table header
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text('Invoice #', 20, yPosition);
      doc.text('Client', 50, yPosition);
      doc.text('Date', 80, yPosition);
      doc.text('Due Date', 100, yPosition);
      doc.text('Status', 130, yPosition);
      doc.text('Subtotal', 150, yPosition);
      doc.text('Tax', 170, yPosition);
      doc.text('Total', 185, yPosition);
      yPosition += 8;
      
      // Table rows
      recentInvoices.forEach((invoice: any) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.text(invoice.invoiceNumber || 'N/A', 20, yPosition);
        doc.text((invoice.clientName || 'Unknown').substring(0, 12), 50, yPosition);
        doc.text(new Date(invoice.issueDate).toLocaleDateString(), 80, yPosition);
        doc.text(new Date(invoice.dueDate).toLocaleDateString(), 100, yPosition);
        doc.text(invoice.status || 'N/A', 130, yPosition);
        doc.text(`$${(invoice.subtotal || 0).toLocaleString()}`, 150, yPosition);
        doc.text(`$${(invoice.tax || 0).toLocaleString()}`, 170, yPosition);
        doc.text(`$${(invoice.total || 0).toLocaleString()}`, 185, yPosition);
        yPosition += 6;
      });
      
      yPosition += 15;
    }
    
    // Client Analysis Section
    if (report.clientAnalysis && Array.isArray(report.clientAnalysis) && report.clientAnalysis.length > 0) {
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text('Client Analysis', 20, yPosition);
      yPosition += 20;
      
      const topClients = report.clientAnalysis.slice(0, 10);
      
      // Table header
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text('Client Name', 20, yPosition);
      doc.text('Email', 60, yPosition);
      doc.text('Company', 100, yPosition);
      doc.text('Invoices', 130, yPosition);
      doc.text('Revenue', 150, yPosition);
      doc.text('Avg Value', 175, yPosition);
      yPosition += 8;
      
      // Table rows
      topClients.forEach((client: any) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.text((client.clientName || 'Unknown').substring(0, 15), 20, yPosition);
        doc.text((client.email || 'N/A').substring(0, 15), 60, yPosition);
        doc.text((client.company || '').substring(0, 12), 100, yPosition);
        doc.text((client.totalInvoices || 0).toString(), 130, yPosition);
        doc.text(`$${(client.totalRevenue || 0).toLocaleString()}`, 150, yPosition);
        doc.text(`$${(client.averageInvoiceValue || 0).toLocaleString()}`, 175, yPosition);
        yPosition += 6;
      });
      
      yPosition += 15;
    }
    
    // Monthly Revenue Analysis
    if (report.revenueAnalysis?.monthlyRevenue && Array.isArray(report.revenueAnalysis.monthlyRevenue) && report.revenueAnalysis.monthlyRevenue.length > 0) {
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text('Monthly Revenue Analysis', 20, yPosition);
      yPosition += 20;
      
      const monthlyData = report.revenueAnalysis.monthlyRevenue.slice(0, 12);
      
      // Table header
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text('Month', 20, yPosition);
      doc.text('Revenue', 80, yPosition);
      yPosition += 8;
      
      // Table rows
      monthlyData.forEach((month: any) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.text(month.month || 'N/A', 20, yPosition);
        doc.text(`$${month.revenue || 0}`, 80, yPosition);
        yPosition += 8;
      });
      
      yPosition += 15;
    }
    
    // Footer
    yPosition += 20;
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text('Report Footer', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(`This report was generated on ${new Date().toLocaleDateString()}`, 20, yPosition);
    yPosition += 8;
    doc.text('For questions about this report, please contact support', 20, yPosition);
    yPosition += 8;
    doc.text('Generated by FlowInvoicer - Professional Invoice Management', 20, yPosition);
    
    // Generate PDF buffer
    const pdfBuffer = doc.output('arraybuffer');
    return Buffer.from(pdfBuffer);
    
  } catch (error) {
    console.error('Error generating PDF report:', error);
    console.error('Error details:', (error as Error).message);
    console.error('Error stack:', (error as Error).stack);
    // Return a modern error PDF
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text('Business Financial Report', 105, 50, { align: 'center' });
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text('Error generating PDF. Please try again.', 105, 70, { align: 'center' });
    const pdfBuffer = doc.output('arraybuffer');
    return Buffer.from(pdfBuffer);
  }
}

function generateExcelReport(report: any) {
  try {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Sheet 1: Executive Summary
    const summaryData = [
      ['EXECUTIVE SUMMARY'],
      ['Metric', 'Value'],
      ['Total Invoices', report.executiveSummary?.totalInvoices || 0],
      ['Total Revenue', report.executiveSummary?.totalRevenue || 0],
      ['Total Clients', report.executiveSummary?.totalClients || 0],
      ['Paid Invoices', report.executiveSummary?.paidInvoices || 0],
      ['Pending Invoices', report.executiveSummary?.pendingInvoices || 0],
      ['Overdue Invoices', report.executiveSummary?.overdueInvoices || 0]
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Executive Summary');
    
    // Sheet 2: Tax Information
    const taxData = [
      ['TAX INFORMATION'],
      ['Metric', 'Value'],
      ['Total Tax Collected', report.taxInformation?.totalTaxCollected || 0],
      ['Taxable Revenue', report.taxInformation?.taxableRevenue || 0],
      ['Average Tax Rate', `${(report.taxInformation?.taxRate || 0).toFixed(2)}%`]
    ];
    
    const taxSheet = XLSX.utils.aoa_to_sheet(taxData);
    XLSX.utils.book_append_sheet(workbook, taxSheet, 'Tax Information');
    
    // Sheet 3: Payment Reconciliation
    const paymentData = [
      ['PAYMENT RECONCILIATION'],
      ['Metric', 'Value'],
      ['Total Payments', report.paymentReconciliation?.totalPayments || 0],
      ['Total Amount Received', report.paymentReconciliation?.totalAmountReceived || 0],
      ['Outstanding Amount', report.paymentReconciliation?.outstandingAmount || 0]
    ];
    
    const paymentSheet = XLSX.utils.aoa_to_sheet(paymentData);
    XLSX.utils.book_append_sheet(workbook, paymentSheet, 'Payment Reconciliation');
    
    // Sheet 4: Invoice Details
    if (report.invoiceDetails && report.invoiceDetails.length > 0) {
      const invoiceHeaders = [
        'Invoice Number', 'Client Name', 'Issue Date', 'Due Date', 
        'Status', 'Subtotal', 'Tax', 'Total', 'Currency', 'Overdue Days'
      ];
      
      const invoiceData = [
        ['INVOICE DETAILS'],
        invoiceHeaders,
        ...report.invoiceDetails.map((invoice: any) => [
          invoice.invoiceNumber || 'N/A',
          invoice.clientName || 'Unknown',
          invoice.issueDate || 'N/A',
          invoice.dueDate || 'N/A',
          invoice.status || 'N/A',
          invoice.subtotal || 0,
          invoice.tax || 0,
          invoice.total || 0,
          invoice.currency || 'USD',
          invoice.overdueDays || 0
        ])
      ];
      
      const invoiceSheet = XLSX.utils.aoa_to_sheet(invoiceData);
      XLSX.utils.book_append_sheet(workbook, invoiceSheet, 'Invoice Details');
    }
    
    // Sheet 5: Client Analysis
    if (report.clientAnalysis && report.clientAnalysis.length > 0) {
      const clientHeaders = [
        'Client Name', 'Email', 'Company', 'Total Invoices', 
        'Total Revenue', 'Average Invoice Value', 'Last Invoice Date'
      ];
      
      const clientData = [
        ['CLIENT ANALYSIS'],
        clientHeaders,
        ...report.clientAnalysis.map((client: any) => [
          client.clientName || 'Unknown',
          client.email || 'N/A',
          client.company || '',
          client.totalInvoices || 0,
          client.totalRevenue || 0,
          client.averageInvoiceValue || 0,
          client.lastInvoiceDate || 'N/A'
        ])
      ];
      
      const clientSheet = XLSX.utils.aoa_to_sheet(clientData);
      XLSX.utils.book_append_sheet(workbook, clientSheet, 'Client Analysis');
    }
    
    // Sheet 6: Monthly Revenue
    if (report.revenueAnalysis?.monthlyRevenue && report.revenueAnalysis.monthlyRevenue.length > 0) {
      const monthlyData = [
        ['MONTHLY REVENUE ANALYSIS'],
        ['Month', 'Revenue'],
        ...report.revenueAnalysis.monthlyRevenue.map((month: any) => [
          month.month,
          month.revenue
        ])
      ];
      
      const monthlySheet = XLSX.utils.aoa_to_sheet(monthlyData);
      XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Monthly Revenue');
    }
    
    // Sheet 7: All Data Combined (Main Sheet)
    const allData = [
      ['BUSINESS FINANCIAL REPORT'],
      ['Generated:', report.reportInfo?.generatedDate || new Date().toISOString()],
      ['Business:', report.reportInfo?.businessName || 'Your Business'],
      [''],
      ['EXECUTIVE SUMMARY'],
      ['Total Invoices', report.executiveSummary?.totalInvoices || 0],
      ['Total Revenue', report.executiveSummary?.totalRevenue || 0],
      ['Total Clients', report.executiveSummary?.totalClients || 0],
      ['Paid Invoices', report.executiveSummary?.paidInvoices || 0],
      ['Pending Invoices', report.executiveSummary?.pendingInvoices || 0],
      ['Overdue Invoices', report.executiveSummary?.overdueInvoices || 0],
      [''],
      ['TAX INFORMATION'],
      ['Total Tax Collected', report.taxInformation?.totalTaxCollected || 0],
      ['Taxable Revenue', report.taxInformation?.taxableRevenue || 0],
      ['Average Tax Rate', `${(report.taxInformation?.taxRate || 0).toFixed(2)}%`],
      [''],
      ['PAYMENT RECONCILIATION'],
      ['Total Payments', report.paymentReconciliation?.totalPayments || 0],
      ['Total Amount Received', report.paymentReconciliation?.totalAmountReceived || 0],
      ['Outstanding Amount', report.paymentReconciliation?.outstandingAmount || 0]
    ];
    
    // Add invoice details to main sheet
    if (report.invoiceDetails && report.invoiceDetails.length > 0) {
      allData.push([''], ['INVOICE DETAILS']);
      allData.push([
        'Invoice Number', 'Client Name', 'Issue Date', 'Due Date', 
        'Status', 'Subtotal', 'Tax', 'Total', 'Currency', 'Overdue Days'
      ]);
      
      report.invoiceDetails.forEach((invoice: any) => {
        allData.push([
          invoice.invoiceNumber || 'N/A',
          invoice.clientName || 'Unknown',
          invoice.issueDate || 'N/A',
          invoice.dueDate || 'N/A',
          invoice.status || 'N/A',
          invoice.subtotal || 0,
          invoice.tax || 0,
          invoice.total || 0,
          invoice.currency || 'USD',
          invoice.overdueDays || 0
        ]);
      });
    }
    
    const mainSheet = XLSX.utils.aoa_to_sheet(allData);
    XLSX.utils.book_append_sheet(workbook, mainSheet, 'Complete Report');
    
    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      compression: true 
    });
    
    return excelBuffer;
  } catch (error) {
    console.error('Error generating Excel report:', error);
    // Fallback to CSV format
    return generateCSVReport(report);
  }
}

function generateCSVReport(report: any) {
  try {
    let csv = '';
    
    // Header Section
    csv += `"Business Financial Report"\n`;
    csv += `"Generated: ${report.reportInfo?.generatedDate || new Date().toISOString()}"\n`;
    csv += `"Business: ${report.reportInfo?.businessName || 'Your Business'}"\n`;
    csv += `"Report ID: ${report.reportInfo?.reportId || 'RPT-' + Date.now()}"\n`;
    csv += `"Generated by: FlowInvoicer"\n\n`;
    
    // Executive Summary Section
    csv += `"EXECUTIVE SUMMARY"\n`;
    csv += `"Metric","Value"\n`;
    csv += `"Total Invoices","${report.executiveSummary?.totalInvoices || 0}"\n`;
    csv += `"Total Revenue","$${report.executiveSummary?.totalRevenue || 0}"\n`;
    csv += `"Total Clients","${report.executiveSummary?.totalClients || 0}"\n`;
    csv += `"Paid Invoices","${report.executiveSummary?.paidInvoices || 0}"\n`;
    csv += `"Pending Invoices","${report.executiveSummary?.pendingInvoices || 0}"\n`;
    csv += `"Overdue Invoices","${report.executiveSummary?.overdueInvoices || 0}"\n\n`;
    
    // Tax Information Section
    csv += `"TAX INFORMATION"\n`;
    csv += `"Metric","Value"\n`;
    csv += `"Total Tax Collected","$${report.taxInformation?.totalTaxCollected || 0}"\n`;
    csv += `"Taxable Revenue","$${report.taxInformation?.taxableRevenue || 0}"\n`;
    csv += `"Average Tax Rate","${(report.taxInformation?.taxRate || 0).toFixed(2)}%"\n\n`;
    
    // Payment Reconciliation Section
    csv += `"PAYMENT RECONCILIATION"\n`;
    csv += `"Metric","Value"\n`;
    csv += `"Total Payments","${report.paymentReconciliation?.totalPayments || 0}"\n`;
    csv += `"Total Amount Received","$${report.paymentReconciliation?.totalAmountReceived || 0}"\n`;
    csv += `"Outstanding Amount","$${report.paymentReconciliation?.outstandingAmount || 0}"\n\n`;
    
    // Invoice Details Section
    if (report.invoiceDetails && Array.isArray(report.invoiceDetails) && report.invoiceDetails.length > 0) {
      csv += `"INVOICE DETAILS"\n`;
      csv += `"Invoice Number","Client Name","Issue Date","Due Date","Status","Subtotal","Tax","Total","Currency","Overdue Days"\n`;
      
      report.invoiceDetails.forEach((invoice: any) => {
        const safeInvoice = {
          invoiceNumber: `"${invoice.invoiceNumber || 'N/A'}"`,
          clientName: `"${(invoice.clientName || 'Unknown').replace(/"/g, '""')}"`,
          issueDate: `"${invoice.issueDate || 'N/A'}"`,
          dueDate: `"${invoice.dueDate || 'N/A'}"`,
          status: `"${invoice.status || 'N/A'}"`,
          subtotal: invoice.subtotal || 0,
          tax: invoice.tax || 0,
          total: invoice.total || 0,
          currency: `"${invoice.currency || 'USD'}"`,
          overdueDays: invoice.overdueDays || 0
        };
        csv += `${safeInvoice.invoiceNumber},${safeInvoice.clientName},${safeInvoice.issueDate},${safeInvoice.dueDate},${safeInvoice.status},${safeInvoice.subtotal},${safeInvoice.tax},${safeInvoice.total},${safeInvoice.currency},${safeInvoice.overdueDays}\n`;
      });
      csv += `\n`;
    }
    
    // Client Analysis Section
    if (report.clientAnalysis && Array.isArray(report.clientAnalysis) && report.clientAnalysis.length > 0) {
      csv += `"CLIENT ANALYSIS"\n`;
      csv += `"Client Name","Email","Company","Total Invoices","Total Revenue","Average Invoice Value","Last Invoice Date"\n`;
      
      report.clientAnalysis.forEach((client: any) => {
        const safeClient = {
          clientName: `"${(client.clientName || 'Unknown').replace(/"/g, '""')}"`,
          email: `"${client.email || 'N/A'}"`,
          company: `"${(client.company || '').replace(/"/g, '""')}"`,
          totalInvoices: client.totalInvoices || 0,
          totalRevenue: client.totalRevenue || 0,
          averageInvoiceValue: client.averageInvoiceValue || 0,
          lastInvoiceDate: `"${client.lastInvoiceDate || 'N/A'}"`
        };
        csv += `${safeClient.clientName},${safeClient.email},${safeClient.company},${safeClient.totalInvoices},${safeClient.totalRevenue},${safeClient.averageInvoiceValue},${safeClient.lastInvoiceDate}\n`;
      });
      csv += `\n`;
    }
    
    // Monthly Revenue Section
    if (report.revenueAnalysis?.monthlyRevenue && Array.isArray(report.revenueAnalysis.monthlyRevenue) && report.revenueAnalysis.monthlyRevenue.length > 0) {
      csv += `"MONTHLY REVENUE ANALYSIS"\n`;
      csv += `"Month","Revenue"\n`;
      
      report.revenueAnalysis.monthlyRevenue.forEach((month: any) => {
        csv += `"${month.month}","$${month.revenue}"\n`;
      });
      csv += `\n`;
    }
    
    // Footer
    csv += `"REPORT FOOTER"\n`;
    csv += `"This report was generated on ${new Date().toLocaleDateString()}"\n`;
    csv += `"For questions about this report, please contact support"\n`;
    csv += `"Generated by FlowInvoicer - Professional Invoice Management"\n`;
    
    return csv;
  } catch (error) {
    console.error('Error generating CSV report:', error);
    // Return a simple fallback CSV
    return `"Business Financial Report"\n"Generated: ${new Date().toISOString()}"\n"Business: Your Business"\n\n"Error generating detailed report. Please try again."`;
  }
}