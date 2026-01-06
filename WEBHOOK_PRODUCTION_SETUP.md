# Production Webhook Setup for https://invoice-flow-vert.vercel.app/

## 🔗 Your Production Webhook URL

Your webhook endpoint is:
```
https://invoice-flow-vert.vercel.app/api/payments/webhook
```

## 📋 Step-by-Step Setup

### Step 1: Log in to Dodo Payment Dashboard

1. Go to [https://dashboard.dodopayments.com](https://dashboard.dodopayments.com)
2. Sign in with your Dodo Payment account

### Step 2: Navigate to Webhooks Section

1. Look for **"Webhooks"** in the sidebar menu
   - It might be under: **Settings** → **Webhooks**
   - Or: **Developer** → **Webhooks**
   - Or: **Integrations** → **Webhooks**

### Step 3: Create New Webhook

1. Click **"Add Webhook"** or **"Create Webhook"** button
2. Enter your webhook URL:
   ```
   https://invoice-flow-vert.vercel.app/api/payments/webhook
   ```
3. Select events to listen for (check these boxes):
   - ✅ `payment.succeeded`
   - ✅ `payment.completed`
   - ✅ `payment.failed`
   - ✅ `payment.cancelled`
4. Click **"Save"** or **"Create Webhook"**

### Step 4: Copy Webhook Secret

After creating the webhook:
1. You'll see a **"Webhook Secret"** or **"Signing Secret"**
   - It usually starts with `whsec_` or `wh_`
2. **Copy this secret** - you'll need it for your environment variables
3. ⚠️ **Save it securely** - you won't be able to see it again!

### Step 5: Add to Vercel Environment Variables

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `invoice-flow-vert` (or your project name)
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

   **For Production:**
   ```
   DODO_PAYMENT_API_KEY = your-production-api-key
   DODO_PAYMENT_SECRET_KEY = your-production-secret-key
   DODO_PAYMENT_ENVIRONMENT = production
   DODO_PAYMENT_WEBHOOK_SECRET = whsec_your-webhook-secret-here
   ```

5. Click **"Save"**
6. **Redeploy your application** for changes to take effect:
   - Go to **Deployments** tab
   - Click **"Redeploy"** on the latest deployment
   - Or push a new commit to trigger redeploy

## ✅ Verify Webhook is Working

### Test 1: Check Webhook Status in Dashboard

1. Go back to Dodo Payment dashboard → Webhooks
2. You should see your webhook listed
3. Check if there's a **"Test"** or **"Send Test Event"** button
4. Click it to send a test webhook
5. Check your Vercel logs to see if webhook was received

### Test 2: Make a Test Payment

1. Go to your website: https://invoice-flow-vert.vercel.app/
2. Navigate to profile/subscription settings
3. Try to upgrade to a paid plan
4. Complete a test payment
5. Check Vercel logs to see webhook events

### Test 3: Check Vercel Logs

1. Go to Vercel Dashboard → Your Project
2. Click **"Deployments"** tab
3. Click on the latest deployment
4. Click **"Functions"** tab
5. Look for `/api/payments/webhook`
6. Check **"Logs"** to see webhook events

## 🔍 Troubleshooting

### Webhook Not Receiving Events

**Check 1: Webhook URL is correct**
- Verify URL in Dodo Payment dashboard matches exactly:
  ```
  https://invoice-flow-vert.vercel.app/api/payments/webhook
  ```
- Make sure there's no trailing slash
- Make sure it's `https://` not `http://`

**Check 2: Environment Variables**
- Verify all Dodo Payment env vars are set in Vercel
- Make sure `DODO_PAYMENT_ENVIRONMENT=production`
- Verify webhook secret matches

**Check 3: Vercel Deployment**
- Make sure latest code is deployed
- Check if webhook route exists: `/api/payments/webhook/route.ts`
- Redeploy if needed

**Check 4: Webhook Events Enabled**
- In Dodo Payment dashboard, verify events are selected:
  - `payment.succeeded`
  - `payment.completed`
  - `payment.failed`
  - `payment.cancelled`

### Webhook Signature Verification Failing

**Error**: "Invalid signature" in logs

**Solution**:
1. Verify `DODO_PAYMENT_WEBHOOK_SECRET` in Vercel matches the secret from Dodo Payment dashboard
2. Make sure there are no extra spaces or characters
3. Copy the secret again from Dodo Payment dashboard
4. Update in Vercel and redeploy

### Payment Succeeds But Subscription Not Updated

**Possible Causes**:
1. Webhook not being received
2. Webhook signature verification failing
3. Database update failing

**Debug Steps**:
1. Check Vercel function logs for webhook events
2. Check for any error messages
3. Verify database connection is working
4. Check if billing record is being created

## 📝 Quick Checklist

- [ ] Logged into Dodo Payment dashboard
- [ ] Found Webhooks section
- [ ] Created webhook with URL: `https://invoice-flow-vert.vercel.app/api/payments/webhook`
- [ ] Selected all payment events
- [ ] Copied webhook secret
- [ ] Added all environment variables to Vercel
- [ ] Set `DODO_PAYMENT_ENVIRONMENT=production`
- [ ] Redeployed application on Vercel
- [ ] Tested webhook (made test payment or used test button)
- [ ] Verified webhook appears in Vercel logs

## 🔐 Security Notes

1. **Never commit secrets to git** - Always use environment variables
2. **Use production keys** - Don't use sandbox keys in production
3. **Keep webhook secret secure** - Only store in Vercel environment variables
4. **Verify webhook signatures** - The code already does this automatically

## 📞 Need Help?

If webhook still not working:
1. Check Dodo Payment dashboard for webhook delivery logs
2. Check Vercel function logs for errors
3. Verify all environment variables are set correctly
4. Contact Dodo Payment support if webhook events aren't being sent

