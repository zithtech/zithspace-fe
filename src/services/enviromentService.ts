
import { api } from '@/lib/axios';

export interface Enviroment {
  id: string;
  name: string;
  code: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export interface EnviromentResponse {
  success: boolean;
  data: Enviroment[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const enviromentService = {

  // 🔹 Get all environments
  getEnviroments: async (
    page: number = 1,
    limit: number = 20,
    search?: string,
    status?: string
  ): Promise<EnviromentResponse> => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (search) params.append("search", search);
    if (status) params.append("status", status);

    return await api.get<EnviromentResponse>(
      `/api/enviroments?${params.toString()}`
    );
  },

  // 🔹 Get single environment
  getEnviromentById: async (id: string) => {
    return await api.get(`/api/enviroments/${id}`);
  },

  // 🔹 Create environment
  createEnviroment: async (data: {
    name: string;
    code: string;
    status?: string;
  }) => {
    return await api.post(`/api/enviroments`, data);
  },

  // 🔹 Update environment
  updateEnviroment: async (
    id: string,
    data: {
      name?: string;
      code?: string;
      status?: string;
    }
  ) => {
    return await api.put(`/api/enviroments/${id}`, data);
  },

  // 🔹 Delete (soft delete)
  deleteEnviroment: async (id: string) => {
    return await api.delete(`/api/enviroments/${id}`);
  },

  // 🔹 Dropdown select
  getEnviromentsForSelect: async () => {
    return await api.get(`/api/enviroments/select/options`);
  },
};
