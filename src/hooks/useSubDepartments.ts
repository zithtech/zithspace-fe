import { useState, useEffect, useCallback } from 'react';
import { SubDepartmentService, SubDepartment, CreateSubDepartmentData, UpdateSubDepartmentData } from '@/services/subDepartmentService';
import { notification } from 'antd';

export const useSubDepartments = () => {
  const [subDepartments, setSubDepartments] = useState<SubDepartment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSubDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await SubDepartmentService.getAll();
      setSubDepartments(data);
    } catch (error: any) {
      console.error("Error fetching sub-departments:", error);
      notification.error({ 
        message: "Error", 
        description: error.message || "Failed to fetch sub-departments" 
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubDepartments();
  }, [fetchSubDepartments]);

  const createSubDepartment = async (data: CreateSubDepartmentData) => {
    try {
      await SubDepartmentService.create(data);
      await fetchSubDepartments();
      return true;
    } catch (error: any) {
      notification.error({
        message: "Error",
        description: error.message || "Failed to create sub-department",
      });
      return false;
    }
  };

  const updateSubDepartment = async (id: string, data: UpdateSubDepartmentData) => {
    try {
      await SubDepartmentService.update(id, data);
      await fetchSubDepartments();
      return true;
    } catch (error: any) {
      notification.error({
        message: "Error",
        description: error.message || "Failed to update sub-department",
      });
      return false;
    }
  };

  const deleteSubDepartment = async (id: string) => {
    try {
      await SubDepartmentService.delete(id);
      await fetchSubDepartments();
      return true;
    } catch (error: any) {
      notification.error({
        message: "Error",
        description: error.message || "Failed to delete sub-department",
      });
      return false;
    }
  };

  return {
    subDepartments,
    loading,
    fetchSubDepartments,
    createSubDepartment,
    updateSubDepartment,
    deleteSubDepartment,
  };
};