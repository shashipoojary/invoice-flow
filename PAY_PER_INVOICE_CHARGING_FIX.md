# Pay Per Invoice Charging - Issues Fixed

## 🔍 Issues Found and Fixed

### Issue 1: Send Route Not Passing Invoice Data ✅ FIXED
**Problem:** When sending an invoice, the `chargeForInvoice()` function was called without passing `invoiceData` parameter, which meant:
- Premium feature detection didn't work
- Free invoice check always ran even for premium features
- Template, reminder count, and colors weren't being checked

**Fix:** Updated `src/app/api/invoices/send/route.ts` to pass invoice data:
```typescript
const chargeResult = await chargeForInvoice(
  user.id, 
  invoiceId, 
  invoice.invoice_number,
  {
    template: invoiceTheme?.template || 1,
    reminderCount: reminderCount,
    primaryColor: invoiceTheme?.primary_color || invoiceTheme?.primaryColor,
    secondaryColor: invoiceTheme?.secondary_color || invoiceTheme?.secondaryColor
  }
);
```

### Issue 2: Better Error Logging ✅ ADDED
**Problem:** When Dodo Payment client is not configured, error message wasn't clear.

**Fix:** Added better error logging to identify configuration issues.

## 🧪 How to Test if Charging is Working

### Step 1: Check Environment Variables
Make sure these are set in Vercel:
```env
DODO_PAYMENT_API_KEY=your-api-key
DODO_PAYMENT_ENVIRONMENT=sandbox
```

### Step 2: Check User Plan
Verify user is on `pay_per_invoice` plan:
```sql
SELECT id, subscription_plan FROM users WHERE id = 'user-id';
```

### Step 3: Check Logs When Sending Invoice
Look for these logs in Vercel:
1. `💰 Attempting to charge for invoice: <invoiceId>`
2. `💳 chargeForInvoice called: userId=..., invoiceId=...`
3. `📋 User subscription plan: pay_per_invoice`
4. `✅ User is on pay_per_invoice plan, proceeding with charge...`

### Step 4: Check Billing Records
After sending invoice, check if billing record was created:
```sql
SELECT * FROM billing_records 
WHERE user_id = 'user-id' 
AND invoice_id = 'invoice-id'
ORDER BY created_at DESC;
```

## 🔍 Debugging Checklist

### If charging is not happening:

1. **Check if function is called:**
   - Look for log: `💰 Attempting to charge for invoice`
   - If missing → Invoice send route not calling chargeForInvoice

2. **Check user plan:**
   - Look for log: `📋 User subscription plan: <plan>`
   - If not `pay_per_invoice` → User not on correct plan

3. **Check free invoice count:**
   - Look for log: `🎁 Free invoice!` or `💰 User has used X free invoices`
   - If free invoice → First 5 invoices are free (basic features only)

4. **Check premium features:**
   - Look for log: `💎 Premium features detected`
   - Premium features bypass free invoice check

5. **Check Dodo Payment client:**
   - Look for log: `❌ Dodo Payment client not available`
   - If present → `DODO_PAYMENT_API_KEY` not configured

6. **Check customer ID:**
   - Look for log: `👤 User profile: { hasCustomerId: true/false }`
   - If false → User needs to set up payment method first

7. **Check billing record:**
   - Query `billing_records` table
   - Should have record with `type: 'per_invoice_fee'` and `status: 'pending'` or `'paid'`

## 📊 Expected Flow

### For Basic Features (First 5 Invoices):
```
User sends invoice
    ↓
chargeForInvoice() called
    ↓
Check: User on pay_per_invoice? → YES
    ↓
Check: Premium features? → NO
    ↓
Check: Free invoice count < 5? → YES
    ↓
🎁 Free invoice! No charge
    ↓
Return success (no charge)
```

### For Premium Features or After 5 Free:
```
User sends invoice
    ↓
chargeForInvoice() called
    ↓
Check: User on pay_per_invoice? → YES
    ↓
Check: Premium features OR free count >= 5? → YES
    ↓
Check: Has dodo_customer_id? → YES/NO
    ↓
    ├─ YES → Automatic charge $0.50
    └─ NO → Create payment link
    ↓
Create billing record (status: pending)
    ↓
Webhook confirms → status: paid
```

## 🚨 Common Issues

### Issue: "Payment service not configured"
**Solution:** Add `DODO_PAYMENT_API_KEY` to Vercel environment variables

### Issue: "User not on pay_per_invoice plan"
**Solution:** Update user's subscription plan:
```sql
UPDATE users SET subscription_plan = 'pay_per_invoice' WHERE id = 'user-id';
```

### Issue: No billing record created
**Possible causes:**
- Function not being called (check logs)
- User not on pay_per_invoice plan
- Free invoice (first 5 are free)
- Error in chargeForInvoice (check logs)

### Issue: Billing record created but status stays 'pending'
**Solution:** 
- Check webhook is configured
- Check webhook is receiving events
- Payment may still be processing

## ✅ What Was Fixed

1. ✅ Send route now passes invoice data for premium feature detection
2. ✅ Better error logging for debugging
3. ✅ Premium features now correctly bypass free invoice check when sending

## 📝 Next Steps

If charging still doesn't work after these fixes:
1. Check Vercel logs for the specific error
2. Verify `DODO_PAYMENT_API_KEY` is set correctly
3. Check if user has `dodo_customer_id` set (for automatic charging)
4. Verify billing records are being created in database

