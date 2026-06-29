'use client';

import LeaveGuard from '@/components/leaves-v2/LeaveGuard';
import LeavePolicyPanel from '@/components/leaves-v2/LeavePolicyPanel';

export default function LeavePolicyPage() {
  return (
    <LeaveGuard itemKey="policy">
      <LeavePolicyPanel />
    </LeaveGuard>
  );
}
