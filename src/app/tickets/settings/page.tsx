'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import TicketSettings from '@/components/projects/TicketSettings';
import ZukvoLoader from '@/components/common/ZukvoLoader';

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
    return (
      <MainLayout>
        <div style={{ padding: 24, textAlign: 'center', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ZukvoLoader size="lg" message="Loading settings..." />
        </div>
      </MainLayout>
    );
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
