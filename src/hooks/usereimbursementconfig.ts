











import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ReimbursementConfigurationService } from "@/services/reimbursementConfig";
import {
  CreateReimbursementConfigurationData,
  UpdateReimbursementConfigurationData,
} from "@/services/reimbursementConfig";


/* ==================== QUERIES ==================== */

/** Get all */
// export const useReimbursementConfigurations = () => {
//   return useQuery({
//     queryKey: ["reimbursement-configurations"],
//     queryFn: () =>
//       ReimbursementConfigurationService.getConfigurations(),
//     staleTime: 2 * 60 * 1000,
//     gcTime: 5 * 60 * 1000,
//   });
// };
export const useReimbursementConfigurations = () => {
  return useQuery({
    queryKey: ['reimbursement-configurations'],
    queryFn: async () => {
      const data = await ReimbursementConfigurationService.getConfigurations();
      console.log('Hook received data:', data); // Debug log
      return data;
    },
  });
  
};

/** Get by ID */
export const useReimbursementConfigurationById = (id?: string) => {
  return useQuery({
    queryKey: ["reimbursement-configuration", id],
    queryFn: () =>
      ReimbursementConfigurationService.getConfigurationById(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

/* ==================== MUTATIONS ==================== */

/** Create */
export const useCreateReimbursementConfiguration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReimbursementConfigurationData) =>
      ReimbursementConfigurationService.createConfiguration(data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["reimbursement-configurations"],
      });
    },
  });
};

/** Update */
export const useUpdateReimbursementConfiguration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateReimbursementConfigurationData;
    }) =>
      ReimbursementConfigurationService.updateConfiguration(id, data),

    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({
        queryKey: ["reimbursement-configurations"],
      });
      queryClient.invalidateQueries({
        queryKey: ["reimbursement-configuration", id],
      });
    },
  });
};

/** Delete */
export const useDeleteReimbursementConfiguration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      ReimbursementConfigurationService.deleteConfiguration(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["reimbursement-configurations"],
      });
    },
  });
};

/* ==================== WRAPPER ==================== */

export const useReimbursementConfigurationData = (id?: string) => {
  const configuration = useReimbursementConfigurationById(id);

  return {
    configuration,
    isLoading: configuration.isLoading,
    isError: configuration.isError,
  };
};



