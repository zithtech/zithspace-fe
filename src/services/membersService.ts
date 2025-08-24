import { api, ApiError, apiUtils, PaginatedResponse } from '@/lib/axios';

export interface Member {
  _id: string;
  name: string;
  email: string;
  workEmail: string;
  personalEmail: string;
  role: 'super admin' | 'admin' | 'user';
  position: string;
  phone: string;
  reportsTo?: {
    _id: string;
    name: string;
    position: string;
  } | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMemberData {
  name: string;
  workEmail: string;
  personalEmail: string;
  role: 'super admin' | 'admin' | 'user';
  position: string;
  phone: string;
  password: string;
  reportsTo?: string | null;
}

export interface UpdateMemberData {
  name: string;
  workEmail: string;
  personalEmail: string;
  role: 'super admin' | 'admin' | 'user';
  position: string;
  phone: string;
  reportsTo?: string | null;
  isActive: boolean;
}

export interface MembersFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  position?: string;
  isActive?: boolean;
}

export class MembersService {
  /**
   * Get all members with pagination and filters
   */
  static async getMembers(filters: MembersFilters = {}): Promise<PaginatedResponse<Member>> {
    try {
      return await apiUtils.getPaginated<Member>('/api/members', filters);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to fetch members');
    }
  }

  /**
   * Get a single member by ID
   */
  static async getMember(id: string): Promise<Member> {
    try {
      return await api.get<Member>(`/api/members/${id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to fetch member');
    }
  }

  /**
   * Create a new member
   */
  static async createMember(data: CreateMemberData): Promise<Member> {
    try {
      return await api.post<Member>('/api/members', data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to create member');
    }
  }

  /**
   * Update an existing member
   */
  static async updateMember(id: string, data: UpdateMemberData): Promise<Member> {
    try {
      return await api.put<Member>(`/api/members/${id}`, data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to update member');
    }
  }

  /**
   * Delete a member
   */
  static async deleteMember(id: string): Promise<void> {
    try {
      await api.delete(`/api/members/${id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to delete member');
    }
  }

  /**
   * Get members for dropdown/select options
   */
  static async getMembersForSelect(): Promise<Array<{ value: string; label: string; position: string }>> {
    try {
      const response = await this.getMembers({ limit: 100 });
      return response.data.map(member => ({
        value: member._id,
        label: member.name,
        position: member.position,
      }));
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to fetch members for selection');
    }
  }
}
