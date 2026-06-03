import { apiClient } from "@/lib/axios";

const BASE = "/api/pricing/plans";

export interface PricingPlan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  displayOrder: number;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface PlanListParams {
  page?: number;
  limit?: number;
  status?: "active" | "archived";
  search?: string;
}

export interface PlanListResponse {
  data: PricingPlan[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface PlanInput {
  code: string;
  name: string;
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

export const plansService = {
  list: async (params: PlanListParams = {}): Promise<PlanListResponse> => {
    const r = await apiClient.get(`${BASE}${buildQuery(params)}`);
    return { data: r.data.data, pagination: r.data.pagination };
  },
  get: async (id: string): Promise<PricingPlan> => {
    const r = await apiClient.get(`${BASE}/${id}`);
    return r.data.data;
  },
  create: async (input: PlanInput): Promise<PricingPlan> => {
    const r = await apiClient.post(BASE, input);
    return r.data.data;
  },
  update: async (id: string, input: Partial<PlanInput>): Promise<PricingPlan> => {
    const r = await apiClient.put(`${BASE}/${id}`, input);
    return r.data.data;
  },
  archive: async (id: string): Promise<PricingPlan> => {
    const r = await apiClient.patch(`${BASE}/${id}/archive`);
    return r.data.data;
  },
  restore: async (id: string): Promise<PricingPlan> => {
    const r = await apiClient.patch(`${BASE}/${id}/restore`);
    return r.data.data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`);
  },
};

export default plansService;
