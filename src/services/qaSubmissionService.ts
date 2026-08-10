import { apiClient } from "@/lib/axios";

/**
 * QA Submissions — the reporting stage after Test Runs and the Bug List.
 *
 * Three ideas stay separate here, exactly as they do on the server:
 *   Submission   "QA finished this testing cycle; here are the current results."
 *   QA Sign-off  "Testing AND retesting are done; this is QA's recommendation."
 *   Approval     Business acceptance by the named approver (the submission's
 *                Reviewer), separate from QA's recommendation.
 *
 * Every execution figure is derived server-side from the linked test runs.
 * Nothing in this module sends a pass/fail count.
 */

const BASE = "/api/v2/qa/submissions";

export const SUBMISSION_STATUSES = [
  "Draft",
  "Submitted",
  "Under Review",
  "Retesting",
  "Ready for QA Sign-off",
  "QA Signed-off",
  "Approved",
  "Sent Back",
] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

/**
 * What the Approvals page treats as "reported and waiting on the approver".
 *
 * A Draft has nothing to accept yet; Approved is already accepted and now waits
 * on QA's closing sign-off; QA Signed-off is finished; Sent Back is with QA
 * again. None of the four belong in the queue, but each can still be asked for
 * explicitly through the sidebar.
 */
export const AWAITING_APPROVAL_STATUSES: SubmissionStatus[] = [
  "Submitted",
  "Under Review",
  "Retesting",
  "Ready for QA Sign-off",
];

export const SUBMISSION_TYPES = [
  "Testing Completion",
  "Regression Submission",
  "Retest Submission",
  "Release QA Submission",
  "Final QA Sign-off",
] as const;
export type SubmissionType = (typeof SUBMISSION_TYPES)[number];

export const RECOMMENDATIONS = [
  "Pass",
  "Pass with Known Issues",
  "Fail",
  "Blocked",
] as const;
export type QaRecommendation = (typeof RECOMMENDATIONS)[number];

export const RECOMMENDATION_HELP: Record<QaRecommendation, string> = {
  Pass: "All required testing completed and no blocking issues remain.",
  "Pass with Known Issues": "Testing completed, but known non-blocking issues remain.",
  Fail: "Testing completed but the scope does not meet the required quality criteria.",
  Blocked: "QA cannot complete testing because of unresolved dependencies or environment issues.",
};

export type RetestingStatus =
  | "Not Started"
  | "Retesting In Progress"
  | "Partially Retested"
  | "Retesting Completed";

export const ATTACHMENT_CATEGORIES = [
  "Test Evidence",
  "Screenshots",
  "Reports",
  "Documents",
  "Other",
] as const;
export type AttachmentCategory = (typeof ATTACHMENT_CATEGORIES)[number];

export interface ExecutionSummary {
  totalCases: number;
  executed: number;
  passed: number;
  failed: number;
  blocked: number;
  notExecuted: number;
  passRate: number;
  executionRate: number;
}

export interface BugSummary {
  total: number;
  open: number;
  resolved: number;
  reopened: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  criticalOpen: number;
  bySeverity: Record<string, number>;
}

export interface TicketSummary {
  list: Array<{ id: string; ticket_number?: string; title?: string; status?: string }>;
  bugsCreated: number;
  created: number;
  resolved: number;
  open: number;
}

export interface RetestSummary {
  failedInitially: number;
  retested: number;
  passedAfterRetest: number;
  stillFailed: number;
  status: RetestingStatus;
}

export interface SubmissionWarning {
  level: "critical" | "warning";
  code: string;
  message: string;
}

export interface LinkedRun {
  id: string;
  run_name: string;
  run_role: "initial" | "retest";
  run_status?: string | null;
  execution_type?: string | null;
  suite_id?: string | null;
  suite_name?: string | null;
  scope_id?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  total_cases: number;
  passed: number;
  failed: number;
  blocked: number;
  not_executed: number;
  execution_percentage: number;
}

/** A run offered in the picker, with the §9 duplicate-evidence signals. */
export interface SelectableRun extends LinkedRun {
  executed: number;
  /** No scope recorded on the run — offered anyway, flagged in the UI. */
  unattributed: boolean;
  /** Already linked to another live submission for the same scope. */
  already_submitted: boolean;
  used_by: string[];
  /** False when the run has no cases or nothing has been executed yet. */
  selectable: boolean;
}

