import { api, ApiError, apiUtils, PaginatedResponse } from "@/lib/axios";

/** Geolocation captured when a session was started (clock-in / resume). */
export interface SessionLocation {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  address?: string | null;
}

/** A single work session within a day (one clock-in → clock-out period). */
export interface AttendanceSession {
  id: string | null;
  clockIn: string;
  clockOut?: string | null;
  workMinutes: number;
  /** The break that follows this session (set when the user paused). */
  breakType?: string | null;
  breakReason?: string | null;
  /** Where this session was started, if the device shared its location. */
  location?: SessionLocation | null;
  isOpen?: boolean;
}

export interface PausePayload {
  breakType?: string;
  reason?: string;
}

/**
 * One WORK interval sent to the API when saving a full day's timeline, optionally
 * carrying the break that FOLLOWS it. Day clock-in/out are derived from the
 * first/last interval server-side.
 */
export interface AttendanceSessionInput {
  clockIn: string;
  clockOut: string;
  breakType?: string | null;
  breakReason?: string | null;
}

export interface Attendance {
  id: string;
  userId: {
    id: string;
    name: string;
    position: string;
    avatarUrl?: string | null;
  };
  date: string;
  clockIn?: string;
  clockOut?: string;
  status: "present" | "absent" | "late" | "half-day" | "wfh";
  workingMinutes?: number;
  totalWorkMinutes?: number;
  effectiveWorkMinutes?: number;
  totalBreakMinutes?: number;
  overtimeMinutes?: number;
  lateMinutes?: number;
  shift?: {
    id: string;
    name: string;
    code: string;
    startTime: string;
    endTime: string;
  };
  sessions?: AttendanceSession[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClockInData {
  notes?: string;
  /** Device geolocation captured at clock-in (best-effort). */
  latitude?: number;
  longitude?: number;
  accuracy?: number;
}

export interface ClockOutData {
  notes?: string;
}

export interface AttendanceFilters {
  page?: number;
  limit?: number;
  userId?: string;
  member?: string; // Alias for userId (used by frontend)
  date?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  search?: string; // Search by member name
  projectId?: string;
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

export type AttendanceState = "not_started" | "working" | "paused" | "complete";

export interface TodayAttendance {
  id: string | null;
  userId: string;
  date: string;
  clockIn?: string | null;
  clockOut?: string | null;
  status: string;
  canClockIn: boolean;
  canClockOut: boolean;
  clockInTime?: string | null;
  clockOutTime?: string | null;
  totalWorkMinutes?: number;
  isClockIn?: boolean;
  // Multi-session fields
  state?: AttendanceState;
  onBreak?: boolean;
  breakMinutes?: number;
  breakType?: string | null;
  breakReason?: string | null;
  sessionCount?: number;
  canPause?: boolean;
  canResume?: boolean;
  canComplete?: boolean;
  sessions?: AttendanceSession[];
  member?: { id: string; name: string; avatarUrl?: string | null } | null;
}

export class AttendanceService {
  /**
   * Get attendance records with pagination and filters
   */
  static async getAttendance(
    filters: AttendanceFilters = {},
  ): Promise<PaginatedResponse<Attendance>> {
    try {
      return await apiUtils.getPaginated<Attendance>(
        "/api/attendance",
        filters,
      );
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error("Failed to fetch attendance records");
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
        throw error;
      }
      throw new Error("Failed to fetch attendance record");
    }
  }

  /**
   * Clock in for today
   */
  static async clockIn(data: ClockInData = {}): Promise<TodayAttendance> {
    try {
      return await api.post<TodayAttendance>("/api/attendance/clock-in", data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error("Failed to clock in");
    }
  }

  /**
   * Clock out for today
   */
  static async clockOut(data: ClockOutData = {}): Promise<TodayAttendance> {
    try {
      return await api.post<TodayAttendance>("/api/attendance/clock-out", data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error("Failed to clock out");
    }
  }

  /**
   * Pause the day — closes the current open work session (a break begins).
   * Accepts an optional break type + reason.
   */
  static async pause(data: PausePayload = {}): Promise<TodayAttendance> {
    try {
      return await api.post<TodayAttendance>("/api/attendance/pause", data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error("Failed to pause");
    }
  }

  /**
   * Resume the day — opens a new work session after a break
   */
  static async resume(
    data: ClockInData & { resumeTimers?: boolean } = {},
  ): Promise<TodayAttendance> {
    try {
      return await api.post<TodayAttendance>("/api/attendance/resume", data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error("Failed to resume");
    }
  }

  /**
   * Complete the day — closes any open session and finalizes totals
   */
  static async complete(data: ClockOutData = {}): Promise<TodayAttendance> {
    try {
      return await api.post<TodayAttendance>("/api/attendance/complete", data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error("Failed to complete the day");
    }
  }

  /**
   * Get today's attendance for current user
   */
  static async getTodayAttendance(): Promise<TodayAttendance> {
    try {
      return await api.get<TodayAttendance>("/api/attendance/today");
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error("Failed to fetch today's attendance");
    }
  }

  /**
   * Get attendance summary for current user
   */
  static async getMySummary(
    startDate?: string,
    endDate?: string,
  ): Promise<AttendanceSummary> {
    try {
      const params: Record<string, any> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const queryString = apiUtils.buildQueryString(params);
      const url = queryString
        ? `/api/attendance/my-summary?${queryString}`
        : "/api/attendance/my-summary";

      return await api.get<AttendanceSummary>(url);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error("Failed to fetch attendance summary");
    }
  }

  /**
   * Get dashboard summary (admin only)
   */
  static async getDashboardSummary(
    startDate?: string,
    endDate?: string,
  ): Promise<DashboardSummary> {
    try {
      const params: Record<string, any> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const queryString = apiUtils.buildQueryString(params);
      const url = queryString
        ? `/api/attendance/dashboard/summary?${queryString}`
        : "/api/attendance/dashboard/summary";

      return await api.get<DashboardSummary>(url);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error("Failed to fetch dashboard summary");
    }
  }

  /**
   * Get present members for today (admin only)
   */
  static async getPresentMembers(
    startDate?: string,
    endDate?: string,
  ): Promise<
    Array<{
      id: string;
      name: string;
      position: string;
      clockIn: string;
      clockOut?: string;
      status: string;
    }>
  > {
    try {
      const params: Record<string, any> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const queryString = apiUtils.buildQueryString(params);
      const url = queryString
        ? `/api/attendance/dashboard/present?${queryString}`
        : "/api/attendance/dashboard/present";

      return await api.get(url);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error("Failed to fetch present members");
    }
  }
  // last 5 days working hors

  static async getLast5DaysAverage() {
    return await api.get("/api/attendance/last-5-average");
  }

  /**
   * Update attendance record (admin only)
   */
  static async updateAttendance(
    id: string,
    data: {
      clockIn?: string;
      clockOut?: string;
      status?: string;
      notes?: string;
      sessions?: AttendanceSessionInput[];
    },
  ): Promise<Attendance> {
    try {
      return await api.put<Attendance>(`/api/attendance/${id}`, data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error("Failed to update attendance record");
    }
  }

  /**
   * Create attendance record (admin only)
   */
  static async createAttendance(data: {
    userId: string;
    date: string;
    clockIn?: string;
    clockOut?: string;
    status: string;
    notes?: string;
    sessions?: AttendanceSessionInput[];
  }): Promise<Attendance> {
    try {
      return await api.post<Attendance>("/api/attendance", data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error("Failed to create attendance record");
    }
  }

  /**
   * Reopen an accidentally-completed day (manager action). `resumeAt` is the ISO
   * time work should resume from — the day flips back to "working".
   */
  static async reopenDay(id: string, resumeAt: string): Promise<TodayAttendance> {
    try {
      return await api.post<TodayAttendance>(`/api/attendance/${id}/reopen`, { resumeAt });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error("Failed to reopen day");
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
        throw error;
      }
      throw new Error("Failed to delete attendance record");
    }
  }
}
