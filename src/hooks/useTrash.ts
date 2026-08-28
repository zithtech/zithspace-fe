import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import TrashService, { TrashTicket } from '@/services/trashService';
import { message } from 'antd';

/**
 * Trash Hooks
 * 
 * React Query hooks for trash/soft-delete operations.
 * Follows the same pattern as useTickets for consistency.
 */

// ==================== Query Keys ====================

export const trashKeys = {
  all: ['trash'] as const,
  lists: () => [...trashKeys.all, 'list'] as const,
  list: (params: any) => [...trashKeys.lists(), params] as const,
};

// ==================== Query Hooks ====================

/**
 * Get trash tickets with pagination and filters
 * 
 * @param params - Filter parameters
 * @returns Query result with trash tickets
 */
export function useTrashTickets(params: {
  page?: number;
  limit?: number;
  projectId?: string;
  search?: string;
  status?: string;
  deletedBy?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  enabled?: boolean;
} = {}) {
  const { enabled = true, ...restParams } = params;
  return useQuery({
    queryKey: trashKeys.list(restParams),
    queryFn: () => TrashService.getTrashTickets(restParams),
    staleTime: 30 * 1000, // 30 seconds (trash changes frequently)
    placeholderData: keepPreviousData,
    enabled,
  });
}

// ==================== Mutation Hooks ====================

/**
 * Move tickets to trash (soft delete)
 */
export function useMoveToTrash() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ticketIds: string[]) => TrashService.moveToTrash(ticketIds),
    onSuccess: (data) => {
      // Invalidate trash lists to refresh
      queryClient.invalidateQueries({ queryKey: trashKeys.lists() });
      
      // Invalidate ticket lists (they were removed from active lists)
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      
      message.success(`${data.deletedCount} ticket(s) moved to trash`);
    },
    onError: (error: Error) => {
      message.error(error.message || 'Failed to move tickets to trash');
    },
  });
}

/**
 * Restore tickets from trash
 */
export function useRestoreFromTrash() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ticketIds: string[]) => TrashService.restoreFromTrash(ticketIds),
    onSuccess: (data) => {
      // Invalidate trash lists (tickets removed from trash)
      queryClient.invalidateQueries({ queryKey: trashKeys.lists() });
      
      // Invalidate ticket lists (tickets restored to active)
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      
      message.success(`${data.restoredCount} ticket(s) restored from trash`);
    },
    onError: (error: Error) => {
      message.error(error.message || 'Failed to restore tickets');
    },
  });
}

/**
 * Permanently delete tickets from trash
 * This action cannot be undone
 */
export function usePermanentlyDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ticketIds: string[]) => TrashService.permanentlyDelete(ticketIds),
    onSuccess: (data) => {
      // Invalidate trash lists
      queryClient.invalidateQueries({ queryKey: trashKeys.lists() });
      
      message.success(`${data.deletedCount} ticket(s) permanently deleted`);
    },
    onError: (error: Error) => {
      message.error(error.message || 'Failed to permanently delete tickets');
    },
  });
}

/**
 * Empty trash - permanently delete all tickets in trash
 */
export function useEmptyTrash() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, force = false }: { projectId?: string; force?: boolean } = {}) =>
      TrashService.emptyTrash(projectId, force),
    onSuccess: (data) => {
      // Invalidate all trash queries
      queryClient.invalidateQueries({ queryKey: trashKeys.all });
      
      message.success(`Trash emptied: ${data.deletedCount} ticket(s) permanently deleted`);
    },
    onError: (error: Error) => {
      message.error(error.message || 'Failed to empty trash');
    },
  });
}

// Aliases for backward compatibility with TrashManagementPage
export const useBulkRestoreFromTrash = useRestoreFromTrash;
export const useBulkPermanentlyDelete = usePermanentlyDelete;
