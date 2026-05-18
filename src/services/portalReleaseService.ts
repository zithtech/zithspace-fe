import { portalClient, portalApi } from "@/lib/portalAxios";

export interface PortalReleaseListItem {
  id: string;
  version: string;
  title: string | null;
  environment: string | null;
  releaseDate: string | null;
  createdAt: string;
  summaryPreview: string;
  hasBreakingChanges: boolean;
  hasKnownIssues: boolean;
  linkedTicketCount: number;
  counts: {
    newFeatures: number;
    improvements: number;
    bugFixes: number;
    breakingChanges: number;
    databaseChanges: number;
    knownIssues: number;
  };
  project: {
    id: string;
    name: string;
    code: string | null;
  };
}

export interface PortalReleaseMeta {
  total: number;
  page: number;
  limit: number;
  environments: string[];
  projects: { id: string; name: string; code: string | null }[];
}

export interface PortalReleaseDetail {
  id: string;
  version: string;
  title: string | null;
  environment: string | null;
  releaseDate: string | null;
  createdAt: string;
  updatedAt: string;
  sections: {
    summary: string[];
    keyInsights: string[];
    newFeatures: string[];
    improvements: string[];
    bugFixes: string[];
    breakingChanges: string[];
    apiChanges: string[];
    databaseChanges: string[];
    knownIssues: string[];
  };
  linkedTickets: string[];
  repositories: string[];
  pullRequests: string[];
  project: {
    id: string;
    name: string;
    code: string | null;
  };
}

export const portalReleaseService = {
  async list(params: {
    page?: number;
    limit?: number;
    environment?: string;
    projectId?: string;
    search?: string;
  }) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && v !== "") qs.append(k, String(v));
    });
    const res = await portalClient.get(
      `/api/client-portal/releases${qs.toString() ? `?${qs.toString()}` : ""}`,
    );
    if (res.data?.success === false) {
      throw new Error(res.data.error || "Failed to load releases");
    }
    return {
      data: (res.data?.data || []) as PortalReleaseListItem[],
      meta: (res.data?.meta || null) as PortalReleaseMeta | null,
    };
  },

  detail(id: string) {
    return portalApi.get<PortalReleaseDetail>(
      `/api/client-portal/releases/${id}`,
    );
  },
};
