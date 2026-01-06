# What is DODO_PAYMENT_WEBHOOK_SECRET?

## 🔑 Simple Explanation

**Webhook Secret** is a special password that Dodo Payment gives you to **verify** that webhook notifications are really coming from them (and not from a hacker).

## 📡 Why You Need It

When Dodo Payment sends a webhook to your server, they include a **signature** (like a fingerprint) that proves the webhook is legitimate.

Your server uses the **Webhook Secret** to verify this signature:
- ✅ **Signature matches** → Webhook is real, process it
- ❌ **Signature doesn't match** → Webhook is fake, reject it

## 🔍 Where to Find It

### Step 1: Go to Dodo Payment Dashboard
1. Log in to [Dodo Payment Dashboard](https://dashboard.dodopayments.com)

### Step 2: Navigate to Webhooks
- Go to **"Developer"** → **"Webhooks"**
- Or **"Settings"** → **"Webhooks"**
- Or **"Integrations"** → **"Webhooks"**

### Step 3: Create or View Your Webhook
1. If you haven't created a webhook yet:
   - Click **"Add Webhook"** or **"Create Webhook"**
   - Enter your webhook URL: `https://invoice-flow-vert.vercel.app/api/payments/webhook`
   - Select events (payment.succeeded, payment.completed, etc.)
   - Click **"Save"** or **"Create"**

2. After creating the webhook:
   - You'll see your webhook listed
   - Click on it to view details
   - Look for **"Webhook Secret"** or **"Signing Secret"** or **"Secret Key"**
   - It usually starts with `whsec_` or `wh_`

### Step 4: Copy the Secret
- **Copy the entire secret** (it's usually a long string)
- ⚠️ **Save it immediately** - you might not be able to see it again!

## 📝 Visual Guide

```
Dodo Payment Dashboard
├── Developer
│   ├── API Keys (for API calls)
│   └── Webhooks (for webhook secret) ← YOU ARE HERE
│       ├── Your Webhook
│       │   ├── URL: https://invoice-flow-vert.vercel.app/api/payments/webhook
│       │   ├── Events: payment.succeeded, payment.completed, etc.
│       │   └── Secret: whsec_xxxxxxxxxxxxx ← THIS IS WHAT YOU NEED
│       └── [Add Webhook]
```

## 🔄 How It Works

### Without Webhook Secret (Insecure):
```
Hacker sends fake webhook → Your server thinks it's real → ❌ Bad!
```

### With Webhook Secret (Secure):
```
Dodo Payment sends webhook + signature
    ↓
Your server checks signature using webhook secret
    ↓
✅ Signature matches → Process webhook
❌ Signature doesn't match → Reject webhook
```

## ⚙️ How to Use It

### In Your Environment Variables:

**For Local Development (`.env.local`):**
```env
DODO_PAYMENT_WEBHOOK_SECRET=whsec_your-webhook-secret-here
```

**For Production (Vercel):**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   ```
   DODO_PAYMENT_WEBHOOK_SECRET = whsec_your-webhook-secret-here
   ```
3. Redeploy your application

## 🆚 Webhook Secret vs API Key

These are **TWO DIFFERENT THINGS**:

| | **API Key** | **Webhook Secret** |
|---|---|---|
| **Used For** | Making API calls (creating payments) | Verifying webhook signatures |
| **Where Found** | Developer → API Keys | Developer → Webhooks → (your webhook) |
| **Starts With** | Usually `pk_` or `sk_` | Usually `whsec_` or `wh_` |
| **Required For** | Creating payment links | Receiving webhook notifications |

## ✅ Quick Checklist

- [ ] Logged into Dodo Payment dashboard
- [ ] Went to Developer → Webhooks
- [ ] Created webhook with your URL
- [ ] Found "Webhook Secret" or "Signing Secret"
- [ ] Copied the secret (starts with `whsec_` or `wh_`)
- [ ] Added to `.env.local` or Vercel environment variables
- [ ] Redeployed application (if using Vercel)

## 🆘 Can't Find It?

### Option 1: Check Different Names
Look for:
- "Webhook Secret"
- "Signing Secret"
- "Secret Key"
- "Webhook Signing Key"
- "Verification Secret"

### Option 2: Check After Creating Webhook
- Some providers only show the secret **after** you create the webhook
- Make sure you've created the webhook first

### Option 3: Check Webhook Details
- Click on your webhook to view details
- The secret might be in a "Settings" or "Advanced" section
- Look for a "Show Secret" or "Reveal" button

### Option 4: Regenerate Secret
- Some dashboards have a "Regenerate Secret" button
- Click it to get a new secret (old one will stop working)

### Option 5: Contact Support
- If you still can't find it, contact Dodo Payment support
- Ask: "Where do I find the webhook secret for my webhook?"

## 🔐 Security Notes

1. **Keep it secret** - Never share your webhook secret publicly
2. **Don't commit to git** - Always use environment variables
3. **Different for each webhook** - Each webhook has its own secret
4. **Can be regenerated** - If compromised, regenerate it

## 📋 Summary

- **What it is**: A password to verify webhooks are from Dodo Payment
- **Where to find**: Dodo Payment Dashboard → Developer → Webhooks → (your webhook) → Secret
- **What it looks like**: Usually starts with `whsec_` or `wh_`
- **Why you need it**: Security - to prevent fake webhooks
- **How to use**: Add to environment variables as `DODO_PAYMENT_WEBHOOK_SECRET`

