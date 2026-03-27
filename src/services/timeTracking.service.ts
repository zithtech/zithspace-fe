import { api, ApiError } from '@/lib/axios';

export interface TimeTrackingEntry {
  id: string;
  projectId?: string;
  ticketId?: string;
  description?: string;
  billable: boolean;
  billingRate?: number;
  startTime: string;
  endTime?: string;
  duration?: number;
  status: "RUNNING" | "STOPPED" | "PAUSED" | "MANUAL_UPDATED";
  logs?: Array<{ id: string; action: string; createdAt: string }>;
  project?: { id: string; name: string; code?: string };
  ticket?: { id: string; title: string; ticketNumber?: string };
  user?: { id: string; name: string; workEmail: string };
  createdAt: string;
  updatedAt: string;
}

export class TimeTrackingService {
  static async getEntries(filters?: {
    ticketId?: string;
    projectId?: string;
    userId?: string;
    allUsers?: boolean;
    startDate?: string;
    endDate?: string;
  }): Promise<TimeTrackingEntry[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.ticketId) params.append('ticketId', filters.ticketId);
      if (filters?.projectId) params.append('projectId', filters.projectId);
      if (filters?.userId) params.append('userId', filters.userId);
      if (filters?.allUsers) params.append('allUsers', 'true');
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const query = params.toString() ? `?${params.toString()}` : '';
      const res = await api.get<TimeTrackingEntry[]>(`/api/time-tracking${query}`);
      return res;
    } catch (error) {
      if (error instanceof ApiError) throw new Error(error.message);
      throw new Error('Failed to fetch time entries');
    }
  }

  static async startTimer(data: Partial<TimeTrackingEntry>): Promise<TimeTrackingEntry> {
    try {
      const res = await api.post<TimeTrackingEntry>('/api/time-tracking/start', data);
      return res;
    } catch (error) {
      if (error instanceof ApiError) throw new Error(error.message);
      throw new Error('Failed to start timer');
    }
  }

  static async stopTimer(id: string): Promise<TimeTrackingEntry> {
    try {
      const res = await api.post<TimeTrackingEntry>(`/api/time-tracking/${id}/stop`);
      return res;
    } catch (error) {
      if (error instanceof ApiError) throw new Error(error.message);
      throw new Error('Failed to stop timer');
    }
  }

  static async pauseTimer(id: string): Promise<TimeTrackingEntry> {
    try {
      const res = await api.post<TimeTrackingEntry>(`/api/time-tracking/${id}/pause`);
      return res;
    } catch (error) {
      if (error instanceof ApiError) throw new Error(error.message);
      throw new Error('Failed to pause timer');
    }
  }

  static async resumeTimer(id: string): Promise<TimeTrackingEntry> {
    try {
      const res = await api.post<TimeTrackingEntry>(`/api/time-tracking/${id}/resume`);
      return res;
    } catch (error) {
      if (error instanceof ApiError) throw new Error(error.message);
      throw new Error('Failed to resume timer');
    }
  }

  static async updateEntry(id: string, data: Partial<TimeTrackingEntry>): Promise<TimeTrackingEntry> {
    try {
      const res = await api.put<TimeTrackingEntry>(`/api/time-tracking/${id}`, data);
      return res;
    } catch (error) {
      if (error instanceof ApiError) throw new Error(error.message);
      throw new Error('Failed to update entry');
    }
  }

  static async deleteEntry(id: string): Promise<void> {
    try {
      await api.delete(`/api/time-tracking/${id}`);
    } catch (error) {
      if (error instanceof ApiError) throw new Error(error.message);
      throw new Error('Failed to delete entry');
    }
  }

  static async addManualEntry(data: {
    userId?: string;
    projectId?: string;
    ticketId?: string;
    description?: string;
    startTime: string;
    endTime: string;
    billable?: boolean;
    billingRate?: number;
  }): Promise<TimeTrackingEntry> {
    try {
      const res = await api.post<TimeTrackingEntry>('/api/time-tracking/manual', data);
      return res;
    } catch (error) {
      if (error instanceof ApiError) throw new Error(error.message);
      throw new Error('Failed to add manual entry');
    }
  }
}
