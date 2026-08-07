import { apiClient } from "@/lib/axios";

export function parseDecimal(val: any): number | undefined {
  if (val === null || val === undefined) return undefined;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? undefined : parsed;
  }
  if (typeof val === 'object' && val !== null && 'd' in val && 's' in val && 'e' in val) {
    try {
      const { s, e, d } = val;
      if (Array.isArray(d) && typeof s === 'number' && typeof e === 'number') {
        const first = d[0].toString();
        const rest = d.slice(1).map((x: any) => x.toString().padStart(7, '0')).join('');
        const digits = first + rest;
        let numStr = '';
        if (e >= 0) {
          if (e + 1 >= digits.length) {
            numStr = digits + '0'.repeat(e + 1 - digits.length);
          } else {
            numStr = digits.slice(0, e + 1) + '.' + digits.slice(e + 1);
          }
        } else {
          numStr = '0.' + '0'.repeat(-e - 1) + digits;
        }
        const parsed = parseFloat((s < 0 ? '-' : '') + numStr);
        return isNaN(parsed) ? undefined : parsed;
      }
    } catch (err) {
      console.error("Error parsing Decimal object in parseDecimal:", err);
    }
  }
  return undefined;
}

export function sanitizeTicket(ticket: any): any {
  if (!ticket) return ticket;
  if (typeof ticket !== 'object') return ticket;

  const sanitized = { ...ticket };

  if ('estimateHours' in sanitized) {
    sanitized.estimateHours = parseDecimal(sanitized.estimateHours);
  }

  if ('storyPoint' in sanitized) {
    sanitized.storyPoint = parseDecimal(sanitized.storyPoint);
  }

  if (Array.isArray(sanitized.subTasks)) {
    sanitized.subTasks = sanitized.subTasks.map(sanitizeTicket);
  }

  return sanitized;
}

export interface TicketFormData {
  title: string;
  description?: string;
  platform?: string;
  project: string;
  parentTickets?: string[];
  parentId?: string;
  parentTicketNotes?: string;
  stack?: string;
  priority?: string;
  status?: string;
  taskLevel?: string;
  type?: string;
  storyPoint?: number;
  estimateHours?: number;
  reportTo?: string;
  assignee?: string;
  startDate?: string;
  endDate?: string;
  releasePlan?: string | null;
  sprintPlanId?: string | null;
  sprintPlan?: string | null;
  bucketId?: string | null;
  selectedWorkflowSteps?: string[];
  tags?: string[];
}

export interface TicketConfiguration {
  platforms: string[];
  stacks: string[];
  priorities: Array<{
    value: string;
    label: string;
    color: string;
    description: string;
  }>;
  taskLevels: string[];
  taskTypes: Array<{
    value: string;
    color: string;
    description: string;
  }>;
  workflowSteps: string[];
  statuses: Array<{
    value: string;
    label: string;
    color: string;
  }>;
  users: Array<{
    value: string;
    label: string;
    email: string;
    position: string;
    avatarUrl?: string | null;
  }>;
  projects: Array<{
    value: string;
    label: string;
    description: string;
  }>;
  releasePlans: Array<{
    value: string;
    label: string;
    description: string;
    project: string;
  }>;
}

export interface ParentTicket {
  value: string;
  label: string;
  status: string;
  priority: string;
  project: string;
}

export interface RelatedLink {
  id?: string;
  type: "ui_design" | "scope_doc" | "sample_response" | "dev_doc";
  title: string;
  description: string;
  url: string;
  addedBy: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  addedAt: string;
}

/** A QA workspace record type that can be attached to a ticket. */
export type QaEntityType = "scope" | "case" | "run";

