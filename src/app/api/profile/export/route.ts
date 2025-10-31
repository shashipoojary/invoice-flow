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
      supabase.from('invoices').select('*, clients(name)').eq('user_id', user.id),
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

    // Map client names to invoices and calculate proper statuses
    const invoices = (invoicesResult.data || []).map((invoice: any) => {
      // Get client name from joined data or from clients array
      const clientName = invoice.clients?.name || 
        (clientsResult.data || []).find((c: any) => c.id === invoice.client_id)?.name || 
        null;
      
      return {
        ...invoice,
        client_name: clientName
      };
    });

    // Calculate pending and overdue invoices properly
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const pendingInvoices = invoices.filter((inv: any) => {
      return inv.status !== 'paid' && inv.status !== 'draft';
    }).length;
    
    const overdueInvoices = invoices.filter((inv: any) => {
      if (inv.status === 'paid' || inv.status === 'draft') return false;
      if (!inv.due_date) return false;
      
      const dueDate = new Date(inv.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < today;
    }).length;

    // Create business report data
    const businessReport = {
      reportInfo: {
        businessName: (settingsResult.data as any)?.[0]?.business_name || 'Your Business',
        generatedAt: new Date().toISOString(),
        period: 'All Time'
      },
      profile: profileResult.data || {},
      invoices: invoices,
      clients: clientsResult.data || [],
      payments: paymentsResult.data || [],
      invoiceItems: itemsResult.data || [],
      settings: settingsResult.data || {},
      summary: {
        totalInvoices: invoices.length || 0,
        totalClients: clientsResult.data?.length || 0,
        totalRevenue: invoices.reduce((sum: number, invoice: any) => sum + (invoice.total || 0), 0) || 0,
        paidInvoices: invoices.filter((inv: any) => inv.status === 'paid').length || 0,
        pendingInvoices: pendingInvoices,
        overdueInvoices: overdueInvoices
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
  const pages: any[] = [];
  let currentPage = pdfDoc.addPage([595.28, 841.89]); // A4 size
  pages.push(currentPage);
  
  const { width, height } = currentPage.getSize();
  
  // Load fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const margin = 50;
  const topMargin = 80;
  const bottomMargin = 60;
  let yPosition = height - topMargin;
  const lineHeight = 16;
  const sectionSpacing = 30;
  const minYPosition = bottomMargin + 40;
  
  // Helper function to add text with word wrapping
  const addText = (text: string, x: number, y: number, fontSize: number = 12, isBold: boolean = false, maxWidth?: number, color?: any) => {
    const textFont = isBold ? boldFont : font;
    const textColor = color || rgb(0, 0, 0);
    let displayText = text || '';
    
    if (maxWidth && maxWidth > 0) {
      const textWidth = textFont.widthOfTextAtSize(displayText, fontSize);
      if (textWidth > maxWidth) {
        // Try to fit text by reducing size or truncating
        let truncated = displayText;
        while (textFont.widthOfTextAtSize(truncated, fontSize) > maxWidth && truncated.length > 0) {
          truncated = truncated.substring(0, truncated.length - 1);
        }
        displayText = truncated.length < displayText.length ? truncated + '...' : truncated;
      }
    }
    
    currentPage.drawText(displayText, {
      x,
      y,
      size: fontSize,
      font: textFont,
      color: textColor,
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
    currentPage.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness,
      color,
    });
  };
  
  // Helper function to check if new page is needed
  const checkNewPage = (requiredSpace: number) => {
    if (yPosition - requiredSpace < minYPosition) {
      currentPage = pdfDoc.addPage([595.28, 841.89]);
      pages.push(currentPage);
      yPosition = height - topMargin;
      return true;
    }
    return false;
  };
  
  // Helper function to add section header
  const addSectionHeader = (title: string) => {
    checkNewPage(40);
    addText(title, margin, yPosition, 18, true);
    addLine(yPosition - 8, 2, rgb(0.2, 0.2, 0.2));
    yPosition -= 35;
  };
  
  // Helper function to add table row with proper alignment
  const addTableRow = (columns: { text: string; width: number; align?: 'left' | 'center' | 'right' }[], isHeader: boolean = false) => {
    checkNewPage(25);
    
    let x = margin;
    const rowHeight = 20;
    const padding = 8;
    
    // Draw row background
    if (isHeader) {
      currentPage.drawRectangle({
        x: margin,
        y: yPosition - rowHeight,
        width: width - 2 * margin,
        height: rowHeight,
        color: rgb(0.15, 0.15, 0.15),
      });
    } else {
      // Alternate row background for readability
      const rowIndex = Math.floor((height - yPosition) / rowHeight);
      if (rowIndex % 2 === 0) {
        currentPage.drawRectangle({
          x: margin,
          y: yPosition - rowHeight,
          width: width - 2 * margin,
          height: rowHeight,
          color: rgb(0.97, 0.97, 0.97),
        });
      }
    }
    
    // Draw column separators
    let currentX = margin;
    for (let i = 0; i < columns.length - 1; i++) {
      currentX += columns[i].width;
      currentPage.drawLine({
        start: { x: currentX, y: yPosition },
        end: { x: currentX, y: yPosition - rowHeight },
        thickness: 0.5,
        color: rgb(0.85, 0.85, 0.85),
      });
    }
    
    // Draw text in each column
    columns.forEach((col, index) => {
      const textX = (() => {
        const textWidth = (isHeader ? boldFont : font).widthOfTextAtSize(col.text, 10);
        switch (col.align) {
          case 'right':
            return x + col.width - padding - textWidth;
          case 'center':
            return x + (col.width - textWidth) / 2;
          default: // left
            return x + padding;
        }
      })();
      
      addText(col.text, textX, yPosition - 14, 10, isHeader, col.width - padding * 2, isHeader ? rgb(1, 1, 1) : undefined);
      x += col.width;
    });
    
    // Draw bottom border
    currentPage.drawLine({
      start: { x: margin, y: yPosition - rowHeight },
      end: { x: width - margin, y: yPosition - rowHeight },
      thickness: 0.5,
      color: rgb(0.85, 0.85, 0.85),
    });
    
    yPosition -= rowHeight + 2;
  };
  
  // Title and Header
  addCenteredText('BUSINESS FINANCIAL REPORT', yPosition, 24, true);
  yPosition -= 45;
  
  // Report info section with clean design
  checkNewPage(100);
  const infoBoxPadding = 15;
  const infoBoxHeight = 90;
  
  // Draw info box with subtle background
  currentPage.drawRectangle({
    x: margin,
    y: yPosition - infoBoxHeight,
    width: width - 2 * margin,
    height: infoBoxHeight,
    color: rgb(0.98, 0.98, 0.98),
    borderColor: rgb(0.2, 0.2, 0.2),
    borderWidth: 1.5,
  });
  
  const infoStartY = yPosition - 25;
  addText('Business Name:', margin + infoBoxPadding, infoStartY, 11, true);
  addText(report.reportInfo?.businessName || 'Your Business', margin + 150, infoStartY, 11, false);
  
  addText('Generated Date:', margin + infoBoxPadding, infoStartY - 22, 11, true);
  addText(new Date(report.reportInfo?.generatedAt || Date.now()).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }), margin + 150, infoStartY - 22, 11, false);
  
  addText('Report Period:', margin + infoBoxPadding, infoStartY - 44, 11, true);
  addText(report.reportInfo?.period || 'All Time', margin + 150, infoStartY - 44, 11, false);
  
  yPosition -= infoBoxHeight + sectionSpacing;
  
  // Summary section with cards
  addSectionHeader('EXECUTIVE SUMMARY');
  
  const summaryCardWidth = (width - 2 * margin - 20) / 2;
  const summaryCardHeight = 60;
  const summaryCards = [
    { label: 'Total Invoices', value: report.summary?.totalInvoices || 0, color: rgb(0.1, 0.4, 0.7) },
    { label: 'Total Clients', value: report.summary?.totalClients || 0, color: rgb(0.1, 0.5, 0.3) },
    { label: 'Total Revenue', value: `$${(report.summary?.totalRevenue || 0).toFixed(2)}`, color: rgb(0.7, 0.3, 0.1) },
    { label: 'Paid Invoices', value: report.summary?.paidInvoices || 0, color: rgb(0.2, 0.6, 0.2) },
  ];
  
  summaryCards.forEach((card, index) => {
    checkNewPage(summaryCardHeight + 10);
    
    const col = index % 2;
    const row = Math.floor(index / 2);
    const cardX = margin + (col * (summaryCardWidth + 20));
    const cardY = yPosition - (row * (summaryCardHeight + 15));
    
    // Draw card background
    currentPage.drawRectangle({
      x: cardX,
      y: cardY - summaryCardHeight,
      width: summaryCardWidth,
      height: summaryCardHeight,
      color: rgb(0.97, 0.97, 0.97),
      borderColor: card.color,
      borderWidth: 1.5,
    });
    
    // Draw colored accent bar
    currentPage.drawRectangle({
      x: cardX,
      y: cardY - summaryCardHeight,
      width: summaryCardWidth,
      height: 4,
      color: card.color,
    });
    
    // Add card text
    addText(card.label, cardX + 10, cardY - 25, 10, false, summaryCardWidth - 20);
    addText(String(card.value), cardX + 10, cardY - 45, 16, true, summaryCardWidth - 20);
  });
  
  yPosition -= (Math.ceil(summaryCards.length / 2) * (summaryCardHeight + 15)) + sectionSpacing;
  
  // Additional summary stats
  checkNewPage(40);
  const additionalStats = [
    `Pending Invoices: ${report.summary?.pendingInvoices || 0}`,
    `Overdue Invoices: ${report.summary?.overdueInvoices || 0}`,
  ];
  
  additionalStats.forEach(stat => {
    addText(stat, margin, yPosition, 11, false);
    yPosition -= lineHeight;
  });
  
  yPosition -= sectionSpacing;
  
  // Invoices section
  if (report.invoices && report.invoices.length > 0) {
    addSectionHeader('INVOICE DETAILS');
    
    const invoicesToShow = report.invoices.slice(0, 20); // Limit for clean display
    const invoiceColumns = [
      { text: 'Invoice #', width: 100, align: 'left' as const },
      { text: 'Client', width: 160, align: 'left' as const },
      { text: 'Amount', width: 90, align: 'right' as const },
      { text: 'Status', width: 80, align: 'center' as const },
      { text: 'Due Date', width: 100, align: 'left' as const },
    ];
    
    addTableRow(invoiceColumns, true);
    
    invoicesToShow.forEach((invoice: any) => {
      const clientName = (invoice.client_name || invoice.client?.name || 'N/A').substring(0, 25);
      const status = (invoice.status || 'N/A').toUpperCase();
      const dueDate = invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }) : 'N/A';
      const amount = `$${(invoice.total || 0).toFixed(2)}`;
      
      addTableRow([
        { text: invoice.invoice_number || 'N/A', width: 100, align: 'left' },
        { text: clientName, width: 160, align: 'left' },
        { text: amount, width: 90, align: 'right' },
        { text: status, width: 80, align: 'center' },
        { text: dueDate, width: 100, align: 'left' },
      ], false);
    });
    
    if (report.invoices.length > invoicesToShow.length) {
      checkNewPage(25);
      yPosition -= 10;
      addText(`Note: Showing ${invoicesToShow.length} of ${report.invoices.length} invoices`, margin, yPosition, 9, false);
      yPosition -= lineHeight;
    }
    
    yPosition -= sectionSpacing;
  }
  
  // Clients section
  if (report.clients && report.clients.length > 0) {
    addSectionHeader('CLIENT INFORMATION');
    
    const clientsToShow = report.clients.slice(0, 15);
    const clientColumns = [
      { text: 'Name', width: 150, align: 'left' as const },
      { text: 'Email', width: 200, align: 'left' as const },
      { text: 'Company', width: 145, align: 'left' as const },
    ];
    
    addTableRow(clientColumns, true);
    
    clientsToShow.forEach((client: any) => {
      const name = (client.name || 'N/A').substring(0, 30);
      const email = (client.email || 'N/A').substring(0, 35);
      const company = (client.company || 'N/A').substring(0, 30);
      
      addTableRow([
        { text: name, width: 150, align: 'left' },
        { text: email, width: 200, align: 'left' },
        { text: company, width: 145, align: 'left' },
      ], false);
    });
    
    if (report.clients.length > clientsToShow.length) {
      checkNewPage(25);
      yPosition -= 10;
      addText(`Note: Showing ${clientsToShow.length} of ${report.clients.length} clients`, margin, yPosition, 9, false);
      yPosition -= lineHeight;
    }
  }
  
  // Footer on each page
  pages.forEach((page, pageIndex) => {
    page.drawLine({
      start: { x: margin, y: bottomMargin + 30 },
      end: { x: width - margin, y: bottomMargin + 30 },
      thickness: 1,
      color: rgb(0.3, 0.3, 0.3),
    });
    
    const footerText = `Report generated on ${new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`;
    const appName = 'Invoice Flow Pro';
    const pageNumberText = `Page ${pageIndex + 1} of ${pages.length}`;
    
    // Draw footer text directly on the page
    page.drawText(footerText, {
      x: margin,
      y: bottomMargin + 15,
      size: 9,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });
    
    const appNameWidth = font.widthOfTextAtSize(appName, 9);
    page.drawText(appName, {
      x: width - margin - appNameWidth,
      y: bottomMargin + 15,
      size: 9,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });
    
    const pageNumberWidth = font.widthOfTextAtSize(pageNumberText, 9);
    page.drawText(pageNumberText, {
      x: (width - pageNumberWidth) / 2,
      y: bottomMargin + 15,
      size: 9,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });
  });
  
  return await pdfDoc.save();
}