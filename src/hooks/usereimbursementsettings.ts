import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ReimbursementSettingsService } from '@/services/reimbursementsettingsService';
import {
  CreateReimbursementSettingData,
  UpdateReimbursementSettingData,
} from '@/services/reimbursementsettingsService';

/* ==================== QUERIES ==================== */

/** Get all reimbursement settings */
export const useReimbursementSettings = () => {
  return useQuery({
    queryKey: ['reimbursement-settings'],
    queryFn: () => ReimbursementSettingsService.getSettings(),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

/** Get single setting by ID */
export const useReimbursementSettingById = (id?: string) => {
  return useQuery({
    queryKey: ['reimbursement-setting', id],
    queryFn: () => ReimbursementSettingsService.getSettingById(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};


/* ==================== MUTATIONS ==================== */

/** Create setting */
export const useCreateReimbursementSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReimbursementSettingData) =>
      ReimbursementSettingsService.createSetting(data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reimbursement-settings'] });
    },
  });
};

/** Update setting */
export const useUpdateReimbursementSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateReimbursementSettingData;
    }) => ReimbursementSettingsService.updateSetting(id, data),

    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['reimbursement-settings'] });
      queryClient.invalidateQueries({ queryKey: ['reimbursement-setting', id] });
    },
  });
};

/** Delete setting */
export const useDeleteReimbursementSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      ReimbursementSettingsService.deleteSetting(id),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reimbursement-settings'] });
    },
  });
};


/* ==================== COMBINED HOOK ==================== */

/** Wrapper hook (like timesheet style) */
export const useReimbursementSettingData = (id?: string) => {
  const setting = useReimbursementSettingById(id);

  return {
    setting,
    isLoading: setting.isLoading,
    isError: setting.isError,
  };
};