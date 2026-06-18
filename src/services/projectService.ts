import { api, ApiError, apiUtils, PaginatedResponse } from "@/lib/axios";

export interface Project {
  id: string; // Changed from id
  name: string;
  code: string;
  description: string;
  status: string; // Dynamic status
  startDate: string;
  endDate?: string;
  projectManagerId: string; // Added for backend compatibility
  projectManager: {
    id: string; // Changed from id
    name: string;
    workEmail: string; // Changed from email
    position: string;
    avatarUrl: string;
  };
  members: Array<{
    // Changed from teamMembers
    user: {
      id: string; // Changed from id
      name: string;
      workEmail: string; // Changed from email
      position: string;
      // avatarUrl: string;
    };
  }>;
  repositories: Array<{
    name: string;
    url: string;
    branch: string;
  }>;
  workflowTemplate: string[];
  defaultPriority: string; // Dynamic priority
  totalTickets: number;
  completedTickets: number;
  inProgressTickets: number;
  createdBy: {
    id: string; // Changed from id
    name: string;
    workEmail: string; // Changed from email
  };
  createdAt: string;
  updatedAt: string;
  /**
   * Clients this project is linked to via `client_projects`. A project can
   * be shared with multiple clients (rare but supported). Populated by
   * GET /api/projects; absent on single-project endpoints.
   */
  clients?: { id: string; companyName: string; clientCode: string | null }[];
}

export interface CreateProjectData {
  name: string;
  code?: string; // Optional - will be auto-generated if not provided
  description: string;
  status?: string; // Dynamic status
  startDate: string;
  endDate?: string;
  projectManagerId: string; // Changed from projectManager
  teamMemberIds?: string[]; // Changed from teamMembers
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
  projectManagerId: string; // Changed from projectManager
  teamMemberIds?: string[]; // Changed from teamMembers
  repositories?: Array<{
    name: string;
    url: string;
    branch: string;
  }>;
  workflowTemplate?: string[];
  defaultPriority?: string; // Dynamic priority
}

export interface ProjectsFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  projectManagerId?: string; // Changed from projectManager
  userId?: string; // Added filter
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
  static async getProjects(
    filters: ProjectsFilters = {},
  ): Promise<PaginatedResponse<Project>> {
    try {
      return await apiUtils.getPaginated<Project>("/api/projects", filters);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to fetch projects");
    }
  }

  /**
   * Get next project code based on maximum numerical code
   */
  static async getNextCode(): Promise<string> {
    try {
      const response = await api.get<string>("/api/projects/next-code");
      return response;
    } catch (error) {
      console.error("Failed to fetch next project code:", error);
      return "";
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
      throw new Error("Failed to fetch project");
    }
  }

  /**
   * Create a new project
   */
  static async createProject(data: CreateProjectData): Promise<Project> {
    try {
      return await api.post<Project>("/api/projects", data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to create project");
    }
  }

  /**
   * Update an existing project
   */
  static async updateProject(
    id: string,
    data: UpdateProjectData,
  ): Promise<Project> {
    try {
      return await api.put<Project>(`/api/projects/${id}`, data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to update project");
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
      throw new Error("Failed to delete project");
    }
  }

  /**
   * Get projects for dropdown/select options
   */
  static async getProjectsForSelect(
    customerId?: string,
  ): Promise<
    Array<{ value: string; label: string; code: string }>
  > {
    try {
      const config = customerId ? { params: { customerId } } : undefined;
      return await api.get<
        Array<{
          value: string;
          label: string;
          code: string;
          description: string;
        }>
      >("/api/projects/select", config);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to fetch projects for selection");
    }
  }

  /**
   * Get rich project data for selection screen
   */
  static async getSelectionProjects(): Promise<PaginatedResponse<Project>> {
    try {
      // The backend returns { success: true, data: [...] } which Axios interceptor likely unwraps to just data
      // But typically we return a list. Adjust return type if needed based on backend response structure.
      // Based on controller it returns `enrichedProjects` array directly in `data`.
      // The `api.get` generic usually matches the response body `data` property or the full response.
      // Assuming valid Axios setup:
      return await api.get("/api/projects/selection");
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to fetch selection projects");
    }
  }

  /**
   * Get projects where user is a member (for ticket creation)
   */
  static async getUserProjects(): Promise<
    Array<{ value: string; label: string; code: string }>
  > {
    try {
      return await api.get<
        Array<{
          value: string;
          label: string;
          code: string;
          description: string;
        }>
      >("/api/projects/user-projects");
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to fetch user projects");
    }
  }

  /**
   * Get projects where user is a member or project manager (for ticket creation)
   */
  static async getUserProjectsForTickets(): Promise<
    Array<{ value: string; label: string; code: string }>
  > {
    try {
      return await api.get<
        Array<{
          value: string;
          label: string;
          code: string;
          description: string;
        }>
      >("/api/projects/user-projects-for-tickets");
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to fetch user projects for tickets");
    }
  }

  /**
   * Get project statistics
   */
  static async getProjectStats(): Promise<ProjectStats> {
    try {
      return await api.get<ProjectStats>("/api/projects/stats");
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to fetch project statistics");
    }
  }

  /**
   * Add team member to project
   */
  static async addTeamMember(
    projectId: string,
    userId: string,
  ): Promise<Project> {
    // Changed from memberId to userId
    try {
      return await api.post<Project>(
        `/api/projects/${projectId}/team-members`,
        { userId },
      ); // Changed from memberId to userId
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to add team member");
    }
  }

  /**
   * Remove team member from project
   */
  static async removeTeamMember(
    projectId: string,
    userId: string,
  ): Promise<Project> {
    // Changed from memberId to userId
    try {
      return await api.delete<Project>(
        `/api/projects/${projectId}/team-members/${userId}`,
      ); // Changed from members to team-members
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to remove team member");
    }
  }

  /**
   * Get project statistics by ID
   */
  static async getProjectStatsById(id: string): Promise<any> {
    try {
      return await api.get(`/api/projects/${id}/stats`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to fetch project statistics");
    }
  }

  /**
   * Get project members for dropdown/select options
   */
  static async getProjectMembers(
    projectId: string,
  ): Promise<
    Array<{
      value: string;
      label: string;
      position: string;
      workEmail: string;
      isProjectManager: boolean;
    }>
  > {
    try {
      return await api.get<
        Array<{
          value: string;
          label: string;
          position: string;
          workEmail: string;
          isProjectManager: boolean;
        }>
      >(`/api/projects/${projectId}/members`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to fetch project members");
    }
  }
  /**
   * Get project overview data (aggregated stats, sprints, team, activities)
   */
  static async getProjectOverview(projectId: string): Promise<any> {
    try {
      return await api.get(`/api/projects/${projectId}/overview`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to fetch project overview");
    }
  }

  /**
   * Get all project tickets for the timeline view (loaded on demand,
   * only when the Timeline tab is opened)
   */
  static async getProjectTimeline(projectId: string): Promise<any> {
    try {
      return await api.get(`/api/projects/${projectId}/timeline`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to fetch project timeline");
    }
  }

}
