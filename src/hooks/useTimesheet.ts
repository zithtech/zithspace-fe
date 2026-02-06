import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {TimesheetsService}from '@/services/timesheetService';


/** ==================== QUERIES ==================== */

export const useTimesheets = (filters?: any) => {
  return useQuery({
    queryKey: ['timesheets', filters],
 

    queryFn: () => TimesheetsService.getTimesheets(filters),
  });
}




/** Get a single timesheet by ID */
export const useTimesheetById = (id?: string) => {
  return useQuery({
    queryKey: ['timesheet', id],
    queryFn: () => TimesheetsService.getTimesheetById(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

/** ==================== MUTATIONS ==================== */

export const useCreateTimesheet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => TimesheetsService.createTimesheet(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
    },
  });
};

export const useUpdateTimesheet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      TimesheetsService.updateTimesheet(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      queryClient.invalidateQueries({ queryKey: ['timesheet', id] });
    },
  });
};

export const useDeleteTimesheet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => TimesheetsService.deleteTimesheet(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
    },
  });
};

/** Approve or Reject timesheet */
export const useApproveTimesheet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      rejectReason,
    }: {
      id: string;
      status: 'APPROVED' | 'REJECTED';
      rejectReason?: string;
    }) => TimesheetsService.approveTimesheet(id, status, rejectReason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      queryClient.invalidateQueries({ queryKey: ['timesheet', id] });
    },
  });
};

/** ==================== COMBINED HOOK ==================== */

/** Fetch timesheet with rows together */
export const useTimesheetData = (id?: string) => {
  const timesheet = useTimesheetById(id);

  return {
    timesheet,
    isLoading: timesheet.isLoading,
    isError: timesheet.isError,
  };
};
