// Daily Status Update Types

// ==========================================
// NEW: Work Entry Types
// ==========================================

export type WorkStatus = 
  | 'pending' 
  | 'in_progress' 
  | 'dev_complete' 
  | 'in_testing' 
  | 'pushed_to_staging' 
  | 'pushed_to_production';

export interface WorkEntry {
  id?: string;
  statusUpdateId?: string;
  projectId: string;
  projectName?: string;
  ticketId?: string;
  ticketNumber?: string;
  ticketTitle?: string;
  startTime: string;  // ISO datetime string
  endTime: string;    // ISO datetime string
  hoursWorked?: number;
  workSummary: string;
  status: WorkStatus;
  blockers?: string;
  notes?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// ==========================================
// LEGACY: Project Update Types (for backward compatibility)
// ==========================================

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

// ==========================================
// Status Update Types
// ==========================================

export interface DailyStatusUpdate {
  id: string;
  userId: string;
  tenantId: string;
  date: Date | string;
  
  // Support both new and old formats
  workEntries?: WorkEntry[];           // NEW format
  projectUpdates?: ProjectUpdate[];    // OLD format (for backward compatibility)
  
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
  workEntries: WorkEntry[];  // Changed from projectUpdates
}

export interface UpdateDailyUpdateRequest {
  mood?: 'happy' | 'neutral' | 'stressed' | 'blocked';
  workEntries?: WorkEntry[];  // Changed from projectUpdates
}

export interface DailyUpdateFilters {
  date?: string;
  projectId?: string;
  userId?: string;
  status?: WorkStatus;
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

// ==========================================
// Utility Functions
// ==========================================

/**
 * Calculate hours between two datetime strings
 */
export function calculateHours(startTime: string, endTime: string): number {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end.getTime() - start.getTime();
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimals
}

/**
 * Format decimal hours to "Xh Ym" format
 */
export function formatHours(decimalHours: number): string {
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);
  
  if (hours === 0) {
    return `${minutes}m`;
  }
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${minutes}m`;
}

/**
 * Check if two dates are on the same day
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

/**
 * Get status configuration (label, color, icon)
 */
export function getStatusConfig(status: WorkStatus): {
  label: string;
  color: string;
  icon: string;
} {
  const configs = {
    pending: {
      label: 'Pending',
      color: 'default',
      icon: '⏳'
    },
    in_progress: {
      label: 'In Progress',
      color: 'processing',
      icon: '⚙️'
    },
    dev_complete: {
      label: 'Dev Complete',
      color: 'success',
      icon: '✅'
    },
    in_testing: {
      label: 'In Testing',
      color: 'warning',
      icon: '🧪'
    },
    pushed_to_staging: {
      label: 'Pushed to Staging',
      color: 'cyan',
      icon: '🚀'
    },
    pushed_to_production: {
      label: 'Pushed to Production',
      color: 'purple',
      icon: '🎉'
    }
  };
  
  return configs[status] || configs.pending;
}
