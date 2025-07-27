// Role-Based Access Control (RBAC) System
// Centralized permission management for scalable access control

export type Role = 'super admin' | 'admin' | 'user';
export type Resource = 'members' | 'transactions' | 'profile' | 'settings' | 'dashboard' | 'reports';
export type Action = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'view';

// Permission matrix defining what each role can do with each resource
const PERMISSION_MATRIX: Record<Role, Record<Resource, Action[]>> = {
  'super admin': {
    members: ['create', 'read', 'update', 'delete', 'manage', 'view'],
    transactions: ['create', 'read', 'update', 'delete', 'manage', 'view'],
    profile: ['read', 'update', 'view'],
    settings: ['read', 'update', 'view'],
    dashboard: ['read', 'view'],
    reports: ['create', 'read', 'update', 'delete', 'manage', 'view'],
  },
  'admin': {
    members: ['read', 'view'],
    transactions: ['read', 'view'],
    profile: ['read', 'update', 'view'],
    settings: ['read', 'update', 'view'],
    dashboard: ['read', 'view'],
    reports: ['read', 'view'],
  },
  'user': {
    members: ['read', 'view'],
    transactions: ['read', 'view'], // Can only view own transactions (handled in data filtering)
    profile: ['read', 'update', 'view'],
    settings: ['read', 'update', 'view'],
    dashboard: ['read', 'view'],
    reports: ['read', 'view'],
  },
};

// Core RBAC functions
export class RBAC {
  /**
   * Check if a role has permission to perform an action on a resource
   */
  static hasPermission(role: Role, resource: Resource, action: Action): boolean {
    const rolePermissions = PERMISSION_MATRIX[role];
    if (!rolePermissions) return false;

    const resourcePermissions = rolePermissions[resource];
    if (!resourcePermissions) return false;

    return resourcePermissions.includes(action);
  }

  /**
   * Check if a role can manage (create/update/delete) a resource
   */
  static canManage(role: Role, resource: Resource): boolean {
    return this.hasPermission(role, resource, 'manage') ||
           (this.hasPermission(role, resource, 'create') &&
            this.hasPermission(role, resource, 'update') &&
            this.hasPermission(role, resource, 'delete'));
  }

  /**
   * Check if a role can view a resource
   */
  static canView(role: Role, resource: Resource): boolean {
    return this.hasPermission(role, resource, 'view') ||
           this.hasPermission(role, resource, 'read');
  }

  /**
   * Check if a role can create a resource
   */
  static canCreate(role: Role, resource: Resource): boolean {
    return this.hasPermission(role, resource, 'create');
  }

  /**
   * Check if a role can update a resource
   */
  static canUpdate(role: Role, resource: Resource): boolean {
    return this.hasPermission(role, resource, 'update');
  }

  /**
   * Check if a role can delete a resource
   */
  static canDelete(role: Role, resource: Resource): boolean {
    return this.hasPermission(role, resource, 'delete');
  }

  /**
   * Get all permissions for a role
   */
  static getRolePermissions(role: Role): Record<Resource, Action[]> {
    return PERMISSION_MATRIX[role] || {};
  }

  /**
   * Get all actions a role can perform on a specific resource
   */
  static getResourcePermissions(role: Role, resource: Resource): Action[] {
    const rolePermissions = PERMISSION_MATRIX[role];
    return rolePermissions?.[resource] || [];
  }

  /**
   * Check multiple permissions at once
   */
  static hasAnyPermission(role: Role, resource: Resource, actions: Action[]): boolean {
    return actions.some(action => this.hasPermission(role, resource, action));
  }

  /**
   * Check if user has all specified permissions
   */
  static hasAllPermissions(role: Role, resource: Resource, actions: Action[]): boolean {
    return actions.every(action => this.hasPermission(role, resource, action));
  }

  /**
   * Validate API access - throws error if no permission
   */
  static validateApiAccess(role: Role, resource: Resource, action: Action): void {
    if (!this.hasPermission(role, resource, action)) {
      throw new Error(`Insufficient permissions: ${role} cannot ${action} ${resource}`);
    }
  }

  /**
   * Get user-friendly permission description
   */
  static getPermissionDescription(role: Role, resource: Resource): string {
    const permissions = this.getResourcePermissions(role, resource);
    
    if (permissions.includes('manage')) {
      return 'Full access';
    }
    
    const canCreate = permissions.includes('create');
    const canUpdate = permissions.includes('update');
    const canDelete = permissions.includes('delete');
    const canView = permissions.includes('view') || permissions.includes('read');
    
    if (canCreate && canUpdate && canDelete) {
      return 'Full management';
    } else if (canView && !canCreate && !canUpdate && !canDelete) {
      return 'View only';
    } else {
      const actions = [];
      if (canView) actions.push('view');
      if (canCreate) actions.push('create');
      if (canUpdate) actions.push('update');
      if (canDelete) actions.push('delete');
      return actions.join(', ');
    }
  }
}

// Convenience functions for common permission checks
export const canManageMembers = (role: Role) => RBAC.canManage(role, 'members');
export const canViewMembers = (role: Role) => RBAC.canView(role, 'members');
export const canCreateMembers = (role: Role) => RBAC.canCreate(role, 'members');
export const canUpdateMembers = (role: Role) => RBAC.canUpdate(role, 'members');
export const canDeleteMembers = (role: Role) => RBAC.canDelete(role, 'members');

export const canManageTransactions = (role: Role) => RBAC.canManage(role, 'transactions');
export const canViewTransactions = (role: Role) => RBAC.canView(role, 'transactions');
export const canCreateTransactions = (role: Role) => RBAC.canCreate(role, 'transactions');
export const canUpdateTransactions = (role: Role) => RBAC.canUpdate(role, 'transactions');
export const canDeleteTransactions = (role: Role) => RBAC.canDelete(role, 'transactions');

export const canManageProfile = (role: Role) => RBAC.canUpdate(role, 'profile');
export const canViewProfile = (role: Role) => RBAC.canView(role, 'profile');

// Hook for React components
export const useRBAC = (role: Role) => {
  return {
    // Members permissions
    canManageMembers: canManageMembers(role),
    canViewMembers: canViewMembers(role),
    canCreateMembers: canCreateMembers(role),
    canUpdateMembers: canUpdateMembers(role),
    canDeleteMembers: canDeleteMembers(role),
    
    // Transactions permissions
    canManageTransactions: canManageTransactions(role),
    canViewTransactions: canViewTransactions(role),
    canCreateTransactions: canCreateTransactions(role),
    canUpdateTransactions: canUpdateTransactions(role),
    canDeleteTransactions: canDeleteTransactions(role),
    
    // Profile permissions
    canManageProfile: canManageProfile(role),
    canViewProfile: canViewProfile(role),
    
    // Generic permission checker
    hasPermission: (resource: Resource, action: Action) => 
      RBAC.hasPermission(role, resource, action),
    
    // Get permission description
    getPermissionDescription: (resource: Resource) => 
      RBAC.getPermissionDescription(role, resource),
  };
};

// API middleware helper
export const createRBACMiddleware = (resource: Resource, action: Action) => {
  return (role: Role) => {
    try {
      RBAC.validateApiAccess(role, resource, action);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Permission denied' 
      };
    }
  };
};

export default RBAC;
