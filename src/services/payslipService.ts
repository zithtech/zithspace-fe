import { api } from "@/lib/axios";

export interface PayslipData {
  employeeId: string;
  companyId: number;
  fromDate: string;
  toDate: string;
  snapshot: any;
  pdfUrl?: string;
}

export interface Payslip {
  id: number;
  tenantId: string;
  employeeId: string;
  companyId: number;
  fromDate: string;
  toDate: string;
  snapshot: any;
  pdfUrl: string | null;
  createdAt: string;
  createdById: string | null;
  createdBy?: {
    id: string;
    name: string;
  };
}

export interface PayslipCreateResponse {
  message: string;
  data: Payslip;
}

export interface PayslipsResponse {
  data: Payslip[];
}

/**
 * Create a new payslip
 */
export const createPayslip = async (data: PayslipData): Promise<PayslipCreateResponse> => {
  const response = await api.post<PayslipCreateResponse>("/api/payslips", data);
  return response.data;
};

/**
 * Get all payslips for the current tenant
 */
export const getPayslips = async (): Promise<PayslipsResponse> => {
  const response = await api.get<PayslipsResponse>("/api/payslips");
  return response.data;
};

/**
 * Get payslip by ID
 */
export const getPayslipById = async (id: number): Promise<{ data: Payslip }> => {
  const response = await api.get<{ data: Payslip }>(`/api/payslips/${id}`);
  return response.data;
};

/**
 * Get all payslips for a specific employee
 */
export const getPayslipsByEmployee = async (employeeId: string): Promise<{ data: Payslip[] }> => {
  const response = await api.get<{ data: Payslip[] }>(`/api/payslips/employee/${employeeId}`);
  return response.data;
};

/**
 * Delete a payslip
 */
export const deletePayslip = async (id: number): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/api/payslips/${id}`);
  return response.data;
};

/**
 * Generate payslips for multiple employees (bulk generation)
 */
export const generatePayslips = async (data: {
  selectedCompany: number;
  selectedSalaryStructureId: number;
  fromDate: string;
  toDate: string;
  selectionType: "user" | "department";
  selectedUser?: string;
  selectedDepartment?: string;
}): Promise<{
  message: string;
  count: number;
  payslips: Payslip[];
}> => {
  const response = await api.post<{
    message: string;
    count: number;
    payslips: Payslip[];
  }>("/api/payslips/generate", data);
  return response.data;
};
