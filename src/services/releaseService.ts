import { api } from "@/lib/axios";

export interface ClientRelease {
  id: string;
  clientId: string;
  projectId: string | null;
  projectName: string | null;
  milestoneId: string | null;
  milestoneName: string | null;
  milestoneStatus: string | null;
  title: string;
  version: string | null;
  description: string | null;
  releaseDate: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MilestoneOption {
  id: string;
  name: string;
  status: string;
  projectId: string | null;
  projectName: string | null;
}

export interface CreateReleasePayload {
  title: string;
  version?: string;
  description?: string;
  releaseDate?: string | null;
  projectId?: string | null;
  milestoneId?: string | null;
}

export interface UpdateReleasePayload {
  title?: string;
  version?: string | null;
  description?: string | null;
  releaseDate?: string | null;
  projectId?: string | null;
  milestoneId?: string | null;
}

export const releaseService = {
  list(clientId: string) {
    return api.get<ClientRelease[]>(`/api/clients-v2/${clientId}/releases`);
  },
  milestoneOptions(clientId: string) {
    return api.get<MilestoneOption[]>(
      `/api/clients-v2/${clientId}/releases/milestone-options`,
    );
  },
  create(clientId: string, payload: CreateReleasePayload) {
    return api.post<ClientRelease>(
      `/api/clients-v2/${clientId}/releases`,
      payload,
    );
  },
  update(id: string, payload: UpdateReleasePayload) {
    return api.put<void>(`/api/client-releases/${id}`, payload);
  },
  remove(id: string) {
    return api.delete<void>(`/api/client-releases/${id}`);
  },
};
