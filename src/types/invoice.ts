// GeneralSettings types
// export interface GeneralDraft {
//   company_name: string;
//   company_address: string;
//   primary_color: string;
//   company_logo?: File | null;
//   currency_code: string;
//   date_format: string;
// }

// export interface GeneralDraft {
//   companyName: string;           // was company_name
//   address: {                     // combine all address fields
//     plot_no?: string;
//     floor_no?: string;
//     building_name?: string;
//     street?: string;
//     area?: string;
//     city?: string;
//     pincode?: string;
//     country?: string;
//   };
//   primaryColor: string;          // was primary_color
//   companyLogo: string | null;    // ✅ BASE64
//   currency: string;              // was currency_code
//   dateFormat: string;            // was date_format
//   signature?: string | null;     // was company_signature
// }


// export interface BankPaymentDraft {
//   account_name: string;
//   account_number: string;
//   ifsc_code: string;
//   branch_name: string;
//   qr_code?: string | null; // base64 or url
// }

// // InvoiceSettings types
// export interface InvoiceDraft {
//   invoice_format: string;
// }

// // Parent draft
// export interface Draft {
//   general: GeneralDraft;
//   invoice: InvoiceDraft;
//   payment: BankPaymentDraft;
// }

// Saved setting (for cards)
// export interface SavedSetting {
//   id: number;
//   name: string;
//   general: GeneralDraft;
//   invoices: InvoiceDraft;
//   payments: BankPaymentDraft;
// }

export enum Currency {
  USD = "USD",
  INR = "INR",
  EUR = "EUR",
  GBP = "GBP",
  AUD = "AUD",
  CAD = "CAD",
  SGD = "SGD"
}

export enum DateFormat {
  DD_MM_YYYY = "DD_MM_YYYY",
  MM_DD_YYYY = "MM_DD_YYYY",
  YYYY_MM_DD = "YYYY_MM_DD",
}


export interface Customer {
  id: string;
  companyName: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  taxId?: string | null;
  
}

// Match the Service interface exactly
export interface GeneralDraft {
  companyName: string;
  address: {
    plot_no?: string;
    floor_no?: string;
    building_name?: string;
    street?: string;
    area?: string;
    city?: string;
    pincode?: string;
    country?: string;
  };
  primaryColor: string;
  companyLogo?: string | null;
  currency: Currency; 
  dateFormat: DateFormat;
  signature?: string | null;
}

export interface BankPaymentDraft {
  bankName: string;      
  accountNumber: string; 
  ifscCode: string;      
  branchName: string;    
  qrCode?: string | null; 
}

export interface InvoiceDraft {
  format: string;        
  padding: number;
  nextNumber: number;
  resetYearly: boolean;
  lastResetYear:number
}

export interface Draft {
  general: GeneralDraft;
  invoice: InvoiceDraft;
  payment: BankPaymentDraft;
}
