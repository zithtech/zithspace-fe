

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
  gstin?: string | null;
  pan?: string | null;
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
  // padding: number;
  // nextNumber: number;
  // resetYearly: boolean;
  // lastResetYear:number
}

export interface Draft {
  general: GeneralDraft;
  invoice: InvoiceDraft;
  payment: BankPaymentDraft;
}
