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
    position: string;
    phone: string;
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
  personalEmail: string;
  workEmail: string;
  role: string;
  position: string;
  tenantId: string;
  /** Effective permissions from RBAC system */
  permissions: string[];
  reportsTo?: {
    id: string;
    name: string;
    position: string;
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
  isActive: boolean;
  department?: string;
  employeeId?: string | null;
  employee?: any;
}

export interface UpdateProfileData {
  name: string;
  phone: string;
  personalEmail: string;
  workEmail: string;
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
        throw new Error(error.message);
      }
      throw new Error('Login failed. Please try again.');
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
        throw new Error(error.message);
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
        throw new Error(error.message);
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
        throw new Error(error.message);
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
   * Clear all authentication data
   */
  static clearAuth(): void {
    TokenManager.clearAccessToken();
  }
}
