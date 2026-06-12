import { apiClient } from '@/lib/axios';

export interface ReleasePlanFormData {
  version: string;        // Changed from 'name' to match backend
  description: string;
  projectId: string;      // Changed from 'project' to match backend
  releaseDate: string;    // Changed from 'deadline' to match backend
  startDate?: string;
  endDate?: string;
  goal?: string;
  status?: 'planning' | 'active' | 'completed' | 'cancelled';
  tickets?: string[];
  type?: 'sprint_plan' | 'demo_plan' | 'release_plan';
}

export interface ReleasePlan {
  id: string;
  version: string;
  name?: string;
  description: string;
  project: {
    id: string;
    name: string;
    code: string;
    description?: string;
  } | string;
  deadline: string;
  releaseDate?: string;
  startDate?: string;
  endDate?: string;
  startedAt?: string;
  completedAt?: string;
  goal?: string;
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
    avatarUrl?: string;
  };
  assignedTo: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  notes?: string;
  tags?: string[];
  priority: 'High' | 'Medium' | 'Low';
  type: 'sprint_plan' | 'demo_plan' | 'release_plan';
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
    avatarUrl?: string;
  };
  createdAt: string;
  estimateHours?: number;
}

class ReleasePlanService {
  /**
   * Create a new Plans
   */
  static async createReleasePlan(releasePlanData: ReleasePlanFormData): Promise<ReleasePlan> {
    try {
      const response = await apiClient.post('/api/release-plans', releasePlanData);
      return response?.data?.data;
    } catch (error: any) {
      console.error('Error creating Plans:', error);
      const errorMessage = error?.message || error?.response?.data?.error || 'Failed to create Plans';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get all release plans with filtering and pagination
   */
  static async getReleasePlans(params: {
    page?: number;
    limit?: number;
    projectId?: string;
    status?: string;
    priority?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    type?: string;
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
   * Get Plans by ID
   */
  static async getReleasePlanById(id: string): Promise<ReleasePlan> {
    try {
      const response = await apiClient.get(`/api/release-plans/${id}`);
      return response?.data?.data;
    } catch (error) {
      console.error('Error fetching Plans:', error);
      throw new Error('Failed to fetch Plans');
    }
  }

  /**
   * Update Plans
   */
  static async updateReleasePlan(id: string, updates: Partial<ReleasePlanFormData>): Promise<ReleasePlan> {
    try {
      const response = await apiClient.put(`/api/release-plans/${id}`, updates);
      return response?.data?.data;
    } catch (error: any) {
      console.error('Error updating Plans:', error);
      const errorMessage = error?.message || error?.response?.data?.error || 'Failed to update Plans';
      throw new Error(errorMessage);
    }
  }

  /**
   * Delete Plans
   */
  static async deleteReleasePlan(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/release-plans/${id}`);
    } catch (error: any) {
      console.error('Error deleting Plans:', error);
      const errorMessage = error?.message || error?.response?.data?.error || 'Failed to delete Plans';
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
   * @param projectId - Optional project ID to filter active plans by project
   */
  static async getActiveReleasePlans(projectId?: string): Promise<ReleasePlan[]> {
    try {
      const url = projectId
        ? `/api/release-plans/active?projectId=${projectId}`
        : '/api/release-plans/active';
      const response = await apiClient.get(url);
      return response?.data?.data || [];
    } catch (error) {
      console.error('Error fetching active release plans:', error);
      throw new Error('Failed to fetch active release plans');
    }
  }

  /**
   * Get available sprints (active + planning) for a project
   * Used for sprint assignment dropdowns in buckets, trash, etc.
   * @param projectId - Project ID to get available sprints for
   */
  static async getAvailableSprints(projectId: string): Promise<ReleasePlan[]> {
    try {
      const response = await apiClient.get('/api/release-plans/available', {
        params: { projectId }
      });
      return response?.data?.data || [];
    } catch (error) {
      console.error('Error fetching available sprints:', error);
      throw new Error('Failed to fetch available sprints');
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
   * Add ticket to Plans
   */
  static async addTicketToReleasePlan(releasePlanId: string, ticketId: string): Promise<ReleasePlan> {
    try {
      const response = await apiClient.post(`/api/release-plans/${releasePlanId}/tickets`, {
        ticketId
      });
      return response?.data?.data;
    } catch (error: any) {
      console.error('Error adding ticket to Plans:', error);
      const errorMessage = error?.response?.data?.error || 'Failed to add ticket to Plans';
      throw new Error(errorMessage);
    }
  }

  /**
   * Remove ticket from Plans
   */
  static async removeTicketFromReleasePlan(releasePlanId: string, ticketId: string): Promise<ReleasePlan> {
    try {
      const response = await apiClient.delete(`/api/release-plans/${releasePlanId}/tickets/${ticketId}`);
      return response?.data?.data;
    } catch (error: any) {
      console.error('Error removing ticket from Plans:', error);
      const errorMessage = error?.response?.data?.error || 'Failed to remove ticket from Plans';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get Plans statistics
   */
  static async getReleasePlanStats(): Promise<any> {
    try {
      const response = await apiClient.get('/api/release-plans/stats');
      return response?.data?.data;
    } catch (error) {
      console.error('Error fetching Plans statistics:', error);
      throw new Error('Failed to fetch Plans statistics');
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
  /**
   * Start a sprint
   */
  static async startSprint(id: string): Promise<ReleasePlan> {
    try {
      const response = await apiClient.post(`/api/release-plans/${id}/start`);
      return response?.data?.data;
    } catch (error: any) {
      console.error('Error starting sprint:', error);
      const errorMessage = error?.response?.data?.error || 'Failed to start sprint';
      throw new Error(errorMessage);
    }
  }

  /**
   * Complete a sprint
   */
  static async completeSprint(id: string): Promise<ReleasePlan> {
    try {
      const response = await apiClient.post(`/api/release-plans/${id}/complete`);
      return response?.data?.data;
    } catch (error: any) {
      console.error('Error completing sprint:', error);
      const errorMessage = error?.response?.data?.error || 'Failed to complete sprint';
      throw new Error(errorMessage);
    }
  }
}

export default ReleasePlanService;
