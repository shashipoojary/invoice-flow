import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || 'demo_key')

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { invoiceId, userId } = body

    // Fetch invoice data
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        clients:client_id (
          name,
          email,
          company
        ),
        invoice_items (*)
      `)
      .eq('id', invoiceId)
      .eq('user_id', userId)
      .single()

    if (error || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Get PDF from storage
    const { data: pdfData, error: pdfError } = await supabase.storage
      .from('invoices')
      .download(`invoice-${invoice.invoice_number}.pdf`)

    if (pdfError) {
      return NextResponse.json({ error: 'PDF not found' }, { status: 404 })
    }

    const pdfBuffer = await pdfData.arrayBuffer()
    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64')

    // Create hosted invoice URL
    const hostedUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invoice/${invoice.public_token}`

    // Send email
    const emailData = await resend.emails.send({
      from: 'InvoiceFlow <noreply@invoiceflow.com>',
      to: [invoice.clients.email],
      subject: `Invoice ${invoice.invoice_number} from InvoiceFlow`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Invoice ${invoice.invoice_number}</h2>
          
          <p>Dear ${invoice.clients.name},</p>
          
          <p>Please find attached your invoice for <strong>$${invoice.total.toFixed(2)}</strong>.</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Invoice Details:</h3>
            <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
            <p><strong>Amount:</strong> $${invoice.total.toFixed(2)}</p>
            <p><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>
            ${invoice.project_name ? `<p><strong>Project:</strong> ${invoice.project_name}</p>` : ''}
            ${invoice.milestone_name ? `<p><strong>Milestone:</strong> ${invoice.milestone_name}</p>` : ''}
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${hostedUrl}" 
               style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View & Pay Invoice
            </a>
          </div>
          
          <p>You can also download the PDF attachment or visit the hosted invoice page to make a payment online.</p>
          
          <p>Thank you for your business!</p>
          
          <p>Best regards,<br>InvoiceFlow Team</p>
        </div>
      `,
      attachments: [
        {
          filename: `invoice-${invoice.invoice_number}.pdf`,
          content: pdfBase64,
          content_type: 'application/pdf'
        }
      ]
    })

    // Update invoice status to 'sent'
    await supabase
      .from('invoices')
      .update({ 
        status: 'sent',
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId)

    return NextResponse.json({ 
      success: true, 
      messageId: emailData.data?.id,
      hostedUrl 
    })

  } catch (error) {
    console.error('Error sending invoice:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
