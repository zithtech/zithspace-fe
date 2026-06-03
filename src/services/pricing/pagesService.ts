import { apiClient } from "@/lib/axios";

const BASE = "/api/pricing/pages";

export interface PricingPage {
  id: string;
  moduleId: string;
  moduleCode: string | null;
  moduleName: string | null;
  sectionId: string | null;
  sectionCode: string | null;
  sectionName: string | null;
  code: string;
  name: string;
  path: string | null;
  description: string | null;
  displayOrder: number;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface PageListParams {
  page?: number;
  limit?: number;
  status?: "active" | "archived";
  moduleId?: string;
  sectionId?: string;
  search?: string;
}

export interface PageListResponse {
  data: PricingPage[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface PageInput {
  moduleId: string;
  code: string;
  name: string;
  path?: string | null;
  description?: string | null;
  displayOrder?: number;
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

export const pagesService = {
  list: async (params: PageListParams = {}): Promise<PageListResponse> => {
    const r = await apiClient.get(`${BASE}${buildQuery(params)}`);
    return { data: r.data.data, pagination: r.data.pagination };
  },
  get: async (id: string): Promise<PricingPage> => {
    const r = await apiClient.get(`${BASE}/${id}`);
    return r.data.data;
  },
  create: async (input: PageInput): Promise<PricingPage> => {
    const r = await apiClient.post(BASE, input);
    return r.data.data;
  },
  update: async (id: string, input: Partial<PageInput>): Promise<PricingPage> => {
    const r = await apiClient.put(`${BASE}/${id}`, input);
    return r.data.data;
  },
  archive: async (id: string): Promise<PricingPage> => {
    const r = await apiClient.patch(`${BASE}/${id}/archive`);
    return r.data.data;
  },
  restore: async (id: string): Promise<PricingPage> => {
    const r = await apiClient.patch(`${BASE}/${id}/restore`);
    return r.data.data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`);
  },
};

export default pagesService;
