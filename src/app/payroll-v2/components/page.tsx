'use client';

import PayrollGuard from '@/components/payroll-v2/PayrollGuard';
import SalaryComponentPanel from '@/components/payroll-v2/SalaryComponentPanel';

export default function PayrollComponentsPage() {
  return (
    <PayrollGuard itemKey="components">
      <SalaryComponentPanel />
    </PayrollGuard>
  );
}
