import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ public_token: string }> }
) {
  try {
    const { public_token } = await params

    if (!public_token) {
      return NextResponse.json({ error: 'Public token is required' }, { status: 400 })
    }

    // Decode the public token to handle URL encoding
    const decodedToken = decodeURIComponent(public_token)
    
    console.log('Public Invoice API - Original token:', public_token)
    console.log('Public Invoice API - Decoded token:', decodedToken)
    console.log('Public Invoice API - Token length:', public_token.length)
    console.log('Public Invoice API - Decoded token length:', decodedToken.length)

    // Fetch invoice by public token (no authentication required)
    // Try multiple approaches to handle URL encoding issues
    let { data: invoice, error } = await supabaseAdmin
      .from('invoices')
      .select(`
        *,
        clients (
          name,
          email,
          company,
          address
        )
      `)
      .eq('public_token', decodedToken)
      .single()
    
    // If decoded token fails, try with original token
    if (error && decodedToken !== public_token) {
      console.log('Public Invoice API - Trying with original token:', public_token)
      const retryResult = await supabaseAdmin
        .from('invoices')
        .select(`
          *,
          clients (
            name,
            email,
            company,
            address
          )
        `)
        .eq('public_token', public_token)
        .single()
      
      invoice = retryResult.data
      error = retryResult.error
    }
    
    // If both fail, try with URL decoded version (handle double encoding)
    if (error) {
      const doubleDecodedToken = decodeURIComponent(decodedToken)
      console.log('Public Invoice API - Trying with double decoded token:', doubleDecodedToken)
      const retryResult = await supabaseAdmin
        .from('invoices')
        .select(`
          *,
          clients (
            name,
            email,
            company,
            address
          )
        `)
        .eq('public_token', doubleDecodedToken)
        .single()
      
      invoice = retryResult.data
      error = retryResult.error
    }
    
    // If all fail, let's check if any invoices exist with similar tokens
    if (error) {
      console.log('Public Invoice API - All token attempts failed, checking for similar tokens...')
      const { data: similarTokens } = await supabaseAdmin
        .from('invoices')
        .select('public_token')
        .limit(5)
      
      console.log('Public Invoice API - Sample tokens from database:', similarTokens)
    }

    if (error) {
      console.error('Error fetching public invoice:', error)
      console.log('Public Invoice API - Query error details:', JSON.stringify(error, null, 2))
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Fetch invoice items
    const { data: itemsData, error: itemsError } = await supabaseAdmin
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoice.id)

    if (itemsError) {
      console.error('Error fetching invoice items:', itemsError)
    }

    // Fetch user settings for business details
    const { data: settingsData, error: settingsError } = await supabaseAdmin
      .from('user_settings')
      .select('*')
      .eq('user_id', invoice.user_id)
      .single()

    if (settingsError) {
      console.error('Error fetching user settings:', settingsError)
    }

    // Calculate overdue status and late fees
    const currentDate = new Date()
    const dueDate = new Date(invoice.due_date)
    const isOverdue = currentDate > dueDate && invoice.status !== 'paid'
    
    // Parse late fees settings from database
    let lateFeesSettings = null
    if (invoice.late_fees) {
      try {
        lateFeesSettings = typeof invoice.late_fees === 'string' ? JSON.parse(invoice.late_fees) : invoice.late_fees
      } catch (e) {
        console.log('Failed to parse late_fees JSON:', e)
        lateFeesSettings = null
      }
    }
    
    // Calculate late fees only if user has enabled them and invoice is overdue
    let lateFees = 0
    if (isOverdue && invoice.status !== 'paid' && lateFeesSettings && lateFeesSettings.enabled) {
      const daysOverdue = Math.ceil((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
      
      // Check if grace period has passed
      if (daysOverdue > (lateFeesSettings.gracePeriod || 0)) {
        if (lateFeesSettings.type === 'percentage') {
          // Percentage-based late fees
          const percentage = lateFeesSettings.amount || 0
          lateFees = (invoice.total || 0) * (percentage / 100)
        } else {
          // Fixed amount late fees
          lateFees = lateFeesSettings.amount || 0
        }
      }
    }

    // Return formatted invoice data
    return NextResponse.json({ 
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        issueDate: invoice.issue_date,
        dueDate: invoice.due_date,
        clientName: invoice.clients?.name || 'N/A',
        clientEmail: invoice.clients?.email || 'N/A',
        clientCompany: invoice.clients?.company,
        clientAddress: invoice.clients?.address,
        items: (itemsData || []).map(item => ({
          id: item.id,
          description: item.description,
          rate: item.line_total,
          amount: item.line_total
        })),
        subtotal: invoice.subtotal || 0,
        discount: invoice.discount || 0,
        taxAmount: invoice.tax_amount || 0,
        total: invoice.total || 0,
        lateFees: lateFees,
        totalWithLateFees: (invoice.total || 0) + lateFees,
        status: isOverdue && invoice.status !== 'paid' ? 'overdue' : invoice.status,
        isOverdue: isOverdue,
        daysOverdue: isOverdue ? Math.ceil((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0,
        notes: invoice.notes,
        created_at: invoice.created_at,
        theme: (() => {
          if (typeof invoice.theme === 'string') {
            try {
              return JSON.parse(invoice.theme);
            } catch (e) {
              console.log('Failed to parse theme JSON in public API:', e);
              return null;
            }
          }
          return invoice.theme;
        })(),
        type: invoice.type,
        lateFeesSettings: lateFeesSettings,
        freelancerSettings: settingsData ? {
          businessName: settingsData.business_name || 'Your Business',
          logo: settingsData.logo || '',
          address: settingsData.business_address || '',
          email: settingsData.business_email || '',
          phone: settingsData.business_phone || '',
          paypalEmail: settingsData.paypal_email || '',
          cashappId: settingsData.cashapp_id || '',
          venmoId: settingsData.venmo_id || '',
          googlePayUpi: settingsData.google_pay_upi || '',
          applePayId: settingsData.apple_pay_id || '',
          bankAccount: settingsData.bank_account || '',
          bankIfscSwift: settingsData.bank_ifsc_swift || '',
          bankIban: settingsData.bank_iban || '',
          stripeAccount: settingsData.stripe_account || '',
          paymentNotes: settingsData.payment_notes || ''
        } : {
          businessName: 'Your Business',
          logo: '',
          address: '',
          email: '',
          phone: '',
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
        }
      }
    })

  } catch (error) {
    console.error('Error in public invoice API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
