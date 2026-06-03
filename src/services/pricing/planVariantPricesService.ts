import { apiClient } from "@/lib/axios";

const BASE = "/api/pricing/prices";

export interface PlanVariantPrice {
  id: string;
  planVariantId: string;
  variantCode: string | null;
  variantName: string | null;
  billingCycle: string | null;
  planId: string | null;
  planCode: string | null;
  planName: string | null;
  currencyCode: string;
  basePrice: number;
  setupFee: number;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface PriceListParams {
  page?: number;
  limit?: number;
  status?: "active" | "archived";
  planVariantId?: string;
  planId?: string;
  currencyCode?: string;
}

export interface PriceListResponse {
  data: PlanVariantPrice[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface PriceInput {
  planVariantId: string;
  currencyCode: string;
  basePrice: number;
  setupFee?: number;
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

export const planVariantPricesService = {
  list: async (params: PriceListParams = {}): Promise<PriceListResponse> => {
    const r = await apiClient.get(`${BASE}${buildQuery(params)}`);
    return { data: r.data.data, pagination: r.data.pagination };
  },
  get: async (id: string): Promise<PlanVariantPrice> => {
    const r = await apiClient.get(`${BASE}/${id}`);
    return r.data.data;
  },
  create: async (input: PriceInput): Promise<PlanVariantPrice> => {
    const r = await apiClient.post(BASE, input);
    return r.data.data;
  },
  update: async (
    id: string,
    input: Partial<Omit<PriceInput, "planVariantId">>
  ): Promise<PlanVariantPrice> => {
    const r = await apiClient.put(`${BASE}/${id}`, input);
    return r.data.data;
  },
  archive: async (id: string): Promise<PlanVariantPrice> => {
    const r = await apiClient.patch(`${BASE}/${id}/archive`);
    return r.data.data;
  },
  restore: async (id: string): Promise<PlanVariantPrice> => {
    const r = await apiClient.patch(`${BASE}/${id}/restore`);
    return r.data.data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`);
  },
};

export default planVariantPricesService;
