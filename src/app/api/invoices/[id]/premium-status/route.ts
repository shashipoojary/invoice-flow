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
    
    // First, check invoice metadata for premium_unlocked flag
    const { data: invoice } = await supabaseAdmin
      .from('invoices')
      .select('metadata')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    let metadataUnlocked = false;
    if (invoice?.metadata) {
      try {
        const metadata = typeof invoice.metadata === 'string' 
          ? JSON.parse(invoice.metadata) 
          : invoice.metadata;
        
        metadataUnlocked = metadata.premium_unlocked === true;
      } catch (error) {
        console.error('Error parsing invoice metadata:', error)
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
      isPremiumUnlocked: isUnlocked
    })
  } catch (error) {
    console.error('Error checking premium status:', error)
    return NextResponse.json({ isPremiumUnlocked: false })
  }
}

