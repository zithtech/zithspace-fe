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
  <div className="cm-stat-card" style={{ ["--cm-accent" as any]: accent }}>
    <div className="cm-stat-head">
      <div
        className="cm-stat-icon"
        style={{
          background: `${accent}12`,
          color: accent,
          boxShadow: `inset 0 0 0 1px ${accent}26`,
        }}
      >
        <Icon size={16} color={accent} />
      </div>
      <Text className="cm-stat-label">{label}</Text>
      <div className="cm-stat-value-wrap">
        {loading ? (
          <Skeleton.Input active size="small" style={{ width: 64, height: 22 }} />
        ) : (
          <span className="cm-stat-value">{value}</span>
        )}
        {trend && (
          <span className={`cm-trend ${trend.positive ? "up" : "down"}`}>
            {trend.positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            <span className="cm-trend-value">
              {trend.value > 0 ? "+" : ""}
              {trend.value}%
            </span>
          </span>
        )}
      </div>
    </div>
    {subtle && <Text className="cm-stat-subtle">{subtle}</Text>}
    {chart && <div className="cm-stat-chart">{chart}</div>}
    <span
      className="cm-stat-accent"
      style={{ background: `linear-gradient(90deg, ${accent} 0%, transparent 80%)` }}
    />
  </div>
);

