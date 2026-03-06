import { apiClient } from "@/lib/axios";

export interface LeaveBalance {
  employeeId: string;
  leaveTypeId: string;
  leaveTypeName: string;
  balance: number;
  total: number;
}

export class LeaveBalanceService {
  static async getLeaveBalances(): Promise<LeaveBalance[]> {
    try {
      const response = await apiClient.get("/api/leave-balances");
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
