import { apiClient } from '@/lib/axios';

export interface ReleasePlanFormData {
  name: string;
  description: string;
  project: string;
  deadline: string;
  assignedTo?: string[];
  notes?: string;
  tags?: string[];
  priority: 'High' | 'Medium' | 'Low';
  tickets?: string[];
}

export interface ReleasePlan {
  id: string;
  name: string;
  description: string;
  project: {
    id: string;
    name: string;
    code: string;
    description?: string;
  } | string;
  deadline: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled' | 'on_hold';
  progress: number;
  tickets: Array<{
    id: string;
    ticketNumber: string;
    title: string;
    status: string;
    priority: string;
    assignee?: {
      id: string;
      name: string;
      email: string;
    };
  }>;
  totalTickets: number;
  completedTickets: number;
  inProgressTickets: number;
  notStartedTickets: number;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  assignedTo: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  notes?: string;
  tags?: string[];
  priority: 'High' | 'Medium' | 'Low';
  createdAt: string;
  updatedAt: string;
}

export interface ReleasePlanListResponse {
  success: boolean;
  data: ReleasePlan[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ProjectTicket {
  id: string;
  ticketNumber: string;
  title: string;
  status: string;
  priority: string;
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  estimateHours?: number;
}

class ReleasePlanService {
  /**
   * Create a new release plan
   */
  static async createReleasePlan(releasePlanData: ReleasePlanFormData): Promise<ReleasePlan> {
    try {
      const response = await apiClient.post('/api/release-plans', releasePlanData);
      return response?.data?.data;
    } catch (error: any) {
      console.error('Error creating release plan:', error);
      const errorMessage = error?.response?.data?.error || 'Failed to create release plan';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get all release plans with filtering and pagination
   */
  static async getReleasePlans(params: {
    page?: number;
    limit?: number;
    project?: string;
    status?: string;
    priority?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<ReleasePlanListResponse> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await apiClient.get(`/api/release-plans?${queryParams.toString()}`);
      return response?.data;
    } catch (error) {
      console.error('Error fetching release plans:', error);
      throw new Error('Failed to fetch release plans');
    }
  }

  /**
   * Get release plan by ID
   */
  static async getReleasePlanById(id: string): Promise<ReleasePlan> {
    try {
      const response = await apiClient.get(`/api/release-plans/${id}`);
      return response?.data?.data;
    } catch (error) {
      console.error('Error fetching release plan:', error);
      throw new Error('Failed to fetch release plan');
    }
  }

  /**
   * Update release plan
   */
  static async updateReleasePlan(id: string, updates: Partial<ReleasePlanFormData>): Promise<ReleasePlan> {
    try {
      const response = await apiClient.put(`/api/release-plans/${id}`, updates);
      return response?.data?.data;
    } catch (error: any) {
      console.error('Error updating release plan:', error);
      const errorMessage = error?.response?.data?.error || 'Failed to update release plan';
      throw new Error(errorMessage);
    }
  }

  /**
   * Delete release plan
   */
  static async deleteReleasePlan(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/release-plans/${id}`);
    } catch (error: any) {
      console.error('Error deleting release plan:', error);
      const errorMessage = error?.response?.data?.error || 'Failed to delete release plan';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get release plans by project
   */
  static async getReleasePlansByProject(projectId: string): Promise<ReleasePlan[]> {
    try {
      const response = await apiClient.get(`/api/release-plans/project/${projectId}`);
      return response?.data?.data || [];
    } catch (error) {
      console.error('Error fetching release plans by project:', error);
      throw new Error('Failed to fetch release plans by project');
    }
  }

  /**
   * Get active release plans
   */
  static async getActiveReleasePlans(): Promise<ReleasePlan[]> {
    try {
      const response = await apiClient.get('/api/release-plans/active');
      return response?.data?.data || [];
    } catch (error) {
      console.error('Error fetching active release plans:', error);
      throw new Error('Failed to fetch active release plans');
    }
  }

  /**
   * Get tickets by project with search functionality
   */
  static async getTicketsByProject(projectId: string, params: {
    search?: string;
    limit?: number;
    excludeReleasePlan?: string;
  } = {}): Promise<ProjectTicket[]> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await apiClient.get(`/api/release-plans/tickets/${projectId}?${queryParams.toString()}`);
      return response?.data?.data || [];
    } catch (error: any) {
      console.error('Error fetching tickets by project:', error);
      const errorMessage = error?.response?.data?.error || 'Failed to fetch tickets';
      throw new Error(errorMessage);
    }
  }

  /**
   * Add ticket to release plan
   */
  static async addTicketToReleasePlan(releasePlanId: string, ticketId: string): Promise<ReleasePlan> {
    try {
      const response = await apiClient.post(`/api/release-plans/${releasePlanId}/tickets`, {
        ticketId
      });
      return response?.data?.data;
    } catch (error: any) {
      console.error('Error adding ticket to release plan:', error);
      const errorMessage = error?.response?.data?.error || 'Failed to add ticket to release plan';
      throw new Error(errorMessage);
    }
  }

  /**
   * Remove ticket from release plan
   */
  static async removeTicketFromReleasePlan(releasePlanId: string, ticketId: string): Promise<ReleasePlan> {
    try {
      const response = await apiClient.delete(`/api/release-plans/${releasePlanId}/tickets/${ticketId}`);
      return response?.data?.data;
    } catch (error: any) {
      console.error('Error removing ticket from release plan:', error);
      const errorMessage = error?.response?.data?.error || 'Failed to remove ticket from release plan';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get release plan statistics
   */
  static async getReleasePlanStats(): Promise<any> {
    try {
      const response = await apiClient.get('/api/release-plans/stats');
      return response?.data?.data;
    } catch (error) {
      console.error('Error fetching release plan statistics:', error);
      throw new Error('Failed to fetch release plan statistics');
    }
  }

  /**
   * Search tickets across all projects
   */
  static async searchTickets(search: string, limit: number = 10): Promise<ProjectTicket[]> {
    try {
      // This would use the existing ticket search from ticketService
      const response = await apiClient.get(`/api/tickets?search=${encodeURIComponent(search)}&limit=${limit}&status=not_started,in_progress`);
      return response?.data?.data || [];
    } catch (error) {
      console.error('Error searching tickets:', error);
      throw new Error('Failed to search tickets');
    }
  }
}

export default ReleasePlanService;
