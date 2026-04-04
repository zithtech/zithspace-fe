import { api } from "@/lib/axios";

export interface OpeningManagement {
  id: string;
  tenantId?: string;
  jobTitle: string;
  roleType: string;
  departmentId: string;
  hiringManagerId: string;
  minExperience?: number | null;
  maxExperience?: number | null;
  primarySkills: string[];
  noticePeriod?: number | null;
  jobDescription?: string | null;
  baseLocation?: string | null;
  workArrangement?: string | null;
  employmentType?: string | null;
  totalOpenings?: number | null;
  minSalary?: number | null;
  maxSalary?: number | null;
  currency?: string | null;
  priorityLevel?: string | null;
  currentStatus?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateOpeningData {
  jobTitle: string;
  roleType: string;
  departmentId: string;
  hiringManagerId: string;
  minExperience?: number;
  maxExperience?: number;
  primarySkills: string[];
  noticePeriod?: number;
  jobDescription?: string;
  baseLocation?: string;
  workArrangement?: string;
  employmentType?: string;
  totalOpenings?: number;
  minSalary?: number;
  maxSalary?: number;
  currency?: string;
  priorityLevel?: string;
  currentStatus?: string;
}

export interface UpdateOpeningData extends Partial<CreateOpeningData> {}

const API_URL = "/api/opening-management";

export const OpeningManagementService = {
  getAll: async (): Promise<OpeningManagement[]> => {
    const response = await api.get<any>(API_URL);
    return response.data?.data || response.data || response;
  },

  getById: async (id: string): Promise<OpeningManagement> => {
    const response = await api.get<any>(`${API_URL}/${id}`);
    return response.data?.data || response.data || response;
  },

  create: async (data: CreateOpeningData): Promise<OpeningManagement> => {
    const response = await api.post<any>(API_URL, data);
    return response.data?.data || response.data || response;
  },

  update: async (
    id: string,
    data: UpdateOpeningData,
  ): Promise<OpeningManagement> => {
    const response = await api.put<any>(`${API_URL}/${id}`, data);
    return response.data?.data || response.data || response;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${API_URL}/${id}`);
  },
};
