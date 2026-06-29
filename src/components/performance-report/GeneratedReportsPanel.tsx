'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Avatar,
  Button,
  Checkbox,
  DatePicker,
  Divider,
  Empty,
  Input,
  Modal,
  Pagination,
  Popconfirm,
  Progress,
  Spin,
  Typography,
  message,
} from 'antd';
import {
  FilePdfOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ThunderboltOutlined,
  SearchOutlined,
  FilterOutlined,
} from '@ant-design/icons';
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

const { Text } = Typography;
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
      .catch(() => {});
  }, []);

  const resolveAvatar = async (url?: string | null): Promise<string | null> => {
    if (!url) return null;
    try {
      const res = await fetch(url, { mode: 'cors' });
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
    () => candidates.filter((c) => !wizPosition || c.position === wizPosition).map((c) => ({ value: c.id, label: c.name })),
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
    const seen = new Map<string, string>();
    allReports
      .filter((r) => (!dept || r.userDepartment === dept) && (!subDept || r.userSubDepartment === subDept))
      .forEach((r) => {
        if (r.userId && !seen.has(r.userId)) seen.set(r.userId, r.userName || r.userId);
      });
    return Array.from(seen.entries()).map(([value, label]) => ({ value, label }));
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

  return (
    <div className="gr-wrap">
      {/* 1. Title */}
      <div className="gr-head">
        <div className="gr-titlerow">
          <h2 className="gr-title">Generated Reports</h2>
          <Divider type="vertical" className="gr-hdivider" />
          <span className="gr-sub">Archived monthly performance reports — open or download a member’s saved PDF.</span>
        </div>
      </div>

      {/* 2. Count + search + generate */}
      <div className="gr-bar">
        <span className="gr-bar-info">{total === 0 ? 'No reports' : `Showing ${rangeInfo}`}</span>
        <div className="gr-bar-actions">
          <Input
            allowClear
            prefix={<SearchOutlined style={{ color: 'var(--text-slate-400)' }} />}
            placeholder="Search by member name or position"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="gr-search"
          />
          {canUpdatePerformanceReportSetting && (
            <Button type="primary" icon={<ThunderboltOutlined />} loading={generating} onClick={openWizard}>
              Generate report
            </Button>
          )}
        </div>
      </div>

      {/* 3. Filters */}
      <div className="gr-filters">
        <span className="gr-filters-label">
          <FilterOutlined />
          Filters
        </span>
        <SearchableDropdown
          placeholder="All departments"
          searchPlaceholder="Search departments"
          itemNoun="departments"
          value={dept}
          onChange={(v) => { setDept(v ?? undefined); setSubDept(undefined); setMember(undefined); }}
          options={deptOptions.map((d) => ({ value: d, label: d }))}
          width={180}
          allowClear
        />
        <SearchableDropdown
          placeholder="All sub-departments"
          searchPlaceholder="Search sub-departments"
          itemNoun="sub-departments"
          value={subDept}
          onChange={(v) => { setSubDept(v ?? undefined); setMember(undefined); }}
          options={subDeptOptions.map((d) => ({ value: d, label: d }))}
          width={190}
          allowClear
        />
        <SearchableDropdown
          placeholder="All members"
          searchPlaceholder="Search members"
          itemNoun="members"
          value={member}
          onChange={(v) => setMember(v ?? undefined)}
          options={memberOptions}
          width={200}
          allowClear
        />
        <RangePicker
          className="gr-month"
          picker="month" placeholder={['From month', 'To month']} format="MMM YYYY"
          value={monthRange} onChange={(v) => setMonthRange(v as [Dayjs, Dayjs] | null)}
        />
        {(search || dept || subDept || member || monthRange) && (
          <Button
            type="text"
            onClick={() => {
              setSearch(''); setDept(undefined); setSubDept(undefined); setMember(undefined);
              setMonthRange(null);
            }}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Cards */}
      <div className="gr-body">
        {loading ? (
          <div className="gr-center"><Spin /></div>
        ) : paged.length === 0 ? (
          <div className="gr-center">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Text style={{ fontSize: 12.5, color: 'var(--text-slate-500)' }}>
                  {allReports.length === 0
                    ? 'No generated reports yet. Use “Generate this month” or save one from a member’s report.'
                    : 'No reports match these filters.'}
                </Text>
              }
            />
          </div>
        ) : (
          <div className="gr-grid">
            {paged.map((r) => {
              const band = performanceBand(r.overallScore);
              return (
                <div key={r.id} className="gr-card">
                  <div className="gr-card-top">
                    <Avatar size={44} src={r.userAvatar || undefined} style={{ background: 'linear-gradient(135deg,#60a5fa,#3b82f6)', color: '#fff', fontSize: 18, fontWeight: 800, flexShrink: 0 }}>
                      {r.userName?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="gr-name">{r.userName || '—'}</div>
                      <div className="gr-pos">{[r.userPosition, r.userDepartment].filter(Boolean).join(' · ') || '—'}</div>
                    </div>
                    <div className="gr-period">{periodLabel(r.periodKey)}</div>
                  </div>

                  <div className="gr-score-row">
                    <span className="gr-score" style={{ color: pointsColor(r.overallScore) }}>{r.overallScore ?? '—'}</span>
                    <span className="gr-score-max">/ 100</span>
                    <span className="gr-band" style={{ color: band.color, background: `${band.color}14` }}>{band.label}</span>
                  </div>

                  <div className="gr-modules">
                    {MODULES.map((m) => {
                      const v = r[m.key] as number | null;
                      return (
                        <div key={m.label} className="gr-mod">
                          <div className="gr-mod-val" style={{ color: pointsColor(v) }}>{v ?? '—'}</div>
                          <div className="gr-mod-label">{m.label}</div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="gr-foot">
                    <span className="gr-gen">Generated {dayjs(r.generatedAt).format('MMM D, YYYY')}</span>
                    <div className="gr-actions">
                      <a href={r.fileUrl} target="_blank" rel="noopener noreferrer"><Button size="small" icon={<FilePdfOutlined />}>Open</Button></a>
                      <a href={r.fileUrl} download><Button size="small" icon={<DownloadOutlined />} /></a>
                      {canUpdatePerformanceReportSetting && (
                        <Popconfirm title="Delete this report?" onConfirm={() => onDelete(r.id)} okText="Delete" okButtonProps={{ danger: true }}>
                          <Button size="small" danger icon={<DeleteOutlined />} />
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
        <div style={{ position: 'fixed', left: -99999, top: 0, zIndex: -1 }} aria-hidden>
          <ReportPrintable ref={printRef} member={printJob.member} range={printJob.range} model={printJob.model} statusMarks={settingsRef.current.statusMarks} avatarDataUrl={printJob.avatar} />
        </div>
      )}

      <style jsx global>{`
        .gr-wrap { display: flex; flex-direction: column; flex: 1; min-height: 0; }
        /* Box-shaped: square every corner on the page (avatars stay round). */
        .gr-wrap *, .gr-wrap *::before, .gr-wrap *::after { border-radius: 0 !important; }
        .gr-wrap .ant-avatar { border-radius: 50% !important; }
        .gr-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 14px; }
        .gr-titlerow { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .gr-title { margin: 0; font-size: 19px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; white-space: nowrap; }
        .gr-hdivider { height: 20px; border-color: #cbd5e1; margin: 0; }
        .gr-sub { font-size: 13px; color: var(--text-slate-500); line-height: 1.4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .gr-bar { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 12px; }
        .gr-bar-info { font-size: 13px; font-weight: 600; color: var(--text-slate-500); white-space: nowrap; }
        .gr-bar-actions { display: flex; align-items: center; gap: 10px; }
        .gr-search { width: 320px; border-radius: 10px; }
        .gr-filters { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 12px 14px; border: 1px solid var(--border-slate-200); border-radius: 14px; background: var(--bg-secondary); margin-bottom: 16px; }
        .gr-filters-label {
          display: inline-flex; align-items: center; gap: 7px;
          font-size: 13px; font-weight: 700; color: var(--text-slate-700); padding-right: 4px; white-space: nowrap;
        }
        .gr-filters-label .anticon { color: var(--text-slate-400); }
        /* Match the month picker to the 30px compact dropdown height. */
        .gr-filters .gr-month { height: 30px; border-radius: 8px; }
        .gr-filters .gr-month .ant-picker-input > input { font-size: 13px; }
        .gr-body { flex: 1; min-height: 0; }
        .gr-center { display: flex; align-items: center; justify-content: center; padding: 56px 0; min-height: 280px; }
        .gr-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px; }
        .gr-card { border: 1px solid var(--border-slate-200); border-radius: 16px; background: var(--bg-secondary); padding: 16px; display: flex; flex-direction: column; gap: 12px; transition: box-shadow .15s ease, border-color .15s ease; }
        .gr-card:hover { box-shadow: 0 8px 24px rgba(15,23,42,0.07); border-color: var(--border-slate-200); }
        .gr-card-top { display: flex; align-items: center; gap: 11px; }
        .gr-name { font-size: 14.5px; font-weight: 800; color: var(--text-slate-900); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .gr-pos { font-size: 11.5px; color: var(--text-slate-400); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .gr-period { font-size: 11px; font-weight: 700; color: var(--text-slate-500); background: var(--bg-slate-100); border-radius: 999px; padding: 3px 10px; white-space: nowrap; }
        .gr-score-row { display: flex; align-items: baseline; gap: 6px; }
        .gr-score { font-size: 30px; font-weight: 800; letter-spacing: -0.02em; line-height: 1; }
        .gr-score-max { font-size: 12px; font-weight: 700; color: var(--text-slate-400); }
        .gr-band { margin-left: auto; font-size: 11px; font-weight: 800; padding: 3px 9px; border-radius: 999px; align-self: center; }
        .gr-modules { display: flex; gap: 6px; }
        .gr-mod { flex: 1; text-align: center; background: var(--bg-slate-50); border: 1px solid var(--border-slate-100); border-radius: 8px; padding: 6px 2px; }
        .gr-mod-val { font-size: 14px; font-weight: 800; }
        .gr-mod-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; color: var(--text-slate-400); margin-top: 1px; }
        .gr-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding-top: 4px; border-top: 1px solid var(--border-slate-100); }
        .gr-gen { font-size: 11px; color: var(--text-slate-400); }
        .gr-actions { display: flex; align-items: center; gap: 6px; }
        .gr-footer {
          position: sticky; bottom: 0; z-index: 5;
          display: flex; align-items: center; justify-content: flex-end; gap: 12px;
          padding: 14px 2px; margin: 8px 0 0;
          border-top: 1px solid var(--border-slate-100); flex-shrink: 0;
          background: var(--bg-secondary);
          box-shadow: 0 -6px 18px rgba(15,23,42,0.05);
        }
        .gr-footer-info { font-size: 12.5px; color: var(--text-slate-500); font-weight: 600; }

        /* Generate wizard */
        .wz-months { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .wz-month {
          position: relative; display: flex; flex-direction: column; align-items: flex-start; gap: 1px;
          padding: 16px 14px; border: 1px solid var(--border-slate-200); border-radius: 12px; background: var(--bg-secondary); cursor: pointer; text-align: left;
          transition: border-color .14s ease, box-shadow .14s ease, transform .14s ease;
        }
        .wz-month:hover { border-color: #bfdbfe; box-shadow: 0 6px 18px rgba(30,64,175,0.10); transform: translateY(-2px); }
        .wz-month-badge { position: absolute; top: 8px; right: 8px; font-size: 9px; font-weight: 800; color: var(--text-blue-700); background: var(--bg-blue-50); border-radius: 999px; padding: 2px 7px; text-transform: uppercase; letter-spacing: 0.04em; }
        .wz-month-name { font-size: 15px; font-weight: 800; color: var(--text-slate-900); }
        .wz-month-year { font-size: 12px; color: var(--text-slate-400); font-weight: 700; }
        .wz-month-count { font-size: 10.5px; color: var(--text-slate-500); margin-top: 6px; }

        .wz-scope { display: flex; flex-direction: column; }
        .wz-filters { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
        .wz-list-head { display: flex; align-items: center; justify-content: space-between; font-size: 12.5px; color: var(--text-slate-500); margin-bottom: 6px; }
        .wz-list-actions { display: flex; gap: 12px; }
        .wz-list-actions a { color: #3b82f6; cursor: pointer; font-weight: 600; }
        .wz-center { display: flex; align-items: center; justify-content: center; padding: 40px 0; }
        .wz-list { max-height: 320px; overflow-y: auto; border: 1px solid var(--border-slate-100); border-radius: 10px; }
        .wz-row { display: flex; align-items: center; gap: 10px; padding: 7px 12px; border-bottom: 1px solid var(--border-slate-100); cursor: pointer; }
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
