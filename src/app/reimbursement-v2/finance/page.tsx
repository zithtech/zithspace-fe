'use client';
import ReimbursementGuard from '@/components/reimbursement-v2/ReimbursementGuard';
import FinancePanel from '@/components/reimbursement-v2/FinancePanel';

export default function Page() {
  return (
    <ReimbursementGuard itemKey="finance">
      <FinancePanel />
    </ReimbursementGuard>
  );
}
