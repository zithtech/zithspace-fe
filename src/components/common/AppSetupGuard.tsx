'use client';

import React from 'react';
import { useTenant } from '@/context/TenantContext';
import { useAuth } from '@/context/AuthContext';
import SetupWorkspaceModal from './SetupWorkspaceModal';

export default function AppSetupGuard({ children }: { children: React.ReactNode }) {
  const { tenantInfo } = useTenant();
  const { user } = useAuth();

  const showSetup =
    user !== null &&
    (user.role === 'admin' || user.role === 'super_admin') &&
    tenantInfo !== null &&
    (tenantInfo as any).isSetupComplete === false;

  return (
    <>
      {children}
      {showSetup && <SetupWorkspaceModal />}
    </>
  );
}
