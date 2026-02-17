import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import { enviromentService, Enviroment } from "@/services/enviromentService";

// ==========================
// Query Keys
// ==========================

export const enviromentKeys = {
  all: ["enviroments"] as const,
  lists: () => [...enviromentKeys.all, "list"] as const,
  list: (params: any) => [...enviromentKeys.lists(), params] as const,
  details: () => [...enviromentKeys.all, "detail"] as const,
  detail: (id: string) => [...enviromentKeys.details(), id] as const,
};

// ==========================
// Queries
// ==========================

// 🔹 Get All Environments (with pagination + filters)
export const useEnviroments = (params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}) => {
  return useQuery({
    queryKey: enviromentKeys.list(params),
    queryFn: () =>
      enviromentService.getEnviroments(
        params.page,
        params.limit,
        params.search,
        params.status
      ),
    placeholderData: (previousData) => previousData,
  });
};

// 🔹 Get Single Environment
export const useEnviroment = (id: string) => {
  return useQuery({
    queryKey: enviromentKeys.detail(id),
    queryFn: () => enviromentService.getEnviromentById(id),
    enabled: !!id,
  });
};

// ==========================
// Mutations
// ==========================

// 🔹 Create
export const useCreateEnviroment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: enviromentService.createEnviroment,

    onSuccess: () => {
      message.success("Environment created successfully");
      queryClient.invalidateQueries({ queryKey: enviromentKeys.lists() });
    },

    onError: () => {
      message.error("Failed to create environment");
    },
  });
};

// 🔹 Update
export const useUpdateEnviroment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        name?: string;
        code?: string;
        status?: string;
      };
    }) => enviromentService.updateEnviroment(id, data),

    onSuccess: (_, variables) => {
      message.success("Environment updated successfully");

      // Update detail cache
      queryClient.invalidateQueries({
        queryKey: enviromentKeys.detail(variables.id),
      });

      // Refresh list
      queryClient.invalidateQueries({
        queryKey: enviromentKeys.lists(),
      });
    },

    onError: () => {
      message.error("Failed to update environment");
    },
  });
};

// 🔹 Delete (Soft Delete)
// export const useDeleteEnviroment = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: enviromentService.deleteEnviroment,

//     onSuccess: () => {
//       message.success("Environment deleted successfully");
//       queryClient.invalidateQueries({
//         queryKey: enviromentKeys.lists(),
//       });
//     },

//     onError: () => {
//       message.error("Failed to delete environment");
//     },
//   });
// };
export const useDeleteEnviroment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: enviromentService.deleteEnviroment,

    // 🔥 Optimistic Update
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: enviromentKeys.lists() });

      const previous = queryClient.getQueriesData({
        queryKey: enviromentKeys.lists(),
      });

      // remove immediately from UI
      queryClient.setQueriesData(
        { queryKey: enviromentKeys.lists() },
        (old: any) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.filter((env: any) => env.id !== id),
          };
        }
      );

      return { previous };
    },

    onError: (_, __, context) => {
      // rollback
      context?.previous?.forEach(([key, data]: any) => {
        queryClient.setQueryData(key, data);
      });
      message.error("Failed to delete environment");
    },

    onSuccess: () => {
      message.success("Environment permanently deleted");
    },
  });
};

