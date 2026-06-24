'use client';

import LeaveGuard from '@/components/leaves-v2/LeaveGuard';
import ConfigurationPanel from '@/components/leaves-v2/ConfigurationPanel';

export default function LeaveConfigurationPage() {
  return (
    <LeaveGuard itemKey="configuration">
      <ConfigurationPanel />
    </LeaveGuard>
  );
}
