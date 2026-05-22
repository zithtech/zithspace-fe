import { portalClient, portalApi } from "@/lib/portalAxios";

export type TicketStatus =
  | "new"
  | "in_review"
  | "in_progress"
  | "waiting_on_client"
  | "resolved"
  | "closed";

export type TicketCategory =
  | "bug"
  | "enhancement"
  | "support"
  | "infra"
  | "access"
  | "other";

export type TicketPriority = "low" | "medium" | "high" | "critical";

export interface TicketAttachment {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

export interface TicketSla {
  firstResponseDueAt: string | null;
  resolutionDueAt: string | null;
  firstResponseBreached: boolean;
  resolutionBreached: boolean;
}

export interface PortalTicketListItem {
  id: string;
  ticketNumber: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  projectId: string | null;
  projectName: string | null;
  dueDate: string | null;
  firstResponseAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  lastActivityAt: string;
  messageCount: number;
  createdAt: string;
  sla: TicketSla;
}

export interface PortalTicketMessage {
  id: string;
  authorType: "portal" | "staff" | "system";
  portalUserId: string | null;
  staffUserId: string | null;
  portalUserName: string | null;
  portalUserEmail: string | null;
  staffUserName: string | null;
  body: string | null;
  attachments: TicketAttachment[];
  isSystemEvent: boolean;
  eventType: string | null;
  eventFrom: string | null;
  eventTo: string | null;
  createdAt: string;
}

export interface PortalTicketDetail extends PortalTicketListItem {
  assignedStaffUserId: string | null;
  assignedStaffName: string | null;
  messages: PortalTicketMessage[];
}

export interface PortalTicketMeta {
  total: number;
  page: number;
  limit: number;
  counts: Record<TicketStatus, number>;
  projects: { id: string; name: string; code: string | null }[];
}

export interface CreateTicketPayload {
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  projectId?: string;
  body: string;
  attachments?: { dataUrl: string; fileName: string }[];
}

export interface ReplyPayload {
  body: string;
  attachments?: { dataUrl: string; fileName: string }[];
}

export const portalTicketService = {
  async list(params: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    priority?: string;
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
      `/api/client-portal/tickets${qs.toString() ? `?${qs.toString()}` : ""}`,
    );
    if (res.data?.success === false) {
      throw new Error(res.data.error || "Failed to load tickets");
    }
    return {
      data: (res.data?.data || []) as PortalTicketListItem[],
      meta: (res.data?.meta || null) as PortalTicketMeta | null,
    };
  },

  create(payload: CreateTicketPayload) {
    return portalApi.post<{
      id: string;
      ticketNumber: string;
      subject: string;
      category: string;
      priority: string;
      status: string;
      createdAt: string;
    }>(`/api/client-portal/tickets`, payload);
  },

  detail(id: string) {
    return portalApi.get<PortalTicketDetail>(
      `/api/client-portal/tickets/${id}`,
    );
  },

  reply(id: string, payload: ReplyPayload) {
    return portalApi.post(
      `/api/client-portal/tickets/${id}/messages`,
      payload,
    );
  },

  projectOptions() {
    return portalApi.get<{ id: string; name: string; code: string | null }[]>(
      `/api/client-portal/tickets/options/projects`,
    );
  },
};
