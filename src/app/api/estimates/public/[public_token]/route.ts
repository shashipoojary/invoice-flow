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
    let { data: estimate, error } = await supabaseAdmin
      .from('estimates')
      .select(`
        *,
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

    // Fetch user settings for business details
    const { data: settingsData, error: settingsError } = await supabaseAdmin
      .from('user_settings')
      .select('*')
      .eq('user_id', estimate.user_id)
      .single()

    if (settingsError) {
      console.error('Error fetching user settings:', settingsError)
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
        clientName: estimate.clients?.name || 'N/A',
        clientEmail: estimate.clients?.email || 'N/A',
        clientCompany: estimate.clients?.company,
        clientPhone: estimate.clients?.phone,
        clientAddress: estimate.clients?.address,
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
    console.error('Error in public estimate API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

