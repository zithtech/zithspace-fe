// src/hooks/usePositions.ts
import { useState, useEffect, useCallback } from "react";
import { Position, PositionService, CreatePositionData, UpdatePositionData } from "@/services/positionService";
import { notification } from "antd";

export interface PositionViewData {
  key: string;
  id: string;
  code: string;
  title: string;
  departmentId: string;
  subDepartmentId?: string | null;
  gradeId: string;
  description?: string | null;
  status: "Active" | "Inactive";
  isActive: boolean;
  departmentName?: string;
  subDepartmentName?: string;
  gradeName?: string;
}

const transformApiToView = (position: Position): PositionViewData => ({
  key: position.id,
  id: position.id,
  code: position.code,
  title: position.title,
  departmentId: position.departmentId,
  subDepartmentId: position.subDepartmentId,
  gradeId: position.gradeId,
  description: position.description || "",
  status: position.isActive ? "Active" : "Inactive",
  isActive: position.isActive,
  departmentName: position.department?.name,
  subDepartmentName: position.subDepartment?.name,
  gradeName: position.grade?.name,
});

export const usePositions = () => {
  const [dataSource, setDataSource] = useState<PositionViewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPositions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await PositionService.getAll();
      setDataSource(data.map(transformApiToView));
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || "Failed to load positions.";
      setError(errorMessage);
      notification.error({ message: "Error", description: errorMessage });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  const createPosition = async (data: CreatePositionData) => {
    try {
      await PositionService.create(data);
      await fetchPositions();
      notification.success({ message: "Position added successfully" });
      return true;
    } catch (err: any) {
      notification.error({ message: "Error", description: err.response?.data?.error || "Failed to add position." });
      return false;
    }
  };

  const updatePosition = async (id: string, data: UpdatePositionData) => {
    try {
      await PositionService.update(id, data);
      await fetchPositions();
      notification.success({ message: "Position updated successfully" });
      return true;
    } catch (err: any) {
      notification.error({ message: "Error", description: err.response?.data?.error || "Failed to update position." });
      return false;
    }
  };

  const deletePosition = async (id: string) => {
    try {
      await PositionService.delete(id);
      setDataSource((prev) => prev.filter((item) => item.id !== id));
      notification.success({ message: "Position deleted successfully" });
      return true;
    } catch (err: any) {
      notification.error({ message: "Error", description: err.response?.data?.error || "Failed to delete position." });
      return false;
    }
  };

  return {
    dataSource,
    loading,
    error,
    fetchPositions,
    createPosition,
    updatePosition,
    deletePosition,
  };
};
