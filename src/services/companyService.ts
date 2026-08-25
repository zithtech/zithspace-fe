import { api, apiUtils, ApiError, PaginatedResponse } from "@/lib/axios";
import {
  Company,
  CompanyFilters,
  CreateCompanyData,
  UpdateCompanyData,
  PaginatedCompanyResponse
} from "@/types/company";

export class CompanyService {
  /**
   * Get all companies with pagination and filters
   */
  static async getAll(filters: CompanyFilters = {}): Promise<PaginatedCompanyResponse> {
    try {
      return await apiUtils.getPaginated<Company>(
        "/api/companies",
        filters
      );
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error("Failed to fetch companies");
    }
  }

  /**
   * Get company by ID
   */
  static async getById(id: number): Promise<Company> {
    try {
      return await api.get<Company>(`/api/companies/${id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error("Failed to fetch company");
    }
  }

  /**
   * Get active company
   */
  static async getActive(): Promise<Company | null> {
    try {
      const response = await CompanyService.getAll({ isActive: true, limit: 1 });
      return response.data.length > 0 ? response.data[0] : null;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Create company
   */
  static async create(data: CreateCompanyData): Promise<Company> {
    try {
      return await api.post<Company>("/api/companies", data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error("Failed to create company");
    }
  }

  /**
   * Update company
   */
  static async update(id: number, data: UpdateCompanyData): Promise<Company> {
    try {
      return await api.put<Company>(`/api/companies/${id}`, data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error("Failed to update company");
    }
  }

  /**
   * Set company as active
   */
  static async setActive(id: number): Promise<void> {
    try {
      await api.patch(`/api/companies/${id}/active`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error("Failed to set company as active");
    }
  }


  /**
 * Delete company
 */
static async delete(id: number): Promise<void> {
  try {
    await api.delete(`/api/companies/${id}`);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new Error("Failed to delete company");
  }
}

}