'use client';

import LeaveGuard from '@/components/leaves-v2/LeaveGuard';
import LeaveAdjustmentPanel from '@/components/leaves-v2/LeaveAdjustmentPanel';

export default function LeaveAdjustmentPage() {
  return (
    <LeaveGuard itemKey="adjustment">
      <LeaveAdjustmentPanel />
    </LeaveGuard>
  );
}
