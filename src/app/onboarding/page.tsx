'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { ONBOARDING_NAV_ITEMS, canAccessOnboardingItem } from '@/components/onboarding/navItems';

// /onboarding has no page of its own — send users to first accessible item.
export default function OnboardingIndexPage() {
  const router = useRouter();
  const { hasAnySubscriptionFeature, isLoading } = useAuth();
  const perms = usePermission() as unknown as Record<string, any>;

  useEffect(() => {
    if (isLoading) return;
    const first = ONBOARDING_NAV_ITEMS.find((i) => canAccessOnboardingItem(perms, i, hasAnySubscriptionFeature));
    router.replace(first ? first.href : '/dashboard');
  }, [perms, hasAnySubscriptionFeature, isLoading, router]);

  return null;
}

