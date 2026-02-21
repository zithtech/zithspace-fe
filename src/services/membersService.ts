import { api, ApiError, apiUtils, PaginatedResponse } from '@/lib/axios';

export interface Member {
  id: string; // Changed from id
  name: string;
  workEmail: string; // Changed from email
  personalEmail: string;
  role: string; // Changed from enum to flexible string
  position?: {
    id: string;
    title: string;
  } | null;
  phone: string;
  reportsTo?: {
    id: string; // Changed from id
    name: string;
    position: string;
  } | null;
  isActive: boolean;
  lastLoginAt?: string; // Added field from backend
  createdAt: string;
  updatedAt: string;
}

export interface CreateMemberData {
  name: string;
  workEmail: string;
  personalEmail: string;
  role: string; // Changed from enum to flexible string
  positionId: string; // Changed to ID
  phone: string;
  password: string;
  reportsToId?: string | null; // Changed from reportsTo to reportsToId
  dateOfBirth?: string; // Added optional field
  workDays?: number[]; // Added optional field
  assignedShiftId?: string | null; // ADDED: Missing shift assignment field
  isActive?: boolean; // ADDED: Missing isActive field
}

export interface UpdateMemberData {
  name: string;
  workEmail: string;
  personalEmail: string;
  role: string; // Changed from enum to flexible string
  positionId?: string; // Changed to ID
  phone: string;
  reportsToId?: string | null; // Changed from reportsTo to reportsToId
  isActive: boolean;
  dateOfBirth?: string; // Added optional field
  workDays?: number[]; // Added optional field
  assignedShiftId?: string | null; // ADDED: Missing shift assignment field
}

export interface MembersFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  position?: string;
  isActive?: boolean | string; // Backend accepts 'true'/'false'/'all'
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
   * Get a single member by User ID
   */
  static async getMemberByUserId(userId: string): Promise<Member> {
    try {
      return await api.get<Member>(`/api/members/user/${userId}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to fetch member by user ID');
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
   * Delete a member (soft delete)
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
   * Activate a member
   */
  static async activateMember(id: string): Promise<Member> {
    try {
      return await api.patch<Member>(`/api/members/${id}/activate`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to activate member');
    }
  }

  /**
   * Get members for dropdown/select options
   */
  static async getMembersForSelect(filters?: { role?: string; position?: string }): Promise<Array<{ 
    value: string; 
    label: string; 
    email: string;
    position: string;
    role: string;
  }>> {
    try {
      return await api.get('/api/members/select', { params: filters });
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to fetch members for selection');
    }
  }

  /**
   * Assign shift to member - RESTORED MISSING FUNCTIONALITY
   */
  static async assignShift(id: string, shiftId: string): Promise<Member> {
    try {
      return await api.patch<Member>(`/api/members/${id}/assign-shift`, { shiftId });
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to assign shift to member');
    }
  }
}
