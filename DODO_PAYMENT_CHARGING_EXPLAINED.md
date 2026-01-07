# How Charging Works in Dodo Payment

## 🔍 Current Situation

You're seeing the amount being **tracked** in your database (`billing_records` table), but you want to know how the **actual charge** happens in Dodo Payment.

## 📊 Current Flow

### What's Happening Now:
1. **User sends invoice** → `chargeForInvoice()` is called
2. **System creates payment link** → Dodo Payment checkout session created
3. **Billing record created** → Status: `pending` in your database
4. **Payment link created** → But user needs to pay via link (or Dodo processes automatically)

### The Problem:
- We're creating a **payment link** (checkout session)
- But we're **not directly charging** the customer
- The charge happens when user clicks the payment link OR if Dodo supports automatic processing

## 🎯 How It Should Work (True Automatic Charging)

### Option A: Direct Charge API (If Dodo Supports It)
```
User sends invoice
    ↓
chargeForInvoice() called
    ↓
Call Dodo Payment API: POST /payments or /charges
    ↓
Pass customer_id + amount
    ↓
Dodo charges customer directly (no link needed)
    ↓
Webhook confirms → billing_record.status = 'paid'
```

### Option B: Checkout with Auto-Processing (Current)
```
User sends invoice
    ↓
chargeForInvoice() called
    ↓
Create checkout session with customer_id
    ↓
Dodo Payment processes automatically (if customer has saved payment method)
    ↓
Webhook confirms → billing_record.status = 'paid'
```

## 🔧 What I've Implemented

I've added a new `chargeCustomer()` method that:

1. **Tries direct charge first**:
   - Attempts `/payments`, `/charges`, `/v1/payments`, etc.
   - Passes `customer_id` + `amount`
   - If successful → Customer charged directly ✅

2. **Falls back to checkout**:
   - If direct charge not supported
   - Creates checkout session with `customer_id`
   - Dodo may auto-process if customer has saved payment method

## 📝 How to Check What's Happening

### Check Vercel Logs:
When user sends invoice, look for:
```
💳 Attempting automatic charge for customer: dodo_customer_123
🔍 Trying to charge customer via: https://test.dodopayments.com/payments
```

### Check Dodo Payment Dashboard:
1. Go to Dodo Payment Dashboard
2. Check "Payments" or "Transactions"
3. See if charges are being created automatically

### Check Your Database:
```sql
SELECT * FROM billing_records 
WHERE type = 'per_invoice_fee' 
ORDER BY created_at DESC;
```

Look for:
- `status` = 'pending' → Payment link created, waiting for payment
- `status` = 'paid' → Payment confirmed via webhook

## ⚠️ Important Notes

### Dodo Payment API Limitations:
1. **May not support direct charging**:
   - Some payment providers only support checkout sessions
   - Direct charge API might not exist

2. **Checkout with customer ID**:
   - If customer has saved payment method
   - Dodo might auto-process the checkout
   - User might not need to click anything

3. **Webhook confirmation**:
   - Even if charge is automatic
   - Webhook confirms the payment
   - Updates `billing_records.status` to 'paid'

## 🚀 Next Steps

1. **Test the new implementation**:
   - Send an invoice
   - Check Vercel logs for charge attempts
   - See which endpoint works

2. **Check Dodo Payment documentation**:
   - Look for "charge customer" or "direct payment" API
   - Check if they support automatic charging

3. **Monitor webhook**:
   - Check if webhooks are confirming payments
   - Verify `billing_records.status` updates to 'paid'

## 💡 If Direct Charge Doesn't Work

If Dodo Payment doesn't support direct charging:

1. **Use checkout sessions** (current approach)
2. **Make it seamless**:
   - Auto-redirect user to payment link
   - Or process in background
   - Show "Processing payment..." message

3. **Track payment status**:
   - Webhook will confirm when paid
   - Update UI accordingly

## 🔍 Debugging

To see what's happening, check:

1. **Vercel Logs**:
   ```
   💳 Attempting automatic charge...
   🔍 Trying to charge customer via...
   ✅ SUCCESS! Direct charge created
   OR
   ⚠️ Direct charge API not found, falling back to checkout
   ```

2. **Dodo Payment Dashboard**:
   - Check if payments are being created
   - See payment status

3. **Database**:
   - Check `billing_records` table
   - See payment status and timestamps

