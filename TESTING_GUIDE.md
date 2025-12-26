# Testing Guide: Duplicate Invoice & Partial Payments

## Prerequisites

### 1. Run Database Migration
First, you need to apply the new database migration for the payments table:

```bash
# If using Supabase CLI
supabase db push

# Or manually run the migration file:
# supabase/migrations/014_create_invoice_payments_table.sql
```

This creates the `invoice_payments` table needed for partial payment tracking.

---

## Testing: Duplicate Invoice Feature

### Test 1: Duplicate a Draft Invoice
1. **Navigate to**: Dashboard → Invoices page
2. **Find**: Any invoice (draft, sent, or paid)
3. **Click**: The "Duplicate" button (Copy icon) on any invoice card
4. **Expected Result**:
   - Loading spinner appears on the button
   - Success message: "Invoice [NEW_NUMBER] has been created. You can now edit it."
   - New invoice opens in edit mode
   - New invoice has:
     - ✅ New invoice number (different from original)
     - ✅ Status: "draft"
     - ✅ Same client, items, and settings
     - ✅ Issue date: Today
     - ✅ Due date: 30 days from today
     - ✅ All payment terms, late fees, reminders copied

### Test 2: Duplicate a Sent Invoice
1. **Find**: An invoice with status "sent" or "pending"
2. **Click**: Duplicate button
3. **Expected Result**:
   - New draft invoice created
   - Original invoice remains unchanged
   - All data copied correctly

### Test 3: Duplicate from Dashboard Overview
1. **Navigate to**: Dashboard (home page)
2. **Find**: Recent invoices section
3. **Click**: Duplicate button on any invoice
4. **Expected Result**: Same as Test 1

### Test 4: Verify Duplicate Doesn't Break Existing Features
1. **After duplicating**, verify:
   - ✅ Can edit the duplicated invoice
   - ✅ Can send the duplicated invoice
   - ✅ Can delete the duplicated invoice
   - ✅ Original invoice is unchanged

---

## Testing: Partial Payment Feature

### Test 1: Record First Partial Payment
1. **Navigate to**: Dashboard → Invoices
2. **Find**: An invoice with status "sent" or "pending"
3. **Click**: "View" button on the invoice
4. **In the invoice view modal**, click: **"Record Payment"** button (bottom right)
5. **Fill in the payment form**:
   - Amount: $500 (less than invoice total)
   - Payment Date: Today
   - Payment Method: "Bank Transfer" (optional)
   - Notes: "Deposit payment" (optional)
6. **Click**: "Record Payment"
7. **Expected Result**:
   - ✅ Payment recorded successfully
   - ✅ Payment appears in "Payment History" section
   - ✅ Summary shows:
     - Invoice Total: $2000
     - Total Paid: $500
     - Remaining Balance: $1500
   - ✅ Progress bar shows 25% paid
   - ✅ Invoice status remains "sent" (not fully paid yet)

### Test 2: Record Multiple Payments
1. **Record another payment** on the same invoice:
   - Amount: $300
   - Payment Method: "PayPal"
2. **Expected Result**:
   - ✅ Total Paid updates to $800
   - ✅ Remaining Balance: $1200
   - ✅ Progress bar: 40%
   - ✅ Both payments visible in history

### Test 3: Complete Payment (Auto-Mark as Paid)
1. **Record final payment** to complete the invoice:
   - Amount: $1200 (remaining balance)
2. **Expected Result**:
   - ✅ Success message
   - ✅ Invoice automatically marked as "paid"
   - ✅ Total Paid = Invoice Total
   - ✅ Remaining Balance: $0.00
   - ✅ Progress bar: 100%
   - ✅ Modal closes automatically after 1 second
   - ✅ Invoice status changes to "paid" in the list
   - ✅ Scheduled reminders cancelled (if any)

### Test 4: Payment Validation
1. **Try to record payment exceeding balance**:
   - Invoice Total: $2000
   - Already Paid: $500
   - Try to add: $1600
2. **Expected Result**:
   - ✅ Error message: "Payment amount exceeds invoice total. Maximum payment allowed: $1500.00"
   - ✅ Payment not recorded

### Test 5: Delete Payment
1. **In the payment modal**, click the trash icon on any payment
2. **Confirm deletion**
3. **Expected Result**:
   - ✅ Payment removed from history
   - ✅ Totals recalculated
   - ✅ If invoice was fully paid, status changes back to "sent"
   - ✅ Remaining balance updates

