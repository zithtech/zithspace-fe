import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import SprintCompletionService, {
  SprintCompletionSummary,
  BulkResolveAction,
  BulkResolveResult,
  SprintCompletionLog,
  SprintCompletionLogResponse,
} from "@/services/sprintCompletionService";
import { message } from "antd";
import { ticketKeys } from "./useTickets";
import { bucketKeys } from "./useBuckets";

/**
 * React Query Hooks for Sprint Completion
 * 
 * Provides hooks for sprint completion workflows with optimistic updates
 * and automatic cache invalidation
 */

// ==================== Query Keys ====================

export const sprintCompletionKeys = {
  all: ["sprint-completion"] as const,
  summaries: () => [...sprintCompletionKeys.all, "summary"] as const,
  summary: (sprintId: string) => [...sprintCompletionKeys.summaries(), sprintId] as const,
  logs: () => [...sprintCompletionKeys.all, "log"] as const,
  log: (sprintId: string, page: number) => [...sprintCompletionKeys.logs(), sprintId, page] as const,
};

// ==================== Queries ====================

/**
 * Fetch sprint completion summary
 * 
 * Shows pending tickets grouped by status and provides
 * options for bulk resolution
 * 
 * @param sprintId - Sprint ID
 * @param enabled - Whether to enable the query
 */
export const useSprintCompletionSummary = (
  sprintId: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: sprintCompletionKeys.summary(sprintId),
    queryFn: () => SprintCompletionService.getSprintCompletionSummary(sprintId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: enabled && !!sprintId,
  });
};

/**
 * Fetch sprint completion log with pagination
 * 
 * Shows audit trail of all bulk resolution actions
 * 
 * @param sprintId - Sprint ID
 * @param page - Page number
 * @param limit - Items per page
 */
export const useSprintCompletionLog = (
  sprintId: string,
  page: number = 1,
  limit: number = 20
) => {
  return useQuery({
    queryKey: sprintCompletionKeys.log(sprintId, page),
    queryFn: () => SprintCompletionService.getSprintCompletionLog(sprintId, page, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!sprintId,
    placeholderData: (previousData) => previousData,
  });
};

// ==================== Mutations ====================

/**
 * Bulk resolve tickets during sprint completion
 * 
 * Handles multiple actions:
 * - Move to backlog (unassign from sprint)
 * - Move to next sprint
 * - Move to bucket
 * - Move to trash
 * 
 * Updates ticket status if specified
 */
export const useBulkResolveTickets = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sprintId, actions }: { sprintId: string; actions: BulkResolveAction[] }) =>
      SprintCompletionService.bulkResolveTickets(sprintId, actions),
    onMutate: async ({ sprintId, actions }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ticketKeys.all });
      await queryClient.cancelQueries({ queryKey: sprintCompletionKeys.summary(sprintId) });

      // Snapshot previous values
      const previousTicketLists = queryClient.getQueriesData({
        queryKey: ticketKeys.lists()
      });
      const previousKanbanData = queryClient.getQueriesData({
        queryKey: ['tickets', 'kanban']
      });
      const previousSummary = queryClient.getQueryData<SprintCompletionSummary>(
        sprintCompletionKeys.summary(sprintId)
      );

      // Optimistically update summary - reduce pending count
      if (previousSummary) {
        queryClient.setQueryData(
          sprintCompletionKeys.summary(sprintId),
          (old: SprintCompletionSummary | undefined) => {
            if (!old) return old;
            
            const affectedTicketIds = actions.map(a => a.ticketId);
            
            return {
              ...old,
              statistics: {
                ...old.statistics,
                pendingTickets: Math.max(0, old.statistics.pendingTickets - affectedTicketIds.length),
              },
            };
          }
        );
      }

      return { previousTicketLists, previousKanbanData, previousSummary, sprintId };
    },
    onError: (err, variables, context) => {
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
      if (context?.previousSummary && context.sprintId) {
        queryClient.setQueryData(
          sprintCompletionKeys.summary(context.sprintId),
          context.previousSummary
        );
      }

      message.error("Failed to resolve tickets");
    },
    onSuccess: (result: BulkResolveResult, variables) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
      queryClient.invalidateQueries({ queryKey: sprintCompletionKeys.summary(variables.sprintId) });
      queryClient.invalidateQueries({ queryKey: bucketKeys.all });
      
      if (result.errors.length > 0) {
        message.warning(
          `${result.actionsPerformed} of ${variables.actions.length} ticket(s) resolved. ${result.errors.length} failed.`
        );
      } else {
        message.success(`${result.actionsPerformed} ticket(s) resolved successfully`);
      }
    },
  });
};

