'use client';

import OpeningsGuard from '@/components/openings/OpeningsGuard';
import ClosingQueuePanel from '@/components/openings/ClosingQueuePanel';

export default function Page() {
  return (
    <OpeningsGuard itemKey="closing">
      <ClosingQueuePanel />
    </OpeningsGuard>
  );
}
