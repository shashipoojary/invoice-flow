import React from 'react';
import { pdf } from '@react-pdf/renderer';
import ProfessionalInvoicePDF from '@/components/ProfessionalInvoicePDF';
import QRCode from 'qrcode';
import { Invoice, BusinessSettings } from '@/types';

// Generate QR code data based on user's payment methods and invoice
const generateQRCodeData = (invoice: Invoice, businessSettings?: BusinessSettings) => {
  // Debug: Log payment method data
  console.log('QR Code Generation - Payment Methods Debug:', {
    googlePayUpi: businessSettings?.googlePayUpi,
    paypalEmail: businessSettings?.paypalEmail,
    venmoId: businessSettings?.venmoId,
    cashappId: businessSettings?.cashappId,
    applePayId: businessSettings?.applePayId,
    bankAccount: businessSettings?.bankAccount
  });
  
  // Create a very simple format for better scanning
  const paymentMethods = [];
  
  if (businessSettings?.googlePayUpi && businessSettings.googlePayUpi.trim()) {
    paymentMethods.push(`UPI: ${businessSettings.googlePayUpi}`);
  }
  if (businessSettings?.paypalEmail && businessSettings.paypalEmail.trim()) {
    paymentMethods.push(`PayPal: ${businessSettings.paypalEmail}`);
  }
  if (businessSettings?.venmoId && businessSettings.venmoId.trim()) {
    paymentMethods.push(`Venmo: ${businessSettings.venmoId}`);
  }
  if (businessSettings?.cashappId && businessSettings.cashappId.trim()) {
    paymentMethods.push(`CashApp: ${businessSettings.cashappId}`);
  }
  if (businessSettings?.applePayId && businessSettings.applePayId.trim()) {
    paymentMethods.push(`Apple Pay: ${businessSettings.applePayId}`);
  }
  if (businessSettings?.bankAccount && businessSettings.bankAccount.trim()) {
    paymentMethods.push(`Bank: ${businessSettings.bankAccount}`);
  }
  
  // Ultra simple format for maximum scannability
  const simpleData = [
    `Invoice: ${invoice.invoiceNumber}`,
    `Amount: $${(invoice.total || 0).toFixed(2)}`,
    `Business: ${businessSettings?.businessName || 'Your Business'}`,
    '',
    ...paymentMethods.slice(0, 3) // Top 3 payment methods for better scanning
  ].join('\n');
  
  return simpleData;
};

// Generate QR code as data URL
const generateQRCodeDataURL = async (invoice: Invoice, businessSettings?: BusinessSettings): Promise<string> => {
  const qrData = generateQRCodeData(invoice, businessSettings);
  
  try {
    console.log('QR Code Data to be encoded:', qrData);
    
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      width: 120, // Increased size for better scanning
      margin: 2, // Increased margin for better scanning
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M', // Medium error correction for better scanning
      type: 'image/png'
    });
    
    console.log('QR Code generated successfully, data URL length:', qrCodeDataURL.length);
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    console.error('QR Data that failed:', qrData);
    // Return a fallback data URL for a simple QR code
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRkZGRkZGIi8+Cjx0ZXh0IHg9IjQwIiB5PSI0MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjgiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5RUiBDT0RFPC90ZXh0Pgo8L3N2Zz4K';
  }
};


