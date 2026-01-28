import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from 'pdf-lib';
import { Invoice, BusinessSettings } from '@/types';

export async function generateReceiptPDF(
  invoice: any,
  businessSettings: BusinessSettings
): Promise<Uint8Array> {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // US Letter size
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
    // Use a subtle primary color (similar to minimal template)
    const primaryRgb = { r: 0.2, g: 0.2, b: 0.2 }; // Dark gray for minimal look
  
    const invoiceCurrency = invoice.currency || 'USD';
    // Use formatCurrencyForPDF for proper PDF currency formatting
    const formatCurrency = (amount: number): string => {
      // Import dynamically to avoid circular dependencies
      const { formatCurrencyForPDF } = require('@/lib/currency');
      return formatCurrencyForPDF(amount, invoiceCurrency);
    };

    const formatDate = (dateString: string | undefined | null): string => {
      if (!dateString) {
        const now = new Date();
        return `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;
      }
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          const now = new Date();
          return `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;
        }
        return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
      } catch {
        const now = new Date();
        return `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;
      }
    };

    const formatTime = (dateString: string | undefined | null): string => {
      if (!dateString) {
        const now = new Date();
        return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      }
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          const now = new Date();
          return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      } catch {
        const now = new Date();
        return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      }
    };

    const { width, height } = page.getSize();
    let yPosition = height - 50;
    const marginLeft = 50;
    const marginRight = 562;

    // Minimal header: Business name (left) - Regular weight, primary color
    const businessName = (businessSettings?.businessName || 'Business').substring(0, 50);
    page.drawText(businessName, {
      x: marginLeft,
      y: yPosition,
      size: 16,
      font: font, // Regular weight for minimal feel
      color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
    });

    yPosition -= 18;

    if (businessSettings?.address) {
      const addressLines = String(businessSettings.address).split('\n');
      addressLines.forEach((line: string) => {
        if (line.trim()) {
          page.drawText(line.trim().substring(0, 60), {
            x: marginLeft,
            y: yPosition,
            size: 9,
            font: font,
            color: rgb(0.5, 0.5, 0.5),
          });
          yPosition -= 12;
        }
      });
    }

    if (businessSettings?.businessPhone) {
      page.drawText(String(businessSettings.businessPhone).substring(0, 30), {
        x: marginLeft,
        y: yPosition,
        size: 9,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
      });
      yPosition -= 12;
    }

    if (businessSettings?.businessEmail) {
      page.drawText(String(businessSettings.businessEmail).substring(0, 50), {
        x: marginLeft,
        y: yPosition,
        size: 9,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
      });
      yPosition -= 12;
    }

    // Receipt title (right-aligned) - Regular weight, primary color
    const receiptText = 'RECEIPT';
    const receiptTextWidth = font.widthOfTextAtSize(receiptText, 20);
    page.drawText(receiptText, {
      x: marginRight - receiptTextWidth,
      y: height - 50,
      size: 20,
      font: font, // Regular weight for minimal feel
      color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
    });

    // Receipt details (right-aligned)
    const receiptDetailsY = height - 75;
    const invoiceNumber = String(invoice.invoiceNumber || invoice.invoice_number || 'N/A').substring(0, 50);
    const receiptNumberText = `#${invoiceNumber}`;
    const receiptNumberWidth = boldFont.widthOfTextAtSize(receiptNumberText, 10);
    page.drawText(receiptNumberText, {
      x: marginRight - receiptNumberWidth,
      y: receiptDetailsY,
      size: 10,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    const paymentDate = formatDate(
      (invoice as any).paidAt || 
      (invoice as any).paid_at || 
      (invoice as any).updatedAt || 
      (invoice as any).updated_at ||
      new Date().toISOString()
    );
    const paymentTime = formatTime(
      (invoice as any).paidAt || 
      (invoice as any).paid_at || 
      (invoice as any).updatedAt || 
      (invoice as any).updated_at ||
      new Date().toISOString()
    );

    const dateText = `Date: ${paymentDate} ${paymentTime}`;
    const dateTextWidth = font.widthOfTextAtSize(dateText, 8);
    page.drawText(dateText, {
      x: marginRight - dateTextWidth,
      y: receiptDetailsY - 18,
      size: 8,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Minimal separator line - subtle colored line
    const separatorY = height - 180;
    page.drawLine({
      start: { x: marginLeft, y: separatorY },
      end: { x: marginRight, y: separatorY },
      thickness: 0.5,
      color: rgb(primaryRgb.r * 0.5, primaryRgb.g * 0.5, primaryRgb.b * 0.5), // Subtle primary color
    });

    yPosition = separatorY - 25;

    // Customer section - Minimal label with primary color
    page.drawText('Paid By', {
      x: marginLeft,
      y: yPosition,
      size: 10,
      font: font, // Regular weight for minimal look
      color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b), // Primary color for label
    });

    yPosition -= 20;

    const clientName = invoice.clientName || invoice.client?.name || 'Customer';
    page.drawText(clientName.substring(0, 50), {
      x: marginLeft,
      y: yPosition,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });

    yPosition -= 14;

    if (invoice.clientEmail || invoice.client?.email) {
      const email = (invoice.clientEmail || invoice.client?.email || '').substring(0, 50);
      page.drawText(email, {
        x: marginLeft,
        y: yPosition,
        size: 9,
        font: font,
        color: rgb(0.4, 0.4, 0.4),
      });
      yPosition -= 14;
    }

    if (invoice.clientCompany || invoice.client?.company) {
      const company = (invoice.clientCompany || invoice.client?.company || '').substring(0, 50);
      page.drawText(company, {
        x: marginLeft,
        y: yPosition,
        size: 9,
        font: font,
        color: rgb(0.4, 0.4, 0.4),
      });
      yPosition -= 14;
    }

    // Items section - Minimal table header
    const tableY = height - 320;
    
    // Minimal header - just text with primary color accents
    page.drawText('Description', {
      x: marginLeft,
      y: tableY - 15,
      size: 9,
      font: font, // Regular weight for minimal
      color: rgb(primaryRgb.r * 0.7, primaryRgb.g * 0.7, primaryRgb.b * 0.7), // Lighter primary
    });

    const amountHeaderText = 'Amount';
    const amountHeaderWidth = font.widthOfTextAtSize(amountHeaderText, 9);
    page.drawText(amountHeaderText, {
      x: marginRight - amountHeaderWidth,
      y: tableY - 15,
      size: 9,
      font: font,
      color: rgb(primaryRgb.r * 0.7, primaryRgb.g * 0.7, primaryRgb.b * 0.7),
    });

    // Subtle colored header line
    page.drawLine({
      start: { x: marginLeft, y: tableY - 5 },
      end: { x: marginRight, y: tableY - 5 },
      thickness: 0.5,
      color: rgb(primaryRgb.r * 0.5, primaryRgb.g * 0.5, primaryRgb.b * 0.5), // Even lighter for line
    });

    // Clean table rows with subtle separators
    let currentY = tableY - 35;
    let subtotal = 0;

    if (invoice.items && Array.isArray(invoice.items) && invoice.items.length > 0) {
      invoice.items.forEach((item: any, index: number) => {
        if (currentY < 200) return; // Prevent overflow
        
        const amount = typeof item.amount === 'number' ? item.amount : parseFloat(String(item.amount || '0'));
        subtotal += amount;

        // Very subtle row separator - lighter color
        if (index > 0) {
          page.drawLine({
            start: { x: marginLeft, y: currentY + 12 },
            end: { x: marginRight, y: currentY + 12 },
            thickness: 0.3,
            color: rgb(0.92, 0.92, 0.92),
          });
        }

        const description = (item.description || 'Service').substring(0, 50);
        page.drawText(description, {
          x: marginLeft,
          y: currentY,
          size: 9,
          font: font,
          color: rgb(0, 0, 0),
        });

        const amountText = formatCurrency(amount);
        const amountWidth = font.widthOfTextAtSize(amountText, 9);
        page.drawText(amountText, {
          x: marginRight - amountWidth,
          y: currentY,
          size: 9,
          font: font,
          color: rgb(0, 0, 0),
        });

        currentY -= 22;
      });
    } else {
      // If no items, show payment description
      const invoiceNum = (invoice.invoiceNumber || invoice.invoice_number || 'N/A').substring(0, 50);
      const description = `Payment for Invoice ${invoiceNum}`;
      page.drawText(description, {
        x: marginLeft,
        y: currentY,
        size: 9,
        font: font,
        color: rgb(0, 0, 0),
      });
      const amountText = formatCurrency(Number(invoice.total || 0));
      const amountWidth = font.widthOfTextAtSize(amountText, 9);
      page.drawText(amountText, {
        x: marginRight - amountWidth,
        y: currentY,
        size: 9,
        font: font,
        color: rgb(0, 0, 0),
      });
      subtotal = Number(invoice.total || 0);
      currentY -= 22;
    }

    // Minimal totals section - no boxes, just clean lines and text
    const totalsY = currentY - 30;
    let totalY = totalsY;
    
    const discount = Number(invoice.discount) || 0;
    const taxAmount = Number(invoice.taxAmount || invoice.tax_amount) || 0;
    const lateFees = Number(invoice.lateFees || invoice.late_fees) || 0;
    const totalPaid = Number(invoice.totalWithLateFees || invoice.total_with_late_fees || invoice.total) || 0;

    // Subtle colored separator line above totals
    page.drawLine({
      start: { x: 400, y: totalsY + 15 },
      end: { x: marginRight, y: totalsY + 15 },
      thickness: 0.5,
      color: rgb(primaryRgb.r * 0.5, primaryRgb.g * 0.5, primaryRgb.b * 0.5),
    });

    // Subtotal
    if (subtotal > 0) {
      const label = 'Subtotal:';
      const value = formatCurrency(subtotal);
      const labelWidth = font.widthOfTextAtSize(label, 9);
      const valueWidth = font.widthOfTextAtSize(value, 9);
      
      page.drawText(label, {
        x: marginRight - labelWidth - valueWidth - 5,
        y: totalY,
        size: 9,
        font: font,
        color: rgb(primaryRgb.r * 0.7, primaryRgb.g * 0.7, primaryRgb.b * 0.7),
      });
      page.drawText(value, {
        x: marginRight - valueWidth,
        y: totalY,
        size: 9,
        font: font,
        color: rgb(0, 0, 0),
      });
      totalY -= 18;
    }

    // Discount
    if (discount > 0) {
      const label = 'Discount:';
      const value = `-${formatCurrency(discount)}`;
      const labelWidth = font.widthOfTextAtSize(label, 9);
      const valueWidth = font.widthOfTextAtSize(value, 9);
      
      page.drawText(label, {
        x: marginRight - labelWidth - valueWidth - 5,
        y: totalY,
        size: 9,
        font: font,
        color: rgb(primaryRgb.r * 0.7, primaryRgb.g * 0.7, primaryRgb.b * 0.7),
      });
      page.drawText(value, {
        x: marginRight - valueWidth,
        y: totalY,
        size: 9,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
      });
      totalY -= 18;
    }

    // Tax
    if (taxAmount > 0) {
      const label = 'Tax:';
      const value = formatCurrency(taxAmount);
      const labelWidth = font.widthOfTextAtSize(label, 9);
      const valueWidth = font.widthOfTextAtSize(value, 9);
      
      page.drawText(label, {
        x: marginRight - labelWidth - valueWidth - 5,
        y: totalY,
        size: 9,
        font: font,
        color: rgb(primaryRgb.r * 0.7, primaryRgb.g * 0.7, primaryRgb.b * 0.7),
      });
      page.drawText(value, {
        x: marginRight - valueWidth,
        y: totalY,
        size: 9,
        font: font,
        color: rgb(0, 0, 0),
      });
      totalY -= 18;
    }

    // Late Fees
    if (lateFees > 0) {
      const label = 'Late Fees:';
      const value = formatCurrency(lateFees);
      const labelWidth = font.widthOfTextAtSize(label, 9);
      const valueWidth = font.widthOfTextAtSize(value, 9);
      
      page.drawText(label, {
        x: marginRight - labelWidth - valueWidth - 5,
        y: totalY,
        size: 9,
        font: font,
        color: rgb(primaryRgb.r * 0.7, primaryRgb.g * 0.7, primaryRgb.b * 0.7),
      });
      page.drawText(value, {
        x: marginRight - valueWidth,
        y: totalY,
        size: 9,
        font: font,
        color: rgb(0, 0, 0),
      });
      totalY -= 18;
    }

    // Subtle colored line before total
    page.drawLine({
      start: { x: 400, y: totalY + 8 },
      end: { x: marginRight, y: totalY + 8 },
      thickness: 0.5,
      color: rgb(primaryRgb.r * 0.5, primaryRgb.g * 0.5, primaryRgb.b * 0.5),
    });
    
    totalY -= 5;
    
    // Total - Regular weight, primary color for emphasis
    const totalLabel = 'Total Paid:';
    const totalValue = formatCurrency(totalPaid);
    const totalLabelWidth = font.widthOfTextAtSize(totalLabel, 11);
    const totalValueWidth = font.widthOfTextAtSize(totalValue, 11);
    
    page.drawText(totalLabel, {
      x: marginRight - totalLabelWidth - totalValueWidth - 5,
      y: totalY,
      size: 11,
      font: font, // Regular weight for minimal
      color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b), // Primary color for emphasis
    });
    page.drawText(totalValue, {
      x: marginRight - totalValueWidth,
      y: totalY,
      size: 11,
      font: font,
      color: rgb(0, 0.6, 0.3), // Green color for total amount paid
    });

    totalY -= 30;

    // Payment Status - Minimal, subtle
    const statusText = 'Payment Received';
    const statusWidth = font.widthOfTextAtSize(statusText, 10);
    page.drawText(statusText, {
      x: (width - statusWidth) / 2,
      y: totalY,
      size: 10,
      font: font, // Regular weight
      color: rgb(0, 0.5, 0), // Green but subtle
    });

    // Minimal footer - just a subtle colored line and clean text
    const footerY = 130;
    
    // Very subtle colored separator line
    page.drawLine({
      start: { x: marginLeft, y: footerY },
      end: { x: 200, y: footerY },
      thickness: 0.5,
      color: rgb(primaryRgb.r * 0.5, primaryRgb.g * 0.5, primaryRgb.b * 0.5),
    });
    
    const footerText = 'Thank you for your business!';
    const footerWidth = font.widthOfTextAtSize(footerText, 8);
    page.drawText(footerText, {
      x: marginLeft,
      y: footerY - 22,
      size: 8,
      font: font,
      color: rgb(primaryRgb.r * 0.7, primaryRgb.g * 0.7, primaryRgb.b * 0.7),
    });
    
    const footerNote = 'This is a computer-generated receipt. No signature required.';
    const footerNoteWidth = font.widthOfTextAtSize(footerNote, 7);
    page.drawText(footerNote, {
      x: marginLeft,
      y: footerY - 35,
      size: 7,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    });

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  } catch (error) {
    console.error('Error generating receipt PDF:', error);
    throw new Error(`Failed to generate receipt: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
