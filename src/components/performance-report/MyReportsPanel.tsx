'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button, message } from 'antd';
import { FilePdfOutlined, DownloadOutlined } from '@ant-design/icons';
import { FileSearch, TrendingUp, TrendingDown, Minus, CalendarDays, FileText } from 'lucide-react';
import dayjs from 'dayjs';
import PerformanceReportService, { GeneratedReport } from '@/services/performanceReportService';
import { performanceBand, pointsColor } from './moduleScores';

/** Force-download a file — routes through the server-side proxy so the cross-origin PDF actually saves. */
function forceDownload(url: string, filename: string) {
  const proxyUrl = `/api/download-proxy?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
  const a = document.createElement('a');
  a.href = proxyUrl;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

const fileNameOf = (url: string) => url.split('/').pop()?.split('?')[0] || 'report.pdf';

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

  // Newest first, so the most recent month leads the grid.
  const sorted = useMemo(
    () => [...reports].sort((a, b) => (a.periodKey < b.periodKey ? 1 : a.periodKey > b.periodKey ? -1 : 0)),
    [reports]
  );
  const latest = sorted[0] ?? null;

  // Month-over-month movement on the overall score.
  const trend = useMemo(() => {
    const cur = sorted[0]?.overallScore;
    const prev = sorted[1]?.overallScore;
    if (typeof cur !== 'number' || typeof prev !== 'number') return null;
    return cur - prev;
  }, [sorted]);

  return (
    <div className="mr-wrap">
      {/* ── Hero band ───────────────────────────────────────────────────────── */}
      <div className="mr-header">
        <div className="mr-hero-glow" />
        <div className="mr-hero-inner">
          <div className="mr-hero-text">
            <h2 className="mr-title">My Reports</h2>
            <p className="mr-sub">Your monthly performance reports — open or download any month’s PDF.</p>
          </div>

          {!loading && sorted.length > 0 && (
            <div className="mr-kpis">
              <div className="mr-kpi">
                <span className="mr-kpi-ic mr-kpi-ic--blue">
                  <FileText size={14} />
                </span>
                <span className="mr-kpi-body">
                  <span className="mr-kpi-num">{sorted.length}</span>
                  <span className="mr-kpi-label">Reports</span>
                </span>
              </div>
              <div className="mr-kpi">
                <span className="mr-kpi-ic mr-kpi-ic--slate">
                  <CalendarDays size={14} />
                </span>
                <span className="mr-kpi-body">
                  <span className="mr-kpi-num mr-kpi-num--sm">
                    {dayjs(`${sorted[0].periodKey}-01`).format('MMM YYYY')}
                  </span>
                  <span className="mr-kpi-label">Latest</span>
                </span>
              </div>
              {trend !== null && (
                <div className="mr-kpi">
                  <span
                    className={`mr-kpi-ic ${trend > 0 ? 'mr-kpi-ic--green' : trend < 0 ? 'mr-kpi-ic--amber' : 'mr-kpi-ic--slate'}`}
                  >
                    {trend > 0 ? <TrendingUp size={14} /> : trend < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
                  </span>
                  <span className="mr-kpi-body">
                    <span
                      className="mr-kpi-num"
                      style={{ color: trend > 0 ? '#059669' : trend < 0 ? '#b45309' : undefined }}
                    >
                      {trend > 0 ? `+${trend}` : trend}
                    </span>
                    <span className="mr-kpi-label">vs last month</span>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="mr-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="mr-skel">
              <div className="mr-skel-line" style={{ width: '52%' }} />
              <div className="mr-skel-line" style={{ width: '32%' }} />
              <div className="mr-skel-block" />
              <div className="mr-skel-row">
                {Array.from({ length: 5 }).map((__, j) => (
                  <div key={j} className="mr-skel-cell" />
                ))}
              </div>
              <div className="mr-skel-line" style={{ width: '100%', height: 34 }} />
            </div>
          ))}
        </div>
      ) : !latest ? (
        <div className="mr-empty">
          <span className="mr-empty-ic">
            <FileSearch size={26} />
          </span>
          <div className="mr-empty-title">No reports yet</div>
          <p className="mr-empty-sub">
            Your monthly performance report appears here once it’s generated for you. Nothing to do
            in the meantime.
          </p>
        </div>
      ) : (
        <div className="mr-grid">
          {sorted.map((r, i) => {
            const band = performanceBand(r.overallScore);
            const pct = Math.max(0, Math.min(100, r.overallScore ?? 0));
            return (
              <div key={r.id} className="mr-card">
                <span className="mr-card-rail" />

                <div className="mr-card-top">
                  <div style={{ minWidth: 0 }}>
                    <div className="mr-month">
                      {periodLabel(r.periodKey)}
                      {i === 0 && <span className="mr-latest">Latest</span>}
                    </div>
                    <div className="mr-gen">Generated {dayjs(r.generatedAt).format('MMM D, YYYY')}</div>
                  </div>
                  <span className="mr-band" style={{ color: band.color, background: `${band.color}14` }}>
                    {band.label}
                  </span>
                </div>

                <div className="mr-score-block">
                  <div className="mr-score-row">
                    <span className="mr-score" style={{ color: pointsColor(r.overallScore) }}>
                      {r.overallScore ?? '—'}
                    </span>
                    <span className="mr-score-max">/ 100</span>
                    <span className="mr-score-label">Overall performance</span>
                  </div>
                  <div className="mr-score-bar">
                    <span style={{ width: `${pct}%`, background: pointsColor(r.overallScore) }} />
                  </div>
                </div>

                <div className="mr-modules">
                  {MODULES.map((m) => {
                    const v = r[m.key] as number | null;
                    return (
                      <div key={m.label} className="mr-mod">
                        <div className="mr-mod-val" style={{ color: pointsColor(v) }}>{v ?? '—'}</div>
                        <div className="mr-mod-label">{m.label}</div>
                        <div className="mr-mod-bar">
                          <span style={{ width: `${Math.max(0, Math.min(100, v ?? 0))}%`, background: pointsColor(v) }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mr-foot">
                  <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1 }}>
                    <Button block icon={<FilePdfOutlined />}>Open PDF</Button>
                  </a>
                  <Button
                    icon={<DownloadOutlined />}
                    title="Download PDF"
                    onClick={() => forceDownload(r.fileUrl, fileNameOf(r.fileUrl))}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style jsx global>{`
        .mr-wrap { display: flex; flex-direction: column; flex: 1; min-height: 0; }

        /* ── Hero band (full-bleed via the layout's -header rule) ───────────── */
        .mr-header {
          position: relative; overflow: hidden;
          margin-top: -12px; padding: 14px 0 13px; margin-bottom: 16px;
          border-bottom: 1px solid var(--border-slate-100);
          background:
            linear-gradient(180deg, rgba(59, 130, 246, 0.055), rgba(59, 130, 246, 0) 82%),
            var(--bg-pure-white);
        }
        .mr-hero-glow {
          position: absolute; top: -130px; right: -60px; width: 380px; height: 240px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.15), transparent 68%);
          pointer-events: none;
        }
        .mr-hero-inner {
          position: relative; z-index: 1;
          display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap;
        }
        .mr-hero-text { min-width: 0; }
        .mr-title {
          margin: 0; font-size: 20px; font-weight: 800; color: var(--text-slate-900);
          letter-spacing: -0.03em; line-height: 1.15;
        }
        .mr-sub {
          margin: 3px 0 0; font-size: 12.5px; color: var(--text-slate-500);
          line-height: 1.45; max-width: 560px;
        }
        .mr-kpis { display: flex; align-items: stretch; gap: 8px; flex-wrap: wrap; }
        .mr-kpi {
          display: flex; align-items: center; gap: 9px;
          padding: 7px 14px 7px 9px; border-radius: 12px;
          border: 1px solid var(--border-slate-200); background: var(--bg-pure-white);
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
          min-width: 106px;
        }
        .mr-kpi-ic {
          width: 28px; height: 28px; flex-shrink: 0; border-radius: 9px;
          display: inline-flex; align-items: center; justify-content: center;
        }
        .mr-kpi-ic--blue  { color: #2563eb; background: rgba(59, 130, 246, 0.11); }
        .mr-kpi-ic--green { color: #059669; background: rgba(16, 185, 129, 0.12); }
        .mr-kpi-ic--amber { color: #b45309; background: rgba(245, 158, 11, 0.14); }
        .mr-kpi-ic--slate { color: var(--text-slate-500); background: var(--bg-slate-100); }
        .mr-kpi-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .mr-kpi-num {
          font-size: 16px; font-weight: 800; color: var(--text-slate-900);
          line-height: 1; letter-spacing: -0.02em; font-variant-numeric: tabular-nums;
        }
        .mr-kpi-num--sm { font-size: 13.5px; }
        .mr-kpi-label {
          font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.07em; color: var(--text-slate-400);
        }

        /* ── Report cards ───────────────────────────────────────────────────── */
        .mr-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; }
        .mr-card {
          position: relative; overflow: hidden;
          border: 1px solid var(--border-slate-200); border-radius: 16px;
          background: var(--bg-pure-white); padding: 16px 18px 15px;
          display: flex; flex-direction: column; gap: 13px;
          transition: border-color .16s ease, box-shadow .16s ease, transform .16s ease;
        }
        .mr-card:hover {
          border-color: #bfdbfe;
          box-shadow: 0 12px 30px rgba(30, 64, 175, 0.11);
          transform: translateY(-3px);
        }
        .mr-card-rail {
          position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
          background: linear-gradient(180deg, #60a5fa, #2563eb);
          transform: scaleY(0); transform-origin: top; transition: transform .2s ease;
        }
        .mr-card:hover .mr-card-rail { transform: scaleY(1); }

        .mr-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
        .mr-band {
          border-radius: 999px; font-size: 10.5px; font-weight: 800;
          padding: 3px 9px; white-space: nowrap; flex-shrink: 0;
        }
        .mr-month {
          display: flex; align-items: center; gap: 8px; min-width: 0;
          font-size: 16px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.025em;
        }
        .mr-latest {
          font-size: 9.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.07em;
          color: var(--text-blue-700); background: var(--bg-blue-50);
          border-radius: 999px; padding: 2px 8px; flex-shrink: 0;
        }
        .mr-gen { font-size: 11px; color: var(--text-slate-400); font-weight: 600; margin-top: 3px; }

        .mr-score-block { display: flex; flex-direction: column; gap: 7px; }
        .mr-score-row { display: flex; align-items: baseline; gap: 7px; }
        .mr-score {
          font-size: 32px; font-weight: 800; letter-spacing: -0.03em; line-height: 1;
          font-variant-numeric: tabular-nums;
        }
        .mr-score-max { font-size: 12.5px; font-weight: 700; color: var(--text-slate-400); }
        .mr-score-label {
          font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
          color: var(--text-slate-400); margin-left: auto; align-self: center; white-space: nowrap;
        }
        .mr-score-bar { height: 6px; border-radius: 999px; background: var(--bg-slate-100); overflow: hidden; }
        .mr-score-bar span { display: block; height: 100%; border-radius: 999px; transition: width .45s cubic-bezier(.4, 0, .2, 1); }

        .mr-modules { display: flex; gap: 6px; }
        .mr-mod {
          flex: 1; min-width: 0; text-align: center; border-radius: 10px;
          background: var(--bg-slate-50); border: 1px solid var(--border-slate-100); padding: 7px 4px 6px;
        }
        .mr-mod-val { font-size: 15px; font-weight: 800; font-variant-numeric: tabular-nums; }
        .mr-mod-label {
          font-size: 8.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em;
          color: var(--text-slate-400); margin-top: 1px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .mr-mod-bar {
          height: 3px; border-radius: 999px; background: var(--border-slate-200);
          margin-top: 6px; overflow: hidden;
        }
        .mr-mod-bar span { display: block; height: 100%; border-radius: 999px; }

        .mr-foot { display: flex; align-items: center; gap: 8px; }
        .mr-foot .ant-btn { height: 36px; border-radius: 10px; font-weight: 600; }

        /* ── Skeletons + empty ──────────────────────────────────────────────── */
        .mr-skel {
          border: 1px solid var(--border-slate-200); border-radius: 16px;
          background: var(--bg-pure-white); padding: 16px 18px; pointer-events: none;
          display: flex; flex-direction: column; gap: 13px;
        }
        .mr-skel-line { height: 11px; border-radius: 6px; background: var(--bg-slate-100); }
        .mr-skel-block { height: 36px; border-radius: 10px; background: var(--bg-slate-100); }
        .mr-skel-row { display: flex; gap: 6px; }
        .mr-skel-cell { flex: 1; height: 44px; border-radius: 10px; background: var(--bg-slate-100); }
        .mr-skel-line, .mr-skel-block, .mr-skel-cell {
          animation: mr-pulse 1.4s ease-in-out infinite;
        }
        @keyframes mr-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }

        .mr-empty {
          flex: 1;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 8px; padding: 64px 24px; text-align: center;
          border: 1px dashed var(--border-slate-200); border-radius: 16px; background: var(--bg-slate-50);
        }
        .mr-empty-ic {
          width: 54px; height: 54px; border-radius: 16px; margin-bottom: 4px;
          display: inline-flex; align-items: center; justify-content: center;
          color: #2563eb; background: var(--bg-blue-50);
        }
        .mr-empty-title { font-size: 15px; font-weight: 800; color: var(--text-slate-900); }
        .mr-empty-sub {
          margin: 0; font-size: 13px; color: var(--text-slate-500); max-width: 400px; line-height: 1.55;
        }

        /* ── Responsive ─────────────────────────────────────────────────────── */
        @media (max-width: 860px) {
          .mr-hero-inner { align-items: flex-start; gap: 12px; }
          .mr-title { font-size: 18px; }
          .mr-kpi { min-width: 96px; padding: 7px 11px; }
        }
        @media (max-width: 560px) {
          .mr-grid { grid-template-columns: 1fr; }
          .mr-score-label { display: none; }
        }
      `}</style>
    </div>
  );
}
