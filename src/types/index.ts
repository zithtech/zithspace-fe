export interface User {
  id: string;
  name: string;
  phone: string;
  personalEmail: string;
  workEmail: string;
  role: string; // Flexible string instead of enum
  position: string; // Flexible string instead of enum
  reportsTo?: string | { id: string; name: string }; // Updated to use 'id' instead of 'id'
  password: string;
  dateOfBirth?: Date;
  assignedShift?: Shift | string;
  workDays: number[];
  shiftAssignedBy?: User | string;
  shiftAssignedDate?: Date;
  tenantId: string; // Add tenant context
  tenantName?: string; // Optional tenant name
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface CreateUserData {
  name: string;
  phone: string;
  personalEmail: string;
  workEmail: string;
  role: string; // Flexible string instead of enum
  position: string; // Flexible string instead of enum
  reportsTo?: string;
}

export interface UpdateUserData {
  name?: string;
  phone?: string;
  personalEmail?: string;
  workEmail?: string;
  role?: string; // Flexible string instead of enum
  position?: string; // Flexible string instead of enum
  reportsTo?: string;
  isActive?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  position?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Transaction interfaces
export interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  member: User | string;
  category: 'salary' | 'expense' | 'client_payment' | 'office_expense' | 'bonus' | 'investment' | 'refund' | 'other';
  description: string;
  notes?: string;
  date: Date;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: User | string;
  attachments?: string[];
  createdBy: User | string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTransactionData {
  type: 'credit' | 'debit';
  amount: number;
  member: string;
  category: 'salary' | 'expense' | 'client_payment' | 'office_expense' | 'bonus' | 'investment' | 'refund' | 'other';
  description: string;
  notes?: string;
  date: Date;
  attachments?: string[];
}

export interface UpdateTransactionData {
  type?: 'credit' | 'debit';
  amount?: number;
  member?: string;
  category?: 'salary' | 'expense' | 'client_payment' | 'office_expense' | 'bonus' | 'investment' | 'refund' | 'other';
  description?: string;
  notes?: string;
  date?: Date;
  status?: 'pending' | 'approved' | 'rejected';
  attachments?: string[];
}

export interface AccountBalance {
  credits: number;
  debits: number;
  balance: number;
}

export interface TransactionSummary {
  totalCredits: number;
  totalDebits: number;
  netBalance: number;
  transactionCount: number;
  categoryBreakdown: {
    category: string;
    credits: number;
    debits: number;
    total: number;
  }[];
}


// Attendance interfaces
export interface Shift {
  id: string;
  name: string;
  code: string;
  startTime: string; // "09:00"
  endTime: string; // "18:00"
  workingMinutes: number;
  graceMinutes: number;
  lunchBreakMinutes: number;
  overtimeThreshold: number;
  isFlexible: boolean;
  flexibleStartRange?: number;
  flexibleEndRange?: number;
  isActive: boolean;
  isDefault: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceBreak {
  type: 'lunch' | 'tea' | 'other';
  startTime: Date;
  endTime?: Date;
  duration?: number; // in minutes
}

export interface Attendance {
  id: string;
  member: User | string;
  date: Date;
  clockIn?: Date;
  clockOut?: Date;
  breaks: AttendanceBreak[];
  totalWorkMinutes: number;
  totalBreakMinutes: number;
  effectiveWorkMinutes: number;
  overtimeMinutes: number;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'wfh';
  shift: Shift | string;
  isManualEntry: boolean;
  enteredBy?: User | string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceSettings {
  id: string;
  companyName: string;
  timezone: string;
  weekStartDay: number;
  workingDays: number[];
  defaultShift: Shift | string;
  defaultGraceMinutes: number;
  defaultLunchBreakMinutes: number;
  overtimeEnabled: boolean;
  overtimeMultiplier: number;
  maxOvertimePerDay: number;
  maxBreaksPerDay: number;
  maxBreakDuration: number;
  minWorkingMinutes: number;
  maxWorkingMinutes: number;
  allowWFH: boolean;
  allowBreakTracking: boolean;
  allowManualEntry: boolean;
  lastUpdatedBy: User | string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAttendanceData {
  member: string;
  date: Date;
  clockIn?: Date;
  clockOut?: Date;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'wfh';
  shift: string;
  notes?: string;
}

export interface UpdateAttendanceData {
  clockIn?: Date;
  clockOut?: Date;
  status?: 'present' | 'absent' | 'late' | 'half-day' | 'wfh';
  notes?: string;
}

export interface ClockInData {
  member: string;
  shift?: string;
  notes?: string;
}

export interface ClockOutData {
  attendanceId: string;
  notes?: string;
}

export interface BreakData {
  attendanceId: string;
  type: 'lunch' | 'tea' | 'other';
}

export interface AttendanceSummary {
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalWFH: number;
  totalWorkHours: number;
  totalOvertimeHours: number;
  attendancePercentage: number;
  punctualityPercentage: number;
}

export interface TodayAttendanceStatus {
  isClockIn: boolean;
  clockInTime?: Date;
  clockOutTime?: Date;
  currentBreak?: AttendanceBreak;
  totalWorkMinutes: number;
  totalBreakMinutes: number;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'wfh';
  shift?: Shift;
}

// Dashboard Analytics interfaces
export interface DashboardSummary {
  totalMembers: number;
  expectedToday: number;
  presentToday: number;
  absentToday: number;
  attendanceRate: number;
  lateToday: number;
  wfhToday: number;
}

export interface PresentEmployee {
  id: string;
  name: string;
  position: string;
  clockInTime: Date;
  shift: Shift;
  workHours: number;
  status: 'present' | 'late' | 'wfh';
}

export interface WorkHoursAnalytics {
  period: 'week' | 'month' | 'custom';
  startDate: Date;
  endDate: Date;
  totalWorkHours: number;
  averageWorkHours: number;
  totalOvertimeHours: number;
  attendanceRate: number;
  employeeStats: {
    employeeId: string;
    employeeName: string;
    totalHours: number;
    overtimeHours: number;
    attendanceDays: number;
    expectedDays: number;
  }[];
}

export interface AttendanceTrend {
  date: string;
  present: number;
  absent: number;
  late: number;
  wfh: number;
  total: number;
}

declare global {
  var mongoose: {
    conn: typeof import('mongoose') | null;
    promise: Promise<typeof import('mongoose')> | null;
  };
}
