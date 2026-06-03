import { apiClient } from "@/lib/axios";

const BASE = "/api/pricing/sections";

export interface Section {
  id: string;
  code: string;
  name: string;
  description: string | null;
  displayOrder: number;
  icon: string | null;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface SectionListParams {
  page?: number;
  limit?: number;
  status?: "active" | "archived";
  search?: string;
}

export interface SectionListResponse {
  data: Section[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface SectionInput {
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

export const sectionsService = {
  list: async (params: SectionListParams = {}): Promise<SectionListResponse> => {
    const r = await apiClient.get(`${BASE}${buildQuery(params)}`);
    return { data: r.data.data, pagination: r.data.pagination };
  },
  get: async (id: string): Promise<Section> => {
    const r = await apiClient.get(`${BASE}/${id}`);
    return r.data.data;
  },
  create: async (input: SectionInput): Promise<Section> => {
    const r = await apiClient.post(BASE, input);
    return r.data.data;
  },
  update: async (id: string, input: Partial<SectionInput>): Promise<Section> => {
    const r = await apiClient.put(`${BASE}/${id}`, input);
    return r.data.data;
  },
  archive: async (id: string): Promise<Section> => {
    const r = await apiClient.patch(`${BASE}/${id}/archive`);
    return r.data.data;
  },
  restore: async (id: string): Promise<Section> => {
    const r = await apiClient.patch(`${BASE}/${id}/restore`);
    return r.data.data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`);
  },
};

export default sectionsService;
