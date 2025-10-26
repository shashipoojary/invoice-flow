import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { Invoice, BusinessSettings } from '@/types'

interface Template1Props {
  invoice: Invoice
  businessSettings: BusinessSettings
}

// Clean, minimal styles for Fast Invoice
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontSize: 11,
    lineHeight: 1.4,
    color: '#333333',
    fontFamily: 'Helvetica',
  },
  // Simple header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#0D9488',
  },
  invoiceTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0D9488',
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'right',
  },
  // Simple business info
  businessInfo: {
    marginBottom: 20,
    alignItems: 'flex-end',
  },
  businessText: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 2,
  },
  // Clean bill to section
  billToSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  billTo: {
    flex: 1,
  },
  billToTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  clientInfo: {
    fontSize: 11,
    color: '#333333',
    lineHeight: 1.5,
  },
  invoiceInfo: {
    alignItems: 'flex-end',
    maxWidth: 200,
  },
  invoiceRow: {
    flexDirection: 'row',
    marginBottom: 4,
    justifyContent: 'space-between',
    width: '100%',
  },
  invoiceLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#333333',
    width: 70,
  },
  invoiceValue: {
    fontSize: 11,
    color: '#333333',
    width: 80,
    textAlign: 'right',
  },
  // Simple table
  table: {
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0D9488',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableCell: {
    fontSize: 11,
    color: '#333333',
  },
  // Simple total section
  totalSection: {
    alignItems: 'flex-end',
    marginBottom: 30,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    minWidth: 200,
  },
  totalLabel: {
    fontSize: 11,
    color: '#666666',
  },
  totalValue: {
    fontSize: 11,
    color: '#333333',
    fontWeight: 'bold',
  },
  finalTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0D9488',
    marginTop: 8,
  },
  // Simple notes
  notes: {
    marginBottom: 20,
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 11,
    color: '#666666',
    lineHeight: 1.5,
  },
  // Simple footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 9,
    color: '#999999',
    textAlign: 'center',
  },
})

export default function Template1({ invoice, businessSettings }: Template1Props) {
  // Fixed colors for fast invoice - no customization needed
  const primaryColor = '#0D9488'   // Teal
  const secondaryColor = '#3B82F6' // Blue
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
        {/* Clean Header */}
        <View style={styles.header}>
          <Text style={styles.invoiceTitle}>INVOICE</Text>
          <Text style={styles.companyName}>{businessSettings.businessName}</Text>
        </View>

        {/* Simple Business Info */}
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

        {/* Simple Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>ITEM</Text>
            <Text style={[styles.tableHeaderText, { flex: 3 }]}>DESCRIPTION</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>QTY</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>PRICE</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>AMOUNT</Text>
          </View>
          {invoice.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1 }]}>{index + 1}</Text>
              <Text style={[styles.tableCell, { flex: 3 }]}>{item.description}</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>1</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrency(parseFloat(item.amount?.toString() || '0') || 0)}</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrency(parseFloat(item.amount?.toString() || '0') || 0)}</Text>
            </View>
          ))}
        </View>

        {/* Simple Total */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
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
          <Text style={styles.finalTotal}>{formatCurrency(calculateTotal())}</Text>
        </View>

        {/* Simple Notes */}
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