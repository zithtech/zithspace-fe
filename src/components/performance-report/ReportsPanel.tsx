'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, Button, DatePicker, Dropdown, Drawer, Empty, Spin, Typography, message } from 'antd';
import {
  CalendarOutlined,
  FileSearchOutlined,
  ArrowLeftOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { Ticket, Timer, NotebookPen, CalendarCheck, Plane, Gauge } from 'lucide-react';
import dayjs, { Dayjs } from 'dayjs';
import { TimelineTree } from '@/components/projects/overview/TimelineTree';
import { PerformanceTracker } from '@/components/time-tracking/PerformanceTracker';
import DailyUpdatesSection from './DailyUpdatesSection';
import AttendanceSection from './AttendanceSection';
import LeavesSection from './LeavesSection';
import MemberGrid from './MemberGrid';
import OverviewSection, { ModuleWeight } from './OverviewSection';
import EmptyState from './EmptyState';
import ReportPrintable from './ReportPrintable';
import { gatherReportData, ReportModel } from './reportPdfData';
import { downloadReportPdf, downloadReportDocx, reportToPdfBlob } from '@/app/tickets/reports/[sprintId]/reportExport';
import { usePermission } from '@/hooks/usePermission';
import PerformanceReportService, { ReportTicket, ReportMember } from '@/services/performanceReportService';
import { ticketPoints, POINT_RULES, MISSING_DATA_PENALTY } from './ticketPoints';
import { timeTrackingPoints, pointsColor as scoreColor, fmtHM } from './moduleScores';

const { RangePicker } = DatePicker;
const { Text } = Typography;

type SectionKey =
  | 'overview'
  | 'tickets'
  | 'time_tracking'
  | 'daily_updates'
  | 'attendance'
  | 'leaves';

// Report module tabs — icon + accent per module (palette mirrors Settings).
const SECTIONS: ReadonlyArray<{
  key: SectionKey;
  label: string;
  icon: React.ReactNode;
  color: string;
}> = [
  { key: 'overview', label: 'Overview', icon: <Gauge size={16} />, color: '#0EA5E9' },
  { key: 'tickets', label: 'Tickets', icon: <Ticket size={16} />, color: '#EC4899' },
  { key: 'time_tracking', label: 'Time Tracking', icon: <Timer size={16} />, color: '#F59E0B' },
  { key: 'daily_updates', label: 'Daily Updates', icon: <NotebookPen size={16} />, color: '#8B5CF6' },
  { key: 'attendance', label: 'Attendance', icon: <CalendarCheck size={16} />, color: '#3B82F6' },
  { key: 'leaves', label: 'Leaves', icon: <Plane size={16} />, color: '#10B981' },
];

// In-month performance report — Tickets slice. Pick a project, member and date
// range, then "View Report" lists every ticket the member logged time on within
// the range, rendered with the same timeline UI as the project overview.
export default function ReportsPanel() {
  // Step 1 → 2: a member is picked from the grid, then we show their report.
  const [selected, setSelected] = useState<{ member: ReportMember; projectId?: string } | null>(
    null
  );
  const memberId = selected?.member.id ?? null;
  const projectId = selected?.projectId ?? null;

  const [range, setRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs(),
  ]);

  // ── results ──────────────────────────────────────────────────────────────
  const [tickets, setTickets] = useState<ReportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [pointsHelpOpen, setPointsHelpOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionKey>('overview');
  // Module weights + enabled flags from Settings (drive the Overview blend).
  const [moduleWeights, setModuleWeights] = useState<ModuleWeight[]>([]);
  // Time Tracking average surfaced by the embedded PerformanceTracker.
  const [ttStats, setTtStats] = useState<{ avgSeconds: number; days: number } | null>(null);
  const handleTtAverage = useCallback(
    (avgSeconds: number, days: number) => setTtStats({ avgSeconds, days }),
    []
  );
  // BOD/EOD toggle from the Daily Updates module settings (default both on).
  const [duConfig, setDuConfig] = useState<{ bod: boolean; eod: boolean }>({ bod: true, eod: true });
  // Filters captured at the last "View Report" — drive every section in sync.
  const [applied, setApplied] = useState<{
    projectId?: string;
    memberId?: string;
    range: [Dayjs, Dayjs];
  } | null>(null);
  // Tenant's configured status→cap map (from the Tickets module settings).
  const [statusMarks, setStatusMarks] = useState<Record<string, number>>({});

  // ── PDF / Word export ──────────────────────────────────────────────────────
  const { canUpdatePerformanceReportSetting } = usePermission();
  const printRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState<null | 'pdf' | 'word' | 'save'>(null);
  const [printModel, setPrintModel] = useState<ReportModel | null>(null);
  const [printAvatar, setPrintAvatar] = useState<string | null>(null);
  const pendingFormat = useRef<'pdf' | 'word' | 'save' | null>(null);

  // Convert the avatar to a data URL — html2canvas can't capture a CORS-blocked
  // <img>, so we inline it (falls back to initials if the fetch is blocked too).
  const resolveAvatar = async (url?: string | null): Promise<string | null> => {
    if (!url) return null;
    if (url.startsWith('data:')) return url;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const proxyUrl = `${apiUrl}/api/proxy-logo?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl, { mode: 'cors' });
      if (!res.ok) throw new Error('Proxy failed');
      const blob = await res.blob();
      return await new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  const handleDownload = async (format: 'pdf' | 'word' | 'save') => {
    if (!applied || !selected) return;
    if (format === 'save' && !applied.memberId) {
      message.warning('Select a member to save their report');
      return;
    }
    setDownloading(format);
    try {
      const [model, avatar] = await Promise.all([
        gatherReportData({
          projectId: applied.projectId,
          userId: applied.memberId,
          range: applied.range,
          statusMarks,
          bodEnabled: duConfig.bod,
          eodEnabled: duConfig.eod,
          weights: moduleWeights,
          tickets,
        }),
        resolveAvatar(selected.member.avatarUrl),
      ]);
      pendingFormat.current = format;
      setPrintAvatar(avatar);
      setPrintModel(model); // renders the off-screen printable, then the effect exports
    } catch (err: any) {
      message.error(err?.message || 'Failed to prepare the report');
      setDownloading(null);
    }
  };

  // Once the printable is rendered with data, capture it to PDF / Word.
  useEffect(() => {
    if (!printModel || !pendingFormat.current || !selected || !applied) return;
    const fmt = pendingFormat.current;
    (async () => {
      try {
        await new Promise((r) => setTimeout(r, 300)); // let layout + avatar settle
        const el = printRef.current;
        if (!el) throw new Error('nothing to export');
        const base = `${selected.member.name || 'report'}-${applied.range[0].format('YYYY-MM')}`
          .replace(/\s+/g, '_')
          .toLowerCase();
        if (fmt === 'pdf') {
          await downloadReportPdf(el, `${base}.pdf`);
        } else if (fmt === 'word') {
          await downloadReportDocx(el, `${base}.docx`);
        } else if (fmt === 'save' && printModel) {
          const blob = await reportToPdfBlob(el, `${base}.pdf`);
          const pdfBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          await PerformanceReportService.saveGeneratedReport({
            userId: applied.memberId!,
            periodKey: applied.range[0].format('YYYY-MM'),
            periodStart: applied.range[0].format('YYYY-MM-DD'),
            periodEnd: applied.range[1].format('YYYY-MM-DD'),
            scores: {
              overall: printModel.overall,
              tickets: printModel.tickets.score,
              timeTracking: printModel.timeTracking.score,
              dailyUpdates: printModel.dailyUpdates.score,
              attendance: printModel.attendance.score,
              leaves: printModel.leaves.score,
            },
            summary: { stages: printModel.stages },
            pdfBase64,
          });
          message.success('Saved to Generated Reports');
        }
      } catch (err: any) {
        message.error(err?.response?.data?.error || err?.message || 'Export failed');
      } finally {
        pendingFormat.current = null;
        setPrintModel(null);
        setDownloading(null);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [printModel]);

  // Load the tenant's module settings once (status caps + BOD/EOD toggle).
  useEffect(() => {
    PerformanceReportService.getSettings()
      .then((settings) => {
        const ticketsCfg = settings?.modules?.find((m) => m.moduleKey === 'tickets')?.config as
          | { statusMarks?: Record<string, number> }
          | undefined;
        setStatusMarks(ticketsCfg?.statusMarks ?? {});
        const duCfg = settings?.modules?.find((m) => m.moduleKey === 'daily_updates')?.config as
          | { bod?: boolean; eod?: boolean }
          | undefined;
        setDuConfig({ bod: duCfg?.bod !== false, eod: duCfg?.eod !== false });
        setModuleWeights(
          (settings?.modules ?? []).map((m) => ({
            key: m.moduleKey as ModuleWeight['key'],
            weight: Number(m.weight) || 0,
            enabled: m.isEnabled,
          }))
        );
      })
      .catch(() => {});
  }, []);

  // Fetch with EXPLICIT filters (no closure on state) so the auto-run can never
  // pick up a stale range. Both the button and the auto-run go through this.
  const fetchReport = useCallback(
    async (r: [Dayjs, Dayjs], pid: string | null, mid: string | null) => {
      setLoading(true);
      try {
        const rows = await PerformanceReportService.getTicketReport({
          from: r[0].format('YYYY-MM-DD'),
          to: r[1].format('YYYY-MM-DD'),
          projectId: pid || undefined,
          memberId: mid || undefined,
        });
        setTickets(rows);
        setApplied({ projectId: pid || undefined, memberId: mid || undefined, range: [r[0], r[1]] });
        setHasRun(true);
      } catch (err: any) {
        message.error(err?.response?.data?.error || err?.message || 'Failed to load report');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // "View Report" button — uses the currently-picked range.
  const run = () => {
    if (!range?.[0] || !range?.[1]) {
      message.warning('Pick a date range first');
      return;
    }
    fetchReport(range, projectId, memberId);
  };

  // Auto-load the CURRENT MONTH as soon as a member is picked, regardless of any
  // previously-chosen range.
  useEffect(() => {
    if (!selected) return;
    const r: [Dayjs, Dayjs] = [dayjs().startOf('month'), dayjs()];
    setRange(r);
    fetchReport(r, selected.projectId ?? null, selected.member.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.member.id, selected?.projectId]);

  // On-time vs delayed mirrors the timeline's Delay column: a row is "delayed"
  // when tracked time exceeds the estimate, "on time" when it's within it. Rows
  // missing an estimate or tracked time can't be judged, so they're excluded
  // from the on-time/delayed split but still counted in the total.
  const stats = useMemo(() => {
    const total = tickets.length;
    let onTime = 0;
    let delayed = 0;
    for (const t of tickets) {
      if (!(t.estimateHours > 0) || !(t.trackedSeconds > 0)) continue;
      const deltaSec = t.trackedSeconds - t.estimateHours * 3600;
      if (deltaSec > 60) delayed += 1;
      else onTime += 1;
    }
    // Remainder: rows with no estimate or no tracked time → can't be judged.
    const notTracked = total - onTime - delayed;
    const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
    return {
      total,
      onTime,
      delayed,
      notTracked,
      onTimePct: pct(onTime),
      delayedPct: pct(delayed),
      notTrackedPct: pct(notTracked),
    };
  }, [tickets]);

  // Ticket Points: score every worked ticket on how far tracked time ran over
  // estimate (missing estimate/tracked → flat penalty). Aggregate per ticket id
  // first (month-split rows → total tracked), then average. avg is null only
  // when there are no tickets at all.
  const points = useMemo(() => {
    const byId = new Map<string, { status: string; estimateHours: number; trackedSeconds: number }>();
    for (const t of tickets) {
      const cur = byId.get(t.id);
      if (cur) cur.trackedSeconds += t.trackedSeconds || 0;
      else
        byId.set(t.id, {
          status: t.status,
          estimateHours: t.estimateHours || 0,
          trackedSeconds: t.trackedSeconds || 0,
        });
    }
    const scores: number[] = [];
    byId.forEach((v) => scores.push(ticketPoints(v, statusMarks)));
    const avg = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;
    return { avg, scored: scores.length };
  }, [tickets, statusMarks]);

  const pointsColor =
    points.avg === null
      ? '#94a3b8'
      : points.avg >= 90
      ? '#059669'
      : points.avg >= 75
      ? '#b45309'
      : '#dc2626';

  // Time Tracking score from the surfaced average (6h/day = 100).
  const ttPoints = ttStats ? timeTrackingPoints(ttStats.avgSeconds / 3600) : null;

  const rangeLabel = useMemo(
    () =>
      range?.[0] && range?.[1]
        ? `${range[0].format('MMM D')} – ${range[1].format('MMM D, YYYY')}`
        : '',
    [range]
  );

  // Step 1: the member directory grid.
  if (!selected) {
    return (
      <MemberGrid onSelect={(member, pid) => setSelected({ member, projectId: pid })} />
    );
  }

  const m = selected.member;

  // Step 2: the selected member's report.
  return (
    <div className="prr-wrap">
      {/* ── Header: back + member identity ──────────────────────────────────── */}
      <div className="prr-head">
        <div className="prr-member-head">
          <button type="button" className="prr-back" onClick={() => setSelected(null)} aria-label="Back to members">
            <ArrowLeftOutlined />
          </button>
          <Avatar
            size={46}
            src={m.avatarUrl || undefined}
            style={{ background: 'var(--bg-blue-50)', color: 'var(--text-blue-700)', fontSize: 18, fontWeight: 800, flexShrink: 0 }}
          >
            {m.name?.charAt(0)?.toUpperCase()}
          </Avatar>
          <div>
            <h2 className="prr-title">{m.name}</h2>
            <p className="prr-sub">
              {[m.position, m.department].filter(Boolean).join(' · ') || 'Performance report'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Filter bar: date range + run ────────────────────────────────────── */}
      <div className="prr-filters">
        <div className="prr-field">
          <span className="prr-field-label">Date range</span>
          <RangePicker
            value={range}
            allowClear={false}
            format="MMM D, YYYY"
            onChange={(d) => d && d[0] && d[1] && setRange([d[0], d[1]])}
            presets={[
              { label: 'This month', value: [dayjs().startOf('month'), dayjs()] },
              {
                label: 'Last month',
                value: [
                  dayjs().subtract(1, 'month').startOf('month'),
                  dayjs().subtract(1, 'month').endOf('month'),
                ],
              },
              { label: 'Last 7 days', value: [dayjs().subtract(6, 'day'), dayjs()] },
              { label: 'Last 30 days', value: [dayjs().subtract(29, 'day'), dayjs()] },
            ]}
          />
        </div>

        <div className="prr-actions">
          {canUpdatePerformanceReportSetting && (
            <Button
              icon={<InboxOutlined />}
              loading={downloading === 'save'}
              disabled={!hasRun || (!!downloading && downloading !== 'save')}
              onClick={() => handleDownload('save')}
            >
              Save to Generated
            </Button>
          )}

          <Dropdown
            trigger={['click']}
            disabled={!hasRun || !!downloading}
            menu={{
              onClick: ({ key }) => handleDownload(key as 'pdf' | 'word'),
              items: [
                { key: 'pdf', icon: <FilePdfOutlined />, label: 'Download as PDF' },
                { key: 'word', icon: <FileWordOutlined />, label: 'Download as Word' },
              ],
            }}
          >
            <Button icon={<DownloadOutlined />} loading={downloading === 'pdf' || downloading === 'word'}>
              Download
            </Button>
          </Dropdown>

          <Button type="primary" icon={<FileSearchOutlined />} loading={loading} onClick={run}>
            View Report
          </Button>
        </div>
      </div>

      {/* Off-screen printable used only for the PDF / Word capture. */}
      {printModel && selected && applied && (
        <div style={{ position: 'fixed', left: -99999, top: 0, zIndex: -1 }} aria-hidden>
          <ReportPrintable
            ref={printRef}
            member={selected.member}
            range={applied.range}
            model={printModel}
            statusMarks={statusMarks}
            avatarDataUrl={printAvatar}
          />
        </div>
      )}

      {/* ── Results ─────────────────────────────────────────────────────────── */}
      <div className="prr-results">
        {loading ? (
          <div className="prr-center">
            <Spin tip="Building report…" />
          </div>
        ) : !hasRun ? (
          <div className="prr-center">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Text style={{ fontSize: 12.5, color: 'var(--text-slate-500)' }}>
                  Choose your filters and hit <strong>View Report</strong> to see tickets
                  worked in the selected window.
                </Text>
              }
            />
          </div>
        ) : (
          <>
            <div className="prr-tabs" role="tablist">
              {SECTIONS.map((s) => {
                const active = activeSection === s.key;
                return (
                  <button
                    key={s.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    className={`prr-tab ${active ? 'is-active' : ''}`}
                    style={{ ['--accent' as any]: s.color }}
                    onClick={() => setActiveSection(s.key)}
                  >
                    <span className="prr-tab-ic">{s.icon}</span>
                    <span className="prr-tab-label">{s.label}</span>
                  </button>
                );
              })}
            </div>

            {activeSection === 'overview' ? (
              applied && (
                <OverviewSection
                  projectId={applied.projectId}
                  userId={applied.memberId}
                  range={applied.range}
                  statusMarks={statusMarks}
                  bodEnabled={duConfig.bod}
                  eodEnabled={duConfig.eod}
                  weights={moduleWeights}
                  tickets={tickets}
                />
              )
            ) : activeSection === 'time_tracking' ? (
              <div className="prr-tt">
                {applied && (
                  <>
                    <div className="prr-statbar">
                      <div className="prr-stat prr-stat--points">
                        <div className="prr-stat-top">
                          <span
                            className="prr-stat-num"
                            style={{ color: scoreColor(ttPoints) }}
                          >
                            {ttPoints ?? '—'}
                          </span>
                          {ttPoints !== null && <span className="prr-pts-max">/ 100</span>}
                        </div>
                        <div className="prr-stat-label">Avg points</div>
                      </div>
                      <div className="prr-stat">
                        <div className="prr-stat-top">
                          <span className="prr-stat-num" style={{ fontSize: 18 }}>
                            {ttStats ? fmtHM(ttStats.avgSeconds) : '—'}
                          </span>
                        </div>
                        <div className="prr-stat-label">Avg hours / day</div>
                      </div>
                      <div className="prr-stat">
                        <div className="prr-stat-top">
                          <span className="prr-stat-num">{ttStats?.days ?? 0}</span>
                        </div>
                        <div className="prr-stat-label">Tracked days</div>
                      </div>
                    </div>
                    <PerformanceTracker
                      embedded
                      controlled={{
                        projectId: applied.projectId,
                        userIds: applied.memberId ? [applied.memberId] : [],
                        range: applied.range,
                      }}
                      onAverageChange={handleTtAverage}
                    />
                  </>
                )}
              </div>
            ) : activeSection === 'daily_updates' ? (
              applied && (
                <DailyUpdatesSection
                  projectId={applied.projectId}
                  userId={applied.memberId}
                  range={applied.range}
                  bodEnabled={duConfig.bod}
                  eodEnabled={duConfig.eod}
                />
              )
            ) : activeSection === 'attendance' ? (
              applied && (
                <AttendanceSection
                  projectId={applied.projectId}
                  userId={applied.memberId}
                  range={applied.range}
                />
              )
            ) : activeSection === 'leaves' ? (
              applied && <LeavesSection userId={applied.memberId} range={applied.range} />
            ) : tickets.length === 0 ? (
              <EmptyState
                accent="#EC4899"
                icon={<Ticket size={28} />}
                title="No tickets worked"
                subtitle="No time was logged on any ticket in this window. Ticket points appear here once work is tracked."
              />
            ) : (
              <>
            <div className="prr-statbar">
              <div className="prr-stat prr-stat--points">
                <div className="prr-stat-top">
                  <span className="prr-stat-num" style={{ color: pointsColor }}>
                    {points.avg ?? '—'}
                  </span>
                  {points.avg !== null && <span className="prr-pts-max">/ 100</span>}
                </div>
                <div className="prr-stat-label">
                  Avg points{points.scored ? ` · ${points.scored} scored` : ''}
                </div>
              </div>
              <div className="prr-stat">
                <div className="prr-stat-top">
                  <span className="prr-stat-num">{stats.total}</span>
                  <span className="prr-pct prr-pct--slate">100%</span>
                </div>
                <div className="prr-stat-label">Total tickets</div>
              </div>
              <div className="prr-stat">
                <div className="prr-stat-top">
                  <span className="prr-stat-num">{stats.onTime}</span>
                  <span className="prr-pct prr-pct--green">{stats.onTimePct}%</span>
                </div>
                <div className="prr-stat-label">On-time completed</div>
              </div>
              <div className="prr-stat">
                <div className="prr-stat-top">
                  <span className="prr-stat-num">{stats.delayed}</span>
                  <span className="prr-pct prr-pct--red">{stats.delayedPct}%</span>
                </div>
                <div className="prr-stat-label">Delayed</div>
              </div>
              <div className="prr-stat">
                <div className="prr-stat-top">
                  <span className="prr-stat-num">{stats.notTracked}</span>
                  <span className="prr-pct prr-pct--amber">{stats.notTrackedPct}%</span>
                </div>
                <div className="prr-stat-label">Not tracked</div>
              </div>
              <div className="prr-statbar-caption">
                <CalendarOutlined style={{ color: 'var(--text-slate-400)' }} />
                {rangeLabel}
              </div>
            </div>
            <TimelineTree
              tickets={tickets as any}
              hideToolbar
              onPointsInfo={() => setPointsHelpOpen(true)}
              pointsOf={(t: any) =>
                ticketPoints(
                  {
                    status: t.status,
                    estimateHours: t.estimateHours ?? 0,
                    trackedSeconds: t.trackedSeconds ?? 0,
                  },
                  statusMarks
                )
              }
            />
              </>
            )}
          </>
        )}
      </div>

      {/* ── How points work ─────────────────────────────────────────────────── */}
      <Drawer
        title="How ticket points are calculated"
        placement="right"
        width={460}
        open={pointsHelpOpen}
        onClose={() => setPointsHelpOpen(false)}
      >
        <p className="prr-help-intro">
          Each ticket scores out of <strong>100</strong> based on how its{' '}
          <strong>tracked</strong> time compares to its <strong>estimate</strong>. Finishing
          within estimate earns full marks; the further it runs over, the lower the score.
        </p>

        <table className="prr-help-table">
          <thead>
            <tr>
              <th>Tracked vs estimate</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            {POINT_RULES.map((r) => {
              const color = r.points >= 90 ? '#10b981' : r.points >= 75 ? '#f59e0b' : '#ef4444';
              return (
                <tr key={r.range}>
                  <td>{r.range}</td>
                  <td>
                    <span className="prr-help-pts" style={{ color }}>{r.points}%</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {Object.keys(statusMarks).length > 0 && (
          <>
            <p className="prr-help-intro" style={{ marginTop: 4 }}>
              Then each ticket is <strong>capped by its status</strong> — work that isn’t at the
              final stage can’t score full marks (set in Settings → Tickets):
            </p>
            <table className="prr-help-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Max points</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(statusMarks)
                  .sort((a, b) => b[1] - a[1])
                  .map(([status, cap]) => {
                    const color = cap >= 90 ? '#10b981' : cap >= 75 ? '#f59e0b' : '#ef4444';
                    return (
                      <tr key={status}>
                        <td style={{ textTransform: 'capitalize' }}>{status}</td>
                        <td>
                          <span className="prr-help-pts" style={{ color }}>{cap}%</span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </>
        )}

        <div className="prr-help-note">
          <strong>No estimate or no tracked time?</strong> The ticket can’t be measured, so it
          takes a flat <strong>−{MISSING_DATA_PENALTY}</strong> penalty (scores{' '}
          {100 - MISSING_DATA_PENALTY}%).
        </div>

        <div className="prr-help-note prr-help-note--muted">
          The <strong>Avg points</strong> card is the mean across all tickets in the current
          filters. A ticket worked across two months sums its time before scoring.
        </div>
      </Drawer>

      <style jsx global>{`
        .prr-wrap { display: flex; flex-direction: column; gap: 16px; flex: 1; min-height: 0; }

        /* ── Box-shaped report: square every corner (avatars stay round) ─────── */
        .prr-wrap *,
        .prr-wrap *::before,
        .prr-wrap *::after { border-radius: 0 !important; }
        .prr-wrap .ant-avatar { border-radius: 50% !important; }

        .prr-title { margin: 0; font-size: 19px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; }
        .prr-sub { margin: 4px 0 0; font-size: 13px; color: var(--text-slate-500); max-width: 620px; line-height: 1.5; }
        .prr-member-head { display: flex; align-items: center; gap: 14px; }
        .prr-back {
          width: 36px; height: 36px; flex-shrink: 0; border-radius: 10px;
          border: 1px solid var(--border-slate-200); background: var(--bg-secondary); color: var(--text-slate-700); cursor: pointer;
          display: inline-flex; align-items: center; justify-content: center;
          transition: all .14s ease;
        }
        .prr-back:hover { color: #3b82f6; border-color: #bfdbfe; background: var(--bg-blue-50); }

        .prr-filters {
          display: flex; align-items: flex-end; gap: 14px; flex-wrap: wrap;
          padding: 14px 16px; border: 1px solid var(--border-slate-200); border-radius: 14px; background: var(--bg-secondary);
        }
        .prr-field { display: flex; flex-direction: column; gap: 6px; }
        .prr-field-label {
          font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-slate-400);
        }
        .prr-actions { margin-left: auto; display: flex; align-items: center; gap: 8px; }
        .prr-actions .ant-btn { height: 38px; font-weight: 600; }

        .prr-results { display: flex; flex-direction: column; flex: 1; min-height: 0; }
        /* Premium module tab switcher */
        .prr-tabs {
          display: inline-flex;
          gap: 4px;
          padding: 5px;
          margin-bottom: 16px;
          align-self: flex-start;
          background: linear-gradient(180deg, var(--bg-slate-50) 0%, var(--bg-slate-100) 100%);
          border: 1px solid #eaeef4;
          border-radius: 14px;
          box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.04);
          max-width: 100%;
          overflow-x: auto;
        }
        .prr-tabs::-webkit-scrollbar { height: 0; }
        .prr-tab {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 7px 14px 7px 8px;
          border: 1px solid transparent;
          background: transparent;
          border-radius: 10px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-slate-500);
          white-space: nowrap;
          transition: color 0.16s ease, background 0.16s ease, box-shadow 0.16s ease,
            border-color 0.16s ease, transform 0.16s ease;
        }
        .prr-tab:hover { color: var(--text-slate-900); }
        .prr-tab:active { transform: translateY(0.5px); }
        .prr-tab-ic {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: var(--text-slate-400);
          background: rgba(148, 163, 184, 0.12);
          transition: color 0.16s ease, background 0.16s ease, box-shadow 0.16s ease;
        }
        .prr-tab:hover .prr-tab-ic { color: var(--text-slate-700); }
        .prr-tab.is-active {
          color: var(--text-slate-900);
          background: var(--bg-secondary);
          border-color: var(--border-slate-100);
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06), 0 6px 16px rgba(15, 23, 42, 0.07);
        }
        .prr-tab.is-active .prr-tab-ic {
          color: var(--accent);
          background: color-mix(in srgb, var(--accent) 14%, #fff);
          box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 22%, transparent);
        }
        .prr-tt { display: flex; flex-direction: column; flex: 1; min-height: 0; }
        .prr-center {
          flex: 1; display: flex; align-items: center; justify-content: center;
          border: 1px dashed var(--border-slate-200); border-radius: 14px; background: var(--bg-slate-50); padding: 56px 24px; min-height: 320px;
        }
        .prr-statbar {
          display: flex; align-items: stretch; gap: 10px; flex-wrap: wrap; margin-bottom: 12px;
        }
        .prr-stat {
          flex: 1; min-width: 150px;
          border: 1px solid var(--border-slate-200); border-radius: 12px; background: var(--bg-secondary); padding: 12px 14px;
          display: flex; flex-direction: column; gap: 4px;
        }
        .prr-stat--points { border-color: #c7d2fe; background: linear-gradient(180deg, #f5f7ff 0%, #ffffff 60%); }
        .prr-pts-max { font-size: 13px; font-weight: 700; color: var(--text-slate-400); }
        .prr-stat-top { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
        .prr-stat-num { font-size: 24px; font-weight: 800; color: var(--text-slate-900); line-height: 1; letter-spacing: -0.02em; }
        .prr-pct {
          font-size: 12px; font-weight: 800; padding: 2px 8px; border-radius: 999px;
        }
        .prr-pct--slate { color: var(--text-slate-700); background: var(--bg-slate-100); }
        .prr-pct--green { color: #059669; background: rgba(16,185,129,0.12); }
        .prr-pct--red { color: #dc2626; background: rgba(239,68,68,0.12); }
        .prr-pct--amber { color: #b45309; background: rgba(245,158,11,0.14); }
        .prr-stat-label {
          font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-slate-400);
        }
        .prr-statbar-caption {
          display: flex; align-items: center; gap: 7px; align-self: center;
          font-size: 12.5px; font-weight: 600; color: var(--text-slate-500); padding: 0 4px; white-space: nowrap;
        }

        /* How-points-work drawer */
        .prr-help-intro { font-size: 13px; color: var(--text-slate-700); line-height: 1.6; margin: 0 0 16px; }
        .prr-help-table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
        .prr-help-table th {
          text-align: left; font-size: 10.5px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.05em; color: var(--text-slate-400); padding: 8px 10px; border-bottom: 1px solid var(--border-slate-200);
        }
        .prr-help-table th:last-child { text-align: right; }
        .prr-help-table td {
          font-size: 13px; color: var(--text-slate-700); padding: 9px 10px; border-bottom: 1px solid var(--border-slate-100);
        }
        .prr-help-table td:last-child { text-align: right; }
        .prr-help-table tr:first-child td { font-weight: 600; }
        .prr-help-pts { font-weight: 800; font-variant-numeric: tabular-nums; }
        .prr-help-note {
          font-size: 12.5px; color: var(--text-slate-700); line-height: 1.55;
          background: var(--bg-slate-50); border: 1px solid var(--border-slate-100); border-radius: 10px; padding: 12px 14px;
          margin-bottom: 10px;
        }
        .prr-help-note--muted { color: var(--text-slate-500); background: var(--bg-secondary); }
      `}</style>
    </div>
  );
}
