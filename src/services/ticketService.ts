import { apiClient } from '@/lib/axios';

export interface TicketFormData {
  title: string;
  description: string;
  platform: string;
  project: string;
  parentTickets?: string[];
  parentTicketNotes?: string;
  stack?: string;
  priority: string;
  taskLevel: string;
  taskType: string;
  storyPoint: number;
  estimateHours: number;
  reportTo: string;
  assignee: string;
  startDate: string;
  endDate: string;
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

export interface Ticket {
  _id: string;
  ticketNumber: string;
  title: string;
  description: string;
  platform: string;
  project: {
    _id: string;
    name: string;
    code: string;
    description?: string;
  } | string;
  priority: string;
  taskLevel: string;
  taskType: string;
  status: string;
  assignee: {
    _id: string;
    name: string;
    email: string;
  };
  reportTo: {
    _id: string;
    name: string;
    email: string;
  } | string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  storyPoint?: number;
  estimateHours?: number;
  startDate?: string;
  endDate?: string;
  comments?: Array<{
    _id: string;
    userId: {
      _id: string;
      name: string;
      email: string;
    };
    comment: string;
    timestamp: string;
  }>;
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
    _id: string;
    statuses: Array<{
      status: string;
      count: number;
    }>;
    total: number;
  }>;
  priorityStats: Array<{
    _id: string;
    count: number;
  }>;
  recentActivity: Ticket[];
  teamStats: Array<{
    _id: string;
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
   * Get all tickets with filtering and pagination
   */
  static async getTickets(params: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    project?: string;
    assignee?: string;
    createdBy?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    startDate?: string;
    endDate?: string;
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
}

export default TicketService;
