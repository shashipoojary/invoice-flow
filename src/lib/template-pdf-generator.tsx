import React from 'react';
import { pdf } from '@react-pdf/renderer';
import FastInvoiceTemplate from '@/components/invoice-templates/FastInvoiceTemplate';
import { generateDetailedPDF } from './detailed-pdf-generator';
import { Invoice, BusinessSettings } from '@/types';


export async function generateTemplatePDFBlob(
  invoice: Invoice, 
  businessSettings?: BusinessSettings,
  template: number = 1,
  primaryColor?: string,
  secondaryColor?: string
): Promise<Blob> {
  try {
    // Extract colors from invoice theme if not provided
    const invoiceTheme = invoice.theme as { template?: number; primary_color?: string; secondary_color?: string } | undefined;
    const finalPrimaryColor = primaryColor || invoiceTheme?.primary_color || '#5C2D91';
    const finalSecondaryColor = secondaryColor || invoiceTheme?.secondary_color || '#8B5CF6';
    
    // Create a sanitized invoice object to prevent serialization issues
    const sanitizedInvoice: Invoice = {
      ...invoice,
      items: invoice.items.map(item => ({
        ...item,
        amount: parseFloat(item.amount?.toString() || '0') || 0
      }))
    };

    // Use simple placeholder - no logo conversion needed
    const logoBase64 = '';
    console.log('Using simple placeholder approach - no logo conversion');

    // Create sanitized business settings - use provided settings or minimal defaults
    const sanitizedBusinessSettings: BusinessSettings = businessSettings ? {
      businessName: businessSettings.businessName || 'Your Business',
      businessEmail: businessSettings.businessEmail || 'business@example.com',
      businessPhone: businessSettings.businessPhone || '',
      address: businessSettings.address || '',
      logo: logoBase64, // Use base64 converted logo
      paypalEmail: businessSettings.paypalEmail || '',
      cashappId: businessSettings.cashappId || '',
      venmoId: businessSettings.venmoId || '',
      googlePayUpi: businessSettings.googlePayUpi || '',
      applePayId: businessSettings.applePayId || '',
      bankAccount: businessSettings.bankAccount || '',
      bankIfscSwift: businessSettings.bankIfscSwift || '',
      bankIban: businessSettings.bankIban || '',
      stripeAccount: businessSettings.stripeAccount || '',
      paymentNotes: businessSettings.paymentNotes || ''
    } : {
      businessName: 'Your Business',
      businessEmail: 'business@example.com',
      businessPhone: '',
      address: '',
      logo: '',
      paypalEmail: '',
      cashappId: '',
      venmoId: '',
      googlePayUpi: '',
      applePayId: '',
      bankAccount: '',
      bankIfscSwift: '',
      bankIban: '',
      stripeAccount: '',
      paymentNotes: ''
    };

    // Check if this is a fast invoice (from FastInvoiceModal)
    const isFastInvoice = sanitizedInvoice.type === 'fast';
    
    if (isFastInvoice && template === 1) {
      // Use React PDF for fast invoice (Template 1 only)
      const TemplateComponent = FastInvoiceTemplate;
      
      const pdfDoc = (
        <TemplateComponent
          invoice={sanitizedInvoice}
          businessSettings={sanitizedBusinessSettings}
        />
      );

      const blob = await pdf(pdfDoc).toBlob();
      return blob;
    } else {
      // Use pdf-lib for all detailed invoices (Templates 1, 2 & 3)
      const pdfBytes = await generateDetailedPDF(
        sanitizedInvoice,
        sanitizedBusinessSettings,
        template,
        finalPrimaryColor,
        finalSecondaryColor
      );
      
      // Convert Uint8Array to Blob
      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
      return blob;
    }
  } catch (error) {
    console.error('Error generating template PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}

// Legacy function for backward compatibility
export async function generatePDFBlob(
  invoice: Invoice, 
  businessSettings?: BusinessSettings
): Promise<Blob> {
  // Extract template and colors from invoice theme if available
  const invoiceTheme = invoice.theme as { template?: number; primary_color?: string; secondary_color?: string } | undefined;
  const template = invoiceTheme?.template || 1;
  const primaryColor = invoiceTheme?.primary_color || '#5C2D91';
  const secondaryColor = invoiceTheme?.secondary_color || '#8B5CF6';
  
  return generateTemplatePDFBlob(invoice, businessSettings, template, primaryColor, secondaryColor);
}
