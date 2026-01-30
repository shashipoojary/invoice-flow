import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchExchangeRate } from '@/lib/currency';

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
      taxId: settings.tax_id || '',
      isTaxRegistered: settings.is_tax_registered || false,
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
      taxId: '',
      isTaxRegistered: false,
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
      tax_id: settingsData.taxId || '',
      is_tax_registered: settingsData.isTaxRegistered || false,
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
        
        // Convert all existing invoices and estimates to the new base currency
        // IMPORTANT: We do NOT change the invoice/estimate currency itself - that stays as-is
        // We only update exchange_rate and base_currency_amount to reflect the new base currency
        const oldBaseCurrency = existingSettings.base_currency;
        const newBaseCurrency = settings.base_currency;
        
        // Get the exchange rate provided by user (from old base to new base)
        const userProvidedExchangeRate = settingsData.exchangeRate ? parseFloat(settingsData.exchangeRate.toString()) : null;
        
        // Fetch all invoices
        const { data: invoices, error: invoicesError } = await supabase
          .from('invoices')
          .select('id, currency, total, exchange_rate, base_currency_amount')
          .eq('user_id', user.id);
        
        if (invoicesError) {
          console.error('Error fetching invoices for conversion:', invoicesError);
        } else if (invoices && invoices.length > 0) {
          // Process each invoice
          for (const invoice of invoices) {
            // Get invoice currency - this NEVER changes, it's what the invoice was sent in
            const invoiceCurrency = invoice.currency || oldBaseCurrency;
            let newExchangeRate = 1.0;
            let newBaseCurrencyAmount = invoice.total;
            
            if (invoiceCurrency === newBaseCurrency) {
              // Invoice currency matches new base currency - no conversion needed
              newExchangeRate = 1.0;
              newBaseCurrencyAmount = invoice.total;
            } else {
              // Invoice currency differs from new base currency - need to recalculate conversion
              
              // First, check if invoice was in the old base currency
              if (invoiceCurrency === oldBaseCurrency) {
                // Invoice was in old base currency - use user-provided exchange rate
                if (userProvidedExchangeRate && userProvidedExchangeRate > 0) {
                  newExchangeRate = userProvidedExchangeRate;
                  newBaseCurrencyAmount = Math.round((invoice.total * userProvidedExchangeRate) * 100) / 100;
                  } else {
                    // Fallback: try to fetch exchange rate
                    const oldToNewRate = await fetchExchangeRate(oldBaseCurrency, newBaseCurrency);
                    if (oldToNewRate && oldToNewRate > 0) {
                      newExchangeRate = oldToNewRate;
                      newBaseCurrencyAmount = Math.round((invoice.total * oldToNewRate) * 100) / 100;
                    } else {
                      // Skip this invoice if we can't get exchange rate
                      continue;
                    }
                  }
              } else {
                // Invoice was in a different currency - need to convert via old base currency
                // Example: Invoice in EUR, old base USD, new base INR
                // We know EUR -> USD (old exchange_rate), need USD -> INR (user-provided rate)
                const oldExchangeRate = invoice.exchange_rate || 1.0;
                const oldBaseAmount = invoice.base_currency_amount || (invoice.total * oldExchangeRate);
                
                // Use user-provided rate from old base to new base
                if (userProvidedExchangeRate && userProvidedExchangeRate > 0) {
                  // Calculate new exchange rate: invoice currency -> old base -> new base
                  // newExchangeRate = (invoice -> old base) * (old base -> new base)
                  newExchangeRate = oldExchangeRate * userProvidedExchangeRate;
                  // Convert old base amount to new base amount
                  newBaseCurrencyAmount = Math.round((oldBaseAmount * userProvidedExchangeRate) * 100) / 100;
                } else {
                  // Fallback: try to fetch exchange rate
                  const oldToNewRate = await fetchExchangeRate(oldBaseCurrency, newBaseCurrency);
                  if (oldToNewRate && oldToNewRate > 0) {
                    newExchangeRate = oldExchangeRate * oldToNewRate;
                    newBaseCurrencyAmount = Math.round((oldBaseAmount * oldToNewRate) * 100) / 100;
                  } else {
                    // Try direct conversion as last resort
                    const directRate = await fetchExchangeRate(invoiceCurrency, newBaseCurrency);
                    if (directRate && directRate > 0) {
                      newExchangeRate = directRate;
                      newBaseCurrencyAmount = Math.round((invoice.total * directRate) * 100) / 100;
                    } else {
                      // Skip this invoice if we can't get exchange rate
                      continue;
                    }
                  }
                }
              }
            }
            
            // Update ONLY exchange_rate and base_currency_amount - currency field stays unchanged
            const { error: updateError } = await supabase
              .from('invoices')
              .update({
                exchange_rate: newExchangeRate,
                base_currency_amount: newBaseCurrencyAmount,
                updated_at: new Date().toISOString()
              })
              .eq('id', invoice.id)
              .eq('user_id', user.id);
            
            if (updateError) {
              console.error(`Error updating invoice ${invoice.id}:`, updateError);
            }
          }
        }
        
        // Fetch all estimates
        const { data: estimates, error: estimatesError } = await supabase
          .from('estimates')
          .select('id, currency, total, exchange_rate, base_currency_amount')
          .eq('user_id', user.id);
        
        if (estimatesError) {
          console.error('Error fetching estimates for conversion:', estimatesError);
        } else if (estimates && estimates.length > 0) {
          // Process each estimate
          for (const estimate of estimates) {
            // Get estimate currency - this NEVER changes, it's what the estimate was sent in
            const estimateCurrency = estimate.currency || oldBaseCurrency;
            let newExchangeRate = 1.0;
            let newBaseCurrencyAmount = estimate.total;
            
            if (estimateCurrency === newBaseCurrency) {
              // Estimate currency matches new base currency - no conversion needed
              newExchangeRate = 1.0;
              newBaseCurrencyAmount = estimate.total;
            } else {
              // Estimate currency differs from new base currency - need to recalculate conversion
              
              // First, check if estimate was in the old base currency
              if (estimateCurrency === oldBaseCurrency) {
                // Estimate was in old base currency - use user-provided exchange rate
                if (userProvidedExchangeRate && userProvidedExchangeRate > 0) {
                  newExchangeRate = userProvidedExchangeRate;
                  newBaseCurrencyAmount = Math.round((estimate.total * userProvidedExchangeRate) * 100) / 100;
                  } else {
                    // Fallback: try to fetch exchange rate
                    const oldToNewRate = await fetchExchangeRate(oldBaseCurrency, newBaseCurrency);
                    if (oldToNewRate && oldToNewRate > 0) {
                      newExchangeRate = oldToNewRate;
                      newBaseCurrencyAmount = Math.round((estimate.total * oldToNewRate) * 100) / 100;
                    } else {
                      // Skip this estimate if we can't get exchange rate
                      continue;
                    }
                  }
              } else {
                // Estimate was in a different currency - need to convert via old base currency
                const oldExchangeRate = estimate.exchange_rate || 1.0;
                const oldBaseAmount = estimate.base_currency_amount || (estimate.total * oldExchangeRate);
                
                // Use user-provided rate from old base to new base
                if (userProvidedExchangeRate && userProvidedExchangeRate > 0) {
                  // Calculate new exchange rate: estimate currency -> old base -> new base
                  newExchangeRate = oldExchangeRate * userProvidedExchangeRate;
                  // Convert old base amount to new base amount
                  newBaseCurrencyAmount = Math.round((oldBaseAmount * userProvidedExchangeRate) * 100) / 100;
                } else {
                  // Fallback: try to fetch exchange rate
                  const oldToNewRate = await fetchExchangeRate(oldBaseCurrency, newBaseCurrency);
                  if (oldToNewRate && oldToNewRate > 0) {
                    newExchangeRate = oldExchangeRate * oldToNewRate;
                    newBaseCurrencyAmount = Math.round((oldBaseAmount * oldToNewRate) * 100) / 100;
                  } else {
                    // Try direct conversion as last resort
                    const directRate = await fetchExchangeRate(estimateCurrency, newBaseCurrency);
                    if (directRate && directRate > 0) {
                      newExchangeRate = directRate;
                      newBaseCurrencyAmount = Math.round((estimate.total * directRate) * 100) / 100;
                    } else {
                      // Skip this estimate if we can't get exchange rate
                      continue;
                    }
                  }
                }
              }
            }
            
            // Update ONLY exchange_rate and base_currency_amount - currency field stays unchanged
            const { error: updateError } = await supabase
              .from('estimates')
              .update({
                exchange_rate: newExchangeRate,
                base_currency_amount: newBaseCurrencyAmount,
                updated_at: new Date().toISOString()
              })
              .eq('id', estimate.id)
              .eq('user_id', user.id);
            
            if (updateError) {
              console.error(`Error updating estimate ${estimate.id}:`, updateError);
            }
          }
        }
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
