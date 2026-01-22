# Feature Explanation: Write Off, Bulk Send, and Bulk Mark as Paid

## 1. WRITE OFF Feature

### Purpose
Allows you to write off (forgive) a portion or all of an unpaid invoice amount and mark the invoice as paid. This is useful when:
- A client disputes charges
- You agree to a discount
- You decide to forgive a debt
- Bad debt write-off

### How It Works

#### Frontend (WriteOffModal.tsx)
1. **User opens modal** → Shows invoice details
2. **Calculates total owed**:
   - Invoice total
   - Minus any existing payments
   - Plus late fees (if overdue)
3. **Pre-fills write-off amount** with total owed (user can adjust)
4. **Validates** write-off amount ≤ total owed
5. **Sends request** to `/api/invoices/[id]/writeoff`

#### Backend (writeoff/route.ts)
**Step-by-step logic:**

1. **Authentication & Validation** (Lines 11-21)
   - ✅ Checks user is authenticated
   - ✅ Validates write-off amount is provided and ≥ 0

2. **Invoice Verification** (Lines 23-40)
   - ✅ Verifies invoice belongs to user
   - ✅ Checks invoice is NOT already paid (prevents double write-off)
   - ✅ Returns error if invoice not found or already paid

3. **Calculate Existing Payments** (Lines 42-49)
   - ✅ Fetches all existing payments from `invoice_payments` table
   - ✅ Sums them to get `totalPaid`
   - ✅ Calculates `remainingBalance = invoice.total - totalPaid`

4. **Calculate Late Fees** (Lines 51-83)
   - ✅ Checks if invoice has due_date and late_fees settings
   - ✅ Determines if invoice is overdue (dueDate < today)
   - ✅ If overdue:
     - Calculates days overdue
     - Applies grace period
     - Calculates late fee based on type:
       - **Percentage**: `lateFeesAmount = remainingBalance × (percentage / 100)`
       - **Fixed**: `lateFeesAmount = fixed amount`
   - ✅ Only applies if `daysOverdue > gracePeriod`

5. **Calculate Total Owed** (Lines 85-86)
   ```
   totalPayable = invoice.total + lateFeesAmount
   totalOwed = totalPayable - totalPaid
   ```

6. **Validate Write-off Amount** (Lines 88-93)
   - ✅ Ensures write-off amount ≤ totalOwed
   - ✅ Prevents writing off more than what's actually owed

7. **Update Invoice** (Lines 95-106)
   - ✅ Sets `status = 'paid'`
   - ✅ Saves `write_off_amount` to database
   - ✅ Saves `write_off_notes` (optional)
   - ✅ Updates `updated_at` timestamp

8. **Log Event** (Lines 113-120)
   - ✅ Creates event in `invoice_events` table
   - ✅ Records write-off amount and notes in metadata

9. **Cancel Reminders** (Lines 122-134)
   - ✅ Cancels all scheduled reminders for this invoice
   - ✅ Sets `reminder_status = 'cancelled'`
   - ✅ Records reason: "Invoice marked as paid with write-off"

### Logic Analysis ✅

**CORRECT LOGIC:**
- ✅ Prevents writing off already-paid invoices
- ✅ Calculates late fees correctly (only if overdue)
- ✅ Accounts for existing payments
- ✅ Validates write-off amount doesn't exceed total owed
- ✅ Cancels reminders (good cleanup)
- ✅ Logs events for audit trail

**POTENTIAL ISSUES:**
- ⚠️ **Late fees calculation**: Uses `remainingBalance` for percentage calculation (Line 73). This means late fees are calculated on the remaining balance after payments, not the original invoice total. This is likely intentional - late fees on what's still owed.
- ✅ **No payment record created**: The write-off doesn't create a payment record in `invoice_payments` table. This is intentional - write-off is different from payment.

---

## 2. BULK SEND Feature

### Purpose
Send multiple invoices at once by changing their status from `draft` or `pending` to `sent`.

### How It Works

#### Frontend (invoices/page.tsx - handleBulkSend)
1. **User selects multiple invoices** (checkbox selection)
2. **Clicks "Bulk Send"** button
3. **Sends array of invoice IDs** to `/api/invoices/bulk/send`

#### Backend (bulk/send/route.ts)
**Step-by-step logic:**

1. **Authentication** (Lines 8-11)
   - ✅ Checks user is authenticated

2. **Input Validation** (Lines 13-17)
   - ✅ Validates `invoiceIds` is an array and not empty

3. **Fetch & Verify Invoices** (Lines 19-34)
   - ✅ Fetches invoices that:
     - Belong to the user (`user_id = user.id`)
     - Are in the provided list (`id IN invoiceIds`)
     - Have status `'draft'` OR `'pending'` (Line 25)
   - ✅ Returns error if no valid invoices found

4. **Update Status** (Lines 36-48)
   - ✅ Updates all valid invoices to `status = 'sent'`
   - ✅ Updates `updated_at` timestamp
   - ✅ Uses bulk update (`.in('id', ...)`) for efficiency

