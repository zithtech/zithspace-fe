'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { PAYROLL_NAV_ITEMS, canAccessPayrollItem } from '@/components/payroll-v2/navItems';

// Index route: bounce to the first navigable page the user can access.
export default function PayrollV2Index() {
  const router = useRouter();
  const { hasAnySubscriptionFeature, isLoading } = useAuth();
  const perms = usePermission() as unknown as Record<string, any>;

  useEffect(() => {
    if (isLoading) return;
    const first = PAYROLL_NAV_ITEMS.find(
      (item) => !item.comingSoon && canAccessPayrollItem(perms, item, hasAnySubscriptionFeature)
    );
    router.replace(first ? first.href : '/dashboard');
  }, [perms, hasAnySubscriptionFeature, isLoading, router]);

  return null;
}

