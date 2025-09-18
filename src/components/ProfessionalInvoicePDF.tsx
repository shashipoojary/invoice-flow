import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import QRCode from 'qrcode';

// Create professional, modern styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    paddingTop: 50, // Reduced padding for corner tag
    paddingBottom: 80, // Extra bottom padding for thank you message
    fontSize: 10, // Slightly smaller font
    lineHeight: 1.3, // Tighter line height
    color: '#1a1a1a',
    fontFamily: 'Helvetica',
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 5, // Reduced margin to bring invoice details closer
    marginTop: -30, // Move logo higher up
  },
  logoSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  logo: {
    width: 100,
    height: 120,
  },
  businessNameText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    paddingTop: 40,
  },
  invoiceTag: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#fbbf24', // Yellow tag
    paddingTop: 20,
    paddingBottom: 20,
    paddingLeft: 30,
    paddingRight: 30,
    borderBottomLeftRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  invoiceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  invoiceDetails: {
    marginBottom: 12,
    marginTop: -15, // Move invoice details even closer to logo
  },
  invoiceNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 5,
  },
  invoiceDate: {
    fontSize: 11,
    color: '#666666',
  },
  addressSection: {
    marginBottom: 12,
    marginTop: 15, // Added space to move section down
    flexDirection: 'row',
    gap: 40,
  },
  addressColumn: {
    flex: 1,
  },
  sectionTitleWithLine: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    paddingBottom: 5,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  clientName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 5,
  },
  clientDetails: {
    fontSize: 10,
    color: '#666666',
    lineHeight: 1.4,
  },
  itemsTable: {
    marginBottom: 12,
    marginTop: 15, // Added more space to move description section down
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e3a8a', // Dark blue header
    padding: 8,
    marginBottom: 0,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  tableCell: {
    fontSize: 10,
    color: '#1a1a1a',
  },
  tableCellBold: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff', // White text for dark blue header
  },
  descriptionCol: {
    flex: 3,
  },
  priceCol: {
    flex: 1,
    textAlign: 'right',
  },
  totalsSection: {
    marginTop: 8,
    marginBottom: 8,
    alignItems: 'flex-end',
  },
  totalsContainer: {
    width: 250, // Extended width for longer line
    padding: 0,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 0,
  },
  totalLabel: {
    fontSize: 10,
    color: '#666666',
  },
  totalValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderTopWidth: 2,
    borderTopColor: '#1a1a1a',
    marginTop: 10,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  termsSection: {
    marginTop: 20,
    marginBottom: 20,
    padding: 20,
  },
  termsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  termsContent: {
    paddingLeft: 0,
  },
  termsText: {
    fontSize: 10,
    color: '#666666',
    lineHeight: 1.4,
    marginBottom: 4,
  },
  notesSection: {
    marginTop: 15,
    marginBottom: 15,
    padding: 15,
  },
  notesTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  notesText: {
    fontSize: 9,
    color: '#666666',
    lineHeight: 1.4,
  },
  footer: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  paymentCorner: {
    position: 'absolute',
    bottom: 30, // Moved to bottom of first page
    left: 30, // Left end corner
    width: 150,
    backgroundColor: '#f8f9fa',
    border: '1px solid #e5e5e5',
    borderRadius: 8,
    padding: 12,
  },
  cornerPaymentTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  cornerQrCode: {
    width: 100,
    height: 100,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    alignSelf: 'center',
    marginBottom: 8,
  },
  cornerDueDate: {
    fontSize: 8,
    color: '#666666',
    textAlign: 'center',
  },
  footerText: {
    fontSize: 9,
    color: '#666666',
    lineHeight: 1.4,
  },
  paymentInfo: {
    marginBottom: 10,
  },
  paymentTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  qrCodeSection: {
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  qrCode: {
    width: 80,
    height: 80,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  thankYouSection: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thankYouText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    lineHeight: 1.4,
    marginBottom: 3,
  },
  thankYouSubtext: {
    fontSize: 9,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 1.4,
  },
  // New styles for second page sections - matching first page design
  sectionTitleSecond: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  paymentInfoSection: {
    marginTop: 15,
    marginBottom: 15,
    padding: 15,
  },
  paymentMethodsList: {
    paddingLeft: 10,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  paymentMethodLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1a1a1a',
    width: 80,
    textTransform: 'uppercase',
  },
  paymentMethodValue: {
    fontSize: 9,
    color: '#666666',
    lineHeight: 1.3,
    flex: 1,
  },
  termsSectionSecond: {
    marginBottom: 15,
    padding: 15,
  },
  termsContentSecond: {
    paddingLeft: 5,
  },
  termsTextSecond: {
    fontSize: 9,
    color: '#666666',
    lineHeight: 1.4,
    marginBottom: 3,
  },
  statusBadge: {
    backgroundColor: '#f8f9fa',
    color: '#1a1a1a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  statusBadgePaid: {
    backgroundColor: '#1a1a1a',
  },
  statusBadgeSent: {
    backgroundColor: '#1a1a1a',
  },
  statusBadgeOverdue: {
    backgroundColor: '#1a1a1a',
  },
  statusBadgeDraft: {
    backgroundColor: '#1a1a1a',
  },
});

