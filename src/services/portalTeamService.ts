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

export const portalTeamService = {
  list() {
    return portalApi.get<PortalTeamMember[]>(`/api/client-portal/team`);
  },
};