export interface TicketQaLink {
  id: string;
  entity_type: QaEntityType;
  entity_id: string;
  /** Scope name / scenario title / run name, read live from the QA tables. */
  name: string | null;
  /** Scope type, scenario module, or the run's suite — whichever applies. */
  subtitle: string | null;
  status: string | null;
  linked_by_name: string | null;
  created_at: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  platform: string;
  project:
  | {
    id: string;
    name: string;
    code: string;
    description?: string;
  }
  | string;
  stack?: string;
  priority: string;
  taskLevel: string;
  type: string;
  status: string;
  assignee: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  reportTo:
  | {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  }
  | string;
  createdBy: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  createdAt: string;
  updatedAt: string;
  storyPoint?: number;
  estimateHours?: number;
  startDate?: string;
  endDate?: string;
  releasePlanId?: string; // Mapped from backend
  sprintPlanId?: string; // Mapped from backend
  demoPlanId?: string;
  bucketId?: string;
  isArchived?: boolean;
  parentId?: string; // Hierarchy support (Subtask)
  tags?: string[];
  metadata?: {
    platform?: string;
    stack?: string;
    taskLevel?: string;
    type?: string;
    storyPoint?: number;
    estimateHours?: number;
    parentTickets?: string[];
    releasePlan?: string;
    [key: string]: any;
  };
  relatedLinks?: RelatedLink[];
  comments?: Array<{
    id: string;
    userId: {
      id: string;
      name: string;
      email: string;
      avatarUrl?: string | null;
    };
    comment: string;
    timestamp: string;
  }>;
  subTasks?: Ticket[];
  activityLogs?: Array<{
    id: string;
    action: string;
    details: any;
    timestamp: string;
    performedBy: {
      name: string;
      avatarUrl?: string | null;
    };
  }>;
  attachments?: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    uploadedBy: {
      name: string;
      avatarUrl?: string | null;
    };
    uploadedAt: string;
  }>;
}

export interface RecentCommentRow {
  id: string;
  comment: string;
  timestamp: string;
  total: number;
  user: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
  ticket: {
    id: string;
    ticketNumber: string;
    title: string;
  };
}

export interface RecentAttachmentRow {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  uploadedAt: string;
  total: number;
  uploadedBy: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
  ticket: {
    id: string;
    ticketNumber: string;
    title: string;
  };
}

export interface OverdueTicketRow {
  id: string;
  ticketNumber: string;
  title: string;
  endDate: string;
  status: string;
  priority: string;
  daysOverdue: number;
}

export interface RecentActivityResponse {
  comments: RecentCommentRow[];
  attachments: RecentAttachmentRow[];
  overdue: OverdueTicketRow[];
}

