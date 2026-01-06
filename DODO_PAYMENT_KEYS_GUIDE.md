# How to Find Your Dodo Payment Secret Key & Understanding Webhooks

## 🔑 Finding Your Dodo Payment Secret Key

### Step-by-Step Guide:

1. **Log in to Dodo Payment Dashboard**
   - Go to [https://dashboard.dodopayments.com](https://dashboard.dodopayments.com)
   - Sign in with your account credentials

2. **Navigate to API Settings**
   - Look for one of these sections:
     - **"Developer"** or **"Developers"**
     - **"API Keys"** or **"API Settings"**
     - **"Settings" → "API"**
     - **"Integrations"** or **"Developer Tools"**

3. **Find Sandbox/Test Mode Keys**
   - You should see two sections:
     - **Sandbox/Test Mode** (for testing)
     - **Production Mode** (for live payments)
   - For testing, use **Sandbox Mode** keys

4. **Copy Your Keys**
   - **API Key** (also called "Publishable Key" or "Public Key")
     - This is safe to expose in frontend code
     - Usually starts with `pk_test_` or `pk_sandbox_`
   - **Secret Key** (also called "Private Key" or "API Secret")
     - ⚠️ **NEVER share this publicly**
     - Usually starts with `sk_test_` or `sk_sandbox_`
     - This is what you need for server-side operations

5. **If You Can't Find It:**
   - Check if there's a **"Show"** or **"Reveal"** button next to the secret key
   - Some dashboards hide secret keys by default for security
   - You might need to click **"Generate New Key"** if it's your first time
   - Look for a **"Create API Key"** or **"Generate Credentials"** button

### Visual Guide (Common Dashboard Layouts):

```
Dodo Payment Dashboard
├── Settings
│   ├── API Keys
│   │   ├── Sandbox Mode
│   │   │   ├── API Key: pk_test_xxxxxxxxxxxxx [Copy]
│   │   │   ├── Secret Key: sk_test_xxxxxxxxxxxxx [Show] [Copy]
│   │   │   └── Webhook Secret: whsec_xxxxxxxxxxxxx [Copy]
│   │   └── Production Mode
│   │       └── (Same structure)
```

## 📡 What is a Webhook?

### Simple Explanation:

A **webhook** is like a "phone call" that Dodo Payment makes to your server when something important happens (like a payment succeeds or fails).

### Real-World Analogy:

Think of it like a **delivery notification**:
- You order food online (user makes payment)
- The restaurant prepares it (Dodo processes payment)
- When it's ready, they **call you** (webhook sends notification)
- You know your food is ready (your server knows payment succeeded)

### Why Webhooks Are Important:

**Without Webhooks:**
- User pays → Payment succeeds
- Your server doesn't know payment completed
- User's subscription doesn't get activated
- ❌ Bad user experience

**With Webhooks:**
- User pays → Payment succeeds
- Dodo Payment **automatically notifies** your server
- Your server activates subscription immediately
- ✅ Great user experience

### How Webhooks Work:

```
1. User clicks "Upgrade" → Your server creates payment link
2. User completes payment on Dodo Payment page
3. Dodo Payment processes payment
4. Dodo Payment sends webhook to your server:
   POST https://your-domain.com/api/payments/webhook
   {
     "type": "payment.succeeded",
     "data": {
       "payment_id": "pay_123",
       "amount": 9.00,
       "status": "succeeded"
     }
   }
5. Your server receives webhook
6. Your server updates user's subscription
7. User's account is upgraded ✅
```

### Webhook Events You'll Receive:

- **`payment.succeeded`** - Payment completed successfully
- **`payment.completed`** - Payment fully processed
- **`payment.failed`** - Payment failed (card declined, etc.)
- **`payment.cancelled`** - User cancelled payment

### Webhook Security:

Webhooks include a **signature** to prove they're really from Dodo Payment:

```
Dodo Payment → Signs webhook with secret key
Your Server → Verifies signature matches
✅ If matches → Process webhook
❌ If doesn't match → Reject (might be fake)
```

This is why you need the **Webhook Secret** - to verify webhooks are legitimate.

## 🔧 Setting Up Webhooks

### Step 1: Get Your Webhook URL

**For Local Testing (Development):**
```bash
# Install ngrok
npm install -g ngrok

# Start your Next.js server
npm run dev

# In another terminal, expose your local server
ngrok http 3000
```

You'll get a URL like: `https://abc123.ngrok.io`

**For Production:**
Use your actual domain: `https://yourdomain.com`

### Step 2: Configure in Dodo Payment Dashboard

1. Go to **"Webhooks"** section in dashboard
2. Click **"Add Webhook"** or **"Create Webhook"**
3. Enter your webhook URL:
   ```
   https://your-domain.com/api/payments/webhook
   ```
4. Select events to listen for:
   - ✅ `payment.succeeded`
   - ✅ `payment.completed`
   - ✅ `payment.failed`
   - ✅ `payment.cancelled`
5. Save webhook
6. Copy the **Webhook Secret** (usually starts with `whsec_`)

### Step 3: Add to Environment Variables

```env
DODO_PAYMENT_WEBHOOK_SECRET=whsec_your-webhook-secret-here
```

## 🧪 Testing Webhooks Locally

### Option 1: Using ngrok (Recommended)

1. **Start your server:**
   ```bash
   npm run dev
   ```

2. **Expose with ngrok:**
   ```bash
   ngrok http 3000
   ```

3. **Copy the ngrok URL:**
   ```
   Forwarding: https://abc123.ngrok.io -> http://localhost:3000
   ```

4. **Add to Dodo Payment webhook:**
   ```
   https://abc123.ngrok.io/api/payments/webhook
   ```

5. **Test payment** - webhook will be delivered to your local server!

### Option 2: Using Dodo Payment Test Tool

Some payment providers have a webhook testing tool in their dashboard where you can manually trigger test webhooks.

## ✅ Quick Checklist

- [ ] Found API Key in Dodo Payment dashboard
- [ ] Found Secret Key in Dodo Payment dashboard
- [ ] Found Webhook Secret in Dodo Payment dashboard
- [ ] Added all keys to `.env.local`
- [ ] Set up webhook URL in Dodo Payment dashboard
- [ ] Tested webhook delivery (using ngrok for local)

## 🆘 Still Can't Find Your Keys?

1. **Check Dodo Payment Documentation:**
   - Look for "Getting Started" or "API Setup" guide
   - Search for "API keys" or "authentication"

2. **Contact Dodo Payment Support:**
   - They can guide you to the exact location
   - Ask: "Where do I find my API keys and webhook secret?"

3. **Check Email:**
   - Sometimes API keys are sent via email when you create an account

4. **Look for "Developer" Section:**
   - Many payment dashboards have a dedicated developer section
   - Check sidebar menu for "Developers", "API", or "Integrations"

## 📝 Summary

- **Secret Key**: Found in Dodo Payment dashboard → API Settings → Sandbox Mode
- **Webhook**: Automatic notification from Dodo Payment when payment events occur
- **Webhook Secret**: Used to verify webhooks are legitimate (found in webhook settings)
- **Why Needed**: So your server knows when payments succeed/fail and can update subscriptions automatically

