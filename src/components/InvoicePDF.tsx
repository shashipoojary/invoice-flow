import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Register fonts for better typography
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2' },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiJ-Ek-_EeA.woff2', fontWeight: 'bold' }
  ]
});

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Inter',
    fontSize: 10,
    lineHeight: 1.4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 40,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
  },
  logo: {
    width: 80,
    height: 80,
    objectFit: 'contain',
  },
  businessInfo: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  businessDetails: {
    fontSize: 9,
    color: '#6B7280',
    textAlign: 'right',
    lineHeight: 1.3,
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  clientSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  clientInfo: {
    flexDirection: 'column',
    width: '45%',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clientDetails: {
    fontSize: 10,
    color: '#6B7280',
    lineHeight: 1.4,
  },
  invoiceDetails: {
    flexDirection: 'column',
    width: '45%',
    alignItems: 'flex-end',
  },
  invoiceInfo: {
    fontSize: 10,
    color: '#6B7280',
    lineHeight: 1.4,
    textAlign: 'right',
  },
  itemsTable: {
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableRowText: {
    fontSize: 9,
    color: '#6B7280',
  },
  descriptionCol: {
    width: '50%',
  },
  rateCol: {
    width: '20%',
    textAlign: 'right',
  },
  amountCol: {
    width: '30%',
    textAlign: 'right',
  },
  totalsSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  totalsContainer: {
    width: '40%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  totalLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  totalValue: {
    fontSize: 10,
    color: '#374151',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  paymentSection: {
    marginTop: 40,
    padding: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  paymentTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  paymentMethod: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#374151',
    width: '30%',
  },
  paymentValue: {
    fontSize: 9,
    color: '#6B7280',
    width: '70%',
  },
  notesSection: {
    marginTop: 30,
    padding: 20,
    backgroundColor: '#FEFEFE',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 9,
    color: '#6B7280',
    lineHeight: 1.4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#9CA3AF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 15,
  },
});

interface InvoicePDFProps {
  invoice: {
    id: string;
    invoiceNumber: string;
    client: {
      name: string;
      email: string;
      company?: string;
      address?: string;
    };
    items: Array<{
      description: string;
      rate: number;
      amount: number;
    }>;
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    status: string;
    dueDate: string;
    createdAt: string;
    notes?: string;
  };
  businessInfo: {
    businessName: string;
    logo?: string;
    address: string;
    email: string;
    paypalEmail?: string;
    venmoId?: string;
    googlePayUpi?: string;
    bankAccount?: string;
    bankIfscSwift?: string;
    bankIban?: string;
    paymentNotes?: string;
  };
}

const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoice, businessInfo }) => {
  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            {businessInfo.logo && (
              <Image style={styles.logo} src={businessInfo.logo} alt="Business Logo" />
            )}
          </View>
          <View style={styles.businessInfo}>
            <Text style={styles.businessName}>{businessInfo.businessName}</Text>
            <Text style={styles.businessDetails}>
              {businessInfo.address}
              {'\n'}
              {businessInfo.email}
            </Text>
          </View>
        </View>

        {/* Invoice Title */}
        <Text style={styles.invoiceTitle}>INVOICE</Text>

        {/* Client and Invoice Details */}
        <View style={styles.clientSection}>
          <View style={styles.clientInfo}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            <Text style={styles.clientDetails}>
              {invoice.client.name}
              {invoice.client.company && `\n${invoice.client.company}`}
              {invoice.client.address && `\n${invoice.client.address}`}
              {`\n${invoice.client.email}`}
            </Text>
          </View>
          <View style={styles.invoiceDetails}>
            <Text style={styles.sectionTitle}>Invoice Details</Text>
            <Text style={styles.invoiceInfo}>
              Invoice #: {invoice.invoiceNumber}
              {'\n'}
              Date: {formatDate(invoice.createdAt)}
              {'\n'}
              Due Date: {formatDate(invoice.dueDate)}
              {'\n'}
              Status: {invoice.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.itemsTable}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.descriptionCol]}>Description</Text>
            <Text style={[styles.tableHeaderText, styles.rateCol]}>Rate</Text>
            <Text style={[styles.tableHeaderText, styles.amountCol]}>Amount</Text>
          </View>
          {invoice.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableRowText, styles.descriptionCol]}>{item.description}</Text>
              <Text style={[styles.tableRowText, styles.rateCol]}>{formatCurrency(item.rate)}</Text>
              <Text style={[styles.tableRowText, styles.amountCol]}>{formatCurrency(item.amount)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsContainer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax ({(invoice.taxRate * 100).toFixed(1)}%):</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.taxAmount)}</Text>
            </View>
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total:</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(invoice.total)}</Text>
            </View>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.paymentSection}>
          <Text style={styles.paymentTitle}>Payment Methods</Text>
          {businessInfo.paypalEmail && (
            <View style={styles.paymentMethod}>
              <Text style={styles.paymentLabel}>PayPal:</Text>
              <Text style={styles.paymentValue}>{businessInfo.paypalEmail}</Text>
            </View>
          )}
          {businessInfo.venmoId && (
            <View style={styles.paymentMethod}>
              <Text style={styles.paymentLabel}>Venmo:</Text>
              <Text style={styles.paymentValue}>{businessInfo.venmoId}</Text>
            </View>
          )}
          {businessInfo.googlePayUpi && (
            <View style={styles.paymentMethod}>
              <Text style={styles.paymentLabel}>Google Pay/UPI:</Text>
              <Text style={styles.paymentValue}>{businessInfo.googlePayUpi}</Text>
            </View>
          )}
          {businessInfo.bankAccount && (
            <View style={styles.paymentMethod}>
              <Text style={styles.paymentLabel}>Bank Transfer:</Text>
              <Text style={styles.paymentValue}>
                {businessInfo.bankAccount}
                {businessInfo.bankIfscSwift && `\nIFSC/SWIFT: ${businessInfo.bankIfscSwift}`}
                {businessInfo.bankIban && `\nIBAN: ${businessInfo.bankIban}`}
              </Text>
            </View>
          )}
          {businessInfo.paymentNotes && (
            <View style={styles.paymentMethod}>
              <Text style={styles.paymentLabel}>Other:</Text>
              <Text style={styles.paymentValue}>{businessInfo.paymentNotes}</Text>
            </View>
          )}
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Notes</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Thank you for your business! Please make payment by the due date.
        </Text>
      </Page>
    </Document>
  );
};

export default InvoicePDF;
