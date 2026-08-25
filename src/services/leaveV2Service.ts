import { apiClient } from '@/lib/axios';

// ── Leave 2.0 frontend service ──────────────────────────────────────────────
// Talks to the raw-SQL backend module mounted at /api/v2/leave.
// Every endpoint returns the platform envelope { success, data }.

export type LeaveUnit = 'day' | 'hour';

export interface LeaveTypeV2 {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  unit: LeaveUnit;
  isPaid: boolean;
  requiresApproval: boolean;
  color: string | null;
  description: string | null;
  isActive: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveMailConfig {
  replyToMode: 'logged_in_user' | 'custom';
  customReplyToEmail?: string;
  reportsToEnabled: boolean;
  additionalToEmails: string[];
  customToEmails: string[];
  officeCcEnabled: boolean;
  additionalCcEmails: string[];
  customCcEmails: string[];
}

export interface CreateLeaveTypeInput {
  name: string;
  code: string;
  unit?: LeaveUnit;
  isPaid?: boolean;
  requiresApproval?: boolean;
  color?: string | null;
  description?: string | null;
  isActive?: boolean;
}

export type UpdateLeaveTypeInput = Partial<CreateLeaveTypeInput>;

// ── Leave Policy ─────────────────────────────────────────────────────────────
export type PolicyScopeType =
  | 'grade'
  | 'department'
  | 'subdepartment'
  | 'position'
  | 'user'
  | 'org';

export interface LeavePolicyAssignment {
  id?: string;
  scopeType: PolicyScopeType;
  scopeId: string | null;
}

export type TermCycle = 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';
export type AccrualMethod = 'monthly' | 'term_total';

export const TERM_MONTHS: Record<TermCycle, number> = {
  monthly: 1,
  quarterly: 3,
  half_yearly: 6,
  yearly: 12,
};

export interface LeavePolicyLine {
  id?: string;
  leaveTypeId: string;
  accrualMethod: AccrualMethod;
  countPerPeriod: number;
  /** Derived total per term (server-computed; present on reads). */
  allocation?: number;
  carryForward: boolean;
  carryForwardMax: number | null;
}

export interface LeavePolicyListItem {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  termCycle: TermCycle;
  lopOnExhaustion: boolean;
  assignmentCount: number;
  lineCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface LeavePolicyDetail extends Omit<LeavePolicyListItem, 'assignmentCount' | 'lineCount'> {
  assignments: LeavePolicyAssignment[];
  lines: LeavePolicyLine[];
}

export interface SavePolicyInput {
  name: string;
  code: string;
  description?: string | null;
  isActive?: boolean;
  termCycle: TermCycle;
  lopOnExhaustion: boolean;
  assignments: LeavePolicyAssignment[];
  lines: LeavePolicyLine[];
}

export interface ScopeOption {
  value: string;
  label: string;
}

// ── Leave Requests (self-service) ────────────────────────────────────────────
export type DayPortion = 'full' | 'first_half' | 'second_half';
export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'withdrawn';
export type WithdrawalStatus = 'requested' | 'confirmed' | 'declined';

export interface LeaveBalanceItem {
  leaveTypeId: string;
  name: string;
  code: string;
  color: string | null;
  unit: LeaveUnit;
  isPaid: boolean;
  available: number;
  credited: number;
  used: number;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  leaveTypeId: string;
  fromDate: string;
  toDate: string;
  dayPortion: DayPortion;
  totalUnits: number;
  paidUnits: number;
  lopUnits: number;
  reason: string | null;
  status: LeaveRequestStatus;
  approverId?: string | null;
  decidedAt: string | null;
  decisionNote: string | null;
  createdAt: string;
  leaveTypeName?: string;
  leaveTypeColor?: string | null;
  userName?: string;
  userEmail?: string;
  userAvatarUrl?: string | null;
  approverName?: string | null;
  approverAvatarUrl?: string | null;
  // Withdrawal of an approved leave (release of unused days).
  actualUnits?: number | null;
  withdrawalStatus?: WithdrawalStatus | null;
  withdrawalRequestedUnits?: number | null;
  withdrawalNewToDate?: string | null;
  withdrawalReason?: string | null;
}

export interface ApplyLeaveInput {
  leaveTypeId: string;
  fromDate: string;
  toDate: string;
  dayPortion?: DayPortion;
  reason?: string | null;
}

// Employee's withdrawal ask: release the whole leave, or shorten it to newToDate.
export interface WithdrawLeaveInput {
  releaseAll?: boolean;
  newToDate?: string | null;
  reason?: string | null;
}

export interface WithdrawalPlan {
  mode: 'full' | 'shorten';
  actualUnits: number;
  newToDate: string | null;
  releasedTotal: number;
  releasedPaid: number;
  releasedLop: number;
  newPaid: number;
  newLop: number;
}

export interface WithdrawalResult {
  request: LeaveRequest;
  plan: WithdrawalPlan | null;
}

// ── Government Holidays ──────────────────────────────────────────────────────
export type HolidayType = 'National' | 'State' | 'Local' | 'ALL' | 'Restricted';
export type HolidayRule = 'Fixed' | 'Variable';

export interface Holiday {
  id: string;
  tenantId: string;
  name: string;
  country: string;
  states: string[];
  districts: string[];
  fromDate: string;
  toDate: string;
  type: HolidayType;
  rule: HolidayRule;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HolidayInput {
  name: string;
  country?: string;
  states?: string[];
  districts?: string[];
  fromDate: string;
  toDate: string;
  type?: HolidayType;
  rule?: HolidayRule;
  isActive?: boolean;
}

export interface CatalogHoliday {
  id: string;
  country: string;
  name: string;
  states: string[];
  districts: string[];
  fromDate: string;
  toDate: string;
  type: HolidayType;
  rule: HolidayRule;
  added: boolean;
}

// ── Leave Adjustments ────────────────────────────────────────────────────────
export type AdjustmentKind = 'credit' | 'debit' | 'comp_off' | 'opening' | 'encashment';

export interface LeaveAdjustment {
  id: string;
  userId: string;
  leaveTypeId: string;
  entryType: string;
  units: number;
  note: string | null;
  effectiveDate: string;
  createdAt: string;
  leaveTypeName: string;
  leaveTypeColor: string | null;
  userName: string;
  userEmail: string | null;
  userAvatarUrl?: string | null;
}

export interface CreateAdjustmentInput {
  employeeId: string;
  leaveTypeId: string;
  kind: AdjustmentKind;
  amount: number;
  effectiveDate?: string;
  reason?: string | null;
}

export interface EmployeeOption {
  value: string;
  label: string;
  code: string | null;
  avatarUrl?: string | null;
}

// ── Accrual (Configuration page) ─────────────────────────────────────────────
export interface AccrualSettings {
  leaveYearStartMonth: number;
  schedulerEnabled: boolean;
}
export interface AccrualLeaveTypeStat {
  leaveTypeId: string;
  leaveTypeName: string;
  employees: number;
  units: number;
}
export interface AccrualDetail {
  userId: string;
  userName: string;
  leaveTypeId: string;
  leaveTypeName: string;
  units: number;
  periodKey: string;
  prorated: boolean;
}
export interface AccrualResult {
  tenantId: string;
  year: number;
  month: number;
  leaveYearStartMonth: number;
  employees: number;
  policies: number;
  credited: number;
  skipped: number;
  dryRun: boolean;
  byLeaveType: AccrualLeaveTypeStat[];
  details: AccrualDetail[];
}

const SCOPE_ENDPOINTS: Record<Exclude<PolicyScopeType, 'org'>, string> = {
  grade: '/api/grades',
  department: '/api/departments',
  subdepartment: '/api/sub-departments',
  position: '/api/positions',
  user: '/api/members/select',
};

const BASE = '/api/v2/leave';

function unwrap<T>(data: any): T {
  return data?.data as T;
}

// Normalize the various org-entity response shapes into a flat array.
function toArray(raw: any): any[] {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.data?.data)) return raw.data.data;
  return [];
}

export const LeaveV2Service = {
  // ── Leave Types ──────────────────────────────────────────────────────────
  async listLeaveTypes(
    includeInactive = false,
    opts: { search?: string; unit?: string; paid?: string; status?: string; page?: number; pageSize?: number } = {}
  ): Promise<{ data: LeaveTypeV2[]; total: number; stats: { total: number; active: number; paid: number; approval: number } }> {
    const res = await apiClient.get(`${BASE}/types`, {
      params: { includeInactive, ...opts }
    });
    return unwrap<{ data: LeaveTypeV2[]; total: number; stats: { total: number; active: number; paid: number; approval: number } }>(res.data) ?? { data: [], total: 0, stats: { total: 0, active: 0, paid: 0, approval: 0 } };
  },

  async getLeaveType(id: string): Promise<LeaveTypeV2> {
    const res = await apiClient.get(`${BASE}/types/${id}`);
    return unwrap<LeaveTypeV2>(res.data);
  },

  async createLeaveType(input: CreateLeaveTypeInput): Promise<LeaveTypeV2> {
    const res = await apiClient.post(`${BASE}/types`, input);
    return unwrap<LeaveTypeV2>(res.data);
  },

  async updateLeaveType(id: string, input: UpdateLeaveTypeInput): Promise<LeaveTypeV2> {
    const res = await apiClient.put(`${BASE}/types/${id}`, input);
    return unwrap<LeaveTypeV2>(res.data);
  },

  async deleteLeaveType(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/types/${id}`);
  },

  // ── Leave Policies ─────────────────────────────────────────────────────────
  async listPolicies(
    includeInactive = false,
    opts: { search?: string; status?: string; page?: number; pageSize?: number } = {}
  ): Promise<{ data: LeavePolicyListItem[]; total: number; stats: { total: number; active: number; allocations: number; targets: number } }> {
    const res = await apiClient.get(`${BASE}/policies`, {
      params: { includeInactive, ...opts }
    });
    return unwrap<{ data: LeavePolicyListItem[]; total: number; stats: { total: number; active: number; allocations: number; targets: number } }>(res.data) ?? { data: [], total: 0, stats: { total: 0, active: 0, allocations: 0, targets: 0 } };
  },

  async getPolicy(id: string): Promise<LeavePolicyDetail> {
    const res = await apiClient.get(`${BASE}/policies/${id}`);
    return unwrap<LeavePolicyDetail>(res.data);
  },

  async createPolicy(input: SavePolicyInput): Promise<LeavePolicyDetail> {
    const res = await apiClient.post(`${BASE}/policies`, input);
    return unwrap<LeavePolicyDetail>(res.data);
  },

  async updatePolicy(id: string, input: SavePolicyInput): Promise<LeavePolicyDetail> {
    const res = await apiClient.put(`${BASE}/policies/${id}`, input);
    return unwrap<LeavePolicyDetail>(res.data);
  },

  async deletePolicy(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/policies/${id}`);
  },

