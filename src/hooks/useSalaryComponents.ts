import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";

import {
  SalaryComponentsService,
  SalaryComponent,
  CreateSalaryComponentData,
  UpdateSalaryComponentData,
  SalaryComponentFilters,
} from "@/services/salaryComponentService";
import { PaginatedResponse } from "@/lib/axios";



export const salaryComponentKeys = {
  all: ["salary-components"] as const,

  lists: () => [...salaryComponentKeys.all, "list"] as const,
  list: (filters: SalaryComponentFilters) =>
    [...salaryComponentKeys.lists(), filters] as const,

  details: () => [...salaryComponentKeys.all, "detail"] as const,
  detail: (id: number) =>
    [...salaryComponentKeys.details(), id] as const,
};

/**
 * Get salary components (paginated list)
 */
export const useSalaryComponents = (
  filters: SalaryComponentFilters = {}
) => {
  return useQuery<PaginatedResponse<SalaryComponent>>({
    queryKey: salaryComponentKeys.list(filters),
    queryFn: () =>
      SalaryComponentsService.getSalaryComponents(filters),

    staleTime: 5 * 60 * 1000,

    // ✅ v5 replacement for keepPreviousData
    placeholderData: (previousData) => previousData,
  });
};

/**
 * Get single salary component by ID
 */
export const useSalaryComponent = (
  id: number,
  enabled = true
) => {
  return useQuery<SalaryComponent>({
    queryKey: salaryComponentKeys.detail(id),
    queryFn: () =>
      SalaryComponentsService.getSalaryComponent(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
  });
};


/**
 * Create salary component
 */
export const useCreateSalaryComponent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSalaryComponentData) =>
      SalaryComponentsService.createSalaryComponent(data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: salaryComponentKeys.lists(),
      });
      message.success("Salary component created successfully");
    },

    onError: (error: Error) => {
      message.error(error.message);
    },
  });
};

/**
 * Update salary component
 */
export const useUpdateSalaryComponent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: UpdateSalaryComponentData;
    }) =>
      SalaryComponentsService.updateSalaryComponent(id, data),

    onSuccess: (updatedComponent) => {
      // update detail cache
      queryClient.setQueryData(
        salaryComponentKeys.detail(updatedComponent.key),
        updatedComponent
      );

      // refresh lists
      queryClient.invalidateQueries({
        queryKey: salaryComponentKeys.lists(),
      });

      message.success("Salary component updated successfully");
    },

    onError: (error: Error) => {
      message.error(error.message);
    },
  });
};

/**
 * Update salary component status only
 */
// export const useUpdateSalaryStatus = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: ({
//       id,
//       status,
//     }: {
//       id: number;
//       status: boolean;
//     }) =>
//       SalaryComponentsService.updateSalaryComponentStatus(
//         id,
//         status
//       ),

//     onSuccess: () => {
//       queryClient.invalidateQueries({
//         queryKey: salaryComponentKeys.lists(),
//       });
//       message.success("Status updated successfully");
//     },

//     onError: (error: Error) => {
//       message.error(error.message);
//     },
//   });
// };

export const useUpdateSalaryStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      key,
      status,
    }: {
      key: number; // use key instead of id
      status: boolean;
    }) =>
      SalaryComponentsService.updateSalaryComponentStatus(key, status),

    // 🔥 OPTIMISTIC UPDATE
    onMutate: async ({ key, status }) => {
      // Stop outgoing refetches
      await queryClient.cancelQueries({
        queryKey: salaryComponentKeys.lists(),
      });

      // Snapshot previous state
      const previousQueries =
        queryClient.getQueriesData<PaginatedResponse<SalaryComponent>>({
          queryKey: salaryComponentKeys.lists(),
        });

      // Update ALL paginated lists instantly
      previousQueries.forEach(([queryKey, oldData]) => {
        if (!oldData) return;

        queryClient.setQueryData(queryKey, {
          ...oldData,
          data: oldData.data.map((item) =>
            item.key === key ? { ...item, status } : item // ✅ use key
          ),
        });
      });

      return { previousQueries };
    },

    // ❌ API FAIL → revert
    onError: (_err, _vars, context) => {
      context?.previousQueries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      message.error("Status update failed ❌");
    },

    // 🔄 Sync with backend
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: salaryComponentKeys.lists(),
      });
    },
  });
};




export const useDeleteSalaryComponent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      SalaryComponentsService.deleteSalaryComponent(id),

    onSuccess: () => {
      message.success("Salary component deleted");
      queryClient.invalidateQueries({
        queryKey: ["salary-components"],
      });
    },

    onError: (error: any) => {
      message.error(error.message || "Delete failed");
    },
  });
};