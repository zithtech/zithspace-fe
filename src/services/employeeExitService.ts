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
}
