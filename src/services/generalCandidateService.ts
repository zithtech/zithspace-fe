import { apiClient } from "@/lib/axios";

export interface GeneralCandidateDocument {
  fileName: string;
  base64: string;
}

export interface GeneralCandidatePayload {
  fullName: string;
  email: string;
  phone: string;
  location?: string | null;
  totalExperience?: number | string | null;
  skills?: string[];
  currentCompany?: string | null;
  currentSalary?: number | string | null;
  expectedSalary?: number | string | null;
  noticePeriod?: string | null;
  resume?: GeneralCandidateDocument | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  status?: "APPLIED" | "SHORTLISTED" | "INTERVIEW" | "OFFERED" | "JOINED" | "REJECTED";
}

export interface GeneralCandidateResponse extends Omit<GeneralCandidatePayload, "resume"> {
  id: string;
  tenantId: string;
  resumeUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

const API_URL = "/api/general-candidates";

export const generalCandidateService = {
  getAll: async (): Promise<GeneralCandidateResponse[]> => {
    const response = await apiClient.get(API_URL);
    return response.data.data || response.data;
  },

  getById: async (id: string): Promise<GeneralCandidateResponse> => {
    const response = await apiClient.get(`${API_URL}/${id}`);
    return response.data.data || response.data;
  },

  create: async (data: GeneralCandidatePayload): Promise<GeneralCandidateResponse> => {
    const response = await apiClient.post(API_URL, data);
    return response.data.data || response.data;
  },

  update: async (id: string, data: Partial<GeneralCandidatePayload>): Promise<GeneralCandidateResponse> => {
    const response = await apiClient.put(`${API_URL}/${id}`, data);
    return response.data.data || response.data;
  },

  delete: async (id: string): Promise<any> => {
    const response = await apiClient.delete(`${API_URL}/${id}`);
    return response.data.data || response.data;
  },
};

export default generalCandidateService;
