'use client';

import PayrollGuard from '@/components/payroll-v2/PayrollGuard';
import EmployeePaySetupPanel from '@/components/payroll-v2/EmployeePaySetupPanel';

export default function EmployeePaySetupPage() {
  return (
    <PayrollGuard itemKey="employees">
      <EmployeePaySetupPanel />
    </PayrollGuard>
  );
}
