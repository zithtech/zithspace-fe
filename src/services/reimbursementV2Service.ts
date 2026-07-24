// src/services/reimbursementV2Service.ts
// Frontend service for the Reimbursement 2.0 backend (/api/v2/reimbursement).
// Mirrors the leaveV2Service pattern: one apiClient, unwrap(res.data), colocated
// types. Auth + tenant headers are injected by the axios interceptor.

import { apiClient } from '@/lib/axios';

const BASE = '/api/v2/reimbursement';

function unwrap<T>(data: any): T {
  return data?.data as T;
}

// ─── Types ───────────────────────────────────────────────────────────────────
export interface ReimbMailConfig {
  replyToMode: 'logged_in_user' | 'custom';
  customReplyToEmail?: string;
  reportsToEnabled: boolean;
  additionalToEmails: string[];
  customToEmails: string[];
  officeCcEnabled: boolean;
  additionalCcEmails: string[];
  customCcEmails: string[];
}

export type CategoryKind = 'amount' | 'mileage';

export interface ExpenseCategory {
  id: string;
  name: string;
  code: string;
  description: string | null;
  glCode: string | null;
  kind: CategoryKind;
  mileageRate: number | null;
  mileageUnit: string | null;
  maxPerClaim: number | null;
  monthlyLimit: number | null;
  yearlyLimit: number | null;
  perDayLimit: number | null;
  receiptRequired: boolean;
  receiptRequiredAbove: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SaveCategoryInput {
  name: string;
  code: string;
  description?: string | null;
  glCode?: string | null;
  kind?: CategoryKind;
  mileageRate?: number | null;
  mileageUnit?: string | null;
  maxPerClaim?: number | null;
  monthlyLimit?: number | null;
  yearlyLimit?: number | null;
  perDayLimit?: number | null;
  receiptRequired?: boolean;
  receiptRequiredAbove?: number | null;
  isActive?: boolean;
}

export type PolicyScopeType =
  | 'grade'
  | 'department'
  | 'subdepartment'
  | 'position'
  | 'location'
  | 'user'
  | 'org';

export interface PolicyAssignment {
  id?: string;
  scopeType: PolicyScopeType;
  scopeId?: string | null;
}

export interface PolicyLine {
  id?: string;
  categoryId: string;
  maxPerClaim?: number | null;
  monthlyLimit?: number | null;
  yearlyLimit?: number | null;
  perDayLimit?: number | null;
}

export interface ReimbursementPolicy {
  id: string;
  name: string;
  code: string;
  description: string | null;
  autoApproveBelow: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReimbursementPolicyListItem extends ReimbursementPolicy {
  assignmentCount: number;
  lineCount: number;
}

export interface ReimbursementPolicyDetail extends ReimbursementPolicy {
  assignments: PolicyAssignment[];
  lines: PolicyLine[];
}

export interface SavePolicyInput {
  name: string;
  code: string;
  description?: string | null;
  autoApproveBelow?: number | null;
  isActive?: boolean;
  assignments: PolicyAssignment[];
  lines: PolicyLine[];
}

export type ClaimStatus =
  | 'draft'
  | 'submitted'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'paid'
  | 'cancelled';

export interface ClaimItem {
  id: string;
  claimId: string;
  categoryId: string;
  categoryName?: string | null;
  categoryCode?: string | null;
  expenseDate: string;
  merchant: string | null;
  billNo: string | null;
  amount: number;
  taxAmount: number;
  distance: number | null;
  description: string | null;
}

export interface ClaimAttachment {
  id: string;
  claimId: string;
  claimItemId: string | null;
  fileName: string;
  fileUrl: string;
  fileSize: number | null;
  fileType: string | null;
  uploadedAt: string;
}

export interface Claim {
  id: string;
  userId: string;
  claimNo: string;
  title: string | null;
  status: ClaimStatus;
  totalAmount: number;
  currency: string;
  exchangeRate: number;
  baseCurrency: string;
  baseAmount: number;
  submittedAt: string | null;
  approverId: string | null;
  decidedAt: string | null;
  decisionNote: string | null;
  paidAt: string | null;
  paidBy: string | null;
  paymentReference: string | null;
  advanceId: string | null;
  projectId: string | null;
  departmentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClaimDetail extends Claim {
  items: ClaimItem[];
  attachments: ClaimAttachment[];
}

export interface ApprovalInboxItem extends Claim {
  requesterName: string | null;
  requesterEmail: string | null;
  itemCount: number;
}

export interface SaveItemInput {
  categoryId: string;
  expenseDate: string;
  merchant?: string | null;
  billNo?: string | null;
  amount?: number | null;
  distance?: number | null;
  taxAmount?: number;
  description?: string | null;
}

export interface CreateClaimInput {
  title?: string | null;
  currency?: string;
  exchangeRate?: number;
  baseCurrency?: string;
  advanceId?: string | null;
  projectId?: string | null;
  departmentId?: string | null;
  items?: SaveItemInput[];
}

export type AdvanceStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'paid'
  | 'partially_reconciled'
  | 'reconciled'
  | 'cancelled';

export interface Advance {
  id: string;
  userId: string;
  advanceNo: string;
  purpose: string | null;
  amount: number;
  currency: string;
  neededBy: string | null;
  status: AdvanceStatus;
  approverId: string | null;
  decidedAt: string | null;
  decisionNote: string | null;
  paidAt: string | null;
  paymentReference: string | null;
  reconciledAmount: number;
  outstanding: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdvanceInboxItem extends Advance {
  requesterName: string | null;
  requesterEmail: string | null;
}

export interface CreateAdvanceInput {
  purpose?: string | null;
  amount: number;
  currency?: string;
  neededBy?: string | null;
}

export type BudgetScopeType = 'org' | 'department' | 'project' | 'category' | 'user';

export interface Budget {
  id: string;
  name: string;
  scopeType: BudgetScopeType;
  scopeId: string | null;
  periodStart: string;
  periodEnd: string;
  amount: number;
  currency: string;
  isActive: boolean;
  spent: number;
  remaining: number;
  utilization: number;
  createdAt: string;
  updatedAt: string;
}

export interface SaveBudgetInput {
  name: string;
  scopeType: BudgetScopeType;
  scopeId?: string | null;
  periodStart: string;
  periodEnd: string;
  amount: number;
  currency?: string;
  isActive?: boolean;
}

export interface StatusBucket {
  status: string;
  count: number;
  total: number;
}
export interface DashboardSummary {
  byStatus: StatusBucket[];
  totals: { count: number; total: number };
}
export interface CategorySpend {
  categoryId: string;
  name: string;
  code: string;
  claims: number;
  total: number;
}
export interface UserSpend {
  userId: string;
  name: string | null;
  email: string | null;
  claims: number;
  total: number;
}

export interface Decision {
  remarks?: string | null;
}

export interface ScopeOption {
  value: string;
  label: string;
}

// Org endpoints reused to resolve policy-assignment targets (same as leaves-v2).
const SCOPE_ENDPOINTS: Record<string, string> = {
  grade: '/api/grades',
  department: '/api/departments',
  subdepartment: '/api/sub-departments',
  position: '/api/positions',
  user: '/api/members/select',
};

function toArray(raw: any): any[] {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.data?.data)) return raw.data.data;
  return [];
}

// ─── Service ─────────────────────────────────────────────────────────────────
export const ReimbursementV2Service = {
  // ── Categories ─────────────────────────────────────────────────────────────
  async listCategories(includeInactive = false): Promise<ExpenseCategory[]> {
    const res = await apiClient.get(`${BASE}/categories`, {
      params: includeInactive ? { includeInactive: true } : undefined,
    });
    return unwrap<ExpenseCategory[]>(res.data) ?? [];
  },
  async createCategory(input: SaveCategoryInput): Promise<ExpenseCategory> {
    const res = await apiClient.post(`${BASE}/categories`, input);
    return unwrap<ExpenseCategory>(res.data);
  },
  async updateCategory(id: string, input: Partial<SaveCategoryInput>): Promise<ExpenseCategory> {
    const res = await apiClient.put(`${BASE}/categories/${id}`, input);
    return unwrap<ExpenseCategory>(res.data);
  },
  async deleteCategory(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/categories/${id}`);
  },

  // ── Policies ───────────────────────────────────────────────────────────────
  async listPolicies(includeInactive = false): Promise<ReimbursementPolicyListItem[]> {
    const res = await apiClient.get(`${BASE}/policies`, {
      params: includeInactive ? { includeInactive: true } : undefined,
    });
    return unwrap<ReimbursementPolicyListItem[]>(res.data) ?? [];
  },
  async getPolicy(id: string): Promise<ReimbursementPolicyDetail> {
    const res = await apiClient.get(`${BASE}/policies/${id}`);
    return unwrap<ReimbursementPolicyDetail>(res.data);
  },
  async createPolicy(input: SavePolicyInput): Promise<ReimbursementPolicyDetail> {
    const res = await apiClient.post(`${BASE}/policies`, input);
    return unwrap<ReimbursementPolicyDetail>(res.data);
  },
  async updatePolicy(id: string, input: SavePolicyInput): Promise<ReimbursementPolicyDetail> {
    const res = await apiClient.put(`${BASE}/policies/${id}`, input);
    return unwrap<ReimbursementPolicyDetail>(res.data);
  },
  async deletePolicy(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/policies/${id}`);
  },

