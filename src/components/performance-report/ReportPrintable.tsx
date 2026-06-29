'use client';

import React from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { ReportMember } from '@/services/performanceReportService';
import { StatusMarks } from './ticketPoints';
import { ReportModel, ticketRowPoints, performanceBand } from './reportPdfData';

// NOTE: this layout is captured by html2canvas (PDF/Word). html2canvas renders
// FLEXBOX poorly, so everything here uses TABLES / inline elements for reliable
// alignment. Colors are plain hex (no color-mix / CSS vars).

// ── formatters ───────────────────────────────────────────────────────────────
const hmFromSec = (sec: number) => {
  const total = Math.max(0, Math.round(sec / 60));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
};
const hmFromMin = (min: number) => hmFromSec((min || 0) * 60);
const fmtDate = (d: any) => (d ? dayjs(d).format('MMM D, YYYY') : '—');
const fmtTime = (d: any) => (d ? dayjs(d).format('h:mm A') : '—');
const scoreColor = (p: number | null) =>
  p === null ? '#64748b' : p >= 90 ? '#059669' : p >= 75 ? '#b45309' : '#dc2626';
const delayOf = (estHours: number, trackedSec: number) => {
  if (!(estHours > 0) || !(trackedSec > 0)) return { text: '—', color: '#94a3b8' };
  const delta = trackedSec - estHours * 3600;
  if (delta > 60) return { text: `+${hmFromSec(delta)}`, color: '#dc2626' };
  if (delta < -60) return { text: `−${hmFromSec(-delta)}`, color: '#16a34a' };
  return { text: 'On time', color: '#16a34a' };
};

const C = { border: '#e2e8f0', headBg: '#f8fafc', ink: '#0f172a', muted: '#64748b', faint: '#94a3b8' };

// ── reusable bits ────────────────────────────────────────────────────────────
// Each section/block is ATOMIC (never split across a page) so html2canvas's
// fixed-height page slicing can't cut a table mid-rows or orphan its header.
// Tall sections (Time Tracking) are split into two atomic blocks so they still
// pack tightly without leaving big gaps. For single-member monthly data every
// block fits within a page.
const avoidSplit: React.CSSProperties = { pageBreakInside: 'avoid' };
const sectionStyle: React.CSSProperties = { marginTop: 20 };

// Section title
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 18,
        fontWeight: 800,
        color: '#3b82f6',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        marginBottom: 14,
      }}
    >
      {children}
    </div>
  );
}

