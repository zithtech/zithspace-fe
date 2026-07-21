'use client';

import PayrollGuard from '@/components/payroll-v2/PayrollGuard';
import StatutoryPanel from '@/components/payroll-v2/StatutoryPanel';

export default function PayrollStatutoryPage() {
  return (
    <PayrollGuard itemKey="statutory">
      <StatutoryPanel />
    </PayrollGuard>
  );
}
