'use client';
import ZukvoLoader from "@/components/common/ZukvoLoader";


import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import SprintPlan from '@/components/projects/SprintPlan';

export default function ProjectsSprintPlanPage() {
  const { isLoading: authLoading } = useAuth();
  const { canReadTicketPlan } = usePermission();
  const router = useRouter();

  // Route guard
  useEffect(() => {
    if (!authLoading && !canReadTicketPlan) {
      router.push('/dashboard');
    }
  }, [authLoading, canReadTicketPlan, router]);

  // Loading state
  if (authLoading) {
    return (
      <MainLayout noPadding>
        <div style={{
          background: "var(--bg-pure-white)",
          minHeight: "calc(100vh - 64px)",
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <ZukvoLoader size="lg" message="Orchestrating plans repository..." />
        </div>
      </MainLayout>
    );
  }

  // Permission check
  if (!canReadTicketPlan) {
    return null;
  }

  return (
    <MainLayout noPadding>
      <SprintPlan />
    </MainLayout>
  );
}
