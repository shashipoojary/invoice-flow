import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface BusinessSettings {
  businessName?: string;
  businessEmail?: string;
  businessPhone?: string;
  logo?: string;
  paypalEmail?: string;
  cashappId?: string;
  venmoId?: string;
  googlePayUpi?: string;
  applePayId?: string;
  bankAccount?: string;
  bankIfscSwift?: string;
  bankIban?: string;
  stripeAccount?: string;
  paymentNotes?: string;
}

export interface MissingDetails {
  missing: string[];
  hasPaymentInfo: boolean;
}

/**
 * Checks for missing important business details before sending invoices
 * Returns list of missing fields and whether payment info exists
 */
export function checkMissingBusinessDetails(settings: BusinessSettings | null | undefined): MissingDetails {
  if (!settings) {
    return {
      missing: ['Business Name', 'Business Email', 'Business Phone', 'Logo', 'Payment Information'],
      hasPaymentInfo: false
    };
  }

  const missing: string[] = [];
  
  // Check required business info
  if (!settings.businessName || settings.businessName.trim() === '') {
    missing.push('Business Name');
  }
  
  if (!settings.businessEmail || settings.businessEmail.trim() === '') {
    missing.push('Business Email');
  }
  
  if (!settings.businessPhone || settings.businessPhone.trim() === '') {
    missing.push('Business Phone');
  }
  
  if (!settings.logo || settings.logo.trim() === '') {
    missing.push('Logo');
  }
  
  // Check if any payment method exists
  const hasPaymentInfo = !!(
    (settings.paypalEmail && settings.paypalEmail.trim() !== '') ||
    (settings.cashappId && settings.cashappId.trim() !== '') ||
    (settings.venmoId && settings.venmoId.trim() !== '') ||
    (settings.googlePayUpi && settings.googlePayUpi.trim() !== '') ||
    (settings.applePayId && settings.applePayId.trim() !== '') ||
    (settings.bankAccount && settings.bankAccount.trim() !== '') ||
    (settings.stripeAccount && settings.stripeAccount.trim() !== '')
  );
  
  if (!hasPaymentInfo) {
    missing.push('Payment Information');
  }
  
  return { missing, hasPaymentInfo };
}

