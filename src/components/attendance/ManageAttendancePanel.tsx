'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Table,
  Tag,
  Drawer,
  Form,
  DatePicker,
  TimePicker,
  Select,
  message,
  Tooltip,
  Row,
  Col,
  Space,
  Avatar,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  FilterOutlined,
  CloseOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { usePermission } from '@/hooks/usePermission';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { AttendanceService, Attendance } from '@/services/attendanceService';
import { MembersService, Member } from '@/services/membersService';
import { ProjectService } from '@/services/projectService';
import { useSocket } from '@/providers/SocketProvider';
import { breakLabel } from '@/components/attendance/breakTypes';
import { CoffeeOutlined } from '@ant-design/icons';

interface LiveStatus {
  state?: string;
  onBreak?: boolean;
  breakType?: string | null;
  at: number;
}

const { RangePicker } = DatePicker;

// ── Module palette: blue / green / red / grey only ──────────────────────────
const PALETTE = {
  blue: '#3B82F6',
  green: '#10B981',
  amber: '#F59E0B',
  red: '#EF4444',
  grey: '#94A3B8',
} as const;
const TINT = {
  blue: 'rgba(59,130,246,0.10)',
  green: 'rgba(16,185,129,0.10)',
  amber: 'rgba(245,158,11,0.12)',
  red: 'rgba(239,68,68,0.10)',
  grey: 'rgba(148,163,184,0.12)',
} as const;

type StatusValue = 'present' | 'late' | 'absent';

interface ExtendedAttendance extends Attendance {
  member?: { id: string; name: string; position?: any; avatarUrl?: string };
}

const STATUS_META: Record<string, { label: string; color: string; tint: string; icon: React.ReactNode }> = {
  present: { label: 'Present', color: PALETTE.green, tint: TINT.green, icon: <CheckCircleOutlined /> },
  late: { label: 'Late', color: PALETTE.amber, tint: TINT.amber, icon: <ExclamationCircleOutlined /> },
  absent: { label: 'Absent', color: PALETTE.red, tint: TINT.red, icon: <CloseCircleOutlined /> },
};

const formatDuration = (minutes?: number) => {
  if (!minutes) return '-';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
};

const fieldLabel = (t: string) => (
  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-slate-700)' }}>{t}</span>
);

// Section card — matches the Leave Type drawer (icon chip + title + subtitle +
// STEP pill, wrapping its fields in a square white card).
function SectionCard({
  icon,
  tint,
  color,
  title,
  subtitle,
  step,
  children,
}: {
  icon: React.ReactNode;
  tint: string;
  color: string;
  title: string;
  subtitle: string;
  step: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: 'var(--bg-pure-white)',
        border: '1px solid var(--border-color)',
        borderRadius: 0,
        padding: '12px 22px',
        marginBottom: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 0,
            background: tint,
            color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-slate-900)', letterSpacing: '-0.01em' }}>
            {title}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-slate-500)', fontWeight: 500 }}>{subtitle}</div>
        </div>
        <span
          style={{
            padding: '2px 8px',
            borderRadius: 999,
            background: 'var(--bg-secondary, #f1f5f9)',
            color: 'var(--text-slate-500)',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.04em',
          }}
        >
          {step}
        </span>
      </div>
      {children}
    </div>
  );
}

