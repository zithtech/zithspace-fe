import { useState, useEffect, useCallback } from "react";
import { Department, DepartmentService, CreateDepartmentData, UpdateDepartmentData } from "@/services/departmentService";
import { notification } from "antd";

export const useDepartments = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await DepartmentService.getAll();
      setDepartments(data);
    } catch (error: any) {
      console.error(error);
      notification.error({
        message: "Error",
        description: error.message || "Failed to fetch departments",
      });
    } finally {
      setLoading(false);
    }
  }, []);

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
      await fetchDepartments();
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
    departments,
    loading,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    refresh: fetchDepartments,
  };
};
