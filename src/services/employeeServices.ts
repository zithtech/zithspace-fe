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
}

/* ================= EMPLOYEE SERVICE ================= */

export class EmployeeService {
  /**
   * Get all employees (current tenant)
   */
  static async getEmployees(): Promise<Employee[]> {
    try {
      return await api.get<Employee[]>("/api/employees");
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
      return await api.get<Employee>(`/api/employees/${id}`);
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
      return await api.post<Employee>("/api/employees", data);
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
    id: string,
    data: UpdateEmployeeData,
  ): Promise<Employee> {
    try {
      return await api.put<Employee>(`/api/employees/${id}`, data);
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
  static async getEmployeesForSelect(): Promise<
    Array<{ value: string; label: string; workEmail: string }>
  > {
    try {
      return await api.get<
        Array<{
          value: string;
          label: string;
          workEmail: string;
        }>
      >("/api/employees/select");
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
}
