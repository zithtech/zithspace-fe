'use client';

import LeaveGuard from '@/components/leaves-v2/LeaveGuard';
import AddHolidaysPanel from '@/components/leaves-v2/AddHolidaysPanel';

export default function AddGovernmentHolidaysPage() {
  return (
    <LeaveGuard itemKey="add-holidays">
      <AddHolidaysPanel />
    </LeaveGuard>
  );
}
