# Pay Per Invoice Billing Model

## 📋 Current Implementation

### How It Works:
1. **Plan Activation**: User selects "Pay Per Invoice" → Plan activated immediately (no upfront payment)
2. **Charging**: When user creates or sends an invoice → System charges $0.50 automatically
3. **Payment Processing**: Charge happens via Dodo Payment API immediately

### Current Flow:
```
User creates/sends invoice
    ↓
System checks if user is on "pay_per_invoice" plan
    ↓
If yes, chargeForInvoice() is called
    ↓
Creates payment link via Dodo Payment ($0.50)
    ↓
Billing record created (status: pending)
    ↓
Webhook confirms payment → status: paid
```

## 🎯 Recommended Production Model

### Option 1: Immediate Automatic Charge (Recommended)
**Best for**: Seamless user experience, no payment friction

**How it works**:
- When invoice is **sent** (not created as draft), charge $0.50 immediately
- Use Dodo Payment API to process payment automatically
- If payment fails, invoice is still sent but billing record shows "failed"
- User can retry payment later

**Pros**:
- ✅ Seamless experience
- ✅ No manual payment steps
- ✅ Clear billing per invoice

**Cons**:
- ⚠️ Requires saved payment method (card on file)
- ⚠️ Need to handle payment failures gracefully

### Option 2: Monthly Batch Billing
**Best for**: Lower transaction fees, simpler accounting

**How it works**:
- Track all invoices created/sent during the month
- At end of month, calculate total: `$0.50 × number of invoices`
- Charge user once for the total amount
- Send invoice/billing statement

**Pros**:
- ✅ Lower transaction fees (one charge vs many)
- ✅ Easier accounting
- ✅ Better for high-volume users

**Cons**:
- ⚠️ User doesn't see immediate charge
- ⚠️ Need to track monthly usage
- ⚠️ More complex implementation

### Option 3: Payment Link Per Invoice (Current)
**Best for**: No saved payment method required

**How it works**:
- When invoice is sent, create payment link
- User receives email with payment link
- User clicks link and pays $0.50
- Invoice is sent regardless of payment status

**Pros**:
- ✅ No saved payment method needed
- ✅ User controls when to pay
- ✅ Works for users without cards

**Cons**:
- ⚠️ Extra step for user
- ⚠️ Some users might forget to pay
- ⚠️ Need to track unpaid invoices

## 💡 Recommendation

**For Production**: Use **Option 1 (Immediate Automatic Charge)** with saved payment method:

1. When user selects "Pay Per Invoice" plan, collect payment method
2. Save payment method securely (via Dodo Payment)
3. When invoice is sent, charge $0.50 automatically using saved method
4. If charge fails, allow retry and show clear error message
5. Track all charges in billing_records table

## 🔧 Implementation Steps

1. **Collect Payment Method**:
   - Add payment method collection when user selects "Pay Per Invoice"
   - Use Dodo Payment's customer/payment method API
   - Store customer ID in users table

2. **Automatic Charging**:
   - Modify `chargeForInvoice()` to use saved payment method
   - Charge immediately when invoice is sent
   - Handle payment failures gracefully

3. **Billing Dashboard**:
   - Show all per-invoice charges
   - Display payment status
   - Allow retry for failed payments

4. **User Communication**:
   - Clear messaging: "You'll be charged $0.50 per invoice sent"
   - Show charge confirmation after each invoice
   - Monthly billing summary email

## 📊 Database Schema

Current `billing_records` table supports this:
- `type`: 'per_invoice_fee'
- `amount`: 0.50
- `status`: 'pending' | 'paid' | 'failed'
- `invoice_id`: Links to specific invoice

## 🚀 Next Steps

1. Decide on billing model (Option 1, 2, or 3)
2. Implement payment method collection
3. Update `chargeForInvoice()` function
4. Add billing dashboard UI
5. Add email notifications for charges

