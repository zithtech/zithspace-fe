'use client';

import AttendanceGuard from '@/components/attendance/AttendanceGuard';
import ManageAttendancePanel from '@/components/attendance/ManageAttendancePanel';

export default function ManageAttendancePage() {
  return (
    <AttendanceGuard itemKey="manage">
      <ManageAttendancePanel />
    </AttendanceGuard>
  );
}
