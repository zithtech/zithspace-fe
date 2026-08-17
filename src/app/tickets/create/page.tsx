'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import CreateTicket from '@/components/projects/CreateTicket';
import ZukvoLoader from '@/components/common/ZukvoLoader';

export default function ProjectsCreatePage() {
  const { user, isLoading: authLoading } = useAuth();
  const { canCreateTicket } = usePermission();
  const router = useRouter();

  // Route guard - requires ticket.create permission
  useEffect(() => {
    if (!authLoading && !canCreateTicket) {
      router.push('/dashboard');
    }
  }, [authLoading, canCreateTicket, router]);

  // Show loading spinner while authentication is being checked
  if (authLoading) {
    return <ZukvoLoader message="Loading create ticket..." />;
  }

  // Don't render if no permission
  if (!canCreateTicket) {
    return null;
  }

  return (
    <MainLayout>
      <div style={{
        margin: "0 -24px",
        padding: "0 24px",
        background: "var(--bg-pure-white)",
        minHeight: "calc(100vh - 64px)",
        overflow: "hidden"
      }}>
        <CreateTicket />
      </div>
    </MainLayout>
  );
}
