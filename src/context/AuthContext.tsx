"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { useRouter } from "next/navigation";
import {
  AuthService,
  LoginCredentials,
  LoginResponse,
} from "@/services/authService";
import { ApiError } from "@/lib/axios";

// Extension sync function
const syncTokenWithExtension = (token: string) => {
  // Replace with the ID found in chrome://extensions/
  const EXTENSION_ID = "magcgpahmioofihhcfeaaomacdepnhcn"; 
  console.log('=== FRONTEND TOKEN SYNC DEBUG ===');
  console.log('Token to sync:', token.substring(0, 50) + '...');
  console.log('Extension ID:', EXTENSION_ID);
  console.log('Chrome available:', typeof window !== 'undefined' && !!(window as any).chrome);
  console.log('Runtime available:', typeof window !== 'undefined' && !!(window as any).chrome?.runtime);
  console.log('SendMessage available:', typeof window !== 'undefined' && !!(window as any).chrome?.runtime?.sendMessage);
  
  if (typeof window !== 'undefined' && (window as any).chrome && (window as any).chrome.runtime && (window as any).chrome.runtime.sendMessage) {
    console.log('Attempting to send message to extension...');
    (window as any).chrome.runtime.sendMessage(EXTENSION_ID, { token }, (response: any) => {
      console.log('Extension response:', response);
      if ((window as any).chrome.runtime.lastError) {
        console.error("Extension sync failed:", (window as any).chrome.runtime.lastError);
      } else {
        console.log("Token synced to extension!");
      }
    });
  } else {
    console.error('Chrome extension API not available');
  }
};

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  position: { id: string; title: string };
  personalEmail: string;
  workEmail: string;
  phone: string;
  reportsTo?: string | null;
  isActive: boolean;
  tenantId: string;
  avatarUrl?: string | null;
  tenantName?: string;
  tenantLogo?: string | null;
  department?: string;
  employeeId?: string | null;
  employee_code?: string | null;
  /** Effective permissions returned by /api/auth/me — source of truth for UI */
  permissions: string[];
  /** Tenant plan-based access (modules/functionalities the plan includes). */
  planAccess?: PlanAccess;
}

interface PlanAccess {
  /** true = plan grants everything (subject to RBAC). */
  full: boolean;
  /** allowed zukov resources (module-level). */
  resources: string[];
  /** allowed zukov permission codes (functionality-level). */
  permissions: string[];
  credits: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  checkAuth: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  /** Returns true if the user has the given permission string */
  hasPermission: (permission: string) => boolean;
  /** Returns true if the user has ALL of the given permissions */
  hasAllPermissions: (...permissions: string[]) => boolean;
  /** Returns true if the user has ANY of the given permissions */
  hasAnyPermission: (...permissions: string[]) => boolean;
  /** Returns true if the tenant's plan includes the given permission (plan-layer gate). */
  planAllows: (permission: string) => boolean;
  /** RBAC ∩ plan: user is permitted AND the plan includes it. */
  canAccess: (permission: string) => boolean;
  /** RBAC ∩ plan for any of the given permissions. */
  canAccessAny: (...permissions: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Initialize auth state on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Set up token refresh interval
  useEffect(() => {
    if (user && AuthService.isAuthenticated()) {
      // Refresh token every 50 minutes (tokens expire in 1 hour)
      const interval = setInterval(
        () => {
          refreshToken();
        },
        50 * 60 * 1000,
      );

      return () => clearInterval(interval);
    }
  }, [user]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);

      const response = await AuthService.login({ email, password });

      // Set the auth marker cookie so Next.js middleware can detect the session.
      // The backend's refreshToken is httpOnly and set on the API origin, so it is
      // not visible to Next.js middleware running on the frontend origin.
      // This lightweight cookie acts as the middleware auth signal.
      if (typeof document !== 'undefined') {
        document.cookie = 'zithmi_auth=1; path=/; SameSite=Lax';
      }

      // Transform the response to match our User interface
      const userData: User = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.workEmail || response.user.personalEmail,
        role: response.user.role,
        position: response.user.position || { id: "", title: "" },
        personalEmail: response.user.personalEmail,
        workEmail: response.user.workEmail,
        phone: response.user.phone,
        reportsTo: response.user.reportsTo,
        isActive: response.user.isActive,
        tenantId: response.user.tenantId,
        avatarUrl: response.user.avatarUrl,
        tenantName: response.user.tenantName,
        tenantLogo: (response.user as any).tenantLogo,
        department: (response.user as any).department,
        employeeId: (response.user as any).employeeId,
        employee_code: (response.user as any).employee?.employee_code || (response.user as any).employee_code,
        // Login response doesn't include permissions yet — will be loaded by checkAuth
        permissions: (response.user as any).permissions ?? [],
        planAccess: (response.user as any).planAccess,
      };

      setUser(userData);
      
      // Sync token with extension after successful login
      syncTokenWithExtension(response.accessToken);
      
