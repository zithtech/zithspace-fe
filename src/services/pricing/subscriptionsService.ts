import { apiClient } from "@/lib/axios";

const BASE = "/api/pricing/subscriptions";

export type SubscriptionStatus =
  | "pending"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "expired";

export const SUBSCRIPTION_STATUSES: SubscriptionStatus[] = [
  "pending",
  "trialing",
  "active",
  "past_due",
  "canceled",
  "expired",
];

export const SUBSCRIPTION_ACTIVE_STATUSES = new Set<SubscriptionStatus>([
  "pending",
  "trialing",
  "active",
  "past_due",
]);

export interface Subscription {
  id: string;
  tenantId: string;
  tenantName: string | null;
  tenantSubdomain: string | null;
  planVariantId: string;
  planVariantPriceId: string | null;
  variantCode: string | null;
  variantName: string | null;
  billingCycle: string | null;
  planId: string | null;
  planCode: string | null;
  planName: string | null;
  currencyCode: string;
  amount: number;
  discountAmount: number;
  taxAmount: number;
  finalAmount: number;
  status: SubscriptionStatus;
  startsAt: string;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionFeatureSnapshot {
  id: string;
  featureId: string | null;
  featureCode: string;
  snapshottedAt: string;
}

export interface SubscriptionLimitSnapshot {
  id: string;
  limitId: string | null;
  limitCode: string;
  limitName: string | null;
  limitUnit: string | null;
  limitValue: string;
  snapshottedAt: string;
}

export interface SubscriptionDetail extends Subscription {
  features: SubscriptionFeatureSnapshot[];
  limits: SubscriptionLimitSnapshot[];
}

export interface SubscriptionListParams {
  page?: number;
  limit?: number;
  status?: SubscriptionStatus;
  tenantId?: string;
  planId?: string;
  planVariantId?: string;
  search?: string;
}

export interface SubscriptionListResponse {
  data: Subscription[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface SubscriptionCreateInput {
  tenantId: string;
  planVariantId: string;
  currencyCode: string;
  discountAmount?: number;
  taxAmount?: number;
  startsAt?: string;
  status?: SubscriptionStatus;
}

export interface ChangePlanInput {
  tenantId: string;
  planVariantId: string;
  currencyCode: string;
  discountAmount?: number;
  taxAmount?: number;
}

const buildQuery = (params: Record<string, any>) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.append(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
};

export const subscriptionsService = {
  list: async (params: SubscriptionListParams = {}): Promise<SubscriptionListResponse> => {
    const r = await apiClient.get(`${BASE}${buildQuery(params)}`);
    return { data: r.data.data, pagination: r.data.pagination };
  },
  get: async (id: string): Promise<SubscriptionDetail> => {
    const r = await apiClient.get(`${BASE}/${id}`);
    return r.data.data;
  },
  create: async (input: SubscriptionCreateInput): Promise<Subscription> => {
    const r = await apiClient.post(BASE, input);
    return r.data.data;
  },
  changePlan: async (input: ChangePlanInput): Promise<Subscription> => {
    const r = await apiClient.post(`${BASE}/change-plan`, input);
    return r.data.data;
  },
  cancel: async (id: string): Promise<Subscription> => {
    const r = await apiClient.patch(`${BASE}/${id}/cancel`);
    return r.data.data;
  },
  setStatus: async (id: string, status: SubscriptionStatus): Promise<Subscription> => {
    const r = await apiClient.patch(`${BASE}/${id}/status`, { status });
    return r.data.data;
  },
};

export default subscriptionsService;
