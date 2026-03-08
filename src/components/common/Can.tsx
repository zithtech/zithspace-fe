"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";

interface CanProps {
  /** Require this single permission */
  permission?: string;
  /** Require ALL of these permissions */
  permissions?: string[];
  /** Require ANY ONE of these permissions */
  anyPermission?: string[];
  /** Rendered when permission check fails. Defaults to null (hidden). */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Can — declarative permission gate component.
 *
 * Usage:
 *   <Can permission="user.create">
 *     <Button>Add Member</Button>
 *   </Can>
 *
 *   <Can anyPermission={['invoice.manage', 'invoice.create']}>
 *     <InvoiceForm />
 *   </Can>
 *
 *   <Can permissions={['settings.read', 'settings.update']} fallback={<p>No access</p>}>
 *     <SettingsPage />
 *   </Can>
 */
export const Can: React.FC<CanProps> = ({
  permission,
  permissions,
  anyPermission,
  fallback = null,
  children,
}) => {
  const { hasPermission, hasAllPermissions, hasAnyPermission } = useAuth();

  let allowed = false;

  if (permission !== undefined) {
    allowed = hasPermission(permission);
  } else if (permissions !== undefined) {
    allowed = hasAllPermissions(...permissions);
  } else if (anyPermission !== undefined) {
    allowed = hasAnyPermission(...anyPermission);
  } else {
    // No condition specified — always render
    allowed = true;
  }

  return allowed ? <>{children}</> : <>{fallback}</>;
};

export default Can;
