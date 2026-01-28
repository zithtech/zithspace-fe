import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import {
  getDevelopmentInfo,
  updateDevelopmentInfo,
  getPullRequests,
  createPullRequest,
  updatePullRequest,
  deletePullRequest,
} from '@/services/ticketService';
import {
  TicketDevelopmentInfo,
  TicketPullRequest,
  DevelopmentInfoFormData,
  PullRequestFormData,
} from '@/types/ticket';

/**
 * Hook to fetch development info for a ticket
 */
export const useTicketDevelopmentInfo = (ticketId: string | null) => {
  return useQuery<TicketDevelopmentInfo | null>({
    queryKey: ['ticket-development-info', ticketId],
    queryFn: () => (ticketId ? getDevelopmentInfo(ticketId) : Promise.resolve(null)),
    enabled: !!ticketId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to update development info with optimistic updates
 */
export const useUpdateDevelopmentInfo = (ticketId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DevelopmentInfoFormData) => updateDevelopmentInfo(ticketId, data),
    
    onMutate: async (newData) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['ticket-development-info', ticketId] });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<TicketDevelopmentInfo | null>([
        'ticket-development-info',
        ticketId,
      ]);

      // Optimistically update
      queryClient.setQueryData<TicketDevelopmentInfo | null>(
        ['ticket-development-info', ticketId],
        (old) => {
          if (!old) {
            return {
              id: 'temp-id',
              ticketId,
              repositoryName: newData.repositoryName || null,
              repositoryUrl: newData.repositoryUrl || null,
              branchName: newData.branchName || null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
          }
          return {
            ...old,
            repositoryName: newData.repositoryName || old.repositoryName,
            repositoryUrl: newData.repositoryUrl || old.repositoryUrl,
            branchName: newData.branchName || old.branchName,
            updatedAt: new Date().toISOString(),
          };
        }
      );

      return { previousData };
    },

    onError: (err, newData, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          ['ticket-development-info', ticketId],
          context.previousData
        );
      }
      message.error('Failed to update development info');
      console.error('Update development info error:', err);
    },

    onSuccess: (data) => {
      // Update with server response
      queryClient.setQueryData(['ticket-development-info', ticketId], data);
      message.success('Development info updated successfully');
    },

    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['ticket-development-info', ticketId] });
    },
  });
};

/**
 * Hook to fetch pull requests for a ticket
 */
export const useTicketPullRequests = (ticketId: string | null) => {
  return useQuery<TicketPullRequest[]>({
    queryKey: ['ticket-pull-requests', ticketId],
    queryFn: () => (ticketId ? getPullRequests(ticketId) : Promise.resolve([])),
    enabled: !!ticketId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook to create a pull request with optimistic updates
 */
export const useCreatePullRequest = (ticketId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PullRequestFormData) => createPullRequest(ticketId, data),

    onMutate: async (newPR) => {
      await queryClient.cancelQueries({ queryKey: ['ticket-pull-requests', ticketId] });

      const previousPRs = queryClient.getQueryData<TicketPullRequest[]>([
        'ticket-pull-requests',
        ticketId,
      ]);

      // Optimistically add new PR
      const tempPR: TicketPullRequest = {
        id: `temp-${Date.now()}`,
        ticketId,
        title: newPR.title,
        url: newPR.url,
        prNumber: newPR.prNumber || null,
        status: newPR.status || 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<TicketPullRequest[]>(
        ['ticket-pull-requests', ticketId],
        (old = []) => [tempPR, ...old]
      );

      return { previousPRs };
    },

    onError: (err, newPR, context) => {
      if (context?.previousPRs) {
        queryClient.setQueryData(['ticket-pull-requests', ticketId], context.previousPRs);
      }
      message.error('Failed to create pull request');
      console.error('Create PR error:', err);
    },

    onSuccess: (data) => {
      message.success('Pull request created successfully');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-pull-requests', ticketId] });
    },
  });
};

/**
 * Hook to update a pull request with optimistic updates
 */
export const useUpdatePullRequest = (ticketId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ prId, data }: { prId: string; data: PullRequestFormData }) =>
      updatePullRequest(ticketId, prId, data),

    onMutate: async ({ prId, data }) => {
      await queryClient.cancelQueries({ queryKey: ['ticket-pull-requests', ticketId] });

      const previousPRs = queryClient.getQueryData<TicketPullRequest[]>([
        'ticket-pull-requests',
        ticketId,
      ]);

      // Optimistically update PR
      queryClient.setQueryData<TicketPullRequest[]>(
        ['ticket-pull-requests', ticketId],
        (old = []) =>
          old.map((pr) =>
            pr.id === prId
              ? {
                  ...pr,
                  title: data.title || pr.title,
                  url: data.url || pr.url,
                  prNumber: data.prNumber !== undefined ? data.prNumber : pr.prNumber,
                  status: data.status || pr.status,
                  updatedAt: new Date().toISOString(),
                }
              : pr
          )
      );

      return { previousPRs };
    },

    onError: (err, variables, context) => {
      if (context?.previousPRs) {
        queryClient.setQueryData(['ticket-pull-requests', ticketId], context.previousPRs);
      }
      message.error('Failed to update pull request');
      console.error('Update PR error:', err);
    },

    onSuccess: () => {
      message.success('Pull request updated successfully');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-pull-requests', ticketId] });
    },
  });
};

/**
 * Hook to delete a pull request with optimistic updates
 */
export const useDeletePullRequest = (ticketId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (prId: string) => deletePullRequest(ticketId, prId),

    onMutate: async (prId) => {
      await queryClient.cancelQueries({ queryKey: ['ticket-pull-requests', ticketId] });

      const previousPRs = queryClient.getQueryData<TicketPullRequest[]>([
        'ticket-pull-requests',
        ticketId,
      ]);

      // Optimistically remove PR
      queryClient.setQueryData<TicketPullRequest[]>(
        ['ticket-pull-requests', ticketId],
        (old = []) => old.filter((pr) => pr.id !== prId)
      );

      return { previousPRs };
    },

    onError: (err, prId, context) => {
      if (context?.previousPRs) {
        queryClient.setQueryData(['ticket-pull-requests', ticketId], context.previousPRs);
      }
      message.error('Failed to delete pull request');
      console.error('Delete PR error:', err);
    },

    onSuccess: () => {
      message.success('Pull request deleted successfully');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-pull-requests', ticketId] });
    },
  });
};
