'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import HotspotDashboard from '@/components/hotspot/HotspotDashboard';

export default function HotspotOpeningsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { canReadHotspotOpening } = usePermission();

  useEffect(() => {
    if (!isLoading && user && !canReadHotspotOpening) {
      router.push('/dashboard');
    }
  }, [user, isLoading, canReadHotspotOpening, router]);

  if (!canReadHotspotOpening) return null;

  return <HotspotDashboard />;
}
