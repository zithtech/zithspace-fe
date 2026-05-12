"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  Button,
  Input,
  Tag,
  Space,
  Typography,
  Tooltip,
  Skeleton,
  Empty,
  Segmented,
  Dropdown,
} from "antd";
import type { ColumnType } from "antd/es/table";
import {
  Plus,
  Search,
  Building2,
  Users,
  AlertCircle,
  CheckCircle2,
  Settings2,
  Eye,
  ChevronRight,
  Briefcase,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Globe2,
  Filter,
  Download,
  MoreHorizontal,
  Wallet,
  Sparkles,
  ShieldCheck,
  CircleDot,
  FolderKanban,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTenant } from "@/context/TenantContext";
import { api, apiUtils } from "@/lib/axios";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";
import { usePermission } from "@/hooks/usePermission";

const { Title, Text } = Typography;

/* -------------------------------------------------------------------------- */
/*                            Visual helpers                                  */
/* -------------------------------------------------------------------------- */

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
  "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
  "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)",
  "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)",
  "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)",
  "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
  "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
];

const gradientFor = (key?: string) => {
  if (!key) return AVATAR_GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
};

const initialsOf = (name?: string, code?: string) => {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }
  return code?.substring(0, 2).toUpperCase() || "CL";
};

const formatCurrency = (val?: number, currency = "USD") => {
  if (val == null || isNaN(val)) return "—";
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  return `$${val.toLocaleString()}`;
};

