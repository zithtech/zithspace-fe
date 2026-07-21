'use client';

import PayrollGuard from '@/components/payroll-v2/PayrollGuard';
import PayRunPanel from '@/components/payroll-v2/PayRunPanel';

export default function RunPayrollPage() {
  return (
    <PayrollGuard itemKey="run-payroll">
      <PayRunPanel />
    </PayrollGuard>
  );
}
