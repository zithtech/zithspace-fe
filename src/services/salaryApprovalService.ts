import { api } from '@/lib/axios';

export interface WorkflowStep {
  id?: string;
  stepOrder: number;
  approverType: "MANAGER" | "ROLE" | "SPECIFIC_USER";
  roleId?: string;
  specificUserId?: string;
  fallbackUserId?: string;
  role?: { id: string; name: string };
  specificUser?: { id: string; name: string; workEmail: string };
  fallbackUser?: { id: string; name: string; workEmail: string };
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  version: number;
  steps: WorkflowStep[];
}

export interface UpsertWorkflowData {
  id?: string;
  name: string;
  description?: string;
  steps: Array<{
    approverType: string;
    roleId?: string;
    specificUserId?: string;
    fallbackUserId?: string;
    stepOrder: number;
  }>;
}

export class SalaryApprovalService {
  /**
   * GET /api/salary-approvals/workflows
   * Returns active, non-deleted workflows for the tenant.
   */
  static async getWorkflows(): Promise<Workflow[]> {
    return api.get<Workflow[]>('/api/salary-approvals/workflows');
  }

  /**
   * POST /api/salary-approvals/workflows
   * Creates or updates (versions) a workflow.
   */
  /**
   * POST /api/salary-approvals/workflows
   * Creates or updates (versions) a workflow.
   */
  static async upsertWorkflow(data: UpsertWorkflowData): Promise<Workflow> {
    return api.post<Workflow>('/api/salary-approvals/workflows', data);
  }

  /**
   * DELETE /api/salary-approvals/workflows/:id
   * Soft deletes a workflow.
   */
  static async deleteWorkflow(id: string): Promise<void> {
    return api.delete(`/api/salary-approvals/workflows/${id}`);
  }

  /**
   * GET /api/salary-approvals/pending
   * Returns payouts awaiting current user's approval.
   */
  static async getPendingApprovals(): Promise<any[]> {
    return api.get<any[]>('/api/salary-approvals/pending');
  }

  /**
   * GET /api/salary-approvals
   * Returns all payout approval records.
   */
  static async getAllApprovals(): Promise<any[]> {
    return api.get<any[]>('/api/salary-approvals');
  }

  /**
   * POST /api/salary-approvals/process-step
   * Approves or rejects a payout.
   */
  static async processApprovalStep(data: { salaryPayoutId: string; action: 'APPROVE' | 'REJECT'; remarks?: string }): Promise<any> {
    return api.post('/api/salary-approvals/process-step', data);
  }

  /**
   * GET /api/salary-approvals/payouts
   */
  static async getApprovedPayouts(month?: number, year?: number): Promise<any[]> {
    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());
    
    return api.get(`/api/salary-approvals/payouts?${params.toString()}`);
  }

  /**
   * GET /api/salary-approvals/export-excel
   */
  static async exportToBankExcel(month: number, year: number): Promise<Blob> {
    return api.get(`/api/salary-approvals/export-excel?month=${month}&year=${year}`, {
      responseType: 'blob'
    });
  }

  /**
   * POST /api/salary-approvals/send-to-bank
   */
  static async sendToBankEmail(month: number, year: number, toEmail: string): Promise<any> {
    return api.post('/api/salary-approvals/send-to-bank', { month, year, toEmail });
  }

  // --- New Persistent Bank File Flow ---

  /**
   * POST /api/salary-approvals/bank-file/generate
   */
  static async generateBankFile(month: number, year: number): Promise<any> {
    return api.post('/api/salary-approvals/bank-file/generate', { month, year });
  }

  /**
   * GET /api/salary-approvals/bank-file/latest
   */
  static async getLatestBankFile(month: number, year: number): Promise<any> {
    return api.get(`/api/salary-approvals/bank-file/latest?month=${month}&year=${year}`);
  }

  /**
   * POST /api/salary-approvals/bank-file/send
   */
  static async sendBankFileEmail(bankFileId: string, toEmail: string): Promise<any> {
    return api.post('/api/salary-approvals/bank-file/send', { bankFileId, toEmail });
  }

  /**
   * POST /api/payroll/mark-as-paid
   */
  static async markAsPaid(month: number, year: number): Promise<any> {
    return api.post('/api/payroll/mark-as-paid', { month, year });
  }
}
