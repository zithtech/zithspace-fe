import { apiClient } from "@/lib/axios";

const BASE = "/api/pricing/tenants";

export interface PricingTenant {
  id: string;
  name: string;
  subdomain: string;
  planType: string | null;
  isActive: boolean;
  isTrial: boolean;
  trialEndsAt: string | null;
  createdAt: string;
}

export interface PricingTenantListParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface PricingTenantListResponse {
  data: PricingTenant[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

const buildQuery = (params: Record<string, any>) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.append(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
};

export const pricingTenantsService = {
  list: async (params: PricingTenantListParams = {}): Promise<PricingTenantListResponse> => {
    const r = await apiClient.get(`${BASE}${buildQuery(params)}`);
    return { data: r.data.data, pagination: r.data.pagination };
  },
  get: async (id: string): Promise<PricingTenant> => {
    const r = await apiClient.get(`${BASE}/${id}`);
    return r.data.data;
  },
};

export default pricingTenantsService;