type Stat = { label: string; value: React.ReactNode; color?: string };
function StatCards({ items }: { items: Stat[] }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '6px 0', marginBottom: 12, tableLayout: 'fixed', ...avoidSplit }}>
      <tbody>
        <tr>
          {items.map((it, i) => (
            <td
              key={i}
              style={{ border: `1px solid ${C.border}`, padding: '9px 11px', verticalAlign: 'top', background: '#fff' }}
            >
              <div style={{ fontSize: 19, fontWeight: 800, color: it.color || C.ink, lineHeight: '22px' }}>
                {it.value}
              </div>
              <div style={{ fontSize: 9, fontWeight: 700, color: C.faint, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 3 }}>
                {it.label}
              </div>
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}

const th: React.CSSProperties = {
  textAlign: 'left',
  fontSize: 9.5,
  fontWeight: 700,
  color: C.muted,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  padding: '7px 8px',
  borderBottom: `1px solid ${C.border}`,
  background: C.headBg,
};
const td: React.CSSProperties = { fontSize: 11, color: '#334155', padding: '6px 8px', borderBottom: '1px solid #f1f5f9' };
const tdNowrap: React.CSSProperties = { ...td, whiteSpace: 'nowrap' };

function Table({ cols, children }: { cols: { label: string; right?: boolean; width?: string | number }[]; children: React.ReactNode }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${C.border}` }}>
      <thead>
        <tr>
          {cols.map((c, i) => (
            <th key={i} style={{ ...th, textAlign: c.right ? 'right' : 'left', width: c.width }}>
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}
const empty = (text: string) => (
  <div style={{ fontSize: 11, color: C.faint, padding: '10px 2px', fontStyle: 'italic' }}>{text}</div>
);

interface Props {
  member: ReportMember;
  range: [Dayjs, Dayjs];
  model: ReportModel;
  statusMarks: StatusMarks;
  /** Pre-resolved avatar as a data URL (html2canvas can't use CORS-blocked imgs). */
  avatarDataUrl?: string | null;
}

const ReportPrintable = React.forwardRef<HTMLDivElement, Props>(function ReportPrintable(
  { member, range, model, statusMarks, avatarDataUrl },
  ref
) {
  const monthLabel = range[0].isSame(range[1], 'month')
    ? range[0].format('MMMM YYYY')
    : `${range[0].format('MMM D, YYYY')} – ${range[1].format('MMM D, YYYY')}`;
  const rangeLabel = `${range[0].format('MMM D')} – ${range[1].format('MMM D, YYYY')}`;
  const overallBand = performanceBand(model.overall);

  // ── derived stats for the section stat-cards ───────────────────────────────
  let tkOnTime = 0;
  let tkDelayed = 0;
  for (const t of model.tickets.rows) {
    if (!(t.estimateHours > 0) || !(t.trackedSeconds > 0)) continue;
    if (t.trackedSeconds - t.estimateHours * 3600 > 60) tkDelayed += 1;
    else tkOnTime += 1;
  }
  const tkTotal = model.tickets.rows.length;
  const tkNotTracked = tkTotal - tkOnTime - tkDelayed;
  const lvRequests = model.leaves.rows.length;
  const lvPending = model.leaves.rows.filter((l) => l.status === 'pending').length;

  return (
    <div
      ref={ref}
      style={{ width: 794, padding: '32px 28px', background: '#fff', color: C.ink, fontFamily: 'Arial, Helvetica, sans-serif', boxSizing: 'border-box' }}
    >
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
                <div style={{ fontSize: 20, fontWeight: 800, lineHeight: '24px' }}>{member.name}</div>
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

      {/* ── Overview ───────────────────────────────────────────────────────── */}
      <div style={sectionStyle}>
        <SectionTitle>Overview</SectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${C.border}`, background: C.headBg, marginBottom: 12, ...avoidSplit }}>
          <tbody>
            <tr>
              <td style={{ width: '1%', whiteSpace: 'nowrap', verticalAlign: 'middle', padding: 0 }}>
                <div style={{ padding: '18px 24px', display: 'block' }}>
                  <span style={{ display: 'inline-block', fontSize: 36, fontWeight: 800, color: scoreColor(model.overall), lineHeight: 1, verticalAlign: 'baseline' }}>
                    {model.overall ?? '—'}
                  </span>
                  <span style={{ display: 'inline-block', fontSize: 16, fontWeight: 700, color: C.faint, marginLeft: 4, verticalAlign: 'baseline' }}>
                    / 100
                  </span>
                </div>
              </td>
              <td style={{ verticalAlign: 'middle', padding: 0 }}>
                <div style={{ padding: '18px 24px', paddingLeft: 0, display: 'block' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: overallBand.color, lineHeight: 1 }}>{overallBand.label}</div>
                  <div style={{ fontSize: 13, color: C.muted, marginTop: 6, lineHeight: 1 }}>
                    Overall performance · weighted across stages
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* stage cards — 3 per row via a fixed-layout table */}
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '8px', tableLayout: 'fixed', ...avoidSplit }}>
          <tbody>
            {[model.stages.slice(0, 3), model.stages.slice(3)].map((rowStages, ri) => (
              <tr key={ri}>
                {rowStages.map((s) => {
                  const band = performanceBand(s.score);
                  return (
                    <td key={s.key} style={{ border: `1px solid ${C.border}`, padding: '11px 13px', verticalAlign: 'top', opacity: s.enabled ? 1 : 0.55 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                          <tr>
                            <td style={{ fontSize: 12.5, fontWeight: 700 }}>{s.label}</td>
                            <td style={{ textAlign: 'right', fontSize: 10.5, fontWeight: 700, color: C.muted }}>{Number(s.weight)}%</td>
                          </tr>
                        </tbody>
                      </table>
                      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 4 }}>
                        <tbody>
                          <tr>
                            <td style={{ whiteSpace: 'nowrap', verticalAlign: 'bottom' }}>
                              <span style={{ fontSize: 24, fontWeight: 800, color: scoreColor(s.score) }}>{s.score ?? '—'}</span>
                              <span style={{ fontSize: 10.5, fontWeight: 700, color: C.faint }}> / 100</span>
                            </td>
                            <td style={{ textAlign: 'right', fontSize: 10.5, fontWeight: 800, color: band.color, verticalAlign: 'bottom' }}>
                              {s.enabled ? band.label : 'Excluded'}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  );
                })}
                {ri === 1 && <td style={{ border: 'none' }} />}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Tickets ────────────────────────────────────────────────────────── */}
      <div style={sectionStyle}>
        <SectionTitle>Tickets</SectionTitle>
        <StatCards
          items={[
            { label: 'Avg points', value: `${model.tickets.score ?? '—'}`, color: scoreColor(model.tickets.score) },
            { label: 'Total', value: tkTotal },
            { label: 'On-time', value: tkOnTime, color: '#16a34a' },
            { label: 'Delayed', value: tkDelayed, color: '#dc2626' },
            { label: 'Not tracked', value: tkNotTracked, color: '#b45309' },
          ]}
        />
        {model.tickets.rows.length === 0 ? (
          empty('No tickets worked in this window.')
        ) : (
          <Table
            cols={[
              { label: 'Ticket', width: '12%' }, { label: 'Title', width: '28%' }, { label: 'Type' }, { label: 'Start' }, { label: 'End' },
              { label: 'Est', right: true }, { label: 'Tracked', right: true }, { label: 'Delay', right: true },
              { label: 'Points', right: true }, { label: 'Status' },
            ]}
          >
            {model.tickets.rows.map((t) => {
              const dl = delayOf(t.estimateHours ?? 0, t.trackedSeconds ?? 0);
              const pts = ticketRowPoints(t, statusMarks);
              return (
                <tr key={t.id}>
                  <td style={{ ...tdNowrap, color: '#3b82f6', fontWeight: 700 }}>{t.ticketNumber}</td>
                  <td style={td}>{t.title}</td>
                  <td style={{ ...td, textTransform: 'capitalize' }}>{t.type || '—'}</td>
                  <td style={tdNowrap}>{t.startDate ? dayjs(t.startDate).format('MMM D') : '—'}</td>
                  <td style={tdNowrap}>{t.endDate || t.dueDate ? dayjs(t.endDate || t.dueDate).format('MMM D') : '—'}</td>
                  <td style={{ ...tdNowrap, textAlign: 'right' }}>{t.estimateHours ? `${t.estimateHours}h` : '—'}</td>
                  <td style={{ ...tdNowrap, textAlign: 'right' }}>{t.trackedSeconds ? hmFromSec(t.trackedSeconds) : '—'}</td>
                  <td style={{ ...tdNowrap, textAlign: 'right', color: dl.color, fontWeight: 700 }}>{dl.text}</td>
                  <td style={{ ...tdNowrap, textAlign: 'right', color: scoreColor(pts), fontWeight: 800 }}>{pts}%</td>
                  <td style={{ ...tdNowrap, textTransform: 'capitalize' }}>{(t.status || '').replace(/_/g, ' ')}</td>
                </tr>
              );
            })}
          </Table>
        )}
      </div>

      {/* ── Time Tracking ──────────────────────────────────────────────────── */}
      <div style={sectionStyle}>
        <SectionTitle>Time Tracking</SectionTitle>
        <StatCards
          items={[
            { label: 'Avg points', value: `${model.timeTracking.score ?? '—'}`, color: scoreColor(model.timeTracking.score) },
            { label: 'Avg hours / day', value: hmFromSec(model.timeTracking.avgSeconds) },
            { label: 'Tracked days', value: model.timeTracking.trackedDays },
          ]}
        />
        <div style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, margin: '2px 0 6px' }}>Performance Summary</div>
        {model.timeTracking.summaryTiers.length === 0 ? (
          empty('No performance tiers.')
        ) : (
          <Table cols={[{ label: 'Type' }, { label: 'Hours Between' }, { label: 'Days', right: true }, { label: 'Members', right: true }]}>
            {model.timeTracking.summaryTiers.map((t) => (
              <tr key={t.label}>
                <td style={{ ...td, fontWeight: 600 }}>{t.label}</td>
                <td style={{ ...td, color: C.muted }}>{t.range}</td>
                <td style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{t.days}</td>
                <td style={{ ...td, textAlign: 'right' }}>{t.members}</td>
              </tr>
            ))}
          </Table>
        )}
      </div>

      <div style={sectionStyle}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, margin: '2px 0 6px' }}>Time Tracking · Detailed Tracking</div>
        {model.timeTracking.detailed.length === 0 ? (
          empty('No tracking records.')
        ) : (
          <Table cols={[{ label: 'Member' }, { label: 'Date' }, { label: 'Weekday' }, { label: 'Hours', right: true }, { label: 'Tickets', right: true }, { label: 'Status' }]}>
            {model.timeTracking.detailed.map((r: any, i: number) => (
              <tr key={i}>
                <td style={{ ...td, fontWeight: 600 }}>{r.user?.name || '—'}</td>
                <td style={td}>{dayjs(r.date).format('MMM D')}</td>
                <td style={{ ...td, color: C.muted }}>{r.weekday}</td>
                <td style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{r.formattedDuration || hmFromSec(r.totalSeconds)}</td>
                <td style={{ ...td, textAlign: 'right' }}>{r.ticketCount ?? '—'}</td>
                <td style={td}>{r.status}</td>
              </tr>
            ))}
          </Table>
        )}
      </div>

      {/* ── Daily Updates ──────────────────────────────────────────────────── */}
      <div style={sectionStyle}>
        <SectionTitle>Daily Updates</SectionTitle>
        <StatCards
          items={[
            { label: 'Avg points', value: `${model.dailyUpdates.score ?? '—'}`, color: scoreColor(model.dailyUpdates.score) },
            { label: 'Expected days', value: model.dailyUpdates.expected },
            { label: 'Posted', value: model.dailyUpdates.posted, color: '#16a34a' },
            { label: 'Missed', value: model.dailyUpdates.missed, color: '#dc2626' },
          ]}
        />
        {model.dailyUpdates.rows.length === 0 ? (
          empty('No daily updates posted in this window.')
        ) : (
          <Table cols={[{ label: 'Member' }, { label: 'Type' }, { label: 'Posted On' }, { label: 'Tasks', right: true }, { label: 'Hours', right: true }, { label: 'Mood' }]}>
            {model.dailyUpdates.rows.map((u: any) => (
              <tr key={u.id}>
                <td style={{ ...td, fontWeight: 600 }}>{u.user?.name || '—'}</td>
                <td style={td}>{u.updateType || 'EOD'}</td>
                <td style={td}>{fmtDate(u.createdAt)}</td>
                <td style={{ ...td, textAlign: 'right' }}>
                  {(u.projectUpdates || []).reduce((n: number, p: any) => n + (p.tasks?.length || 0), 0) || '—'}
                </td>
                <td style={{ ...td, textAlign: 'right' }}>{u.totalHoursWorked ? `${u.totalHoursWorked}h` : '—'}</td>
                <td style={{ ...td, textTransform: 'capitalize' }}>{u.mood || '—'}</td>
              </tr>
            ))}
          </Table>
        )}
      </div>

      {/* ── Attendance ─────────────────────────────────────────────────────── */}
      <div style={sectionStyle}>
        <SectionTitle>Attendance</SectionTitle>
        <StatCards
          items={[
            { label: 'Avg points', value: `${model.attendance.score ?? '—'}`, color: scoreColor(model.attendance.score) },
            { label: 'Present', value: model.attendance.present, color: '#16a34a' },
            { label: 'Absent', value: model.attendance.absent, color: '#dc2626' },
            { label: 'Avg hours / day', value: hmFromMin(model.attendance.avgMins) },
          ]}
        />
        {model.attendance.rows.length === 0 ? (
          empty('No attendance records in this window.')
        ) : (
          <Table cols={[{ label: 'Member' }, { label: 'Date' }, { label: 'Clock In' }, { label: 'Clock Out' }, { label: 'Hours', right: true }, { label: 'Late', right: true }, { label: 'Status' }]}>
            {model.attendance.rows.map((r: any) => (
              <tr key={r.id}>
                <td style={{ ...td, fontWeight: 600 }}>{r.member?.name || '—'}</td>
                <td style={td}>{dayjs(r.date).format('MMM D')}</td>
                <td style={td}>{fmtTime(r.clockIn)}</td>
                <td style={td}>{fmtTime(r.clockOut)}</td>
                <td style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{hmFromMin(r.effectiveWorkMinutes ?? r.workingMinutes ?? r.totalWorkMinutes ?? 0)}</td>
                <td style={{ ...td, textAlign: 'right', color: (r.lateMinutes ?? 0) > 0 ? '#dc2626' : C.faint }}>{(r.lateMinutes ?? 0) > 0 ? hmFromMin(r.lateMinutes) : '—'}</td>
                <td style={{ ...td, textTransform: 'capitalize' }}>{(r.status || '').replace('-', ' ')}</td>
              </tr>
            ))}
          </Table>
        )}
      </div>

      {/* ── Leaves ─────────────────────────────────────────────────────────── */}
      <div style={sectionStyle}>
        <SectionTitle>Leaves</SectionTitle>
        <StatCards
          items={[
            { label: 'Avg points', value: `${model.leaves.score ?? '—'}`, color: scoreColor(model.leaves.score) },
            { label: 'Leave days', value: Number(model.leaves.leaveDays.toFixed(2)) },
            { label: 'Paid', value: Number(model.leaves.paidDays.toFixed(2)), color: '#16a34a' },
            { label: 'LOP', value: Number(model.leaves.lopDays.toFixed(2)), color: '#dc2626' },
            { label: 'Requests', value: lvRequests },
            { label: 'Pending', value: lvPending, color: '#b45309' },
          ]}
        />
        {model.leaves.rows.length === 0 ? (
          empty('No leaves in this window.')
        ) : (
          <Table cols={[{ label: 'Member' }, { label: 'Leave Type' }, { label: 'From' }, { label: 'To' }, { label: 'Days', right: true }, { label: 'LOP', right: true }, { label: 'Status' }]}>
            {model.leaves.rows.map((l) => (
              <tr key={l.id}>
                <td style={{ ...td, fontWeight: 600 }}>{l.userName || '—'}</td>
                <td style={td}>{l.leaveTypeName || '—'}</td>
                <td style={td}>{dayjs(l.fromDate).format('MMM D')}</td>
                <td style={td}>{dayjs(l.toDate).format('MMM D')}</td>
                <td style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{Number((l.totalUnits || 0).toFixed(2))}</td>
                <td style={{ ...td, textAlign: 'right', color: l.lopUnits > 0 ? '#dc2626' : C.faint }}>{l.lopUnits > 0 ? Number(l.lopUnits.toFixed(2)) : '—'}</td>
                <td style={{ ...td, textTransform: 'capitalize' }}>{l.status}</td>
              </tr>
            ))}
          </Table>
        )}
      </div>

      <div style={{ marginTop: 20, paddingTop: 10, borderTop: `1px solid ${C.border}`, fontSize: 10, color: C.faint, textAlign: 'center' }}>
        Generated {dayjs().format('MMM D, YYYY h:mm A')} · Zukvo Performance Report
      </div>
    </div>
  );
});

export default ReportPrintable;
