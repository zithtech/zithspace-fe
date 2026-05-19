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

export const portalEnvironmentsService = {
  list() {
    return portalApi.get<PortalEnvListItem[]>(
      `/api/client-portal/environments`,
    );
  },
  detail(id: string) {
    return portalApi.get<PortalEnvDetail>(
      `/api/client-portal/environments/${id}`,
    );
  },
};
