"use client";

import React, { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthService, LoginCredentials, LoginResponse } from "@/services/authService";
import { ApiError } from "@/lib/axios";

interface User {
  id: string;
  name: string;
  email: string;
  role: 'super admin' | 'admin' | 'user';
  position: 'Developer' | 'CEO' | 'DevOps' | 'Project Manager' | 'Product Manager' | 'UI/UX' | 'Business Management';
  personalEmail: string;
  workEmail: string;
  phone: string;
  reportsTo?: string | null;
  isActive: boolean;
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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
      const interval = setInterval(() => {
        refreshToken();
      }, 50 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [user]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const response = await AuthService.login({ email, password });
      
      // Transform the response to match our User interface
      const userData: User = {
        id: response.user._id,
        name: response.user.name,
        email: response.user.workEmail || response.user.personalEmail,
        role: response.user.role,
        position: response.user.position as User['position'],
        personalEmail: response.user.personalEmail,
        workEmail: response.user.workEmail,
        phone: response.user.phone,
        reportsTo: response.user.reportsTo,
        isActive: response.user.isActive,
      };

      setUser(userData);
      router.push("/dashboard");
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
      console.error('Logout failed:', error);
    } finally {
      // Clear local state regardless of API call success
      setUser(null);
      router.push("/login");
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const success = await AuthService.refreshToken();
      if (!success) {
        // Refresh failed, clear auth and set loading to false
        setUser(null);
        AuthService.clearAuth();
        setIsLoading(false);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
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
        setUser(null);
        return;
      }

      // Try to get user profile - axios interceptor will handle token refresh automatically
      const userProfile = await AuthService.getProfile();
      
      // Transform the profile to match our User interface
      const userData: User = {
        id: userProfile.id, // Backend returns "id"
        name: userProfile.name,
        email: userProfile.workEmail || userProfile.personalEmail,
        role: userProfile.role as User['role'],
        position: userProfile.position as User['position'],
        personalEmail: userProfile.personalEmail,
        workEmail: userProfile.workEmail,
        phone: userProfile.phone,
        reportsTo: userProfile.reportsTo?._id || null, // reportsTo still uses _id structure
        isActive: userProfile.isActive,
      };

      setUser(userData);
    } catch (error) {
      console.error('Auth check failed:', error);
      
      // Only clear tokens on actual authentication errors (401), not parsing errors
      if (error instanceof ApiError && error.status === 401) {
        setUser(null);
        AuthService.clearAuth();
      } else {
        // Keep tokens but clear user for non-auth errors (like parsing errors)
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

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    updateUser,
    checkAuth,
    refreshToken,
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
