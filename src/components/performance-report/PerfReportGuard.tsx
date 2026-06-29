'use client';

import React from 'react';
import { usePermission } from '@/hooks/usePermission';
import { getPRNavItem, canAccessPRItem } from './navItems';

// Route-level permission gate for a Performance Report sub-page. Pass the nav
// item key; it resolves the required permissions from the shared navItems config
// so the rule lives in exactly one place. Blocks direct-URL access for users who
// lack the permission, even though the left rail already hides the item.
export default function PerfReportGuard({
  itemKey,
  children,
}: {
  itemKey: string;
  children: React.ReactNode;
}) {
  const perms = usePermission() as unknown as Record<string, any>;
  const item = getPRNavItem(itemKey);

  const allowed = item ? canAccessPRItem(perms, item) : false;

  if (!allowed) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-slate-400)' }}>
        You don’t have permission to view this page.
      </div>
    );
  }

  return <>{children}</>;
}