export const generateProfessionalPDF = async (
  invoice: Invoice,
  businessSettings?: BusinessSettings
): Promise<Blob> => {
  try {
    // Debug: Log business settings
    console.log('PDF Generation - Business Settings:', businessSettings);
    console.log('PDF Generation - Invoice:', invoice);
    
    // Validate and sanitize invoice data
    const sanitizedInvoice: Invoice = {
      id: invoice.id || 'unknown',
      invoiceNumber: invoice.invoiceNumber || 'INV-001',
      clientId: invoice.clientId || 'unknown',
      client: {
        id: invoice.client?.id || 'unknown',
        name: invoice.client?.name || 'Unknown Client',
        email: invoice.client?.email || 'no-email@example.com',
        company: invoice.client?.company || '',
        phone: invoice.client?.phone || '',
        address: invoice.client?.address || '',
        createdAt: invoice.client?.createdAt || new Date().toISOString()
      },
      items: Array.isArray(invoice.items) ? invoice.items.map(item => ({
        id: item.id || 'item-1',
        description: item.description || 'Service',
        rate: typeof item.rate === 'number' ? item.rate : 0,
        amount: typeof item.amount === 'number' ? item.amount : 0
      })) : [{ id: 'item-1', description: 'Service', rate: 0, amount: 0 }],
      subtotal: typeof invoice.subtotal === 'number' ? invoice.subtotal : 0,
      discount: typeof invoice.discount === 'number' ? invoice.discount : 0,
      taxRate: typeof invoice.taxRate === 'number' ? invoice.taxRate : 0,
      taxAmount: typeof invoice.taxAmount === 'number' ? invoice.taxAmount : 0,
      total: typeof invoice.total === 'number' ? invoice.total : 0,
      status: invoice.status || 'draft',
      dueDate: invoice.dueDate || new Date().toISOString().split('T')[0],
      createdAt: invoice.createdAt || new Date().toISOString().split('T')[0],
      notes: invoice.notes || '',
      clientName: invoice.clientName || invoice.client?.name || 'Unknown Client',
      clientEmail: invoice.clientEmail || invoice.client?.email || 'no-email@example.com',
      clientCompany: invoice.clientCompany || invoice.client?.company || '',
      clientAddress: invoice.clientAddress || invoice.client?.address || ''
    };

    // Validate and sanitize business settings
    const sanitizedBusinessSettings: BusinessSettings = {
      businessName: businessSettings?.businessName || 'Your Business Name',
      businessEmail: businessSettings?.businessEmail || 'your-email@example.com',
      businessPhone: businessSettings?.businessPhone || '',
      address: businessSettings?.address || '',
      logo: businessSettings?.logo || '',
      paypalEmail: businessSettings?.paypalEmail || '',
      cashappId: businessSettings?.cashappId || '',
      venmoId: businessSettings?.venmoId || '',
      googlePayUpi: businessSettings?.googlePayUpi || '',
      applePayId: businessSettings?.applePayId || '',
      bankAccount: businessSettings?.bankAccount || '',
      bankIfscSwift: businessSettings?.bankIfscSwift || '',
      bankIban: businessSettings?.bankIban || '',
      stripeAccount: businessSettings?.stripeAccount || '',
      paymentNotes: businessSettings?.paymentNotes || ''
    };

    // Generate QR code data URL
    const qrCodeDataURL = await generateQRCodeDataURL(sanitizedInvoice, sanitizedBusinessSettings);
    
    // Create the PDF document
    const doc = <ProfessionalInvoicePDF invoice={sanitizedInvoice} businessSettings={sanitizedBusinessSettings} qrCodeDataURL={qrCodeDataURL} />;
    
    // Generate the PDF blob
    const blob = await pdf(doc).toBlob();
    
    return blob;
  } catch (error) {
    console.error('Error generating PDF:', error);
    console.error('Invoice data:', invoice);
    console.error('Business settings:', businessSettings);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const downloadPDF = async (
  invoice: Invoice,
  businessSettings?: BusinessSettings
): Promise<void> => {
  try {
    const blob = await generateProfessionalPDF(invoice, businessSettings);
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${invoice.invoiceNumber}.pdf`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw error;
  }
};

export const generatePDFBlob = async (invoice: Invoice, businessSettings?: BusinessSettings): Promise<Blob> => {
  try {
    console.log('PDF Generation - Business Settings:', businessSettings);
    console.log('PDF Generation - Invoice:', invoice);
    console.log('PDF Generation - Logo URL:', businessSettings?.logo);
    
    // Validate and sanitize data
    const sanitizedInvoice = {
      ...invoice,
      client: {
        id: invoice.client?.id || 'unknown',
        name: invoice.client?.name || 'Unknown Client',
        email: invoice.client?.email || 'No email',
        phone: invoice.client?.phone || '',
        company: invoice.client?.company || '',
        address: invoice.client?.address || ''
      },
      items: Array.isArray(invoice.items) ? invoice.items.map(item => ({
        id: item.id || Math.random().toString(),
        description: item.description || 'Service',
        rate: typeof item.rate === 'number' ? item.rate : 0,
        amount: typeof item.amount === 'number' ? item.amount : 0
      })) : [{ id: '1', description: 'Service', rate: 0, amount: 0 }],
      subtotal: typeof invoice.subtotal === 'number' ? invoice.subtotal : 0,
      discount: typeof invoice.discount === 'number' ? invoice.discount : 0,
      taxRate: typeof invoice.taxRate === 'number' ? invoice.taxRate : 0,
      taxAmount: typeof invoice.taxAmount === 'number' ? invoice.taxAmount : 0,
      total: typeof invoice.total === 'number' ? invoice.total : 0,
      invoiceNumber: invoice.invoiceNumber || 'INV-001',
      status: invoice.status || 'draft',
      createdAt: invoice.createdAt || new Date().toISOString(),
      dueDate: invoice.dueDate || new Date().toISOString(),
      notes: invoice.notes || ''
    };

    // Generate QR code data URL
    const qrCodeDataURL = await generateQRCodeDataURL(sanitizedInvoice as Invoice, businessSettings);
    
    const doc = <ProfessionalInvoicePDF invoice={sanitizedInvoice} businessSettings={businessSettings} qrCodeDataURL={qrCodeDataURL} />;
    const blob = await pdf(doc).toBlob();
    return blob;
  } catch (error) {
    console.error('Error generating PDF blob:', error);
    throw new Error('Failed to generate PDF blob');
  }
};

export const viewPDF = async (
  invoice: Invoice,
  businessSettings?: BusinessSettings
): Promise<void> => {
  try {
    const blob = await generateProfessionalPDF(invoice, businessSettings);
    
    // Create URL for viewing
    const url = window.URL.createObjectURL(blob);
    
    // Open PDF in new tab for viewing
    window.open(url, '_blank');
    
    // Cleanup after a delay to allow the PDF to load
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 1000);
  } catch (error) {
    console.error('Error viewing PDF:', error);
    
    // Fallback: Create a simple HTML invoice and open it
    try {
      const fallbackHTML = createFallbackInvoiceHTML(invoice, businessSettings);
      const blob = new Blob([fallbackHTML], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (fallbackError) {
      console.error('Fallback PDF generation also failed:', fallbackError);
      throw error;
    }
  }
};

const createFallbackInvoiceHTML = (invoice: Invoice, businessSettings?: BusinessSettings): string => {
  // Debug: Log business settings for HTML fallback
  console.log('HTML Fallback - Business Settings:', businessSettings);
  
  const businessName = businessSettings?.businessName || 'Your Business Name';
  const businessEmail = businessSettings?.businessEmail || 'your-email@example.com';
  const businessPhone = businessSettings?.businessPhone || '';
  const businessAddress = businessSettings?.address || '';
  
  console.log('HTML Fallback - Processed Business Info:', { businessName, businessEmail, businessPhone, businessAddress });
  
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice ${invoice.invoiceNumber || 'INV-001'}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
         body { 
           font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
           margin: 0; 
           padding: 50px; 
           line-height: 1.5; 
           color: #1a1a1a;
           background: #ffffff;
           font-size: 10px;
         }
        .container { max-width: 800px; margin: 0 auto; }
        .header { 
          display: flex; 
          justify-content: space-between; 
          align-items: flex-start; 
          margin-bottom: 30px; 
          padding-bottom: 20px; 
          border-bottom: 1px solid #e5e5e5; 
        }
        .business-info { flex: 1; }
        .business-name { 
          font-size: 18px; 
          font-weight: bold; 
          color: #1a1a1a; 
          margin-bottom: 8px; 
        }
        .business-details { 
          font-size: 11px; 
          color: #666666; 
          line-height: 1.4; 
        }
        .invoice-info { text-align: right; }
        .invoice-title { 
          font-size: 32px; 
          font-weight: bold; 
          color: #1a1a1a; 
          margin-bottom: 15px; 
          letter-spacing: -1px;
        }
        .invoice-number { 
          font-size: 14px; 
          font-weight: bold; 
          color: #1a1a1a; 
          margin-bottom: 10px; 
        }
        .invoice-details { 
          font-size: 10px; 
          color: #666666; 
          line-height: 1.6; 
        }
        .status-badge { 
          background: #f8f9fa; 
          color: #1a1a1a; 
          padding: 4px 8px; 
          font-size: 8px; 
          font-weight: bold; 
          text-transform: uppercase; 
          letter-spacing: 0.5px; 
          display: inline-block; 
          margin-top: 6px;
          border: 1px solid #e5e5e5;
        }
        .client-section { 
          margin-bottom: 30px; 
          margin-top: 20px; 
        }
        .section-title { 
          font-size: 11px; 
          font-weight: bold; 
          color: #1a1a1a; 
          margin-bottom: 10px; 
          text-transform: uppercase; 
          letter-spacing: 1px; 
        }
        .client-info { 
          padding: 15px; 
          margin-top: 8px;
        }
        .client-name { 
          font-size: 13px; 
          font-weight: bold; 
          color: #1a1a1a; 
          margin-bottom: 8px; 
        }
        .client-details { 
          font-size: 10px; 
          color: #666666; 
          line-height: 1.5; 
        }
        .items-table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-bottom: 30px; 
          margin-top: 20px;
          border-radius: 4px;
          overflow: hidden;
        }
        .items-table th { 
          background: #f8f9fa; 
          color: #1a1a1a; 
          padding: 15px; 
          text-align: left; 
          font-size: 10px; 
          font-weight: bold; 
          border-bottom: 1px solid #e5e5e5;
        }
        .items-table td { 
          padding: 15px; 
          border-bottom: 1px solid #f0f0f0; 
          font-size: 10px; 
          color: #1a1a1a; 
        }
        .items-table .amount { text-align: right; }
        .totals { 
          text-align: right; 
          margin-top: 20px; 
          margin-bottom: 20px;
        }
        .total-amount-bar {
          background: #2563eb;
          padding: 20px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .total-amount-label {
          font-size: 14px;
          font-weight: bold;
          color: #ffffff;
          text-transform: uppercase;
        }
        .total-amount-value {
          font-size: 18px;
          font-weight: bold;
          color: #ffffff;
        }
        .totals-container { 
          width: 100%; 
          padding: 0;
        }
        .total-row { 
          display: flex; 
          justify-content: space-between; 
          padding: 6px 0; 
        }
        .total-label { 
          font-size: 10px; 
          color: #666666; 
        }
        .total-value { 
          font-size: 10px; 
          font-weight: bold; 
          color: #1a1a1a; 
        }
        .grand-total { 
          display: flex; 
          justify-content: space-between; 
          padding: 12px 0; 
          border-top: 2px solid #1a1a1a; 
          margin-top: 10px; 
        }
        .grand-total-label { 
          font-size: 12px; 
          font-weight: bold; 
          color: #1a1a1a; 
        }
        .grand-total-value { 
          font-size: 12px; 
          font-weight: bold; 
          color: #1a1a1a; 
        }
        .terms-section {
          margin-top: 20px;
          margin-bottom: 20px;
          padding: 20px;
        }
        .terms-title {
          font-size: 12px;
          font-weight: bold;
          color: #1a1a1a;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .terms-content {
          padding-left: 0;
        }
        .terms-text {
          font-size: 10px;
          color: #666666;
          line-height: 1.4;
          margin-bottom: 4px;
        }
        .notes { 
          margin-top: 20px; 
          margin-bottom: 20px;
          padding: 20px; 
        }
        .notes-title { 
          font-size: 11px; 
          font-weight: bold; 
          color: #1a1a1a; 
          margin-bottom: 10px; 
          text-transform: uppercase; 
          letter-spacing: 1px; 
        }
        .notes-text { 
          font-size: 10px; 
          color: #666666; 
          line-height: 1.5; 
        }
        .footer { 
          margin-top: 40px; 
          padding-top: 20px; 
          border-top: 1px solid #e5e5e5; 
          text-align: center; 
        }
        .footer-text { 
          font-size: 9px; 
          color: #999999; 
          line-height: 1.5; 
        }
        @media print {
          body { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="business-info">
            <div class="business-name">${businessName}</div>
            <div class="business-details">
              ${businessAddress ? `<div>${businessAddress}</div>` : ''}
              ${businessPhone ? `<div>Phone: ${businessPhone}</div>` : ''}
              ${businessEmail ? `<div>Email: ${businessEmail}</div>` : ''}
            </div>
          </div>
          
          <div class="invoice-info">
            <div class="invoice-title">INVOICE</div>
            <div class="invoice-number">Invoice #: ${invoice.invoiceNumber || 'INV-001'}</div>
            <div class="invoice-details">
              <div>Date: ${invoice.createdAt || new Date().toLocaleDateString()}</div>
              <div>Due Date: ${invoice.dueDate || new Date().toLocaleDateString()}</div>
            </div>
          </div>
        </div>
        
        <div class="client-section">
          <div class="section-title">Bill To</div>
          <div class="client-info">
            <div class="client-name">${invoice.client?.name || 'Unknown Client'}</div>
            <div class="client-details">
              <div>Email: ${invoice.client?.email || 'No email'}</div>
              ${invoice.client?.phone ? `<div>Phone: ${invoice.client.phone}</div>` : ''}
              ${invoice.client?.address ? `<div>${invoice.client.address}</div>` : ''}
            </div>
          </div>
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th>Description</th>
              <th class="amount">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${Array.isArray(invoice.items) ? invoice.items.map(item => `
              <tr>
                <td>${item.description || 'Service'}</td>
                <td class="amount">${formatCurrency(item.amount || 0)}</td>
              </tr>
            `).join('') : '<tr><td>Service</td><td class="amount">$0.00</td></tr>'}
          </tbody>
        </table>
        
        <div class="totals">
          <div class="total-amount-bar">
            <span class="total-amount-label">Total Amount Due:</span>
            <span class="total-amount-value">${formatCurrency(invoice.total || 0)}</span>
          </div>
          
          <div class="totals-container">
            <div class="total-row">
              <span class="total-label">Subtotal:</span>
              <span class="total-value">${formatCurrency(invoice.subtotal || 0)}</span>
            </div>
            <div class="total-row">
              <span class="total-label">Tax (${((invoice.taxRate || 0) * 100).toFixed(1)}%):</span>
              <span class="total-value">${formatCurrency(invoice.taxAmount || 0)}</span>
            </div>
          </div>
        </div>
        
        <div class="terms-section">
          <div style="display: flex; gap: 30px;">
            <div style="flex: 1;">
              <div class="terms-title">Payment Terms</div>
              <div class="terms-content">
                <div class="terms-text">Payment Due: ${invoice.dueDate || new Date().toLocaleDateString()}</div>
                <div class="terms-text">Payment Terms: Due on Receipt</div>
                <div class="terms-text">Late Fee: 1.5% per month</div>
              </div>
            </div>
            <div style="flex: 1;">
              <div class="terms-title">Terms & Conditions</div>
              <div class="terms-content">
                <div class="terms-text">• All work to industry standards</div>
                <div class="terms-text">• Payment due within 30 days</div>
                <div class="terms-text">• Questions? Contact us at ${businessEmail || 'your-email@example.com'}</div>
              </div>
            </div>
          </div>
        </div>
        
        ${invoice.notes ? `
          <div class="notes">
            <div class="notes-title">Additional Notes</div>
            <div class="notes-text">${invoice.notes}</div>
          </div>
        ` : ''}
        
        <div class="footer">
          <div class="footer-text">
            Thank you for your business.<br>
            For any questions regarding this invoice, please contact us at ${businessEmail}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};