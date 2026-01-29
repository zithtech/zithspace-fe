import { api } from "@/lib/axios";

export interface CompanyGovernmentHoliday {
  id: string;
  tenantId: string;
  holidayName: string;
  country: string;
  fromDate: string;
  toDate: string;
  baseLeave: number;
  extraLeave: number;
  totalLeave: number;
  type: string;
  isFloater: boolean;
  rule?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdById: string;
  updatedById?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    name: string;
  };
}

export interface CreateHolidayPayload {
  holidayName: string;
  country: string;
  fromDate: string | Date;
  toDate: string | Date;
  baseLeave: number;
  extraLeave: number;
  totalLeave: number;
  type: string;
  isFloater: boolean;
  rule?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface UpdateHolidayPayload extends Partial<CreateHolidayPayload> {}

const BASE_URL = '/api/company-government-holidays';

export const companyGovernmentHolidayService = {
  getAll: async (): Promise<CompanyGovernmentHoliday[]> => {
    return await api.get<CompanyGovernmentHoliday[]>(BASE_URL);
  },

  getById: async (id: string): Promise<CompanyGovernmentHoliday> => {
    return await api.get<CompanyGovernmentHoliday>(`${BASE_URL}/${id}`);
  },

  create: async (data: CreateHolidayPayload): Promise<CompanyGovernmentHoliday> => {
    return await api.post<CompanyGovernmentHoliday>(BASE_URL, data);
  },

  update: async (id: string, data: UpdateHolidayPayload): Promise<CompanyGovernmentHoliday> => {
    return await api.put<CompanyGovernmentHoliday>(`${BASE_URL}/${id}`, data);
  },

  delete: async (id: string): Promise<{ message: string }> => {
    return await api.delete(`${BASE_URL}/${id}`);
  },
};
