import { api } from "@/lib/axios";

/**
 * Per-user, per-table UI preferences (column visibility, density, etc.).
 * Payload is opaque JSON — each caller decides its own shape.
 */
export const TablePreferenceService = {
  get: async <T = Record<string, any>>(tableKey: string): Promise<T> => {
    return await api.get<T>(`/api/user/table-preferences/${encodeURIComponent(tableKey)}`);
  },

  save: async <T = Record<string, any>>(tableKey: string, preferences: T): Promise<T> => {
    return await api.put<T>(
      `/api/user/table-preferences/${encodeURIComponent(tableKey)}`,
      preferences as any
    );
  },

  reset: async (tableKey: string): Promise<void> => {
    await api.delete(`/api/user/table-preferences/${encodeURIComponent(tableKey)}`);
  },
};
