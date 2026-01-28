import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TrashService, {
  TrashTicket,
  EmptyTrashResult,
} from "@/services/trashService";
import { message } from "antd";
import { ticketKeys } from "./useTickets";

/**
 * React Query Hooks for Trash Management
 * 
 * Provides hooks for trash operations with optimistic updates
 * and automatic cache invalidation
 */

// ==================== Query Keys ====================

export const trashKeys = {
  all: ["trash"] as const,
  lists: () => [...trashKeys.all, "list"] as const,
  list: (params: {
    projectId?: string;
    page?: number;
    limit?: number;
    search?: string;
  }) => [...trashKeys.lists(), params] as const,
};

// ==================== Queries ====================

/**
 * Fetch deleted tickets from trash
 *
 * @param params - Query parameters for filtering and pagination
 */
export const useTrashTickets = (params: {
  projectId?: string;
  page?: number;
  limit?: number;
  search?: string;
} = {}) => {
  return useQuery({
    queryKey: trashKeys.list(params),
    queryFn: () => TrashService.getTrashTickets(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    placeholderData: (previousData) => previousData, // Keep previous page while fetching
  });
};

// ==================== Mutations ====================

/**
 * Move ticket to trash (soft delete)
 * 
 * Optimistically removes ticket from main views
 */
export const useMoveToTrash = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ticketId: string) => TrashService.moveToTrash(ticketId),
    onMutate: async (ticketId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ticketKeys.all });
      await queryClient.cancelQueries({ queryKey: trashKeys.all });

      // Snapshot previous values
      const previousTicketLists = queryClient.getQueriesData({ 
        queryKey: ticketKeys.lists() 
      });
      const previousKanbanData = queryClient.getQueriesData({ 
        queryKey: ['tickets', 'kanban'] 
      });

      // Optimistically remove ticket from all ticket lists
      queryClient.setQueriesData({ queryKey: ticketKeys.lists() }, (oldData: any) => {
        if (!oldData?.data) return oldData;
        return {
          ...oldData,
          data: oldData.data.filter((ticket: any) => ticket.id !== ticketId),
          pagination: {
            ...oldData.pagination,
            total: Math.max(0, (oldData.pagination?.total || 0) - 1),
          },
        };
      });

      // Optimistically remove ticket from kanban
      queryClient.setQueriesData({ queryKey: ['tickets', 'kanban'] }, (oldData: any) => {
        if (!oldData?.columns) return oldData;
        const updatedColumns = { ...oldData.columns };
        
        Object.keys(updatedColumns).forEach((status) => {
          updatedColumns[status] = {
            ...updatedColumns[status],
            tickets: updatedColumns[status].tickets.filter((t: any) => t.id !== ticketId),
            loaded: Math.max(0, updatedColumns[status].loaded - 1),
            total: Math.max(0, updatedColumns[status].total - 1),
          };
        });

        return { ...oldData, columns: updatedColumns };
      });

      return { previousTicketLists, previousKanbanData };
    },
    onError: (err, ticketId, context) => {
      // Rollback on error
      if (context?.previousTicketLists) {
        context.previousTicketLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousKanbanData) {
        context.previousKanbanData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      message.error("Failed to move ticket to trash");
    },
    onSuccess: (deletedTicket) => {
      // Invalidate trash queries to show new item
      queryClient.invalidateQueries({ queryKey: trashKeys.all });
      
      // Remove from detail view
      queryClient.removeQueries({ queryKey: ticketKeys.detail(deletedTicket.id) });
      
      message.success("Ticket moved to trash. Can be restored within 7 days.");
    },
  });
};

/**
 * Restore ticket from trash
 * 
 * Optimistically adds ticket back to main views
 */
