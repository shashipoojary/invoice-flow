import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isOwnerRequest } from '@/lib/estimate-owner-detection'

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
    
    console.log('Public Estimate API - Original token:', public_token)
    console.log('Public Estimate API - Decoded token:', decodedToken)

    // Fetch estimate by public token (no authentication required)
    // CRITICAL: Include snapshot fields - public pages must use original business/client data
    let { data: estimate, error } = await supabaseAdmin
      .from('estimates')
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
      const retryResult = await supabaseAdmin
        .from('estimates')
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
      
      estimate = retryResult.data
      error = retryResult.error
    }
    
    // If both fail, try with URL decoded version (handle double encoding)
    if (error) {
      const doubleDecodedToken = decodeURIComponent(decodedToken)
      const retryResult = await supabaseAdmin
        .from('estimates')
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
      
      estimate = retryResult.data
      error = retryResult.error
    }

    if (error || !estimate) {
      console.error('Error fetching public estimate:', error)
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })
    }

    // Fetch estimate items
    const { data: itemsData, error: itemsError } = await supabaseAdmin
      .from('estimate_items')
      .select('*')
      .eq('estimate_id', estimate.id)

    if (itemsError) {
      console.error('Error fetching estimate items:', itemsError)
    }

    // CRITICAL: Use snapshot if available (for sent estimates), otherwise fetch current settings
    // This ensures public pages use the original business/client details from when estimate was sent
    let businessSettings: any = {};
    let clientName = '';
    let clientEmail = '';
    let clientCompany = '';
    let clientPhone = '';
    let clientAddress = '';
    
    if (estimate.business_settings_snapshot && estimate.client_data_snapshot) {
      // Use stored snapshots - estimate was already sent
      businessSettings = estimate.business_settings_snapshot;
      clientName = estimate.client_data_snapshot.name || '';
      clientEmail = estimate.client_data_snapshot.email || '';
      clientCompany = estimate.client_data_snapshot.company || '';
      clientPhone = estimate.client_data_snapshot.phone || '';
      clientAddress = estimate.client_data_snapshot.address || '';
    } else {
      // No snapshot - fetch current settings (for draft estimates or legacy estimates)
      const { data: settingsData, error: settingsError } = await supabaseAdmin
        .from('user_settings')
        .select('*')
        .eq('user_id', estimate.user_id)
        .single()

      if (settingsError) {
        console.error('Error fetching user settings:', settingsError)
      }
      
      businessSettings = settingsData || {};
      
      // Get client details from relationship
      const clients = Array.isArray(estimate.clients) ? estimate.clients[0] : estimate.clients;
      clientName = clients?.name || '';
      clientEmail = clients?.email || '';
      clientCompany = clients?.company || '';
      clientPhone = clients?.phone || '';
      clientAddress = clients?.address || '';
    }

    // Check if estimate is expired and update status if needed
    // CRITICAL: Only check expiry for estimates that are still pending (sent status with pending approval)
    // Approved/rejected estimates should NOT expire
    const currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0) // Set to start of day for comparison
    const expiryDate = estimate.expiry_date ? new Date(estimate.expiry_date) : null
    if (expiryDate) {
      expiryDate.setHours(0, 0, 0, 0) // Set to start of day for comparison
    }
    
    // Only calculate expiry if estimate is still pending (sent status with pending approval)
    // Approved/rejected estimates should never expire
    let isExpired = false
    if (estimate.status === 'sent' && estimate.approval_status === 'pending') {
      isExpired = expiryDate ? expiryDate < currentDate : false
      
      // Update status to 'expired' if expired and still in 'sent' status
      if (isExpired) {
        await supabaseAdmin
          .from('estimates')
          .update({ status: 'expired' })
          .eq('id', estimate.id)
        
        // Update local estimate object
        estimate.status = 'expired'
      }
    }

    // Detect if this is an owner view (for UI purposes - server-side validation is the real security)
    const isOwnerView = await isOwnerRequest(request, estimate.user_id);

    // Return formatted estimate data
    return NextResponse.json({ 
      estimate: {
        id: estimate.id,
        userId: estimate.user_id, // Include user_id to check ownership
        isOwnerView: isOwnerView, // Flag to hide buttons on frontend
        estimateNumber: estimate.estimate_number,
        issueDate: estimate.issue_date,
        expiryDate: estimate.expiry_date,
        clientName: clientName || 'N/A',
        clientEmail: clientEmail || 'N/A',
        clientCompany: clientCompany,
        clientPhone: clientPhone,
        clientAddress: clientAddress,
        items: (itemsData || []).map(item => ({
          id: item.id,
          description: item.description,
          rate: item.rate,
          qty: item.qty || 1,
          amount: item.line_total
        })),
        subtotal: parseFloat(estimate.subtotal || 0),
        discount: parseFloat(estimate.discount || 0),
        taxAmount: parseFloat(estimate.tax || 0),
        total: parseFloat(estimate.total || 0),
        status: estimate.status,
        approvalStatus: estimate.approval_status,
        rejectionReason: estimate.rejection_reason,
        isExpired: isExpired,
        notes: estimate.notes,
        created_at: estimate.created_at,
        theme: (() => {
          if (typeof estimate.theme === 'string') {
            try {
              return JSON.parse(estimate.theme);
            } catch (e) {
              console.log('Failed to parse theme JSON in public API:', e);
              return null;
            }
          }
          return estimate.theme;
        })(),
        paymentTerms: (() => {
          if (typeof estimate.payment_terms === 'string') {
            try {
              return JSON.parse(estimate.payment_terms);
            } catch (e) {
              return null;
            }
          }
          return estimate.payment_terms;
        })(),
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
    console.error('Error in public estimate API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

