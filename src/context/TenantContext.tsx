"use client";

import React, { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { ApiError, apiClient } from "@/lib/axios";
import { manifestForHostname } from "@/lib/product";
import "@/lib/devSetup"; // Load development helpers

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
  resolveTenant: (subdomain: string) => Promise<boolean>;
  clearTenant: () => void;
  refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

    // *.localhost subdomains (e.g. abraham-immanuel.localhost:3005, and
    // kabs.testiez.localhost:3005 for the Testiez surface). Take the FIRST
    // label: the tenant slug is always leftmost, and anything between it and
    // `.localhost` is the brand, not part of the slug. Splitting on
    // '.localhost' would resolve 'kabs.testiez' and 404.
    if (hostname.endsWith('.localhost')) {
      const subdomain = hostname.split('.')[0];
      if (subdomain && !['www', 'api', 'admin', 'app', 'mail'].includes(subdomain)) {
        return subdomain;
      }
    }

    // Production subdomain detection: subdomain.domain.com
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      const subdomain = parts[0];
      if (!['www', 'api', 'admin', 'app', 'mail'].includes(subdomain)) {
        return subdomain;
      }
    }

    return null;
  };

  /**
   * Resolve tenant by subdomain
   */
  const resolveTenant = async (subdomain: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

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

        setTenantInfo(tenant);

        // Store tenant info in localStorage for persistence
        localStorage.setItem('currentTenant', JSON.stringify(tenant));
        
        // For development, store subdomain
        if (window.location.hostname === 'localhost') {
          localStorage.setItem('devTenantSubdomain', subdomain);
        }

        return true;
      } else {
        setError('Tenant not found');
        return false;
      }
    } catch (err) {
      console.error('Tenant resolution failed:', err);
      let errorMessage = 'Failed to resolve tenant';
      
      if (err instanceof ApiError) {
        if (err.status === 404) {
          errorMessage = 'Tenant not found';
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
        const initHostname = window.location.hostname;
        if (initHostname.endsWith('.localhost') && initHostname !== 'localhost') {
          // First label only — see detectTenantFromUrl above.
          const subdomain = initHostname.split('.')[0];
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
 * Higher-order component to require tenant context
 */
export const withTenant = <P extends object>(Component: React.ComponentType<P>) => {
  return function WithTenantComponent(props: P) {
    const { tenantInfo, isLoading, error } = useTenant();

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading tenant information...</p>
          </div>
        </div>
      );
    }

    if (error || !tenantInfo) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Tenant Not Found</h1>
            <p className="text-gray-600 mb-4">
              {error || "Unable to identify your organization. Please check the URL."}
            </p>
            <p className="text-sm text-gray-500">
              Please access via your organization's subdomain: yourorg.domain.com
            </p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
};

export default TenantContext;
