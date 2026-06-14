import { apiClient } from '@/lib/axios';

/**
 * Bucket Service
 * 
 * Handles all API calls related to bucket management for ticket organization.
 * Buckets allow organizing tickets across projects or within a single project.
 */

// ==================== Type Definitions ====================

export interface Bucket {
  id: string;
  tenantId: string;
  projectId: string | null;
  name: string;
  description: string | null;
  color: string | null;
  isShared: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
    workEmail: string;
    avatarUrl?: string;
  };
  project?: {
    id: string;
    name: string;
    code: string;
  } | null;
  _count?: {
    tickets: number;
    members: number;
  };
  members?: BucketMember[];
  userRole?: 'owner' | 'editor' | 'viewer';
}

export interface BucketMember {
  id: string;
  bucketId: string;
  userId: string;
  role: 'owner' | 'editor' | 'viewer';
  user: {
    id: string;
    name: string;
    workEmail: string;
    position?: string;
  };
}

export interface BucketTicket {
  id: string;
  ticketNumber: string;
  title: string;
  status: string;
  priority: string;
  type: string;
  storyPoint?: number;
  assignee?: {
    id: string;
    name: string;
    workEmail: string;
    avatarUrl?: string;
  };
  project: {
    id: string;
    name: string;
    code: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateBucketData {
  name: string;
  description?: string;
  color?: string;
  projectId?: string;
  isShared?: boolean;
}

export interface UpdateBucketData {
  name?: string;
  description?: string;
  color?: string;
  isShared?: boolean;
}

export interface BucketListResponse {
  success: boolean;
  data: Bucket[];
  message?: string;
}

export interface BucketResponse {
  success: boolean;
  data: Bucket;
  message?: string;
}

export interface BucketTicketsResponse {
  success: boolean;
  data: {
    tickets: BucketTicket[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
  message?: string;
}

// ==================== Bucket Service Class ====================

class BucketService {
  /**
   * Get all buckets (user has access to)
   * Returns buckets where user is owner or member
   * 
   * @param projectId - Optional filter by project
   * @returns List of buckets with access control applied
   */
  static async getBuckets(projectId?: string): Promise<Bucket[]> {
    try {
      const params = new URLSearchParams();
      if (projectId) params.append('projectId', projectId);

      const response = await apiClient.get<BucketListResponse>(
        `/api/buckets${params.toString() ? `?${params.toString()}` : ''}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching buckets:', error);
      const errorMessage = error.response?.data?.error || 'Failed to fetch buckets';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get bucket by ID
   * 
   * @param bucketId - Bucket ID
   * @returns Bucket with members and ticket count
   */
  static async getBucketById(bucketId: string): Promise<Bucket> {
    try {
      const response = await apiClient.get<BucketResponse>(`/api/buckets/${bucketId}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching bucket:', error);
      const errorMessage = error.response?.data?.error || 'Failed to fetch bucket';
      throw new Error(errorMessage);
    }
  }

  /**
   * Create a new bucket
   * 
   * @param bucketData - Bucket creation data
   * @returns Created bucket
   */
  static async createBucket(bucketData: CreateBucketData): Promise<Bucket> {
    try {
      const response = await apiClient.post<BucketResponse>('/api/buckets', bucketData);
      return response.data.data;
    } catch (error: any) {
      console.error('Error creating bucket:', error);
      const errorMessage = error.response?.data?.error || 'Failed to create bucket';
      throw new Error(errorMessage);
    }
  }

  /**
   * Update bucket (owner only)
   * 
   * @param bucketId - Bucket ID
   * @param updates - Fields to update
   * @returns Updated bucket
   */
  static async updateBucket(bucketId: string, updates: UpdateBucketData): Promise<Bucket> {
    try {
      const response = await apiClient.put<BucketResponse>(`/api/buckets/${bucketId}`, updates);
      return response.data.data;
    } catch (error: any) {
      console.error('Error updating bucket:', error);
      const errorMessage = error.response?.data?.error || 'Failed to update bucket';
      throw new Error(errorMessage);
    }
  }

  /**
   * Delete bucket (owner only)
   * Automatically unassigns all tickets from bucket
   * 
   * @param bucketId - Bucket ID
   */
  static async deleteBucket(bucketId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/buckets/${bucketId}`);
    } catch (error: any) {
      console.error('Error deleting bucket:', error);
      const errorMessage = error.response?.data?.error || 'Failed to delete bucket';
      throw new Error(errorMessage);
    }
  }

  /**
   * Add member to bucket
   * 
   * @param bucketId - Bucket ID
   * @param userId - User ID to add
   * @param role - Member role (editor or viewer)
   * @returns Updated bucket with new member
   */
  static async addBucketMember(
    bucketId: string,
    userId: string,
    role: 'editor' | 'viewer' = 'viewer'
  ): Promise<Bucket> {
    try {
      const response = await apiClient.post<BucketResponse>(
        `/api/buckets/${bucketId}/members`,
        { userId, role }
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error adding bucket member:', error);
      const errorMessage = error.response?.data?.error || 'Failed to add member';
      throw new Error(errorMessage);
    }
  }

  /**
   * Remove member from bucket
   * 
   * @param bucketId - Bucket ID
   * @param userId - User ID to remove
   * @returns Updated bucket without removed member
   */
  static async removeBucketMember(bucketId: string, userId: string): Promise<Bucket> {
    try {
      const response = await apiClient.delete<BucketResponse>(
        `/api/buckets/${bucketId}/members/${userId}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error removing bucket member:', error);
      const errorMessage = error.response?.data?.error || 'Failed to remove member';
      throw new Error(errorMessage);
    }
  }

  /**
   * Assign tickets to bucket (bulk operation)
   * 
   * @param bucketId - Bucket ID
   * @param ticketIds - Array of ticket IDs to assign
   * @returns Result with success count
   */
  static async assignTicketsToBucket(
    bucketId: string,
    ticketIds: string[]
  ): Promise<{ assignedCount: number }> {
    try {
      const response = await apiClient.post<{ success: boolean; data: { assignedCount: number } }>(
        `/api/buckets/${bucketId}/assign`,
        { ticketIds }
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error assigning tickets to bucket:', error);
      const errorMessage = error.response?.data?.error || 'Failed to assign tickets';
      throw new Error(errorMessage);
    }
  }

  /**
   * Unassign tickets from bucket (bulk operation)
   * 
   * @param bucketId - Bucket ID
   * @param ticketIds - Array of ticket IDs to unassign
   * @returns Result with success count
   */
  static async unassignTicketsFromBucket(
    bucketId: string,
    ticketIds: string[]
  ): Promise<{ unassignedCount: number }> {
    try {
      const response = await apiClient.post<{ success: boolean; data: { unassignedCount: number } }>(
        `/api/buckets/${bucketId}/unassign`,
        { ticketIds }
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error unassigning tickets from bucket:', error);
      const errorMessage = error.response?.data?.error || 'Failed to unassign tickets';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get tickets in bucket with pagination
   * 
   * @param bucketId - Bucket ID
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 20)
   * @returns Paginated list of tickets in bucket
   */
  static async getBucketTickets(
    bucketId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    tickets: BucketTicket[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const response = await apiClient.get<BucketTicketsResponse>(
        `/api/buckets/${bucketId}/tickets?${params.toString()}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching bucket tickets:', error);
      const errorMessage = error.response?.data?.error || 'Failed to fetch bucket tickets';
      throw new Error(errorMessage);
    }
  }

  /**
   * Check if user can edit bucket
   * 
   * @param bucket - Bucket object
   * @returns True if user is owner or has editor role
   */
  static canEditBucket(bucket: Bucket): boolean {
    return bucket.userRole === 'owner' || bucket.userRole === 'editor';
  }

  /**
   * Check if user can delete bucket
   * 
   * @param bucket - Bucket object
   * @returns True if user is owner
   */
  static canDeleteBucket(bucket: Bucket): boolean {
    return bucket.userRole === 'owner';
  }

  /**
   * Move all tickets in a bucket to a specific sprint
   * 
   * @param bucketId - Bucket ID
   * @param sprintId - Sprint ID to move tickets to
   */
  static async moveBucketToSprint(bucketId: string, sprintId: string): Promise<{ movedCount: number }> {
    try {
      const response = await apiClient.post<{ success: boolean; data: { movedCount: number } }>(
        `/api/buckets/${bucketId}/move-to-sprint`,
        { sprintId }
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error moving bucket to sprint:', error);
      const errorMessage = error.response?.data?.error || 'Failed to move bucket to sprint';
      throw new Error(errorMessage);
    }
  }

  /**
   * Move all tickets in a bucket back to backlog
   * 
   * @param bucketId - Bucket ID
   */
  static async moveBucketToBacklog(bucketId: string): Promise<{ movedCount: number }> {
    try {
      const response = await apiClient.post<{ success: boolean; data: { movedCount: number } }>(
        `/api/buckets/${bucketId}/move-to-backlog`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error moving bucket to backlog:', error);
      const errorMessage = error.response?.data?.error || 'Failed to move bucket to backlog';
      throw new Error(errorMessage);
    }
  }
}

export default BucketService;
