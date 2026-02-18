import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ReleaseNotesService, ReleaseNote, ReleaseNoteFilters } from '@/services/releasenoteService';
import { message } from 'antd';
import { PaginatedResponse } from '@/lib/axios';


// ==================== QUERY KEYS ====================
export const releaseNoteKeys = {
  all: ['release-notes'] as const,
  lists: () => [...releaseNoteKeys.all, 'list'] as const,
  list: (params: ReleaseNoteFilters) => [...releaseNoteKeys.lists(), params] as const,
  details: () => [...releaseNoteKeys.all, 'detail'] as const,
  detail: (id: string) => [...releaseNoteKeys.details(), id] as const,
};

// ==================== QUERIES ====================

/**
 * Fetch paginated release notes list
 */
// export const useReleaseNotes = (filters: ReleaseNoteFilters) => {
//   return useQuery({
//     queryKey: releaseNoteKeys.list(filters),
//     queryFn: () => ReleaseNotesService.getReleaseNotes(filters),
//     keepPreviousData: true, // keep old page while fetching new
//     staleTime: 5 * 60 * 1000, // 5 minutes
//   });
// };
export const useReleaseNotes = (filters?: ReleaseNoteFilters) => {
  return useQuery<PaginatedResponse<ReleaseNote>, Error>({
    queryKey: releaseNoteKeys.list(filters || {}),
    queryFn: () => ReleaseNotesService.getReleaseNotes(filters),
    //keepPreviousData: true,
    staleTime: 5 * 60 * 1000,
  });
};




/**
 * Fetch single release note by ID
 */
export const useReleaseNote = (id: string | undefined) => {
  return useQuery({
    queryKey: releaseNoteKeys.detail(id!),
    queryFn: () => ReleaseNotesService.getReleaseNoteById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// ==================== MUTATIONS ====================

/**
 * Create release note
 */
export const useCreateReleaseNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<ReleaseNote>) => ReleaseNotesService.createReleaseNote(data),
    onSuccess: (newNote) => {
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: releaseNoteKeys.lists() });
      message.success('Release note created successfully');
    },
    onError: () => {
      message.error('Failed to create release note');
    },
  });
};

/**
 * Update release note
 */
export const useUpdateReleaseNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ReleaseNote> }) =>
      ReleaseNotesService.updateReleaseNote(id, data),
    onSuccess: (updatedNote) => {
      // Update detail cache directly
      queryClient.setQueryData(releaseNoteKeys.detail(updatedNote.id), updatedNote);
      // Also invalidate lists for consistency
      queryClient.invalidateQueries({ queryKey: releaseNoteKeys.lists() });
      message.success('Release note updated successfully');
    },
    onError: () => {
      message.error('Failed to update release note');
    },
  });
};

/**
 * Delete release note
 */
export const useDeleteReleaseNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ReleaseNotesService.deleteReleaseNote(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.invalidateQueries({ queryKey: releaseNoteKeys.lists() });
      queryClient.removeQueries({ queryKey: releaseNoteKeys.detail(id) });
      message.success('Release note deleted successfully');
    },
    onError: () => {
      message.error('Failed to delete release note');
    },
  });
};
