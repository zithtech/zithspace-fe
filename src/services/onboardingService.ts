// import { api, ApiError } from "@/lib/axios";

// export class EmployeeOnboardingService {
//   /**
//    * Create full employee onboarding
//    */
//   static async createEmployeeOnboarding(data: any): Promise<any> {
//     try {
//       return await api.post<any>("/api/onboarding", data);
//     } catch (error) {
//       if (error instanceof ApiError) {
//         throw new Error(error.message);
//       }
//       throw new Error("Failed to complete employee onboarding");
//     }
//   }
// }

import { api, ApiError } from "@/lib/axios";

export class EmployeeOnboardingService {
  /**
   * Create full employee onboarding
   */
  static async createEmployeeOnboarding(data: any): Promise<any> {
    try {
      return await api.post<any>("/api/onboarding", data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to complete employee onboarding");
    }
  }

  /**
   * Get all employees (list view)
   */
  static async getAllEmployees(): Promise<any> {
    try {
      return await api.get<any>("/api/onboarding");
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to fetch employees");
    }
  }

  /**
   * Get employee by ID (full details)
   */
  static async getEmployeeById(employeeId: string): Promise<any> {
    try {
      return await api.get<any>(`/api/onboarding/${employeeId}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to fetch employee details");
    }
  }

  /**
   * Update employee (full update)
   */
  static async updateEmployee(employeeId: any, data: any): Promise<any> {
    if (!employeeId || employeeId === "undefined") {
      throw new Error("Employee ID is required for update");
    }

    try {
      return await api.put<any>(`/api/onboarding/${employeeId}`, data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to update employee");
    }
  }

  /**
   * Delete employee (soft delete)
   */
  static async deleteEmployee(employeeId: string): Promise<any> {
    try {
      return await api.delete<any>(`/api/onboarding/${employeeId}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to delete employee");
    }
  }
}
