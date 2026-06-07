import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';

// Extend InternalAxiosRequestConfig to include _retry property
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

// Tenant utilities
const TenantUtils = {
  getTenantId(): string | null {
    if (typeof window === 'undefined') return null;

    try {
      const savedTenant = localStorage.getItem('currentTenant');
      if (savedTenant) {
        const tenant = JSON.parse(savedTenant);
        // On *.localhost, only trust the stored ID if it matches the URL subdomain
        const hostname = window.location.hostname;
        if (hostname.endsWith('.localhost') && hostname !== 'localhost') {
          const urlSubdomain = hostname.split('.localhost')[0];
          if (tenant.subdomain !== urlSubdomain) return null;
        }
        return tenant.tenantId || null;
      }
    } catch (error) {
      console.error('Error getting tenant ID:', error);
    }
    return null;
  },

  getSubdomain(): string | null {
    if (typeof window === 'undefined') return null;

    const hostname = window.location.hostname;

    // Plain localhost — read from localStorage (backward compat)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return localStorage.getItem('devTenantSubdomain') || null;
    }

    // *.localhost subdomains (e.g. abraham-immanuel.localhost:3005)
    if (hostname.endsWith('.localhost')) {
      const subdomain = hostname.split('.localhost')[0];
      if (subdomain && !['www', 'api', 'admin', 'app', 'mail'].includes(subdomain)) {
        return subdomain;
      }
    }

    // Production: subdomain.domain.tld
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      const subdomain = parts[0];
      if (!['www', 'api', 'admin', 'app', 'mail'].includes(subdomain)) {
        return subdomain;
      }
    }

    return null;
  },
};

// Types for our API responses
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

// Error response type
interface ErrorResponse {
  error?: string;
  message?: string;
  code?: string;
  [key: string]: any;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    current: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// Custom error class for API errors
export class ApiError extends Error {
  public status: number;
  public code?: string;
  public details?: any;

  constructor(message: string, status: number, code?: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Token management utilities - Only for access tokens (refresh tokens handled by cookies)
const TokenManager = {
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  },

  setAccessToken(accessToken: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('accessToken', accessToken);
  },

  clearAccessToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('accessToken');
  },
};

// Create Axios instance with base configuration
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    timeout: 30000, // 30 seconds
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor - Add JWT token and tenant headers to all requests
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      // Add Authorization header
      let token = TokenManager.getAccessToken();

      // If no token exists, try to refresh from cookie before making request
      if (!token && !config.url?.includes('/auth/refresh') && !config.url?.includes('/auth/login')) {
        console.log('🔄 No access token found, attempting proactive refresh...');
        try {
          const refreshResponse = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`,
            {},
            { withCredentials: true }
          );

          if (refreshResponse.data.success && refreshResponse.data.accessToken) {
            token = refreshResponse.data.accessToken;
            if (token) {
              TokenManager.setAccessToken(token);
            }
            console.log('✅ Proactive token refresh successful');
          }
        } catch (error) {
          console.log('❌ Proactive token refresh failed');
        }
      }

      // Only add Authorization header to internal requests
      const isInternalRequest = !config.url?.startsWith('http') || 
                                 config.url?.startsWith(window.location.origin) ||
                                 (process.env.NEXT_PUBLIC_API_URL && config.url?.startsWith(process.env.NEXT_PUBLIC_API_URL));

      if (token && config.headers && isInternalRequest) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Add Tenant headers (critical for multi-tenant API)
      if (config.headers) {
        const tenantId = TenantUtils.getTenantId();
        const subdomain = TenantUtils.getSubdomain();

        // Always try to add tenant headers when available
        if (tenantId) {
          config.headers['X-Tenant-ID'] = tenantId;
        }

        if (subdomain) {
          config.headers['X-Tenant-Subdomain'] = subdomain;
        }

        // Activity-log source override: pages call useActivitySource(...) to
        // declare their UX context, and we forward it so the BE files
        // mutations under the correct section/module/page.
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { getActivitySource } = require('@/hooks/useActivitySource');
          const src = getActivitySource?.();
          if (src) {
            if (src.section) config.headers['x-zspace-section'] = src.section;
            if (src.module) config.headers['x-zspace-module'] = src.module;
            if (src.page) config.headers['x-zspace-page'] = src.page;
          }
        } catch {
          /* hook not yet loaded — fine */
        }

        // For development mode, add query parameter fallback for critical endpoints
        if (process.env.NODE_ENV === 'development' && subdomain && !tenantId) {
          // For login and other auth endpoints, add tenant as query parameter
          if (config.url?.includes('/auth/')) {
            const separator = config.url.includes('?') ? '&' : '?';
            config.url = `${config.url}${separator}tenant=${subdomain}`;
          }
        }

        // Log tenant context in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`🏢 API Request [${config.method?.toUpperCase()} ${config.url}]:`, {
            tenantId: tenantId || 'None',
            subdomain: subdomain || 'None',
            hasAuth: !!token,
          });
        }
      }

      return config;
    },
    (error) => {
      console.error('❌ Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor - Handle responses and errors globally
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      // Log response in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
          status: response.status,
          data: response.data,
        });
      }

      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config;

      // Log error in development
      if (process.env.NODE_ENV === 'development') {
        const method = originalRequest?.method?.toUpperCase() || 'HTTP';
        const url = originalRequest?.url || 'Request';
        console.error(`❌ API Error: ${method} ${url}`, {
          status: error.response?.status,
          data: error.response?.data,
        });
      }

      // Handle 401 Unauthorized - Token expired
      if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Attempt to refresh token - no body needed, refresh token sent via cookies
          const refreshResponse = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`,
            {}, // Empty body - refresh token is in cookies
            { withCredentials: true }
          );

          if (refreshResponse.data.success) {
            const { accessToken } = refreshResponse.data;
            if (accessToken) {
              TokenManager.setAccessToken(accessToken);
            }

            // Retry original request with new token
            if (originalRequest.headers && accessToken) {
              console.log('🔄 Retrying request with new token...');
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }

            return client(originalRequest);
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);

          // Clear access token - let AuthContext handle the redirect
          TokenManager.clearAccessToken();

          return Promise.reject(new ApiError('Session expired. Please login again.', 401, 'TOKEN_EXPIRED'));
        }
      }

      // Handle different error types
      if (error.response) {
        // Server responded with error status
        const { status, data } = error.response;
        const errorData = data as ErrorResponse;
        const message = errorData?.error || errorData?.message || `HTTP ${status} Error`;

        throw new ApiError(message, status, errorData?.code, errorData);
      } else if (error.request) {
        // Request was made but no response received
        throw new ApiError('Network error. Please check your connection.', 0, 'NETWORK_ERROR');
      } else {
        // Something else happened
        throw new ApiError(error.message || 'An unexpected error occurred', 0, 'UNKNOWN_ERROR');
      }
    }
  );

  return client;
};

