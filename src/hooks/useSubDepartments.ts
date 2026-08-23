import { useState, useEffect, useCallback } from 'react';
import { SubDepartmentService, SubDepartment, CreateSubDepartmentData, UpdateSubDepartmentData } from '@/services/subDepartmentService';
import { notification } from 'antd';

export const useSubDepartments = (filters?: { page?: number; limit?: number; search?: string; parentDepartmentId?: string | null }) => {
  const [paginatedSubDepartments, setPaginatedSubDepartments] = useState<SubDepartment[]>([]);
  const [allSubDepartments, setAllSubDepartments] = useState<SubDepartment[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const fetchSubDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const [allRes, paginatedRes]: any = await Promise.all([
        SubDepartmentService.getAll({ limit: 1000 }),
        filters?.page ? SubDepartmentService.getAll(filters) : Promise.resolve(null)
      ]);

      const allData = Array.isArray(allRes) ? allRes : (allRes.data || []);
      setAllSubDepartments(allData);

      if (paginatedRes) {
        const paginatedData = Array.isArray(paginatedRes) ? paginatedRes : (paginatedRes.data || []);
        setPaginatedSubDepartments(paginatedData);
        setTotalCount(paginatedRes.pagination?.total || paginatedData.length);
      } else {
        setPaginatedSubDepartments(allData);
        setTotalCount(allData.length);
      }
    } catch (error: any) {
      console.error("Error fetching sub-departments:", error);
      notification.error({ 
        message: "Error", 
        description: error.message || "Failed to fetch sub-departments" 
      });
    } finally {
      setLoading(false);
    }
  }, [filters?.page, filters?.limit, filters?.search, filters?.parentDepartmentId]);

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
      setAllSubDepartments(prev => prev.filter(item => item.id !== id));
      setPaginatedSubDepartments(prev => prev.filter(item => item.id !== id));
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
    allSubDepartments,
    paginatedSubDepartments,
    totalCount,
    loading,
    fetchSubDepartments,
    createSubDepartment,
    updateSubDepartment,
    deleteSubDepartment,
  };
};