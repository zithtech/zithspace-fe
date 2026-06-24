import { api } from "@/lib/axios";

export type CrStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "estimated"
  | "approved"
  | "rejected"
  | "scheduled"
  | "in_progress"
  | "delivered"
  | "closed"
  | "cancelled";
export type CrPriority = "low" | "medium" | "high" | "critical";
export type CrDecision = "approved" | "rejected" | null;

export interface CrListItem {
  id: string;
  crNumber: string;
  subject: string;
  priority: CrPriority;
  status: CrStatus;
  estimatedHoursMin: string | number | null;
  estimatedHoursMax: string | number | null;
  estimatedCost: string | number | null;
  estimatedCurrency: string | null;
  targetDeliveryDate: string | null;
  clientDecision: CrDecision;
  lastActivityAt: string;
  createdAt: string;
  projectId: string | null;
  projectName: string | null;
  linkedInvoiceId: string | null;
  linkedInvoiceNumber: string | null;
  linkedSprintId?: string | null;
  linkedSprintVersion?: string | null;
  createdByPortalUserId?: string | null;
  createdByStaffUserId?: string | null;
  createdByPortalName?: string | null;
  createdByStaffName?: string | null;
  assignedStaffUserId?: string | null;
  assignedStaffName?: string | null;
  messageCount: number;
}

export interface CrMessage {
  id: string;
  authorType: "portal" | "staff" | "system";
  portalUserId: string | null;
  staffUserId: string | null;
  portalUserName: string | null;
  portalUserEmail: string | null;
  staffUserName: string | null;
  body: string | null;
  attachments: {
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }[];
  isSystemEvent: boolean;
  eventType: string | null;
  eventFrom: string | null;
  eventTo: string | null;
  metadata: any;
  createdAt: string;
}

export interface CrDetail extends CrListItem {
  description: string | null;
  impactAnalysis: string | null;
  clientDecisionAt: string | null;
  clientDecisionNote: string | null;
  projectCode: string | null;
  linkedSprintId: string | null;
  linkedSprintVersion: string | null;
  sourceMomActionItemId: string | null;
  clientId?: string;
  clientName?: string | null;
  createdByPortalName?: string | null;
  createdByPortalEmail?: string | null;
  createdByStaffName?: string | null;
  messages: CrMessage[];
}

export const crService = {
  // Staff endpoints
  listForClient(clientId: string) {
    return api.get<CrListItem[]>(
      `/api/clients-v2/${clientId}/change-requests`,
    );
  },
  create(
    clientId: string,
    payload: {
      subject: string;
      description: string;
      priority?: CrPriority;
      projectId?: string;
      status?: CrStatus;
      impactAnalysis?: string;
      estimatedHoursMin?: number;
      estimatedHoursMax?: number;
      estimatedCost?: number;
      estimatedCurrency?: string;
      targetDeliveryDate?: string;
    },
  ) {
    return api.post<{ id: string; crNumber: string; status: CrStatus }>(
      `/api/clients-v2/${clientId}/change-requests`,
      payload,
    );
  },
  detail(id: string) {
    return api.get<CrDetail>(`/api/change-requests/${id}`);
  },
  updateEstimate(
    id: string,
    payload: {
      impactAnalysis?: string;
      estimatedHoursMin?: number;
      estimatedHoursMax?: number;
      estimatedCost?: number;
      estimatedCurrency?: string;
      targetDeliveryDate?: string;
      publish?: boolean;
    },
  ) {
    return api.patch<void>(`/api/change-requests/${id}/estimate`, payload);
  },
  updateStatus(id: string, status: CrStatus) {
    return api.patch<{ id: string; status: CrStatus }>(
      `/api/change-requests/${id}/status`,
      { status },
    );
  },
  updateLinks(
    id: string,
    payload: { invoiceId?: string | null; sprintId?: string | null },
  ) {
    return api.patch<void>(`/api/change-requests/${id}/link`, payload);
  },
  assign(id: string, userId: string | null) {
    return api.patch<void>(`/api/change-requests/${id}/assign`, { userId });
  },
  reply(id: string, body: string) {
    return api.post<{ id: string; created_at: string }>(
      `/api/change-requests/${id}/messages`,
      { body },
    );
  },
  update(
    id: string,
    payload: {
      subject: string;
      description: string;
      priority?: CrPriority;
      projectId?: string | null;
      status?: CrStatus;
      impactAnalysis?: string | null;
      estimatedHoursMin?: number | null;
      estimatedHoursMax?: number | null;
      estimatedCost?: number | null;
      estimatedCurrency?: string | null;
      targetDeliveryDate?: string | null;
    },
  ) {
    return api.put<void>(`/api/change-requests/${id}`, payload);
  },
  delete(id: string) {
    return api.delete<void>(`/api/change-requests/${id}`);
  },
};
