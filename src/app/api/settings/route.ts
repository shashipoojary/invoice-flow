import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/settings - Fetching settings');
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('GET /api/settings - No auth header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.log('GET /api/settings - Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('GET /api/settings - User authenticated:', user.id);

    // Fetch user settings
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    console.log('GET /api/settings - Settings query result:', { settings, settingsError });

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.log('GET /api/settings - Settings error:', settingsError);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    // Return settings or default empty object - now with all payment method fields
    const formattedSettings = settings ? {
      businessName: settings.business_name || '',
      businessEmail: settings.business_email || '',
      businessPhone: settings.business_phone || '',
      address: settings.business_address || '',
      website: settings.website || '',
      logo: settings.logo || settings.logo_url || '',
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
    };
    
    return NextResponse.json({ settings: formattedSettings });

  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const settingsData = await request.json();
    console.log('Settings data received:', settingsData);

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
    
    console.log('User authenticated:', user.id);

    // Prepare settings data - now with all payment method fields
    const settings = {
      user_id: user.id,
      business_name: settingsData.businessName || '',
      business_email: settingsData.businessEmail || user.email || '',
      business_phone: settingsData.businessPhone || '',
      business_address: settingsData.address || '',
      website: settingsData.website || '',
      logo: settingsData.logo || '',
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
      updated_at: new Date().toISOString(),
    };

    console.log('Settings to save (with all payment methods):', settings);

    // Check if settings exist
    const { data: existingSettings } = await supabase
      .from('user_settings')
      .select('id')
      .eq('user_id', user.id)
      .single();

    let result;
    if (existingSettings) {
      // Update existing settings
      result = await supabase
        .from('user_settings')
        .update(settings)
        .eq('user_id', user.id);
    } else {
      // Insert new settings
      result = await supabase
        .from('user_settings')
        .insert(settings);
    }

    if (result.error) {
      console.error('Database error:', result.error);
      console.error('Error code:', result.error.code);
      console.error('Error message:', result.error.message);
      console.error('Error details:', result.error.details);
      return NextResponse.json({ error: 'Failed to save settings', details: result.error }, { status: 500 });
    }

    console.log('Settings saved successfully');
    return NextResponse.json({ success: true, message: 'Settings saved successfully' });

  } catch (error) {
    console.error('Settings save error:', error);
    return NextResponse.json({ error: 'Failed to save settings', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
