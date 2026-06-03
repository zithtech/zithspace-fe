import { apiClient } from "@/lib/axios";

const BASE = "/api/pricing/limits";

export interface PricingLimit {
  id: string;
  code: string;
  name: string;
  unit: string;
  description: string | null;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface LimitListParams {
  page?: number;
  limit?: number;
  status?: "active" | "archived";
  search?: string;
}

export interface LimitListResponse {
  data: PricingLimit[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface LimitInput {
  code: string;
  name: string;
  unit: string;
  description?: string | null;
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

export const limitsService = {
  list: async (params: LimitListParams = {}): Promise<LimitListResponse> => {
    const r = await apiClient.get(`${BASE}${buildQuery(params)}`);
    return { data: r.data.data, pagination: r.data.pagination };
  },
  get: async (id: string): Promise<PricingLimit> => {
    const r = await apiClient.get(`${BASE}/${id}`);
    return r.data.data;
  },
  create: async (input: LimitInput): Promise<PricingLimit> => {
    const r = await apiClient.post(BASE, input);
    return r.data.data;
  },
  update: async (id: string, input: Partial<LimitInput>): Promise<PricingLimit> => {
    const r = await apiClient.put(`${BASE}/${id}`, input);
    return r.data.data;
  },
  archive: async (id: string): Promise<PricingLimit> => {
    const r = await apiClient.patch(`${BASE}/${id}/archive`);
    return r.data.data;
  },
  restore: async (id: string): Promise<PricingLimit> => {
    const r = await apiClient.patch(`${BASE}/${id}/restore`);
    return r.data.data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`);
  },
};

export default limitsService;
