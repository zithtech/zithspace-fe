import { api } from "@/lib/axios";

export interface CompanyLocation {
  id: string;
  flatNumber?: string | null;
  street?: string | null;
  area?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  country?: string | null;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: {
    id: string;
    name: string;
  };
  updatedBy?: {
    id: string;
    name: string;
  };
}

export interface CreateCompanyLocationData {
  flatNumber?: string;
  street?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

export interface UpdateCompanyLocationData extends Partial<CreateCompanyLocationData> {}

const API_URL = "/api/company-locations";

export const CompanyLocationService = {
  getAll: async (): Promise<CompanyLocation[]> => {
    const response = await api.get<any>(API_URL);
    return response.data?.data || response.data || response;
  },

  create: async (data: CreateCompanyLocationData): Promise<CompanyLocation> => {
    const response = await api.post<any>(API_URL, data);
    return response.data?.data || response.data || response;
  },

  update: async (
    id: string,
    data: UpdateCompanyLocationData,
  ): Promise<CompanyLocation> => {
    const response = await api.put<any>(`${API_URL}/${id}`, data);
    return response.data?.data || response.data || response;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${API_URL}/${id}`);
  },
};
