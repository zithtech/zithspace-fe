'use client';
import ReimbursementGuard from '@/components/reimbursement-v2/ReimbursementGuard';
import ApprovalsPanel from '@/components/reimbursement-v2/ApprovalsPanel';

export default function Page() {
  return (
    <ReimbursementGuard itemKey="approvals">
      <ApprovalsPanel />
    </ReimbursementGuard>
  );
}
