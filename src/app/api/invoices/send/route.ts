// Required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

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
    const { invoiceId } = body

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })
    }

    // Fetch invoice with client
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        clients (*)
      `)
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (invoice.status !== 'draft') {
      return NextResponse.json({ error: 'Invoice is not in draft status' }, { status: 400 })
    }

    // Check if billing is required and paid
    const { data: billingRecord } = await supabase
      .from('billing_records')
      .select('*')
      .eq('invoice_id', invoiceId)
      .eq('status', 'pending')
      .single()

    if (billingRecord) {
      return NextResponse.json({ 
        error: 'Platform fee payment required before sending invoice',
        billing_required: true,
        billing_record_id: billingRecord.id
      }, { status: 402 })
    }

    // Get user settings for business info
    const { data: userSettings } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Generate PDF if not exists
    const { data: existingPdf } = await supabase
      .from('invoice_pdfs')
      .select('storage_path')
      .eq('invoice_id', invoiceId)
      .single()

    let pdfUrl = null
    if (existingPdf) {
      const { data: signedUrl } = await supabase.storage
        .from('invoice-pdfs')
        .createSignedUrl(existingPdf.storage_path, 86400) // 24 hours
      pdfUrl = signedUrl?.signedUrl
    }

    // Create hosted invoice URL
    const hostedUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invoice/${invoice.public_token}`

    // Send email
    const businessName = userSettings?.business_name || invoice.branding?.business_name || 'Your Business'
    const businessEmail = userSettings?.business_email || user.email

    const emailData = {
      from: `InvoiceFlow Pro <noreply@${process.env.RESEND_DOMAIN || 'invoiceflowpro.com'}>`,
      to: [invoice.clients.email],
      subject: `Invoice ${invoice.invoice_number} from ${businessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1e40af; margin: 0;">Invoice ${invoice.invoice_number}</h2>
            <p style="margin: 10px 0 0 0; color: #64748b;">From ${businessName}</p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <p>Dear ${invoice.clients.name},</p>
            
            <p>Please find attached your invoice for the amount of <strong>₹${invoice.total.toLocaleString()}</strong>.</p>
            
            <div style="background: #f1f5f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold;">Invoice Details:</p>
              <p style="margin: 5px 0;">Invoice #: ${invoice.invoice_number}</p>
              <p style="margin: 5px 0;">Amount: ₹${invoice.total.toLocaleString()}</p>
              <p style="margin: 5px 0;">Due Date: ${new Date(invoice.due_date).toLocaleDateString()}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${hostedUrl}" 
                 style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                View & Pay Invoice
              </a>
            </div>
            
            <p>You can view and pay this invoice online by clicking the button above, or download the PDF attachment.</p>
            
            ${invoice.notes ? `<div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold;">Notes:</p>
              <p style="margin: 5px 0;">${invoice.notes}</p>
            </div>` : ''}
            
            <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
            
            <p>Best regards,<br>${businessName}</p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #64748b; font-size: 12px;">
            <p>This invoice was sent via InvoiceFlow Pro</p>
          </div>
        </div>
      `,
      attachments: pdfUrl ? [{
        filename: `invoice-${invoice.invoice_number}.pdf`,
        path: pdfUrl
      }] : []
    }

    const { data: emailResult, error: emailError } = await resend.emails.send(emailData)

    if (emailError) {
      console.error('Email sending error:', emailError)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    // Update invoice status
    await supabase
      .from('invoices')
      .update({ 
        status: 'sent',
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId)

    return NextResponse.json({
      success: true,
      email_id: emailResult?.id,
      hosted_url: hostedUrl
    })

  } catch (error) {
    console.error('Error sending invoice:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
