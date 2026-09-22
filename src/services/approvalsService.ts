import { api, apiClient } from "@/lib/axios";

export type ApprovalStatus =
  | "open"
  | "approved"
  | "rejected"
  | "cancelled"
  | "expired";

export type ApprovalSubjectType =
  | "design"
  | "requirement"
  | "sprint"
  | "uat"
  | "production_release"
  | "cr"
  | "invoice"
  | "document"
  | "custom";

export interface ApprovalListItem {
  id: string;
  approvalNumber: string;
  title: string;
  subjectType: ApprovalSubjectType;
  subjectLabel: string | null;
  status: ApprovalStatus;
  dueDate: string | null;
  expiresAt: string | null;
  lastActivityAt: string;
  createdAt: string;
  projectId: string | null;
  projectName: string | null;
  requestedByName: string | null;
  requiredCount: number;
  approvedCount: number;
  rejectedCount: number;
}

export interface ApprovalApprover {
  id: string;
  approverType: "portal" | "staff";
  portalUserId: string | null;
  staffUserId: string | null;
  portalUserName: string | null;
  portalUserEmail: string | null;
  staffUserName: string | null;
  required: boolean;
  decision: "approved" | "rejected" | null;
  decisionNote: string | null;
  decidedAt: string | null;
  position: number;
}

export interface ApprovalAttachmentRow {
  id: string;
  file_name: string;
  file_url: string;
  file_size_bytes: number | null;
  mime_type: string | null;
  uploaded_by_type: "staff" | "portal";
  created_at: string;
}

export interface ApprovalEvent {
  id: string;
  eventType: string;
  actorType: "staff" | "portal" | "system" | null;
  actorStaffName: string | null;
  actorPortalName: string | null;
  payload: any;
  createdAt: string;
}

export interface ApprovalDetail extends ApprovalListItem {
  description: string | null;
  previewUrl: string | null;
  subjectId: string | null;
  expiresAt: string | null;
  clientId: string;
  clientName: string | null;
  projectCode: string | null;
  approvers: ApprovalApprover[];
  attachments: ApprovalAttachmentRow[];
  events: ApprovalEvent[];
}

export interface CreateApprovalPayload {
  title: string;
  subjectType: ApprovalSubjectType;
  subjectId?: string;
  subjectLabel?: string;
  projectId?: string;
  description?: string;
  previewUrl?: string;
  dueDate?: string;
  expiresAt?: string;
  approvers: {
    approverType: "portal" | "staff";
    portalUserId?: string;
    staffUserId?: string;
    required?: boolean;
  }[];
  attachments?: { dataUrl: string; fileName: string }[];
}

export const approvalsService = {
  async listForClient(
    clientId: string,
    params: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      projectId?: string;
    } = {},
  ) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && v !== "") qs.append(k, String(v));
    });
    const res = await apiClient.get(
      `/api/clients-v2/${clientId}/approvals${qs.toString() ? `?${qs.toString()}` : ""}`,
    );
    if (res.data?.success === false) {
      throw new Error(res.data.error || "Failed to load approvals");
    }
    return {
      data: (res.data?.data || []) as ApprovalListItem[],
      meta: res.data?.meta || { total: (res.data?.data || []).length, page: 1, limit: 15, totalPages: 1 },
    };
  },
  create(clientId: string, payload: CreateApprovalPayload) {
    return api.post<{ id: string; approvalNumber: string }>(
      `/api/clients-v2/${clientId}/approvals`,
      payload,
    );
  },
  detail(id: string) {
    return api.get<ApprovalDetail>(`/api/approvals/${id}`);
  },
  cancel(id: string) {
    return api.patch<{ id: string; status: ApprovalStatus }>(
      `/api/approvals/${id}/cancel`,
    );
  },
  addApprover(
    id: string,
    payload: {
      approverType: "portal" | "staff";
      portalUserId?: string;
      staffUserId?: string;
      required?: boolean;
    },
  ) {
    return api.post<{ id: string }>(
      `/api/approvals/${id}/approvers`,
      payload,
    );
  },
  removeApprover(id: string, approverId: string) {
    return api.delete<void>(`/api/approvals/${id}/approvers/${approverId}`);
  },
  remove(id: string) {
    return api.delete<void>(`/api/approvals/${id}`);
  },
};
