# Dodo Payment Integration Setup Guide

This guide will help you connect your Dodo Payment account and test it in sandbox mode.

## 📋 Prerequisites

1. **Dodo Payment Account**: You should have already created your Dodo Payment account
2. **API Credentials**: Get your sandbox API keys from Dodo Payment dashboard

## 🔑 Step 1: Get Your Dodo Payment API Keys

### Where to Find Your Keys:

1. **Log in to Dodo Payment Dashboard**
   - Go to [https://dashboard.dodopayments.com](https://dashboard.dodopayments.com)
   - Sign in with your account

2. **Navigate to API Settings**
   - Look for: **"Developer"**, **"API Keys"**, **"API Settings"**, or **"Settings → API"**
   - Click on it

3. **Find Sandbox/Test Mode Section**
   - You should see two sections: **Sandbox/Test Mode** and **Production Mode**
   - For testing, use **Sandbox Mode** credentials

4. **Copy Your Keys:**
   - **API Key** (Publishable Key) - Usually starts with `pk_test_` or `pk_sandbox_`
   - **Secret Key** (Private Key) - ⚠️ **KEEP THIS SECRET!** Usually starts with `sk_test_` or `sk_sandbox_`
     - You might need to click **"Show"** or **"Reveal"** to see it
   - **Webhook Secret** - Found in **Webhooks** section (see Step 4 below)

### Can't Find Your Keys?

- Check if there's a **"Generate API Key"** or **"Create Credentials"** button
- Some dashboards require you to generate keys first
- Look for a **"Show Secret Key"** button (they're often hidden by default)
- Contact Dodo Payment support if you're still stuck

> 📖 **Need more help?** See `DODO_PAYMENT_KEYS_GUIDE.md` for detailed instructions and visual guide.

## ⚙️ Step 2: Configure Environment Variables

Add these variables to your `.env.local` file:

```env
# Dodo Payment Configuration
DODO_PAYMENT_API_KEY=your-sandbox-api-key-here
DODO_PAYMENT_SECRET_KEY=your-sandbox-secret-key-here
DODO_PAYMENT_ENVIRONMENT=sandbox
DODO_PAYMENT_WEBHOOK_SECRET=your-webhook-secret-here
```

**Important Notes:**
- Use `sandbox` for testing
- Use `production` when going live
- Keep your secret keys secure and never commit them to git

## 🧪 Step 3: Test in Sandbox Mode

### Test Payment Flow

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to Profile Settings:**
   - Go to `/dashboard/profile`
   - Click on "Manage Subscription" or upgrade button

3. **Test Subscription Upgrade:**
   - Click "Upgrade" on Monthly ($9/month) or Pay Per Invoice ($0.50/invoice)
   - You'll be redirected to Dodo Payment checkout page
   - Use test card numbers provided by Dodo Payment

### Test Card Numbers (Sandbox)

Dodo Payment typically provides test card numbers like:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

*Note: Actual test cards may vary. Check Dodo Payment documentation for current test cards.*

## 📡 What is a Webhook? (Quick Explanation)

A **webhook** is an automatic notification that Dodo Payment sends to your server when important events happen (like when a payment succeeds or fails).

**Why you need it:**
- User pays → Dodo processes payment → Dodo **notifies your server** → Your server activates subscription
- Without webhooks, your server wouldn't know when payments complete!

**Think of it like:** A delivery notification - when your payment is "delivered" (completed), Dodo "calls" your server to let you know.

> 📖 **Want to learn more?** See `DODO_PAYMENT_KEYS_GUIDE.md` for a detailed explanation.

## 🔗 Step 4: Configure Webhook URL

1. In Dodo Payment Dashboard, go to **Webhooks** section
2. Add a new webhook endpoint:
   ```
   https://your-domain.com/api/payments/webhook
   ```
3. For local testing, use a tool like [ngrok](https://ngrok.com):
   ```bash
   ngrok http 3000
   ```
   Then use: `https://your-ngrok-url.ngrok.io/api/payments/webhook`

4. Select events to listen for:
   - `payment.succeeded`
   - `payment.completed`
   - `payment.failed`
   - `payment.cancelled`

5. Copy the webhook secret and add it to `.env.local`:
   ```env
   DODO_PAYMENT_WEBHOOK_SECRET=whsec_your-webhook-secret
   ```

## ✅ Step 5: Verify Integration

### Test Payment Success Flow

1. Click "Upgrade" on a paid plan
2. Complete payment with a successful test card
3. You should be redirected back to: `/dashboard/profile?payment=success&session_id=xxx`
4. Your subscription should be automatically updated

### Test Payment Failure Flow

1. Use a declined test card
2. Payment should fail gracefully
3. You should see an error message
4. Subscription should remain unchanged

### Check Payment Status

After payment, verify:
- Subscription plan is updated in database
- Billing record is created with `status: 'paid'`
- User can access premium features

## 🐛 Troubleshooting

### Payment Link Not Created

**Error**: "Payment service not configured"

**Solution**: 
- Check that all Dodo Payment environment variables are set
- Verify API keys are correct
- Ensure `DODO_PAYMENT_ENVIRONMENT` is set to `sandbox`

### Webhook Not Receiving Events

**Error**: Webhook events not processed

**Solution**:
- Verify webhook URL is accessible (use ngrok for local testing)
- Check webhook secret matches in `.env.local`
- Verify webhook events are enabled in Dodo Payment dashboard
- Check server logs for webhook errors

### Payment Succeeded But Subscription Not Updated

**Error**: Payment completed but subscription unchanged

**Solution**:
- Check webhook is properly configured
- Verify webhook signature verification
- Check database for billing records
- Manually verify payment using `/api/payments/verify?payment_id=xxx`

## 📝 API Endpoints

### Create Payment Checkout
```
POST /api/payments/checkout
Body: { "plan": "monthly" | "pay_per_invoice" }
```

### Verify Payment
```
GET /api/payments/verify?payment_id=xxx
```

### Webhook Handler
```
POST /api/payments/webhook
```

## 🔄 Production Setup

### Your Production Website
**URL**: https://invoice-flow-vert.vercel.app/

### Production Webhook URL
```
https://invoice-flow-vert.vercel.app/api/payments/webhook
```

### Steps to Set Up Production:

1. **Switch to Production Keys in Vercel:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Update these variables:
     ```env
     DODO_PAYMENT_ENVIRONMENT=production
     DODO_PAYMENT_API_KEY=your-production-api-key
     DODO_PAYMENT_SECRET_KEY=your-production-secret-key
     DODO_PAYMENT_WEBHOOK_SECRET=your-production-webhook-secret
     ```

2. **Add Webhook in Dodo Payment Dashboard:**
   - Go to Webhooks section
   - Add webhook URL: `https://invoice-flow-vert.vercel.app/api/payments/webhook`
   - Select events: `payment.succeeded`, `payment.completed`, `payment.failed`, `payment.cancelled`
   - Copy the webhook secret and add to Vercel environment variables

3. **Redeploy Application:**
   - Go to Vercel → Deployments
   - Click "Redeploy" to apply new environment variables

4. **Test with Real Cards:**
   - Use small test amounts first
   - Verify all flows work correctly
   - Check Vercel logs for webhook events

> 📖 **Detailed Production Setup**: See `WEBHOOK_PRODUCTION_SETUP.md` for complete step-by-step instructions.

## 📚 Additional Resources

- [Dodo Payment Documentation](https://docs.dodopayments.com)
- [Dodo Payment API Reference](https://docs.dodopayments.com/api-reference)
- [Dodo Payment Test Cards](https://docs.dodopayments.com/testing)

## 🆘 Support

If you encounter issues:
1. Check Dodo Payment dashboard for transaction logs
2. Review server logs for errors
3. Verify all environment variables are set correctly
4. Contact Dodo Payment support if needed

