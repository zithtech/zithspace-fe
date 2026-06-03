import { apiClient } from "@/lib/axios";

const BASE = "/api/pricing/plan-features";

export interface PlanFeatureEntitlement {
  id: string;
  planId: string;
  featureId: string;
  featureCode: string | null;
  featureName: string | null;
  featureType: string | null;
  planCode: string | null;
  createdAt: string;
}

export interface PlanFeatureListParams {
  planId?: string;
  featureId?: string;
}

export interface PlanFeatureInput {
  planId: string;
  featureId: string;
}

const buildQuery = (params: Record<string, any>) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.append(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
};

export const planFeaturesService = {
  list: async (params: PlanFeatureListParams = {}): Promise<PlanFeatureEntitlement[]> => {
    const r = await apiClient.get(`${BASE}${buildQuery(params)}`);
    return r.data.data;
  },
  add: async (input: PlanFeatureInput): Promise<PlanFeatureEntitlement> => {
    const r = await apiClient.post(BASE, input);
    return r.data.data;
  },
  removeById: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`);
  },
  removeByPair: async (input: PlanFeatureInput): Promise<void> => {
    await apiClient.delete(`${BASE}/by-pair${buildQuery(input)}`);
  },
};

export default planFeaturesService;
