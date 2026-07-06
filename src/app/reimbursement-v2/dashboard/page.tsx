'use client';
import ReimbursementGuard from '@/components/reimbursement-v2/ReimbursementGuard';
import DashboardPanel from '@/components/reimbursement-v2/DashboardPanel';

export default function Page() {
  return (
    <ReimbursementGuard itemKey="dashboard">
      <DashboardPanel />
    </ReimbursementGuard>
  );
}
