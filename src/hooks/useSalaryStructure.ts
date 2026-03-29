import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import {
  SalaryStructureService,
  SalaryStructure,
  CreateSalaryStructureData,
  UpdateSalaryStructureData,
} from "@/services/salaryStructureService";

export const salaryStructureKeys = {
  all: ["salary-structures"] as const,
  lists: () => [...salaryStructureKeys.all, "list"] as const,
  details: () => [...salaryStructureKeys.all, "detail"] as const,
  detail: (id: string) => [...salaryStructureKeys.details(), id] as const,
};

export const useSalaryStructures = () => {
  return useQuery<SalaryStructure[]>({
    queryKey: salaryStructureKeys.lists(),
    queryFn: () => SalaryStructureService.getSalaryStructures(),
  });
};

export const useSalaryStructure = (id: string, enabled = true) => {
  return useQuery<SalaryStructure>({
    queryKey: salaryStructureKeys.detail(id),
    queryFn: () => SalaryStructureService.getSalaryStructure(id),
    enabled: enabled && !!id,
  });
};

export const useCreateSalaryStructure = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSalaryStructureData) =>
      SalaryStructureService.createSalaryStructure(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: salaryStructureKeys.lists(),
      });
      message.success("Salary structure created successfully");
    },
    onError: (error: Error) => {
      message.error(error.message || "Failed to create salary structure");
    },
  });
};

export const useUpdateSalaryStructure = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSalaryStructureData }) =>
      SalaryStructureService.updateSalaryStructure(id, data),
    onSuccess: (updatedStructure: SalaryStructure) => {
      queryClient.invalidateQueries({
        queryKey: salaryStructureKeys.lists(),
      });
      if (updatedStructure?.id) {
        queryClient.invalidateQueries({
          queryKey: salaryStructureKeys.detail(updatedStructure.id),
        });
      }
      message.success("Salary structure updated successfully");
    },
    onError: (error: Error) => {
      message.error(error.message || "Failed to update salary structure");
    },
  });
};

export const useDeleteSalaryStructure = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => SalaryStructureService.deleteSalaryStructure(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: salaryStructureKeys.lists(),
      });
      message.success("Salary structure deleted successfully");
    },
    onError: (error: Error) => {
      message.error(error.message || "Failed to delete salary structure");
    },
  });
};

export const useUpdateSalaryStructureStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      SalaryStructureService.updateSalaryStructureStatus(id, isActive),
    onSuccess: (updatedStructure: SalaryStructure) => {
      queryClient.invalidateQueries({
        queryKey: salaryStructureKeys.lists(),
      });
      if (updatedStructure?.id) {
        queryClient.invalidateQueries({
          queryKey: salaryStructureKeys.detail(updatedStructure.id),
        });
      }
      message.success("Structure status updated successfully");
    },
    onError: (error: Error) => {
      message.error(error.message || "Failed to update status");
    },
  });
};

export const useCalculateSalaryPreview = () => {
  return useMutation({
    mutationFn: ({ grossSalary, components }: { grossSalary: number; components: any[] }) =>
      SalaryStructureService.calculatePreview(grossSalary, components),
  });
};
