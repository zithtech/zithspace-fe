import { api, ApiError } from "@/lib/axios";

export interface NotionStatus {
  connected: boolean;
  workspaceName: string | null;
  connectedAt: string | null;
}

export class NotionService {
  /**
   * OAuth authorize URL. `returnUrl` is where Notion sends the user back to
   * after the consent screen.
   */
  static async getConnectUrl(returnUrl = "/integrations"): Promise<string> {
    try {
      const data = await api.get<{ authUrl: string }>(
        `/api/v2/auth/notion/connect?returnUrl=${encodeURIComponent(returnUrl)}`
      );
      return data.authUrl;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new Error("Failed to get Notion connect URL");
    }
  }

  static async getStatus(): Promise<NotionStatus> {
    try {
      return await api.get<NotionStatus>("/api/v2/auth/notion/status");
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new Error("Failed to get Notion status");
    }
  }

  static async disconnect(): Promise<void> {
    try {
      await api.delete("/api/v2/auth/notion/disconnect");
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new Error("Failed to disconnect Notion");
    }
  }
}
