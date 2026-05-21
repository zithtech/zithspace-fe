import { portalClient, portalApi } from "@/lib/portalAxios";

export type ApprovalStatus =
  | "open"
  | "approved"
  | "rejected"
  | "cancelled"
  | "expired";

export interface PortalApprovalListItem {
  id: string;
  approvalNumber: string;
  title: string;
  subjectType: string;
  subjectLabel: string | null;
  status: ApprovalStatus;
  dueDate: string | null;
  expiresAt: string | null;
  lastActivityAt: string;
  createdAt: string;
  previewUrl: string | null;
  projectId: string | null;
  projectName: string | null;
  requiredCount: number;
  approvedCount: number;
  rejectedCount: number;
  myDecision: "approved" | "rejected" | null;
}

export interface PortalApprovalApprover {
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

export interface PortalApprovalDetail extends PortalApprovalListItem {
  description: string | null;
  subjectId: string | null;
  expiresAt: string | null;
  projectCode: string | null;
  requestedByName: string | null;
  approvers: PortalApprovalApprover[];
  attachments: {
    id: string;
    file_name: string;
    file_url: string;
    file_size_bytes: number | null;
    mime_type: string | null;
    uploaded_by_type: "staff" | "portal";
    created_at: string;
  }[];
  events: {
    id: string;
    eventType: string;
    actorType: string | null;
    actorStaffName: string | null;
    actorPortalName: string | null;
    payload: any;
    createdAt: string;
  }[];
  me: PortalApprovalApprover | null;
}

export interface PortalApprovalMeta {
  total: number;
  page: number;
  limit: number;
  counts: Record<ApprovalStatus, number>;
  mine: boolean;
}

export const portalApprovalsService = {
  async list(params: { page?: number; limit?: number; status?: string; mine?: boolean }) {
    const qs = new URLSearchParams();
    if (params.page) qs.append("page", String(params.page));
    if (params.limit) qs.append("limit", String(params.limit));
    if (params.status) qs.append("status", params.status);
    if (params.mine === false) qs.append("mine", "false");
    const res = await portalClient.get(
      `/api/client-portal/approvals${qs.toString() ? `?${qs.toString()}` : ""}`,
    );
    if (res.data?.success === false) {
      throw new Error(res.data.error || "Failed to load approvals");
    }
    return {
      data: (res.data?.data || []) as PortalApprovalListItem[],
      meta: (res.data?.meta || null) as PortalApprovalMeta | null,
    };
  },
  detail(id: string) {
    return portalApi.get<PortalApprovalDetail>(
      `/api/client-portal/approvals/${id}`,
    );
  },
  decide(id: string, decision: "approved" | "rejected", note?: string) {
    return portalApi.post(`/api/client-portal/approvals/${id}/decision`, {
      decision,
      note,
    });
  },
};
