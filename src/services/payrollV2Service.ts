import { apiClient } from '@/lib/axios';

// ── Payroll 2.0 frontend service ────────────────────────────────────────────
// Talks to the raw-SQL backend module mounted at /api/v2/payroll.
// Every endpoint returns the platform envelope { success, data }.

export type SalaryCalcBasis = 'calendar_days' | 'fixed_days' | 'working_days';
export type PayFrequency = 'monthly' | 'semi_monthly' | 'weekly' | 'biweekly';
export type RoundingMode = 'none' | 'nearest' | 'up' | 'down';

export interface PayrollSettings {
  id: string;
  tenantId: string;
  financialYearStartMonth: number;
  currency: string;
  payFrequency: PayFrequency;
  salaryCalcBasis: SalaryCalcBasis;
  salaryFixedDays: number;
  lopCalcBasis: SalaryCalcBasis;
  lopFixedDays: number;
  roundingMode: RoundingMode;
  roundingNearest: number;
  decimalPlaces: number;
  payDay: number;
  enableLop: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePayrollSettingsInput {
  financialYearStartMonth: number;
  currency: string;
  payFrequency: PayFrequency;
  salaryCalcBasis: SalaryCalcBasis;
  salaryFixedDays: number;
  lopCalcBasis: SalaryCalcBasis;
  lopFixedDays: number;
  roundingMode: RoundingMode;
  roundingNearest: number;
  decimalPlaces: number;
  payDay: number;
  enableLop: boolean;
}

// ── Salary Components ─────────────────────────────────────────────────────────
export type ComponentCategory = 'earning' | 'deduction' | 'reimbursement' | 'benefit';
export type ComponentCalcType = 'fixed' | 'percentage' | 'formula';
export type ComponentPercentageOf = 'gross' | 'basic' | 'ctc';

export interface PayComponent {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  category: ComponentCategory;
  calculationType: ComponentCalcType;
  percentageOf: ComponentPercentageOf | null;
  defaultValue: number | null;
  isTaxable: boolean;
  isProRata: boolean;
  partOfCtc: boolean;
  considerForPf: boolean;
  considerForEsi: boolean;
  showOnPayslip: boolean;
  displayOrder: number;
  description: string | null;
  isActive: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateComponentInput {
  name: string;
  code: string;
  category: ComponentCategory;
  calculationType: ComponentCalcType;
  percentageOf?: ComponentPercentageOf | null;
  defaultValue?: number | null;
  isTaxable: boolean;
  isProRata: boolean;
  partOfCtc: boolean;
  considerForPf: boolean;
  considerForEsi: boolean;
  showOnPayslip: boolean;
  displayOrder: number;
  description?: string | null;
  isActive: boolean;
}

export type UpdateComponentInput = Partial<CreateComponentInput>;

const BASE = '/api/v2/payroll';

function unwrap<T>(data: any): T {
  return data?.data as T;
}

export const PayrollV2Service = {
  // ── General Settings ───────────────────────────────────────────────────────
  async getSettings(): Promise<PayrollSettings> {
    const res = await apiClient.get(`${BASE}/settings`);
    return unwrap<PayrollSettings>(res.data);
  },

  async updateSettings(input: UpdatePayrollSettingsInput): Promise<PayrollSettings> {
    const res = await apiClient.put(`${BASE}/settings`, input);
    return unwrap<PayrollSettings>(res.data);
  },

  // ── Salary Components ──────────────────────────────────────────────────────
  async listComponents(params?: { includeInactive?: boolean; status?: 'all' | 'active' | 'inactive'; search?: string; page?: number; limit?: number; category?: ComponentCategory }): Promise<{ data: PayComponent[]; pagination: { total: number; page: number; limit: number } }> {
    const res = await apiClient.get(`${BASE}/components`, { params });
    return {
      data: (res.data?.data as PayComponent[]) ?? [],
      pagination: res.data?.pagination ?? { total: 0, page: 1, limit: 20 },
    };
  },

  async getComponent(id: string): Promise<PayComponent> {
    const res = await apiClient.get(`${BASE}/components/${id}`);
    return unwrap<PayComponent>(res.data);
  },

  async createComponent(input: CreateComponentInput): Promise<PayComponent> {
    const res = await apiClient.post(`${BASE}/components`, input);
    return unwrap<PayComponent>(res.data);
  },

  async updateComponent(id: string, input: UpdateComponentInput): Promise<PayComponent> {
    const res = await apiClient.put(`${BASE}/components/${id}`, input);
    return unwrap<PayComponent>(res.data);
  },

  async deleteComponent(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/components/${id}`);
  },

  // ── Salary Structures ──────────────────────────────────────────────────────
  async listStructures(params?: { includeInactive?: boolean; page?: number; limit?: number; search?: string }): Promise<{ data: PayStructureListItem[]; pagination: { total: number; page: number; limit: number } }> {
    const res = await apiClient.get(`${BASE}/structures`, { params });
    return {
      data: (res.data?.data as PayStructureListItem[]) ?? [],
      pagination: res.data?.pagination ?? { total: 0, page: 1, limit: 20 },
    };
  },

  async getStructure(id: string): Promise<PayStructureDetail> {
    const res = await apiClient.get(`${BASE}/structures/${id}`);
    return unwrap<PayStructureDetail>(res.data);
  },

  async createStructure(input: SaveStructureInput): Promise<PayStructureDetail> {
    const res = await apiClient.post(`${BASE}/structures`, input);
    return unwrap<PayStructureDetail>(res.data);
  },

  async updateStructure(id: string, input: SaveStructureInput): Promise<PayStructureDetail> {
    const res = await apiClient.put(`${BASE}/structures/${id}`, input);
    return unwrap<PayStructureDetail>(res.data);
  },

  async deleteStructure(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/structures/${id}`);
  },

