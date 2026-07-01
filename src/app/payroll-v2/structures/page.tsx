'use client';

import PayrollGuard from '@/components/payroll-v2/PayrollGuard';
import SalaryStructurePanel from '@/components/payroll-v2/SalaryStructurePanel';

export default function PayrollStructuresPage() {
  return (
    <PayrollGuard itemKey="structures">
      <SalaryStructurePanel />
    </PayrollGuard>
  );
}