/* Mini distribution bar — segmented progress using real data */
interface MiniBarProps {
  segments: { value: number; color: string; label: string }[];
}
const MiniBar: React.FC<MiniBarProps> = ({ segments }) => {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div className="cm-minibar">
      <div className="cm-minibar-track">
        {segments.map((s, i) => (
          <Tooltip key={i} title={`${s.label}: ${s.value}`}>
            <span
              className="cm-minibar-seg"
              style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
            />
          </Tooltip>
        ))}
      </div>
      <div className="cm-minibar-legend">
        {segments.map((s, i) => (
          <span key={i} className="cm-minibar-legend-item">
            <span className="cm-minibar-dot" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                 Page                                       */
/* -------------------------------------------------------------------------- */

export default function ClientsV2ListPage() {
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
  const [expandedLoading, setExpandedLoading] = useState<string | null>(null);

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
    allClientsOpts.forEach(() => {}); // placeholder so order of hooks stays stable
    data.forEach((c) => c.clientType && set.add(c.clientType));
    // Common fallbacks if data is sparse
    ["B2B", "B2C", "Enterprise", "SME", "Government", "Partner"].forEach((t) => set.add(t));
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
              <div className="cm-avatar" style={{ background: grad }}>
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
          <Dropdown
            menu={{
              items: [
                { key: "view", label: "View overview", icon: <Eye size={14} />, onClick: () => router.push(`/clients-v2/${record.id}`) },
                canUpdateClient ? { key: "edit", label: "Edit profile", icon: <Settings2 size={14} />, onClick: () => router.push(`/clients-v2/create?id=${record.id}`) } : null,
                canDeleteClient ? { key: "delete", label: "Delete client", danger: true, icon: <Trash2 size={14} />, onClick: () => handleDeleteClient(record.id, record.companyName) } : null,
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

        <div className="cm-page">
          <TimeTrackingHeader
            icon={<Building2 size={20} color="#8b5cf6" />}
            title="Client Management"
            description="Monitor, manage, and configure all client entity profiles."
            style={{
              position: "sticky",
              top: 0,
              zIndex: 100,
              boxShadow: "none",
              borderBottom: "1px solid var(--border-slate-200)",
              padding: "9.5px 32px",
            }}
            extra={
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <Input
                  placeholder="Search by name or code…"
                  prefix={<Search size={15} style={{ color: "var(--text-slate-400)" }} />}
                  className="cm-search-input"
                  onChange={(e) => handleSearch(e.target.value)}
                  allowClear
                />
                <Button 
                  icon={<Download size={15} />} 
                  className="cm-secondary-btn"
                  onClick={handleExport}
                  loading={loading}
                >
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

          <div className="cm-ambient" />

          <div className="cm-body">
            {/* Stat grid */}
            <div className="cm-stat-grid">
              <StatCard
                label="Total Clients"
                value={globalStats.totalClients}
                icon={Users}
                accent="#3b82f6"
                subtle="Across all segments"
                loading={globalStats.totalClients === 0 && loading}
                chart={
                  globalStats.totalClients > 0 ? (
                    <MiniBar
                      segments={[
                        {
                          value: globalStats.activeClients,
                          color: "#10b981",
                          label: `${globalStats.activeClients} active`,
                        },
                        {
                          value: globalStats.inactiveClients,
                          color: "#94a3b8",
                          label: `${globalStats.inactiveClients} other`,
                        },
                      ]}
                    />
                  ) : null
                }
              />
              <StatCard
                label="Total Projects"
                value={projectStats.total}
                icon={FolderKanban}
                accent="#0ea5e9"
                subtle="Across all clients"
                loading={projectStats.total === 0 && loading}
                chart={
                  projectStats.total > 0 ? (
                    <MiniBar
                      segments={[
                        { value: projectStats.active, color: "#0ea5e9", label: `${projectStats.active} active` },
                        {
                          value: Math.max(0, projectStats.total - projectStats.active),
                          color: "#94a3b8",
                          label: `${Math.max(0, projectStats.total - projectStats.active)} other`,
                        },
                      ]}
                    />
                  ) : null
                }
              />
              <StatCard
                label="Active Projects"
                value={projectStats.active}
                icon={CheckCircle2}
                accent="#10b981"
                subtle={
                  projectStats.total > 0
                    ? `${Math.round((projectStats.active / projectStats.total) * 100)}% of total`
                    : "No projects yet"
                }
                loading={projectStats.total === 0 && loading}
                chart={
                  projectStats.total > 0 ? (
                    <div className="cm-progress-row">
                      <div className="cm-progress-track">
                        <span
                          className="cm-progress-fill"
                          style={{
                            width: `${Math.round((projectStats.active / projectStats.total) * 100)}%`,
                            background: "linear-gradient(90deg, #10b981, #34d399)",
                          }}
                        />
                      </div>
                      <span className="cm-progress-label">
                        {Math.round((projectStats.active / projectStats.total) * 100)}%
                      </span>
                    </div>
                  ) : null
                }
              />
              <StatCard
                label="Contract Value"
                value={formatCurrency(globalStats.totalContractValue)}
                icon={Wallet}
                accent="#8b5cf6"
                subtle="Across all clients"
                loading={globalStats.totalClients === 0 && loading}
                chart={
                  globalStats.totalClients > 0 ? (
                    <div className="cm-cv-row">
                      <Sparkles size={11} />
                      <span>
                        Avg{" "}
                        <strong>
                          {formatCurrency(globalStats.totalContractValue / globalStats.totalClients)}
                        </strong>{" "}
                        per client
                      </span>
                    </div>
                  ) : null
                }
              />
            </div>

            {/* Divider between stats and filters */}
            <div className="cm-section-divider">
              <span className="cm-section-divider-label">Filters &amp; quick navigation</span>
            </div>

            {/* Filter / toolbar row */}
            <div className="cm-toolbar">
              <Segmented
                value={activeFilter}
                onChange={(v) => handleFilter(v as any)}
                options={[
                  {
                    label: (
                      <span className="cm-seg-label">
                        <ShieldCheck size={13} /> All
                        <span className="cm-seg-count">{globalStats.totalClients}</span>
                      </span>
                    ),
                    value: "all",
                  },
                  {
                    label: (
                      <span className="cm-seg-label">
                        <CheckCircle2 size={13} /> Active
                        <span className="cm-seg-count">{globalStats.activeClients}</span>
                      </span>
                    ),
                    value: "active",
                  },
                  {
                    label: (
                      <span className="cm-seg-label">
                        <AlertCircle size={13} /> High risk
                        <span className="cm-seg-count">{highRiskCount}</span>
                      </span>
                    ),
                    value: "highRisk",
                  },
                ]}
                className="cm-segmented"
              />

              <div className="cm-toolbar-mid">
                <Select
                  showSearch
                  allowClear
                  placeholder="Jump to client…"
                  className="cm-quick-select cm-quick-select-client"
                  popupClassName="cm-quick-popup"
                  suffixIcon={<Building2 size={13} />}
                  options={allClientsOpts}
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
                  onChange={(v?: string) => handleTypeChange(v)}
                  filterOption={(input, option) =>
                    ((option?.label as string) || "")
                      .toLowerCase()
                      .includes((input || "").toLowerCase())
                  }
                />
              </div>

              <div className="cm-toolbar-right">
                <span className="cm-result-count">
                  {pagination.total
                    ? `Showing ${(pagination.current - 1) * pagination.pageSize + 1}–${Math.min(pagination.current * pagination.pageSize, pagination.total)} of ${pagination.total}`
                    : "No results"}
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
              border-radius: 14px;
              padding: 14px 16px 14px;
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
            /* Single-row head: icon | title | value */
            .cm-stat-head {
              display: flex;
              align-items: center;
              gap: 10px;
              min-width: 0;
            }
            .cm-stat-icon {
              width: 32px; height: 32px;
              border-radius: 9px;
              display: flex; align-items: center; justify-content: center;
              flex-shrink: 0;
            }
            .cm-stat-label {
              flex: 1;
              min-width: 0;
              font-size: 13px;
              font-weight: 600;
              color: var(--text-slate-700);
              letter-spacing: -0.005em;
              text-transform: none;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .cm-stat-value-wrap {
              display: flex;
              align-items: center;
              gap: 8px;
              flex-shrink: 0;
            }
            .cm-stat-value {
              font-size: 22px;
              font-weight: 800;
              color: var(--text-slate-900);
              letter-spacing: -0.025em;
              line-height: 1;
              font-variant-numeric: tabular-nums;
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
            .cm-stat-subtle {
              display: block;
              font-size: 11.5px;
              color: var(--text-slate-500);
              margin-top: 8px;
              padding-left: 42px;
              font-weight: 500;
              line-height: 1.4;
            }
            .cm-stat-chart {
              margin-top: 10px;
              padding-top: 10px;
              padding-left: 42px;
              border-top: 1px dashed var(--border-slate-100);
            }

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
              border-radius: 10px !important;
              border: 1px solid var(--border-slate-100) !important;
              background: var(--bg-slate-50) !important;
              padding: 0 12px !important;
              display: flex !important;
              align-items: center !important;
              transition: all .18s ease;
            }
            .cm-quick-select.ant-select:hover .ant-select-selector {
              border-color: rgba(139, 92, 246, 0.45) !important;
            }
            .cm-quick-select.ant-select-focused .ant-select-selector {
              border-color: #8b5cf6 !important;
              background: var(--bg-pure-white) !important;
              box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1) !important;
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
              color: #8b5cf6 !important;
            }
            .cm-quick-select-client.ant-select { min-width: 220px; flex: 1 1 220px; max-width: 280px; }
            .cm-quick-select-project.ant-select { min-width: 220px; flex: 1 1 220px; max-width: 280px; }
            .cm-quick-select-type.ant-select { min-width: 160px; max-width: 200px; }

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
              color: #c4b5fd !important;
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
              box-shadow: 0 4px 16px -8px rgba(15, 23, 42, 0.06);
            }
            .cm-table-card .ant-table {
              background: transparent !important;
            }
            .cm-table-card .ant-table-thead > tr > th {
              background: var(--bg-slate-50) !important;
              color: var(--text-slate-500) !important;
              font-weight: 700 !important;
              text-transform: uppercase !important;
              font-size: 10.5px !important;
              letter-spacing: 0.08em !important;
              padding: 14px 16px !important;
              border-bottom: 1px solid var(--border-slate-100) !important;
            }
            .cm-table-card .ant-table-thead > tr > th::before { display: none !important; }
            .cm-table-card .ant-table-tbody > tr > td {
              padding: 18px 16px !important;
              border-bottom: 1px solid var(--border-slate-100) !important;
              transition: background .15s ease;
              position: relative;
            }
            .cm-table-card .cm-row > td:first-child::before {
              content: "";
              position: absolute;
              left: 0;
              top: 0;
              bottom: 0;
              width: 3px;
              background: linear-gradient(180deg, #8b5cf6, #6366f1);
              opacity: 0;
              transition: opacity .2s ease;
              pointer-events: none;
            }
            .cm-table-card .cm-row:hover > td {
              background: var(--bg-slate-50) !important;
            }
            .cm-table-card .cm-row:hover > td:first-child::before {
              opacity: 1;
            }
            .cm-table-card .ant-table-tbody > tr.ant-table-row-level-0:last-child > td {
              border-bottom: 0 !important;
            }

            /* avatar / cells */
            .cm-avatar-wrap {
              position: relative;
              width: 42px; height: 42px;
              flex-shrink: 0;
            }
            .cm-avatar {
              width: 42px; height: 42px;
              border-radius: 12px;
              display: flex; align-items: center; justify-content: center;
              color: #fff;
              font-weight: 700;
              font-size: 13px;
              letter-spacing: 0.02em;
              box-shadow: 0 6px 14px -6px rgba(15,23,42,0.3),
                          inset 0 1px 0 rgba(255,255,255,0.18);
              flex-shrink: 0;
            }
            .cm-avatar-wrap.is-active .cm-avatar-pulse {
              position: absolute;
              right: -2px;
              bottom: -2px;
              width: 12px; height: 12px;
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
              width: 26px; height: 26px;
              border-radius: 50%;
              display: flex; align-items: center; justify-content: center;
              color: #fff; font-weight: 700; font-size: 10px;
              flex-shrink: 0;
            }
            .cm-client-name {
              display: flex; align-items: center; gap: 6px;
              font-size: 14.5px; color: var(--text-slate-900);
              line-height: 1.25;
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
              background: linear-gradient(135deg, rgba(139,92,246,0.06), rgba(99,102,241,0.06));
              border-color: rgba(139,92,246,0.25);
              color: #6d28d9;
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
              background: linear-gradient(135deg, #8b5cf6, #6366f1);
              color: #fff;
              box-shadow: 0 4px 10px -4px rgba(139,92,246,0.45);
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
              background: linear-gradient(135deg, rgba(139,92,246,0.12), rgba(99,102,241,0.12));
              color: #a78bfa;
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
              background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(99, 102, 241, 0.1));
              color: #8b5cf6;
              margin-bottom: 10px;
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
