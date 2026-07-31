import { api } from '@/lib/axios';

export const PipelineService = {
  // Candidates
  listCandidates: async (params: { page?: number; limit?: number; search?: string }) => {
    const data = await api.get('/api/pipeline/candidates', { params });
    return { success: true, data };
  },
  getCandidate: async (id: string) => {
    const data = await api.get(`/api/pipeline/candidates/${id}`);
    return { success: true, data };
  },
  createCandidate: async (candidate: any) => {
    const data = await api.post('/api/pipeline/candidates', candidate);
    return { success: true, data };
  },
  updateCandidate: async (id: string, candidate: any) => {
    const data = await api.put(`/api/pipeline/candidates/${id}`, candidate);
    return { success: true, data };
  },
  deleteCandidate: async (id: string) => {
    const data = await api.delete(`/api/pipeline/candidates/${id}`);
    return { success: true, data };
  },
  updateCandidateStatus: async (id: string, status: string, rejected_round_id?: string) => {
    const data = await api.put(`/api/pipeline/candidates/${id}/status`, { status, rejected_round_id });
    return { success: true, data };
  },
  parseResume: async (file: File) => {
    const formData = new FormData();
    formData.append('resume', file);
    const data = await api.post('/api/pipeline/candidates/parse-resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return { success: true, data };
  },
  getCandidateLogs: async (candidateId: string) => {
    const data = await api.get(`/api/pipeline/candidates/${candidateId}/logs`);
    return { success: true, data };
  },
  resendCandidateEmail: async (emailId: string) => {
    const data = await api.post(`/api/pipeline/emails/${emailId}/resend`);
    return { success: true, data };
  },
  sendDraftEmail: async (emailId: string, payload: { subject: string; body: string }) => {
    const data = await api.post(`/api/pipeline/emails/${emailId}/send-draft`, payload);
    return { success: true, data };
  },
  getCandidateEmails: async (candidateId: string) => {
    const data = await api.get(`/api/pipeline/candidates/${candidateId}/emails`);
    return { success: true, data };
  },

  // Configs
  listConfigs: async () => {
    const data = await api.get('/api/pipeline/configs');
    return { success: true, data };
  },
  createConfig: async (config: any) => {
    const data = await api.post('/api/pipeline/configs', config);
    return { success: true, data };
  },
  updateConfig: async (id: string, config: any) => {
    const data = await api.put(`/api/pipeline/configs/${id}`, config);
    return { success: true, data };
  },
  deleteConfig: async (id: string) => {
    const data = await api.delete(`/api/pipeline/configs/${id}`);
    return { success: true, data };
  },

  // Interviews & Offers
  scheduleInterview: async (payload: any) => {
    const data = await api.post('/api/pipeline/interviews', payload);
    return { success: true, data };
  },
  listCandidateInterviews: async (candidateId: string) => {
    const data = await api.get(`/api/pipeline/candidates/${candidateId}/interviews`);
    return { success: true, data };
  },
  evaluateInterview: async (interviewId: string, payload: any) => {
    const data = await api.post(`/api/pipeline/interviews/${interviewId}/evaluate`, payload);
    return { success: true, data };
  },
  generateOffer: async (payload: any) => {
    const data = await api.post('/api/pipeline/offers', payload);
    return { success: true, data };
  },
  listCandidateOffers: async (candidateId: string) => {
    const data = await api.get(`/api/pipeline/candidates/${candidateId}/offers`);
    return { success: true, data };
  },
};
