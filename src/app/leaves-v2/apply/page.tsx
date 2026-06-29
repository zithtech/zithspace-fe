'use client';

import LeaveGuard from '@/components/leaves-v2/LeaveGuard';
import ApplyLeavePanel from '@/components/leaves-v2/ApplyLeavePanel';

export default function ApplyLeavePage() {
  return (
    <LeaveGuard itemKey="apply">
      <ApplyLeavePanel />
    </LeaveGuard>
  );
}
