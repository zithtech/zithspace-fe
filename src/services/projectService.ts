import { api, ApiError, apiUtils, PaginatedResponse } from '@/lib/axios';

export interface Project {
  _id: string;
  name: string;
  code: string;
  description: string;
  status: string; // Dynamic status
  startDate: string;
  endDate?: string;
  projectManager: {
    _id: string;
    name: string;
    position: string;
  };
  teamMembers: Array<{
    _id: string;
    name: string;
    position: string;
    role: string;
  }>;
  repositories: Array<{
    name: string;
    url: string;
    branch: string;
  }>;
  workflowTemplate: string;
  defaultPriority: string; // Dynamic priority
  statistics: {
    totalTickets: number;
    completedTickets: number;
    inProgressTickets: number;
    pendingTickets: number;
    lastUpdated: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectData {
  name: string;
  code?: string; // Optional - will be auto-generated if not provided
  description: string;
  status?: string; // Dynamic status
  startDate: string;
  endDate?: string;
  projectManager: string;
  teamMembers?: string[];
  repositories?: Array<{
    name: string;
    url: string;
    branch: string;
  }>;
  workflowTemplate?: string[];
  defaultPriority?: string; // Dynamic priority
}

export interface UpdateProjectData {
  name: string;
  description: string;
  status: string; // Dynamic status
  startDate: string;
  endDate?: string;
  projectManager: string;
  teamMembers?: string[];
  repositories?: Array<{
    name: string;
    url: string;
    branch: string;
  }>;
  workflowTemplate?: string;
  defaultPriority?: string; // Dynamic priority
}

export interface ProjectsFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  projectManager?: string;
  startDate?: string;
  endDate?: string;
}

export interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  onHoldProjects: number;
  totalTickets: number;
  completedTickets: number;
}

export class ProjectService {
  /**
   * Get all projects with pagination and filters
   */
  static async getProjects(filters: ProjectsFilters = {}): Promise<PaginatedResponse<Project>> {
    try {
      return await apiUtils.getPaginated<Project>('/api/projects', filters);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to fetch projects');
    }
  }

  /**
   * Get a single project by ID
   */
  static async getProject(id: string): Promise<Project> {
    try {
      return await api.get<Project>(`/api/projects/${id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to fetch project');
    }
  }

  /**
   * Create a new project
   */
  static async createProject(data: CreateProjectData): Promise<Project> {
    try {
      return await api.post<Project>('/api/projects', data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to create project');
    }
  }

  /**
   * Update an existing project
   */
  static async updateProject(id: string, data: UpdateProjectData): Promise<Project> {
    try {
      return await api.put<Project>(`/api/projects/${id}`, data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to update project');
    }
  }

  /**
   * Delete a project
   */
  static async deleteProject(id: string): Promise<void> {
    try {
      await api.delete(`/api/projects/${id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to delete project');
    }
  }

  /**
   * Get projects for dropdown/select options
   */
  static async getProjectsForSelect(): Promise<Array<{ value: string; label: string; code: string }>> {
    try {
      const response = await api.get('/api/projects/select');
      return response.map((project: any) => ({
        value: project._id,
        label: project.name,
        code: project.code
      }));
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to fetch projects for selection');
    }
  }

  /**
   * Get projects where user is a member (for ticket creation)
   */
  static async getUserProjects(): Promise<Array<{ value: string; label: string; code: string }>> {
    try {
      const response = await api.get('/api/projects/user-projects');
      console.log({response})
      return response.map((project: any) => ({
        value: project.value,
        label: project.label,
        code: project.code
      }));
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to fetch user projects');
    }
  }

  /**
   * Get project statistics
   */
  static async getProjectStats(): Promise<ProjectStats> {
    try {
      return await api.get<ProjectStats>('/api/projects/stats');
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to fetch project statistics');
    }
  }

  /**
   * Add team member to project
   */
  static async addTeamMember(projectId: string, memberId: string): Promise<Project> {
    try {
      return await api.post<Project>(`/api/projects/${projectId}/members`, { memberId });
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to add team member');
    }
  }

  /**
   * Remove team member from project
   */
  static async removeTeamMember(projectId: string, memberId: string): Promise<Project> {
    try {
      return await api.delete<Project>(`/api/projects/${projectId}/members/${memberId}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to remove team member');
    }
  }
}
