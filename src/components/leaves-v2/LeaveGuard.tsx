'use client';

import React from 'react';
import { usePermission } from '@/hooks/usePermission';
import { getLeaveNavItem, canAccessLeaveItem } from './navItems';

// Route-level permission gate for a Leaves 2.0 sub-page. Pass the nav item key;
// it resolves the required permissions from the shared navItems config so the
// rule lives in exactly one place. Blocks direct-URL access for users who lack
// the permission, even though the left rail already hides the item.
export default function LeaveGuard({
  itemKey,
  children,
}: {
  itemKey: string;
  children: React.ReactNode;
}) {
  const perms = usePermission() as unknown as Record<string, any>;
  const item = getLeaveNavItem(itemKey);

  const allowed = item ? canAccessLeaveItem(perms, item) : false;

  if (!allowed) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
        You don’t have permission to view this page.
      </div>
    );
  }

  return <>{children}</>;
}
