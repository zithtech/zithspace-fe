import { api, apiClient } from "@/lib/axios";

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
  createdByName?: string | null;
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
  async list(
    clientId: string,
    params: {
      page?: number;
      limit?: number;
      search?: string;
      projectId?: string;
      milestoneId?: string;
    } = {},
  ) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && v !== "") qs.append(k, String(v));
    });
    const res = await apiClient.get(
      `/api/clients-v2/${clientId}/releases${qs.toString() ? `?${qs.toString()}` : ""}`,
    );
    if (res.data?.success === false) {
      throw new Error(res.data.error || "Failed to load releases");
    }
    return {
      data: (res.data?.data || []) as ClientRelease[],
      meta: res.data?.meta || { total: (res.data?.data || []).length, page: 1, limit: 15, totalPages: 1 },
    };
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
