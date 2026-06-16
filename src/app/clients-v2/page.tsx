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
  Select,
  Dropdown,
  Modal,
  message,
  Pagination,
  Popconfirm,
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
  Download,
  MoreHorizontal,
  Wallet,
  Sparkles,
  ShieldCheck,
  CircleDot,
  FolderKanban,
  Trash2,
  ChevronDown,
  RefreshCw,
  LayoutGrid,
  List as ListIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import { useTenant } from "@/context/TenantContext";
import { api, apiUtils } from "@/lib/axios";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";
import { usePermission } from "@/hooks/usePermission";
import { useActivitySource } from "@/hooks/useActivitySource";

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
  return "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)";
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

const Sparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  const min = Math.min(...data);
  const max = Math.max(...data, min + 1);
  const range = max - min;
  const width = 72;
  const height = 28;
  const bottomPadding = 4;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    let y = height - bottomPadding;
    if (max > min) {
      y = height - bottomPadding - ((d - min) / range) * (height - bottomPadding - 2);
    }
    return { x, y };
  });

  let pathD = `M ${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    pathD += ` L ${points[i].x},${points[i].y}`;
  }

  const fillD = `${pathD} L ${width},${height} L 0,${height} Z`;

  const isFlat = data.every(d => d === data[0]);
  const flatY = 2;
  const flatPathD = `M 0,${flatY} L ${width},${flatY}`;
  const flatFillD = `${flatPathD} L ${width},${height} L 0,${height} Z`;

  const gradId = `spark-grad-${color.replace('#', '')}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0.05} />
        </linearGradient>
      </defs>
      <path d={isFlat ? flatFillD : fillD} fill={`url(#${gradId})`} />
      <path d={isFlat ? flatPathD : pathD} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: React.ComponentType<any>;
  accent: string;
  trend?: { value: number; label: string; positive?: boolean };
  subtle?: string;
  loading?: boolean;
  chart?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  accent,
  trend,
  subtle,
  loading,
  chart,
}) => (
  <div
    className="dh-stats-card flex flex-col justify-between p-4 transition-all"
    style={{
      border: '1px solid var(--border-slate-200)',
      background: 'var(--bg-pure-white)',
      boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
      height: 100,
    }}
  >
    <div className="flex items-start justify-between w-full">
      <div className="flex items-center gap-2">
        <div style={{
          color: accent,
          fontSize: 15,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 26,
          height: 26,
          background: `${accent}1c`,
          borderRadius: 6,
        }}>
          <Icon />
        </div>
        <span
          className="text-[12.5px] font-medium"
          style={{ color: 'var(--text-slate-500)', letterSpacing: '0.01em' }}
        >
          {label}
        </span>
      </div>
      {trend && trend.value > 0 && (
        <Tooltip title={trend.label || "Trend"}>
          <span
            className="inline-flex items-center justify-center gap-1 text-[11px] font-bold px-[6px] py-[2px] rounded-full"
            style={{
              color: trend.positive ? '#10b981' : '#ef4444',
              background: trend.positive ? '#10b9811c' : '#ef44441c'
            }}
          >
            {trend.positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}+{trend.value}
          </span>
        </Tooltip>
      )}
    </div>

    <div className="flex items-end justify-between w-full mt-auto">
      <div className="flex items-baseline gap-1.5 pb-1">
        <span
          className="text-[26px] font-semibold leading-none tracking-tight"
          style={{ color: 'var(--text-slate-800)' }}
        >
          {loading ? <Skeleton.Input active size="small" style={{ width: 64, height: 26 }} /> : value}
        </span>
        {subtle && (
          <span
            className="text-[11px] font-medium"
            style={{ color: 'var(--text-slate-400)' }}
          >
            {subtle}
          </span>
        )}
      </div>
      <div className="shrink-0 mb-[2px]">
        {chart}
      </div>
    </div>
  </div>
);

/* -------------------------------------------------------------------------- */
/*                                 Page                                       */
/* -------------------------------------------------------------------------- */

