import { api } from "@/lib/axios";

export interface ReasonForExit {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReasonForExitPayload {
  name: string;
  code: string;
  is_active: boolean;
}

export const ReasonForExitService = {
  getAll: async (): Promise<ReasonForExit[]> => {
    return await api.get<ReasonForExit[]>('/api/exit/reason-for-exit');
  },

  getById: async (id: string): Promise<ReasonForExit> => {
    return await api.get<ReasonForExit>(`/api/exit/reason-for-exit/${id}`);
  },

  create: async (payload: ReasonForExitPayload): Promise<ReasonForExit> => {
    return await api.post('/api/exit/reason-for-exit', payload);
  },

  update: async (id: string, payload: ReasonForExitPayload): Promise<ReasonForExit> => {
    return await api.put(`/api/exit/reason-for-exit/${id}`, payload);
  },

  delete: async (id: string): Promise<void> => {
    return await api.delete(`/api/exit/reason-for-exit/${id}`);
  },
};
