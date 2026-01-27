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
    // CRITICAL: Include snapshot fields - public pages must use original business/client data
    // Try multiple approaches to handle URL encoding issues
    let { data: invoice, error } = await supabaseAdmin
      .from('invoices')
      .select(`
        *,
        business_settings_snapshot,
        client_data_snapshot,
        clients (
          name,
          email,
          company,
          phone,
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
          business_settings_snapshot,
          client_data_snapshot,
          clients (
            name,
            email,
            company,
            phone,
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
          business_settings_snapshot,
          client_data_snapshot,
          clients (
            name,
            email,
            company,
            phone,
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

    // CRITICAL: Draft invoices should not be accessible via public URL
    // They should only be viewable by the owner in the dashboard
    if (invoice.status === 'draft') {
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

    // CRITICAL: Use snapshot if available (for sent invoices), otherwise fetch current settings
    // This ensures public pages use the original business/client details from when invoice was sent
    let businessSettings: any = {};
    let clientName = '';
    let clientEmail = '';
    let clientCompany = '';
    let clientPhone = '';
    let clientAddress = '';
    
    if (invoice.business_settings_snapshot && invoice.client_data_snapshot) {
      // Use stored snapshots - invoice was already sent
      businessSettings = invoice.business_settings_snapshot;
      clientName = invoice.client_data_snapshot.name || '';
      clientEmail = invoice.client_data_snapshot.email || '';
      clientCompany = invoice.client_data_snapshot.company || '';
      clientPhone = invoice.client_data_snapshot.phone || '';
      clientAddress = invoice.client_data_snapshot.address || '';
    } else {
      // No snapshot - fetch current settings (for draft invoices or legacy invoices)
      const { data: settingsData, error: settingsError } = await supabaseAdmin
        .from('user_settings')
        .select('*')
        .eq('user_id', invoice.user_id)
        .single()

      if (settingsError) {
        console.error('Error fetching user settings:', settingsError)
      }
      
      businessSettings = settingsData || {};
      
      // Get client details from relationship
      const clients = Array.isArray(invoice.clients) ? invoice.clients[0] : invoice.clients;
      clientName = clients?.name || '';
      clientEmail = clients?.email || '';
      clientCompany = clients?.company || '';
      clientPhone = clients?.phone || '';
      clientAddress = clients?.address || '';
    }

    // Calculate overdue status and late fees
    const currentDate = new Date()
    const dueDate = new Date(invoice.due_date)
    
    // Set time to start of day for accurate date comparison
    const todayStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())
    const dueDateStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())
    
    // Invoice is overdue only if due date has passed (not on the due date itself)
    // CRITICAL: Only calculate overdue for sent/pending invoices, not drafts
    const isOverdue = dueDateStart < todayStart && invoice.status !== 'paid' && invoice.status !== 'draft'
    const isDueToday = dueDateStart.getTime() === todayStart.getTime() && invoice.status !== 'paid' && invoice.status !== 'draft'
    
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
    
    // Fetch payment data for sent/pending invoices FIRST (before calculating late fees)
    let totalPaid: number | undefined = undefined;
    let remainingBalance: number | undefined = undefined;
    if (invoice.status === 'sent' || invoice.status === 'pending') {
      const { data: payments } = await supabaseAdmin
        .from('invoice_payments')
        .select('amount')
        .eq('invoice_id', invoice.id);
      
      if (payments && payments.length > 0) {
        const calculatedTotalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
        if (calculatedTotalPaid > 0) {
          totalPaid = calculatedTotalPaid;
          remainingBalance = Math.max(0, (invoice.total || 0) - calculatedTotalPaid);
        }
      }
    }
    
    // Calculate late fees only if user has enabled them and invoice is overdue
    // CRITICAL: Don't calculate late fees for draft invoices
    // IMPORTANT: Calculate late fees on remaining balance (after partial payments), not full total
    let lateFees = 0
    if (isOverdue && invoice.status !== 'paid' && invoice.status !== 'draft' && lateFeesSettings && lateFeesSettings.enabled) {
      const daysOverdue = Math.round((todayStart.getTime() - dueDateStart.getTime()) / (1000 * 60 * 60 * 24))
      
      // Check if grace period has passed
      if (daysOverdue > (lateFeesSettings.gracePeriod || 0)) {
        // Use remaining balance for late fee calculation if partial payments exist
        const baseAmount = remainingBalance !== undefined && remainingBalance > 0 ? remainingBalance : (invoice.total || 0);
        
        if (lateFeesSettings.type === 'percentage') {
          // Percentage-based late fees - calculate on remaining balance
          const percentage = lateFeesSettings.amount || 0
          lateFees = baseAmount * (percentage / 100)
        } else {
          // Fixed amount late fees
          lateFees = lateFeesSettings.amount || 0
        }
      }
    }
    
    // Calculate total with late fees on remaining balance
    const baseAmount = remainingBalance !== undefined && remainingBalance >= 0 ? remainingBalance : (invoice.total || 0);
    const totalWithLateFees = baseAmount + lateFees;

    // Return formatted invoice data
    return NextResponse.json({ 
      invoice: {
        id: invoice.id,
        userId: invoice.user_id, // Include user_id to check ownership
        invoiceNumber: invoice.invoice_number,
        issueDate: invoice.issue_date,
        dueDate: invoice.due_date,
        clientName: clientName || 'N/A',
        clientEmail: clientEmail || 'N/A',
        clientCompany: clientCompany,
        clientPhone: clientPhone,
        clientAddress: clientAddress,
        items: (itemsData || []).map(item => ({
          id: item.id,
          description: item.description,
          qty: item.qty || 1,
          rate: item.rate || item.line_total,
          amount: item.line_total
        })),
        subtotal: invoice.subtotal || 0,
        discount: invoice.discount || 0,
        taxAmount: invoice.tax_amount || 0,
        total: invoice.total || 0,
        // Only include payment data if there are actual partial payments
        ...(totalPaid !== undefined && totalPaid > 0 && remainingBalance !== undefined && remainingBalance > 0 ? {
          totalPaid: totalPaid,
          remainingBalance: remainingBalance
        } : {}),
        lateFees: lateFees,
        totalWithLateFees: totalWithLateFees,
        status: isOverdue && invoice.status !== 'paid' ? 'overdue' : (isDueToday ? 'due today' : (invoice.status === 'sent' ? 'pending' : invoice.status)),
        isOverdue: isOverdue,
        daysOverdue: isOverdue ? Math.round((todayStart.getTime() - dueDateStart.getTime()) / (1000 * 60 * 60 * 24)) : 0,
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
        currency: invoice.currency || 'USD',
        exchange_rate: invoice.exchange_rate || 1.0,
        base_currency_amount: invoice.base_currency_amount || invoice.total,
        lateFeesSettings: lateFeesSettings,
        freelancerSettings: {
          businessName: businessSettings.business_name || 'Your Business',
          logo: businessSettings.logo || businessSettings.logo_url || '',
          address: businessSettings.business_address || '',
          email: businessSettings.business_email || '',
          phone: businessSettings.business_phone || '',
          paypalEmail: businessSettings.paypal_email || '',
          cashappId: businessSettings.cashapp_id || '',
          venmoId: businessSettings.venmo_id || '',
          googlePayUpi: businessSettings.google_pay_upi || '',
          applePayId: businessSettings.apple_pay_id || '',
          bankAccount: businessSettings.bank_account || '',
          bankIfscSwift: businessSettings.bank_ifsc_swift || '',
          bankIban: businessSettings.bank_iban || '',
          stripeAccount: businessSettings.stripe_account || '',
          paymentNotes: businessSettings.payment_notes || ''
        }
      }
    })

  } catch (error) {
    console.error('Error in public invoice API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
