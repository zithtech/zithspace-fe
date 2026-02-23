import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ReimbursementService } from '@/services/reimbursementConfig';
import {
  CreateReimbursementConfigData,
  UpdateReimbursementConfigData,
} from '@/services/reimbursementConfig';

/* ==================== QUERIES ==================== */

/** Get all reimbursement configs */
export const useReimbursementConfigs = () => {
  return useQuery({
    queryKey: ['reimbursements'],
    queryFn: () => ReimbursementService.getConfigs(),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

/** Get single config by ID */
export const useReimbursementConfigById = (id?: string) => {
  return useQuery({
    queryKey: ['reimbursement', id],
    queryFn: () => ReimbursementService.getConfigById(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};


/* ==================== MUTATIONS ==================== */

/** Create config */
export const useCreateReimbursementConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReimbursementConfigData) =>
      ReimbursementService.createConfig(data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reimbursements'] });
    },
  });
};

/** Update config */
export const useUpdateReimbursementConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateReimbursementConfigData;
    }) => ReimbursementService.updateConfig(id, data),

    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['reimbursements'] });
      queryClient.invalidateQueries({ queryKey: ['reimbursement', id] });
    },
  });
};

/** Delete config */
export const useDeleteReimbursementConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      ReimbursementService.deleteConfig(id),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reimbursements'] });
    },
  });
};


/* ==================== COMBINED HOOK ==================== */

/** Fetch single reimbursement config (wrapper like timesheet) */
export const useReimbursementConfigData = (id?: string) => {
  const reimbursement = useReimbursementConfigById(id);

  return {
    reimbursement,
    isLoading: reimbursement.isLoading,
    isError: reimbursement.isError,
  };
};