import { portalApi, portalClient } from "@/lib/portalAxios";

export type PortalInvoiceStatus =
  | "SENT"
  | "VIEWED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";

export interface PortalInvoiceListItem {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  subtotal: string | number;
  taxTotal: string | number;
  discountTotal: string | number;
  grandTotal: string | number | null;
  balanceDue: string | number;
  paidAmount: string | number;
  rawStatus: string;
  status: PortalInvoiceStatus | string;
  isOverdue: boolean;
  viewedAt: string | null;
  sentAt: string | null;
  paidAt: string | null;
  cancelledAt: string | null;
  description: string | null;
  customerName: string | null;
}

export interface PortalInvoiceListMeta {
  page: number;
  limit: number;
  total: number;
  summary: {
    totalInvoices: number;
    totalBalanceDue: number;
    currency: string | null;
    counts: Record<string, number>;
  };
}

export interface PortalInvoiceDetail extends PortalInvoiceListItem {
  invoiceType: string;
  notes: string | null;
  terms: string | null;
  pdfUrl: string | null;
  customer: {
    name: string | null;
    email: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
    taxId: string | null;
  };
  customerSnapshot: any;
  lineItems: Array<{
    id: string;
    item_name: string;
    description: string | null;
    quantity: string | number;
    rate: string | number;
    tax_rate: string | number;
    row_number: number | null;
    hours: string | number | null;
    subtotal: string | number | null;
    tax_amount: string | number | null;
    total: string | number | null;
  }>;
  taxes: Array<{
    id: string;
    tax_name: string;
    tax_rate: string | number;
    tax_amount: string | number;
  }>;
  payments: Array<{
    id: string;
    amount: string | number;
    description: string | null;
    payment_date: string;
    payment_method: string | null;
    status: string;
    reference_id: string | null;
    created_at: string;
  }>;
  attachments: Array<{
    id: string;
    file_name: string;
    file_url: string;
    uploaded_at: string | null;
  }>;
  paymentProofs: Array<{
    id: string;
    amount: string | number | null;
    payment_date: string | null;
    reference: string | null;
    note: string | null;
    file_url: string;
    file_name: string | null;
    file_size_bytes: number | null;
    mime_type: string | null;
    status: "pending_review" | "approved" | "rejected" | string;
    review_note: string | null;
    created_at: string;
  }>;
}

export const portalInvoiceService = {
  async list(params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) {
    const qs = new URLSearchParams();
    if (params.page) qs.append("page", String(params.page));
    if (params.limit) qs.append("limit", String(params.limit));
    if (params.status) qs.append("status", params.status);
    if (params.search) qs.append("search", params.search);
    // We need both data + meta; call the raw axios client directly.
    const res = await portalClient.get(
      `/api/client-portal/invoices${qs.toString() ? `?${qs.toString()}` : ""}`,
    );
    if (res.data?.success === false) {
      throw new Error(res.data.error || "Failed to load invoices");
    }
    return {
      data: (res.data?.data || []) as PortalInvoiceListItem[],
      meta: (res.data?.meta || null) as PortalInvoiceListMeta | null,
    };
  },

  detail(id: string) {
    return portalApi.get<PortalInvoiceDetail>(
      `/api/client-portal/invoices/${id}`,
    );
  },

  uploadPaymentProof(
    id: string,
    payload: {
      file: string;
      fileName: string;
      amount?: number;
      paymentDate?: string;
      reference?: string;
      note?: string;
    },
  ) {
    return portalApi.post(
      `/api/client-portal/invoices/${id}/payment-proofs`,
      payload,
    );
  },
};
