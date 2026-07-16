'use client';

import MainLayout from '@/components/layout/MainLayout';
import MyHubContent from '@/components/my-hub/MyHubContent';
import ReimbursementGuard from '@/components/reimbursement-v2/ReimbursementGuard';
import ClaimsPanel from '@/components/reimbursement-v2/ClaimsPanel';

// My Hub self-service Claims — reuses the Reimbursements 2.0 panel, but without the
// reimbursement layout's admin left rail. My Hub's own rail (from MainLayout) stays.
export default function MyHubClaimsPage() {
  return (
    <MainLayout>
      <MyHubContent>
        <ReimbursementGuard itemKey="claims">
          <ClaimsPanel hideSidebarToggle={true} />
        </ReimbursementGuard>
      </MyHubContent>
    </MainLayout>
  );
}
