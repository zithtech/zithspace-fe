
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import CodeIntegrationService from '@/services/codeIntegrationService';
import { TicketCodeMetadata } from '@/types/ticket';

// Queries

export const useRepositories = () => {
    return useQuery({
        queryKey: ['repositories'],
        queryFn: () => CodeIntegrationService.getRepositories(),
        staleTime: 60 * 60 * 1000, // 1 hour (rarely changes)
    });
};

export const useTicketCodeMetadata = (ticketId: string | undefined) => {
    return useQuery({
        queryKey: ['ticket', ticketId, 'code'],
        queryFn: () => CodeIntegrationService.getTicketCodeMetadata(ticketId!),
        enabled: !!ticketId,
    });
};

// Mutations

export const useCreateRepository = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: CodeIntegrationService.createRepository,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['repositories'] });
        },
    });
};

export const useAddBranch = (ticketId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { repositoryId: string; name: string; url?: string }) =>
            CodeIntegrationService.addBranch(ticketId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ticket', ticketId, 'code'] });
            // Also invalidate activity log to show update immediately
            queryClient.invalidateQueries({ queryKey: ['ticket', ticketId, 'activity'] });
        },
    });
};

export const useRemoveBranch = (ticketId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (branchId: string) => CodeIntegrationService.removeBranch(ticketId, branchId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ticket', ticketId, 'code'] });
            queryClient.invalidateQueries({ queryKey: ['ticket', ticketId, 'activity'] });
        },
    });
};

export const useAddPullRequest = (ticketId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { repositoryId: string; url: string; title?: string; number?: number; state?: string }) =>
            CodeIntegrationService.addPullRequest(ticketId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ticket', ticketId, 'code'] });
            queryClient.invalidateQueries({ queryKey: ['ticket', ticketId, 'activity'] });
        },
    });
};

export const useRemovePullRequest = (ticketId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (prId: string) => CodeIntegrationService.removePullRequest(ticketId, prId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ticket', ticketId, 'code'] });
            queryClient.invalidateQueries({ queryKey: ['ticket', ticketId, 'activity'] });
        },
    });
};
