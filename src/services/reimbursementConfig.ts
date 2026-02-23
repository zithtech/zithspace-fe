// import { api, ApiError } from '@/lib/axios';

// /* ================================
//    TYPES
// ================================ */

// export interface ReimbursementConfiguration {
//   id: string;
//   tenantId: string;

//   origin: string;
//   subOrigin: string;
//   categoryType: string;

//   amount: number;
//   period: 'MONTH' | 'YEAR';
//   status: string;

//   monthlyAmount?: number;   // calculated from backend
//   yearlyAmount?: number;    // calculated from backend

//   createdById: string;
//   updatedById?: string;

//   createdAt: string;
//   updatedAt: string;
// }

// export interface CreateReimbursementConfigData {
//   origin: string;
//   subOrigin: string;
//   categoryType: string;
//   amount: number;
//   period: 'MONTH' | 'YEAR';
//   status?: string;
// }

// export interface UpdateReimbursementConfigData
//   extends Partial<CreateReimbursementConfigData> {}


// /* ================================
//    SERVICE
// ================================ */

// export class ReimbursementService {

//   /** Get all reimbursement configs */
//   static async getConfigs(): Promise<ReimbursementConfiguration[]> {
//     try {
//       const response = await api.get('/api/reimbursement-configurations');
//       return response.data.data; // because your backend wraps in { success, data }
//     } catch (error) {
//       if (error instanceof ApiError) throw new Error(error.message);
//       throw new Error('Failed to fetch reimbursement configurations');
//     }
//   }

//   /** Get config by ID */
//   static async getConfigById(
//     id: string
//   ): Promise<ReimbursementConfiguration> {
//     try {
//       const response = await api.get(`/api/reimbursement-configurations/${id}`);
//       return response.data.data;
//     } catch (error) {
//       if (error instanceof ApiError) throw new Error(error.message);
//       throw new Error('Failed to fetch reimbursement configuration');
//     }
//   }

//   /** Create new config */
//   static async createConfig(
//     data: CreateReimbursementConfigData
//   ): Promise<ReimbursementConfiguration> {
//     try {
//       const response = await api.post('/api/reimbursement-configurations', data);
//       return response.data.data;
//     } catch (error) {
//       if (error instanceof ApiError) throw new Error(error.message);
//       throw new Error('Failed to create reimbursement configuration');
//     }
//   }

//   /** Update config */
//   static async updateConfig(
//     id: string,
//     data: UpdateReimbursementConfigData
//   ): Promise<ReimbursementConfiguration> {
//     try {
//       const response = await api.put(`/api/reimbursement-configurations/${id}`, data);
//       return response.data.data;
//     } catch (error) {
//       if (error instanceof ApiError) throw new Error(error.message);
//       throw new Error('Failed to update reimbursement configuration');
//     }
//   }

//   /** Delete config */
//   static async deleteConfig(id: string): Promise<void> {
//     try {
//       await api.delete(`/api/reimbursement-configurations/${id}`);
//     } catch (error) {
//       if (error instanceof ApiError) throw new Error(error.message);
//       throw new Error('Failed to delete reimbursement configuration');
//     }
//   }
// }
// services/reimbursementConfig.ts
// services/reimbursementConfig.ts

import { api, ApiError } from '@/lib/axios';

/* ================================
   TYPES
================================ */

export interface ReimbursementConfiguration {
  id: string;
  tenantId: string;
  origin: string;
  subOrigin: string;
  categoryType: string;
  amount: number;
  period: 'MONTH' | 'YEAR';
  status: string;
  monthlyAmount?: number;
  yearlyAmount?: number;
  createdById: string;
  updatedById?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReimbursementConfigData {
  origin: string;
  subOrigin: string;
  categoryType: string;
  amount: number;
  period: 'MONTH' | 'YEAR';
  status?: string;
}

export interface UpdateReimbursementConfigData
  extends Partial<CreateReimbursementConfigData> {}

/* ================================
   SERVICE
================================ */

export class ReimbursementService {
  /** Get all reimbursement configs */
  static async getConfigs(): Promise<ReimbursementConfiguration[]> {
    try {
      const response = await api.get('/api/reimbursement-configurations');
      
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
      
      // If response is the array itself
      if (Array.isArray(response)) {
        return response;
      }
      
      console.error('Unexpected response structure:', response);
      return [];
    } catch (error) {
      console.error('Error in getConfigs:', error);
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to fetch reimbursement configurations');
    }
  }

  /** Get config by ID */
  static async getConfigById(id: string): Promise<ReimbursementConfiguration> {
    try {
      const response = await api.get(`/api/reimbursement-configurations/${id}`);
      
      if (response && typeof response === 'object') {
        return response as ReimbursementConfiguration;
      }
      if (response.data && typeof response.data === 'object') {
        return response.data as ReimbursementConfiguration;
      }
      throw new Error('Invalid response structure');
    } catch (error) {
      if (error instanceof ApiError) throw new Error(error.message);
      throw new Error('Failed to fetch reimbursement configuration');
    }
  }

  /** Create new config */
  static async createConfig(
    data: CreateReimbursementConfigData
  ): Promise<ReimbursementConfiguration> {
    try {
      const response = await api.post('/api/reimbursement-configurations', data);
      
      if (response && typeof response === 'object' && 'id' in response) {
        return response as ReimbursementConfiguration;
      }
      if (response.data && typeof response.data === 'object') {
        return response.data as ReimbursementConfiguration;
      }
      throw new Error('Invalid response structure');
    } catch (error) {
      if (error instanceof ApiError) throw new Error(error.message);
      throw new Error('Failed to create reimbursement configuration');
    }
  }

  /** Update config */
  static async updateConfig(
    id: string,
    data: UpdateReimbursementConfigData
  ): Promise<ReimbursementConfiguration> {
    try {
      const response = await api.put(`/api/reimbursement-configurations/${id}`, data);
      
      if (response && typeof response === 'object' && 'id' in response) {
        return response as ReimbursementConfiguration;
      }
      if (response.data && typeof response.data === 'object') {
        return response.data as ReimbursementConfiguration;
      }
      throw new Error('Invalid response structure');
    } catch (error) {
      if (error instanceof ApiError) throw new Error(error.message);
      throw new Error('Failed to update reimbursement configuration');
    }
  }

  /** Delete config */
  static async deleteConfig(id: string): Promise<void> {
    try {
      await api.delete(`/api/reimbursement-configurations/${id}`);
    } catch (error) {
      if (error instanceof ApiError) throw new Error(error.message);
      throw new Error('Failed to delete reimbursement configuration');
    }
  }
}