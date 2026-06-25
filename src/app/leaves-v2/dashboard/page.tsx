'use client';

import LeaveGuard from '@/components/leaves-v2/LeaveGuard';
import DashboardPanel from '@/components/leaves-v2/DashboardPanel';

export default function LeavesDashboardPage() {
  return (
    <LeaveGuard itemKey="dashboard">
      <DashboardPanel />
    </LeaveGuard>
  );
}
