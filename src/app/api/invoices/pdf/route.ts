import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const invoiceId = searchParams.get('id')
    const publicToken = searchParams.get('token')

    if (!invoiceId && !publicToken) {
      return NextResponse.json({ error: 'Invoice ID or token required' }, { status: 400 })
    }

    // Fetch invoice data
    let query = supabase
      .from('invoices')
      .select(`
        *,
        clients:client_id (
          name,
          email,
          company,
          address
        ),
        invoice_items (*)
      `)

    if (publicToken) {
      query = query.eq('public_token', publicToken)
    } else {
      query = query.eq('id', invoiceId)
    }

    const { data: invoice, error } = await query.single()

    if (error || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Generate PDF
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595.28, 841.89]) // A4 size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const { width, height } = page.getSize()
    let yPosition = height - 50

    // Header
    page.drawText('InvoiceFlow Pro', {
      x: 50,
      y: yPosition,
      size: 24,
      font: boldFont,
      color: rgb(0.2, 0.4, 0.8)
    })
    yPosition -= 30

    page.drawText(`Invoice ${invoice.invoice_number}`, {
      x: 50,
      y: yPosition,
      size: 18,
      font: boldFont,
      color: rgb(0, 0, 0)
    })
    yPosition -= 40

    // Invoice details
    page.drawText('Bill To:', {
      x: 50,
      y: yPosition,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0)
    })
    yPosition -= 20

    page.drawText(invoice.clients.name, {
      x: 50,
      y: yPosition,
      size: 12,
      font: font,
      color: rgb(0, 0, 0)
    })
    yPosition -= 15

    if (invoice.clients.company) {
      page.drawText(invoice.clients.company, {
        x: 50,
        y: yPosition,
        size: 12,
        font: font,
        color: rgb(0, 0, 0)
      })
      yPosition -= 15
    }

    page.drawText(invoice.clients.email, {
      x: 50,
      y: yPosition,
      size: 12,
      font: font,
      color: rgb(0, 0, 0)
    })
    yPosition -= 30

    // Invoice info
    const rightX = width - 200
    page.drawText('Invoice Date:', {
      x: rightX,
      y: yPosition + 20,
      size: 12,
      font: font,
      color: rgb(0, 0, 0)
    })
    page.drawText(new Date(invoice.created_at).toLocaleDateString(), {
      x: rightX + 80,
      y: yPosition + 20,
      size: 12,
      font: font,
      color: rgb(0, 0, 0)
    })

    page.drawText('Due Date:', {
      x: rightX,
      y: yPosition,
      size: 12,
      font: font,
      color: rgb(0, 0, 0)
    })
    page.drawText(new Date(invoice.due_date).toLocaleDateString(), {
      x: rightX + 80,
      y: yPosition,
      size: 12,
      font: font,
      color: rgb(0, 0, 0)
    })
    yPosition -= 50

    // Items table header
    page.drawText('Description', {
      x: 50,
      y: yPosition,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0)
    })
    page.drawText('Qty', {
      x: 300,
      y: yPosition,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0)
    })
    page.drawText('Rate', {
      x: 350,
      y: yPosition,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0)
    })
    page.drawText('Amount', {
      x: 450,
      y: yPosition,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0)
    })
    yPosition -= 30

    // Items
    invoice.invoice_items.forEach((item: { description: string; quantity: number; rate: number; amount: number }) => {
      page.drawText(item.description, {
        x: 50,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0, 0, 0)
      })
      page.drawText(item.quantity.toString(), {
        x: 300,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0, 0, 0)
      })
      page.drawText(`$${item.rate.toFixed(2)}`, {
        x: 350,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0, 0, 0)
      })
      page.drawText(`$${item.amount.toFixed(2)}`, {
        x: 450,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0, 0, 0)
      })
      yPosition -= 20
    })

    yPosition -= 20

    // Totals
    page.drawText('Subtotal:', {
      x: 350,
      y: yPosition,
      size: 12,
      font: font,
      color: rgb(0, 0, 0)
    })
    page.drawText(`$${invoice.subtotal.toFixed(2)}`, {
      x: 450,
      y: yPosition,
      size: 12,
      font: font,
      color: rgb(0, 0, 0)
    })
    yPosition -= 20

    if (invoice.tax_rate > 0) {
      page.drawText(`Tax (${invoice.tax_rate}%):`, {
        x: 350,
        y: yPosition,
        size: 12,
        font: font,
        color: rgb(0, 0, 0)
      })
      page.drawText(`$${invoice.tax_amount.toFixed(2)}`, {
        x: 450,
        y: yPosition,
        size: 12,
        font: font,
        color: rgb(0, 0, 0)
      })
      yPosition -= 20
    }

    page.drawText('Total:', {
      x: 350,
      y: yPosition,
      size: 14,
      font: boldFont,
      color: rgb(0, 0, 0)
    })
    page.drawText(`$${invoice.total.toFixed(2)}`, {
      x: 450,
      y: yPosition,
      size: 14,
      font: boldFont,
      color: rgb(0, 0, 0)
    })

    // Footer
    yPosition = 100
    page.drawText('Thank you for your business!', {
      x: 50,
      y: yPosition,
      size: 12,
      font: font,
      color: rgb(0.5, 0.5, 0.5)
    })

    const pdfBytes = await pdfDoc.save()

    // Store PDF in Supabase Storage
    const fileName = `invoice-${invoice.invoice_number}.pdf`
    const { error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(fileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true
      })

    if (uploadError) {
      console.error('Error uploading PDF:', uploadError)
    }

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`
      }
    })

  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