  // ── Claims (self-service) ──────────────────────────────────────────────────
  async validateClaim(input: CreateClaimInput): Promise<void> {
    await apiClient.post(`${BASE}/claims/validate`, input);
  },
  async listMyClaims(status?: ClaimStatus): Promise<Claim[]> {
    const res = await apiClient.get(`${BASE}/claims`, { params: status ? { status } : undefined });
    return unwrap<Claim[]>(res.data) ?? [];
  },
  async getClaim(id: string): Promise<ClaimDetail> {
    const res = await apiClient.get(`${BASE}/claims/${id}`);
    return unwrap<ClaimDetail>(res.data);
  },
  async createClaim(input: CreateClaimInput): Promise<ClaimDetail> {
    const res = await apiClient.post(`${BASE}/claims`, input);
    return unwrap<ClaimDetail>(res.data);
  },
  async updateClaim(id: string, input: Partial<CreateClaimInput>): Promise<ClaimDetail> {
    const res = await apiClient.put(`${BASE}/claims/${id}`, input);
    return unwrap<ClaimDetail>(res.data);
  },
  async deleteClaim(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/claims/${id}`);
  },
  async addItem(claimId: string, input: SaveItemInput): Promise<ClaimDetail> {
    const res = await apiClient.post(`${BASE}/claims/${claimId}/items`, input);
    return unwrap<ClaimDetail>(res.data);
  },
  async updateItem(claimId: string, itemId: string, input: Partial<SaveItemInput>): Promise<ClaimDetail> {
    const res = await apiClient.put(`${BASE}/claims/${claimId}/items/${itemId}`, input);
    return unwrap<ClaimDetail>(res.data);
  },
  async removeItem(claimId: string, itemId: string): Promise<ClaimDetail> {
    const res = await apiClient.delete(`${BASE}/claims/${claimId}/items/${itemId}`);
    return unwrap<ClaimDetail>(res.data);
  },
  async uploadReceipts(claimId: string, files: File[], claimItemId?: string): Promise<ClaimDetail> {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    if (claimItemId) form.append('claimItemId', claimItemId);
    const res = await apiClient.post(`${BASE}/claims/${claimId}/receipts`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrap<ClaimDetail>(res.data);
  },
  async removeReceipt(claimId: string, attachmentId: string): Promise<ClaimDetail> {
    const res = await apiClient.delete(`${BASE}/claims/${claimId}/receipts/${attachmentId}`);
    return unwrap<ClaimDetail>(res.data);
  },
  async submitClaim(id: string): Promise<ClaimDetail> {
    const res = await apiClient.post(`${BASE}/claims/${id}/submit`, {});
    return unwrap<ClaimDetail>(res.data);
  },
  async cancelClaim(id: string, remarks?: string): Promise<ClaimDetail> {
    const res = await apiClient.post(`${BASE}/claims/${id}/cancel`, { remarks });
    return unwrap<ClaimDetail>(res.data);
  },

  // ── Approvals (manager) ────────────────────────────────────────────────────
  async listPendingClaims(): Promise<ApprovalInboxItem[]> {
    const res = await apiClient.get(`${BASE}/approvals/pending`);
    return unwrap<ApprovalInboxItem[]>(res.data) ?? [];
  },
  async getApprovalClaim(id: string): Promise<ClaimDetail> {
    const res = await apiClient.get(`${BASE}/approvals/${id}`);
    return unwrap<ClaimDetail>(res.data);
  },
  async approveClaim(id: string, remarks?: string): Promise<ClaimDetail> {
    const res = await apiClient.post(`${BASE}/approvals/${id}/approve`, { remarks });
    return unwrap<ClaimDetail>(res.data);
  },
  async rejectClaim(id: string, remarks?: string): Promise<ClaimDetail> {
    const res = await apiClient.post(`${BASE}/approvals/${id}/reject`, { remarks });
    return unwrap<ClaimDetail>(res.data);
  },
  async sendBackClaim(id: string, remarks?: string): Promise<ClaimDetail> {
    const res = await apiClient.post(`${BASE}/approvals/${id}/send-back`, { remarks });
    return unwrap<ClaimDetail>(res.data);
  },

  // ── Finance ────────────────────────────────────────────────────────────────
  async listPayableClaims(): Promise<ApprovalInboxItem[]> {
    const res = await apiClient.get(`${BASE}/finance/payable`);
    return unwrap<ApprovalInboxItem[]>(res.data) ?? [];
  },
  async getFinanceClaim(id: string): Promise<ClaimDetail> {
    const res = await apiClient.get(`${BASE}/finance/${id}`);
    return unwrap<ClaimDetail>(res.data);
  },
  async markClaimPaid(id: string, paymentReference: string, remarks?: string): Promise<ClaimDetail> {
    const res = await apiClient.post(`${BASE}/finance/${id}/mark-paid`, { paymentReference, remarks });
    return unwrap<ClaimDetail>(res.data);
  },

  // ── Advances ───────────────────────────────────────────────────────────────
  async listMyAdvances(status?: AdvanceStatus): Promise<Advance[]> {
    const res = await apiClient.get(`${BASE}/advances`, { params: status ? { status } : undefined });
    return unwrap<Advance[]>(res.data) ?? [];
  },
  async getAdvance(id: string): Promise<Advance> {
    const res = await apiClient.get(`${BASE}/advances/${id}`);
    return unwrap<Advance>(res.data);
  },
  async requestAdvance(input: CreateAdvanceInput): Promise<Advance> {
    const res = await apiClient.post(`${BASE}/advances`, input);
    return unwrap<Advance>(res.data);
  },
  async cancelAdvance(id: string, remarks?: string): Promise<Advance> {
    const res = await apiClient.post(`${BASE}/advances/${id}/cancel`, { remarks });
    return unwrap<Advance>(res.data);
  },
  async listPendingAdvances(): Promise<AdvanceInboxItem[]> {
    const res = await apiClient.get(`${BASE}/advances/pending`);
    return unwrap<AdvanceInboxItem[]>(res.data) ?? [];
  },
  async approveAdvance(id: string, remarks?: string): Promise<Advance> {
    const res = await apiClient.post(`${BASE}/advances/${id}/approve`, { remarks });
    return unwrap<Advance>(res.data);
  },
  async rejectAdvance(id: string, remarks?: string): Promise<Advance> {
    const res = await apiClient.post(`${BASE}/advances/${id}/reject`, { remarks });
    return unwrap<Advance>(res.data);
  },
  async listPayableAdvances(): Promise<AdvanceInboxItem[]> {
    const res = await apiClient.get(`${BASE}/advances/payable`);
    return unwrap<AdvanceInboxItem[]>(res.data) ?? [];
  },
  async markAdvancePaid(id: string, paymentReference: string, remarks?: string): Promise<Advance> {
    const res = await apiClient.post(`${BASE}/advances/${id}/mark-paid`, { paymentReference, remarks });
    return unwrap<Advance>(res.data);
  },
  async reconcileAdvance(id: string): Promise<Advance> {
    const res = await apiClient.post(`${BASE}/advances/${id}/reconcile`, {});
    return unwrap<Advance>(res.data);
  },

  // ── Budgets ────────────────────────────────────────────────────────────────
  async listBudgets(includeInactive = false): Promise<Budget[]> {
    const res = await apiClient.get(`${BASE}/budgets`, {
      params: includeInactive ? { includeInactive: true } : undefined,
    });
    return unwrap<Budget[]>(res.data) ?? [];
  },
  async createBudget(input: SaveBudgetInput): Promise<Budget> {
    const res = await apiClient.post(`${BASE}/budgets`, input);
    return unwrap<Budget>(res.data);
  },
  async updateBudget(id: string, input: SaveBudgetInput): Promise<Budget> {
    const res = await apiClient.put(`${BASE}/budgets/${id}`, input);
    return unwrap<Budget>(res.data);
  },
  async deleteBudget(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/budgets/${id}`);
  },

