# Async Queue Testing Guide

## 🧪 Testing Checklist

### Phase 1: Test with Queue DISABLED (Current State)
**Goal**: Verify existing functionality still works (sync mode)

1. **Test Invoice Sending (Sync Mode)**
   - [ ] Go to dashboard → Invoices
   - [ ] Select an invoice and click "Send Invoice"
   - [ ] Verify invoice is sent immediately
   - [ ] Check email is received
   - [ ] Verify invoice status changes to "sent"
   - [ ] Check Vercel logs - should see "Queue failed, falling back to synchronous processing" (expected)

2. **Test Reminder Sending (Sync Mode)**
   - [ ] Go to dashboard → Reminders
   - [ ] Send a manual reminder for an overdue invoice
   - [ ] Verify reminder is sent immediately
   - [ ] Check email is received
   - [ ] Verify reminder status updates in database

**Expected Result**: Everything works exactly as before (synchronous processing)

---

### Phase 2: Enable Queue and Test (Async Mode)

**Step 1: Enable Queue in Vercel**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add/Update: `ENABLE_ASYNC_QUEUE=true`
3. Redeploy (or wait for auto-deploy)

**Step 2: Test Invoice Sending (Async Mode)**
- [ ] Send an invoice
- [ ] **API should return immediately** with `queued: true` and `jobId`
- [ ] Check Upstash Dashboard: https://console.upstash.com/qstash
  - [ ] Job should appear in "Messages" tab
  - [ ] Status should change from "Pending" → "Processing" → "Completed"
- [ ] Wait 5-10 seconds, then verify:
  - [ ] Email is received
  - [ ] Invoice status is "sent"
  - [ ] Invoice events show "sent" event

**Step 3: Test Reminder Sending (Async Mode)**
- [ ] Send a reminder
- [ ] **API should return immediately** with `queued: true` and `jobId`
- [ ] Check Upstash Dashboard:
  - [ ] Job appears and processes successfully
- [ ] Wait 5-10 seconds, then verify:
  - [ ] Reminder email is received
  - [ ] Reminder status updates in database

**Step 4: Test Error Handling**
- [ ] Try sending invoice with invalid email (should fail gracefully)
- [ ] Check Upstash Dashboard - job should show "Failed" status
- [ ] Check retry behavior (should retry 3 times)

---

## 🔍 What to Monitor

### Vercel Logs
Watch for these log messages:
- ✅ `Invoice queued for sending (jobId: ...)` - Queue working
- ⚠️ `Queue failed, falling back to synchronous processing` - Fallback working
- ❌ Any error messages

### Upstash Dashboard
Monitor at: https://console.upstash.com/qstash
- **Messages Tab**: See all queued jobs
- **Status**: Pending → Processing → Completed/Failed
- **Retries**: Check if jobs are retrying
- **Response Time**: Should be < 30 seconds

### Database
Check these tables:
- `invoices` - Status should update to "sent"
- `invoice_events` - Should have "sent" event
- `invoice_reminders` - Status should update to "sent"

---

## 🐛 Troubleshooting

### Issue: Queue not working
**Check:**
1. `ENABLE_ASYNC_QUEUE=true` in Vercel?
2. `QSTASH_TOKEN` set correctly?
3. Upstash dashboard shows jobs?
4. Vercel logs for errors?

### Issue: Jobs failing
**Check:**
1. Upstash dashboard → Messages → Click failed job → See error details
2. Vercel logs for the queue handler route
3. Verify `NEXT_PUBLIC_APP_URL` is set correctly (needed for queue handler URLs)

### Issue: Jobs stuck in "Pending"
**Check:**
1. Queue handler routes are accessible: `/api/queue/send_invoice` and `/api/queue/send_reminder`
2. No errors in Vercel logs
3. Upstash service status

---

## ✅ Success Criteria

**Queue Enabled:**
- [ ] API returns immediately (< 1 second)
- [ ] Jobs process within 30 seconds
- [ ] Emails are sent successfully
- [ ] Database updates correctly
- [ ] No increase in error rates
- [ ] Upstash dashboard shows successful jobs

**Fallback Working:**
- [ ] If queue fails, sync processing still works
- [ ] No user-facing errors
- [ ] Logs show fallback messages

---

## 🚀 Quick Test Commands

### Test Invoice Send (via API)
```bash
curl -X POST https://your-app.vercel.app/api/invoices/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"invoiceId": "YOUR_INVOICE_ID", "clientEmail": "test@example.com", "clientName": "Test"}'
```

**Expected Response (Queue Enabled):**
```json
{
  "success": true,
  "queued": true,
  "jobId": "msg_xxxxx",
  "message": "Invoice queued for sending"
}
```

**Expected Response (Queue Disabled):**
```json
{
  "success": true,
  "message": "Invoice sent successfully",
  "emailId": "xxxxx",
  "invoice": {...}
}
```

---

## 📊 Performance Comparison

### Before (Sync):
- Response time: 5-15 seconds (waits for email + PDF generation)
- User waits for completion
- Timeout risk on slow connections

### After (Async):
- Response time: < 1 second (immediate return)
- User gets instant feedback
- No timeout risk
- Better scalability

---

## 🎯 Next Steps After Testing

1. **If everything works:**
   - Keep `ENABLE_ASYNC_QUEUE=true`
   - Monitor for 24-48 hours
   - Check error rates

2. **If issues found:**
   - Set `ENABLE_ASYNC_QUEUE=false` (instant rollback)
   - Fix issues
   - Re-enable when ready

3. **Production Ready:**
   - Monitor Upstash usage (free tier limits)
   - Set up alerts for failed jobs
   - Document any edge cases
