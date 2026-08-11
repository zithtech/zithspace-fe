'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { HOTSPOT_NAV_ITEMS } from '@/components/hotspot/navItems';

// /hotspot has no content of its own — it is the module root. The TopNav and
// existing bookmarks point here, so land on the first available rail item.
export default function HotspotPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { can } = usePermission();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    const firstAvailable = HOTSPOT_NAV_ITEMS.find(item => !item.permission || can(item.permission));
    if (firstAvailable) {
      router.replace(firstAvailable.href);
    } else {
      router.replace('/dashboard');
    }
  }, [router, user, isLoading, can]);

  return null;
}
