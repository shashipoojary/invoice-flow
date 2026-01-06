# Dodo Payment Authentication Debugging Guide

## 🎯 Current Status

**Good News**: The endpoint `/payments/create` **exists** (returned 405 instead of 404)

**Issue**: Authentication format is incorrect, causing "Method Not Allowed" error

## 🔍 What We Found

From your Vercel logs:
- ❌ `/api/v1/payment-links` → 404 (doesn't exist)
- ❌ `/api/payment-links` → 404 (doesn't exist)
- ❌ `/v1/payment-links` → 404 (doesn't exist)
- ❌ `/v1/payments/links` → 404 (doesn't exist)
- ⚠️ `/payments/create` → **405 Method Not Allowed** ← **ENDPOINT EXISTS!**

405 error means:
- ✅ The endpoint path is correct
- ❌ Either the authentication method is wrong OR the API key is invalid

## 🛠️ What We Fixed

The code now tries **5 different authentication methods** on the `/payments/create` endpoint:

1. **Bearer token only**
   ```
   Authorization: Bearer YOUR_API_KEY
   ```

2. **X-API-Key header**
   ```
   X-API-Key: YOUR_API_KEY
   ```

3. **Both Bearer and X-API-Key**
   ```
   Authorization: Bearer YOUR_API_KEY
   X-API-Key: YOUR_API_KEY
   ```

4. **Dodo-Api-Key header** (custom header some APIs use)
   ```
   Dodo-Api-Key: YOUR_API_KEY
   ```

5. **Authorization with raw API key**
   ```
   Authorization: YOUR_API_KEY
   ```

## 📊 What to Check After Deployment

After Vercel deploys, click "Upgrade" and check the logs for:

### 1. API Key Verification
Look for this log:
```
🔐 Authentication: {
  hasApiKey: true,
  apiKeyPrefix: 'dodo_xyz...',
  environment: 'sandbox'
}
```

**Check:**
- Is `hasApiKey: true`?
- Does the `apiKeyPrefix` match your actual API key?
- Is `environment` set to `'sandbox'`?

### 2. Authentication Attempts
You'll see logs like:
```
🔍 Trying auth method: Bearer token only
🔍 Trying auth method: X-API-Key only
...
```

**Look for:**
- Which method returns something other than 405?
- Any method that returns 200 or 201 (success)?
- Any method that returns 401/403 (wrong key)?

### 3. Success or Failure
**Success looks like:**
```
✅ Dodo Payment link created using auth method: X-API-Key only
```

**Failure looks like:**
```
❌ All Dodo Payment authentication methods failed
💡 SOLUTION: Check Dodo Payment documentation for:
   1. Correct authentication header format
   2. Verify your API key is valid and active
   3. Check if you need to enable API access in dashboard
```

## ❓ Next Steps Based on Logs

### If ALL methods return 405:
→ Your API key might be invalid or inactive
→ Check Dodo Payment dashboard:
  1. Is the API key active?
  2. Does it have the right permissions?
  3. Is it for the correct environment (sandbox)?

### If one method returns 401/403:
→ That's the correct auth method, but the key is wrong
→ Double-check you copied the full API key correctly

### If one method returns 200/201:
→ Success! That's the correct auth method
→ Payment link should be created

### If one method returns a different error:
→ Share the new error message
→ We'll debug from there

## 🔑 Verify Your API Key

1. Go to Dodo Payment dashboard
2. Navigate to **Settings** → **API Keys** (or similar)
3. Check:
   - ✅ Is the key **active/enabled**?
   - ✅ Is it for **sandbox** environment?
   - ✅ Does it have **payment creation** permissions?
   - ✅ Did you copy the **entire key** (no spaces, no truncation)?

4. Copy the API key again and update in Vercel:
   - Go to Vercel project settings
   - Navigate to **Environment Variables**
   - Update `DODO_PAYMENT_API_KEY` with the fresh copy
   - Redeploy

## 📝 Environment Variables to Check

In Vercel, make sure you have:

```env
DODO_PAYMENT_API_KEY=your-actual-api-key-here
DODO_PAYMENT_ENVIRONMENT=sandbox
```

**Common mistakes:**
- ❌ Extra spaces before/after the key
- ❌ Missing part of the key (copied wrong)
- ❌ Using production key in sandbox environment
- ❌ Key is disabled/revoked in Dodo dashboard

## 🆘 If Still Not Working

Share these logs from Vercel:
1. The `🔐 Authentication:` log (shows if API key is detected)
2. All the `🔍 Trying auth method:` logs with their responses
3. Any error messages from Dodo Payment

Also check:
- Does Dodo Payment have an API documentation page?
- Do they have example code showing authentication?
- Can you reach out to their support for the correct auth header format?

## 💡 Why This Approach Works

Different payment providers use different authentication methods:
- Stripe uses `Authorization: Bearer sk_...`
- Some use `X-API-Key: ...`
- Some use custom headers

By trying all common methods, we'll find which one Dodo Payment uses and you'll see it in the logs!

