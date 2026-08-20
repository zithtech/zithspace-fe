import { useState, useEffect, useCallback } from "react";
import { GradeService, GradeAPIResponse, GradePayload } from "@/services/gradeService";
import { notification } from "antd";

export interface GradeViewData {
  key: string;
  id: string;
  code: string;
  codes: string;
  name: string;
  levelOrder: number;
  description?: string;
  status: "Active" | "Inactive";
  isActive: boolean;
}

const transformApiToView = (grade: GradeAPIResponse): GradeViewData => ({
  key: grade.id,
  id: grade.id,
  code: grade.code,
  codes: grade.codes || "",
  name: grade.name,
  levelOrder: grade.levelOrder,
  description: grade.description || "",
  status: grade.isActive ? "Active" : "Inactive",
  isActive: grade.isActive,
});

export const useGrades = (filters?: { page?: number; limit?: number; search?: string }) => {
  const [paginatedGrades, setPaginatedGrades] = useState<GradeViewData[]>([]);
  const [allGrades, setAllGrades] = useState<GradeViewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchGrades = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [allRes, paginatedRes]: any = await Promise.all([
        GradeService.getAllGrades({ limit: 1000 }),
        filters?.page ? GradeService.getAllGrades(filters) : Promise.resolve(null)
      ]);

      const allData = Array.isArray(allRes) ? allRes : (allRes.data || []);
      setAllGrades(allData.map(transformApiToView));

      if (paginatedRes) {
        const paginatedData = Array.isArray(paginatedRes) ? paginatedRes : (paginatedRes.data || []);
        setPaginatedGrades(paginatedData.map(transformApiToView));
        setTotalCount(paginatedRes.pagination?.total || paginatedData.length);
      } else {
        setPaginatedGrades(allData.map(transformApiToView));
        setTotalCount(allData.length);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || "Failed to load grades.";
      setError(errorMessage);
      notification.error({ message: "Error", description: errorMessage });
    } finally {
      setLoading(false);
    }
  }, [filters?.page, filters?.limit, filters?.search]);

  useEffect(() => {
    fetchGrades();
  }, [fetchGrades]);

  const addGrade = async (payload: GradePayload) => {
    try {
      await GradeService.createGrade(payload);
      await fetchGrades();
      notification.success({ message: "Grade added successfully" });
      return true;
    } catch (err: any) {
      notification.error({ message: "Error", description: err.response?.data?.error || "Failed to add grade." });
      return false;
    }
  };

  const updateGrade = async (id: string, payload: Partial<GradePayload>) => {
    try {
      await GradeService.updateGrade(id, payload);
      await fetchGrades();
      notification.success({ message: "Grade updated successfully" });
      return true;
    } catch (err: any) {
      notification.error({ message: "Error", description: err.response?.data?.error || "Failed to update grade." });
      return false;
    }
  };

  const deleteGrade = async (id: string) => {
    try {
      await GradeService.deleteGrade(id);
      setAllGrades((prev) => prev.filter((item) => item.id !== id));
      setPaginatedGrades((prev) => prev.filter((item) => item.id !== id));
      notification.success({ message: "Grade deleted successfully" });
      return true;
    } catch (err: any) {
      notification.error({ message: "Error", description: err.response?.data?.error || "Failed to delete grade." });
      return false;
    }
  };

  return {
    allGrades,
    paginatedGrades,
    loading,
    error,
    totalCount,
    fetchGrades,
    addGrade,
    updateGrade,
    deleteGrade,
  };
};
