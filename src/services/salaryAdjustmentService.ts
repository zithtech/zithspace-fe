import { api } from "@/lib/axios";

export interface SalaryAdjustment {
  id: string;
  tenantId: string;
  employeeId: string;
  month: number;
  year: number;
  type: "Earning" | "Deduction";
  label: string;
  amount: number;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdjustmentData {
  id?: string;
  employeeId: string;
  month: number;
  year: number;
  label: string;
  amount: number;
  type: "Earning" | "Deduction";
  remarks?: string;
}

export class SalaryAdjustmentService {
  /**
   * GET /api/salary-adjustments
   */
  static async getAdjustments(params: { employeeId: string; month: number; year: number }): Promise<SalaryAdjustment[]> {
    return api.get<SalaryAdjustment[]>('/api/salary-adjustments', { params });
  }

  /**
   * POST /api/salary-adjustments
   */
  static async upsertAdjustment(data: CreateAdjustmentData): Promise<SalaryAdjustment> {
    return api.post<SalaryAdjustment>('/api/salary-adjustments', data);
  }

  /**
   * DELETE /api/salary-adjustments/:id
   */
  static async deleteAdjustment(id: string): Promise<void> {
    return api.delete(`/api/salary-adjustments/${id}`);
  }
}
