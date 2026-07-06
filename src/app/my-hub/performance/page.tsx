'use client';

import MainLayout from '@/components/layout/MainLayout';
import MyHubContent from '@/components/my-hub/MyHubContent';
import PerfReportGuard from '@/components/performance-report/PerfReportGuard';
import MyReportsPanel from '@/components/performance-report/MyReportsPanel';

// My Hub self-service Performance Report — the employee's own reports, without
// the performance-report module's admin left rail.
export default function MyHubPerformancePage() {
  return (
    <MainLayout>
      <MyHubContent>
        <PerfReportGuard itemKey="my-reports">
          <MyReportsPanel />
        </PerfReportGuard>
      </MyHubContent>
    </MainLayout>
  );
}
