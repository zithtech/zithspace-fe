'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermission } from '@/hooks/usePermission';
import { PR_NAV_ITEMS, canAccessPRItem } from '@/components/performance-report/navItems';

// /performance-report index → redirect to the first page the user can access.
export default function PerformanceReportIndex() {
  const router = useRouter();
  const perms = usePermission() as unknown as Record<string, any>;

  useEffect(() => {
    const first = PR_NAV_ITEMS.find((i) => canAccessPRItem(perms, i));
    router.replace(first ? first.href : '/dashboard');
  }, [perms, router]);

  return null;
}
