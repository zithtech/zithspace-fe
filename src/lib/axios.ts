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
          // First label only — the dev host for the Testiez surface is
          // {tenant}.testiez.localhost, so splitting on '.localhost' would
          // yield 'kabs.testiez' instead of 'kabs'.
          const urlSubdomain = hostname.split('.')[0];
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

    // *.localhost subdomains (e.g. abraham-immanuel.localhost:3005, and
    // kabs.testiez.localhost:3005 for the Testiez surface). Take the FIRST
    // label: the tenant slug is always leftmost, and anything between it and
    // `.localhost` is the brand, not part of the slug.
    if (hostname.endsWith('.localhost')) {
      const subdomain = hostname.split('.')[0];
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
    pageSizeOptions: [10, 20, 25, 50, 100];
    current: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  stats?: any;
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

/**
 * Send a dead session back to the login form, once.
 *
 * A page that has lost its session usually discovers it several times at the
 * same moment — a dashboard fires many requests in parallel — and each rejection
 * used to be rendered by whichever widget made it, so the customer was left
 * looking at a working-looking page stacked with "Session expired. Please login
 * again." cards and no way to act on any of them.
 *
 * The instruction was also the wrong shape: telling someone to log in is not the
 * same as taking them somewhere they can. This carries where they were, so they
 * come back to it.
 */
let redirectingToLogin = false;
function redirectToLogin(): void {
  if (typeof window === 'undefined' || redirectingToLogin) return;
  // Already there — a redirect would only reload the form and drop the reason.
  if (window.location.pathname.startsWith('/login')) return;
  redirectingToLogin = true;
  const back = window.location.pathname + window.location.search;
  window.location.href = `/login?redirect=${encodeURIComponent(back)}`;
}

/**
 * Singleton refresh lock — all concurrent 401s share one refresh call.
 * When the first request triggers a refresh, subsequent ones await the same
 * promise instead of racing and potentially rotating the refresh token twice.
 */
let _refreshPromise: Promise<string | null> | null = null;

/**
 * Attempt to refresh the access token exactly once at a time.
 * Returns the new access token on success, or null on failure.
 * Sends both cookie credentials AND body token for 100% reliability across
 * subdomains, ports, and restrictive browser cookie settings.
 */
export function performTokenRefresh(): Promise<string | null> {
  // If another tab or concurrent call already refreshed the token in localStorage, use it immediately
  const existingToken = TokenManager.getAccessToken();
  const existingExpiry = getTokenExpiry(existingToken);
  const LEAD_TIME_MS = 2 * 60 * 1000;
  if (existingExpiry && existingExpiry - Date.now() > LEAD_TIME_MS) {
    return Promise.resolve(existingToken);
  }

  if (_refreshPromise) return _refreshPromise;

  const currentRefreshToken = TokenManager.getRefreshToken();

  _refreshPromise = axios
    .post(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`,
      currentRefreshToken ? { refreshToken: currentRefreshToken } : {},
      {
        withCredentials: true,
        headers: currentRefreshToken
          ? { 'x-refresh-token': currentRefreshToken }
          : undefined,
      },
    )
    .then((res) => {
      if (res.data.success && res.data.accessToken) {
        TokenManager.setAccessToken(res.data.accessToken);
        if (res.data.refreshToken) {
          TokenManager.setRefreshToken(res.data.refreshToken);
        }

        // Notify other tabs via BroadcastChannel
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          try {
            const ch = new BroadcastChannel('zukvo_auth_sync');
            ch.postMessage({
              type: 'REFRESHED',
              accessToken: res.data.accessToken,
              refreshToken: res.data.refreshToken,
            });
            ch.close();
          } catch {
            /* ignore channel errors */
          }
        }

        return res.data.accessToken as string;
      }
      return null;
    })
    .catch((err) => {
      console.warn('❌ performTokenRefresh failed:', err.response?.data?.error || err.message);
      return null;
    })
    .finally(() => {
      _refreshPromise = null;
    });

  return _refreshPromise;
}

/**
 * Decode a JWT payload and return the `exp` field as a Unix timestamp (ms).
 * Falls back to null if the token is missing or malformed.
 */
export function getTokenExpiry(token: string | null): number | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    // Standard base64url → base64 padding
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload + '=='.slice((payload.length % 4 === 0) ? 4 : payload.length % 4);
    const decoded = JSON.parse(atob(padded));
    return typeof decoded.exp === 'number' ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}

// Token management utilities - Handles access token and refresh token backup
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

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refreshToken');
  },

  setRefreshToken(refreshToken: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('refreshToken', refreshToken);
  },

  clearRefreshToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('refreshToken');
  },

  clearAll(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
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
        const refreshed = await performTokenRefresh();
        if (refreshed) {
          token = refreshed;
          console.log('✅ Proactive token refresh successful');
        } else {
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

        // Attach X-Agreement-Unlock-Token from sessionStorage if available
        if (typeof window !== 'undefined' && config.url) {
          let resourceId: string | null = null;
          const match = config.url.match(/\/(agreements|templates)\/([a-f0-9-]{10,})/i);
          if (match && match[2] && !['compose-body', 'preview-pdf', 'next-number'].includes(match[2])) {
            resourceId = match[2];
          }
          if (!resourceId && config.data) {
            try {
              const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
              resourceId = body?.templateId || body?.agreementId || body?.id || null;
            } catch {
              /* ignore parse errors */
            }
          }
          if (resourceId) {
            const unlockToken = sessionStorage.getItem(`pa_unlock_${resourceId}`);
            if (unlockToken) {
              config.headers['X-Agreement-Unlock-Token'] = unlockToken;
            }
          }
        }

        // Activity-log source override: pages call useActivitySource(...) to
        // declare their UX context, and we forward it so the BE files
        // mutations under the correct section/module/page.
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { getActivitySource } = require('@/hooks/useActivitySource');
          const src = getActivitySource?.();
          if (src) {
            const isGlobalEndpoint = config.url && (
              config.url.includes('/api/time-tracking') ||
              config.url.includes('time-tracking')
            );
            if (!isGlobalEndpoint) {
              if (src.section) config.headers['x-zspace-section'] = src.section;
              if (src.module) config.headers['x-zspace-module'] = src.module;
              if (src.page) config.headers['x-zspace-page'] = src.page;
            }
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

      if (response.data && response.data.serverTime) {
        import('@/utils/timeUtils').then(({ setServerTimeOffset }) => {
          setServerTimeOffset(new Date(response.data.serverTime).getTime() - Date.now());
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

      // Handle 401 Unauthorized - Token expired (Bypass for document/template password protection locks)
      const errorData = error.response?.data as any;
      const isUnlockEndpoint = originalRequest?.url?.includes('/unlock');
      const isPasswordLock =
        errorData?.isLocked ||
        errorData?.code === 'PASSWORD_REQUIRED' ||
        errorData?.code === 'INVALID_PASSWORD' ||
        isUnlockEndpoint ||
        (typeof errorData?.error === 'string' && errorData?.error.toLowerCase().includes('password'));

      if (error.response?.status === 401 && isPasswordLock) {
        const code = isUnlockEndpoint ? 'INVALID_PASSWORD' : (errorData?.code || 'PASSWORD_REQUIRED');
        return Promise.reject(new ApiError(errorData?.error || 'Password invalid or required', 401, code, errorData));
      }

      // Handle 401 Unauthorized - Token expired
      if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Use the singleton refresh lock so all concurrent 401s share one refresh call
          const newAccessToken = await performTokenRefresh();

          if (newAccessToken) {
            // Retry original request with new token
            if (originalRequest.headers) {
              console.log('🔄 Retrying request with new token...');
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            }
            return client(originalRequest);
          }

          // Refresh call returned null — session truly expired
          throw new Error('Refresh returned no token');
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);

          TokenManager.clearAll();

          // Only bounce when a real session died: the request carried a token,
          // the server rejected it, and the refresh could not replace it.
          //
          // A request that went out with NO Authorization header is a different
          // animal — it lost a race with token hydration at app start, which
          // happens on a normal successful login. Treating that as an expired
          // session would sign people out for a timing accident, so it is left
          // to fail on its own and be retried.
          if (originalRequest.headers?.Authorization) {
            redirectToLogin();
          }

          return Promise.reject(new ApiError('Session expired. Please login again.', 401, 'TOKEN_EXPIRED'));
        }
      }

      // Phase 7B: Handle 403 Forbidden - Subscription errors
      if (error.response?.status === 403) {
        const errorData = error.response?.data as any;
        const code = errorData?.error?.code || errorData?.code;
        const subCodes = ['TRIAL_EXPIRED', 'SUBSCRIPTION_EXPIRED', 'SUBSCRIPTION_SUSPENDED', 'SUBSCRIPTION_CANCELLED'];
        if (code && subCodes.includes(code)) {
          // Redirect to subscription paywall page
          if (typeof window !== 'undefined' && window.location.pathname !== '/subscription') {
            const redirectUrl = encodeURIComponent(window.location.pathname + window.location.search);
            const currentPlanId = errorData?.error?.currentPlanId;
            let targetUrl = `/subscription?redirect_to=${redirectUrl}`;
            if (currentPlanId) {
              targetUrl += `&current_plan_id=${currentPlanId}`;
            }
            window.location.href = targetUrl;
          }
          const msg = errorData?.error?.message || errorData?.message || 'Subscription invalid';
          return Promise.reject(new ApiError(msg, 403, code, errorData));
        }

        // Check for limit reached (EntitlementError)
        if (errorData?.details?.current !== undefined && errorData?.details?.allowed !== undefined) {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('zukvo:limit-reached', { 
              detail: { 
                current: errorData.details.current, 
                allowed: errorData.details.allowed,
                message: errorData.error
              }
            }));
          }
          return Promise.reject(new ApiError(errorData.error || 'Limit reached', 403, 'LIMIT_REACHED', errorData));
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
    if (config?.responseType === 'blob' || config?.responseType === 'arraybuffer') {
      return response as any; // Return full response for blobs to access headers/data
    }
    if (response.data.success) {
      return response.data.data;
    }
    throw new ApiError(response.data.error || 'Request failed', response.status);
  },

  // POST request
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.post(url, data, config);

    if (config?.responseType === 'blob' || config?.responseType === 'arraybuffer') {
      return response as any;
    }

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
    if (config?.responseType === 'blob' || config?.responseType === 'arraybuffer') {
      return response as any;
    }
    if (response.data.success) {
      return response.data.data;
    }
    throw new ApiError(response.data.error || 'Request failed', response.status);
  },

  // PATCH request
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.patch(url, data, config);
    if (config?.responseType === 'blob' || config?.responseType === 'arraybuffer') {
      return response as any;
    }
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

    // Backend returns: { success: true, data: [...], pagination: { pageSizeOptions: [10, 20, 25, 50, 100], ...} }
    // We need to transform it to: { data: [...], pagination: { pageSizeOptions: [10, 20, 25, 50, 100], ...} }
    if (response.data.success) {
      if (response.data.pagination) {
        return {
          data: response.data.data,
          pagination: { 
            pageSizeOptions: [10, 20, 25, 50, 100], 
            current: response.data.pagination.page,
            pageSize: response.data.pagination.limit,
            total: response.data.pagination.total,
            totalPages: response.data.pagination.pages || response.data.pagination.totalPages || 1,
          },
          stats: response.data.stats,
        };
      } else {
        // Fallback for endpoints that haven't been updated to return pagination
        const rawData = Array.isArray(response.data.data) ? response.data.data : [];
        return {
          data: rawData,
          pagination: {
            pageSizeOptions: [10, 20, 25, 50, 100],
            current: 1,
            pageSize: rawData.length || 20,
            total: rawData.length,
            totalPages: 1
          }
        } as any; // Cast as any because PaginatedResponse expects these fields
      }
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

