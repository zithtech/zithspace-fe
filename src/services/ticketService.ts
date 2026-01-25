import { apiClient } from '@/lib/axios';

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
  releasePlan?: string;
  selectedWorkflowSteps?: string[];
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
  type: 'ui_design' | 'scope_doc' | 'sample_response' | 'dev_doc';
  title: string;
  description: string;
  url: string;
  addedBy: {
    id: string;
    name: string;
    email: string;
  };
  addedAt: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  platform: string;
  project: {
    id: string;
    name: string;
    code: string;
    description?: string;
  } | string;
  stack?: string;
  priority: string;
  taskLevel: string;
  type: string;
  status: string;
  assignee: {
    id: string;
    name: string;
    email: string;
  };
  reportTo: {
    id: string;
    name: string;
    email: string;
  } | string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  storyPoint?: number;
  estimateHours?: number;
  startDate?: string;
  endDate?: string;
  releasePlanId?: string; // Mapped from backend
  sprintPlanId?: string;  // Mapped from backend
  parentId?: string;      // Hierarchy support (Subtask)
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
    };
    comment: string;
    timestamp: string;
  }>;
  subTasks?: Ticket[];
}

export interface TicketListResponse {
  success: boolean;
  data: Ticket[];
  pagination: {
    page: number;
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
      const response = await apiClient.get('/api/settings/ticket-configurations');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching ticket configurations:', error);
      throw new Error('Failed to fetch ticket configurations');
    }
  }

  /**
   * Get parent tickets for linking
   */
  static async getParentTickets(project?: string, exclude?: string): Promise<ParentTicket[]> {
    try {
      const params = new URLSearchParams();
      if (project) params.append('project', project);
      if (exclude) params.append('exclude', exclude);

      const response = await apiClient.get(`/api/settings/parent-tickets?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching parent tickets:', error);
      throw new Error('Failed to fetch parent tickets');
    }
  }

  /**
   * Create a new ticket
   */
  static async createTicket(ticketData: TicketFormData): Promise<Ticket> {
    try {
      const response = await apiClient.post('/api/tickets', ticketData);
      return response.data.data;
    } catch (error: any) {
      console.error('Error creating ticket:', error);
      const errorMessage = error.response?.data?.error || 'Failed to create ticket';
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
    search?: string;
    limitPerColumn?: number;
  }): Promise<{
    columns: Record<string, {
      status: string;
      tickets: Ticket[];
      total: number;
      hasMore: boolean;
      loaded: number;
    }>;
    summary: {
      total: number;
      loaded: number;
    };
  }> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await apiClient.get(`/api/tickets/kanban?${queryParams.toString()}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching Kanban tickets:', error);
      throw new Error('Failed to fetch Kanban tickets');
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
  } = {}): Promise<TicketListResponse> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await apiClient.get(`/api/tickets?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching tickets:', error);
      throw new Error('Failed to fetch tickets');
    }
  }

  /**
   * Get ticket by ID
   */
  static async getTicketById(id: string): Promise<Ticket> {
    try {
      const response = await apiClient.get(`/api/tickets/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching ticket:', error);
      throw new Error('Failed to fetch ticket');
    }
  }

  /**
   * Get tickets assigned to current user
   */
  static async getMyTickets(params: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
  } = {}): Promise<TicketListResponse> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await apiClient.get(`/api/tickets/my?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching my tickets:', error);
      throw new Error('Failed to fetch your tickets');
    }
  }

  /**
   * Get tickets assigned to current user for a specific project
   * Used for daily updates feature to select tickets
   */
  static async getMyTicketsByProject(projectId: string): Promise<Array<{
    id: string;
    ticketNumber: string;
    title: string;
    status: string;
    priority: string;
  }>> {
    try {
      const response = await apiClient.get(`/api/projects/${projectId}/tickets/my`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching tickets for project:', error);
      throw new Error('Failed to fetch tickets for this project');
    }
  }

  /**
   * Get all tickets for a specific project (for daily updates)
   * Returns tickets that user has access to
   */
  static async getProjectTickets(projectId: string): Promise<Array<{
    id: string;
    ticketNumber: string;
    title: string;
    status: string;
    priority: string;
  }>> {
    try {
      const response = await apiClient.get(`/api/projects/${projectId}/tickets`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching project tickets:', error);
      throw new Error('Failed to fetch project tickets');
    }
  }

  /**
   * Update ticket
   */
  static async updateTicket(id: string, updates: Partial<TicketFormData>): Promise<Ticket> {
    try {
      const response = await apiClient.put(`/api/tickets/${id}`, updates);
      return response.data.data;
    } catch (error: any) {
      console.error('Error updating ticket:', error);
      const errorMessage = error.response?.data?.error || 'Failed to update ticket';
      throw new Error(errorMessage);
    }
  }

  /**
   * Delete ticket
   */
  static async deleteTicket(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/tickets/${id}`);
    } catch (error: any) {
      console.error('Error deleting ticket:', error);
      const errorMessage = error.response?.data?.error || 'Failed to delete ticket';
      throw new Error(errorMessage);
    }
  }

  /**
   * Update workflow step
   */
  static async updateWorkflowStep(id: string, stepName: string, updates: any): Promise<Ticket> {
    try {
      const response = await apiClient.put(`/api/tickets/${id}/workflow`, {
        stepName,
        updates
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Error updating workflow step:', error);
      const errorMessage = error.response?.data?.error || 'Failed to update workflow step';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get comments for a ticket
   */
  static async getComments(ticketId: string): Promise<Array<{
    id: string;
    comment: string;
    timestamp: string;
    user: {
      id: string;
      name: string;
      workEmail: string;
      position?: string;
    };
  }>> {
    try {
      const response = await apiClient.get(`/api/tickets/${ticketId}/comments`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching comments:', error);
      const errorMessage = error.response?.data?.error || 'Failed to fetch comments';
      throw new Error(errorMessage);
    }
  }

  /**
   * Add comment to ticket
   */
  static async addComment(id: string, comment: string, attachments?: any[]): Promise<any> {
    try {
      const response = await apiClient.post(`/api/tickets/${id}/comments`, {
        comment,
        attachments
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Error adding comment:', error);
      const errorMessage = error.response?.data?.error || 'Failed to add comment';
      throw new Error(errorMessage);
    }
  }

  /**
   * Update comment
   */
  static async updateComment(ticketId: string, commentId: string, comment: string): Promise<any> {
    try {
      const response = await apiClient.put(`/api/tickets/${ticketId}/comments/${commentId}`, {
        comment
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Error updating comment:', error);
      const errorMessage = error.response?.data?.error || 'Failed to update comment';
      throw new Error(errorMessage);
    }
  }

  /**
   * Delete comment
   */
  static async deleteComment(ticketId: string, commentId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/tickets/${ticketId}/comments/${commentId}`);
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      const errorMessage = error.response?.data?.error || 'Failed to delete comment';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await apiClient.get('/api/tickets/dashboard/stats');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw new Error('Failed to fetch dashboard statistics');
    }
  }

  /**
   * Get team members
   */
  static async getTeamMembers(project?: string, role?: string): Promise<Array<{
    value: string;
    label: string;
    email: string;
    position: string;
    role: string;
  }>> {
    try {
      const params = new URLSearchParams();
      if (project) params.append('project', project);
      if (role) params.append('role', role);

      const response = await apiClient.get(`/api/settings/team-members?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching team members:', error);
      throw new Error('Failed to fetch team members');
    }
  }

  /**
   * Get release plans by project
   */
  static async getReleasePlansByProject(project: string): Promise<Array<{
    value: string;
    label: string;
    description: string;
    progress: number;
    totalTickets: number;
    completedTickets: number;
    endDate: string;
  }>> {
    try {
      const response = await apiClient.get(`/api/settings/release-plans/${project}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching release plans:', error);
      throw new Error('Failed to fetch release plans');
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
      console.error('Error fetching related links:', error);
      const errorMessage = error.response?.data?.error || 'Failed to fetch related links';
      throw new Error(errorMessage);
    }
  }

  /**
   * Add related link to ticket
   */
  static async addRelatedLink(ticketId: string, linkData: {
    linkType: 'ui_design' | 'scope_doc' | 'sample_response' | 'dev_doc';
    title: string;
    description: string;
    url: string;
  }): Promise<RelatedLink> {
    try {
      const response = await apiClient.post(`/api/tickets/${ticketId}/links`, linkData);
      return response.data.data;
    } catch (error: any) {
      console.error('Error adding related link:', error);
      const errorMessage = error.response?.data?.error || 'Failed to add related link';
      throw new Error(errorMessage);
    }
  }

  /**
   * Update related link
   */
  static async updateRelatedLink(ticketId: string, linkId: string, updates: {
    title?: string;
    description: string;
    url: string;
  }): Promise<RelatedLink> {
    try {
      const response = await apiClient.put(`/api/tickets/${ticketId}/links/${linkId}`, updates);
      return response.data.data;
    } catch (error: any) {
      console.error('Error updating related link:', error);
      const errorMessage = error.response?.data?.error || 'Failed to update related link';
      throw new Error(errorMessage);
    }
  }

  /**
   * Delete related link
   */
  static async deleteRelatedLink(ticketId: string, linkId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/tickets/${ticketId}/links/${linkId}`);
    } catch (error: any) {
      console.error('Error deleting related link:', error);
      const errorMessage = error.response?.data?.error || 'Failed to delete related link';
      throw new Error(errorMessage);
    }
  }

  /**
   * Upload attachment to ticket
   */
  static async uploadAttachment(ticketId: string, file: string, fileName: string): Promise<any> {
    try {
      const response = await apiClient.post(`/api/tickets/${ticketId}/attachments`, {
        file,
        fileName
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Error uploading attachment:', error);
      const errorMessage = error.response?.data?.error || 'Failed to upload attachment';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get attachments for a ticket
   */
  static async getAttachments(ticketId: string): Promise<Array<{
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
  }>> {
    try {
      const response = await apiClient.get(`/api/tickets/${ticketId}/attachments`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching attachments:', error);
      const errorMessage = error.response?.data?.error || 'Failed to fetch attachments';
      throw new Error(errorMessage);
    }
  }

  /**
   * Delete attachment
   */
  static async deleteAttachment(ticketId: string, attachmentId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/tickets/${ticketId}/attachments/${attachmentId}`);
    } catch (error: any) {
      console.error('Error deleting attachment:', error);
      const errorMessage = error.response?.data?.error || 'Failed to delete attachment';
      throw new Error(errorMessage);
    }
  }
}

export default TicketService;
