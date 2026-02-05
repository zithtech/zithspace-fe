import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import { PayslipFieldService } from "@/services/payslipFieldService";
import type { PayslipFieldFormData, UpdateFieldData } from "@/services/payslipFieldService";

export const payslipFieldKeys = {
  all: ["payslip-fields"] as const,
  lists: () => [...payslipFieldKeys.all, "list"] as const,
  list: () => [...payslipFieldKeys.lists()] as const,
  details: () => [...payslipFieldKeys.all, "detail"] as const,
  detail: (id: number) => [...payslipFieldKeys.details(), id] as const,
};

/**
 * Get all payslip fields
 */
export const usePayslipFields = () => {
  return useQuery({
    queryKey: payslipFieldKeys.list(),
    queryFn: () => PayslipFieldService.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Get payslip field by ID
 */
export const usePayslipField = (id: number | null, enabled = true) => {
  return useQuery({
    queryKey: payslipFieldKeys.detail(id!),
    queryFn: () => PayslipFieldService.getById(id!),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Create payslip field
 */
export const useCreatePayslipField = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PayslipFieldFormData) => PayslipFieldService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payslipFieldKeys.list() });
      message.success("Payslip field created successfully");
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });
};

/**
 * Update payslip field
 */
export const useUpdatePayslipField = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateFieldData }) =>
      PayslipFieldService.update(id, data),
    onSuccess: (updatedField) => {
      // Update detail cache
      queryClient.setQueryData(payslipFieldKeys.detail(updatedField.id), updatedField);
      
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: payslipFieldKeys.list() });
      
      message.success("Payslip field updated successfully");
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });
};

/**
 * Toggle field status
 */
export const useToggleFieldStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => PayslipFieldService.toggleStatus(id),
    onMutate: async (id: number) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: payslipFieldKeys.list() });
      await queryClient.cancelQueries({ queryKey: payslipFieldKeys.detail(id) });

      // Snapshot previous values
      const previousFields = queryClient.getQueryData(payslipFieldKeys.list());

      // Optimistically update
      queryClient.setQueriesData(
        { queryKey: payslipFieldKeys.list() },
        (old: any) => {
          if (!old) return old;
          return old.map((field: any) =>
            field.id === id ? { ...field, status: !field.status } : field
          );
        }
      );

      return { previousFields };
    },
    onError: (error: Error, id, context) => {
      // Revert on error
      if (context?.previousFields) {
        queryClient.setQueryData(payslipFieldKeys.list(), context.previousFields);
      }
      message.error(error.message);
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: payslipFieldKeys.list() });
    },
    onSuccess: () => {
      message.success("Field status updated");
    },
  });
};

/**
 * Delete payslip field
 */
export const useDeletePayslipField = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => PayslipFieldService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payslipFieldKeys.list() });
      message.success("Payslip field deleted successfully");
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });
};