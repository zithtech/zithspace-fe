'use client';

import AttendanceGuard from '@/components/attendance/AttendanceGuard';
import ClockInOutPanel from '@/components/attendance/ClockInOutPanel';

export default function ClockInOutPage() {
  return (
    <AttendanceGuard itemKey="clock-in-out">
      <ClockInOutPanel />
    </AttendanceGuard>
  );
}
