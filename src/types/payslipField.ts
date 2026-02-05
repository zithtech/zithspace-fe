export type FieldType = "text" | "number" | "date" | "dropdown";

export interface PayslipField {
  id: number;
  tenantId: string;
  label: string;
  value: string;
  type: FieldType;
  options: string[] | null;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  createdById: string | null;
  updatedById: string | null;
}

export interface CreatePayslipFieldDto {
  label: string;
  value?: string;
  type: FieldType;
  options?: string[];
  status?: boolean;
}

export interface UpdatePayslipFieldDto {
  label?: string;
  value?: string;
  options?: string[];
  status?: boolean;
}