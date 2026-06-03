import { apiClient } from "@/lib/axios";

const BASE = "/api/pricing/modules";

export interface PricingModule {
  id: string;
  sectionId: string;
  sectionCode: string | null;
  sectionName: string | null;
  code: string;
  name: string;
  description: string | null;
  displayOrder: number;
  icon: string | null;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface ModuleListParams {
  page?: number;
  limit?: number;
  status?: "active" | "archived";
  sectionId?: string;
  search?: string;
}

export interface ModuleListResponse {
  data: PricingModule[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface ModuleInput {
  sectionId: string;
  code: string;
  name: string;
  description?: string | null;
  displayOrder?: number;
  icon?: string | null;
  status?: "active" | "archived";
}

const buildQuery = (params: Record<string, any>) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.append(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
};

export const modulesService = {
  list: async (params: ModuleListParams = {}): Promise<ModuleListResponse> => {
    const r = await apiClient.get(`${BASE}${buildQuery(params)}`);
    return { data: r.data.data, pagination: r.data.pagination };
  },
  get: async (id: string): Promise<PricingModule> => {
    const r = await apiClient.get(`${BASE}/${id}`);
    return r.data.data;
  },
  create: async (input: ModuleInput): Promise<PricingModule> => {
    const r = await apiClient.post(BASE, input);
    return r.data.data;
  },
  update: async (id: string, input: Partial<ModuleInput>): Promise<PricingModule> => {
    const r = await apiClient.put(`${BASE}/${id}`, input);
    return r.data.data;
  },
  archive: async (id: string): Promise<PricingModule> => {
    const r = await apiClient.patch(`${BASE}/${id}/archive`);
    return r.data.data;
  },
  restore: async (id: string): Promise<PricingModule> => {
    const r = await apiClient.patch(`${BASE}/${id}/restore`);
    return r.data.data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`);
  },
};

export default modulesService;