export interface TicketListResponse {
  success: boolean;
  data: Ticket[];
  pagination: { pageSizeOptions: [10, 20, 25, 50, 100], page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface DashboardStats {
  generalStats: {
    total: number;
    in_progress: number;
    not_started: number;
    completed: number;
    blocked: number;
  };
  projectStats: Array<{
    id: string;
    statuses: Array<{
      status: string;
      count: number;
    }>;
    total: number;
  }>;
  priorityStats: Array<{
    id: string;
    count: number;
  }>;
  recentActivity: Ticket[];
  teamStats: Array<{
    id: string;
    user: {
      name: string;
      email: string;
      avatarUrl?: string | null;
    };
    statuses: Array<{
      status: string;
      count: number;
    }>;
    total: number;
  }>;
  period: {
    start: string;
    end: string;
    month: string;
  };
}

class TicketService {
  /**
   * Get all ticket configurations for form dropdowns
   */
  static async getTicketConfigurations(): Promise<TicketConfiguration> {
    try {
      const response = await apiClient.get(
        "/api/settings/ticket-configurations",
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching ticket configurations:", error);
      throw new Error("Failed to fetch ticket configurations");
    }
  }

  /**
   * Get parent tickets for linking
   */
  static async getParentTickets(
    project?: string,
    exclude?: string,
  ): Promise<ParentTicket[]> {
    try {
      const params = new URLSearchParams();
      if (project) params.append("project", project);
      if (exclude) params.append("exclude", exclude);

      const response = await apiClient.get(
        `/api/settings/parent-tickets?${params.toString()}`,
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching parent tickets:", error);
      throw new Error("Failed to fetch parent tickets");
    }
  }

  /**
   * Generate a structured ticket draft from a free-form description using AI.
   * Returns a draft only — caller is responsible for persisting via createTicket().
   */
  static async generateAiTicketDraft(input: {
    description: string;
    title?: string;
  }): Promise<{
    title: string;
    description: string;
    priority: "Low" | "Medium" | "High";
    subtasks: { title: string; hours: number }[];
    totalHours: number;
    source: "gemini" | "mock";
    fallbackReason?: string;
  }> {
    try {
      // AI generation can legitimately take 30s+ when Gemini retries on 429s
      // (the backend retries up to 3 times with ~4s delay each). Override the
      // client's default 30s timeout so we wait for the real response.
      const response = await apiClient.post("/api/tickets/ai-generate", input, {
        timeout: 120000, // 2 min, comfortably longer than backend's worst case
      });
      return response.data.data;
    } catch (error: any) {
      console.error("Error generating AI ticket draft:", error);
      if (error?.code === "ECONNABORTED") {
        throw new Error("AI generation took too long. Please try again.");
      }
      const errorMessage =
        error.response?.data?.error || "Failed to generate ticket draft";
      throw new Error(errorMessage);
    }
  }

  /**
   * Regenerate just the subtask list for a Zai draft, with a caller-specified
   * shape (count + hours-each). Useful when the user wants e.g. 8 subtasks of
   * 6h each instead of Zai's default breakdown.
   */
  static async generateAiSubtasks(input: {
    description: string;
    count?: number;
    hoursEach?: number;
  }): Promise<{
    subtasks: { title: string; hours: number }[];
    source: "gemini" | "mock";
  }> {
    try {
      const response = await apiClient.post("/api/tickets/ai-generate-subtasks", input, {
        timeout: 120000,
      });
      return response.data.data;
    } catch (error: any) {
      console.error("Error regenerating AI subtasks:", error);
      if (error?.code === "ECONNABORTED") {
        throw new Error("Subtask generation took too long. Please try again.");
      }
      throw new Error(error.response?.data?.error || "Failed to regenerate subtasks");
    }
  }

  /**
   * Create a new ticket
   */
  static async createTicket(ticketData: TicketFormData): Promise<Ticket> {
    try {
      const response = await apiClient.post("/api/tickets", ticketData);
      return sanitizeTicket(response.data.data);
    } catch (error: any) {
      console.error("Error creating ticket:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to create ticket";
      throw new Error(errorMessage);
    }
  }

  /**
   * Get tickets optimized for Kanban view
   * Returns tickets grouped by status with metadata
   */
  static async getKanbanTickets(params: {
    projectId?: string;
    assigneeId?: string;
    priority?: string;
    type?: string;
    search?: string;
    limitPerColumn?: number;
  }): Promise<{
    columns: Record<
      string,
      {
        status: string;
        tickets: Ticket[];
        total: number;
        hasMore: boolean;
        loaded: number;
      }
    >;
    summary: {
      total: number;
      loaded: number;
    };
  }> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, value.toString());
        }
      });

      const response = await apiClient.get(
        `/api/tickets/kanban?${queryParams.toString()}`,
      );
      const data = response.data.data;
      if (data && data.columns) {
        Object.keys(data.columns).forEach(key => {
          if (Array.isArray(data.columns[key]?.tickets)) {
            data.columns[key].tickets = data.columns[key].tickets.map(sanitizeTicket);
          }
        });
      }
      return data;
    } catch (error) {
      console.error("Error fetching Kanban tickets:", error);
      throw new Error("Failed to fetch Kanban tickets");
    }
  }

  /**
   * Get all tickets with filtering and pagination
   */
  static async getTickets(params: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    type?: string;
    projectId?: string;
    assigneeId?: string;
    createdById?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    startDate?: string;
    endDate?: string;
    includeArchived?: boolean;
    archivedOnly?: boolean;
    ticketIds?: string;
    sprintId?: string;
  } = {}): Promise<TicketListResponse> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, value.toString());
        }
      });

      const response = await apiClient.get(
        `/api/tickets?${queryParams.toString()}`,
      );
      const resData = response.data;
      if (resData && Array.isArray(resData.data)) {
        resData.data = resData.data.map(sanitizeTicket);
      }
      return resData;
    } catch (error) {
      console.error("Error fetching tickets:", error);
      throw new Error("Failed to fetch tickets");
    }
  }

  /**
   * Get public ticket by ID
   */
  static async getPublicTicketById(id: string): Promise<Ticket> {
    try {
      const response = await apiClient.get(`/api/public/tickets/${id}`);
      return sanitizeTicket(response.data.data);
    } catch (error) {
      console.error("Error fetching public ticket:", error);
      throw new Error("Failed to fetch public ticket");
    }
  }

  /**
   * Get ticket by ID
   */
  static async getTicketById(id: string): Promise<Ticket> {
    try {
      const response = await apiClient.get(`/api/tickets/${id}`);
      return sanitizeTicket(response.data.data);
    } catch (error) {
      console.error("Error fetching ticket:", error);
      throw new Error("Failed to fetch ticket");
    }
  }

  /**
   * Get tickets assigned to current user
   */
  static async getMyTickets(
    params: {
      page?: number;
      limit?: number;
      status?: string;
      priority?: string;
    } = {},
  ): Promise<TicketListResponse> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, value.toString());
        }
      });

      const response = await apiClient.get(
        `/api/tickets/my?${queryParams.toString()}`,
      );
      const resData = response.data;
      if (resData && Array.isArray(resData.data)) {
        resData.data = resData.data.map(sanitizeTicket);
      }
      return resData;
    } catch (error) {
      console.error("Error fetching my tickets:", error);
      throw new Error("Failed to fetch your tickets");
    }
  }

  /**
   * Get tickets assigned to current user for a specific project
   * Used for daily updates feature to select tickets
   */
  static async getMyTicketsByProject(projectId: string): Promise<
    Array<{
      id: string;
      ticketNumber: string;
      title: string;
      status: string;
      priority: string;
    }>
  > {
    try {
      const response = await apiClient.get(
        `/api/projects/${projectId}/tickets/my`,
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching tickets for project:", error);
      throw new Error("Failed to fetch tickets for this project");
    }
  }

  /**
   * Get all tickets for a specific project (for daily updates)
   * Returns tickets that user has access to
   */
  static async getProjectTickets(projectId: string): Promise<
    Array<{
      id: string;
      ticketNumber: string;
      title: string;
      status: string;
      priority: string;
    }>
  > {
    try {
      const response = await apiClient.get(
        `/api/projects/${projectId}/tickets/my`,
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching project tickets:", error);
      throw new Error("Failed to fetch project tickets");
    }
  }

  /**
   * Update ticket
   */
  static async updateTicket(
    id: string,
    updates: Partial<TicketFormData>,
  ): Promise<Ticket> {
    try {
      const response = await apiClient.put(`/api/tickets/${id}`, updates);
      return sanitizeTicket(response.data.data);
    } catch (error: any) {
      console.error("Error updating ticket:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to update ticket";
      throw new Error(errorMessage);
    }
  }

  /**
   * Get distinct tags used across all tickets in the tenant.
   */
  static async getAllTags(): Promise<string[]> {
    try {
      const response = await apiClient.get(`/api/tickets/tags`);
      return response.data.data || [];
    } catch (error: any) {
      console.error("Error fetching ticket tags:", error);
      return [];
    }
  }

  /**
   * Recent comments + attachments for a project — powers the Ticket page sidebar.
   * When `userId` is provided, results are scoped to activity the user cares
   * about (their own comments/uploads, or others' activity on tickets they own).
   * Returns the latest activity per ticket (deduped).
   */
  static async getRecentActivity(params: {
    projectId?: string;
    userId?: string;
    limit?: number;
  } = {}): Promise<RecentActivityResponse> {
    try {
      const query = new URLSearchParams();
      if (params.projectId) query.append("projectId", params.projectId);
      if (params.userId) query.append("userId", params.userId);
      if (params.limit) query.append("limit", String(params.limit));
      const response = await apiClient.get(
        `/api/tickets/recent-activity${query.toString() ? `?${query.toString()}` : ""}`,
      );
      return (
        response.data?.data || { comments: [], attachments: [], overdue: [] }
      );
    } catch (error: any) {
      console.error("Error fetching recent ticket activity:", error);
      return { comments: [], attachments: [], overdue: [] };
    }
  }

  /**
   * Delete ticket
   */
  static async deleteTicket(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/tickets/${id}`);
    } catch (error: any) {
      console.error("Error deleting ticket:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to delete ticket";
      throw new Error(errorMessage);
    }
  }

  /**
   * Update workflow step
   */
  static async updateWorkflowStep(
    id: string,
    stepName: string,
    updates: any,
  ): Promise<Ticket> {
    try {
      const response = await apiClient.put(`/api/tickets/${id}/workflow`, {
        stepName,
        updates,
      });
      return sanitizeTicket(response.data.data);
    } catch (error: any) {
      console.error("Error updating workflow step:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to update workflow step";
      throw new Error(errorMessage);
    }
  }

  /**
   * Get comments for a ticket
   */
  static async getComments(ticketId: string): Promise<
    Array<{
      id: string;
      comment: string;
      timestamp: string;
      user: {
        id: string;
        name: string;
        workEmail: string;
        position?: string;
        avatarUrl?: string | null;
      };
    }>
  > {
    try {
      const response = await apiClient.get(`/api/tickets/${ticketId}/comments`);
      return response.data.data;
    } catch (error: any) {
      console.error("Error fetching comments:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to fetch comments";
      throw new Error(errorMessage);
    }
  }

  /**
   * Get activity log for a ticket
   */
  static async getActivityLog(ticketId: string): Promise<
    Array<{
      id: string;
      action: string;
      details: any;
      timestamp: string;
      performedBy: {
        id: string;
        name: string;
        workEmail: string;
        position?: string;
        avatarUrl?: string | null;
      };
    }>
  > {
    try {
      const response = await apiClient.get(`/api/tickets/${ticketId}/activity`);
      return response.data.data;
    } catch (error: any) {
      console.error("Error fetching activity log:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to fetch activity log";
      throw new Error(errorMessage);
    }
  }

  /**
   * Add comment to ticket
   */
  static async addComment(
    id: string,
    comment: string,
    attachments?: any[],
  ): Promise<any> {
    try {
      const response = await apiClient.post(`/api/tickets/${id}/comments`, {
        comment,
        attachments,
      });
      return response.data.data;
    } catch (error: any) {
      console.error("Error adding comment:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to add comment";
      throw new Error(errorMessage);
    }
  }

  /**
   * Update comment
   */
  static async updateComment(
    ticketId: string,
    commentId: string,
    comment: string,
  ): Promise<any> {
    try {
      const response = await apiClient.put(
        `/api/tickets/${ticketId}/comments/${commentId}`,
        {
          comment,
        },
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Error updating comment:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to update comment";
      throw new Error(errorMessage);
    }
  }

  /**
   * Delete comment
   */
  static async deleteComment(
    ticketId: string,
    commentId: string,
  ): Promise<void> {
    try {
      await apiClient.delete(`/api/tickets/${ticketId}/comments/${commentId}`);
    } catch (error: any) {
      console.error("Error deleting comment:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to delete comment";
      throw new Error(errorMessage);
    }
  }

  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await apiClient.get("/api/tickets/dashboard/stats");
      return response.data.data;
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      throw new Error("Failed to fetch dashboard statistics");
    }
  }

  /**
   * Get team members
   */
  static async getTeamMembers(
    project?: string,
    role?: string,
  ): Promise<
    Array<{
      value: string;
      label: string;
      email: string;
      position: string;
      role: string;
      avatarUrl?: string | null;
    }>
  > {
    try {
      const params = new URLSearchParams();
      if (project) params.append("project", project);
      if (role) params.append("role", role);

      const response = await apiClient.get(
        `/api/settings/team-members?${params.toString()}`,
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching team members:", error);
      throw new Error("Failed to fetch team members");
    }
  }

  /**
   * Get release plans by project
   */
  static async getReleasePlansByProject(project: string): Promise<
    Array<{
      value: string;
      label: string;
      description: string;
      progress: number;
      totalTickets: number;
      completedTickets: number;
      endDate: string;
      status?: string;
      startDate?: string;
    }>
  > {
    try {
      const response = await apiClient.get(
        `/api/settings/release-plans/${project}`,
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching release plans:", error);
      throw new Error("Failed to fetch release plans");
    }
  }

  /**
   * Get related links for a ticket
   */
  static async getRelatedLinks(ticketId: string): Promise<RelatedLink[]> {
    try {
      const response = await apiClient.get(`/api/tickets/${ticketId}/links`);
      return response.data.data;
    } catch (error: any) {
      console.error("Error fetching related links:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to fetch related links";
      throw new Error(errorMessage);
    }
  }

  /**
   * Add related link to ticket
   */
  static async addRelatedLink(
    ticketId: string,
    linkData: {
      linkType: "ui_design" | "scope_doc" | "sample_response" | "dev_doc";
      title: string;
      description: string;
      url: string;
    },
  ): Promise<RelatedLink> {
    try {
      const response = await apiClient.post(
        `/api/tickets/${ticketId}/links`,
        linkData,
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Error adding related link:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to add related link";
      throw new Error(errorMessage);
    }
  }

  /**
   * Update related link
   */
  static async updateRelatedLink(
    ticketId: string,
    linkId: string,
    updates: {
      title?: string;
      description: string;
      url: string;
    },
  ): Promise<RelatedLink> {
    try {
      const response = await apiClient.put(
        `/api/tickets/${ticketId}/links/${linkId}`,
        updates,
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Error updating related link:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to update related link";
      throw new Error(errorMessage);
    }
  }

  /**
   * Delete related link
   */
  static async deleteRelatedLink(
    ticketId: string,
    linkId: string,
  ): Promise<void> {
    try {
      await apiClient.delete(`/api/tickets/${ticketId}/links/${linkId}`);
    } catch (error: any) {
      console.error("Error deleting related link:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to delete related link";
      throw new Error(errorMessage);
    }
  }

  /**
   * QA records (test scopes / scenarios / runs) linked to a ticket.
   * Only ticket-read permission is needed — names arrive denormalized so PMs
   * without QA workspace access can still open what QA attached.
   */
  static async getQaLinks(ticketId: string): Promise<TicketQaLink[]> {
    try {
      const response = await apiClient.get(`/api/tickets/${ticketId}/qa-links`);
      return response.data.data;
    } catch (error: any) {
      console.error("Error fetching QA links:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to fetch QA links";
      throw new Error(errorMessage);
    }
  }

  /**
   * Link a QA record to a ticket. Returns the ticket's full QA link list.
   */
  static async addQaLink(
    ticketId: string,
    link: { entityType: QaEntityType; entityId: string },
  ): Promise<TicketQaLink[]> {
    try {
      const response = await apiClient.post(
        `/api/tickets/${ticketId}/qa-links`,
        link,
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Error linking QA record:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to link QA record";
      throw new Error(errorMessage);
    }
  }

  /**
   * Remove a QA link from a ticket
   */
  static async deleteQaLink(ticketId: string, linkId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/tickets/${ticketId}/qa-links/${linkId}`);
    } catch (error: any) {
      console.error("Error removing QA link:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to remove QA link";
      throw new Error(errorMessage);
    }
  }

  /**
   * Upload attachment to ticket
   */
  static async uploadAttachment(
    ticketId: string,
    file: string,
    fileName: string,
  ): Promise<any> {
    try {
      const response = await apiClient.post(
        `/api/tickets/${ticketId}/attachments`,
        {
          file,
          fileName,
        },
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Error uploading attachment:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to upload attachment";
      throw new Error(errorMessage);
    }
  }

  /**
   * Get attachments for a ticket
   */
  static async getAttachments(ticketId: string): Promise<
    Array<{
      id: string;
      fileName: string;
      fileUrl: string;
      fileSize: number;
      fileType: string;
      uploadedAt: string;
      uploadedBy: {
        id: string;
        name: string;
        workEmail: string;
        position: string;
      };
    }>
  > {
    try {
      const response = await apiClient.get(
        `/api/tickets/${ticketId}/attachments`,
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Error fetching attachments:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to fetch attachments";
      throw new Error(errorMessage);
    }
  }

  /**
   * Delete attachment
   */
  static async deleteAttachment(
    ticketId: string,
    attachmentId: string,
  ): Promise<void> {
    try {
      await apiClient.delete(
        `/api/tickets/${ticketId}/attachments/${attachmentId}`,
      );
    } catch (error: any) {
      console.error("Error deleting attachment:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to delete attachment";
      throw new Error(errorMessage);
    }
  }

  /**
   * Rename attachment
   */
  static async renameAttachment(
    ticketId: string,
    attachmentId: string,
    newFileName: string,
  ): Promise<any> {
    try {
      const response = await apiClient.put(
        `/api/tickets/${ticketId}/attachments/${attachmentId}`,
        { newFileName },
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Error renaming attachment:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to rename attachment";
      throw new Error(errorMessage);
    }
  }

  /**
   * Get Tickets By Project Name
   */
  static async getTicketsByProjectId(
    projectId: string,
  ): Promise<any> {
    try {
      if (!Boolean(projectId)) {
        return [];
      }

      const response = await apiClient.get(
        `/api/projects/${projectId}/tickets/my`,
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Error Fetching ticket data:", error);
      const errorMessage =
        error.response?.data?.error || "Error Fetching ticket data";
      throw new Error(errorMessage);
    }
  }
  /**
   * Bulk archive tickets
   */
  static async bulkArchive(ticketIds: string[]): Promise<any> {
    try {
      const response = await apiClient.patch("/api/tickets/bulk/archive", {
        ticketIds,
      });
      return response.data;
    } catch (error: any) {
      console.error("Error bulk archiving tickets:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to archive tickets";
      throw new Error(errorMessage);
    }
  }

  /**
   * Bulk unarchive tickets
   */
  static async bulkUnarchive(ticketIds: string[]): Promise<any> {
    try {
      const response = await apiClient.patch("/api/tickets/bulk/unarchive", {
        ticketIds,
      });
      return response.data;
    } catch (error: any) {
      console.error("Error bulk unarchiving tickets:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to unarchive tickets";
      throw new Error(errorMessage);
    }
  }

  /**
   * Bulk delete tickets
   */
  static async bulkDelete(ticketIds: string[]): Promise<any> {
    try {
      const response = await apiClient.patch("/api/tickets/bulk/delete", {
        ticketIds,
      });
      return response.data;
    } catch (error: any) {
      console.error("Error bulk deleting tickets:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to delete tickets";
      throw new Error(errorMessage);
    }
  }
}


export default TicketService;
