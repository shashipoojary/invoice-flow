# Debugging Resend "Unable to fetch data" Error

## 🔍 Error Analysis

**Error:** `Unable to fetch data. The request could not be resolved.`
**Type:** Network/Connection issue with Resend API
**NOT related to:** Queue system (this is a Resend API connectivity problem)

## ✅ Quick Fixes to Try

### 1. Check Internet Connection
- Make sure you have active internet connection
- Try accessing: https://resend.com in browser

### 2. Check RESEND_API_KEY
```bash
# In your .env.local file, verify:
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

**Common issues:**
- Key missing or empty
- Key has extra spaces
- Key is invalid/expired

### 3. Check Firewall/Proxy
- If behind corporate firewall, it might block Resend API
- Try disabling VPN if using one
- Check if port 443 (HTTPS) is blocked

### 4. Test Resend API Directly
```bash
# Test if Resend API is reachable
curl https://api.resend.com/emails
```

### 5. Check DNS Resolution
- Try: `ping api.resend.com`
- If fails, DNS issue

## 🧪 Test Resend Connection

Create a simple test file to verify Resend works:

```typescript
// test-resend-connection.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function test() {
  try {
    const result = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'your-email@example.com',
      subject: 'Test',
      html: '<p>Test</p>',
    });
    console.log('✅ Resend works!', result);
  } catch (error) {
    console.error('❌ Resend error:', error);
  }
}

test();
```

## 🔧 Solutions

### Solution 1: Verify API Key
1. Go to: https://resend.com/api-keys
2. Check if your API key is active
3. Copy the key again (make sure no spaces)
4. Update `.env.local`

### Solution 2: Check Network
- Try from different network (mobile hotspot)
- Disable VPN/proxy
- Check firewall settings

### Solution 3: Use Different Email Service (Temporary)
- For local testing, you can mock email sending
- Or use a different email service temporarily

### Solution 4: Wait and Retry
- Resend API might be temporarily down
- Wait 5-10 minutes and try again

## 📝 Expected Behavior

**If Resend works:**
- Email sends successfully
- No errors in console
- Email received in inbox

**If Resend fails:**
- Error: "Unable to fetch data"
- Email not sent
- Invoice status might not update

## ⚠️ Important Notes

1. **This is NOT a queue issue** - Queue system is separate
2. **This is a Resend API connectivity problem**
3. **Queue will work fine once Resend is fixed**
4. **Local testing might have network restrictions**

## 🚀 Next Steps

1. Verify RESEND_API_KEY is correct
2. Check internet connection
3. Test Resend API directly
4. If still failing, check firewall/VPN
5. Once Resend works, queue will work too

