
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
  approvedBy?:string;
  rows: TimesheetRow[];
  employeeName?: string; 
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
export const reviewTimesheet = async (
  id: string,
   status: "APPROVED" | "REJECTED",
  // reason?: string
   rejectReason?: string // <- rename this
) => {
  return api.post(`/api/timesheets/${id}/review`, {
    status,  
    // reason,
    rejectReason,
  });
};


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
  static async getMeta() { 
    const res = await api.get("/api/timesheets/meta"); 
    console.log("SERVICE RES:", res);
    return res;
}
static async submitTimesheet(id: string): Promise<Timesheet> {
  const response = await api.post(`/api/timesheets/${id}/submit`);
  return response.data; // ⭐ MUST
}

 catch (error: any) {
    if (error.response) {
      // Handle API errors
      const message = error.response.data?.message || 'Failed to submit timesheet';
      throw new Error(message);
    }
    throw new Error('Network error occurred while submitting timesheet');
  }
}