export interface FailedCase {
  test_case_id: string;
  case_ref?: string | null;
  case_name?: string | null;
  severity?: string | null;
  priority?: string | null;
  run_id?: string | null;
  run_name?: string | null;
  notes?: string | null;
  bug_id?: string | null;
  bug_number?: string | null;
  bug_status_key?: string | null;
  bug_progress?: string | null;
  bug_sheet_id?: string | null;
  ticket_id?: string | null;
  ticket_number?: string | null;
  ticket_status?: string | null;
}

export interface SubmissionSummary {
  execution: ExecutionSummary;
  runs: LinkedRun[];
  bugs: BugSummary;
  bugList: any[];
  tickets: TicketSummary;
  failedCases: FailedCase[];
  retest: RetestSummary;
  warnings: SubmissionWarning[];
}

export interface KnownIssue {
  id: string;
  bug_id?: string | null;
  bug_number?: string | null;
  bug_title?: string | null;
  severity?: string | null;
  current_status?: string | null;
  business_impact?: string | null;
  workaround?: string | null;
  expected_resolution?: string | null;
  accepted_by?: string | null;
  comment?: string | null;
  position?: number;
}

export interface SubmissionAttachment {
  id: string;
  category: AttachmentCategory;
  kind: "file" | "link";
  name: string;
  url: string;
  file_type?: string | null;
  file_size?: number | null;
  uploaded_by_name?: string | null;
  created_at: string;
}

export interface SubmissionHistoryEntry {
  id: string;
  event_type: string;
  title: string;
  detail?: string | null;
  meta?: Record<string, any>;
  actor_id?: string | null;
  actor_name?: string | null;
  actor_avatar?: string | null;
  created_at: string;
}

export interface SubmissionVersion {
  version: number;
  note?: string | null;
  created_at: string;
  created_by_name?: string | null;
  execution?: ExecutionSummary | null;
}

/** A row in the QA Submissions list — counts already derived server-side. */
export interface SubmissionListItem {
  id: string;
  submission_name: string;
  scope_id: string;
  scope_name?: string | null;
  scope_type?: string | null;
  submission_type: SubmissionType;
  status: SubmissionStatus;
  retesting_status: RetestingStatus;
  qa_recommendation?: QaRecommendation | null;
  version: number;
  qa_owner_id?: string | null;
  qa_owner_name?: string | null;
  qa_owner_avatar?: string | null;
  run_count: number;
  total_cases: number;
  executed: number;
  passed: number;
  failed: number;
  blocked: number;
  not_executed: number;
  pass_rate: number;
  execution_rate: number;
  total_bugs: number;
  open_bugs: number;
  submitted_at?: string | null;
  signed_off_at?: string | null;
  approved_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubmissionDetail extends SubmissionListItem {
  description?: string | null;
  qa_summary?: string | null;
  recommendation_ack: boolean;
  recommendation_ack_note?: string | null;
  reviewer_id?: string | null;
  reviewer_name?: string | null;
  scope_status?: string | null;
  scope_priority?: string | null;
  scope_qa_owner?: string | null;
  scope_start_date?: string | null;
  scope_end_date?: string | null;
  scope_details?: any;
  submitted_by_name?: string | null;
  signed_off_by?: string | null;
  signed_off_by_name?: string | null;
  signoff_comment?: string | null;
  approved_by?: string | null;
  approved_by_name?: string | null;
  approver_comment?: string | null;
  sent_back_by_name?: string | null;
  sent_back_at?: string | null;
  sent_back_reason?: string | null;
  sent_back_stage?: "review" | "approver" | null;
  created_by_name?: string | null;
  /** Frozen at sign-off; falls back to the live figures before that (§24). */
  summary: SubmissionSummary;
  /** Always the current figures, so a signed-off record can show any drift. */
  liveSummary: SubmissionSummary;
  isSnapshot: boolean;
  knownIssues: KnownIssue[];
  attachments: SubmissionAttachment[];
  history: SubmissionHistoryEntry[];
  versions: SubmissionVersion[];
}

export interface SubmissionStats {
  total: number;
  draft: number;
  submitted: number;
  retesting: number;
  ready_for_signoff: number;
  qa_signed_off: number;
  approved: number;
  sent_back: number;
}

export interface SubmissionFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  scopeId?: string;
  qaOwnerId?: string;
  /** One status, or several comma-separated — the server accepts both. */
  status?: SubmissionStatus | string;
  recommendation?: QaRecommendation;
  from?: string;
  to?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export interface SaveSubmissionInput {
  submission_name?: string;
  scope_id?: string;
  submission_type?: SubmissionType;
  qa_owner_id?: string | null;
  reviewer_id?: string | null;
  description?: string | null;
  qa_summary?: string | null;
  qa_recommendation?: QaRecommendation | null;
  recommendation_ack?: boolean;
  recommendation_ack_note?: string | null;
  runs?: Array<{ runId: string; role?: "initial" | "retest" }>;
}

export interface SignoffPreview extends SubmissionSummary {
  submission_name: string;
  scope_name?: string | null;
  qa_recommendation?: QaRecommendation | null;
  qa_summary?: string | null;
  /** Everything still missing before sign-off is allowed. */
  blockers: string[];
  canSignOff: boolean;
}

class QaSubmissionService {
  // ─── Dashboard & list ──────────────────────────────────────────────
  static async getStats(): Promise<SubmissionStats> {
    const res = await apiClient.get<{ success: boolean; data: SubmissionStats }>(`${BASE}/stats`);
    return res.data.data;
  }

