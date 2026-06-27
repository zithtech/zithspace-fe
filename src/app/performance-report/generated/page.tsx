'use client';

import PerfReportGuard from '@/components/performance-report/PerfReportGuard';
import GeneratedReportsPanel from '@/components/performance-report/GeneratedReportsPanel';

export default function PerformanceReportGeneratedPage() {
  return (
    <PerfReportGuard itemKey="generated">
      <GeneratedReportsPanel />
    </PerfReportGuard>
  );
}
