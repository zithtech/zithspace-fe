// /Users/manivananv/Documents/zithmi/z-internal-app/src/hooks/useLeave.ts

import { useState, useEffect } from "react";
import {
  LeaveBalanceService,
  LeaveBalance,
} from "@/services/leaveBalanceService";
import {
  LeaveRequestService,
  ApplyLeaveData,
  LeaveRequest,
} from "@/services/leaveRequestService";
import { useAuth } from "@/context/AuthContext";
import { message, notification } from "antd";
import dayjs from "dayjs";

export const useLeave = () => {
  const { user } = useAuth();
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [leaveHistory, setLeaveHistory] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [balances, history] = await Promise.all([
        LeaveBalanceService.getLeaveBalances(),
        LeaveRequestService.getLeaveRequests(),
      ]);
      setLeaveBalances(balances);
      setLeaveHistory(history);
    } catch (err: any) {
      console.error("Error fetching leave data:", err);
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const applyLeave = async (data: Omit<ApplyLeaveData, "employeeId">) => {
    setSubmitting(true);
    try {
      // Try to get employeeId from balances (most reliable as it comes from backend logic)
      // or fallback to user object if available
      const employeeId =
        leaveBalances[0]?.employeeId || (user as any)?.employeeId;

      if (!employeeId) {
        throw new Error("Employee ID not found. Please contact support.");
      }

      await LeaveRequestService.applyLeave({
        ...data,
        employeeId,
      });

      const fromDate = dayjs(data.fromDate).format("MMM D, YYYY");
      const toDate = dayjs(data.toDate).format("MMM D, YYYY");

      notification.success({
        message: "Leave Applied",
        description: `Successfully applied for leave from ${fromDate} to ${toDate}.`,
        placement: "topRight",
      });
      await fetchData(); // Refresh balances and history
      return true;
    } catch (err: any) {
      console.error("Error applying leave:", err);

      notification.error({
        message: "Leave Application Failed",
        description: err.message || "You already applied leave for this date",
        placement: "topRight",
      });

      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const updateLeaveStatus = async (
    id: string,
    status: "APPROVED" | "REJECTED",
  ) => {
    try {
      await LeaveRequestService.updateLeaveStatus(id, status);
      notification.success({
        message: `Leave ${status.toLowerCase()}ed`,
        description: `The leave request has been successfully ${status.toLowerCase()}ed.`,
        placement: "topRight",
      });
      await fetchData();
    } catch (err: any) {
      console.error("Error updating leave status:", err);
      notification.error({
        message: "Update Failed",
        description: err.message || "Failed to update leave status.",
        placement: "topRight",
      });
    }
  };
  const cancelLeaveRequest = async (id: string) => {
    try {
      await LeaveRequestService.cancelLeave(id);

      notification.success({
        message: "Leave Cancelled",
        description: "Your leave request has been successfully cancelled.",
        placement: "topRight",
      });

      await fetchData();
    } catch (err: any) {
      console.error("Error cancelling leave:", err);
      notification.error({
        message: "Cancellation Failed",
        description: err.message || "Failed to cancel the leave request.",
        placement: "topRight",
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    leaveBalances,
    leaveHistory,
    loading,
    submitting,
    error,
    refetch: fetchData,
    applyLeave,
    updateLeaveStatus,
    cancelLeaveRequest,
  };
};
