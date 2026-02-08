import { api, apiUtils, ApiError, PaginatedResponse } from "@/lib/axios";



export type SalaryComponentType = "Earning" | "Deduction";

export interface SalaryComponent {
  
  key: number;

  componentName: string;
  componentCode: string;
  type: SalaryComponentType;
  status: boolean;

  tenantId: string;
  createdById: string;
  updatedById?: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface CreateSalaryComponentData {
  componentName: string;
  componentCode: string;
  type: SalaryComponentType;
  status: boolean;
}

export interface UpdateSalaryComponentData {
  componentName: string;
  componentCode: string;
  type: SalaryComponentType;
  status: boolean;
}

export interface SalaryComponentFilters {
  page?: number;
  limit?: number;
  search?: string;
  type?: SalaryComponentType;
  status?: "Active" | "Inactive";
}

/* =======================
 Service
======================= */

export class SalaryComponentsService {
  /**
   * Get salary components (paginated + filters)
   */
  static async getSalaryComponents(
    filters: SalaryComponentFilters = {}
  ): Promise<PaginatedResponse<SalaryComponent>> {
    try {
      return await apiUtils.getPaginated<SalaryComponent>(
        "/api/salary-components",
        filters
      );
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to fetch salary components");
    }
  }

  /**
   * Get single salary component by ID
   */
  static async getSalaryComponent(
    id: number
  ): Promise<SalaryComponent> {
    try {
      return await api.get<SalaryComponent>(
        `/api/salary-components/${id}`
      );
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to fetch salary component");
    }
  }

  /**
   * Create salary component
   */
  static async createSalaryComponent(
    data: CreateSalaryComponentData
  ): Promise<SalaryComponent> {
    try {
      return await api.post<SalaryComponent>(
        "/api/salary-components",
        data
      );
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to create salary component");
    }
  }

  /**
   * Update salary component
   */
  static async updateSalaryComponent(
    id: number,
    data: UpdateSalaryComponentData
  ): Promise<SalaryComponent> {
    try {
      return await api.put<SalaryComponent>(
        `/api/salary-components/${id}`,
        data
      );
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to update salary component");
    }
  }

  /**
   * Update salary component status only
   */
  static async updateSalaryComponentStatus(
    id: number,
    status: boolean
  ): Promise<SalaryComponent> {
    try {
      return await api.patch<SalaryComponent>(
        `/api/salary-components/${id}/status`,
        { status }
      );
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to update salary component status");
    }
  }

  static async deleteSalaryComponent(id: number): Promise<void> {
    try {
      await api.delete(`/api/salary-components/${id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to delete salary component");
    }
  }
}