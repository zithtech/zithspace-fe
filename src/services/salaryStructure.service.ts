import { api, apiUtils, ApiError } from "@/lib/axios";
import {
  SalaryStructure,
  SalaryStructureFilters,
  CreateSalaryStructureData,
  UpdateSalaryStructureData,
  PaginatedSalaryStructureResponse
} from "@/types/salaryStructure";

export class SalaryStructureService {
  /**
   * Get all salary structures with pagination and filters
   */
  static async getAll(filters: SalaryStructureFilters = {}): Promise<PaginatedSalaryStructureResponse> {
    try {
      return await apiUtils.getPaginated<SalaryStructure>(
        "/api/salary-structures",
        filters
      );
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to fetch salary structures");
    }
  }

  /**
   * Get salary structure by ID
   */
  static async getById(id: number): Promise<SalaryStructure> {
    try {
      return await api.get<SalaryStructure>(`/api/salary-structures/${id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to fetch salary structure");
    }
  }

  /**
   * Create salary structure
   */
  static async create(data: CreateSalaryStructureData): Promise<SalaryStructure> {
    try {
      return await api.post<SalaryStructure>("/api/salary-structures", data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to create salary structure");
    }
  }

  /**
   * Update salary structure
   */
  static async update(id: number, data: UpdateSalaryStructureData): Promise<SalaryStructure> {
    try {
      return await api.put<SalaryStructure>(`/api/salary-structures/${id}`, data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to update salary structure");
    }
  }

  /**
   * Toggle salary structure active status
   */
  static async toggleActive(id: number): Promise<SalaryStructure> {
    try {
      return await api.patch<SalaryStructure>(`/api/salary-structures/${id}/toggle-active`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to toggle salary structure active status");
    }
  }

  /**
   * Delete salary structure
   */
  static async delete(id: number): Promise<void> {
    try {
      await api.delete(`/api/salary-structures/${id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to delete salary structure");
    }
  }

  /**
   * Get active salary structures
   */
  static async getActive(): Promise<SalaryStructure[]> {
    try {
      const response = await this.getAll({ isActive: true });
      return response.data;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return [];
      }
      throw error;
    }
  }
}