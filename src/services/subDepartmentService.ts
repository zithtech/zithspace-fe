import { api } from "@/lib/axios";

export interface SubDepartment {
  id: string;
  code: string;
  name: string;
  parentDepartmentId: string;
  parentDepartment?: {
    id: string;
    name: string;
    code?: string;
  } | null;
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSubDepartmentData {
  code: string;
  name: string;
  parentDepartmentId: string;
  description?: string | null;
  isActive: boolean;
}

export interface UpdateSubDepartmentData extends Partial<CreateSubDepartmentData> {}

const API_URL = "/api/sub-departments";

export const SubDepartmentService = {
  getAll: async (): Promise<SubDepartment[]> => {
    return await api.get<SubDepartment[]>(API_URL);
  },

  create: async (data: CreateSubDepartmentData): Promise<SubDepartment> => {
    return await api.post<SubDepartment>(API_URL, data);
  },

  update: async (
    id: string,
    data: UpdateSubDepartmentData,
  ): Promise<SubDepartment> => {
    return await api.put<SubDepartment>(`${API_URL}/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${API_URL}/${id}`);
  },
};