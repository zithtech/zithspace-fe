import { api, ApiError } from "@/lib/axios";

export class LinearService {
  /**
   * Get the OAuth2 authorization URL for Linear.
   */
  static async getConnectUrl(): Promise<string> {
    try {
      const data = await api.get<{ authUrl: string }>("/api/integrations/linear/connect");
      return data.authUrl;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new Error("Failed to get Linear connect URL");
    }
  }

  /**
   * Get connection status for Linear.
   */
  static async getStatus(): Promise<{ connected: boolean }> {
    try {
      return await api.get<{ connected: boolean }>("/api/integrations/linear/status");
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new Error("Failed to get Linear status");
    }
  }

  /**
   * Disconnect Linear account.
   */
  static async disconnect(): Promise<void> {
    try {
      await api.post("/api/integrations/linear/disconnect", {});
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new Error("Failed to disconnect Linear account");
    }
  }

  /**
   * Get Linear teams and projects.
   */
  static async getTeams(): Promise<{ id: string; name: string, projects: { nodes: { id: string; name: string }[] } }[]> {
    try {
      return await api.get<{ id: string; name: string, projects: { nodes: { id: string; name: string }[] } }[]>("/api/integrations/linear/teams");
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new Error("Failed to fetch Linear teams");
    }
  }

  /**
   * Get Linear users.
   */
  static async getUsers(): Promise<{ id: string; name: string; email: string }[]> {
    try {
      return await api.get<{ id: string; name: string; email: string }[]>("/api/integrations/linear/users");
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new Error("Failed to fetch Linear users");
    }
  }

  /**
   * Get Linear labels.
   */
  static async getLabels(): Promise<{ id: string; name: string; color: string }[]> {
    try {
      return await api.get<{ id: string; name: string; color: string }[]>("/api/integrations/linear/labels");
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new Error("Failed to fetch Linear labels");
    }
  }

  /**
   * Create a Linear issue and link it to bugs.
   */
  static async createIssue(input: {
    title: string;
    description?: string;
    teamId: string;
    projectId?: string;
    assigneeId?: string;
    priority?: number;
    labelIds?: string[];
    bugIds: string[];
  }): Promise<any> {
    try {
      return await api.post("/api/integrations/linear/issue", input);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new Error("Failed to create Linear issue");
    }
  }
}

