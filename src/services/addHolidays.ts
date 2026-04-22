import { apiClient } from '@/lib/axios';
//comment added
export interface FixedHoliday {
  id: string;
  holidayName: string;
  country: string;
  state: string[];
  fromDate: string;
  toDate: string;
  type: string;
  rule: string;
  createdById?: string;
  updatedById?: string;
  createdAt?: string;
  updatedAt?: string;
}
//comment added
export interface CreateFixedHolidayData {
  holidayName: string;
  country: string;
  state: string[];
  fromDate: string;
  toDate: string;
  type: string;
  rule: string;
}

export class FixedHolidayService {
  static async getFixedHolidays(): Promise<FixedHoliday[]> {
    try {
      const response = await apiClient.get('/api/fixed-holidays');
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch holidays');
    }
  }

  static async createFixedHoliday(data: CreateFixedHolidayData): Promise<FixedHoliday> {
    const response = await apiClient.post('/api/fixed-holidays', data);
    return response.data.data || response.data;
  }

  static async updateFixedHoliday(id: string, data: Partial<CreateFixedHolidayData>): Promise<FixedHoliday> {
    const response = await apiClient.put(`/api/fixed-holidays/${id}`, data);
    return response.data.data || response.data;
  }

  static async deleteFixedHoliday(id: string): Promise<void> {
    await apiClient.delete(`/api/fixed-holidays/${id}`);
  }
}