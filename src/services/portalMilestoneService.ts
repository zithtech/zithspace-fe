import { portalClient } from "@/lib/portalAxios";

export type PortalMilestoneStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "on_hold"
  | "cancelled";

export interface PortalMilestoneItem {
  id: string;
  name: string;
  description: string | null;
  isCompleted: boolean;
  completedAt: string | null;
  position: number;
}

export interface PortalMilestone {
  id: string;
  projectId: string | null;
  projectName: string | null;
  name: string;
  description: string | null;
  status: PortalMilestoneStatus;
  estStartDate: string | null;
  estEndDate: string | null;
  actualEndDate: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
  itemsTotal: number;
  itemsDone: number;
  progress: number;
  items: PortalMilestoneItem[];
}

export interface PortalMilestoneMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  counts: {
    total: number;
    in_progress: number;
    completed: number;
    on_hold: number;
    not_started: number;
    cancelled: number;
  };
  projects?: { id: string; name: string; code: string | null }[];
}

export const portalMilestoneService = {
  async list(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    projectId?: string;
    from?: string;
    to?: string;
  } = {}) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && v !== "") qs.append(k, String(v));
    });
    const res = await portalClient.get(
      `/api/client-portal/milestones${qs.toString() ? `?${qs.toString()}` : ""}`
    );
    if (res.data?.success === false) {
      throw new Error(res.data.error || "Failed to load milestones");
    }
    // Backward compatibility: if accessed as array directly
    const data = (res.data?.data || []) as PortalMilestone[];
    const meta = (res.data?.meta || null) as PortalMilestoneMeta | null;
    return { data, meta };
  },
};