export const useRestoreFromTrash = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ticketId: string) => TrashService.restoreFromTrash(ticketId),
    onMutate: async (ticketId) => {
      await queryClient.cancelQueries({ queryKey: trashKeys.all });

      // Snapshot trash lists
      const previousTrashLists = queryClient.getQueriesData({ 
        queryKey: trashKeys.lists() 
      });

      // Optimistically remove from trash
      queryClient.setQueriesData({ queryKey: trashKeys.lists() }, (oldData: any) => {
        if (!oldData?.tickets) return oldData;
        return {
          ...oldData,
          tickets: oldData.tickets.filter((ticket: TrashTicket) => ticket.id !== ticketId),
          pagination: {
            ...oldData.pagination,
            total: Math.max(0, (oldData.pagination?.total || 0) - 1),
          },
          summary: {
            ...oldData.summary,
            total: Math.max(0, (oldData.summary?.total || 0) - 1),
          },
        };
      });

      return { previousTrashLists };
    },
    onError: (err, ticketId, context) => {
      if (context?.previousTrashLists) {
        context.previousTrashLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      message.error("Failed to restore ticket");
    },
    onSuccess: (restoredTicket) => {
      // Invalidate ticket queries to show restored ticket
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
      
      // Invalidate trash queries
      queryClient.invalidateQueries({ queryKey: trashKeys.all });
      
      message.success("Ticket restored successfully");
    },
  });
};

/**
 * Permanently delete ticket from trash
 * 
 * Cannot be undone - removes ticket forever
 */
export const usePermanentlyDelete = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ticketId: string) => TrashService.permanentlyDelete(ticketId),
    onMutate: async (ticketId) => {
      await queryClient.cancelQueries({ queryKey: trashKeys.all });

      const previousTrashLists = queryClient.getQueriesData({ 
        queryKey: trashKeys.lists() 
      });

      // Optimistically remove from trash
      queryClient.setQueriesData({ queryKey: trashKeys.lists() }, (oldData: any) => {
        if (!oldData?.tickets) return oldData;
        return {
          ...oldData,
          tickets: oldData.tickets.filter((ticket: TrashTicket) => ticket.id !== ticketId),
          pagination: {
            ...oldData.pagination,
            total: Math.max(0, (oldData.pagination?.total || 0) - 1),
          },
          summary: {
            ...oldData.summary,
            total: Math.max(0, (oldData.summary?.total || 0) - 1),
          },
        };
      });

      return { previousTrashLists };
    },
    onError: (err, ticketId, context) => {
      if (context?.previousTrashLists) {
        context.previousTrashLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      message.error("Failed to delete ticket permanently");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trashKeys.all });
      message.success("Ticket permanently deleted");
    },
  });
};

/**
 * Empty entire trash (bulk permanent delete)
 *
 * Deletes all tickets in trash - cannot be undone
 */
export const useEmptyTrash = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (force: boolean = false) => TrashService.emptyTrash(force),
    onMutate: async (force) => {
      await queryClient.cancelQueries({ queryKey: trashKeys.all });

      const previousTrashLists = queryClient.getQueriesData({
        queryKey: trashKeys.lists()
      });

      // Optimistically clear all trash
      queryClient.setQueriesData({ queryKey: trashKeys.lists() }, (oldData: any) => {
        if (!oldData?.tickets) return oldData;
        
        return {
          ...oldData,
          tickets: [],
          pagination: {
            ...oldData.pagination,
            total: 0,
          },
          summary: {
            total: 0,
            expiringSoon: 0,
          },
        };
      });

      return { previousTrashLists };
    },
    onError: (err, force, context) => {
      if (context?.previousTrashLists) {
        context.previousTrashLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      message.error("Failed to empty trash");
    },
    onSuccess: (result: EmptyTrashResult) => {
      queryClient.invalidateQueries({ queryKey: trashKeys.all });
      message.success(`${result.deletedCount} ticket(s) permanently deleted`);
    },
  });
};

/**
 * Bulk restore tickets from trash
 */
export const useBulkRestoreFromTrash = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ticketIds: string[]) => 
      Promise.all(ticketIds.map(id => TrashService.restoreFromTrash(id))),
    onSuccess: (restoredTickets) => {
      queryClient.invalidateQueries({ queryKey: trashKeys.all });
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
      message.success(`${restoredTickets.length} ticket(s) restored successfully`);
    },
    onError: () => {
      message.error("Failed to restore tickets");
    },
  });
};

/**
 * Bulk permanently delete tickets from trash
 */
export const useBulkPermanentlyDelete = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ticketIds: string[]) => 
      Promise.all(ticketIds.map(id => TrashService.permanentlyDelete(id))),
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: trashKeys.all });
      message.success(`${results.length} ticket(s) permanently deleted`);
    },
    onError: () => {
      message.error("Failed to delete tickets");
    },
  });
};
