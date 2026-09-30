import { portalApi } from "@/lib/portalAxios";

export type EnvKind =
  | "production"
  | "staging"
  | "uat"
  | "qa"
  | "dev"
  | "demo"
  | "preview"
  | "other";
export type EnvStatus =
  | "operational"
  | "degraded"
  | "down"
  | "maintenance"
  | "unknown";
export type DeployStatus =
  | "success"
  | "failed"
  | "rolled_back"
  | "in_progress";

export interface PortalEnvListItem {
  id: string;
  name: string;
  kind: EnvKind;
  url: string | null;
  status: EnvStatus;
  currentVersion: string | null;
  sslExpiresAt: string | null;
  lastBackupAt: string | null;
  uptimePercent: string | number | null;
  position: number;
  createdAt: string;
  updatedAt: string;
  projectId: string | null;
  projectName: string | null;
  projectCode: string | null;
  deploymentCount: number;
  lastDeployedAt: string | null;
}

export interface PortalEnvDeployment {
  id: string;
  version: string;
  status: DeployStatus;
  startedAt: string | null;
  finishedAt: string | null;
  durationSeconds: number | null;
  deployedBy: string | null;
  changelogExcerpt: string | null;
  releaseNoteId: string | null;
  releaseNoteTitle: string | null;
  releaseNoteVersion: string | null;
  rollbackOfDeploymentId: string | null;
  createdAt: string;
}

export interface PortalEnvDetail extends PortalEnvListItem {
  notes: string | null;
  lastHealthCheckAt: string | null;
  deployments: PortalEnvDeployment[];
}

export interface PortalEnvStats {
  total: number;
  production: number;
  operational: number;
  sslValid: number;
  totalDeploys: number;
}

export interface PortalEnvMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats?: PortalEnvStats;
  projects?: { id: string; name: string; code: string | null }[];
}

export const portalEnvironmentsService = {
  async list(params: {
    page?: number;
    limit?: number;
    search?: string;
    kind?: string;
    status?: string;
    projectId?: string;
  } = {}) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && v !== "") qs.append(k, String(v));
    });
    const res: any = await portalApi.get(
      `/api/client-portal/environments${qs.toString() ? `?${qs.toString()}` : ""}`
    );
    // Support both raw array or { data, meta }
    if (Array.isArray(res)) {
      return {
        data: res as PortalEnvListItem[],
        meta: { total: res.length, page: 1, limit: res.length, totalPages: 1 } as PortalEnvMeta,
      };
    }
    return {
      data: (res?.data || []) as PortalEnvListItem[],
      meta: (res?.meta || null) as PortalEnvMeta | null,
    };
  },
  detail(id: string) {
    return portalApi.get<PortalEnvDetail>(
      `/api/client-portal/environments/${id}`,
    );
  },
};
