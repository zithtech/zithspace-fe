"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { portalApi, PortalTokenManager } from "@/lib/portalAxios";

export interface PortalUser {
  id: string;
  tenantId: string;
  clientId: string;
  contactId: string | null;
  username: string;
  email: string;
  displayName: string;
  designation?: string | null;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  client?: {
    id: string;
    companyName: string;
    clientCode: string;
    industry?: string;
    website?: string;
  } | null;
}

interface PortalAuthCtx {
  user: PortalUser | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;
}

const Ctx = createContext<PortalAuthCtx | undefined>(undefined);

export const ClientPortalAuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [user, setUser] = useState<PortalUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshMe = useCallback(async () => {
    const token = PortalTokenManager.getAccessToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await portalApi.get<PortalUser>("/api/client-portal/auth/me");
      setUser(me);
      PortalTokenManager.setUser(me);
    } catch {
      PortalTokenManager.clear();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  // Guard portal routes: kick unauthenticated users to /portal/login (except for
  // login page itself).
  useEffect(() => {
    if (loading) return;
    if (!pathname?.startsWith("/portal")) return;
    if (pathname === "/portal/login") return;
    if (!user) {
      router.replace(
        `/portal/login?redirect=${encodeURIComponent(pathname || "/portal")}`,
      );
    }
  }, [loading, user, pathname, router]);

  const login = async (identifier: string, password: string) => {
    const data = await portalApi.post<{
      accessToken: string;
      portalUser: PortalUser & { mustChangePassword: boolean };
    }>("/api/client-portal/auth/login", { identifier, password });

    PortalTokenManager.setAccessToken(data.accessToken);
    await refreshMe();
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
  ) => {
    await portalApi.post("/api/client-portal/auth/change-password", {
      currentPassword,
      newPassword,
    });
    // Backend clears must_change_password on success — refresh local user.
    await refreshMe();
  };

  const logout = async () => {
    try {
      await portalApi.post("/api/client-portal/auth/logout");
    } catch {
      // ignore — clearing locally is enough
    }
    PortalTokenManager.clear();
    setUser(null);
    router.replace("/portal/login");
  };

  return (
    <Ctx.Provider value={{ user, loading, login, logout, refreshMe, changePassword }}>
      {children}
    </Ctx.Provider>
  );
};

export const useClientPortalAuth = (): PortalAuthCtx => {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error(
      "useClientPortalAuth must be used inside ClientPortalAuthProvider",
    );
  return ctx;
};
