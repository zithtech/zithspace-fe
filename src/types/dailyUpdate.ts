// Daily Status Update Types

export interface ProjectUpdate {
  projectId: string;
  projectName: string;
  completedTasks: string[];
  plannedTasks?: string[];
  blockers?: string[];
  hoursSpent?: number;
  notes?: string;
  linkedTickets?: string[];
}

export interface DailyStatusUpdate {
  id: string;
  userId: string;
  tenantId: string;
  date: Date | string;
  projectUpdates: ProjectUpdate[];
  mood?: 'happy' | 'neutral' | 'stressed' | 'blocked';
  totalHoursWorked?: number;
  generalNotes?: string;
  submittedAt: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  user?: {
    id: string;
    name: string;
    position: string;
    workEmail: string;
  };
}

export interface CreateDailyUpdateRequest {
  mood?: 'happy' | 'neutral' | 'stressed' | 'blocked';
  totalHoursWorked?: number;
  projectUpdates: ProjectUpdate[];
  generalNotes?: string;
}

export interface UpdateDailyUpdateRequest {
  mood?: 'happy' | 'neutral' | 'stressed' | 'blocked';
  totalHoursWorked?: number;
  projectUpdates?: ProjectUpdate[];
  generalNotes?: string;
}

export interface DailyUpdateFilters {
  date?: string;
  projectId?: string;
  userId?: string;
  limit?: number;
}

export interface SubmissionStats {
  totalSubmissions: number;
  uniqueUsers: number;
  totalUsers: number;
  submissionRate: number;
  avgHoursWorked: number;
  dateRange: {
    start: string;
    end: string;
  };
}

export interface CheckTodayResponse {
  submitted: boolean;
  data: DailyStatusUpdate | null;
}
