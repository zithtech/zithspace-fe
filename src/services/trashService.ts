import { apiClient } from '@/lib/axios';

/**
 * Trash Service
 * 
 * Handles all API calls related to trash/recycle bin management.
 * Implements soft delete pattern with 7-day retention before auto-purge.
 */

// ==================== Type Definitions ====================

export interface TrashTicket {
  id: string;
  ticketNumber: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  type: string;
  platform?: string;
  storyPoint?: number;
  assignee?: {
    id: string;
    name: string;
    workEmail: string;
  };
  project: {
    id: string;
    name: string;
    code: string;
  };
  deletedAt: string;
  deletedBy: {
    id: string;
    name: string;
    workEmail: string;
  };
  createdAt: string;
  updatedAt: string;
  daysUntilPurge?: number;
}

export interface TrashListResponse {
  success: boolean;
  data: {
    tickets: TrashTicket[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    summary: {
      total: number;
      expiringSoon: number; // tickets expiring in < 2 days
    };
  };
  message?: string;
}

export interface TrashActionResponse {
  success: boolean;
  data?: any;
  message: string;
}

export interface EmptyTrashResult {
  deletedCount: number;
  commentsDeleted: number;
  attachmentsDeleted: number;
  linksDeleted: number;
  activityLogsDeleted: number;
}

// ==================== Trash Service Class ====================

class TrashService {
  /**
   * Get all trash tickets with pagination
   * Only shows tickets deleted within the last 7 days
   * 
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 20)
   * @param projectId - Optional filter by project
   * @param search - Optional search query
   * @returns Paginated list of soft-deleted tickets
   */
  static async getTrashTickets(params: {
    page?: number;
    limit?: number;
    projectId?: string;
    search?: string;
  } = {}): Promise<TrashListResponse['data']> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', (params.page || 1).toString());
      queryParams.append('limit', (params.limit || 20).toString());
      
      if (params.projectId) queryParams.append('projectId', params.projectId);
      if (params.search) queryParams.append('search', params.search);

      const response = await apiClient.get<TrashListResponse>(
        `/api/trash?${queryParams.toString()}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching trash tickets:', error);
      const errorMessage = error.response?.data?.error || 'Failed to fetch trash tickets';
      throw new Error(errorMessage);
    }
  }

  /**
   * Move ticket to trash (soft delete)
   * 
   * @param ticketId - Ticket ID to move to trash
   * @returns Updated ticket with isDeleted flag
   */
  static async moveToTrash(ticketId: string): Promise<TrashTicket> {
    try {
      const response = await apiClient.post<{ success: boolean; data: TrashTicket }>(
        `/api/trash/${ticketId}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error moving ticket to trash:', error);
      const errorMessage = error.response?.data?.error || 'Failed to move ticket to trash';
      throw new Error(errorMessage);
    }
  }

  /**
   * Restore ticket from trash (undo soft delete)
   * 
   * @param ticketId - Ticket ID to restore
   * @returns Restored ticket
   */
  static async restoreFromTrash(ticketId: string): Promise<any> {
    try {
      const response = await apiClient.post<{ success: boolean; data: any }>(
        `/api/trash/${ticketId}/restore`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error restoring ticket from trash:', error);
      const errorMessage = error.response?.data?.error || 'Failed to restore ticket';
      throw new Error(errorMessage);
    }
  }

  /**
   * Permanently delete ticket (hard delete)
   * This action cannot be undone
   * Requires admin permissions
   * 
   * @param ticketId - Ticket ID to permanently delete
   * @param force - Force deletion even if < 7 days old (admin only)
   */
  static async permanentlyDelete(ticketId: string, force: boolean = false): Promise<void> {
    try {
      const params = force ? '?force=true' : '';
      await apiClient.delete(`/api/trash/${ticketId}${params}`);
    } catch (error: any) {
      console.error('Error permanently deleting ticket:', error);
      const errorMessage = error.response?.data?.error || 'Failed to permanently delete ticket';
      throw new Error(errorMessage);
    }
  }

  /**
   * Empty entire trash (bulk permanent deletion)
   * Requires admin permissions
   * 
   * @param force - Force deletion of all tickets regardless of age
   * @returns Statistics about deleted items
   */
  static async emptyTrash(force: boolean = false): Promise<EmptyTrashResult> {
    try {
      const response = await apiClient.post<{ success: boolean; data: EmptyTrashResult }>(
        '/api/trash/empty',
        { force }
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error emptying trash:', error);
      const errorMessage = error.response?.data?.error || 'Failed to empty trash';
      throw new Error(errorMessage);
    }
  }

  /**
   * Calculate days until ticket is auto-purged
   * 
   * @param deletedAt - Date when ticket was deleted
   * @returns Number of days remaining before auto-purge (0 if expired)
   */
  static calculateDaysUntilPurge(deletedAt: string): number {
    const deleted = new Date(deletedAt);
    const now = new Date();
    const diffMs = deleted.getTime() + (7 * 24 * 60 * 60 * 1000) - now.getTime();
    const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
    return Math.max(0, diffDays);
  }

  /**
   * Check if ticket is expiring soon (< 2 days until auto-purge)
   * 
   * @param deletedAt - Date when ticket was deleted
   * @returns True if ticket will be auto-purged in < 2 days
   */
  static isExpiringSoon(deletedAt: string): boolean {
    return this.calculateDaysUntilPurge(deletedAt) <= 2;
  }

  /**
   * Get trash ticket status color
   * 
   * @param deletedAt - Date when ticket was deleted
   * @returns Color code based on days until purge
   */
  static getTrashStatusColor(deletedAt: string): 'red' | 'orange' | 'default' {
    const days = this.calculateDaysUntilPurge(deletedAt);
    if (days <= 1) return 'red';
    if (days <= 2) return 'orange';
    return 'default';
  }

  /**
   * Format trash retention message
   * 
   * @param deletedAt - Date when ticket was deleted
   * @returns Human-readable message about retention
   */
  static getRetentionMessage(deletedAt: string): string {
    const days = this.calculateDaysUntilPurge(deletedAt);
    if (days === 0) return 'Will be permanently deleted today';
    if (days === 1) return 'Will be permanently deleted tomorrow';
    return `Will be permanently deleted in ${days} days`;
  }
}

export default TrashService;
