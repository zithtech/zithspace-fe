
import { api, ApiError, apiUtils, PaginatedResponse } from '@/lib/axios';
export interface TimesheetUser {
  id: string;
  name: string;
}

export interface TimesheetRow{
  id: string;
  day: string;
  projectName: string;
  taskName: string;
  taskId?: string;
  projectId?: string;
 
  description?: string;
  hours: number;
  billable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Timesheet {
  id: string;
  tenantId: string;
  userId: string;
  weekStart: string;
  weekEnd: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  totalHours: number;
  rejectReason?: string;
  approvedById?: string;
  rows: TimesheetRow[];
  user?: TimesheetUser;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTimesheetData {
  weekStart: Date;
  weekEnd: Date;
  rows: {
    day: Date;
    projectName: string;
    taskName: string;
    description?: string;
    hours: number;
    billable?: boolean;
  }[];
}

export interface UpdateTimesheetData extends Partial<CreateTimesheetData> {
  status?: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  rejectReason?: string;
}

export interface TimesheetFilters {
  page?: number;
  limit?: number;
  search?: string;
  userId?: string;
  status?: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  startDate?: string;
  endDate?: string;
}



export class TimesheetsService {
  /** Get paginated timesheets */
  static async getTimesheets(filters: TimesheetFilters = {}): Promise<PaginatedResponse<Timesheet>> {
    try {
      return await apiUtils.getPaginated<Timesheet>('/api/timesheets', filters);
    } catch (error) {
      if (error instanceof ApiError) throw new Error(error.message);
      throw new Error('Failed to fetch timesheets');
    }
  }

  /** Get timesheet by ID */
  static async getTimesheetById(id: string): Promise<Timesheet> {
    try {
      return await api.get<Timesheet>(`/api/timesheets/${id}`);
    } catch (error) {
      if (error instanceof ApiError) throw new Error(error.message);
      throw new Error('Failed to fetch timesheet');
    }
  }

  /** Create a new timesheet (status auto DRAFT) */
  static async createTimesheet(data: CreateTimesheetData): Promise<Timesheet> {
    try {
      return await api.post<Timesheet>('/api/timesheets', data);
    } catch (error) {
      if (error instanceof ApiError) throw new Error(error.message);
      throw new Error('Failed to create timesheet');
    }
  }

  /** Update an existing timesheet */
  static async updateTimesheet(id: string, data: UpdateTimesheetData): Promise<Timesheet> {
    try {
      return await api.put<Timesheet>(`/api/timesheets/${id}`, data);
    } catch (error) {
      if (error instanceof ApiError) throw new Error(error.message);
      throw new Error('Failed to update timesheet');
    }
  }

  /** Delete a timesheet */
  static async deleteTimesheet(id: string): Promise<void> {
    try {
      await api.delete(`/api/timesheets/${id}`);
    } catch (error) {
      if (error instanceof ApiError) throw new Error(error.message);
      throw new Error('Failed to delete timesheet');
    }
  }

  /** Approve or Reject a timesheet */
  static async approveTimesheet(id: string, status: 'APPROVED' | 'REJECTED', rejectReason?: string): Promise<Timesheet> {
    try {
      return await api.put<Timesheet>(`/api/timesheets/${id}/approve`, { status, rejectReason });
    } catch (error) {
      if (error instanceof ApiError) throw new Error(error.message);
      throw new Error('Failed to approve/reject timesheet');
    }
  }
  static async getMeta() { const res = await api.get("/api/timesheets/meta"); return res.data.data; }

  /** Submit a timesheet (changes DRAFT → SUBMITTED) */
static async submitTimesheet(id: string): Promise<Timesheet> {
  try {
    return await api.post<Timesheet>(`/api/timesheets/${id}/submit`);
  } catch (error) {
    if (error instanceof ApiError) throw new Error(error.message);
    throw new Error('Failed to submit timesheet');
  }
}

}

