import React, { useEffect, useRef } from 'react';
import { message } from 'antd';
import { Dayjs } from 'dayjs';
import { ReportModel } from './reportPdfData';
import { ReportMember } from '@/services/performanceReportService';
import { StatusMarks } from './ticketPoints';
import ReportPrintable from './ReportPrintable';
import PerformanceReportService from '@/services/performanceReportService';
import {
  downloadReportPdf,
  downloadReportDocx,
  reportToPdfBlob,
} from '@/app/tickets/reports/[sprintId]/reportExport';

/**
 * Resolves once the offscreen export layout has loaded its sections (skeletons
 * gone) and charts have had time to finish their entry animation.
 */
function waitForExportReady(el: HTMLElement, timeoutMs = 9000): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now();
    const check = () => {
      const stillLoading = el.querySelector('.animate-pulse') != null;
      if (!stillLoading || performance.now() - start > timeoutMs) {
        // Settle delay so Recharts SVGs are fully painted before capture.
        setTimeout(resolve, 1300);
      } else {
        setTimeout(check, 150);
      }
    };
    check();
  });
}

interface PerformanceReportExportRunnerProps {
  format: 'pdf' | 'word' | 'save';
  model: ReportModel;
  member: ReportMember;
  range: [Dayjs, Dayjs];
  statusMarks: StatusMarks;
  avatarDataUrl: string | null;
  onDone: (ok: boolean) => void;
}

export function PerformanceReportExportRunner({
  format,
  model,
  member,
  range,
  statusMarks,
  avatarDataUrl,
  onDone,
}: PerformanceReportExportRunnerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const ranRef = useRef(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    (async () => {
      const el = ref.current;
      if (!el) {
        doneRef.current(false);
        return;
      }
      try {
        await waitForExportReady(el);
        const base = `${member.name || 'report'}-${range[0].format('YYYY-MM')}`
          .replace(/\s+/g, '_')
          .toLowerCase();

        if (format === 'pdf') {
          await downloadReportPdf('performance', el, `${base}.pdf`);
        } else if (format === 'word') {
          await downloadReportDocx(el, `${base}.docx`);
        } else if (format === 'save') {
          const blob = await reportToPdfBlob(el, `${base}.pdf`);
          const pdfBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          await PerformanceReportService.saveGeneratedReport({
            userId: member.id,
            periodKey: range[0].format('YYYY-MM'),
            periodStart: range[0].format('YYYY-MM-DD'),
            periodEnd: range[1].format('YYYY-MM-DD'),
            scores: {
              overall: model.overall,
              tickets: model.tickets.score,
              timeTracking: model.timeTracking.score,
              dailyUpdates: model.dailyUpdates.score,
              attendance: model.attendance.score,
              leaves: model.leaves.score,
            },
            summary: { stages: model.stages },
            pdfBase64,
          });
          message.success('Saved to Generated Reports');
        }
        doneRef.current(true);
      } catch (err: any) {
        console.error('Performance report export failed:', err);
        message.error(err?.response?.data?.error || err?.message || 'Export failed');
        doneRef.current(false);
      }
    })();
  }, [format, model, member, range]);

  return (
    <div style={{ display: 'none' }} aria-hidden>
      <ReportPrintable
        ref={ref}
        member={member}
        range={range}
        model={model}
        statusMarks={statusMarks}
        avatarDataUrl={avatarDataUrl}
      />
    </div>
  );
}
