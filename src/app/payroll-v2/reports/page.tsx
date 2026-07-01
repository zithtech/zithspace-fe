'use client';

import PayrollGuard from '@/components/payroll-v2/PayrollGuard';
import ReportsPanel from '@/components/payroll-v2/ReportsPanel';

export default function PayrollReportsPage() {
  return (
    <PayrollGuard itemKey="reports">
      <ReportsPanel />
    </PayrollGuard>
  );
}
