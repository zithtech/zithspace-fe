import { useState, useCallback, useEffect } from "react";
import { message } from "antd";
import { SalaryAdjustmentService, SalaryAdjustment, CreateAdjustmentData } from "@/services/salaryAdjustmentService";

export const useSalaryAdjustments = (employeeId?: string, selectedMonth?: string) => {
  const [adjustments, setAdjustments] = useState<SalaryAdjustment[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchAdjustments = useCallback(async () => {
    if (!employeeId || !selectedMonth) {
      setAdjustments([]);
      return [];
    }
    
    setLoading(true);
    try {
      const [year, month] = selectedMonth.split("-").map(Number);
      const data = await SalaryAdjustmentService.getAdjustments({ employeeId, month, year });
      setAdjustments(data);
      return data;
    } catch (error: any) {
      console.error("Fetch Adjustments Error:", error);
      message.error("Failed to fetch salary adjustments");
      return [];
    } finally {
      setLoading(false);
    }
  }, [employeeId, selectedMonth]);

  useEffect(() => {
    fetchAdjustments();
  }, [fetchAdjustments]);

  const saveAdjustment = async (data: any) => {
    if (!selectedMonth || !employeeId) return;

    setIsSaving(true);
    try {
      const [year, month] = selectedMonth.split("-").map(Number);
      const payload: CreateAdjustmentData = {
        employeeId,
        month,
        year,
        ...data
      };
      
      await SalaryAdjustmentService.upsertAdjustment(payload);
      message.success(data.id ? "Adjustment updated" : "Adjustment added");
      await fetchAdjustments();
      return true;
    } catch (error: any) {
      console.error("Save Adjustment Error:", error);
      message.error("Failed to save adjustment");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteAdjustment = async (id: string) => {
    try {
      await SalaryAdjustmentService.deleteAdjustment(id);
      message.success("Adjustment deleted");
      await fetchAdjustments();
      return true;
    } catch (error: any) {
      console.error("Delete Adjustment Error:", error);
      message.error("Failed to delete adjustment");
      return false;
    }
  };

  return {
    adjustments,
    loading,
    isSaving,
    fetchAdjustments,
    saveAdjustment,
    deleteAdjustment
  };
};
