'use client';

import PayrollGuard from '@/components/payroll-v2/PayrollGuard';
import PaySchedulePanel from '@/components/payroll-v2/PaySchedulePanel';

export default function PaySchedulesPage() {
  return (
    <PayrollGuard itemKey="schedules">
      <PaySchedulePanel />
    </PayrollGuard>
  );
}
