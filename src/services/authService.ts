import { api, apiClient, ApiError, TokenManager } from '@/lib/axios';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    name: string;
    email: string;
    workEmail: string;
    personalEmail: string;
    role: string; // Flexible string instead of enum
    position: { id: string; title: string } | null;
    phone: string;
    avatarUrl?: string | null;
    reportsTo?: string | null;
    isActive: boolean;
    tenantId: string; // Add tenant context
    tenantName: string; // Add tenant name
  };
  accessToken: string;
  refreshToken?: string; // Optional since it's in cookies
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  //avatarUrl?: string | null;
  personalEmail: string;
  workEmail: string;
  role: string;
  position: { id: string; title: string } | null;
  tenantId: string;
  /** Effective permissions from RBAC system */
  permissions: string[];
  reportsTo?: {
    id: string;
    name: string;
    position: { title: string };
  };
  tenant?: {
    id: string;
    name: string;
    subdomain: string;
    logoUrl?: string | null;
  };
  dateOfBirth?: string;
  createdAt: string;
  updatedAt: string;
  avatarUrl?: string | null;
  isActive: boolean;
  department?: string;
  employee_code?: string | null;
  employeeId?: string | null;
  employee?: any;
}

export interface UpdateProfileData {
  name: string;
  phone: string;
  personalEmail: string;
  workEmail: string;
  avatarUrl?: string | null;
  dateOfBirth?: string | null;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export class AuthService {
  /**
   * Login user with email and password
   */
  static async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      // Use apiClient directly to get full response including accessToken
      const response = await apiClient.post('/api/auth/login', credentials);

      if (response.data.success) {
        // Store only access token - refresh token is set as cookie by backend
        TokenManager.setAccessToken(response.data.accessToken);

        return response.data;
      } else {
        throw new Error(response.data.error || 'Login failed');
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error('Login failed. Please try again.');
    }
  }

  /**
   * Login user with Google access token
   * @param token - Google OAuth access token
   * @param subdomain - Optional tenant subdomain (required when calling from root OAuth domain e.g. app.zukvo.com)
   */
  static async googleLogin(token: string, subdomain?: string): Promise<LoginResponse> {
    try {
      const headers: Record<string, string> = {};
      if (subdomain) {
        headers['X-Tenant-Subdomain'] = subdomain;
      }
      const response = await apiClient.post('/api/auth/google-login', { token }, { headers });

      if (response.data.success) {
        TokenManager.setAccessToken(response.data.accessToken);
        return response.data;
      } else {
        throw new Error(response.data.error || 'Google login failed');
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error('Google login failed. Please try again.');
    }
  }

  /**
   * Login user with Microsoft access token
   * @param token - Microsoft OAuth access token
   * @param subdomain - Optional tenant subdomain (required when calling from root OAuth domain e.g. app.zukvo.com)
   */
  static async microsoftLogin(token: string, subdomain?: string): Promise<LoginResponse> {
    try {
      const headers: Record<string, string> = {};
      if (subdomain) {
        headers['X-Tenant-Subdomain'] = subdomain;
      }
      const response = await apiClient.post('/api/auth/microsoft-login', { token }, { headers });

      if (response.data.success) {
        TokenManager.setAccessToken(response.data.accessToken);
        return response.data;
      } else {
        throw new Error(response.data.error || 'Microsoft login failed');
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error('Microsoft login failed. Please try again.');
    }
  }

  /**
   * Logout user and clear tokens
   */
  static async logout(): Promise<void> {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      // Even if logout API fails, we should clear local tokens
      console.error('Logout API failed:', error);
    } finally {
      TokenManager.clearAccessToken();
    }
  }

  /**
   * Get current user profile
   */
  static async getProfile(): Promise<UserProfile> {
    try {
      const profile = await api.get<UserProfile>('/api/auth/me');
      return profile;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error('Failed to fetch user profile');
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(data: UpdateProfileData): Promise<UserProfile> {
    try {
      return await api.put<UserProfile>('/api/user/profile', data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error('Failed to update profile');
    }
  }

  /**
   * Change user password
   */
  static async changePassword(data: ChangePasswordData): Promise<void> {
    try {
      await api.post('/api/user/change-password', data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error('Failed to change password');
    }
  }

  /**
   * Refresh access token (handled automatically by Axios interceptor)
   */
  static async refreshToken(): Promise<boolean> {
    try {
      // No body needed - refresh token is sent via cookies
      const response = await apiClient.post('/api/auth/refresh');

      if (response.data.success) {
        TokenManager.setAccessToken(response.data.accessToken);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      TokenManager.clearAccessToken();
      return false;
    }
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return !!TokenManager.getAccessToken();
  }

  /**
   * Get stored access token
   */
  static getAccessToken(): string | null {
    return TokenManager.getAccessToken();
  }

  /**
   * Set access token
   */
  static setAccessToken(token: string): void {
    TokenManager.setAccessToken(token);
  }

  /**
   * Clear all authentication data
   */
  static clearAuth(): void {
    TokenManager.clearAccessToken();
  }

  /**
   * Request password reset
   */
  static async forgotPassword(email: string, tenantSubdomain?: string): Promise<{ success: boolean; message: string }> {
    try {
      // We use apiClient to bypass interceptors if needed, but api is fine since it's unauthenticated
      const response = await apiClient.post('/api/auth/forgot-password', { email, tenantSubdomain });
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.error || 'Failed to send password reset email');
      }
      throw new Error('Failed to send password reset email');
    }
  }

  /**
   * Validate password reset token
   */
  static async validateResetToken(token: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.get(`/api/auth/reset-password/validate?token=${token}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.error || 'Invalid or expired token');
      }
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Reset password with token
   */
  static async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post('/api/auth/reset-password', { token, newPassword });
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.error || 'Failed to reset password');
      }
      throw new Error('Failed to reset password');
    }
  }

  /**
   * Mark onboarding as completed for the current tenant.
   * Fires-and-forgets safely — failure is non-fatal from the user's perspective.
   */
  static async completeOnboarding(): Promise<void> {
    try {
      await apiClient.post('/api/tenants/onboarding/complete');
    } catch (error: any) {
      console.error('Failed to mark onboarding complete:', error?.response?.data?.error || error?.message);
    }
  }
}
