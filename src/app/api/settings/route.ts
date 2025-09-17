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
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    // Return settings or default empty object
    return NextResponse.json({ settings: settings || {} });

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Prepare settings data
    const settings = {
      user_id: user.id,
      business_name: settingsData.businessName || '',
      logo: settingsData.logo || '',
      address: settingsData.address || '',
      email: settingsData.email || user.email || '',
      phone: settingsData.phone || '',
      website: settingsData.website || '',
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
      return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Settings saved successfully' });

  } catch (error) {
    console.error('Settings save error:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