  async previewStructure(input: PreviewStructureInput): Promise<StructurePreviewResult> {
    const res = await apiClient.post(`${BASE}/structures/preview`, input);
    return unwrap<StructurePreviewResult>(res.data);
  },

  // ── Pay Schedules ──────────────────────────────────────────────────────────
  async listSchedules(params?: { includeInactive?: boolean; page?: number; limit?: number; search?: string }): Promise<{ data: PayScheduleListItem[]; pagination: { total: number; page: number; limit: number } }> {
    const res = await apiClient.get(`${BASE}/schedules`, { params });
    return {
      data: (res.data?.data as PayScheduleListItem[]) ?? [],
      pagination: res.data?.pagination ?? { total: 0, page: 1, limit: 20 },
    };
  },
  async createSchedule(input: SaveScheduleInput): Promise<PaySchedule> {
    const res = await apiClient.post(`${BASE}/schedules`, input);
    return unwrap<PaySchedule>(res.data);
  },
  async updateSchedule(id: string, input: Partial<SaveScheduleInput>): Promise<PaySchedule> {
    const res = await apiClient.put(`${BASE}/schedules/${id}`, input);
    return unwrap<PaySchedule>(res.data);
  },
  async deleteSchedule(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/schedules/${id}`);
  },

  // ── Pay Groups ─────────────────────────────────────────────────────────────
  async listGroups(params?: { includeInactive?: boolean; page?: number; limit?: number; search?: string }): Promise<{ data: PayGroupListItem[]; pagination: { total: number; page: number; limit: number } }> {
    const res = await apiClient.get(`${BASE}/groups`, { params });
    return {
      data: (res.data?.data as PayGroupListItem[]) ?? [],
      pagination: res.data?.pagination ?? { total: 0, page: 1, limit: 20 },
    };
  },
  async createGroup(input: SaveGroupInput): Promise<PayGroup> {
    const res = await apiClient.post(`${BASE}/groups`, input);
    return unwrap<PayGroup>(res.data);
  },
  async updateGroup(id: string, input: Partial<SaveGroupInput>): Promise<PayGroup> {
    const res = await apiClient.put(`${BASE}/groups/${id}`, input);
    return unwrap<PayGroup>(res.data);
  },
  async deleteGroup(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/groups/${id}`);
  },

  // ── Statutory: PF & ESI ────────────────────────────────────────────────────
  async getPfConfig(): Promise<PfConfig> {
    const res = await apiClient.get(`${BASE}/statutory/pf`);
    return unwrap<PfConfig>(res.data);
  },
  async updatePfConfig(input: UpdatePfInput): Promise<PfConfig> {
    const res = await apiClient.put(`${BASE}/statutory/pf`, input);
    return unwrap<PfConfig>(res.data);
  },
  async getEsiConfig(): Promise<EsiConfig> {
    const res = await apiClient.get(`${BASE}/statutory/esi`);
    return unwrap<EsiConfig>(res.data);
  },
  async updateEsiConfig(input: UpdateEsiInput): Promise<EsiConfig> {
    const res = await apiClient.put(`${BASE}/statutory/esi`, input);
    return unwrap<EsiConfig>(res.data);
  },

