import { api } from "@/lib/axios";

/* ================= TYPES ================= */

export interface EmployeeSetting {
  id: string;
  employeeCodePrefix: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeSettingData {
  employeeCodePrefix: string;
}

export interface UpdateEmployeeSettingData {
  employeeCodePrefix: string;
}

/* ================= SERVICE ================= */

export class EmployeeSettingService {
  /**
   * Get employee settings for current tenant
   */
  static async getEmployeeSetting() {
    // Let the hook handle the error (e.g. 404)
    return await api.get("/api/employeesettings");
  }

  /**
   * Create employee setting
   */
  static async createEmployeeSetting(data: CreateEmployeeSettingData) {
    return await api.post("/api/employeesettings", data);
  }

  /**
   * Update employee setting
   */
  static async updateEmployeeSetting(
    id: string,
    data: UpdateEmployeeSettingData,
  ) {
    return await api.put(`/api/employeesettings/${id}`, data);
  }

  /**
   * Delete employee setting
   */
  static async deleteEmployeeSetting(id: string): Promise<void> {
    await api.delete(`/api/employeesettings/${id}`);
  }
}
