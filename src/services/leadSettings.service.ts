import { api } from "@/lib/axios";

export interface LeadStatus {
  id: string;
  name: string;
  category: string;
  applies_to: string[];
  color: string;
  is_default: boolean;
  is_final_stage: boolean;
  is_active: boolean;
  order: number;
  icon?: string;
}

export interface LeadAction {
  id: string;
  name: string;
  type: string;
  icon: string;
  color: string;
  is_active: boolean;
  createdAt: string;
}

export interface LeadPlatform {
  id: string;
  name: string;
  code: string;             // auto-derived from name, immutable
  type: 'online' | 'website';
  url?: string;
  logo_url?: string;
  description?: string;
  is_active: boolean;
  order: number;
  created_at?: string;
  updated_at?: string;
}

const leadSettingsService = {
  // Statuses
  getStatuses: async (): Promise<LeadStatus[]> => {
    return await api.get('/api/lead-settings/statuses');
  },
  createStatus: async (data: Partial<LeadStatus>): Promise<LeadStatus> => {
    return await api.post('/api/lead-settings/statuses', data);
  },
  updateStatus: async (id: string, data: Partial<LeadStatus>): Promise<LeadStatus> => {
    return await api.put(`/api/lead-settings/statuses/${id}`, data);
  },
  deleteStatus: async (id: string): Promise<void> => {
    await api.delete(`/api/lead-settings/statuses/${id}`);
  },

  // Actions
  getActions: async (): Promise<LeadAction[]> => {
    return await api.get('/api/lead-settings/actions');
  },
  createAction: async (data: Partial<LeadAction>): Promise<LeadAction> => {
    return await api.post('/api/lead-settings/actions', data);
  },
  updateAction: async (id: string, data: Partial<LeadAction>): Promise<LeadAction> => {
    return await api.put(`/api/lead-settings/actions/${id}`, data);
  },
  deleteAction: async (id: string): Promise<void> => {
    await api.delete(`/api/lead-settings/actions/${id}`);
  },

  // Platforms — gig-platform sources (Upwork, LinkedIn, …) and own-website
  // sources (Zukvo, Zithtech, …) used as the lead's "Source" identity.
  getPlatforms: async (): Promise<LeadPlatform[]> => {
    return await api.get('/api/lead-settings/platforms');
  },
  createPlatform: async (data: Partial<LeadPlatform>): Promise<LeadPlatform> => {
    return await api.post('/api/lead-settings/platforms', data);
  },
  updatePlatform: async (id: string, data: Partial<LeadPlatform>): Promise<LeadPlatform> => {
    return await api.put(`/api/lead-settings/platforms/${id}`, data);
  },
  deletePlatform: async (id: string): Promise<void> => {
    await api.delete(`/api/lead-settings/platforms/${id}`);
  },
};

export default leadSettingsService;
