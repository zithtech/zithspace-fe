import { apiClient } from '@/lib/axios';

// ── Opening Management frontend service ─────────────────────────────────────
// Talks to the raw-SQL backend module mounted at /api/v2/openings.
// Every endpoint returns the platform envelope { success, data }.
//
// This is the v2 module. The legacy `/api/opening-management` service
// (openingManagementService.ts) is left alone — the two run side by side.

const BASE = '/api/v2/openings';

function unwrap<T>(data: any): T {
  return data?.data as T;
}

// ── Enumerations (mirror the backend CHECK constraints) ─────────────────────

export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'internship' | 'freelance';
export type WorkMode = 'remote' | 'hybrid' | 'office';
export type SalaryPeriod = 'hourly' | 'monthly' | 'yearly';
export type OpeningPriority = 'low' | 'medium' | 'high' | 'critical';
export type HiringType = 'replacement' | 'new_position' | 'expansion' | 'backfill';
export type OpeningVisibility = 'internal_only' | 'external_only' | 'both';

export type OpeningStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'internal_posting'
  | 'external_posting'
  | 'in_progress'
  | 'on_hold'
  | 'filled'
  | 'cancelled'
  | 'closed';

export type HiringTeamMemberType =
  | 'hiring_manager'
  | 'technical_panel'
  | 'hr'
  | 'client_interviewer';

export type ApproverType = 'hiring_manager' | 'department_head' | 'role' | 'specific_user';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'skipped' | 'cancelled';

export type PostingType = 'internal' | 'external';
export type PostingStatus = 'active' | 'expired' | 'closed';

export type IntakeSource =
  | 'careers_page'
  | 'employee_referral'
  | 'internal_transfer'
  | 'internal_job_posting'
  | 'recruitment_agency'
  | 'linkedin'
  | 'naukri'
  | 'indeed'
  | 'manual_upload'
  | 'campus_hiring'
  | 'other';

export type ApplicationStage =
  | 'applied'
  | 'screening'
  | 'shortlisted'
  | 'interview'
  | 'offer'
  | 'hired'
  | 'rejected'
  | 'withdrawn'
  | 'on_hold';

export type ClosureReason =
  | 'position_filled'
  | 'cancelled'
  | 'budget_issue'
  | 'client_cancelled'
  | 'duplicate_opening';

// ── Core types ──────────────────────────────────────────────────────────────

export interface OpeningRecruiter {
  id: string;
  openingId: string;
  recruiterId: string;
  recruiterName: string | null;
  recruiterEmail: string | null;
  isPrimary: boolean;
  assignedAt: string;
}

export interface HiringTeamMember {
  id: string;
  openingId: string;
  memberType: HiringTeamMemberType;
  memberId: string | null;
  memberName: string | null;
  memberEmail: string | null;
}

export interface RequiredDocument {
  id: string;
  openingId: string;
  documentName: string;
  isMandatory: boolean;
  notes: string | null;
}

export interface Opening {
  id: string;
  openingCode: string;

  clientId: string | null;
  projectId: string | null;
  departmentId: string | null;
  subDepartmentId: string | null;
  hiringManagerId: string | null;
  employmentTypeId: string | null;
  employmentType: EmploymentType;
  workMode: WorkMode;
  locationId: string | null;
  location: string | null;
  numberOfPositions: number;

  jobTitle: string;
  jobDescription: string | null;
  responsibilities: string | null;
  requiredSkills: string[];
  preferredSkills: string[];
  minExperience: number | null;
  maxExperience: number | null;
  education: string | null;
  certifications: string[];
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  salaryPeriod: SalaryPeriod;
  budget: number | null;
  noticePeriodDays: number | null;
  shiftTiming: string | null;
  joiningTimeline: string | null;
  targetJoiningDate: string | null;

  priority: OpeningPriority;
  hiringType: HiringType | null;
  visibility: OpeningVisibility;

  status: OpeningStatus;
  statusReason: string | null;
  statusNote: string | null;
  statusChangedAt: string | null;
  closedAt: string | null;

  closureReason: ClosureReason | null;
  closureNote: string | null;
  duplicateOfOpeningId: string | null;
  isArchived: boolean;
  archivedAt: string | null;

