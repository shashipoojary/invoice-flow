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
    size: 14,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  if (businessSettings.address) {
    page.drawText(businessSettings.address, {
      x: 110,
      y: height - 115,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });
  }

  if (businessSettings.businessPhone) {
    page.drawText(businessSettings.businessPhone, {
      x: 110,
      y: height - 130,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });
  }

  if (businessSettings.businessEmail) {
    page.drawText(businessSettings.businessEmail, {
      x: 110,
      y: height - 145,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });
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

  // Bill to section
  page.drawText('Bill To:', {
    x: 50,
    y: height - 180,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  page.drawText(invoice.client.name, {
    x: 50,
    y: height - 200,
    size: 11,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  if (invoice.client.email) {
    page.drawText(invoice.client.email, {
      x: 50,
      y: height - 215,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });
  }

  if (invoice.client.address) {
    page.drawText(invoice.client.address, {
      x: 50,
      y: height - 230,
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

    page.drawText(formatCurrency(parseFloat(item.rate?.toString() || '0')), {
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
    size: 16,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  if (businessSettings.address) {
    page.drawText(businessSettings.address, {
      x: 100,
      y: height - 135,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });
  }

  if (businessSettings.businessPhone) {
    page.drawText(businessSettings.businessPhone, {
      x: 100,
      y: height - 150,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });
  }

  if (businessSettings.businessEmail) {
    page.drawText(businessSettings.businessEmail, {
      x: 100,
      y: height - 165,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });
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

  // Bill to section
  page.drawText('Bill To:', {
    x: 50,
    y: height - 200,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  page.drawText(invoice.client.name, {
    x: 50,
    y: height - 220,
    size: 11,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  if (invoice.client.email) {
    page.drawText(invoice.client.email, {
      x: 50,
      y: height - 235,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });
  }

  if (invoice.client.address) {
    page.drawText(invoice.client.address, {
      x: 50,
      y: height - 250,
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

    page.drawText(formatCurrency(parseFloat(item.rate?.toString() || '0')), {
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

  // Creative header with artistic gradient effect
  page.drawRectangle({
    x: 0,
    y: height - 120,
    width: width,
    height: 120,
    color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
  });

  // Creative artistic accent shapes
  page.drawRectangle({
    x: 0,
    y: height - 120,
    width: width,
    height: 12,
    color: rgb(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b),
  });

  // Creative diagonal accent lines
  page.drawLine({
    start: { x: 0, y: height - 50 },
    end: { x: 300, y: height - 50 },
    thickness: 4,
    color: rgb(1, 1, 1),
  });

  page.drawLine({
    start: { x: 0, y: height - 60 },
    end: { x: 200, y: height - 60 },
    thickness: 2,
    color: rgb(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b),
  });

  // Creative invoice title with artistic styling
  page.drawText('INVOICE', {
    x: 50,
    y: height - 70,
    size: 30,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  // Creative logo area with artistic border
  if (businessSettings.logo) {
    try {
      const logoBytes = Uint8Array.from(atob(businessSettings.logo.split(',')[1]), c => c.charCodeAt(0));
      const logoImage = await pdfDoc.embedPng(logoBytes);
      const logoDims = logoImage.scale(0.35);
      
      // Creative artistic border around logo
      page.drawRectangle({
        x: 50,
        y: height - 110,
        width: 70,
        height: 70,
        borderColor: rgb(1, 1, 1),
        borderWidth: 3,
      });
      
      // Creative corner accents
      page.drawRectangle({
        x: 50,
        y: height - 110,
        width: 15,
        height: 15,
        color: rgb(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b),
      });
      
      page.drawRectangle({
        x: 105,
        y: height - 40,
        width: 15,
        height: 15,
        color: rgb(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b),
      });
      
      page.drawImage(logoImage, {
        x: 60,
        y: height - 100,
        width: logoDims.width,
        height: logoDims.height,
      });
    } catch (error) {
      // Creative artistic logo fallback
      page.drawRectangle({
        x: 50,
        y: height - 110,
        width: 70,
        height: 70,
        color: rgb(1, 1, 1),
      });
      
      // Creative corner accents
      page.drawRectangle({
        x: 50,
        y: height - 110,
        width: 15,
        height: 15,
        color: rgb(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b),
      });
      
      page.drawRectangle({
        x: 105,
        y: height - 40,
        width: 15,
        height: 15,
        color: rgb(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b),
      });
      
      page.drawText(businessSettings.businessName?.charAt(0) || 'B', {
        x: 80,
        y: height - 140,
        size: 28,
        font: boldFont,
        color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
      });
    }
  } else {
    // Creative artistic text logo
    page.drawRectangle({
      x: 50,
      y: height - 110,
      width: 70,
      height: 70,
      color: rgb(1, 1, 1),
    });
    
    // Creative corner accents
    page.drawRectangle({
      x: 50,
      y: height - 110,
      width: 15,
      height: 15,
      color: rgb(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b),
    });
    
    page.drawRectangle({
      x: 105,
      y: height - 40,
      width: 15,
      height: 15,
      color: rgb(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b),
    });
    
    page.drawText(businessSettings.businessName?.charAt(0) || 'B', {
      x: 80,
      y: height - 140,
      size: 28,
      font: boldFont,
      color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
    });
  }

  // Business information with creative styling
  page.drawText(businessSettings.businessName || 'Your Business', {
    x: 140,
    y: height - 100,
    size: 16,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  if (businessSettings.address) {
    page.drawText(businessSettings.address, {
      x: 140,
      y: height - 115,
      size: 9,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    });
  }

  if (businessSettings.businessPhone) {
    page.drawText(businessSettings.businessPhone, {
      x: 140,
      y: height - 130,
      size: 9,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    });
  }

  if (businessSettings.businessEmail) {
    page.drawText(businessSettings.businessEmail, {
      x: 140,
      y: height - 145,
      size: 9,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    });
  }

  // Creative invoice details section with artistic elements
  const invoiceDetailsY = height - 190;
  
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
  const billToY = height - 300;
  
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
  const tableY = height - 410;
  
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

    page.drawText(formatCurrency(parseFloat(item.rate?.toString() || '0')), {
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
    size: 14,
    font: boldFont,
    color: rgb(1, 1, 1), // White text on purple background
  });

  if (businessSettings.address) {
    page.drawText(businessSettings.address, {
      x: 60,
      y: height - 75, // Moved down slightly
      size: 8,
      font: font,
      color: rgb(1, 1, 1), // White text on purple background
    });
  }

  if (businessSettings.businessPhone) {
    page.drawText(businessSettings.businessPhone, {
      x: 60,
      y: height - 90, // Moved down slightly
      size: 8,
      font: font,
      color: rgb(1, 1, 1), // White text on purple background
    });
  }

  if (businessSettings.businessEmail) {
    page.drawText(businessSettings.businessEmail, {
      x: 60,
      y: height - 105, // Moved down slightly
      size: 8,
      font: font,
      color: rgb(1, 1, 1), // White text on purple background
    });
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

  // Bill to section with modern card
  const billToY = height - 260; // Moved up 40px total
  
  page.drawRectangle({
    x: 50,
    y: billToY - 80,
    width: 250,
    height: 80,
    color: rgb(0.98, 0.98, 0.98),
    borderColor: rgb(0.9, 0.9, 0.9),
    borderWidth: 1,
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
    size: 9,
    font: font,
    color: rgb(0.4, 0.4, 0.4),
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

  // Modern services table with geometric header
  const tableY = height - 360; // Moved up 40px total
  
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

  page.drawText('AMOUNT', {
    x: 460,
    y: tableY - 20,
    size: 9,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  // Services table rows with modern styling
  let currentY = tableY - 50;
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

    page.drawText(formatCurrency(parseFloat(item.rate?.toString() || '0')), {
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

// Template 5 - Simple Clean Design (Two-column layout with clean typography)
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

  // Parse accent color (pink for creative design)
  const accentRgb = hexToRgb('#EC4899');

  // Creative gradient-like header with artistic elements
  page.drawRectangle({
    x: 0,
    y: height - 120,
    width: width,
    height: 120,
    color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
  });

  // Artistic diagonal accent shapes
  page.drawRectangle({
    x: 0,
    y: height - 40,
    width: 200,
    height: 40,
    color: rgb(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b),
  });

  page.drawRectangle({
    x: width - 150,
    y: height - 80,
    width: 150,
    height: 80,
    color: rgb(accentRgb.r, accentRgb.g, accentRgb.b),
  });

  // Creative corner accents
  page.drawRectangle({
    x: 0,
    y: height - 20,
    width: 20,
    height: 20,
    color: rgb(1, 1, 1),
  });

  page.drawRectangle({
    x: width - 20,
    y: height - 20,
    width: 20,
    height: 20,
    color: rgb(1, 1, 1),
  });

  // Artistic business name with creative styling
  page.drawText(businessSettings.businessName || 'Creative Studio', {
    x: 50,
    y: height - 50,
    size: 18,
    font: boldFont,
    color: rgb(1, 1, 1), // White text on colorful background
  });

  // Creative tagline
  page.drawText('Bringing Ideas to Life', {
    x: 50,
    y: height - 70,
    size: 10,
    font: font,
    color: rgb(1, 1, 1),
  });

  // Contact info with artistic styling
  if (businessSettings.businessEmail) {
    page.drawText(businessSettings.businessEmail, {
      x: 50,
      y: height - 90,
      size: 9,
      font: font,
      color: rgb(1, 1, 1),
    });
  }

  if (businessSettings.businessPhone) {
    page.drawText(businessSettings.businessPhone, {
      x: 50,
      y: height - 105,
      size: 9,
      font: font,
      color: rgb(1, 1, 1),
    });
  }

  // Creative invoice title without white box
  page.drawText('INVOICE', {
    x: 420,
    y: height - 45,
    size: 24,
    font: boldFont,
    color: rgb(1, 1, 1), // White text on colorful background
  });

  // Invoice details with creative styling
  page.drawText(`#${invoice.invoiceNumber}`, {
    x: 400,
    y: height - 85,
    size: 12,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  page.drawText(`Date: ${formatDate(invoice.createdAt)}`, {
    x: 400,
    y: height - 100,
    size: 9,
    font: font,
    color: rgb(1, 1, 1),
  });

  page.drawText(`Due: ${formatDate(invoice.dueDate)}`, {
    x: 400,
    y: height - 115,
    size: 9,
    font: font,
    color: rgb(1, 1, 1),
  });

  // Creative bill to section with artistic background - aligned with description column
  const billToY = height - 200;
  
  page.drawRectangle({
    x: 50,
    y: billToY - 95,
    width: 250,
    height: 95,
    color: rgb(0.95, 0.95, 0.95),
  });

  page.drawRectangle({
    x: 50,
    y: billToY - 20,
    width: 250,
    height: 20,
    color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
  });

  page.drawText('BILL TO', {
    x: 60,
    y: billToY - 15,
    size: 10,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  page.drawText(invoice.client.name, {
    x: 60,
    y: billToY - 40,
    size: 10,
    font: font,
    color: rgb(0.2, 0.2, 0.2),
  });

  if (invoice.client.company) {
    page.drawText(invoice.client.company, {
      x: 60,
      y: billToY - 45, // Even closer - 5px gap
      size: 9,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  if (invoice.client.address) {
    page.drawText(invoice.client.address, {
      x: 60,
      y: billToY - 50, // Even closer - 5px gap
      size: 8,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  // Add email if available
  if (invoice.client.email) {
    page.drawText(invoice.client.email, {
      x: 60,
      y: billToY - 55, // Even closer - 5px gap
      size: 8,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  // Creative services table with artistic header
  const tableY = height - 320;
  const tableWidth = width - 100;
  const rowHeight = 25;

  // Artistic table header with gradient effect
  page.drawRectangle({
    x: 50,
    y: tableY - 30,
    width: tableWidth,
    height: 30,
    color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
  });

  page.drawRectangle({
    x: 50,
    y: tableY - 25,
    width: tableWidth,
    height: 5,
    color: rgb(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b),
  });

  // Creative corner accents for table header
  page.drawRectangle({
    x: 50,
    y: tableY - 30,
    width: 10,
    height: 10,
    color: rgb(accentRgb.r, accentRgb.g, accentRgb.b),
  });

  page.drawRectangle({
    x: 50 + tableWidth - 10,
    y: tableY - 30,
    width: 10,
    height: 10,
    color: rgb(accentRgb.r, accentRgb.g, accentRgb.b),
  });

  page.drawText('DESCRIPTION', {
    x: 60,
    y: tableY - 20,
    size: 10,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  page.drawText('RATE', {
    x: 350,
    y: tableY - 20,
    size: 10,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  page.drawText('AMOUNT', {
    x: 450,
    y: tableY - 20,
    size: 10,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  // Creative table rows with alternating colors
  let currentY = tableY - 50;
  invoice.items.forEach((item, index) => {
    // Alternating row colors
    if (index % 2 === 0) {
      page.drawRectangle({
        x: 50,
        y: currentY - 5,
        width: tableWidth,
        height: 25,
        color: rgb(0.98, 0.98, 0.98),
      });
    }

    // Creative separators
    if (index > 0) {
      page.drawLine({
        start: { x: 60, y: currentY + 10 },
        end: { x: 50 + tableWidth - 10, y: currentY + 10 },
        thickness: 0.5,
        color: rgb(0.7, 0.7, 0.7),
      });
    }

    page.drawText(item.description, {
      x: 60,
      y: currentY,
      size: 9,
      font: font,
      color: rgb(0.2, 0.2, 0.2),
    });

    page.drawText(`$${item.rate?.toFixed(2) || '0.00'}`, {
      x: 350,
      y: currentY,
      size: 9,
      font: font,
      color: rgb(0.2, 0.2, 0.2),
    });

    page.drawText(`$${parseFloat(item.amount?.toString() || '0').toFixed(2)}`, {
      x: 450,
      y: currentY,
      size: 9,
      font: font,
      color: rgb(0.2, 0.2, 0.2),
    });

    currentY -= rowHeight;
  });

  // Enhanced totals section with all advanced features
  const totalsY = currentY - 20;
  let totalY = totalsY;
  
  // Calculate totals (late fees are separate and only added after due date)
  const subtotal = invoice.items.reduce((sum, item) => sum + parseFloat(item.amount?.toString() || '0'), 0);
  const discountAmount = parseFloat(invoice.discount?.toString() || '0');
  const taxAmount = parseFloat(invoice.taxAmount?.toString() || '0');
  const lateFeeAmount = parseFloat(invoice.lateFees?.amount?.toString() || '0');
  
  // Determine how many lines we need for totals (late fees not included in base total)
  let totalLines = 1; // Subtotal
  if (discountAmount > 0) totalLines++;
  if (taxAmount > 0) totalLines++;
  // Late fees are not included in the base invoice total
  totalLines++; // Total line
  
  const totalsHeight = Math.max(80, totalLines * 15 + 20);
  
  // Clean total line
  page.drawLine({
    start: { x: 400, y: totalY },
    end: { x: 550, y: totalY },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  // Subtotal
  page.drawText('Subtotal:', {
    x: 420,
    y: totalY - 15,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText(`$${subtotal.toFixed(2)}`, {
    x: 480,
    y: totalY - 15,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  });

  totalY -= 15;

  // Discount (if applicable)
  if (discountAmount > 0) {
    page.drawText('Discount:', {
      x: 420,
      y: totalY - 15,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });

    page.drawText(`-${formatCurrency(discountAmount)}`, {
      x: 480,
      y: totalY - 15,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });

    totalY -= 15;
  }

  // Tax (if applicable)
  if (taxAmount > 0) {
    page.drawText('Tax:', {
      x: 420,
      y: totalY - 15,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });

    page.drawText(formatCurrency(taxAmount), {
      x: 480,
      y: totalY - 15,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });

    totalY -= 15;
  }

  // Total with clean emphasis (late fees are separate and only added after due date)
  const invoiceTotal = subtotal - discountAmount + taxAmount;
  const finalTotal = invoiceTotal; // Late fees are not included in the base total
  
  page.drawText('Total:', {
    x: 420,
    y: totalY - 20,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  page.drawText(`$${finalTotal.toFixed(2)}`, {
    x: 480,
    y: totalY - 20,
    size: 12,
    font: boldFont,
    color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
  });

  // Creative footer with artistic elements - properly aligned sections
  const footerY = 120;
  const boxWidth = 200;
  const boxHeight = 35; // Fixed height for both sections
  const boxY = footerY - boxHeight; // Fixed Y position for both sections

  // Payment Terms section - fixed position
  if (invoice.paymentTerms?.enabled && invoice.paymentTerms?.terms) {
    page.drawRectangle({
      x: 50,
      y: boxY,
      width: boxWidth,
      height: boxHeight,
      color: rgb(0.95, 0.95, 0.95),
    });

    page.drawRectangle({
      x: 50,
      y: footerY - 12,
      width: boxWidth,
      height: 12,
      color: rgb(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b),
    });

    page.drawText('PAYMENT TERMS', {
      x: 55,
      y: footerY - 10,
      size: 7,
      font: boldFont,
      color: rgb(1, 1, 1),
    });

    // Smart text wrapping for payment terms
    const termsText = invoice.paymentTerms.terms;
    const maxCharsPerLine = 25; // Approximate characters per line
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

    // Display up to 2 lines
    lines.slice(0, 2).forEach((line, index) => {
      page.drawText(line, {
        x: 55,
        y: footerY - 20 - (index * 8),
        size: 6,
        font: font,
        color: rgb(0.2, 0.2, 0.2),
      });
    });
  }

  // Notes section - same fixed position and height
  if (invoice.notes) {
    page.drawRectangle({
      x: 270,
      y: boxY, // Same Y position as Payment Terms
      width: boxWidth,
      height: boxHeight, // Same height as Payment Terms
      color: rgb(0.95, 0.95, 0.95),
    });

    page.drawRectangle({
      x: 270,
      y: footerY - 12, // Same header position as Payment Terms
      width: boxWidth,
      height: 12,
      color: rgb(accentRgb.r, accentRgb.g, accentRgb.b),
    });

    page.drawText('NOTES', {
      x: 275,
      y: footerY - 10, // Same header text position as Payment Terms
      size: 7,
      font: boldFont,
      color: rgb(1, 1, 1),
    });

    // Smart text wrapping for notes
    const notesText = invoice.notes;
    const maxCharsPerLine = 25; // Approximate characters per line
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

    // Display up to 2 lines
    lines.slice(0, 2).forEach((line, index) => {
      page.drawText(line, {
        x: 275,
        y: footerY - 20 - (index * 8), // Same text position as Payment Terms
        size: 6,
        font: font,
        color: rgb(0.2, 0.2, 0.2),
      });
    });
  }

  // Creative footer line with artistic elements
  page.drawLine({
    start: { x: 0, y: 50 },
    end: { x: width, y: 50 },
    thickness: 3,
    color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
  });

  page.drawLine({
    start: { x: 0, y: 45 },
    end: { x: width, y: 45 },
    thickness: 1,
    color: rgb(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b),
  });

  page.drawLine({
    start: { x: 0, y: 40 },
    end: { x: width, y: 40 },
    thickness: 1,
    color: rgb(accentRgb.r, accentRgb.g, accentRgb.b),
  });

  return await pdfDoc.save();
}

// Template 6 - Minimal Design (Fresh minimal approach with card-based layout)
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

  // Business information positioned at the very top (no logo)
  page.drawText(businessSettings.businessName || 'Your Business', {
    x: 50,
    y: height - 60,
    size: 18,
    font: boldFont,
    color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
  });

  if (businessSettings.address) {
    page.drawText(businessSettings.address, {
      x: 50,
      y: height - 80,
      size: 10,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    });
  }

  if (businessSettings.businessPhone) {
    page.drawText(businessSettings.businessPhone, {
      x: 50,
      y: height - 95,
      size: 10,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    });
  }

  if (businessSettings.businessEmail) {
    page.drawText(businessSettings.businessEmail, {
      x: 50,
      y: height - 110,
      size: 10,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    });
  }

  // Invoice title positioned on the right side (same height as business details)
  page.drawText('INVOICE', {
    x: 450,
    y: height - 60,
    size: 24,
    font: boldFont,
    color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
  });

  // Invoice details positioned on top right (below INVOICE title)
  const invoiceDetailsY = height - 90;
  
  page.drawText('Invoice Details', {
    x: 450,
    y: invoiceDetailsY,
    size: 12,
    font: boldFont,
    color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
  });

  page.drawText(`#${invoice.invoiceNumber}`, {
    x: 450,
    y: invoiceDetailsY - 20,
    size: 11,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  page.drawText(`Issue: ${formatDate(invoice.createdAt)}`, {
    x: 450,
    y: invoiceDetailsY - 35,
    size: 9,
    font: font,
    color: rgb(0.3, 0.3, 0.3),
  });

  page.drawText(`Due: ${formatDate(invoice.dueDate)}`, {
    x: 450,
    y: invoiceDetailsY - 50,
    size: 9,
    font: font,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Enhanced Bill to section with light borders (pushed down more)
  const billToY = height - 210;
  
  page.drawRectangle({
    x: 50,
    y: billToY - 90,
    width: 280,
    height: 90,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 1,
    color: rgb(0.98, 0.98, 0.98),
  });
  
  page.drawText('Bill To', {
    x: 60,
    y: billToY - 30,
    size: 11,
    font: boldFont,
    color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
  });

  page.drawText(invoice.client.name, {
    x: 60,
    y: billToY - 45,
    size: 9,
    font: font,
    color: rgb(0.3, 0.3, 0.3),
  });

  if (invoice.client.email) {
    page.drawText(invoice.client.email, {
      x: 60,
      y: billToY - 60,
      size: 9,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    });
  }

  if (invoice.client.address) {
    page.drawText(invoice.client.address, {
      x: 60,
      y: billToY - 75,
      size: 9,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    });
  }

  // Services table with customizable color design (adjusted for footer space)
  const tableY = height - 350;
  
  // Table header with primary color background
  page.drawRectangle({
    x: 50,
    y: tableY - 30,
    width: 500,
    height: 30,
    color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
  });

  // Header text with white color for visibility on colored background
  page.drawText('Description', {
    x: 60,
    y: tableY - 20,
    size: 9,
    font: boldFont,
    color: rgb(1, 1, 1), // White text for visibility
  });

  page.drawText('Qty', {
    x: 350,
    y: tableY - 20,
    size: 9,
    font: boldFont,
    color: rgb(1, 1, 1), // White text for visibility
  });

  page.drawText('Rate', {
    x: 400,
    y: tableY - 20,
    size: 9,
    font: boldFont,
    color: rgb(1, 1, 1), // White text for visibility
  });

  page.drawText('Amount', {
    x: 480,
    y: tableY - 20,
    size: 9,
    font: boldFont,
    color: rgb(1, 1, 1), // White text for visibility
  });

  // Services table rows with minimal separators
  let currentY = tableY - 50;
  let subtotal = 0;

  invoice.items.forEach((item, index) => {
    const amount = parseFloat(item.amount?.toString() || '0');
    subtotal += amount;

    // Minimal row separator
    if (index > 0) {
      page.drawLine({
        start: { x: 50, y: currentY + 10 },
        end: { x: 550, y: currentY + 10 },
        thickness: 0.5,
        color: rgb(0.9, 0.9, 0.9),
      });
    }

    page.drawText(item.description, {
      x: 60,
      y: currentY - 5,
      size: 8,
      font: font,
      color: rgb(0, 0, 0),
    });

    page.drawText('1', {
      x: 350,
      y: currentY - 5,
      size: 8,
      font: font,
      color: rgb(0, 0, 0),
    });

    page.drawText(formatCurrency(parseFloat(item.rate?.toString() || '0')), {
      x: 400,
      y: currentY - 5,
      size: 8,
      font: font,
      color: rgb(0, 0, 0),
    });

    page.drawText(formatCurrency(amount), {
      x: 480,
      y: currentY - 5,
      size: 8,
      font: font,
      color: rgb(0, 0, 0),
    });

    currentY -= 25;
  });

  // Enhanced totals section with all advanced features
  const totalsY = currentY - 20;
  let totalY = totalsY;
  
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
  
  const totalsHeight = Math.max(80, totalLines * 15 + 20);
  
  page.drawRectangle({
    x: 400,
    y: totalsY - totalsHeight,
    width: 150,
    height: totalsHeight,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 1,
    color: rgb(0.98, 0.98, 0.98),
  });

  // Subtotal
  page.drawText('Subtotal:', {
    x: 410,
    y: totalY - 20,
    size: 8,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText(formatCurrency(subtotal), {
    x: 480,
    y: totalY - 20,
    size: 8,
    font: font,
    color: rgb(0, 0, 0),
  });

  totalY -= 15;

  // Discount (if applicable)
  if (discountAmount > 0) {
    page.drawText('Discount:', {
      x: 410,
      y: totalY - 20,
      size: 8,
      font: font,
      color: rgb(0, 0, 0),
    });

    page.drawText(`-${formatCurrency(discountAmount)}`, {
      x: 480,
      y: totalY - 20,
      size: 8,
      font: font,
      color: rgb(0.6, 0.6, 0.6),
    });

    totalY -= 15;
  }

  // Tax (if applicable)
  if (taxAmount > 0) {
    page.drawText('Tax:', {
      x: 410,
      y: totalY - 20,
      size: 8,
      font: font,
      color: rgb(0, 0, 0),
    });

    page.drawText(formatCurrency(taxAmount), {
      x: 480,
      y: totalY - 20,
      size: 8,
      font: font,
      color: rgb(0, 0, 0),
    });

    totalY -= 15;
  }

  // Late Fees (only show if invoice is actually overdue - not in total calculation)
  // Note: Late fees should only be added after the due date, not in the base invoice total
  const invoiceTotal = subtotal - discountAmount + taxAmount;
  const finalTotal = invoiceTotal; // Late fees are not included in the base total
  
  page.drawText('Total:', {
    x: 410,
    y: totalY - 20,
    size: 10,
    font: boldFont,
    color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
  });

  page.drawText(formatCurrency(finalTotal), {
    x: 480,
    y: totalY - 20,
    size: 10,
    font: boldFont,
    color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
  });

  // Enhanced footer with payment terms and notes - positioned higher to avoid cutoff
  const footerY = 120;
  
  page.drawRectangle({
    x: 50,
    y: footerY - 5,
    width: 30,
    height: 2,
    color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
  });
  
  // Payment terms (if enabled)
  if (invoice.paymentTerms?.enabled && invoice.paymentTerms?.terms) {
    page.drawText('Payment Terms:', {
      x: 50,
      y: footerY - 25,
      size: 8,
      font: boldFont,
      color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
    });
    
    page.drawText(invoice.paymentTerms.terms, {
      x: 50,
      y: footerY - 40,
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