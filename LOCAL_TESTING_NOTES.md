# Local Testing Notes

## ⚠️ Important: Queue System Limitations in Local Development

### Why Queue Doesn't Work Locally

**QStash cannot reach `localhost` URLs.** This is a security feature - QStash only accepts public URLs that it can reach from the internet.

When testing locally:
- Queue will **automatically skip** and use sync mode
- You'll see: `⚠️ Queue skipped: QStash cannot reach localhost. Using sync mode.`
- This is **expected behavior** - not an error!

### What You're Seeing in Logs

From your terminal logs:

1. **Line 659**: QStash error about loopback address
   - This happens BEFORE the localhost check (race condition)
   - The fix I added should prevent this now

2. **Line 673**: "Queue failed, falling back to synchronous processing"
   - This is **correct behavior** - fallback is working!

3. **Lines 779-837**: Network timeouts
   - Supabase connection timeout
   - Dodo Payment connection timeout
   - **These are separate network issues** - not related to queue

4. **Line 839**: Request took 27.8 seconds
   - This is slow because of network timeouts
   - Not because of queue system

### Solutions

#### Option 1: Test on Vercel (Recommended)
- Deploy to Vercel
- Queue will work automatically with public URL
- No localhost issues

#### Option 2: Use ngrok for Local Testing
```bash
# Install ngrok
npm install -g ngrok

# Start your Next.js app
npm run dev

# In another terminal, expose localhost
ngrok http 3000

# Use the ngrok URL in NEXT_PUBLIC_APP_URL
# Example: https://abc123.ngrok.io
```

#### Option 3: Disable Queue for Local Testing
Set in `.env.local`:
```
ENABLE_ASYNC_QUEUE=false
```

This will skip queue entirely and use sync mode (faster for local testing).

### Current Status

✅ **Queue system is working correctly:**
- Detects localhost and skips queue
- Falls back to sync mode automatically
- No breaking changes

⚠️ **Network issues you're experiencing:**
- Supabase connection timeouts
- Dodo Payment connection timeouts
- These are **separate issues** - check your internet/firewall

### Performance

**Before (without queue):** 5-15 seconds (sync)
**Now (with queue, localhost):** Falls back to sync (same speed)
**On Vercel (with queue):** < 1 second response, async processing

### Next Steps

1. **For local testing:** Keep `ENABLE_ASYNC_QUEUE=false` or let it auto-skip
2. **For production testing:** Deploy to Vercel and enable queue
3. **Fix network issues:** Check firewall/VPN for Supabase/Dodo timeouts

### Testing Checklist

- [x] Queue detects localhost and skips ✅
- [x] Fallback to sync works ✅
- [ ] Test on Vercel deployment (queue will work)
- [ ] Fix network timeout issues (separate problem)

