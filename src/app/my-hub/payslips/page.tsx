'use client';

import MainLayout from '@/components/layout/MainLayout';
import MyHubContent from '@/components/my-hub/MyHubContent';
import PayrollGuard from '@/components/payroll-v2/PayrollGuard';
import MyPayslipsPanel from '@/components/payroll-v2/MyPayslipsPanel';

// My Hub self-service Payslips — the employee's own payslips, without the
// payroll-v2 module's admin left rail.
export default function MyHubPayslipsPage() {
  return (
    <MainLayout>
      <MyHubContent>
        <PayrollGuard itemKey="my-payslips">
          <MyPayslipsPanel />
        </PayrollGuard>
      </MyHubContent>
    </MainLayout>
  );
}
