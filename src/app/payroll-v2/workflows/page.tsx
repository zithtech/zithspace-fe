'use client';

import PayrollGuard from '@/components/payroll-v2/PayrollGuard';
import ApprovalWorkflowPanel from '@/components/payroll-v2/ApprovalWorkflowPanel';

export default function PayrollWorkflowsPage() {
  return (
    <PayrollGuard itemKey="workflows">
      <ApprovalWorkflowPanel />
    </PayrollGuard>
  );
}
