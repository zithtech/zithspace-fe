import { api, apiClient } from "@/lib/axios";

export interface ClientPortalUser {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  designation?: string | null;
  contactId: string | null;
  status: "active" | "disabled" | "pending";
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  createdBy?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  } | null;
}

export interface CreatePortalUserPayload {
  contactId?: string;
  email: string;
  displayName?: string;
  username?: string;
}

export interface CreatePortalUserResponse {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  status: string;
  createdAt: string;
  temporaryPassword: string;
}

export const clientPortalService = {
  async listForClient(
    clientId: string,
    params: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
    } = {},
  ) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && v !== "") qs.append(k, String(v));
    });
    const res = await apiClient.get(
      `/api/clients-v2/${clientId}/portal-users${qs.toString() ? `?${qs.toString()}` : ""}`,
    );
    if (res.data?.success === false) {
      throw new Error(res.data.error || "Failed to load portal users");
    }
    return {
      data: (res.data?.data || []) as ClientPortalUser[],
      meta: res.data?.meta || { total: (res.data?.data || []).length, page: 1, limit: 15, totalPages: 1 },
    };
  },

  create(clientId: string, payload: CreatePortalUserPayload) {
    return api.post<CreatePortalUserResponse>(
      `/api/clients-v2/${clientId}/portal-users`,
      payload,
    );
  },

  resetPassword(portalUserId: string, payload?: { portalUrl?: string }) {
    return api.post<{ temporaryPassword: string; emailSent: boolean }>(
      `/api/clients-v2/portal-users/${portalUserId}/reset-password`,
      payload,
    );
  },

  updateStatus(portalUserId: string, status: "active" | "disabled") {
    return api.patch<{ id: string; status: string }>(
      `/api/clients-v2/portal-users/${portalUserId}/status`,
      { status },
    );
  },

  remove(portalUserId: string) {
    return api.delete<void>(`/api/clients-v2/portal-users/${portalUserId}`);
  },

  // ----- Billing-customer linkage (drives invoice visibility) -----
  listLinkedCustomers(clientId: string) {
    return api.get<LinkedCustomer[]>(
      `/api/clients-v2/${clientId}/billing-customers`,
    );
  },

  searchAvailableCustomers(clientId: string, search?: string) {
    const qs = search ? `?search=${encodeURIComponent(search)}` : "";
    return api.get<AvailableCustomer[]>(
      `/api/clients-v2/${clientId}/billing-customers/available${qs}`,
    );
  },

  linkCustomer(clientId: string, customerId: string) {
    return api.post<{ customerId: string; clientId: string }>(
      `/api/clients-v2/${clientId}/billing-customers`,
      { customerId },
    );
  },

  unlinkCustomer(clientId: string, customerId: string) {
    return api.delete<void>(
      `/api/clients-v2/${clientId}/billing-customers/${customerId}`,
    );
  },
};

export interface LinkedCustomer {
  id: string;
  company_name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  country: string | null;
  is_active: boolean | null;
  created_at: string;
}

export interface AvailableCustomer {
  id: string;
  company_name: string;
  email: string | null;
  client_id: string | null;
}
