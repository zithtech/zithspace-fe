'use client';

import React, { use, useEffect } from 'react';
import { Alert, Button, Spin } from 'antd';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import TicketList from '@/components/projects/TicketList';
import { ProjectService } from '@/services/projectService';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import TicketSkeleton from '@/components/projects/TicketSkeleton';

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default function ProjectTicketsPage({ params }: PageProps) {
  const { projectId } = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { canReadTicket } = usePermission();

  // Route guard
  useEffect(() => {
    if (!authLoading && !canReadTicket) {
      router.push('/dashboard');
    }
  }, [authLoading, canReadTicket, router]);

  // Fetch project details
  const { data: project, isLoading: projectLoading, error } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => ProjectService.getProject(projectId),
    enabled: !!projectId && !!user,
  });

  // Clear invalid lastProjectId if it fails
  useEffect(() => {
    if (error || (!projectLoading && !project && projectId)) {
      localStorage.removeItem('lastProjectId');
    }
  }, [error, project, projectLoading, projectId]);

  if (authLoading || projectLoading) {
    return <TicketSkeleton fullPage={true} />;
  }

  if (error || !project) {
    return (
      <MainLayout>
        <div style={{ padding: 20, maxWidth: 600, margin: '60px auto' }}>
          <Alert
            message="Project Not Found"
            description="The project you're looking for doesn't exist or you don't have access to it."
            type="error"
            showIcon
            action={
              <Button
                type="primary"
                onClick={() => router.push('/tickets/select?select=true')}
              >
                Back to Projects
              </Button>
            }
          />
        </div>
      </MainLayout>
    );
  }

  // Permission check
  if (!canReadTicket && !authLoading) {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <MainLayout noPadding>
      <TicketList
        projectId={project.id}
        projectName={project.name}
        projectCode={project.code}
      />
    </MainLayout>
  );
}
