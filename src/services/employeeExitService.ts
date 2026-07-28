import { api, ApiError } from "@/lib/axios";

export interface EmployeeExitRequest {
  id: string;
  employeeId: string;
  departmentId: string;
  positionId: string;
  reportingManagerId: string;
  reportingManagerName?: string;
  exitTypeId: string;
  exitReasonId: string;
  resignationDate: string;
  proposedLastWorkingDay: string;
  noticePeriodDay: string;
  waiveNoticePeriod: boolean;
  buyoutRequired: boolean;
  buyoutAmount?: number;
  explanation?: string;
  resignationLetterUrl?: string;
  status: string;
  createdAt: string;
  employee?: {
    first_name: string;
    last_name: string;
    employee_code: string;
  };
}

export interface EmployeeAsset {
  id?: string;
  item: string;
  brand: string;
  model: string;
  modelNumber: string;
  image?: string;
  returnStatus: "Pending" | "Returned" | "Damaged" | "Lost";
  condition: "Good" | "Bad";
  deduction: number;
  remarks: string;
  createdAt?: string;
}

export class EmployeeExitService {
  /**
   * Get all exit requests
   */
  static async getExitRequests(): Promise<EmployeeExitRequest[]> {
    try {
      const response = await api.get<any>("/api/exit/request");
      return response.data?.data || response.data || response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to fetch exit requests");
    }
  }

  /**
   * Get my exit requests
   */
  static async getMyExitRequests(): Promise<EmployeeExitRequest[]> {
    try {
      const response = await api.get<any>("/api/exit/request/my-requests");
      return response.data?.data || response.data || response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to fetch my exit requests");
    }
  }

  /**
   * Get pending approvals
   */
  static async getPendingApprovals(): Promise<EmployeeExitRequest[]> {
    try {
      const response = await api.get<any>("/api/exit/request/pending-approvals");
      return response.data?.data || response.data || response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to fetch pending approvals");
    }
  }

  static async getClearances(): Promise<any[]> {
    try {
      const response = await api.get<any>("/api/exit/request/clearances");
      return response.data?.data || response.data || response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to fetch clearances");
    }
  }

  /**
   * Get clearances by request ID
   */
  static async getClearancesByRequestId(id: string): Promise<any[]> {
    try {
      const response = await api.get<any>(`/api/exit/request/${id}/clearances`);
      return response.data?.data || response.data || response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to fetch clearances for request");
    }
  }

  /**
   * Get exit request by ID
   */
  static async getExitRequestById(id: string): Promise<EmployeeExitRequest> {
    try {
      const response = await api.get<any>(`/api/exit/request/${id}`);
      return response.data?.data || response.data || response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to fetch exit request");
    }
  }

  /**
   * Create exit request
   */
  static async createExitRequest(data: any): Promise<EmployeeExitRequest> {
    try {
      const response = await api.post<any>("/api/exit/request", data);
      return response.data?.data || response.data || response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to create exit request");
    }
  }

  /**
   * Delete exit request
   */
  static async deleteExitRequest(id: string): Promise<void> {
    try {
      await api.delete(`/api/exit/request/${id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to delete exit request");
    }
  }

  static async updateExitRequest(id: string, payload: any): Promise<any> {
    try {
      return await api.put(`/api/exit/request/${id}`, payload);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to update exit request");
    }
  }


  /**
   * Update exit request status
   */
  static async updateExitStatus(id: string, status: string): Promise<EmployeeExitRequest> {
    try {
      const response = await api.put<any>(`/api/exit/request/${id}/status`, { status });
      return response.data?.data || response.data || response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error(`Failed to update exit request status to ${status}`);
    }
  }

  /**
   * Update clearance status
   */
  static async updateClearanceStatus(id: string, department: string, isCleared: boolean, comments: string = '', checklist: any = {}): Promise<any> {
    try {
      const response = await api.put<any>(`/api/exit/request/${id}/clearance`, { department, isCleared, comments, checklist });
      return response.data?.data || response.data || response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error(`Failed to update ${department} clearance status`);
    }
  }

  /**
   * Process FnF Settlement
   */
  static async processFnFSettlement(id: string, payload: any): Promise<any> {
    try {
      const response = await api.put<any>(`/api/exit/request/${id}/fnf`, payload);
      return response.data?.data || response.data || response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error(`Failed to process FnF settlement`);
    }
  }

  /**
   * Calculate FnF Settlement (Integration with Payroll)
   */
  static async calculateFnF(id: string): Promise<any> {
    try {
      const response = await api.post<any>(`/api/exit/request/${id}/fnf/calculate`);
      return response.data?.data || response.data || response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error(`Failed to calculate FnF`);
    }
  }

  /**
   * Get assets for an employee
   */
  static async getEmployeeAssets(employeeId: string): Promise<EmployeeAsset[]> {
    try {
      const response = await api.get<any>(`/api/employee-assets/${employeeId}`);
      return response.data?.data || response.data || response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to fetch employee assets");
    }
  }

  /**
   * Add a manual asset for an employee
   */
  static async addEmployeeAsset(employeeId: string, asset: EmployeeAsset): Promise<any> {
    try {
      return await api.post(`/api/employee-assets/${employeeId}`, { assets: [asset] });
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to add employee asset");
    }
  }

  /**
   * Update an employee asset
   */
  static async updateEmployeeAsset(employeeId: string, assetId: string, asset: Partial<EmployeeAsset>): Promise<any> {
    try {
      return await api.put(`/api/employee-assets/${employeeId}/${assetId}`, { asset });
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to update employee asset");
    }
  }

  /**
   * Delete an employee asset
   */
  static async deleteEmployeeAsset(employeeId: string, assetId: string): Promise<void> {
    try {
      await api.delete(`/api/employee-assets/${employeeId}/${assetId}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to delete employee asset");
    }
  }

  // Checklist Configs
  static async getChecklistConfigs(): Promise<any[]> {
    try {
      const response = await api.get<any>("/api/exit/request/config/checklist");
      return response.data?.data || response.data || response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to fetch checklist configs");
    }
  }

  static async addChecklistConfig(department: string, itemName: string): Promise<any> {
    try {
      const response = await api.post<any>("/api/exit/request/config/checklist", { department, itemName });
      return response.data?.data || response.data || response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to add checklist config");
    }
  }

  static async deleteChecklistConfig(id: string): Promise<void> {
    try {
      await api.delete(`/api/exit/request/config/checklist/${id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to delete checklist config");
    }
  }

  // ==========================================
  // EXIT INTERVIEWS
  // ==========================================
  
  static async getExitInterview(id: string): Promise<any> {
    try {
      // It is /api/exit/request/:id/interview based on routes mount, wait no, employeeExit routes are mounted at /api/exit/request
      const response = await api.get(`/api/exit/request/${id}/interview`);
      return response.data?.data || null;
    } catch (error: any) {
      console.warn("No exit interview found or error:", error);
      return null;
    }
  }

  static async submitExitInterview(id: string, data: any): Promise<any> {
    try {
      const response = await api.post(`/api/exit/request/${id}/interview`, data);
      return response.data?.data || response.data;
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to submit exit interview');
    }
  }
}
