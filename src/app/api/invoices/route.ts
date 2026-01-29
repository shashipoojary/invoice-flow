import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAuthenticatedUser } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch invoices with client data and snapshot fields
    // CRITICAL: Include snapshot fields so frontend can use original business/client data for sent invoices
    const { data: invoicesData, error: invoicesError } = await supabaseAdmin
      .from('invoices')
      .select(`
        *,
        business_settings_snapshot,
        client_data_snapshot,
        clients (
          id,
          name,
          email,
          company,
          phone,
          address
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError)
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
    }

    const invoiceIds = (invoicesData || []).map(inv => inv.id);

    // Fetch invoice items AND payments in parallel for ALL invoices at once
    const [itemsResponse, paymentsResponse] = await Promise.all([
      supabaseAdmin
        .from('invoice_items')
        .select('*')
        .in('invoice_id', invoiceIds),
      supabaseAdmin
        .from('invoice_payments')
        .select('invoice_id, amount')
        .in('invoice_id', invoiceIds)
    ]);

    const { data: allItemsData, error: itemsError } = itemsResponse;
    const { data: allPaymentsData, error: paymentsError } = paymentsResponse;

    if (itemsError) {
      console.error('Error fetching invoice items:', itemsError);
    }
    if (paymentsError) {
      console.error('Error fetching invoice payments:', paymentsError);
    }

    // Group items by invoice_id
    const itemsByInvoice: Record<string, any[]> = {};
    (allItemsData || []).forEach(item => {
      if (!itemsByInvoice[item.invoice_id]) {
        itemsByInvoice[item.invoice_id] = [];
      }
      itemsByInvoice[item.invoice_id].push(item);
    });

    // Group payments by invoice_id and calculate totals
    const paymentsByInvoice: Record<string, number> = {};
    (allPaymentsData || []).forEach(payment => {
      const invoiceId = payment.invoice_id;
      const amount = parseFloat(payment.amount.toString());
      paymentsByInvoice[invoiceId] = (paymentsByInvoice[invoiceId] || 0) + amount;
    });

    // Map invoices with all related data
    const invoices = (invoicesData || []).map((invoice) => {
      const itemsData = itemsByInvoice[invoice.id] || [];
      const totalPaid = paymentsByInvoice[invoice.id] || 0;
      const remainingBalance = Math.max(0, invoice.total - totalPaid);

      // CRITICAL: Use client snapshot if available (for sent invoices)
      // This ensures the API returns original client data from when invoice was sent
      let clientData = invoice.clients;
      let clientName = invoice.clients?.name || '';
      let clientEmail = invoice.clients?.email || '';
      let clientCompany = invoice.clients?.company || '';
      let clientPhone = invoice.clients?.phone || '';
      let clientAddress = invoice.clients?.address || '';
      
      if (invoice.client_data_snapshot && invoice.status !== 'draft') {
        // Use stored snapshot - invoice was already sent
        clientData = {
          id: invoice.clients?.id || invoice.client_id,
          name: invoice.client_data_snapshot.name || invoice.clients?.name || '',
          email: invoice.client_data_snapshot.email || invoice.clients?.email || '',
          company: invoice.client_data_snapshot.company || invoice.clients?.company || '',
          phone: invoice.client_data_snapshot.phone || invoice.clients?.phone || '',
          address: invoice.client_data_snapshot.address || invoice.clients?.address || ''
        };
        clientName = invoice.client_data_snapshot.name || '';
        clientEmail = invoice.client_data_snapshot.email || '';
        clientCompany = invoice.client_data_snapshot.company || '';
        clientPhone = invoice.client_data_snapshot.phone || '';
        clientAddress = invoice.client_data_snapshot.address || '';
      }

      return {
        ...invoice,
        // CRITICAL: Include snapshot fields for frontend use
        business_settings_snapshot: invoice.business_settings_snapshot,
        client_data_snapshot: invoice.client_data_snapshot,
        // Map database fields to frontend interface
        invoiceNumber: invoice.invoice_number,
        issueDate: invoice.issue_date,
        dueDate: invoice.due_date,
        createdAt: invoice.created_at,
        updatedAt: invoice.updated_at,
        clientId: invoice.client_id,
        client: clientData, // Use snapshot client data if available
        // Map client fields to invoice level for easier access
        clientName: clientName,
        clientEmail: clientEmail,
        clientCompany: clientCompany,
        clientPhone: clientPhone,
        clientAddress: clientAddress,
        discount: invoice.discount || 0,
        // Tax mapping - map database field 'tax' to frontend 'taxAmount'
        taxAmount: invoice.tax || 0,
        taxRate: invoice.tax && invoice.subtotal ? Math.round(((invoice.tax / (invoice.subtotal - (invoice.discount || 0))) * 100) * 100) / 100 : 0,
        items: itemsData.map(item => ({
          id: item.id,
          description: item.description,
          amount: item.line_total,
          qty: item.qty || 1,
          rate: item.rate || item.line_total
        })),
        // Include payment data as DIRECT properties (not nested) for instant access
        totalPaid: totalPaid,
        remainingBalance: remainingBalance,
        // Write-off fields
        writeOffAmount: invoice.write_off_amount || 0,
        writeOffNotes: invoice.write_off_notes || undefined,
        // Multi-currency support
        currency: invoice.currency || 'USD',
        exchange_rate: invoice.exchange_rate || 1.0,
        base_currency_amount: invoice.base_currency_amount || invoice.total,
        // Parse JSON fields with fallbacks for existing invoices (only for detailed invoices)
        paymentTerms: invoice.type === 'fast' ? undefined : 
          (invoice.payment_terms ? 
            (typeof invoice.payment_terms === 'string' ? JSON.parse(invoice.payment_terms) : invoice.payment_terms) : 
            { enabled: true, terms: 'Net 30' }),
        lateFees: invoice.type === 'fast' ? undefined : 
          (invoice.late_fees ? 
            (typeof invoice.late_fees === 'string' ? JSON.parse(invoice.late_fees) : invoice.late_fees) : 
            { enabled: true, type: 'fixed', amount: 50, gracePeriod: 7 }),
        reminders: invoice.type === 'fast' ? undefined : 
          (invoice.reminder_settings ? 
            (() => {
              const settings = typeof invoice.reminder_settings === 'string' ? JSON.parse(invoice.reminder_settings) : invoice.reminder_settings;
              const rules = settings.customRules || settings.rules || [];
              const rulesWithEnabled = rules.map((rule: any) => ({
                ...rule,
                enabled: rule.enabled !== undefined ? rule.enabled : true
              }));
              return {
                ...settings,
                rules: rulesWithEnabled
              };
            })() : 
            { enabled: false, useSystemDefaults: true, rules: [] }),
        theme: invoice.type === 'fast' ? undefined : 
          (invoice.theme ? 
            (typeof invoice.theme === 'string' ? JSON.parse(invoice.theme) : invoice.theme) : 
            undefined),
      };
    });

    return NextResponse.json({ invoices })

  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}