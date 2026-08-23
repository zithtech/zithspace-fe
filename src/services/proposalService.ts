import { api, apiUtils, PaginatedResponse } from '@/lib/axios';

export const ProposalService = {
  getProposals: async (filters?: any): Promise<PaginatedResponse<any>> => {
    return apiUtils.getPaginated<any>('/api/proposals', filters);
  },

  getProposalById: async (id: string) => {
    return api.get(`/api/proposals/${id}`);
  },

  createProposal: async (data: { title: string; client_name?: string; blocks: any[]; status?: string; lead_id?: string | null }) => {
    return api.post('/api/proposals', data);
  },

  updateProposal: async (id: string, data: { title?: string; client_name?: string; blocks?: any[]; status?: string; lead_id?: string | null }) => {
    return api.put(`/api/proposals/${id}`, data);
  },

  deleteProposal: async (id: string) => {
    return api.delete(`/api/proposals/${id}`);
  },

  getTrashedProposals: async (filters?: any): Promise<PaginatedResponse<any>> => {
    return apiUtils.getPaginated<any>('/api/proposals/trash', filters);
  },

  restoreProposal: async (id: string) => {
    return api.post(`/api/proposals/${id}/restore`);
  },

  hardDeleteProposal: async (id: string) => {
    return api.delete(`/api/proposals/${id}/hard`);
  },

  emptyTrash: async () => {
    return api.delete('/api/proposals/trash/empty');
  },

  requestProposalExport: async (id: string) => {
    return api.post(`/api/proposals/${id}/export`);
  },

  generateFromLead: async (leadId: string) => {
    return api.post(`/api/proposals/generate-from-lead/${leadId}`);
  },

  generateContentOnly: async (leadId: string, payload?: {
    selection?: 'client' | 'custom';
    duration?: string;
    cost?: string | number;
    startDate?: string;
    endDate?: string;
  }) => {
    return api.post(`/api/proposals/generate-content-only/${leadId}`, payload || {});
  },
  
  refineBlock: async (params: { blockId?: string; blockType: string; currentData: any; userPrompt: string }) => {
    return api.post('/api/proposals/refine-block', params);
  }
};
