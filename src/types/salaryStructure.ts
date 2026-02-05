
export type DeductionType = "BASIC_PERCENT" | "GROSS_PERCENT" | "FIXED";
export type VisibilityType = "PUBLIC" | "PRIVATE";

export interface Earning {
  id?: number;
  name: string;
  percentage: number;
  description?: string;
}

export interface Deduction {
  id?: number;
  name: string;
  type: DeductionType;
  value: number;
}

export interface SalaryStructure {
  id: number;
  name: string;
  description: string;
  grossSalary: number;
  earnings: Earning[];
  deductions: Deduction[];
  deductionsEnabled: boolean;
  visibility: VisibilityType;
  companyId?: number | null;
  roleId?: number | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  tenantId?: string;
  createdById?: string;
  updatedById?: string;
}

export interface SalaryStructureFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  visibility?: VisibilityType;
}

export interface PaginatedSalaryStructureResponse {
  data: SalaryStructure[];
  pagination: {
    current: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateSalaryStructureData {
  name: string;
  description: string;
  grossSalary: number;
  earnings: Omit<Earning, 'id'>[];
  deductions: Omit<Deduction, 'id'>[];
  deductionsEnabled: boolean;
  visibility: VisibilityType;
  companyId?: number | null;
  roleId?: number | null;
}

export interface UpdateSalaryStructureData extends Partial<CreateSalaryStructureData> {
  isActive?: boolean;
}

 export interface EmployeeSalary {
  employeeId: string;
  grossSalary: number;
  deductionsEnabled: boolean;
  earnings: Earning[];
  deductions: Deduction[];
}
