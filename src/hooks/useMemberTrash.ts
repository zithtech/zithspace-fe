import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MembersService } from '@/services/membersService';
import { message } from 'antd';

export const memberTrashKeys = {
  all: ['member-trash'] as const,
  list: (filters: any) => [...memberTrashKeys.all, 'list', filters] as const,
};

/**
 * Hook to fetch trashed members with optional filters
 */
export function useMemberTrash(filters: { search?: string; page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: memberTrashKeys.list(filters),
    queryFn: () => MembersService.getDeletedMembers(filters),
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to restore a member
 */
export function useRestoreMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) => MembersService.restoreMember(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberTrashKeys.all });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      message.success('Member restored successfully');
    },
    onError: (error: Error) => {
      message.error(error.message || 'Failed to restore member');
    },
  });
}

/**
 * Hook to permanently delete a member
 */
export function usePermanentDeleteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) => MembersService.permanentDeleteMember(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberTrashKeys.all });
      message.success('Member permanently deleted');
    },
    onError: (error: Error) => {
      message.error(error.message || 'Failed to permanently delete member');
    },
  });
}

/**
 * Hook to permanently delete ALL members in trash
 */
export function useEmptyMemberTrash() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => MembersService.emptyTrash(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberTrashKeys.all });
      message.success('Member trash emptied successfully');
    },
    onError: (error: Error) => {
      message.error(error.message || 'Failed to empty trash');
    },
  });
}

/**
 * Hook for bulk restoring members
 */
export function useBulkRestoreMembers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => MembersService.bulkRestore(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberTrashKeys.all });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      message.success('Selected members restored successfully');
    },
    onError: (error: Error) => {
      message.error(error.message || 'Failed to restore selected members');
    },
  });
}

/**
 * Hook for bulk permanently deleting members
 */
export function useBulkPermanentDeleteMembers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => MembersService.bulkPermanentDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberTrashKeys.all });
      message.success('Selected members permanently deleted');
    },
    onError: (error: Error) => {
      message.error(error.message || 'Failed to delete selected members');
    },
  });
}