  static async list(filters: SubmissionFilters = {}): Promise<{
    data: SubmissionListItem[];
    pagination: { page: number; pageSize: number; total: number; totalPages: number };
  }> {
    const res = await apiClient.get<{
      success: boolean;
      data: SubmissionListItem[];
      pagination: { page: number; pageSize: number; total: number; totalPages: number };
    }>(BASE, { params: filters });
    return { data: res.data.data, pagination: res.data.pagination };
  }

  /** Test runs offered as evidence for a scope (§8, §9). */
  static async getScopeRuns(scopeId: string, excludeSubmissionId?: string): Promise<SelectableRun[]> {
    const res = await apiClient.get<{ success: boolean; data: SelectableRun[] }>(`${BASE}/scope-runs`, {
      params: { scopeId, excludeSubmissionId },
    });
    return res.data.data;
  }

  // ─── Record ────────────────────────────────────────────────────────
  static async get(id: string): Promise<SubmissionDetail> {
    const res = await apiClient.get<{ success: boolean; data: SubmissionDetail }>(`${BASE}/${id}`);
    return res.data.data;
  }

  static async create(input: SaveSubmissionInput): Promise<SubmissionDetail> {
    const res = await apiClient.post<{ success: boolean; data: SubmissionDetail }>(BASE, input);
    return res.data.data;
  }

  static async update(id: string, input: SaveSubmissionInput): Promise<SubmissionDetail> {
    const res = await apiClient.put<{ success: boolean; data: SubmissionDetail }>(`${BASE}/${id}`, input);
    return res.data.data;
  }

