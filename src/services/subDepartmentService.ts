import { api, apiUtils, PaginatedResponse } from "@/lib/axios";

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
  getAll: async (filters?: any): Promise<any> => {
    if (filters?.limit) {
      return await apiUtils.getPaginated<SubDepartment>(API_URL, filters);
    }
    const response = await api.get<any>(API_URL, { params: filters });
    return response.data?.data || response.data || response;
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