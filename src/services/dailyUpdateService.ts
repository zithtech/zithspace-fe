import { api } from '@/lib/axios';
import {
  DailyStatusUpdate,
  CreateDailyUpdateRequest,
  UpdateDailyUpdateRequest,
  DailyUpdateFilters,
  SubmissionStats,
  CheckTodayResponse,
  WorkEntry,
} from '@/types/dailyUpdate';

export class DailyUpdateService {
  /**
   * Create a new daily status update
   */
  static async createUpdate(data: CreateDailyUpdateRequest): Promise<DailyStatusUpdate> {
    try {
      return await api.post('/api/daily-updates', data);
    } catch (error: any) {
      // Extract error message from different error types
      const errorMessage = 
        error?.message || 
        error?.response?.data?.error || 
        error?.response?.data?.message ||
        'Failed to create daily update';
      
      throw new Error(errorMessage);
    }
  }

  /** 
   * Get current user's daily updates
   */
  static async getMyUpdates(filters?: DailyUpdateFilters): Promise<DailyStatusUpdate[]> {
    const params = new URLSearchParams();
    
    if (filters?.date) params.append('date', filters.date);
    if (filters?.limit) params.append('limit', filters.limit.toString());

    return await api.get(`/api/daily-updates/my?${params.toString()}`);
  }

  /**
   * Get team's daily updates (PM/Admin only)
   */
  static async getTeamUpdates(filters?: DailyUpdateFilters): Promise<DailyStatusUpdate[]> {
    const params = new URLSearchParams();
    
    if (filters?.date) params.append('date', filters.date);
    if (filters?.projectId) params.append('projectId', filters.projectId);
    if (filters?.userId) params.append('userId', filters.userId);

    return await api.get(`/api/daily-updates/team?${params.toString()}`);
  }

  /**
   * Get today's updates (role-based)
   */
  static async getTodayUpdates(): Promise<DailyStatusUpdate[]> {
    return await api.get('/api/daily-updates/today');
  }

  /**
   * Check if user has submitted update today
   */
  static async checkTodaySubmission(): Promise<CheckTodayResponse> {
    return await api.get('/api/daily-updates/check-today');
  }

  /**
   * Get specific daily update by ID
   */
  static async getUpdateById(id: string): Promise<DailyStatusUpdate> {
    return await api.get(`/api/daily-updates/${id}`);
  }

  /**
   * Update daily status update (same day only)
   */
  static async updateUpdate(
    id: string,
    data: UpdateDailyUpdateRequest
  ): Promise<DailyStatusUpdate> {
    try {
      return await api.put(`/api/daily-updates/${id}`, data);
    } catch (error: any) {
      // Extract error message from different error types
      const errorMessage = 
        error?.message || 
        error?.response?.data?.error || 
        error?.response?.data?.message ||
        'Failed to update daily update';
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Delete daily status update
   */
  static async deleteUpdate(id: string): Promise<void> {
    try {
      await api.delete(`/api/daily-updates/${id}`);
    } catch (error: any) {
      // Extract error message from different error types
      const errorMessage = 
        error?.message || 
        error?.response?.data?.error || 
        error?.response?.data?.message ||
        'Failed to delete daily update';
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Get submission statistics (PM/Admin only)
   */
  static async getSubmissionStats(
    startDate?: string,
    endDate?: string,
    projectId?: string
  ): Promise<SubmissionStats> {
    const params = new URLSearchParams();
    
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (projectId) params.append('projectId', projectId);

    return await api.get(`/api/daily-updates/stats/submission-rate?${params.toString()}`);
  }
}

export default DailyUpdateService;
