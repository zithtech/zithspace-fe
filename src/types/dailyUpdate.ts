// Daily Status Update Types

// ==========================================
// NEW: Work Entry Types
// ==========================================

export type WorkStatus =
  | "pending"
  | "in_progress"
  | "dev_complete"
  | "in_testing"
  | "pushed_to_staging"
  | "pushed_to_production";

export interface WorkEntry {
  id?: string;
  statusUpdateId?: string;
  projectId: string;
  projectName?: string;
  ticketId?: string;
  ticketNumber?: string;
  ticketTitle?: string;
  startTime: string; // ISO datetime string
  endTime: string; // ISO datetime string
  hoursWorked?: number;
  workSummary: string;
  status: WorkStatus;
  blockers?: string;
  notes?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// ==========================================
// TASK TYPES (NEW)
// ==========================================

export interface Task {
  type: "ticket" | "manual";

  // If type === 'ticket'
  ticketId?: string;
  ticketNumber?: string;
  ticketTitle?: string;

  // If type === 'manual'
  description?: string;

  // Status per task (REQUIRED)
  status: WorkStatus;
}

// ==========================================
// PROJECT UPDATE TYPES (UPDATED)
// ==========================================

export interface ProjectUpdate {
  projectId: string;
  projectName: string;

  // Time tracking (REQUIRED)
  startTime: string; // ISO datetime
  endTime: string; // ISO datetime
  hoursWorked: number; // Auto-calculated

  // Work summary - array of tasks (REQUIRED - at least 1)
  tasks: Task[];

  // Optional fields (project-level)
  blockers?: string;
  notes?: string;
  imageAttachments?: string[];
  fileAttachments?: string[];

  // LEGACY fields (for backward compatibility - will be removed)
  completedTasks?: string[];
  plannedTasks?: string[];
  hoursSpent?: number;
  linkedTickets?: string[];
}

// ==========================================
// Status Update Types
// ==========================================

export interface DailyStatusUpdate {
  id: string;
  userId: string;
  tenantId: string;

  /** Actual work date (due date) */
  missed_updateAt?: Date | string;

  /** Whether this is a missed update */
  is_missed?: boolean;

  /** For backward compatibility */
  date: Date | string;

  workEntries?: WorkEntry[];
  projectUpdates?: ProjectUpdate[];

  mood?: "happy" | "neutral" | "stressed" | "blocked";
  totalHoursWorked?: number;
  generalNotes?: string;

  /** Submission time */
  submittedAt: Date | string;

  createdAt: Date | string;
  updatedAt: Date | string;

  /** Backend-calculated flag */
  editable?: boolean;
  project?: {
    id: string;
    name: string;
  };

  user?: {
    id: string;
    name: string;
    position: string;
    workEmail: string;
  };
}

export interface CreateDailyUpdateRequest {
  mood?: "happy" | "neutral" | "stressed" | "blocked";
  projectUpdates: ProjectUpdate[]; // Using new ProjectUpdate structure
  generalNotes?: string;
}

export interface UpdateDailyUpdateRequest {
  mood?: "happy" | "neutral" | "stressed" | "blocked";
  projectUpdates?: ProjectUpdate[]; // Using new ProjectUpdate structure
  generalNotes?: string;
}

export interface DailyUpdateFilters {
  date?: string; // Single date (backward compatible)
  startDate?: string; // Start date for range filter
  endDate?: string; // End date for range filter
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
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
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
      label: "Pending",
      color: "default",
      icon: "⏳",
    },
    in_progress: {
      label: "In Progress",
      color: "processing",
      icon: "⚙️",
    },
    dev_complete: {
      label: "Dev Complete",
      color: "success",
      icon: "✅",
    },
    in_testing: {
      label: "In Testing",
      color: "warning",
      icon: "🧪",
    },
    pushed_to_staging: {
      label: "Pushed to Staging",
      color: "cyan",
      icon: "🚀",
    },
    pushed_to_production: {
      label: "Pushed to Production",
      color: "purple",
      icon: "🎉",
    },
  };

  return configs[status] || configs.pending;
}
