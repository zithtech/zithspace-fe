import { api } from "@/lib/axios";

export interface LeaveAdjustmentPayload {
  employeeId: string;
  leaveTypeId: string;
  adjustmentType: string; // 'Credit' or 'Debit'
  amount: number;
  unit: "Days" | "Hours";
  reason: string;
  approvedById: string;
  compOffWorkDate?: string | null;
  expiryDate?: string | null;
}

export interface LeaveAdjustmentAPIResponse {
  id: string;
  tenantId: string;
  employeeId: string;
  leaveTypeId: string;
  adjustmentType: string;
  amount: string; // Prisma Decimal is often serialized as a string
  unit: string;
  reason: string;
  approvedById: string | null;
  compOffWorkDate: string | null;
  expiryDate: string | null;
  createdById: string;
  updatedById: string | null;
  createdAt: string;
  updatedAt: string;
  employee: {
    id: string;
    first_name: string;
    last_name: string;
    employee_code: string;
  };
  leaveType: { id: string; name: string };
  approvedBy: { id: string; name: string } | null;
}

export const LeaveAdjustmentService = {
  getLeaveAdjustments: () =>
    api.get<LeaveAdjustmentAPIResponse[]>("/api/leave-adjustments"),
  createLeaveAdjustment: (payload: LeaveAdjustmentPayload) =>
    api.post<LeaveAdjustmentAPIResponse>("/api/leave-adjustments", payload),
  updateLeaveAdjustment: (
    id: string,
    payload: Partial<LeaveAdjustmentPayload>,
  ) =>
    api.put<LeaveAdjustmentAPIResponse>(
      `/api/leave-adjustments/${id}`,
      payload,
    ),
  deleteLeaveAdjustment: (id: string) =>
    api.delete(`/api/leave-adjustments/${id}`),
};
