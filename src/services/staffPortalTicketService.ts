import { api, apiClient } from "@/lib/axios";

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

export interface StaffPortalTicketListItem {
  id: string;
  ticketNumber: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  clientId: string;
  clientName: string | null;
  projectId: string | null;
  projectName: string | null;
  assignedStaffUserId: string | null;
  assignedStaffName: string | null;
  dueDate: string | null;
  firstResponseAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  lastActivityAt: string;
  messageCount: number;
  createdAt: string;
}

export interface StaffPortalTicketMessage {
  id: string;
  author_type: "portal" | "staff" | "system";
  portal_user_id: string | null;
  staff_user_id: string | null;
  body: string | null;
  attachments: { fileName: string; fileUrl: string; fileSize: number; mimeType: string }[];
  is_system_event: boolean;
  event_type: string | null;
  event_from: string | null;
  event_to: string | null;
  created_at: string;
  portal_user_name: string | null;
  portal_user_email: string | null;
  staff_user_name: string | null;
}

export interface StaffPortalTicketDetail {
  id: string;
  ticket_number: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  client_id: string;
  clientName: string | null;
  project_id: string | null;
  projectName: string | null;
  assigned_staff_user_id: string | null;
  assignedStaffName: string | null;
  due_date: string | null;
  first_response_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  sla_response_target_minutes: number | null;
  sla_resolution_target_minutes: number | null;
  last_activity_at: string;
  created_at: string;
  updated_at: string;
  messages: StaffPortalTicketMessage[];
}

export interface StaffCreateTicketPayload {
  clientId: string;
  subject: string;
  body: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  projectId?: string;
  assignedStaffUserId?: string;
}

export const staffPortalTicketService = {
  async list(params: {
    clientId?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && v !== "") qs.append(k, String(v));
    });
    const res = await apiClient.get(
      `/api/portal-tickets${qs.toString() ? `?${qs.toString()}` : ""}`,
    );
    if (res.data?.success === false) {
      throw new Error(res.data.error || "Failed to load tickets");
    }
    return {
      data: (res.data?.data || []) as StaffPortalTicketListItem[],
      meta: res.data?.meta || { total: 0, page: 1, limit: 20 },
    };
  },

  create(payload: StaffCreateTicketPayload) {
    return api.post<{
      id: string;
      ticketNumber: string;
      subject: string;
      category: string;
      priority: string;
      status: string;
      createdAt: string;
    }>(`/api/portal-tickets`, payload);
  },

  detail(id: string) {
    return api.get<StaffPortalTicketDetail>(`/api/portal-tickets/${id}`);
  },

  reply(id: string, body: string) {
    return api.post(`/api/portal-tickets/${id}/messages`, { body });
  },

  updateStatus(id: string, status: TicketStatus) {
    return apiClient
      .patch(`/api/portal-tickets/${id}/status`, { status })
      .then((r) => r.data?.data);
  },

  assign(id: string, userId: string | null) {
    return apiClient
      .patch(`/api/portal-tickets/${id}/assign`, { userId })
      .then((r) => r.data?.data);
  },
};