### Test 6: Payment History Display
1. **Open payment modal** for invoice with multiple payments
2. **Verify**:
   - ✅ All payments listed in reverse chronological order (newest first)
   - ✅ Each payment shows:
     - Amount
     - Payment method (if provided)
     - Payment date
     - Notes (if provided)
   - ✅ Delete button works for each payment

### Test 7: Edge Cases
1. **Try to add payment to paid invoice**:
   - Find an invoice already marked as "paid"
   - Try to record a payment
   - **Expected**: Error message or button disabled
2. **Try to add payment to draft invoice**:
   - Find a draft invoice
   - **Expected**: "Record Payment" button not visible (only for sent/pending)

### Test 8: Payment Tracking in Activity
1. **After recording payments**, check:
   - ✅ Invoice activity drawer shows payment events
   - ✅ Payment history visible
   - ✅ Totals accurate

---

## Testing: Integration Points

### Test 1: Duplicate + Partial Payment
1. **Duplicate an invoice** that has partial payments
2. **Expected**: 
   - ✅ New invoice has NO payments (fresh start)
   - ✅ Original invoice keeps its payments

### Test 2: Partial Payment + Privacy
1. **Record payments** on an invoice
2. **Mark invoice as paid** (manually or via full payment)
3. **Check activity drawer**:
   - ✅ No new activities tracked after payment
   - ✅ Payment history still visible (for owner)

### Test 3: Partial Payment + Reminders
1. **Create invoice** with auto-reminders enabled
2. **Record partial payment** (not full)
3. **Expected**: 
   - ✅ Reminders still scheduled (invoice not fully paid)
4. **Complete payment**:
   - ✅ Reminders automatically cancelled

---

## Quick Test Checklist

### Duplicate Invoice
- [ ] Duplicate button visible on all invoice cards
- [ ] Duplicate works for draft invoices
- [ ] Duplicate works for sent invoices
- [ ] Duplicate works for paid invoices
- [ ] New invoice opens in edit mode
- [ ] All data copied correctly
- [ ] New invoice has unique number
- [ ] Original invoice unchanged

### Partial Payments
- [ ] "Record Payment" button visible on sent/pending invoices
- [ ] Payment modal opens correctly
- [ ] Can record first payment
- [ ] Can record multiple payments
- [ ] Totals calculate correctly
- [ ] Progress bar updates
- [ ] Auto-marks as paid when complete
- [ ] Can delete payments
- [ ] Payment history displays correctly
- [ ] Validation prevents overpayment
- [ ] Reminders cancelled when fully paid

---

## Troubleshooting

### If duplicate doesn't work:
- Check browser console for errors
- Verify API route `/api/invoices/duplicate` exists
- Check database has `generate_invoice_number` and `generate_public_token` functions

### If payments don't work:
- Verify migration `014_create_invoice_payments_table.sql` was applied
- Check `invoice_payments` table exists in database
- Verify API route `/api/invoices/[id]/payments` exists
- Check browser console for errors

### If buttons don't appear:
- Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
- Check that invoice status is correct (sent/pending for payments)
- Verify component props are passed correctly

---

## Expected UI/UX

### Duplicate Button
- **Location**: Next to PDF button on invoice cards
- **Icon**: Copy icon
- **Style**: Gray button matching other action buttons
- **Loading**: Spinner when processing

### Record Payment Button
- **Location**: Bottom right of invoice view modal (for sent/pending invoices only)
- **Style**: Indigo button with dollar sign icon
- **Text**: "Record Payment"

### Payment Modal
- **Design**: Clean, modern, minimal (matches existing design)
- **Features**:
  - Summary section with totals and progress bar
  - Payment form
  - Payment history list
  - Delete buttons for each payment

---

## Success Criteria

✅ **Duplicate Feature**:
- Can duplicate any invoice in 1 click
- New invoice ready to edit immediately
- All data preserved correctly

✅ **Partial Payment Feature**:
- Can track deposits and milestone payments
- Clear visibility of paid vs remaining balance
- Auto-completes when fully paid
- Prevents overpayment
- Clean, intuitive UI

Both features should feel fast, simple, and not break any existing functionality!

