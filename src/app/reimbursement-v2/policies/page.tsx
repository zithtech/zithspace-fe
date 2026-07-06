'use client';
import ReimbursementGuard from '@/components/reimbursement-v2/ReimbursementGuard';
import PoliciesPanel from '@/components/reimbursement-v2/PoliciesPanel';

export default function Page() {
  return (
    <ReimbursementGuard itemKey="policies">
      <PoliciesPanel />
    </ReimbursementGuard>
  );
}
