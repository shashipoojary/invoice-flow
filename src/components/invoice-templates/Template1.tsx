import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { Invoice, BusinessSettings } from '@/types'

interface Template1Props {
  invoice: Invoice
  businessSettings: BusinessSettings
  primaryColor?: string
  secondaryColor?: string
}

// Create styles for the PDF matching the exact design from images
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 0,
    fontSize: 10,
    lineHeight: 1.3,
    color: '#1a1a1a',
    fontFamily: 'Helvetica',
  },
  // Header with customizable banner - positioned at absolute top
  header: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 15,
    alignItems: 'center',
  },
  invoiceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  // Company section with logo and details - ultra compact (15% of page)
  companySection: {
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 30,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  // Business details with light gray input fields - ultra compact
  businessDetails: {
    alignItems: 'center',
    marginBottom: 6,
  },
  detailField: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginBottom: 3,
    borderRadius: 3,
    width: 220,
    alignItems: 'center',
  },
  detailFieldText: {
    fontSize: 10,
    color: '#374151',
    fontWeight: 'normal',
  },
  // Divider line
  divider: {
    height: 1,
    marginBottom: 10,
    marginHorizontal: 30,
  },
  // Bill To and Invoice Details section
  billToSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingHorizontal: 30,
  },
  billTo: {
    flex: 1,
    marginRight: 30,
  },
  billToTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  clientNameContainer: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginBottom: 4,
  },
  clientName: {
    fontSize: 10,
    fontWeight: 'normal',
    color: '#374151',
  },
  clientDetailField: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 4,
    borderRadius: 4,
  },
  clientDetailText: {
    fontSize: 10,
    color: '#374151',
    fontWeight: 'normal',
  },
  invoiceDetails: {
    flex: 1,
    alignItems: 'flex-end',
  },
  invoiceDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    width: 200,
    alignItems: 'center',
  },
  invoiceDetailLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  invoiceDetailValue: {
    fontSize: 10,
    fontWeight: 'normal',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 3,
    minWidth: 80,
    textAlign: 'center',
  },
  // Services table with teal header
  servicesTable: {
    marginBottom: 15,
    paddingHorizontal: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingLeft: 8,
  },
  tableRowEven: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingLeft: 8,
  },
  tableCell: {
    fontSize: 10,
    color: '#1a1a1a',
    fontWeight: 'normal',
  },
  tableCellBold: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  tableCellCenter: {
    fontSize: 10,
    color: '#1a1a1a',
    textAlign: 'center',
    fontWeight: 'normal',
  },
  tableCellRight: {
    fontSize: 10,
    color: '#1a1a1a',
    textAlign: 'right',
    fontWeight: 'normal',
  },
  // Notes and Total section
  notesTotalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 30,
    alignItems: 'flex-start',
  },
  notesSection: {
    width: 200,
    marginRight: 30,
    marginTop: 35,
  },
  notesTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  notesBox: {
    padding: 12,
    borderRadius: 4,
  },
  notesText: {
    fontSize: 10,
    color: '#374151',
    lineHeight: 1.4,
    fontWeight: 'normal',
  },
  totalSection: {
    alignItems: 'flex-end',
    minWidth: 200,
    alignSelf: 'flex-start',
    marginLeft: 15,
  },
  totalBreakdown: {
    marginBottom: 10,
    width: 160,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    width: 160,
  },
  totalLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: 'normal',
  },
  totalValue: {
    fontSize: 10,
    color: '#1a1a1a',
    fontWeight: 'normal',
  },
  finalTotalLabel: {
    fontSize: 11,
    color: '#1a1a1a',
    marginBottom: 8,
    marginTop: 10,
    fontWeight: 'bold',
  },
  finalTotalValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  // Footer with InvoiceFlow branding - positioned at bottom
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    alignItems: 'center',
  },
  poweredBy: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: 'normal',
  },
  invoiceFlowBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  invoiceFlowLogo: {
    width: 80,
    height: 25,
  },
  invoiceFlowText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B5CF6',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  disclaimer: {
    fontSize: 9,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 1.3,
    fontWeight: 'normal',
  },
})

