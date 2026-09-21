import axios, { AxiosInstance } from "axios";

const PORTAL_TOKEN_KEY = "clientPortalAccessToken";
const PORTAL_USER_KEY = "clientPortalUser";

export const PortalTokenManager = {
  getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(PORTAL_TOKEN_KEY);
  },
  setAccessToken(token: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(PORTAL_TOKEN_KEY, token);
  },
  clearAccessToken(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(PORTAL_TOKEN_KEY);
  },
  getUser(): any | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(PORTAL_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  setUser(user: any): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(PORTAL_USER_KEY, JSON.stringify(user));
  },
  clear(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(PORTAL_TOKEN_KEY);
    localStorage.removeItem(PORTAL_USER_KEY);
  },
};

function resolveTenantHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const headers: Record<string, string> = {};

  const hostname = window.location.hostname;
  let subdomain: string | null = null;
  let tenantId: string | null = localStorage.getItem("clientPortalTenantId");

  // Read currentTenant saved by main app / auth
  try {
    const savedTenant = localStorage.getItem("currentTenant");
    if (savedTenant) {
      const parsed = JSON.parse(savedTenant);
      if (!tenantId && parsed.tenantId) {
        tenantId = parsed.tenantId;
      }
      if (parsed.subdomain) {
        subdomain = parsed.subdomain;
      }
    }
  } catch {}

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    const devSub = localStorage.getItem("devTenantSubdomain");
    if (devSub) subdomain = devSub;
  } else if (hostname.endsWith(".localhost")) {
    const candidate = hostname.split(".")[0];
    if (candidate && !["www", "api", "admin", "app", "mail"].includes(candidate)) {
      subdomain = candidate;
    }
  } else {
    const parts = hostname.split(".");
    if (parts.length >= 3) {
      const candidate = parts[0];
      if (!["www", "api", "admin", "app", "mail"].includes(candidate)) {
        subdomain = candidate;
      }
    }
  }

  if (subdomain) headers["X-Tenant-Subdomain"] = subdomain;
  if (tenantId) headers["X-Tenant-ID"] = tenantId;

  return headers;
}

const createPortalClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    timeout: 30000,
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
  });

  client.interceptors.request.use((config) => {
    const token = PortalTokenManager.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const tenantHeaders = resolveTenantHeaders();
    Object.entries(tenantHeaders).forEach(([k, v]) => {
      if (config.headers) config.headers[k] = v;
    });
    return config;
  });

  client.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err?.response?.status === 401) {
        PortalTokenManager.clear();
        if (
          typeof window !== "undefined" &&
          !window.location.pathname.startsWith("/portal/login")
        ) {
          window.location.href = "/portal/login";
        }
      }
      return Promise.reject(err);
    },
  );

  return client;
};

export const portalClient = createPortalClient();

export const portalApi = {
  async get<T = any>(url: string): Promise<T> {
    const res = await portalClient.get(url);
    if (res.data?.success === false) {
      throw new Error(res.data.error || "Request failed");
    }
    return res.data?.data ?? res.data;
  },
  async post<T = any>(url: string, body?: any): Promise<T> {
    const res = await portalClient.post(url, body);
    if (res.data?.success === false) {
      throw new Error(res.data.error || "Request failed");
    }
    return res.data?.data ?? res.data;
  },
};
