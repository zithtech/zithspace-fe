"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  useMemberTrash,
  useRestoreMember,
  usePermanentDeleteMember,
  useEmptyMemberTrash,
  useBulkRestoreMembers,
  useBulkPermanentDeleteMembers,
} from "@/hooks/useMemberTrash";
import {
  Card,
  Table,
  Button,
  Typography,
  Tooltip,
  Popconfirm,
  Input,
  Avatar,
  Empty,
  Tag,
  App,
  Skeleton,
  Badge,
  Select,
  Pagination,
  Space,
} from "antd";
import {
  DeleteOutlined,
  UndoOutlined,
  SearchOutlined,
  ReloadOutlined,
  InboxOutlined,
  ExclamationCircleOutlined,
  CloseOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  MoreOutlined,
  TeamOutlined,
  CrownOutlined,
  SafetyCertificateOutlined,
  IdcardOutlined,
  CloseCircleOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import { Sparkles, Trash2, Clock, AlertTriangle } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { usePositions } from "@/hooks/usePositions";
import { MembersService, Member } from "@/services/membersService";
import type { ColumnsType } from "antd/es/table";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";

interface TrashedMember extends Member {
  deletedAt: string;
}

dayjs.extend(relativeTime);

const { Text } = Typography;
const { Option } = Select;

const ROLE_META: Record<
  string,
  { label: string; bg: string; color: string; dot: string }
> = {
  super_admin: { label: "Super Admin", bg: "rgba(16,185,129,0.10)", color: "#10b981", dot: "#10b981" },
  admin: { label: "Admin", bg: "rgba(100,116,139,0.10)", color: "#64748b", dot: "#64748b" },
  user: { label: "User", bg: "rgba(59,130,246,0.10)", color: "#3b82f6", dot: "#3b82f6" },
};

const gradientFor = (seed: string) => {
  return "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)";
};

const initialsOf = (name: string) =>
  (name || '—')
    .split(' ')
    .map((s: string) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

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
  const gid = `spk-${color.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} aria-hidden="true" style={{ display: 'block', width: '100%', maxWidth: '96px', height: 'auto' }}>
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

export default function MemberTrashManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "table">("table");
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const { message } = App.useApp();

  // Filters state
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
  const [positionFilter, setPositionFilter] = useState<string | undefined>(undefined);
  const [reportsToFilter, setReportsToFilter] = useState<string | undefined>(undefined);

  // Position, Managers filter data sources
  const { dataSource: positions, loading: positionsLoading } = usePositions();
  const [managers, setManagers] = useState<Member[]>([]);

  // Fetch trash members
  const { data: trashResponse, isLoading, refetch } = useMemberTrash({ limit: 1000 });
  const trashedMembers = (trashResponse?.data || []) as unknown as TrashedMember[];

  // Trash mutations
  const restoreMutation = useRestoreMember();
  const deleteMutation = usePermanentDeleteMember();
  const emptyMutation = useEmptyMemberTrash();
  const bulkRestoreMutation = useBulkRestoreMembers();
  const bulkDeleteMutation = useBulkPermanentDeleteMembers();

  // Load managers list for filter
  const fetchManagers = async () => {
    try {
      const managersData = await MembersService.getMembersForSelect();
      setManagers(
        managersData.map(
          (m) =>
            ({
              id: m.value,
              name: m.label,
              position: m.position ? { title: m.position, id: "" } : null,
              avatarUrl: m.avatarUrl || null,
            }) as Member,
        ),
      );
    } catch (error) {
      console.error("Failed to fetch managers:", error);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, []);

  /* ── Filtered list ─────────────────────────────────────────────── */
  const filteredMembers = useMemo(() => {
    return trashedMembers.filter((m) => {
      const matchesSearch =
        !searchQuery ||
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.workEmail && m.workEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.position?.title && m.position.title.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesRole = !roleFilter || m.role === roleFilter;
      const matchesPosition = !positionFilter || m.position?.title === positionFilter;
      const matchesReportsTo =
        !reportsToFilter ||
        m.reportsTo?.id === reportsToFilter ||
        (typeof m.reportsTo === "string" && m.reportsTo === reportsToFilter);

      return matchesSearch && matchesRole && matchesPosition && matchesReportsTo;
    });
  }, [trashedMembers, searchQuery, roleFilter, positionFilter, reportsToFilter]);

  const stats = useMemo(() => {
    return {
      total: filteredMembers.length,
      recent: filteredMembers.filter(
        (m) => dayjs().diff(dayjs(m.deletedAt || m.updatedAt), "day") <= 7
      ).length,
      older: filteredMembers.filter(
        (m) =>
          dayjs().diff(dayjs(m.deletedAt || m.updatedAt), "day") > 7 &&
          dayjs().diff(dayjs(m.deletedAt || m.updatedAt), "day") <= 30
      ).length,
      purgeReady: filteredMembers.filter(
        (m) => dayjs().diff(dayjs(m.deletedAt || m.updatedAt), "day") > 30
      ).length,
    };
  }, [filteredMembers]);

  const getTrashTrend = (condition?: (m: TrashedMember) => boolean) => {
    if (trashedMembers.length === 0) return [0, 0, 0, 0, 0];
    const months = Array.from({ length: 5 }, (_, i) => dayjs().subtract(4 - i, 'month'));
    return months.map((m) => {
      const endOfMonth = m.endOf('month');
      return trashedMembers.filter((u) => {
        const deleted = dayjs(u.deletedAt || u.updatedAt);
        const matchesDate = deleted.isBefore(endOfMonth) || deleted.isSame(endOfMonth);
        const matchesCondition = condition ? condition(u) : true;
        return matchesDate && matchesCondition;
      }).length;
    });
  };

  const statCells = useMemo(() => {
    const totalTrend = getTrashTrend();
    const recentTrend = getTrashTrend((m) => dayjs().diff(dayjs(m.deletedAt || m.updatedAt), "day") <= 7);
    const olderTrend = getTrashTrend((m) => dayjs().diff(dayjs(m.deletedAt || m.updatedAt), "day") > 7 && dayjs().diff(dayjs(m.deletedAt || m.updatedAt), "day") <= 30);
    const purgeTrend = getTrashTrend((m) => dayjs().diff(dayjs(m.deletedAt || m.updatedAt), "day") > 30);

    return [
      {
        key: 'total',
        title: 'Total In Trash',
        value: stats.total,
        icon: <TeamOutlined />,
        color: '#3b82f6',
        tint: 'rgba(59,130,246,0.10)',
        trend: totalTrend,
        delta: stats.total,
        deltaLabel: 'members',
      },
      {
        key: 'recent',
        title: 'Recently Deleted',
        value: stats.recent,
        icon: <DeleteOutlined />,
        color: '#ef4444',
        tint: 'rgba(239,68,68,0.10)',
        trend: recentTrend,
        delta: stats.recent,
        deltaLabel: 'members',
      },
      {
        key: 'older',
        title: 'Older than 7 days',
        value: stats.older,
        icon: <ClockCircleOutlined />,
        color: '#64748b',
        tint: 'rgba(100,116,139,0.10)',
        trend: olderTrend,
        delta: stats.older,
        deltaLabel: 'members',
      },
      {
        key: 'purge',
        title: 'Pending Purge (>30d)',
        value: stats.purgeReady,
        icon: <ExclamationCircleOutlined />,
        color: '#10b981',
        tint: 'rgba(16,185,129,0.10)',
        trend: purgeTrend,
        delta: stats.purgeReady,
        deltaLabel: 'members',
      },
    ];
  }, [stats, trashedMembers]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setRoleFilter(undefined);
    setPositionFilter(undefined);
    setReportsToFilter(undefined);
  };

  /* ── Table columns ─────────────────────────────────────────────── */
  const columns: ColumnsType<TrashedMember> = [
    {
      title: "Member",
      dataIndex: "name",
      key: "name",
      width: 240,
      render: (text: string, record: Member) => (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar
            size={38}
            shape="square"
            src={record.avatarUrl}
            style={{
              background: gradientFor(record.id || text || "x"),
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              boxShadow: "0 2px 6px rgba(15,23,42,0.10)",
              borderRadius: 10,
            }}
          >
            {initialsOf(text)}
          </Avatar>
          <div style={{ minWidth: 0 }}>
            <Text
              strong
              style={{
                fontSize: 12.5,
                color: "var(--text-slate-900)",
                display: "block",
                lineHeight: 1.2,
              }}
            >
              {text}
            </Text>
            <Text
              style={{
                fontSize: 11.5,
                color: "var(--text-slate-500)",
                display: "block",
                marginTop: 2,
              }}
            >
              {record?.position?.title || "—"}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Contact",
      key: "contact",
      width: 280,
      render: (_, record: Member) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Tooltip title="Work Email">
            <div
              style={{
                fontSize: 11.5,
                color: "var(--text-slate-900)",
                display: "flex",
                alignItems: "center",
                gap: 6,
                whiteSpace: "nowrap",
              }}
            >
              <MailOutlined style={{ fontSize: 11, color: "var(--text-slate-400)" }} />
              <span>{record.workEmail || "—"}</span>
              {record.workEmail && (
                <Tooltip title="Copy Email">
                  <CopyOutlined
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(record.workEmail);
                      message.success("Email copied to clipboard");
                    }}
                    style={{
                      cursor: "pointer",
                      fontSize: 11,
                      color: "var(--text-slate-400)",
                      transition: "color 0.2s",
                      marginLeft: 2,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "var(--text-slate-900)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--text-slate-400)";
                    }}
                  />
                </Tooltip>
              )}
            </div>
          </Tooltip>
          {record?.phone && (
            <Text
              style={{
                fontSize: 11.5,
                color: "var(--text-slate-500)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <PhoneOutlined style={{ fontSize: 10, color: "var(--text-slate-400)" }} />
              {record.phone}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      width: 140,
      render: (role: string, record: any) => {
        const rbacRole = record.userRoles?.[0]?.role;
        const label = rbacRole ? rbacRole.name : (ROLE_META[role]?.label || role);
        const meta = ROLE_META[role] || {
          bg: "rgba(59,130,246,0.10)",
          color: "#3b82f6",
          dot: "#3b82f6",
        };

        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              borderRadius: 999,
              background: meta.bg,
              color: meta.color,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.02em",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: meta.dot,
                boxShadow: `0 0 0 2px ${meta.bg}`,
              }}
            />
            {label}
          </span>
        );
      },
    },
    {
      title: "Reports To",
      key: "reportsTo",
      width: 160,
      render: (_, record: Member) => {
        const reportsTo =
          record?.reportsTo && typeof record.reportsTo === "object"
            ? record.reportsTo.name
            : null;
        if (!reportsTo) {
          return <Text style={{ fontSize: 12, color: "var(--text-slate-400)" }}>—</Text>;
        }
        const reportsToObj = record?.reportsTo && typeof record.reportsTo === "object" ? record.reportsTo : null;
        const avatarUrl = reportsToObj?.avatarUrl;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Avatar
              size={22}
              src={avatarUrl}
              style={{
                background: 'rgba(59,130,246,0.10)',
                color: '#3b82f6',
                fontSize: 9,
                fontWeight: 700,
              }}
            >
              {initialsOf(reportsTo)}
            </Avatar>
            <Text style={{ fontSize: 12, color: "var(--text-slate-900)" }}>
              {reportsTo}
            </Text>
          </div>
        );
      },
    },
    {
      title: "Deleted At",
      dataIndex: "deletedAt",
      key: "deletedAt",
      width: 160,
      render: (date: string) => (
        <Tooltip title={dayjs(date).format("YYYY-MM-DD HH:mm:ss")}>
          <Text style={{ fontSize: 12, color: "var(--text-slate-700)", fontWeight: 500 }}>
            {dayjs(date).fromNow()}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 110,
      align: "right",
      fixed: "right",
      render: (_, record: Member) => (
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Tooltip title="Restore Member">
            <Button
              type="text"
              icon={<UndoOutlined style={{ color: "#52c41a" }} />}
              onClick={async () => {
                await restoreMutation.mutateAsync(record.id);
                setSelectedRowKeys(prev => prev.filter(k => k !== record.id));
              }}
              loading={restoreMutation.isPending}
            />
          </Tooltip>
          <Popconfirm
            title="Permanently delete member?"
            description="This action cannot be undone. All associated data will be lost."
            onConfirm={async () => {
              await deleteMutation.mutateAsync(record.id);
              setSelectedRowKeys(prev => prev.filter(k => k !== record.id));
            }}
            okText="Yes, delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true, loading: deleteMutation.isPending }}
            icon={<ExclamationCircleOutlined style={{ color: "red" }} />}
          >
            <Tooltip title="Permanent Delete">
              <Button
                type="text"
                icon={<DeleteOutlined style={{ color: "#ff4d4f" }} />}
                loading={deleteMutation.isPending}
              />
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const total = filteredMembers.length;
  const pageStart = total === 0 ? 0 : (pagination.current - 1) * pagination.pageSize + 1;
  const pageEnd = Math.min(pagination.current * pagination.pageSize, total);
  const pageCount = Math.max(1, Math.ceil(total / pagination.pageSize));

  const emptyState = (
    <div className="pp-empty">
      <div className="pp-empty-orb"><Sparkles size={26} /></div>
      <div className="pp-empty-title">No members found in trash</div>
      <div className="pp-empty-sub">Trash is empty. All member accounts are currently active.</div>
    </div>
  );

  return (
    <div className="pp-shell">
      {/* ============================ SIDEBAR ============================ */}
      <aside className="pp-sidebar">
        <div className="pp-side-head">
          <div className="pp-side-logo"><InboxOutlined /></div>
          <div className="pp-side-head-text">
            <div className="pp-side-title">Member Trash</div>
            <div className="pp-side-subtitle">Recover or purge</div>
          </div>
        </div>

        <Popconfirm
          title="Empty member trash?"
          description="This will permanently delete all members currently in the trash. This action cannot be undone."
          onConfirm={async () => {
            await emptyMutation.mutateAsync();
            setSelectedRowKeys([]);
          }}
          okText="Yes, empty all"
          cancelText="Cancel"
          okButtonProps={{ danger: true, loading: emptyMutation.isPending }}
          icon={<DeleteOutlined style={{ color: "red" }} />}
          disabled={filteredMembers.length === 0 || isLoading}
        >
          <Button
            type="primary"
            icon={<DeleteOutlined />}
            className="pp-create-btn"
            block
            disabled={filteredMembers.length === 0 || isLoading}
            loading={emptyMutation.isPending}
          >
            Empty Trash
          </Button>
        </Popconfirm>

        <div className="pp-side-scroll">
          <div className="pp-side-section-label">Filters</div>
          <div className="pp-side-filters">
            <SearchableDropdown
              className="pp-side-sd"
              placeholder="Role"
              searchPlaceholder="Search roles"
              itemNoun="roles"
              value={roleFilter ?? undefined}
              onChange={(v) => setRoleFilter(v ?? undefined)}
              options={[
                { value: "super_admin", label: "Super Admin" },
                { value: "admin", label: "Admin" },
                { value: "user", label: "User" },
              ]}
              width={212}
              hideAvatar
            />

            <SearchableDropdown
              className="pp-side-sd"
              placeholder="Position"
              searchPlaceholder="Search positions"
              itemNoun="positions"
              value={positionFilter ?? undefined}
              onChange={(v) => setPositionFilter(v ?? undefined)}
              options={positions.map((p) => ({ value: p.title, label: p.title }))}
              width={212}
              disabled={positions.length === 0}
              hideAvatar
            />

            <SearchableDropdown
              className="pp-side-sd"
              placeholder="Reports to"
              searchPlaceholder="Search managers"
              itemNoun="managers"
              value={reportsToFilter ?? undefined}
              onChange={(v) => setReportsToFilter(v ?? undefined)}
              options={managers.map((m) => ({
                value: m.id,
                label: m.name,
                avatarUrl: m.avatarUrl || null,
                description: m.position?.title || undefined,
              }))}
              width={212}
              disabled={managers.length === 0}
            />

            {(searchQuery || roleFilter || positionFilter || reportsToFilter) && (
              <button
                type="button"
                className="pp-clear-filters"
                onClick={handleClearFilters}
              >
                <CloseCircleOutlined /> Clear filters
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ============================ MAIN ============================ */}
      <main className="pp-main">
        {/* Top search & views bar */}
        <div className="pp-topbar">
          <div className="pp-search-wrap">
            <SearchOutlined className="pp-search-icon" />
            <input
              className="pp-search"
              placeholder="Search deleted member name, position, email…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="pp-topbar-meta">
            <span className="pp-meta-item">
              <span
                className="pp-pulse"
                style={{
                  background: stats.total > 0 ? "#f87171" : "#10b981",
                  boxShadow: stats.total > 0 ? "0 0 0 3px rgba(248, 113, 113, 0.18)" : "0 0 0 3px rgba(16,185,129,0.18)"
                }}
              />
              <strong>{stats.total}</strong> trashed members
            </span>
          </div>

          <div className="pp-topbar-actions">
            <div className="pp-segmented">
              <button
                type="button"
                className={viewMode === 'table' ? 'is-active' : ''}
                onClick={() => setViewMode('table')}
                aria-label="List view"
              >
                <UnorderedListOutlined />
              </button>
              <button
                type="button"
                className={viewMode === 'card' ? 'is-active' : ''}
                onClick={() => setViewMode('card')}
                aria-label="Grid view"
              >
                <AppstoreOutlined />
              </button>
            </div>
            <Tooltip title="Refresh view">
              <button
                type="button"
                className="pp-ghost-btn"
                onClick={async () => {
                  setIsRefreshing(true);
                  await refetch();
                  setIsRefreshing(false);
                  message.success("Trash view refreshed");
                }}
              >
                <ReloadOutlined spin={isLoading || isRefreshing} />
              </button>
            </Tooltip>
          </div>
        </div>

        <div className="pp-divider" />

        {/* Stats Cards */}
        <div className="pp-stats">
          {statCells.map((s) => (
            <div key={s.key} className="pp-stat-card">
              <div className="pp-stat-top">
                <div className="pp-stat-left">
                  <span className="pp-stat-icon" style={{ background: s.tint, color: s.color }}>{s.icon}</span>
                  <span className="pp-stat-label">{s.title}</span>
                </div>
                {s.delta > 0 && (
                  <span className="pp-stat-delta" style={{ color: s.color, background: s.tint }}>
                    {s.delta} {s.deltaLabel}
                  </span>
                )}
              </div>
              <div className="pp-stat-bottom">
                <div className="pp-stat-value-wrap">
                  <span className="pp-stat-value">{s.value}</span>
                  <span className="pp-stat-period">monthly trend</span>
                </div>
                <div className="pp-stat-spark"><AreaSparkline values={s.trend} color={s.color} /></div>
              </div>
            </div>
          ))}
        </div>

        {/* Bulk actions bar */}
        {selectedRowKeys.length > 0 && (
          <div
            className="saas-bulk-actions"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 16px",
              background: "rgba(59,130,246,0.05)",
              border: "1px solid rgba(59,130,246,0.15)",
              borderRadius: 8,
              marginBottom: 12,
            }}
          >
            <div className="saas-bulk-content" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Badge count={selectedRowKeys.length} style={{ backgroundColor: "#1890ff" }} />
              <Text strong style={{ fontSize: 13, color: "var(--text-slate-800)" }}>
                Members Selected
              </Text>
            </div>
            <div className="saas-bulk-buttons" style={{ display: "flex", gap: 8 }}>
              <Button
                type="text"
                size="small"
                icon={<UndoOutlined />}
                onClick={async () => {
                  const ids = selectedRowKeys.map(k => String(k));
                  await bulkRestoreMutation.mutateAsync(ids);
                  setSelectedRowKeys([]);
                }}
                loading={bulkRestoreMutation.isPending}
                style={{ color: "#10b981", fontWeight: 600 }}
              >
                Restore
              </Button>
              <Popconfirm
                title={`Purge ${selectedRowKeys.length} members?`}
                description="This will permanently delete the selected members. This action cannot be undone."
                onConfirm={async () => {
                  const ids = selectedRowKeys.map(k => String(k));
                  await bulkDeleteMutation.mutateAsync(ids);
                  setSelectedRowKeys([]);
                }}
                okText="Purge Selected"
                cancelText="Cancel"
                okButtonProps={{ danger: true, loading: bulkDeleteMutation.isPending }}
              >
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  loading={bulkDeleteMutation.isPending}
                  style={{ color: "#ff4d4f", fontWeight: 600 }}
                >
                  Purge
                </Button>
              </Popconfirm>
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                onClick={() => setSelectedRowKeys([])}
                style={{ color: "var(--text-slate-400)" }}
              />
            </div>
          </div>
        )}

        {/* Main Body */}
        <div className="pp-body">
          {viewMode === 'table' ? (
            <div className="pp-table-wrap">
              <Table
                className="pp-table"
                rowSelection={
                  isLoading || isRefreshing
                    ? undefined
                    : {
                      selectedRowKeys,
                      onChange: (keys) => setSelectedRowKeys(keys),
                    }
                }
                columns={columns.map((col) => ({
                  ...col,
                  render: (text: any, record: any, index: number) => {
                    if (isLoading || isRefreshing) {
                      return (
                        <Skeleton.Input
                          active
                          size="small"
                          block
                          style={{ height: 20 }}
                        />
                      );
                    }
                    return col.render
                      ? (col.render as any)(text, record, index)
                      : text;
                  },
                }))}
                dataSource={
                  isLoading || isRefreshing
                    ? Array(5).fill({})
                    : filteredMembers.slice(
                      (pagination.current - 1) * pagination.pageSize,
                      pagination.current * pagination.pageSize
                    )
                }
                rowKey="id"
                loading={false}
                pagination={false}
                scroll={{ x: 1024 }}
                locale={{ emptyText: emptyState }}
              />
            </div>
          ) : (
            <div className="pp-grid">
              {isLoading || isRefreshing ? (
                Array(6).fill({}).map((_, i) => (
                  <div key={i} className="pc-card" style={{ padding: 12 }}>
                    <Skeleton active avatar paragraph={{ rows: 2 }} />
                  </div>
                ))
              ) : filteredMembers.length === 0 ? (
                <div style={{ gridColumn: '1 / -1' }}>{emptyState}</div>
              ) : (
                filteredMembers.map((item) => {
                  const reportsTo = item.reportsTo && typeof item.reportsTo === 'object' ? item.reportsTo.name : null;
                  const rbacRole = (item as any).userRoles?.[0]?.role;
                  const roleLabel = rbacRole ? rbacRole.name : (ROLE_META[item.role]?.label || item.role);
                  const roleMeta = ROLE_META[item.role] || {
                    bg: "rgba(59,130,246,0.10)",
                    color: "#3b82f6",
                    dot: "#3b82f6",
                  };

                  return (
                    <div key={item.id} className="pc-card">
                      <div className="pc-top">
                        <Avatar
                          size={34}
                          shape="square"
                          src={item.avatarUrl}
                          style={{
                            background: gradientFor(item.id || item.name || "x"),
                            color: "#fff",
                            fontSize: 13,
                            fontWeight: 700,
                            borderRadius: 9,
                          }}
                        >
                          {initialsOf(item.name || '')}
                        </Avatar>
                        <div className="pc-identity-body">
                          <Tooltip title={item.name} placement="topLeft">
                            <div className="pc-title" style={{ fontSize: '13px' }}>{item.name}</div>
                          </Tooltip>
                          <div className="pc-client-line">
                            <span className="pc-client-val" style={{ fontSize: '11.5px', color: 'var(--text-slate-500)' }}>
                              {item.position?.title || "—"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pc-foot" style={{ height: '80px' }}>
                        <div className="pc-foot-row">
                          <span className="pc-foot-item">
                            <span className="pc-foot-key"><MailOutlined style={{ marginRight: 2 }} /></span>
                            <span className="pc-foot-val" style={{ fontSize: '11.5px' }}>{item.workEmail || "—"}</span>
                          </span>
                          {item.phone && (
                            <>
                              <span className="pc-foot-div" />
                              <span className="pc-foot-item">
                                <span className="pc-foot-key"><PhoneOutlined style={{ marginRight: 2 }} /></span>
                                <span className="pc-foot-val" style={{ fontSize: '11.5px' }}>{item.phone}</span>
                              </span>
                            </>
                          )}
                        </div>
                        <div className="pc-foot-row" style={{ justifyContent: 'space-between' }}>
                          <span className="pc-foot-item" style={{ color: '#f87171' }}>
                            <span className="pc-foot-key"><DeleteOutlined style={{ marginRight: 2, color: '#f87171' }} /></span>
                            <span className="pc-foot-val" style={{ fontSize: '11.5px', fontWeight: 600 }}>
                              Deleted {item.deletedAt ? dayjs(item.deletedAt).fromNow() : '—'}
                            </span>
                            {item.deletedBy && (
                              <>
                                <span className="pc-foot-div" style={{ backgroundColor: 'rgba(248, 113, 113, 0.2)', height: '10px', margin: '0 6px' }} />
                                <span className="pc-foot-val" style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-slate-500)' }}>
                                  Deleted by <span style={{ color: '#f87171' }}>{item.deletedBy}</span>
                                </span>
                              </>
                            )}
                          </span>

                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <Tooltip title="Restore Member">
                              <Button
                                type="text"
                                size="small"
                                icon={<UndoOutlined />}
                                style={{ color: "#10b981", padding: 0 }}
                                onClick={async () => {
                                  await restoreMutation.mutateAsync(item.id);
                                  setSelectedRowKeys(prev => prev.filter(k => k !== item.id));
                                }}
                                loading={restoreMutation.isPending}
                              />
                            </Tooltip>
                            <Popconfirm
                              title="Permanently delete member?"
                              description="This action cannot be undone."
                              onConfirm={async () => {
                                await deleteMutation.mutateAsync(item.id);
                                setSelectedRowKeys(prev => prev.filter(k => k !== item.id));
                              }}
                              okText="Yes, purge"
                              cancelText="Cancel"
                              okButtonProps={{ danger: true, loading: deleteMutation.isPending }}
                            >
                              <Button
                                type="text"
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                style={{ color: "#ff4d4f", padding: 0 }}
                                loading={deleteMutation.isPending}
                              />
                            </Popconfirm>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Sticky footer pagination */}
        {total > 0 && (
          <div className="pp-footer pp-footer--sticky">
            <div className="pp-footer-info">
              Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong>
            </div>
            <div className="pp-pager">
              <button
                type="button"
                className="pp-pager-btn"
                disabled={pagination.current <= 1}
                onClick={() => setPagination(p => ({ ...p, current: Math.max(1, p.current - 1) }))}
              >
                ‹
              </button>
              {Array.from({ length: pageCount }, (_, i) => i + 1)
                .slice(Math.max(0, pagination.current - 3), Math.max(0, pagination.current - 3) + 5)
                .map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`pp-pager-num ${p === pagination.current ? 'is-active' : ''}`}
                    onClick={() => setPagination(prev => ({ ...prev, current: p }))}
                  >
                    {p}
                  </button>
                ))}
              <button
                type="button"
                className="pp-pager-btn"
                disabled={pagination.current >= pageCount}
                onClick={() => setPagination(p => ({ ...p, current: Math.min(pageCount, p.current + 1) }))}
              >
                ›
              </button>
              <Select
                className="pp-pagesize"
                value={pagination.pageSize}
                onChange={(v) => { setPagination(p => ({ ...p, pageSize: v, current: 1 })); }}
                options={[5, 10, 15, 25, 50, 100].map((n) => ({ value: n, label: `${n} / page` }))}
                popupMatchSelectWidth={120}
              />
            </div>
          </div>
        )}
      </main>

      <style jsx global>{`
        .pp-shell {
          display: flex;
          margin: 0 -24px;
          min-height: calc(100vh - 64px);
          background: var(--bg-pure-white);
        }
        .pp-shell,
        .pp-shell *,
        .ant-table,
        .ant-btn,
        .ant-select,
        .ant-picker,
        .ant-input,
        .ant-modal,
        .ant-drawer,
        .ant-tooltip,
        .ant-popconfirm,
        .ant-dropdown {
          font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif !important;
        }

        /* ---------------- Sidebar ---------------- */
        .pp-sidebar {
          width: 264px;
          flex-shrink: 0;
          border-right: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white);
          display: flex;
          flex-direction: column;
          padding: 14px 14px 0 38px;
          position: sticky;
          top: 0;
          height: calc(100vh - 64px);
          z-index: 31;
        }
        .pp-side-head {
          display: flex; align-items: center; gap: 12px; padding: 2px 2px 14px; margin-bottom: 6px;
          border-bottom: 1px solid var(--border-slate-100);
        }
        .pp-side-logo {
          flex-shrink: 0; display: flex; align-items: center; justify-content: center;
        }
        .pp-side-logo .anticon { font-size: 24px !important; color: var(--text-slate-900) !important; }
        .pp-side-head-text { display: flex; flex-direction: column; min-width: 0; }
        .pp-side-title { font-size: 16px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.025em; line-height: 1.1; }
        .pp-side-subtitle {
          font-size: 10.5px; color: var(--text-slate-400); font-weight: 700; margin-top: 4px;
          text-transform: uppercase; letter-spacing: 0.07em;
        }
        .pp-create-btn {
          height: 35px !important; border-radius: 8px !important; font-weight: 600 !important; font-size: 12.5px !important;
          background: #fff1f0 !important;
          border: 1px solid #ffd8d6 !important; box-shadow: none !important;
          margin-bottom: 12px;
          color: #ff4d4f !important;
        }
        .pp-create-btn:hover { background: #ffccc7 !important; border-color: #ffa39e !important; color: #ff4d4f !important; }
        .pp-create-btn .anticon { font-size: 12px !important; color: inherit !important; }
        [data-theme='dark'] .pp-create-btn {
          background: transparent !important;
          border: 1px solid #ff4d4f !important;
          color: #ff4d4f !important;
        }
        [data-theme='dark'] .pp-create-btn:hover {
          background: transparent !important;
          color: #ff4d4f !important;
        }
        [data-theme='dark'] .pp-create-btn:disabled {
          background: #1f1f1f !important;
          color: #434343 !important;
          border-color: #434343 !important;
        }
        .pp-side-scroll {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          margin: 0;
          padding: 0;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .pp-side-scroll::-webkit-scrollbar {
          display: none;
        }
        .pp-side-section-label {
          font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em;
          color: var(--text-slate-400); padding: 0 8px; margin: 16px 0 6px;
        }
        .pp-side-scroll > .pp-side-section-label:first-child { margin-top: 6px; }
        .pp-side-filters { display: flex; flex-direction: column; gap: 7px; padding: 0; }
        .pp-side-select .ant-select-selector {
          border-radius: 8px !important; border-color: var(--border-slate-200) !important;
          background: var(--bg-pure-white) !important;
        }
        .pp-side-select { width: 100%; }
        .pp-side-select .ant-select-selector { height: 35px !important; padding: 0 12px !important; display: flex; align-items: center; }
        .pp-side-select .ant-select-selection-placeholder,
        .pp-side-select .ant-select-selection-item { font-size: 13px; line-height: 33px !important; }
        .pp-clear-filters {
          display: inline-flex; align-items: center; gap: 5px; align-self: flex-start;
          background: none; border: none; cursor: pointer; padding: 3px;
          font-size: 12px; font-weight: 600; color: #ef4444;
        }
        .pp-clear-filters:hover { color: #dc2626; }

        /* ---------------- Main ---------------- */
        .pp-main { flex: 1; min-width: 0; padding: 8px 32px 0 20px; display: flex; flex-direction: column; }
        .pp-body { flex: 1 0 auto; padding-bottom: 60px; }
        .pp-topbar { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .pp-search-wrap {
          position: relative; flex: 1; max-width: 520px; display: flex; align-items: center;
          height: 32px; border-radius: 8px; background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200); padding: 0 10px;
        }
        .pp-search-wrap:focus-within { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.10); }
        .pp-search-icon { color: var(--text-slate-400); font-size: 14px; }
        .pp-search {
          flex: 1; border: none; outline: none; background: transparent; margin-left: 9px;
          font-size: 13px; color: var(--text-slate-900);
        }
        .pp-search::placeholder { color: var(--text-slate-400); }
        .pp-topbar-meta { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--text-slate-500); white-space: nowrap; }
        .pp-topbar-meta strong { color: var(--text-slate-700); font-weight: 700; }
        .pp-pulse {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          display: inline-block;
          margin-right: 5px;
          position: relative;
          vertical-align: middle;
        }
        .pp-pulse::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          border-radius: 50%;
          background: inherit;
          animation: pp-pulse-ping 2s infinite ease-out;
        }
        @keyframes pp-pulse-ping {
          0% {
            transform: scale(1);
            opacity: 0.85;
          }
          100% {
            transform: scale(2.8);
            opacity: 0;
          }
        }
        .pp-topbar-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
        .pp-segmented { display: inline-flex; border: 1px solid var(--border-slate-200); border-radius: 9px; overflow: hidden; background: var(--bg-pure-white); }
        .pp-segmented button {
          width: 32px; height: 32px; border: none; background: transparent; cursor: pointer;
          color: var(--text-slate-400); font-size: 14px; display: inline-flex; align-items: center; justify-content: center;
        }
        .pp-segmented button.is-active { background: var(--bg-blue-50); color: #3B82F6; }
        .pp-ghost-btn {
          width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border-slate-200);
          background: var(--bg-slate-50); color: var(--text-slate-700); cursor: pointer; font-size: 14px;
          display: inline-flex; align-items: center; justify-content: center;
        }
        .pp-ghost-btn:hover { color: #3B82F6; border-color: #bfdbfe; }

        .pp-divider { height: 1px; background: var(--border-slate-200); margin: 0 -32px 10px -20px; }

        /* Stat cards */
        .pp-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 14px; }
        .pp-stat-card {
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
          border-radius: 0; padding: 12px 14px; min-height: 92px;
          display: flex; flex-direction: column; justify-content: space-between; gap: 10px;
          box-shadow: 0 1px 2px rgba(15,23,42,0.04);
        }
        .pp-stat-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .pp-stat-left { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1; }
        .pp-stat-icon { width: 26px; height: 26px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; flex-shrink: 0; }
        .pp-stat-label { font-size: 12px; font-weight: 600; color: var(--text-slate-600); line-height: 1.25; }
        .pp-stat-delta {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          font-size: 10.5px;
          font-weight: 700;
          border-radius: 6px;
          padding: 1px 6px;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .pp-stat-bottom { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; }
        .pp-stat-value-wrap { display: flex; align-items: baseline; gap: 6px; }
        .pp-stat-value { font-size: 23px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1; }
        .pp-stat-period { font-size: 11px; color: var(--text-slate-400); font-weight: 500; }

        /* Table */
        .pp-table-wrap { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 0; overflow: hidden; }
        .pp-table-wrap ::-webkit-scrollbar { display: none !important; }
        .pp-table-wrap, .pp-table-wrap * { -ms-overflow-style: none !important; scrollbar-width: none !important; }
        .pp-table .ant-table { background: transparent; font-size: 12px; }
        .pp-table .ant-table-thead > tr > th {
          background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em;
          text-transform: uppercase; color: var(--text-slate-400) !important; padding: 6px 10px !important;
          white-space: nowrap !important;
        }
        .pp-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 6.5px 10px !important; }
        .pp-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .pp-table .ant-table-tbody > tr.pp-row:hover > td { background: var(--bg-slate-50) !important; }
        .pp-table .ant-table-tbody > tr { cursor: pointer; }

        /* Footer + pager */
        .pp-footer {
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
          padding: 10px 14px; border-top: 1px solid var(--border-slate-200);
        }
        .pp-footer--sticky {
          position: sticky; bottom: 0; z-index: 30;
          margin: 8px -32px 0 -20px;
          padding: 0 32px 0 20px;
          background: var(--bg-pure-white);
          box-shadow: 0 -4px 14px rgba(15,23,42,0.05);
          height: 45px;
        }
        .pp-footer-info { font-size: 12px; color: var(--text-slate-500); }
        .pp-footer-info strong { color: var(--text-slate-700); font-weight: 700; }
        .pp-pager { display: flex; align-items: center; gap: 3px; }
        .pp-pager-btn, .pp-pager-num {
          min-width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white); color: var(--text-slate-600); cursor: pointer; font-size: 12.5px; font-weight: 600;
        }
        .pp-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .pp-pager-num.is-active { background: #3B82F6; border-color: #3B82F6; color: #fff; }
        .pp-pagesize { margin-left: 5px; }
        .pp-pagesize .ant-select-selector { border-radius: 7px !important; height: 28px !important; }

        /* Empty + grid */
        .pp-empty { display: flex; flex-direction: column; align-items: center; padding: 56px 20px; }
        .pp-empty-orb {
          width: 64px; height: 64px; border-radius: 18px; display: flex; align-items: center; justify-content: center;
          background: var(--bg-blue-50); color: #3B82F6; margin-bottom: 16px;
        }
        .pp-empty-title { font-size: 16px; font-weight: 700; color: var(--text-slate-900); }
        .pp-empty-sub { font-size: 13px; color: var(--text-slate-400); margin-top: 4px; }
        .pp-btn-primary {
          background: #3B82F6 !important; border: none !important;
          border-radius: 8px !important; font-weight: 600 !important;
        }
        .pp-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .pp-grid-loading { padding: 40px; text-align: center; color: var(--text-slate-400); grid-column: 1 / -1; }

        .pc-card {
          border: 1px solid var(--border-slate-200); border-radius: 0; background: var(--bg-pure-white);
          cursor: pointer; overflow: hidden; display: flex; flex-direction: column;
          transition: box-shadow .15s ease, border-color .15s ease;
          height: 132px;
        }
        .pc-card:hover { box-shadow: 0 3px 12px rgba(15,23,42,0.06); border-color: #cbd5e1; }

        .pc-top { display: flex; align-items: flex-start; gap: 10px; padding: 9px 12px; height: 52px; overflow: hidden; }
        .pc-identity-body { display: flex; flex-direction: column; min-width: 0; gap: 3px; flex: 1; }
        .pc-actions {
          flex-shrink: 0; width: 26px; height: 26px; border-radius: 6px; border: none; cursor: pointer;
          background: transparent; color: var(--text-slate-400); display: inline-flex; align-items: center; justify-content: center;
        }
        .pc-actions:hover { background: var(--bg-slate-100); color: var(--text-slate-900); }
        .pc-title {
          font-size: 13px; font-weight: 700; color: var(--text-slate-900); letter-spacing: -0.01em; line-height: 1.3;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .pc-client-line { display: flex; align-items: center; gap: 5px; font-size: 11.5px; min-width: 0; }
        .pc-client-val { color: var(--text-slate-700); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .pc-foot { display: flex; flex-direction: column; padding: 0; border-top: 1px solid var(--border-slate-200); background: var(--bg-slate-50); height: 78px; justify-content: center; }
        .pc-foot-row { display: flex; align-items: center; gap: 8px; flex-wrap: nowrap; padding: 6px 12px; overflow: hidden; }
        .pc-foot-row + .pc-foot-row { border-top: 1px solid var(--border-slate-200); }
        .pc-foot-item { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--text-slate-700); overflow: hidden; white-space: nowrap; }
        .pc-foot-key { font-size: 10.5px; font-weight: 600; color: var(--text-slate-400); }
        .pc-foot-div { width: 1px; height: 11px; background: var(--border-slate-300, #cbd5e1); flex-shrink: 0; }
        .pc-view-btn {
          background: none; border: none; cursor: pointer; padding: 0;
          color: #3B82F6; font-weight: 700; font-size: 11.5px;
        }
        .pc-view-btn .anticon { font-size: 12px; }
        .pc-view-btn:hover { text-decoration: underline; }

        @media (max-width: 700px) {
          .pp-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 1250px) {
          .pp-stats { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .pp-stats { grid-template-columns: 1fr; }
        }
        @media (max-width: 820px) {
          .pp-sidebar { display: none; }
          .pp-topbar-meta { display: none; }
        }
      `}</style>
    </div>
  );
}
