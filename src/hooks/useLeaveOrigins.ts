// src/hooks/useLeaveOrigins.ts
import { useState, useEffect, useCallback } from "react";
import { leaveOriginService, LeaveOriginStructure } from "@/services/leaveOriginService";
import { message } from "antd";

export const useLeaveOrigins = () => {
  const [leaveOrigins, setLeaveOrigins] = useState<LeaveOriginStructure[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLeaveOrigins = useCallback(async () => {
    setLoading(true);
    try {
      const data = await leaveOriginService.getAll();
      setLeaveOrigins(data);
    } catch (error) {
      console.error("Failed to fetch leave origins:", error);
      message.error("Failed to fetch position configurations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaveOrigins();
  }, [fetchLeaveOrigins]);

  return {
    leaveOrigins,
    loading,
    refetch: fetchLeaveOrigins,
  };
};
