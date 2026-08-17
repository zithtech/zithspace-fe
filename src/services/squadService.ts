import { api, apiUtils, PaginatedResponse } from '@/lib/axios';

export interface SquadMember {
  id: string;
  squadMemberId: string;
  memberType: 'HEAD' | 'SUB_HEAD' | 'MEMBER';
  status: boolean;
  member: {
    id: string;
    name: string;
    workEmail: string;
    position?: { title: string };
    avatarUrl?: string;
    avatar?: string;
  };
}

export interface Squad {
  id: string;
  squadName: string;
  squadCode: string;
  squadStatus: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  squadMembers: SquadMember[];
}

export interface CreateSquadData {
  squadName: string;
  squadCode: string;
  headIds: string[];
  subHeadIds: string[];
  memberIds: string[];
}

export interface UpdateSquadData extends Partial<CreateSquadData> {
  squadStatus?: boolean;
  isArchived?: boolean;
}

export class SquadService {
  static async getSquads(filters: any = {}): Promise<PaginatedResponse<Squad>> {
    return apiUtils.getPaginated<Squad>('/api/squads', filters);
  }

  static async getSquad(id: string): Promise<Squad> {
    const response = await api.get(`/api/squads/${id}`);
    return response;
  }

  static async createSquad(data: CreateSquadData): Promise<Squad> {
    const response = await api.post('/api/squads', data);
    return response;
  }

  static async updateSquad(id: string, data: UpdateSquadData): Promise<Squad> {
    const response = await api.put(`/api/squads/${id}`, data);
    return response;
  }

  static async deleteSquad(id: string): Promise<void> {
    await api.delete(`/api/squads/${id}`);
  }

  static async archiveSquad(id: string, isArchived: boolean): Promise<void> {
    await api.patch(`/api/squads/${id}/archive`, { isArchived });
  }
}
