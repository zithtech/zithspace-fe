'use client';

import PerfReportGuard from '@/components/performance-report/PerfReportGuard';
import MyReportsPanel from '@/components/performance-report/MyReportsPanel';

export default function PerformanceReportMyReportsPage() {
  return (
    <PerfReportGuard itemKey="my-reports">
      <MyReportsPanel />
    </PerfReportGuard>
  );
}