  // ── Reports ────────────────────────────────────────────────────────────────
  async reportSummary(from?: string, to?: string): Promise<DashboardSummary> {
    const res = await apiClient.get(`${BASE}/reports/summary`, { params: { from, to } });
    return unwrap<DashboardSummary>(res.data);
  },
  async reportByCategory(from?: string, to?: string): Promise<CategorySpend[]> {
    const res = await apiClient.get(`${BASE}/reports/by-category`, { params: { from, to } });
    return unwrap<CategorySpend[]>(res.data) ?? [];
  },
  async reportByUser(from?: string, to?: string): Promise<UserSpend[]> {
    const res = await apiClient.get(`${BASE}/reports/by-user`, { params: { from, to } });
    return unwrap<UserSpend[]>(res.data) ?? [];
  },

  // ── Scope targets (for policy assignments) ──────────────────────────────────
  async getScopeOptions(scopeType: string): Promise<ScopeOption[]> {
    const ep = SCOPE_ENDPOINTS[scopeType];
    if (!ep) return [];
    const res = await apiClient.get(ep);
    const items = toArray(res.data);
    if (scopeType === 'user') {
      return items.map((m: any) => ({ value: m.value ?? m.id, label: m.label ?? m.name ?? m.workEmail }));
    }
    if (scopeType === 'position') {
      return items.map((p: any) => ({
        value: p.id,
        label: [p.title ?? p.name, p.grade?.name, p.department?.name].filter(Boolean).join(' · '),
      }));
    }
    return items.map((e: any) => ({ value: e.id, label: e.name ?? e.title ?? e.label ?? e.code }));
  },

  // ── Settings ────────────────────────────────────────────────────────────────
  async getMailSettings(): Promise<ReimbMailConfig> {
    const res = await apiClient.get(`${BASE}/settings/mail`);
    return unwrap<ReimbMailConfig>(res.data);
  },
  async updateMailSettings(data: ReimbMailConfig): Promise<ReimbMailConfig> {
    const res = await apiClient.put(`${BASE}/settings/mail`, data);
    return unwrap<ReimbMailConfig>(res.data);
  },
};

export default ReimbursementV2Service;