  // ── Accrual / Configuration ────────────────────────────────────────────────
  async getAccrualSettings(): Promise<AccrualSettings> {
    const res = await apiClient.get(`${BASE}/accrual/settings`);
    return unwrap<AccrualSettings>(res.data);
  },

  async setLeaveYearStartMonth(month: number): Promise<{ leaveYearStartMonth: number }> {
    const res = await apiClient.put(`${BASE}/accrual/settings`, { leaveYearStartMonth: month });
    return unwrap<{ leaveYearStartMonth: number }>(res.data);
  },

  async runAccrual(input: { year?: number; month?: number; dryRun?: boolean }): Promise<AccrualResult> {
    const res = await apiClient.post(`${BASE}/accrual/run`, input);
    return unwrap<AccrualResult>(res.data);
  },

  // ── Leave Requests (self-service) ──────────────────────────────────────────
  async getMyBalances(): Promise<LeaveBalanceItem[]> {
    const res = await apiClient.get(`${BASE}/requests/balances`);
    return unwrap<LeaveBalanceItem[]>(res.data) ?? [];
  },

  async getMyRequests(filters?: any): Promise<any> {
    if (filters?.limit) {
      const res = await apiClient.get(`${BASE}/requests/mine`, { params: filters });
      // return the whole response object for paginated ones so caller can extract data + pagination
      return res.data;
    }
    const res = await apiClient.get(`${BASE}/requests/mine`, { params: filters });
    return unwrap<LeaveRequest[]>(res.data) ?? [];
  },

