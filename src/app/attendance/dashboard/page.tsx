'use client';

import AttendanceGuard from '@/components/attendance/AttendanceGuard';
import AttendanceDashboardPanel from '@/components/attendance/AttendanceDashboardPanel';

export default function AttendanceDashboardPage() {
  return (
    <AttendanceGuard itemKey="dashboard">
      <AttendanceDashboardPanel />
    </AttendanceGuard>
  );
}
