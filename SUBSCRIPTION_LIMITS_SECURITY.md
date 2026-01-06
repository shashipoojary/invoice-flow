# Subscription Limits - Multi-Layer Security Implementation

## Overview
This document describes the robust, multi-layer security system implemented to enforce subscription limits for invoice creation.

## Security Layers

### Layer 1: Frontend Validation (User Experience)
**Location:** `FastInvoiceModal.tsx`, `QuickInvoiceModal.tsx`, `EstimateModal.tsx`

**Purpose:** 
- Provides immediate user feedback
- Prevents unnecessary API calls
- Shows loading states and upgrade modals

**Implementation:**
- Checks subscription usage when user clicks "Create" or "Create & Send" buttons
- Shows upgrade modal if limit is reached
- Does NOT check on modal open (only on button click)

**Security Level:** ⚠️ Can be bypassed (client-side only)

---

### Layer 2: API Route Validation (Application Logic)
**Location:** `src/app/api/invoices/create/route.ts`

**Purpose:**
- Server-side validation before database operations
- Returns proper error responses
- Handles business logic

**Implementation:**
- `checkSubscriptionLimit()` function checks user's plan and current month's invoice count
- Returns 403 error with `limitReached: true` if limit exceeded
- Checks BEFORE inserting into database

**Security Level:** ⚠️ Can be bypassed if API is called directly or if there's a bug

**Note:** Changed from "fail open" to "fail closed" - if check fails, it now denies access instead of allowing.

---

### Layer 3: Database Trigger (Final Enforcement) ⭐
**Location:** `supabase/migrations/016_enforce_subscription_limits.sql`

**Purpose:**
- **ULTIMATE SECURITY LAYER** - Cannot be bypassed
- Enforces limits at database level
- Works even if API checks are skipped
- Prevents direct database inserts

**Implementation:**
- `check_subscription_limit()` function runs BEFORE INSERT on `invoices` table
- Checks user's subscription plan from `users` table
- Counts invoices created in current month
- Raises exception if free plan user exceeds 5 invoices/month
- Uses `SECURITY DEFINER` to ensure proper permissions

**Security Level:** ✅ **CANNOT BE BYPASSED** - Final enforcement layer

**Error Handling:**
- Trigger raises PostgreSQL exception with error code `P0001`
- API route catches this error and returns 403 response
- Frontend displays upgrade modal

---

## How It Works

### Normal Flow (Under Limit):
1. User clicks "Create" button
2. Frontend shows loading state immediately
3. Frontend checks subscription usage (for UX)
4. API route checks subscription limit
5. Database trigger verifies limit
6. Invoice is created successfully

### Limit Reached Flow:
1. User clicks "Create" button
2. Frontend shows loading state immediately
3. Frontend checks subscription usage → Limit reached
4. Frontend stops loading, shows upgrade modal
5. **OR** if frontend check is bypassed:
   - API route checks → Returns 403
   - **OR** if API check is bypassed:
     - Database trigger checks → Raises exception
     - API catches exception → Returns 403
     - Frontend shows upgrade modal

---

## Database Migration

To apply the database trigger, run:

```sql
-- This is in: supabase/migrations/016_enforce_subscription_limits.sql
```

The migration creates:
1. `check_subscription_limit()` function
2. `enforce_subscription_limit_trigger` trigger on `invoices` table

---

## Benefits of Multi-Layer Approach

1. **User Experience:** Frontend provides immediate feedback
2. **Performance:** API checks prevent unnecessary database operations
3. **Security:** Database trigger ensures limits cannot be bypassed
4. **Reliability:** Even if one layer fails, others protect the system
5. **Defense in Depth:** Multiple layers provide redundancy

---

## Testing

To test the database trigger:

```sql
-- Try to insert 6th invoice for a free plan user
-- Should fail with: "Subscription limit reached..."
INSERT INTO invoices (user_id, client_id, invoice_number, public_token, subtotal, total, due_date)
VALUES (
  'user-uuid-here',
  'client-uuid-here', 
  'INV-006',
  'token-here',
  100,
  100,
  CURRENT_DATE
);
```

---

## Maintenance

- The limit (5 invoices/month) is hardcoded in the trigger function
- To change the limit, update the trigger function:
  ```sql
  ALTER FUNCTION check_subscription_limit() ...
  ```
- Or create a new migration to update it

---

## Notes

- The trigger only checks for `free` plan users
- `monthly` and `pay_per_invoice` plans have no limits
- The trigger uses `SECURITY DEFINER` to ensure it has proper permissions
- The trigger runs BEFORE INSERT, so it prevents the insert if limit is exceeded

