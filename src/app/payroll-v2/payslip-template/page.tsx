'use client';

import PayrollGuard from '@/components/payroll-v2/PayrollGuard';
import PayslipBankPanel from '@/components/payroll-v2/PayslipBankPanel';

export default function PayslipBankPage() {
  return (
    <PayrollGuard itemKey="payslip-template">
      <PayslipBankPanel />
    </PayrollGuard>
  );
}
