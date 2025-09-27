// Shared types for the InvoiceFlow application

export interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  rate: number;
  amount: number | string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  client: Client;
  items: InvoiceItem[];
  subtotal: number;
  discount?: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  type?: 'fast' | 'detailed';
  dueDate: string;
  createdAt: string;
  notes?: string;
  clientName: string;
  clientEmail: string;
  clientCompany: string;
  clientAddress?: string;
  // New fields for enhanced invoices
  issueDate?: string;
  paymentTerms?: {
    enabled: boolean;
    terms: string;
  };
  lateFees?: {
    enabled: boolean;
    type: 'fixed' | 'percentage';
    amount: number;
    gracePeriod: number;
  };
  reminders?: {
    enabled: boolean;
    useSystemDefaults: boolean;
    rules: Array<{
      id: string;
      type: 'before' | 'after';
      days: number;
      enabled: boolean;
    }>;
  };
  theme?: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
  };
  // Database field names (for compatibility)
  client_id?: string;
  due_date?: string;
  tax_rate?: number;
  invoice_number?: string;
  created_at?: string;
}

export interface FreelancerSettings {
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  address: string;
  website: string;
  logo: string;
  paypalEmail: string;
  cashappId: string;
  venmoId: string;
  googlePayUpi: string;
  applePayId: string;
  bankAccount: string;
  bankIfscSwift: string;
  bankIban: string;
  stripeAccount: string;
  paymentNotes: string;
}

export interface BusinessSettings {
  businessName: string;
  logo: string;
  address: string;
  businessEmail: string;
  businessPhone: string;
  paypalEmail: string;
  cashappId: string;
  venmoId: string;
  googlePayUpi: string;
  applePayId: string;
  bankAccount: string;
  bankIfscSwift: string;
  bankIban: string;
  stripeAccount: string;
  paymentNotes: string;
}
