"use client";

import React, { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { ApiError, apiClient } from "@/lib/axios";
import { BRAND_LABELS, manifestForHostname } from "@/lib/product";
import "@/lib/devSetup"; // Load development helpers

/**
 * Labels that are never a tenant slug.
 *
 * Infrastructure names, plus the BRAND names — `testiez.localhost` and
 * `acme.localhost` are structurally identical, so only this list stops the
 * Testiez brand root being resolved as a workspace called "testiez".
 */
const RESERVED_LABELS = new Set<string>([
  "www",
  "api",
  "admin",
  "app",
  "mail",
  ...BRAND_LABELS,
]);

/**
 * The tenant slug a hostname names, or null when it names no tenant.
 *
 * Null means "this is a brand root or a bare localhost" — a legitimate place to
 * be, not a failure. Callers must not treat it as an unknown workspace.
 *
 * Exported because the not-found guard has to ask the same question this
 * provider does: a second copy of this parsing would eventually disagree, and
 * the symptom would be a "workspace not found" screen on a perfectly good host.
 */
export function tenantSlugFromHostname(hostname: string | null | undefined): string | null {
  if (!hostname) return null;

  const host = hostname.toLowerCase().split(":")[0].replace(/\.$/, "");

  if (host === "localhost" || host === "127.0.0.1") return null;

  // *.localhost (e.g. abraham-immanuel.localhost:3005, and
  // kabs.testiez.localhost:3005 for the Testiez surface). Take the FIRST label:
  // the tenant slug is always leftmost, and anything between it and `.localhost`
  // is the brand, not part of the slug. Splitting on '.localhost' would resolve
  // 'kabs.testiez' and 404.
  if (host.endsWith(".localhost")) {
    const label = host.split(".")[0];
    return label && !RESERVED_LABELS.has(label) ? label : null;
  }

  // Production: {tenant}.{brand}.com — three labels or more.
  const parts = host.split(".");
  if (parts.length >= 3) {
    const label = parts[0];
    return RESERVED_LABELS.has(label) ? null : label;
  }

  return null;
}

// Tenant interfaces
interface TenantInfo {
  tenantId: string;
  name: string;
  subdomain: string;
  planType: string;
  isActive: boolean;
  isSetupComplete: boolean;
}

interface TenantContextType {
  tenantInfo: TenantInfo | null;
  tenantId: string | null;
  isLoading: boolean;
  error: string | null;
  /**
   * The backend answered, and there is no such workspace.
   *
   * Deliberately narrower than `error`: a timeout, a CORS failure or a 500 also
   * set an error, and telling someone their workspace does not exist because
   * the API is down sends them off to re-create an account they already have.
   * Only a definitive 404 sets this.
   */
  tenantNotFound: boolean;
  resolveTenant: (subdomain: string) => Promise<boolean>;
  clearTenant: () => void;
  refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tenantNotFound, setTenantNotFound] = useState(false);

  /**
   * Detect tenant from current URL
   */
  const detectTenantFromUrl = (): string | null => {
    if (typeof window === 'undefined') return null;

    const hostname = window.location.hostname;

    // For plain localhost — fall back to localStorage (backward compat)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      const savedTenant = localStorage.getItem('devTenantSubdomain');
      return savedTenant || null;
    }

    return tenantSlugFromHostname(hostname);
  };

  /**
   * Resolve tenant by subdomain
   */
  const resolveTenant = async (subdomain: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      setTenantNotFound(false);

      // Call backend tenant resolution endpoint
      const response = await apiClient.get(`/api/tenants/resolve?subdomain=${subdomain}`);
      
      if (response.data.success) {
        const { tenantId, tenantInfo: info } = response.data.data;
        
        const tenant: TenantInfo = {
          tenantId,
          name: info.name,
          subdomain: info.subdomain,
          planType: info.planType,
          isActive: info.isActive,
          isSetupComplete: info.isSetupComplete ?? true,
        };

        // The backend also resolves RETIRED slugs, so a workspace renamed during
        // setup keeps answering on its old host — that is where its signup
        // welcome email points. When the canonical slug differs from the one in
        // the URL we are on a retired host, so move to the real one, carrying
        // the path and query across so an invite or reset link still lands where
        // it meant to.
        if (
          info.subdomain &&
          info.subdomain !== subdomain &&
          typeof window !== 'undefined'
        ) {
          const host = window.location.host;
          const labels = host.split('.');
          // Only rewrite when the stale slug really is the leftmost label —
          // otherwise we would be guessing at the host shape and could loop.
          if (labels[0] === subdomain) {
            labels[0] = info.subdomain;
            const target = `${window.location.protocol}//${labels.join('.')}${window.location.pathname}${window.location.search}${window.location.hash}`;
            window.location.replace(target);
            return true;
          }
        }

        setTenantInfo(tenant);

        // Store tenant info in localStorage for persistence
        localStorage.setItem('currentTenant', JSON.stringify(tenant));
        
        // For development, store subdomain
        if (window.location.hostname === 'localhost') {
          localStorage.setItem('devTenantSubdomain', subdomain);
        }

        return true;
      } else {
        // A 200 carrying success:false is still the backend saying "no such
        // workspace" — it answered, it just answered no.
        setError('Tenant not found');
        setTenantNotFound(true);
        return false;
      }
    } catch (err) {
      console.error('Tenant resolution failed:', err);
      let errorMessage = 'Failed to resolve tenant';

      if (err instanceof ApiError) {
        if (err.status === 404) {
          errorMessage = 'Tenant not found';
          setTenantNotFound(true);
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Clear tenant context
   */
  const clearTenant = (): void => {
    setTenantInfo(null);
    setError(null);
    setTenantNotFound(false);
    localStorage.removeItem('currentTenant');
    localStorage.removeItem('devTenantSubdomain');
  };

  /**
   * Refresh current tenant data
   */
  const refreshTenant = async (): Promise<void> => {
    if (!tenantInfo?.subdomain) return;
    await resolveTenant(tenantInfo.subdomain);
  };

  /**
   * Initialize tenant context on mount
   */
  useEffect(() => {
    const initializeTenant = async () => {
      try {
        setIsLoading(true);

        // For development mode, create default tenant if not exists
        if (window.location.hostname === 'localhost') {
          const savedTenant = localStorage.getItem('currentTenant');
          if (!savedTenant) {
            // Create default development tenant
            const defaultTenant: TenantInfo = {
              tenantId: 'b85c1b5b-77a3-4281-9147-51d6bd3ee94d',
              name: 'Zithmi',
              subdomain: 'zithmi',
              planType: 'enterprise',
              isActive: true,
              isSetupComplete: true,
            };
            
            setTenantInfo(defaultTenant);
            localStorage.setItem('currentTenant', JSON.stringify(defaultTenant));
            localStorage.setItem('devTenantSubdomain', 'zithmi');
            setIsLoading(false);
            
            console.log('🏢 Development tenant initialized:', defaultTenant);
            return;
          }
        }

        // On *.localhost subdomains (e.g. abraham-immanuel.localhost:3005), always
        // resolve from the URL — localStorage may hold a stale tenant from a different session.
        //
        // Goes through the shared parser rather than splitting again: this used
        // to take the leftmost label unconditionally, so `testiez.localhost:3005`
        // went looking for a workspace named "testiez".
        const initHostname = window.location.hostname;
        if (initHostname.endsWith('.localhost') && initHostname !== 'localhost') {
          const subdomain = tenantSlugFromHostname(initHostname);
          if (subdomain) {
            await resolveTenant(subdomain);
            return;
          }
        }

        // First, try to get tenant from localStorage
        const savedTenant = localStorage.getItem('currentTenant');
        if (savedTenant) {
          try {
            const tenant: TenantInfo = JSON.parse(savedTenant);
            setTenantInfo(tenant);
            setIsLoading(false);

            // Optionally refresh tenant data in background for production
            if (window.location.hostname !== 'localhost') {
              resolveTenant(tenant.subdomain);
            }
            return;
          } catch (e) {
            console.error('Invalid saved tenant data:', e);
            localStorage.removeItem('currentTenant');
          }
        }

        // Detect tenant from URL
        const subdomainFromUrl = detectTenantFromUrl();
        if (subdomainFromUrl) {
          await resolveTenant(subdomainFromUrl);
        } else {
          // No tenant detected
          setError('No tenant found. Please access via tenant subdomain.');
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Tenant initialization failed:', err);
        setError('Failed to initialize tenant context');
        setIsLoading(false);
      }
    };

    initializeTenant();
  }, []);

  /**
   * Update page title based on tenant
   */
  useEffect(() => {
    // The suffix is the PRODUCT, not a generic description: a Testiez customer
    // seeing "Project Management" in the browser tab is being shown the wrong
    // product entirely. Read from the manifest rather than useProduct() so this
    // provider stays usable outside ProductProvider.
    const productName = manifestForHostname(window.location.hostname).name;

    document.title = tenantInfo ? `${tenantInfo.name} · ${productName}` : productName;
  }, [tenantInfo]);

  const value: TenantContextType = {
    tenantInfo,
    tenantId: tenantInfo?.tenantId || null,
    isLoading,
    error,
    tenantNotFound,
    resolveTenant,
    clearTenant,
    refreshTenant,
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};

/**
 * Hook to use tenant context
 */
export const useTenant = (): TenantContextType => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
};

/**
 * The `withTenant` HOC that used to live here has been removed.
 *
 * It rendered a "Tenant Not Found" screen on `error || !tenantInfo` and was
 * wrapped around nothing at all, so the app never showed it — an unknown
 * workspace fell through to the login form instead. Its job is now done by
 * components/common/WorkspaceNotFoundGuard.tsx, mounted once in the root
 * layout, which additionally distinguishes a host that NAMES a workspace from a
 * brand root that legitimately carries none. That distinction is why the old
 * condition could not simply be switched on: on a brand root it was true, and
 * everyone would have been locked out of the front door.
 */

export default TenantContext;
