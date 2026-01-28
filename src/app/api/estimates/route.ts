import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all estimates for the user
    const { data: estimates, error } = await supabaseAdmin
      .from('estimates')
      .select(`
        *,
        clients (
          id,
          name,
          email,
          company,
          phone,
          address
        ),
        estimate_items (
          id,
          description,
          qty,
          rate,
          line_total
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching estimates:', error);
      return NextResponse.json({ error: 'Failed to fetch estimates' }, { status: 500 });
    }

    // Check and update expired estimates
    const currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)
    
    for (const estimate of estimates) {
      if (estimate.expiry_date && estimate.status === 'sent' && estimate.approval_status === 'pending') {
        const expiryDate = new Date(estimate.expiry_date)
        expiryDate.setHours(0, 0, 0, 0)
        if (expiryDate < currentDate) {
          // Update status to expired
          await supabaseAdmin
            .from('estimates')
            .update({ status: 'expired' })
            .eq('id', estimate.id)
          estimate.status = 'expired'
        }
      }
    }

    // Map to frontend format
    const mappedEstimates = estimates.map((estimate: any) => ({
      id: estimate.id,
      estimateNumber: estimate.estimate_number,
      public_token: estimate.public_token,
      clientId: estimate.client_id,
      client: estimate.clients,
      items: estimate.estimate_items.map((item: any) => ({
        id: item.id,
        description: item.description,
        rate: item.rate,
        qty: item.qty,
        amount: item.line_total,
      })),
      subtotal: parseFloat(estimate.subtotal),
      discount: parseFloat(estimate.discount || 0),
      taxRate: estimate.tax ? (parseFloat(estimate.tax) / (parseFloat(estimate.subtotal) - parseFloat(estimate.discount || 0))) * 100 : 0,
      taxAmount: parseFloat(estimate.tax || 0),
      total: parseFloat(estimate.total),
      status: estimate.status,
      approvalStatus: estimate.approval_status,
      approvedAt: estimate.approved_at,
      rejectedAt: estimate.rejected_at,
      rejectionReason: estimate.rejection_reason,
      convertedToInvoiceId: estimate.converted_to_invoice_id,
      expiryDate: estimate.expiry_date,
      createdAt: estimate.created_at,
      updatedAt: estimate.updated_at,
      notes: estimate.notes,
      clientName: estimate.clients.name,
      clientEmail: estimate.clients.email,
      clientCompany: estimate.clients.company,
      clientAddress: estimate.clients.address,
      issueDate: estimate.issue_date,
      paymentTerms: estimate.payment_terms ? JSON.parse(estimate.payment_terms) : null,
      theme: estimate.theme ? JSON.parse(estimate.theme) : null,
      currency: estimate.currency,
      exchange_rate: estimate.exchange_rate,
      base_currency_amount: estimate.base_currency_amount,
    }));

    return NextResponse.json({ estimates: mappedEstimates }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching estimates:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

