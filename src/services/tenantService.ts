import { api, ApiResponse } from '@/lib/axios';

export interface TenantProfile {
  id: string;
  name: string;
  subdomain: string;
  planType: string;
  maxUsers: number;
  isActive: boolean;
  settings: {
    logoUrl?: string;
    [key: string]: any;
  };
}

export interface UpdateTenantData {
  name?: string;
  logo?: string; // base64
  [key: string]: any;
}

export class TenantService {
  /**
   * Get current tenant profile
   */
  static async getProfile(): Promise<TenantProfile> {
    const response = await api.get<TenantProfile>('/api/tenants/profile');
    return response;
  }

  /**
   * Update tenant profile
   */
  static async updateProfile(data: UpdateTenantData): Promise<TenantProfile> {
    const response = await api.put<TenantProfile>('/api/tenants/profile', data);
    return response;
  }
}
