'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ReleasePlan from '@/components/projects/ReleasePlan';

export default function ProjectsReleasePlanPage() {
  const { user, isLoading } = useAuth();

  // Show loading spinner while authentication is being checked
  if (isLoading) {
    return <LoadingSpinner message="Loading release plan..." />;
  }

  // Don't render if no user
  if (!user) {
    return null;
  }

  return (
    <MainLayout>
      <div style={{ padding: 20 }}>
        <ReleasePlan />
      </div>
    </MainLayout>
  );
}
