import { api, ApiError, PaginatedResponse } from "@/lib/axios";

/* ================= EMPLOYEE INTERFACE ================= */

export interface Employee {
  id: string;
  tenantId: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  gender: string;
  date_of_birth: string;
  blood_group?: string;
  mobile: string;
  work_email: string;
  personal_email?: string;
  status: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/* ================= CREATE / UPDATE DTO ================= */

export interface CreateEmployeeData {
  employee_code: string;
  first_name: string;
  last_name: string;
  gender: string;
  date_of_birth: string;
  blood_group?: string;
  mobile: string;
  work_email: string;
  personal_email?: string;
  status?: boolean;
}

export interface UpdateEmployeeData {
  employee_code?: string;
  first_name?: string;
  last_name?: string;
  gender?: string;
  date_of_birth?: string;
  blood_group?: string;
  mobile?: string;
  work_email?: string;
  personal_email?: string;
  status?: boolean;
  personal?: any;
}

/* ================= EMPLOYEE SERVICE ================= */

export class EmployeeService {
  /**
   * Get all employees (current tenant)
   */
  static async getEmployees(): Promise<Employee[]> {
    try {
      const response = await api.get<any>("/api/employees");
      return response.data?.data || response.data || response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to fetch employees");
    }
  }

  /**
   * Get employee by ID
   */
  static async getEmployeeById(id: string): Promise<Employee> {
    try {
      const response = await api.get<any>(`/api/employees/${id}`);
      return response.data?.data || response.data || response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to fetch employee");
    }
  }

  /**
   * Create new employee
   */
  static async createEmployee(data: CreateEmployeeData): Promise<Employee> {
    try {
      const response = await api.post<any>("/api/employees", data);
      return response.data?.data || response.data || response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to create employee");
    }
  }

  /**
   * Update employee
   */
  static async updateEmployee(
    id: any,
    data: UpdateEmployeeData,
  ): Promise<Employee> {
    try {
      const response = await api.put<any>(`/api/employees/${id}`, data);
      return response.data || response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to update employee");
    }
  }

  /**
   * Delete employee
   */
  static async deleteEmployee(id: string): Promise<void> {
    try {
      await api.delete(`/api/employees/${id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to delete employee");
    }
  }

  /**
   * Employees for dropdown / select
   */
  static async getEmployeesForSelect(): Promise<any[]> {
    try {
      const response = await api.get<any>("/api/members/select");
      return response.data?.data || response.data || response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to fetch employees for select");
    }
  }

  /**
   * Get upcoming birthdays for the current month
   */
  static async getUpcomingBirthdays(): Promise<
    Array<{
      id: string;
      firstName: string;
      lastName: string;
      dateOfBirth: string;
    }>
  > {
    try {
      return await api.get("/api/onboarding/birthdays");
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to fetch upcoming birthdays");
    }
  }

  /**
   * Get employee work detail by employee ID
   */
  static async getWorkDetailByEmployee(employeeId: string): Promise<any> {
    try {
      const response = await api.get<any>(`/api/employee-work-details/employee/${employeeId}`);
      return response.data?.data || response.data || response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to fetch employee work details");
    }
  }
}
