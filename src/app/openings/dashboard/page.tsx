'use client';

import OpeningsGuard from '@/components/openings/OpeningsGuard';
import DashboardPanel from '@/components/openings/DashboardPanel';

export default function Page() {
  return (
    <OpeningsGuard itemKey="dashboard">
      <DashboardPanel />
    </OpeningsGuard>
  );
}
