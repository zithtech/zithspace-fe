import { api } from "@/lib/axios";

export interface Milestone {
  id: string;
  title: string;
  points: string[];
  projectId: string;
  description: string;
  startDate: string;
  endDate: string;
  project?: {
    id: string;
    name: string;
    code: string;
  };
  sprints?: Array<{
    id: string;
    version: string;
  }>;
  createdBy?: {
    id: string;
    name: string;
  };
}

export interface MilestoneFormData {
  title: string;
  points: string[];
  projectId: string;
  description: string;
  startDate: string;
  endDate: string;
  sprintIds?: string[];
}

export class MilestoneService {
  private static BASE_URL = "/milestones";

  static async getMilestones(projectId?: string): Promise<Milestone[]> {
    const params = projectId ? { projectId } : {};
    const response = await api.get(this.BASE_URL, { params });
    return response.data.data;
  }

  static async createMilestone(data: MilestoneFormData): Promise<Milestone> {
    const response = await api.post(this.BASE_URL, data);
    return response.data.data;
  }

  static async updateMilestone(id: string, data: Partial<MilestoneFormData>): Promise<Milestone> {
    const response = await api.put(`${this.BASE_URL}/${id}`, data);
    return response.data.data;
  }

  static async deleteMilestone(id: string): Promise<void> {
    await api.delete(`${this.BASE_URL}/${id}`);
  }

  static async updateMilestoneSprints(id: string, sprintIds: string[]): Promise<Milestone> {
    const response = await api.put(`${this.BASE_URL}/${id}/sprints`, { sprintIds });
    return response.data.data;
  }
}
