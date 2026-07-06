'use client';
import ReimbursementGuard from '@/components/reimbursement-v2/ReimbursementGuard';
import BudgetsPanel from '@/components/reimbursement-v2/BudgetsPanel';

export default function Page() {
  return (
    <ReimbursementGuard itemKey="budgets">
      <BudgetsPanel />
    </ReimbursementGuard>
  );
}
