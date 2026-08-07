import { apiClient } from '@/lib/axios';

// ── Performance Report frontend service ──────────────────────────────────────
// Talks to the raw-SQL backend module mounted at /api/performance-report.
// Every endpoint returns the platform envelope { success, data }.

const BASE = '/api/performance-report';

function unwrap<T>(data: any): T {
  return data?.data as T;
}

// The 5 core scoring modules. Keys must match the backend MODULE_KEYS.
export type ModuleKey =
  | 'attendance'
  | 'leaves'
  | 'time_tracking'
  | 'daily_updates'
  | 'tickets';

export interface ModuleSetting {
  id: string;
  tenantId: string;
  moduleKey: ModuleKey;
  isEnabled: boolean;
  weight: number;
  config: Record<string, unknown>;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PerfReportSettings {
  id: string;
  tenantId: string;
  autoGenerateEnabled: boolean;
  generationDay: 'last_day';
  generationTime: string;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  modules: ModuleSetting[];
}

export interface ModuleCatalogItem {
  moduleKey: ModuleKey;
  label: string;
}

export interface TicketStatusUsage {
  status: string;
  count: number;
}

export interface ReportMember {
  id: string;
  name: string;
  avatarUrl: string | null;
  workEmail: string | null;
  position: string | null;
  department: string | null;
  grade: string | null;
}

export interface MemberListResult {
  data: ReportMember[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** One Position / Department option for the directory filters (with member count). */
export interface MemberFilterOption {
  id: string;
  label: string;
  count: number;
}

export interface MemberFilterOptions {
  positions: MemberFilterOption[];
  departments: MemberFilterOption[];
}

export interface GeneratedReport {
  id: string;
  userId: string;
  userName: string | null;
  userAvatar: string | null;
  userPosition: string | null;
  userDepartment: string | null;
  userSubDepartment: string | null;
  periodKey: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number | null;
  ticketsScore: number | null;
  timeTrackingScore: number | null;
  dailyUpdatesScore: number | null;
  attendanceScore: number | null;
  leavesScore: number | null;
  summary: Record<string, unknown>;
  fileUrl: string;
  status: string;
  generatedBy: string | null;
  generatedAt: string;
}

export interface SaveGeneratedInput {
  userId: string;
  periodKey: string; // YYYY-MM
  periodStart: string; // YYYY-MM-DD
  periodEnd: string; // YYYY-MM-DD
  scores: {
    overall: number | null;
    tickets: number | null;
    timeTracking: number | null;
    dailyUpdates: number | null;
    attendance: number | null;
    leaves: number | null;
  };
  summary: Record<string, unknown>;
  pdfBase64: string;
}

// ── In-month report: tickets worked within a date range ──────────────────────
// Shape matches the project Timeline view so <TimelineTree /> can render it.
export interface ReportTicket {
  id: string;
  ticketNumber: string;
  title: string;
  status: string;
  priority: string | null;
  type: string | null;
  assigneeName: string | null;
  assigneeAvatar: string | null;
  startDate: string | null;
  endDate: string | null;
  dueDate: string | null;
  sprintName: string | null;
  estimateHours: number;
  trackedSeconds: number;
  /** First day of the month the work was logged in (drives month grouping). */
  timelineAnchor: string | null;
}

export interface TicketReportFilters {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  projectId?: string;
  memberId?: string;
}

export interface ReportLeave {
  id: string;
  userId: string;
  userName: string | null;
  leaveTypeName: string | null;
  fromDate: string;
  toDate: string;
  dayPortion: string;
  totalUnits: number;
  paidUnits: number;
  lopUnits: number;
  status: string;
  reason: string | null;
}

export interface LeaveReportFilters {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  memberId?: string;
}

// Payload sent on save (PUT /settings).
export interface SaveSettingsInput {
  autoGenerateEnabled: boolean;
  generationDay: 'last_day';
  generationTime: string;
  modules: Array<{
    moduleKey: ModuleKey;
    isEnabled: boolean;
    weight: number;
    config?: Record<string, unknown>;
  }>;
}

const PerformanceReportService = {
  /** Get the tenant's settings (backend seeds defaults on first read). */
  async getSettings(): Promise<PerfReportSettings> {
    const res = await apiClient.get(`${BASE}/settings`);
    return unwrap<PerfReportSettings>(res.data);
  },

  /** Static catalog of module keys + labels (for rendering). */
  async getCatalog(): Promise<ModuleCatalogItem[]> {
    const res = await apiClient.get(`${BASE}/settings/catalog`);
    return unwrap<ModuleCatalogItem[]>(res.data) ?? [];
  },

  /** Distinct ticket statuses in use (for the status-marks editor). */
  async getTicketStatuses(): Promise<TicketStatusUsage[]> {
    const res = await apiClient.get(`${BASE}/settings/ticket-statuses`);
    return unwrap<TicketStatusUsage[]>(res.data) ?? [];
  },

  /** Paginated member directory for the Reports landing grid. */
  async getMembers(params: {
    page?: number;
    limit?: number;
    search?: string;
    projectId?: string;
    positionId?: string;
    departmentId?: string;
  }): Promise<MemberListResult> {
    const res = await apiClient.get(`${BASE}/members`, {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 12,
        ...(params.search ? { search: params.search } : {}),
        ...(params.projectId ? { projectId: params.projectId } : {}),
        ...(params.positionId ? { positionId: params.positionId } : {}),
        ...(params.departmentId ? { departmentId: params.departmentId } : {}),
      },
    });
    return (
      unwrap<MemberListResult>(res.data) ?? {
        data: [],
        page: 1,
        limit: 12,
        total: 0,
        totalPages: 1,
      }
    );
  },

  /** Position + department options actually held by members (directory filters). */
  async getMemberFilterOptions(): Promise<MemberFilterOptions> {
    const res = await apiClient.get(`${BASE}/members/filters`);
    return unwrap<MemberFilterOptions>(res.data) ?? { positions: [], departments: [] };
  },

  /** Persist the full settings payload. */
  async saveSettings(input: SaveSettingsInput): Promise<PerfReportSettings> {
    const res = await apiClient.put(`${BASE}/settings`, input);
    return unwrap<PerfReportSettings>(res.data);
  },

  /** Tickets a member worked (logged time on) within the date range. */
  async getTicketReport(filters: TicketReportFilters): Promise<ReportTicket[]> {
    const res = await apiClient.get(`${BASE}/reports/tickets`, {
      params: {
        from: filters.from,
        to: filters.to,
        ...(filters.projectId ? { projectId: filters.projectId } : {}),
        ...(filters.memberId ? { memberId: filters.memberId } : {}),
      },
    });
    return unwrap<ReportTicket[]>(res.data) ?? [];
  },

  /** Save a generated monthly report (uploads the PDF to R2 + stores scores). */
  async saveGeneratedReport(input: SaveGeneratedInput): Promise<GeneratedReport> {
    const res = await apiClient.post(`${BASE}/generated`, input);
    return unwrap<GeneratedReport>(res.data);
  },

  /** List generated reports (optionally filtered by YYYY-MM period). */
  async getGeneratedReports(period?: string): Promise<{ reports: GeneratedReport[]; periods: string[] }> {
    const res = await apiClient.get(`${BASE}/generated`, {
      params: period ? { period } : undefined,
    });
    return unwrap<{ reports: GeneratedReport[]; periods: string[] }>(res.data) ?? { reports: [], periods: [] };
  },

  async deleteGeneratedReport(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/generated/${id}`);
  },

  /** The current user's own generated reports (My Reports). */
  async getMyGeneratedReports(): Promise<GeneratedReport[]> {
    const res = await apiClient.get(`${BASE}/generated/mine`);
    return unwrap<GeneratedReport[]>(res.data) ?? [];
  },

  /** Leave 2.0 requests overlapping the date range (optionally one member). */
  async getLeaveReport(filters: LeaveReportFilters): Promise<ReportLeave[]> {
    const res = await apiClient.get(`${BASE}/reports/leaves`, {
      params: {
        from: filters.from,
        to: filters.to,
        ...(filters.memberId ? { memberId: filters.memberId } : {}),
      },
    });
    return unwrap<ReportLeave[]>(res.data) ?? [];
  },
};

export default PerformanceReportService;
