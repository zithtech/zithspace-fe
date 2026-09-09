'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { OPENING_NAV_ITEMS, canAccessOpeningItem } from '@/components/openings/navItems';

// Index route: redirect to the first sub-page the user can access.
export default function OpeningsIndex() {
  const router = useRouter();
  const { hasAnySubscriptionFeature, isLoading } = useAuth();
  const perms = usePermission() as unknown as Record<string, any>;

  useEffect(() => {
    if (isLoading) return;
    const first = OPENING_NAV_ITEMS.find((item) => canAccessOpeningItem(perms, item, hasAnySubscriptionFeature));
    router.replace(first ? first.href : '/dashboard');
  }, [perms, hasAnySubscriptionFeature, isLoading, router]);

  return null;
}