interface InvoiceItem {
  id: string;
  description: string;
  rate: number;
  amount: number;
}

interface Client {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  address?: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  client: Client;
  items: InvoiceItem[];
  subtotal: number;
  discount?: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  dueDate: string;
  createdAt: string;
  notes?: string;
}

interface BusinessSettings {
  businessName?: string;
  businessEmail?: string;
  businessPhone?: string;
  businessAddress?: string;
  logo?: string;
  paypalEmail?: string;
  cashappId?: string;
  venmoId?: string;
  googlePayUpi?: string;
  applePayId?: string;
  bankAccount?: string;
  bankIfscSwift?: string;
  bankIban?: string;
  stripeAccount?: string;
  paymentNotes?: string;
}

interface ProfessionalInvoicePDFProps {
  invoice: Invoice;
  businessSettings?: BusinessSettings;
  qrCodeDataURL?: string;
}

const ProfessionalInvoicePDF: React.FC<ProfessionalInvoicePDFProps> = ({ 
  invoice, 
  businessSettings,
  qrCodeDataURL 
}) => {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Generate QR code data based on user's payment methods and invoice
const generateQRCodeData = (invoice: Invoice, businessSettings?: BusinessSettings) => {
  const paymentMethods = [];
  
  // Add available payment methods
  if (businessSettings?.googlePayUpi) {
    paymentMethods.push(`UPI: ${businessSettings.googlePayUpi}`);
  }
  if (businessSettings?.paypalEmail) {
    paymentMethods.push(`PayPal: ${businessSettings.paypalEmail}`);
  }
  if (businessSettings?.venmoId) {
    paymentMethods.push(`Venmo: ${businessSettings.venmoId}`);
  }
  if (businessSettings?.cashappId) {
    paymentMethods.push(`CashApp: ${businessSettings.cashappId}`);
  }
  if (businessSettings?.applePayId) {
    paymentMethods.push(`Apple Pay: ${businessSettings.applePayId}`);
  }
  if (businessSettings?.bankAccount) {
    paymentMethods.push(`Bank: ${businessSettings.bankAccount}`);
  }
  
  // Create QR code data
  const qrData = {
    invoice: {
      number: invoice.invoiceNumber,
      amount: invoice.total,
      dueDate: invoice.dueDate,
      business: businessSettings?.businessName || 'Your Business'
    },
    paymentMethods: paymentMethods,
    contact: {
      email: businessSettings?.businessEmail,
      phone: businessSettings?.businessPhone
    }
  };
  
  return JSON.stringify(qrData);
};

// Generate QR code as data URL
const generateQRCodeDataURL = async (invoice: Invoice, businessSettings?: BusinessSettings): Promise<string> => {
  try {
    const qrData = generateQRCodeData(invoice, businessSettings);
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      width: 80,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    // Return a fallback data URL for a simple QR code
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRkZGRkZGIi8+Cjx0ZXh0IHg9IjQwIiB5PSI0MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjgiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5RUiBDT0RFPC90ZXh0Pgo8L3N2Zz4K';
  }
};

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        {/* Corner Invoice Tag */}
        <View style={styles.invoiceTag}>
          <Text style={styles.invoiceTitle}>Invoice</Text>
        </View>

        {/* Header with Logo */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            {businessSettings?.logo ? (
              <Image style={styles.logo} src={businessSettings.logo} />
            ) : (
              <View style={styles.logo}>
                <Text style={styles.businessNameText}>
                  {businessSettings?.businessName || 'Your Business'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Invoice Details */}
        <View style={styles.invoiceDetails}>
          <Text style={styles.invoiceNumber}>Invoice Number: #{invoice.invoiceNumber}</Text>
          <Text style={styles.invoiceDate}>Date: {formatDate(invoice.createdAt)}</Text>
          <Text style={styles.invoiceDate}>Due Date: {formatDate(invoice.dueDate)}</Text>
        </View>

        {/* Bill From and Bill To Section */}
        <View style={styles.addressSection}>
          <View style={styles.addressColumn}>
            <Text style={styles.sectionTitleWithLine}>BILL FROM</Text>
            <Text style={styles.clientName}>{businessSettings?.businessName || 'Your Business Name'}</Text>
            <View style={styles.clientDetails}>
              {businessSettings?.businessAddress && <Text>{businessSettings.businessAddress}</Text>}
              {businessSettings?.businessPhone && <Text>{businessSettings.businessPhone}</Text>}
              {businessSettings?.businessEmail && <Text>{businessSettings.businessEmail}</Text>}
            </View>
          </View>
          
          <View style={styles.addressColumn}>
            <Text style={styles.sectionTitleWithLine}>BILL TO</Text>
            <Text style={styles.clientName}>{invoice.client.name}</Text>
            <View style={styles.clientDetails}>
              {invoice.client.address && <Text>{invoice.client.address}</Text>}
              <Text>{invoice.client.email}</Text>
              {invoice.client.phone && <Text>{invoice.client.phone}</Text>}
            </View>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.itemsTable}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCellBold, styles.descriptionCol]}>DESCRIPTION</Text>
            <Text style={[styles.tableCellBold, styles.priceCol]}>AMOUNT</Text>
          </View>
          
          {invoice.items?.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.descriptionCol]}>{item.description || 'Service'}</Text>
              <Text style={[styles.tableCell, styles.priceCol]}>{formatCurrency(item.amount || 0)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsContainer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal || 0)}</Text>
            </View>
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount:</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.discount || 0)}</Text>
            </View>
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Tax ({((invoice.taxRate || 0) * 100).toFixed(1)}%):
              </Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.taxAmount || 0)}</Text>
            </View>
            
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total:</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(invoice.total || 0)}</Text>
            </View>
          </View>
        </View>

        {/* Payment Method Corner - First Page */}
        <View style={styles.paymentCorner}>
          <Text style={styles.cornerPaymentTitle}>PAYMENT METHOD</Text>
          
          {/* QR Code for Payment */}
          {qrCodeDataURL ? (
            <Image style={styles.cornerQrCode} src={qrCodeDataURL} />
          ) : (
            <View style={styles.cornerQrCode}>
              <Text style={{ fontSize: 6, textAlign: 'center', marginTop: 20, color: '#999' }}>
                QR CODE
              </Text>
            </View>
          )}
          
          <Text style={styles.cornerDueDate}>Due: {formatDate(invoice.dueDate)}</Text>
        </View>
      </Page>

      {/* Second Page - Payment Info and Terms */}
      <Page size="A4" style={styles.page}>
        {/* Payment Information Section */}
        <View style={styles.paymentInfoSection}>
          <Text style={styles.sectionTitleSecond}>PAYMENT METHODS</Text>
          <View style={styles.paymentMethodsList}>
            {businessSettings?.paypalEmail && (
              <View style={styles.paymentMethodRow}>
                <Text style={styles.paymentMethodLabel}>PayPal:</Text>
                <Text style={styles.paymentMethodValue}>{businessSettings.paypalEmail}</Text>
              </View>
            )}
            {businessSettings?.cashappId && (
              <View style={styles.paymentMethodRow}>
                <Text style={styles.paymentMethodLabel}>Cash App:</Text>
                <Text style={styles.paymentMethodValue}>${businessSettings.cashappId}</Text>
              </View>
            )}
            {businessSettings?.venmoId && (
              <View style={styles.paymentMethodRow}>
                <Text style={styles.paymentMethodLabel}>Venmo:</Text>
                <Text style={styles.paymentMethodValue}>@{businessSettings.venmoId}</Text>
              </View>
            )}
            {businessSettings?.googlePayUpi && (
              <View style={styles.paymentMethodRow}>
                <Text style={styles.paymentMethodLabel}>Google Pay/UPI:</Text>
                <Text style={styles.paymentMethodValue}>{businessSettings.googlePayUpi}</Text>
              </View>
            )}
            {businessSettings?.applePayId && (
              <View style={styles.paymentMethodRow}>
                <Text style={styles.paymentMethodLabel}>Apple Pay:</Text>
                <Text style={styles.paymentMethodValue}>{businessSettings.applePayId}</Text>
              </View>
            )}
            {businessSettings?.bankAccount && (
              <View style={styles.paymentMethodRow}>
                <Text style={styles.paymentMethodLabel}>Bank Transfer:</Text>
                <Text style={styles.paymentMethodValue}>{businessSettings.bankAccount}</Text>
              </View>
            )}
            {businessSettings?.bankIfscSwift && (
              <View style={styles.paymentMethodRow}>
                <Text style={styles.paymentMethodLabel}>IFSC/SWIFT:</Text>
                <Text style={styles.paymentMethodValue}>{businessSettings.bankIfscSwift}</Text>
              </View>
            )}
            {businessSettings?.bankIban && (
              <View style={styles.paymentMethodRow}>
                <Text style={styles.paymentMethodLabel}>IBAN:</Text>
                <Text style={styles.paymentMethodValue}>{businessSettings.bankIban}</Text>
              </View>
            )}
            {businessSettings?.stripeAccount && (
              <View style={styles.paymentMethodRow}>
                <Text style={styles.paymentMethodLabel}>Stripe:</Text>
                <Text style={styles.paymentMethodValue}>{businessSettings.stripeAccount}</Text>
              </View>
            )}
            {businessSettings?.paymentNotes && (
              <View style={styles.paymentMethodRow}>
                <Text style={styles.paymentMethodLabel}>Notes:</Text>
                <Text style={styles.paymentMethodValue}>{businessSettings.paymentNotes}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Terms and Conditions */}
        <View style={styles.termsSectionSecond}>
          <Text style={styles.sectionTitleSecond}>TERMS & CONDITIONS</Text>
          <View style={styles.termsContentSecond}>
            <Text style={styles.termsTextSecond}>• Payment is due within 30 days of invoice date</Text>
            <Text style={styles.termsTextSecond}>• Late payments may incur a 1.5% monthly service charge</Text>
            <Text style={styles.termsTextSecond}>• All work is performed according to agreed specifications</Text>
            <Text style={styles.termsTextSecond}>• Client retains ownership of all provided materials</Text>
            <Text style={styles.termsTextSecond}>• Disputes must be raised within 7 days of invoice receipt</Text>
          </View>
        </View>

        {/* Notes Section */}
        {invoice.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionTitleSecond}>ADDITIONAL NOTES</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Thank You Message */}
        <View style={styles.thankYouSection}>
          <Text style={styles.thankYouText}>Thank you for your business!</Text>
          <Text style={styles.thankYouSubtext}>We appreciate your prompt payment and look forward to working with you again.</Text>
        </View>
      </Page>
    </Document>
  );
};

export default ProfessionalInvoicePDF;
