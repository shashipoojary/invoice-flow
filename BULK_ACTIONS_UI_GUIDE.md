# Bulk Actions UI - User Guide

## How to Use Bulk Send & Bulk Mark as Paid

### Step 1: Enable Selection Mode

1. Go to `/dashboard/invoices`
2. You'll see a **"Select All"** checkbox at the top of the invoice list
3. Checkboxes will appear on each invoice card

### Step 2: Select Invoices

**Option A: Select Individual Invoices**
- Click the checkbox on each invoice card you want to select
- Selected invoices will have a blue border highlight

**Option B: Select All**
- Click the "Select All" checkbox at the top
- This selects all invoices currently visible (respects filters)

### Step 3: Perform Bulk Actions

Once you have invoices selected, a **blue toolbar** will appear showing:
- Number of selected invoices
- **"Bulk Send"** button (orange/indigo)
- **"Mark as Paid"** button (green)
- **"Cancel"** button (gray)

#### Bulk Send
1. Select invoices with status `draft` or `pending`
2. Click **"Bulk Send"** button
3. Wait for processing (button shows "Processing...")
4. Success message appears: "Successfully sent X invoice(s)"
5. Selected invoices change status to `sent`

#### Bulk Mark as Paid
1. Select invoices with any status except `paid`
2. Click **"Mark as Paid"** button
3. Wait for processing
4. Success message appears: "Successfully marked X invoice(s) as paid"
5. Selected invoices change status to `paid`
6. Scheduled reminders are automatically cancelled

### Step 4: Clear Selection

- Click **"Cancel"** button in the toolbar, OR
- Uncheck the "Select All" checkbox, OR
- Uncheck individual invoice checkboxes

---

## Visual Indicators

✅ **Selected Invoice:**
- Blue border around the card
- Checkbox is checked

❌ **Unselected Invoice:**
- Normal border
- Checkbox is unchecked

🔵 **Bulk Action Toolbar:**
- Blue background
- Appears when 1+ invoices are selected
- Shows count of selected invoices

---

## What Gets Processed

### Bulk Send
- ✅ Processes: `draft` and `pending` invoices
- ❌ Skips: `sent`, `paid`, `overdue` invoices
- Result: Status changes to `sent`

### Bulk Mark as Paid
- ✅ Processes: Any invoice that's NOT already `paid`
- ❌ Skips: Already `paid` invoices
- Result: Status changes to `paid`, reminders cancelled

---

## Tips

1. **Use Filters:** Filter by status first (e.g., "Draft") to see only relevant invoices
2. **Select All:** Use "Select All" when you want to process all visible invoices
3. **Individual Selection:** Click checkboxes individually for precise control
4. **Cancel Anytime:** Click "Cancel" to clear selection without processing

---

## Troubleshooting

**Q: I don't see checkboxes**
- Make sure you're on `/dashboard/invoices` page
- Refresh the page if needed

**Q: Bulk Send button is disabled**
- Check that you've selected invoices
- Make sure selected invoices are `draft` or `pending`

**Q: Some invoices weren't processed**
- Check invoice statuses - only valid invoices are processed
- Already `paid` invoices are skipped for "Mark as Paid"
- Already `sent` invoices are skipped for "Bulk Send"

**Q: Toolbar doesn't appear**
- Make sure at least one invoice is selected
- Check that checkboxes are actually checked

---

## Example Workflow

**Scenario: Send 5 draft invoices**

1. Go to Invoices page
2. Click "Draft" filter button
3. Click "Select All" checkbox
4. Blue toolbar appears: "5 invoices selected"
5. Click "Bulk Send" button
6. Wait for "Successfully sent 5 invoice(s)" message
7. All 5 invoices now show "Sent" status
8. Toolbar disappears automatically

**Scenario: Mark 3 pending invoices as paid**

1. Go to Invoices page
2. Click "Pending" filter button
3. Check 3 invoice cards individually
4. Blue toolbar appears: "3 invoices selected"
5. Click "Mark as Paid" button
6. Wait for "Successfully marked 3 invoice(s) as paid" message
7. All 3 invoices now show "Paid" status
8. Click "Cancel" to clear selection

