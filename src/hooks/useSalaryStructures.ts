import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import { SalaryStructureService } from "@/services/salaryStructure.service";
import type {
  SalaryStructure,
  CreateSalaryStructureData,
  UpdateSalaryStructureData,
  SalaryStructureFilters,
  PaginatedSalaryStructureResponse,
} from "@/types/salaryStructure";

/* =======================
   Query Keys
======================= */

export const salaryStructureKeys = {
  all: ["salaryStructures"] as const,

  lists: () => [...salaryStructureKeys.all, "list"] as const,
  list: (filters: SalaryStructureFilters) =>
    [...salaryStructureKeys.lists(), filters] as const,

  details: () => [...salaryStructureKeys.all, "detail"] as const,
  detail: (id: number) => [...salaryStructureKeys.details(), id] as const,

  active: () => [...salaryStructureKeys.all, "active"] as const,
};

/* =======================
   Queries
======================= */

/**
 * Get all salary structures (paginated)
 */
export const useSalaryStructures = (filters: SalaryStructureFilters = {}) => {
  return useQuery<PaginatedSalaryStructureResponse>({
    queryKey: salaryStructureKeys.list(filters),
    queryFn: () => SalaryStructureService.getAll(filters),
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
};

/**
 * Get salary structure by ID
 */
export const useSalaryStructure = (id: number | null, enabled = true) => {
  return useQuery<SalaryStructure>({
    queryKey: salaryStructureKeys.detail(id!),
    queryFn: () => SalaryStructureService.getById(id!),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Get active salary structures
 */
export const useActiveSalaryStructures = () => {
  return useQuery<SalaryStructure[]>({
    queryKey: salaryStructureKeys.active(),
    queryFn: () => SalaryStructureService.getActive(),
    staleTime: 5 * 60 * 1000,
  });
};

/* =======================
   Mutations
======================= */

/**
 * Create salary structure
 */
export const useCreateSalaryStructure = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSalaryStructureData) =>
      SalaryStructureService.create(data),

    onSuccess: (newStructure) => {
      queryClient.invalidateQueries({
        queryKey: salaryStructureKeys.lists(),
      });

      queryClient.setQueryData(
        salaryStructureKeys.detail(newStructure.id),
        newStructure
      );

      message.success("Salary structure created successfully");
    },

    onError: (error: Error) => {
      message.error(error.message || "Failed to create salary structure");
    },
  });
};

/**
 * Update salary structure
 */
export const useUpdateSalaryStructure = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSalaryStructureData }) =>
      SalaryStructureService.update(id, data),

    onSuccess: (updatedStructure) => {
      queryClient.setQueryData(
        salaryStructureKeys.detail(updatedStructure.id),
        updatedStructure
      );

      queryClient.invalidateQueries({
        queryKey: salaryStructureKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: salaryStructureKeys.active(),
      });

      message.success("Salary structure updated successfully");
    },

    onError: (error: Error) => {
      message.error(error.message || "Failed to update salary structure");
    },
  });
};

/**
 * Toggle salary structure active status
 */
export const useToggleActiveSalaryStructure = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      SalaryStructureService.toggleActive(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: salaryStructureKeys.lists(),
      });

      const previousLists = queryClient.getQueriesData<PaginatedSalaryStructureResponse>({
        queryKey: salaryStructureKeys.lists(),
      });

      queryClient.setQueriesData<PaginatedSalaryStructureResponse>(
        { queryKey: salaryStructureKeys.lists() },
        (old) => {
          if (!old?.data) return old;

          return {
            ...old,
            data: old.data.map((structure) =>
              structure.id === id
                ? { ...structure, isActive: !structure.isActive }
                : structure
            ),
          };
        }
      );

      return { previousLists };
    },

    onError: (error: Error, _id, context) => {
      if (context?.previousLists) {
        context.previousLists.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
      message.error(error.message || "Failed to update salary structure status");
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: salaryStructureKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: salaryStructureKeys.active(),
      });
    },

    onSuccess: (updatedStructure) => {
      message.success(
        updatedStructure.isActive
          ? "Salary structure activated successfully"
          : "Salary structure deactivated successfully"
      );
    },
  });
};

/**
 * Delete salary structure
 */
export const useDeleteSalaryStructure = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      SalaryStructureService.delete(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: salaryStructureKeys.lists(),
      });

      const previousLists =
        queryClient.getQueriesData<PaginatedSalaryStructureResponse>({
          queryKey: salaryStructureKeys.lists(),
        });

      queryClient.setQueriesData<PaginatedSalaryStructureResponse>(
        { queryKey: salaryStructureKeys.lists() },
        (old) => {
          if (!old?.data) return old;

          return {
            ...old,
            data: old.data.filter(
              (structure) => structure.id !== id
            ),
            pagination: {
              ...old.pagination,
              total: old.pagination.total - 1,
              totalPages: Math.ceil(
                (old.pagination.total - 1) /
                  old.pagination.pageSize
              ),
            },
          };
        }
      );

      queryClient.removeQueries({
        queryKey: salaryStructureKeys.detail(id),
      });

      return { previousLists };
    },

    onError: (error: Error, _id, context) => {
      if (context?.previousLists) {
        context.previousLists.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
      message.error(error.message || "Failed to delete salary structure");
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: salaryStructureKeys.lists(),
      });
    },

    onSuccess: () => {
      message.success("Salary structure deleted successfully");
    },
  });
};