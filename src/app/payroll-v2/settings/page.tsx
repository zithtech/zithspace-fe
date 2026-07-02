'use client';

import PayrollGuard from '@/components/payroll-v2/PayrollGuard';
import GeneralSettingsPanel from '@/components/payroll-v2/GeneralSettingsPanel';

export default function PayrollSettingsPage() {
  return (
    <PayrollGuard itemKey="settings">
      <GeneralSettingsPanel />
    </PayrollGuard>
  );
}
