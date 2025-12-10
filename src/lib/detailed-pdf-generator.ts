import { PDFDocument, PDFPage, PDFFont, rgb, StandardFonts } from 'pdf-lib';
import { Invoice, BusinessSettings } from '@/types';

// Helper function to convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : { r: 0, g: 0, b: 0 };
}

/**
 * Formats a multi-line address into 2-3 longer lines for better PDF display
 * Filters out email and phone if they exist in dedicated fields
 * @param address - The address string that may contain newlines
 * @param businessSettings - Business settings to check for dedicated email/phone fields
 * @returns Array of formatted address lines (2-3 lines)
 */
function formatAddressForPDF(address: string, businessSettings?: BusinessSettings): string[] {
  if (!address) return [];
  
  // Split by newlines and clean up
  let lines = address
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  if (lines.length === 0) return [];
  
  // Filter out email and phone if they exist in dedicated fields (only exact matches)
  if (businessSettings) {
    const dedicatedEmail = businessSettings.businessEmail?.toLowerCase().trim();
    const dedicatedPhone = businessSettings.businessPhone?.trim();
    
    // Normalize phone numbers for comparison (remove spaces, dashes, parentheses)
    const normalizePhone = (phone: string) => {
      return phone.replace(/[\s\-\+\(\)]/g, '');
    };
    
    lines = lines.filter(line => {
      const lineTrimmed = line.trim();
      const lineLower = lineTrimmed.toLowerCase();
      
      // Check if line is an email (contains @)
      if (lineLower.includes('@')) {
        // Only filter out if dedicated email exists and matches exactly
        if (dedicatedEmail && lineLower === dedicatedEmail) {
          return false; // Filter out duplicate email
        }
        // Keep email if no dedicated email or if it's different
        return true;
      }
      
      // Check if line looks like a phone number
      // Phone pattern: mostly digits with optional spaces, dashes, parentheses, plus sign
      const phonePattern = /^[\d\s\-\+\(\)]+$/;
      const nonDigitChars = lineTrimmed.replace(/[\d]/g, '').length;
      
      // Consider it a phone if: has digits, mostly phone-related chars, and not too many non-digit chars
      if (phonePattern.test(lineTrimmed) && /\d/.test(lineTrimmed) && nonDigitChars <= 5) {
        // Only filter out if dedicated phone exists and matches (normalized)
        if (dedicatedPhone) {
          const normalizedLine = normalizePhone(lineTrimmed);
          const normalizedDedicated = normalizePhone(dedicatedPhone);
          if (normalizedLine === normalizedDedicated) {
            return false; // Filter out duplicate phone
          }
        }
        // Keep phone if no dedicated phone or if it's different
        return true;
      }
      
      return true;
    });
  }
  
  if (lines.length === 0) return [];
  
  // If already 2-3 lines and reasonable length, return as-is
  if (lines.length <= 3) {
    // Check if lines are too short - combine them
    const totalLength = lines.join(' ').length;
    if (totalLength < 60 && lines.length > 1) {
      // Combine into 2 lines
      const midPoint = Math.ceil(lines.length / 2);
      return [
        lines.slice(0, midPoint).join(', '),
        lines.slice(midPoint).join(', ')
      ];
    }
    return lines;
  }
  
  // If more than 3 lines, combine intelligently into 2-3 lines
  // Strategy: Combine shorter lines together, keep longer lines separate
  const formattedLines: string[] = [];
  let currentLine = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (currentLine.length === 0) {
      currentLine = line;
    } else {
      const combined = currentLine + ', ' + line;
      // If combined line is reasonable length (less than ~70 chars), combine
      if (combined.length < 70 && formattedLines.length < 2) {
        currentLine = combined;
      } else {
        // Save current line and start new one
        formattedLines.push(currentLine);
        currentLine = line;
      }
    }
  }
  
  // Add the last line
  if (currentLine.length > 0) {
    formattedLines.push(currentLine);
  }
  
  // Ensure we have at most 3 lines
  if (formattedLines.length > 3) {
    // Combine last two lines if we have more than 3
    const lastTwo = formattedLines.slice(-2).join(', ');
    return [...formattedLines.slice(0, -2), lastTwo];
  }
  
  return formattedLines;
}

export async function generateDetailedPDF(
  invoice: Invoice,
  businessSettings: BusinessSettings,
  template: number,
  primaryColor: string = '#7C3AED',
  secondaryColor: string = '#A855F7'
): Promise<Uint8Array> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size

  // Get fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Helper function to convert hex color to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : { r: 0.5, g: 0.3, b: 0.9 }; // Default purple
  };

  const primaryRgb = hexToRgb(primaryColor);
  const secondaryRgb = hexToRgb(secondaryColor);

  // Helper functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Template-specific generation
  switch (template) {
    case 1:
      return await generateTemplate1DetailedPDF(pdfDoc, page, invoice, businessSettings, primaryRgb, secondaryRgb, font, boldFont, formatCurrency, formatDate);
    case 2:
      return await generateTemplate2PDF(pdfDoc, page, invoice, businessSettings, primaryRgb, secondaryRgb, font, boldFont, formatCurrency, formatDate);
    case 3:
      return await generateTemplate3PDF(pdfDoc, page, invoice, businessSettings, primaryRgb, secondaryRgb, font, boldFont, formatCurrency, formatDate);
    case 4:
      return await generateModernTemplatePDF(pdfDoc, page, invoice, businessSettings, primaryRgb, secondaryRgb, font, boldFont, formatCurrency, formatDate);
    case 5:
      return await generateSimpleCleanTemplatePDF(pdfDoc, page, invoice, businessSettings, primaryRgb, secondaryRgb, font, boldFont, formatCurrency, formatDate);
    case 6:
      return await generateMinimalTemplatePDF(pdfDoc, page, invoice, businessSettings, primaryRgb, secondaryRgb, font, boldFont, formatCurrency, formatDate);
    default:
      return await generateTemplate1DetailedPDF(pdfDoc, page, invoice, businessSettings, primaryRgb, secondaryRgb, font, boldFont, formatCurrency, formatDate);
  }
}

