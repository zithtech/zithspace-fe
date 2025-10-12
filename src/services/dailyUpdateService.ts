import { api } from '@/lib/axios';
import {
  DailyStatusUpdate,
  CreateDailyUpdateRequest,
  UpdateDailyUpdateRequest,
  DailyUpdateFilters,
  SubmissionStats,
  CheckTodayResponse,
} from '@/types/dailyUpdate';

export class DailyUpdateService {
  /**
   * Create a new daily status update
   */
  static async createUpdate(data: CreateDailyUpdateRequest): Promise<DailyStatusUpdate> {
    const response = await api.post('/api/daily-updates', data);
    return response.data.data;
  }

  /**
   * Get current user's daily updates
   */
  static async getMyUpdates(filters?: DailyUpdateFilters): Promise<DailyStatusUpdate[]> {
    const params = new URLSearchParams();
    
    if (filters?.date) params.append('date', filters.date);
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/api/daily-updates/my?${params.toString()}`);
    return response.data.data;
  }

  /**
   * Get team's daily updates (PM/Admin only)
   */
  static async getTeamUpdates(filters?: DailyUpdateFilters): Promise<DailyStatusUpdate[]> {
    const params = new URLSearchParams();
    
    if (filters?.date) params.append('date', filters.date);
    if (filters?.projectId) params.append('projectId', filters.projectId);
    if (filters?.userId) params.append('userId', filters.userId);

    const response = await api.get(`/api/daily-updates/team?${params.toString()}`);
    return response.data.data;
  }

  /**
   * Get today's updates (role-based)
   */
  static async getTodayUpdates(): Promise<DailyStatusUpdate[]> {
    const response = await api.get('/api/daily-updates/today');
    return response.data.data;
  }

  /**
   * Check if user has submitted update today
   */
  static async checkTodaySubmission(): Promise<CheckTodayResponse> {
    const response = await api.get('/api/daily-updates/check-today');
    return {
      submitted: response.data.submitted,
      data: response.data.data,
    };
  }

  /**
   * Get specific daily update by ID
   */
  static async getUpdateById(id: string): Promise<DailyStatusUpdate> {
    const response = await api.get(`/api/daily-updates/${id}`);
    return response.data.data;
  }

  /**
   * Update daily status update (same day only)
   */
  static async updateUpdate(
    id: string,
    data: UpdateDailyUpdateRequest
  ): Promise<DailyStatusUpdate> {
    const response = await api.put(`/api/daily-updates/${id}`, data);
    return response.data.data;
  }

  /**
   * Delete daily status update
   */
  static async deleteUpdate(id: string): Promise<void> {
    await api.delete(`/api/daily-updates/${id}`);
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

    const response = await api.get(`/api/daily-updates/stats/submission-rate?${params.toString()}`);
    return response.data.data;
  }
}

export default DailyUpdateService;
