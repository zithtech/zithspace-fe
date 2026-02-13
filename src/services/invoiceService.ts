import { apiClient } from '@/lib/axios';

/* ==================== ENUMS ==================== */

export type InvoiceStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'SENT'
  | 'PAID'
  |'PARTIALLY_PAID'
  | 'OVERDUE'
  | 'CANCELLED';

export type InvoiceType =
  | 'STANDARD'
  | 'PROFORMA'
  | 'CREDIT'
  | 'TAX'
  | 'DEBIT'
  | 'RECURRING';

export type RecurringFrequency =
  | 'WEEKLY'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'YEARLY';

/* ==================== TYPES ==================== */

export interface InvoiceItem {
  id?: string;
  item: string;
  description?: string;
  qty: number;
  price: number;
  tax?: number;
}

export interface Invoice {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  invoiceType: InvoiceType;
  currency: string;

  invoiceDate: string;
  dueDate: string;
  customerId:String,
  customerSnapshot:JSON,

  subtotal: number;
  taxTotal: number;
  discount: number;
  total: number;
  paidAmount: number;
  balanceDue: number;
  recurringFrequency?: RecurringFrequency;
  taxInclusive:boolean;
  notes?: string;
  terms?: string;
  pdfUrl:string;

  sentAt?: string;
  paidAt?: string;
  cancelledAt?: string;
  settingsProfileId?: string;

  customer: {
    id: string;
    companyName: string;
    email?: string;
  };

  items: InvoiceItem[];

  createdAt: string;
  updatedAt: string;
}


interface UpdateInvoiceStatusPayload {
  status: InvoiceStatus;
  description?: string;
  payment?: {
    amount: number;
    method: string;
    description?: string;
    date?: string;
  };
  // Keep these for backward compatibility if needed
  paidAmount?: number;
  paidAt?: string | Date;
}
/* ==================== PAYLOADS ==================== */

export interface CreateInvoiceData {
  customerId?: string;
  customerSnapshot?: any;
  items: InvoiceItem[];
  discount?: number;
  currency: string;
  invoiceDate: string;
  dueDate: string;
  notes?: string;
  terms?: string;
  invoiceType?: InvoiceType;
  recurringFrequency?: RecurringFrequency;
  settingsProfileId?: string;
}

export interface UpdateInvoiceData extends Partial<CreateInvoiceData> {
  items: InvoiceItem[];
}

export interface InvoiceListParams {
  page?: number;
  limit?: number;
  status?: InvoiceStatus;
  customerId?: string;
  search?: string;
}
export type PaymentStatus =
  | 'PENDING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REFUNDED'
  | 'CANCELLED';


  export type PaymentMethod =
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'CHECK'
  | 'PAYPAL'
  | 'STRIPE'
  | 'OTHER';



export interface InvoicePaymentTransaction {
  id: string;
  amount: number;
  paymentDate: string;
  description?: string;
  paymentMethod?: PaymentMethod;
  status: PaymentStatus;
  createdBy?: string;
}

type InvoicePaymentHistory = {
  totalAmount: number;
  totalPaid: number;
  balance: number;
  transactions: {
    id: string;
    paymentDate: string;
    amount: number;
    paymentMethod: string;
    status: string;
    description?: string;
  }[];
};


export interface PaymentTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM AM/PM
  amount: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  referenceId?: string;
  description?: string;
  balanceBefore: string;
  balanceAfter: string;
  totalPaid: string;
  balanceDue: string;
  processedBy?: string;
  paymentDate: string;
  createdAt: string;
  updatedAt: string;
}


export interface PaymentSummary {
  invoiceNumber: string;
  customerName: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: string;
  totalPaid: string;
  totalRefunded: string;
  netPaid: string;
  balanceDue: string;
  invoiceStatus: string;
  paymentCount: number;
  completedPayments: number;
  refundedPayments: number;
  failedPayments: number;
  pendingPayments: number;
  firstPaymentDate?: string;
  lastPaymentDate?: string;
  fullyPaidDate?: string;
  sentAt?: string;
  paidAt?: string;
  cancelledAt?: string;
}