async function generateTemplate1DetailedPDF(
  pdfDoc: PDFDocument,
  page: PDFPage,
  invoice: Invoice,
  businessSettings: BusinessSettings,
  primaryRgb: { r: number; g: number; b: number },
  secondaryRgb: { r: number; g: number; b: number },
  font: PDFFont,
  boldFont: PDFFont,
  formatCurrency: (amount: number) => string,
  formatDate: (dateString: string) => string
): Promise<Uint8Array> {
  const { width, height } = page.getSize();

  // Template 1 - Classic/Professional design with logo support
  // Header with primary color background
  page.drawRectangle({
    x: 0,
    y: height - 60,
    width: width,
    height: 60,
    color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
  });

  // Invoice title
  page.drawText('INVOICE', {
    x: 50,
    y: height - 35,
    size: 20,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  // Business logo with proper embedding
  if (businessSettings.logo) {
    try {
      const logoBytes = Uint8Array.from(atob(businessSettings.logo.split(',')[1]), c => c.charCodeAt(0));
      const logoImage = await pdfDoc.embedPng(logoBytes);
      const logoDims = logoImage.scale(0.3);
      
      // Logo border
      page.drawRectangle({
        x: 50,
        y: height - 100,
        width: 40,
        height: 40,
        borderColor: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
        borderWidth: 2,
      });
      
      page.drawImage(logoImage, {
        x: 55,
        y: height - 95,
        width: logoDims.width,
        height: logoDims.height,
      });
    } catch (error) {
      // Logo fallback
      page.drawRectangle({
        x: 50,
        y: height - 100,
        width: 40,
        height: 40,
        color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
      });
      
      page.drawText(businessSettings.businessName?.charAt(0) || 'B', {
        x: 65,
        y: height - 120,
        size: 18,
        font: boldFont,
        color: rgb(1, 1, 1),
      });
    }
  } else {
    // Text logo fallback
    page.drawRectangle({
      x: 50,
      y: height - 100,
      width: 40,
      height: 40,
      color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
    });
    
    page.drawText(businessSettings.businessName?.charAt(0) || 'B', {
      x: 65,
      y: height - 120,
      size: 18,
      font: boldFont,
      color: rgb(1, 1, 1),
    });
  }

  // Business information
  page.drawText(businessSettings.businessName || 'Your Business', {
    x: 110,
    y: height - 100,
    size: 18,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  if (businessSettings.address) {
    const addressLines = formatAddressForPDF(businessSettings.address, businessSettings);
    let addressY = height - 115;
    addressLines.forEach((line, index) => {
      page.drawText(line, {
        x: 110,
        y: addressY - (index * 12), // 12px spacing between lines
        size: 9,
        font: font,
        color: rgb(0, 0, 0),
      });
    });
    // Adjust phone and email position based on number of address lines
    const phoneYOffset = addressLines.length > 1 ? addressLines.length * 12 : 15;
    if (businessSettings.businessPhone) {
      page.drawText(businessSettings.businessPhone, {
        x: 110,
        y: height - 115 - phoneYOffset,
        size: 9,
        font: font,
        color: rgb(0, 0, 0),
      });
    }

    if (businessSettings.businessEmail) {
      page.drawText(businessSettings.businessEmail, {
        x: 110,
        y: height - 115 - phoneYOffset - 15,
        size: 9,
        font: font,
        color: rgb(0, 0, 0),
      });
    }
  }

  // Invoice details
  page.drawText('Invoice Details', {
    x: 450,
    y: height - 100,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  page.drawText(`Invoice #: ${invoice.invoiceNumber}`, {
    x: 450,
    y: height - 115,
    size: 9,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText(`Date: ${formatDate(invoice.createdAt)}`, {
    x: 450,
    y: height - 130,
    size: 9,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText(`Due: ${formatDate(invoice.dueDate)}`, {
    x: 450,
    y: height - 145,
    size: 9,
    font: font,
    color: rgb(0, 0, 0),
  });

  // Bill to section - Dynamic positioning
  let billToY = height - 180;
  
  page.drawText('Bill To:', {
    x: 50,
    y: billToY,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  billToY -= 20;
  page.drawText(invoice.client.name, {
    x: 50,
    y: billToY,
    size: 11,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  if (invoice.client.email) {
    billToY -= 15;
    page.drawText(invoice.client.email, {
      x: 50,
      y: billToY,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });
  }

  if (invoice.client.address) {
    billToY -= 15;
    page.drawText(invoice.client.address, {
      x: 50,
      y: billToY,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });
  }

  // Services table header
  page.drawRectangle({
    x: 50,
    y: height - 280,
    width: 500,
    height: 25,
    color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
  });

  page.drawText('Description', {
    x: 60,
    y: height - 293,
    size: 10,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  page.drawText('Qty', {
    x: 300,
    y: height - 293,
    size: 10,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  page.drawText('Rate', {
    x: 350,
    y: height - 293,
    size: 10,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  page.drawText('Amount', {
    x: 450,
    y: height - 293,
    size: 10,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  // Services table rows
  let currentY = height - 320;
  let total = 0;

  invoice.items.forEach((item, index) => {
    const amount = parseFloat(item.amount?.toString() || '0');
    total += amount;

    page.drawText(item.description, {
      x: 60,
      y: currentY,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    page.drawText('1', {
      x: 300,
      y: currentY,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    // Calculate rate: if rate is 0 or not provided, use amount (since quantity is 1)
    const itemRate = parseFloat(item.rate?.toString() || '0');
    const quantity = 1; // Default quantity is 1
    const rate = itemRate > 0 ? itemRate : (amount / quantity);
    
    page.drawText(formatCurrency(rate), {
      x: 350,
      y: currentY,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    page.drawText(formatCurrency(amount), {
      x: 450,
      y: currentY,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    currentY -= 25;
  });

  // Totals section
  page.drawText('Subtotal:', {
    x: 400,
    y: currentY - 20,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText(formatCurrency(total), {
    x: 480,
    y: currentY - 20,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  });

  if (invoice.taxAmount && invoice.taxAmount > 0) {
    page.drawText('Tax:', {
      x: 400,
      y: currentY - 35,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });

    page.drawText(formatCurrency(invoice.taxAmount), {
      x: 480,
      y: currentY - 35,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });
  }

  // Late fees (if applicable)
  if (invoice.lateFees && invoice.lateFees.enabled && invoice.lateFees.amount > 0) {
    page.drawText('Late Fees:', {
      x: 400,
      y: currentY - 50,
      size: 10,
      font: font,
      color: rgb(0.8, 0.2, 0.2),
    });

    page.drawText(formatCurrency(invoice.lateFees.amount), {
      x: 480,
      y: currentY - 50,
      size: 10,
      font: font,
      color: rgb(0.8, 0.2, 0.2),
    });
  }

  page.drawText('Total:', {
    x: 400,
    y: currentY - 70,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  page.drawText(formatCurrency(total + (invoice.taxAmount || 0) + (invoice.lateFees?.amount || 0)), {
    x: 480,
    y: currentY - 70,
    size: 12,
    font: boldFont,
    color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
  });

  // Payment terms and reminders section
  const footerY = currentY - 120;
  
  if (invoice.paymentTerms && invoice.paymentTerms.enabled) {
    page.drawText('Payment Terms:', {
      x: 50,
      y: footerY,
      size: 10,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    page.drawText(invoice.paymentTerms.terms, {
      x: 50,
      y: footerY - 15,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });
  }

  if (invoice.reminders && invoice.reminders.enabled) {
    page.drawText('Auto Reminders:', {
      x: 50,
      y: footerY - 35,
      size: 10,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    page.drawText('Enabled', {
      x: 50,
      y: footerY - 50,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });
  }

  // Footer
  page.drawText('Thank you for your business!', {
    x: 50,
    y: 100,
    size: 10,
    font: font,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Website not available in BusinessSettings type

  return await pdfDoc.save();
}

async function generateTemplate2PDF(
  pdfDoc: PDFDocument,
  page: PDFPage,
  invoice: Invoice,
  businessSettings: BusinessSettings,
  primaryRgb: { r: number; g: number; b: number },
  secondaryRgb: { r: number; g: number; b: number },
  font: PDFFont,
  boldFont: PDFFont,
  formatCurrency: (amount: number) => string,
  formatDate: (dateString: string) => string
): Promise<Uint8Array> {
  const { width, height } = page.getSize();

  // Header with primary color background
  page.drawRectangle({
    x: 0,
    y: height - 80,
    width: width,
    height: 80,
    color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
  });

  // Invoice title
  page.drawText('INVOICE', {
    x: 50,
    y: height - 45,
    size: 24,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  // Business logo with proper embedding
  if (businessSettings.logo) {
    try {
      const logoBytes = Uint8Array.from(atob(businessSettings.logo.split(',')[1]), c => c.charCodeAt(0));
      const logoImage = await pdfDoc.embedPng(logoBytes);
      const logoDims = logoImage.scale(0.25);
      
      // Logo border
      page.drawRectangle({
        x: 50,
        y: height - 100,
        width: 35,
        height: 35,
        borderColor: rgb(1, 1, 1),
        borderWidth: 1,
      });
      
      page.drawImage(logoImage, {
        x: 55,
        y: height - 95,
        width: logoDims.width,
        height: logoDims.height,
      });
    } catch (error) {
      // Logo fallback
      page.drawRectangle({
        x: 50,
        y: height - 100,
        width: 35,
        height: 35,
        color: rgb(1, 1, 1),
      });
      
      page.drawText(businessSettings.businessName?.charAt(0) || 'B', {
        x: 62,
        y: height - 115,
        size: 16,
        font: boldFont,
        color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
      });
    }
  } else {
    // Text logo fallback
    page.drawRectangle({
      x: 50,
      y: height - 100,
      width: 35,
      height: 35,
      color: rgb(1, 1, 1),
    });
    
    page.drawText(businessSettings.businessName?.charAt(0) || 'B', {
      x: 62,
      y: height - 115,
      size: 16,
      font: boldFont,
      color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
    });
  }

  // Business information
  page.drawText(businessSettings.businessName || 'Your Business', {
    x: 100,
    y: height - 120,
    size: 20,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  if (businessSettings.address) {
    const addressLines = formatAddressForPDF(businessSettings.address, businessSettings);
    let addressY = height - 135;
    addressLines.forEach((line, index) => {
      page.drawText(line, {
        x: 100,
        y: addressY - (index * 12),
        size: 9,
        font: font,
        color: rgb(0, 0, 0),
      });
    });
    // Adjust phone and email position based on number of address lines
    const phoneYOffset = addressLines.length > 1 ? addressLines.length * 12 : 15;
    if (businessSettings.businessPhone) {
      page.drawText(businessSettings.businessPhone, {
        x: 100,
        y: height - 135 - phoneYOffset,
        size: 9,
        font: font,
        color: rgb(0, 0, 0),
      });
    }

    if (businessSettings.businessEmail) {
      page.drawText(businessSettings.businessEmail, {
        x: 100,
        y: height - 135 - phoneYOffset - 15,
        size: 9,
        font: font,
        color: rgb(0, 0, 0),
      });
    }
  }

  // Invoice details
  page.drawText('Invoice Details', {
    x: 450,
    y: height - 120,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  page.drawText(`Invoice #: ${invoice.invoiceNumber}`, {
    x: 450,
    y: height - 135,
    size: 9,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText(`Date: ${formatDate(invoice.createdAt)}`, {
    x: 450,
    y: height - 150,
    size: 9,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText(`Due: ${formatDate(invoice.dueDate)}`, {
    x: 450,
    y: height - 165,
    size: 9,
    font: font,
    color: rgb(0, 0, 0),
  });

  // Bill to section - Dynamic positioning
  let billToY = height - 200;
  
  page.drawText('Bill To:', {
    x: 50,
    y: billToY,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  billToY -= 20;
  page.drawText(invoice.client.name, {
    x: 50,
    y: billToY,
    size: 11,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  if (invoice.client.email) {
    billToY -= 15;
    page.drawText(invoice.client.email, {
      x: 50,
      y: billToY,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });
  }

  if (invoice.client.address) {
    billToY -= 15;
    page.drawText(invoice.client.address, {
      x: 50,
      y: billToY,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });
  }

  // Services table header
  page.drawRectangle({
    x: 50,
    y: height - 300,
    width: 500,
    height: 25,
    color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
  });

  page.drawText('Description', {
    x: 60,
    y: height - 313,
    size: 10,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  page.drawText('Qty', {
    x: 300,
    y: height - 313,
    size: 10,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  page.drawText('Rate', {
    x: 350,
    y: height - 313,
    size: 10,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  page.drawText('Amount', {
    x: 450,
    y: height - 313,
    size: 10,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  // Services table rows
  let currentY = height - 340;
  let total = 0;

  invoice.items.forEach((item, index) => {
    const amount = parseFloat(item.amount?.toString() || '0');
    total += amount;

    page.drawText(item.description, {
      x: 60,
      y: currentY,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    page.drawText('1', {
      x: 300,
      y: currentY,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    // Calculate rate: if rate is 0 or not provided, use amount (since quantity is 1)
    const itemRate = parseFloat(item.rate?.toString() || '0');
    const quantity = 1; // Default quantity is 1
    const rate = itemRate > 0 ? itemRate : (amount / quantity);
    
    page.drawText(formatCurrency(rate), {
      x: 350,
      y: currentY,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    page.drawText(formatCurrency(amount), {
      x: 450,
      y: currentY,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    currentY -= 25;
  });

  // Totals section
  page.drawText('Subtotal:', {
    x: 400,
    y: currentY - 20,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText(formatCurrency(total), {
    x: 480,
    y: currentY - 20,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  });

  if (invoice.taxAmount && invoice.taxAmount > 0) {
    page.drawText('Tax:', {
      x: 400,
      y: currentY - 35,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });

    page.drawText(formatCurrency(invoice.taxAmount), {
      x: 480,
      y: currentY - 35,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });
  }

  // Late fees (if applicable)
  if (invoice.lateFees && invoice.lateFees.enabled && invoice.lateFees.amount > 0) {
    page.drawText('Late Fees:', {
      x: 400,
      y: currentY - 50,
      size: 10,
      font: font,
      color: rgb(0.8, 0.2, 0.2),
    });

    page.drawText(formatCurrency(invoice.lateFees.amount), {
      x: 480,
      y: currentY - 50,
      size: 10,
      font: font,
      color: rgb(0.8, 0.2, 0.2),
    });
  }

  page.drawText('Total:', {
    x: 400,
    y: currentY - 70,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  page.drawText(formatCurrency(total + (invoice.taxAmount || 0) + (invoice.lateFees?.amount || 0)), {
    x: 480,
    y: currentY - 70,
    size: 12,
    font: boldFont,
    color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
  });

  // Payment terms and reminders section
  const footerY = currentY - 120;
  
  if (invoice.paymentTerms && invoice.paymentTerms.enabled) {
    page.drawText('Payment Terms:', {
      x: 50,
      y: footerY,
      size: 10,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    page.drawText(invoice.paymentTerms.terms, {
      x: 50,
      y: footerY - 15,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });
  }

  if (invoice.reminders && invoice.reminders.enabled) {
    page.drawText('Auto Reminders:', {
      x: 50,
      y: footerY - 35,
      size: 10,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    page.drawText('Enabled', {
      x: 50,
      y: footerY - 50,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });
  }

  // Footer
  page.drawText('Thank you for your business!', {
    x: 50,
    y: 100,
    size: 10,
    font: font,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Website not available in BusinessSettings type

  return await pdfDoc.save();
}

// Template 3 - Creative Design (Artistic elements with creative styling)
async function generateTemplate3PDF(
  pdfDoc: PDFDocument,
  page: PDFPage,
  invoice: Invoice,
  businessSettings: BusinessSettings,
  primaryRgb: { r: number; g: number; b: number },
  secondaryRgb: { r: number; g: number; b: number },
  font: PDFFont,
  boldFont: PDFFont,
  formatCurrency: (amount: number) => string,
  formatDate: (dateString: string) => string
): Promise<Uint8Array> {
  const { width, height } = page.getSize();

  // Business information with creative styling (header removed)
  page.drawText(businessSettings.businessName || 'Your Business', {
    x: 50,
    y: height - 60,
    size: 20,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  if (businessSettings.address) {
    const addressLines = formatAddressForPDF(businessSettings.address, businessSettings);
    let addressY = height - 75;
    addressLines.forEach((line, index) => {
      page.drawText(line, {
        x: 50,
        y: addressY - (index * 12),
        size: 9,
        font: font,
        color: rgb(0.3, 0.3, 0.3),
      });
    });
    // Adjust phone and email position based on number of address lines
    const phoneYOffset = addressLines.length > 1 ? addressLines.length * 12 : 15;
    if (businessSettings.businessPhone) {
      page.drawText(businessSettings.businessPhone, {
        x: 50,
        y: height - 75 - phoneYOffset,
        size: 9,
        font: font,
        color: rgb(0.3, 0.3, 0.3),
      });
    }

    if (businessSettings.businessEmail) {
      page.drawText(businessSettings.businessEmail, {
        x: 50,
        y: height - 75 - phoneYOffset - 15,
        size: 9,
        font: font,
        color: rgb(0.3, 0.3, 0.3),
      });
    }
  }

  // Creative invoice details section with artistic elements
  const invoiceDetailsY = height - 130;
  
  // Creative artistic background
  page.drawRectangle({
    x: 400,
    y: invoiceDetailsY - 90,
    width: 150,
    height: 90,
    color: rgb(0.95, 0.95, 0.95),
    borderColor: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
    borderWidth: 2,
  });

  // Creative corner accents
  page.drawRectangle({
    x: 400,
    y: invoiceDetailsY - 90,
    width: 20,
    height: 20,
    color: rgb(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b),
  });

  page.drawText('INVOICE DETAILS', {
    x: 410,
    y: invoiceDetailsY - 20,
    size: 10,
    font: boldFont,
    color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
  });

  page.drawText(`#${invoice.invoiceNumber}`, {
    x: 410,
    y: invoiceDetailsY - 35,
    size: 9,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText(formatDate(invoice.createdAt), {
    x: 410,
    y: invoiceDetailsY - 50,
    size: 8,
    font: font,
    color: rgb(0.4, 0.4, 0.4),
  });

  page.drawText(`Due: ${formatDate(invoice.dueDate)}`, {
    x: 410,
    y: invoiceDetailsY - 65,
    size: 8,
    font: font,
    color: rgb(0.4, 0.4, 0.4),
  });

  // Creative bill to section with artistic elements
  const billToY = height - 240;
  
  // Creative artistic background
  page.drawRectangle({
    x: 50,
    y: billToY - 90,
    width: 250,
    height: 90,
    color: rgb(0.98, 0.98, 0.98),
    borderColor: rgb(0.9, 0.9, 0.9),
    borderWidth: 1,
  });

  // Creative corner accents
  page.drawRectangle({
    x: 50,
    y: billToY - 90,
    width: 15,
    height: 15,
    color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
  });

  page.drawText('BILL TO', {
    x: 60,
    y: billToY - 20,
    size: 10,
    font: boldFont,
    color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
  });

  page.drawText(invoice.client.name, {
    x: 60,
    y: billToY - 35,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  if (invoice.client.email) {
    page.drawText(invoice.client.email, {
      x: 60,
      y: billToY - 50,
      size: 9,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  if (invoice.client.address) {
    page.drawText(invoice.client.address, {
      x: 60,
      y: billToY - 65,
      size: 9,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  // Creative services table with artistic header
  const tableY = height - 350;
  
  // Creative artistic table header
  page.drawRectangle({
    x: 50,
    y: tableY - 35,
    width: 500,
    height: 35,
    color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
  });

  // Creative artistic accents in header
  page.drawRectangle({
    x: 50,
    y: tableY - 35,
    width: 500,
    height: 6,
    color: rgb(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b),
  });

  // Creative corner accents in header
  page.drawRectangle({
    x: 50,
    y: tableY - 35,
    width: 20,
    height: 20,
    color: rgb(1, 1, 1),
  });

  // Header text
  page.drawText('DESCRIPTION', {
    x: 60,
    y: tableY - 25,
    size: 9,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  page.drawText('QTY', {
    x: 320,
    y: tableY - 25,
    size: 9,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  page.drawText('RATE', {
    x: 380,
    y: tableY - 25,
    size: 9,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  page.drawText('AMOUNT', {
    x: 460,
    y: tableY - 25,
    size: 9,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  // Services table rows with creative styling
  let currentY = tableY - 55;
  let total = 0;

  invoice.items.forEach((item, index) => {
    const amount = parseFloat(item.amount?.toString() || '0');
    total += amount;

    // Creative alternating rows with artistic elements
    if (index % 2 === 0) {
      page.drawRectangle({
        x: 50,
        y: currentY - 25,
        width: 500,
        height: 25,
        color: rgb(0.99, 0.99, 0.99),
      });
    }

    // Creative row separators
    page.drawLine({
      start: { x: 50, y: currentY - 25 },
      end: { x: 550, y: currentY - 25 },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });

    page.drawText(item.description, {
      x: 60,
      y: currentY - 18,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    page.drawText('1', {
      x: 320,
      y: currentY - 18,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    // Calculate rate: if rate is 0 or not provided, use amount (since quantity is 1)
    const itemRate = parseFloat(item.rate?.toString() || '0');
    const quantity = 1; // Default quantity is 1
    const rate = itemRate > 0 ? itemRate : (amount / quantity);
    
    page.drawText(formatCurrency(rate), {
      x: 380,
      y: currentY - 18,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    page.drawText(formatCurrency(amount), {
      x: 460,
      y: currentY - 18,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    currentY -= 30;
  });

  // Creative totals section with artistic design
  const totalsY = currentY - 20;
  
  // Creative artistic totals background
  page.drawRectangle({
    x: 350,
    y: totalsY - 90,
    width: 200,
    height: 90,
    color: rgb(0.95, 0.95, 0.95),
    borderColor: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
    borderWidth: 2,
  });

  // Creative artistic accents in totals
  page.drawRectangle({
    x: 350,
    y: totalsY - 90,
    width: 200,
    height: 6,
    color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
  });

  // Creative corner accents in totals
  page.drawRectangle({
    x: 350,
    y: totalsY - 90,
    width: 20,
    height: 20,
    color: rgb(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b),
  });

  page.drawText('SUBTOTAL', {
    x: 360,
    y: totalsY - 30,
    size: 9,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText(formatCurrency(total), {
    x: 480,
    y: totalsY - 30,
    size: 9,
    font: font,
    color: rgb(0, 0, 0),
  });

  // Tax (if applicable)
  if (invoice.taxAmount && invoice.taxAmount > 0) {
    page.drawText('TAX', {
      x: 360,
      y: totalsY - 45,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    page.drawText(formatCurrency(invoice.taxAmount), {
      x: 480,
      y: totalsY - 45,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });
  }

  // Total with creative emphasis
  page.drawText('TOTAL', {
    x: 360,
    y: totalsY - 70,
    size: 12,
    font: boldFont,
    color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
  });

  page.drawText(formatCurrency(total + (invoice.taxAmount || 0)), {
    x: 480,
    y: totalsY - 70,
    size: 12,
    font: boldFont,
    color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
  });

  // Creative footer with artistic elements
  const footerY = 80;
  
  // Creative artistic footer line
  page.drawLine({
    start: { x: 50, y: footerY + 20 },
    end: { x: 250, y: footerY + 20 },
    thickness: 3,
    color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
  });

  // Creative accent line
  page.drawLine({
    start: { x: 50, y: footerY + 25 },
    end: { x: 150, y: footerY + 25 },
    thickness: 1,
    color: rgb(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b),
  });

  page.drawText('Thank you for your business!', {
    x: 50,
    y: footerY,
    size: 10,
    font: font,
    color: rgb(0.4, 0.4, 0.4),
  });

  // Website not available in BusinessSettings type

  return await pdfDoc.save();
}

// Template 4 - Modern Design (Card-based layout with geometric elements)
async function generateModernTemplatePDF(
  pdfDoc: PDFDocument,
  page: PDFPage,
  invoice: Invoice,
  businessSettings: BusinessSettings,
  primaryRgb: { r: number; g: number; b: number },
  secondaryRgb: { r: number; g: number; b: number },
  font: PDFFont,
  boldFont: PDFFont,
  formatCurrency: (amount: number) => string,
  formatDate: (dateString: string) => string
): Promise<Uint8Array> {
  const { width, height } = page.getSize();

  // Modern geometric header with diagonal elements
  page.drawRectangle({
    x: 0,
    y: height - 120,
    width: width,
    height: 120,
    color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
  });

  // Geometric accent shapes
  page.drawRectangle({
    x: 0,
    y: height - 120,
    width: width,
    height: 8,
    color: rgb(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b),
  });

  // Diagonal accent line
  page.drawLine({
    start: { x: 0, y: height - 40 },
    end: { x: 200, y: height - 40 },
    thickness: 3,
    color: rgb(1, 1, 1),
  });

  // Modern invoice title on the right side
  page.drawText('INVOICE', {
    x: 400,
    y: height - 60,
    size: 32,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  // Business information directly on purple background (no box) - moved slightly down
  page.drawText(businessSettings.businessName || 'Your Business', {
    x: 60,
    y: height - 60, // Moved down slightly
    size: 18,
    font: boldFont,
    color: rgb(1, 1, 1), // White text on purple background
  });

  if (businessSettings.address) {
    const addressLines = formatAddressForPDF(businessSettings.address, businessSettings);
    let addressY = height - 75;
    addressLines.forEach((line, index) => {
      page.drawText(line, {
        x: 60,
        y: addressY - (index * 10), // Slightly tighter spacing for modern template
        size: 8,
        font: font,
        color: rgb(1, 1, 1), // White text on purple background
      });
    });
    // Adjust phone and email position based on number of address lines
    const phoneYOffset = addressLines.length > 1 ? addressLines.length * 10 : 15;
    if (businessSettings.businessPhone) {
      page.drawText(businessSettings.businessPhone, {
        x: 60,
        y: height - 75 - phoneYOffset,
        size: 8,
        font: font,
        color: rgb(1, 1, 1), // White text on purple background
      });
    }

    if (businessSettings.businessEmail) {
      page.drawText(businessSettings.businessEmail, {
        x: 60,
        y: height - 75 - phoneYOffset - 10,
        size: 8,
        font: font,
        color: rgb(1, 1, 1), // White text on purple background
      });
    }
  }

  // Modern invoice details card
  const invoiceDetailsY = height - 160; // Moved up 40px total
  
  page.drawRectangle({
    x: 400,
    y: invoiceDetailsY - 80,
    width: 150,
    height: 80,
    color: rgb(0.95, 0.95, 0.95),
    borderColor: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
    borderWidth: 2,
  });

  page.drawText('INVOICE DETAILS', {
    x: 410,
    y: invoiceDetailsY - 20,
    size: 10,
    font: boldFont,
    color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
  });

  page.drawText(`#${invoice.invoiceNumber}`, {
    x: 410,
    y: invoiceDetailsY - 35,
    size: 9,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText(formatDate(invoice.createdAt), {
    x: 410,
    y: invoiceDetailsY - 50,
    size: 8,
    font: font,
    color: rgb(0.4, 0.4, 0.4),
  });

  page.drawText(`Due: ${formatDate(invoice.dueDate)}`, {
    x: 410,
    y: invoiceDetailsY - 65,
    size: 8,
    font: font,
    color: rgb(0.4, 0.4, 0.4),
  });

  // Bill to section with modern card - Dynamic positioning
  const billToY = height - 230; // Moved up to create more space
  let modernCurrentY = billToY - 20;
  
  // Calculate dynamic height based on content
  let contentHeight = 20; // Base height for title
  if (invoice.client.name) contentHeight += 15;
  if (invoice.client.email) contentHeight += 15;
  if (invoice.client.phone) contentHeight += 15;
  if (invoice.client.company) contentHeight += 15;
  if (invoice.client.address) contentHeight += 15; // Address includes postal code
  contentHeight = Math.max(contentHeight, 110); // Added more bottom padding to prevent touching
  
  page.drawRectangle({
    x: 50,
    y: billToY - contentHeight,
    width: 280, // Reduced width
    height: contentHeight,
    color: rgb(0.98, 0.98, 0.98),
    borderColor: rgb(0.9, 0.9, 0.9),
    borderWidth: 1,
  });

  page.drawText('BILL TO', {
    x: 60,
    y: modernCurrentY,
    size: 10,
    font: boldFont,
    color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
  });

  if (invoice.client.name) {
    modernCurrentY -= 15;
    page.drawText(invoice.client.name, {
      x: 60,
      y: modernCurrentY,
      size: 9,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  if (invoice.client.email) {
    modernCurrentY -= 15;
    page.drawText(invoice.client.email, {
      x: 60,
      y: modernCurrentY,
      size: 9,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  if (invoice.client.phone) {
    modernCurrentY -= 15;
    page.drawText(invoice.client.phone, {
      x: 60,
      y: modernCurrentY,
      size: 9,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  if (invoice.client.company) {
    modernCurrentY -= 15;
    page.drawText(invoice.client.company, {
      x: 60,
      y: modernCurrentY,
      size: 9,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  if (invoice.client.address) {
    modernCurrentY -= 15;
    // Remove newlines and replace with spaces to keep address on one line
    const addressText = invoice.client.address.replace(/\n/g, ', ').replace(/\r/g, '');
    page.drawText(addressText, {
      x: 60,
      y: modernCurrentY,
      size: 9,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  // Modern services table with geometric header
  const tableY = height - 390; // Moved further down to prevent overlap with wider Bill To box
  
  // Geometric table header
  page.drawRectangle({
    x: 50,
    y: tableY - 30,
    width: 500,
    height: 30,
    color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
  });

  // Geometric accent in header
  page.drawRectangle({
    x: 50,
    y: tableY - 30,
    width: 500,
    height: 4,
    color: rgb(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b),
  });

  // Header text
  page.drawText('DESCRIPTION', {
    x: 60,
    y: tableY - 20,
    size: 9,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  page.drawText('QTY', {
    x: 320,
    y: tableY - 20,
    size: 9,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  page.drawText('RATE', {
    x: 380,
    y: tableY - 20,
    size: 9,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  // AMOUNT header - aligned to match totals section
  page.drawText('AMOUNT', {
    x: 480, // Aligned with totals amounts
    y: tableY - 20,
    size: 9,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  // Services table rows with modern styling - minimal gap after header
  let currentY = tableY - 32; // Minimal gap (only 2px gap now)
  let total = 0;

  invoice.items.forEach((item, index) => {
    const amount = parseFloat(item.amount?.toString() || '0');
    total += amount;

    // Modern alternating rows with subtle borders
    if (index % 2 === 0) {
      page.drawRectangle({
        x: 50,
        y: currentY - 25,
        width: 500,
        height: 25,
        color: rgb(0.99, 0.99, 0.99),
      });
    }

    // Subtle row border
    page.drawLine({
      start: { x: 50, y: currentY - 25 },
      end: { x: 550, y: currentY - 25 },
      thickness: 0.5,
      color: rgb(0.9, 0.9, 0.9),
    });

    page.drawText(item.description, {
      x: 60,
      y: currentY - 18,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    page.drawText('1', {
      x: 320,
      y: currentY - 18,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    // Calculate rate: if rate is 0 or not provided, use amount (since quantity is 1)
    const itemRate = parseFloat(item.rate?.toString() || '0');
    const quantity = 1; // Default quantity is 1
    const rate = itemRate > 0 ? itemRate : (amount / quantity);
    
    page.drawText(formatCurrency(rate), {
      x: 380,
      y: currentY - 18,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    // AMOUNT values aligned with totals section
    page.drawText(formatCurrency(amount), {
      x: 480, // Aligned with totals amounts
      y: currentY - 18,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    currentY -= 25; // Reduced from 30 to 25 for tighter row spacing
  });

  // Enhanced totals section with all advanced features - fixed positioning
  const totalsY = currentY - 20;
  
  // Calculate totals (late fees are separate and only added after due date)
  const discountAmount = parseFloat(invoice.discount?.toString() || '0');
  const taxAmount = parseFloat(invoice.taxAmount?.toString() || '0');
  const lateFeeAmount = parseFloat(invoice.lateFees?.amount?.toString() || '0');
  
  // Determine how many lines we need for totals (late fees not included in base total)
  let totalLines = 1; // Subtotal
  if (discountAmount > 0) totalLines++;
  if (taxAmount > 0) totalLines++;
  // Late fees are not included in the base invoice total
  totalLines++; // Total line
  
  const totalsHeight = Math.max(80, totalLines * 20 + 30);
  
  // Geometric totals background
  page.drawRectangle({
    x: 350,
    y: totalsY - totalsHeight,
    width: 200,
    height: totalsHeight,
    color: rgb(0.95, 0.95, 0.95),
    borderColor: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
    borderWidth: 2,
  });

  // Geometric accent in totals
  page.drawRectangle({
    x: 350,
    y: totalsY - totalsHeight,
    width: 200,
    height: 4,
    color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
  });

  // Fixed positioning for each line
  let lineY = totalsY - 25; // Start position

  // Subtotal
  page.drawText('SUBTOTAL', {
    x: 360,
    y: lineY,
    size: 9,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText(formatCurrency(total), {
    x: 480,
    y: lineY,
    size: 9,
    font: font,
    color: rgb(0, 0, 0),
  });

  lineY -= 20;

  // Discount (if applicable)
  if (discountAmount > 0) {
    page.drawText('DISCOUNT', {
      x: 360,
      y: lineY,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    page.drawText(`-${formatCurrency(discountAmount)}`, {
      x: 480,
      y: lineY,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    lineY -= 20;
  }

  // Tax (if applicable)
  if (taxAmount > 0) {
    page.drawText('TAX', {
      x: 360,
      y: lineY,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    page.drawText(formatCurrency(taxAmount), {
      x: 480,
      y: lineY,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    lineY -= 20;
  }

  // Total with modern emphasis (late fees are separate and only added after due date)
  const invoiceTotal = total - discountAmount + taxAmount;
  const finalTotal = invoiceTotal; // Late fees are not included in the base total
  
  page.drawText('TOTAL', {
    x: 360,
    y: lineY,
    size: 12,
    font: boldFont,
    color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
  });

  page.drawText(formatCurrency(finalTotal), {
    x: 480,
    y: lineY,
    size: 12,
    font: boldFont,
    color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
  });

  // Enhanced footer with payment terms and notes - positioned higher to avoid cutoff
  const footerY = 120;
  
  // Payment Terms (if enabled)
  if (invoice.paymentTerms?.enabled && invoice.paymentTerms?.terms) {
    page.drawText('Payment Terms:', {
      x: 50,
      y: footerY,
      size: 8,
      font: boldFont,
      color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
    });
    
    page.drawText(invoice.paymentTerms.terms, {
      x: 50,
      y: footerY - 15,
      size: 7,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });
  }
  
  // Notes (if provided) - no hardcoded text, only from invoice modal
  if (invoice.notes) {
    const notesY = invoice.paymentTerms?.enabled ? footerY - 60 : footerY - 25;
    
    page.drawText('Notes:', {
      x: 50,
      y: notesY,
      size: 8,
      font: boldFont,
      color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
    });
    
    page.drawText(invoice.notes, {
      x: 50,
      y: notesY - 15,
      size: 7,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  return await pdfDoc.save();
}

// Template 5 - Creative Design (Combining Modern structure with Minimal clean lines)
async function generateSimpleCleanTemplatePDF(
  pdfDoc: PDFDocument,
  page: PDFPage,
  invoice: Invoice,
  businessSettings: BusinessSettings,
  primaryRgb: { r: number; g: number; b: number },
  secondaryRgb: { r: number; g: number; b: number },
  font: PDFFont,
  boldFont: PDFFont,
  formatCurrency: (amount: number) => string,
  formatDate: (dateString: string) => string
): Promise<Uint8Array> {
  const { width, height } = page.getSize();

  // Creative clean minimal header - similar to Modern
  page.drawRectangle({
    x: 0,
    y: height - 120,
    width: width,
    height: 120,
    color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
  });

  // Clean accent stripe at top
  page.drawRectangle({
    x: 0,
    y: height - 120,
    width: width,
    height: 6,
    color: rgb(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b),
  });

  // Creative invoice title on the right side
  page.drawText('INVOICE', {
    x: 400,
    y: height - 60,
    size: 28,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  // Business information on colored background (white text)
  page.drawText(businessSettings.businessName || 'Your Business', {
    x: 50,
    y: height - 60,
    size: 20,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  if (businessSettings.address) {
    const addressLines = formatAddressForPDF(businessSettings.address, businessSettings);
    let addressY = height - 75;
    addressLines.forEach((line, index) => {
      page.drawText(line, {
        x: 50,
        y: addressY - (index * 10),
        size: 8,
        font: font,
        color: rgb(1, 1, 1),
      });
    });
    // Adjust phone and email position based on number of address lines
    const phoneYOffset = addressLines.length > 1 ? addressLines.length * 10 : 15;
    if (businessSettings.businessPhone) {
      page.drawText(businessSettings.businessPhone, {
        x: 50,
        y: height - 75 - phoneYOffset,
        size: 8,
        font: font,
        color: rgb(1, 1, 1),
      });
    }

    if (businessSettings.businessEmail) {
      page.drawText(businessSettings.businessEmail, {
        x: 50,
        y: height - 75 - phoneYOffset - 10,
        size: 8,
        font: font,
        color: rgb(1, 1, 1),
      });
    }
  }

  // Invoice details card - matching Subtotal section design
  const invoiceDetailsY = height - 160;
  
  // Calculate proper height: top padding + 3 label-value pairs (36px each) + bottom padding
  // Each pair: label (18px) + value (18px) = 36px
  // Total: 20px top + (3 * 36px) + 15px bottom = 143px
  const detailsHeight = 143;
  
  // Clean card with subtle border (matching Subtotal)
  page.drawRectangle({
    x: 400,
    y: invoiceDetailsY - detailsHeight,
    width: 150,
    height: detailsHeight,
    color: rgb(0.98, 0.98, 0.98),
    borderColor: rgb(0.88, 0.88, 0.88),
    borderWidth: 1,
  });

  // Subtle top accent line (matching Subtotal)
  page.drawLine({
    start: { x: 400, y: invoiceDetailsY - detailsHeight },
    end: { x: 550, y: invoiceDetailsY - detailsHeight },
    thickness: 1,
    color: rgb(primaryRgb.r * 0.7, primaryRgb.g * 0.7, primaryRgb.b * 0.7),
  });

  // Start content from top of card with proper padding
  let detailsY = invoiceDetailsY - 20; // 20px from top

  // Invoice Number - clean typography (matching Subtotal style)
  page.drawText('Invoice #', {
    x: 410,
    y: detailsY,
    size: 9,
    font: font,
    color: rgb(0.4, 0.4, 0.4),
  });

  page.drawText(invoice.invoiceNumber, {
    x: 410,
    y: detailsY - 18,
    size: 9,
    font: font,
    color: rgb(0, 0, 0),
  });

  detailsY -= 36; // Move down for next pair

  // Date - clean typography (matching Subtotal style)
  page.drawText('Date:', {
    x: 410,
    y: detailsY,
    size: 9,
    font: font,
    color: rgb(0.4, 0.4, 0.4),
  });

  page.drawText(formatDate(invoice.createdAt), {
    x: 410,
    y: detailsY - 18,
    size: 9,
    font: font,
    color: rgb(0, 0, 0),
  });

  detailsY -= 36; // Move down for next pair

  // Due Date - clean typography (matching Subtotal style)
  // This should be at detailsY - 36, which gives us 15px padding at bottom
  page.drawText('Due:', {
    x: 410,
    y: detailsY,
    size: 9,
    font: font,
    color: rgb(0.4, 0.4, 0.4),
  });

  page.drawText(formatDate(invoice.dueDate), {
    x: 410,
    y: detailsY - 18,
    size: 9,
    font: font,
    color: rgb(0, 0, 0),
  });

  // Creative Bill To: Modern card structure + Minimal clean lines
  const billToY = height - 230;
  let creativeCurrentY = billToY - 20;
  
  // Calculate dynamic height
  let contentHeight = 20;
  if (invoice.client.name) contentHeight += 15;
  if (invoice.client.email) contentHeight += 15;
  if (invoice.client.phone) contentHeight += 15;
  if (invoice.client.company) contentHeight += 15;
  if (invoice.client.address) contentHeight += 15;
  contentHeight = Math.max(contentHeight, 110);
  
  // Clean section - no borders, no background, just text
  page.drawText('BILL TO', {
    x: 60,
    y: creativeCurrentY,
    size: 10,
    font: boldFont,
    color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b), // Minimal style - no colored bar, just colored text
  });

  creativeCurrentY -= 25;

  if (invoice.client.name) {
    creativeCurrentY -= 15;
    page.drawText(invoice.client.name, {
      x: 60,
      y: creativeCurrentY,
      size: 9,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  if (invoice.client.email) {
    creativeCurrentY -= 15;
    page.drawText(invoice.client.email, {
      x: 60,
      y: creativeCurrentY,
      size: 9,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  if (invoice.client.phone) {
    creativeCurrentY -= 15;
    page.drawText(invoice.client.phone, {
      x: 60,
      y: creativeCurrentY,
      size: 9,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  if (invoice.client.company) {
    creativeCurrentY -= 15;
    page.drawText(invoice.client.company, {
      x: 60,
      y: creativeCurrentY,
      size: 9,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  if (invoice.client.address) {
    creativeCurrentY -= 15;
    const addressText = invoice.client.address.replace(/\n/g, ', ').replace(/\r/g, '');
    page.drawText(addressText, {
      x: 60,
      y: creativeCurrentY,
      size: 9,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  // Creative table: Modern colored header + Minimal clean rows
  const tableY = height - 390;
  
  // Modern table header structure
  page.drawRectangle({
    x: 50,
    y: tableY - 30,
    width: 500,
    height: 30,
    color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
  });

  // Accent stripe (from Modern)
  page.drawRectangle({
    x: 50,
    y: tableY - 30,
    width: 500,
    height: 4,
    color: rgb(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b),
  });

  page.drawText('DESCRIPTION', {
    x: 60,
    y: tableY - 20,
    size: 9,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  page.drawText('QTY', {
    x: 320,
    y: tableY - 20,
    size: 9,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  page.drawText('RATE', {
    x: 380,
    y: tableY - 20,
    size: 9,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  // AMOUNT header - aligned to match totals section
  page.drawText('AMOUNT', {
    x: 480, // Aligned with totals amounts
    y: tableY - 20,
    size: 9,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  // Minimal clean rows (from Minimal template)
  let currentY = tableY - 32;
  invoice.items.forEach((item, index) => {
    const amount = parseFloat(item.amount?.toString() || '0');

    // Subtle alternating background (drawn first so it's behind everything)
    if (index % 2 === 0) {
      page.drawRectangle({
        x: 50,
        y: currentY - 25,
        width: 500,
        height: 25,
        color: rgb(0.99, 0.99, 0.99),
      });
    }

    // Row separator line - positioned at bottom of row (after content)
    // Draw separator at the bottom edge of the previous row
    if (index > 0) {
      page.drawLine({
        start: { x: 50, y: currentY },
        end: { x: 550, y: currentY },
        thickness: 0.5,
        color: rgb(0.92, 0.92, 0.92),
      });
    }

    // Text content positioned in the middle of the row
    page.drawText(item.description, {
      x: 60,
      y: currentY - 14,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    page.drawText('1', {
      x: 320,
      y: currentY - 14,
      size: 9,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    });

    // Calculate rate: if rate is 0 or not provided, use amount (since quantity is 1)
    const itemRate = parseFloat(item.rate?.toString() || '0');
    const quantity = 1; // Default quantity is 1
    const rate = itemRate > 0 ? itemRate : (amount / quantity);
    
    page.drawText(formatCurrency(rate), {
      x: 380,
      y: currentY - 14,
      size: 9,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    });

    // AMOUNT values aligned with totals section
    page.drawText(formatCurrency(amount), {
      x: 480, // Aligned with totals amounts
      y: currentY - 14,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    currentY -= 25;
  });

  // Clean totals section - minimal design
  const totalsY = currentY - 30;
  
  // Calculate totals
  const subtotal = invoice.items.reduce((sum, item) => sum + parseFloat(item.amount?.toString() || '0'), 0);
  const discountAmount = parseFloat(invoice.discount?.toString() || '0');
  const taxAmount = parseFloat(invoice.taxAmount?.toString() || '0');
  
  // Clean card with subtle border
  let totalLines = 1; // Subtotal
  if (discountAmount > 0) totalLines++;
  if (taxAmount > 0) totalLines++;
  totalLines++; // Total line
  
  const totalsHeight = Math.max(80, totalLines * 18 + 25);
  
  page.drawRectangle({
    x: 350,
    y: totalsY - totalsHeight,
    width: 200,
    height: totalsHeight,
    color: rgb(0.98, 0.98, 0.98),
    borderColor: rgb(0.88, 0.88, 0.88),
    borderWidth: 1,
  });

  // Subtle top accent line
  page.drawLine({
    start: { x: 350, y: totalsY - totalsHeight },
    end: { x: 550, y: totalsY - totalsHeight },
    thickness: 1,
    color: rgb(primaryRgb.r * 0.7, primaryRgb.g * 0.7, primaryRgb.b * 0.7),
  });

  let lineY = totalsY - 22;

  // Subtotal - clean typography
  page.drawText('Subtotal', {
    x: 360,
    y: lineY,
    size: 9,
    font: font,
    color: rgb(0.4, 0.4, 0.4),
  });

  page.drawText(formatCurrency(subtotal), {
    x: 480,
    y: lineY,
    size: 9,
    font: font,
    color: rgb(0, 0, 0),
  });

  lineY -= 18;

  // Discount (if applicable)
  if (discountAmount > 0) {
    page.drawText('Discount', {
      x: 360,
      y: lineY,
      size: 9,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });

    page.drawText(`-${formatCurrency(discountAmount)}`, {
      x: 480,
      y: lineY,
      size: 9,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });

    lineY -= 18;
  }

  // Tax (if applicable)
  if (taxAmount > 0) {
    page.drawText('Tax', {
      x: 360,
      y: lineY,
      size: 9,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });

    page.drawText(formatCurrency(taxAmount), {
      x: 480,
      y: lineY,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    lineY -= 18;
  }

  // Total - clean separator and emphasis
  const invoiceTotal = subtotal - discountAmount + taxAmount;
  const finalTotal = invoiceTotal;
  
  // Clean separator line before total
  page.drawLine({
    start: { x: 360, y: lineY + 4 },
    end: { x: 540, y: lineY + 4 },
    thickness: 0.5,
    color: rgb(0.85, 0.85, 0.85),
  });
  
  lineY -= 4;
  
  page.drawText('Total', {
    x: 360,
    y: lineY - 8,
    size: 10,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  page.drawText(formatCurrency(finalTotal), {
    x: 480,
    y: lineY - 8,
    size: 10,
    font: boldFont,
    color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
  });

  // Clean footer - simple design without backgrounds
  const footerY = 120;

  // Payment Terms section - clean and simple
  if (invoice.paymentTerms?.enabled && invoice.paymentTerms?.terms) {
    // Simple title only
    page.drawText('Payment Terms', {
      x: 50,
      y: footerY,
      size: 9,
      font: boldFont,
      color: rgb(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b),
    });

    // Simple content below title
    const termsText = invoice.paymentTerms.terms;
    const maxCharsPerLine = 30;
    const words = termsText.split(' ');
    let currentLine = '';
    const lines = [];

    words.forEach((word) => {
      if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
        currentLine = currentLine ? currentLine + ' ' + word : word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });
    if (currentLine) lines.push(currentLine);

    lines.slice(0, 2).forEach((line, index) => {
      page.drawText(line, {
        x: 50,
        y: footerY - 15 - (index * 12),
        size: 8,
        font: font,
        color: rgb(0.4, 0.4, 0.4),
      });
    });

    // Design line below Payment Terms
    const termsLineY = footerY - 15 - (Math.min(lines.length, 2) * 12) - 8;
    page.drawLine({
      start: { x: 50, y: termsLineY },
      end: { x: 250, y: termsLineY },
      thickness: 1,
      color: rgb(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b),
    });
  }

  // Notes section - clean and simple
  if (invoice.notes) {
    // Simple title only
    page.drawText('Notes', {
      x: 270,
      y: footerY,
      size: 9,
      font: boldFont,
      color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
    });

    // Simple content below title
    const notesText = invoice.notes;
    const maxCharsPerLine = 30;
    const words = notesText.split(' ');
    let currentLine = '';
    const lines = [];

    words.forEach((word) => {
      if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
        currentLine = currentLine ? currentLine + ' ' + word : word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });
    if (currentLine) lines.push(currentLine);

    lines.slice(0, 2).forEach((line, index) => {
      page.drawText(line, {
        x: 270,
        y: footerY - 15 - (index * 12),
        size: 8,
        font: font,
        color: rgb(0.4, 0.4, 0.4),
      });
    });

    // Design line below Notes
    const notesLineY = footerY - 15 - (Math.min(lines.length, 2) * 12) - 8;
    page.drawLine({
      start: { x: 270, y: notesLineY },
      end: { x: 470, y: notesLineY },
      thickness: 1,
      color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
    });
  }

  return await pdfDoc.save();
}

// Template 6 - Minimal Design (True minimal approach with clean lines and whitespace)
async function generateMinimalTemplatePDF(
  pdfDoc: PDFDocument,
  page: PDFPage,
  invoice: Invoice,
  businessSettings: BusinessSettings,
  primaryRgb: { r: number; g: number; b: number },
  secondaryRgb: { r: number; g: number; b: number },
  font: PDFFont,
  boldFont: PDFFont,
  formatCurrency: (amount: number) => string,
  formatDate: (dateString: string) => string
): Promise<Uint8Array> {
  const { width, height } = page.getSize();

  // Ultra-minimal header: Simple business name with primary color
  page.drawText(businessSettings.businessName || 'Your Business', {
    x: 50,
    y: height - 50,
    size: 20,
    font: boldFont, // Make it bold and bigger
    color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b), // Primary color
  });

  if (businessSettings.address) {
    const addressLines = formatAddressForPDF(businessSettings.address, businessSettings);
    let addressY = height - 68;
    addressLines.forEach((line, index) => {
      page.drawText(line, {
        x: 50,
        y: addressY - (index * 11),
        size: 9,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
      });
    });
    // Adjust phone and email position based on number of address lines
    const phoneYOffset = addressLines.length > 1 ? addressLines.length * 11 : 12;
    if (businessSettings.businessPhone) {
      page.drawText(businessSettings.businessPhone, {
        x: 50,
        y: height - 68 - phoneYOffset,
        size: 9,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
      });
    }

    if (businessSettings.businessEmail) {
      page.drawText(businessSettings.businessEmail, {
        x: 50,
        y: height - 68 - phoneYOffset - 12,
        size: 9,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
      });
    }
  }

  // Minimal invoice title - smaller, with primary color accent
  page.drawText('INVOICE', {
    x: 450,
    y: height - 50,
    size: 20,
    font: font, // Regular weight for minimal feel
    color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
  });

  // Clean invoice details - no "Invoice Details" label, just the info
  const invoiceDetailsY = height - 75;
  
  page.drawText(`#${invoice.invoiceNumber}`, {
    x: 450,
    y: invoiceDetailsY,
    size: 10,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  page.drawText(`Issue: ${formatDate(invoice.createdAt)}`, {
    x: 450,
    y: invoiceDetailsY - 18,
    size: 8,
    font: font,
    color: rgb(0.5, 0.5, 0.5),
  });

  page.drawText(`Due: ${formatDate(invoice.dueDate)}`, {
    x: 450,
    y: invoiceDetailsY - 32,
    size: 8,
    font: font,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Minimal Bill To section - no boxes, just clean text with subtle colored line
  const billToY = height - 180;
  
  // Subtle colored line separator using primary color
  page.drawLine({
    start: { x: 50, y: billToY },
    end: { x: 330, y: billToY },
    thickness: 1,
    color: rgb(primaryRgb.r * 0.6, primaryRgb.g * 0.6, primaryRgb.b * 0.6), // Lighter version of primary
  });
  
  let minimalCurrentY = billToY - 25;
  
  page.drawText('Bill To', {
    x: 50,
    y: minimalCurrentY,
    size: 10,
    font: font, // Regular weight for minimal look
    color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b), // Primary color for label
  });

  minimalCurrentY -= 20;

  if (invoice.client.name) {
    minimalCurrentY -= 14;
    page.drawText(invoice.client.name, {
      x: 50,
      y: minimalCurrentY,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });
  }

  if (invoice.client.email) {
    minimalCurrentY -= 14;
    page.drawText(invoice.client.email, {
      x: 50,
      y: minimalCurrentY,
      size: 9,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  if (invoice.client.phone) {
    minimalCurrentY -= 14;
    page.drawText(invoice.client.phone, {
      x: 50,
      y: minimalCurrentY,
      size: 9,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  if (invoice.client.company) {
    minimalCurrentY -= 14;
    page.drawText(invoice.client.company, {
      x: 50,
      y: minimalCurrentY,
      size: 9,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  if (invoice.client.address) {
    minimalCurrentY -= 14;
    const addressText = invoice.client.address.replace(/\n/g, ', ').replace(/\r/g, '');
    page.drawText(addressText, {
      x: 50,
      y: minimalCurrentY,
      size: 9,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  // Minimal table - no colored header, just clean text and lines
  const tableY = height - 320;
  
  // Minimal header - just text with primary color accents
  page.drawText('Description', {
    x: 50,
    y: tableY - 15,
    size: 9,
    font: font, // Regular weight for minimal
    color: rgb(primaryRgb.r * 0.7, primaryRgb.g * 0.7, primaryRgb.b * 0.7), // Lighter primary
  });

  page.drawText('Qty', {
    x: 350,
    y: tableY - 15,
    size: 9,
    font: font,
    color: rgb(primaryRgb.r * 0.7, primaryRgb.g * 0.7, primaryRgb.b * 0.7),
  });

  page.drawText('Rate', {
    x: 400,
    y: tableY - 15,
    size: 9,
    font: font,
    color: rgb(primaryRgb.r * 0.7, primaryRgb.g * 0.7, primaryRgb.b * 0.7),
  });

  page.drawText('Amount', {
    x: 480,
    y: tableY - 15,
    size: 9,
    font: font,
    color: rgb(primaryRgb.r * 0.7, primaryRgb.g * 0.7, primaryRgb.b * 0.7),
  });

  // Subtle colored header line
  page.drawLine({
    start: { x: 50, y: tableY - 5 },
    end: { x: 550, y: tableY - 5 },
    thickness: 0.5,
    color: rgb(primaryRgb.r * 0.5, primaryRgb.g * 0.5, primaryRgb.b * 0.5), // Even lighter for line
  });

  // Clean table rows with subtle separators
  let currentY = tableY - 35;
  let subtotal = 0;

  invoice.items.forEach((item, index) => {
    const amount = parseFloat(item.amount?.toString() || '0');
    subtotal += amount;

    // Very subtle row separator - lighter color
    if (index > 0) {
      page.drawLine({
        start: { x: 50, y: currentY + 12 },
        end: { x: 550, y: currentY + 12 },
        thickness: 0.3,
        color: rgb(0.92, 0.92, 0.92),
      });
    }

    page.drawText(item.description, {
      x: 50,
      y: currentY,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    page.drawText('1', {
      x: 350,
      y: currentY,
      size: 9,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    });

    // Calculate rate: if rate is 0 or not provided, use amount (since quantity is 1)
    const itemRate = parseFloat(item.rate?.toString() || '0');
    const quantity = 1; // Default quantity is 1
    const rate = itemRate > 0 ? itemRate : (amount / quantity);
    
    page.drawText(formatCurrency(rate), {
      x: 400,
      y: currentY,
      size: 9,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    });

    page.drawText(formatCurrency(amount), {
      x: 480,
      y: currentY,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    currentY -= 22;
  });

  // Minimal totals section - no boxes, just clean lines and text
  const totalsY = currentY - 30;
  let totalY = totalsY;
  
  // Calculate totals (late fees are separate and only added after due date)
  const discountAmount = parseFloat(invoice.discount?.toString() || '0');
  const taxAmount = parseFloat(invoice.taxAmount?.toString() || '0');
  const lateFeeAmount = parseFloat(invoice.lateFees?.amount?.toString() || '0');
  
  // Subtle colored separator line above totals
  page.drawLine({
    start: { x: 400, y: totalsY + 15 },
    end: { x: 550, y: totalsY + 15 },
    thickness: 0.5,
    color: rgb(primaryRgb.r * 0.5, primaryRgb.g * 0.5, primaryRgb.b * 0.5),
  });

  // Subtotal
  page.drawText('Subtotal:', {
    x: 400,
    y: totalY,
    size: 9,
    font: font,
    color: rgb(primaryRgb.r * 0.7, primaryRgb.g * 0.7, primaryRgb.b * 0.7),
  });

  page.drawText(formatCurrency(subtotal), {
    x: 480,
    y: totalY,
    size: 9,
    font: font,
    color: rgb(0, 0, 0),
  });

  totalY -= 18;

  // Discount (if applicable)
  if (discountAmount > 0) {
    page.drawText('Discount:', {
      x: 400,
      y: totalY,
      size: 9,
      font: font,
      color: rgb(primaryRgb.r * 0.7, primaryRgb.g * 0.7, primaryRgb.b * 0.7),
    });

    page.drawText(`-${formatCurrency(discountAmount)}`, {
      x: 480,
      y: totalY,
      size: 9,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });

    totalY -= 18;
  }

  // Tax (if applicable)
  if (taxAmount > 0) {
    page.drawText('Tax:', {
      x: 400,
      y: totalY,
      size: 9,
      font: font,
      color: rgb(primaryRgb.r * 0.7, primaryRgb.g * 0.7, primaryRgb.b * 0.7),
    });

    page.drawText(formatCurrency(taxAmount), {
      x: 480,
      y: totalY,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    totalY -= 18;
  }

  // Late Fees (only show if invoice is actually overdue - not in total calculation)
  const invoiceTotal = subtotal - discountAmount + taxAmount;
  const finalTotal = invoiceTotal; // Late fees are not included in the base total
  
  // Subtle colored line before total
  page.drawLine({
    start: { x: 400, y: totalY + 8 },
    end: { x: 550, y: totalY + 8 },
    thickness: 0.5,
    color: rgb(primaryRgb.r * 0.5, primaryRgb.g * 0.5, primaryRgb.b * 0.5),
  });
  
  totalY -= 5;
  
  page.drawText('Total:', {
    x: 400,
    y: totalY,
    size: 11,
    font: font, // Regular weight for minimal
    color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b), // Primary color for emphasis
  });

  page.drawText(formatCurrency(finalTotal), {
    x: 480,
    y: totalY,
    size: 11,
    font: font,
    color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b), // Primary color for total amount
  });

  // Minimal footer - just a subtle colored line and clean text
  const footerY = 130;
  
  // Very subtle colored separator line
  page.drawLine({
    start: { x: 50, y: footerY },
    end: { x: 200, y: footerY },
    thickness: 0.5,
    color: rgb(primaryRgb.r * 0.5, primaryRgb.g * 0.5, primaryRgb.b * 0.5),
  });
  
  // Payment terms (if enabled)
  if (invoice.paymentTerms?.enabled && invoice.paymentTerms?.terms) {
    page.drawText('Payment Terms:', {
      x: 50,
      y: footerY - 22,
      size: 8,
      font: font,
      color: rgb(primaryRgb.r * 0.7, primaryRgb.g * 0.7, primaryRgb.b * 0.7),
    });
    
    page.drawText(invoice.paymentTerms.terms, {
      x: 50,
      y: footerY - 35,
      size: 8,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    });
  }
  
  // Notes (if provided)
  if (invoice.notes) {
    const notesY = invoice.paymentTerms?.enabled ? footerY - 55 : footerY - 22;
    
    page.drawText('Notes:', {
      x: 50,
      y: notesY,
      size: 8,
      font: font,
      color: rgb(primaryRgb.r * 0.7, primaryRgb.g * 0.7, primaryRgb.b * 0.7),
    });
    
    page.drawText(invoice.notes, {
      x: 50,
      y: notesY - 15,
      size: 8,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    });
  }

  return await pdfDoc.save();
}