'use client';
import ReimbursementGuard from '@/components/reimbursement-v2/ReimbursementGuard';
import ClaimsPanel from '@/components/reimbursement-v2/ClaimsPanel';

export default function Page() {
  return (
    <ReimbursementGuard itemKey="claims">
      <ClaimsPanel />
    </ReimbursementGuard>
  );
}
