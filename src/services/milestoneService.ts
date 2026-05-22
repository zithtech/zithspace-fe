import { api } from "@/lib/axios";

export type MilestoneStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "on_hold"
  | "cancelled";

export interface MilestoneItem {
  id: string;
  milestoneId: string;
  name: string;
  description: string | null;
  isCompleted: boolean;
  completedAt: string | null;
  completedById: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  clientId: string;
  projectId: string | null;
  projectName: string | null;
  name: string;
  description: string | null;
  status: MilestoneStatus;
  estStartDate: string | null;
  estEndDate: string | null;
  actualEndDate: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
  itemsTotal: number;
  itemsDone: number;
  progress: number;
  items: MilestoneItem[];
}

export interface CreateMilestonePayload {
  name: string;
  description?: string;
  status?: MilestoneStatus;
  estStartDate?: string | null;
  estEndDate?: string | null;
  actualEndDate?: string | null;
  projectId?: string;
  items?: { name: string; description?: string }[];
}

export interface UpdateMilestonePayload {
  name?: string;
  description?: string | null;
  status?: MilestoneStatus;
  estStartDate?: string | null;
  estEndDate?: string | null;
  actualEndDate?: string | null;
  projectId?: string | null;
}

export const milestoneService = {
  list(clientId: string) {
    return api.get<Milestone[]>(`/api/clients-v2/${clientId}/milestones`);
  },
  create(clientId: string, payload: CreateMilestonePayload) {
    return api.post<Milestone>(
      `/api/clients-v2/${clientId}/milestones`,
      payload,
    );
  },
  update(id: string, payload: UpdateMilestonePayload) {
    return api.put<void>(`/api/milestones/${id}`, payload);
  },
  remove(id: string) {
    return api.delete<void>(`/api/milestones/${id}`);
  },
  addItem(milestoneId: string, payload: { name: string; description?: string }) {
    return api.post<MilestoneItem>(
      `/api/milestones/${milestoneId}/items`,
      payload,
    );
  },
  updateItem(
    id: string,
    payload: { name?: string; description?: string | null; isCompleted?: boolean },
  ) {
    return api.put<void>(`/api/milestone-items/${id}`, payload);
  },
  removeItem(id: string) {
    return api.delete<void>(`/api/milestone-items/${id}`);
  },
};