export default function ClientsV2ListPage() {
  useActivitySource({ section: "ADMIN", module: "ClientsV2", page: "ClientList" });
  const router = useRouter();
  const { tenantId } = useTenant();
  const { canCreateClient, canUpdateClient, canDeleteClient } = usePermission();
  const [modal, modalContextHolder] = Modal.useModal();
  const [messageApi, messageContextHolder] = message.useMessage();

  // Delete modal state
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchText, setSearchText] = useState("");
  const [highRiskCount, setHighRiskCount] = useState(0);
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "highRisk">("all");
  const [expandedClientProjects, setExpandedClientProjects] = useState<{ [key: string]: any[] }>({});
  const [viewMode, setViewMode] = useState<"list" | "card">("list");
  const [expandedLoading, setExpandedLoading] = useState<string | null>(null);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  // Quick-filter dropdown state
  const [allClientsOpts, setAllClientsOpts] = useState<{ value: string; label: string; code?: string }[]>([]);
  const [allProjectsOpts, setAllProjectsOpts] = useState<{ value: string; label: string; code?: string }[]>([]);
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);

  // Project stats (Total / Active) for dashboard cards
  const [projectStats, setProjectStats] = useState({ total: 0, active: 0 });

  // Global client stats — independent of search / filter state.
  // Stats cards and segmented counts read from here so they stay stable while the user searches.
  const [globalStats, setGlobalStats] = useState({
    totalClients: 0,
    activeClients: 0,
    inactiveClients: 0,
    totalContractValue: 0,
  });

  const fetchClients = async (
    page = 1,
    pageSize = 10,
    search = "",
    filter: "all" | "active" | "highRisk" = "all",
    type?: string,
  ) => {
    setLoading(true);
    try {
      const params: any = { page, limit: pageSize, search };
      if (filter === "active") params.status = "Active";
      if (filter === "highRisk") params.riskLevel = "High";
      if (type) params.clientType = type;

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

  const fetchAllClientOptions = async () => {
    try {
      const result = await apiUtils.getPaginated("/api/clients-v2", { page: 1, limit: 1000 });
      const all = result.data || [];
      setAllClientsOpts(
        all.map((c: any) => ({
          value: c.id,
          label: c.companyName,
          code: c.clientCode,
        }))
      );
      const activeClients = all.filter((c: any) => c.status === "Active").length;
      setGlobalStats({
        totalClients: result.pagination.total,
        activeClients,
        inactiveClients: Math.max(0, all.length - activeClients),
        totalContractValue: all.reduce(
          (s: number, c: any) => s + (Number(c.contractValue) || 0),
          0,
        ),
      });
    } catch (err) {
      console.error("Failed to fetch all clients", err);
    }
  };

  const fetchAllProjectOptions = async () => {
    try {
      const data = await api.get<any[]>("/api/projects/select");
      const opts = (data || []).map((p: any) => ({
        value: p.value,
        label: p.label,
        code: p.code,
      }));
      setAllProjectsOpts(opts);
    } catch (err) {
      console.error("Failed to fetch all projects", err);
    }
  };

  const fetchProjectStats = async () => {
    try {
      const data = await api.get<{ total: number; active: number }>(
        "/api/clients-v2/projects/stats",
      );
      setProjectStats({ total: data?.total || 0, active: data?.active || 0 });
    } catch (err) {
      console.error("Failed to fetch project stats", err);
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

  const handleDeleteClient = (clientId: string, clientName: string) => {
    setClientToDelete({ id: clientId, name: clientName });
    setIsDeleteModalVisible(true);
  };

  const confirmDeleteClient = async () => {
    if (!clientToDelete) return;
    try {
      setIsDeleting(true);
      await api.delete(`/api/clients-v2/${clientToDelete.id}`);
      messageApi.success("Client deleted successfully");
      setIsDeleteModalVisible(false);
      setClientToDelete(null);
      fetchClients(pagination.current, pagination.pageSize, searchText, activeFilter, typeFilter);
      fetchAllClientOptions();
    } catch (err: any) {
      console.error("Failed to delete client", err);
      messageApi.error(err.response?.data?.error || "Failed to delete client");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      const params: any = { page: 1, limit: 1000, search: searchText };
      if (activeFilter === "active") params.status = "Active";
      if (activeFilter === "highRisk") params.riskLevel = "High";
      if (typeFilter) params.clientType = typeFilter;

      const res = await apiUtils.getPaginated("/api/clients-v2", params);
      const allData = res.data || [];

      if (allData.length === 0) {
        messageApi.warning("No data to export");
        return;
      }

      const exportData = allData.map((c: any) => ({
        "Company Name": c.companyName,
        "Client Code": c.clientCode,
        "Type": c.clientType,
        "Status": c.status,
        "Risk Level": c.riskLevel,
        "Contract Value": c.contractValue,
        "Industry": c.industry,
        "Website": c.website,
        "Created At": dayjs(c.createdAt).format("YYYY-MM-DD")
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Clients");
      XLSX.writeFile(wb, `Clients_Export_${dayjs().format("YYYY-MM-DD")}.xlsx`);
      messageApi.success("Exported successfully");
    } catch (err) {
      console.error("Export failed", err);
      messageApi.error("Export failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchClients(pagination.current, pagination.pageSize, searchText, activeFilter, typeFilter);
    fetchProjectStats();
    fetchHighRiskStats();
    fetchAllClientOptions();
    fetchAllProjectOptions();
  };

  useEffect(() => {
    if (tenantId) {
      fetchClients();
      fetchHighRiskStats();
      fetchAllClientOptions();
      fetchAllProjectOptions();
      fetchProjectStats();
    }
  }, [tenantId]);

  /* Distinct client types derived from the loaded option list */
  const typeOptions = useMemo(() => {
    const set = new Set<string>();
    allClientsOpts.forEach(() => { }); // placeholder so order of hooks stays stable
    data.forEach((c) => c.clientType && set.add(c.clientType));
    // Common fallbacks if data is sparse
    ["B2B", "B2C", "Direct", "Enterprise", "Government", "Partner", "Reseller", "SME", "Vendor"].forEach((t) => set.add(t));
    return Array.from(set).sort().map((t) => ({ value: t, label: t }));
  }, [data, allClientsOpts]);

  const handleTypeChange = (value?: string) => {
    setTypeFilter(value);
    fetchClients(1, pagination.pageSize, searchText, activeFilter, value);
  };

  const handleTableChange = (paginationInfo: any) => {
    fetchClients(paginationInfo.current, paginationInfo.pageSize, searchText, activeFilter, typeFilter);
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    fetchClients(1, pagination.pageSize, value, activeFilter, typeFilter);
  };

  const handleFilter = (next: "all" | "active" | "highRisk") => {
    setActiveFilter(next);
    fetchClients(1, pagination.pageSize, searchText, next, typeFilter);
  };

  /* ---------------------- Derived metrics ---------------------- */


  /* ---------------------- Columns ---------------------- */

  const columns: ColumnType<any>[] = [
    {
      title: "Client",
      key: "client",
      width: 320,
      render: (_: any, record: any) => {
        const initials = initialsOf(record.companyName, record.clientCode);
        const grad = gradientFor(record.companyName || record.clientCode);
        const isActive = record.status === "Active";
        return (
          <Space size={14} align="center">
            <div className={`cm-avatar-wrap ${isActive ? "is-active" : ""}`}>
              <div className="cm-avatar">
                <span>{initials}</span>
              </div>
              {isActive && <span className="cm-avatar-pulse" />}
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
        if (!am) return <Text type="secondary" style={{ fontSize: 12.5 }}>Unassigned</Text>;
        const fullName = `${am.first_name || ""} ${am.last_name || ""}`.trim();
        return (
          <Space size={8}>
            <div className="cm-mini-avatar" style={{ background: gradientFor(fullName) }}>
              {(am.first_name?.[0] || "?").toUpperCase()}
              {(am.last_name?.[0] || "").toUpperCase()}
            </div>
            <Text style={{ fontSize: 12.5, fontWeight: 500 }}>{fullName || "—"}</Text>
          </Space>
        );
      },
    },
    {
      title: "Projects",
      key: "projectsCount",
      width: 130,
      render: (_: any, record: any) => {
        const count = record?._count?.ClientProject ?? 0;
        return (
          <span className={`cm-projects-pill ${count > 0 ? "has" : "empty"}`}>
            <span className="cm-projects-ico">
              <FolderKanban size={13} />
            </span>
            <span className="cm-projects-count">{count}</span>
            <span className="cm-projects-label">
              {count === 1 ? "project" : "projects"}
            </span>
          </span>
        );
      },
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
      title: "Actions",
      key: "actions",
      align: "right" as const,
      width: 150,
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
          {canDeleteClient && (
            <Tooltip title="Delete">
              <Button
                type="text"
                size="small"
                icon={<Trash2 size={16} />}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleDeleteClient(record.id, record.companyName);
                }}
                className="cm-action-btn delete"
              />
            </Tooltip>
          )}
          <Tooltip title="View projects">
            <Button
              type="text"
              size="small"
              icon={<FolderKanban size={16} />}
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/clients-v2/${record.id}?tab=projects`);
              }}
              className="cm-action-btn"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  /* ---------------------- Expanded row ---------------------- */

  const expandedRowRender = (record: any, isCardView = false) => {
    const projects = expandedClientProjects[record.id];
    const isLoading = expandedLoading === record.id;

    return (
      <div className={`cm-expanded-wrap ${isCardView ? "cm-expanded-wrap-card" : ""}`}>
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
                  <div className="cm-project-icon">
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      {p.projectManager ? (
                        p.projectManager.avatarUrl ? (
                          <img
                            src={p.projectManager.avatarUrl}
                            alt={p.projectManager.name}
                            style={{ width: 18, height: 18, borderRadius: '5px', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            className="cm-mini-avatar"
                            style={{
                              width: 18,
                              height: 18,
                              background: '#3b82f6',
                              fontSize: 9,
                              fontWeight: 800,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '5px',
                              color: '#fff',
                            }}
                          >
                            {((p.projectManager.name || "?")[0]).toUpperCase()}
                          </div>
                        )
                      ) : null}
                      <Text strong className="cm-project-stat-value">
                        {p.projectManager?.name || "—"}
                      </Text>
                    </div>
                  </div>
                  <div>
                    <Text className="cm-project-stat-label">Tickets</Text>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <CheckCircle2 size={13} color="var(--text-slate-400)" />
                      <Text strong className="cm-project-stat-value">
                        {p._count?.tickets || p.totalTickets || 0}
                      </Text>
                    </div>
                  </div>
                  <div>
                    <Text className="cm-project-stat-label">Members</Text>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <Users size={13} color="var(--text-slate-400)" />
                      <Text strong className="cm-project-stat-value">
                        {p._count?.members || 0}
                      </Text>
                    </div>
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
      <MainLayout noPadding>
        {modalContextHolder}
        {messageContextHolder}

        <Modal
          className="cm-delete-modal"
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "rgba(225,29,72,0.10)",
                  color: "#e11d48",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                }}
              >
                <Trash2 size={18} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-slate-900)" }}>
                  Delete Client
                </div>
                <div style={{ fontSize: 12, color: "var(--text-slate-500)", fontWeight: 500 }}>
                  This action cannot be undone
                </div>
              </div>
            </div>
          }
          open={isDeleteModalVisible}
          onCancel={() => {
            if (!isDeleting) {
              setIsDeleteModalVisible(false);
              setClientToDelete(null);
            }
          }}
          footer={
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
              <Button
                onClick={() => {
                  setIsDeleteModalVisible(false);
                  setClientToDelete(null);
                }}
                style={{ borderRadius: 8 }}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                danger
                loading={isDeleting}
                onClick={confirmDeleteClient}
                style={{ borderRadius: 8, fontWeight: 600 }}
              >
                Delete Client
              </Button>
            </div>
          }
          width={440}
          destroyOnClose
        >
          <div style={{ padding: "8px 0" }}>
            <Text style={{ color: "var(--text-slate-600)", fontSize: 13.5, lineHeight: 1.6 }}>
              Are you sure you want to delete{" "}
              <strong style={{ color: "var(--text-slate-900)" }}>{clientToDelete?.name}</strong>
              ? This will permanently remove the client and all associated data, including contacts,
              allocations, and documents.
            </Text>
          </div>
        </Modal>

        <div className="bh2-page">
          <div className="bh2-shell-wrap">
            <div className="bh2-shell">
              {/* ── Sidebar ───────────────────────────────────────────── */}
              <aside className="bh2-sidebar">
                <div className="bh2-sidebar-top">
                  <div className="bh2-sidebar-brand">
                    <div className="bh2-hero-icon-box">
                      <Building2 size={18} color="#3b82f6" />
                    </div>
                    <div className="min-w-0">
                      <h1 className="bh2-sidebar-title">Client Management</h1>
                      <p className="bh2-sidebar-subtitle">Monitor and configure profiles</p>
                    </div>
                  </div>
                  {canCreateClient && (
                    <Button
                      type="primary"
                      icon={<Plus size={16} />}
                      className="bh2-side-create"
                      block
                      onClick={() => router.push("/clients-v2/create")}
                    >
                      New Client
                    </Button>
                  )}
                </div>

                <div className="bh2-sidebar-scroll">
                  {/* Views */}
                  <div className="bh2-side-group">
                    <div className="bh2-side-label">VIEWS</div>
                    <div className="flex flex-col gap-0.5">
                      {[
                        { k: "all", label: "All clients", icon: <ShieldCheck size={14} />, count: globalStats.totalClients },
                        { k: "active", label: "Active", icon: <CheckCircle2 size={14} />, count: globalStats.activeClients },
                        { k: "highRisk", label: "High risk", icon: <AlertCircle size={14} />, count: highRiskCount },
                      ].map((item) => {
                        const active = activeFilter === item.k;
                        return (
                          <button
                            key={item.k}
                            className={`bh2-view-btn ${active ? "active" : ""}`}
                            onClick={() => handleFilter(item.k as any)}
                          >
                            <span className="bh2-view-icon">{item.icon}</span>
                            <span className="bh2-view-label">{item.label}</span>
                            <span className="bh2-view-count">{item.count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="bh2-side-group" style={{ marginTop: 22 }}>
                    <div className="bh2-side-label">Filters</div>
                    <div className="bh2-side-filters flex flex-col gap-2">
                      <Select
                        showSearch
                        allowClear
                        placeholder="Jump to client…"
                        className="cm-quick-select cm-quick-select-client"
                        popupClassName="cm-quick-popup"
                        suffixIcon={<Building2 size={13} />}
                        options={allClientsOpts}
                        style={{ width: '100%' }}
                        onChange={(id?: string) => {
                          if (id) router.push(`/clients-v2/${id}`);
                        }}
                        filterOption={(input, option) => {
                          const q = (input || "").toLowerCase();
                          const label = ((option?.label as string) || "").toLowerCase();
                          const code = ((option as any)?.code || "").toLowerCase();
                          return label.includes(q) || code.includes(q);
                        }}
                        optionRender={(opt) => (
                          <div className="cm-quick-opt">
                            <span className="cm-quick-opt-main">{opt.label as React.ReactNode}</span>
                            {(opt.data as any)?.code && (
                              <span className="cm-quick-opt-code">{(opt.data as any).code}</span>
                            )}
                          </div>
                        )}
                      />

                      <Select
                        showSearch
                        allowClear
                        placeholder="Jump to project…"
                        className="cm-quick-select cm-quick-select-project"
                        popupClassName="cm-quick-popup"
                        suffixIcon={<FolderKanban size={13} />}
                        options={allProjectsOpts}
                        style={{ width: '100%' }}
                        onChange={(id?: string) => {
                          if (id) router.push(`/projects/${id}/overview`);
                        }}
                        filterOption={(input, option) => {
                          const q = (input || "").toLowerCase();
                          const label = ((option?.label as string) || "").toLowerCase();
                          const code = ((option as any)?.code || "").toLowerCase();
                          return label.includes(q) || code.includes(q);
                        }}
                        optionRender={(opt) => (
                          <div className="cm-quick-opt">
                            <span className="cm-quick-opt-main">{opt.label as React.ReactNode}</span>
                            {(opt.data as any)?.code && (
                              <span className="cm-quick-opt-code">{(opt.data as any).code}</span>
                            )}
                          </div>
                        )}
                      />

                      <Select
                        showSearch
                        allowClear
                        placeholder="Client type"
                        className="cm-quick-select cm-quick-select-type"
                        popupClassName="cm-quick-popup"
                        suffixIcon={<Sparkles size={13} />}
                        value={typeFilter}
                        options={typeOptions}
                        style={{ width: '100%' }}
                        onChange={(v?: string) => handleTypeChange(v)}
                        filterOption={(input, option) =>
                          ((option?.label as string) || "")
                            .toLowerCase()
                            .includes((input || "").toLowerCase())
                        }
                      />
                    </div>
                  </div>
                </div>
              </aside>

              {/* ── Main ──────────────────────────────────────────────── */}
              <main className="bh2-main">
                {/* Toolbar */}
                <div className="bh2-toolbar">
                  <div className="bh2-main-search">
                    <Input
                      placeholder="Search by name or code…"
                      prefix={<Search size={14} style={{ color: 'var(--text-slate-400)' }} />}
                      className="premium-search-input rounded-lg transition-all"
                      style={{ background: 'var(--bg-pure-white)', borderColor: 'var(--border-slate-200)', height: 38 }}
                      value={searchText}
                      onChange={(e) => handleSearch(e.target.value)}
                      allowClear
                    />
                  </div>

                  <div className="bh2-main-stats">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="bh2-pulse-dot" />
                      <span className="font-semibold" style={{ color: 'var(--text-slate-700)' }}>
                        {pagination.total}
                      </span> {pagination.total === 1 ? "result" : "results"}
                    </span>
                  </div>

                  <div className="bh2-main-controls" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div className="flex items-center gap-1 p-[3px] rounded-xl" style={{ border: '1px solid var(--border-slate-200)', background: 'var(--bg-pure-white)', height: 38 }}>
                      <Tooltip title="List">
                        <button
                          onClick={() => setViewMode('list')}
                          className={`flex items-center justify-center rounded-[8px] transition-colors`}
                          style={{
                            width: 30, height: 30,
                            background: viewMode === 'list' ? 'var(--bg-blue-50)' : 'transparent',
                            color: viewMode === 'list' ? 'var(--text-blue-500)' : 'var(--text-blue-400)',
                            border: 'none', cursor: 'pointer'
                          }}
                        >
                          <ListIcon size={16} style={{ color: viewMode === 'list' ? 'var(--text-blue-700)' : 'var(--text-blue-500)' }} />
                        </button>
                      </Tooltip>
                      <Tooltip title="Card">
                        <button
                          onClick={() => setViewMode('card')}
                          className={`flex items-center justify-center rounded-[8px] transition-colors`}
                          style={{
                            width: 30, height: 30,
                            background: viewMode === 'card' ? 'var(--bg-blue-50)' : 'transparent',
                            color: viewMode === 'card' ? 'var(--text-blue-500)' : 'var(--text-blue-400)',
                            border: 'none', cursor: 'pointer'
                          }}
                        >
                          <LayoutGrid size={16} style={{ color: viewMode === 'card' ? 'var(--text-blue-700)' : 'var(--text-blue-500)' }} />
                        </button>
                      </Tooltip>
                    </div>
                    <Button
                      icon={<RefreshCw size={14} className={loading ? "animate-spin" : ""} />}
                      onClick={handleRefresh}
                      style={{ height: 38, width: 38, borderRadius: 8, borderColor: 'var(--border-slate-200)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    />
                    <Button
                      icon={<Download size={14} />}
                      onClick={handleExport}
                      loading={loading}
                      style={{ height: 38, borderRadius: 8, borderColor: 'var(--border-slate-200)' }}
                    >
                      Export
                    </Button>
                  </div>
                </div>

                <div className="cm-ambient" style={{ position: 'absolute', top: 56, left: 0, right: 0, height: 320, zIndex: 0 }} />

                <div className="cm-body" style={{ padding: '12px 0px 14px 0px', position: 'relative', zIndex: 1 }}>
                  {/* Stat grid */}
                  <div className="cm-stat-grid grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4" style={{ marginBottom: 24, display: 'grid' }}>
                    <StatCard
                      label="Total Clients"
                      value={globalStats.totalClients}
                      icon={Users}
                      accent="#3b82f6"
                      subtle="this week"
                      loading={globalStats.totalClients === 0 && loading}
                      trend={{ value: 4, label: "New this week", positive: true }}
                      chart={<Sparkline data={[0.0, 0.05, 0.25, 0.45, 0.45, 0.7, 1.0].map(r => r * globalStats.totalClients)} color="#cbd5e1" />}
                    />
                    <StatCard
                      label="Total Projects"
                      value={projectStats.total}
                      icon={FolderKanban}
                      accent="#3b82f6"
                      subtle="this week"
                      loading={projectStats.total === 0 && loading}
                      trend={{ value: 7, label: "New this week", positive: true }}
                      chart={<Sparkline data={[0.0, 0.3, 0.25, 0.5, 0.65, 0.8, 1.0].map(r => r * projectStats.total)} color="#10b981" />}
                    />
                    <StatCard
                      label="Active Projects"
                      value={projectStats.active}
                      icon={CheckCircle2}
                      accent="#10b981"
                      subtle="this week"
                      loading={projectStats.total === 0 && loading}
                      trend={{ value: 3, label: "New this week", positive: true }}
                      chart={<Sparkline data={[0.0, 0.2, 0.4, 0.55, 0.75, 0.85, 1.0].map(r => r * projectStats.active)} color="#cbd5e1" />}
                    />
                    <StatCard
                      label="Contract Value"
                      value={formatCurrency(globalStats.totalContractValue)}
                      icon={Wallet}
                      accent="#687487"
                      subtle="this week"
                      loading={globalStats.totalClients === 0 && loading}
                      trend={{ value: 1, label: "New this week", positive: true }}
                      chart={<Sparkline data={[1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0].map(r => r * globalStats.totalContractValue)} color="#cbd5e1" />}
                    />
                  </div>

                  {/* Premium table card or Grid */}
                  {viewMode === 'list' ? (
                    <div className="cm-table-card">
                      <Table
                        columns={columns}
                        dataSource={data}
                        rowKey="id"
                        size="middle"
                        scroll={{ x: 1100 }}
                        pagination={false}
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
                              <div className="cm-empty-title">No clients yet</div>
                              <div className="cm-empty-desc">
                                Add your first client to start tracking projects and contracts.
                              </div>
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
                          expandedRowRender: (record) => expandedRowRender(record, false),
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
                  ) : (
                    <div className="bh2-grid">
                      {data.length === 0 ? (
                        <div className="bh2-empty" style={{ gridColumn: "1 / -1" }}>
                          <div className="bh2-empty-icon">
                            <Building2 size={28} style={{ color: "#3b82f6" }} />
                          </div>
                          <Title level={5} style={{ margin: "0 0 6px", fontWeight: 700, color: "var(--text-slate-900)" }}>
                            No clients yet
                          </Title>
                          <Text style={{ fontSize: 13, color: "var(--text-slate-500)", display: "block", marginBottom: 20, maxWidth: 360, textAlign: "center" }}>
                            Add your first client to start tracking projects and contracts.
                          </Text>
                          {canCreateClient && (
                            <Button
                              type="primary"
                              icon={<Plus size={14} />}
                              onClick={() => router.push("/clients-v2/create")}
                              style={{ height: 36, fontWeight: 700, borderRadius: 8, background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", border: "none" }}
                            >
                              Create Client
                            </Button>
                          )}
                        </div>
                      ) : (
                        data.map((record) => {
                          const initials = initialsOf(record.companyName, record.clientCode);
                          const grad = gradientFor(record.companyName || record.clientCode);
                          const isActive = record.status === "Active";
                          const am = record.accountManager;
                          const fullName = am ? `${am.first_name || ""} ${am.last_name || ""}`.trim() : "Unassigned";
                          const projectCount = record?._count?.ClientProject ?? 0;
                          const amInitials = am ? `${am.first_name?.[0] || "?"}${am.last_name?.[0] || ""}`.toUpperCase() : "U";

                          const accent = isActive ? "#3b82f6" : "#64748b";

                          return (
                            <article
                              key={record.id}
                              className="bh2-list-card"
                              style={{ ["--row-accent" as any]: accent }}
                            >
                              <header className="bh2-list-head" style={{ padding: '12px' }}>
                                <div
                                  className="bh2-list-row"
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => router.push(`/clients-v2/${record.id}`)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      router.push(`/clients-v2/${record.id}`);
                                    }
                                  }}
                                  style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}
                                >
                                  <div className="bh2-list-avatar">
                                    <span className="bh2-list-avatar-letter">{initials}</span>
                                  </div>

                                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                                    <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-slate-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {record.companyName}
                                    </span>
                                    <span style={{ fontSize: 12, color: 'var(--text-slate-500)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: accent }} />
                                      {record.clientCode}
                                      {isActive ? (
                                        <span
                                          className="bh2-list-status"
                                          style={{
                                            background: "rgba(16,185,129,0.08)",
                                            borderColor: "rgba(16,185,129,0.2)",
                                            color: "#047857",
                                          }}
                                        >
                                          <Globe2 size={9} style={{ marginRight: 4 }} />
                                          Active
                                        </span>
                                      ) : (
                                        <span
                                          className="bh2-list-status"
                                          style={{
                                            background: "rgba(100,116,139,0.08)",
                                            borderColor: "rgba(100,116,139,0.2)",
                                            color: "#475569",
                                          }}
                                        >
                                          <ShieldCheck size={9} style={{ marginRight: 4 }} />
                                          Inactive
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                </div>

                                {/* Right side more icon */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <div className="bh2-list-more" onClick={e => e.stopPropagation()}>
                                    <Dropdown
                                      menu={{
                                        items: [
                                          {
                                            key: 'view',
                                            icon: <div className="cm-drop-icon" style={{ background: '#eff6ff', color: '#3b82f6', width: 32, height: 32, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Eye size={16} /></div>,
                                            label: (
                                              <div className="cm-drop-text" style={{ marginLeft: 8 }}>
                                                <div className="cm-drop-title" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-slate-800)' }}>View client</div>
                                                <div className="cm-drop-desc" style={{ fontSize: 11, color: 'var(--text-slate-400)', marginTop: 2 }}>Open the full view</div>
                                              </div>
                                            ),
                                            style: { padding: '8px 12px', display: 'flex', alignItems: 'center' },
                                            onClick: () => router.push(`/clients-v2/${record.id}`)
                                          },
                                          ...(canUpdateClient ? [{
                                            key: 'edit',
                                            icon: <div className="cm-drop-icon" style={{ background: '#f1f5f9', color: '#64748b', width: 32, height: 32, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Settings2 size={16} /></div>,
                                            label: (
                                              <div className="cm-drop-text" style={{ marginLeft: 8 }}>
                                                <div className="cm-drop-title" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-slate-800)' }}>Configure</div>
                                                <div className="cm-drop-desc" style={{ fontSize: 11, color: 'var(--text-slate-400)', marginTop: 2 }}>Open in the builder</div>
                                              </div>
                                            ),
                                            style: { padding: '8px 12px', display: 'flex', alignItems: 'center' },
                                            onClick: () => router.push(`/clients-v2/create?id=${record.id}`)
                                          }] : []),
                                          ...(canDeleteClient ? [
                                            { type: 'divider' as const },
                                            {
                                              key: 'delete',
                                              icon: <div className="cm-drop-icon" style={{ background: '#fef2f2', color: '#ef4444', width: 32, height: 32, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={16} /></div>,
                                              label: (
                                                <div className="cm-drop-text" style={{ marginLeft: 8 }}>
                                                  <div className="cm-drop-title" style={{ fontSize: 13, fontWeight: 600, color: '#ef4444' }}>Delete</div>
                                                  <div className="cm-drop-desc" style={{ fontSize: 11, color: 'var(--text-slate-400)', marginTop: 2 }}>Remove this client</div>
                                                </div>
                                              ),
                                              style: { padding: '8px 12px', display: 'flex', alignItems: 'center' },
                                              onClick: () => handleDeleteClient(record.id, record.companyName)
                                            }
                                          ] : [])
                                        ]
                                      }}
                                      trigger={['click']}
                                      placement="bottomRight"
                                    >
                                      <Button
                                        type="text"
                                        className="bh2-more-btn"
                                        icon={<MoreHorizontal size={16} style={{ color: "#94a3b8" }} />}
                                        style={{ padding: '4px', height: 'auto', minWidth: 'auto', marginLeft: '12px' }}
                                      />
                                    </Dropdown>
                                  </div>
                                </div>
                              </header>

                              <div className="bh2-list-foot" style={{ padding: '8px 16px', background: 'var(--bg-slate-50)', borderTop: '1px solid var(--border-slate-200)' }}>
                                <div className="bh2-list-foot-inline">
                                  <span className="bh2-list-foot-item">
                                    <span className="bh2-list-foot-label" style={{ fontSize: 11, fontWeight: 500 }}>Manager</span>
                                    {am ? (
                                      <div
                                        className="cm-mini-avatar"
                                        style={{
                                          width: 18,
                                          height: 18,
                                          background: gradientFor(fullName),
                                          fontSize: 9,
                                          fontWeight: 800,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          borderRadius: '5px',
                                          color: '#fff',
                                          marginLeft: 4,
                                          marginRight: 4
                                        }}
                                      >
                                        {amInitials}
                                      </div>
                                    ) : (
                                      <div
                                        className="cm-mini-avatar"
                                        style={{
                                          width: 18,
                                          height: 18,
                                          background: '#e2e8f0',
                                          fontSize: 9,
                                          fontWeight: 800,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          borderRadius: '5px',
                                          color: '#94a3b8',
                                          marginLeft: 4,
                                          marginRight: 4
                                        }}
                                      >
                                        U
                                      </div>
                                    )}
                                    <b>{fullName}</b>
                                  </span>

                                  {/* <span className="bh2-list-foot-div" style={{ height: 12, width: 1, background: 'var(--border-slate-300)', margin: '0 8px' }} /> */}
                                  <span className="bh2-list-foot-div" />

                                  <span className="bh2-list-foot-item">
                                    <span className="bh2-list-foot-label" style={{ fontSize: 11, fontWeight: 500 }}>Allocation</span>
                                    <b style={{ marginLeft: 4 }}>{projectCount} projects, {record.riskLevel || 'Low'} risk</b>
                                  </span>
                                </div>
                              </div>

                              <footer className="bh2-list-foot">
                                <div className="bh2-list-foot-inline">
                                  <span className="bh2-list-foot-item">
                                    <span className="bh2-list-foot-label">Created:</span>
                                    <b>
                                      {new Date(record.created_at || Date.now()).toLocaleDateString(undefined, {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })}
                                    </b>
                                  </span>

                                  <span className="bh2-list-foot-div" />

                                  <button
                                    type="button"
                                    className={`bh2-manage-btn ${expandedCardId === record.id ? "active" : ""}`}
                                    style={{ ["--row-accent" as any]: accent, display: 'flex', alignItems: 'center', gap: 6 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedCardId((prev) => {
                                        const next = prev === record.id ? null : record.id;
                                        if (next && !expandedClientProjects[next]) {
                                          fetchClientProjects(next);
                                        }
                                        return next;
                                      });
                                    }}
                                  >
                                    <FolderKanban size={13} />
                                    <span style={{ fontWeight: 600 }}>Active Projects</span>
                                    <ChevronDown size={14} style={{ marginLeft: 2, transform: expandedCardId === record.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                                  </button>
                                </div>
                              </footer>

                              {expandedCardId === record.id && (
                                <>
                                  <div className="bh2-list-divider" />
                                  <div className="cm-card-expanded-area">
                                    {expandedRowRender(record, true)}
                                  </div>
                                </>
                              )}
                            </article>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* Fixed pagination footer */}
                {!loading && data.length > 0 && pagination && (
                  <div className="bh2-pagination">
                    <Text style={{ fontSize: 13, color: 'var(--text-slate-500)' }}>
                      Showing <span style={{ color: 'var(--text-slate-700)', fontWeight: 700 }}>
                        {(pagination.current! - 1) * pagination.pageSize! + 1}–{Math.min(pagination.current! * pagination.pageSize!, pagination.total!)}
                      </span> of <span style={{ color: 'var(--text-slate-700)', fontWeight: 700 }}>{pagination.total}</span> client{pagination.total !== 1 ? 's' : ''}
                    </Text>
                    <Pagination
                      current={pagination.current}
                      pageSize={pagination.pageSize}
                      total={pagination.total}
                      onChange={(p, s) => {
                        fetchClients(p, s, searchText, activeFilter, typeFilter);
                      }}
                      showSizeChanger
                      pageSizeOptions={["10", "20", "50"]}
                    />
                  </div>
                )}
              </main>
            </div>
          </div>

          {/* ----------------------------- Styles ------------------------------ */}
          <style jsx global>{`

/* === BH2 LAYOUT STYLES COPIED === */

        /* ── Page shell ──────────────────────────────────────────── */
        .bh2-page {
          background: var(--bg-pure-white);
          min-height: calc(100vh - 54px);
          display: flex;
          flex-direction: column;
          margin: 0 ;
        }
        [data-theme="dark"] .bh2-page {
          background: var(--bg-pure-white) !important;
        }

        .bh2-shell-wrap {
          flex: 1;
        }
        .bh2-shell {
          display: grid;
          grid-template-columns: 252px minmax(0, 1fr);
          gap: 0;
          align-items: stretch;
          min-height: calc(100vh - 54px);
        }
        .bh2-main {
          min-width: 0;
          padding: 14px 24px 32px;
          background: var(--bg-pure-white);
          display: flex;
          flex-direction: column;
        }
        [data-theme="dark"] .bh2-main {
          background: transparent !important;
        }

        /* ── Sidebar ─────────────────────────────────────────────── */
        .bh2-sidebar {
          width: 252px;
          background: var(--bg-pure-white);
          border-right: 1px solid var(--border-slate-200);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          position: sticky;
          top: 0;
          height: calc(100vh - 54px);
          overflow: hidden;
          z-index: 10;
        }
        [data-theme="dark"] .bh2-sidebar {
          background: #0f1419 !important;
          border-right-color: #1f2937 !important;
        }

        .bh2-sidebar-top { 
          padding: 14px 14px 12px 18px;
          border-bottom: 1px solid var(--border-slate-200);
        }
        [data-theme="dark"] .bh2-sidebar-top {
          border-bottom-color: #1f2937 !important;
        }
        .bh2-sidebar-brand { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
        .bh2-hero-icon-box {
          width: 38px; height: 38px; border-radius: 10px;
          background: rgba(59, 130, 246, 0.08);
          display: flex; align-items: center; justify-content: center;
          border: 1px solid rgba(59, 130, 246, 0.18);
          flex-shrink: 0;
        }
        [data-theme='dark'] .bh2-hero-icon-box {
          background: rgba(59, 130, 246, 0.16);
          border-color: rgba(59, 130, 246, 0.28);
        }
        .bh2-sidebar-title { font-size: 14.5px; font-weight: 700; color: var(--text-slate-900); margin: 0 0 2px 0; letter-spacing: -0.01em; line-height: 1.2; }
        [data-theme='dark'] .bh2-sidebar-title { color: #f1f5f9; }
        .bh2-sidebar-subtitle { font-size: 11px; color: var(--text-slate-400); font-weight: 500; margin: 0; line-height: 1.2; }
        .bh2-side-create {
          height: 36px !important;
          border-radius: 6px !important;
          font-weight: 600 !important;
          background: linear-gradient(135deg, #3980f2 0%, #3980f2 100%) !important;
          border: none !important;
        }
        [data-theme="dark"] .bh2-side-create {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%) !important;
        }

        .bh2-sidebar-scroll {
          flex: 1; min-height: 0; overflow-y: auto; padding: 10px 10px 6px 16px;
        }

        .bh2-side-group { margin-bottom: 22px; }
        .bh2-side-label {
          font-size: 10px; font-weight: 800; color: var(--text-slate-400);
          text-transform: uppercase; letter-spacing: 0.08em;
          padding: 0 10px; margin-bottom: 8px;
        }

        .bh2-view-btn {
          display: flex; align-items: center; gap: 10px; padding: 7px 10px;
          border-radius: 6px; background: transparent; border: none; cursor: pointer;
          width: 100%; text-align: left; font-family: inherit; font-size: 12.5px; font-weight: 500;
          color: var(--text-slate-600); transition: all 0.15s ease;
        }
        .bh2-view-btn:hover { background: var(--bg-slate-50); color: var(--text-slate-900); }
        .bh2-view-btn.active { background: var(--bg-blue-50); color: var(--text-blue-700); }
        [data-theme='dark'] .bh2-view-btn { color: #94a3b8; }
        [data-theme='dark'] .bh2-view-btn:hover { background: rgba(255,255,255,0.03); color: #f1f5f9; }
        [data-theme='dark'] .bh2-view-btn.active { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }

        .bh2-view-icon { font-size: 14px; color: var(--text-slate-400); display: flex; align-items: center; }
        .bh2-view-btn.active .bh2-view-icon { color: var(--text-blue-600); }
        [data-theme='dark'] .bh2-view-icon { color: #64748b; }
        [data-theme='dark'] .bh2-view-btn.active .bh2-view-icon { color: #60a5fa; }

        .bh2-view-count {
          margin-left: auto; font-size: 10.5px; font-weight: 600; color: var(--text-slate-400);
          background: var(--bg-slate-50); padding: 2px 6px; border-radius: 10px;
        }
        .bh2-view-btn.active .bh2-view-count {
          background: rgba(59, 130, 246, 0.15); color: var(--text-blue-700);
        }
        [data-theme='dark'] .bh2-view-count { background: #1c232e; color: #64748b; }
        [data-theme='dark'] .bh2-view-btn.active .bh2-view-count { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }

        .bh2-view-label {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
          color: #cbd5e1 !important;
        }
        [data-theme="dark"] .bh2-sidebar-item:hover {
          background: #1c232e !important;
        }
        .bh2-sidebar-item.active {
          background: rgba(59, 130, 246, 0.08);
          border-color: rgba(59, 130, 246, 0.2);
          color: #1d4ed8;
        }
        [data-theme="dark"] .bh2-sidebar-item.active {
          background: rgba(59, 130, 246, 0.18) !important;
          border-color: rgba(59, 130, 246, 0.32) !important;
          color: #60a5fa !important;
        }
        .bh2-sidebar-item-icon {
          width: 22px;
          height: 22px;
          border-radius: 6px;
          border: 1px solid;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 800;
          flex-shrink: 0;
          letter-spacing: -0.01em;
        }
        .bh2-icon-all {
          background: var(--bg-slate-50);
          border-color: var(--border-slate-200);
          color: var(--text-slate-600);
        }
        [data-theme="dark"] .bh2-icon-all {
          background: #1c232e !important;
          border-color: #2d3748 !important;
          color: #94a3b8 !important;
        }
        .bh2-sidebar-item-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
          margin: 0 6px 0 7px;
        }
        .bh2-sidebar-item-label {
          flex: 1;
          font-size: 12.5px;
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          letter-spacing: -0.005em;
        }
        .bh2-sidebar-item-count {
          font-size: 10.5px;
          font-weight: 700;
          color: var(--text-slate-500);
          font-variant-numeric: tabular-nums;
          background: var(--bg-slate-50);
          border-radius: 999px;
          padding: 0 6px;
          line-height: 1.6;
          border: 1px solid var(--border-slate-200);
          flex-shrink: 0;
        }
        [data-theme="dark"] .bh2-sidebar-item-count {
          background: #1c232e !important;
          border-color: #2d3748 !important;
          color: #94a3b8 !important;
        }
        .bh2-sidebar-item.active .bh2-sidebar-item-count {
          background: rgba(59, 130, 246, 0.14);
          border-color: rgba(59, 130, 246, 0.28);
          color: #1d4ed8;
        }
        [data-theme="dark"] .bh2-sidebar-item.active .bh2-sidebar-item-count {
          background: rgba(59, 130, 246, 0.22) !important;
          border-color: rgba(59, 130, 246, 0.38) !important;
          color: #60a5fa !important;
        }

        /* Project row with expandable toggle */
        .bh2-sidebar-proj-row {
          display: flex;
          align-items: center;
          gap: 2px;
          padding: 0;
          border-radius: 8px;
          border: 1px solid transparent;
          transition: background 0.12s ease, border-color 0.12s ease;
        }
        .bh2-sidebar-proj-row:hover {
          background: var(--bg-slate-50);
        }
        [data-theme="dark"] .bh2-sidebar-proj-row:hover {
          background: #1c232e !important;
        }
        .bh2-sidebar-proj-row.active {
          background: rgba(59, 130, 246, 0.08);
          border-color: rgba(59, 130, 246, 0.2);
        }
        [data-theme="dark"] .bh2-sidebar-proj-row.active {
          background: rgba(59, 130, 246, 0.18) !important;
          border-color: rgba(59, 130, 246, 0.32) !important;
        }
        .bh2-sidebar-proj-toggle {
          flex-shrink: 0;
          width: 18px;
          height: 30px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          color: var(--text-slate-500);
          cursor: pointer;
          border-radius: 4px;
          transition: color 0.12s ease;
        }
        .bh2-sidebar-proj-toggle:hover {
          color: #1d4ed8;
        }
        .bh2-sidebar-proj-main {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 6px 10px 6px 4px;
          background: transparent;
          border: none;
          cursor: pointer;
          font-family: inherit;
          color: var(--text-slate-700);
          text-align: left;
          min-width: 0;
        }
        [data-theme="dark"] .bh2-sidebar-proj-main {
          color: #cbd5e1 !important;
        }
        .bh2-sidebar-proj-row.active .bh2-sidebar-proj-main {
          color: #1d4ed8;
        }
        [data-theme="dark"] .bh2-sidebar-proj-row.active .bh2-sidebar-proj-main {
          color: #60a5fa !important;
        }

        /* Nested buckets under project */
        .bh2-sidebar-children {
          display: flex;
          flex-direction: column;
          gap: 0;
          margin: 2px 0 4px 22px;
          padding-left: 8px;
          border-left: 1px dashed var(--border-slate-200);
        }
        [data-theme="dark"] .bh2-sidebar-children {
          border-left-color: #2d3748 !important;
        }
        .bh2-sidebar-bucket {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 5px 8px;
          border-radius: 6px;
          border: 1px solid transparent;
          background: transparent;
          cursor: pointer;
          font-family: inherit;
          color: var(--text-slate-600);
          text-align: left;
          width: 100%;
          transition: background 0.12s ease, color 0.12s ease;
          min-width: 0;
        }
        .bh2-sidebar-bucket:hover {
          background: var(--bg-slate-50);
          color: #1d4ed8;
        }
        [data-theme="dark"] .bh2-sidebar-bucket {
          color: #94a3b8 !important;
        }
        [data-theme="dark"] .bh2-sidebar-bucket:hover {
          background: #1c232e !important;
          color: #60a5fa !important;
        }
        .bh2-sidebar-bucket-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .bh2-sidebar-bucket-label {
          flex: 1;
          font-size: 11.5px;
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .bh2-sidebar-bucket-count {
          font-size: 10px;
          font-weight: 700;
          color: var(--text-slate-400);
          font-variant-numeric: tabular-nums;
          flex-shrink: 0;
        }
        .bh2-sidebar-empty-mini {
          padding: 6px 8px;
          font-size: 11px;
          color: var(--text-slate-400);
          font-style: italic;
        }
        .bh2-sidebar-empty {
          padding: 10px 8px;
          font-size: 11px;
          color: var(--text-slate-400);
        }
        .bh2-sidebar-divider {
          height: 1px;
          background: var(--border-slate-100);
          margin: 6px 4px;
        }
        [data-theme="dark"] .bh2-sidebar-divider {
          background: #1f2937 !important;
        }
        .bh2-sidebar-clear {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 100%;
          margin-top: 6px;
          padding: 8px;
          background: transparent;
          border: 1px dashed var(--border-slate-200);
          border-radius: 8px;
          color: var(--text-slate-500);
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: color 0.12s ease, border-color 0.12s ease;
        }
        .bh2-sidebar-clear:hover {
          color: #1d4ed8;
          border-color: rgba(59, 130, 246, 0.4);
        }
        [data-theme="dark"] .bh2-sidebar-clear {
          border-color: #2d3748 !important;
          color: #94a3b8 !important;
        }

        /* ── Main toolbar ───────────────────────────────────────── */
        .bh2-toolbar {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          position: sticky;
          top: 0;
          z-index: 10;
          background: var(--bg-pure-white);
          margin: -14px -24px 0;
          padding: 6px 20px;
          border-bottom: 1px solid var(--border-slate-200);
        }
        [data-theme="dark"] .bh2-toolbar {
          background: #0d1117 !important;
          border-bottom-color: #1f2937 !important;
        }
        .bh2-main-search {
          flex: 1;
          max-width: 320px;
        }
         .premium-search-input{
          border-radius: 6px !important;
          height: 32px !important;
        }
        .bh2-search-kbd {
          display: inline-block;
          font-family: ui-monospace, SFMono-Regular, monospace;
          font-size: 10.5px;
          font-weight: 700;
          padding: 1px 6px;
          margin: 0 2px;
          border-radius: 5px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          color: var(--text-slate-700);
          box-shadow: 0 1px 0 var(--border-slate-200);
        }
        .bh2-main-stats {
          margin-left: 12px;
          color: var(--text-slate-500);
          font-size: 13px;
        }
        .bh2-pulse-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 0 rgba(16, 185, 129, 0.4);
          animation: bh2-pulse 2s infinite;
        }
        @keyframes bh2-pulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .bh2-main-controls {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .bh2-vis-badge {
          width: 22px;
          height: 22px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid;
        }
        .bh2-vis-badge-public {
          background: rgba(16, 185, 129, 0.1);
          border-color: rgba(16, 185, 129, 0.25);
          color: #047857;
        }
        .bh2-vis-badge-private {
          background: rgba(245, 158, 11, 0.1);
          border-color: rgba(245, 158, 11, 0.25);
          color: #b45309;
        }
        /* RangePicker — match the SearchableDropdown trigger height/border */
        .bh2-range-picker {
          height: 32px !important;
          border-radius: 8px !important;
          font-size: 12px;
        }
        .bh2-range-picker.ant-picker {
          border-color: var(--border-slate-200) !important;
        }
        [data-theme="dark"] .bh2-range-picker.ant-picker {
          background: #161b22 !important;
          border-color: #2d3748 !important;
        }
        .bh2-toolbar-icon {
          width: 26px;
          height: 26px;
          border-radius: 7px;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .bh2-toolbar-chip {
          font-size: 10.5px;
          font-weight: 700;
          color: var(--text-slate-600);
          background: var(--bg-slate-50);
          border: 1px solid var(--border-slate-200);
          padding: 2px 8px;
          border-radius: 999px;
          letter-spacing: 0.01em;
        }
        [data-theme="dark"] .bh2-toolbar-chip {
          background: #1c232e !important;
          border-color: #2d3748 !important;
          color: #cbd5e1 !important;
        }
        .bh2-search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 12px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 10px;
          width: 260px;
          transition: border-color 0.15s ease;
        }
        .bh2-search-box.active {
          border-color: rgba(59, 130, 246, 0.4);
        }
        [data-theme="dark"] .bh2-search-box {
          background: #161b22 !important;
          border-color: #2d3748 !important;
        }
        [data-theme="dark"] .bh2-search-box.active {
          border-color: rgba(59, 130, 246, 0.5) !important;
        }

        /* ── List cards ─────────────────────────────────────────── */
        .bh2-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-top: 10px;
        }
        
        .bh2-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          padding-top: 10px;
        }
        
        @media (max-width: 1200px) {
          .bh2-grid {
            grid-template-columns: 1fr;
          }
        }

        /* ── Sticky pagination footer ──────────────────────────── */
        .bh2-pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 24px;
          margin: auto -24px -32px -24px;
          flex-wrap: wrap;
          position: sticky;
          bottom: 0;
          background: var(--bg-pure-white);
          border-top: 1px solid var(--border-slate-200);
          z-index: 10;
          box-shadow: 0 -4px 16px rgba(15, 23, 42, 0.04);
        }
        [data-theme="dark"] .bh2-pagination {
          background: #161b22 !important;
          border-top-color: #1f2937 !important;
        }

        /* Custom Pagination Styles */
        .bh2-pagination .ant-pagination-item,
        .bh2-pagination .ant-pagination-prev .ant-pagination-item-link,
        .bh2-pagination .ant-pagination-next .ant-pagination-item-link {
          border: 1px solid var(--border-slate-200) !important;
          border-radius: 6px !important;
          background: transparent !important;
          color: var(--text-slate-500) !important;
        }
        .bh2-pagination .ant-pagination-item-active {
          background: #3b82f6 !important;
          border-color: #3b82f6 !important;
        }
        .bh2-pagination .ant-pagination-item-active a {
          color: #fff !important;
        }
        .bh2-pagination .ant-select-selector {
          border: 1px solid var(--border-slate-200) !important;
          border-radius: 6px !important;
          color: var(--text-slate-500) !important;
        }

        .bh2-list-card {
          position: relative;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 0px;
          /* When we smooth-scroll a card into view on Manage-Tickets click,
             land its top 120px below the viewport so it clears the sticky
             page header (~52px) + sticky toolbar (~60px). */
          scroll-margin-top: 120px;
          padding: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: border-color 0.2s ease, background 0.2s ease;
        }
        [data-theme="dark"] .bh2-list-card {
          background: #161b22 !important;
          border-color: #1f2937 !important;
        }
        .bh2-list-card:hover {
          border-color: var(--row-accent, #3b82f6);
        }
        [data-theme="dark"] .bh2-list-card:hover {
          background: #1c232e !important;
        }
        .bh2-list-card-skel {
          min-height: 96px;
        }

        .bh2-list-head {
          display: flex;
          align-items: center;
        }
        .bh2-list-row {
          display: flex;
          align-items: center;
          gap: 14px;
          flex: 1;
          min-width: 0;
          cursor: pointer;
          background: transparent;
          border: none;
          padding: 0;
          text-align: left;
          font-family: inherit;
          outline: none;
        }
        .bh2-list-row:focus-visible {
          outline: 2px solid rgba(59, 130, 246, 0.3);
          outline-offset: 4px;
          border-radius: 8px;
        }
        .bh2-list-row-segments {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          flex-wrap: wrap;
        }
        .bh2-list-more {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .bh2-list-row-div {
          width: 1px;
          height: 18px;
          background: var(--border-slate-200);
          flex-shrink: 0;
        }
        [data-theme="dark"] .bh2-list-row-div {
          background: #2d3748 !important;
        }
        .bh2-list-seg {
          display: inline-flex;
          align-items: center;
          min-width: 0;
        }
        .bh2-list-seg-project {
          gap: 6px;
          flex-shrink: 0;
        }
        .bh2-list-seg-bucket {
          gap: 8px;
          flex: 1;
          min-width: 0;
        }
        .bh2-list-seg-label {
          font-size: 10px;
          font-weight: 800;
          color: var(--text-slate-500);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        [data-theme="dark"] .bh2-list-seg-label {
          color: #94a3b8 !important;
        }
        .bh2-list-seg-value {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 700;
          color: var(--text-slate-700);
          letter-spacing: -0.005em;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        [data-theme="dark"] .bh2-list-seg-value {
          color: #cbd5e1 !important;
        }
        .bh2-list-seg-value.muted {
          color: var(--text-slate-400);
          font-style: italic;
          font-weight: 600;
        }
        .bh2-list-seg-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .bh2-list-seg-name {
          flex: 1;
          min-width: 0;
          font-size: 13.5px;
          font-weight: 800;
          color: var(--text-slate-900);
          letter-spacing: -0.025em;
          line-height: 1.25;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        [data-theme="dark"] .bh2-list-seg-name {
          color: #f1f5f9 !important;
        }
        .bh2-list-row:hover .bh2-list-seg-name {
          color: #1d4ed8;
        }
        [data-theme="dark"] .bh2-list-row:hover .bh2-list-seg-name {
          color: #60a5fa !important;
        }
        .bh2-list-avatar {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          border: 1px solid transparent;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: -0.025em;
          flex-shrink: 0;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
          color: #fff;
        }
        [data-theme="dark"] .bh2-list-avatar {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
        }
        .bh2-list-avatar::after {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 75% 0%, rgba(255, 255, 255, 0.2), transparent 55%),
            radial-gradient(circle at 0% 100%, rgba(0, 0, 0, 0.06), transparent 55%);
          pointer-events: none;
        }
        .bh2-list-avatar-letter {
          position: relative;
          z-index: 1;
          line-height: 1;
          color: #fff;
        }
        .bh2-list-status {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 2px 9px;
          border-radius: 999px;
          border: 1px solid;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.01em;
        }

        .bh2-list-desc {
          margin: 0;
          padding: 4px 8px;
          font-size: 11.5px;
          font-weight: 500;
          color: var(--text-slate-600);
          background: var(--bg-slate-50);
          border: 1px dashed var(--border-slate-200);
          border-radius: 6px;
          align-self: flex-start;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        [data-theme="dark"] .bh2-list-desc {
          background: #1c232e !important;
          border-color: #2d3748 !important;
          color: #cbd5e1 !important;
        }

        /* Body */
        .bh2-list-body {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 12px;
          background: var(--bg-slate-50);
          padding: 10px;
          border-top: 1px solid var(--border-slate-100);
        }
        [data-theme="dark"] .bh2-list-body {
          background: rgba(30, 41, 59, 0.4) !important;
          border-top-color: #1f2937 !important;
        }
        .bh2-list-block {
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 8px;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }
        [data-theme="dark"] .bh2-list-block {
          background: #1c232e !important;
          border-color: #2d3748 !important;
        }
        .bh2-list-block-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .bh2-list-block-label {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 9px;
          font-weight: 800;
          color: var(--text-slate-500);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        [data-theme="dark"] .bh2-list-block-label {
          color: #94a3b8 !important;
        }
        .bh2-list-stats {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .bh2-list-stat {
          display: inline-flex;
          align-items: baseline;
          gap: 5px;
        }
        .bh2-list-stat-value {
          font-size: 15px;
          font-weight: 800;
          color: var(--text-slate-900);
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.02em;
        }
        [data-theme="dark"] .bh2-list-stat-value {
          color: #f1f5f9 !important;
        }
        .bh2-list-stat-label {
          font-size: 10.5px;
          font-weight: 600;
          color: var(--text-slate-500);
        }
        .bh2-list-stat-sep {
          width: 1px;
          height: 14px;
          background: var(--border-slate-200);
        }
        [data-theme="dark"] .bh2-list-stat-sep {
          background: #2d3748 !important;
        }
        .bh2-list-owner {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .bh2-list-owner-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
          line-height: 1.25;
        }
        .bh2-list-owner-name {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-slate-800);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        [data-theme="dark"] .bh2-list-owner-name {
          color: #e2e8f0 !important;
        }
        .bh2-list-owner-email {
          font-size: 10.5px;
          font-weight: 500;
          color: var(--text-slate-500);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Footer */
        .bh2-list-foot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 6px 16px;
          border-top: 1px solid var(--border-slate-200);
          background: var(--bg-slate-50);
        }
        [data-theme="dark"] .bh2-list-foot {
          background: rgba(30, 41, 59, 0.4) !important;
          border-top-color: #1f2937 !important;
        }

        /* Divider between footer and the inline Manage-Tickets panel */
        .bh2-list-divider {
          height: 1px;
          background: var(--border-slate-200);
          margin: 0;
        }
        [data-theme="dark"] .bh2-list-divider {
          background: #1f2937 !important;
        }
        .bh2-list-foot-inline {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          min-width: 0;
        }
        .bh2-list-foot-item {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11.5px;
          font-weight: 500;
          color: var(--text-slate-500);
        }
        .bh2-list-foot-item b {
          color: var(--text-slate-800);
          font-weight: 700;
        }
        [data-theme="dark"] .bh2-list-foot-item b {
          color: #e2e8f0 !important;
        }
        .bh2-list-foot-label {
          font-size: 10px;
          font-weight: 800;
          color: var(--text-slate-500);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .bh2-list-foot-div {
          width: 1px;
          height: 12px;
          background: var(--border-slate-200);
        }
        [data-theme="dark"] .bh2-list-foot-div {
          background: #2d3748 !important;
        }
        .bh2-list-actions {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          flex-shrink: 0;
        }
        .bh2-list-action-btn {
          width: 28px;
          height: 28px;
          padding: 0 !important;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 7px !important;
        }

        /* Labeled footer button (e.g. Move to Sprint / Move to Backlog) */
        .bh2-foot-btn {
          display: inline-flex !important;
          align-items: center;
          gap: 6px;
          height: 28px !important;
          padding: 0 10px !important;
          border-radius: 7px !important;
          border: 1px solid var(--border-slate-200) !important;
          background: var(--bg-pure-white) !important;
          color: var(--text-slate-700) !important;
          font-size: 11.5px !important;
          font-weight: 700 !important;
          letter-spacing: 0.005em;
          transition: border-color 0.12s ease, color 0.12s ease, background 0.12s ease;
        }
        .bh2-foot-btn:hover:not(:disabled) {
          border-color: var(--row-accent, #3b82f6) !important;
          color: var(--row-accent, #3b82f6) !important;
          background: var(--bg-slate-50) !important;
        }
        .bh2-foot-btn:disabled {
          opacity: 0.5;
        }
        [data-theme="dark"] .bh2-foot-btn {
          background: #161b22 !important;
          border-color: #2d3748 !important;
          color: #cbd5e1 !important;
        }
        [data-theme="dark"] .bh2-foot-btn:hover:not(:disabled) {
          background: #1c232e !important;
        }

        /* Manage Tickets button */
        .bh2-manage-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 11px;
          background: #4f689426;
          border: 1px solid var(--border-slate-200);
          border-radius: 999px;
          color: var(--text-slate-600);
          font-family: inherit;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.01em;
          cursor: pointer;
          transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease;
        }
        .bh2-manage-btn:hover {
          color: var(--row-accent, #3b82f6);
          border-color: var(--row-accent, #3b82f6);
          background: var(--bg-slate-50);
        }
        .bh2-manage-btn.active {
          color: var(--row-accent, #3b82f6);
          border-color: var(--row-accent, #3b82f6);
          background: rgba(59, 130, 246, 0.08);
        }
        [data-theme="dark"] .bh2-manage-btn {
          border-color: #2d3748 !important;
          color: #cbd5e1 !important;
        }
        [data-theme="dark"] .bh2-manage-btn:hover {
          background: #1c232e !important;
        }
        [data-theme="dark"] .bh2-manage-btn.active {
          background: rgba(59, 130, 246, 0.18) !important;
        }

        /* Empty */
        .bh2-empty {
          padding: 64px 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        .bh2-empty-icon {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          background: rgba(59, 130, 246, 0.08);
          border: 1px solid rgba(59, 130, 246, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 18px;
        }

        /* ── Responsive ──────────────────────────────────────────── */

        /* Slim sidebar + tighter toolbar on smaller desktop */
        @media (max-width: 1200px) {
          .bh2-shell {
            grid-template-columns: 240px minmax(0, 1fr);
          }
          .bh2-sidebar {
            padding: 12px 8px 14px 14px;
          }
          .bh2-search-box {
            width: 220px;
          }
          .bh2-list-card {
            padding: 16px 18px 14px 20px;
          }
        }

        /* Tablet — toolbar filters wrap to their own row */
        @media (max-width: 1024px) {
          .bh2-toolbar-filters {
            margin-left: 0;
            width: 100%;
            order: 3;
          }
          .bh2-search-box {
            width: 200px;
          }
          .bh2-list-foot {
            flex-wrap: wrap;
            row-gap: 10px;
          }
        }

        /* Sidebar collapses above content */
        @media (max-width: 900px) {
          .bh2-page {
            margin: 0 -16px;
          }
          .bh2-shell {
            grid-template-columns: 1fr;
          }
          .bh2-sidebar {
            position: relative;
            top: 0;
            height: auto;
            max-height: 320px;
            padding: 10px 16px 12px;
            border-right: none;
            border-bottom: 1px solid var(--border-slate-200);
          }
          .bh2-main {
            padding: 14px 16px 28px;
          }
          .bh2-list-body {
            grid-template-columns: 1fr;
          }
          .bh2-toolbar {
            margin: -14px -16px 0;
            padding: 12px 16px;
          }
          .bh2-pagination {
            margin: 14px -16px -28px;
            padding: 10px 16px;
          }
          .bh2-list-card {
            padding: 14px 16px 14px 18px;
            gap: 12px;
          }
          .bh2-list-stripe {
            top: 14px;
            bottom: 14px;
          }
          /* When sidebar is above the main column, drop the desktop scroll-margin
             since the user no longer has to clear a fixed left rail. */
          .bh2-list-card {
            scroll-margin-top: 88px;
          }
        }

        /* Phone */
        @media (max-width: 640px) {
          .bh2-page {
            margin: 0 -8px;
          }
          .bh2-main {
            padding: 12px 12px 24px;
          }
          .bh2-toolbar {
            flex-direction: column;
            align-items: stretch;
            margin: -12px -12px 0;
            padding: 10px 12px;
          }
          .bh2-toolbar-title {
            width: 100%;
            justify-content: space-between;
          }
          .bh2-toolbar-filters {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            width: 100%;
          }
          .bh2-toolbar-filters > * {
            width: 100% !important;
            min-width: 0 !important;
          }
          .bh2-range-picker {
            grid-column: 1 / -1;
          }
          .bh2-search-box {
            width: 100%;
          }
          /* Bucket cards */
          .bh2-list-card {
            padding: 14px 14px 12px 16px;
            scroll-margin-top: 76px;
          }
          .bh2-list-row {
            gap: 10px;
          }
          .bh2-list-avatar {
            width: 38px;
            height: 38px;
            border-radius: 10px;
            font-size: 15px;
          }
          .bh2-list-seg-name {
            font-size: 14px;
            white-space: normal;
          }
          .bh2-list-foot {
            flex-direction: column;
            align-items: stretch;
          }
          .bh2-list-actions {
            flex-wrap: wrap;
            row-gap: 6px;
            justify-content: flex-start;
          }
          .bh2-foot-btn {
            flex: 1;
            justify-content: center;
          }
          /* Pagination */
          .bh2-pagination {
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
            margin: 12px -12px -24px;
            padding: 10px 12px;
          }
          .bh2-pagination-meta {
            text-align: center;
          }
          /* Sidebar items more compact */
          .bh2-sidebar {
            padding: 8px 14px 10px;
            max-height: 280px;
          }
          .bh2-sidebar-section-head {
            padding: 4px 6px 6px;
          }
        }

        /* Very small phones */
        @media (max-width: 400px) {
          .bh2-list-stripe {
            display: none;
          }
          .bh2-list-status {
            font-size: 9.5px;
          }
          .bh2-list-seg-name {
            font-size: 13px;
          }
        }
      
/* ================================ */
            .cm-page {
              position: relative;
              margin: 0 -24px;
              background: var(--bg-primary);
              min-height: calc(100vh - 64px);
            }
            /* Subtle ambient accent — adds depth without glassiness */
            .cm-ambient {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 320px;
              pointer-events: none;
              background:
                radial-gradient(900px 240px at 12% 0%, rgba(139, 92, 246, 0.06), transparent 60%),
                radial-gradient(700px 220px at 90% 0%, rgba(59, 130, 246, 0.05), transparent 60%);
              z-index: 0;
            }
            [data-theme='dark'] .cm-ambient {
              background:
                radial-gradient(900px 240px at 12% 0%, rgba(139, 92, 246, 0.10), transparent 60%),
                radial-gradient(700px 220px at 90% 0%, rgba(59, 130, 246, 0.08), transparent 60%);
            }
            .cm-body {
              position: relative;
              z-index: 1;
              padding: 8px 32px 40px 32px;
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
              margin-bottom: 22px;
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
              border-radius: 0;
              padding: 12px 14px;
              min-height: 92px;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              gap: 10px;
              overflow: hidden;
              transition: transform .25s cubic-bezier(.2,.8,.2,1),
                          box-shadow .25s cubic-bezier(.2,.8,.2,1),
                          border-color .25s ease;
              box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
            }
            .cm-stat-card:hover {
              transform: translateY(-2px);
              box-shadow: 0 18px 36px -22px rgba(15,23,42,0.22);
              border-color: var(--border-slate-200);
            }
            .cm-stat-card:hover .cm-stat-accent { opacity: 1; }
            .cm-stat-accent {
              position: absolute;
              left: 0; right: 0; bottom: 0;
              height: 2px;
              opacity: 0.55;
              transition: opacity .25s ease;
              pointer-events: none;
            }
            .dh-stats-card:hover {
                border-color: var(--border-slate-300, #cbd5e1) !important;
                box-shadow: 0 4px 14px rgba(15, 23, 42, 0.07) !important;
            }
            [data-theme='dark'] .dh-stats-card:hover {
                background: rgba(255, 255, 255, 0.02) !important;
            }
            
            .cm-stat-top {
              display: flex;
              align-items: center;
              justify-content: space-between;
            }
            .cm-stat-left {
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .cm-stat-icon {
              width: 26px; height: 26px;
              border-radius: 8px;
              display: flex; align-items: center; justify-content: center;
              flex-shrink: 0;
            }
            .cm-stat-label {
              font-size: 12px;
              font-weight: 600;
              color: var(--text-slate-600);
            }
            
            .cm-stat-bottom {
              display: flex;
              align-items: flex-end;
              justify-content: space-between;
              gap: 8px;
            }
            .cm-stat-value-wrap {
              display: flex;
              align-items: baseline;
              gap: 6px;
            }
            .cm-stat-value {
              font-size: 23px;
              font-weight: 800;
              color: var(--text-slate-900);
              letter-spacing: -0.02em;
              line-height: 1;
              font-variant-numeric: tabular-nums;
            }
            .cm-stat-period {
              font-size: 11px;
              color: var(--text-slate-400);
              font-weight: 500;
            }
            .cm-stat-chart {
              opacity: 0.95;
            }
            
            .cm-trend {
              display: inline-flex;
              align-items: center;
              gap: 4px;
              padding: 3px 7px;
              border-radius: 999px;
              font-size: 10.5px;
              font-weight: 700;
              line-height: 1;
              white-space: nowrap;
            }
            .cm-trend.up { background: rgba(16,185,129,0.1); color: #047857; }
            .cm-trend.down { background: rgba(239,68,68,0.1); color: #b91c1c; }
            .cm-trend-value { letter-spacing: 0.01em; }

            /* MiniBar */
            .cm-minibar { display: flex; flex-direction: column; gap: 7px; }
            .cm-minibar-track {
              height: 6px;
              background: var(--bg-slate-50);
              border-radius: 999px;
              display: flex;
              overflow: hidden;
              border: 1px solid var(--border-slate-100);
            }
            .cm-minibar-seg {
              display: block;
              height: 100%;
              transition: width .4s ease;
            }
            .cm-minibar-seg + .cm-minibar-seg {
              border-left: 1px solid var(--bg-pure-white);
            }
            .cm-minibar-legend {
              display: flex;
              gap: 12px;
              flex-wrap: wrap;
            }
            .cm-minibar-legend-item {
              display: inline-flex;
              align-items: center;
              gap: 5px;
              font-size: 11px;
              color: var(--text-slate-600);
              font-weight: 500;
            }
            .cm-minibar-dot {
              width: 7px; height: 7px;
              border-radius: 2px;
              display: inline-block;
            }

            /* Inline progress (active / risk) */
            .cm-progress-row {
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .cm-progress-track {
              flex: 1;
              height: 6px;
              background: var(--bg-slate-50);
              border-radius: 999px;
              overflow: hidden;
              border: 1px solid var(--border-slate-100);
            }
            .cm-progress-fill {
              display: block;
              height: 100%;
              border-radius: 999px;
              transition: width .4s ease;
            }
            .cm-progress-label {
              font-size: 11px;
              font-weight: 700;
              color: var(--text-slate-700);
              font-variant-numeric: tabular-nums;
              white-space: nowrap;
            }

            /* Contract value sub-row */
            .cm-cv-row {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              font-size: 11.5px;
              color: var(--text-slate-600);
              font-weight: 500;
            }
            .cm-cv-row strong {
              color: var(--text-slate-900);
              font-weight: 700;
              font-variant-numeric: tabular-nums;
            }

            /* ---------- Section divider between stats and filters ---------- */
            .cm-section-divider {
              position: relative;
              margin: 4px 0 16px;
              height: 18px;
              display: flex;
              align-items: center;
            }
            .cm-section-divider::before {
              content: "";
              position: absolute;
              left: 0;
              right: 0;
              top: 50%;
              height: 1px;
              background: linear-gradient(
                90deg,
                transparent 0%,
                var(--border-slate-100) 18%,
                var(--border-slate-100) 82%,
                transparent 100%
              );
              transform: translateY(-0.5px);
              pointer-events: none;
            }
            .cm-section-divider-label {
              position: relative;
              z-index: 1;
              background: var(--bg-primary);
              padding: 0 12px;
              margin-left: 4px;
              font-size: 10.5px;
              font-weight: 700;
              letter-spacing: 0.1em;
              text-transform: uppercase;
              color: var(--text-slate-500);
            }

            /* ---------- Toolbar ---------- */
            .cm-toolbar {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
              margin-bottom: 14px;
              flex-wrap: wrap;
              padding: 14px 16px;
              background: var(--bg-pure-white);
              border: 1px solid var(--border-slate-100);
              border-radius: 14px;
              box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
            }
            .cm-toolbar-mid {
              display: flex;
              align-items: center;
              gap: 10px;
              flex: 1 1 auto;
              flex-wrap: wrap;
              justify-content: flex-start;
              padding-left: 4px;
            }

            /* Quick filter dropdowns */
            .cm-quick-select.ant-select {
              min-width: 180px;
            }
            .cm-quick-select.ant-select .ant-select-selector {
              height: 36px !important;
              border-radius: 6px !important;
              border: 1px solid var(--border-slate-100) !important;
              background: var(--bg-slate-50) !important;
              padding: 0 12px !important;
              display: flex !important;
              align-items: center !important;
              transition: all .18s ease;
            }
            .cm-quick-select.ant-select:hover .ant-select-selector {
              border-color: #3b82f6 !important;
            }
            .cm-quick-select.ant-select-focused .ant-select-selector {
              border-color: #3b82f6 !important;
              background: var(--bg-pure-white) !important;
              box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
            }
            .cm-quick-select .ant-select-selection-search-input { height: 34px !important; }
            .cm-quick-select .ant-select-selection-placeholder,
            .cm-quick-select .ant-select-selection-item {
              font-size: 13px !important;
              font-weight: 500;
              line-height: 34px !important;
            }
            .cm-quick-select .ant-select-arrow {
              color: var(--text-slate-400) !important;
              transition: color .15s ease;
            }
            .cm-quick-select.ant-select-focused .ant-select-arrow,
            .cm-quick-select.ant-select:hover .ant-select-arrow {
              color: #3b82f6 !important;
            }
            .cm-quick-select-client.ant-select { width: 100%; }
            .cm-quick-select-project.ant-select { width: 100%; }
            .cm-quick-select-type.ant-select { width: 100%; }

            /* Dropdown popup */
            .cm-quick-popup .ant-select-item {
              padding: 7px 12px !important;
              border-radius: 7px !important;
              margin: 0 6px !important;
              transition: background .15s ease;
            }
            .cm-quick-popup .ant-select-item-option-active {
              background: rgba(139, 92, 246, 0.08) !important;
            }
            .cm-quick-popup .ant-select-item-option-selected {
              background: linear-gradient(135deg, rgba(139, 92, 246, 0.14), rgba(99, 102, 241, 0.1)) !important;
              color: #6d28d9 !important;
              font-weight: 600 !important;
            }
            .cm-quick-opt {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 10px;
              width: 100%;
            }
            .cm-quick-opt-main {
              font-size: 13px;
              font-weight: 500;
              color: var(--text-slate-700);
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              min-width: 0;
            }
            .cm-quick-opt-code {
              font-family: ui-monospace, "SF Mono", Menlo, monospace;
              font-size: 10.5px;
              font-weight: 600;
              color: var(--text-slate-500);
              background: var(--bg-slate-50);
              padding: 1px 6px;
              border-radius: 4px;
              border: 1px solid var(--border-slate-100);
              flex-shrink: 0;
            }

            /* Dark theme */
            [data-theme='dark'] .cm-section-divider-label { background: var(--bg-primary); }
            [data-theme='dark'] .cm-toolbar { background: var(--bg-secondary); }
            [data-theme='dark'] .cm-quick-select.ant-select .ant-select-selector {
              background: var(--bg-secondary) !important;
            }
            [data-theme='dark'] .cm-quick-popup .ant-select-item-option-selected {
              color: #3b82f6 !important;
            }
            [data-theme='dark'] .cm-quick-opt-code {
              background: var(--bg-primary);
              border-color: var(--border-slate-100);
              color: var(--text-slate-400);
            }
            .cm-segmented.ant-segmented {
              background: var(--bg-pure-white) !important;
              border: 1px solid var(--border-slate-100);
              padding: 4px;
              border-radius: 12px;
              box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
            }
            .cm-segmented .ant-segmented-item {
              border-radius: 8px !important;
              transition: all .2s ease;
            }
            .cm-segmented .ant-segmented-item-selected {
              background: linear-gradient(135deg, #8b5cf6, #6366f1) !important;
              color: #fff !important;
              box-shadow: 0 6px 14px -6px rgba(139,92,246,0.5);
            }
            .cm-segmented .ant-segmented-item-selected .ant-segmented-item-label {
              color: #fff !important;
            }
            .cm-segmented .ant-segmented-item-selected .cm-seg-count {
              background: rgba(255,255,255,0.22) !important;
              color: #fff !important;
            }
            .cm-seg-label {
              display: inline-flex;
              align-items: center;
              gap: 7px;
              font-size: 13px;
              font-weight: 600;
              padding: 2px 4px;
            }
            .cm-seg-count {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              min-width: 22px;
              height: 18px;
              padding: 0 6px;
              border-radius: 999px;
              background: var(--bg-slate-50);
              color: var(--text-slate-600);
              font-size: 10.5px;
              font-weight: 700;
              letter-spacing: 0.02em;
              transition: all .2s ease;
              font-variant-numeric: tabular-nums;
            }
            .cm-toolbar-right {
              display: flex;
              align-items: center;
              gap: 12px;
            }
            .cm-result-divider {
              width: 1px;
              height: 18px;
              background: var(--border-slate-100);
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
              background: #3b82f6 !important;
              border: 0 !important;
              box-shadow: 0 6px 16px -8px rgba(59, 130, 246, 0.6) !important;
            }
            .cm-primary-btn:hover {
              filter: brightness(1.05);
              transform: translateY(-1px);
              transition: all .2s ease;
            }
            [data-theme="dark"] .cm-primary-btn {
              background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%) !important;
              box-shadow: 0 6px 16px -8px rgba(59, 109, 252, 0.4) !important;
            }

            /* ---------- Table card ---------- */
            .cm-table-card {
              background: var(--bg-pure-white);
              border-radius: 0;
              border: 1px solid var(--border-slate-200);
              overflow: hidden;
              box-shadow: none;
            }
            .cm-table-card .ant-table {
              background: transparent !important;
            }
            .cm-table-card .ant-table-thead > tr > th {
              background: var(--bg-slate-50) !important;
              border-bottom: 1px solid var(--border-slate-200) !important;
              font-size: 10px !important;
              font-weight: 700 !important;
              letter-spacing: 0.04em !important;
              text-transform: uppercase !important;
              color: var(--text-slate-400) !important;
              padding: 6px 10px !important;
              white-space: nowrap !important;
            }
            .cm-table-card .ant-table-thead > tr > th::before { display: none !important; }
            .cm-table-card .ant-table-tbody > tr > td {
              padding: 6.5px 10px !important;
              border-bottom: 1px solid var(--border-slate-100) !important;
              transition: background .15s ease;
              position: relative;
            }
            .cm-table-card .cm-row:hover > td {
              background: var(--bg-slate-50) !important;
            }
            .cm-table-card .ant-table-tbody > tr.ant-table-row-level-0:last-child > td {
              border-bottom: 0 !important;
            }

            /* avatar / cells */
            .cm-avatar-wrap {
              position: relative;
              width: 38px; height: 38px;
              flex-shrink: 0;
            }
            .cm-avatar {
              width: 38px; height: 38px;
              border-radius: 10px;
              display: flex; align-items: center; justify-content: center;
              background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
              color: #fff;
              font-weight: 700;
              font-size: 13.5px;
              letter-spacing: 0.02em;
              box-shadow: 0 2px 6px rgba(15,23,42,0.10),
                          inset 0 1px 0 rgba(255,255,255,0.18);
              flex-shrink: 0;
            }
            [data-theme="dark"] .cm-avatar {
              background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
            }
            .cm-avatar-wrap.is-active .cm-avatar-pulse {
              position: absolute;
              right: -2px;
              bottom: -2px;
              width: 11px; height: 11px;
              border-radius: 50%;
              background: #10b981;
              border: 2px solid var(--bg-pure-white);
              box-shadow: 0 0 0 2px rgba(16,185,129,0.25);
              animation: cm-avatar-pulse 2.4s ease-in-out infinite;
            }
            @keyframes cm-avatar-pulse {
              0%, 100% { box-shadow: 0 0 0 2px rgba(16,185,129,0.25); }
              50% { box-shadow: 0 0 0 4px rgba(16,185,129,0.08); }
            }
            .cm-mini-avatar {
              width: 22px; height: 22px;
              border-radius: 6px;
              display: flex; align-items: center; justify-content: center;
              color: #fff; font-weight: 700; font-size: 10px;
              flex-shrink: 0;
              background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
            }
            .cm-client-name {
              display: flex; align-items: center; gap: 6px;
              font-size: 13.5px; color: var(--text-slate-900);
              line-height: 1.2;
              letter-spacing: -0.005em;
            }
            .cm-client-name .ant-typography {
              font-weight: 700 !important;
              color: var(--text-slate-900) !important;
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
              font-size: 11.5px;
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

            /* Projects pill (replaces former currency cell) */
            .cm-projects-pill {
              display: inline-flex;
              align-items: center;
              gap: 8px;
              padding: 5px 11px 5px 6px;
              border-radius: 999px;
              border: 1px solid var(--border-slate-100);
              background: var(--bg-pure-white);
              font-size: 12.5px;
              font-weight: 600;
              color: var(--text-slate-700);
              transition: all .2s ease;
            }
            .cm-projects-pill.has {
              background: rgba(59, 130, 246, 0.08);
              border-color: rgba(59, 130, 246, 0.25);
              color: #2563eb;
            }
            .cm-projects-pill.empty { color: var(--text-slate-500); }
            .cm-projects-ico {
              width: 22px; height: 22px;
              border-radius: 50%;
              display: inline-flex; align-items: center; justify-content: center;
              background: var(--bg-slate-50);
              color: var(--text-slate-500);
              flex-shrink: 0;
            }
            .cm-projects-pill.has .cm-projects-ico {
              background: #3b82f6;
              color: #fff;
              box-shadow: 0 4px 10px -4px rgba(59, 130, 246, 0.45);
            }
            .cm-projects-count {
              font-weight: 800;
              font-variant-numeric: tabular-nums;
              letter-spacing: -0.01em;
            }
            .cm-projects-label {
              font-weight: 500;
              opacity: 0.85;
              font-size: 11.5px;
            }
            [data-theme='dark'] .cm-projects-pill { background: var(--bg-secondary); }
            [data-theme='dark'] .cm-projects-pill.has {
              background: rgba(139, 92, 246, 0.12);
              color: #a78bfa;
            }
            [data-theme='dark'] .cm-projects-pill.has .cm-projects-ico {
              background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%) !important;
              box-shadow: 0 4px 10px -4px rgba(139,92,246,0.45) !important;
            }
            [data-theme='dark'] .cm-projects-ico { background: var(--bg-slate-50); }

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
            .cm-action-btn svg {
              pointer-events: none;
            }
            .cm-action-btn:hover {
              background: var(--bg-slate-50) !important;
              color: #8b5cf6 !important;
            }
            .cm-action-btn.delete:hover {
              background: #fef2f2 !important;
              color: #ef4444 !important;
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
            .cm-expand-btn.open { transform: rotate(90deg); background: #3b82f6; color: #fff; border-color: transparent; }
            [data-theme='dark'] .cm-expand-btn.open { background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%) !important; }

            /* expanded row */
            .cm-expanded-wrap-card {
              padding: 12px 0 0 0 !important;
              background: transparent !important;
              border-bottom: none !important;
            }
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
              padding: 0px 12px;
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
              color: #3b82f6 !important;
              font-weight: 600 !important;
              font-size: 12.5px !important;
            }
            [data-theme='dark'] .cm-expanded-add {
              color: #a78bfa !important;
            }
            .cm-project-grid {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
              gap: 12px;
              padding: 0px 12px;
              margin-bottom: 12px;
            }
            .cm-project-card {
              background: var(--bg-pure-white);
              border: 1px solid var(--border-slate-200);
              border-radius: 6px;
              padding: 14px;
              transition: all .2s ease;
            }
            .cm-project-card:hover {
              border-color: #3b82f6;
              box-shadow: 0 8px 18px -10px rgba(59, 130, 246, 0.4);
              transform: translateY(-1px);
            }
            [data-theme='dark'] .cm-project-card:hover {
              border-color: #8b5cf6 !important;
              box-shadow: 0 8px 18px -10px rgba(139, 92, 246, 0.4) !important;
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
              background: #3b82f6;
            }
            [data-theme='dark'] .cm-project-icon {
              background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%) !important;
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
              padding: 56px 24px;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 6px;
            }
            .cm-empty-icon {
              width: 60px; height: 60px;
              border-radius: 16px;
              display: inline-flex; align-items: center; justify-content: center;
              background: rgba(59, 130, 246, 0.1);
              color: #3b82f6;
              margin-bottom: 10px;
            }
            [data-theme="dark"] .cm-empty-icon {
              background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(30, 64, 175, 0.15));
              color: #60a5fa;
            }
            .cm-empty-title {
              font-size: 16px;
              font-weight: 700;
              color: var(--text-slate-900);
              letter-spacing: -0.01em;
              line-height: 1.2;
            }
            .cm-empty-desc {
              font-size: 13px;
              color: var(--text-slate-500);
              max-width: 380px;
              line-height: 1.5;
              text-align: center;
            }
            .cm-empty-cta {
              margin-top: 18px !important;
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

            /* custom delete modal matching members style */
            .cm-delete-modal .ant-modal-content {
              border-radius: 16px !important;
              padding: 24px !important;
              background-color: var(--bg-pure-white) !important;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
            }
            .cm-delete-modal .ant-modal-header {
              background-color: var(--bg-pure-white) !important;
              border-bottom: 1px solid var(--border-slate-100) !important;
              padding-bottom: 18px !important;
              margin-bottom: 20px !important;
            }
            .cm-delete-modal .ant-modal-close {
              top: 24px !important;
              right: 24px !important;
            }
            .cm-delete-modal .ant-modal-title {
              background-color: var(--bg-pure-white) !important;
            }
            [data-theme='dark'] .cm-delete-modal .ant-modal-content,
            [data-theme='dark'] .cm-delete-modal .ant-modal-header,
            [data-theme='dark'] .cm-delete-modal .ant-modal-title {
              background-color: var(--bg-secondary) !important;
            }
            [data-theme='dark'] .cm-delete-modal .ant-modal-header {
              border-bottom-color: var(--border-slate-800) !important;
            }
          `}</style>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
