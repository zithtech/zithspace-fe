import { useState, useEffect, useCallback } from 'react';
import { SubDepartmentService, SubDepartment } from '@/services/subDepartmentService';
import { notification } from 'antd';

export const useSubDepartments = () => {
  const [subDepartments, setSubDepartments] = useState<SubDepartment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSubDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await SubDepartmentService.getAll();
      setSubDepartments(data);
    } catch (error) {
      console.error("Error fetching sub-departments:", error);
      notification.error({ message: "Failed to fetch sub-departments" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubDepartments();
  }, [fetchSubDepartments]);

  return {
    subDepartments,
    loading,
    fetchSubDepartments,
    createSubDepartment: SubDepartmentService.create,
    updateSubDepartment: SubDepartmentService.update,
    deleteSubDepartment: SubDepartmentService.delete,
  };
};