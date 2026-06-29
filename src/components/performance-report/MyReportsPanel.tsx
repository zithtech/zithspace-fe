'use client';

import React, { useEffect, useState } from 'react';
import { Button, Empty, Spin, Typography, message } from 'antd';
import { FilePdfOutlined, DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import PerformanceReportService, { GeneratedReport } from '@/services/performanceReportService';
import { performanceBand, pointsColor } from './moduleScores';

const { Text } = Typography;

const MODULES: { key: keyof GeneratedReport; label: string }[] = [
  { key: 'ticketsScore', label: 'Tickets' },
  { key: 'timeTrackingScore', label: 'Time' },
  { key: 'dailyUpdatesScore', label: 'Updates' },
  { key: 'attendanceScore', label: 'Attend.' },
  { key: 'leavesScore', label: 'Leaves' },
];

const periodLabel = (p: string) => dayjs(`${p}-01`).format('MMMM YYYY');

export default function MyReportsPanel() {
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setReports(await PerformanceReportService.getMyGeneratedReports());
      } catch (err: any) {
        message.error(err?.response?.data?.error || err?.message || 'Failed to load your reports');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="mr-wrap">
      <div className="mr-head">
        <h2 className="mr-title">My Reports</h2>
        <p className="mr-sub">Your monthly performance reports. Open or download the PDF for any month.</p>
      </div>

      {loading ? (
        <div className="mr-center"><Spin /></div>
      ) : reports.length === 0 ? (
        <div className="mr-center">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<Text style={{ fontSize: 12.5, color: 'var(--text-slate-500)' }}>You don’t have any reports yet.</Text>}
          />
        </div>
      ) : (
        <div className="mr-grid">
          {reports.map((r) => {
            const band = performanceBand(r.overallScore);
            return (
              <div key={r.id} className="mr-card">
                <div className="mr-card-top">
                  <div>
                    <div className="mr-month">{periodLabel(r.periodKey)}</div>
                    <div className="mr-gen">Generated {dayjs(r.generatedAt).format('MMM D, YYYY')}</div>
                  </div>
                  <span className="mr-band" style={{ color: band.color, background: `${band.color}14` }}>{band.label}</span>
                </div>

                <div className="mr-score-row">
                  <span className="mr-score" style={{ color: pointsColor(r.overallScore) }}>{r.overallScore ?? '—'}</span>
                  <span className="mr-score-max">/ 100</span>
                  <span className="mr-score-label">Overall performance</span>
                </div>

                <div className="mr-modules">
                  {MODULES.map((m) => {
                    const v = r[m.key] as number | null;
                    return (
                      <div key={m.label} className="mr-mod">
                        <div className="mr-mod-val" style={{ color: pointsColor(v) }}>{v ?? '—'}</div>
                        <div className="mr-mod-label">{m.label}</div>
                      </div>
                    );
                  })}
                </div>

                <div className="mr-foot">
                  <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1 }}>
                    <Button block icon={<FilePdfOutlined />}>Open PDF</Button>
                  </a>
                  <a href={r.fileUrl} download>
                    <Button icon={<DownloadOutlined />} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style jsx global>{`
        .mr-wrap { display: flex; flex-direction: column; flex: 1; min-height: 0; }
        /* Box-shaped: square every corner on the page (avatars stay round). */
        .mr-wrap *, .mr-wrap *::before, .mr-wrap *::after { border-radius: 0 !important; }
        .mr-wrap .ant-avatar { border-radius: 50% !important; }
        .mr-head { margin-bottom: 16px; }
        .mr-title { margin: 0; font-size: 19px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; }
        .mr-sub { margin: 4px 0 0; font-size: 13px; color: var(--text-slate-500); max-width: 560px; line-height: 1.5; }
        .mr-center { display: flex; align-items: center; justify-content: center; padding: 64px 0; flex: 1; }
        .mr-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; }
        .mr-card { border: 1px solid var(--border-slate-200); border-radius: 16px; background: var(--bg-secondary); padding: 18px; display: flex; flex-direction: column; gap: 14px; transition: box-shadow .15s ease, border-color .15s ease; }
        .mr-card:hover { box-shadow: 0 8px 24px rgba(15,23,42,0.07); border-color: var(--border-slate-200); }
        .mr-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
        .mr-month { font-size: 16px; font-weight: 800; color: var(--text-slate-900); }
        .mr-gen { font-size: 11px; color: var(--text-slate-400); margin-top: 2px; }
        .mr-band { font-size: 11px; font-weight: 800; padding: 3px 9px; border-radius: 999px; white-space: nowrap; }
        .mr-score-row { display: flex; align-items: baseline; gap: 7px; }
        .mr-score { font-size: 34px; font-weight: 800; letter-spacing: -0.02em; line-height: 1; }
        .mr-score-max { font-size: 13px; font-weight: 700; color: var(--text-slate-400); }
        .mr-score-label { font-size: 11.5px; color: var(--text-slate-500); margin-left: auto; align-self: center; }
        .mr-modules { display: flex; gap: 6px; }
        .mr-mod { flex: 1; text-align: center; background: var(--bg-slate-50); border: 1px solid var(--border-slate-100); border-radius: 8px; padding: 7px 2px; }
        .mr-mod-val { font-size: 15px; font-weight: 800; }
        .mr-mod-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; color: var(--text-slate-400); margin-top: 1px; }
        .mr-foot { display: flex; align-items: center; gap: 8px; }
      `}</style>
    </div>
  );
}
