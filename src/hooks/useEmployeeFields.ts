import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import { EmployeeFieldService } from "@/services/employeeFieldService";
import type {
  EmployeeField,
  CreateEmployeeFieldData,
  UpdateEmployeeFieldData,
} from "@/types/employeeField";

/* =======================
   Query Keys
======================= */

export const employeeFieldKeys = {
  all: ["employee-fields"] as const,
  list: (companyId: number) => [...employeeFieldKeys.all, "list", companyId] as const,
  detail: (id: number) => [...employeeFieldKeys.all, "detail", id] as const,
};

/* =======================
   Queries
======================= */

/**
 * Get all employee fields for a company
 */
export const useEmployeeFields = (companyId: number | null) => {
  return useQuery<EmployeeField[]>({
    queryKey: employeeFieldKeys.list(companyId!),
    queryFn: () => EmployeeFieldService.getAll(companyId!),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
};

/* =======================
   Mutations
======================= */

/**
 * Create employee field
 */
export const useCreateEmployeeField = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEmployeeFieldData) =>
      EmployeeFieldService.create(data),

    onSuccess: (newField, variables) => {
      // Update the cache for the specific company
      queryClient.setQueryData<EmployeeField[]>(
        employeeFieldKeys.list(variables.companyId),
        (old = []) => [...old, newField]
      );

      message.success("Employee field created successfully");
    },

    onError: (error: Error) => {
      message.error(error.message || "Failed to create employee field");
    },
  });
};

/**
 * Update employee field
 */
export const useUpdateEmployeeField = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateEmployeeFieldData }) =>
      EmployeeFieldService.update(id, data),

    onSuccess: (updatedField) => {
      // Update cache for the specific field
      queryClient.setQueryData(
        employeeFieldKeys.detail(updatedField.id),
        updatedField
      );

      // Invalidate all lists (could be optimized to update only relevant company)
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "employee-fields" &&
          query.queryKey[1] === "list",
      });

      message.success("Field updated successfully");
    },

    onError: (error: Error) => {
      message.error(error.message || "Failed to update field");
    },
  });
};

/**
 * Toggle field visibility
 */
export const useToggleFieldVisibility = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      EmployeeFieldService.toggleVisibility(id),

    onSuccess: (updatedField) => {
      // Update cache for the specific field
      queryClient.setQueryData(
        employeeFieldKeys.detail(updatedField.id),
        updatedField
      );

      // Update all list queries
      queryClient.setQueriesData<EmployeeField[]>(
        { predicate: (query) =>
            query.queryKey[0] === "employee-fields" &&
            query.queryKey[1] === "list"
        },
        (old = []) => 
          old.map((field) =>
            field.id === updatedField.id ? updatedField : field
          )
      );

      message.success(
        updatedField.isVisible
          ? "Field is now visible"
          : "Field is now hidden"
      );
    },

    onError: (error: Error) => {
      message.error(error.message || "Failed to toggle visibility");
    },
  });
};



/**
 * Delete employee field
 */
export const useDeleteEmployeeField = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      EmployeeFieldService.delete(id),

    onSuccess: (_, id) => {
      // Remove from all list queries
      queryClient.setQueriesData<EmployeeField[]>(
        { predicate: (query) =>
            query.queryKey[0] === "employee-fields" &&
            query.queryKey[1] === "list"
        },
        (old = []) => old.filter((field) => field.id !== id)
      );

      // Remove detail query
      queryClient.removeQueries({
        queryKey: employeeFieldKeys.detail(id),
      });

      message.success("Employee field deleted successfully");
    },

    onError: (error: Error) => {
      message.error(error.message || "Failed to delete field");
    },
  });
};