export default function Template1({ invoice, businessSettings, primaryColor = '#0D9488', secondaryColor = '#3B82F6' }: Template1Props) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const calculateSubtotal = () => {
    return invoice.items.reduce((sum, item) => sum + (parseFloat(item.amount?.toString() || '0') || 0), 0)
  }

  const calculateTax = () => {
    const subtotal = calculateSubtotal()
    return subtotal * (invoice.taxRate / 100)
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() - (invoice.discount || 0)
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with customizable banner */}
        <View style={[styles.header, { backgroundColor: primaryColor }]}>
          <Text style={styles.invoiceTitle}>INVOICE</Text>
        </View>

        {/* Company section with logo and details */}
        <View style={styles.companySection}>
          <View style={[styles.logo, { backgroundColor: primaryColor }]}>
            <Text style={styles.logoText}>
              {businessSettings.businessName?.charAt(0) || 'B'}
            </Text>
          </View>
          <Text style={[styles.companyName, { color: secondaryColor }]}>{businessSettings.businessName}</Text>
        </View>

        {/* Business details - no borders, just text */}
        <View style={styles.businessDetails}>
          {businessSettings.address && (
            <Text style={styles.detailFieldText}>{businessSettings.address}</Text>
          )}
          {businessSettings.businessPhone && (
            <Text style={styles.detailFieldText}>{businessSettings.businessPhone}</Text>
          )}
          {businessSettings.businessEmail && (
            <Text style={styles.detailFieldText}>{businessSettings.businessEmail}</Text>
          )}
        </View>

        {/* Divider line */}
        <View style={[styles.divider, { backgroundColor: `${primaryColor}30` }]} />

        {/* Bill To and Invoice Details */}
        <View style={styles.billToSection}>
          <View style={styles.billTo}>
            <Text style={styles.billToTitle}>BILL TO:</Text>
            <View style={[styles.clientNameContainer, { backgroundColor: `${primaryColor}15` }]}>
              <Text style={styles.clientName}>{invoice.client.name}</Text>
            </View>
            {invoice.client.company && (
              <View style={[styles.clientDetailField, { backgroundColor: `${primaryColor}15` }]}>
                <Text style={styles.clientDetailText}>{invoice.client.company}</Text>
              </View>
            )}
            {invoice.client.address && (
              <View style={[styles.clientDetailField, { backgroundColor: `${primaryColor}15` }]}>
                <Text style={styles.clientDetailText}>{invoice.client.address}</Text>
              </View>
            )}
            <View style={[styles.clientDetailField, { backgroundColor: `${primaryColor}15` }]}>
              <Text style={styles.clientDetailText}>{invoice.client.email}</Text>
            </View>
            {invoice.client.phone && (
              <View style={[styles.clientDetailField, { backgroundColor: `${primaryColor}15` }]}>
                <Text style={styles.clientDetailText}>{invoice.client.phone}</Text>
              </View>
            )}
          </View>
          <View style={styles.invoiceDetails}>
            <View style={styles.invoiceDetailRow}>
              <Text style={styles.invoiceDetailLabel}>INVOICE #</Text>
              <Text style={[styles.invoiceDetailValue, { backgroundColor: `${primaryColor}15` }]}>{invoice.invoiceNumber}</Text>
            </View>
            <View style={styles.invoiceDetailRow}>
              <Text style={styles.invoiceDetailLabel}>DATE</Text>
              <Text style={[styles.invoiceDetailValue, { backgroundColor: `${primaryColor}15` }]}>{formatDate(invoice.createdAt)}</Text>
            </View>
            <View style={styles.invoiceDetailRow}>
              <Text style={styles.invoiceDetailLabel}>INVOICE DUE DATE</Text>
              <Text style={[styles.invoiceDetailValue, { backgroundColor: `${primaryColor}15` }]}>{formatDate(invoice.dueDate)}</Text>
            </View>
          </View>
        </View>

        {/* Services Table with teal header */}
        <View style={styles.servicesTable}>
          <View style={[styles.tableHeader, { backgroundColor: primaryColor }]}>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>ITEMS</Text>
            <Text style={[styles.tableHeaderText, { flex: 2 }]}>DESCRIPTION</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>QUANTITY</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>PRICE</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>TAX</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>AMOUNT</Text>
          </View>
          {invoice.items.map((item, index) => (
            <View key={index} style={[
              index % 2 === 0 ? styles.tableRow : styles.tableRowEven,
              index % 2 === 1 ? { backgroundColor: `${primaryColor}08` } : {}
            ]}>
              <Text style={[styles.tableCell, { flex: 1 }]}>Item {index + 1}</Text>
              <Text style={[styles.tableCell, { flex: 2 }]}>{item.description}</Text>
              <Text style={[styles.tableCellCenter, { flex: 1 }]}>1</Text>
              <Text style={[styles.tableCellRight, { flex: 1 }]}>{formatCurrency(parseFloat(item.amount?.toString() || '0') || 0)}</Text>
              <Text style={[styles.tableCellCenter, { flex: 1 }]}>{invoice.taxRate}%</Text>
              <Text style={[styles.tableCellRight, { flex: 1 }]}>{formatCurrency(parseFloat(item.amount?.toString() || '0') || 0)}</Text>
            </View>
          ))}
        </View>

        {/* Notes and Total Section */}
        <View style={styles.notesTotalSection}>
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>NOTES:</Text>
            <View style={[styles.notesBox, { backgroundColor: `${primaryColor}15` }]}>
              <Text style={styles.notesText}>
                {invoice.notes || 'Thank you for your business! We appreciate your prompt payment.'}
              </Text>
            </View>
          </View>
          <View style={styles.totalSection}>
            <View style={styles.totalBreakdown}>
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
            </View>
            <Text style={styles.finalTotalLabel}>TOTAL</Text>
            <Text style={[styles.finalTotalValue, { color: secondaryColor }]}>{formatCurrency(calculateTotal())}</Text>
          </View>
        </View>

        {/* Footer with disclaimer only */}
        <View style={styles.footer}>
          <Text style={styles.disclaimer}>
            This invoice was generated with InvoiceFlow. Create professional invoices in seconds.
          </Text>
        </View>
      </Page>
    </Document>
  )
}