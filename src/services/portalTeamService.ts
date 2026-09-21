import { portalApi } from "@/lib/portalAxios";

export interface PortalTeamMember {
  id: string;
  displayName: string;
  roleLabel: string;
  discipline:
    | "engineering"
    | "design"
    | "qa"
    | "pm"
    | "account"
    | "devops"
    | "data"
    | "support"
    | "other"
    | null;
  contactEmail: string | null;
  contactPhone: string | null;
  isPrimaryContact: boolean;
  bio: string | null;
  availabilityStatus: "available" | "limited" | "away" | "unavailable";
  availabilityNote: string | null;
  position: number;
  avatarUrl: string | null;
  projectId: string | null;
  projectName: string | null;
  projectCode: string | null;
}

export interface PortalTeamStats {
  total: number;
  primaries: number;
  available: number;
  disciplines: number;
}

export interface PortalTeamMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats?: PortalTeamStats;
  projects?: { id: string; name: string; code: string | null }[];
}

export const portalTeamService = {
  async list(params: {
    page?: number;
    limit?: number;
    search?: string;
    discipline?: string;
    projectId?: string;
    availability?: string;
  } = {}) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && v !== "") qs.append(k, String(v));
    });
    const res: any = await portalApi.get(
      `/api/client-portal/team${qs.toString() ? `?${qs.toString()}` : ""}`
    );
    if (Array.isArray(res)) {
      return {
        data: res as PortalTeamMember[],
        meta: { total: res.length, page: 1, limit: res.length, totalPages: 1 } as PortalTeamMeta,
      };
    }
    return {
      data: (res?.data || []) as PortalTeamMember[],
      meta: (res?.meta || null) as PortalTeamMeta | null,
    };
  },
};
