'use client';

import { use } from 'react';
import OpeningsGuard from '@/components/openings/OpeningsGuard';
import OpeningDetailPanel from '@/components/openings/OpeningDetailPanel';

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <OpeningsGuard itemKey="list">
      <OpeningDetailPanel openingId={id} />
    </OpeningsGuard>
  );
}