/**
 * Complete sprint (mark as complete with optional bulk actions)
 * 
 * This performs:
 * 1. Optional bulk ticket resolution
 * 2. Marks sprint as completed
 * 3. Logs action in audit trail
 */
export const useCompleteSprint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sprintId, force }: {
      sprintId: string;
      force?: boolean;
    }) => SprintCompletionService.completeSprint(sprintId, force),
    onMutate: async ({ sprintId }) => {
      await queryClient.cancelQueries({ queryKey: ticketKeys.all });
      await queryClient.cancelQueries({ queryKey: sprintCompletionKeys.summary(sprintId) });

      const previousTicketLists = queryClient.getQueriesData({ 
        queryKey: ticketKeys.lists() 
      });
      const previousKanbanData = queryClient.getQueriesData({ 
        queryKey: ['tickets', 'kanban'] 
      });
      const previousSummary = queryClient.getQueryData<SprintCompletionSummary>(
        sprintCompletionKeys.summary(sprintId)
      );

      return { previousTicketLists, previousKanbanData, previousSummary, sprintId };
    },
    onError: (err, variables, context) => {
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
      if (context?.previousSummary && context.sprintId) {
        queryClient.setQueryData(
          sprintCompletionKeys.summary(context.sprintId),
          context.previousSummary
        );
      }

      message.error("Failed to complete sprint");
    },
    onSuccess: (result, variables) => {
      // Invalidate all sprint-related queries
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
      queryClient.invalidateQueries({ queryKey: sprintCompletionKeys.all });
      queryClient.invalidateQueries({ queryKey: bucketKeys.all });
      
      // Invalidate sprint plans list
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });

      message.success(
        `Sprint completed successfully! ${result.summary.ticketsCompleted} ticket(s) completed with ${result.summary.completedPoints} story points.`
      );
    },
  });
};

/**
 * Validate bulk actions before submission
 * 
 * This is a client-side hook that checks actions without
 * making an API call
 */
export const useValidateBulkActions = () => {
  return (actions: BulkResolveAction[]): {
    valid: boolean;
    errors: string[];
  } => {
    const result = SprintCompletionService.validateBulkActions(actions);
    
    if (!result.valid) {
      result.errors.forEach(error => {
        message.error(error);
      });
    }
    
    return result;
  };
};

/**
 * Calculate sprint velocity percentage
 *
 * Client-side calculation hook
 */
export const useCalculateVelocity = () => {
  return (completedPoints: number, totalPoints: number): number => {
    return SprintCompletionService.calculateVelocity(completedPoints, totalPoints);
  };
};

/**
 * Check if sprint can be completed
 *
 * Client-side validation hook
 */
export const useCanCompleteSprint = () => {
  return (summary: SprintCompletionSummary): boolean => {
    return SprintCompletionService.canCompleteSprint(summary);
  };
};

/**
 * Get sprint completion status message
 *
 * Client-side message formatter
 */
export const useGetCompletionStatusMessage = () => {
  return (summary: SprintCompletionSummary): string => {
    return SprintCompletionService.getCompletionStatusMessage(summary);
  };
};
