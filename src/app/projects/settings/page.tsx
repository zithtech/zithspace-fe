'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import TicketSettings from '@/components/projects/TicketSettings';

export default function ProjectsSettingsPage() {
  const { user, isLoading } = useAuth();

  // Show loading spinner while authentication is being checked
  if (isLoading) {
    return <LoadingSpinner message="Loading settings..." />;
  }

  // Don't render if no user
  if (!user) {
    return null;
  }

  return (
    <MainLayout>
      <div style={{ padding: 20 }}>
        <TicketSettings />
      </div>
    </MainLayout>
  );
}
