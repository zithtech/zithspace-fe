import { apiClient } from "@/lib/axios";

const FEATURE_BASE = "/api/pricing/tenant-feature-overrides";
const LIMIT_BASE = "/api/pricing/tenant-limit-overrides";

export const OVERRIDE_UNLIMITED_SENTINEL = "UNLIMITED";

export interface TenantFeatureOverride {
  id: string;
  tenantId: string;
  featureId: string;
  featureCode: string | null;
  featureName: string | null;
  featureType: string | null;
  isEnabled: boolean;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TenantLimitOverride {
  id: string;
  tenantId: string;
  limitId: string;
  limitCode: string | null;
  limitName: string | null;
  limitUnit: string | null;
  limitValue: string;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FeatureOverrideInput {
  tenantId: string;
  featureId: string;
  isEnabled: boolean;
  reason?: string | null;
}
export interface LimitOverrideInput {
  tenantId: string;
  limitId: string;
  limitValue: string;
  reason?: string | null;
}

const buildQuery = (params: Record<string, any>) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.append(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
};

export const tenantFeatureOverridesService = {
  list: async (params: { tenantId?: string; featureId?: string } = {}): Promise<TenantFeatureOverride[]> => {
    const r = await apiClient.get(`${FEATURE_BASE}${buildQuery(params)}`);
    return r.data.data;
  },
  upsert: async (input: FeatureOverrideInput): Promise<TenantFeatureOverride> => {
    const r = await apiClient.put(`${FEATURE_BASE}/upsert`, input);
    return r.data.data;
  },
  removeByPair: async (params: { tenantId: string; featureId: string }): Promise<void> => {
    await apiClient.delete(`${FEATURE_BASE}/by-pair${buildQuery(params)}`);
  },
  removeById: async (id: string): Promise<void> => {
    await apiClient.delete(`${FEATURE_BASE}/${id}`);
  },
};

export const tenantLimitOverridesService = {
  list: async (params: { tenantId?: string; limitId?: string } = {}): Promise<TenantLimitOverride[]> => {
    const r = await apiClient.get(`${LIMIT_BASE}${buildQuery(params)}`);
    return r.data.data;
  },
  upsert: async (input: LimitOverrideInput): Promise<TenantLimitOverride> => {
    const r = await apiClient.put(`${LIMIT_BASE}/upsert`, input);
    return r.data.data;
  },
  removeByPair: async (params: { tenantId: string; limitId: string }): Promise<void> => {
    await apiClient.delete(`${LIMIT_BASE}/by-pair${buildQuery(params)}`);
  },
  removeById: async (id: string): Promise<void> => {
    await apiClient.delete(`${LIMIT_BASE}/${id}`);
  },
};
