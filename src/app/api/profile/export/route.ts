import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

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
        case 'pdf':
          exportData = await generatePDFReport(businessReport);
          contentType = 'application/pdf';
          fileExtension = 'pdf';
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
    const body = typeof exportData === 'string'
      ? exportData
      : (() => {
          const u8 = exportData as Uint8Array;
          return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
        })();

    return new Response(body as unknown as BodyInit, {
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

// Helper function to generate PDF report
async function generatePDFReport(report: any) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  const { width, height } = page.getSize();
  
  // Load fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  let yPosition = height - 60;
  const margin = 60;
  const lineHeight = 18;
  const sectionSpacing = 25;
  
  // Helper function to add text with proper width calculation
  const addText = (text: string, x: number, y: number, fontSize: number = 12, isBold: boolean = false, maxWidth?: number) => {
    const textFont = isBold ? boldFont : font;
    let displayText = text;
    
    if (maxWidth) {
      const textWidth = textFont.widthOfTextAtSize(text, fontSize);
      if (textWidth > maxWidth) {
        // Truncate text if too long
        const ratio = maxWidth / textWidth;
        const maxChars = Math.floor(text.length * ratio * 0.9);
        displayText = text.substring(0, maxChars) + '...';
      }
    }
    
    page.drawText(displayText, {
      x,
      y,
      size: fontSize,
      font: textFont,
      color: rgb(0, 0, 0),
    });
  };
  
  // Helper function to add centered text
  const addCenteredText = (text: string, y: number, fontSize: number = 12, isBold: boolean = false) => {
    const textFont = isBold ? boldFont : font;
    const textWidth = textFont.widthOfTextAtSize(text, fontSize);
    const x = (width - textWidth) / 2;
    addText(text, x, y, fontSize, isBold);
  };
  
  // Helper function to add line
  const addLine = (y: number, thickness: number = 1, color: any = rgb(0.7, 0.7, 0.7)) => {
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness,
      color,
    });
  };
  
  // Helper function to add table row
  const addTableRow = (y: number, columns: string[], columnWidths: number[], isHeader: boolean = false) => {
    let x = margin;
    columns.forEach((text, index) => {
      addText(text, x, y, 11, isHeader, columnWidths[index]);
      x += columnWidths[index];
    });
  };
  
  // Helper function to add section header
  const addSectionHeader = (title: string, y: number) => {
    addText(title, margin, y, 16, true);
    addLine(y - 5, 2, rgb(0.2, 0.2, 0.2));
  };
  
  // Title and Header
  addCenteredText('BUSINESS FINANCIAL REPORT', yPosition, 28, true);
  yPosition -= 50;
  
  // Report info box
  const infoBoxHeight = 80;
  page.drawRectangle({
    x: margin,
    y: yPosition - infoBoxHeight,
    width: width - 2 * margin,
    height: infoBoxHeight,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 1,
  });
  
  const infoY = yPosition - 25;
  addText(`Business: ${report.reportInfo.businessName}`, margin + 15, infoY, 14, true);
  addText(`Generated: ${new Date(report.reportInfo.generatedAt).toLocaleDateString()}`, margin + 15, infoY - 20, 12);
  addText(`Period: ${report.reportInfo.period}`, margin + 15, infoY - 40, 12);
  
  yPosition -= infoBoxHeight + sectionSpacing;
  
  // Summary section
  addSectionHeader('SUMMARY', yPosition);
  yPosition -= 30;
  
  // Summary in a grid layout
  const summaryData = [
    [`Total Invoices: ${report.summary.totalInvoices}`, `Total Clients: ${report.summary.totalClients}`],
    [`Total Revenue: $${report.summary.totalRevenue.toFixed(2)}`, `Paid Invoices: ${report.summary.paidInvoices}`],
    [`Pending Invoices: ${report.summary.pendingInvoices}`, `Overdue Invoices: ${report.summary.overdueInvoices}`]
  ];
  
  summaryData.forEach(row => {
    addText(row[0], margin, yPosition, 12, true);
    addText(row[1], width / 2, yPosition, 12, true);
    yPosition -= lineHeight;
  });
  
  yPosition -= sectionSpacing;
  
  // Invoices section
  if (report.invoices.length > 0) {
    addSectionHeader('INVOICES', yPosition);
    yPosition -= 30;
    
    // Table with proper column widths
    const columnWidths = [120, 150, 80, 80, 100];
    const tableHeaders = ['Invoice #', 'Client', 'Amount', 'Status', 'Due Date'];
    
    // Table header with background
    page.drawRectangle({
      x: margin,
      y: yPosition - 20,
      width: width - 2 * margin,
      height: 20,
      color: rgb(0.95, 0.95, 0.95),
    });
    
    addTableRow(yPosition - 5, tableHeaders, columnWidths, true);
    yPosition -= 30;
    
    // Invoice rows
    const invoicesToShow = report.invoices.slice(0, 15);
    invoicesToShow.forEach((invoice: any, index: number) => {
      if (yPosition < 150) return; // Stop if we're near the bottom
      
      // Alternate row background
      if (index % 2 === 0) {
        page.drawRectangle({
          x: margin,
          y: yPosition - 15,
          width: width - 2 * margin,
          height: 15,
          color: rgb(0.98, 0.98, 0.98),
        });
      }
      
      const clientName = invoice.client_name || 'N/A';
      const status = invoice.status || 'N/A';
      const dueDate = invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A';
      
      addTableRow(yPosition - 3, [
        invoice.invoice_number || 'N/A',
        clientName,
        `$${(invoice.total || 0).toFixed(2)}`,
        status,
        dueDate
      ], columnWidths);
      
      yPosition -= 20;
    });
    
    if (report.invoices.length > 15) {
      yPosition -= 10;
      addText(`... and ${report.invoices.length - 15} more invoices`, margin, yPosition, 10);
    }
    
    yPosition -= sectionSpacing;
  }
  
  // Clients section
  if (report.clients.length > 0) {
    addSectionHeader('CLIENTS', yPosition);
    yPosition -= 30;
    
    // Table with proper column widths
    const columnWidths = [120, 200, 150];
    const tableHeaders = ['Name', 'Email', 'Company'];
    
    // Table header with background
    page.drawRectangle({
      x: margin,
      y: yPosition - 20,
      width: width - 2 * margin,
      height: 20,
      color: rgb(0.95, 0.95, 0.95),
    });
    
    addTableRow(yPosition - 5, tableHeaders, columnWidths, true);
    yPosition -= 30;
    
    // Client rows
    const clientsToShow = report.clients.slice(0, 12);
    clientsToShow.forEach((client: any, index: number) => {
      if (yPosition < 150) return;
      
      // Alternate row background
      if (index % 2 === 0) {
        page.drawRectangle({
          x: margin,
          y: yPosition - 15,
          width: width - 2 * margin,
          height: 15,
          color: rgb(0.98, 0.98, 0.98),
        });
      }
      
      addTableRow(yPosition - 3, [
        client.name || 'N/A',
        client.email || 'N/A',
        client.company || 'N/A'
      ], columnWidths);
      
      yPosition -= 20;
    });
    
    if (report.clients.length > 12) {
      yPosition -= 10;
      addText(`... and ${report.clients.length - 12} more clients`, margin, yPosition, 10);
    }
  }
  
  // Footer
  yPosition = 60;
  addLine(yPosition, 1, rgb(0.3, 0.3, 0.3));
  yPosition -= 20;
  
  const footerText = `Report generated on ${new Date().toLocaleDateString()}`;
  const footerTextWidth = font.widthOfTextAtSize(footerText, 10);
  addText(footerText, margin, yPosition, 10);
  addText('Invoice Flow Pro', width - margin - font.widthOfTextAtSize('Invoice Flow Pro', 10), yPosition, 10);
  
  return await pdfDoc.save();
}