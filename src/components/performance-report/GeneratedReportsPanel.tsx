'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/** Force-download a file — routes through a server-side proxy to avoid CORS / PDF viewer issues. */
function forceDownload(url: string, filename: string) {
  // Use our Next.js proxy route which fetches the file server-side and sends it
  // back with Content-Disposition: attachment — guaranteed download, no new tab.
  const proxyUrl = `/api/download-proxy?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
  const a = document.createElement('a');
  a.href = proxyUrl;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
}
import {
  Avatar,
  Button,
  Checkbox,
  DatePicker,
  Empty,
  Input,
  Modal,
  Pagination,
  Popconfirm,
  Progress,
  Spin,
  message,
} from 'antd';
import {
  FilePdfOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
  Search,
  SlidersHorizontal,
  X,
  FileText,
  Users,
  Gauge,
  FileSearch,
  Building2,
  Briefcase,
} from 'lucide-react';
import dayjs, { Dayjs } from 'dayjs';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import { ProjectService } from '@/services/projectService';
import PerformanceReportService, {
  GeneratedReport,
  ReportMember,
} from '@/services/performanceReportService';
import ReportPrintable from './ReportPrintable';
import { gatherReportData, ReportModel } from './reportPdfData';
import { reportToPdfBlob } from '@/app/tickets/reports/[sprintId]/reportExport';
import { ModuleWeight } from './OverviewSection';
import { performanceBand, pointsColor } from './moduleScores';
import { usePermission } from '@/hooks/usePermission';

const { RangePicker } = DatePicker;
const PAGE_SIZE = 12;

const MODULES: { key: keyof GeneratedReport; label: string }[] = [
  { key: 'ticketsScore', label: 'Tickets' },
  { key: 'timeTrackingScore', label: 'Time' },
  { key: 'dailyUpdatesScore', label: 'Updates' },
  { key: 'attendanceScore', label: 'Attend.' },
  { key: 'leavesScore', label: 'Leaves' },
];

const periodLabel = (p: string) => dayjs(`${p}-01`).format('MMMM YYYY');
const uniq = (arr: (string | null)[]) =>
  Array.from(new Set(arr.filter((x): x is string => !!x))).sort();

export default function GeneratedReportsPanel() {
  const { canUpdatePerformanceReportSetting } = usePermission();
  const [allReports, setAllReports] = useState<GeneratedReport[]>([]);
  const [loading, setLoading] = useState(true);

  // ── filters ────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState<string | undefined>();
  const [subDept, setSubDept] = useState<string | undefined>();
  const [member, setMember] = useState<string | undefined>();
  const [monthRange, setMonthRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await PerformanceReportService.getGeneratedReports(); // all periods
      setAllReports(res.reports);
    } catch (err: any) {
      message.error(err?.response?.data?.error || err?.message || 'Failed to load generated reports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ── batch "Generate this month" ─────────────────────────────────────────────
  const printRef = useRef<HTMLDivElement>(null);
  const [printJob, setPrintJob] = useState<{
    member: ReportMember;
    model: ReportModel;
    avatar: string | null;
    range: [Dayjs, Dayjs];
  } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, name: '' });

  // ── Generate wizard ─────────────────────────────────────────────────────────
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizStep, setWizStep] = useState<'month' | 'scope'>('month');
  const [wizMonth, setWizMonth] = useState<{ key: string; label: string; range: [Dayjs, Dayjs] } | null>(null);
  const [wizProject, setWizProject] = useState<string | undefined>();
  const [wizPosition, setWizPosition] = useState<string | undefined>();
  const [wizMembers, setWizMembers] = useState<string[]>([]);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [projects, setProjects] = useState<{ value: string; label: string }[]>([]);
  const [allMembersList, setAllMembersList] = useState<ReportMember[]>([]);
  const [candidates, setCandidates] = useState<ReportMember[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const settingsRef = useRef<{ statusMarks: Record<string, number>; bod: boolean; eod: boolean; weights: ModuleWeight[] }>({
    statusMarks: {},
    bod: true,
    eod: true,
    weights: [],
  });

  useEffect(() => {
    PerformanceReportService.getSettings()
      .then((s) => {
        const tk = s?.modules?.find((m) => m.moduleKey === 'tickets')?.config as { statusMarks?: Record<string, number> } | undefined;
        const du = s?.modules?.find((m) => m.moduleKey === 'daily_updates')?.config as { bod?: boolean; eod?: boolean } | undefined;
        settingsRef.current = {
          statusMarks: tk?.statusMarks ?? {},
          bod: du?.bod !== false,
          eod: du?.eod !== false,
          weights: (s?.modules ?? []).map((m) => ({ key: m.moduleKey as ModuleWeight['key'], weight: Number(m.weight) || 0, enabled: m.isEnabled })),
        };
      })
      .catch(() => { });
  }, []);

  const resolveAvatar = async (url?: string | null): Promise<string | null> => {
    if (!url) return null;
    if (url.startsWith('data:')) return url;
    try {
      // Route through the backend proxy — html2canvas can't capture CORS-blocked images.
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

  const fetchAllMembers = async (): Promise<ReportMember[]> => {
    const first = await PerformanceReportService.getMembers({ page: 1, limit: 100 });
    let all = [...first.data];
    for (let p = 2; p <= first.totalPages; p += 1) {
      const next = await PerformanceReportService.getMembers({ page: p, limit: 100 });
      all = all.concat(next.data);
    }
    return all;
  };

  // Open the wizard (month step shows instantly; members/projects load behind it).
  const openWizard = async () => {
    setWizardOpen(true);
    setWizStep('month');
    setWizMonth(null);
    setWizProject(undefined);
    setWizPosition(undefined);
    setWizMembers([]);
    setExcluded(new Set());
    setCandidatesLoading(true);
    try {
      const [members, proj] = await Promise.all([
        fetchAllMembers(),
        ProjectService.getProjectsForSelect().catch(() => [] as any[]),
      ]);
      setAllMembersList(members);
      setCandidates(members);
      setProjects((proj || []).map((p: any) => ({ value: p.value, label: p.label })));
    } catch (err: any) {
      message.error(err?.message || 'Failed to load members');
    } finally {
      setCandidatesLoading(false);
    }
  };

  // Re-resolve the candidate base when the project changes.
  const loadCandidatesForProject = async (projectId?: string) => {
    setWizMembers([]);
    if (!projectId) {
      setCandidates(allMembersList);
      return;
    }
    setCandidatesLoading(true);
    try {
      const first = await PerformanceReportService.getMembers({ page: 1, limit: 100, projectId });
      let all = [...first.data];
      for (let p = 2; p <= first.totalPages; p += 1) {
        const next = await PerformanceReportService.getMembers({ page: p, limit: 100, projectId });
        all = all.concat(next.data);
      }
      setCandidates(all);
    } catch {
      setCandidates([]);
    } finally {
      setCandidatesLoading(false);
    }
  };

  // Pick a month → pre-exclude anyone already generated for it → go to scope step.
  const selectMonth = (m: { key: string; label: string; range: [Dayjs, Dayjs] }) => {
    setWizMonth(m);
    setExcluded(new Set(allReports.filter((r) => r.periodKey === m.key).map((r) => r.userId)));
    setWizStep('scope');
  };

  // Generate for the chosen members + month.
  const runGeneration = async (members: ReportMember[], range: [Dayjs, Dayjs], periodKey: string) => {
    setWizardOpen(false);
    if (members.length === 0) return;
    setGenerating(true);
    const cfg = settingsRef.current;
    let ok = 0;
    let fail = 0;
    try {
      setProgress({ done: 0, total: members.length, name: '' });
      for (let i = 0; i < members.length; i += 1) {
        const m = members[i];
        setProgress({ done: i, total: members.length, name: m.name });
        try {
          const tickets = await PerformanceReportService.getTicketReport({
            from: range[0].format('YYYY-MM-DD'),
            to: range[1].format('YYYY-MM-DD'),
            memberId: m.id,
          });
          const model = await gatherReportData({
            userId: m.id,
            range,
            statusMarks: cfg.statusMarks,
            bodEnabled: cfg.bod,
            eodEnabled: cfg.eod,
            weights: cfg.weights,
            tickets,
          });
          const avatar = await resolveAvatar(m.avatarUrl);
          setPrintJob({ member: m, model, avatar, range });
          await new Promise((r) => setTimeout(r, 350));
          const el = printRef.current;
          if (!el) throw new Error('render failed');
          const blob = await reportToPdfBlob(el, `${m.name}.pdf`);
          const pdfBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          await PerformanceReportService.saveGeneratedReport({
            userId: m.id,
            periodKey,
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
          ok += 1;
        } catch {
          fail += 1;
        }
      }
      setProgress((p) => ({ ...p, done: p.total }));
      message.success(`Generated ${ok} report${ok === 1 ? '' : 's'}${fail ? ` · ${fail} failed` : ''}`);
      setMonthRange([range[0].startOf('month'), range[0].startOf('month')]);
      await load();
    } catch (err: any) {
      message.error(err?.response?.data?.error || err?.message || 'Generation failed');
    } finally {
      setGenerating(false);
      setPrintJob(null);
    }
  };

  const onDelete = async (id: string) => {
    try {
      await PerformanceReportService.deleteGeneratedReport(id);
      setAllReports((r) => r.filter((x) => x.id !== id));
      message.success('Report deleted');
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to delete');
    }
  };

  // ── wizard derived values ───────────────────────────────────────────────────
  const wizMonths = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const d = dayjs().subtract(i, 'month');
        const isThis = i === 0;
        return {
          key: d.format('YYYY-MM'),
          label: d.format('MMMM YYYY'),
          sub: isThis ? 'This month' : '',
          range: (isThis ? [d.startOf('month'), dayjs()] : [d.startOf('month'), d.endOf('month')]) as [Dayjs, Dayjs],
        };
      }),
    []
  );
  const wizPositions = useMemo(() => uniq(candidates.map((c) => c.position)), [candidates]);
  const wizMemberOptions = useMemo(
    () => candidates.filter((c) => !wizPosition || c.position === wizPosition).map((c) => ({ value: c.id, label: c.name, avatarUrl: c.avatarUrl })),
    [candidates, wizPosition]
  );
  const wizResolved = useMemo(() => {
    let list = candidates;
    if (wizPosition) list = list.filter((c) => c.position === wizPosition);
    if (wizMembers.length) list = list.filter((c) => wizMembers.includes(c.id));
    return list;
  }, [candidates, wizPosition, wizMembers]);
  const wizSelected = useMemo(() => wizResolved.filter((c) => !excluded.has(c.id)), [wizResolved, excluded]);
  const alreadyDoneSet = useMemo(
    () => (wizMonth ? new Set(allReports.filter((r) => r.periodKey === wizMonth.key).map((r) => r.userId)) : new Set<string>()),
    [allReports, wizMonth]
  );
  const toggleExclude = (id: string) =>
    setExcluded((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  // ── filter option sources (derived from the loaded reports) ─────────────────
  const deptOptions = useMemo(() => uniq(allReports.map((r) => r.userDepartment)), [allReports]);
  const subDeptOptions = useMemo(
    () => uniq(allReports.filter((r) => !dept || r.userDepartment === dept).map((r) => r.userSubDepartment)),
    [allReports, dept]
  );
  const memberOptions = useMemo(() => {
    const seen = new Map<string, { label: string; avatarUrl: string | null }>();
    allReports
      .filter((r) => (!dept || r.userDepartment === dept) && (!subDept || r.userSubDepartment === subDept))
      .forEach((r) => {
        if (r.userId && !seen.has(r.userId)) {
          seen.set(r.userId, { label: r.userName || r.userId, avatarUrl: r.userAvatar || null });
        }
      });
    return Array.from(seen.entries()).map(([value, data]) => ({ value, label: data.label, avatarUrl: data.avatarUrl }));
  }, [allReports, dept, subDept]);

  // ── apply filters ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const fromM = monthRange ? monthRange[0].format('YYYY-MM') : null;
    const toM = monthRange ? monthRange[1].format('YYYY-MM') : null;
    return allReports.filter((r) => {
      if (q && !`${r.userName ?? ''} ${r.userPosition ?? ''}`.toLowerCase().includes(q)) return false;
      if (dept && r.userDepartment !== dept) return false;
      if (subDept && r.userSubDepartment !== subDept) return false;
      if (member && r.userId !== member) return false;
      if (fromM && toM && (r.periodKey < fromM || r.periodKey > toM)) return false;
      return true;
    });
  }, [allReports, search, dept, subDept, member, monthRange]);

  // Reset to page 1 whenever the filter set changes.
  useEffect(() => {
    setPage(1);
  }, [search, dept, subDept, member, monthRange]);

  const total = filtered.length;
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const rangeInfo = total === 0 ? '0 reports' : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total}`;

  // ── header KPIs (computed over the filtered set so they track the filters) ──
  const kpis = useMemo(() => {
    const scored = filtered.filter((r) => typeof r.overallScore === 'number');
    return {
      reports: filtered.length,
      members: new Set(filtered.map((r) => r.userId)).size,
      avg: scored.length
        ? Math.round(scored.reduce((a, r) => a + (r.overallScore as number), 0) / scored.length)
        : null,
    };
  }, [filtered]);

  // Active filters, rendered as removable chips under the toolbar.
  const chips = useMemo(() => {
    const out: Array<{ key: string; label: string; value: string; clear: () => void }> = [];
    if (search.trim())
      out.push({ key: 'search', label: 'Search', value: search.trim(), clear: () => setSearch('') });
    if (dept) out.push({ key: 'dept', label: 'Department', value: dept, clear: () => setDept(undefined) });
    if (subDept)
      out.push({ key: 'sub', label: 'Sub-dept', value: subDept, clear: () => setSubDept(undefined) });
    if (member)
      out.push({
        key: 'member',
        label: 'Member',
        value: memberOptions.find((o) => o.value === member)?.label ?? '—',
        clear: () => setMember(undefined),
      });
    if (monthRange)
      out.push({
        key: 'months',
        label: 'Period',
        value: `${monthRange[0].format('MMM YYYY')} – ${monthRange[1].format('MMM YYYY')}`,
        clear: () => setMonthRange(null),
      });
    return out;
  }, [search, dept, subDept, member, monthRange, memberOptions]);

  const resetFilters = () => {
    setSearch('');
    setDept(undefined);
    setSubDept(undefined);
    setMember(undefined);
    setMonthRange(null);
  };

  return (
    <div className="gr-wrap">
      {/* 1. Hero band */}
      <div className="gr-header">
        <div className="gr-hero-glow" />
        <div className="gr-hero-inner">
          <div className="gr-hero-text">
            <h2 className="gr-title">Generated Reports</h2>
            <p className="gr-sub">Archived monthly performance PDFs — open, download or regenerate.</p>
          </div>

          <div className="gr-hero-right">
            <div className="gr-kpis">
              <div className="gr-kpi">
                <span className="gr-kpi-ic gr-kpi-ic--blue">
                  <FileText size={14} />
                </span>
                <span className="gr-kpi-body">
                  <span className="gr-kpi-num">{kpis.reports}</span>
                  <span className="gr-kpi-label">Reports</span>
                </span>
              </div>
              <div className="gr-kpi">
                <span className="gr-kpi-ic gr-kpi-ic--slate">
                  <Users size={14} />
                </span>
                <span className="gr-kpi-body">
                  <span className="gr-kpi-num">{kpis.members}</span>
                  <span className="gr-kpi-label">Members</span>
                </span>
              </div>
              <div className="gr-kpi">
                <span className="gr-kpi-ic gr-kpi-ic--green">
                  <Gauge size={14} />
                </span>
                <span className="gr-kpi-body">
                  <span className="gr-kpi-num" style={{ color: pointsColor(kpis.avg) }}>
                    {kpis.avg ?? '—'}
                  </span>
                  <span className="gr-kpi-label">Avg score</span>
                </span>
              </div>
            </div>

            {canUpdatePerformanceReportSetting && (
              <Button
                type="primary"
                className="gr-gen-btn"
                icon={<ThunderboltOutlined />}
                loading={generating}
                onClick={openWizard}
              >
                Generate report
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Command bar: search + filters */}
      <div className="gr-toolbar">
        <div className="gr-search-wrap">
          <Input
            allowClear
            prefix={<Search size={15} style={{ color: 'var(--text-slate-400)' }} />}
            placeholder="Search by member name or position"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="gr-search"
          />
        </div>

        <span className="gr-tool-divider" />

        <div className="gr-filter-group">
          <span className="gr-filter-hint">
            <SlidersHorizontal size={13} />
          </span>
          <SearchableDropdown
            placeholder="All departments"
            searchPlaceholder="Search departments"
            itemNoun="departments"
            value={dept}
            onChange={(v) => { setDept(v ?? undefined); setSubDept(undefined); setMember(undefined); }}
            options={deptOptions.map((d) => ({
              value: d,
              label: d,
              badge: (
                <span className="gr-opt-ic">
                  <Building2 size={13} />
                </span>
              ),
            }))}
            width={240}
            allowClear
          />
          <SearchableDropdown
            placeholder="All sub-departments"
            searchPlaceholder="Search sub-departments"
            itemNoun="sub-departments"
            value={subDept}
            onChange={(v) => { setSubDept(v ?? undefined); setMember(undefined); }}
            options={subDeptOptions.map((d) => ({
              value: d,
              label: d,
              badge: (
                <span className="gr-opt-ic">
                  <Briefcase size={13} />
                </span>
              ),
            }))}
            width={240}
            allowClear
          />
          <SearchableDropdown
            placeholder="All members"
            searchPlaceholder="Search members"
            itemNoun="members"
            value={member}
            onChange={(v) => setMember(v ?? undefined)}
            options={memberOptions}
            width={260}
            allowClear
            avatarColor="#3b82f6"
          />
          <RangePicker
            className="gr-month"
            picker="month"
            placeholder={['From month', 'To month']}
            format="MMM YYYY"
            value={monthRange}
            onChange={(v) => setMonthRange(v as [Dayjs, Dayjs] | null)}
          />
        </div>
      </div>

      {/* 3. Active filter chips */}
      {chips.length > 0 && (
        <div className="gr-chips">
          {chips.map((c) => (
            <span key={c.key} className="gr-chip">
              <span className="gr-chip-label">{c.label}</span>
              <span className="gr-chip-value">{c.value}</span>
              <button
                type="button"
                className="gr-chip-x"
                onClick={c.clear}
                aria-label={`Clear ${c.label} filter`}
              >
                <X size={11} />
              </button>
            </span>
          ))}
          <button type="button" className="gr-chip-reset" onClick={resetFilters}>
            Clear all
          </button>
        </div>
      )}

      {/* Cards */}
      <div className="gr-body">
        {loading ? (
          <div className="gr-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="gr-skel">
                <div className="gr-skel-head">
                  <div className="gr-skel-avatar" />
                  <div className="gr-skel-lines">
                    <div className="gr-skel-line" style={{ width: '55%' }} />
                    <div className="gr-skel-line" style={{ width: '35%' }} />
                  </div>
                </div>
                <div className="gr-skel-block" />
                <div className="gr-skel-row">
                  {Array.from({ length: 5 }).map((__, j) => (
                    <div key={j} className="gr-skel-cell" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : paged.length === 0 ? (
          <div className="gr-empty">
            <span className="gr-empty-ic">
              <FileSearch size={26} />
            </span>
            <div className="gr-empty-title">
              {allReports.length === 0 ? 'No reports generated yet' : 'No reports match these filters'}
            </div>
            <p className="gr-empty-sub">
              {allReports.length === 0
                ? 'Generate a month in bulk, or save a report from an individual member’s page.'
                : 'Try a different department, member or period — or clear the filters.'}
            </p>
            {allReports.length === 0
              ? canUpdatePerformanceReportSetting && (
                <Button type="primary" icon={<ThunderboltOutlined />} onClick={openWizard} className="gr-gen-btn">
                  Generate report
                </Button>
              )
              : chips.length > 0 && (
                <button type="button" className="gr-empty-btn" onClick={resetFilters}>
                  Clear all filters
                </button>
              )}
          </div>
        ) : (
          <div className="gr-grid">
            {paged.map((r) => {
              const band = performanceBand(r.overallScore);
              const pct = Math.max(0, Math.min(100, r.overallScore ?? 0));
              return (
                <div key={r.id} className="gr-card">
                  <span className="gr-card-rail" />

                  <div className="gr-card-top">
                    <div className="gr-avatar-ring">
                      <Avatar size={40} src={r.userAvatar || undefined} style={{ background: 'linear-gradient(135deg,#60a5fa,#2563eb)', color: '#fff', fontSize: 16, fontWeight: 800, flexShrink: 0 }}>
                        {r.userName?.charAt(0)?.toUpperCase()}
                      </Avatar>
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="gr-name">{r.userName || '—'}</div>
                      <div className="gr-pos">{[r.userPosition, r.userDepartment].filter(Boolean).join(' · ') || '—'}</div>
                    </div>
                    <div className="gr-period">{periodLabel(r.periodKey)}</div>
                  </div>

                  <div className="gr-score-block">
                    <div className="gr-score-row">
                      <span className="gr-score" style={{ color: pointsColor(r.overallScore) }}>{r.overallScore ?? '—'}</span>
                      <span className="gr-score-max">/ 100</span>
                      <span className="gr-band" style={{ color: band.color, background: `${band.color}14` }}>{band.label}</span>
                    </div>
                    <div className="gr-score-bar">
                      <div
                        className="gr-score-bar-fill"
                        style={{ width: `${pct}%`, background: pointsColor(r.overallScore) }}
                      />
                    </div>
                  </div>

                  <div className="gr-modules">
                    {MODULES.map((m) => {
                      const v = r[m.key] as number | null;
                      return (
                        <div key={m.label} className="gr-mod">
                          <div className="gr-mod-val" style={{ color: pointsColor(v) }}>{v ?? '—'}</div>
                          <div className="gr-mod-label">{m.label}</div>
                          <div className="gr-mod-bar">
                            <span
                              style={{
                                width: `${Math.max(0, Math.min(100, v ?? 0))}%`,
                                background: pointsColor(v),
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="gr-foot">
                    <span className="gr-gen">Generated {dayjs(r.generatedAt).format('MMM D, YYYY')}</span>
                    <div className="gr-actions">
                      <a href={r.fileUrl} target="_blank" rel="noopener noreferrer"><Button size="small" icon={<FilePdfOutlined />}>Open</Button></a>
                      <Button
                        size="small"
                        icon={<DownloadOutlined />}
                        title="Download PDF"
                        onClick={() => {
                          const filename = r.fileUrl.split('/').pop()?.split('?')[0] || 'report.pdf';
                          forceDownload(r.fileUrl, filename);
                        }}
                      />
                      {canUpdatePerformanceReportSetting && (
                        <Popconfirm title="Delete this report?" onConfirm={() => onDelete(r.id)} okText="Delete" okButtonProps={{ danger: true }}>
                          <Button size="small" danger icon={<DeleteOutlined />} title="Delete" />
                        </Popconfirm>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Fixed bottom pagination */}
      <div className="gr-footer">
        <span className="gr-footer-info">{total === 0 ? 'No reports' : `Showing ${rangeInfo}`}</span>
        <Pagination current={page} pageSize={PAGE_SIZE} total={total} showSizeChanger={false} onChange={setPage} />
      </div>

      {/* Generate wizard */}
      <Modal
        open={wizardOpen}
        onCancel={() => setWizardOpen(false)}
        title={wizStep === 'month' ? 'Generate report — pick a month' : `Generate report · ${wizMonth?.label}`}
        width={wizStep === 'month' ? 560 : 640}
        centered
        footer={
          wizStep === 'month'
            ? null
            : [
              <Button key="back" onClick={() => setWizStep('month')}>Back</Button>,
              <Button
                key="go"
                type="primary"
                disabled={wizSelected.length === 0}
                onClick={() => wizMonth && runGeneration(wizSelected, wizMonth.range, wizMonth.key)}
              >
                {wizSelected.length ? `Generate ${wizSelected.length} report${wizSelected.length === 1 ? '' : 's'}` : 'Select members'}
              </Button>,
            ]
        }
      >
        {wizStep === 'month' ? (
          <div className="wz-months">
            {wizMonths.map((m) => {
              const count = allReports.filter((r) => r.periodKey === m.key).length;
              return (
                <button key={m.key} type="button" className="wz-month" onClick={() => selectMonth(m)}>
                  {m.sub && <span className="wz-month-badge">This month</span>}
                  <span className="wz-month-name">{dayjs(`${m.key}-01`).format('MMMM')}</span>
                  <span className="wz-month-year">{dayjs(`${m.key}-01`).format('YYYY')}</span>
                  <span className="wz-month-count">{count ? `${count} generated` : 'None yet'}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="wz-scope">
            <div className="wz-filters">
              <SearchableDropdown
                placeholder="All projects" searchPlaceholder="Search projects" itemNoun="projects"
                value={wizProject}
                onChange={(v) => { setWizProject(v ?? undefined); loadCandidatesForProject(v ?? undefined); }}
                options={projects} width={190} allowClear
              />
              <SearchableDropdown
                placeholder="All positions" searchPlaceholder="Search positions" itemNoun="positions"
                value={wizPosition}
                onChange={(v) => { setWizPosition(v ?? undefined); setWizMembers([]); }}
                options={wizPositions.map((p) => ({ value: p, label: p }))} width={190} allowClear
              />
              <SearchableDropdown
                mode="multiple"
                placeholder="All members" searchPlaceholder="Search members" itemNoun="members"
                value={wizMembers}
                onChange={(v) => setWizMembers((v as string[]) || [])}
                options={wizMemberOptions} width={200} allowClear
              />
            </div>

            <div className="wz-list-head">
              <span><strong>{wizSelected.length}</strong> of {wizResolved.length} selected</span>
              <span className="wz-list-actions">
                <a onClick={() => setExcluded(new Set())}>Select all</a>
                <a onClick={() => setExcluded(new Set(wizResolved.map((c) => c.id)))}>None</a>
              </span>
            </div>

            {candidatesLoading ? (
              <div className="wz-center"><Spin /></div>
            ) : wizResolved.length === 0 ? (
              <div className="wz-center"><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No members match" /></div>
            ) : (
              <div className="wz-list">
                {wizResolved.map((c) => (
                  <label key={c.id} className="wz-row">
                    <Checkbox checked={!excluded.has(c.id)} onChange={() => toggleExclude(c.id)} />
                    <Avatar size={28} src={c.avatarUrl || undefined} style={{ background: 'var(--bg-blue-50)', color: 'var(--text-blue-700)', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                      {c.name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <span className="wz-row-name">{c.name}</span>
                    <span className="wz-row-pos">{c.position || '—'}</span>
                    {alreadyDoneSet.has(c.id) && <span className="wz-row-done">Generated</span>}
                  </label>
                ))}
              </div>
            )}
            <div className="wz-note">Members already generated for {wizMonth?.label} are unchecked by default — re-check to regenerate (overwrites).</div>
          </div>
        )}
      </Modal>

      {/* Progress while batch-generating */}
      <Modal open={generating} closable={false} maskClosable={false} footer={null} title="Generating reports for this month" centered>
        <Progress percent={progress.total ? Math.round((progress.done / progress.total) * 100) : 0} status="active" />
        <div style={{ fontSize: 12.5, color: 'var(--text-slate-500)', marginTop: 8 }}>
          {progress.total ? `${progress.done} of ${progress.total}${progress.name ? ` · ${progress.name}` : ''}` : 'Loading members…'}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--text-slate-400)', marginTop: 6 }}>Please keep this tab open — each member’s PDF is rendered and saved.</div>
      </Modal>

      {/* Off-screen printable for the current member being generated */}
      {printJob && (
        <div style={{ display: 'none' }} aria-hidden>
          <ReportPrintable ref={printRef} member={printJob.member} range={printJob.range} model={printJob.model} statusMarks={settingsRef.current.statusMarks} avatarDataUrl={printJob.avatar} />
        </div>
      )}

      <style jsx global>{`
        .gr-wrap { display: flex; flex-direction: column; flex: 1; min-height: 0; }

        /* ── Hero band (full-bleed via the layout's -header rule) ────────────── */
        .gr-header {
          position: relative; overflow: hidden;
          margin-top: -12px; padding: 14px 0 13px; margin-bottom: 14px;
          border-bottom: 1px solid var(--border-slate-100);
          background:
            linear-gradient(180deg, rgba(59, 130, 246, 0.055), rgba(59, 130, 246, 0) 82%),
            var(--bg-pure-white);
        }
        .gr-hero-glow {
          position: absolute; top: -130px; right: -60px; width: 380px; height: 240px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.15), transparent 68%);
          pointer-events: none;
        }
        .gr-hero-inner {
          position: relative; z-index: 1;
          display: flex; align-items: center; justify-content: space-between; gap: 18px; flex-wrap: wrap;
        }
        .gr-hero-text { min-width: 0; }
        .gr-title {
          margin: 0; font-size: 20px; font-weight: 800; color: var(--text-slate-900);
          letter-spacing: -0.03em; line-height: 1.15;
        }
        .gr-sub {
          margin: 3px 0 0; font-size: 12.5px; color: var(--text-slate-500);
          line-height: 1.45; max-width: 560px;
        }
        .gr-hero-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .gr-kpis { display: flex; align-items: stretch; gap: 8px; flex-wrap: wrap; }
        .gr-kpi {
          display: flex; align-items: center; gap: 9px;
          padding: 7px 14px 7px 9px; border-radius: 12px;
          border: 1px solid var(--border-slate-200); background: var(--bg-pure-white);
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
          min-width: 106px;
        }
        .gr-kpi-ic {
          width: 28px; height: 28px; flex-shrink: 0; border-radius: 9px;
          display: inline-flex; align-items: center; justify-content: center;
        }
        .gr-kpi-ic--blue  { color: #2563eb; background: rgba(59, 130, 246, 0.11); }
        .gr-kpi-ic--green { color: #059669; background: rgba(16, 185, 129, 0.12); }
        .gr-kpi-ic--slate { color: var(--text-slate-500); background: var(--bg-slate-100); }
        .gr-kpi-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .gr-kpi-num {
          font-size: 16px; font-weight: 800; color: var(--text-slate-900);
          line-height: 1; letter-spacing: -0.02em; font-variant-numeric: tabular-nums;
        }
        .gr-kpi-label {
          font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.07em; color: var(--text-slate-400);
        }
        .gr-gen-btn.ant-btn { height: 42px; border-radius: 12px; font-weight: 700; padding: 0 18px; }

        /* ── Command bar ────────────────────────────────────────────────────── */
        .gr-toolbar {
          display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
          padding: 10px 12px; margin-bottom: 12px;
          border: 1px solid var(--border-slate-200); border-radius: 16px;
          background: var(--bg-pure-white);
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.035);
        }
        .gr-search-wrap { flex: 1 1 240px; min-width: 200px; max-width: 340px; }
        .gr-toolbar .gr-search { height: 38px; }
        .gr-toolbar .gr-search,
        .gr-toolbar .gr-search .ant-input,
        .gr-toolbar .gr-search.ant-input-affix-wrapper {
          border-radius: 11px !important; background: var(--bg-slate-50) !important;
        }
        .gr-toolbar .gr-search.ant-input-affix-wrapper { border-color: transparent; }
        .gr-toolbar .gr-search.ant-input-affix-wrapper:hover { border-color: #bfdbfe; }
        .gr-toolbar .gr-search.ant-input-affix-wrapper-focused {
          background: var(--bg-pure-white) !important; border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
        }
        .gr-tool-divider { width: 1px; height: 26px; background: var(--border-slate-200); flex-shrink: 0; }
        .gr-filter-group { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; min-width: 0; }
        .gr-filter-hint {
          display: inline-flex; align-items: center; justify-content: center;
          width: 28px; height: 28px; border-radius: 9px; flex-shrink: 0;
          color: var(--text-slate-400); background: var(--bg-slate-50);
        }
        .gr-filter-group .sd-trigger {
          height: 38px !important; border-radius: 11px !important; min-width: 165px;
          background: var(--bg-pure-white) !important;
        }
        .gr-filter-group .sd-trigger:hover { border-color: #bfdbfe !important; }
        .gr-opt-ic {
          width: 26px; height: 26px; border-radius: 8px; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center;
          color: var(--text-slate-500); background: var(--bg-slate-100);
        }
        .gr-filter-group .gr-month { height: 38px; border-radius: 11px; min-width: 210px; }
        .gr-filter-group .gr-month:hover { border-color: #bfdbfe; }
        .gr-filter-group .gr-month .ant-picker-input > input { font-size: 12.5px; font-weight: 600; }

        /* ── Active filter chips ────────────────────────────────────────────── */
        .gr-chips { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; margin-bottom: 14px; }
        .gr-chip {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 5px 4px 10px; border-radius: 999px;
          border: 1px solid var(--border-slate-200); background: var(--bg-pure-white);
          font-size: 12px; max-width: 300px;
        }
        .gr-chip-label {
          font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em;
          color: var(--text-slate-400);
        }
        .gr-chip-value {
          font-weight: 600; color: var(--text-slate-700);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .gr-chip-x {
          width: 18px; height: 18px; flex-shrink: 0; border: none; cursor: pointer;
          display: inline-flex; align-items: center; justify-content: center; border-radius: 50%;
          color: var(--text-slate-400); background: var(--bg-slate-100);
          transition: color .14s ease, background .14s ease;
        }
        .gr-chip-x:hover { color: var(--text-slate-900); background: var(--border-slate-200); }
        .gr-chip-reset {
          border: none; background: transparent; cursor: pointer; padding: 4px 6px;
          font-size: 12px; font-weight: 700; color: #2563eb;
        }
        .gr-chip-reset:hover { text-decoration: underline; }

        /* ── Cards ──────────────────────────────────────────────────────────── */
        .gr-body { flex: 1; min-height: 0; overflow-y: auto; padding-bottom: 20px; padding-right: 4px; }
        .gr-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(318px, 1fr)); gap: 14px; }
        .gr-card {
          position: relative; overflow: hidden;
          border: 1px solid var(--border-slate-200); border-radius: 16px;
          background: var(--bg-pure-white); padding: 15px 16px 14px;
          display: flex; flex-direction: column; gap: 13px;
          transition: box-shadow .16s ease, border-color .16s ease, transform .16s ease;
        }
        .gr-card:hover {
          border-color: #bfdbfe;
          box-shadow: 0 12px 30px rgba(30, 64, 175, 0.11);
          transform: translateY(-3px);
        }
        .gr-card-rail {
          position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
          background: linear-gradient(180deg, #60a5fa, #2563eb);
          transform: scaleY(0); transform-origin: top; transition: transform .2s ease;
        }
        .gr-card:hover .gr-card-rail { transform: scaleY(1); }

        .gr-card-top { display: flex; align-items: center; gap: 11px; }
        .gr-avatar-ring {
          padding: 3px; border-radius: 50%; flex-shrink: 0; background: var(--bg-pure-white);
          box-shadow: 0 0 0 1.5px rgba(59, 130, 246, 0.18), 0 5px 12px rgba(15, 23, 42, 0.07);
        }
        .gr-name {
          font-size: 14.5px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.015em;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .gr-pos { font-size: 11.5px; color: var(--text-slate-400); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .gr-period {
          font-size: 10.5px; font-weight: 800; color: var(--text-blue-700); background: var(--bg-blue-50);
          border-radius: 999px; padding: 3px 10px; white-space: nowrap; flex-shrink: 0;
        }

        .gr-score-block { display: flex; flex-direction: column; gap: 7px; }
        .gr-score-row { display: flex; align-items: baseline; gap: 6px; }
        .gr-score {
          font-size: 30px; font-weight: 800; letter-spacing: -0.03em; line-height: 1;
          font-variant-numeric: tabular-nums;
        }
        .gr-score-max { font-size: 12px; font-weight: 700; color: var(--text-slate-400); }
        .gr-band {
          margin-left: auto; align-self: center; border-radius: 999px;
          font-size: 10.5px; font-weight: 800; padding: 3px 9px; white-space: nowrap;
        }
        .gr-score-bar { height: 6px; border-radius: 999px; background: var(--bg-slate-100); overflow: hidden; }
        .gr-score-bar-fill { height: 100%; border-radius: 999px; transition: width .45s cubic-bezier(.4, 0, .2, 1); }

        .gr-modules { display: flex; gap: 6px; }
        .gr-mod {
          flex: 1; min-width: 0; text-align: center; border-radius: 10px;
          background: var(--bg-slate-50); border: 1px solid var(--border-slate-100); padding: 7px 4px 6px;
        }
        .gr-mod-val { font-size: 14px; font-weight: 800; font-variant-numeric: tabular-nums; }
        .gr-mod-label {
          font-size: 8.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em;
          color: var(--text-slate-400); margin-top: 1px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .gr-mod-bar {
          height: 3px; border-radius: 999px; background: var(--border-slate-200);
          margin-top: 6px; overflow: hidden;
        }
        .gr-mod-bar span { display: block; height: 100%; border-radius: 999px; }

        .gr-foot {
          display: flex; align-items: center; justify-content: space-between; gap: 8px;
          padding-top: 11px; border-top: 1px dashed var(--border-slate-200);
        }
        .gr-gen { font-size: 11px; color: var(--text-slate-400); font-weight: 600; }
        .gr-actions { display: flex; align-items: center; gap: 6px; }
        .gr-actions .ant-btn { border-radius: 9px; font-weight: 600; }

        /* ── Skeletons + empty ──────────────────────────────────────────────── */
        .gr-skel {
          border: 1px solid var(--border-slate-200); border-radius: 16px;
          background: var(--bg-pure-white); padding: 15px 16px;
          display: flex; flex-direction: column; gap: 13px; pointer-events: none;
        }
        .gr-skel-head { display: flex; align-items: center; gap: 11px; }
        .gr-skel-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--bg-slate-100); flex-shrink: 0; }
        .gr-skel-lines { display: flex; flex-direction: column; gap: 8px; flex: 1; }
        .gr-skel-line { height: 10px; border-radius: 6px; background: var(--bg-slate-100); }
        .gr-skel-block { height: 34px; border-radius: 10px; background: var(--bg-slate-100); }
        .gr-skel-row { display: flex; gap: 6px; }
        .gr-skel-cell { flex: 1; height: 44px; border-radius: 10px; background: var(--bg-slate-100); }
        .gr-skel-avatar, .gr-skel-line, .gr-skel-block, .gr-skel-cell {
          animation: gr-pulse 1.4s ease-in-out infinite;
        }
        @keyframes gr-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }

        .gr-empty {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 8px; padding: 64px 24px; text-align: center;
          border: 1px dashed var(--border-slate-200); border-radius: 16px; background: var(--bg-slate-50);
        }
        .gr-empty-ic {
          width: 54px; height: 54px; border-radius: 16px; margin-bottom: 4px;
          display: inline-flex; align-items: center; justify-content: center;
          color: #2563eb; background: var(--bg-blue-50);
        }
        .gr-empty-title { font-size: 15px; font-weight: 800; color: var(--text-slate-900); }
        .gr-empty-sub {
          margin: 0 0 6px; font-size: 13px; color: var(--text-slate-500);
          max-width: 400px; line-height: 1.55;
        }
        .gr-empty-btn {
          margin-top: 4px; padding: 8px 16px; border-radius: 10px; cursor: pointer;
          border: 1px solid var(--border-slate-200); background: var(--bg-pure-white);
          font-size: 12.5px; font-weight: 700; color: var(--text-slate-700);
          transition: color .14s ease, border-color .14s ease;
        }
        .gr-empty-btn:hover { color: #2563eb; border-color: #bfdbfe; }

        /* ── Footer ─────────────────────────────────────────────────────────── */
        .gr-footer {
          position: sticky; bottom: 0; z-index: 10;
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          padding: 14px 32px; margin: 8px -32px 0;
          border-top: 1px solid var(--border-slate-100); flex-shrink: 0;
          background: var(--bg-pure-white);
          box-shadow: 0 -6px 18px rgba(15, 23, 42, 0.05);
        }
        .gr-footer-info { font-size: 12.5px; color: var(--text-slate-500); font-weight: 600; }
        @media (max-width: 1024px) {
          .gr-footer { margin-left: -16px; margin-right: -16px; padding-left: 16px; padding-right: 16px; }
        }
        @media (max-width: 860px) {
          .gr-hero-inner { align-items: flex-start; gap: 12px; }
          .gr-title { font-size: 18px; }
          .gr-kpi { min-width: 96px; padding: 7px 11px; }
          .gr-gen-btn.ant-btn { height: 38px; }
          .gr-tool-divider { display: none; }
          .gr-search-wrap { max-width: 100%; flex-basis: 100%; }
        }
        @media (max-width: 560px) {
          .gr-filter-group { width: 100%; }
          .gr-filter-group .sd-trigger,
          .gr-filter-group .gr-month { flex: 1 1 140px; min-width: 140px; }
          .gr-grid { grid-template-columns: 1fr; }
        }

        /* Generate wizard */
        .wz-months { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .wz-month {
          position: relative; overflow: hidden;
          display: flex; flex-direction: column; align-items: flex-start; gap: 1px;
          padding: 16px 14px; border: 1px solid var(--border-slate-200); border-radius: 14px;
          background: var(--bg-pure-white); cursor: pointer; text-align: left;
          transition: border-color .14s ease, box-shadow .14s ease, transform .14s ease;
        }
        .wz-month::before {
          content: ''; position: absolute; left: 0; right: 0; top: 0; height: 2px;
          background: linear-gradient(90deg, #60a5fa, #2563eb);
          opacity: 0; transition: opacity .14s ease;
        }
        .wz-month:hover::before { opacity: 1; }
        .wz-month:hover { border-color: #bfdbfe; box-shadow: 0 8px 20px rgba(30,64,175,0.11); transform: translateY(-2px); }
        .wz-month-badge { position: absolute; top: 8px; right: 8px; font-size: 9px; font-weight: 800; color: var(--text-blue-700); background: var(--bg-blue-50); border-radius: 999px; padding: 2px 7px; text-transform: uppercase; letter-spacing: 0.04em; }
        .wz-month-name { font-size: 15px; font-weight: 800; color: var(--text-slate-900); }
        .wz-month-year { font-size: 12px; color: var(--text-slate-400); font-weight: 700; }
        .wz-month-count { font-size: 10.5px; color: var(--text-slate-500); margin-top: 6px; }

        .wz-scope { display: flex; flex-direction: column; }
        .wz-filters { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
        .wz-filters .sd-trigger { height: 38px !important; border-radius: 11px !important; }
        .wz-list-head {
          display: flex; align-items: center; justify-content: space-between;
          font-size: 12.5px; color: var(--text-slate-500); margin-bottom: 7px;
        }
        .wz-list-actions { display: flex; gap: 12px; }
        .wz-list-actions a { color: #2563eb; cursor: pointer; font-weight: 700; }
        .wz-center { display: flex; align-items: center; justify-content: center; padding: 40px 0; }
        .wz-list { max-height: 320px; overflow-y: auto; border: 1px solid var(--border-slate-200); border-radius: 12px; }
        .wz-row { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-bottom: 1px solid var(--border-slate-100); cursor: pointer; }
        .wz-row:last-child { border-bottom: none; }
        .wz-row:hover { background: var(--bg-slate-50); }
        .wz-row-name { font-size: 13px; font-weight: 600; color: var(--text-slate-900); }
        .wz-row-pos { font-size: 11.5px; color: var(--text-slate-400); margin-left: 2px; }
        .wz-row-done { margin-left: auto; font-size: 10px; font-weight: 700; color: #16a34a; background: #ecfdf5; border-radius: 999px; padding: 2px 8px; }
        .wz-note { font-size: 11.5px; color: var(--text-slate-400); margin-top: 10px; line-height: 1.5; }
      `}</style>
    </div>
  );
}
