import { api, ApiError } from "@/lib/axios";

export class ShortcutService {
  /**
   * Create Shortcut
   */
  static async createShortcut(data: any): Promise<any> {
    try {
      return await api.post<any>("/api/shortcuts", data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to create shortcut");
    }
  }

  /**
   * Get All Shortcuts
   */
  static async getShortcuts(): Promise<any> {
    try {
      return await api.get<any>("/api/shortcuts");
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to fetch shortcuts");
    }
  }

  /**
   * Delete Shortcut
   */
  static async deleteShortcut(shortcutId: string): Promise<any> {
    try {
      return await api.delete<any>(`/api/shortcuts/${shortcutId}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to delete shortcut");
    }
  }
}
