'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermission } from '@/hooks/usePermission';
import { LEAVE_NAV_ITEMS, canAccessLeaveItem } from '@/components/leaves-v2/navItems';

// /leaves-v2 index → redirect to the first page the user can access.
export default function LeavesV2Index() {
  const router = useRouter();
  const perms = usePermission() as unknown as Record<string, any>;

  useEffect(() => {
    const first = LEAVE_NAV_ITEMS.find((i) => canAccessLeaveItem(perms, i));
    router.replace(first ? first.href : '/dashboard');
  }, [perms, router]);

  return null;
}
