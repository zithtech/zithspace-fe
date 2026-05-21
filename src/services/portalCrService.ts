import { portalClient, portalApi } from "@/lib/portalAxios";

export type CrStatus =
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

export interface PortalCrListItem {
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
  clientDecision: "approved" | "rejected" | null;
  lastActivityAt: string;
  createdAt: string;
  projectId: string | null;
  projectName: string | null;
  linkedInvoiceId: string | null;
  linkedInvoiceNumber: string | null;
  messageCount: number;
}

export interface PortalCrMessage {
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

export interface PortalCrDetail extends PortalCrListItem {
  description: string | null;
  impactAnalysis: string | null;
  clientDecisionAt: string | null;
  clientDecisionNote: string | null;
  projectCode: string | null;
  linkedSprintId: string | null;
  linkedSprintVersion: string | null;
  assignedStaffUserId: string | null;
  assignedStaffName: string | null;
  messages: PortalCrMessage[];
}

export interface PortalCrMeta {
  total: number;
  page: number;
  limit: number;
  counts: Record<CrStatus, number>;
  projects: { id: string; name: string; code: string | null }[];
}

export const portalCrService = {
  async list(params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    projectId?: string;
    from?: string;
    to?: string;
  }) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && v !== "") qs.append(k, String(v));
    });
    const res = await portalClient.get(
      `/api/client-portal/change-requests${
        qs.toString() ? `?${qs.toString()}` : ""
      }`,
    );
    if (res.data?.success === false) {
      throw new Error(res.data.error || "Failed to load CRs");
    }
    return {
      data: (res.data?.data || []) as PortalCrListItem[],
      meta: (res.data?.meta || null) as PortalCrMeta | null,
    };
  },

  create(payload: {
    subject: string;
    description: string;
    priority?: CrPriority;
    projectId?: string;
    attachments?: { dataUrl: string; fileName: string }[];
  }) {
    return portalApi.post(`/api/client-portal/change-requests`, payload);
  },

  detail(id: string) {
    return portalApi.get<PortalCrDetail>(
      `/api/client-portal/change-requests/${id}`,
    );
  },

  reply(
    id: string,
    payload: {
      body: string;
      attachments?: { dataUrl: string; fileName: string }[];
    },
  ) {
    return portalApi.post(
      `/api/client-portal/change-requests/${id}/messages`,
      payload,
    );
  },

  decide(id: string, decision: "approved" | "rejected", note?: string) {
    return portalApi.post(
      `/api/client-portal/change-requests/${id}/decision`,
      { decision, note },
    );
  },

  projectOptions() {
    return portalApi.get<{ id: string; name: string; code: string | null }[]>(
      `/api/client-portal/change-requests/options/projects`,
    );
  },
};
