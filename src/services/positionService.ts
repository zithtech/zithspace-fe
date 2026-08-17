import { api, apiUtils, PaginatedResponse } from "@/lib/axios";

export interface Position {
  id: string;
  code: string;
  title: string;
  departmentId: string;
  subDepartmentId?: string | null;
  gradeId: string;
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  // Relations included in response
  department?: { id: string; name: string };
  subDepartment?: { id: string; name: string };
  grade?: { id: string; name: string };
}

export interface CreatePositionData {
  code: string;
  title: string;
  departmentId: string;
  subDepartmentId?: string;
  gradeId: string;
  description?: string;
  isActive: boolean;
}

export interface UpdatePositionData extends Partial<CreatePositionData> {}

const API_URL = "/api/positions";

export const PositionService = {
  getAll: async (filters?: any): Promise<any> => {
    if (filters?.limit) {
      return await apiUtils.getPaginated<Position>(API_URL, filters);
    }
    const response = await api.get<any>(API_URL, { params: filters });
    return response.data?.data || response.data || response;
  },

  getById: async (id: string): Promise<Position> => {
    const response = await api.get<any>(`${API_URL}/${id}`);
    return response.data?.data || response.data || response;
  },

  create: async (data: CreatePositionData): Promise<Position> => {
    const response = await api.post<any>(API_URL, data);
    return response.data?.data || response.data || response;
  },

  update: async (id: string, data: UpdatePositionData): Promise<Position> => {
    const response = await api.put<any>(`${API_URL}/${id}`, data);
    return response.data?.data || response.data || response;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${API_URL}/${id}`);
  },
};
