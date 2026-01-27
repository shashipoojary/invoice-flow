import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-middleware'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    
    // CRITICAL FIX: Check user's subscription plan first
    // Monthly plan users have unlimited access to all premium features
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('subscription_plan')
      .eq('id', user.id)
      .single()
    
    const userPlan = userData?.subscription_plan || 'free'
    
    // Monthly plan users: Always unlock all templates (no restrictions)
    if (userPlan === 'monthly') {
      return NextResponse.json({
        isPremiumUnlocked: true,
        unlockedTemplate: null // null means all templates unlocked
      })
    }
    
    // First, check invoice metadata for premium_unlocked flag
    const { data: invoice } = await supabaseAdmin
      .from('invoices')
      .select('metadata, status, theme')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    let metadataUnlocked = false;
    let unlockedTemplate = null;
    if (invoice?.metadata) {
      try {
        const metadata = typeof invoice.metadata === 'string' 
          ? JSON.parse(invoice.metadata) 
          : invoice.metadata;
        
        metadataUnlocked = metadata.premium_unlocked === true;
        unlockedTemplate = metadata.unlocked_template || null;
      } catch (error) {
        console.error('Error parsing invoice metadata:', error)
      }
    }
    
    // CRITICAL FIX: For draft invoices, also check if theme has premium template
    // This handles cases where premium unlock was set but metadata wasn't saved yet
    // Template in database is stored in UI format (1, 2, 3), not PDF format
    if (!metadataUnlocked && invoice?.status === 'draft' && invoice?.theme) {
      try {
        const invoiceTheme = typeof invoice.theme === 'string' 
          ? JSON.parse(invoice.theme) 
          : invoice.theme;
        const templateId = invoiceTheme?.template;
        // If draft has premium template (2 or 3), unlock optimistically
        // Template is already in UI format (1, 2, 3), so check directly
        if (templateId === 2 || templateId === 3) {
          metadataUnlocked = true;
          unlockedTemplate = templateId;
        }
      } catch (error) {
        console.error('Error parsing invoice theme for draft unlock:', error)
      }
    }
    
    // Also check if invoice has billing record (pending or paid) for premium features
    const { data: billingRecord } = await supabaseAdmin
      .from('billing_records')
      .select('id, status')
      .eq('invoice_id', id)
      .eq('user_id', user.id)
      .eq('type', 'per_invoice_fee')
      .in('status', ['pending', 'paid'])
      .maybeSingle()

    // Return true if either metadata shows premium_unlocked OR billing record exists
    const isUnlocked = metadataUnlocked || !!billingRecord;

    return NextResponse.json({
      isPremiumUnlocked: isUnlocked,
      unlockedTemplate: unlockedTemplate || null
    })
  } catch (error) {
    console.error('Error checking premium status:', error)
    return NextResponse.json({ isPremiumUnlocked: false })
  }
}

