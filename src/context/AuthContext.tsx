"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { SessionProvider, useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { Session } from "next-auth";

interface AuthContextType {
  user: Session["user"] | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<Session["user"]>) => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProviderInner: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.ok && !result?.error) {
        router.push("/dashboard");
        return true;
      }
      throw new Error(result?.error || "Login failed");
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  const updateUser = async (userData: Partial<Session["user"]>) => {
    await update({
      ...session,
      user: {
        ...session?.user,
        ...userData,
      },
    });
  };

  const checkAuth = async () => {
    // Kept for compatibility
  };

  const value: AuthContextType = {
    user: session?.user || null,
    isLoading: status === "loading",
    isAuthenticated: !!session?.user,
    login,
    logout,
    updateUser,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  return (
    <SessionProvider
      refetchInterval={60 * 60} // Refetch every 1 hour instead of default
      refetchOnWindowFocus={false} // Disable refetch on window focus
      refetchWhenOffline={false}
    >
      <AuthProviderInner>{children}</AuthProviderInner>
    </SessionProvider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
