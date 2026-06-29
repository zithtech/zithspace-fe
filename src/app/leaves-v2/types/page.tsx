'use client';

import LeaveGuard from '@/components/leaves-v2/LeaveGuard';
import LeaveTypePanel from '@/components/leaves-v2/LeaveTypePanel';

export default function LeaveTypesPage() {
  return (
    <LeaveGuard itemKey="types">
      <LeaveTypePanel />
    </LeaveGuard>
  );
}
