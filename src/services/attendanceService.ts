import { AttendanceSession } from '@/app/attendance/page';
import { api, ApiError, apiUtils, PaginatedResponse } from '@/lib/axios';

export interface Attendance {
  id: string;
  userId: {
    id: string;
    name: string;
    position: string;
  };
  date: string;
  clockIn?: string;
  clockOut?: string;
  status: 'present' | 'absent' | 'late' | 'half-day';
  workingMinutes?: number;
  overtimeMinutes?: number;
  lateMinutes?: number;
  shift?: {
    id: string;
    name: string;
    code: string;
    startTime: string;
    endTime: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
  sessions:AttendanceSession[]
}

export interface ClockInData {
  notes?: string;
}

export interface ClockOutData {
  notes?: string;
}

export interface AttendanceFilters {
  page?: number;
  limit?: number;
  userId?: string;
  member?: string;  // Alias for userId (used by frontend)
  date?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  search?: string;  // Search by member name
}

export interface AttendanceSummary {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  halfDays: number;
  totalWorkingMinutes: number;
  totalOvertimeMinutes: number;
  averageWorkingHours: number;
}

export interface DashboardSummary {
  totalMembers: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  onTimeToday: number;
}

export interface TodayAttendance {
  id: string;
  userId: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  status: string;
  canClockIn: boolean;
  canClockOut: boolean;
}

export class AttendanceService {
  /**
   * Get attendance records with pagination and filters
   */
  static async getAttendance(filters: AttendanceFilters = {}): Promise<PaginatedResponse<Attendance>> {
    try {
      return await apiUtils.getPaginated<Attendance>('/api/attendance', filters);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to fetch attendance records');
    }
  }

  /**
   * Get a single attendance record by ID
   */
  static async getAttendanceById(id: string): Promise<Attendance> {
    try {
      return await api.get<Attendance>(`/api/attendance/${id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to fetch attendance record');
    }
  }

  /**
   * Clock in for today
   */
  static async clockIn(data: ClockInData = {}): Promise<Attendance> {
    try {
      return await api.post<Attendance>('/api/attendance/clock-in', data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to clock in');
    }
  }

  /**
   * Clock out for today
   */
  static async clockOut(data: ClockOutData = {}): Promise<Attendance> {
    try {
      return await api.post<Attendance>('/api/attendance/clock-out', data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to clock out');
    }
  }

  /**
   * Get today's attendance for current user
   */
  static async getTodayAttendance(): Promise<TodayAttendance> {
    try {
      return await api.get<TodayAttendance>('/api/attendance/today');
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to fetch today\'s attendance');
    }
  }

  /**
   * Get attendance summary for current user
   */
  static async getMySummary(startDate?: string, endDate?: string): Promise<AttendanceSummary> {
    try {
      const params: Record<string, any> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const queryString = apiUtils.buildQueryString(params);
      const url = queryString ? `/api/attendance/my-summary?${queryString}` : '/api/attendance/my-summary';
      
      return await api.get<AttendanceSummary>(url);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to fetch attendance summary');
    }
  }

  /**
   * Get dashboard summary (admin only)
   */
  static async getDashboardSummary(): Promise<DashboardSummary> {
    try {
      return await api.get<DashboardSummary>('/api/attendance/dashboard/summary');
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to fetch dashboard summary');
    }
  }

  /**
   * Get present members for today (admin only)
   */
  static async getPresentMembers(): Promise<Array<{
    id: string;
    name: string;
    position: string;
    clockIn: string;
    clockOut?: string;
    status: string;
  }>> {
    try {
      return await api.get('/api/attendance/dashboard/present');
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to fetch present members');
    }
  }

  /**
   * Update attendance record (admin only)
   */
  static async updateAttendance(id: string, data: {
    clockIn?: string;
    clockOut?: string;
    status?: string;
    notes?: string;
  }): Promise<Attendance> {
    try {
      return await api.put<Attendance>(`/api/attendance/${id}`, data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to update attendance record');
    }
  }

  /**
   * Delete attendance record (admin only)
   */
  static async deleteAttendance(id: string): Promise<void> {
    try {
      await api.delete(`/api/attendance/${id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to delete attendance record');
    }
  }
}
