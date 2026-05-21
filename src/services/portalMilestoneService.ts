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

export const portalMilestoneService = {
  async list(): Promise<PortalMilestone[]> {
    const res = await portalClient.get(`/api/client-portal/milestones`);
    if (res.data?.success === false) {
      throw new Error(res.data.error || "Failed to load milestones");
    }
    return (res.data?.data || []) as PortalMilestone[];
  },
};
