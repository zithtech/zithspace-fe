import { apiClient } from "@/lib/axios";

export interface Escalation {
  id: string;
  subject: string;
  description: string;
  status: string;
  categoryId: string;
  priorityId: string;
  projectId?: string;
  statusId?: string;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
    color?: string;
  };
  priority?: {
    id: string;
    name: string;
    color?: string;
  };
  escalationStatus?: {
    id: string;
    name: string;
    color?: string;
  };
  project?: {
    id: string;
    name: string;
    code: string;
  };
  createdBy?: {
    id: string;
    name: string;
    workEmail: string;
  };
  targetMembers?: Array<{
    id: string;
    userId: string;
    user: {
      id: string;
      name: string;
      workEmail: string;
    };
  }>;
  tickets?: Array<{
    id: string;
    ticketId: string;
    ticket: {
      id: string;
      ticketNumber: string;
      title: string;
      status: string;
    };
  }>;
}

export interface EscalationListResponse {
  success: boolean;
  data: Escalation[];
}

export class EscalationService {
  /**
   * Get all escalations with filtering
   */
  static async getEscalations(params: {
    status?: string;
    categoryId?: string;
    priorityId?: string;
    projectId?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<EscalationListResponse> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, value.toString());
        }
      });

      const response = await apiClient.get(
        `/api/escalations?${queryParams.toString()}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching escalations:", error);
      throw new Error("Failed to fetch escalations");
    }
  }

  /**
   * Get escalation by ID
   */
  static async getEscalationById(id: string): Promise<Escalation> {
    try {
      const response = await apiClient.get(`/api/escalations/${id}`);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching escalation:", error);
      throw new Error("Failed to fetch escalation details");
    }
  }
}