export interface PaymentHistoryData {
  summary: PaymentSummary;
  payments: PaymentTransaction[];
  rawPayments: any[];
}


export interface SendEmailPayload {
  to: string;
  subject: string;
  message?: string; // The custom text from the Drawer
}

/* ==================== API RESPONSES ==================== */

interface ApiListResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/* ==================== SERVICE ==================== */

class InvoiceService {
  static async getInvoices(params?: InvoiceListParams) {
    try {
      const response = await apiClient.get<ApiListResponse<Invoice[]>>(
        '/api/invoices',
        { params }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch invoices');
    }
  }

  static async getInvoiceById(id: string): Promise<Invoice> {
    try {
      const response = await apiClient.get<ApiResponse<Invoice>>(
        `/api/invoices/${id}`
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch invoice');
    }
  }

  // static async getNextInvoiceNumber(): Promise<{ invoiceNumber: string }> {
  //   try {
  //     const response = await apiClient.get<ApiResponse<{ invoiceNumber: string }>>(
  //       '/api/invoices/next-number'
  //     );
  //     return response.data.data;
  //   } catch (error: any) {
  //     throw new Error(error.response?.data?.error || 'Failed to get invoice number');
  //   }
  // }

  static async getNextInvoiceNumber(profileId?: string): Promise<{ invoiceNumber: string }> {
  try {
    const params = new URLSearchParams();
    if (profileId) {
      params.append('profileId', profileId);
    }
    
    const response = await apiClient.get<ApiResponse<{ invoiceNumber: string }>>(
      `/api/invoices/next-number?${params.toString()}`
    );
    return response.data.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to get invoice number');
  }
}

  static async createInvoice(data: CreateInvoiceData): Promise<Invoice> {
    try {
      const response = await apiClient.post<ApiResponse<Invoice>>(
        '/api/invoices',
        data
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to create invoice');
    }
  }

  static async updateInvoice(
    id: string,
    data: UpdateInvoiceData
  ): Promise<Invoice> {
    try {
      const response = await apiClient.put<ApiResponse<Invoice>>(
        `/api/invoices/${id}`,
        data
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update invoice');
    }
  }

 

  static async updateInvoiceStatus(
  id: string,
  data: UpdateInvoiceStatusPayload
): Promise<Invoice> {
  try {
    const response = await apiClient.patch<ApiResponse<Invoice>>(
      `/api/invoices/${id}/status`,
      data  // Send the entire data object
    );
    return response.data.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to update status');
  }
}

  static async deleteInvoice(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/invoices/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to delete invoice');
    }
  }

  /**
   * Downloads the invoice PDF. 
   * Handles the Bearer token and the backend redirect.
   */


  static async downloadInvoice(id: string): Promise<void> {
  const response = await apiClient.get(
    `/api/invoices/${id}/download`,
    { responseType: 'blob' }
  );

  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `Invoice-${id}.pdf`;

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}


static async sendInvoiceEmail(id: string, data: SendEmailPayload): Promise<void> {
    try {
      await apiClient.post(`/api/invoices/${id}/send`, data);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to send invoice email');
    }
  }

 




//   static async getPaymentHistory(
//   invoiceId: string
// ): Promise<any> {  // Change return type to any for flexibility
//   try {
//     const response = await apiClient.get<any>(
//       `/api/invoices/${invoiceId}/payments`
//     );
//     console.log('Payment history API raw response:', response.data);
//     return response.data.data; // Return the data as-is
//   } catch (error: any) {
//     throw new Error(
//       error.response?.data?.error || 'Failed to fetch payment history'
//     );
//   }
// }

static async getPaymentHistory(
  invoiceId: string
): Promise<any> {
  try {
    const response = await apiClient.get<any>(
      `/api/invoices/${invoiceId}/payments`
    );
    console.log('Payment history API raw response:', response.data);
    
    // Return the entire response data
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.error || 'Failed to fetch payment history'
    );
  }
}

}







export default InvoiceService;