/* -------------------------------------------------------------------------- */
/*                              Premium StatCard                              */
/* -------------------------------------------------------------------------- */

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: React.ComponentType<any>;
  accent: string;
  trend?: { value: number; label: string; positive?: boolean };
  subtle?: string;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  accent,
  trend,
  subtle,
  loading,
}) => (
  <div className="cm-stat-card">
    <div className="cm-stat-glow" style={{ background: accent }} />
    <div className="cm-stat-row">
      <div className="cm-stat-icon" style={{ background: `${accent}14`, color: accent, boxShadow: `inset 0 0 0 1px ${accent}30` }}>
        <Icon size={18} color={accent} />
      </div>
      {trend && (
        <div className={`cm-trend ${trend.positive ? "up" : "down"}`}>
          {trend.positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>{trend.value > 0 ? "+" : ""}{trend.value}%</span>
        </div>
      )}
    </div>
    <Text className="cm-stat-label">{label}</Text>
    {loading ? (
      <Skeleton.Input active size="small" style={{ width: 80, marginTop: 4 }} />
    ) : (
      <div className="cm-stat-value">{value}</div>
    )}
    {subtle && <Text className="cm-stat-subtle">{subtle}</Text>}
  </div>
);

/* -------------------------------------------------------------------------- */
/*                                 Page                                       */
/* -------------------------------------------------------------------------- */

export default function ClientsV2ListPage() {
  const router = useRouter();
  const { tenantId } = useTenant();
  const { canCreateClient, canUpdateClient } = usePermission();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchText, setSearchText] = useState("");
  const [highRiskCount, setHighRiskCount] = useState(0);
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "highRisk">("all");
  const [expandedClientProjects, setExpandedClientProjects] = useState<{ [key: string]: any[] }>({});
  const [expandedLoading, setExpandedLoading] = useState<string | null>(null);

  const fetchClients = async (
    page = 1,
    pageSize = 10,
    search = "",
    filter: "all" | "active" | "highRisk" = "all",
  ) => {
    setLoading(true);
    try {
      const params: any = { page, limit: pageSize, search };
      if (filter === "active") params.status = "Active";
      if (filter === "highRisk") params.riskLevel = "High";

      const result = await apiUtils.getPaginated("/api/clients-v2", params);
      setData(result.data);
      setPagination({
        current: result.pagination.current,
        pageSize: result.pagination.pageSize,
        total: result.pagination.total,
      });
    } catch (err) {
      console.error("Failed to fetch clients v2", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHighRiskStats = async () => {
    try {
      const result = await apiUtils.getPaginated("/api/clients-v2", {
        page: 1,
        limit: 1,
        riskLevel: "High",
      });
      setHighRiskCount(result.pagination.total);
    } catch (err) {
      console.error("Failed to fetch high risk stats", err);
    }
  };

  const fetchClientProjects = async (clientId: string) => {
    if (expandedClientProjects[clientId]) return;
    setExpandedLoading(clientId);
    try {
      const result = await api.get(`/api/clients-v2/${clientId}/projects`);
      setExpandedClientProjects((prev) => ({
        ...prev,
        [clientId]: (result as any)?.data || result || [],
      }));
    } catch (err) {
      console.error(`Failed to fetch projects for client ${clientId}`, err);
    } finally {
      setExpandedLoading(null);
    }
  };

  useEffect(() => {
    if (tenantId) {
      fetchClients();
      fetchHighRiskStats();
    }
  }, [tenantId]);

  const handleTableChange = (paginationInfo: any) => {
    fetchClients(paginationInfo.current, paginationInfo.pageSize, searchText, activeFilter);
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    fetchClients(1, pagination.pageSize, value, activeFilter);
  };

  const handleFilter = (next: "all" | "active" | "highRisk") => {
    setActiveFilter(next);
    fetchClients(1, pagination.pageSize, searchText, next);
  };

  /* ---------------------- Derived metrics ---------------------- */

  const activeCount = useMemo(() => data.filter((c) => c.status === "Active").length, [data]);
  const totalContractValue = useMemo(
    () => data.reduce((sum, c) => sum + (Number(c.contractValue) || 0), 0),
    [data],
  );
  const healthyShare = pagination.total
    ? Math.round(((pagination.total - highRiskCount) / pagination.total) * 100)
    : 0;

  /* ---------------------- Columns ---------------------- */

  const columns: ColumnType<any>[] = [
    {
      title: "Client",
      key: "client",
      width: 320,
      render: (_: any, record: any) => {
        const initials = initialsOf(record.companyName, record.clientCode);
        const grad = gradientFor(record.companyName || record.clientCode);
        return (
          <Space size={14} align="center">
            <div className="cm-avatar" style={{ background: grad }}>
              <span>{initials}</span>
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="cm-client-name">
                <Text strong>{record.companyName}</Text>
                {record.website && (
                  <Tooltip title={record.website}>
                    <a
                      href={record.website?.startsWith("http") ? record.website : `https://${record.website}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="cm-website-link"
                    >
                      <ArrowUpRight size={12} />
                    </a>
                  </Tooltip>
                )}
              </div>
              <div className="cm-client-meta">
                <span className="cm-code">{record.clientCode}</span>
                {record.industry && (
                  <>
                    <span className="cm-dot" />
                    <span>{record.industry}</span>
                  </>
                )}
                {record.country && (
                  <>
                    <span className="cm-dot" />
                    <Globe2 size={11} style={{ marginRight: 2, opacity: 0.7 }} />
                    <span>{record.country}</span>
                  </>
                )}
              </div>
            </div>
          </Space>
        );
      },
    },
    {
      title: "Type",
      dataIndex: "clientType",
      key: "clientType",
      width: 130,
      render: (type: string) =>
        type ? (
          <span className="cm-type-pill">{type}</span>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: "Account Manager",
      key: "accountManager",
      width: 200,
      render: (_: any, record: any) => {
        const am = record.accountManager;
        if (!am) return <Text type="secondary" style={{ fontSize: 13 }}>Unassigned</Text>;
        const fullName = `${am.first_name || ""} ${am.last_name || ""}`.trim();
        return (
          <Space size={8}>
            <div className="cm-mini-avatar" style={{ background: gradientFor(fullName) }}>
              {(am.first_name?.[0] || "?").toUpperCase()}
              {(am.last_name?.[0] || "").toUpperCase()}
            </div>
            <Text style={{ fontSize: 13, fontWeight: 500 }}>{fullName || "—"}</Text>
          </Space>
        );
      },
    },
    {
      title: "Contract Value",
      dataIndex: "contractValue",
      key: "contractValue",
      width: 150,
      align: "right" as const,
      render: (val: number, record: any) => (
        <div className="cm-currency">
          <span className="cm-currency-amount">{formatCurrency(val, record.defaultCurrency)}</span>
          {record.defaultCurrency && val != null && (
            <span className="cm-currency-code">{record.defaultCurrency}</span>
          )}
        </div>
      ),
    },
    {
      title: "Risk",
      dataIndex: "riskLevel",
      key: "riskLevel",
      width: 120,
      render: (risk: string) => {
        const level = (risk || "Low") as "High" | "Medium" | "Low";
        const map = {
          High: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", label: "High" },
          Medium: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", label: "Medium" },
          Low: { color: "#10b981", bg: "rgba(16,185,129,0.1)", label: "Low" },
        } as const;
        const cfg = map[level] || map.Low;
        return (
          <span className="cm-risk-pill" style={{ background: cfg.bg, color: cfg.color }}>
            <CircleDot size={10} fill={cfg.color} stroke={cfg.color} />
            {cfg.label}
          </span>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status: string) => {
        const isActive = status === "Active";
        return (
          <span className={`cm-status-pill ${isActive ? "active" : "inactive"}`}>
            <span className="cm-status-dot" />
            {(status || "Inactive").toUpperCase()}
          </span>
        );
      },
    },
    {
      title: "",
      key: "actions",
      align: "right" as const,
      width: 110,
      fixed: "right" as const,
      render: (_: any, record: any) => (
        <Space size={4} className="cm-actions">
          <Tooltip title="View details">
            <Button
              type="text"
              size="small"
              icon={<Eye size={16} />}
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/clients-v2/${record.id}`);
              }}
              className="cm-action-btn"
            />
          </Tooltip>
          {canUpdateClient && (
            <Tooltip title="Edit">
              <Button
                type="text"
                size="small"
                icon={<Settings2 size={16} />}
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/clients-v2/create?id=${record.id}`);
                }}
                className="cm-action-btn"
              />
            </Tooltip>
          )}
          <Dropdown
            menu={{
              items: [
                { key: "view", label: "View overview", icon: <Eye size={14} />, onClick: () => router.push(`/clients-v2/${record.id}`) },
                canUpdateClient ? { key: "edit", label: "Edit profile", icon: <Settings2 size={14} />, onClick: () => router.push(`/clients-v2/create?id=${record.id}`) } : null,
                { type: "divider" },
                { key: "projects", label: "View projects", icon: <FolderKanban size={14} /> },
              ].filter(Boolean) as any,
            }}
            trigger={["click"]}
          >
            <Button
              type="text"
              size="small"
              icon={<MoreHorizontal size={16} />}
              className="cm-action-btn"
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
        </Space>
      ),
    },
  ];

  /* ---------------------- Expanded row ---------------------- */

  const expandedRowRender = (record: any) => {
    const projects = expandedClientProjects[record.id];
    const isLoading = expandedLoading === record.id;

    return (
      <div className="cm-expanded-wrap">
        <div className="cm-expanded-header">
          <div className="cm-expanded-title">
            <FolderKanban size={14} />
            <span>Active Projects · {record.companyName}</span>
          </div>
          <Button
            type="text"
            size="small"
            icon={<Plus size={14} />}
            className="cm-expanded-add"
            onClick={() => router.push(`/clients-v2/${record.id}`)}
          >
            Open client
          </Button>
        </div>

        {isLoading ? (
          <div className="cm-project-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="cm-project-card cm-project-skeleton">
                <Skeleton active paragraph={{ rows: 2 }} />
              </div>
            ))}
          </div>
        ) : !projects || projects.length === 0 ? (
          <div className="cm-empty-projects">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Text type="secondary" style={{ fontSize: 13 }}>
                  No active projects yet for this client
                </Text>
              }
            />
          </div>
        ) : (
          <div className="cm-project-grid">
            {projects.map((p: any) => (
              <div key={p.id} className="cm-project-card">
                <div className="cm-project-top">
                  <div className="cm-project-icon" style={{ background: gradientFor(p.name) }}>
                    <Briefcase size={14} color="#fff" />
                  </div>
                  <Tag className="cm-project-code">{p.code}</Tag>
                </div>
                <Text strong className="cm-project-name">{p.name}</Text>
                <div className="cm-project-stats">
                  <div>
                    <Text className="cm-project-stat-label">Budget</Text>
                    <Text strong className="cm-project-stat-value" style={{ color: "#059669" }}>
                      {p.budget ? formatCurrency(p.budget) : "—"}
                    </Text>
                  </div>
                  <div>
                    <Text className="cm-project-stat-label">Manager</Text>
                    <Text strong className="cm-project-stat-value">
                      {p.projectManager?.name || "—"}
                    </Text>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  /* ---------------------- Render ---------------------- */

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="cm-page">
          <TimeTrackingHeader
            icon={<Building2 size={20} color="#8b5cf6" />}
            title="Client Management"
            description="Monitor, manage, and configure all client entity profiles."
            extra={
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <Input
                  placeholder="Search by name or code…"
                  prefix={<Search size={15} style={{ color: "var(--text-slate-400)" }} />}
                  className="cm-search-input"
                  onChange={(e) => handleSearch(e.target.value)}
                  allowClear
                />
                <Button icon={<Download size={15} />} className="cm-secondary-btn">
                  Export
                </Button>
                {canCreateClient && (
                  <Button
                    type="primary"
                    icon={<Plus size={16} />}
                    className="cm-primary-btn"
                    onClick={() => router.push("/clients-v2/create")}
                  >
                    New Client
                  </Button>
                )}
              </div>
            }
          />

          <div className="cm-body">
           

            {/* Stat grid */}
            <div className="cm-stat-grid">
              <StatCard
                label="Total Clients"
                value={pagination.total}
                icon={Users}
                accent="#3b82f6"
                trend={{ value: 12, label: "vs last month", positive: true }}
                subtle="Across all segments"
                loading={loading && pagination.total === 0}
              />
              <StatCard
                label="Active Accounts"
                value={activeCount}
                icon={CheckCircle2}
                accent="#10b981"
                subtle={`${pagination.total ? Math.round((activeCount / pagination.total) * 100) : 0}% of portfolio`}
                loading={loading && data.length === 0}
              />
              <StatCard
                label="High Risk"
                value={highRiskCount}
                icon={AlertCircle}
                accent="#ef4444"
                trend={{ value: -3, label: "improving", positive: false }}
                subtle="Needs review"
              />
              <StatCard
                label="Contract Value"
                value={formatCurrency(totalContractValue)}
                icon={Wallet}
                accent="#8b5cf6"
                subtle="On current page"
                loading={loading && data.length === 0}
              />
            </div>

            {/* Filter / toolbar row */}
            <div className="cm-toolbar">
              <Segmented
                value={activeFilter}
                onChange={(v) => handleFilter(v as any)}
                options={[
                  { label: <span className="cm-seg-label"><ShieldCheck size={13} /> All clients</span>, value: "all" },
                  { label: <span className="cm-seg-label"><CheckCircle2 size={13} /> Active</span>, value: "active" },
                  { label: <span className="cm-seg-label"><AlertCircle size={13} /> High risk</span>, value: "highRisk" },
                ]}
                className="cm-segmented"
              />
              <div className="cm-toolbar-right">
                <Tooltip title="More filters">
                  <Button icon={<Filter size={15} />} className="cm-icon-btn">Filters</Button>
                </Tooltip>
                <span className="cm-result-count">
                  {pagination.total ? `Showing ${(pagination.current - 1) * pagination.pageSize + 1}–${Math.min(pagination.current * pagination.pageSize, pagination.total)} of ${pagination.total}` : "No results"}
                </span>
              </div>
            </div>

            {/* Premium table card */}
            <div className="cm-table-card">
              <Table
                columns={columns}
                dataSource={data}
                rowKey="id"
                size="middle"
                scroll={{ x: 1100 }}
                pagination={{
                  ...pagination,
                  pageSizeOptions: ["10", "20", "50"],
                  showSizeChanger: true,
                  position: ["bottomRight"],
                  showTotal: (total) => `${total} clients`,
                }}
                loading={loading}
                onChange={handleTableChange}
                onRow={(record) => ({
                  onClick: () => router.push(`/clients-v2/${record.id}`),
                  style: { cursor: "pointer" },
                })}
                locale={{
                  emptyText: (
                    <div className="cm-table-empty">
                      <div className="cm-empty-icon">
                        <Building2 size={28} />
                      </div>
                      <Title level={5} style={{ margin: "12px 0 4px", fontWeight: 700 }}>
                        No clients yet
                      </Title>
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        Add your first client to start tracking projects and contracts.
                      </Text>
                      {canCreateClient && (
                        <Button
                          type="primary"
                          icon={<Plus size={14} />}
                          className="cm-primary-btn"
                          style={{ marginTop: 16 }}
                          onClick={() => router.push("/clients-v2/create")}
                        >
                          Create Client
                        </Button>
                      )}
                    </div>
                  ),
                }}
                expandable={{
                  expandedRowRender,
                  onExpand: (expanded, record) => {
                    if (expanded) fetchClientProjects(record.id);
                  },
                  expandIcon: ({ expanded, onExpand, record }) => (
                    <button
                      type="button"
                      className={`cm-expand-btn ${expanded ? "open" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onExpand(record, e as any);
                      }}
                    >
                      <ChevronRight size={14} />
                    </button>
                  ),
                }}
                rowClassName={() => "cm-row"}
              />
            </div>
          </div>

          {/* ----------------------------- Styles ------------------------------ */}
          <style jsx global>{`
            .cm-page {
              margin: 0 -24px;
              background: var(--bg-primary);
              min-height: calc(100vh - 64px);
            }
            .cm-body {
              padding: 0 32px 40px 32px;
            }

            /* ---------- Hero banner ---------- */
            .cm-hero {
              position: relative;
              overflow: hidden;
              border-radius: 18px;
              padding: 28px 32px;
              margin-bottom: 24px;
              background:
                radial-gradient(1200px 200px at -10% 0%, rgba(139,92,246,0.18), transparent 60%),
                radial-gradient(800px 200px at 110% 100%, rgba(59,130,246,0.18), transparent 60%),
                linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
              color: #fff;
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 24px;
              box-shadow: 0 10px 30px -10px rgba(15, 23, 42, 0.35);
            }
            .cm-hero-mesh {
              position: absolute;
              inset: 0;
              background-image:
                linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
              background-size: 32px 32px;
              mask-image: radial-gradient(ellipse 90% 70% at 50% 50%, #000 40%, transparent 80%);
              pointer-events: none;
            }
            .cm-hero-content { position: relative; z-index: 1; min-width: 0; }
            .cm-hero-eyebrow {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              padding: 5px 10px;
              border-radius: 999px;
              background: rgba(255,255,255,0.1);
              border: 1px solid rgba(255,255,255,0.15);
              color: #cbd5e1;
              font-size: 11px;
              font-weight: 600;
              letter-spacing: 0.04em;
              text-transform: uppercase;
              margin-bottom: 10px;
            }
            .cm-hero-title {
              color: #fff !important;
              margin: 0 0 6px !important;
              font-weight: 800 !important;
              letter-spacing: -0.02em;
              font-size: 24px !important;
            }
            .cm-hero-sub {
              color: rgba(226, 232, 240, 0.82);
              font-size: 13.5px;
              line-height: 1.6;
              display: block;
              max-width: 720px;
            }
            .cm-hero-cta { position: relative; z-index: 1; flex-shrink: 0; }
            .cm-hero-btn {
              background: #fff !important;
              color: #0f172a !important;
              border: 0 !important;
              border-radius: 12px !important;
              font-weight: 700 !important;
              height: 42px !important;
              padding: 0 18px !important;
              box-shadow: 0 6px 20px -6px rgba(255,255,255,0.4) !important;
              display: inline-flex !important;
              align-items: center !important;
              gap: 8px !important;
            }
            .cm-hero-btn:hover {
              background: #f8fafc !important;
              transform: translateY(-1px);
              transition: all .2s ease;
            }

            /* ---------- Stat cards ---------- */
            .cm-stat-grid {
              display: grid;
              grid-template-columns: repeat(4, minmax(0, 1fr));
              gap: 16px;
              margin-bottom: 24px;
            }
            @media (max-width: 1100px) {
              .cm-stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            }
            @media (max-width: 600px) {
              .cm-stat-grid { grid-template-columns: 1fr; }
            }
            .cm-stat-card {
              position: relative;
              background: var(--bg-pure-white);
              border: 1px solid var(--border-slate-100);
              border-radius: 14px;
              padding: 14px 18px 12px;
              overflow: hidden;
              transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
            }
            .cm-stat-card:hover {
              transform: translateY(-2px);
              box-shadow: 0 14px 30px -16px rgba(15,23,42,0.18);
              border-color: var(--border-slate-200);
            }
            .cm-stat-glow {
              position: absolute;
              top: -40px;
              right: -40px;
              width: 140px;
              height: 140px;
              border-radius: 50%;
              filter: blur(40px);
              opacity: 0.12;
              pointer-events: none;
            }
            .cm-stat-row {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 10px;
            }
            .cm-stat-icon {
              width: 32px; height: 32px;
              border-radius: 9px;
              display: flex; align-items: center; justify-content: center;
            }
            .cm-trend {
              display: inline-flex;
              align-items: center;
              gap: 4px;
              padding: 3px 8px;
              border-radius: 999px;
              font-size: 11px;
              font-weight: 700;
            }
            .cm-trend.up { background: rgba(16,185,129,0.1); color: #059669; }
            .cm-trend.down { background: rgba(239,68,68,0.1); color: #dc2626; }
            .cm-stat-label {
              display: block;
              font-size: 12px;
              font-weight: 600;
              color: var(--text-slate-500);
              text-transform: uppercase;
              letter-spacing: 0.04em;
            }
            .cm-stat-value {
              font-size: 22px;
              font-weight: 800;
              color: var(--text-slate-900);
              letter-spacing: -0.02em;
              margin-top: 2px;
              line-height: 1.1;
            }
            .cm-stat-subtle {
              display: block;
              font-size: 11.5px;
              color: var(--text-slate-500);
              margin-top: 4px;
              font-weight: 500;
            }

            /* ---------- Toolbar ---------- */
            .cm-toolbar {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
              margin-bottom: 14px;
              flex-wrap: wrap;
            }
            .cm-segmented.ant-segmented {
              background: var(--bg-pure-white) !important;
              border: 1px solid var(--border-slate-100);
              padding: 4px;
              border-radius: 12px;
            }
            .cm-segmented .ant-segmented-item {
              border-radius: 8px !important;
              transition: all .2s ease;
            }
            .cm-segmented .ant-segmented-item-selected {
              background: linear-gradient(135deg, #8b5cf6, #6366f1) !important;
              color: #fff !important;
              box-shadow: 0 4px 12px -4px rgba(139,92,246,0.45);
            }
            .cm-segmented .ant-segmented-item-selected .ant-segmented-item-label {
              color: #fff !important;
            }
            .cm-seg-label {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              font-size: 13px;
              font-weight: 600;
              padding: 2px 4px;
            }
            .cm-toolbar-right {
              display: flex;
              align-items: center;
              gap: 12px;
            }
            .cm-icon-btn {
              border-radius: 10px !important;
              height: 36px !important;
              border: 1px solid var(--border-slate-100) !important;
              background: var(--bg-pure-white) !important;
              color: var(--text-slate-700) !important;
              font-weight: 600 !important;
              display: inline-flex !important;
              align-items: center !important;
              gap: 6px !important;
            }
            .cm-icon-btn:hover {
              border-color: #8b5cf6 !important;
              color: #8b5cf6 !important;
            }
            .cm-result-count {
              font-size: 12.5px;
              color: var(--text-slate-500);
              font-weight: 500;
            }

            /* ---------- Header buttons ---------- */
            .cm-search-input.ant-input-affix-wrapper {
              width: 280px !important;
              height: 38px !important;
              border-radius: 10px !important;
              background: var(--bg-slate-50) !important;
              border: 1px solid var(--border-slate-100) !important;
              transition: all .2s ease;
            }
            .cm-search-input.ant-input-affix-wrapper:focus-within {
              border-color: #8b5cf6 !important;
              box-shadow: 0 0 0 3px rgba(139,92,246,0.1) !important;
              background: var(--bg-pure-white) !important;
            }
            .cm-search-input .ant-input { background: transparent !important; font-size: 13px; font-weight: 500; }
            .cm-secondary-btn {
              height: 38px !important;
              border-radius: 10px !important;
              border: 1px solid var(--border-slate-100) !important;
              background: var(--bg-pure-white) !important;
              color: var(--text-slate-700) !important;
              font-weight: 600 !important;
              display: inline-flex !important;
              align-items: center !important;
              gap: 6px !important;
            }
            .cm-secondary-btn:hover {
              border-color: var(--border-slate-200) !important;
              color: var(--text-slate-900) !important;
            }
            .cm-primary-btn {
              height: 38px !important;
              border-radius: 10px !important;
              padding: 0 18px !important;
              font-weight: 700 !important;
              display: inline-flex !important;
              align-items: center !important;
              gap: 6px !important;
              background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%) !important;
              border: 0 !important;
              box-shadow: 0 6px 16px -8px rgba(139,92,246,0.6) !important;
            }
            .cm-primary-btn:hover {
              filter: brightness(1.05);
              transform: translateY(-1px);
              transition: all .2s ease;
            }

            /* ---------- Table card ---------- */
            .cm-table-card {
              background: var(--bg-pure-white);
              border-radius: 16px;
              border: 1px solid var(--border-slate-100);
              overflow: hidden;
              box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
            }
            .cm-table-card .ant-table {
              background: transparent !important;
            }
            .cm-table-card .ant-table-thead > tr > th {
              background: var(--bg-slate-50) !important;
              color: var(--text-slate-500) !important;
              font-weight: 700 !important;
              text-transform: uppercase !important;
              font-size: 11px !important;
              letter-spacing: 0.06em !important;
              padding: 14px 16px !important;
              border-bottom: 1px solid var(--border-slate-100) !important;
            }
            .cm-table-card .ant-table-thead > tr > th::before { display: none !important; }
            .cm-table-card .ant-table-tbody > tr > td {
              padding: 16px !important;
              border-bottom: 1px solid var(--border-slate-100) !important;
              transition: background .15s ease;
            }
            .cm-table-card .cm-row:hover > td {
              background: var(--bg-slate-50) !important;
            }
            .cm-table-card .ant-table-tbody > tr.ant-table-row-level-0:last-child > td {
              border-bottom: 0 !important;
            }

            /* avatar / cells */
            .cm-avatar {
              width: 40px; height: 40px;
              border-radius: 12px;
              display: flex; align-items: center; justify-content: center;
              color: #fff;
              font-weight: 700;
              font-size: 13px;
              letter-spacing: 0.02em;
              box-shadow: 0 4px 10px -4px rgba(15,23,42,0.25);
              flex-shrink: 0;
            }
            .cm-mini-avatar {
              width: 26px; height: 26px;
              border-radius: 50%;
              display: flex; align-items: center; justify-content: center;
              color: #fff; font-weight: 700; font-size: 10px;
              flex-shrink: 0;
            }
            .cm-client-name {
              display: flex; align-items: center; gap: 6px;
              font-size: 14px; color: var(--text-slate-900);
              line-height: 1.2;
            }
            .cm-website-link {
              width: 18px; height: 18px;
              display: inline-flex; align-items: center; justify-content: center;
              border-radius: 6px;
              color: var(--text-slate-400);
              transition: all .15s ease;
            }
            .cm-website-link:hover {
              background: var(--bg-blue-50);
              color: var(--text-blue-700);
            }
            .cm-client-meta {
              display: flex; align-items: center; gap: 6px;
              font-size: 12px;
              color: var(--text-slate-500);
              margin-top: 3px;
              flex-wrap: wrap;
            }
            .cm-code {
              font-family: ui-monospace, "SF Mono", Menlo, monospace;
              background: var(--bg-slate-50);
              padding: 1px 6px;
              border-radius: 4px;
              font-size: 11px;
              color: var(--text-slate-600);
              border: 1px solid var(--border-slate-100);
            }
            .cm-dot { width: 3px; height: 3px; border-radius: 50%; background: var(--border-slate-200); display: inline-block; }

            .cm-type-pill {
              display: inline-flex;
              align-items: center;
              padding: 3px 10px;
              border-radius: 6px;
              background: var(--bg-slate-50);
              border: 1px solid var(--border-slate-100);
              color: var(--text-slate-700);
              font-size: 12px;
              font-weight: 600;
            }

            .cm-currency { display: flex; flex-direction: column; align-items: flex-end; line-height: 1.2; }
            .cm-currency-amount {
              font-size: 14px;
              font-weight: 700;
              color: var(--text-slate-900);
              font-variant-numeric: tabular-nums;
              letter-spacing: -0.01em;
            }
            .cm-currency-code {
              font-size: 10px;
              font-weight: 600;
              color: var(--text-slate-400);
              text-transform: uppercase;
              letter-spacing: 0.06em;
              margin-top: 2px;
            }

            .cm-risk-pill {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              padding: 4px 10px;
              border-radius: 999px;
              font-size: 11.5px;
              font-weight: 700;
              letter-spacing: 0.02em;
            }
            .cm-status-pill {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              padding: 4px 10px;
              border-radius: 999px;
              font-size: 10.5px;
              font-weight: 700;
              letter-spacing: 0.06em;
            }
            .cm-status-pill .cm-status-dot {
              width: 6px; height: 6px; border-radius: 50%;
            }
            .cm-status-pill.active { background: rgba(16,185,129,0.1); color: #047857; }
            .cm-status-pill.active .cm-status-dot {
              background: #10b981;
              box-shadow: 0 0 0 3px rgba(16,185,129,0.18);
              animation: cm-pulse 2s infinite;
            }
            .cm-status-pill.inactive { background: var(--bg-slate-50); color: var(--text-slate-500); border: 1px solid var(--border-slate-100); }
            .cm-status-pill.inactive .cm-status-dot { background: var(--text-slate-400); }

            @keyframes cm-pulse {
              0%, 100% { box-shadow: 0 0 0 3px rgba(16,185,129,0.18); }
              50% { box-shadow: 0 0 0 5px rgba(16,185,129,0.05); }
            }

            /* row actions */
            .cm-actions { opacity: 0.6; transition: opacity .15s ease; }
            .cm-row:hover .cm-actions { opacity: 1; }
            .cm-action-btn {
              width: 32px !important;
              height: 32px !important;
              border-radius: 8px !important;
              display: inline-flex !important;
              align-items: center !important;
              justify-content: center !important;
              color: var(--text-slate-500) !important;
              transition: all .15s ease !important;
            }
            .cm-action-btn:hover {
              background: var(--bg-slate-50) !important;
              color: #8b5cf6 !important;
            }

            /* expand */
            .cm-expand-btn {
              width: 24px; height: 24px;
              display: inline-flex; align-items: center; justify-content: center;
              background: var(--bg-slate-50);
              border: 1px solid var(--border-slate-100);
              border-radius: 7px;
              color: var(--text-slate-500);
              cursor: pointer;
              transition: all .2s ease;
              padding: 0;
            }
            .cm-expand-btn:hover {
              background: var(--bg-blue-50);
              color: var(--text-blue-700);
              border-color: var(--border-blue-200);
            }
            .cm-expand-btn.open { transform: rotate(90deg); background: linear-gradient(135deg, #8b5cf6, #6366f1); color: #fff; border-color: transparent; }

            /* expanded row */
            .cm-expanded-wrap {
              padding: 18px 24px 22px 64px;
              background:
                linear-gradient(180deg, rgba(139,92,246,0.04) 0%, transparent 60%),
                var(--bg-slate-50);
              border-bottom: 1px solid var(--border-slate-100);
            }
            .cm-expanded-header {
              display: flex; align-items: center; justify-content: space-between;
              margin-bottom: 14px;
            }
            .cm-expanded-title {
              display: flex; align-items: center; gap: 8px;
              font-size: 11px;
              font-weight: 700;
              color: var(--text-slate-600);
              text-transform: uppercase;
              letter-spacing: 0.06em;
            }
            .cm-expanded-add {
              color: #8b5cf6 !important;
              font-weight: 600 !important;
              font-size: 12.5px !important;
            }
            .cm-project-grid {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
              gap: 12px;
            }
            .cm-project-card {
              background: var(--bg-pure-white);
              border: 1px solid var(--border-slate-100);
              border-radius: 12px;
              padding: 14px;
              transition: all .2s ease;
            }
            .cm-project-card:hover {
              border-color: #8b5cf6;
              box-shadow: 0 8px 18px -10px rgba(139,92,246,0.4);
              transform: translateY(-1px);
            }
            .cm-project-skeleton:hover { transform: none; box-shadow: none; border-color: var(--border-slate-100); }
            .cm-project-top {
              display: flex; align-items: center; justify-content: space-between;
              margin-bottom: 8px;
            }
            .cm-project-icon {
              width: 28px; height: 28px;
              border-radius: 8px;
              display: flex; align-items: center; justify-content: center;
            }
            .cm-project-code {
              border: 0 !important;
              background: var(--bg-slate-50) !important;
              color: var(--text-slate-600) !important;
              font-size: 10.5px !important;
              font-weight: 600 !important;
              border-radius: 5px !important;
              padding: 1px 7px !important;
              margin: 0 !important;
            }
            .cm-project-name {
              display: block;
              font-size: 13.5px;
              color: var(--text-slate-900);
              line-height: 1.3;
              margin-bottom: 10px;
            }
            .cm-project-stats {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              padding-top: 10px;
              border-top: 1px dashed var(--border-slate-100);
            }
            .cm-project-stat-label {
              display: block;
              font-size: 10.5px;
              color: var(--text-slate-500);
              text-transform: uppercase;
              letter-spacing: 0.05em;
              font-weight: 600;
              margin-bottom: 2px;
            }
            .cm-project-stat-value {
              font-size: 12.5px;
              color: var(--text-slate-900);
              font-weight: 600;
            }

            .cm-empty-projects {
              padding: 20px;
              text-align: center;
              border: 1px dashed var(--border-slate-100);
              border-radius: 12px;
              background: var(--bg-pure-white);
            }

            .cm-table-empty {
              padding: 60px 24px;
              text-align: center;
            }
            .cm-empty-icon {
              width: 56px; height: 56px;
              border-radius: 14px;
              display: inline-flex; align-items: center; justify-content: center;
              background: linear-gradient(135deg, rgba(139,92,246,0.1), rgba(99,102,241,0.1));
              color: #8b5cf6;
            }

            /* pagination */
            .cm-table-card .ant-pagination {
              padding: 12px 18px !important;
              border-top: 1px solid var(--border-slate-100);
              margin: 0 !important;
            }
            .cm-table-card .ant-pagination-item-active {
              border-color: #8b5cf6 !important;
              background: rgba(139,92,246,0.08) !important;
            }
            .cm-table-card .ant-pagination-item-active a { color: #8b5cf6 !important; }
            .cm-table-card .ant-pagination-total-text {
              color: var(--text-slate-500);
              font-weight: 500;
              font-size: 12.5px;
            }

            /* dark mode adjustments */
            [data-theme='dark'] .cm-stat-card { background: var(--bg-secondary); }
            [data-theme='dark'] .cm-table-card { background: var(--bg-secondary); }
            [data-theme='dark'] .cm-segmented.ant-segmented { background: var(--bg-secondary) !important; }
            [data-theme='dark'] .cm-icon-btn,
            [data-theme='dark'] .cm-secondary-btn { background: var(--bg-secondary) !important; }
            [data-theme='dark'] .cm-search-input.ant-input-affix-wrapper { background: var(--bg-secondary) !important; }
            [data-theme='dark'] .cm-expanded-wrap {
              background: linear-gradient(180deg, rgba(139,92,246,0.06) 0%, transparent 60%), var(--bg-primary);
            }
            [data-theme='dark'] .cm-project-card { background: var(--bg-secondary); }
            [data-theme='dark'] .cm-status-pill.inactive { background: var(--bg-secondary); }

            /* dark theme — keep fixed action column flush with the row */
            [data-theme='dark'] .cm-table-card .ant-table-cell-fix-right,
            [data-theme='dark'] .cm-table-card .ant-table-cell-fix-left {
              background: var(--bg-secondary) !important;
            }
            [data-theme='dark'] .cm-table-card .cm-row:hover .ant-table-cell-fix-right,
            [data-theme='dark'] .cm-table-card .cm-row:hover .ant-table-cell-fix-left,
            [data-theme='dark'] .cm-table-card .cm-row:hover > td.ant-table-cell-row-hover {
              background: var(--bg-slate-50) !important;
            }
            [data-theme='dark'] .cm-table-card .ant-table-thead > tr > th.ant-table-cell-fix-right,
            [data-theme='dark'] .cm-table-card .ant-table-thead > tr > th.ant-table-cell-fix-left {
              background: var(--bg-slate-50) !important;
            }
            [data-theme='dark'] .cm-table-card .ant-table-cell-fix-right::after,
            [data-theme='dark'] .cm-table-card .ant-table-cell-fix-left::after { box-shadow: none !important; }
            [data-theme='dark'] .cm-table-card .ant-table-tbody > tr > td { color: var(--text-slate-700); }
            [data-theme='dark'] .cm-action-btn { color: var(--text-slate-400) !important; }
            [data-theme='dark'] .cm-action-btn:hover {
              background: rgba(139,92,246,0.15) !important;
              color: #a78bfa !important;
            }

            /* light theme — same harmonization, prevents the white seam */
            .cm-table-card .ant-table-cell-fix-right,
            .cm-table-card .ant-table-cell-fix-left {
              background: var(--bg-pure-white) !important;
            }
            .cm-table-card .cm-row:hover .ant-table-cell-fix-right,
            .cm-table-card .cm-row:hover .ant-table-cell-fix-left,
            .cm-table-card .cm-row:hover > td.ant-table-cell-row-hover {
              background: var(--bg-slate-50) !important;
            }
            .cm-table-card .ant-table-thead > tr > th.ant-table-cell-fix-right,
            .cm-table-card .ant-table-thead > tr > th.ant-table-cell-fix-left {
              background: var(--bg-slate-50) !important;
            }
            .cm-table-card .ant-table-cell-fix-right::after,
            .cm-table-card .ant-table-cell-fix-left::after { box-shadow: none !important; }
          `}</style>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
