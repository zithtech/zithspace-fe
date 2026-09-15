import React, { forwardRef } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { ReportMember } from '@/services/performanceReportService';
import { StatusMarks } from './ticketPoints';
import { ReportModel, ticketRowPoints, performanceBand } from './reportPdfData';
import {
  AppstoreOutlined,
  TagsOutlined,
  ClockCircleOutlined,
  TableOutlined,
  MessageOutlined,
  UserOutlined,
  CoffeeOutlined,
  CheckCircleFilled,
  SyncOutlined,
  StopOutlined,
} from '@ant-design/icons';

// ── formatters ───────────────────────────────────────────────────────────────
const hmFromSec = (sec: number) => {
  if (!sec) return '0h';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 && m > 0 ? `${h}h ${m}m` : h > 0 ? `${h}h` : `${m}m`;
};

const hmFromMin = (min: number) => {
  if (!min) return '0h';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 && m > 0 ? `${h}h ${m}m` : h > 0 ? `${h}h` : `${m}m`;
};

const fmtDate = (d: any) => (d ? dayjs(d).format('MMM D, YYYY') : '—');
const fmtTime = (d: any) => (d ? dayjs(d).format('h:mm A') : '—');

const scoreColor = (p: number | null) =>
  p === null ? '#64748b' : p >= 90 ? '#10b981' : p >= 75 ? '#f59e0b' : '#dc2626';

function delayOf(estHours: number, trackedSecs: number) {
  if (!estHours || !trackedSecs) return { text: '—', color: '#94a3b8' };
  const diffSecs = trackedSecs - estHours * 3600;
  if (diffSecs > 60) return { text: `+${hmFromSec(diffSecs)}`, color: '#dc2626' };
  if (diffSecs < -60) return { text: `−${hmFromSec(-diffSecs)}`, color: '#10b981' };
  return { text: 'On time', color: '#10b981' };
}

const ticketStatusMeta = (status: string) => {
  const s = (status || '').toLowerCase().trim();
  if (['completed', 'done', 'live', 'live (deployed)'].includes(s))
    return { label: 'Done', color: '#10b981', bg: '#ecfdf5', icon: <CheckCircleFilled /> };
  if (['in_progress', 'in_testing', 'started', 'active'].includes(s))
    return { label: 'In progress', color: '#3b82f6', bg: '#eff6ff', icon: <SyncOutlined /> };
  if (['blocked', 'on_hold', 'on-hold'].includes(s))
    return { label: 'Blocked', color: '#dc2626', bg: '#fef2f2', icon: <StopOutlined /> };
  return { label: (status || 'not started').replace(/_/g, ' '), color: '#64748b', bg: '#f1f5f9', icon: <ClockCircleOutlined /> };
};

const C = { border: '#e2e8f0', headBg: '#f8fafc', ink: '#0f172a', muted: '#64748b', faint: '#94a3b8' };

// Section title
function SectionTitle({ children, icon }: { children: React.ReactNode, icon?: React.ReactNode }) {
  return (
    <div className="text-[14px] uppercase tracking-[0.15em] font-bold text-blue-800 dark:text-blue-300 mb-5 inline-flex items-center gap-2">
      {icon}
      {children}
    </div>
  );
}

type Stat = { label: string; value: React.ReactNode; color?: string; sub?: React.ReactNode };
function StatCards({ items, points }: { items: Stat[], points?: { value: string | number | null, color: string } }) {
  const total = (points ? 1 : 0) + items.length;
  let colsClass = 'sm:grid-cols-4';
  if (total === 2) colsClass = 'sm:grid-cols-2';
  else if (total === 3) colsClass = 'sm:grid-cols-3';
  else if (total === 5) colsClass = 'sm:grid-cols-5';
  else if (total >= 6) colsClass = 'sm:grid-cols-6';

  return (
    <div className={`grid grid-cols-2 ${colsClass} gap-4 mb-4`}>
      {points && (
        <div className="flex flex-col justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold leading-none" style={{ color: points.color }}>{points.value ?? '—'}</span>
            <span className="text-xs font-semibold text-zinc-400">/ 100</span>
          </div>
          <div className="mt-1 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Avg points</div>
        </div>
      )}
      {items.map((it, i) => (
        <div key={i} className="flex flex-col justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 p-4">
          <div className="text-xl font-bold leading-none" style={{ color: it.color || 'inherit' }}>{it.value}</div>
          <div className="mt-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">{it.label}</div>
          {it.sub && <div className="mt-1 text-xs text-zinc-400">{it.sub}</div>}
        </div>
      ))}
    </div>
  );
}

