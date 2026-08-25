import { api, ApiError } from "@/lib/axios";

export class JiraService {
  /**
   * Get the OAuth2 authorization URL for Jira.
   */
  static async getConnectUrl(returnUrl?: string): Promise<string> {
    try {
      const url = returnUrl ? `/api/integrations/jira/connect?returnUrl=${encodeURIComponent(returnUrl)}` : "/api/integrations/jira/connect";
      const res = await api.get<any>(url);
      return res.url || res.data?.url || res;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new Error("Failed to get Jira connect URL");
    }
  }

  /**
   * Get connection status for Jira.
   */
  static async getStatus(): Promise<{ connected: boolean }> {
    try {
      const res = await api.get<any>("/api/integrations/jira/status");
      return res.data || res;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new Error("Failed to get Jira status");
    }
  }

  /**
   * Disconnect Jira account.
   */
  static async disconnect(): Promise<void> {
    try {
      await api.post("/api/integrations/jira/disconnect", {});
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new Error("Failed to disconnect Jira account");
    }
  }

  /**
   * Get Jira projects.
   */
  static async getProjects(): Promise<{ id: string; key: string; name: string }[]> {
    try {
      const res = await api.get<any>("/api/integrations/jira/projects");
      return res.data || res;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new Error("Failed to fetch Jira projects");
    }
  }

  /**
   * Get Jira issue types for a specific project.
   */
  static async getIssueTypes(projectId: string): Promise<{ id: string; name: string; description: string; iconUrl: string }[]> {
    try {
      const res = await api.get<any>(`/api/integrations/jira/issue-types?projectId=${projectId}`);
      return res.data || res;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new Error("Failed to fetch Jira issue types");
    }
  }

  /**
   * Get Jira users.
   */
  static async getUsers(): Promise<{ accountId: string; displayName: string; emailAddress: string; avatarUrls: any }[]> {
    try {
      const res = await api.get<any>("/api/integrations/jira/users");
      return res.data || res;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new Error("Failed to fetch Jira users");
    }
  }

  /**
   * Create a Jira issue and link it to bugs.
   */
  static async createIssue(input: {
    title: string;
    description?: string;
    projectId: string;
    issueTypeId: string;
    assigneeId?: string;
    bugIds: string[];
  }): Promise<any> {
    try {
      const res = await api.post<any>("/api/integrations/jira/issue", input);
      return res.data || res;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new Error("Failed to create Jira issue");
    }
  }
}
