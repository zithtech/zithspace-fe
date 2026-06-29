'use client';

import LeaveGuard from '@/components/leaves-v2/LeaveGuard';
import ApprovalsPanel from '@/components/leaves-v2/ApprovalsPanel';

export default function LeaveApprovalsPage() {
  return (
    <LeaveGuard itemKey="approvals">
      <ApprovalsPanel />
    </LeaveGuard>
  );
}
