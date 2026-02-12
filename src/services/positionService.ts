// src/services/positionService.ts
import { api } from "@/lib/axios";

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
  getAll: async (): Promise<Position[]> => {
    const response = await api.get(API_URL);
    
    // Handle Axios response where data is in response.data
    const body = response.data ? response.data : response;

    // Handle { success: true, data: [...] } structure
    if (body && body.data && Array.isArray(body.data)) {
        return body.data;
    }
    
    // Handle direct array response
    if (Array.isArray(body)) {
        return body;
    }

    return [];
  },

  getById: async (id: string): Promise<Position> => {
    const response = await api.get(`${API_URL}/${id}`);
    const body = response.data ? response.data : response;
    return body.data || body;
  },

  create: async (data: CreatePositionData): Promise<Position> => {
    const response = await api.post(API_URL, data);
    return response.data?.data || response.data || response;
  },

  update: async (id: string, data: UpdatePositionData): Promise<Position> => {
    const response = await api.put(`${API_URL}/${id}`, data);
    return response.data?.data || response.data || response;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${API_URL}/${id}`);
  },
};
