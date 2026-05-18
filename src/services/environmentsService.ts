import { api } from "@/lib/axios";

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

export interface EnvListItem {
  id: string;
  name: string;
  kind: EnvKind;
  url: string | null;
  status: EnvStatus;
  currentVersion: string | null;
  sslExpiresAt: string | null;
  lastBackupAt: string | null;
  lastHealthCheckAt: string | null;
  uptimePercent: string | number | null;
  visibility: "client" | "internal";
  position: number;
  createdAt: string;
  updatedAt: string;
  projectId: string | null;
  projectName: string | null;
  projectCode: string | null;
  deploymentCount: number;
  lastDeployedAt: string | null;
}

export interface Deployment {
  id: string;
  version: string;
  status: DeployStatus;
  startedAt: string | null;
  finishedAt: string | null;
  durationSeconds: number | null;
  deployedBy: string | null;
  deployedByStaffName?: string | null;
  changelogExcerpt: string | null;
  releaseNoteId: string | null;
  releaseNoteTitle: string | null;
  releaseNoteVersion: string | null;
  rollbackOfDeploymentId: string | null;
  createdAt: string;
}

export interface EnvDetail extends EnvListItem {
  notes: string | null;
  createdByName: string | null;
  deployments: Deployment[];
}

export interface CreateEnvPayload {
  name: string;
  kind: EnvKind;
  url?: string;
  projectId?: string;
  visibility?: "client" | "internal";
  status?: EnvStatus;
  currentVersion?: string;
  sslExpiresAt?: string;
  lastBackupAt?: string;
  notes?: string;
}

export interface CreateDeployPayload {
  version: string;
  status?: DeployStatus;
  startedAt?: string;
  finishedAt?: string;
  durationSeconds?: number;
  deployedBy?: string;
  releaseNoteId?: string;
  changelogExcerpt?: string;
  rollbackOfDeploymentId?: string;
}

export const environmentsService = {
  listForClient(clientId: string) {
    return api.get<EnvListItem[]>(
      `/api/clients-v2/${clientId}/environments`,
    );
  },
  create(clientId: string, payload: CreateEnvPayload) {
    return api.post<{ id: string }>(
      `/api/clients-v2/${clientId}/environments`,
      payload,
    );
  },
  detail(id: string) {
    return api.get<EnvDetail>(`/api/environments/${id}`);
  },
  update(id: string, payload: Partial<CreateEnvPayload> & {
    uptimePercent?: number;
    lastHealthCheckAt?: string;
    position?: number;
  }) {
    return api.put<void>(`/api/environments/${id}`, payload);
  },
  remove(id: string) {
    return api.delete<void>(`/api/environments/${id}`);
  },
  createDeployment(envId: string, payload: CreateDeployPayload) {
    return api.post<{ id: string }>(
      `/api/environments/${envId}/deployments`,
      payload,
    );
  },
  removeDeployment(deploymentId: string) {
    return api.delete<void>(`/api/deployments/${deploymentId}`);
  },
};
