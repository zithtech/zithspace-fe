import { portalClient, portalApi } from "@/lib/portalAxios";

export interface PortalMomListItem {
  id: string;
  momNumber: string;
  title: string;
  meetingDate: string;
  durationMinutes: number | null;
  projectId: string | null;
  projectName: string | null;
  recordingUrl: string | null;
  summaryPreview: string | null;
  createdAt: string;
  actionCount: number;
  openActionCount: number;
  attendeeCount: number;
  decisionCount: number;
  attachmentCount: number;
  attachments: PortalMomListAttachment[];
}

export interface PortalMomListAttachment {
  id: string;
  kind: "file" | "link";
  fileName: string | null;
  fileUrl: string | null;
  mimeType: string | null;
  linkUrl: string | null;
  linkLabel: string | null;
}

export interface PortalMomAttachment {
  id: string;
  kind: "file" | "link";
  fileName: string | null;
  fileUrl: string | null;
  fileSizeBytes: number | null;
  mimeType: string | null;
  linkUrl: string | null;
  linkLabel: string | null;
  position: number;
}

export interface PortalMomMeta {
  total: number;
  page: number;
  limit: number;
  projects: { id: string; name: string; code: string | null }[];
}

export interface PortalMomAttendee {
  id: string;
  name: string;
  email: string | null;
  role: string | null;
  party: "client" | "internal" | "external";
}

export interface PortalMomDecision {
  id: string;
  decision: string;
  decided_by: string | null;
  position: number;
}

export interface PortalMomActionItem {
  id: string;
  text: string;
  ownerName: string | null;
  dueDate: string | null;
  status: "open" | "in_progress" | "done" | "cancelled" | "converted";
  position: number;
  convertedToType: "portal_ticket" | "ticket" | "change_request" | null;
  convertedTicketNumber: string | null;
}

export interface PortalMomDetail {
  id: string;
  momNumber: string;
  title: string;
  meetingDate: string;
  durationMinutes: number | null;
  location: string | null;
  recordingUrl: string | null;
  summary: string | null;
  aiSummary: string | null;
  createdAt: string;
  updatedAt: string;
  project: {
    id: string;
    name: string;
    code: string | null;
  } | null;
  attendees: PortalMomAttendee[];
  decisions: PortalMomDecision[];
  actionItems: PortalMomActionItem[];
  attachments: PortalMomAttachment[];
}

export const portalMomService = {
  async list(params: {
    page?: number;
    limit?: number;
    projectId?: string;
    search?: string;
  }) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && v !== "") qs.append(k, String(v));
    });
    const res = await portalClient.get(
      `/api/client-portal/moms${qs.toString() ? `?${qs.toString()}` : ""}`,
    );
    if (res.data?.success === false) {
      throw new Error(res.data.error || "Failed to load meetings");
    }
    return {
      data: (res.data?.data || []) as PortalMomListItem[],
      meta: (res.data?.meta || null) as PortalMomMeta | null,
    };
  },

  detail(id: string) {
    return portalApi.get<PortalMomDetail>(`/api/client-portal/moms/${id}`);
  },
};
