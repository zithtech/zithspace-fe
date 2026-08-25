import { api, apiUtils, PaginatedResponse } from "@/lib/axios";

export interface Department {
  id: string;
  code: string;
  name: string;
  employmentType?: string | null;
  description?: string | null;
  headId?: string | null;
  head?: {
    id: string;
    name: string;
  } | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDepartmentData {
  code: string;
  name: string;
  employmentType?: string;
  description?: string;
  headId?: string;
  isActive: boolean;
}

export interface UpdateDepartmentData extends Partial<CreateDepartmentData> {}

const API_URL = "/api/departments";

export const DepartmentService = {
  getAll: async (filters?: any): Promise<any> => {
    if (filters?.limit) {
      return await apiUtils.getPaginated<Department>(API_URL, filters);
    }
    const response = await api.get<any>(API_URL, { params: filters });
    return response.data?.data || response.data || response;
  },

  create: async (data: CreateDepartmentData): Promise<Department> => {
    return await api.post<Department>(API_URL, data);
  },

  update: async (
    id: string,
    data: UpdateDepartmentData,
  ): Promise<Department> => {
    return await api.put<Department>(`${API_URL}/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${API_URL}/${id}`);
  },
};
