import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import TicketService from '@/services/ticketService';
import DocumentHubService from '@/services/documentHub';

/**
 * React Query hooks for ticket details with optimized caching
 * 
 * Benefits:
 * - Parallel data loading (ticket, comments, links)
 * - Granular cache invalidation (only refetch what changed)
 * - Automatic background refetching
 * - Optimistic updates
 */

// ==================== QUERIES ====================

/**
 * Fetch core ticket data (without comments/links)
 * Cache: 2 minutes
 */
export const useTicketDetails = (ticketId: string | undefined) => {
  return useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => TicketService.getTicketById(ticketId!),
    enabled: !!ticketId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
  });
};

/**
 * Fetch ticket comments separately
 * Cache: 30 seconds (more dynamic)
 * No auto-refetch on mount/focus for better performance
 */
export const useTicketComments = (ticketId: string | undefined) => {
  return useQuery({
    queryKey: ['ticket', ticketId, 'comments'],
    queryFn: () => TicketService.getComments(ticketId!),
    enabled: !!ticketId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchOnMount: false,        // Don't refetch when component mounts
    refetchOnWindowFocus: false,  // Don't refetch when window gains focus
    refetchOnReconnect: false,    // Don't refetch on network reconnect
  });
};

/**
 * Fetch related links separately
 * Cache: 5 minutes (rarely change)
 */
export const useTicketLinks = (ticketId: string | undefined) => {
  return useQuery({
    queryKey: ['ticket', ticketId, 'links'],
    queryFn: () => TicketService.getRelatedLinks(ticketId!),
    enabled: !!ticketId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Fetch ticket attachments
 * Cache: 2 minutes
 */
export const useTicketAttachments = (ticketId: string | undefined) => {
  return useQuery({
    queryKey: ['ticket', ticketId, 'attachments'],
    queryFn: () => TicketService.getAttachments(ticketId!),
    enabled: !!ticketId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Fetch document hubs linked to a ticket. These are surfaced alongside file
 * attachments on the ticket — the ticket→hub relationship is bidirectional
 * (the hub also exposes the ticket on the doc-hub list page).
 */
export const useTicketDocumentHubs = (ticketId: string | undefined) => {
  return useQuery({
    queryKey: ['ticket', ticketId, 'documentHubs'],
    queryFn: () => DocumentHubService.getDocumentHubsByTicket(ticketId!),
    enabled: !!ticketId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

/**
 * Fetch ticket activity log
 * Cache: 30 seconds
 */
export const useTicketActivityLog = (ticketId: string | undefined) => {
  return useQuery({
    queryKey: ['ticket', ticketId, 'activity'],
    queryFn: () => TicketService.getActivityLog(ticketId!),
    enabled: !!ticketId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

// ==================== MUTATIONS ====================

/**
 * Update ticket mutation
 * Invalidates: ticket cache only
 */
export const useUpdateTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, updates }: { ticketId: string; updates: any }) =>
      TicketService.updateTicket(ticketId, updates),
    onSuccess: (_, { ticketId }) => {
      // Only invalidate ticket details, not comments/links
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
    },
  });
};

/**
 * Add comment mutation
 * Invalidates: comments cache only (NOT ticket details!)
 */
export const useAddComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, comment }: { ticketId: string; comment: string }) =>
      TicketService.addComment(ticketId, comment),
    onSuccess: (_, { ticketId }) => {
      // Only invalidate comments, ticket details stay cached
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId, 'comments'] });
    },
  });
};

/**
 * Update comment mutation
 * Invalidates: comments cache only
 */
export const useUpdateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ticketId,
      commentId,
      comment
    }: {
      ticketId: string;
      commentId: string;
      comment: string;
    }) => TicketService.updateComment(ticketId, commentId, comment),
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId, 'comments'] });
    },
  });
};

/**
 * Delete comment mutation
 * Invalidates: comments cache only
 */
export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, commentId }: { ticketId: string; commentId: string }) =>
      TicketService.deleteComment(ticketId, commentId),
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId, 'comments'] });
    },
  });
};

/**
 * Add related link mutation
 * Invalidates: links cache only
 */
export const useAddRelatedLink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ticketId,
      linkData
    }: {
      ticketId: string;
      linkData: any;
    }) => TicketService.addRelatedLink(ticketId, linkData),
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId, 'links'] });
    },
  });
};

/**
 * Update related link mutation
 * Invalidates: links cache only
 */
export const useUpdateRelatedLink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ticketId,
      linkId,
      linkData
    }: {
      ticketId: string;
      linkId: string;
      linkData: any;
    }) => TicketService.updateRelatedLink(ticketId, linkId, linkData),
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId, 'links'] });
    },
  });
};

/**
 * Delete related link mutation
 * Invalidates: links cache only
 */
export const useDeleteRelatedLink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, linkId }: { ticketId: string; linkId: string }) =>
      TicketService.deleteRelatedLink(ticketId, linkId),
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId, 'links'] });
    },
  });
};

/**
 * Upload attachment mutation
 * Invalidates: attachments cache only
 */
export const useUploadAttachment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ticketId,
      file,
      fileName
    }: {
      ticketId: string;
      file: string;
      fileName: string;
    }) => TicketService.uploadAttachment(ticketId, file, fileName),
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId, 'attachments'] });
    },
  });
};

/**
 * Delete attachment mutation
 * Invalidates: attachments cache only
 */
export const useDeleteAttachment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, attachmentId }: { ticketId: string; attachmentId: string }) =>
      TicketService.deleteAttachment(ticketId, attachmentId),
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId, 'attachments'] });
    },
  });
};

/**
 * Rename attachment mutation
 * Invalidates: attachments cache only
 */
export const useRenameAttachment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ticketId,
      attachmentId,
      newFileName
    }: {
      ticketId: string;
      attachmentId: string;
      newFileName: string;
    }) => TicketService.renameAttachment(ticketId, attachmentId, newFileName),
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId, 'attachments'] });
    },
  });
};

// ==================== COMBINED HOOK ====================

/**
 * Combined hook for all ticket data
 * Loads ticket, comments, links, and attachments in parallel
 */
export const useTicketData = (ticketId: string | undefined) => {
  const ticket = useTicketDetails(ticketId);
  const comments = useTicketComments(ticketId);
  const links = useTicketLinks(ticketId);
  const attachments = useTicketAttachments(ticketId);

  return {
    ticket,
    comments,
    links,
    attachments,
    isLoading: ticket.isLoading || comments.isLoading || links.isLoading || attachments.isLoading,
    isError: ticket.isError || comments.isError || links.isError || attachments.isError,
  };
};
