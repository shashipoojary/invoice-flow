// Required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'
import { PDFDocument, rgb, StandardFonts } from '@react-pdf/renderer'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const invoiceId = searchParams.get('invoiceId')

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })
    }

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

    // Fetch invoice with client and items
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        clients (*),
        invoice_items (*)
      `)
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Check if PDF already exists
    const { data: existingPdf } = await supabase
      .from('invoice_pdfs')
      .select('storage_path')
      .eq('invoice_id', invoiceId)
      .single()

    if (existingPdf) {
      // Return existing PDF URL
      const { data: signedUrl } = await supabase.storage
        .from('invoice-pdfs')
        .createSignedUrl(existingPdf.storage_path, 3600) // 1 hour expiry

      return NextResponse.json({ pdf_url: signedUrl?.signedUrl })
    }

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoice)

    // Upload to Supabase Storage
    const fileName = `invoices/${user.id}/${invoiceId}.pdf`
    const { error: uploadError } = await supabase.storage
      .from('invoice-pdfs')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      })

    if (uploadError) {
      return NextResponse.json({ error: 'Failed to upload PDF' }, { status: 500 })
    }

    // Record PDF in database
    await supabase
      .from('invoice_pdfs')
      .insert({
        invoice_id: invoiceId,
        storage_path: fileName
      })

    // Return signed URL
    const { data: signedUrl } = await supabase.storage
      .from('invoice-pdfs')
      .createSignedUrl(fileName, 3600)

    return NextResponse.json({ pdf_url: signedUrl?.signedUrl })

  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function generateInvoicePDF(invoice: {
  invoice_number: string;
  created_at: string;
  due_date: string;
  branding: { business_name?: string; business_email?: string; business_phone?: string; business_address?: string };
  clients: { name: string; company?: string; email?: string; phone?: string; address?: string };
  invoice_items: Array<{ description: string; qty: number; rate: number; line_total: number }>;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
}) {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595.28, 841.89]) // A4 size
  const { width, height } = page.getSize()

  // Load fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // Colors
  const primaryColor = rgb(0.23, 0.51, 0.97) // Blue
  const textColor = rgb(0.2, 0.2, 0.2)
  const lightGray = rgb(0.9, 0.9, 0.9)

  // Header
  page.drawText('INVOICE', {
    x: 50,
    y: height - 100,
    size: 24,
    font: boldFont,
    color: primaryColor
  })

  page.drawText(`Invoice #: ${invoice.invoice_number}`, {
    x: 50,
    y: height - 130,
    size: 12,
    font: font,
    color: textColor
  })

  page.drawText(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, {
    x: 50,
    y: height - 150,
    size: 12,
    font: font,
    color: textColor
  })

  page.drawText(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, {
    x: 50,
    y: height - 170,
    size: 12,
    font: font,
    color: textColor
  })

  // Business info (right side)
  const businessName = invoice.branding?.business_name || 'Your Business'
  page.drawText(businessName, {
    x: width - 200,
    y: height - 100,
    size: 14,
    font: boldFont,
    color: textColor
  })

  // Client info
  page.drawText('Bill To:', {
    x: 50,
    y: height - 220,
    size: 12,
    font: boldFont,
    color: textColor
  })

  page.drawText(invoice.clients.name, {
    x: 50,
    y: height - 240,
    size: 12,
    font: font,
    color: textColor
  })

  if (invoice.clients.company) {
    page.drawText(invoice.clients.company, {
      x: 50,
      y: height - 260,
      size: 12,
      font: font,
      color: textColor
    })
  }

  if (invoice.clients.email) {
    page.drawText(invoice.clients.email, {
      x: 50,
      y: height - 280,
      size: 12,
      font: font,
      color: textColor
    })
  }

  // Items table header
  const tableY = height - 350
  page.drawRectangle({
    x: 50,
    y: tableY - 30,
    width: width - 100,
    height: 30,
    color: lightGray
  })

  page.drawText('Description', {
    x: 60,
    y: tableY - 20,
    size: 10,
    font: boldFont,
    color: textColor
  })

  page.drawText('Qty', {
    x: 350,
    y: tableY - 20,
    size: 10,
    font: boldFont,
    color: textColor
  })

  page.drawText('Rate', {
    x: 400,
    y: tableY - 20,
    size: 10,
    font: boldFont,
    color: textColor
  })

  page.drawText('Amount', {
    x: 500,
    y: tableY - 20,
    size: 10,
    font: boldFont,
    color: textColor
  })

  // Items
  let currentY = tableY - 50
    invoice.invoice_items.forEach((item) => {
    page.drawText(item.description, {
      x: 60,
      y: currentY,
      size: 10,
      font: font,
      color: textColor
    })

    page.drawText(item.qty.toString(), {
      x: 350,
      y: currentY,
      size: 10,
      font: font,
      color: textColor
    })

    page.drawText(`₹${item.rate.toLocaleString()}`, {
      x: 400,
      y: currentY,
      size: 10,
      font: font,
      color: textColor
    })

    page.drawText(`₹${item.line_total.toLocaleString()}`, {
      x: 500,
      y: currentY,
      size: 10,
      font: font,
      color: textColor
    })

    currentY -= 20
  })

  // Totals
  const totalsY = currentY - 30
  page.drawText('Subtotal:', {
    x: 400,
    y: totalsY,
    size: 12,
    font: font,
    color: textColor
  })

  page.drawText(`₹${invoice.subtotal.toLocaleString()}`, {
    x: 500,
    y: totalsY,
    size: 12,
    font: font,
    color: textColor
  })

  page.drawText('Tax (18%):', {
    x: 400,
    y: totalsY - 20,
    size: 12,
    font: font,
    color: textColor
  })

  page.drawText(`₹${invoice.tax.toLocaleString()}`, {
    x: 500,
    y: totalsY - 20,
    size: 12,
    font: font,
    color: textColor
  })

  page.drawText('Total:', {
    x: 400,
    y: totalsY - 40,
    size: 14,
    font: boldFont,
    color: textColor
  })

  page.drawText(`₹${invoice.total.toLocaleString()}`, {
    x: 500,
    y: totalsY - 40,
    size: 14,
    font: boldFont,
    color: textColor
  })

  // Notes
  if (invoice.notes) {
    page.drawText('Notes:', {
      x: 50,
      y: totalsY - 80,
      size: 12,
      font: boldFont,
      color: textColor
    })

    page.drawText(invoice.notes, {
      x: 50,
      y: totalsY - 100,
      size: 10,
      font: font,
      color: textColor
    })
  }

  // Footer
  page.drawText('Thank you for your business!', {
    x: 50,
    y: 50,
    size: 10,
    font: font,
    color: textColor
  })

  // Serialize the PDF
  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}
