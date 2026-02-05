import { api, apiUtils, ApiError } from "@/lib/axios";
import type { PayslipField } from "@/types/payslipField";

export interface PayslipFieldFormData {
  label: string;
  value?: string;
  type: "text" | "number" | "date" | "dropdown";
  options?: string[];
  status?: boolean;
}

export interface UpdateFieldData {
  label?: string;
  value?: string;
  options?: string[];
  status?: boolean;
}

export class PayslipFieldService {
  /**
   * Get all payslip fields
   */
  static async getAll(): Promise<PayslipField[]> {
    try {
      return await api.get<PayslipField[]>("/api/payslip-fields");
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to fetch payslip fields");
    }
  }

  /**
   * Get payslip field by ID
   */
  static async getById(id: number): Promise<PayslipField> {
    try {
      return await api.get<PayslipField>(`/api/payslip-fields/${id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to fetch payslip field");
    }
  }

  /**
   * Create payslip field
   */
  static async create(data: PayslipFieldFormData): Promise<PayslipField> {
    try {
      return await api.post<PayslipField>("/api/payslip-fields", data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to create payslip field");
    }
  }

  /**
   * Update payslip field
   */
  static async update(id: number, data: UpdateFieldData): Promise<PayslipField> {
    try {
      return await api.put<PayslipField>(`/api/payslip-fields/${id}`, data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to update payslip field");
    }
  }

  /**
   * Toggle field status
   */
  static async toggleStatus(id: number): Promise<PayslipField> {
    try {
      return await api.patch<PayslipField>(`/api/payslip-fields/${id}/status`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to toggle field status");
    }
  }

  /**
   * Delete payslip field
   */
  static async delete(id: number): Promise<void> {
    try {
      await api.delete(`/api/payslip-fields/${id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to delete payslip field");
    }
  }
}