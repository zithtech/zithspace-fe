// /Users/manivananv/Documents/zithmi/z-internal-app/src/hooks/useEmploymentTypes.ts

import { useState, useEffect, useCallback } from "react";
import { message } from "antd";
import { employmentTypeService, EmploymentType } from "@/services/employmentTypeService";

export const useEmploymentTypes = () => {
  const [employmentTypes, setEmploymentTypes] = useState<EmploymentType[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEmploymentTypes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await employmentTypeService.getAll();
      setEmploymentTypes(data);
    } catch (error: any) {
      console.error(error);
      message.error(error.response?.data?.error || "Error fetching employment types");
    } finally {
      setLoading(false);
    }
  }, []);

  const createEmploymentType = async (values: { code: string; name: string; description?: string; isActive: boolean }) => {
    try {
      await employmentTypeService.create(values);
      message.success("Employment type created successfully");
      fetchEmploymentTypes();
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
      fetchEmploymentTypes();
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
      fetchEmploymentTypes();
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
    employmentTypes,
    loading,
    fetchEmploymentTypes,
    createEmploymentType,
    updateEmploymentType,
    deleteEmploymentType,
  };
};
