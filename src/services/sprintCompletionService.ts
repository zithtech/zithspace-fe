import { apiClient } from '@/lib/axios';

/**
 * Sprint Completion Service
 * 
 * Handles all API calls related to enhanced sprint completion workflow.
 * Supports bulk ticket resolution with multiple destination types.
 */

// ==================== Type Definitions ====================

export type BulkActionType = 
  | 'move_to_sprint'
  | 'move_to_bucket'
  | 'move_to_backlog'
  | 'move_to_trash';

export interface SprintTicket {
  id: string;
  ticketNumber: string;
  title: string;
  status: string;
  priority: string;
  type: string;
  storyPoint?: number;
  estimateHours?: number;
  assignee?: {
    id: string;
    name: string;
    workEmail: string;
  };
  project: {
    id: string;
    name: string;
    code: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SprintCompletionSummary {
  sprint: {
    id: string;
    name: string;
    status: string;
    startDate: string;
    endDate: string;
    projectId: string;
    project: {
      id: string;
      name: string;
      code: string;
    };
  };
  tickets: {
    completed: SprintTicket[];
    pending: SprintTicket[];
  };
  statistics: {
    totalTickets: number;
    completedTickets: number;
    pendingTickets: number;
    completedPoints: number;
    totalPoints: number;
    completionPercentage: number;
  };
  availableDestinations: {
    sprints: Array<{
      id: string;
      name: string;
      status: string;
      projectId: string;
      version?: string;
    }>;
    buckets: Array<{
      id: string;
      name: string;
      projectId: string | null;
      color: string | null;
    }>;
  };
}

export interface BulkResolveAction {
  ticketId: string;
  action: BulkActionType;
  destinationId?: string; // Required for move_to_sprint and move_to_bucket
}

export interface BulkResolveResult {
  success: boolean;
  actionsPerformed: number;
  ticketsAffected: string[];
  errors: Array<{
    ticketId: string;
    error: string;
  }>;
}

export interface SprintCompletionLog {
  id: string;
  tenantId: string;
  sprintPlanId: string;
  projectId: string | null;
  ticketId: string;
  action: string;
  destinationId: string | null;
  destinationType: string | null;
  performedById: string;
  performedAt: string;
  metadata: any;
  performedBy: {
    id: string;
    name: string;
    workEmail: string;
  };
}

export interface SprintCompletionLogResponse {
  logs: SprintCompletionLog[];
  pagination: { pageSizeOptions: [10, 20, 25, 50, 100], page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  summary: {
    totalActions: number;
    actionBreakdown: Record<string, number>;
  };
}

// ==================== Sprint Completion Service Class ====================

class SprintCompletionService {
  /**
   * Get sprint completion summary
   * Shows completed vs. pending tickets, statistics, and available destinations
   * 
   * @param sprintId - Sprint Plan ID
   * @returns Summary with tickets, stats, and destinations
   */
  static async getSprintCompletionSummary(sprintId: string): Promise<SprintCompletionSummary> {
    try {
      const response = await apiClient.get<{ success: boolean; data: any }>(
        `/api/sprint-completion/${sprintId}/summary`
      );
      
      const apiData: any = response.data.data;
      
      // Transform API response to match frontend types
      // API uses different field names: version->name, totalCompleted->completedTickets, totalPending->pendingTickets
      const transformed: SprintCompletionSummary = {
        sprint: {
          id: apiData.sprint.id,
          name: apiData.sprint.version || apiData.sprint.name || 'Unnamed Sprint',
          status: apiData.sprint.status,
          startDate: apiData.sprint.startDate,
          endDate: apiData.sprint.endDate,
          projectId: apiData.sprint.projectId,
          project: {
            id: apiData.sprint.project.id,
            name: apiData.sprint.project.name,
            code: apiData.sprint.project.code || 'N/A',
          },
        },
        tickets: {
          completed: apiData.tickets?.completed || [],
          pending: apiData.tickets?.pending || [],
        },
        statistics: {
          totalTickets: apiData.statistics?.totalTickets || 0,
          completedTickets: apiData.statistics?.totalCompleted || apiData.statistics?.completedTickets || 0,
          pendingTickets: apiData.statistics?.totalPending || apiData.statistics?.pendingTickets || 0,
          completedPoints: apiData.statistics?.completedPoints || 0,
          totalPoints: apiData.statistics?.totalPoints || 0,
          completionPercentage: apiData.statistics?.completionPercentage || 0,
        },
        availableDestinations: {
          sprints: apiData.availableDestinations?.sprints || [],
          buckets: apiData.availableDestinations?.buckets || [],
        },
      };
      
      return transformed;
    } catch (error: any) {
      console.error('Error fetching sprint completion summary:', error);
      const errorMessage = error.response?.data?.error || 'Failed to fetch sprint summary';
      throw new Error(errorMessage);
    }
  }

  /**
   * Bulk resolve sprint tickets
   * Process multiple actions in a single transaction
   * 
   * @param sprintId - Sprint Plan ID
   * @param actions - Array of actions to perform on tickets
   * @returns Result with success/error counts
   */
  static async bulkResolveTickets(
    sprintId: string,
    actions: BulkResolveAction[]
  ): Promise<BulkResolveResult> {
    try {
      const response = await apiClient.post<{ 
        success: boolean; 
        data: {
          processedCount?: number;
          updates?: Array<{
            ticketId: string;
            action: string;
            status: string;
            error?: string;
          }>;
        }
      }>(
        `/api/sprint-completion/${sprintId}/bulk-resolve`,
        { actions }
      );
      
      const backendData = response.data.data;
      
      // Transform backend response to match frontend interface
      const updates = backendData.updates || [];
      const successfulUpdates = updates.filter(u => u.status === 'success');
      const failedUpdates = updates.filter(u => u.status === 'error' || u.status === 'failed');
      
      return {
        success: response.data.success,
        actionsPerformed: backendData.processedCount || successfulUpdates.length,
        ticketsAffected: successfulUpdates.map(u => u.ticketId),
        errors: failedUpdates.map(u => ({
          ticketId: u.ticketId,
          error: u.error || 'Unknown error occurred'
        }))
      };
    } catch (error: any) {
      console.error('Error bulk resolving tickets:', error);
      const errorMessage = error.response?.data?.error || 'Failed to resolve tickets';
      throw new Error(errorMessage);
    }
  }

  /**
   * Complete sprint
   * Validates all tickets are resolved before allowing completion
   * 
   * @param sprintId - Sprint Plan ID
   * @param force - Force completion even if pending tickets exist (admin only)
   * @returns Completed sprint details
   */
  static async completeSprint(
    sprintId: string,
    force: boolean = false
  ): Promise<{
    sprint: any;
    summary: {
      ticketsCompleted: number;
      totalPoints: number;
      completedPoints: number;
    };
  }> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: {
          sprint: any;
          summary: {
            ticketsCompleted: number;
            totalPoints: number;
            completedPoints: number;
          };
        };
      }>(
        `/api/sprint-completion/${sprintId}/complete`,
        { force }
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error completing sprint:', error);
      const errorMessage = error.response?.data?.error || 'Failed to complete sprint';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get sprint completion audit log
   * View history of all actions performed during sprint completion
   * 
   * @param sprintId - Sprint Plan ID
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 20)
   * @returns Paginated audit logs with summary
   */
  static async getSprintCompletionLog(
    sprintId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<SprintCompletionLogResponse> {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const response = await apiClient.get<{ success: boolean; data: SprintCompletionLogResponse }>(
        `/api/sprint-completion/${sprintId}/log?${params.toString()}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching sprint completion log:', error);
      const errorMessage = error.response?.data?.error || 'Failed to fetch completion log';
      throw new Error(errorMessage);
    }
  }

  /**
   * Validate bulk actions before submission
   * 
   * @param actions - Array of actions to validate
   * @returns Validation result with errors
   */
  static validateBulkActions(actions: BulkResolveAction[]): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!actions || actions.length === 0) {
      errors.push('At least one action is required');
      return { valid: false, errors };
    }

    actions.forEach((action, index) => {
      if (!action.ticketId) {
        errors.push(`Action ${index + 1}: ticketId is required`);
      }

      if (!action.action) {
        errors.push(`Action ${index + 1}: action type is required`);
      }

      // Validate destinationId for actions that require it
      if (
        (action.action === 'move_to_sprint' || action.action === 'move_to_bucket') &&
        !action.destinationId
      ) {
        errors.push(
          `Action ${index + 1}: destinationId is required for ${action.action}`
        );
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get action type display label
   * 
   * @param action - Action type
   * @returns Human-readable label
   */
  static getActionLabel(action: BulkActionType): string {
    const labels: Record<BulkActionType, string> = {
      move_to_sprint: 'Move to Sprint',
      move_to_bucket: 'Move to Bucket',
      move_to_backlog: 'Move to Backlog',
      move_to_trash: 'Move to Trash',
    };
    return labels[action] || action;
  }

  /**
   * Get action type color
   * 
   * @param action - Action type
   * @returns Color code for UI display
   */
  static getActionColor(action: string): string {
    const colors: Record<string, string> = {
      move_to_sprint: 'blue',
      move_to_bucket: 'purple',
      move_to_backlog: 'orange',
      move_to_trash: 'red',
      ticket_completed: 'green',
    };
    return colors[action] || 'default';
  }

  /**
   * Calculate sprint velocity
   * 
   * @param completedPoints - Story points completed
   * @param totalPoints - Total story points in sprint
   * @returns Velocity percentage
   */
  static calculateVelocity(completedPoints: number, totalPoints: number): number {
    if (totalPoints === 0) return 0;
    return Math.round((completedPoints / totalPoints) * 100);
  }

  /**
   * Check if sprint can be completed
   * 
   * @param summary - Sprint completion summary
   * @returns True if no pending tickets exist
   */
  static canCompleteSprint(summary: SprintCompletionSummary): boolean {
    return summary.statistics.pendingTickets === 0;
  }

  /**
   * Get sprint completion status message
   * 
   * @param summary - Sprint completion summary
   * @returns Status message for UI
   */
  static getCompletionStatusMessage(summary: SprintCompletionSummary): string {
    const { pendingTickets, completionPercentage } = summary.statistics;

    if (pendingTickets === 0) {
      return 'All tickets resolved. Sprint ready to complete!';
    }

    return `${pendingTickets} ticket${pendingTickets > 1 ? 's' : ''} pending resolution (${completionPercentage}% complete)`;
  }
}

export default SprintCompletionService;
