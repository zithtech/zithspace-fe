'use client';

import { apiClient } from '@/lib/axios';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, Button, DatePicker, Dropdown, Drawer, Empty, Spin, Typography, message } from 'antd';
import {
  CalendarOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import {
  Ticket,
  Timer,
  NotebookPen,
  CalendarCheck,
  Plane,
  Gauge,
  ChevronLeft,
  Briefcase,
  Building2,
  Mail,
  CalendarRange,
} from 'lucide-react';
import dayjs, { Dayjs } from 'dayjs';
import { TimelineTree } from '@/components/projects/overview/TimelineTree';
import { PerformanceTracker } from '@/components/time-tracking/PerformanceTracker';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import DailyUpdatesSection from './DailyUpdatesSection';
import AttendanceSection from './AttendanceSection';
import LeavesSection from './LeavesSection';
import MemberGrid from './MemberGrid';
import OverviewSection, { ModuleWeight } from './OverviewSection';
import EmptyState from './EmptyState';
import ReportPrintable from './ReportPrintable';
import { gatherReportData, ReportModel } from './reportPdfData';
import { PerformanceReportExportRunner } from './PerformanceReportExportRunner';
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

// Quick date presets — shared by the picker's preset list and the chip row so
// the highlighted chip always matches what the picker would apply.
const RANGE_PRESETS: ReadonlyArray<{ key: string; label: string; get: () => [Dayjs, Dayjs] }> = [
  { key: 'this_month', label: 'This month', get: () => [dayjs().startOf('month'), dayjs()] },
  {
    key: 'last_month',
    label: 'Last month',
    get: () => [
      dayjs().subtract(1, 'month').startOf('month'),
      dayjs().subtract(1, 'month').endOf('month'),
    ],
  },
  { key: 'last_7', label: '7 days', get: () => [dayjs().subtract(6, 'day'), dayjs()] },
  { key: 'last_30', label: '30 days', get: () => [dayjs().subtract(29, 'day'), dayjs()] },
];

const sameRange = (a: [Dayjs, Dayjs], b: [Dayjs, Dayjs]) =>
  a[0].isSame(b[0], 'day') && a[1].isSame(b[1], 'day');

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

  const [dropdownOptions, setDropdownOptions] = useState<any[]>([]);
  useEffect(() => {
    if (selected) {
      apiClient.get('/api/members/select')
        .then((res) => {
          if (res.data?.data) {
            setDropdownOptions(res.data.data);
          } else if (Array.isArray(res.data)) {
            setDropdownOptions(res.data);
          }
        })
        .catch(() => {});
    }
  }, [selected ? 'open' : 'closed']);

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
  const [downloading, setDownloading] = useState<null | 'pdf' | 'word' | 'save'>(null);
  const [printModel, setPrintModel] = useState<ReportModel | null>(null);
  const [printAvatar, setPrintAvatar] = useState<string | null>(null);

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
      setPrintAvatar(avatar);
      setPrintModel(model);
    } catch (err: any) {
      message.error(err?.message || 'Failed to prepare the report');
      setDownloading(null);
    }
  };

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
      .catch(() => { });
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

  // Inclusive day span + which quick preset (if any) the range currently matches.
  const dayCount = useMemo(
    () => (range?.[0] && range?.[1] ? range[1].startOf('day').diff(range[0].startOf('day'), 'day') + 1 : 0),
    [range]
  );
  const activePreset = useMemo(
    () => RANGE_PRESETS.find((p) => sameRange(p.get(), range))?.key ?? null,
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
      <div className="prr-header">
        <div className="prr-hero-glow" />
        <div className="prr-hero-inner">
          <button type="button" className="prr-back" onClick={() => setSelected(null)} aria-label="Back to members">
            <ChevronLeft size={18} />
          </button>

          <div className="prr-avatar-ring">
            <Avatar
              size={44}
              src={m.avatarUrl || undefined}
              style={{
                background: 'linear-gradient(135deg, #60a5fa, #2563eb)',
                color: '#fff',
                fontSize: 17,
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              {m.name?.charAt(0)?.toUpperCase()}
            </Avatar>
          </div>

          <div className="prr-ident">
            <h2 className="prr-title">{m.name}</h2>
            <div className="prr-meta">
              {m.position && (
                <span className="prr-meta-chip">
                  <Briefcase size={11} />
                  {m.position}
                </span>
              )}
              {m.department && (
                <span className="prr-meta-chip">
                  <Building2 size={11} />
                  {m.department}
                </span>
              )}
              {m.workEmail && (
                <span className="prr-meta-chip prr-meta-chip--ghost">
                  <Mail size={11} />
                  {m.workEmail}
                </span>
              )}
              {!m.position && !m.department && !m.workEmail && (
                <span className="prr-meta-chip prr-meta-chip--ghost">Performance report</span>
              )}
            </div>
          </div>

          <div className="prr-head-right">
            <span className="prr-switch-label">Viewing</span>
            <SearchableDropdown
            placeholder="Choose User"
            searchPlaceholder="Search user..."
            itemNoun="users"
            value={m.id}
            onChange={(userId) => {
              const opt = dropdownOptions.find((o) => o.value === userId);
              if (opt) {
                const newMember: ReportMember = {
                  id: opt.value,
                  name: opt.label,
                  avatarUrl: opt.avatarUrl || null,
                  workEmail: opt.email || null,
                  position: opt.position || null,
                  department: null,
                  grade: null,
                };
                setSelected({ member: newMember, projectId: selected.projectId });
              }
            }}
            options={[
              ...(dropdownOptions.some(o => o.value === m.id) ? [] : [{
                value: m.id,
                label: m.name,
                description: m.position || m.department || '',
                avatarUrl: m.avatarUrl
              }]),
              ...dropdownOptions.map((o) => ({
                value: o.value,
                label: o.label,
                description: o.position || '',
                avatarUrl: o.avatarUrl,
              }))
            ]}
            width={320}
            showSelectedAvatar
            avatarColor="#3b82f6"
            />
          </div>
        </div>
      </div>

      {/* ── Filter bar: date range + presets + export ───────────────────────── */}
      <div className="prr-toolbar">
        <span className="prr-tool-ic">
          <CalendarRange size={15} />
        </span>

        <RangePicker
          value={range}
          allowClear={false}
          format="MMM D, YYYY"
          suffixIcon={null}
          className="prr-range"
          onChange={(d) => {
            if (d && d[0] && d[1]) {
              const r: [Dayjs, Dayjs] = [d[0], d[1]];
              setRange(r);
              fetchReport(r, projectId, memberId);
            }
          }}
          presets={RANGE_PRESETS.map((p) => ({ label: p.label, value: p.get() as [Dayjs, Dayjs] }))}
        />

        <div className="prr-presets">
          {RANGE_PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              className={`prr-preset ${activePreset === p.key ? 'is-active' : ''}`}
              onClick={() => {
                const r = p.get();
                setRange(r);
                fetchReport(r, projectId, memberId);
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {dayCount > 0 && (
          <span className="prr-daycount">
            {dayCount} day{dayCount === 1 ? '' : 's'}
          </span>
        )}

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
                // { key: 'word', icon: <FileWordOutlined />, label: 'Download as Word' },
              ],
            }}
          >
            <Button icon={<DownloadOutlined />} loading={downloading === 'pdf' || downloading === 'word'}>
              Download
            </Button>
          </Dropdown>

        </div>
      </div>

      {/* Off-screen printable used only for the PDF / Word capture. */}
      {printModel && downloading && applied && (
        <PerformanceReportExportRunner
          format={downloading}
          model={printModel}
          member={selected.member}
          range={applied.range}
          statusMarks={statusMarks}
          avatarDataUrl={printAvatar}
          onDone={(ok) => {
            setDownloading(null);
            setPrintModel(null);
          }}
        />
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
                  Choose your filters to see tickets
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
        .prr-wrap { display: flex; flex-direction: column; gap: 14px; flex: 1; min-height: 0; }

        /* ── Member header band (full-bleed via the layout's -header rule) ───── */
        .prr-header {
          position: relative; overflow: hidden;
          margin-top: -12px; padding: 14px 0 14px; margin-bottom: 0;
          border-bottom: 1px solid var(--border-slate-100);
          background:
            linear-gradient(180deg, rgba(59, 130, 246, 0.055), rgba(59, 130, 246, 0) 82%),
            var(--bg-pure-white);
        }
        .prr-hero-glow {
          position: absolute; top: -130px; right: -60px; width: 380px; height: 240px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.15), transparent 68%);
          pointer-events: none;
        }
        .prr-hero-inner {
          position: relative; z-index: 1;
          display: flex; align-items: center; gap: 13px; flex-wrap: wrap;
        }
        .prr-back {
          width: 34px; height: 34px; flex-shrink: 0; border-radius: 10px;
          border: 1px solid var(--border-slate-200); background: var(--bg-pure-white);
          color: var(--text-slate-500); cursor: pointer;
          display: inline-flex; align-items: center; justify-content: center;
          transition: color .14s ease, border-color .14s ease, background .14s ease, transform .14s ease;
        }
        .prr-back:hover {
          color: #2563eb; border-color: #bfdbfe; background: var(--bg-blue-50);
          transform: translateX(-1px);
        }
        .prr-avatar-ring {
          position: relative; padding: 3px; border-radius: 50%; flex-shrink: 0;
          background: var(--bg-pure-white);
          box-shadow: 0 0 0 1.5px rgba(59, 130, 246, 0.18), 0 6px 14px rgba(15, 23, 42, 0.08);
        }
        .prr-ident { min-width: 0; flex: 1; }
        .prr-title {
          margin: 0; font-size: 18px; font-weight: 800; color: var(--text-slate-900);
          letter-spacing: -0.03em; line-height: 1.2;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .prr-meta { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 5px; }
        .prr-meta-chip {
          display: inline-flex; align-items: center; gap: 5px; max-width: 260px;
          font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 999px;
          color: var(--text-blue-700); background: var(--bg-blue-50);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .prr-meta-chip svg { flex-shrink: 0; }
        .prr-meta-chip--ghost { color: var(--text-slate-500); background: var(--bg-slate-100); font-weight: 600; }

        .prr-head-right { display: flex; align-items: center; gap: 9px; margin-left: auto; }
        .prr-switch-label {
          font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.07em;
          color: var(--text-slate-400);
        }
        .prr-head-right .sd-trigger {
          height: 42px !important; min-width: 280px; border-radius: 12px !important;
          padding: 5px 14px; font-size: 13.5px; font-weight: 600;
          background: var(--bg-pure-white) !important;
        }
        .prr-head-right .sd-trigger:hover { border-color: #bfdbfe !important; }

        /* ── Toolbar: range + presets + export ──────────────────────────────── */
        .prr-toolbar {
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
          padding: 9px 12px; border-radius: 16px;
          border: 1px solid var(--border-slate-200); background: var(--bg-pure-white);
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.035);
        }
        .prr-tool-ic {
          width: 28px; height: 28px; flex-shrink: 0; border-radius: 9px;
          display: inline-flex; align-items: center; justify-content: center;
          color: #2563eb; background: var(--bg-blue-50);
        }
        .prr-toolbar .ant-picker.prr-range {
          height: 36px; border-radius: 11px; background: var(--bg-slate-50);
          border-color: transparent; font-weight: 600;
        }
        .prr-toolbar .ant-picker.prr-range:hover { border-color: #bfdbfe; }
        .prr-toolbar .ant-picker.prr-range.ant-picker-focused {
          background: var(--bg-pure-white); border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
        }
        .prr-toolbar .ant-picker.prr-range .ant-picker-input > input { font-size: 12.5px; font-weight: 600; }

        .prr-presets {
          display: inline-flex; gap: 2px; padding: 3px; border-radius: 11px;
          background: var(--bg-slate-50); border: 1px solid var(--border-slate-200);
          flex-wrap: wrap;
        }
        .prr-preset {
          border: none; background: transparent; cursor: pointer;
          padding: 5px 11px; border-radius: 8px; white-space: nowrap;
          font-size: 12px; font-weight: 700; color: var(--text-slate-500);
          transition: color .14s ease, background .14s ease, box-shadow .14s ease;
        }
        .prr-preset:hover { color: var(--text-slate-900); }
        .prr-preset.is-active {
          color: #2563eb; background: var(--bg-pure-white);
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
        }
        .prr-daycount {
          font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 999px;
          color: var(--text-slate-500); background: var(--bg-slate-100);
          font-variant-numeric: tabular-nums; white-space: nowrap;
        }

        .prr-actions { margin-left: auto; display: flex; align-items: center; gap: 8px; }
        .prr-actions .ant-btn { height: 36px; border-radius: 11px; font-weight: 600; font-size: 12.5px; }

        .prr-results { display: flex; flex-direction: column; flex: 1; min-height: 0; }
        /* Premium module tab switcher */
        .prr-tabs {
          display: inline-flex;
          gap: 3px;
          padding: 4px;
          margin-bottom: 14px;
          align-self: flex-start;
          background: var(--bg-slate-50);
          border: 1px solid var(--border-slate-200);
          border-radius: 14px;
          max-width: 100%;
          overflow-x: auto;
        }
        .prr-tabs::-webkit-scrollbar { height: 0; }
        .prr-tab {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 13px 6px 7px;
          border: 1px solid transparent;
          background: transparent;
          border-radius: 11px;
          cursor: pointer;
          font-size: 12.5px;
          font-weight: 700;
          color: var(--text-slate-500);
          white-space: nowrap;
          transition: color 0.16s ease, background 0.16s ease, box-shadow 0.16s ease,
            border-color 0.16s ease, transform 0.16s ease;
        }
        .prr-tab:hover { color: var(--text-slate-900); }
        .prr-tab:active { transform: translateY(0.5px); }
        .prr-tab-ic {
          width: 26px;
          height: 26px;
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
          background: var(--bg-pure-white);
          border-color: var(--border-slate-200);
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.07), 0 4px 12px rgba(15, 23, 42, 0.06);
        }
        .prr-tab.is-active .prr-tab-ic {
          color: var(--accent);
          background: color-mix(in srgb, var(--accent) 14%, transparent);
          box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 22%, transparent);
        }
        .prr-tt { display: flex; flex-direction: column; flex: 1; min-height: 0; }
        .prr-center {
          flex: 1; display: flex; align-items: center; justify-content: center;
          border: 1px dashed var(--border-slate-200); border-radius: 16px;
          background: var(--bg-slate-50); padding: 56px 24px; min-height: 320px;
        }
        .prr-statbar {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-bottom: 14px;
        }
        .prr-stat {
          border: 1px solid var(--border-slate-200); border-radius: 14px;
          background: var(--bg-pure-white); padding: 12px 14px;
          display: flex; flex-direction: column; gap: 5px; min-width: 0;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
          transition: border-color .16s ease, box-shadow .16s ease;
        }
        .prr-stat:hover { border-color: #bfdbfe; box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06); }
        @media (max-width: 640px) {
          .prr-statbar { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
          .prr-statbar { grid-template-columns: 1fr; }
        }
        .prr-stat--points {
          border-color: #bfdbfe;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.06), transparent 60%), var(--bg-pure-white);
        }
        .prr-pts-max { font-size: 13px; font-weight: 700; color: var(--text-slate-400); }
        .prr-stat-top { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
        .prr-stat-num {
          font-size: 24px; font-weight: 800; color: var(--text-slate-900);
          line-height: 1; letter-spacing: -0.03em; font-variant-numeric: tabular-nums;
        }
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

        @media (max-width: 900px) {
          .prr-hero-inner { gap: 10px; }
          .prr-head-right { width: 100%; margin-left: 0; justify-content: flex-start; }
          .prr-toolbar .ant-picker.prr-range { flex: 1 1 200px; }
          .prr-actions { margin-left: 0; width: 100%; }
          .prr-actions .ant-btn { flex: 1; }
        }
        @media (max-width: 560px) {
          .prr-presets { width: 100%; justify-content: flex-start; }
          /* Let the switcher shrink with the viewport instead of overflowing. */
          .prr-head-right .sd-trigger { min-width: 0; }
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
