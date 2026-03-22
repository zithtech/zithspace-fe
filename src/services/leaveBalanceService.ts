import { apiClient } from "@/lib/axios";

export interface LeaveBalance {
  employeeId: string;
  leaveTypeId: string;
  leaveTypeName: string;
  balance: number;
  total: number;
}

export class LeaveBalanceService {
  static async getLeaveBalances(employeeId?: string): Promise<LeaveBalance[]> {
    try {
      const url = employeeId
        ? `/api/leave-balances?employeeId=${employeeId}`
        : "/api/leave-balances";
      const response = await apiClient.get(url);
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error ||
          error.message ||
          "Failed to fetch leave balances",
      );
    }
  }
}
