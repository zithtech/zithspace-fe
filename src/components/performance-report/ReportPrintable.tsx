import React, { forwardRef } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { TimelineTree } from '@/components/projects/overview/TimelineTree';
import { ReportMember } from '@/services/performanceReportService';
import { StatusMarks } from './ticketPoints';
import { ReportModel, ticketRowPoints, performanceBand } from './reportPdfData';
import { AppstoreOutlined, TagsOutlined, ClockCircleOutlined, TableOutlined, MessageOutlined, UserOutlined, CoffeeOutlined } from '@ant-design/icons';

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
  p === null ? '#64748b' : p >= 90 ? '#059669' : p >= 75 ? '#b45309' : '#dc2626';

function delayOf(estHours: number, trackedSecs: number) {
  const diffSecs = trackedSecs - estHours * 3600;
  if (!estHours || !trackedSecs) return { text: '—', color: '#94a3b8' };
  if (diffSecs <= 60) return { text: 'On time', color: '#16a34a' };
  return { text: `+${hmFromSec(diffSecs)}`, color: '#dc2626' };
}

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

        <div className="html2pdf__page-break" />

        <div className="px-8 py-4 space-y-6">
          {/* ── Overview ───────────────────────────────────────────────────────── */}
          <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 break-inside-avoid">
            <SectionTitle icon={<AppstoreOutlined />}>Overview</SectionTitle>
            <div className="flex gap-4 mb-4">
              <div className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 p-6 flex items-center gap-6">
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
          <hr className="border-t-2 border-dashed border-zinc-200 dark:border-zinc-800 my-8" />

          {/* ── Tickets ────────────────────────────────────────────────────────── */}
          <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 break-inside-avoid">
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
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-1">
                <TimelineTree tickets={model.tickets.rows as any} hideToolbar hideAvatar flatView pointsOf={(t: any) => ticketRowPoints(t, statusMarks)} />
              </div>
            )}
          </section>
          <hr className="border-t-2 border-dashed border-zinc-200 dark:border-zinc-800 my-8" />

          {/* ── Time Tracking ──────────────────────────────────────────────────── */}
          <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 break-inside-avoid">
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
          <hr className="border-t-2 border-dashed border-zinc-200 dark:border-zinc-800 my-8" />

          <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 break-inside-avoid">
            <SectionTitle icon={<TableOutlined />}>Time Tracking · Detailed</SectionTitle>
            {model.timeTracking.detailed.length === 0 ? (
              empty('No tracking records.')
            ) : (
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
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
          <hr className="border-t-2 border-dashed border-zinc-200 dark:border-zinc-800 my-8" />

          {/* ── Daily Updates ──────────────────────────────────────────────────── */}
          <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 break-inside-avoid">
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
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden mt-4">
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
          <hr className="border-t-2 border-dashed border-zinc-200 dark:border-zinc-800 my-8" />

          {/* ── Attendance ───────────────────────────────────────────────────── */}
          <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 break-inside-avoid">
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
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden mt-4">
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
          <hr className="border-t-2 border-dashed border-zinc-200 dark:border-zinc-800 my-8" />

          {/* ── Leaves ───────────────────────────────────────────────────────── */}
          <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 break-inside-avoid">
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
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden mt-4">
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
          <hr className="border-t-2 border-dashed border-zinc-200 dark:border-zinc-800 my-8" />

          <div className="pt-8 pb-4 text-center text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Generated from <span className="text-[#3b82f6]">Zukvo</span>
          </div>
        </div>

        <style dangerouslySetInnerHTML={{
          __html: `
          /* Scoped to .rpt-printable to avoid leaking into the live app */
          .rpt-printable img { max-width: 100%; height: auto; }
          .rpt-printable .ant-avatar img { width: 100%; height: 100%; object-fit: cover; }
          .rpt-printable .ant-avatar { display: inline-flex; align-items: center; justify-content: center; overflow: hidden; }

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

          .rpt-printable .tl-card {
            background: var(--bg-pure-white);
            border: 1px solid var(--border-color);
            border-radius: 10px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            flex: 1;
            min-height: 0;
          }
          .rpt-printable .tl-colhead {
            display: flex;
            align-items: stretch;
            padding: 0 16px 0 0;
            background: var(--bg-slate-50);
            border-bottom: 1px solid var(--border-color);
            flex-shrink: 0;
          }
          .rpt-printable .tl-h-main {
            flex: 1;
            min-width: 0;
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 9px 12px 9px 16px;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            color: var(--text-slate-400);
          }
          .rpt-printable .tl-col {
            width: 70px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 6px;
            font-size: 12px;
            color: var(--text-slate-600);
            font-variant-numeric: tabular-nums;
            white-space: nowrap;
            border-left: 1px solid var(--border-slate-100);
          }
          .rpt-printable .tl-colhead .tl-col,
          .rpt-printable .tl-colhead .tl-status-col {
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            color: var(--text-slate-400);
          }
          .rpt-printable .tl-status-col {
            width: 132px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            padding: 0 6px 0 12px;
            border-left: 1px solid var(--border-slate-100);
          }
          .rpt-printable .tl-body {
            display: flex;
            flex-direction: column;
            flex: 1;
            min-height: 0;
            overflow-y: auto;
          }
          .rpt-printable .tl-month {
            border-bottom: 1px solid var(--border-slate-100);
          }
          .rpt-printable .tl-month:last-child {
            border-bottom: none;
          }
          .rpt-printable .tl-month-head {
            display: flex;
            align-items: center;
            gap: 10px;
            width: 100%;
            padding: 11px 16px;
            border: none;
            background: transparent;
            text-align: left;
          }
          .rpt-printable .tl-month-title {
            font-size: 13.5px;
            font-weight: 800;
            color: var(--text-slate-900);
            letter-spacing: -0.01em;
          }
          .rpt-printable .tl-badge {
            font-size: 10.5px;
            font-weight: 700;
            color: #3b82f6;
            background: var(--bg-blue-50);
            border-radius: 999px;
            padding: 1px 9px;
          }
          .rpt-printable .tl-badge--soft {
            color: var(--text-slate-500);
            background: var(--bg-slate-100);
          }
          .rpt-printable .tl-month-body {
            padding: 0 0 6px 0;
          }
          .rpt-printable .tl-member {
            margin: 0 12px 2px 30px;
            border-left: 1.5px solid var(--border-slate-200);
            padding-left: 4px;
          }
          .rpt-printable .tl-member-head {
            display: flex;
            align-items: center;
            gap: 9px;
            width: 100%;
            padding: 7px 10px;
            border: none;
            background: transparent;
            text-align: left;
            border-radius: 7px;
          }
          .rpt-printable .tl-member-name {
            font-size: 12.5px;
            font-weight: 700;
            color: var(--text-slate-800);
          }
          .rpt-printable .tl-mini {
            font-size: 10px;
            font-weight: 700;
            color: var(--text-slate-500);
            background: var(--bg-slate-100);
            border-radius: 999px;
            padding: 0 7px;
            min-width: 18px;
            text-align: center;
          }
          .rpt-printable .tl-progress-mini {
            width: 60px;
            height: 4px;
            border-radius: 999px;
            background: var(--border-slate-200);
            overflow: hidden;
            margin-left: auto;
          }
          .rpt-printable .tl-progress-mini > span {
            display: block;
            height: 100%;
            background: #10b981;
            border-radius: 999px;
          }
          .rpt-printable .tl-done-txt {
            font-size: 10.5px;
            font-weight: 600;
            color: var(--text-slate-400);
            min-width: 64px;
            text-align: right;
          }
          .rpt-printable .tl-tickets {
            display: flex;
            flex-direction: column;
          }
          .rpt-printable .tl-ticket {
            position: relative;
            display: flex;
            align-items: stretch;
            padding: 0 16px 0 0;
            border-top: 1px solid var(--border-slate-100);
          }
          .rpt-printable .tl-tickets > .tl-ticket:first-child {
            border-top: none;
          }
          .rpt-printable .tl-guide {
            position: absolute;
            left: 4px;
            top: 50%;
            width: 12px;
            height: 1.5px;
            background: var(--border-slate-200);
          }
          .rpt-printable .tl-ticket-main {
            flex: 1;
            min-width: 0;
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px 8px 22px;
          }
          .rpt-printable .tl-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            flex-shrink: 0;
          }
          .rpt-printable .tl-num {
            font-size: 11px;
            font-weight: 700;
            color: #3b82f6;
            flex-shrink: 0;
            border: none;
            background: transparent;
            padding: 0;
          }
          .rpt-printable .tl-title {
            font-size: 12.5px;
            color: var(--text-slate-700);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            border: none;
            background: transparent;
            padding: 0;
            text-align: left;
            min-width: 0;
          }
          .rpt-printable .tl-sprint {
            font-size: 10px;
            font-weight: 600;
            color: var(--text-slate-400);
            background: var(--bg-slate-100);
            border-radius: 5px;
            padding: 1px 7px;
            flex-shrink: 0;
          }
          .rpt-printable .tl-status {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            font-size: 10.5px;
            font-weight: 700;
            padding: 2px 9px;
            border-radius: 999px;
            white-space: nowrap;
          }
          .rpt-printable .tl-status .anticon {
            font-size: 9px;
          }
          .rpt-printable .tl-chev {
            font-size: 11px;
            color: var(--text-slate-400);
            flex-shrink: 0;
          }
          .rpt-printable .tl-chev.sm {
            font-size: 10px;
          }
          .rpt-printable .tl-chev.open {
            transform: rotate(90deg);
          }
        ` }} />
      </div>
    );
  }
);

ReportPrintable.displayName = 'ReportPrintable';
export default ReportPrintable;
