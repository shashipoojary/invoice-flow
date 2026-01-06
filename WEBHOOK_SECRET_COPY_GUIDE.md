# How to Copy Webhook Secret Correctly

## ❌ Common Mistake: Including "/" in Secret

**NO, you should NOT include "/" in the webhook secret!**

The "/" is part of the **webhook URL**, not the secret.

## ✅ What to Copy

### Webhook URL (for creating webhook):
```
https://invoice-flow-vert.vercel.app/api/payments/webhook
```
↑ This has "/" - but this is the URL, not the secret

### Webhook Secret (for environment variable):
```
whsec_abc123xyz789def456
```
↑ This should NOT have "/" - just the secret string

## 📋 Step-by-Step: What to Copy

### Step 1: Webhook URL (has "/")
When creating the webhook in Dodo Payment dashboard:
- **Copy this**: `https://invoice-flow-vert.vercel.app/api/payments/webhook`
- This goes in the "Webhook URL" field

### Step 2: Webhook Secret (NO "/")
After creating the webhook:
- **Copy this**: `whsec_xxxxxxxxxxxxx` (just the secret, no "/")
- This goes in your environment variable

## 🔍 How to Identify What to Copy

### In Dodo Payment Dashboard:

```
Webhook Settings:
├── Webhook URL: https://invoice-flow-vert.vercel.app/api/payments/webhook
│   └── This has "/" - this is the URL ✅
│
└── Webhook Secret: whsec_abc123xyz789
    └── This does NOT have "/" - this is the secret ✅
```

## ⚠️ Common Confusion

### If You See This:
```
Secret: whsec_abc123/xyz789
```

**Question**: Should I include the "/"?

**Answer**: 
- If Dodo Payment shows it WITH "/", copy it exactly as shown
- But usually secrets don't have "/" in them
- The "/" might be a separator in the display, not part of the actual secret

### How to Check:
1. Look at the secret field carefully
2. If there's a "/" in the middle, it might be:
   - Part of the secret (copy it)
   - A display separator (don't copy it)
3. **Best practice**: Copy exactly what's shown in the "Secret" or "Signing Secret" field

## 📝 Examples

### ✅ Correct Format:
```env
DODO_PAYMENT_WEBHOOK_SECRET=whsec_abc123xyz789def456
```

### ❌ Wrong (if you accidentally included URL):
```env
DODO_PAYMENT_WEBHOOK_SECRET=https://invoice-flow-vert.vercel.app/api/payments/webhook/whsec_abc123
```

### ✅ Correct (if Dodo shows "/" in secret):
```env
DODO_PAYMENT_WEBHOOK_SECRET=whsec_abc123/xyz789
```
(Only if Dodo Payment actually shows "/" as part of the secret)

## 🔍 Visual Guide

### What You'll See in Dashboard:

```
┌─────────────────────────────────────────┐
│ Webhook Configuration                   │
├─────────────────────────────────────────┤
│ URL:                                    │
│ https://invoice-flow-vert.../webhook   │ ← Has "/" (this is URL)
│                                         │
│ Secret:                                 │
│ whsec_abc123xyz789def456               │ ← No "/" (this is secret)
│ [Copy] [Show]                          │
└─────────────────────────────────────────┘
```

## ✅ Quick Checklist

- [ ] Webhook URL has "/" - that's correct for the URL
- [ ] Webhook Secret does NOT have "/" - just the secret string
- [ ] Copied only the secret part (starts with `whsec_` or `wh_`)
- [ ] Did NOT include the URL in the secret
- [ ] Added to environment variable without quotes (unless needed)

## 🆘 Still Confused?

### If Dodo Payment Shows:
```
Secret: whsec_abc123/xyz789
```

**Copy it exactly as shown** - if Dodo includes "/" in their secret format, use it.

### If You're Not Sure:
1. Copy the secret exactly as shown in the dashboard
2. Try it in your environment variable
3. Test the webhook
4. If it doesn't work, try without the "/" (if you added it)

## 📋 Summary

- **Webhook URL**: Has "/" - `https://invoice-flow-vert.vercel.app/api/payments/webhook`
- **Webhook Secret**: Usually NO "/" - `whsec_abc123xyz789`
- **Rule**: Copy the secret exactly as Dodo Payment shows it
- **If unsure**: Copy exactly what's in the "Secret" field, nothing more

