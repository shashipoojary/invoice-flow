-- Migration: Backfill snapshots for existing sent invoices and estimates
-- This script creates snapshots for invoices/estimates that were sent before the snapshot feature was added
-- Run this AFTER running add_snapshot_columns.sql

-- Backfill snapshots for invoices
-- This will create snapshots from current business settings and client data
-- Note: This uses CURRENT data, so it's best to run this immediately after adding snapshot columns
-- For invoices sent before snapshot feature, this preserves current state

UPDATE public.invoices
SET 
  business_settings_snapshot = (
    SELECT jsonb_build_object(
      'business_name', us.business_name,
      'business_email', us.business_email,
      'business_phone', us.business_phone,
      'business_address', us.business_address,
      'website', us.website,
      'logo', COALESCE(us.logo, us.logo_url, ''),
      'paypal_email', us.paypal_email,
      'cashapp_id', us.cashapp_id,
      'venmo_id', us.venmo_id,
      'google_pay_upi', us.google_pay_upi,
      'apple_pay_id', us.apple_pay_id,
      'bank_account', us.bank_account,
      'bank_ifsc_swift', us.bank_ifsc_swift,
      'bank_iban', us.bank_iban,
      'stripe_account', us.stripe_account,
      'payment_notes', us.payment_notes
    )
    FROM public.user_settings us
    WHERE us.user_id = invoices.user_id
    LIMIT 1
  ),
  client_data_snapshot = (
    SELECT jsonb_build_object(
      'name', c.name,
      'email', c.email,
      'company', c.company,
      'phone', c.phone,
      'address', c.address
    )
    FROM public.clients c
    WHERE c.id = invoices.client_id
    LIMIT 1
  )
WHERE 
  (status = 'sent' OR status = 'paid' OR status = 'pending')
  AND business_settings_snapshot IS NULL
  AND client_data_snapshot IS NULL;

-- Backfill snapshots for estimates
UPDATE public.estimates
SET 
  business_settings_snapshot = (
    SELECT jsonb_build_object(
      'business_name', us.business_name,
      'business_email', us.business_email,
      'business_phone', us.business_phone,
      'business_address', us.business_address,
      'website', us.website,
      'logo', COALESCE(us.logo, us.logo_url, ''),
      'paypal_email', us.paypal_email,
      'cashapp_id', us.cashapp_id,
      'venmo_id', us.venmo_id,
      'google_pay_upi', us.google_pay_upi,
      'apple_pay_id', us.apple_pay_id,
      'bank_account', us.bank_account,
      'bank_ifsc_swift', us.bank_ifsc_swift,
      'bank_iban', us.bank_iban,
      'stripe_account', us.stripe_account,
      'payment_notes', us.payment_notes
    )
    FROM public.user_settings us
    WHERE us.user_id = estimates.user_id
    LIMIT 1
  ),
  client_data_snapshot = (
    SELECT jsonb_build_object(
      'name', c.name,
      'email', c.email,
      'company', c.company,
      'phone', c.phone,
      'address', c.address
    )
    FROM public.clients c
    WHERE c.id = estimates.client_id
    LIMIT 1
  )
WHERE 
  (status = 'sent' OR status = 'approved' OR status = 'rejected' OR status = 'converted')
  AND business_settings_snapshot IS NULL
  AND client_data_snapshot IS NULL;

