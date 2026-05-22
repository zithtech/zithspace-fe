import { portalClient, portalApi } from "@/lib/portalAxios";

export interface PortalReleaseMilestone {
  id: string;
  name: string;
  status: string;
}

export interface PortalReleaseProject {
  id: string;
  name: string;
  code: string | null;
}

export interface PortalRelease {
  id: string;
  title: string;
  version: string | null;
  description: string | null;
  releaseDate: string | null;
  createdAt: string;
  updatedAt: string;
  milestone: PortalReleaseMilestone | null;
  project: PortalReleaseProject | null;
}

export interface PortalReleaseStats {
  total: number;
  thisMonth: number;
  distinctProjects: number;
  withMilestone: number;
  latestVersion: string | null;
  latestDate: string | null;
}

export interface PortalReleaseMeta {
  total: number;
  page: number;
  limit: number;
  projects: PortalReleaseProject[];
  milestones: { id: string; name: string; status: string }[];
  stats: PortalReleaseStats;
}

export const portalReleaseService = {
  async list(params: {
    page?: number;
    limit?: number;
    projectId?: string;
    milestoneId?: string;
    search?: string;
    from?: string;
    to?: string;
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
      data: (res.data?.data || []) as PortalRelease[],
      meta: (res.data?.meta || null) as PortalReleaseMeta | null,
    };
  },

  detail(id: string) {
    return portalApi.get<PortalRelease>(`/api/client-portal/releases/${id}`);
  },
};
