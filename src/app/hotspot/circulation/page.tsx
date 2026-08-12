'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import CirculationBoard from '@/components/hotspot/CirculationBoard';

export default function HotspotCirculationPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { canReadHotspotCirculation } = usePermission();

  useEffect(() => {
    if (!isLoading && user && !canReadHotspotCirculation) {
      router.push('/dashboard');
    }
  }, [user, isLoading, canReadHotspotCirculation, router]);

  if (!canReadHotspotCirculation) return null;

  return <CirculationBoard />;
}
