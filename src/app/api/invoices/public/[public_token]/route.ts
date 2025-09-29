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

    // Fetch invoice by public token (no authentication required)
    const { data: invoice, error } = await supabaseAdmin
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

    if (error) {
      console.error('Error fetching public invoice:', error)
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
    
    // Calculate late fees if overdue (assuming 5% per month or as configured)
    let lateFees = 0
    if (isOverdue && invoice.status !== 'paid') {
      const daysOverdue = Math.ceil((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
      const monthsOverdue = Math.ceil(daysOverdue / 30)
      lateFees = (invoice.total_amount || 0) * 0.05 * monthsOverdue // 5% per month
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
        taxAmount: invoice.tax_amount || 0,
        total: invoice.total_amount || 0,
        lateFees: lateFees,
        totalWithLateFees: (invoice.total_amount || 0) + lateFees,
        status: isOverdue && invoice.status !== 'paid' ? 'overdue' : invoice.status,
        isOverdue: isOverdue,
        daysOverdue: isOverdue ? Math.ceil((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0,
        notes: invoice.notes,
        created_at: invoice.created_at,
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
