# Dodo Payment Authentication Guide

## 🔍 Different Payment Providers Use Different Authentication

Some payment providers use:
- **API Key only** (single key for all operations)
- **API Key + Secret Key** (two separate keys)
- **Bearer Token** (single token)
- **Public Key + Private Key** (like Stripe)

## ✅ If Dodo Payment Only Has API Key

If Dodo Payment only provides an **API Key** (no separate secret key), that's perfectly fine! The code has been updated to work with just an API key.

### Setup with API Key Only:

1. **In your `.env.local` or Vercel environment variables:**
   ```env
   DODO_PAYMENT_API_KEY=your-api-key-here
   DODO_PAYMENT_ENVIRONMENT=sandbox
   # DODO_PAYMENT_SECRET_KEY=  (leave this empty or don't include it)
   ```

2. **The code will automatically:**
   - Use the API key for authorization
   - Work without a separate secret key

## 🔑 What to Look For in Dodo Payment Dashboard

### Common Names for API Keys:

1. **"API Key"** or **"API Token"**
   - This is usually what you need
   - Might be called "Publishable Key" or "Public Key"

2. **"Secret Key"** or **"Private Key"**
   - Some providers have this, some don't
   - If Dodo doesn't have this, that's okay!

3. **"Bearer Token"** or **"Access Token"**
   - Some providers use this instead of API key

4. **"Merchant ID"** or **"Account ID"**
   - Sometimes used alongside API key

### Where to Find in Dashboard:

Look for these sections:
- **"API Settings"** or **"API Keys"**
- **"Developer"** or **"Developers"**
- **"Integrations"**
- **"Settings" → "API"**
- **"Authentication"** or **"Credentials"**

## 📝 What You Actually Need

### Minimum Required:
- ✅ **API Key** (or API Token) - This is essential
- ✅ **Environment** (sandbox or production)

### Optional (if available):
- ⚪ **Secret Key** - Only if Dodo Payment provides it
- ⚪ **Webhook Secret** - For webhook verification (found in webhook settings)

## 🧪 Testing Without Secret Key

The updated code will work with just an API key. Here's how to test:

1. **Set only API key:**
   ```env
   DODO_PAYMENT_API_KEY=your-api-key
   DODO_PAYMENT_ENVIRONMENT=sandbox
   ```

2. **Try creating a payment:**
   - The code will use the API key for authorization
   - If it works, you don't need a secret key!

3. **If you get authentication errors:**
   - Check if Dodo Payment requires a different header format
   - Check their API documentation for exact authentication method

## 🔄 Alternative Authentication Methods

If Dodo Payment uses a different method, you might need to update the code:

### Method 1: API Key in Header
```typescript
headers: {
  'X-API-Key': apiKey
}
```

### Method 2: Bearer Token
```typescript
headers: {
  'Authorization': `Bearer ${apiKey}`
}
```

### Method 3: Basic Auth
```typescript
headers: {
  'Authorization': `Basic ${base64(apiKey + ':' + secretKey)}`
}
```

### Method 4: Query Parameter
```typescript
url: `${baseUrl}/v1/payment-links?api_key=${apiKey}`
```

## 📚 Check Dodo Payment Documentation

1. **Look for "Authentication" or "Getting Started" section**
2. **Check what headers they require:**
   - Do they use `Authorization: Bearer`?
   - Do they use `X-API-Key`?
   - Do they use something else?

3. **Check if they have example code:**
   - Look for code samples in their docs
   - See how they authenticate API calls

## 🛠️ If You Find the Correct Authentication Method

If Dodo Payment uses a different authentication method, you can update `src/lib/dodo-payment.ts`:

1. Find the `createPaymentLink` method
2. Update the headers to match Dodo Payment's requirements
3. Test with your API key

## ✅ Current Code Status

The code has been updated to:
- ✅ Work with API key only (no secret key required)
- ✅ Fall back to API key if secret key is not provided
- ✅ Support both methods (with or without secret key)

## 🆘 Still Having Issues?

1. **Check Dodo Payment API Documentation:**
   - Look for authentication examples
   - See what headers they require

2. **Contact Dodo Payment Support:**
   - Ask: "What authentication method do you use for API calls?"
   - Ask: "Do I need a secret key or just an API key?"
   - Ask: "Can you show me an example API call?"

3. **Test with Postman or curl:**
   - Try making a test API call
   - See what works and update the code accordingly

## 📋 Quick Checklist

- [ ] Found API Key in Dodo Payment dashboard
- [ ] Checked if there's a separate Secret Key (optional)
- [ ] Added API Key to environment variables
- [ ] Set DODO_PAYMENT_ENVIRONMENT=sandbox
- [ ] Tested payment creation
- [ ] If errors, checked Dodo Payment documentation for exact auth method

