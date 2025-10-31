import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get the latest fast invoice
    const { data: invoice, error } = await supabaseAdmin
      .from('invoices')
      .select('id, invoice_number, public_token, type')
      .eq('type', 'fast')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !invoice) {
      return NextResponse.json({ 
        error: 'No fast invoice found. Please create a fast invoice first.',
        instructions: [
          '1. Go to Dashboard or Invoices page',
          '2. Create a Fast Invoice (60-second invoice)',
          '3. The invoice will have a public_token',
          '4. Access it at: /invoice/[public_token]'
        ]
      }, { status: 404 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const publicUrl = `${baseUrl}/invoice/${encodeURIComponent(invoice.public_token)}`

    return NextResponse.json({
      message: 'Fast Invoice Public Link Found',
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        type: invoice.type,
        publicToken: invoice.public_token
      },
      publicUrl: publicUrl,
      instructions: [
        `1. Copy this URL: ${publicUrl}`,
        '2. Open it in a new tab (incognito/private window works best)',
        '3. You should see the Fast Invoice public page',
        '4. The design should match the PDF template with fixed colors'
      ]
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
