import { apiClient } from '@/lib/axios';

/* ==================== ENUMS ==================== */

export type InvoiceStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'SENT'
  | 'PAID'
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
  paid: number;
  balanceDue: number;
  recurringFrequency?: RecurringFrequency;

  notes?: string;
  terms?: string;

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

  static async getNextInvoiceNumber(): Promise<{ invoiceNumber: string }> {
    try {
      const response = await apiClient.get<ApiResponse<{ invoiceNumber: string }>>(
        '/api/invoices/next-number'
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
    status: InvoiceStatus
  ): Promise<Invoice> {
    try {
      const response = await apiClient.patch<ApiResponse<Invoice>>(
        `/api/invoices/${id}/status`,
        { status }
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
}

export default InvoiceService;
