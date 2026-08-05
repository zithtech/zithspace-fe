'use client';

import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/common/ProtectedRoute';

export default function HotspotLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <MainLayout hideSideNav>
        {children}
      </MainLayout>
    </ProtectedRoute>
  );
}
