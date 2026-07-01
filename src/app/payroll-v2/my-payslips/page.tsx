'use client';

import PayrollGuard from '@/components/payroll-v2/PayrollGuard';
import MyPayslipsPanel from '@/components/payroll-v2/MyPayslipsPanel';

export default function MyPayslipsPage() {
  return (
    <PayrollGuard itemKey="my-payslips">
      <MyPayslipsPanel />
    </PayrollGuard>
  );
}
