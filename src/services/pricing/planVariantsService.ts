import { apiClient } from "@/lib/axios";

const BASE = "/api/pricing/variants";

export type BillingCycle = "MONTHLY" | "QUARTERLY" | "YEARLY" | "ONE_TIME";

export const BILLING_CYCLES: BillingCycle[] = ["MONTHLY", "QUARTERLY", "YEARLY", "ONE_TIME"];

export interface PlanVariant {
  id: string;
  planId: string;
  planCode: string | null;
  planName: string | null;
  code: string;
  name: string;
  billingCycle: BillingCycle;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface PlanVariantListParams {
  page?: number;
  limit?: number;
  status?: "active" | "archived";
  planId?: string;
  billingCycle?: BillingCycle;
  search?: string;
}

export interface PlanVariantListResponse {
  data: PlanVariant[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface PlanVariantInput {
  planId: string;
  code: string;
  name: string;
  billingCycle: BillingCycle;
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

export const planVariantsService = {
  list: async (params: PlanVariantListParams = {}): Promise<PlanVariantListResponse> => {
    const r = await apiClient.get(`${BASE}${buildQuery(params)}`);
    return { data: r.data.data, pagination: r.data.pagination };
  },
  get: async (id: string): Promise<PlanVariant> => {
    const r = await apiClient.get(`${BASE}/${id}`);
    return r.data.data;
  },
  create: async (input: PlanVariantInput): Promise<PlanVariant> => {
    const r = await apiClient.post(BASE, input);
    return r.data.data;
  },
  update: async (id: string, input: Partial<PlanVariantInput>): Promise<PlanVariant> => {
    const r = await apiClient.put(`${BASE}/${id}`, input);
    return r.data.data;
  },
  archive: async (id: string): Promise<PlanVariant> => {
    const r = await apiClient.patch(`${BASE}/${id}/archive`);
    return r.data.data;
  },
  restore: async (id: string): Promise<PlanVariant> => {
    const r = await apiClient.patch(`${BASE}/${id}/restore`);
    return r.data.data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`);
  },
};

export default planVariantsService;