  async applyLeave(input: ApplyLeaveInput): Promise<LeaveRequest> {
    const res = await apiClient.post(`${BASE}/requests`, input);
    return unwrap<LeaveRequest>(res.data);
  },

  async updateRequest(id: string, input: ApplyLeaveInput): Promise<LeaveRequest> {
    const res = await apiClient.put(`${BASE}/requests/${id}`, input);
    return unwrap<LeaveRequest>(res.data);
  },

  async cancelRequest(id: string): Promise<void> {
    await apiClient.post(`${BASE}/requests/${id}/cancel`);
  },

  // Ask to release unused days of an approved leave (awaits the manager's confirm).
  async withdrawRequest(id: string, input: WithdrawLeaveInput): Promise<WithdrawalResult> {
    const res = await apiClient.post(`${BASE}/requests/${id}/withdraw-request`, input);
    return unwrap<WithdrawalResult>(res.data);
  },

  // Active holiday dates (YYYY-MM-DD) — excluded from the apply-leave working-day count.
  async getLeaveHolidayDates(): Promise<string[]> {
    const res = await apiClient.get(`${BASE}/requests/holidays`);
    return unwrap<string[]>(res.data) ?? [];
  },

  // ── Government Holidays ────────────────────────────────────────────────────
  async listHolidays(opts: { year?: number; includeInactive?: boolean; search?: string; type?: string; page?: number; pageSize?: number } = {}): Promise<{ data: Holiday[]; total: number; stats: { total: number; national: number; state: number; active: number } }> {
    const res = await apiClient.get(`${BASE}/holidays`, {
      params: { year: opts.year, includeInactive: opts.includeInactive ? true : undefined, search: opts.search, type: opts.type, page: opts.page, pageSize: opts.pageSize },
    });
    return unwrap<{ data: Holiday[]; total: number; stats: { total: number; national: number; state: number; active: number } }>(res.data) ?? { data: [], total: 0, stats: { total: 0, national: 0, state: 0, active: 0 } };
  },

