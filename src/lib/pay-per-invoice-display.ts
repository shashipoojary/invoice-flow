/**
 * Display helpers for Pay Per Invoice: which invoices count toward the 5 included sends
 * vs premium (per_invoice_fee) charges. Aligns with chargeForInvoice in invoice-billing.ts.
 */

export type InvoiceRowForPool = {
  id: string;
  type?: string | null;
  theme?: unknown;
  reminder_settings?: unknown;
};

/** Fast + Template 1 detailed invoices share the 5 free sends pool (since activation). */
export function isPoolEligibleInvoice(inv: InvoiceRowForPool): boolean {
  let invoiceType = inv.type || undefined;
  if (!invoiceType) {
    if (inv.reminder_settings) {
      invoiceType = 'detailed';
    } else if (inv.theme) {
      try {
        const theme = typeof inv.theme === 'string' ? JSON.parse(inv.theme) : inv.theme;
        if (theme && typeof theme === 'object' && Object.keys(theme).length > 0) {
          invoiceType = 'detailed';
        } else {
          invoiceType = 'fast';
        }
      } catch {
        invoiceType = 'fast';
      }
    } else {
      invoiceType = 'fast';
    }
  }

  if (invoiceType === 'fast') return true;
  if (invoiceType === 'detailed') {
    let template = 1;
    if (inv.theme) {
      try {
        const theme = typeof inv.theme === 'string' ? JSON.parse(inv.theme) : inv.theme;
        template = theme?.template ?? 1;
      } catch {
        template = 1;
      }
    }
    return template === 1;
  }
  return false;
}

/**
 * Included pool used = pool-eligible invoices that were not charged a per-invoice fee
 * (they consumed one of the 5 free sends). Capped at 5 for display.
 */
export function computeIncludedPoolUsed(
  invoicesChronological: InvoiceRowForPool[],
  chargedInvoiceIds: Set<string>
): { includedUsed: number; includedRemaining: number } {
  const eligibleWithoutCharge = invoicesChronological.filter(
    (inv) => isPoolEligibleInvoice(inv) && !chargedInvoiceIds.has(inv.id)
  ).length;
  const includedUsed = Math.min(5, eligibleWithoutCharge);
  const includedRemaining = Math.max(0, 5 - includedUsed);
  return { includedUsed, includedRemaining };
}
