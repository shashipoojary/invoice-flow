'use client'

import React, { useState } from 'react'
import { Invoice, BusinessSettings } from '@/types'

export default function TestTemplatePage() {
  const [primaryColor, setPrimaryColor] = useState('#0D9488')
  const [secondaryColor, setSecondaryColor] = useState('#3B82F6')

  // Dummy invoice data
  const dummyInvoice: Invoice = {
    id: 'test-123',
    invoiceNumber: 'INV-0001',
    clientId: 'client-1',
    clientName: 'John Doe',
    clientEmail: 'john.doe@example.com',
    clientCompany: 'Acme Corporation',
    client: {
      id: 'client-1',
      name: 'John Doe',
      email: 'john.doe@example.com',
      company: 'Acme Corporation',
      address: '123 Business St, Suite 100\nNew York, NY 10001',
      phone: '+1 (555) 123-4567',
      createdAt: '2024-01-15T10:30:00Z'
    },
    items: [
      {
        id: 'item-1',
        description: 'Web Development Services - Frontend Development',
        amount: 1500,
        rate: 1500
      },
      {
        id: 'item-2', 
        description: 'Backend API Development',
        amount: 2000,
        rate: 2000
      },
      {
        id: 'item-3',
        description: 'Database Design & Setup',
        amount: 800,
        rate: 800
      }
    ],
    subtotal: 4300,
    taxRate: 8.5,
    taxAmount: 365.50,
    discount: 200,
    total: 4455.50,
    notes: 'Thank you for choosing our services! Payment is due within 30 days of invoice date. Please contact us if you have any questions.',
    status: 'sent',
    createdAt: '2024-01-15T10:30:00Z',
    dueDate: '2024-02-14T23:59:59Z'
  }

  // Dummy business settings
  const dummyBusinessSettings: BusinessSettings = {
    businessName: 'SilverOak Creative',
    businessEmail: 'hello@silveroakcreative.example.com',
    businessPhone: '+1 (555) 123-4567',
    address: '225 Fifth Avenue, Suite 804\nNew York, NY 10010, USA',
    logo: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop&crop=center',
    paypalEmail: 'payments@silveroakcreative.example.com',
    cashappId: '$silveroakcreative',
    venmoId: '@silveroakcreative',
    googlePayUpi: 'silveroakcreative@upi',
    applePayId: 'silveroakcreative@apple',
    bankAccount: '1234567890',
    bankIfscSwift: 'CHASUS33XXX',
    bankIban: 'US64SVBKUS6S3300958879',
    stripeAccount: 'acct_1234567890',
    paymentNotes: 'Please include invoice number in payment reference.'
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Fast Invoice Template Live Preview</h1>
        
        {/* Color Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Color Controls</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Color
              </label>
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md"
              />
              <p className="text-sm text-gray-500 mt-1">{primaryColor}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secondary Color
              </label>
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md"
              />
              <p className="text-sm text-gray-500 mt-1">{secondaryColor}</p>
            </div>
          </div>
        </div>

        {/* HTML Template Preview */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Fast Invoice Template HTML Preview</h2>
            <p className="text-sm text-gray-600">Live preview of Fast Invoice Template with dummy data</p>
          </div>
          <div className="p-8">
            {/* Invoice Template HTML Version */}
            <div className="max-w-4xl mx-auto bg-white shadow-lg" style={{ minHeight: '800px' }}>
              {/* Header */}
              <div 
                className="py-4 px-6 text-center mb-4"
                style={{ backgroundColor: primaryColor }}
              >
                <h1 className="text-xl font-bold text-white uppercase">INVOICE</h1>
              </div>

              {/* Company Section */}
              <div className="text-center mb-4 px-8">
                <div 
                  className="w-10 h-10 mx-auto mb-2 rounded flex items-center justify-center"
                  style={{ backgroundColor: primaryColor }}
                >
                  {dummyBusinessSettings.logo ? (
                    <img 
                      src={dummyBusinessSettings.logo} 
                      alt="Logo" 
                      className="w-12 h-12 rounded"
                    />
                  ) : (
                    <span className="text-white font-bold text-sm">
                      {dummyBusinessSettings.businessName?.charAt(0) || 'B'}
                    </span>
                  )}
                </div>
                <h2 
                  className="text-lg font-bold mb-2"
                  style={{ color: secondaryColor }}
                >
                  {dummyBusinessSettings.businessName}
                </h2>
              </div>

              {/* Business Details */}
              <div className="text-center mb-4 px-8">
                {dummyBusinessSettings.address && (
                  <div 
                    className="inline-block px-3 py-1 rounded mb-1 text-xs"
                    style={{ backgroundColor: `${primaryColor}15` }}
                  >
                    {dummyBusinessSettings.address}
                  </div>
                )}
                {dummyBusinessSettings.businessPhone && (
                  <div 
                    className="inline-block px-3 py-1 rounded mb-1 text-xs"
                    style={{ backgroundColor: `${primaryColor}15` }}
                  >
                    {dummyBusinessSettings.businessPhone}
                  </div>
                )}
                {dummyBusinessSettings.businessEmail && (
                  <div 
                    className="inline-block px-3 py-1 rounded mb-1 text-xs"
                    style={{ backgroundColor: `${primaryColor}15` }}
                  >
                    {dummyBusinessSettings.businessEmail}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div 
                className="h-px mx-8 mb-4"
                style={{ backgroundColor: `${primaryColor}30` }}
              />

              {/* Bill To and Invoice Details */}
              <div className="flex justify-between mb-6 px-8">
                <div className="flex-1 mr-8">
                  <h3 className="text-sm font-bold mb-3">BILL TO:</h3>
                  <div 
                    className="px-3 py-2 rounded mb-2 text-xs"
                    style={{ backgroundColor: `${primaryColor}15` }}
                  >
                    {dummyInvoice.client.name}
                  </div>
                  {dummyInvoice.client.company && (
                    <div 
                      className="px-3 py-2 rounded mb-2 text-xs"
                      style={{ backgroundColor: `${primaryColor}15` }}
                    >
                      {dummyInvoice.client.company}
                    </div>
                  )}
                  {dummyInvoice.client.address && (
                    <div 
                      className="px-3 py-2 rounded mb-2 text-xs"
                      style={{ backgroundColor: `${primaryColor}15` }}
                    >
                      {dummyInvoice.client.address}
                    </div>
                  )}
                  <div 
                    className="px-3 py-2 rounded mb-2 text-xs"
                    style={{ backgroundColor: `${primaryColor}15` }}
                  >
                    {dummyInvoice.client.email}
                  </div>
                  {dummyInvoice.client.phone && (
                    <div 
                      className="px-3 py-2 rounded mb-2 text-xs"
                      style={{ backgroundColor: `${primaryColor}15` }}
                    >
                      {dummyInvoice.client.phone}
                    </div>
                  )}
                </div>
                <div className="flex-1 text-right">
                  <div className="flex justify-between items-center mb-2 w-48 ml-auto">
                    <span className="text-xs font-bold">INVOICE #</span>
                    <div 
                      className="px-2 py-1 rounded text-xs"
                      style={{ backgroundColor: `${primaryColor}15` }}
                    >
                      {dummyInvoice.invoiceNumber}
                    </div>
                  </div>
                  <div className="flex justify-between items-center mb-2 w-48 ml-auto">
                    <span className="text-xs font-bold">DATE</span>
                    <div 
                      className="px-2 py-1 rounded text-xs"
                      style={{ backgroundColor: `${primaryColor}15` }}
                    >
                      {new Date(dummyInvoice.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex justify-between items-center mb-2 w-48 ml-auto">
                    <span className="text-xs font-bold">DUE DATE</span>
                    <div 
                      className="px-2 py-1 rounded text-xs"
                      style={{ backgroundColor: `${primaryColor}15` }}
                    >
                      {new Date(dummyInvoice.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Services Table */}
              <div className="mb-6 px-8">
                <div 
                  className="flex py-3 px-2 rounded-t"
                  style={{ backgroundColor: primaryColor }}
                >
                  <div className="flex-1 text-white text-xs font-bold">ITEMS</div>
                  <div className="flex-2 text-white text-xs font-bold">DESCRIPTION</div>
                  <div className="flex-1 text-white text-xs font-bold text-center">QUANTITY</div>
                  <div className="flex-1 text-white text-xs font-bold text-right">PRICE</div>
                  <div className="flex-1 text-white text-xs font-bold text-center">TAX</div>
                  <div className="flex-1 text-white text-xs font-bold text-right">AMOUNT</div>
                </div>
                {dummyInvoice.items.map((item, index) => (
                  <div 
                    key={index}
                    className={`flex py-3 pl-2 text-xs ${
                      index % 2 === 1 ? 'rounded' : ''
                    }`}
                    style={{ 
                      backgroundColor: index % 2 === 1 ? `${primaryColor}08` : 'transparent' 
                    }}
                  >
                    <div className="flex-1">Item {index + 1}</div>
                    <div className="flex-2">{item.description}</div>
                    <div className="flex-1 text-center">1</div>
                    <div className="flex-1 text-right">${(typeof item.amount === 'number' ? item.amount : parseFloat(item.amount.toString())).toFixed(2)}</div>
                    <div className="flex-1 text-center">{dummyInvoice.taxRate}%</div>
                    <div className="flex-1 text-right">${(typeof item.amount === 'number' ? item.amount : parseFloat(item.amount.toString())).toFixed(2)}</div>
                  </div>
                ))}
              </div>

              {/* Notes and Total */}
              <div className="flex justify-between mb-8 px-8">
                <div className="w-48">
                  <h3 className="text-sm font-bold mb-2">NOTES:</h3>
                  <div 
                    className="p-3 rounded text-xs"
                    style={{ backgroundColor: `${primaryColor}15` }}
                  >
                    {dummyInvoice.notes}
                  </div>
                </div>
                <div className="w-40 text-right">
                  <div className="flex justify-between mb-1 text-xs">
                    <span>Subtotal:</span>
                    <span>${dummyInvoice.subtotal.toFixed(2)}</span>
                  </div>
                  {dummyInvoice.discount && dummyInvoice.discount > 0 && (
                    <div className="flex justify-between mb-1 text-xs">
                      <span>Discount:</span>
                      <span>-${dummyInvoice.discount.toFixed(2)}</span>
                    </div>
                  )}
                  {dummyInvoice.taxRate > 0 && (
                    <div className="flex justify-between mb-1 text-xs">
                      <span>Tax ({dummyInvoice.taxRate}%):</span>
                      <span>${(dummyInvoice.subtotal * dummyInvoice.taxRate / 100).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="mt-4">
                    <div className="text-sm font-bold mb-1">TOTAL</div>
                    <div 
                      className="text-2xl font-bold"
                      style={{ color: secondaryColor }}
                    >
                      ${dummyInvoice.total.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center py-4 px-8 border-t border-gray-200">
                <div className="text-xs text-gray-500 mb-2">Powered by</div>
                <div 
                  className="text-sm font-bold"
                  style={{ color: '#8B5CF6' }}
                >
                  InvoiceFlow
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  This invoice was generated with InvoiceFlow. Create professional invoices in seconds.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
