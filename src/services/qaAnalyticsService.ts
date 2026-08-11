import { apiClient } from "@/lib/axios";

/**
 * QA Space — Reporting & Analytics.
 *
 * Everything is derived server-side from the execution record, the bug list and
 * the submission trail. The same four filters apply to every report, so a
 * number can be followed from one tab to the next without the basis changing.
 */

const BASE = "/api/v2/qa/analytics";

export interface AnalyticsFilters {
  from?: string;
  to?: string;
  ownerId?: string;
  release?: string;
  scopeId?: string;
  runId?: string;
}

/** Outcome tallies every breakdown row carries. */
export interface Outcome {
  total: number;
  executed: number;
  passed: number;
  failed: number;
  blocked: number;
  not_executed: number;
  runs: number;
  cases: number;
  bugs_linked: number;
  pass_rate: number;
  execution_rate: number;
}

export interface Overview {
  execution: Outcome;
  defects: {
    total: number;
    open: number;
    resolved: number;
    reopened: number;
    critical: number;
    criticalOpen: number;
    tickets: number;
    /** Defects per 100 executed cases — comparable across scopes of any size. */
    density: number;
    reopenRate: number;
    ticketConversion: number;
  };
  scopes: { total: number; approved: number; active: number };
  submissions: {
    total: number;
    awaitingApproval: number;
    approved: number;
    sentBack: number;
    /** Share of submissions that needed a second pass. */
    reworkRate: number;
    avgDaysToSignoff: number | null;
  };
}

export interface TrendPoint extends Outcome {
  bucket: string;
  bugsFound: number;
  bugsResolved: number;
}

export interface BreakdownRow extends Outcome {
  key: string;
  label: string;
  scope_status?: string | null;
  scope_owner?: string | null;
  end_date?: string | null;
  suite_name?: string | null;
  scope_name?: string | null;
  ran_at?: string | null;
  executed_by?: string | null;
}

export type BreakdownDimension = "owner" | "release" | "scope" | "run";

export interface DefectAnalytics {
  bySeverity: Array<{ key: string; total: number; open: number }>;
  byStatus: Array<{ key: string; total: number }>;
  byModule: Array<{ key: string; total: number; open: number; critical: number }>;
  ageing: { d0_2: number; d3_7: number; d8_30: number; d30_plus: number; avgAgeDays: number };
}

export interface CoverageAnalytics {
  byAutomation: Array<{ key: string; total: number }>;
  byTestType: Array<{ key: string; total: number }>;
  byPriority: Array<{ key: string; total: number }>;
  gaps: {
    totalCases: number;
    neverRun: number;
    coverage: number;
    notInSuite: number;
    suitesNeverRun: number;
    runsWithoutScope: number;
  };
}

export interface QualitySignals {
  firstPassYield: { attempts: number; passed: number; rate: number; retried: number };
  /** Cases that have both passed and failed — unreliable test or unreliable feature. */
  flakyCases: Array<{
    test_case_id: string;
    case_ref: string;
    case_name: string;
    passes: number;
    fails: number;
    attempts: number;
  }>;
  scopesAtRisk: Array<{
    id: string;
    name: string;
    status: string;
    qa_owner: string | null;
    end_date: string;
    total: number;
    executed: number;
    progress: number;
    daysOverdue: number;
  }>;
}

export interface FilterOptions {
  owners: Array<{ id: string; label: string }>;
  releases: string[];
  scopes: Array<{ id: string; label: string; status: string; qa_owner: string | null }>;
  runs: Array<{ id: string; label: string }>;
}

class QaAnalyticsService {
  static async getFilters(): Promise<FilterOptions> {
    const res = await apiClient.get<{ success: boolean; data: FilterOptions }>(`${BASE}/filters`);
    return res.data.data;
  }

  static async getOverview(f: AnalyticsFilters): Promise<Overview> {
    const res = await apiClient.get<{ success: boolean; data: Overview }>(`${BASE}/overview`, { params: f });
    return res.data.data;
  }

  static async getTrends(
    f: AnalyticsFilters,
    granularity: "day" | "week" | "month" = "week",
  ): Promise<TrendPoint[]> {
    const res = await apiClient.get<{ success: boolean; data: TrendPoint[] }>(`${BASE}/trends`, {
      params: { ...f, granularity },
    });
    return res.data.data;
  }

  static async getBreakdown(f: AnalyticsFilters, by: BreakdownDimension): Promise<BreakdownRow[]> {
    const res = await apiClient.get<{ success: boolean; data: BreakdownRow[] }>(`${BASE}/breakdown`, {
      params: { ...f, by },
    });
    return res.data.data;
  }

  static async getDefects(f: AnalyticsFilters): Promise<DefectAnalytics> {
    const res = await apiClient.get<{ success: boolean; data: DefectAnalytics }>(`${BASE}/defects`, { params: f });
    return res.data.data;
  }

  static async getCoverage(): Promise<CoverageAnalytics> {
    const res = await apiClient.get<{ success: boolean; data: CoverageAnalytics }>(`${BASE}/coverage`);
    return res.data.data;
  }

  static async getQuality(f: AnalyticsFilters): Promise<QualitySignals> {
    const res = await apiClient.get<{ success: boolean; data: QualitySignals }>(`${BASE}/quality`, { params: f });
    return res.data.data;
  }
}

export default QaAnalyticsService;
