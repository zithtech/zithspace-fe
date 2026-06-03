import { apiClient } from "@/lib/axios";

const BASE = "/api/pricing/addons";

export type AddonType = "FEATURE" | "LIMIT_EXTENSION";
export const ADDON_TYPES: AddonType[] = ["FEATURE", "LIMIT_EXTENSION"];

export type BillingCycle = "MONTHLY" | "QUARTERLY" | "YEARLY" | "ONE_TIME";
export const ADDON_BILLING_CYCLES: BillingCycle[] = [
  "MONTHLY",
  "QUARTERLY",
  "YEARLY",
  "ONE_TIME",
];

export interface PricingAddon {
  id: string;
  featureId: string | null;
  featureCode: string | null;
  featureName: string | null;
  featureType: string | null;
  limitId: string | null;
  limitCode: string | null;
  limitName: string | null;
  limitUnit: string | null;
  code: string;
  name: string;
  addonType: AddonType;
  billingCycle: BillingCycle;
  price: number;
  currencyCode: string;
  status: "active" | "archived";
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AddonListParams {
  page?: number;
  limit?: number;
  status?: "active" | "archived";
  addonType?: AddonType;
  currencyCode?: string;
  billingCycle?: BillingCycle;
  search?: string;
}

export interface AddonListResponse {
  data: PricingAddon[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface AddonInput {
  code: string;
  name: string;
  addonType: AddonType;
  featureId?: string | null;
  limitId?: string | null;
  billingCycle: BillingCycle;
  price: number;
  currencyCode: string;
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

export const addonsService = {
  list: async (params: AddonListParams = {}): Promise<AddonListResponse> => {
    const r = await apiClient.get(`${BASE}${buildQuery(params)}`);
    return { data: r.data.data, pagination: r.data.pagination };
  },
  get: async (id: string): Promise<PricingAddon> => {
    const r = await apiClient.get(`${BASE}/${id}`);
    return r.data.data;
  },
  create: async (input: AddonInput): Promise<PricingAddon> => {
    const r = await apiClient.post(BASE, input);
    return r.data.data;
  },
  update: async (id: string, input: Partial<AddonInput>): Promise<PricingAddon> => {
    const r = await apiClient.put(`${BASE}/${id}`, input);
    return r.data.data;
  },
  archive: async (id: string): Promise<PricingAddon> => {
    const r = await apiClient.patch(`${BASE}/${id}/archive`);
    return r.data.data;
  },
  restore: async (id: string): Promise<PricingAddon> => {
    const r = await apiClient.patch(`${BASE}/${id}/restore`);
    return r.data.data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`);
  },
};

export default addonsService;
