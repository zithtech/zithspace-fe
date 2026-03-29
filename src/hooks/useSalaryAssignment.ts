import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import {
  SalaryAssignmentService,
  CreateSalaryAssignmentData,
  EmployeeSalaryAssignment,
} from "@/services/salaryAssignmentService";

export const salaryAssignmentKeys = {
  all: ["salary-assignments"] as const,
  lists: () => [...salaryAssignmentKeys.all, "list"] as const,
  byEmployee: (id: string) => [...salaryAssignmentKeys.all, "by-employee", id] as const,
};

export const useSalaryAssignments = () => {
  return useQuery<EmployeeSalaryAssignment[]>({
    queryKey: salaryAssignmentKeys.lists(),
    queryFn: () => SalaryAssignmentService.getAssignments(),
  });
};

export const useEmployeeSalaryAssignment = (employeeId: string, enabled = true) => {
  return useQuery<EmployeeSalaryAssignment>({
    queryKey: salaryAssignmentKeys.byEmployee(employeeId),
    queryFn: () => SalaryAssignmentService.getAssignmentByEmployee(employeeId),
    enabled: enabled && !!employeeId,
  });
};

export const useAssignSalaryStructure = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSalaryAssignmentData) =>
      SalaryAssignmentService.assignStructure(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salaryAssignmentKeys.all });
      message.success("Salary structure assigned successfully");
    },
    onError: (error: Error) => {
      message.error(error.message || "Failed to assign salary structure");
    },
  });
};

export const useUpdateSalaryAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateSalaryAssignmentData> }) =>
      SalaryAssignmentService.updateAssignment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salaryAssignmentKeys.all });
      message.success("Salary assignment updated successfully");
    },
    onError: (error: Error) => {
      message.error(error.message || "Failed to update salary assignment");
    },
  });
};

export const useDeleteSalaryAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => SalaryAssignmentService.deleteAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salaryAssignmentKeys.all });
      message.success("Salary assignment deleted successfully");
    },
    onError: (error: Error) => {
      message.error(error.message || "Failed to delete salary assignment");
    },
  });
};
