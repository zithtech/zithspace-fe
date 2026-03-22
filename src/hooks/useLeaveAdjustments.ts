import { useState, useEffect, useCallback } from "react";
import {
  LeaveAdjustmentService,
  LeaveAdjustmentAPIResponse,
  LeaveAdjustmentPayload,
} from "@/services/leaveAdjustmentService";
import { notification } from "antd";
import dayjs from "dayjs";

export interface LeaveAdjustmentViewData {
  key: string;
  id: string;
  employee: string;
  employeeId: string;
  leaveType: string;
  leaveTypeId: string;
  type: string; // 'Credit' or 'Debit'
  amount: number;
  unit?: string;
  reason: string;
  approvedBy: string;
  approvedById: string | null;
  compOffWorkDate?: string | null;
  expiryDate?: string | null;
}

const transformApiToView = (
  adj: LeaveAdjustmentAPIResponse,
): LeaveAdjustmentViewData => ({
  key: adj.id,
  id: adj.id,
  employee: `${adj.employee.first_name} ${adj.employee.last_name} (${adj.employee.employee_code})`,
  employeeId: adj.employeeId,
  leaveType: adj.leaveType.name,
  leaveTypeId: adj.leaveTypeId,
  type: adj.adjustmentType,
  amount: Number(adj.amount),
  unit: adj.unit,
  reason: adj.reason,
  approvedBy: adj.approvedBy?.name || "N/A",
  approvedById: adj.approvedById,
  compOffWorkDate: adj.compOffWorkDate
    ? dayjs(adj.compOffWorkDate).toISOString()
    : null,
  expiryDate: adj.expiryDate ? dayjs(adj.expiryDate).toISOString() : null,
});

export const useLeaveAdjustments = () => {
  const [dataSource, setDataSource] = useState<LeaveAdjustmentViewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdjustments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await LeaveAdjustmentService.getLeaveAdjustments();
      setDataSource(data.map(transformApiToView));
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error || "Failed to load leave adjustments.";
      setError(errorMessage);
      notification.error({
        message: "Error",
        description: errorMessage,
        placement: "topRight",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdjustments();
  }, [fetchAdjustments]);

  const addAdjustment = async (payload: LeaveAdjustmentPayload) => {
    try {
      await LeaveAdjustmentService.createLeaveAdjustment(payload);
      await fetchAdjustments(); // Refetch to get the latest data
      notification.success({
        message: "Adjustment added successfully",
        placement: "topRight",
        duration: 3,
      });
      return true;
    } catch (err: any) {
      notification.error({
        message: "Error",
        description: err.response?.data?.error || "Failed to add adjustment.",
        placement: "topRight",
      });
      return false;
    }
  };

  const updateAdjustment = async (
    id: string,
    payload: Partial<LeaveAdjustmentPayload>,
  ) => {
    try {
      await LeaveAdjustmentService.updateLeaveAdjustment(id, payload);
      await fetchAdjustments(); // Refetch to get the latest data
      notification.success({
        message: "Adjustment updated successfully",
        placement: "topRight",
        duration: 3,
      });
      return true;
    } catch (err: any) {
      notification.error({
        message: "Error",
        description:
          err.response?.data?.error || "Failed to update adjustment.",
        placement: "topRight",
      });
      return false;
    }
  };

  const deleteAdjustment = async (id: string) => {
    try {
      await LeaveAdjustmentService.deleteLeaveAdjustment(id);
      setDataSource((prev) => prev.filter((item) => item.id !== id));
      notification.success({
        message: "Adjustment deleted successfully",
        placement: "topRight",
        duration: 3,
      });
      return true;
    } catch (err: any) {
      notification.error({
        message: "Error",
        description: "Failed to delete adjustment.",
        placement: "topRight",
      });
      return false;
    }
  };

  return {
    dataSource,
    loading,
    error,
    addAdjustment,
    updateAdjustment,
    deleteAdjustment,
  };
};
