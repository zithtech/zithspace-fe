'use client';

import PerfReportGuard from '@/components/performance-report/PerfReportGuard';
import SettingsPanel from '@/components/performance-report/SettingsPanel';

export default function PerformanceReportSettingsPage() {
  return (
    <PerfReportGuard itemKey="settings">
      <SettingsPanel />
    </PerfReportGuard>
  );
}
