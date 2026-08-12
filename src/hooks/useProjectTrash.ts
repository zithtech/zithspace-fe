import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ProjectTrashService from '@/services/projectTrashService';
import { message } from 'antd';

export const projectTrashKeys = {
  all: ['project-trash'] as const,
  list: () => [...projectTrashKeys.all, 'list'] as const,
};

/**
 * Hook to fetch trashed projects
 */
export function useProjectTrash(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: [...projectTrashKeys.list(), params],
    queryFn: () => ProjectTrashService.getTrashProjects(params),
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to restore a project
 */
export function useRestoreProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => ProjectTrashService.restoreProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectTrashKeys.all });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      message.success('Project restored successfully');
    },
    onError: (error: Error) => {
      message.error(error.message || 'Failed to restore project');
    },
  });
}

/**
 * Hook to permanently delete a project
 */
export function usePermanentDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => ProjectTrashService.permanentDeleteProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectTrashKeys.all });
      message.success('Project permanently deleted');
    },
    onError: (error: Error) => {
      message.error(error.message || 'Failed to permanently delete project');
    },
  });
}

/**
 * Hook to permanently delete ALL projects in trash
 */
export function useEmptyTrash() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => ProjectTrashService.emptyTrash(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectTrashKeys.all });
      message.success('Project trash emptied successfully');
    },
    onError: (error: Error) => {
      message.error(error.message || 'Failed to empty trash');
    },
  });
}

/**
 * Hook for bulk restoring projects
 */
export function useBulkRestoreProjects() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => ProjectTrashService.bulkRestore(ids),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: projectTrashKeys.all });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      message.success('Selected projects restored successfully');
    },
    onError: (error: Error) => {
      message.error(error.message || 'Failed to restore selected projects');
    },
  });
}

/**
 * Hook for bulk permanently deleting projects
 */
export function useBulkPermanentDeleteProjects() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => ProjectTrashService.bulkPermanentDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectTrashKeys.all });
      message.success('Selected projects permanently deleted');
    },
    onError: (error: Error) => {
      message.error(error.message || 'Failed to delete selected projects');
    },
  });
}
