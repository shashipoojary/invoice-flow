# Async Queue Migration Checklist

## ✅ Implementation Complete

This document tracks the migration to async processing using Upstash QStash.

## 📋 Pre-Deployment Checklist

### 1. Upstash Setup
- [x] Created Upstash account
- [x] Created QStash project
- [x] Copied QStash token (starts with `qst_...`)
- [ ] Added `QSTASH_TOKEN` to Vercel environment variables
- [ ] Added `ENABLE_ASYNC_QUEUE=false` to Vercel (start with false for safety)

### 2. Code Deployment
- [x] Installed `@upstash/qstash` package
- [x] Created `lib/qstash-client.ts` - QStash client wrapper
- [x] Created `lib/queue-helper.ts` - Queue abstraction layer
- [x] Created `app/api/queue/send_invoice/route.ts` - Invoice send handler
- [x] Created `app/api/queue/send_reminder/route.ts` - Reminder send handler
- [x] Updated `app/api/invoices/send/route.ts` - Added queue support with fallback
- [x] Updated `app/api/reminders/send/route.ts` - Added queue support with fallback

### 3. Environment Variables
Add these to Vercel Dashboard → Settings → Environment Variables:

```
QSTASH_TOKEN=qst_your_token_here
ENABLE_ASYNC_QUEUE=false
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## 🚀 Deployment Steps

### Phase 1: Initial Deployment (Queue Disabled)
1. Deploy all code changes
2. Verify `ENABLE_ASYNC_QUEUE=false` is set
3. Test that existing functionality still works (sync mode)
4. Monitor logs for any errors

### Phase 2: Enable for Invoice Sending (Test)
1. Set `ENABLE_ASYNC_QUEUE=true` in Vercel
2. Test sending one invoice
3. Check Upstash dashboard to see job processed
4. Verify invoice was sent successfully
5. Monitor for 24 hours

### Phase 3: Enable for Reminders (Test)
1. Test sending one reminder
2. Check Upstash dashboard
3. Verify reminder was sent
4. Monitor for 24 hours

### Phase 4: Full Rollout
1. Monitor both endpoints for 48 hours
2. Check error rates in Vercel logs
3. Verify no increase in failed requests
4. Document any issues

## 🔍 Monitoring

### Upstash Dashboard
- Monitor: https://console.upstash.com/qstash
- Check: Job success rate, retry count, failures

### Vercel Logs
- Watch for: Queue failures, fallback to sync
- Monitor: Response times, error rates

### Key Metrics
- Queue success rate (should be > 99%)
- Fallback to sync rate (should be < 1%)
- Average job processing time
- Error rate

## 🛡️ Safety Features

### Automatic Fallback
- If `ENABLE_ASYNC_QUEUE=false` → Always uses sync
- If `QSTASH_TOKEN` missing → Falls back to sync
- If queue enqueue fails → Falls back to sync
- **No breaking changes** - existing code always works

### Feature Flag
- `ENABLE_ASYNC_QUEUE` controls queue usage
- Can be toggled per environment
- Can be disabled instantly if issues occur

## 📊 Rollback Plan

If issues occur:

1. **Immediate**: Set `ENABLE_ASYNC_QUEUE=false` in Vercel
2. **Verify**: All requests use sync mode (check logs)
3. **Investigate**: Review Upstash dashboard and Vercel logs
4. **Fix**: Address issues before re-enabling

## ✅ Success Criteria

- [ ] All existing functionality works unchanged
- [ ] Queue processes jobs successfully (> 99% success rate)
- [ ] No increase in error rates
- [ ] Faster API response times (immediate return)
- [ ] Jobs process within 30 seconds
- [ ] No duplicate jobs (idempotency working)

## 📝 Notes

- Queue is **additive only** - no existing code was removed
- All changes are **backward compatible**
- Sync mode remains as fallback
- Feature flag allows instant disable
- Zero downtime deployment

## 🔗 Resources

- Upstash Dashboard: https://console.upstash.com
- QStash Docs: https://docs.upstash.com/qstash
- Vercel Environment Variables: Project Settings → Environment Variables

