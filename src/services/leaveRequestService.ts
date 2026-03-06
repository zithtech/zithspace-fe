import { apiClient } from "@/lib/axios";

export interface ApplyLeaveData {
  leaveTypeId: string;
  fromDate: string;
  toDate: string;
  employeeId: string;
  reason?: string;
}

export interface LeaveRequest {
  id: string;
  leaveTypeId: string;
  fromDate: string;
  toDate: string;
  reason?: string;
  status: string;
  leaveType: {
    name: string;
  };
  employee: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export class LeaveRequestService {
  static async applyLeave(data: ApplyLeaveData) {
    try {
      const response = await apiClient.post("/api/leave-request", data);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to apply leave",
      );
    }
  }

  static async getLeaveRequests(): Promise<LeaveRequest[]> {
    try {
      const response = await apiClient.get("/api/leave-request");
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch leave requests",
      );
    }
  }

  static async updateLeaveStatus(id: string, status: "APPROVED" | "REJECTED") {
    try {
      const response = await apiClient.put(`/api/leave-request/${id}/status`, {
        status,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to update leave status",
      );
    }
  }
  // ⭐ NEW
  static async cancelLeave(id: string) {
    const response = await apiClient.put(`/api/leave-request/${id}/cancel`);
    return response.data;
  }
}
