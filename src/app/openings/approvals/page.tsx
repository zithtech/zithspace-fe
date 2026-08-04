'use client';

import OpeningsGuard from '@/components/openings/OpeningsGuard';
import ApprovalsQueuePanel from '@/components/openings/ApprovalsQueuePanel';

export default function Page() {
  return (
    <OpeningsGuard itemKey="approvals">
      <ApprovalsQueuePanel />
    </OpeningsGuard>
  );
}
