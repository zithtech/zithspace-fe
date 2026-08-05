import { api, ApiError } from "@/lib/axios";

export interface ExitApprovalStep {
  id: string;
  stepOrder: number;
  roleIds: string[];
  mandatory: boolean;
  approvalType?: string;
  levelType?: string;
  levelId?: string;
}

export class ApprovalWorkflowService {
  /**
   * Get all approval steps
   */
  static async getSteps(): Promise<ExitApprovalStep[]> {
    try {
      const response = await api.get<any>("/api/exit/approval-workflow");
      const body = response.data ? response.data : response;
      
      if (body && body.data && Array.isArray(body.data)) {
        return body.data;
      }
      if (Array.isArray(body)) {
        return body;
      }
      return [];
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error("Failed to fetch approval steps");
    }
  }

  /**
   * Save a sequence of approval steps for a specific level
   */
  static async saveSequence(data: { levelType: string; levelId: string; steps: any[] }): Promise<ExitApprovalStep[]> {
    try {
      const response = await api.post<any>("/api/exit/approval-workflow/sequence", data);
      const body = response.data ? response.data : response;
      return body.data || body;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to save approval sequence");
    }
  }

  /**
   * Create a new approval step
   */
  static async createStep(data: Partial<ExitApprovalStep>): Promise<ExitApprovalStep> {
    try {
      const response = await api.post<any>("/api/exit/approval-workflow", data);
      const body = response.data ? response.data : response;
      return body.data || body;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error("Failed to create approval step");
    }
  }

  /**
   * Update an approval step
   */
  static async updateStep(id: string, data: Partial<ExitApprovalStep>): Promise<ExitApprovalStep> {
    try {
      const response = await api.put<any>(`/api/exit/approval-workflow/${id}`, data);
      const body = response.data ? response.data : response;
      return body.data || body;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error("Failed to update approval step");
    }
  }

  /**
   * Delete an approval step
   */
  static async deleteStep(id: string): Promise<void> {
    try {
      await api.delete(`/api/exit/approval-workflow/${id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error("Failed to delete approval step");
    }
  }
}
