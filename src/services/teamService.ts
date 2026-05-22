import { api } from "@/lib/axios";

export type TeamDiscipline =
  | "engineering"
  | "design"
  | "qa"
  | "pm"
  | "account"
  | "devops"
  | "data"
  | "support"
  | "other";

export type TeamAvailability =
  | "available"
  | "limited"
  | "away"
  | "unavailable";

export interface TeamMember {
  id: string;
  staffUserId: string | null;
  staffUserName: string | null;
  staffUserEmail: string | null;
  staffUserAvatar: string | null;
  displayName: string;
  roleLabel: string;
  discipline: TeamDiscipline | null;
  contactEmail: string | null;
  contactEmailOverride: string | null;
  contactPhone: string | null;
  isPrimaryContact: boolean;
  bio: string | null;
  availabilityStatus: TeamAvailability;
  availabilityNote: string | null;
  isVisible: boolean;
  position: number;
  projectId: string | null;
  projectName: string | null;
  projectCode: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StaffOption {
  id: string;
  name: string;
  work_email: string | null;
  avatar_url: string | null;
  title: string | null;
}

export interface CreateTeamMemberPayload {
  staffUserId?: string;
  displayName?: string;
  roleLabel: string;
  discipline?: TeamDiscipline;
  contactEmail?: string;
  contactPhone?: string;
  isPrimaryContact?: boolean;
  bio?: string;
  availabilityStatus?: TeamAvailability;
  availabilityNote?: string;
  isVisible?: boolean;
  projectId?: string;
}

export const teamService = {
  listForClient(clientId: string) {
    return api.get<TeamMember[]>(`/api/clients-v2/${clientId}/team`);
  },
  staffOptions(clientId: string, search?: string) {
    const qs = search ? `?search=${encodeURIComponent(search)}` : "";
    return api.get<StaffOption[]>(
      `/api/clients-v2/${clientId}/team/staff-options${qs}`,
    );
  },
  create(clientId: string, payload: CreateTeamMemberPayload) {
    return api.post<{ id: string }>(
      `/api/clients-v2/${clientId}/team`,
      payload,
    );
  },
  update(id: string, payload: Partial<CreateTeamMemberPayload> & { position?: number }) {
    return api.put<void>(`/api/team/${id}`, payload);
  },
  remove(id: string) {
    return api.delete<void>(`/api/team/${id}`);
  },
  reorder(clientId: string, order: string[]) {
    return api.post<void>(`/api/clients-v2/${clientId}/team/reorder`, {
      order,
    });
  },
};
