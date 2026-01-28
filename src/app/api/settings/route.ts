import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user settings
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('GET /api/settings - Settings error:', settingsError);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    // Return settings or default empty object - now with all payment method fields
    const formattedSettings = settings ? {
      businessName: settings.business_name || '',
      businessEmail: settings.business_email || '',
      businessPhone: settings.business_phone || '',
      address: settings.business_address || '',
      website: settings.website || '',
      logo: settings.logo || settings.logo_url || '', // Only use logo_url as fallback if logo is null/empty
      paypalEmail: settings.paypal_email || '',
      cashappId: settings.cashapp_id || '',
      venmoId: settings.venmo_id || '',
      googlePayUpi: settings.google_pay_upi || '',
      applePayId: settings.apple_pay_id || '',
      bankAccount: settings.bank_account || '',
      bankIfscSwift: settings.bank_ifsc_swift || '',
      bankIban: settings.bank_iban || '',
      stripeAccount: settings.stripe_account || '',
      paymentNotes: settings.payment_notes || '',
      baseCurrency: settings.base_currency || 'USD',
    } : {
      businessName: '',
      businessEmail: '',
      businessPhone: '',
      address: '',
      website: '',
      logo: '',
      paypalEmail: '',
      cashappId: '',
      venmoId: '',
      googlePayUpi: '',
      applePayId: '',
      bankAccount: '',
      bankIfscSwift: '',
      bankIban: '',
      stripeAccount: '',
      paymentNotes: '',
      baseCurrency: 'USD',
    };
    
    const response = NextResponse.json({ settings: formattedSettings });
    
    // Add caching headers for better performance
    response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
    
    return response;

  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const settingsData = await request.json();

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    

    // Prepare settings data - now with all payment method fields
    const settings = {
      user_id: user.id,
      business_name: settingsData.businessName || '',
      business_email: settingsData.businessEmail || user.email || '',
      business_phone: settingsData.businessPhone || '',
      business_address: settingsData.address || '',
      website: settingsData.website || '',
      logo: settingsData.logo && settingsData.logo.trim() !== '' ? settingsData.logo : null, // Set to null if empty
      logo_url: settingsData.logo && settingsData.logo.trim() !== '' ? settingsData.logo : null, // Also clear logo_url to prevent fallback
      paypal_email: settingsData.paypalEmail || '',
      cashapp_id: settingsData.cashappId || '',
      venmo_id: settingsData.venmoId || '',
      google_pay_upi: settingsData.googlePayUpi || '',
      apple_pay_id: settingsData.applePayId || '',
      bank_account: settingsData.bankAccount || '',
      bank_ifsc_swift: settingsData.bankIfscSwift || '',
      bank_iban: settingsData.bankIban || '',
      stripe_account: settingsData.stripeAccount || '',
      payment_notes: settingsData.paymentNotes || '',
      base_currency: settingsData.baseCurrency || 'USD',
      updated_at: new Date().toISOString(),
    };


    // Check if settings exist
    const { data: existingSettings } = await supabase
      .from('user_settings')
      .select('id, base_currency')
      .eq('user_id', user.id)
      .single();

    // Check if user has created any invoices/estimates
    const { count: invoiceCount } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    
    const { count: estimateCount } = await supabase
      .from('estimates')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    
    const hasCreatedInvoices = (invoiceCount || 0) > 0 || (estimateCount || 0) > 0;

    // If user has created invoices and is trying to change base currency, allow it
    // If user hasn't created invoices yet, allow setting it once
    if (existingSettings) {
      // Check if base currency is being changed
      const isChangingCurrency = existingSettings.base_currency && 
                                  existingSettings.base_currency !== settings.base_currency;
      
      if (isChangingCurrency && !hasCreatedInvoices) {
        // User hasn't created invoices yet, but trying to change currency - allow it (first time setup)
        // This is fine, they can set it once
      } else if (isChangingCurrency && hasCreatedInvoices) {
        // User has created invoices, allow currency change (they can change after first invoice)
        // This is the expected behavior
      }
      
      // Update existing settings
      const result = await supabase
        .from('user_settings')
        .update(settings)
        .eq('user_id', user.id);
      
      if (result.error) {
        console.error('Database error:', result.error);
        return NextResponse.json({ error: 'Failed to save settings', details: result.error }, { status: 500 });
      }
    } else {
      // Insert new settings (first time setup)
      const result = await supabase
        .from('user_settings')
        .insert(settings);
      
      if (result.error) {
        console.error('Database error:', result.error);
        return NextResponse.json({ error: 'Failed to save settings', details: result.error }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, message: 'Settings saved successfully' });

  } catch (error) {
    console.error('Settings save error:', error);
    return NextResponse.json({ error: 'Failed to save settings', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
