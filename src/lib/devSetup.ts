/**
 * Development Setup Utilities
 * Helpers for initializing development environment with tenant context
 */

// Default development tenant configuration
export const DEV_TENANT = {
  tenantId: 'b85c1b5b-77a3-4281-9147-51d6bd3ee94d',
  name: 'Zithmi',
  subdomain: 'zithmi',
  planType: 'enterprise',
  isActive: true,
} as const;

// Default admin credentials for development
export const DEV_ADMIN = {
  email: 'admin@zithmi.com',
  password: 'admin123',
} as const;

/**
 * Initialize development tenant context
 * This is automatically called by TenantContext in development mode
 */
export function initDevTenant(): void {
  if (typeof window === 'undefined') return;
  
  // Only run in development
  if (process.env.NODE_ENV !== 'development') return;
  
  // Only run on localhost
  if (window.location.hostname !== 'localhost') return;
  
  // Set up development tenant
  localStorage.setItem('currentTenant', JSON.stringify(DEV_TENANT));
  localStorage.setItem('devTenantSubdomain', DEV_TENANT.subdomain);
  
  console.log('🏢 Development tenant initialized:', DEV_TENANT);
}

/**
 * Clear all development data
 */
export function clearDevData(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('currentTenant');
  localStorage.removeItem('devTenantSubdomain');
  localStorage.removeItem('accessToken');
  
  console.log('🧹 Development data cleared');
}

/**
 * Check if development environment is properly set up
 */
export function checkDevSetup(): {
  hasTenant: boolean;
  hasSubdomain: boolean;
  tenantId: string | null;
  subdomain: string | null;
} {
  if (typeof window === 'undefined') {
    return { hasTenant: false, hasSubdomain: false, tenantId: null, subdomain: null };
  }
  
  const tenant = localStorage.getItem('currentTenant');
  const subdomain = localStorage.getItem('devTenantSubdomain');
  
  let tenantId: string | null = null;
  
  if (tenant) {
    try {
      const parsed = JSON.parse(tenant);
      tenantId = parsed.tenantId;
    } catch (e) {
      console.error('Invalid tenant data in localStorage');
    }
  }
  
  return {
    hasTenant: !!tenant,
    hasSubdomain: !!subdomain,
    tenantId,
    subdomain,
  };
}

/**
 * Development console helpers
 * Run these in browser console for debugging
 */
export const devHelpers = {
  // Check current setup
  status: () => {
    const setup = checkDevSetup();
    console.log('🔍 Development Setup Status:', setup);
    return setup;
  },
  
  // Reset development environment
  reset: () => {
    clearDevData();
    initDevTenant();
    console.log('♻️ Development environment reset');
    window.location.reload();
  },
  
  // Manual tenant setup
  setupTenant: (tenantData?: Partial<typeof DEV_TENANT>) => {
    const tenant = { ...DEV_TENANT, ...tenantData };
    localStorage.setItem('currentTenant', JSON.stringify(tenant));
    localStorage.setItem('devTenantSubdomain', tenant.subdomain);
    console.log('🏢 Custom tenant set up:', tenant);
    window.location.reload();
  },
  
  // Show admin credentials
  adminCredentials: () => {
    console.log('👤 admin Credentials for Development:', DEV_ADMIN);
    return DEV_ADMIN;
  },
};

// Make helpers available in development mode
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).devHelpers = devHelpers;
  console.log('🛠️ Development helpers loaded! Use window.devHelpers for utilities.');
}
