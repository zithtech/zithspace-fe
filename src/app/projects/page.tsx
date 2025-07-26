'use client';

import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import ComingSoon from '@/components/common/ComingSoon';
import { ProjectOutlined } from '@ant-design/icons';

export default function ProjectsPage() {
  return (
    <MainLayout>
      <ComingSoon
        title="Projects"
        description="Manage and track your team's projects, assign tasks, monitor progress, and collaborate effectively."
        icon={<ProjectOutlined />}
      />
    </MainLayout>
  );
}
