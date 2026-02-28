'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Spin } from 'antd';
import ReleasePlan from '@/components/projects/ReleasePlan';

export default function ProjectsReleasePlanPage() {
  const { isLoading: authLoading } = useAuth();
  const { canReadProject } = usePermission();
  const router = useRouter();

  // Route guard
  useEffect(() => {
    if (!authLoading && !canReadProject) {
      router.push('/dashboard');
    }
  }, [authLoading, canReadProject, router]);

  // Loading state
  if (authLoading) {
    return (
      <MainLayout>
        <div style={{ padding: 24, textAlign: 'center' }}>
          <Spin size="large" tip="Loading plans..." />
        </div>
      </MainLayout>
    );
  }

  // Permission check
  if (!canReadProject) {
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
