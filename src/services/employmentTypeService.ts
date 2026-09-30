import { api } from "@/lib/axios";

export interface EmploymentType {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: { name: string; id: string };
  updatedBy?: { name: string; id: string };
}

export const employmentTypeService = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }): Promise<any> => {
    if (params && (params.page || params.limit || params.search)) {
      const res = await api.get<{ data: EmploymentType[]; pagination?: any }>("/api/employment-types", { params });
      return res;
    }
    return await api.get<EmploymentType[]>("/api/employment-types");
  },

  getById: async (id: string): Promise<EmploymentType> => {
    return await api.get<EmploymentType>(`/api/employment-types/${id}`);
  },

  create: async (data: { code: string; name: string; description?: string; isActive: boolean }): Promise<EmploymentType> => {
    return await api.post<EmploymentType>("/api/employment-types", data);
  },

  update: async (id: string, data: { code?: string; name?: string; description?: string; isActive?: boolean }): Promise<EmploymentType> => {
    return await api.put<EmploymentType>(`/api/employment-types/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/employment-types/${id}`);
  },
};
