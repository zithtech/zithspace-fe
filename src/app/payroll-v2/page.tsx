'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermission } from '@/hooks/usePermission';
import { PAYROLL_NAV_ITEMS, canAccessPayrollItem } from '@/components/payroll-v2/navItems';

// Index route: bounce to the first navigable page the user can access. Today
// that's General Settings; as more pages ship, the first accessible one wins.
export default function PayrollV2Index() {
  const router = useRouter();
  const perms = usePermission() as unknown as Record<string, any>;

  useEffect(() => {
    const first = PAYROLL_NAV_ITEMS.find(
      (item) => !item.comingSoon && canAccessPayrollItem(perms, item)
    );
    router.replace(first ? first.href : '/dashboard');
  }, [perms, router]);

  return null;
}
