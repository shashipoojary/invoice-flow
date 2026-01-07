# Debugging Invoice Charging Issue

## 🔍 Problem

When sending an invoice in "Pay Per Invoice" mode, you're not seeing any charging logs in Vercel.

## 📊 What to Look For

After deploying the new logging, when you send an invoice, you should see these logs:

### Expected Logs:

1. **Invoice Send Route:**
   ```
   💰 Attempting to charge for invoice: <invoiceId> (<invoiceNumber>)
   ```

2. **chargeForInvoice Function:**
   ```
   💳 chargeForInvoice called: userId=..., invoiceId=..., invoiceNumber=...
   📋 User subscription plan: pay_per_invoice
   ✅ User is on pay_per_invoice plan, proceeding with charge...
   ```

3. **User Profile Check:**
   ```
   👤 User profile: {
     email: "...",
     hasCustomerId: true/false,
     hasPaymentMethod: true/false
   }
   ```

4. **Charge Attempt:**
   ```
   💳 Attempting automatic charge for customer: <customerId>
   🔍 Trying to charge customer via: https://test.dodopayments.com/payments
   ```

## 🚨 If You Don't See These Logs

### Scenario 1: No "💰 Attempting to charge" log
**Problem:** `chargeForInvoice()` is not being called
**Check:**
- Is the invoice status changing from 'draft' to 'sent'?
- Is the user actually on 'pay_per_invoice' plan?
- Check if there's an error before the charge call

### Scenario 2: See "💰 Attempting" but no "💳 chargeForInvoice called"
**Problem:** Function is being called but failing immediately
**Check:**
- Check for errors in logs
- Verify user exists in database

### Scenario 3: See "📋 User subscription plan: free" or "monthly"
**Problem:** User is not on 'pay_per_invoice' plan
**Solution:** 
- Check user's subscription in database:
  ```sql
  SELECT subscription_plan FROM users WHERE id = '<userId>';
  ```
- Update if needed:
  ```sql
  UPDATE users SET subscription_plan = 'pay_per_invoice' WHERE id = '<userId>';
  ```

### Scenario 4: See "hasCustomerId: false"
**Problem:** User hasn't set up payment method yet
**Solution:**
- User needs to select "Pay Per Invoice" plan first
- Complete the $0.01 payment setup
- This saves the customer ID

## 🔧 Quick Checks

### 1. Check User's Subscription Plan:
```sql
SELECT id, subscription_plan, dodo_customer_id, dodo_payment_method_id 
FROM users 
WHERE id = '<your-user-id>';
```

### 2. Check Billing Records:
```sql
SELECT * FROM billing_records 
WHERE user_id = '<your-user-id>' 
ORDER BY created_at DESC 
LIMIT 10;
```

### 3. Check Invoice Status:
```sql
SELECT id, invoice_number, status 
FROM invoices 
WHERE id = '<invoice-id>';
```

## 📝 Next Steps

1. **Deploy the new logging code**
2. **Send an invoice again**
3. **Check Vercel logs** for the new log messages
4. **Share the logs** so we can see what's happening

## 🎯 What Should Happen

When everything works correctly:

1. User sends invoice
2. `chargeForInvoice()` is called
3. System checks subscription plan → `pay_per_invoice` ✅
4. System checks for customer ID → Found ✅
5. System attempts direct charge → Success ✅
6. Billing record created → Status: 'pending'
7. Webhook confirms → Status: 'paid'

## ⚠️ Common Issues

1. **User not on pay_per_invoice plan**
   - Fix: Update subscription plan in database

2. **No customer ID saved**
   - Fix: User needs to complete payment method setup

3. **Dodo Payment not configured**
   - Fix: Check `DODO_PAYMENT_API_KEY` in environment variables

4. **Invoice status is 'draft'**
   - Fix: Charge only happens when invoice is 'sent', not 'draft'

