import { useState, useEffect, useCallback } from "react";
import { Department, DepartmentService, CreateDepartmentData, UpdateDepartmentData } from "@/services/departmentService";
import { notification } from "antd";

export const useDepartments = (filters?: { page?: number; limit?: number; search?: string }) => {
  const [paginatedDepartments, setPaginatedDepartments] = useState<Department[]>([]);
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const [allRes, paginatedRes]: any = await Promise.all([
        DepartmentService.getAll({ limit: 1000 }),
        filters?.page ? DepartmentService.getAll(filters) : Promise.resolve(null)
      ]);

      const allData = Array.isArray(allRes) ? allRes : (allRes.data || []);
      setAllDepartments(allData);

      if (paginatedRes) {
        const paginatedData = Array.isArray(paginatedRes) ? paginatedRes : (paginatedRes.data || []);
        setPaginatedDepartments(paginatedData);
        setTotalCount(paginatedRes.pagination?.total || paginatedData.length);
      } else {
        setPaginatedDepartments(allData);
        setTotalCount(allData.length);
      }
    } catch (error: any) {
      console.error(error);
      notification.error({
        message: "Error",
        description: error.message || "Failed to fetch departments",
      });
    } finally {
      setLoading(false);
    }
  }, [filters?.page, filters?.limit, filters?.search]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const createDepartment = async (data: CreateDepartmentData) => {
    try {
      await DepartmentService.create(data);
      await fetchDepartments();
      return true;
    } catch (error: any) {
      notification.error({
        message: "Error",
        description: error.message || "Failed to create department",
      });
      return false;
    }
  };

  const updateDepartment = async (id: string, data: UpdateDepartmentData) => {
    try {
      await DepartmentService.update(id, data);
      await fetchDepartments();
      return true;
    } catch (error: any) {
      notification.error({
        message: "Error",
        description: error.message || "Failed to update department",
      });
      return false;
    }
  };

  const deleteDepartment = async (id: string) => {
    try {
      await DepartmentService.delete(id);
      setAllDepartments((prev) => prev.filter((d) => d.id !== id));
      setPaginatedDepartments((prev) => prev.filter((d) => d.id !== id));
      return true;
    } catch (error: any) {
      notification.error({
        message: "Error",
        description: error.message || "Failed to delete department",
      });
      return false;
    }
  };

  return {
    allDepartments,
    paginatedDepartments,
    totalCount,
    loading,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    refresh: fetchDepartments,
  };
};
