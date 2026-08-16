import { api, ApiError } from '@/lib/axios';

/* ================================
   TYPES
================================ */

export interface ReimbursementSetting {
  id: string;
  name: string;
  code: string;
  maxRequestsPerMonth?: number;
   description?: string;
  attachmentRequired: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReimbursementSettingData {
  name: string;
  code: string;
  maxRequestsPerMonth?: number;
  attachmentRequired?: boolean;
  isActive?: boolean;
}

export interface UpdateReimbursementSettingData
  extends Partial<CreateReimbursementSettingData> {}

/* ================================
   SERVICE
================================ */

export class ReimbursementSettingsService {
  /** Get all reimbursement settings */
  static async getSettings(): Promise<ReimbursementSetting[]> {
    try {
      const response = await api.get('/api/reimbursement-settings');
      
      // Log the full response for debugging
      console.log('Full API Response:', response);
      console.log('Response data:', response.data);
      
      // The API is returning the array directly
      if (Array.isArray(response)) {
        console.log('Response is array directly:', response);
        return response;
      }
      
      // If response has data property that is array
      if (response.data && Array.isArray(response.data)) {
        console.log('Response.data is array:', response.data);
        return response.data;
      }
      
      console.error('Unexpected response structure:', response);
      return [];
    } catch (error) {
      console.error('Error in getSettings:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error('Failed to fetch reimbursement settings');
    }
  }

  /** Get setting by ID */
  static async getSettingById(id: string): Promise<ReimbursementSetting> {
    try {
      const response = await api.get(`/api/reimbursement-settings/${id}`);
      
      if (response && typeof response === 'object' && 'id' in response) {
        return response as ReimbursementSetting;
      }
      if (response.data && typeof response.data === 'object') {
        return response.data as ReimbursementSetting;
      }
      throw new Error('Invalid response structure');
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new Error('Failed to fetch reimbursement setting');
    }
  }

  /** Create new setting */
  static async createSetting(
    data: CreateReimbursementSettingData
  ): Promise<ReimbursementSetting> {
    try {
      const response = await api.post('/api/reimbursement-settings', data);
      
      console.log('Create response:', response);
      
      if (response && typeof response === 'object' && 'id' in response) {
        return response as ReimbursementSetting;
      }
      if (response.data && typeof response.data === 'object') {
        return response.data as ReimbursementSetting;
      }
      throw new Error('Invalid response structure');
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new Error('Failed to create reimbursement setting');
    }
  }

  /** Update setting */
  static async updateSetting(
    id: string,
    data: UpdateReimbursementSettingData
  ): Promise<ReimbursementSetting> {
    try {
      const response = await api.put(`/api/reimbursement-settings/${id}`, data);
      
      if (response && typeof response === 'object' && 'id' in response) {
        return response as ReimbursementSetting;
      }
      if (response.data && typeof response.data === 'object') {
        return response.data as ReimbursementSetting;
      }
      throw new Error('Invalid response structure');
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new Error('Failed to update reimbursement setting');
    }
  }

  /** Delete setting */
  static async deleteSetting(id: string): Promise<void> {
    try {
      await api.delete(`/api/reimbursement-settings/${id}`);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new Error('Failed to delete reimbursement setting');
    }
  }
}