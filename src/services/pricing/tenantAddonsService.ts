import { apiClient } from "@/lib/axios";

const BASE = "/api/pricing/tenant-addons";

export type TenantAddonStatus = "pending" | "active" | "canceled" | "expired";
export const TENANT_ADDON_STATUSES: TenantAddonStatus[] = [
  "pending",
  "active",
  "canceled",
  "expired",
];
export const TENANT_ADDON_ACTIVE_STATUSES = new Set<TenantAddonStatus>([
  "pending",
  "active",
]);

export interface TenantAddon {
  id: string;
  tenantId: string;
  tenantName: string | null;
  tenantSubdomain: string | null;
  addonId: string | null;
  addonCode: string;
  addonName: string | null;
  addonType: "FEATURE" | "LIMIT_EXTENSION" | null;
  featureCode: string | null;
  featureName: string | null;
  limitCode: string | null;
  limitName: string | null;
  limitUnit: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currencyCode: string;
  status: TenantAddonStatus;
  startsAt: string;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TenantAddonListParams {
  page?: number;
  limit?: number;
  status?: TenantAddonStatus;
  tenantId?: string;
  addonId?: string;
}

export interface TenantAddonListResponse {
  data: TenantAddon[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface TenantAddonCreateInput {
  tenantId: string;
  addonId: string;
  quantity?: number;
  startsAt?: string;
  status?: TenantAddonStatus;
}

const buildQuery = (params: Record<string, any>) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.append(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
};

export const tenantAddonsService = {
  list: async (params: TenantAddonListParams = {}): Promise<TenantAddonListResponse> => {
    const r = await apiClient.get(`${BASE}${buildQuery(params)}`);
    return { data: r.data.data, pagination: r.data.pagination };
  },
  get: async (id: string): Promise<TenantAddon> => {
    const r = await apiClient.get(`${BASE}/${id}`);
    return r.data.data;
  },
  create: async (input: TenantAddonCreateInput): Promise<TenantAddon> => {
    const r = await apiClient.post(BASE, input);
    return r.data.data;
  },
  updateQuantity: async (id: string, quantity: number): Promise<TenantAddon> => {
    const r = await apiClient.put(`${BASE}/${id}/quantity`, { quantity });
    return r.data.data;
  },
  cancel: async (id: string): Promise<TenantAddon> => {
    const r = await apiClient.patch(`${BASE}/${id}/cancel`);
    return r.data.data;
  },
  setStatus: async (id: string, status: TenantAddonStatus): Promise<TenantAddon> => {
    const r = await apiClient.patch(`${BASE}/${id}/status`, { status });
    return r.data.data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`);
  },
};

export default tenantAddonsService;