  // ── Professional Tax (state slabs) ─────────────────────────────────────────
  async listPtStates(params?: { includeInactive?: boolean; page?: number; limit?: number; search?: string }): Promise<{ data: PtStateListItem[]; pagination: { total: number; page: number; limit: number } }> {
    const res = await apiClient.get(`${BASE}/statutory/pt`, { params });
    return {
      data: (res.data?.data as PtStateListItem[]) ?? [],
      pagination: res.data?.pagination ?? { total: 0, page: 1, limit: 20 },
    };
  },
  async getPtState(id: string): Promise<PtStateDetail> {
    const res = await apiClient.get(`${BASE}/statutory/pt/${id}`);
    return unwrap<PtStateDetail>(res.data);
  },
  async createPtState(input: SavePtStateInput): Promise<PtStateDetail> {
    const res = await apiClient.post(`${BASE}/statutory/pt`, input);
    return unwrap<PtStateDetail>(res.data);
  },
  async updatePtState(id: string, input: SavePtStateInput): Promise<PtStateDetail> {
    const res = await apiClient.put(`${BASE}/statutory/pt/${id}`, input);
    return unwrap<PtStateDetail>(res.data);
  },
  async deletePtState(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/statutory/pt/${id}`);
  },

  // ── LWF (per state) ────────────────────────────────────────────────────────
  async listLwf(params?: { includeInactive?: boolean; page?: number; limit?: number; search?: string }): Promise<{ data: LwfState[]; pagination: { total: number; page: number; limit: number } }> {
    const res = await apiClient.get(`${BASE}/statutory/lwf`, { params });
    return {
      data: (res.data?.data as LwfState[]) ?? [],
      pagination: res.data?.pagination ?? { total: 0, page: 1, limit: 20 },
    };
  },
  async createLwf(input: SaveLwfInput): Promise<LwfState> {
    const res = await apiClient.post(`${BASE}/statutory/lwf`, input);
    return unwrap<LwfState>(res.data);
  },
  async updateLwf(id: string, input: Partial<SaveLwfInput>): Promise<LwfState> {
    const res = await apiClient.put(`${BASE}/statutory/lwf/${id}`, input);
    return unwrap<LwfState>(res.data);
  },
  async deleteLwf(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/statutory/lwf/${id}`);
  },

  // ── Approval Workflows ─────────────────────────────────────────────────────
  async listWorkflows(params?: { includeInactive?: boolean; page?: number; limit?: number; search?: string }): Promise<{ data: ApprovalWorkflowListItem[]; pagination: { total: number; page: number; limit: number } }> {
    const res = await apiClient.get(`${BASE}/workflows`, { params });
    return {
      data: (res.data?.data as ApprovalWorkflowListItem[]) ?? [],
      pagination: res.data?.pagination ?? { total: 0, page: 1, limit: 20 },
    };
  },
  async getWorkflow(id: string): Promise<ApprovalWorkflowDetail> {
    const res = await apiClient.get(`${BASE}/workflows/${id}`);
    return unwrap<ApprovalWorkflowDetail>(res.data);
  },
  async createWorkflow(input: SaveWorkflowInput): Promise<ApprovalWorkflowDetail> {
    const res = await apiClient.post(`${BASE}/workflows`, input);
    return unwrap<ApprovalWorkflowDetail>(res.data);
  },
  async updateWorkflow(id: string, input: SaveWorkflowInput): Promise<ApprovalWorkflowDetail> {
    const res = await apiClient.put(`${BASE}/workflows/${id}`, input);
    return unwrap<ApprovalWorkflowDetail>(res.data);
  },
  async deleteWorkflow(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/workflows/${id}`);
  },

  // Approver option lookups (reuse existing platform endpoints).
  async getApproverRoles(): Promise<ApproverOption[]> {
    const res = await apiClient.get(`/api/rbac/roles`);
    const raw: any = res.data;
    const arr: any[] = Array.isArray(raw) ? raw : raw?.data ?? raw?.data?.data ?? [];
    return arr.map((r) => ({ value: r.id ?? r.value, label: r.name ?? r.label ?? r.displayName }));
  },
  async getApproverUsers(): Promise<ApproverOption[]> {
    const res = await apiClient.get(`/api/members/select`);
    const raw: any = res.data;
    const arr: any[] = Array.isArray(raw) ? raw : raw?.data ?? raw?.data?.data ?? [];
    return arr.map((m) => ({ value: m.value ?? m.id, label: m.label ?? m.name ?? m.fullName }));
  },

  // ── Payslip Template & Bank Settings ───────────────────────────────────────
  async getPayslipTemplate(): Promise<PayslipTemplate> {
    const res = await apiClient.get(`${BASE}/payslip-template`);
    return unwrap<PayslipTemplate>(res.data);
  },
  async updatePayslipTemplate(input: UpdatePayslipTemplateInput): Promise<PayslipTemplate> {
    const res = await apiClient.put(`${BASE}/payslip-template`, input);
    return unwrap<PayslipTemplate>(res.data);
  },
  async previewPayslipTemplate(input: UpdatePayslipTemplateInput): Promise<string> {
    const res = await apiClient.post(`${BASE}/payslip-template/preview`, input);
    return unwrap<{ html: string }>(res.data)?.html ?? '';
  },
  async uploadPayslipLogo(image: string): Promise<string> {
    const res = await apiClient.post(`${BASE}/payslip-template/logo`, { image });
    return unwrap<{ url: string }>(res.data)?.url ?? '';
  },
  async getBankSettings(): Promise<BankSettings> {
    const res = await apiClient.get(`${BASE}/bank-settings`);
    return unwrap<BankSettings>(res.data);
  },
  async updateBankSettings(input: UpdateBankSettingsInput): Promise<BankSettings> {
    const res = await apiClient.put(`${BASE}/bank-settings`, input);
    return unwrap<BankSettings>(res.data);
  },

  // ── Phase 2: Employee Pay Setup ────────────────────────────────────────────
  async getEmployeesForSelect(): Promise<MemberOption[]> {
    const res = await apiClient.get(`/api/members/select`);
    const raw: any = res.data;
    const arr: any[] = Array.isArray(raw) ? raw : raw?.data ?? raw?.data?.data ?? [];
    // Key payroll on User.id (`value`), consistent with leave-v2 / attendance.
    return arr.map((m) => ({
      value: m.value ?? m.id,
      label: m.label ?? m.name ?? m.fullName,
      position: m.position ?? null,
      email: m.email ?? m.workEmail ?? null,
      avatarUrl: m.avatarUrl ?? null,
    }));
  },
  async listEmployeesPaginated(params?: { page?: number; limit?: number; search?: string }): Promise<{ data: MemberOption[]; pagination: { total: number; page: number; limit: number } }> {
    const res = await apiClient.get(`/api/members`, { params });
    const raw: any = res.data;
    const arr: any[] = raw?.data ?? [];
    return {
      data: arr.map((m) => ({
        value: m.id,
        label: m.name ?? m.fullName,
        position: m.position?.title ?? (typeof m.position === 'string' ? m.position : null),
        email: m.workEmail ?? m.personalEmail ?? null,
        avatarUrl: m.avatarUrl ?? null,
      })),
      pagination: raw?.pagination ?? { total: 0, page: 1, limit: 20 },
    };
  },
  async listAssignments(): Promise<EmployeeAssignmentListItem[]> {
    const res = await apiClient.get(`${BASE}/employees/assignments`);
    return unwrap<EmployeeAssignmentListItem[]>(res.data) ?? [];
  },
  async getAssignment(employeeId: string): Promise<EmployeeAssignmentDetail | null> {
    const res = await apiClient.get(`${BASE}/employees/assignments/${employeeId}`);
    return unwrap<EmployeeAssignmentDetail | null>(res.data) ?? null;
  },
  async assign(input: AssignInput): Promise<EmployeeAssignmentDetail> {
    const res = await apiClient.post(`${BASE}/employees/assignments`, input);
    return unwrap<EmployeeAssignmentDetail>(res.data);
  },
  async previewAssignment(input: { structureId: string; monthlyCtc: number }): Promise<AssignPreviewResult> {
    const res = await apiClient.post(`${BASE}/employees/assignments/preview`, input);
    return unwrap<AssignPreviewResult>(res.data);
  },
  async revokeAssignment(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/employees/assignments/${id}`);
  },
  async getAssignmentHistory(employeeId: string): Promise<EmployeeAssignmentListItem[]> {
    const res = await apiClient.get(`${BASE}/employees/assignments/${employeeId}/history`);
    return unwrap<EmployeeAssignmentListItem[]>(res.data) ?? [];
  },

  // ── Phase 3: Pay Runs ──────────────────────────────────────────────────────
  async listRuns(): Promise<PayRun[]> {
    const res = await apiClient.get(`${BASE}/runs`);
    return unwrap<PayRun[]>(res.data) ?? [];
  },
  async getRun(id: string): Promise<PayRunDetail> {
    const res = await apiClient.get(`${BASE}/runs/${id}`);
    return unwrap<PayRunDetail>(res.data);
  },
  async createRun(input: { month: number; year: number; notes?: string | null }): Promise<PayRunDetail> {
    const res = await apiClient.post(`${BASE}/runs`, input);
    return unwrap<PayRunDetail>(res.data);
  },
  async updateRunItem(runId: string, itemId: string, input: { lopDays: number; notes?: string | null }): Promise<PayRunDetail> {
    const res = await apiClient.put(`${BASE}/runs/${runId}/items/${itemId}`, input);
    return unwrap<PayRunDetail>(res.data);
  },
  async deleteRun(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/runs/${id}`);
  },
  async syncRunLop(runId: string): Promise<{ detail: PayRunDetail; syncedEmployees: number; totalLopDays: number }> {
    const res = await apiClient.post(`${BASE}/runs/${runId}/sync-lop`, {});
    return unwrap<{ detail: PayRunDetail; syncedEmployees: number; totalLopDays: number }>(res.data);
  },
  async submitRun(runId: string): Promise<PayRunDetail> {
    const res = await apiClient.post(`${BASE}/runs/${runId}/submit`, {});
    return unwrap<PayRunDetail>(res.data);
  },
  async processRunStep(runId: string, action: 'approve' | 'reject', remarks?: string | null): Promise<PayRunDetail> {
    const res = await apiClient.post(`${BASE}/runs/${runId}/process`, { action, remarks: remarks ?? null });
    return unwrap<PayRunDetail>(res.data);
  },
  async finalizeRun(runId: string): Promise<PayRunDetail> {
    const res = await apiClient.post(`${BASE}/runs/${runId}/finalize`, {});
    return unwrap<PayRunDetail>(res.data);
  },
  async markRunPaid(runId: string): Promise<PayRunDetail> {
    const res = await apiClient.post(`${BASE}/runs/${runId}/mark-paid`, {});
    return unwrap<PayRunDetail>(res.data);
  },
  async listRunPayslips(runId: string): Promise<PayPayslip[]> {
    const res = await apiClient.get(`${BASE}/runs/${runId}/payslips`);
    return unwrap<PayPayslip[]>(res.data) ?? [];
  },
  // Returns a sync result ({generated, payslips}) OR, when async is enabled, a
  // job header (has `status`/`total`). The caller branches on `'payslips' in res`.
  async generateRunPayslips(runId: string): Promise<{ generated: number; payslips: PayPayslip[] } | PayslipJob> {
    const res = await apiClient.post(`${BASE}/runs/${runId}/payslips`, {});
    return unwrap<{ generated: number; payslips: PayPayslip[] } | PayslipJob>(res.data);
  },
  async getPayslipJobStatus(runId: string): Promise<{ job: PayslipJob | null; items: PayslipJobItem[] }> {
    const res = await apiClient.get(`${BASE}/runs/${runId}/payslips/status`);
    return unwrap<{ job: PayslipJob | null; items: PayslipJobItem[] }>(res.data) ?? { job: null, items: [] };
  },
  async resumeRunPayslips(runId: string): Promise<PayslipJob> {
    const res = await apiClient.post(`${BASE}/runs/${runId}/payslips/resume`, {});
    return unwrap<PayslipJob>(res.data);
  },
  async getRunBankFile(runId: string): Promise<PayBankFile | null> {
    const res = await apiClient.get(`${BASE}/runs/${runId}/bank-file`);
    return unwrap<PayBankFile | null>(res.data) ?? null;
  },
  async generateRunBankFile(runId: string): Promise<PayBankFile> {
    const res = await apiClient.post(`${BASE}/runs/${runId}/bank-file`, {});
    return unwrap<PayBankFile>(res.data);
  },

  // ── Phase 5: Self-service ──────────────────────────────────────────────────
  async getMyPayslips(): Promise<PayPayslip[]> {
    const res = await apiClient.get(`${BASE}/my-payslips`);
    return unwrap<PayPayslip[]>(res.data) ?? [];
  },

  // ── Phase 6: Reports ───────────────────────────────────────────────────────
  async getSalaryRegister(runId: string): Promise<SalaryRegister> {
    const res = await apiClient.get(`${BASE}/reports/register`, { params: { runId } });
    return unwrap<SalaryRegister>(res.data);
  },

  // ── Employee statutory & bank profile ──────────────────────────────────────
  async listEmployeeProfiles(): Promise<EmployeeProfile[]> {
    const res = await apiClient.get(`${BASE}/employees/profiles`);
    return unwrap<EmployeeProfile[]>(res.data) ?? [];
  },
  async getEmployeeProfile(employeeId: string): Promise<EmployeeProfile | null> {
    const res = await apiClient.get(`${BASE}/employees/profiles/${employeeId}`);
    return unwrap<EmployeeProfile | null>(res.data) ?? null;
  },
  async upsertEmployeeProfile(employeeId: string, input: UpsertProfileInput): Promise<EmployeeProfile> {
    const res = await apiClient.put(`${BASE}/employees/profiles/${employeeId}`, input);
    return unwrap<EmployeeProfile>(res.data);
  },
};

// ── Pay Run types ─────────────────────────────────────────────────────────────
export type PayRunStatus = 'draft' | 'pending_approval' | 'approved' | 'finalized' | 'paid' | 'cancelled';

export interface PayRunLine {
  componentId: string;
  code: string;
  name: string;
  category: ComponentCategory;
  isProRata: boolean;
  fullAmount: number;
  amount: number;
}
export interface PayRun {
  id: string;
  tenantId: string;
  payGroupId: string | null;
  payGroupName: string;
  month: number;
  year: number;
  periodLabel: string;
  status: PayRunStatus;
  totalDays: number;
  employeeCount: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  workflowId: string | null;
  workflowName: string | null;
  currentStep: number;
  totalSteps: number;
  notes: string | null;
  finalizedAt: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface PayRunApproval {
  id: string;
  runId: string;
  stepNumber: number;
  action: 'submitted' | 'approved' | 'rejected' | 'finalized' | 'paid';
  performedBy: string | null;
  remarks: string | null;
  createdAt: string;
}
export interface PayRunItem {
  id: string;
  runId: string;
  employeeId: string;
  assignmentId: string | null;
  structureName: string | null;
  monthlyCtc: number;
  totalDays: number;
  lopDays: number;
  paidDays: number;
  gross: number;
  totalDeductions: number;
  net: number;
  lopDeduction: number;
  components: PayRunLine[];
  notes: string | null;
}
export interface PayRunDetail extends PayRun {
  items: PayRunItem[];
  approvals: PayRunApproval[];
}
export interface PayPayslip {
  id: string;
  runId: string;
  employeeId: string;
  month: number;
  year: number;
  periodLabel: string;
  gross: number;
  totalDeductions: number;
  net: number;
  lopDays: number;
  fileUrl: string;
  fileKey: string | null;
  status: string;
  generatedAt: string;
}
export type PayslipJobStatus = 'queued' | 'running' | 'completed' | 'completed_with_errors' | 'failed';
export type PayslipItemStatus = 'pending' | 'processing' | 'done' | 'failed';
export interface PayslipJob {
  id: string;
  runId: string;
  status: PayslipJobStatus;
  total: number;
  succeeded: number;
  failed: number;
  requestedBy: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  updatedAt: string;
}
export interface PayslipJobItem {
  employeeId: string;
  status: PayslipItemStatus;
  attempts: number;
  error: string | null;
  payslipId: string | null;
  updatedAt: string;
}

export interface PayBankFile {
  id: string;
  runId: string;
  month: number;
  year: number;
  periodLabel: string;
  format: BankFileFormat;
  paymentMode: PaymentMode;
  employeeCount: number;
  totalAmount: number;
  skippedCount: number;
  fileUrl: string;
  fileKey: string | null;
  generatedAt: string;
}

// ── Salary Register (reports) types ───────────────────────────────────────────
export interface RegisterColumn { code: string; name: string }
export interface RegisterRow {
  employeeId: string;
  name: string;
  designation: string | null;
  paidDays: number;
  lopDays: number;
  amounts: Record<string, number>;
  gross: number;
  totalDeductions: number;
  net: number;
}
export interface SalaryRegister {
  run: {
    id: string; periodLabel: string; status: PayRunStatus; totalDays: number;
    employeeCount: number; totalGross: number; totalDeductions: number; totalNet: number;
  };
  earningCols: RegisterColumn[];
  deductionCols: RegisterColumn[];
  rows: RegisterRow[];
  statutory: { code: string; name: string; total: number }[];
}

export type TaxRegime = 'old' | 'new';
export interface EmployeeProfile {
  id: string;
  tenantId: string;
  employeeId: string;
  pan: string | null;
  uan: string | null;
  pfNumber: string | null;
  esiNumber: string | null;
  taxRegime: TaxRegime;
  accountHolderName: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankIfsc: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface UpsertProfileInput {
  pan?: string | null;
  uan?: string | null;
  pfNumber?: string | null;
  esiNumber?: string | null;
  taxRegime: TaxRegime;
  accountHolderName?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankIfsc?: string | null;
}

// ── Employee Pay Setup types ──────────────────────────────────────────────────
export interface MemberOption {
  value: string;
  label: string;
  position: string | null;
  email: string | null;
  avatarUrl: string | null;
}

export interface AssignmentComponent {
  componentId: string;
  code: string;
  name: string;
  category: ComponentCategory;
  calculationType: StructureCalcType;
  percentageOf: ComponentPercentageOf | null;
  value: number;
  calculatedAmount: number;
  displayOrder: number;
}

export interface EmployeeAssignmentListItem {
  id: string;
  employeeId: string;
  structureId: string;
  structureName: string | null;
  structureCode: string | null;
  monthlyCtc: number;
  annualCtc: number;
  effectiveFrom: string;
  isActive: boolean;
  notes: string | null;
}

export interface EmployeeAssignmentDetail extends EmployeeAssignmentListItem {
  components: (AssignmentComponent & { id?: string })[];
  totals: StructureTotals;
}

export interface AssignInput {
  employeeId: string;
  structureId: string;
  monthlyCtc: number;
  effectiveFrom?: string;
  notes?: string | null;
}

export interface AssignPreviewResult {
  components: AssignmentComponent[];
  totals: StructureTotals;
}

// ── Payslip Template & Bank Settings types ────────────────────────────────────
export type PayslipTemplateStyle = 'modern' | 'classic' | 'minimal';
export interface PayslipTemplate {
  id: string;
  tenantId: string;
  templateStyle: PayslipTemplateStyle;
  showLogo: boolean;
  logoUrl: string | null;
  companyName: string | null;
  companyAddress: string | null;
  accentColor: string;
  footerNote: string | null;
  netPayInWords: boolean;
  showEmployeeCode: boolean;
  showEmail: boolean;
  showDesignation: boolean;
  showDepartment: boolean;
  showGrade: boolean;
  showLocation: boolean;
  showDateOfJoining: boolean;
  showBankName: boolean;
  showPan: boolean;
  showUan: boolean;
  showPfNumber: boolean;
  showEsiNumber: boolean;
  showBankAccount: boolean;
  showYtd: boolean;
  showLeaveBalance: boolean;
  showAttendanceSummary: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface UpdatePayslipTemplateInput {
  templateStyle: PayslipTemplateStyle;
  showLogo: boolean;
  logoUrl?: string | null;
  companyName?: string | null;
  companyAddress?: string | null;
  accentColor: string;
  footerNote?: string | null;
  netPayInWords: boolean;
  showEmployeeCode: boolean;
  showEmail: boolean;
  showDesignation: boolean;
  showDepartment: boolean;
  showGrade: boolean;
  showLocation: boolean;
  showDateOfJoining: boolean;
  showBankName: boolean;
  showPan: boolean;
  showUan: boolean;
  showPfNumber: boolean;
  showEsiNumber: boolean;
  showBankAccount: boolean;
  showYtd: boolean;
  showLeaveBalance: boolean;
  showAttendanceSummary: boolean;
}

export type PaymentMode = 'neft' | 'imps' | 'rtgs';
export type BankFileFormat = 'generic_csv' | 'hdfc' | 'icici' | 'sbi' | 'axis' | 'kotak';
export interface BankSettings {
  id: string;
  tenantId: string;
  companyBankName: string | null;
  companyAccountNumber: string | null;
  companyIfsc: string | null;
  paymentMode: PaymentMode;
  bankFileFormat: BankFileFormat;
  createdAt: string;
  updatedAt: string;
}
export interface UpdateBankSettingsInput {
  companyBankName?: string | null;
  companyAccountNumber?: string | null;
  companyIfsc?: string | null;
  paymentMode: PaymentMode;
  bankFileFormat: BankFileFormat;
}

// ── Approval Workflow types ───────────────────────────────────────────────────
export type ApproverType = 'manager' | 'role' | 'specific_user';
export interface ApproverOption { value: string; label: string }

export interface ApprovalStep {
  id?: string;
  workflowId?: string;
  stepOrder?: number;
  approverType: ApproverType;
  roleId: string | null;
  specificUserId: string | null;
  fallbackUserId: string | null;
}
export interface ApprovalWorkflow {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface ApprovalWorkflowListItem extends ApprovalWorkflow {
  stepCount: number;
}
export interface ApprovalWorkflowDetail extends ApprovalWorkflow {
  steps: ApprovalStep[];
}
export interface SaveWorkflowInput {
  name: string;
  description?: string | null;
  isActive: boolean;
  isDefault: boolean;
  steps: {
    approverType: ApproverType;
    roleId?: string | null;
    specificUserId?: string | null;
    fallbackUserId?: string | null;
  }[];
}

// ── Professional Tax & LWF types ──────────────────────────────────────────────
export interface PtSlab {
  id?: string;
  fromAmount: number;
  toAmount: number | null;
  monthlyAmount: number;
  displayOrder: number;
}
export interface PtState {
  id: string;
  tenantId: string;
  state: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface PtStateListItem extends PtState {
  slabCount: number;
}
export interface PtStateDetail extends PtState {
  slabs: PtSlab[];
}
export interface SavePtStateInput {
  state: string;
  isActive: boolean;
  slabs: { fromAmount: number; toAmount?: number | null; monthlyAmount: number; displayOrder: number }[];
}

export type LwfFrequency = 'monthly' | 'half_yearly' | 'yearly';
export interface LwfState {
  id: string;
  tenantId: string;
  state: string;
  employeeAmount: number;
  employerAmount: number;
  frequency: LwfFrequency;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface SaveLwfInput {
  state: string;
  employeeAmount: number;
  employerAmount: number;
  frequency: LwfFrequency;
  isActive: boolean;
}

// ── Statutory types ────────────────────────────────────────────────────────────
export interface PfConfig {
  id: string;
  tenantId: string;
  enabled: boolean;
  employeeRate: number;
  employerRate: number;
  wageCeiling: number;
  restrictToCeiling: boolean;
  includeEmployerInCtc: boolean;
  epsEnabled: boolean;
  epsRate: number;
  edliEnabled: boolean;
  edliRate: number;
  adminChargesRate: number;
  establishmentCode: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePfInput {
  enabled: boolean;
  employeeRate: number;
  employerRate: number;
  wageCeiling: number;
  restrictToCeiling: boolean;
  includeEmployerInCtc: boolean;
  epsEnabled: boolean;
  epsRate: number;
  edliEnabled: boolean;
  edliRate: number;
  adminChargesRate: number;
  establishmentCode?: string | null;
}

export interface EsiConfig {
  id: string;
  tenantId: string;
  enabled: boolean;
  employeeRate: number;
  employerRate: number;
  wageThreshold: number;
  establishmentCode: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateEsiInput {
  enabled: boolean;
  employeeRate: number;
  employerRate: number;
  wageThreshold: number;
  establishmentCode?: string | null;
}

// ── Pay Schedule & Group types ────────────────────────────────────────────────
export interface PaySchedule {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  frequency: PayFrequency;
  cycleStartDay: number;
  cycleEndDay: number;
  payDay: number;
  payInNextMonth: boolean;
  isDefault: boolean;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PayScheduleListItem extends PaySchedule {
  groupCount: number;
}

export interface SaveScheduleInput {
  name: string;
  code: string;
  frequency: PayFrequency;
  cycleStartDay: number;
  cycleEndDay: number;
  payDay: number;
  payInNextMonth: boolean;
  isDefault: boolean;
  description?: string | null;
  isActive: boolean;
}

export interface PayGroup {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  scheduleId: string;
  legalEntity: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PayGroupListItem extends PayGroup {
  scheduleName: string | null;
  scheduleCode: string | null;
}

export interface SaveGroupInput {
  name: string;
  code: string;
  scheduleId: string;
  legalEntity?: string | null;
  description?: string | null;
  isActive: boolean;
}

// ── Salary Structure types ────────────────────────────────────────────────────
export type StructureCalcType = 'fixed' | 'percentage';

export interface PayStructure {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  description: string | null;
  monthlyCtc: number;
  isActive: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PayStructureListItem extends PayStructure {
  componentCount: number;
}

export interface PayStructureLine {
  id: string;
  structureId: string;
  componentId: string;
  code: string;
  name: string;
  category: ComponentCategory;
  calculationType: StructureCalcType;
  percentageOf: ComponentPercentageOf | null;
  value: number;
  displayOrder: number;
  calculatedAmount: number;
}

export interface StructureTotals {
  totalEarnings: number;
  totalDeductions: number;
  totalBenefits: number;
  grossSalary: number;
  netSalary: number;
  ctc: number;
  balanced: boolean;
  warning?: string;
}

export interface PayStructureDetail extends PayStructure {
  lines: PayStructureLine[];
  totals: StructureTotals;
}

export interface StructureLineInput {
  componentId: string;
  calculationType: StructureCalcType;
  percentageOf?: ComponentPercentageOf | null;
  value: number;
  displayOrder: number;
}

export interface SaveStructureInput {
  name: string;
  code: string;
  description?: string | null;
  monthlyCtc: number;
  isActive: boolean;
  lines: StructureLineInput[];
}

export interface PreviewStructureInput {
  monthlyCtc: number;
  lines: StructureLineInput[];
}

export interface StructurePreviewResult extends StructureTotals {
  lines: { componentId: string; calculatedAmount: number }[];
}

export default PayrollV2Service;
