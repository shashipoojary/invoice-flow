# Enable Write Access for Dodo Payment API Key

## 🎯 The Problem

You're getting **401 "You don't have permission to access"** because your API key doesn't have **Write Access** enabled.

## ✅ The Solution

### Step 1: Go to Dodo Payment Dashboard

1. Log into your Dodo Payment account
2. Navigate to **Developer** → **API Keys**
   - Or **Settings** → **API Keys**
   - Or **Developer** → **API Settings**

### Step 2: Find Your API Key

1. Look for your API key in the list
2. It should show something like:
   - Key name
   - Key prefix (first few characters)
   - **Access level** or **Permissions**

### Step 3: Enable Write Access

1. **Click on your API key** to edit it
2. Look for a checkbox or toggle that says:
   - ✅ **"Enable write access"**
   - ✅ **"Write permissions"**
   - ✅ **"Full access"**
   - ✅ **"Read and Write"**

3. **Check/Enable this option**

4. **Save the changes**

### Step 4: Verify

After enabling write access:
- The API key should show **"Read & Write"** or **"Full Access"**
- Not just **"Read Only"**

## 📸 What to Look For

In the Dodo Payment dashboard, you should see something like:

```
API Key: C9MOdaSK...
Name: My API Key
Access Level: [ ] Read Only
              [✓] Read & Write  ← Enable this!
```

Or:

```
Permissions:
  [✓] Read Access
  [✓] Write Access  ← Make sure this is checked!
```

## ⚠️ Important Notes

1. **Write Access is Required** for:
   - Creating payment links
   - Creating payments
   - Updating subscriptions
   - Any POST/PUT/DELETE operations

2. **Read Access Only** allows:
   - Viewing payments
   - Checking status
   - Retrieving data
   - But NOT creating anything

3. **If you can't find the option:**
   - You might need to **create a new API key** with write access
   - Some accounts might need to contact support to enable write access

## 🔄 After Enabling Write Access

1. **Wait a few seconds** for changes to propagate
2. **Try clicking "Upgrade" again** in your app
3. **Check Vercel logs** - you should see:
   ```
   ✅ Dodo Payment link created using auth method: X-API-Key header
   ```

## 🆘 If You Still Get 401

### Check These:

1. **Did you save the changes?**
   - Make sure you clicked "Save" or "Update" after enabling write access

2. **Is it the right key?**
   - Make sure the API key in Vercel matches the one you just updated
   - Copy the key fresh from Dodo dashboard
   - Update `DODO_PAYMENT_API_KEY` in Vercel
   - Redeploy

3. **Is it the right environment?**
   - Sandbox key for `DODO_PAYMENT_ENVIRONMENT=sandbox`
   - Production key for production

4. **Wait a bit:**
   - Sometimes changes take 1-2 minutes to propagate
   - Try again after waiting

5. **Create a new key:**
   - If the old key doesn't work, create a new one
   - Make sure to enable write access when creating
   - Update in Vercel and redeploy

## 📝 Quick Checklist

- [ ] Logged into Dodo Payment dashboard
- [ ] Navigated to Developer → API Keys
- [ ] Found my API key
- [ ] Enabled "Write Access" or "Read & Write"
- [ ] Saved the changes
- [ ] Verified it shows "Read & Write" (not just "Read Only")
- [ ] Updated API key in Vercel if needed
- [ ] Redeployed
- [ ] Tested again

## 💡 Why This Happens

Dodo Payment (like many payment providers) has two permission levels:
- **Read Only**: Safe for frontend/public use, can't create payments
- **Read & Write**: Required for backend operations, can create payments

For creating payment links, you **must** have write access enabled!