  approvalRound: number;
  submittedAt: string | null;
  approvedAt: string | null;

  internalPostingEndsAt?: string | null;
  postedInternallyAt?: string | null;
  postedExternallyAt?: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface OpeningWithRefs extends Opening {
  clientName: string | null;
  projectName: string | null;
  departmentName: string | null;
  subDepartmentName: string | null;
  hiringManagerName: string | null;
  employmentTypeName: string | null;
}

export interface OpeningListItem extends OpeningWithRefs {
  recruiters: OpeningRecruiter[];
}

export interface OpeningDetail extends OpeningWithRefs {
  recruiters: OpeningRecruiter[];
  hiringTeam: HiringTeamMember[];
  requiredDocuments: RequiredDocument[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface RecruiterInput {
  recruiterId: string;
  isPrimary?: boolean;
}

export interface HiringTeamMemberInput {
  memberType: HiringTeamMemberType;
  memberId?: string | null;
  memberName?: string | null;
  memberEmail?: string | null;
}

export interface RequiredDocumentInput {
  documentName: string;
  isMandatory?: boolean;
  notes?: string | null;
}

export interface CreateOpeningInput {
  clientId?: string | null;
  projectId?: string | null;
  departmentId?: string | null;
  subDepartmentId?: string | null;
  hiringManagerId?: string | null;
  employmentTypeId?: string | null;
  employmentType: EmploymentType;
  workMode: WorkMode;
  locationId?: string | null;
  location?: string | null;
  numberOfPositions?: number;

  jobTitle: string;
  jobDescription?: string | null;
  responsibilities?: string | null;
  requiredSkills?: string[];
  preferredSkills?: string[];
  minExperience?: number | null;
  maxExperience?: number | null;
  education?: string | null;
  certifications?: string[];
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string;
  salaryPeriod?: SalaryPeriod;
  budget?: number | null;
  noticePeriodDays?: number | null;
  shiftTiming?: string | null;
  joiningTimeline?: string | null;
  targetJoiningDate?: string | null;

  priority?: OpeningPriority;
  hiringType?: HiringType | null;
  visibility?: OpeningVisibility;

  recruiters?: RecruiterInput[];
  hiringTeam?: HiringTeamMemberInput[];
  requiredDocuments?: RequiredDocumentInput[];
}

export type UpdateOpeningInput = Partial<CreateOpeningInput>;

export interface ListOpeningsQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  /** Comma-separated on the wire; pass arrays and they are joined. */
  status?: OpeningStatus[];
  priority?: OpeningPriority[];
  employmentType?: EmploymentType[];
  workMode?: WorkMode[];
  visibility?: OpeningVisibility;
  hiringType?: HiringType;
  clientId?: string;
  projectId?: string;
  departmentId?: string;
  subDepartmentId?: string;
  hiringManagerId?: string;
  recruiterId?: string;
  recruiters?: string[];
  experience?: string[];
  jobTitles?: string[];
  archived?: 'exclude' | 'include' | 'only';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ── Phase 2: approvals ──────────────────────────────────────────────────────

export interface ApprovalWorkflowStep {
  id: string;
  workflowId: string;
  stepOrder: number;
  stepName: string;
  approverType: ApproverType;
  roleId: string | null;
  roleName: string | null;
  specificUserId: string | null;
  specificUserName: string | null;
  fallbackUserId: string | null;
  fallbackUserName: string | null;
  isOptional: boolean;
  slaHours: number | null;
}

export interface ApprovalWorkflow {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalWorkflowDetail extends ApprovalWorkflow {
  steps: ApprovalWorkflowStep[];
}

export interface ApprovalWorkflowListItem extends ApprovalWorkflow {
  stepCount: number;
}

export interface WorkflowStepInput {
  stepName: string;
  approverType: ApproverType;
  roleId?: string | null;
  specificUserId?: string | null;
  fallbackUserId?: string | null;
  isOptional?: boolean;
  slaHours?: number | null;
}

export interface CreateWorkflowInput {
  name: string;
  description?: string | null;
  isActive?: boolean;
  isDefault?: boolean;
  steps: WorkflowStepInput[];
}

export interface OpeningApproval {
  id: string;
  openingId: string;
  round: number;
  stepOrder: number;
  stepName: string;
  approverType: ApproverType;
  roleId: string | null;
  roleName: string | null;
  approverId: string | null;
  approverName: string | null;
  fallbackUserId: string | null;
  fallbackUserName: string | null;
  isOptional: boolean;
  status: ApprovalStatus;
  decidedBy: string | null;
  decidedByName: string | null;
  decidedAt: string | null;
  decisionNote: string | null;
  decidedAsAdmin: boolean;
  slaHours: number | null;
  createdAt: string;
}

export interface OpeningApprovalRound {
  round: number;
  steps: OpeningApproval[];
}

export interface OpeningApprovalState {
  opening: Opening;
  currentStep: OpeningApproval | null;
  rounds: OpeningApprovalRound[];
}

export interface PendingApprovalItem {
  openingId: string;
  openingCode: string;
  jobTitle: string;
  departmentName: string | null;
  clientName: string | null;
  priority: OpeningPriority;
  numberOfPositions: number;
  submittedAt: string | null;
  submittedByName: string | null;
  approval: OpeningApproval;
}

// ── Phase 3: status ─────────────────────────────────────────────────────────

export interface StatusHistoryEntry {
  id: string;
  openingId: string;
  fromStatus: OpeningStatus | null;
  toStatus: OpeningStatus;
  reason: string | null;
  note: string | null;
  isAutomated: boolean;
  changedByName: string | null;
  changedAt: string;
}

export interface AllowedTransition {
  to: OpeningStatus;
  label: string;
  requiresNote: boolean;
  requiresManage: boolean;
}

export interface OpeningStatusState {
  openingId: string;
  openingCode: string;
  status: OpeningStatus;
  statusReason: string | null;
  statusNote: string | null;
  statusChangedAt: string | null;
  closedAt: string | null;
  allowedTransitions: AllowedTransition[];
  history: StatusHistoryEntry[];
}

// ── Phase 4: postings ───────────────────────────────────────────────────────

export interface PostingSettings {
  tenantId: string;
  internalPostingDays: number;
  autoMoveToExternal: boolean;
  updatedAt: string | null;
}

export interface OpeningPosting {
  id: string;
  openingId: string;
  postingType: PostingType;
  status: PostingStatus;
  postedAt: string;
  expiresAt: string | null;
  autoMove: boolean;
  movedAt: string | null;
  closedAt: string | null;
  closedReason: string | null;
  postedByName: string | null;
  isAutomated: boolean;
  daysRemaining: number | null;
}

export interface PostingResult {
  opening: Opening;
  posting: OpeningPosting;
  postings: OpeningPosting[];
}

// ── Phase 5: applications ───────────────────────────────────────────────────

export interface OpeningApplication {
  id: string;
  openingId: string;
  candidateId: string;
  /** Which candidate store this application points at. */
  candidateSource?: 'ats' | 'pipeline';
  candidateName: string | null;
  candidateEmail: string | null;
  candidatePhone: string | null;
  candidateCurrentRole: string | null;
  candidateExperience: number | null;
  candidateSkills: string[];
  source: IntakeSource;
  sourceDetail: string | null;
  referredBy: string | null;
  referredByName: string | null;
  stage: ApplicationStage;
  stageChangedAt: string;
  rejectionReason: string | null;
  appliedAt: string;
  resumeUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationStageHistoryEntry {
  id: string;
  fromStage: ApplicationStage | null;
  toStage: ApplicationStage;
  note: string | null;
  changedByName: string | null;
  changedAt: string;
}

export interface ApplicationDetail extends OpeningApplication {
  history: ApplicationStageHistoryEntry[];
}

export interface ApplicationFunnel {
  openPositions: number;
  applications: number;
  screened: number;
  interview: number;
  offers: number;
  joined: number;
  rejected: number;
  withdrawn: number;
  byStage: Record<string, number>;
  bySource: Record<string, number>;
}

export interface SkillMatchResult {
  /** 0–100, or null when there is nothing meaningful to compare. */
  score: number | null;
  reason?: string;
  matchedRequired: string[];
  missingRequired: string[];
  matchedPreferred: string[];
  missingPreferred: string[];
  additional: string[];
  jobTitle: string;
}

export interface StageChangeResult {
  application: ApplicationDetail;
  positionsFilled: boolean;
  hiredCount: number;
  openPositions: number;
  openingStatusChangedTo: OpeningStatus | null;
}

export interface IntakeCatalog {
  sources: {
    value: IntakeSource;
    label: string;
    requiresReferrer?: boolean;
    requiresDetail?: boolean;
    detailLabel?: string;
  }[];
  stages: { value: ApplicationStage; label: string }[];
}

// ── Phase 6: dashboard ──────────────────────────────────────────────────────

export interface OpeningMetrics {
  openingId: string;
  openingCode: string;
  jobTitle: string;
  status: OpeningStatus;
  priority: OpeningPriority;
  departmentName: string | null;
  clientName: string | null;
  hiringManagerName: string | null;
  primaryRecruiterName: string | null;
  openPositions: number;
  remainingPositions: number;
  applications: number;
  screened: number;
  interview: number;
  offers: number;
  joined: number;
  rejected: number;
  withdrawn: number;
  ageDays: number;
  daysSincePosted: number | null;
  avgDaysToHire: number | null;
}

export interface DashboardSummary {
  openings: number;
  openPositions: number;
  remainingPositions: number;
  applications: number;
  screened: number;
  interview: number;
  offers: number;
  joined: number;
  rejected: number;
  withdrawn: number;
  openingsByStatus: Record<string, number>;
  openingsByPriority: Record<string, number>;
  avgDaysToHire: number | null;
  offerAcceptanceRate: number | null;
}

export interface SourceEffectiveness {
  source: IntakeSource;
  applications: number;
  interview: number;
  offers: number;
  joined: number;
  rejected: number;
  conversionRate: number;
}

export interface StageVelocity {
  stage: ApplicationStage;
  transitions: number;
  avgDays: number;
}

export interface RecruiterLoad {
  recruiterId: string;
  recruiterName: string | null;
  openings: number;
  activeOpenings: number;
  applications: number;
  joined: number;
}

export interface DashboardOverview {
  summary: DashboardSummary;
  openings: Paginated<OpeningMetrics>;
  sources: SourceEffectiveness[];
  velocity: StageVelocity[];
  recruiters: RecruiterLoad[];
}

export interface DashboardFilterQuery {
  status?: OpeningStatus[];
  priority?: OpeningPriority[];
  employmentType?: EmploymentType[];
  departmentId?: string;
  clientId?: string;
  projectId?: string;
  hiringManagerId?: string;
  recruiterId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  includeClosed?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ── Phase 7: closure ────────────────────────────────────────────────────────

export interface ClosureResult {
  opening: Opening;
  status: OpeningStatus;
  archived: boolean;
  postingsClosed: number;
  openApplications: number;
  applicationsRejected: number;
}

export interface ClosureCandidate {
  openingId: string;
  openingCode: string;
  jobTitle: string;
  status: OpeningStatus;
  openPositions: number;
  hired: number;
  openApplications: number;
  departmentName: string | null;
  hiringManagerName: string | null;
}

export interface CloseOpeningInput {
  closureReason: ClosureReason;
  note?: string | null;
  duplicateOfOpeningId?: string | null;
  archive?: boolean;
  rejectRemaining?: boolean;
}

// ── AI writing assist ───────────────────────────────────────────────────────

export type AssistField = 'job_description' | 'responsibilities';

/** What the form knows about the opening, used to ground the generation. */
export interface AssistContext {
  jobTitle: string;
  departmentName?: string | null;
  employmentType?: EmploymentType | null;
  workMode?: WorkMode | null;
  location?: string | null;
  minExperience?: number | null;
  maxExperience?: number | null;
  requiredSkills?: string[];
  preferredSkills?: string[];
}

export interface SuggestionGroup {
  key: string;
  label: string;
  items: string[];
}

export interface SuggestionResult {
  groups: SuggestionGroup[];
  /** True when served from the shared per-title cache rather than a fresh call. */
  cached: boolean;
  position: string;
}

/** Multi-value filters travel as comma-separated strings. */
function toParams(query: Record<string, any> = {}): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    out[key] = Array.isArray(value) ? value.join(',') : value;
  }
  return out;
}

export const OpeningV2Service = {
  // ── Phase 1: openings ─────────────────────────────────────────────────────
  async list(query: ListOpeningsQuery = {}): Promise<Paginated<OpeningListItem>> {
    const res = await apiClient.get(BASE, { params: toParams(query) });
    return (
      unwrap<Paginated<OpeningListItem>>(res.data) ?? {
        items: [],
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      }
    );
  },

  async get(id: string): Promise<OpeningDetail> {
    const res = await apiClient.get(`${BASE}/${id}`);
    return unwrap<OpeningDetail>(res.data);
  },

  async create(input: CreateOpeningInput): Promise<OpeningDetail> {
    const res = await apiClient.post(BASE, input);
    return unwrap<OpeningDetail>(res.data);
  },

  async update(id: string, input: UpdateOpeningInput): Promise<OpeningDetail> {
    const res = await apiClient.put(`${BASE}/${id}`, input);
    return unwrap<OpeningDetail>(res.data);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/${id}`);
  },

  async setRecruiters(id: string, recruiters: RecruiterInput[]): Promise<OpeningDetail> {
    const res = await apiClient.put(`${BASE}/${id}/recruiters`, { recruiters });
    return unwrap<OpeningDetail>(res.data);
  },

  async setHiringTeam(id: string, hiringTeam: HiringTeamMemberInput[]): Promise<OpeningDetail> {
    const res = await apiClient.put(`${BASE}/${id}/hiring-team`, { hiringTeam });
    return unwrap<OpeningDetail>(res.data);
  },

  async setRequiredDocuments(
    id: string,
    requiredDocuments: RequiredDocumentInput[]
  ): Promise<OpeningDetail> {
    const res = await apiClient.put(`${BASE}/${id}/required-documents`, { requiredDocuments });
    return unwrap<OpeningDetail>(res.data);
  },

  // ── Phase 2: approval workflows ───────────────────────────────────────────
  async listWorkflows(includeInactive = false): Promise<ApprovalWorkflowListItem[]> {
    const res = await apiClient.get(`${BASE}/approval-workflows`, {
      params: includeInactive ? { includeInactive: true } : undefined,
    });
    return unwrap<ApprovalWorkflowListItem[]>(res.data) ?? [];
  },

  async getWorkflow(workflowId: string): Promise<ApprovalWorkflowDetail> {
    const res = await apiClient.get(`${BASE}/approval-workflows/${workflowId}`);
    return unwrap<ApprovalWorkflowDetail>(res.data);
  },

  async createWorkflow(input: CreateWorkflowInput): Promise<ApprovalWorkflowDetail> {
    const res = await apiClient.post(`${BASE}/approval-workflows`, input);
    return unwrap<ApprovalWorkflowDetail>(res.data);
  },

  async updateWorkflow(
    workflowId: string,
    input: Partial<CreateWorkflowInput>
  ): Promise<ApprovalWorkflowDetail> {
    const res = await apiClient.put(`${BASE}/approval-workflows/${workflowId}`, input);
    return unwrap<ApprovalWorkflowDetail>(res.data);
  },

  async deleteWorkflow(workflowId: string): Promise<void> {
    await apiClient.delete(`${BASE}/approval-workflows/${workflowId}`);
  },

  // ── Phase 2: approvals ────────────────────────────────────────────────────
  async listPendingApprovals(mineOnly = false): Promise<PendingApprovalItem[]> {
    const res = await apiClient.get(`${BASE}/approvals/pending`, {
      params: mineOnly ? { mine: 'true' } : undefined,
    });
    return unwrap<PendingApprovalItem[]>(res.data) ?? [];
  },

  async getApprovals(id: string): Promise<OpeningApprovalState> {
    const res = await apiClient.get(`${BASE}/${id}/approvals`);
    return unwrap<OpeningApprovalState>(res.data);
  },

  async submitForApproval(
    id: string,
    body: { workflowId?: string | null; note?: string | null } = {}
  ): Promise<OpeningApprovalState> {
    const res = await apiClient.post(`${BASE}/${id}/submit`, body);
    return unwrap<OpeningApprovalState>(res.data);
  },

  async approve(id: string, note?: string | null): Promise<OpeningApprovalState> {
    const res = await apiClient.post(`${BASE}/${id}/approve`, { note });
    return unwrap<OpeningApprovalState>(res.data);
  },

  async reject(id: string, note: string): Promise<OpeningApprovalState> {
    const res = await apiClient.post(`${BASE}/${id}/reject`, { note });
    return unwrap<OpeningApprovalState>(res.data);
  },

  async withdraw(id: string, note?: string | null): Promise<OpeningApprovalState> {
    const res = await apiClient.post(`${BASE}/${id}/withdraw`, { note });
    return unwrap<OpeningApprovalState>(res.data);
  },

  async skipStep(id: string, note?: string | null): Promise<OpeningApprovalState> {
    const res = await apiClient.post(`${BASE}/${id}/skip-step`, { note });
    return unwrap<OpeningApprovalState>(res.data);
  },

  // ── Phase 3: status ───────────────────────────────────────────────────────
  async getStatus(id: string): Promise<OpeningStatusState> {
    const res = await apiClient.get(`${BASE}/${id}/status`);
    return unwrap<OpeningStatusState>(res.data);
  },

  async getStatusHistory(id: string): Promise<StatusHistoryEntry[]> {
    const res = await apiClient.get(`${BASE}/${id}/status-history`);
    return unwrap<StatusHistoryEntry[]>(res.data) ?? [];
  },

  async changeStatus(
    id: string,
    body: { status: OpeningStatus; reason?: string | null; note?: string | null }
  ): Promise<OpeningStatusState> {
    const res = await apiClient.post(`${BASE}/${id}/status`, body);
    return unwrap<OpeningStatusState>(res.data);
  },

  async hold(id: string, note: string): Promise<OpeningStatusState> {
    const res = await apiClient.post(`${BASE}/${id}/hold`, { note });
    return unwrap<OpeningStatusState>(res.data);
  },

  async resume(id: string, note?: string | null): Promise<OpeningStatusState> {
    const res = await apiClient.post(`${BASE}/${id}/resume`, { note });
    return unwrap<OpeningStatusState>(res.data);
  },

  /**
   * Counts per status. `archived` mirrors the list filter so summary tiles and
   * the table beneath them always count the same rows.
   */
  async statusSummary(
    archived: 'exclude' | 'include' | 'only' = 'exclude'
  ): Promise<Record<string, number>> {
    const res = await apiClient.get(`${BASE}/status-summary`, { params: { archived } });
    return unwrap<Record<string, number>>(res.data) ?? {};
  },

  // ── Phase 4: postings ─────────────────────────────────────────────────────
  async getPostingSettings(): Promise<PostingSettings> {
    const res = await apiClient.get(`${BASE}/posting-settings`);
    return unwrap<PostingSettings>(res.data);
  },

  async updatePostingSettings(
    input: { internalPostingDays?: number; autoMoveToExternal?: boolean }
  ): Promise<PostingSettings> {
    const res = await apiClient.put(`${BASE}/posting-settings`, input);
    return unwrap<PostingSettings>(res.data);
  },

  async listPostings(id: string): Promise<OpeningPosting[]> {
    const res = await apiClient.get(`${BASE}/${id}/postings`);
    return unwrap<OpeningPosting[]>(res.data) ?? [];
  },

  async postInternally(
    id: string,
    body: { days?: number; autoMove?: boolean; note?: string | null } = {}
  ): Promise<PostingResult> {
    const res = await apiClient.post(`${BASE}/${id}/postings/internal`, body);
    return unwrap<PostingResult>(res.data);
  },

  async postExternally(id: string, note?: string | null): Promise<PostingResult> {
    const res = await apiClient.post(`${BASE}/${id}/postings/external`, { note });
    return unwrap<PostingResult>(res.data);
  },

  async closePosting(
    id: string,
    postingId: string,
    reason?: string | null
  ): Promise<OpeningPosting[]> {
    const res = await apiClient.post(`${BASE}/${id}/postings/${postingId}/close`, { reason });
    return unwrap<OpeningPosting[]>(res.data) ?? [];
  },

  async runAutoMove(): Promise<{ scanned: number; moved: number; failed: any[] }> {
    const res = await apiClient.post(`${BASE}/postings/run-auto-move`);
    return unwrap<{ scanned: number; moved: number; failed: any[] }>(res.data);
  },

  // ── Phase 5: applications ─────────────────────────────────────────────────
  async intakeCatalog(): Promise<IntakeCatalog> {
    const res = await apiClient.get(`${BASE}/intake-catalog`);
    return unwrap<IntakeCatalog>(res.data);
  },

  async listApplications(
    id: string,
    query: {
      page?: number;
      pageSize?: number;
      stage?: ApplicationStage[];
      source?: IntakeSource[];
      search?: string;
    } = {}
  ): Promise<Paginated<OpeningApplication>> {
    const res = await apiClient.get(`${BASE}/${id}/applications`, { params: toParams(query) });
    return (
      unwrap<Paginated<OpeningApplication>>(res.data) ?? {
        items: [],
        total: 0,
        page: 1,
        pageSize: 50,
        totalPages: 1,
      }
    );
  },

  /** Score a resume's skills against an opening. Read-only, nothing stored. */
  async skillMatch(id: string, skills: string[]): Promise<SkillMatchResult> {
    const res = await apiClient.post(`${BASE}/${id}/skill-match`, { skills });
    return unwrap<SkillMatchResult>(res.data);
  },

  async getFunnel(id: string): Promise<ApplicationFunnel> {
    const res = await apiClient.get(`${BASE}/${id}/applications/funnel`);
    return unwrap<ApplicationFunnel>(res.data);
  },

  async getApplication(id: string, applicationId: string): Promise<ApplicationDetail> {
    const res = await apiClient.get(`${BASE}/${id}/applications/${applicationId}`);
    return unwrap<ApplicationDetail>(res.data);
  },

  async addApplication(
    id: string,
    input: {
      /** Exactly one of candidateId / pipelineCandidateId. */
      candidateId?: string;
      /** A pipeline_candidates.id, for candidates added on /pipeline/candidates. */
      pipelineCandidateId?: string;
      source: IntakeSource;
      sourceDetail?: string | null;
      referredBy?: string | null;
      resumeUrl?: string | null;
      notes?: string | null;
      stage?: ApplicationStage;
    }
  ): Promise<ApplicationDetail> {
    const res = await apiClient.post(`${BASE}/${id}/applications`, input);
    return unwrap<ApplicationDetail>(res.data);
  },

  async updateApplication(
    id: string,
    applicationId: string,
    input: {
      sourceDetail?: string | null;
      referredBy?: string | null;
      resumeUrl?: string | null;
      notes?: string | null;
    }
  ): Promise<ApplicationDetail> {
    const res = await apiClient.put(`${BASE}/${id}/applications/${applicationId}`, input);
    return unwrap<ApplicationDetail>(res.data);
  },

  async changeStage(
    id: string,
    applicationId: string,
    input: { stage: ApplicationStage; note?: string | null; rejectionReason?: string | null }
  ): Promise<StageChangeResult> {
    const res = await apiClient.post(
      `${BASE}/${id}/applications/${applicationId}/stage`,
      input
    );
    return unwrap<StageChangeResult>(res.data);
  },

  async removeApplication(id: string, applicationId: string): Promise<void> {
    await apiClient.delete(`${BASE}/${id}/applications/${applicationId}`);
  },

  async candidatePipeline(candidateId: string) {
    const res = await apiClient.get(`${BASE}/candidates/${candidateId}/pipeline`);
    return unwrap<{ openingId: string; openingCode: string; jobTitle: string; stage: string }[]>(
      res.data
    ) ?? [];
  },

  // ── Phase 6: dashboard ────────────────────────────────────────────────────
  async dashboard(query: DashboardFilterQuery = {}): Promise<DashboardOverview> {
    const res = await apiClient.get(`${BASE}/dashboard`, { params: toParams(query) });
    return unwrap<DashboardOverview>(res.data);
  },

  async dashboardSummary(query: DashboardFilterQuery = {}): Promise<DashboardSummary> {
    const res = await apiClient.get(`${BASE}/dashboard/summary`, { params: toParams(query) });
    return unwrap<DashboardSummary>(res.data);
  },

  async dashboardOpenings(query: DashboardFilterQuery = {}): Promise<Paginated<OpeningMetrics>> {
    const res = await apiClient.get(`${BASE}/dashboard/openings`, { params: toParams(query) });
    return unwrap<Paginated<OpeningMetrics>>(res.data);
  },

  // ── Phase 7: closure ──────────────────────────────────────────────────────
  async closureReasons() {
    const res = await apiClient.get(`${BASE}/closure-reasons`);
    return (
      unwrap<
        {
          value: ClosureReason;
          label: string;
          status: OpeningStatus;
          requiresDuplicateLink?: boolean;
        }[]
      >(res.data) ?? []
    );
  },

  async closureCandidates(): Promise<ClosureCandidate[]> {
    const res = await apiClient.get(`${BASE}/closure-candidates`);
    return unwrap<ClosureCandidate[]>(res.data) ?? [];
  },

  async close(id: string, input: CloseOpeningInput): Promise<ClosureResult> {
    const res = await apiClient.post(`${BASE}/${id}/close`, input);
    return unwrap<ClosureResult>(res.data);
  },

  async archive(id: string, note?: string | null): Promise<Opening> {
    const res = await apiClient.post(`${BASE}/${id}/archive`, { note });
    return unwrap<Opening>(res.data);
  },

  async unarchive(id: string): Promise<Opening> {
    const res = await apiClient.post(`${BASE}/${id}/unarchive`);
    return unwrap<Opening>(res.data);
  },

  // ── AI writing assist ───────────────────────────────────────────────────
  /** Fix spelling and grammar WITHOUT rewriting — see the backend prompt. */
  async aiGrammar(text: string): Promise<{ text: string; changed: boolean }> {
    const res = await apiClient.post(`${BASE}/ai/grammar`, { text });
    return unwrap<{ text: string; changed: boolean }>(res.data);
  },

  /**
   * Job-title-related skills and themes to tick before generating.
   * Served from the shared per-title cache when there is one; pass
   * `refresh` to force a fresh AI call.
   */
  async aiSuggestions(
    field: AssistField,
    context: AssistContext,
    refresh = false
  ): Promise<SuggestionResult> {
    const res = await apiClient.post(`${BASE}/ai/suggestions`, { field, context, refresh });
    return (
      unwrap<SuggestionResult>(res.data) ?? {
        groups: [],
        cached: false,
        position: context.jobTitle,
      }
    );
  },

  /** Write or improve the field, covering whatever the user selected. */
  async aiEnhance(input: {
    field: AssistField;
    currentText?: string | null;
    selected?: string[];
    /** User-typed additions, saved to the shared title cache on confirm. */
    customItems?: { groupKey: string; items: string[] }[];
    context: AssistContext;
  }): Promise<{ text: string; missing: string[] }> {
    const res = await apiClient.post(`${BASE}/ai/enhance`, input);
    const data = unwrap<{ text: string; missing?: string[] }>(res.data);
    return { text: data?.text ?? '', missing: data?.missing ?? [] };
  },

  // ── Referrals ─────────────────────────────────────────────────────────────
  
  async addReferral(
    id: string,
    input: {
      name: string;
      email: string;
      mobile: string;
      resumeUrl?: string | null;
      notes?: string | null;
      skills?: string[];
      totalExperience?: number;
    }
  ): Promise<OpeningReferral> {
    const res = await apiClient.post(`${BASE}/${id}/referrals`, input);
    return unwrap<OpeningReferral>(res.data);
  },

  async listReferrals(id: string): Promise<OpeningReferral[]> {
    const res = await apiClient.get(`${BASE}/${id}/referrals`);
    return unwrap<OpeningReferral[]>(res.data) ?? [];
  },

  async considerAsCandidate(id: string, refId: string): Promise<OpeningReferral> {
    const res = await apiClient.post(`${BASE}/${id}/referrals/${refId}/convert`);
    return unwrap<OpeningReferral>(res.data);
  },

  async deleteReferral(id: string, refId: string): Promise<void> {
    await apiClient.delete(`${BASE}/${id}/referrals/${refId}`);
  },
};

export default OpeningV2Service;