      // Navigation is handled by the login page component via useEffect watching `user`
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await AuthService.logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      // Clear the auth marker cookie so middleware stops treating user as authenticated
      if (typeof document !== 'undefined') {
        document.cookie = 'zithmi_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      }
      // Clear local state regardless of API call success
      setUser(null);
      router.push("/login");
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const success = await AuthService.refreshToken();
      if (!success) {
        // Refresh failed, clear auth marker cookie and state
        if (typeof document !== 'undefined') {
          document.cookie = 'zithmi_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
        }
        setUser(null);
        AuthService.clearAuth();
        setIsLoading(false);
        return false;
      }
      // Refresh succeeded — ensure auth marker cookie is present
      if (typeof document !== 'undefined') {
        document.cookie = 'zithmi_auth=1; path=/; SameSite=Lax';
      }
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      if (typeof document !== 'undefined') {
        document.cookie = 'zithmi_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      }
      setUser(null);
      AuthService.clearAuth();
      setIsLoading(false);
      return false;
    }
  };

  const checkAuth = async (): Promise<void> => {
    try {
      setIsLoading(true);

      // Check if we have a stored token
      const hasToken = AuthService.isAuthenticated();

      if (!hasToken) {
        // No access token found - try to refresh from cookie before giving up
        console.log(
          "🔄 No access token found, attempting to refresh from cookie...",
        );
        const refreshed = await refreshToken();
        if (!refreshed) {
          console.log(" Token refresh failed, user not authenticated");
          setUser(null);
          return;
        }
        console.log("✅ Token refreshed successfully from cookie");
      }

      // Try to get user profile - axios interceptor will handle token refresh automatically
      const userProfile = await AuthService.getProfile();

      console.log("Fetched user profile:", userProfile);

      // Transform the profile to match our User interface
      const userData: User = {
        id: userProfile.id,
        name: userProfile.name,
        email: userProfile.workEmail || userProfile.personalEmail,
        role: userProfile.role,
        position: userProfile.position || { id: "", title: "" },
        personalEmail: userProfile.personalEmail,
        workEmail: userProfile.workEmail,
        phone: userProfile.phone,
        reportsTo: userProfile.reportsTo?.id || null,
        isActive: userProfile.isActive,
        tenantId: userProfile.tenantId,
        avatarUrl: userProfile.avatarUrl,
        tenantName: userProfile.tenant?.name,
        tenantLogo: userProfile.tenant?.logoUrl,
        department: userProfile.department,
        employeeId: (userProfile as any).employeeId || userProfile.employee?.id,
        employee_code: userProfile.employee?.employee_code || userProfile.employee_code,
        permissions: (userProfile as any).permissions ?? [],
        planAccess: (userProfile as any).planAccess,
      };

      setUser(userData);
    } catch (error) {
      console.error("Auth check failed:", error);

      // Only clear tokens on actual authentication errors (401), not parsing errors
      if (error instanceof ApiError && error.status === 401) {
        console.log('🔒 Authentication error (401), clearing tokens and redirecting to login');
        // Clear the auth marker cookie so middleware stops treating user as authenticated
        if (typeof document !== 'undefined') {
          document.cookie = 'zithmi_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
        }
        setUser(null);
        AuthService.clearAuth();

        // Redirect to login if not already there
        if (
          typeof window !== "undefined" &&
          !window.location.pathname.includes("/login") &&
          !window.location.pathname.startsWith("/public")
        ) {
          router.push("/login?error=session_expired");
        }
      } else {
        // Keep tokens but clear user for non-auth errors (like parsing errors)
        console.log(
          "⚠️ Non-auth error, clearing user but keeping tokens for retry",
        );
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (userData: Partial<User>): void => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    return user.permissions.includes(permission);
  };

  const hasAllPermissions = (...permissions: string[]): boolean => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    return permissions.every((p) => user.permissions.includes(p));
  };

  const hasAnyPermission = (...permissions: string[]): boolean => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    return permissions.some((p) => user.permissions.includes(p));
  };

  // Plan-layer gate (Gate 1). Fail-open: a tenant with no/full plan → allow.
  // NOT short-circuited for super_admin: the plan binds everyone. super_admin's
  // RBAC bypass (Gate 2) lives in hasPermission*/hasAnyPermission, not here.
  const planAllows = (permission: string): boolean => {
    if (!user) return false;
    const pa = user.planAccess;
    if (!pa || pa.full) return true;                        // fail-open: no plan / full plan
    if (pa.permissions.includes(permission)) return true;   // functionality-level grant
    return pa.resources.includes(permission.split('.')[0]); // module-level (resource) grant
  };

  const canAccess = (permission: string): boolean =>
    hasPermission(permission) && planAllows(permission);

  const canAccessAny = (...permissions: string[]): boolean =>
    permissions.some((p) => hasPermission(p) && planAllows(p));

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    updateUser,
    checkAuth,
    refreshToken,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    planAllows,
    canAccess,
    canAccessAny,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
