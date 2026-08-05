'use client';

import OpeningsGuard from '@/components/openings/OpeningsGuard';
import OpeningsListPanel from '@/components/openings/OpeningsListPanel';

export default function Page() {
  return (
    <OpeningsGuard itemKey="list">
      <OpeningsListPanel />
    </OpeningsGuard>
  );
}