  static async remove(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/${id}`);
  }

  /** Test cases behind a result count, for the §11 click-through. */
  static async getCases(
    id: string,
    status: "Pass" | "Fail" | "Blocked" | "Not Executed",
  ): Promise<FailedCase[]> {
    const res = await apiClient.get<{ success: boolean; data: FailedCase[] }>(`${BASE}/${id}/cases`, {
      params: { status },
    });
    return res.data.data;
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────
  /** Report the current results. Valid with bugs still open (§22). */
  static async submit(id: string, note?: string): Promise<SubmissionDetail> {
    const res = await apiClient.post<{ success: boolean; data: SubmissionDetail }>(`${BASE}/${id}/submit`, {
      note,
    });
    return res.data.data;
  }

  static async changeStatus(
    id: string,
    status: SubmissionStatus,
    comment?: string,
  ): Promise<SubmissionDetail> {
    const res = await apiClient.post<{ success: boolean; data: SubmissionDetail }>(`${BASE}/${id}/status`, {
      status,
      comment,
    });
    return res.data.data;
  }

  /** The review screen shown before Confirm QA Sign-off (§23). */
  static async getSignoffPreview(id: string): Promise<SignoffPreview> {
    const res = await apiClient.get<{ success: boolean; data: SignoffPreview }>(`${BASE}/${id}/sign-off`);
    return res.data.data;
  }

  static async signOff(id: string, comment?: string): Promise<SubmissionDetail> {
    const res = await apiClient.post<{ success: boolean; data: SubmissionDetail }>(`${BASE}/${id}/sign-off`, {
      confirmed: true,
      comment,
    });
    return res.data.data;
  }

  static async approve(id: string, comment?: string): Promise<SubmissionDetail> {
    const res = await apiClient.post<{ success: boolean; data: SubmissionDetail }>(`${BASE}/${id}/approve`, {
      comment,
    });
    return res.data.data;
  }

  /** Always requires a reason (§26, §33.15). */
  static async sendBack(id: string, reason: string): Promise<SubmissionDetail> {
    const res = await apiClient.post<{ success: boolean; data: SubmissionDetail }>(`${BASE}/${id}/send-back`, {
      reason,
    });
    return res.data.data;
  }

  static async reopen(id: string, reason: string): Promise<SubmissionDetail> {
    const res = await apiClient.post<{ success: boolean; data: SubmissionDetail }>(`${BASE}/${id}/reopen`, {
      reason,
    });
    return res.data.data;
  }

  static async getVersion(id: string, version: number): Promise<{ version: number; snapshot: any; created_at: string }> {
    const res = await apiClient.get<{ success: boolean; data: any }>(`${BASE}/${id}/versions/${version}`);
    return res.data.data;
  }

  // ─── Known issues (§19) ────────────────────────────────────────────
  static async saveKnownIssue(id: string, issue: Partial<KnownIssue> & { issueId?: string }): Promise<KnownIssue> {
    const res = await apiClient.post<{ success: boolean; data: KnownIssue }>(`${BASE}/${id}/known-issues`, issue);
    return res.data.data;
  }

  static async deleteKnownIssue(id: string, issueId: string): Promise<void> {
    await apiClient.delete(`${BASE}/${id}/known-issues/${issueId}`);
  }

  // ─── Attachments (§20) ─────────────────────────────────────────────
  static async addAttachment(
    id: string,
    input: { category: AttachmentCategory; name?: string; base64?: string; fileName?: string; url?: string },
  ): Promise<SubmissionAttachment> {
    const res = await apiClient.post<{ success: boolean; data: SubmissionAttachment }>(
      `${BASE}/${id}/attachments`,
      input,
    );
    return res.data.data;
  }

  static async deleteAttachment(id: string, attachmentId: string): Promise<void> {
    await apiClient.delete(`${BASE}/${id}/attachments/${attachmentId}`);
  }

  // ─── AI (§18) ──────────────────────────────────────────────────────
  /** Drafts a summary from the submission's own figures — never auto-applied. */
  static async draftSummary(id: string, prompt?: string): Promise<string> {
    const res = await apiClient.post<{ success: boolean; data: { text: string } }>(
      `${BASE}/${id}/ai/summary`,
      { prompt },
    );
    return res.data.data.text;
  }

  // ─── Drawer lookups ────────────────────────────────────────────────
  /**
   * A linked run and its scope are only read when someone actually opens one,
   * so the submission page stays a single request. Both hit the owning module's
   * own endpoint rather than duplicating those queries here.
   */
  static async getRunDetail(
    runId: string,
    params: { page?: number; pageSize?: number; search?: string; status?: string } = {},
  ): Promise<any> {
    const res = await apiClient.get<{ success: boolean; data: any }>(`/api/v2/qa/runs/${runId}`, {
      params,
    });
    return res.data.data;
  }

  static async getScopeDetail(scopeId: string): Promise<any> {
    const res = await apiClient.get<{ success: boolean; data: any }>(
      `/api/v2/qa/test-scopes/${scopeId}`,
    );
    return res.data.data;
  }

  static async polishText(text: string): Promise<string> {
    const res = await apiClient.post<{ success: boolean; data: { text: string } }>(`${BASE}/ai/grammar`, {
      text,
    });
    return res.data.data.text;
  }
}

export default QaSubmissionService;