  async createHoliday(input: HolidayInput): Promise<Holiday> {
    const res = await apiClient.post(`${BASE}/holidays`, input);
    return unwrap<Holiday>(res.data);
  },

  async updateHoliday(id: string, input: HolidayInput): Promise<Holiday> {
    const res = await apiClient.put(`${BASE}/holidays/${id}`, input);
    return unwrap<Holiday>(res.data);
  },

  async deleteHoliday(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/holidays/${id}`);
  },

  async getCatalogCountries(): Promise<string[]> {
    const res = await apiClient.get(`${BASE}/holidays/catalog/countries`);
    return unwrap<string[]>(res.data) ?? [];
  },

  async getHolidayCatalog(opts: { country: string; search?: string; type?: string; page?: number; pageSize?: number }): Promise<{ data: CatalogHoliday[]; total: number; stats: { total: number; added: number; available: number } }> {
    const res = await apiClient.get(`${BASE}/holidays/catalog`, { params: opts });
    return unwrap<{ data: CatalogHoliday[]; total: number; stats: { total: number; added: number; available: number } }>(res.data) ?? { data: [], total: 0, stats: { total: 0, added: 0, available: 0 } };
  },

  async addCatalogHolidays(catalogIds: string[]): Promise<{ added: number; skipped: number }> {
    const res = await apiClient.post(`${BASE}/holidays/catalog/add`, { catalogIds });
    return unwrap<{ added: number; skipped: number }>(res.data);
  },

  async removeCatalogHolidays(catalogIds: string[]): Promise<{ removed: number; missing: number }> {
    const res = await apiClient.post(`${BASE}/holidays/catalog/remove`, { catalogIds });
    return unwrap<{ removed: number; missing: number }>(res.data);
  },

  // ── Leave Adjustments ──────────────────────────────────────────────────────
  async listAdjustments(opts: { search?: string; dirFilter?: string; page?: number; pageSize?: number } = {}): Promise<{ data: LeaveAdjustment[]; total: number; stats: { total: number; credited: number; debited: number; net: number } }> {
    const res = await apiClient.get(`${BASE}/adjustments`, {
      params: { search: opts.search, dir: opts.dirFilter, page: opts.page, pageSize: opts.pageSize }
    });
    return unwrap<{ data: LeaveAdjustment[]; total: number; stats: { total: number; credited: number; debited: number; net: number } }>(res.data) ?? { data: [], total: 0, stats: { total: 0, credited: 0, debited: 0, net: 0 } };
  },

  async getAdjustmentEmployees(): Promise<EmployeeOption[]> {
    const res = await apiClient.get(`${BASE}/adjustments/employees`);
    return unwrap<EmployeeOption[]>(res.data) ?? [];
  },

  async getAdjustmentBalance(employeeId: string, leaveTypeId: string): Promise<number> {
    const res = await apiClient.get(`${BASE}/adjustments/balance`, { params: { employeeId, leaveTypeId } });
    return unwrap<{ available: number }>(res.data)?.available ?? 0;
  },

  async createAdjustment(input: CreateAdjustmentInput): Promise<{ entry: LeaveAdjustment; newBalance: number }> {
    const res = await apiClient.post(`${BASE}/adjustments`, input);
    return unwrap<{ entry: LeaveAdjustment; newBalance: number }>(res.data);
  },

  async deleteAdjustment(id: string): Promise<{ id: string; newBalance: number }> {
    const res = await apiClient.delete(`${BASE}/adjustments/${id}`);
    return unwrap<{ id: string; newBalance: number }>(res.data);
  },

  // ── Approvals (manager) ────────────────────────────────────────────────────
  async getApprovals(filters?: any): Promise<any> {
    if (filters?.limit) {
      const res = await apiClient.get(`${BASE}/approvals`, { params: filters });
      return res.data;
    }
    const res = await apiClient.get(`${BASE}/approvals`, { params: filters });
    return unwrap<LeaveRequest[]>(res.data) ?? [];
  },

  async approveRequest(id: string, note?: string): Promise<LeaveRequest> {
    const res = await apiClient.post(`${BASE}/approvals/${id}/approve`, { note: note ?? null });
    return unwrap<LeaveRequest>(res.data);
  },

  async rejectRequest(id: string, note?: string): Promise<LeaveRequest> {
    const res = await apiClient.post(`${BASE}/approvals/${id}/reject`, { note: note ?? null });
    return unwrap<LeaveRequest>(res.data);
  },

  // Confirm or decline an employee's withdrawal request. Confirm credits the ledger.
  async decideWithdrawal(id: string, approve: boolean, note?: string): Promise<WithdrawalResult> {
    const res = await apiClient.post(`${BASE}/approvals/${id}/withdraw-decision`, { approve, note: note ?? null });
    return unwrap<WithdrawalResult>(res.data);
  },

  async getScopeOptions(scopeType: PolicyScopeType): Promise<ScopeOption[]> {
    if (scopeType === 'org') return [];
    const res = await apiClient.get(SCOPE_ENDPOINTS[scopeType]);
    const items = toArray(res.data);
    if (scopeType === 'user') {
      return items.map((m: any) => ({ value: m.value ?? m.id, label: m.label ?? m.name }));
    }
    return items.map((e: any) => ({ value: e.id, label: e.name ?? e.title ?? e.label ?? e.code }));
  },

  // ─── Settings ─────────────────────────────────────────────────────────

  async getMailSettings(): Promise<LeaveMailConfig> {
    const { data } = await apiClient.get('/api/v2/leave/settings/mail');
    return data.data;
  },

  async updateMailSettings(payload: LeaveMailConfig): Promise<LeaveMailConfig> {
    const { data } = await apiClient.put('/api/v2/leave/settings/mail', payload);
    return data.data;
  }
};

export default LeaveV2Service;
