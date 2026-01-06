# Payment Flow Explanation

## 🔄 How Payment Plans Work

### 1. **Monthly Plan - $9/month**
- **Requires upfront payment** of $9
- User clicks "Upgrade" → Redirected to Dodo Payment checkout → Pays $9 → Subscription activated
- Recurring billing every month (handled separately)

### 2. **Pay Per Invoice - $0.50/invoice**
- **NO upfront payment required**
- User clicks "Select" → Plan activated immediately (no payment)
- Charges $0.50 **each time** user creates or sends an invoice
- Billing happens automatically when invoice is created/sent

## 📋 Current Behavior (What You're Seeing)

### Problem: Pay Per Invoice is activating without payment

**What's happening:**
1. You click "Pay Per Invoice"
2. Code checks if it's "pay_per_invoice" plan
3. It activates immediately without calling Dodo Payment
4. This is **CORRECT** behavior for Pay Per Invoice!

**Why:**
- Pay Per Invoice doesn't require upfront payment
- It charges per invoice when you create/send them
- The $0.50 charge happens later, not upfront

## ✅ How It Should Work

### Monthly Plan Flow:
```
User clicks "Upgrade to Monthly"
    ↓
API creates Dodo Payment checkout link
    ↓
User redirected to Dodo Payment page
    ↓
User pays $9
    ↓
Dodo sends webhook → Subscription activated
```

### Pay Per Invoice Flow:
```
User clicks "Select Pay Per Invoice"
    ↓
Plan activated immediately (NO payment)
    ↓
User creates/sends invoice
    ↓
System charges $0.50 automatically
    ↓
Billing record created
```

## 🔍 Why You're Not Seeing Dodo Payment Page

### For Monthly Plan:
If you're not seeing the Dodo Payment page, check:

1. **Is Dodo Payment configured?**
   - Check `.env.local` has `DODO_PAYMENT_API_KEY`
   - Check if API key is valid

2. **Check browser console:**
   - Open Developer Tools (F12)
   - Go to Console tab
   - Click "Upgrade to Monthly"
   - Look for errors

3. **Check network tab:**
   - Open Developer Tools → Network tab
   - Click "Upgrade to Monthly"
   - Look for `/api/payments/checkout` request
   - Check the response

4. **Check server logs:**
   - Look for "Creating Dodo Payment link" log
   - Check for any API errors

### Common Issues:

**Issue 1: API Key Not Set**
```
Error: Payment service not configured
```
**Fix:** Add `DODO_PAYMENT_API_KEY` to `.env.local`

**Issue 2: Dodo Payment API Error**
```
Error: Failed to create payment link
```
**Fix:** 
- Check API key is correct
- Check Dodo Payment API endpoint is correct
- Check Dodo Payment dashboard for API status

**Issue 3: Payment Link Created But Not Redirecting**
```
paymentLink exists but page doesn't redirect
```
**Fix:** Check browser console for JavaScript errors

## 🧪 Testing the Flow

### Test Monthly Plan:
1. Make sure you have `DODO_PAYMENT_API_KEY` in `.env.local`
2. Click "Upgrade to Monthly"
3. You should be redirected to Dodo Payment checkout page
4. Use test card to complete payment
5. You should be redirected back with subscription activated

### Test Pay Per Invoice:
1. Click "Select Pay Per Invoice"
2. Plan should activate immediately (no payment page)
3. Create or send an invoice
4. Check billing records - should see $0.50 charge

## 🔧 Debugging Steps

### Step 1: Check Environment Variables
```bash
# In your terminal
cat .env.local | grep DODO
```

Should show:
```
DODO_PAYMENT_API_KEY=your-key
DODO_PAYMENT_ENVIRONMENT=sandbox
```

### Step 2: Check Browser Console
1. Open your app in browser
2. Press F12 to open Developer Tools
3. Go to Console tab
4. Click "Upgrade to Monthly"
5. Look for errors or logs

### Step 3: Check Network Requests
1. Open Developer Tools → Network tab
2. Click "Upgrade to Monthly"
3. Find `/api/payments/checkout` request
4. Click on it → Check Response tab
5. See what error message is returned

### Step 4: Check Server Logs
1. Look at your terminal where `npm run dev` is running
2. Click "Upgrade to Monthly"
3. Look for logs like:
   - "🔗 Creating Dodo Payment link"
   - "✅ Dodo Payment link created"
   - Or error messages

## 📝 Expected Console Logs

### When Payment Link is Created Successfully:
```
🔗 Creating Dodo Payment link: { amount: 9, currency: 'USD', ... }
✅ Dodo Payment link created: { paymentId: 'xxx', hasLink: true }
```

### When Payment Service Not Configured:
```
Dodo Payment API key not configured
Error: Payment service not configured
```

### When API Call Fails:
```
Dodo Payment API error: { status: 401, ... }
Error: Failed to create payment link (401)
```

## 🆘 Quick Fixes

### Fix 1: Add API Key
```env
# .env.local
DODO_PAYMENT_API_KEY=your-api-key-here
DODO_PAYMENT_ENVIRONMENT=sandbox
```

### Fix 2: Check API Endpoint
The code uses:
- Sandbox: `https://api-sandbox.dodopayments.com`
- Production: `https://api.dodopayments.com`

**If Dodo Payment uses different URLs**, update `src/lib/dodo-payment.ts`

### Fix 3: Check Authentication Method
Dodo Payment might use different headers. Check their docs and update:
- `Authorization: Bearer ${token}`
- Or `X-API-Key: ${apiKey}`
- Or something else

## ✅ Summary

- **Monthly Plan**: Requires payment → Should redirect to Dodo Payment
- **Pay Per Invoice**: No upfront payment → Activates immediately → Charges per invoice
- **If not seeing Dodo Payment page**: Check API key, check console logs, check network requests

