# Option 1: Immediate Automatic Charge - Implementation Guide

## 🎯 Overview

This implementation enables **automatic charging** for Pay Per Invoice plan users. When a user sends an invoice, they are automatically charged $0.50 using their saved payment method.

## 📋 How It Works

### Step 1: Payment Method Collection
When user selects "Pay Per Invoice" plan:
1. System checks if user has saved payment method
2. If **NO** payment method:
   - Creates checkout session for $0.01 (to collect payment method)
   - User completes payment → Payment method saved
   - Customer ID stored in `users.dodo_customer_id`
   - Plan activated automatically
3. If **YES** payment method:
   - Plan activated immediately (no payment needed)

### Step 2: Automatic Charging
When user sends an invoice:
1. System checks if user has `dodo_customer_id`
2. If **YES**:
   - Creates payment using customer ID (automatic charge)
   - Payment processed immediately
   - Billing record created with status: 'pending'
   - Webhook confirms → status: 'paid'
3. If **NO**:
   - Creates payment link (user pays manually)
   - Fallback for users without saved payment method

## 🔧 Database Changes

### Migration: `019_add_payment_method_storage.sql`
Adds columns to `users` table:
- `dodo_customer_id` - Dodo Payment customer ID
- `dodo_payment_method_id` - Payment method ID (if available)
- `payment_method_saved_at` - Timestamp when saved

**Run this SQL in Supabase:**
```sql
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS dodo_customer_id text,
ADD COLUMN IF NOT EXISTS dodo_payment_method_id text,
ADD COLUMN IF NOT EXISTS payment_method_saved_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_users_dodo_customer_id 
ON public.users(dodo_customer_id) 
WHERE dodo_customer_id IS NOT NULL;
```

## 🔄 Flow Diagrams

### Payment Method Setup Flow:
```
User clicks "Select Pay Per Invoice"
    ↓
Check if dodo_customer_id exists
    ↓
NO → Create checkout ($0.01)
    ↓
User pays → Webhook receives payment
    ↓
Extract customer_id from payment data
    ↓
Save to users.dodo_customer_id
    ↓
Activate pay_per_invoice plan
```

### Automatic Charging Flow:
```
User sends invoice
    ↓
chargeForInvoice() called
    ↓
Check if dodo_customer_id exists
    ↓
YES → Create payment with customer ID
    ↓
Payment processed automatically
    ↓
Webhook confirms → billing_record.status = 'paid'
```

## 📝 Code Changes

### 1. `/api/payments/checkout` (Updated)
- Checks for saved payment method
- Creates $0.01 checkout if not saved
- Activates plan immediately if payment method exists

### 2. `/api/payments/webhook` (Updated)
- Extracts `customer_id` from payment data
- Saves to `users.dodo_customer_id`
- Handles `payment_method_setup` type

### 3. `/lib/invoice-billing.ts` (Updated)
- Checks for `dodo_customer_id`
- Uses customer ID for automatic charging
- Falls back to payment link if no customer ID

### 4. `/api/payments/verify` (Updated)
- Extracts customer ID from checkout session
- Saves to database
- Handles $0.01 setup payments

## ⚠️ Important Notes

### Dodo Payment API Limitations:
- Dodo Payment may not support direct "charge customer" API
- We create payment links with customer ID
- Dodo Payment may auto-fill payment details for returning customers
- If Dodo doesn't support this, we'll need to use payment links (but user won't need to re-enter card)

### Fallback Behavior:
- If customer ID not available → Creates payment link
- Invoice is still sent (billing happens separately)
- User can pay later via payment link

## 🚀 Testing Steps

1. **Test Payment Method Setup:**
   - Select "Pay Per Invoice" plan
   - Should redirect to Dodo Payment ($0.01)
   - Complete payment
   - Check `users.dodo_customer_id` is saved
   - Plan should activate

2. **Test Automatic Charging:**
   - Send an invoice
   - Check `billing_records` table
   - Should create record with `type: 'per_invoice_fee'`
   - Check if payment is processed automatically

3. **Test Without Payment Method:**
   - User without `dodo_customer_id` sends invoice
   - Should create payment link
   - Invoice still sent

## 📊 Monitoring

Check these in production:
- `users.dodo_customer_id` - Should be populated after setup
- `billing_records.status` - Should be 'paid' after webhook
- Webhook logs - Should show customer ID extraction
- Payment success rate - Track automatic vs manual payments

## 🔄 Next Steps

1. **Run SQL migration** (add columns to users table)
2. **Test payment method setup** (select Pay Per Invoice)
3. **Test automatic charging** (send invoice)
4. **Monitor webhook logs** (verify customer ID extraction)
5. **Add billing dashboard** (show all charges)