const empty = (text: string) => (
  <div className="text-sm text-zinc-400 p-6 italic text-center rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30">{text}</div>
);

interface Props {
  member: ReportMember;
  range: [Dayjs, Dayjs];
  model: ReportModel;
  statusMarks: StatusMarks;
  /** Pre-resolved avatar as a data URL (html2canvas can't use CORS-blocked imgs). */
  avatarDataUrl?: string | null;
}

const ReportPrintable = forwardRef<HTMLDivElement, Props>(
  ({ member, range, model, statusMarks, avatarDataUrl }, ref) => {
    const monthLabel = range[0].format('MMMM YYYY');
    const rangeLabel = `${range[0].format('MMM D')} – ${range[1].format('MMM D, YYYY')}`;
    const overallBand = performanceBand(model.overall);

    // ── derived stats for the section stat-cards ───────────────────────────────
    let tkOnTime = 0;
    let tkDelayed = 0;
    for (const t of model.tickets.rows) {
      if (t.estimateHours > 0 && t.trackedSeconds > 0) {
        if (t.trackedSeconds - t.estimateHours * 3600 > 60) tkDelayed++;
        else tkOnTime++;
      }
    }
    const tkTotal = model.tickets.rows.length;

    return (
      <div
        ref={ref}
        className="rpt-printable bg-zinc-50 dark:bg-[#0B0F1A]"
      >
        <div className="px-8 pt-8 pb-4">
          {/* ── Header ─────────────────────────────────────────────────────────── */}
          <div style={{ borderBottom: `2px solid ${C.ink}`, paddingBottom: 14 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ width: 72, verticalAlign: 'middle' }}>
                    {avatarDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarDataUrl}
                        alt=""
                        width={58}
                        height={58}
                        style={{ borderRadius: '50%', objectFit: 'cover', display: 'block' }}
                      />
                    ) : (
                      <svg width="58" height="58" viewBox="0 0 58 58" style={{ display: 'block' }}>
                        <circle cx="29" cy="29" r="29" fill="#3b82f6" />
                        <text x="50%" y="50%" textAnchor="middle" fill="#fff" fontSize="24px" fontWeight="800" dy=".35em" fontFamily="Arial, Helvetica, sans-serif">
                          {member.name?.charAt(0)?.toUpperCase()}
                        </text>
                      </svg>
                    )}
                  </td>
                  <td style={{ verticalAlign: 'middle' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, lineHeight: '24px', color: C.ink }}>{member.name}</div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>
                      {[member.position, member.department].filter(Boolean).join('  ·  ') || '—'}
                    </div>
                    {member.workEmail && <div style={{ fontSize: 11, color: C.faint, marginTop: 2 }}>{member.workEmail}</div>}
                  </td>
                  <td style={{ verticalAlign: 'middle', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: C.ink, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Performance Report
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, marginTop: 4 }}>{monthLabel}</div>
                    <div style={{ fontSize: 11, color: C.faint, marginTop: 2 }}>{rangeLabel}</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="px-8 py-2 space-y-4">
          {/* ── Overview ───────────────────────────────────────────────────────── */}
          <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5">
            <SectionTitle icon={<AppstoreOutlined />}>Overview</SectionTitle>
            <div className="flex gap-4 mb-4">
              <div className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 p-5 flex items-center gap-6">
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-5xl font-bold leading-none tracking-tight" style={{ color: scoreColor(model.overall) }}>{model.overall ?? '—'}</span>
                    <span className="text-lg font-semibold text-zinc-400">/ 100</span>
                  </div>
                </div>
                <div className="w-px h-12 bg-zinc-200 dark:bg-zinc-800" />
                <div>
                  <div className="text-lg font-bold" style={{ color: overallBand.color }}>{overallBand.label}</div>
                  <div className="text-xs text-zinc-500 mt-1">Overall performance · weighted across stages</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {model.stages.map((s) => {
                const band = performanceBand(s.score);
                return (
                  <div key={s.key} className={`rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 ${s.enabled ? 'opacity-100' : 'opacity-50'}`}>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{s.label}</span>
                      <span className="text-[10px] font-bold text-zinc-400">{Number(s.weight)}%</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold leading-none tracking-tight" style={{ color: scoreColor(s.score) }}>{s.score ?? '—'}</span>
                        <span className="text-[10px] font-bold text-zinc-400">/ 100</span>
                      </div>
                      <span className="text-[10px] font-bold" style={{ color: band.color }}>{s.enabled ? band.label : 'Excluded'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Tickets ────────────────────────────────────────────────────────── */}
          <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5">
            <SectionTitle icon={<TagsOutlined />}>Tickets</SectionTitle>
            <StatCards
              points={{ value: model.tickets.score, color: scoreColor(model.tickets.score) }}
              items={[
                { label: 'Total', value: tkTotal },
                { label: 'On-time', value: tkOnTime, color: '#16a34a' },
                { label: 'Delayed', value: tkDelayed, color: '#dc2626' },
              ]}
            />
            {model.tickets.rows.length === 0 ? (
              empty('No tickets worked in this window.')
            ) : (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 mt-4 bg-white dark:bg-zinc-900 shadow-sm">
                <table className="w-full text-left border-collapse table-fixed">
                  <thead>
                    <tr className="bg-zinc-50/70 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
                      <th className="w-[27%] px-3 py-2.5 text-[10px] uppercase font-bold text-zinc-400 tracking-wider text-left">Ticket</th>
                      <th className="w-[12%] px-1 py-2.5 text-[10px] uppercase font-bold text-zinc-400 tracking-wider text-center border-l border-zinc-100 dark:border-zinc-800">Type</th>
                      <th className="w-[8%] px-1 py-2.5 text-[10px] uppercase font-bold text-zinc-400 tracking-wider text-center border-l border-zinc-100 dark:border-zinc-800">Start</th>
                      <th className="w-[8%] px-1 py-2.5 text-[10px] uppercase font-bold text-zinc-400 tracking-wider text-center border-l border-zinc-100 dark:border-zinc-800">End</th>
                      <th className="w-[6%] px-1 py-2.5 text-[10px] uppercase font-bold text-zinc-400 tracking-wider text-center border-l border-zinc-100 dark:border-zinc-800">Est</th>
                      <th className="w-[9.5%] px-1 py-2.5 text-[10px] uppercase font-bold text-zinc-400 tracking-wider text-center border-l border-zinc-100 dark:border-zinc-800">Tracked</th>
                      <th className="w-[11%] px-1 py-2.5 text-[10px] uppercase font-bold text-zinc-400 tracking-wider text-center border-l border-zinc-100 dark:border-zinc-800">Delay</th>
                      <th className="w-[7.5%] px-1 py-2.5 text-[10px] uppercase font-bold text-zinc-400 tracking-wider text-center border-l border-zinc-100 dark:border-zinc-800">Points</th>
                      <th className="w-[11%] px-1 py-2.5 text-[10px] uppercase font-bold text-zinc-400 tracking-wider text-center border-l border-zinc-100 dark:border-zinc-800" style={{ textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {model.tickets.rows.map((t: any) => {
                      const st = ticketStatusMeta(t.status);
                      const del = delayOf(t.estimateHours || 0, t.trackedSeconds || 0);
                      const pts = ticketRowPoints(t, statusMarks);
                      const ptsColor = scoreColor(pts);
                      return (
                        <tr key={t.id} className="border-b last:border-0 border-zinc-100 dark:border-zinc-800/60 hover:bg-zinc-50/50">
                          <td className="px-3 py-3 align-middle">
                            <div className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: st.color }} />
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-[#2563eb] text-[11.5px] leading-tight">
                                  {t.ticketNumber}
                                  {t.sprintName && (
                                    <span className="ml-1.5 font-normal text-[9px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">
                                      {t.sprintName}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-zinc-700 dark:text-zinc-300 leading-snug mt-0.5 break-words">
                                  {t.title}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-1 py-3 text-[10.5px] text-center text-zinc-600 dark:text-zinc-400 capitalize border-l border-zinc-100 dark:border-zinc-800 align-middle" style={{ textAlign: 'center' }}>
                            {t.type || '—'}
                          </td>
                          <td className="px-1 py-3 text-[10.5px] text-center text-zinc-600 dark:text-zinc-400 border-l border-zinc-100 dark:border-zinc-800 align-middle whitespace-nowrap" style={{ textAlign: 'center' }}>
                            {t.startDate ? dayjs(t.startDate).format('MMM D') : '—'}
                          </td>
                          <td className="px-1 py-3 text-[10.5px] text-center text-zinc-600 dark:text-zinc-400 border-l border-zinc-100 dark:border-zinc-800 align-middle whitespace-nowrap" style={{ textAlign: 'center' }}>
                            {t.endDate || t.dueDate ? dayjs(t.endDate || t.dueDate).format('MMM D') : '—'}
                          </td>
                          <td className="px-1 py-3 text-[10.5px] text-center text-zinc-600 dark:text-zinc-400 border-l border-zinc-100 dark:border-zinc-800 align-middle whitespace-nowrap" style={{ textAlign: 'center' }}>
                            {t.estimateHours > 0 ? `${t.estimateHours}h` : '—'}
                          </td>
                          <td className="px-1 py-3 text-[11px] text-center font-bold text-zinc-900 dark:text-zinc-100 border-l border-zinc-100 dark:border-zinc-800 align-middle whitespace-nowrap" style={{ textAlign: 'center' }}>
                            {t.trackedSeconds > 0 ? hmFromSec(t.trackedSeconds) : '—'}
                          </td>
                          <td className="px-1 py-3 text-[11px] text-center font-bold border-l border-zinc-100 dark:border-zinc-800 align-middle whitespace-nowrap" style={{ color: del.color, textAlign: 'center' }}>
                            {del.text}
                          </td>
                          <td className="px-1 py-3 text-[11px] text-center font-bold border-l border-zinc-100 dark:border-zinc-800 align-middle whitespace-nowrap" style={{ color: ptsColor, textAlign: 'center' }}>
                            {pts !== null ? `${pts}%` : '—'}
                          </td>
                          <td className="px-1 py-3 text-center border-l border-zinc-100 dark:border-zinc-800 align-middle" style={{ textAlign: 'center' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                fontSize: '11px',
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                color: st.color,
                                textAlign: 'center',
                              }}
                            >
                              {st.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ── Time Tracking ──────────────────────────────────────────────────── */}
          <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5">
            <SectionTitle icon={<ClockCircleOutlined />}>Time Tracking</SectionTitle>
            <StatCards
              points={{ value: model.timeTracking.score, color: scoreColor(model.timeTracking.score) }}
              items={[
                { label: 'Avg hours / day', value: hmFromSec(model.timeTracking.avgSeconds) },
                { label: 'Tracked days', value: model.timeTracking.trackedDays },
              ]}
            />

            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mt-4 mb-2">Performance Summary</div>
            {model.timeTracking.summaryTiers.length === 0 ? (
              empty('No performance tiers.')
            ) : (
              <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                {model.timeTracking.summaryTiers.map((tr) => (
                  <div key={tr.label} className="flex justify-between items-center rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 bg-zinc-50 dark:bg-zinc-900/30">
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{tr.label}</span>
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{tr.days} days</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5">
            <SectionTitle icon={<TableOutlined />}>Time Tracking · Detailed</SectionTitle>
            {model.timeTracking.detailed.length === 0 ? (
              empty('No tracking records.')
            ) : (
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-900/30 border-b border-zinc-200 dark:border-zinc-800">
                      <th className="px-3 py-2 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Member</th>
                      <th className="px-3 py-2 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Date</th>
                      <th className="px-3 py-2 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Weekday</th>
                      <th className="px-3 py-2 text-[10px] uppercase font-bold text-zinc-400 tracking-wider text-right">Hours</th>
                      <th className="px-3 py-2 text-[10px] uppercase font-bold text-zinc-400 tracking-wider text-right">Tickets</th>
                      <th className="px-3 py-2 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {model.timeTracking.detailed.map((r: any, i: number) => (
                      <tr key={i} className="border-b last:border-0 border-zinc-100 dark:border-zinc-800/60">
                        <td className="px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">{r.user?.name || '—'}</td>
                        <td className="px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400">{dayjs(r.date).format('MMM D')}</td>
                        <td className="px-3 py-2 text-xs text-zinc-500">{r.weekday}</td>
                        <td className="px-3 py-2 text-xs font-bold text-right text-zinc-700 dark:text-zinc-300">{r.formattedDuration || hmFromSec(r.totalSeconds)}</td>
                        <td className="px-3 py-2 text-xs text-right text-zinc-600 dark:text-zinc-400">{r.ticketCount ?? '—'}</td>
                        <td className="px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400">{r.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ── Daily Updates ──────────────────────────────────────────────────── */}
          <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5">
            <SectionTitle icon={<MessageOutlined />}>Daily Updates</SectionTitle>
            <StatCards
              points={{ value: model.dailyUpdates.score, color: scoreColor(model.dailyUpdates.score) }}
              items={[
                { label: 'Expected days', value: model.dailyUpdates.expected },
                { label: 'Posted', value: model.dailyUpdates.posted, color: '#16a34a' },
                { label: 'Missed', value: model.dailyUpdates.missed, color: '#dc2626' },
              ]}
            />
            {model.dailyUpdates.rows.length === 0 ? (
              empty('No daily updates posted in this window.')
            ) : (
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 mt-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-900/30 border-b border-zinc-200 dark:border-zinc-800">
                      <th className="px-3 py-2 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Member</th>
                      <th className="px-3 py-2 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Type</th>
                      <th className="px-3 py-2 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Posted On</th>
                      <th className="px-3 py-2 text-[10px] uppercase font-bold text-zinc-400 tracking-wider text-right">Tasks</th>
                      <th className="px-3 py-2 text-[10px] uppercase font-bold text-zinc-400 tracking-wider text-right">Hours</th>
                      <th className="px-3 py-2 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Mood</th>
                    </tr>
                  </thead>
                  <tbody>
                    {model.dailyUpdates.rows.map((u: any) => (
                      <tr key={u.id} className="border-b last:border-0 border-zinc-100 dark:border-zinc-800/60">
                        <td className="px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">{u.user?.name || '—'}</td>
                        <td className="px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400">{u.updateType || 'EOD'}</td>
                        <td className="px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400">{fmtDate(u.createdAt)}</td>
                        <td className="px-3 py-2 text-xs text-right text-zinc-600 dark:text-zinc-400">
                          {(u.projectUpdates || []).reduce((n: number, p: any) => n + (p.tasks?.length || 0), 0) || '—'}
                        </td>
                        <td className="px-3 py-2 text-xs text-right text-zinc-600 dark:text-zinc-400">{u.totalHoursWorked ? `${u.totalHoursWorked}h` : '—'}</td>
                        <td className="px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400 capitalize">{u.mood || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ── Attendance ───────────────────────────────────────────────────── */}
          <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5">
            <SectionTitle icon={<UserOutlined />}>Attendance</SectionTitle>
            <StatCards
              points={{ value: model.attendance.score, color: scoreColor(model.attendance.score) }}
              items={[
                { label: 'Present', value: model.attendance.present, color: '#16a34a' },
                { label: 'Absent', value: model.attendance.absent, color: '#dc2626' },
                { label: 'Avg hours / day', value: hmFromMin(model.attendance.avgMins) },
              ]}
            />
            {model.attendance.rows.length === 0 ? (
              empty('No attendance records in this window.')
            ) : (
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 mt-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-900/30 border-b border-zinc-200 dark:border-zinc-800">
                      <th className="px-3 py-2 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Member</th>
                      <th className="px-3 py-2 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Date</th>
                      <th className="px-3 py-2 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Clock In</th>
                      <th className="px-3 py-2 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Clock Out</th>
                      <th className="px-3 py-2 text-[10px] uppercase font-bold text-zinc-400 tracking-wider text-right">Hours</th>
                      <th className="px-3 py-2 text-[10px] uppercase font-bold text-zinc-400 tracking-wider text-right">Late</th>
                      <th className="px-3 py-2 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {model.attendance.rows.map((r: any) => (
                      <tr key={r.id} className="border-b last:border-0 border-zinc-100 dark:border-zinc-800/60">
                        <td className="px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">{r.member?.name || '—'}</td>
                        <td className="px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400">{dayjs(r.date).format('MMM D')}</td>
                        <td className="px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400">{fmtTime(r.clockIn)}</td>
                        <td className="px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400">{fmtTime(r.clockOut)}</td>
                        <td className="px-3 py-2 text-xs font-bold text-right text-zinc-700 dark:text-zinc-300">{hmFromMin(r.effectiveWorkMinutes ?? r.workingMinutes ?? r.totalWorkMinutes ?? 0)}</td>
                        <td className="px-3 py-2 text-xs text-right" style={{ color: (r.lateMinutes ?? 0) > 0 ? '#dc2626' : C.faint }}>{(r.lateMinutes ?? 0) > 0 ? hmFromMin(r.lateMinutes) : '—'}</td>
                        <td className="px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400 capitalize">{(r.status || '').replace('-', ' ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ── Leaves ───────────────────────────────────────────────────────── */}
          <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5">
            <SectionTitle icon={<CoffeeOutlined />}>Leaves</SectionTitle>
            <StatCards
              points={{ value: model.leaves.score, color: scoreColor(model.leaves.score) }}
              items={[
                { label: 'Leave days', value: Number(model.leaves.leaveDays.toFixed(2)) },
                { label: 'Paid', value: Number(model.leaves.paidDays.toFixed(2)), color: '#16a34a' },
                { label: 'LOP', value: Number(model.leaves.lopDays.toFixed(2)), color: '#dc2626' },
                { label: 'Requests', value: model.leaves.rows.length },
                { label: 'Pending', value: model.leaves.rows.filter((l) => l.status === 'pending').length, color: '#b45309' },
              ]}
            />
            {model.leaves.rows.length === 0 ? (
              empty('No leaves in this window.')
            ) : (
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 mt-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-900/30 border-b border-zinc-200 dark:border-zinc-800">
                      <th className="px-3 py-2 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Member</th>
                      <th className="px-3 py-2 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Leave Type</th>
                      <th className="px-3 py-2 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">From</th>
                      <th className="px-3 py-2 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">To</th>
                      <th className="px-3 py-2 text-[10px] uppercase font-bold text-zinc-400 tracking-wider text-right">Days</th>
                      <th className="px-3 py-2 text-[10px] uppercase font-bold text-zinc-400 tracking-wider text-right">LOP</th>
                      <th className="px-3 py-2 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {model.leaves.rows.map((l) => (
                      <tr key={l.id} className="border-b last:border-0 border-zinc-100 dark:border-zinc-800/60">
                        <td className="px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">{l.userName || '—'}</td>
                        <td className="px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400">{l.leaveTypeName || '—'}</td>
                        <td className="px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400">{dayjs(l.fromDate).format('MMM D')}</td>
                        <td className="px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400">{dayjs(l.toDate).format('MMM D')}</td>
                        <td className="px-3 py-2 text-xs font-bold text-right text-zinc-700 dark:text-zinc-300">{Number((l.totalUnits || 0).toFixed(2))}</td>
                        <td className="px-3 py-2 text-xs text-right" style={{ color: l.lopUnits > 0 ? '#dc2626' : C.faint }}>{l.lopUnits > 0 ? Number(l.lopUnits.toFixed(2)) : '—'}</td>
                        <td className="px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400 capitalize">{l.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="pt-4 pb-4 text-center text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Generated from <span className="text-[#3b82f6]">Zukvo</span>
          </div>
        </div>

        <style dangerouslySetInnerHTML={{
          __html: `
          /* Scoped to .rpt-printable to avoid leaking into the live app */
          .rpt-printable img { max-width: 100%; height: auto; }
          .rpt-printable .ant-avatar img { width: 100%; height: 100%; object-fit: cover; }
          .rpt-printable .ant-avatar { display: inline-flex; align-items: center; justify-content: center; overflow: hidden; }

          /* Allow clean page-break flow without huge gaps before sections */
          .rpt-printable section {
            break-inside: auto !important;
            page-break-inside: auto !important;
          }
          .rpt-printable table {
            break-inside: auto !important;
            page-break-inside: auto !important;
          }
          .rpt-printable tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          .rpt-printable thead {
            display: table-header-group;
          }

          @media print {
            .rpt-printable section {
              break-inside: auto !important;
              page-break-inside: auto !important;
            }
            .rpt-printable tr {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }
          }

          /* CSS custom properties scoped under the printable root */
          .rpt-printable {
            --bg-pure-white: #ffffff;
            --text-slate-900: #0f172a;
            --text-slate-800: #1e293b;
            --text-slate-700: #334155;
            --text-slate-600: #475569;
            --text-slate-500: #64748b;
            --text-slate-400: #94a3b8;
            --border-color: #e2e8f0;
            --border-slate-200: #e2e8f0;
            --border-slate-100: #f1f5f9;
            --bg-slate-50: #f8fafc;
            --bg-slate-100: #f1f5f9;
            --bg-blue-50: #eff6ff;
          }
        ` }} />
      </div>
    );
  }
);

ReportPrintable.displayName = 'ReportPrintable';
export default ReportPrintable;
