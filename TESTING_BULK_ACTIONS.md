# Testing Guide: Bulk Send & Bulk Mark as Paid

## Overview
This guide explains how to test the bulk send and bulk mark as paid features. These features allow you to process multiple invoices at once.

---

## Method 1: Testing via UI (If Available)

### Step 1: Prepare Test Data

You need invoices in the correct status:

**For Bulk Send:**
- Create at least 2-3 invoices with status `draft` or `pending`
- These invoices should have:
  - Client information (name, email)
  - Invoice items
  - Total amount

**For Bulk Mark as Paid:**
- Create at least 2-3 invoices with status `sent`, `pending`, or `overdue`
- These should NOT already be `paid`

### Step 2: Access the Invoices Page

1. Navigate to `/dashboard/invoices`
2. Look for:
   - Checkboxes next to each invoice card
   - A toolbar/header with "Bulk Actions" or selection buttons
   - "Select All" checkbox

### Step 3: Test Bulk Send

1. **Select invoices:**
   - Check the boxes next to 2-3 draft/pending invoices
   - Or click "Select All" if available

2. **Initiate bulk send:**
   - Look for a "Bulk Send" or "Send Selected" button
   - Click it

3. **Verify results:**
   - ✅ Success message should appear: "Successfully sent X invoice(s)"
   - ✅ Selected invoices should change status from `draft`/`pending` → `sent`
   - ✅ Invoice cards should update to show "Sent" status
   - ✅ Check database: `status` column should be `'sent'` for those invoices

### Step 4: Test Bulk Mark as Paid

1. **Select invoices:**
   - Check the boxes next to 2-3 sent/pending invoices
   - Make sure they're NOT already paid

2. **Initiate bulk mark paid:**
   - Look for a "Bulk Mark as Paid" or "Mark Selected as Paid" button
   - Click it

3. **Verify results:**
   - ✅ Success message: "Successfully marked X invoice(s) as paid"
   - ✅ Selected invoices should change status to `paid`
   - ✅ Invoice cards should update to show "Paid" status
   - ✅ Check database: `status` column should be `'paid'`
   - ✅ Check `invoice_events` table: Should have entries with `type = 'paid'` and `metadata.bulk = true`
   - ✅ Check `invoice_reminders` table: Scheduled reminders should be cancelled

---

## Method 2: Testing via API Directly (If UI Not Available)

If the UI doesn't have bulk action buttons yet, you can test the API endpoints directly.

### Prerequisites

1. **Get your authentication token:**
   - Open browser DevTools (F12)
   - Go to Application/Storage → Local Storage
   - Find `supabase.auth.token` or similar
   - Copy the access token

2. **Get invoice IDs:**
   - Go to `/dashboard/invoices`
   - Open browser console (F12 → Console)
   - Run: `document.querySelectorAll('[data-invoice-id]')` or check network requests

### Test Bulk Send API

**Endpoint:** `POST /api/invoices/bulk/send`

**Request:**
```bash
curl -X POST http://localhost:3000/api/invoices/bulk/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "invoiceIds": ["invoice-id-1", "invoice-id-2", "invoice-id-3"]
  }'
```

**Or using JavaScript in browser console:**
```javascript
// First, get some draft/pending invoice IDs
const invoiceIds = ['id1', 'id2', 'id3']; // Replace with actual IDs

fetch('/api/invoices/bulk/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    // Add your auth headers here
  },
  body: JSON.stringify({ invoiceIds })
})
.then(r => r.json())
.then(data => console.log('Result:', data))
.catch(err => console.error('Error:', err));
```

**Expected Response:**
```json
{
  "success": true,
  "count": 3,
  "invoiceNumbers": ["INV-001", "INV-002", "INV-003"]
}
```

**Verification:**
1. Check invoices in database: `status` should be `'sent'`
2. Check `invoice_events` table: Should have entries with `type = 'sent'` and `metadata.bulk = true`

### Test Bulk Mark as Paid API

**Endpoint:** `POST /api/invoices/bulk/mark-paid`

**Request:**
```bash
curl -X POST http://localhost:3000/api/invoices/bulk/mark-paid \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "invoiceIds": ["invoice-id-1", "invoice-id-2", "invoice-id-3"]
  }'
```

**Or using JavaScript:**
```javascript
const invoiceIds = ['id1', 'id2', 'id3']; // Replace with actual IDs

fetch('/api/invoices/bulk/mark-paid', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    // Add your auth headers here
  },
  body: JSON.stringify({ invoiceIds })
})
.then(r => r.json())
.then(data => console.log('Result:', data))
.catch(err => console.error('Error:', err));
```

**Expected Response:**
```json
{
  "success": true,
  "count": 3,
  "invoiceNumbers": ["INV-001", "INV-002", "INV-003"]
}
```

**Verification:**
1. Check invoices: `status` should be `'paid'`
2. Check `invoice_events`: Should have `type = 'paid'` with `metadata.bulk = true`
3. Check `invoice_reminders`: Scheduled reminders should have `reminder_status = 'cancelled'`

