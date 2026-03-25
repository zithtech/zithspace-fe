import { api, ApiError } from "@/lib/axios";

export type SalaryType = "MONTHLY" | "YEARLY";

export interface EmployeeSalaryAssignment {
  id: string;
  tenantId: string;
  employeeId: string;
  structureId: string;
  baseSalary: number;
  salaryType: SalaryType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  employee?: {
    first_name: string;
    last_name: string;
    employee_code: string;
  };
  structure?: {
    name: string;
    grossSalary?: number;
  };
  components?: {
    id: string;
    componentId: number;
    amount: number;
    calculationType: string;
    percentageBasis: string | null;
    value: number;
    component: {
      componentName: string;
      type: string;
      componentCode: string;
    };
  }[];
}

export interface CreateSalaryAssignmentData {
  employeeId: string;
  structureId: string;
  baseSalary: number;
  salaryType: SalaryType;
}

export class SalaryAssignmentService {
  static async getAssignments(): Promise<EmployeeSalaryAssignment[]> {
    try {
      return await api.get<EmployeeSalaryAssignment[]>("/api/salary-structures/assignments");
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to fetch salary assignments");
    }
  }

  static async getAssignmentByEmployee(employeeId: string): Promise<EmployeeSalaryAssignment> {
    try {
      return await api.get<EmployeeSalaryAssignment>(`/api/salary-structures/assignments/employee/${employeeId}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to fetch employee assignment");
    }
  }

  static async assignStructure(data: CreateSalaryAssignmentData): Promise<EmployeeSalaryAssignment> {
    try {
      return await api.post<EmployeeSalaryAssignment>("/api/salary-structures/assignments", data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to assign salary structure");
    }
  }

  static async updateAssignment(id: string, data: Partial<CreateSalaryAssignmentData>): Promise<EmployeeSalaryAssignment> {
    try {
      return await api.put<EmployeeSalaryAssignment>(`/api/salary-structures/assignments/${id}`, data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to update salary assignment");
    }
  }

  static async deleteAssignment(id: string): Promise<void> {
    try {
      return await api.delete(`/api/salary-structures/assignments/${id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to delete salary assignment");
    }
  }
}
