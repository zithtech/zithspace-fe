'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import TicketSettings from '@/components/projects/TicketSettings';

export default function ProjectsSettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { canReadTicketSetting } = usePermission();
  const router = useRouter();

  // Route guard - requires ticket.setting.read permission
  useEffect(() => {
    if (!authLoading && !canReadTicketSetting) {
      router.push('/dashboard');
    }
  }, [authLoading, canReadTicketSetting, router]);

  // Show loading spinner while authentication is being checked
  if (authLoading) {
    return <LoadingSpinner message="Loading settings..." />;
  }

  // Don't render if no permission
  if (!canReadTicketSetting) {
    return null;
  }

  return (
    <MainLayout>
      <div style={{ 
        margin: "0 -24px", 
        padding: "24px 32px", 
        background: "var(--bg-pure-white)", 
        minHeight: "calc(100vh - 64px)" 
      }}>
        <TicketSettings />
      </div>
    </MainLayout>
  );
}