// Create the main API client instance
export const apiClient = createApiClient();

// Generic API methods with proper typing
export const api = {
  // GET request
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.get(url, config);
    if (response.data.success) {
      return response.data.data;
    }
    throw new ApiError(response.data.error || 'Request failed', response.status);
  },

  // POST request
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.post(url, data, config);

    // For file uploads, the response structure is different
    // Backend returns: { success: true, filename: "...", url: "..." }
    // Not: { success: true, data: {...} }
    if (response.data.success) {
      // If data.data exists, use it (normal case)
      // Otherwise return the whole response.data (file upload case)
      return response.data.data !== undefined ? response.data.data : response.data;
    }
    throw new ApiError(response.data.error || 'Request failed', response.status);
  },



  // PUT request
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.put(url, data, config);
    if (response.data.success) {
      return response.data.data;
    }
    throw new ApiError(response.data.error || 'Request failed', response.status);
  },

  // PATCH request
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.patch(url, data, config);
    if (response.data.success) {
      return response.data.data;
    }
    throw new ApiError(response.data.error || 'Request failed', response.status);
  },

  // DELETE request
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.delete(url, config);
    if (response.data.success) {
      return response.data.data;
    }
    throw new ApiError(response.data.error || 'Request failed', response.status);
  },

  // Raw request (returns full response)
  async request<T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> {
    return apiClient.request<ApiResponse<T>>(config);
  },
};

// Utility functions for common operations
export const apiUtils = {
  // Build query string from object
  buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    return searchParams.toString();
  },

  // Handle paginated requests
  async getPaginated<T = any>(
    url: string,
    params: {
      page?: number;
      limit?: number;
      search?: string;
      [key: string]: any;
    } = {}
  ): Promise<PaginatedResponse<T>> {
    const queryString = this.buildQueryString(params);
    const fullUrl = queryString ? `${url}?${queryString}` : url;

    const response = await apiClient.get(fullUrl);

    // Backend returns: { success: true, data: [...], pagination: {...} }
    // We need to transform it to: { data: [...], pagination: {...} }
    if (response.data.success) {
      return {
        data: response.data.data,
        pagination: {
          current: response.data.pagination.page,
          pageSize: response.data.pagination.limit,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.pages,
        }
      };
    }

    throw new ApiError(response.data.error || 'Failed to fetch data', response.status);
  },

  // Cancel request token
  createCancelToken() {
    return axios.CancelToken.source();
  },

  // Check if error is a cancel error
  isCancel(error: any): boolean {
    return axios.isCancel(error);
  },
};

// Export token manager for use in AuthContext
export { TokenManager };

// Export types
export type { AxiosRequestConfig, AxiosResponse, AxiosError };

