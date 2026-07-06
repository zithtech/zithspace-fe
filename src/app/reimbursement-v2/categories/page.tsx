'use client';
import ReimbursementGuard from '@/components/reimbursement-v2/ReimbursementGuard';
import CategoriesPanel from '@/components/reimbursement-v2/CategoriesPanel';

export default function Page() {
  return (
    <ReimbursementGuard itemKey="categories">
      <CategoriesPanel />
    </ReimbursementGuard>
  );
}
