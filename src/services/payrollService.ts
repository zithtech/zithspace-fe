import { api } from '@/lib/axios';

export interface LeaveSummary {
  casualLeave: number;
  sickLeave: number;
  permission: number;
  totalLopDays: number;
  paidLeaveTotal: number;
}

export class PayrollService {
  /**
   * Get leave summary for an employee for a specific month
   */
  static async getLeaveSummary(employeeId: string, month: string): Promise<LeaveSummary> {
    try {
      const response = await api.get<LeaveSummary>('/api/payroll/leave-summary', {
        params: { employeeId, month },
      });
      return response;
    } catch (error) {
      console.error('Error fetching leave summary:', error);
      throw new Error('Failed to fetch leave summary');
    }
  }
}
