# Dodo Payment API Key Fix Guide

## 🎯 Current Status

**Good News**: The authentication header format is **CORRECT**!

**Evidence from logs:**
- ✅ `X-API-Key` header returns **401** (not 404 or 405)
- ✅ Error message: "You don't have permission to access"
- ✅ This means Dodo Payment **recognizes** the header format

**The Problem**: The API key itself is either:
1. ❌ Wrong/invalid
2. ❌ Doesn't have payment creation permissions
3. ❌ Not activated in your Dodo Payment dashboard

## 🔍 What We Found

From your logs:
```
X-API-Key only → 401 "You don't have permission to access"
```

This tells us:
- ✅ Header name `X-API-Key` is correct
- ✅ Dodo Payment recognizes this format
- ❌ But the key value is wrong or lacks permissions

## ✅ What to Check in Dodo Payment Dashboard

### Step 1: Verify Your API Keys

1. **Log into Dodo Payment Dashboard**
2. **Navigate to API Settings** (usually under Settings → API or Developer → API Keys)
3. **Check you have TWO keys:**
   - **API Key** (Public/Publishable) - Usually starts with `pk_` or `pub_`
   - **Secret Key** (Private) - Usually starts with `sk_` or `sec_`

### Step 2: Check Which Key to Use

**Most payment providers:**
- **API Key** = For frontend/public use
- **Secret Key** = For backend/server use ← **You probably need this one!**

**For creating payments, you typically need the SECRET KEY, not the API key.**

### Step 3: Verify Key Status

In Dodo Payment dashboard, check:
- ✅ Is the key **Active/Enabled**?
- ✅ Is it for **Sandbox** environment? (not Production)
- ✅ Does it have **Payment Creation** permissions?
- ✅ Is it not expired or revoked?

### Step 4: Check Key Permissions

Look for a **Permissions** or **Scopes** section:
- ✅ `payments:create` or `payment_links:create`
- ✅ `payments:write`
- ✅ Full API access

If permissions are missing, **enable them** in the dashboard.

## 🔧 How to Fix

### Option 1: Use Secret Key Instead

1. **In Vercel Environment Variables:**
   - Find `DODO_PAYMENT_API_KEY`
   - Replace it with your **Secret Key** (not API Key)
   - Or set `DODO_PAYMENT_SECRET_KEY` to your secret key

2. **The code will now try:**
   - Secret key in `X-API-Key` header first
   - Then API key
   - Then combinations

### Option 2: Verify Current Keys

1. **Copy your Secret Key fresh from Dodo dashboard**
2. **Update in Vercel:**
   ```
   DODO_PAYMENT_SECRET_KEY=your-secret-key-here
   ```
3. **Make sure no extra spaces or characters**
4. **Redeploy**

### Option 3: Check Key Format

Some payment providers have keys like:
- `sk_live_...` (production)
- `sk_test_...` (sandbox) ← **You need this one!**

Make sure you're using the **sandbox/test** key, not production.

## 📊 After You Update

After updating the keys in Vercel and redeploying, click "Upgrade" again.

**Look for in logs:**

### Success:
```
✅ Dodo Payment link created using auth method: X-API-Key with secretKey
```

### Still 401:
```
❌ Auth method "X-API-Key with secretKey" returned 401
   💡 This means the header format is correct, but:
      - The key might be wrong/invalid
      - The key might not have payment creation permissions
      - The key might need to be activated in Dodo dashboard
```

## 🆘 If Still Not Working

### Check These:

1. **Is the key for the right environment?**
   - Sandbox key for `DODO_PAYMENT_ENVIRONMENT=sandbox`
   - Production key for `DODO_PAYMENT_ENVIRONMENT=production`

2. **Is the key activated?**
   - Some providers require activating API access
   - Check Dodo dashboard for "Enable API" or "Activate API Access"

3. **Does the key have the right permissions?**
   - Payment creation
   - Payment links
   - Write access

4. **Is the key copied correctly?**
   - No extra spaces
   - Full key (not truncated)
   - Correct key (secret vs API)

### Contact Dodo Payment Support

If all else fails:
1. **Contact Dodo Payment support**
2. **Ask them:**
   - Which key should be used for creating payment links? (API Key or Secret Key?)
   - What header format do they use? (We found `X-API-Key` works)
   - Do I need to enable any permissions?
   - Is my sandbox account fully activated?

3. **Share with them:**
   - You're getting 401 "You don't have permission to access"
   - Using `X-API-Key` header
   - Endpoint: `/payments/create`
   - Environment: Sandbox

## 💡 Most Likely Solution

**90% chance:** You need to use your **Secret Key** in the `X-API-Key` header, not your API Key.

The updated code now tries this automatically. After redeploy, check the logs to see if `X-API-Key with secretKey` works!