// Smooth area sparkline — identical to the Leave Type stat cards.
const AreaSparkline = ({ values, color }: { values: number[]; color: string }) => {
  const w = 96;
  const h = 34;
  const max = Math.max(...values, 1);
  const n = values.length;
  const stepX = n > 1 ? w / (n - 1) : w;
  const pts = values.map((v, i) => {
    const x = i * stepX;
    const y = h - 3 - (v / max) * (h - 8);
    return [x, y] as const;
  });
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${w},${h} L0,${h} Z`;
  const gid = `attspk-${color.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const PAGE_SIZE_OPTIONS = [10, 20, 25, 50, 100];

// Decorative sparkline shapes (no per-status time-series exists yet).
const TRENDS: Record<string, number[]> = {
  total: [3, 5, 4, 6, 7, 6, 8],
  present: [4, 5, 5, 6, 6, 7, 8],
  late: [1, 2, 1, 2, 3, 2, 3],
  absent: [2, 1, 2, 1, 1, 2, 1],
};

// Manage Attendance panel — mirrors the Leave Type panel right-side structure:
//   1) Header (about + search + add)  2) Stat cards  3) Filters  4) Table  5) Drawer
export default function ManageAttendancePanel() {
  const {
    canReadAttendance,
    canManageAttendance,
    canCreateAttendance,
    canUpdateAttendance,
    canDeleteAttendance,
  } = usePermission();

  const [rows, setRows] = useState<ExtendedAttendance[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [projects, setProjects] = useState<Array<{ value: string; label: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [serverTotal, setServerTotal] = useState(0);

  // Live presence from the socket (keyed by userId) + connection state.
  const { socket, connected } = useSocket();
  const [liveStatuses, setLiveStatuses] = useState<Record<string, LiveStatus>>({});
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusValue | undefined>(undefined);
  const [memberFilter, setMemberFilter] = useState<string | undefined>(undefined);
  const [projectFilter, setProjectFilter] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>([
    dayjs().startOf('day'),
    dayjs().endOf('day'),
  ]);

  // pagination (server-side)
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(20);

  // drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ExtendedAttendance | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  // Reference data (members + projects) loaded once.
  useEffect(() => {
    (async () => {
      try {
        const [membersRes, projectsRes] = await Promise.all([
          MembersService.getMembers({ limit: 100 }),
          ProjectService.getProjectsForSelect(),
        ]);
        setMembers(membersRes.data);
        setProjects(projectsRes);
      } catch {
        /* non-fatal — filters/form degrade gracefully */
      }
    })();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await AttendanceService.getAttendance({
        page: tablePage,
        limit: tablePageSize,
        status: statusFilter,
        member: memberFilter,
        projectId: projectFilter,
        search: search.trim() || undefined,
        startDate: dateRange?.[0]?.toISOString(),
        endDate: dateRange?.[1]?.toISOString(),
      });
      setRows(res.data as ExtendedAttendance[]);
      setServerTotal(res.pagination.total);
    } catch (err: any) {
      message.error(err?.message || 'Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  }, [tablePage, tablePageSize, statusFilter, memberFilter, projectFilter, search, dateRange]);

  useEffect(() => {
    if (canReadAttendance || canManageAttendance) load();
  }, [canReadAttendance, canManageAttendance, load]);

  // Live updates: any clock-in / pause / resume / complete across the tenant
  // updates the on-break overlay instantly and refreshes the table (debounced).
  useEffect(() => {
    if (!socket) return;
    const onUpdate = (data: any) => {
      if (!data?.userId) return;
      setLiveStatuses((prev) => ({
        ...prev,
        [data.userId]: {
          state: data.state,
          onBreak: data.onBreak,
          breakType: data.breakType,
          at: Date.now(),
        },
      }));
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(() => load(), 700);
    };
    socket.on('attendance:updated', onUpdate);
    return () => {
      socket.off('attendance:updated', onUpdate);
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, [socket, load]);

  // Reset to first page whenever a filter narrows the set.
  useEffect(() => {
    setTablePage(1);
  }, [statusFilter, memberFilter, projectFilter, search, dateRange, tablePageSize]);

  // ── Stats (from the loaded page) ───────────────────────────────────────────
  const stats = useMemo(() => {
    const present = rows.filter((r) => r.status === 'present').length;
    const late = rows.filter((r) => r.status === 'late').length;
    const absent = rows.filter((r) => r.status === 'absent').length;
    return { present, late, absent };
  }, [rows]);

  const statCells = [
    { key: 'total', title: 'Total Records', value: serverTotal, period: 'all matching', icon: <TeamOutlined />, color: PALETTE.blue, tint: TINT.blue, trend: TRENDS.total },
    { key: 'present', title: 'Present', value: stats.present, period: 'on this page', icon: <CheckCircleOutlined />, color: PALETTE.green, tint: TINT.green, trend: TRENDS.present },
    { key: 'late', title: 'Late', value: stats.late, period: 'on this page', icon: <ExclamationCircleOutlined />, color: PALETTE.amber, tint: TINT.amber, trend: TRENDS.late },
    { key: 'absent', title: 'Absent', value: stats.absent, period: 'on this page', icon: <CloseCircleOutlined />, color: PALETTE.red, tint: TINT.red, trend: TRENDS.absent },
  ];

  // ── Filters ────────────────────────────────────────────────────────────────
  const hasActiveFilters =
    !!search || !!statusFilter || !!memberFilter || !!projectFilter || !!dateRange;

  const clearFilters = () => {
    setSearch('');
    setStatusFilter(undefined);
    setMemberFilter(undefined);
    setProjectFilter(undefined);
    setDateRange(null);
  };

  // ── Pager ──────────────────────────────────────────────────────────────────
  const total = serverTotal;
  const pageCount = Math.max(1, Math.ceil(total / tablePageSize));
  const pageStart = total === 0 ? 0 : (tablePage - 1) * tablePageSize + 1;
  const pageEnd = Math.min(total, tablePage * tablePageSize);

  // ── Drawer handlers ────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ date: dayjs(), status: 'present' });
    setDrawerOpen(true);
  };

  const openEdit = (record: ExtendedAttendance) => {
    setEditing(record);
    form.setFieldsValue({
      member: record.member?.id,
      date: record.date ? dayjs(record.date) : dayjs(),
      status: record.status,
      clockIn: record.clockIn ? dayjs(record.clockIn) : null,
      clockOut: record.clockOut ? dayjs(record.clockOut) : null,
      notes: record.notes,
    });
    setDrawerOpen(true);
  };

  const submit = async () => {
    let values: any;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    setSaving(true);
    try {
      const selectedDate = dayjs(values.date);
      const clockIn = values.clockIn
        ? selectedDate.hour(values.clockIn.hour()).minute(values.clockIn.minute()).second(0).toISOString()
        : undefined;
      const clockOut = values.clockOut
        ? selectedDate.hour(values.clockOut.hour()).minute(values.clockOut.minute()).second(0).toISOString()
        : undefined;

      const payload = {
        userId: values.member,
        date: selectedDate.toISOString(),
        status: values.status,
        clockIn,
        clockOut,
        notes: values.notes,
      };

      if (editing) {
        await AttendanceService.updateAttendance(editing.id, payload as any);
        message.success('Attendance record updated');
      } else {
        await AttendanceService.createAttendance(payload as any);
        message.success('Attendance record created');
      }
      setDrawerOpen(false);
      await load();
    } catch (err: any) {
      message.error(err?.message || 'Failed to save attendance record');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (record: ExtendedAttendance) => {
    try {
      await AttendanceService.deleteAttendance(record.id);
      message.success('Attendance record deleted');
      await load();
    } catch (err: any) {
      message.error(err?.message || 'Failed to delete record');
    }
  };

  const columns: ColumnsType<ExtendedAttendance> = [
    {
      title: 'Member',
      key: 'member',
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar size={32} src={r.member?.avatarUrl} style={{ backgroundColor: PALETTE.blue, borderRadius: 8 }}>
            {r.member?.name?.charAt(0)}
          </Avatar>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, color: 'var(--text-slate-900)' }}>{r.member?.name || '—'}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-slate-400)' }}>
              {r.member?.position?.title || 'Team Member'}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (v) => (v ? dayjs(v).format('MMM DD, YYYY') : '-'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v, r) => {
        const meta = STATUS_META[v] || STATUS_META.absent;
        const live = r.member?.id ? liveStatuses[r.member.id] : undefined;
        const isToday = r.date ? dayjs(r.date).isSame(dayjs(), 'day') : false;
        const showLive = isToday && !!live;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 10px',
                borderRadius: 999, background: meta.tint, color: meta.color, fontSize: 12, fontWeight: 600,
              }}
            >
              {meta.icon} {meta.label}
            </span>
            {showLive && live?.onBreak && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 9px', borderRadius: 999, background: TINT.amber, color: PALETTE.amber, fontSize: 11, fontWeight: 700 }}>
                <CoffeeOutlined /> On break · {breakLabel(live.breakType)}
              </span>
            )}
            {showLive && live?.state === 'working' && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 9px', borderRadius: 999, background: TINT.green, color: PALETTE.green, fontSize: 11, fontWeight: 700 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: PALETTE.green }} /> Working
              </span>
            )}
          </div>
        );
      },
    },
    { title: 'Clock In', dataIndex: 'clockIn', key: 'clockIn', render: (v) => (v ? dayjs(v).format('HH:mm') : '-') },
    { title: 'Clock Out', dataIndex: 'clockOut', key: 'clockOut', render: (v) => (v ? dayjs(v).format('HH:mm') : '-') },
    {
      title: 'Work Hours',
      key: 'workHours',
      render: (_, r) => formatDuration(r.effectiveWorkMinutes ?? r.totalWorkMinutes),
    },
    {
      title: '',
      key: 'actions',
      width: 90,
      align: 'right',
      render: (_, r) => (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
          {canUpdateAttendance && (
            <Tooltip title="Edit"><Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} /></Tooltip>
          )}
          {canDeleteAttendance && (
            <ConfirmDialog
              tone="danger"
              icon={<DeleteOutlined />}
              title="Delete this record?"
              description={`Attendance for "${r.member?.name || 'this member'}" on ${r.date ? dayjs(r.date).format('MMM DD') : 'this day'} will be removed.`}
              confirmText="Delete"
              placement="bottomRight"
              onConfirm={() => remove(r)}
            >
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </ConfirmDialog>
          )}
        </div>
      ),
    },
  ];

  // Expandable child row — every work session + the breaks (with type) between.
  const renderSessions = (record: ExtendedAttendance) => {
    const sessions = record.sessions || [];
    if (!sessions.length) {
      return <div style={{ padding: '8px 16px', color: PALETTE.grey, fontSize: 12 }}>No session details for this day.</div>;
    }
    return (
      <div style={{ padding: '6px 8px 8px 24px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {sessions.map((s, i) => {
          const next = sessions[i + 1];
          const gap = next && s.clockOut ? Math.max(0, dayjs(next.clockIn).diff(dayjs(s.clockOut), 'minute')) : 0;
          return (
            <React.Fragment key={s.id || i}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '5px 0' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.isOpen ? PALETTE.green : PALETTE.blue }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-slate-700)', minWidth: 78 }}>Session {i + 1}</span>
                <span style={{ fontSize: 12.5, color: 'var(--text-slate-900)', fontVariantNumeric: 'tabular-nums' }}>
                  {dayjs(s.clockIn).format('HH:mm')} → {s.clockOut ? dayjs(s.clockOut).format('HH:mm') : 'ongoing'}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: 'var(--text-slate-700)' }}>{formatDuration(s.workMinutes)}</span>
              </div>
              {gap > 0 && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginLeft: 90, fontSize: 11.5, fontWeight: 600, color: PALETTE.amber }}>
                  <CoffeeOutlined /> {breakLabel(s.breakType)} · {formatDuration(gap)}
                  {s.breakReason ? <span style={{ color: 'var(--text-slate-400)', fontWeight: 500, fontStyle: 'italic' }}>— {s.breakReason}</span> : null}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  if (!canReadAttendance && !canManageAttendance) {
    return <div style={{ padding: 40, textAlign: 'center', color: PALETTE.grey }}>You don’t have permission to view attendance.</div>;
  }

  return (
    <div className="att-panel">
      {/* ── 1) HEADER: about + search + add ───────────────────────────────────── */}
      <div className="att-header">
        <div className="att-header-about">
          <div className="att-header-icon"><TeamOutlined /></div>
          <div>
            <div className="att-header-title">Manage Attendance</div>
            <div className="att-header-sub">Review and manage member attendance records</div>
          </div>
        </div>
        <div className="att-header-actions">
          <span
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700,
              color: connected ? PALETTE.green : PALETTE.grey, padding: '5px 10px', borderRadius: 999,
              background: connected ? TINT.green : TINT.grey,
            }}
            title={connected ? 'Live updates on' : 'Reconnecting…'}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: connected ? PALETTE.green : PALETTE.grey, boxShadow: connected ? `0 0 0 3px ${TINT.green}` : 'none' }} />
            {connected ? 'Live' : 'Offline'}
          </span>
          <div className="att-search-wrap">
            <SearchOutlined className="att-search-icon" />
            <input className="att-search" placeholder="Search by member name…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Tooltip title="Refresh"><button type="button" className="att-ghost-btn" onClick={load}><ReloadOutlined spin={loading} /></button></Tooltip>
          {canCreateAttendance && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} className="att-add-btn">Add Record</Button>
          )}
        </div>
      </div>

      {/* ── 2) STAT CARDS ─────────────────────────────────────────────────────── */}
      <div className="att-stats">
        {statCells.map((s) => (
          <div key={s.key} className="att-stat-card">
            <div className="att-stat-top">
              <div className="att-stat-left">
                <span className="att-stat-icon" style={{ background: s.tint, color: s.color }}>{s.icon}</span>
                <span className="att-stat-label">{s.title}</span>
              </div>
            </div>
            <div className="att-stat-bottom">
              <div className="att-stat-value-wrap">
                <span className="att-stat-value">{s.value}</span>
                <span className="att-stat-period">{s.period}</span>
              </div>
              <div className="att-stat-spark"><AreaSparkline values={s.trend} color={s.color} /></div>
            </div>
          </div>
        ))}
      </div>

      {/* ── 3) FILTERS ────────────────────────────────────────────────────────── */}
      <div className="att-filters">
        <span className="att-filter-label"><FilterOutlined /> Filter</span>
        <SearchableDropdown
          className="att-filter-dd"
          placeholder="Status"
          searchPlaceholder="Search statuses"
          itemNoun="statuses"
          value={statusFilter}
          onChange={(v) => setStatusFilter((v as StatusValue) ?? undefined)}
          options={[
            { value: 'present', label: 'Present' },
            { value: 'late', label: 'Late' },
            { value: 'absent', label: 'Absent' },
          ]}
          style={{ width: 150 }}
          width={210}
        />
        <SearchableDropdown
          className="att-filter-dd"
          placeholder="Member"
          searchPlaceholder="Search members"
          itemNoun="members"
          value={memberFilter}
          onChange={(v) => setMemberFilter((v as string) ?? undefined)}
          options={members.map((m) => ({ value: m.id, label: m.name || '—' }))}
          style={{ width: 170 }}
          width={240}
        />
        <SearchableDropdown
          className="att-filter-dd"
          placeholder="Project"
          searchPlaceholder="Search projects"
          itemNoun="projects"
          value={projectFilter}
          onChange={(v) => setProjectFilter((v as string) ?? undefined)}
          options={projects}
          style={{ width: 170 }}
          width={240}
        />
        <RangePicker
          className="att-range"
          value={dateRange}
          onChange={(dates) => {
            if (dates && dates[0] && dates[1]) setDateRange([dates[0].startOf('day'), dates[1].endOf('day')]);
            else setDateRange(null);
          }}
        />
        <span className="att-filter-count">{rows.length} of {total}</span>
        {hasActiveFilters && (
          <button type="button" className="att-clear" onClick={clearFilters}><CloseCircleOutlined /> Clear</button>
        )}
      </div>

      {/* ── 4) TABLE ──────────────────────────────────────────────────────────── */}
      <div className="att-table-wrap">
        <Table
          rowKey="id"
          size="small"
          className="att-table"
          loading={loading}
          columns={columns}
          dataSource={rows}
          pagination={false}
          onRow={() => ({ className: 'att-row' })}
          expandable={{
            expandedRowRender: renderSessions,
            rowExpandable: (record) => ((record as ExtendedAttendance).sessions?.length || 0) > 0,
          }}
        />
      </div>

      {/* Sticky footer pager */}
      {total > 0 && (
        <div className="att-footer att-footer--sticky">
          <div className="att-footer-info">
            Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong>
          </div>
          <div className="att-pager">
            <button type="button" className="att-pager-btn" disabled={tablePage <= 1} onClick={() => setTablePage((p) => Math.max(1, p - 1))}>‹</button>
            {Array.from({ length: pageCount }, (_, i) => i + 1)
              .slice(Math.max(0, tablePage - 3), Math.max(0, tablePage - 3) + 5)
              .map((p) => (
                <button key={p} type="button" className={`att-pager-num ${p === tablePage ? 'is-active' : ''}`} onClick={() => setTablePage(p)}>{p}</button>
              ))}
            <button type="button" className="att-pager-btn" disabled={tablePage >= pageCount} onClick={() => setTablePage((p) => Math.min(pageCount, p + 1))}>›</button>
            <Select
              className="att-pagesize"
              size="small"
              value={tablePageSize}
              onChange={(v) => { setTablePageSize(v); setTablePage(1); }}
              options={PAGE_SIZE_OPTIONS.map((n) => ({ value: n, label: `${n} / page` }))}
              popupMatchSelectWidth={120}
            />
          </div>
        </div>
      )}

      {/* ── 5) Create / Edit DRAWER ───────────────────────────────────────────── */}
      <Drawer
        title={null}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={480}
        closable={false}
        destroyOnClose
        styles={{
          body: { padding: 0, background: 'var(--bg-pure-white)' },
          header: { display: 'none' },
          mask: { backdropFilter: 'blur(2px)', background: 'rgba(15,23,42,0.45)' },
        }}
      >
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-pure-white)' }}>
          {/* Header */}
          <div
            style={{
              padding: '16px 18px 12px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--bg-pure-white)',
              position: 'sticky',
              top: 0,
              zIndex: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 0,
                  background: editing ? TINT.green : TINT.blue,
                  color: editing ? PALETTE.green : PALETTE.blue,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                {editing ? <EditOutlined /> : <PlusOutlined />}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-slate-900)', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                  {editing ? 'Edit Attendance Record' : 'Add Attendance Record'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-slate-500)', fontWeight: 500 }}>
                  {editing ? `Update details for ${editing.member?.name || 'this member'}` : 'Create a manual entry for a team member'}
                </div>
              </div>
            </div>
            <Button type="text" shape="circle" icon={<CloseOutlined />} onClick={() => setDrawerOpen(false)} style={{ color: 'var(--text-slate-500)' }} />
          </div>

          {/* Content */}
          <div style={{ padding: 16, flex: 1, overflowY: 'auto', background: 'var(--bg-secondary, #f8fafc)' }}>
            <Form form={form} layout="vertical" requiredMark="optional" className="att-drawer-form">
              {/* STEP 1 — Record Details */}
              <SectionCard
                icon={<InfoCircleOutlined />}
                tint={TINT.blue}
                color={PALETTE.blue}
                title="Record Details"
                subtitle="Who, when and the attendance status"
                step="STEP 1"
              >
                <Row gutter={16} align="top">
                  <Col span={24}>
                    <Form.Item
                      style={{ marginBottom: 14 }}
                      name="member"
                      label={fieldLabel('Team member')}
                      rules={[{ required: true, message: 'Member is required' }]}
                    >
                      <SearchableDropdown
                        className="att-dd-flat"
                        placeholder="Select member"
                        searchPlaceholder="Search members"
                        itemNoun="members"
                        disabled={!!editing}
                        options={members.map((m) => ({ value: m.id, label: m.name || '—' }))}
                        style={{ width: '100%', height: 40 }}
                        width={240}
                      />
                    </Form.Item>
                  </Col>

                  <Col span={14}>
                    <Form.Item
                      style={{ marginBottom: 14 }}
                      name="date"
                      label={fieldLabel('Date')}
                      rules={[{ required: true, message: 'Date is required' }]}
                    >
                      <DatePicker size="large" style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={10}>
                    <Form.Item
                      style={{ marginBottom: 14 }}
                      name="status"
                      label={fieldLabel('Status')}
                      rules={[{ required: true, message: 'Status is required' }]}
                    >
                      <SearchableDropdown
                        className="att-dd-flat"
                        placeholder="Status"
                        searchPlaceholder="Search statuses"
                        itemNoun="statuses"
                        allowClear={false}
                        options={[
                          { value: 'present', label: 'Present' },
                          { value: 'late', label: 'Late' },
                          { value: 'absent', label: 'Absent' },
                        ]}
                        style={{ width: '100%', height: 40 }}
                        width={210}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </SectionCard>

              {/* STEP 2 — Time Logs */}
              <SectionCard
                icon={<ClockCircleOutlined />}
                tint={TINT.green}
                color={PALETTE.green}
                title="Time Logs"
                subtitle="Optional clock-in and clock-out times"
                step="STEP 2"
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item style={{ marginBottom: 0 }} name="clockIn" label={fieldLabel('Clock In')}>
                      <TimePicker format="HH:mm" size="large" style={{ width: '100%' }} placeholder="09:00" popupClassName="att-tp-popup" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item style={{ marginBottom: 0 }} name="clockOut" label={fieldLabel('Clock Out')}>
                      <TimePicker format="HH:mm" size="large" needConfirm={false} style={{ width: '100%' }} placeholder="18:00" popupClassName="att-tp-popup" />
                    </Form.Item>
                  </Col>
                </Row>
              </SectionCard>
            </Form>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '14px 22px',
              borderTop: '1px solid var(--border-color)',
              background: 'var(--bg-pure-white)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              bottom: 0,
            }}
          >
            <span style={{ fontSize: 11.5, color: 'var(--text-slate-400)', fontWeight: 500 }}>
              Fields marked required must be filled
            </span>
            <Space size={10}>
              <Button onClick={() => setDrawerOpen(false)} style={{ borderRadius: 6, height: 38, fontWeight: 600, padding: '0 18px' }}>
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={submit}
                loading={saving}
                icon={editing ? <EditOutlined /> : <PlusOutlined />}
                style={{ borderRadius: 6, height: 38, fontWeight: 600, padding: '0 18px' }}
              >
                {editing ? 'Save Changes' : 'Create Record'}
              </Button>
            </Space>
          </div>
        </div>
      </Drawer>

      <style jsx global>{`
        .att-panel { display: flex; flex-direction: column; flex: 1; min-height: 0; }
        /* 1) Header */
        .att-header {
          display: flex; align-items: center; justify-content: space-between; gap: 16px;
          padding-bottom: 14px; margin-bottom: 14px; border-bottom: 1px solid var(--border-slate-200);
        }
        .att-header-about { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .att-header-icon {
          width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
          background: ${TINT.blue}; color: ${PALETTE.blue};
          display: inline-flex; align-items: center; justify-content: center; font-size: 18px;
        }
        .att-header-title { font-size: 17px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1.15; }
        .att-header-sub { font-size: 12.5px; color: var(--text-slate-500); margin-top: 2px; }
        .att-header-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .att-search-wrap {
          position: relative; display: flex; align-items: center; height: 34px; width: 240px;
          border-radius: 8px; background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); padding: 0 10px;
        }
        .att-search-wrap:focus-within { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.10); }
        .att-search-icon { color: var(--text-slate-400); font-size: 14px; }
        .att-search { flex: 1; border: none; outline: none; background: transparent; margin-left: 9px; font-size: 13px; color: var(--text-slate-900); }
        .att-search::placeholder { color: var(--text-slate-400); }
        .att-ghost-btn {
          width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--border-slate-200);
          background: var(--bg-slate-50); color: var(--text-slate-700); cursor: pointer; font-size: 14px;
          display: inline-flex; align-items: center; justify-content: center;
        }
        .att-ghost-btn:hover { color: ${PALETTE.blue}; border-color: #bfdbfe; }
        .att-add-btn { height: 34px !important; border-radius: 8px !important; font-weight: 600 !important; }

        /* 2) Stat cards */
        .att-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 14px; }
        .att-stat-card {
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
          border-radius: 0; padding: 12px 14px; min-height: 92px;
          display: flex; flex-direction: column; justify-content: space-between; gap: 10px;
          box-shadow: 0 1px 2px rgba(15,23,42,0.04);
        }
        .att-stat-top { display: flex; align-items: center; justify-content: space-between; }
        .att-stat-left { display: flex; align-items: center; gap: 8px; }
        .att-stat-icon { width: 26px; height: 26px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; }
        .att-stat-label { font-size: 12px; font-weight: 600; color: var(--text-slate-600); }
        .att-stat-bottom { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; }
        .att-stat-value-wrap { display: flex; align-items: baseline; gap: 6px; }
        .att-stat-value { font-size: 23px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1; }
        .att-stat-period { font-size: 11px; color: var(--text-slate-400); font-weight: 500; }
        .att-stat-spark { opacity: 0.95; }

        /* 3) Filters */
        .att-filters { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
        .att-filter-label {
          display: inline-flex; align-items: center; gap: 6px; margin-right: 2px;
          font-size: 12.5px; font-weight: 600; color: var(--text-slate-600);
        }
        .att-filter-label .anticon { color: var(--text-slate-400); font-size: 13px; }
        .att-range .ant-picker { border-radius: 8px; }
        .att-filter-count { font-size: 12px; color: var(--text-slate-500); margin-left: 2px; }
        .att-clear {
          display: inline-flex; align-items: center; gap: 5px; background: none; border: none; cursor: pointer;
          padding: 3px 6px; font-size: 12px; font-weight: 600; color: ${PALETTE.red}; margin-left: auto;
        }

        /* 4) Table */
        .att-table-wrap { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 0; overflow: hidden; }
        .att-table .ant-table { background: transparent; font-size: 12px; }
        .att-table .ant-table-thead > tr > th {
          background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em;
          text-transform: uppercase; color: var(--text-slate-400) !important; padding: 8px 12px !important;
          white-space: nowrap !important;
        }
        .att-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 9px 12px !important; }
        .att-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .att-table .ant-table-tbody > tr.att-row:hover > td { background: var(--bg-slate-50) !important; }

        /* Sticky footer pager */
        .att-footer {
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
          height: 52px; box-sizing: border-box;
        }
        .att-footer--sticky {
          position: sticky; bottom: 0; z-index: 20; margin: auto -22px 0; padding: 0 22px;
          background: var(--bg-pure-white); border-top: 1px solid var(--border-slate-200);
          box-shadow: 0 -4px 14px rgba(15,23,42,0.05);
        }
        .att-footer-info { font-size: 12px; color: var(--text-slate-500); }
        .att-footer-info strong { color: var(--text-slate-700); font-weight: 700; }
        .att-pager { display: flex; align-items: center; gap: 3px; }
        .att-pager-btn, .att-pager-num {
          min-width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white); color: var(--text-slate-600); cursor: pointer; font-size: 12.5px; font-weight: 600;
        }
        .att-pager-btn:hover:not(:disabled), .att-pager-num:hover { border-color: #93c5fd; color: ${PALETTE.blue}; }
        .att-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .att-pager-num.is-active { background: ${PALETTE.blue}; border-color: ${PALETTE.blue}; color: #fff; }
        .att-pagesize { margin-left: 5px; }
        .att-pagesize .ant-select-selector { border-radius: 7px !important; height: 28px !important; }

        /* Drawer form fields — clean OUTLINED white, 40px controls, blue focus ring */
        .att-drawer-form .ant-input-affix-wrapper,
        .att-drawer-form .ant-input-affix-wrapper-lg,
        .att-drawer-form input.ant-input-lg,
        .att-drawer-form .ant-input-lg,
        .att-drawer-form .ant-picker-large,
        .att-drawer-form .att-dd-flat.sd-trigger {
          height: 40px;
          border-radius: 6px !important;
          background: var(--bg-pure-white) !important;
          border: 1px solid var(--border-color) !important;
          box-shadow: none !important;
          transition: border-color .12s ease, box-shadow .12s ease;
        }
        .att-drawer-form .ant-picker:hover,
        .att-drawer-form .ant-input-affix-wrapper:hover,
        .att-drawer-form .ant-input:hover,
        .att-drawer-form .att-dd-flat.sd-trigger:hover { border-color: #93c5fd !important; }
        .att-drawer-form .ant-picker-focused,
        .att-drawer-form .ant-input-affix-wrapper-focused,
        .att-drawer-form .ant-input-focused,
        .att-drawer-form .ant-input:focus {
          border-color: ${PALETTE.blue} !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.10) !important;
        }
        .att-drawer-form .att-dd-flat.sd-trigger { display: flex; align-items: center; }
        .att-tp-popup .ant-picker-footer { display: none !important; }
      `}</style>
    </div>
  );
}
