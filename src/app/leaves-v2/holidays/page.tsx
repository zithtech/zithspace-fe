'use client';

import LeaveGuard from '@/components/leaves-v2/LeaveGuard';
import GovernmentHolidaysPanel from '@/components/leaves-v2/GovernmentHolidaysPanel';

export default function GovernmentHolidaysPage() {
  return (
    <LeaveGuard itemKey="holidays">
      <GovernmentHolidaysPanel />
    </LeaveGuard>
  );
}
