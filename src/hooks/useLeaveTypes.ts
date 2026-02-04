import { useState, useCallback } from "react";
import leaveTypeService, {
  LeaveType,
  CreateLeaveTypePayload,
  UpdateLeaveTypePayload,
} from "../services/leaveTypeService";

export const useLeaveTypes = () => {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaveTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await leaveTypeService.getAll();
      setLeaveTypes(data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch leave types");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createLeaveType = useCallback(
    async (data: CreateLeaveTypePayload) => {
      setError(null);
      try {
        const newLeaveType = await leaveTypeService.create(data);
        setLeaveTypes((prev) => [newLeaveType, ...prev]);
        return newLeaveType;
      } catch (err: any) {
        const msg = err.response?.data?.error || "Failed to create leave type";
        setError(msg);
        throw new Error(msg);
      }
    },
    [],
  );

  const updateLeaveType = useCallback(
    async (id: string, data: UpdateLeaveTypePayload) => {
      setError(null);
      try {
        const updatedLeaveType = await leaveTypeService.update(id, data);
        setLeaveTypes((prev) =>
          prev.map((item) => (item.id === id ? updatedLeaveType : item))
        );
        return updatedLeaveType;
      } catch (err: any) {
        const msg = err.response?.data?.error || "Failed to update leave type";
        setError(msg);
        throw new Error(msg);
      }
    },
    [],
  );

  const deleteLeaveType = useCallback(
    async (id: string) => {
      await leaveTypeService.delete(id);
      setLeaveTypes((prev) => prev.filter((item) => item.id !== id));
    },
    [],
  );

  return { leaveTypes, loading, error, fetchLeaveTypes, createLeaveType, updateLeaveType, deleteLeaveType };
};