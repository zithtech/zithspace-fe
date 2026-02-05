
export interface EmployeeField {
  id: number;
  tenantId: string;
  companyId: number;
  systemKey: string;
  displayName: string;
  isVisible: boolean;
  createdById: number | null;
  updatedById: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEmployeeFieldData {
  companyId: number;
  systemKey: string;
  displayName?: string;
  isVisible?: boolean;
}

export interface UpdateEmployeeFieldData {
  displayName?: string;
}

export interface EmployeeFieldFilters {
  companyId: number;
  search?: string;
  isVisible?: boolean;
}

export interface PaginatedEmployeeFieldResponse {
  data: EmployeeField[];
  pagination: {
    current: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}