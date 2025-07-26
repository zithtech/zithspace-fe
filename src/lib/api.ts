// Simplified API utility for NextAuth-based authentication
interface ApiCallOptions extends RequestInit {
  skipAuth?: boolean;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export const apiCall = async (url: string, options: ApiCallOptions = {}): Promise<Response> => {
  const { skipAuth = false, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    credentials: 'include', // Include cookies for NextAuth session
  });

  // Handle authentication errors
  if (response.status === 401 && !skipAuth) {
    // Redirect to login if unauthorized
    window.location.href = '/login';
    throw new ApiError(401, 'Authentication required');
  }

  return response;
};

// Convenience methods for common HTTP verbs
export const api = {
  get: (url: string, options?: ApiCallOptions) => 
    apiCall(url, { ...options, method: 'GET' }),
  
  post: (url: string, data?: any, options?: ApiCallOptions) => 
    apiCall(url, { 
      ...options, 
      method: 'POST', 
      body: data ? JSON.stringify(data) : undefined 
    }),
  
  put: (url: string, data?: any, options?: ApiCallOptions) => 
    apiCall(url, { 
      ...options, 
      method: 'PUT', 
      body: data ? JSON.stringify(data) : undefined 
    }),
  
  delete: (url: string, options?: ApiCallOptions) => 
    apiCall(url, { ...options, method: 'DELETE' }),
};

export { ApiError };
