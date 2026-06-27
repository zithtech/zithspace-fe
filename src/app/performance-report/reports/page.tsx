'use client';

import PerfReportGuard from '@/components/performance-report/PerfReportGuard';
import ReportsPanel from '@/components/performance-report/ReportsPanel';

export default function PerformanceReportReportsPage() {
  return (
    <PerfReportGuard itemKey="reports">
      <ReportsPanel />
    </PerfReportGuard>
  );
}
