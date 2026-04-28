import { api } from '@/lib/axios';

export const ProposalService = {
  getProposals: async () => {
    return api.get('/api/proposals');
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

  requestProposalExport: async (id: string) => {
    return api.post(`/api/proposals/${id}/export`);
  },

  generateFromLead: async (leadId: string) => {
    return api.post(`/api/proposals/generate-from-lead/${leadId}`);
  },

  generateContentOnly: async (leadId: string) => {
    return api.post(`/api/proposals/generate-content-only/${leadId}`);
  },
  
  refineBlock: async (params: { blockId?: string; blockType: string; currentData: any; userPrompt: string }) => {
    return api.post('/api/proposals/refine-block', params);
  }
};
