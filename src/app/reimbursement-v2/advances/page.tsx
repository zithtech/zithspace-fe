'use client';
import ReimbursementGuard from '@/components/reimbursement-v2/ReimbursementGuard';
import AdvancesPanel from '@/components/reimbursement-v2/AdvancesPanel';

export default function Page() {
  return (
    <ReimbursementGuard itemKey="advances">
      <AdvancesPanel />
    </ReimbursementGuard>
  );
}
