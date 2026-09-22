// /Users/manivananv/Documents/zithmi/z-internal-app/src/hooks/useEmploymentTypes.ts

import { useState, useEffect, useCallback } from "react";
import { message } from "antd";
import { employmentTypeService, EmploymentType } from "@/services/employmentTypeService";

export const useEmploymentTypes = (filters?: { page?: number; limit?: number; search?: string }) => {
  const [paginatedEmploymentTypes, setPaginatedEmploymentTypes] = useState<EmploymentType[]>([]);
  const [allEmploymentTypes, setAllEmploymentTypes] = useState<EmploymentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const fetchEmploymentTypes = useCallback(async () => {
    setLoading(true);
    try {
      const [allRes, paginatedRes]: any = await Promise.all([
        employmentTypeService.getAll({ limit: 1000 }),
        filters?.page ? employmentTypeService.getAll(filters) : Promise.resolve(null),
      ]);

      const allData = Array.isArray(allRes) ? allRes : (allRes.data || []);
      setAllEmploymentTypes(allData);

      if (paginatedRes) {
        const paginatedData = Array.isArray(paginatedRes) ? paginatedRes : (paginatedRes.data || []);
        setPaginatedEmploymentTypes(paginatedData);
        setTotalCount(paginatedRes.pagination?.total || paginatedData.length);
      } else {
        setPaginatedEmploymentTypes(allData);
        setTotalCount(allData.length);
      }
    } catch (error: any) {
      console.error(error);
      message.error(error.response?.data?.error || "Error fetching employment types");
    } finally {
      setLoading(false);
    }
  }, [filters?.page, filters?.limit, filters?.search]);

  const createEmploymentType = async (values: { code: string; name: string; description?: string; isActive: boolean }) => {
    try {
      await employmentTypeService.create(values);
      message.success("Employment type created successfully");
      await fetchEmploymentTypes();
      return true;
    } catch (error: any) {
      message.error(error.response?.data?.error || "Error creating employment type");
      return false;
    }
  };

  const updateEmploymentType = async (id: string, values: { code?: string; name?: string; description?: string; isActive?: boolean }) => {
    try {
      await employmentTypeService.update(id, values);
      message.success("Employment type updated successfully");
      await fetchEmploymentTypes();
      return true;
    } catch (error: any) {
      message.error(error.response?.data?.error || "Error updating employment type");
      return false;
    }
  };

  const deleteEmploymentType = async (id: string) => {
    try {
      await employmentTypeService.delete(id);
      message.success("Employment type deleted successfully");
      await fetchEmploymentTypes();
      return true;
    } catch (error: any) {
      message.error(error.response?.data?.error || "Error deleting employment type");
      return false;
    }
  };

  useEffect(() => {
    fetchEmploymentTypes();
  }, [fetchEmploymentTypes]);

  return {
    employmentTypes: allEmploymentTypes,
    allEmploymentTypes,
    paginatedEmploymentTypes,
    totalCount,
    loading,
    fetchEmploymentTypes,
    createEmploymentType,
    updateEmploymentType,
    deleteEmploymentType,
  };
};
