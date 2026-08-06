'use client';

import OpeningsGuard from '@/components/openings/OpeningsGuard';
import SettingsPanel from '@/components/openings/SettingsPanel';

export default function Page() {
  return (
    <OpeningsGuard itemKey="settings">
      <SettingsPanel />
    </OpeningsGuard>
  );
}
