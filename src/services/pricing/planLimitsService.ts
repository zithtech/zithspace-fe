import { apiClient } from "@/lib/axios";

const BASE = "/api/pricing/plan-limits";

export const LIMIT_UNLIMITED_SENTINEL = "UNLIMITED";

export interface PlanLimitAssignment {
  id: string;
  planVariantId: string;
  limitId: string;
  limitCode: string | null;
  limitName: string | null;
  limitUnit: string | null;
  variantCode: string | null;
  limitValue: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlanLimitListParams {
  planVariantId?: string;
  planId?: string;
  limitId?: string;
}

export interface PlanLimitInput {
  planVariantId: string;
  limitId: string;
  limitValue: string;
}

const buildQuery = (params: Record<string, any>) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.append(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
};

export const planLimitsService = {
  list: async (params: PlanLimitListParams = {}): Promise<PlanLimitAssignment[]> => {
    const r = await apiClient.get(`${BASE}${buildQuery(params)}`);
    return r.data.data;
  },
  upsert: async (input: PlanLimitInput): Promise<PlanLimitAssignment> => {
    const r = await apiClient.put(`${BASE}/upsert`, input);
    return r.data.data;
  },
  removeByPair: async (params: { planVariantId: string; limitId: string }): Promise<void> => {
    await apiClient.delete(`${BASE}/by-pair${buildQuery(params)}`);
  },
  removeById: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`);
  },
};

export default planLimitsService;
