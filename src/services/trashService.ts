import { apiClient } from '@/lib/axios';
import { Ticket, TicketListResponse } from './ticketService';

/**
 * Trash Service
 * 
 * Handles all API calls related to trash/soft-delete functionality.
 * Tickets in trash can be restored within 7 days before auto-purge.
 */

// ==================== Type Definitions ====================

export interface TrashTicket extends Ticket {
  deletedAt: string;
  deletedBy: {
    id: string;
    name: string;
    workEmail: string;
  };
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
      expiringSoon: number;
      projectCounts?: {
        projectId: string;
        count: number;
      }[];
      totalAllTrash?: number;
    };
  };
}

// ==================== Trash Service Class ====================

class TrashService {
  /**
   * Get all deleted tickets (trash) with pagination
   * Only returns tickets deleted within the last 7 days
   * 
   * @param params - Filter parameters
   * @returns Paginated list of deleted tickets
   */
  static async getTrashTickets(params: {
    page?: number;
    limit?: number;
    projectId?: string;
    search?: string;
    status?: string;
    deletedBy?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<TrashListResponse['data']> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await apiClient.get<TrashListResponse>(
        `/api/trash${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching trash tickets:', error);
      const errorMessage = error.response?.data?.error || 'Failed to fetch trash tickets';
      throw new Error(errorMessage);
    }
  }

  /**
   * Move ticket(s) to trash (soft delete)
   * 
   * @param ticketIds - Array of ticket IDs to move to trash
   * @returns Result with deleted count
   */
  static async moveToTrash(ticketIds: string[]): Promise<{ deletedCount: number }> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: { deletedCount: number };
        message: string;
      }>('/api/trash/move', { ticketIds });
      return response.data.data;
    } catch (error: any) {
      console.error('Error moving tickets to trash:', error);
      const errorMessage = error.response?.data?.error || 'Failed to move tickets to trash';
      throw new Error(errorMessage);
    }
  }

  /**
   * Restore ticket(s) from trash
   * 
   * @param ticketIds - Array of ticket IDs to restore
   * @returns Result with restored count
   */
  static async restoreFromTrash(ticketIds: string[]): Promise<{ restoredCount: number }> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: { restoredCount: number };
        message: string;
      }>('/api/trash/restore', { ticketIds });
      return response.data.data;
    } catch (error: any) {
      console.error('Error restoring tickets from trash:', error);
      const errorMessage = error.response?.data?.error || 'Failed to restore tickets';
      throw new Error(errorMessage);
    }
  }

  /**
   * Permanently delete ticket(s) from trash
   * This action cannot be undone
   * 
   * @param ticketIds - Array of ticket IDs to permanently delete
   * @returns Result with deleted count
   */
  static async permanentlyDelete(ticketIds: string[]): Promise<{ deletedCount: number }> {
    try {
      const response = await apiClient.delete<{
        success: boolean;
        data: { deletedCount: number };
        message: string;
      }>('/api/trash/permanent', { data: { ticketIds } });
      return response.data.data;
    } catch (error: any) {
      console.error('Error permanently deleting tickets:', error);
      const errorMessage = error.response?.data?.error || 'Failed to permanently delete tickets';
      throw new Error(errorMessage);
    }
  }

  /**
   * Empty trash - permanently delete all tickets in trash
   * Only deletes tickets older than 7 days unless force=true
   * 
   * @param projectId - Optional project filter
   * @param force - Force delete all tickets regardless of age
   * @returns Result with deleted count
   */
  static async emptyTrash(projectId?: string, force: boolean = false): Promise<{ deletedCount: number }> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: { deletedCount: number };
        message: string;
      }>('/api/trash/empty', { projectId, force });
      return response.data.data;
    } catch (error: any) {
      console.error('Error emptying trash:', error);
      const errorMessage = error.response?.data?.error || 'Failed to empty trash';
      throw new Error(errorMessage);
    }
  }
}

export default TrashService;
