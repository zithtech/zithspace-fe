'use client';

import MainLayout from '@/components/layout/MainLayout';
import MyHubContent from '@/components/my-hub/MyHubContent';
import LeaveGuard from '@/components/leaves-v2/LeaveGuard';
import ApplyLeavePanel from '@/components/leaves-v2/ApplyLeavePanel';

// My Hub self-service Apply Leave — reuses the Leaves 2.0 panel, but without the
// leaves-v2 layout's admin left rail. My Hub's own rail (from MainLayout) stays.
export default function MyHubApplyLeavePage() {
  return (
    <MainLayout>
      <MyHubContent>
        <LeaveGuard itemKey="apply">
          <ApplyLeavePanel />
        </LeaveGuard>
      </MyHubContent>
    </MainLayout>
  );
}
