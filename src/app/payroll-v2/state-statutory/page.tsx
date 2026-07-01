'use client';

import PayrollGuard from '@/components/payroll-v2/PayrollGuard';
import StateStatutoryPanel from '@/components/payroll-v2/StateStatutoryPanel';

export default function StateStatutoryPage() {
  return (
    <PayrollGuard itemKey="state-statutory">
      <StateStatutoryPanel />
    </PayrollGuard>
  );
}
