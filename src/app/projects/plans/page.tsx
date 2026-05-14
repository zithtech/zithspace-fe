'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Spin } from 'antd';
import SprintPlan from '@/components/projects/SprintPlan';

export default function ProjectsSprintPlanPage() {
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
        <div style={{
          margin: "0 -24px",
          padding: "24px 32px",
          background: "var(--bg-pure-white)",
          minHeight: "calc(100vh - 64px)",
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Spin size="large" tip="Orchestrating plans repository..." />
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
      <div style={{
        margin: "0 -24px",
        padding: "0 24px",
        background: "var(--bg-pure-white)",
        minHeight: "calc(100vh - 64px)"
      }}>
        <SprintPlan />
      </div>
    </MainLayout>
  );
}
