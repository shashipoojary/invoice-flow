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

    // Fetch invoices with client data
    const { data: invoicesData, error: invoicesError } = await supabaseAdmin
      .from('invoices')
      .select(`
        *,
        clients (
          name,
          email,
          company,
          address
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError)
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
    }

    // Fetch invoice items for each invoice
    const invoices = await Promise.all(
      (invoicesData || []).map(async (invoice) => {
        const { data: itemsData, error: itemsError } = await supabaseAdmin
          .from('invoice_items')
          .select('*')
          .eq('invoice_id', invoice.id)

        if (itemsError) {
          console.error('Error fetching invoice items:', itemsError)
        }

        return {
          ...invoice,
          // Map database fields to frontend interface
          invoiceNumber: invoice.invoice_number,
          dueDate: invoice.due_date,
          createdAt: invoice.created_at,
          updatedAt: invoice.updated_at,
          clientId: invoice.client_id, // Map client_id to clientId
          client: invoice.clients,
          // Map client fields to invoice level for easier access
          clientName: invoice.clients?.name || '',
          clientEmail: invoice.clients?.email || '',
          clientCompany: invoice.clients?.company || '',
          clientAddress: invoice.clients?.address || '',
          items: (itemsData || []).map(item => ({
            id: item.id,
            description: item.description,
            amount: item.line_total
          })),
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
                // Convert customRules to rules for frontend compatibility and ensure enabled property
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
        }
      })
    )

    return NextResponse.json({ invoices })

  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}