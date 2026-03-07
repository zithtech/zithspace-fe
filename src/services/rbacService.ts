import { api } from '@/lib/axios';

export interface RBACPermission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
}

export interface RBACRole {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description?: string;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    rolePermissions: number;
    userRoles: number;
  };
}

export interface RBACRoleDetail extends RBACRole {
  rolePermissions: Array<{
    permission: RBACPermission;
  }>;
  userRoles: Array<{
    user: { id: string; name: string; workEmail: string; role: string };
    assignedAt: string;
  }>;
}

export interface UserRoleEntry {
  userId: string;
  roleId: string;
  tenantId: string;
  assignedAt: string;
  expiresAt?: string | null;
  role: RBACRole & { _count: { rolePermissions: number } };
}

export interface CreateRoleData {
  name: string;
  description?: string;
  permissionIds?: string[];
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
}

export class RBACService {
  /**
   * GET /api/rbac/permissions
   * Returns permissions grouped by resource.
   */
  static async listPermissions(): Promise<{ permissions: RBACPermission[]; grouped: Record<string, RBACPermission[]> }> {
    return api.get('/api/rbac/permissions');
  }

  /**
   * GET /api/rbac/roles
   * Returns the roles array for the current tenant.
   */
  static async listRoles(): Promise<RBACRole[]> {
    return api.get<RBACRole[]>('/api/rbac/roles');
  }

  /**
   * GET /api/rbac/roles/:id
   * Returns full role with permissions and assigned users.
   */
  static async getRoleById(roleId: string): Promise<RBACRoleDetail> {
    return api.get<RBACRoleDetail>(`/api/rbac/roles/${roleId}`);
  }

  /**
   * POST /api/rbac/roles
   * Create a new role (optionally with initial permissions).
   */
  static async createRole(data: CreateRoleData): Promise<RBACRole> {
    return api.post<RBACRole>('/api/rbac/roles', data);
  }

  /**
   * PUT /api/rbac/roles/:id
   * Update role name / description.
   */
  static async updateRole(roleId: string, data: UpdateRoleData): Promise<RBACRole> {
    return api.put<RBACRole>(`/api/rbac/roles/${roleId}`, data);
  }

  /**
   * DELETE /api/rbac/roles/:id
   * Delete a non-system role.
   */
  static async deleteRole(roleId: string): Promise<void> {
    return api.delete(`/api/rbac/roles/${roleId}`);
  }

  /**
   * PUT /api/rbac/roles/:id/permissions
   * Full replace — set the exact list of permissions for a role.
   */
  static async setRolePermissions(roleId: string, permissionIds: string[]): Promise<RBACRoleDetail> {
    return api.put<RBACRoleDetail>(`/api/rbac/roles/${roleId}/permissions`, { permissionIds });
  }

  /**
   * GET /api/rbac/users/:userId/roles
   * Get all roles assigned to a user.
   */
  static async getUserRoles(userId: string): Promise<UserRoleEntry[]> {
    return api.get<UserRoleEntry[]>(`/api/rbac/users/${userId}/roles`);
  }

  /**
   * POST /api/rbac/users/:userId/roles
   * Assign a role to a user.
   */
  static async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    return api.post(`/api/rbac/users/${userId}/roles`, { roleId });
  }

  /**
   * DELETE /api/rbac/users/:userId/roles/:roleId
   * Remove a role from a user.
   */
  static async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    return api.delete(`/api/rbac/users/${userId}/roles/${roleId}`);
  }
}
