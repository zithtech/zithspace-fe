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
    logoVersions?: string[];
    [key: string]: any;
  };
}

export interface UpdateTenantData {
  name?: string;
  logo?: string; // base64
  croppedLogo?: string; // base64
  finalLogoUrl?: string; // existing URL
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

  /**
   * Delete a specific logo version
   */
  static async deleteLogoVersion(url: string): Promise<{ logoUrl: string, logoVersions: string[] }> {
    const response = await api.delete<{ logoUrl: string, logoVersions: string[] }>('/api/tenants/logo-version', { data: { url } });
    return response;
  }

  /**
   * Get the current Chrome Extension install key for this workspace (admin only).
   * Returns { installKey: null } when none has been generated yet.
   */
  static async getExtensionInstallKey(): Promise<{ installKey: string | null }> {
    const response = await api.get<{ installKey: string | null }>('/api/tenants/extension-install-key');
    return response;
  }

  /**
   * Generate or rotate the Chrome Extension install key for this workspace (admin only).
   * Rotating invalidates the previous key.
   */
  static async generateExtensionInstallKey(): Promise<{ installKey: string }> {
    const response = await api.post<{ installKey: string }>('/api/tenants/extension-install-key/generate', {});
    return response;
  }
}