5. **Log Events** (Lines 50-63)
   - ✅ Creates events in `invoice_events` table for each invoice
   - ✅ Sets `type = 'sent'`
   - ✅ Marks as bulk operation in metadata
   - ✅ Doesn't fail if event logging fails (graceful degradation)

### Logic Analysis ✅

**CORRECT LOGIC:**
- ✅ Only processes invoices that belong to user (security)
- ✅ Only processes draft/pending invoices (prevents re-sending paid invoices)
- ✅ Uses bulk operations for efficiency
- ✅ Logs events for audit trail
- ✅ Graceful error handling

**POTENTIAL ISSUES:**
- ⚠️ **No email sending**: This only changes status to 'sent' - it does NOT actually send emails! This might be intentional if emails are sent separately via a queue system.
- ⚠️ **No validation**: Doesn't check if invoices have required fields (client email, etc.) before marking as sent
- ✅ **Status transition**: `draft` → `sent` and `pending` → `sent` are both valid transitions

**IMPORTANT NOTE:**
This endpoint only updates the database status. If you want to actually send emails, you would need to:
1. Call the individual send endpoint for each invoice, OR
2. Queue email sending jobs after status update

---

## 3. BULK MARK AS PAID Feature

### Purpose
Mark multiple invoices as paid at once without creating payment records.

### How It Works

#### Frontend (invoices/page.tsx - handleBulkMarkPaid)
1. **User selects multiple invoices** (checkbox selection)
2. **Clicks "Bulk Mark as Paid"** button
3. **Sends array of invoice IDs** to `/api/invoices/bulk/mark-paid`

#### Backend (bulk/mark-paid/route.ts)
**Step-by-step logic:**

1. **Authentication** (Lines 8-11)
   - ✅ Checks user is authenticated

2. **Input Validation** (Lines 13-17)
   - ✅ Validates `invoiceIds` is an array and not empty

3. **Fetch & Verify Invoices** (Lines 19-34)
   - ✅ Fetches invoices that:
     - Belong to the user (`user_id = user.id`)
     - Are in the provided list (`id IN invoiceIds`)
     - Are NOT already paid (`status != 'paid'`) (Line 25)
   - ✅ Returns error if no valid invoices found

4. **Update Status** (Lines 36-48)
   - ✅ Updates all valid invoices to `status = 'paid'`
   - ✅ Updates `updated_at` timestamp
   - ✅ Uses bulk update for efficiency

5. **Log Events** (Lines 50-63)
   - ✅ Creates events in `invoice_events` table for each invoice
   - ✅ Sets `type = 'paid'`
   - ✅ Marks as bulk operation in metadata
   - ✅ Doesn't fail if event logging fails

6. **Cancel Reminders** (Lines 65-78)
   - ✅ Cancels all scheduled reminders for these invoices
   - ✅ Updates `invoice_reminders` table
   - ✅ Sets `reminder_status = 'cancelled'`
   - ✅ Records reason: "Invoice marked as paid via bulk action"
   - ✅ Only cancels reminders with status `'scheduled'`
   - ✅ Doesn't fail if reminder update fails

### Logic Analysis ✅

**CORRECT LOGIC:**
- ✅ Only processes invoices that belong to user (security)
- ✅ Prevents marking already-paid invoices as paid again
- ✅ Uses bulk operations for efficiency
- ✅ Logs events for audit trail
- ✅ Cancels reminders (important cleanup - prevents sending reminders for paid invoices)
- ✅ Graceful error handling

**POTENTIAL ISSUES:**
- ⚠️ **No payment records**: This doesn't create entries in `invoice_payments` table. This is intentional - it's a simple status change, not a payment record.
- ⚠️ **No validation**: Doesn't check if invoices have any outstanding balance or if they should be marked as paid
- ✅ **Status transition**: Any non-paid status → `paid` is valid

**IMPORTANT NOTE:**
This is a simple status update. If you need to:
- Record actual payment amounts
- Track payment dates
- Handle partial payments

You would need to use the individual payment endpoints instead.

---

## Summary Comparison

| Feature | What It Does | Status Change | Creates Payment Record? | Sends Email? | Cancels Reminders? |
|---------|-------------|---------------|------------------------|--------------|-------------------|
| **Write Off** | Forgive debt & mark paid | → `paid` | ❌ No | ❌ No | ✅ Yes |
| **Bulk Send** | Mark as sent | `draft`/`pending` → `sent` | ❌ No | ❌ No | ❌ No |
| **Bulk Mark Paid** | Mark as paid | Any → `paid` | ❌ No | ❌ No | ✅ Yes |

---

## Recommendations

1. **Fix the syntax error** in writeoff route
2. **Consider adding payment records** for write-off (optional - depends on business logic)
3. **Add validation** to bulk send to ensure invoices have required fields
4. **Consider actual email sending** in bulk send (or document that it's status-only)
5. **Add confirmation dialogs** for bulk operations (especially mark as paid)

