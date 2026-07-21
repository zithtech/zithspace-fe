'use client';

import MainLayout from '@/components/layout/MainLayout';
import MyHubContent from '@/components/my-hub/MyHubContent';
import AttendanceGuard from '@/components/attendance/AttendanceGuard';
import ClockInOutPanel from '@/components/attendance/ClockInOutPanel';

// My Hub self-service Attendance — the personal clock-in/out view, without the
// attendance module's admin left rail.
export default function MyHubAttendancePage() {
  return (
    <MainLayout>
      <MyHubContent>
        <AttendanceGuard itemKey="clock-in-out">
          <ClockInOutPanel />
        </AttendanceGuard>
      </MyHubContent>
    </MainLayout>
  );
}
