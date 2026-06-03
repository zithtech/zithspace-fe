import { apiClient } from "@/lib/axios";

const BASE = "/api/pricing/features";

export type FeatureType =
  | "MODULE"
  | "PAGE"
  | "ACTION"
  | "AI"
  | "AUTOMATION"
  | "LIMIT"
  | "INTEGRATION"
  | "ADDON";

export const FEATURE_TYPES: FeatureType[] = [
  "MODULE",
  "PAGE",
  "ACTION",
  "AI",
  "AUTOMATION",
  "LIMIT",
  "INTEGRATION",
  "ADDON",
];

// Human-friendly labels for the feature type enum. The DB still stores the
// uppercase codes; this is purely the UI display.
export const FEATURE_TYPE_LABELS: Record<FeatureType, string> = {
  MODULE: "Module",
  PAGE: "Page (without AI)",
  ACTION: "Action",
  AI: "AI",
  AUTOMATION: "Automation",
  LIMIT: "Limit",
  INTEGRATION: "Integration",
  ADDON: "Addon",
};

export function featureTypeLabel(t: FeatureType | string | null | undefined): string {
  if (!t) return "";
  return FEATURE_TYPE_LABELS[t as FeatureType] || t;
}

export interface PricingFeature {
  id: string;
  sectionId: string | null;
  sectionCode: string | null;
  sectionName: string | null;
  moduleId: string | null;
  moduleCode: string | null;
  moduleName: string | null;
  pageId: string | null;
  pageCode: string | null;
  pageName: string | null;
  code: string;
  name: string;
  featureType: FeatureType;
  description: string | null;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface FeatureListParams {
  page?: number;
  limit?: number;
  status?: "active" | "archived";
  featureType?: FeatureType;
  sectionId?: string;
  moduleId?: string;
  pageId?: string;
  search?: string;
}

export interface FeatureListResponse {
  data: PricingFeature[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface FeatureInput {
  sectionId?: string | null;
  moduleId?: string | null;
  pageId?: string | null;
  code: string;
  name: string;
  featureType: FeatureType;
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

export const featuresService = {
  list: async (params: FeatureListParams = {}): Promise<FeatureListResponse> => {
    const r = await apiClient.get(`${BASE}${buildQuery(params)}`);
    return { data: r.data.data, pagination: r.data.pagination };
  },
  get: async (id: string): Promise<PricingFeature> => {
    const r = await apiClient.get(`${BASE}/${id}`);
    return r.data.data;
  },
  create: async (input: FeatureInput): Promise<PricingFeature> => {
    const r = await apiClient.post(BASE, input);
    return r.data.data;
  },
  update: async (id: string, input: Partial<FeatureInput>): Promise<PricingFeature> => {
    const r = await apiClient.put(`${BASE}/${id}`, input);
    return r.data.data;
  },
  archive: async (id: string): Promise<PricingFeature> => {
    const r = await apiClient.patch(`${BASE}/${id}/archive`);
    return r.data.data;
  },
  restore: async (id: string): Promise<PricingFeature> => {
    const r = await apiClient.patch(`${BASE}/${id}/restore`);
    return r.data.data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`);
  },
};

export default featuresService;
