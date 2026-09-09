'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { PR_NAV_ITEMS, canAccessPRItem } from '@/components/performance-report/navItems';

// /performance-report index → redirect to the first page the user can access.
export default function PerformanceReportIndex() {
  const router = useRouter();
  const { hasAnySubscriptionFeature, isLoading } = useAuth();
  const perms = usePermission() as unknown as Record<string, any>;

  useEffect(() => {
    if (isLoading) return;
    const first = PR_NAV_ITEMS.find((i) => canAccessPRItem(perms, i, hasAnySubscriptionFeature));
    router.replace(first ? first.href : '/dashboard');
  }, [perms, hasAnySubscriptionFeature, isLoading, router]);

  return null;
}