---

## Method 3: Testing via Database (Direct Verification)

### Check Bulk Send Results

```sql
-- Check invoice statuses
SELECT id, invoice_number, status, updated_at
FROM invoices
WHERE id IN ('id1', 'id2', 'id3')
ORDER BY updated_at DESC;

-- Check events
SELECT invoice_id, type, metadata, created_at
FROM invoice_events
WHERE invoice_id IN ('id1', 'id2', 'id3')
  AND type = 'sent'
  AND metadata->>'bulk' = 'true';
```

### Check Bulk Mark Paid Results

```sql
-- Check invoice statuses
SELECT id, invoice_number, status, updated_at
FROM invoices
WHERE id IN ('id1', 'id2', 'id3')
ORDER BY updated_at DESC;

-- Check events
SELECT invoice_id, type, metadata, created_at
FROM invoice_events
WHERE invoice_id IN ('id1', 'id2', 'id3')
  AND type = 'paid'
  AND metadata->>'bulk' = 'true';

-- Check reminders were cancelled
SELECT invoice_id, reminder_status, failure_reason
FROM invoice_reminders
WHERE invoice_id IN ('id1', 'id2', 'id3')
  AND reminder_status = 'cancelled';
```

---

## Test Cases to Verify

### ✅ Bulk Send Test Cases

1. **Valid invoices (draft/pending):**
   - ✅ Should update status to `sent`
   - ✅ Should log events
   - ✅ Should return success message

2. **Invalid invoices (already sent/paid):**
   - ✅ Should skip invalid invoices
   - ✅ Should only process valid ones
   - ✅ Should return count of actually processed invoices

3. **Empty selection:**
   - ✅ Should show error: "No valid invoices found to send"

4. **Mixed statuses:**
   - ✅ Should only process draft/pending invoices
   - ✅ Should ignore already sent/paid invoices

### ✅ Bulk Mark Paid Test Cases

1. **Valid invoices (not paid):**
   - ✅ Should update status to `paid`
   - ✅ Should log events
   - ✅ Should cancel scheduled reminders
   - ✅ Should return success message

2. **Invalid invoices (already paid):**
   - ✅ Should skip already paid invoices
   - ✅ Should only process unpaid ones

3. **Empty selection:**
   - ✅ Should show error: "No valid invoices found to mark as paid"

4. **Reminder cancellation:**
   - ✅ Should cancel only scheduled reminders
   - ✅ Should NOT affect sent/delivered reminders
   - ✅ Should set failure_reason appropriately

---

## Common Issues & Solutions

### Issue: "No valid invoices found"
**Solution:** Make sure:
- Invoices belong to your user account
- For bulk send: Invoices are `draft` or `pending`
- For bulk mark paid: Invoices are NOT already `paid`

### Issue: API returns 401 Unauthorized
**Solution:** 
- Check authentication token is valid
- Make sure you're logged in
- Check token hasn't expired

### Issue: Some invoices not processed
**Solution:**
- Check invoice statuses in database
- Verify invoices belong to your user
- Check console/network tab for errors

### Issue: Reminders not cancelled
**Solution:**
- Verify reminders exist in `invoice_reminders` table
- Check `reminder_status` is `'scheduled'` (only scheduled reminders are cancelled)
- Check `failure_reason` field for details

---

## Quick Test Script

Here's a complete test script you can run in browser console:

```javascript
// Test Bulk Send
async function testBulkSend() {
  const invoiceIds = ['id1', 'id2']; // Replace with actual IDs
  
  try {
    const response = await fetch('/api/invoices/bulk/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ invoiceIds })
    });
    
    const data = await response.json();
    console.log('Bulk Send Result:', data);
    
    if (data.success) {
      console.log(`✅ Successfully sent ${data.count} invoices`);
      console.log('Invoice numbers:', data.invoiceNumbers);
    } else {
      console.error('❌ Error:', data.error);
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
}

// Test Bulk Mark Paid
async function testBulkMarkPaid() {
  const invoiceIds = ['id1', 'id2']; // Replace with actual IDs
  
  try {
    const response = await fetch('/api/invoices/bulk/mark-paid', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ invoiceIds })
    });
    
    const data = await response.json();
    console.log('Bulk Mark Paid Result:', data);
    
    if (data.success) {
      console.log(`✅ Successfully marked ${data.count} invoices as paid`);
      console.log('Invoice numbers:', data.invoiceNumbers);
    } else {
      console.error('❌ Error:', data.error);
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
}

// Run tests
// testBulkSend();
// testBulkMarkPaid();
```

---

## Summary

**Bulk Send:**
- Changes `draft`/`pending` → `sent`
- Logs events with `bulk: true`
- Does NOT send emails (only changes status)

**Bulk Mark Paid:**
- Changes any non-paid status → `paid`
- Logs events with `bulk: true`
- Cancels scheduled reminders
- Does NOT create payment records

Both features:
- ✅ Validate user ownership
- ✅ Only process valid invoices
- ✅ Return count of processed invoices
- ✅ Log events for audit trail

