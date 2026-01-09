// GeneralSettings types
// export interface GeneralDraft {
//   company_name: string;
//   company_address: string;
//   primary_color: string;
//   company_logo?: File | null;
//   currency_code: string;
//   date_format: string;
// }

export interface GeneralDraft {
  company_name: string;
  company_address: string;
  primary_color: string;
  company_logo: string | null; // ✅ BASE64
  currency_code: string;
  date_format: string;
}

export interface BankPaymentDraft {
  account_name: string;
  account_number: string;
  ifsc_code: string;
  branch_name: string;
  qr_code?: string | null; // base64 or url
}

// InvoiceSettings types
export interface InvoiceDraft {
  invoice_format: string;
}

// Parent draft
export interface Draft {
  general: GeneralDraft;
  invoices: InvoiceDraft;
  payments: BankPaymentDraft;
}

// Saved setting (for cards)
export interface SavedSetting {
  id: number;
  name: string;
  general: GeneralDraft;
  invoices: InvoiceDraft;
  payments: BankPaymentDraft;
}

export type Customer = {
  id: string; // ✅ REQUIRED
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  taxid?: string;
};
