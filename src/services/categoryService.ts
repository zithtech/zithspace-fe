import { api, apiUtils, PaginatedResponse } from '@/lib/axios';

// Interfaces
export interface ReimbursementCategory {
  id: string;
  name: string;
  maxRequestsPerMonth?: number;    // ✅ Changed to match API
  monthlyLimit?: number;
  yearlyLimit?: number;
  eligibleRoles: string[];
  approvalRoles: string[];
  acceptRoles: string[];           // ✅ Changed to match API
  attachmentRequired: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; name: string };
  updatedBy?: { id: string; name: string };
}

export interface ReimbursementItem {
  id: string;
  title: string;
  date: string;
  amount: number;
  billNo?: string;
  description?: string;
  attachments: string[]; // Keeping for backward compatibility if needed temporarily
  reimbursementAttachments?: ReimbursementAttachment[];
  status?: string;
}

export interface ReimbursementApproval {
  id: string;
  reimbursementRequestId: string;
  approverId: string;
  role: string;
  status: string;
  comments?: string;
  createdAt: string;
  approver: {
    id: string;
    name: string;
    role: string;
  };
}

export interface ReimbursementAttachment {
  id: string;
  reimbursementRequestId: string; // Matches backend TicketAttachment
  reimbursementItemId?: string;   // Matches backend TicketAttachment
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  uploadedBy: {
    name: string;
  };
}

export interface ReimbursementRequest {
  id: string;
  requestId: string;
  userId: string;
  category: string;
  department?: string;
  policy?: string;
  amount: number;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'CLARIFY' | 'PAID' | 'ON_HOLD';
  financeStatus?: string;
  submittedAt?: string;
  submitted?: string;
  created?: string;
  activityLog: any[];
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: string;
    name: string;
    workEmail: string;
    department?: string;
  };
  expenseItems?: ReimbursementItem[];
  items?: ReimbursementItem[];
  reimbursementAttachments?: ReimbursementAttachment[];
}

// Input Types
export interface CreateCategoryData {
  name: string;
  maxPerRequest?: number;
  monthlyLimit?: number;
  yearlyLimit?: number;
  eligibleRoles?: string[];
  approvalRoles?: string[];
  accept?: string[];
  attachmentRequired?: boolean;
  isActive?: boolean;
}

export interface CreateRequestData {
  category: string;
  department?: string;
  amount: number;
  policy?: string;
  status?: string;
  items: Array<{
    title: string;
    date: string;
    amount: number;
    billNo?: string;
    description?: string;
    attachments?: Array<{
      url: string;
      name?: string;
      fileSize?: number;
      fileType?: string;
    }>;
  }>;
}

export interface ManagerActionData {
  action: 'APPROVE' | 'REJECT' | 'CLARIFY';
  comments?: string;
}

export interface FinanceActionData {
  action: 'PAID' | 'REJECT' | 'ON_HOLD';
  comments?: string;
}

export interface AddAttachmentData {
  itemId?: string;
  fileName: string;
  file: string; // Base64 string
}

export class CategoryService {
  // --- Categories ---

  static async getCategories(params: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean | string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    names?: string;
    roles?: string;
  } = {}): Promise<PaginatedResponse<ReimbursementCategory>> {
    return apiUtils.getPaginated('/api/reimbursement-categories', params);
  }

  static async getCategoryById(id: string): Promise<ReimbursementCategory> {
    return await api.get<ReimbursementCategory>(`/api/reimbursement-categories/${id}`);
  }

  static async createCategory(data: CreateCategoryData): Promise<ReimbursementCategory> {
    return await api.post<ReimbursementCategory>('/api/reimbursement-categories', data);
  }

  static async updateCategory(id: string, data: Partial<CreateCategoryData>): Promise<ReimbursementCategory> {
    return await api.put<ReimbursementCategory>(`/api/reimbursement-categories/${id}`, data);
  }

  static async deleteCategory(id: string): Promise<void> {
    await api.delete(`/api/reimbursement-categories/${id}`);
  }

  // --- Requests ---

  static async getRequests(params: {
    view?: 'manager' | 'finance' | 'my';
    status?: string;
    page?: number;
    limit?: number;
    search?: string;
  } = {}): Promise<PaginatedResponse<ReimbursementRequest>> {
    return apiUtils.getPaginated('/api/reimbursement-categories/requests', params);
  }

  static async getRequestById(id: string): Promise<ReimbursementRequest> {
    return await api.get<ReimbursementRequest>(`/api/reimbursement-categories/requests/${id}`);
  }

  static async createRequest(data: CreateRequestData): Promise<ReimbursementRequest> {
    return await api.post<ReimbursementRequest>('/api/reimbursement-categories/requests', data);
  }

  static async updateRequest(id: string, data: Partial<CreateRequestData>): Promise<ReimbursementRequest> {
    return await api.put<ReimbursementRequest>(`/api/reimbursement-categories/requests/${id}`, data);
  }

  static async deleteRequest(id: string): Promise<void> {
    await api.delete(`/api/reimbursement-categories/requests/${id}`);
  }

  // --- Actions ---

  static async managerAction(id: string, data: ManagerActionData): Promise<ReimbursementRequest> {
    return await api.post<ReimbursementRequest>(`/api/reimbursement-categories/requests/${id}/manager`, data);
  }

  static async financeAction(id: string, data: FinanceActionData): Promise<ReimbursementRequest> {
    return await api.post<ReimbursementRequest>(`/api/reimbursement-categories/requests/${id}/finance`, data);
  }

  // --- Items ---

  static async addItem(requestId: string, data: Partial<ReimbursementItem>): Promise<ReimbursementItem> {
    return await api.post<ReimbursementItem>(`/api/reimbursement-categories/requests/${requestId}/items`, data);
  }

  static async updateItem(requestId: string, itemId: string, data: Partial<ReimbursementItem>): Promise<ReimbursementItem> {
    return await api.put<ReimbursementItem>(`/api/reimbursement-categories/requests/${requestId}/items/${itemId}`, data);
  }

  static async deleteItem(requestId: string, itemId: string): Promise<void> {
    await api.delete(`/api/reimbursement-categories/requests/${requestId}/items/${itemId}`);
  }

  // --- Approvals & Attachments ---

  static async getApprovals(requestId: string): Promise<ReimbursementApproval[]> {
    return await api.get<ReimbursementApproval[]>(`/api/reimbursement-categories/requests/${requestId}/approvals`);
  }

  static async getAttachments(requestId: string): Promise<ReimbursementAttachment[]> {
    return await api.get<ReimbursementAttachment[]>(`/api/reimbursement-categories/requests/${requestId}/attachments`);
  }

  static async uploadFile(file: File): Promise<{ success: boolean; filename: string; url: string; fileSize: number; fileType: string }> {
    const formData = new FormData();
    formData.append('file', file);
    console.log("datawith file: ", formData)

    // Important: Set headers to let axios auto-detect Content-Type for FormData
    return await api.post<{ success: boolean; filename: string; url: string; fileSize: number; fileType: string }>(
      '/api/reimbursement-categories/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  }

  static async addAttachment(requestId: string, data: AddAttachmentData): Promise<ReimbursementAttachment> {
    return await api.post<ReimbursementAttachment>(`/api/reimbursement-categories/requests/${requestId}/attachments`, data);
  }

  static async deleteAttachment(requestId: string, attachmentId: string): Promise<void> {
    await api.delete(`/api/reimbursement-categories/requests/${requestId}/attachments/${attachmentId}`);
  }
}