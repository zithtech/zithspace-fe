import { portalClient, portalApi } from "@/lib/portalAxios";

export interface PortalSprintListItem {
  id: string;
  version: string;
  goal: string | null;
  description: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  startedAt: string | null;
  completedAt: string | null;
  releaseDate: string | null;
  committedPoints: number;
  completedPoints: number;
  ticketCount: number;
  doneCount: number;
  blockedCount: number;
  completionPercent: number;
  pointsPercent: number;
  project: {
    id: string;
    name: string;
    code: string | null;
  };
}

export interface PortalSprintMeta {
  total: number;
  page: number;
  limit: number;
  counts: Record<string, number>;
  projects: { id: string; name: string; code: string | null }[];
}

export interface PortalSprintTicket {
  id: string;
  ticketNumber: string;
  title: string;
  status: string;
  priority: string;
  type: string;
  storyPoint: number;
  estimateHours: string | number | null;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  category: "completed" | "blocked" | "open";
  addedAfterSprint: boolean;
}

export interface PortalSprintDetail
  extends Omit<PortalSprintListItem, "project"> {
  counts: {
    total: number;
    completed: number;
    blocked: number;
    open: number;
    addedAfter: number;
  };
  project: {
    id: string;
    name: string;
    code: string | null;
    description: string | null;
  };
  links: { label: string; url: string }[];
  tickets: PortalSprintTicket[];
}

export const portalSprintService = {
  async list(params: {
    page?: number;
    limit?: number;
    status?: string;
    projectId?: string;
    search?: string;
    from?: string;
    to?: string;
  }) {
    const qs = new URLSearchParams();
    if (params.page) qs.append("page", String(params.page));
    if (params.limit) qs.append("limit", String(params.limit));
    if (params.status) qs.append("status", params.status);
    if (params.projectId) qs.append("projectId", params.projectId);
    if (params.search) qs.append("search", params.search);
    if (params.from) qs.append("from", params.from);
    if (params.to) qs.append("to", params.to);
    const res = await portalClient.get(
      `/api/client-portal/sprints${qs.toString() ? `?${qs.toString()}` : ""}`,
    );
    if (res.data?.success === false) {
      throw new Error(res.data.error || "Failed to load sprints");
    }
    return {
      data: (res.data?.data || []) as PortalSprintListItem[],
      meta: (res.data?.meta || null) as PortalSprintMeta | null,
    };
  },

  detail(id: string) {
    return portalApi.get<PortalSprintDetail>(
      `/api/client-portal/sprints/${id}`,
    );
  },
};
