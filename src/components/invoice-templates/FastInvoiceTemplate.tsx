import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { Invoice, BusinessSettings } from '@/types'

interface Template1Props {
  invoice: Invoice
  businessSettings: BusinessSettings
}

// Clean, modern styles for Fast Invoice
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 50,
    fontSize: 9,
    lineHeight: 1.5,
    color: '#1F2937',
    fontFamily: 'Helvetica',
  },
  // Modern header with refined styling
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 35,
    paddingBottom: 25,
    borderBottomWidth: 3,
    borderBottomColor: '#5C2D91',
  },
  invoiceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5C2D91',
    letterSpacing: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'right',
    marginBottom: 6,
  },
  // Refined business info
  businessInfo: {
    marginBottom: 25,
    alignItems: 'flex-end',
  },
  businessText: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 6,
    lineHeight: 1.6,
  },
  // Clean bill to section with better spacing
  billToSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 35,
  },
  billTo: {
    flex: 1,
    maxWidth: '45%',
  },
  billToTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  clientInfo: {
    fontSize: 10,
    color: '#374151',
    lineHeight: 1.8,
  },
  invoiceInfo: {
    alignItems: 'flex-end',
    maxWidth: 220,
  },
  invoiceRow: {
    flexDirection: 'row',
    marginBottom: 6,
    justifyContent: 'flex-end',
    width: '100%',
  },
  invoiceLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#111827',
    width: 80,
    textAlign: 'right',
    marginRight: 12,
  },
  invoiceValue: {
    fontSize: 10,
    color: '#374151',
    width: 100,
    textAlign: 'right',
  },
  // Modern table design
  table: {
    marginBottom: 35,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#5C2D91',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tableHeaderText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  tableCell: {
    fontSize: 9,
    color: '#374151',
    lineHeight: 1.6,
  },
  // Refined total section
  totalSection: {
    marginBottom: 35,
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
    width: '100%',
    paddingHorizontal: 16,
  },
  totalLabel: {
    fontSize: 9,
    color: '#6B7280',
    marginRight: 8,
  },
  totalValue: {
    fontSize: 9,
    color: '#374151',
    fontWeight: 'bold',
    textAlign: 'right',
    flex: 1.5,
    maxWidth: '18.75%',
  },
  finalTotalContainer: {
    width: '100%',
    paddingTop: 8,
  },
  separatorLineContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    marginBottom: 8,
    paddingRight: 0,
    marginRight: -50,
  },
  separatorLine: {
    width: '40%',
    height: 2,
    backgroundColor: '#E5E7EB',
  },
  finalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    paddingHorizontal: 16,
  },
  finalTotal: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#5C2D91',
    textAlign: 'right',
    flex: 1.5,
    maxWidth: '18.75%',
  },
  // Clean notes section
  notes: {
    marginBottom: 25,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  notesTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  notesText: {
    fontSize: 9,
    color: '#6B7280',
    lineHeight: 1.8,
  },
  // Refined footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  footerText: {
    fontSize: 9,
    color: '#9CA3AF',
    textAlign: 'center',
  },
})

export default function Template1({ invoice, businessSettings }: Template1Props) {
  // Fixed colors for fast invoice - purple theme to match site
  const primaryColor = '#5C2D91'   // Purple
  const secondaryColor = '#8B5CF6' // Light Purple
  const formatCurrency = (amount: number) => {
    // Ensure amount is a valid number
    const validAmount = isNaN(amount) ? 0 : amount
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(validAmount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const calculateSubtotal = () => {
    if (!invoice.items || invoice.items.length === 0) return 0
    return invoice.items.reduce((sum, item) => {
      const amount = parseFloat(item.amount?.toString() || '0') || 0
      return sum + amount
    }, 0)
  }

  const calculateTax = () => {
    const subtotal = calculateSubtotal()
    const taxRate = invoice.taxRate || 0
    return subtotal * (taxRate / 100)
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const tax = calculateTax()
    const discount = invoice.discount || 0
    return subtotal + tax - discount
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Modern Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.companyName}>{businessSettings.businessName}</Text>
          </View>
        </View>

        {/* Refined Business Info */}
        <View style={styles.businessInfo}>
          {businessSettings.address && (
            <Text style={styles.businessText}>{businessSettings.address}</Text>
          )}
          {businessSettings.businessPhone && (
            <Text style={styles.businessText}>{businessSettings.businessPhone}</Text>
          )}
          {businessSettings.businessEmail && (
            <Text style={styles.businessText}>{businessSettings.businessEmail}</Text>
          )}
        </View>

        {/* Bill To and Invoice Details */}
        <View style={styles.billToSection}>
          <View style={styles.billTo}>
            <Text style={styles.billToTitle}>BILL TO:</Text>
            <Text style={styles.clientInfo}>
              {invoice.client.name}
              {invoice.client.company && `\n${invoice.client.company}`}
              {invoice.client.address && `\n${invoice.client.address}`}
              {`\n${invoice.client.email}`}
              {invoice.client.phone && `\n${invoice.client.phone}`}
            </Text>
          </View>
          <View style={styles.invoiceInfo}>
            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceLabel}>INVOICE #</Text>
              <Text style={styles.invoiceValue}>{invoice.invoiceNumber}</Text>
            </View>
            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceLabel}>DATE</Text>
              <Text style={styles.invoiceValue}>{formatDate(invoice.createdAt)}</Text>
            </View>
            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceLabel}>DUE DATE</Text>
              <Text style={styles.invoiceValue}>{formatDate(invoice.dueDate)}</Text>
            </View>
          </View>
        </View>

        {/* Modern Table - ITEM column removed */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 4 }]}>DESCRIPTION</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>QTY</Text>
            <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: 'right' }]}>PRICE</Text>
            <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: 'right' }]}>AMOUNT</Text>
          </View>
          {invoice.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 4 }]}>{item.description}</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>1</Text>
              <Text style={[styles.tableCell, { flex: 1.5, textAlign: 'right' }]}>{formatCurrency(parseFloat(item.amount?.toString() || '0') || 0)}</Text>
              <Text style={[styles.tableCell, { flex: 1.5, textAlign: 'right' }]}>{formatCurrency(parseFloat(item.amount?.toString() || '0') || 0)}</Text>
            </View>
          ))}
        </View>

        {/* Refined Total Section */}
        <View style={styles.totalSection}>
          <View style={[styles.totalRow, { marginBottom: 0 }]}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{formatCurrency(calculateSubtotal())}</Text>
          </View>
          {invoice.discount && invoice.discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount:</Text>
              <Text style={styles.totalValue}>-{formatCurrency(invoice.discount)}</Text>
            </View>
          )}
          {invoice.taxRate && invoice.taxRate > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax ({invoice.taxRate}%):</Text>
              <Text style={styles.totalValue}>{formatCurrency(calculateTax())}</Text>
            </View>
          )}
          <View style={styles.finalTotalContainer}>
            <View style={styles.separatorLineContainer}>
              <View style={styles.separatorLine} />
            </View>
            <View style={styles.finalTotalRow}>
              <Text style={styles.finalTotal}>{formatCurrency(calculateTotal())}</Text>
            </View>
          </View>
        </View>

        {/* Clean Notes Section */}
        <View style={styles.notes}>
          <Text style={styles.notesTitle}>NOTES:</Text>
          <Text style={styles.notesText}>
            {invoice.notes || 'Thank you for your business! We appreciate your prompt payment.'}
          </Text>
        </View>

        {/* Simple Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This invoice was generated with FlowInvoicer. Create professional invoices in seconds.
          </Text>
        </View>
      </Page>
    </Document>
  )
}