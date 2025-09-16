// Required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Get user from auth header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      client_id,
      client_data, // for new clients
      items,
      due_date,
      branding = {},
      notes,
      billing_choice = 'per_invoice'
    } = body

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items are required' }, { status: 400 })
    }

    let finalClientId = client_id

    // Create client if client_data provided
    if (client_data && !client_id) {
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
          user_id: user.id,
          name: client_data.name,
          email: client_data.email,
          company: client_data.company,
          phone: client_data.phone,
          address: client_data.address
        })
        .select()
        .single()

      if (clientError) {
        return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
      }
      finalClientId = newClient.id
    }

    // Generate invoice number
    const { data: lastInvoice } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const invoiceNumber = lastInvoice 
      ? `INV-${String(parseInt(lastInvoice.invoice_number.split('-')[1]) + 1).padStart(4, '0')}`
      : 'INV-0001'

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.qty * item.rate), 0)
    const tax = subtotal * 0.18 // 18% GST for India
    const total = subtotal + tax

    // Create invoice
    const publicToken = uuidv4()
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        user_id: user.id,
        client_id: finalClientId,
        invoice_number: invoiceNumber,
        public_token: publicToken,
        subtotal,
        tax,
        total,
        due_date,
        branding,
        notes
      })
      .select()
      .single()

    if (invoiceError) {
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
    }

    // Create invoice items
    const invoiceItems = items.map((item: { description: string; qty: number; rate: number }) => ({
      invoice_id: invoice.id,
      description: item.description,
      qty: item.qty,
      rate: item.rate,
      line_total: item.qty * item.rate
    }))

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(invoiceItems)

    if (itemsError) {
      return NextResponse.json({ error: 'Failed to create invoice items' }, { status: 500 })
    }

    // Handle billing
    if (billing_choice === 'per_invoice') {
      // Check if user has active subscription
      const { data: settings } = await supabase
        .from('user_settings')
        .select('billing_mode, platform_fee')
        .eq('user_id', user.id)
        .single()

      const billingMode = (settings as { billing_mode?: string })?.billing_mode || 'per_invoice'
      const platformFee = (settings as { platform_fee?: number })?.platform_fee || 0.50

      if (billingMode === 'per_invoice') {
        // Create billing record
        const { data: billingRecord, error: billingError } = await supabase
          .from('billing_records')
          .insert({
            user_id: user.id,
            invoice_id: invoice.id,
            type: 'per_invoice_fee',
            amount: platformFee,
            currency: 'INR'
          })
          .select()
          .single()

        if (billingError) {
          return NextResponse.json({ error: 'Failed to create billing record' }, { status: 500 })
        }

        // Create Stripe checkout session for platform fee
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [{
            price_data: {
              currency: 'inr',
              product_data: {
                name: 'Invoice Platform Fee',
                description: `Platform fee for invoice ${invoiceNumber}`
              },
              unit_amount: Math.round(platformFee * 100) // Convert to paise
            },
            quantity: 1
          }],
          mode: 'payment',
          success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?billing=success&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?billing=cancelled`,
          metadata: {
            billing_record_id: billingRecord.id,
            invoice_id: invoice.id,
            type: 'platform_fee'
          }
        })

        // Update billing record with session ID
        await supabase
          .from('billing_records')
          .update({ stripe_session_id: session.id })
          .eq('id', billingRecord.id)

        return NextResponse.json({
          invoice,
          billing_required: true,
          checkout_session_id: session.id,
          checkout_url: session.url
        })
      }
    }

    return NextResponse.json({
      invoice,
      billing_required: false
    })

  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
