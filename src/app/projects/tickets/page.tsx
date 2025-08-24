'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import TicketList from '@/components/projects/TicketList';

export default function ProjectsTicketsPage() {
  const { user, isLoading } = useAuth();

  // Show loading spinner while authentication is being checked
  if (isLoading) {
    return <LoadingSpinner message="Loading tickets..." />;
  }

  // Don't render if no user
  if (!user) {
    return null;
  }

  return (
    <MainLayout>
      <div style={{ padding: 20 }}>
        <TicketList />
      </div>
    </MainLayout>
  );
}
