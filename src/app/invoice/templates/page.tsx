"use client";

import React, { useMemo, useState } from "react";
import NoData from "@/components/common/NoData";
import MainLayout from "@/components/layout/MainLayout";
import {
  Typography,
  Button,
  Skeleton,
  Input,
  Tooltip,
  Dropdown,
  Modal,
  Table,
  App,
  Select,
} from "antd";
import type { MenuProps } from "antd";
import {
  Plus,
  Edit3,
  Trash2,
  Search,
  FileText,
  Layers,
  LayoutGrid,
  List,
  MoreVertical,
  ChevronRight,
  ChevronLeft,
  Star,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ReloadOutlined, MenuOutlined } from "@ant-design/icons";
import {
  useInvoiceTemplates,
  useDeleteInvoiceTemplate,
} from "@/hooks/useInvoiceTemplates";
import InvoiceTemplateDrawer from "./InvoiceTemplateDrawer";
import { InvoiceTemplate } from "@/services/invoiceTemplateService";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/context/AuthContext";
import { useActivitySource } from "@/hooks/useActivitySource";
import ConfirmDialog from "@/components/common/ConfirmDialog";

const { Title, Text } = Typography;

const CARD_ACCENTS: [string, string][] = [
  ['#3b82f6', '#2563eb'], // blue
  ['#10b981', '#059669'], // green
  ['#64748b', '#475569'], // grey
];

const accentFor = (key: string): [string, string] => {
  return ['#3b82f6', '#2563eb'];
};

type StatusFilter = "all" | "active" | "default" | "inactive";

export default function InvoiceTemplatePage() {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>();
  const [searchText, setSearchText] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { message: messageApi } = App.useApp();
  const router = useRouter();
  const menuLabel = (title: string, desc: string, icon: React.ReactNode, color: string, tint: string) => (
    <div className="pp-menu-item">
      <span className="pp-menu-ic" style={{ color, background: tint }}>{icon}</span>
      <span className="pp-menu-text">
        <span className="pp-menu-title">{title}</span>
        <span className="pp-menu-desc">{desc}</span>
      </span>
    </div>
  );
  const {
    canReadInvoiceTemplate,
    canCreateInvoiceTemplate,
    canUpdateInvoiceTemplate,
    canDeleteInvoiceTemplate
  } = usePermission();
  const { isLoading: authLoading, hasAnySubscriptionFeature } = useAuth();
  const canUseNewInvoice = hasAnySubscriptionFeature("finance_invoice_newinvoice");

  // Route guard
  React.useEffect(() => {
    if (!authLoading && !canReadInvoiceTemplate) {
      router.push("/invoice/invoices");
    }
  }, [authLoading, canReadInvoiceTemplate, router]);

  // Register UX context for activity logging
  useActivitySource({ section: "FINANCE", module: "Invoices", page: "InvoiceTemplateList" });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const { data: response, isLoading, refetch, isFetching } = useInvoiceTemplates({
    page: currentPage,
    limit: pageSize
  });
  const templates = response?.data ?? [];
  const totalTemplates = response?.total ?? 0;

  const deleteMutation = useDeleteInvoiceTemplate();

  const handleEdit = (template: InvoiceTemplate) => {
    setSelectedTemplateId(template.id);
    setDrawerVisible(true);
  };

  const handleCreate = () => {
    setSelectedTemplateId(undefined);
    setDrawerVisible(true);
  };



  const counts = useMemo(() => {
    const all = templates?.length || 0;
    const active = templates?.filter((t) => t.isActive).length || 0;
    const inactive = templates?.filter((t) => !t.isActive).length || 0;
    const def = templates?.filter((t) => t.isDefault).length || 0;
    return { all, active, inactive, default: def };
  }, [templates]);

  const progressPct = counts.all > 0 ? Math.round((counts.active / counts.all) * 100) : 0;

  const activeViewTitle = useMemo(() => {
    switch (statusFilter) {
      case "active": return "Active Templates";
      case "inactive": return "Inactive Templates";
      case "default": return "Default Template";
      default: return "All Templates";
    }
  }, [statusFilter]);

  const filteredTemplates = useMemo(() => {
    return (templates || []).filter((t) => {
      const matchesSearch =
        t.name.toLowerCase().includes(searchText.toLowerCase()) ||
        t.billingType.toLowerCase().includes(searchText.toLowerCase());
      if (!matchesSearch) return false;
      if (statusFilter === "active") return t.isActive;
      if (statusFilter === "inactive") return !t.isActive;
      if (statusFilter === "default") return t.isDefault;
      return true;
    });
  }, [templates, searchText, statusFilter]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchText, statusFilter]);

  const total = totalTemplates || filteredTemplates.length;
  const pageStart = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = Math.min(currentPage * pageSize, total);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const pagedTemplates = useMemo(() => {
    return filteredTemplates;
  }, [filteredTemplates]);

  // ─── Shared action menu (table + cards) ───────────────────────────────────
  const getMenuItems = (template: InvoiceTemplate): MenuProps["items"] => [
    canUpdateInvoiceTemplate && {
      key: "edit",
      label: menuLabel("Edit template", "Modify template settings", <Edit3 size={14} />, '#3b82f6', 'rgba(59,130,246,0.12)'),
      onClick: (info: any) => {
        info?.domEvent?.stopPropagation?.();
        handleEdit(template);
      },
    },
    canUseNewInvoice && {
      key: "use",
      label: menuLabel("Use template", "Create invoice with this template", <FileText size={14} />, '#10b981', 'rgba(16,185,129,0.12)'),
      onClick: (info: any) => {
        info?.domEvent?.stopPropagation?.();
        router.push(`/invoice/newinvoice?templateId=${template.id}`);
      },
    },
    (canUpdateInvoiceTemplate || canDeleteInvoiceTemplate) && { type: "divider" as const },
    canDeleteInvoiceTemplate && {
      key: "delete",
      danger: true,
      label: (
        <ConfirmDialog
          tone="danger"
          icon={<Trash2 size={14} />}
          title="Delete Template"
          description={`Are you sure you want to delete "${template.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          placement="left"
          onConfirm={async () => {
            try {
              await deleteMutation.mutateAsync(template.id);
              messageApi.success("Template deleted successfully");
            } catch (error: any) {
              if (error?.code === "23001" || error?.message?.includes("foreign key constraint")) {
                messageApi.error(
                  "Cannot delete template: it's used by existing invoices. Please delete or reassign those invoices first.",
                  6
                );
              } else {
                messageApi.error(error?.message || "Failed to delete template");
              }
            }
          }}
        >
          <div
            style={{
              margin: '-5px -12px',
              padding: '5px 12px',
              width: 'calc(100% + 24px)',
              height: '100%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {menuLabel("Delete", "Remove this template", <Trash2 size={14} />, '#ef4444', 'rgba(239,68,68,0.12)')}
          </div>
        </ConfirmDialog>
      ),
    },
  ].filter(Boolean) as MenuProps["items"];

  // Table columns
  const columns = [
    {
      title: "TEMPLATE",
      dataIndex: "name",
      key: "name",
      render: (value: string, record: InvoiceTemplate) => (
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0"
            style={{
              background: "var(--bg-blue-50)",
              color: "var(--text-blue-700)",
              border: "1px solid var(--border-blue-200)",
            }}
          >
            <FileText size={16} strokeWidth={2.25} />
          </div>
          <div>
            <div
              className="text-sm font-semibold flex items-center gap-1.5"
              style={{ color: "var(--text-primary)" }}
            >
              {value}
              {record.isDefault && (
                <Tooltip title="Default template">
                  <Star size={13} className="text-amber-500" fill="currentColor" />
                </Tooltip>
              )}
            </div>
            <div
              className="text-[11px] mt-0.5"
              style={{ color: "var(--text-secondary)" }}
            >
              {record.description || "No description"}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "TYPE",
      dataIndex: "billingType",
      key: "billingType",
      render: (value: string) => (
        <span
          className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider"
          style={{
            background: "var(--bg-slate-50)",
            color: "var(--text-secondary)",
            border: "1px solid var(--border-color)",
          }}
        >
          {value}
        </span>
      ),
    },
    {
      title: "FIELDS",
      dataIndex: "fields",
      key: "fields",
      render: (_: any, record: InvoiceTemplate) => (
        <div
          className="flex items-center gap-1.5 text-[13px] tabular-nums"
          style={{ color: "var(--text-secondary)" }}
        >
          <Layers size={14} />
          {record._count?.fields || 0}
        </div>
      ),
    },
    {
      title: "STATUS",
      dataIndex: "isActive",
      key: "isActive",
      render: (_: any, record: InvoiceTemplate) => {
        if (record.isDefault) {
          return (
            <span
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold"
              style={{
                background: "var(--bg-blue-50)",
                color: "var(--text-blue-700)",
                border: "1px solid var(--border-blue-200)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--text-blue-700)" }}
              />
              Default
            </span>
          );
        }
        return record.isActive ? (
          <span
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold"
            style={{
              background: "#ecfdf5",
              color: "#047857",
              border: "1px solid #a7f3d0",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#10b981" }} />
            Active
          </span>
        ) : (
          <span
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold"
            style={{
              background: "var(--bg-slate-50)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-color)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#94a3b8" }} />
            Inactive
          </span>
        );
      },
    },
    {
      title: "",
      key: "action",
      width: 60,
      render: (_: any, record: InvoiceTemplate) => {
        return (
          <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <Dropdown
              menu={{ items: getMenuItems(record) }}
              overlayClassName="pp-action-pop"
              trigger={["click"]}
              placement="bottomRight"
            >
              <Button
                type="text"
                icon={<MoreVertical size={16} style={{ color: "var(--text-secondary)" }} />}
              />
            </Dropdown>
          </div>
        );
      },
    },
  ];

  return (
    <MainLayout>
      <div className="pp-shell">
        {/* ============================ SIDEBAR ============================ */}
        {isMobileOpen && (
          <div className="pp-backdrop" onClick={() => setIsMobileOpen(false)} />
        )}
        <aside className={`pp-sidebar ${isMobileOpen ? 'is-open' : ''}`}>
          <div className="pp-side-head">
            <div className="pp-side-logo"><FileText size={20} /></div>
            <div className="pp-side-head-text">
              <div className="pp-side-title">Templates</div>
              <div className="pp-side-subtitle">Design · structure</div>
            </div>
          </div>

          {canCreateInvoiceTemplate && (
            <Button
              type="primary"
              icon={<Plus size={14} />}
              className="pp-create-btn"
              onClick={handleCreate}
              block
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
            >
              New Template
            </Button>
          )}

          <div className="pp-side-scroll">
            <div className="pp-side-section-label">Views</div>
            <div className="pp-side-list">
              <button
                type="button"
                className={`pp-view-item ${statusFilter === "all" ? "is-active" : ""}`}
                onClick={() => setStatusFilter("all")}
              >
                <span className="pp-view-icon" style={{ color: statusFilter === "all" ? "#3b82f6" : "var(--text-slate-400)" }}><FileText size={14} /></span>
                <span className="pp-view-label">All templates</span>
                <span className="pp-view-count">{counts.all}</span>
              </button>
              <button
                type="button"
                className={`pp-view-item ${statusFilter === "active" ? "is-active" : ""}`}
                onClick={() => setStatusFilter("active")}
              >
                <span className="pp-view-icon" style={{ color: statusFilter === "active" ? "#10b981" : "var(--text-slate-400)" }}><CheckCircle2 size={14} /></span>
                <span className="pp-view-label">Active</span>
                <span className="pp-view-count">{counts.active}</span>
              </button>
              <button
                type="button"
                className={`pp-view-item ${statusFilter === "default" ? "is-active" : ""}`}
                onClick={() => setStatusFilter("default")}
              >
                <span className="pp-view-icon" style={{ color: statusFilter === "default" ? "#3b82f6" : "var(--text-slate-400)" }}><Star size={14} /></span>
                <span className="pp-view-label">Default</span>
                <span className="pp-view-count">{counts.default}</span>
              </button>
              <button
                type="button"
                className={`pp-view-item ${statusFilter === "inactive" ? "is-active" : ""}`}
                onClick={() => setStatusFilter("inactive")}
              >
                <span className="pp-view-icon" style={{ color: statusFilter === "inactive" ? "#64748b" : "var(--text-slate-400)" }}><AlertCircle size={14} /></span>
                <span className="pp-view-label">Inactive</span>
                <span className="pp-view-count">{counts.inactive}</span>
              </button>
            </div>
          </div>

          <div className="pp-side-bottom-actions">
            <button
              type="button"
              className="pp-view-item"
              onClick={() => router.push("/invoice/invoices")}
              style={{ padding: "0 10px", borderRadius: "8px", border: "none", background: "transparent", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", width: "100%", height: "100%" }}
            >
              <span className="pp-view-icon" style={{ color: "#3b82f6" }}><ChevronRight size={14} style={{ transform: "rotate(180deg)" }} /></span>
              <span className="pp-view-label">Invoices</span>
            </button>
          </div>
        </aside>

        {/* ============================ MAIN ============================ */}
        <main className="pp-main">
          {/* Top search & views bar */}
          <div className="pp-topbar">
            <button className="pp-mobile-toggle" onClick={() => setIsMobileOpen(true)}>
              <MenuOutlined style={{ fontSize: 16 }} />
            </button>
            <div className="pp-search-wrap">
              <Search className="pp-search-icon" size={14} />
              <input
                className="pp-search"
                placeholder="Search templates…"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            <div className="pp-topbar-meta">
              <span className="pp-meta-item"><span className="pp-pulse" /><strong>{filteredTemplates.length}</strong> templates</span>
            </div>

            <div className="pp-topbar-actions">
              {/* Cards vs Table view toggles using segmented style */}
              <div
                className="inline-flex items-center h-8 rounded-lg p-0.5"
                style={{
                  background: "var(--bg-slate-50)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <Tooltip title="Table view">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => setViewMode("table")}
                    className="inline-flex items-center justify-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-semibold transition-all"
                    style={{
                      background: viewMode === "table" ? "var(--bg-secondary)" : "transparent",
                      color: viewMode === "table" ? "var(--text-blue-700)" : "var(--text-secondary)",
                      border: "none",
                      cursor: "pointer",
                      boxShadow: viewMode === "table" ? "0 1px 2px rgba(15,23,42,0.06), 0 0 0 1px var(--border-color)" : "none",
                    }}
                  >
                    <List size={12} strokeWidth={2.25} />

                  </button>
                </Tooltip>
                <Tooltip title="Card view">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => setViewMode("card")}
                    className="inline-flex items-center justify-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-semibold transition-all"
                    style={{
                      background: viewMode === "card" ? "var(--bg-secondary)" : "transparent",
                      color: viewMode === "card" ? "var(--text-blue-700)" : "var(--text-secondary)",
                      border: "none",
                      cursor: "pointer",
                      boxShadow: viewMode === "card" ? "0 1px 2px rgba(15,23,42,0.06), 0 0 0 1px var(--border-color)" : "none",
                    }}
                  >
                    <LayoutGrid size={12} strokeWidth={2.25} />

                  </button>
                </Tooltip>

              </div>
              <Tooltip title="Refresh">
                <button type="button" className="pp-ghost-btn" onClick={() => refetch()}><ReloadOutlined spin={isLoading || isFetching} /></button>
              </Tooltip>
            </div>
          </div>

          {/* Main View Area */}
          <div className="pp-body">
            {/* ── Main Overview Banner (TicketList sprint head style) ── */}
            <div className="tl-section-head tl-sprint-head-v2 tl-section-head--static invoice-overview-banner">
              {/* Row 1: dot + title + status tags */}
              <div className="tl-sprint-row1">
                <div className="tl-sprint-title-block">
                  <span
                    className="tl-sprint-dot"
                    style={{
                      background: "#3b82f6",
                      boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.2)",
                    }}
                  />
                  <Text
                    className="tl-sprint-title"
                    ellipsis={{ tooltip: `Templates — ${activeViewTitle}` }}
                  >
                    Templates — {activeViewTitle}
                  </Text>
                  <span className="tl-sprint-tags">
                    <span className="tl-sprint-tag tl-sprint-tag-neutral">
                      {counts.all} TEMPLATES
                    </span>
                    {counts.active > 0 && (
                      <span className="tl-sprint-tag tl-sprint-tag-active">
                        {counts.active} ACTIVE
                      </span>
                    )}
                    {counts.default > 0 && (
                      <span className="tl-sprint-tag tl-sprint-tag-today">
                        {counts.default} DEFAULT
                      </span>
                    )}
                    {counts.inactive > 0 && (
                      <span className="tl-sprint-tag tl-sprint-tag-delayed">
                        {counts.inactive} INACTIVE
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Row 2: template counts */}
              <div className="tl-sprint-row2">
                <span className="tl-sprint-meta">
                  <b>{counts.active}</b>/{counts.all} templates active
                </span>
                <span className="tl-sprint-meta">
                  <b>{counts.inactive}</b> inactive
                </span>
                <span className="tl-sprint-meta">
                  <Star size={12} style={{ color: '#f59e0b', marginTop: -1 }} />
                  <b>{counts.default}</b> default
                </span>
              </div>

              {/* Row 3: wide progress bar + % */}
              <div className="tl-sprint-row3">
                <div className="tl-sprint-progress-bar">
                  <div
                    className="tl-sprint-progress-fill"
                    style={{ width: `${Math.min(100, progressPct)}%` }}
                  />
                </div>
                <span className="tl-sprint-progress-pct">{progressPct}%</span>
              </div>
            </div>

            {/* List & Cards Content */}
            {isLoading ? (
              <div className="pp-grid">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="pc-card p-4"
                    style={{
                      background: "var(--bg-slate-50)",
                      border: "1px solid var(--border-slate-200)",
                    }}
                  >
                    <Skeleton active avatar paragraph={{ rows: 1 }} />
                  </div>
                ))}
              </div>
            ) : !pagedTemplates || pagedTemplates.length === 0 ? (
              <div className="pp-empty-wrapper">
                <NoData
                  title={searchText || statusFilter !== "all" ? "No templates match your filters" : "No templates yet"}
                  description={
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                      <span style={{ color: 'var(--text-slate-500)', fontSize: 14 }}>
                        {searchText || statusFilter !== "all"
                          ? "Try adjusting your search or filter."
                          : "Create your first invoice template to get started."}
                      </span>
                      {!searchText && statusFilter === "all" && canCreateInvoiceTemplate && (
                        <Button
                          type="primary"
                          icon={<Plus size={14} />}
                          onClick={handleCreate}
                          style={{
                            borderRadius: 8,
                            height: 38,
                            fontSize: 14,
                            fontWeight: 600,
                            padding: '0 20px',
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                          }}
                        >
                          New Template
                        </Button>
                      )}
                    </div>
                  }
                />
              </div>
            ) : viewMode === "card" ? (
              <div className="pp-grid">
                {pagedTemplates.map((template) => {
                  const accent = accentFor(template.name || '');
                  return (
                    <div
                      key={template.id}
                      className="pc-card"
                      onClick={() => {
                        if (canUseNewInvoice) {
                          router.push(`/invoice/newinvoice?templateId=${template.id}`);
                        }
                      }}
                    >
                      <div className="pc-top">
                        <div
                          className="pc-avatar"
                          style={{
                            background: template.isDefault
                              ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                              : `linear-gradient(135deg, ${accent[0]} 0%, ${accent[1]} 100%)`,
                          }}
                        >
                          <FileText size={14} style={{ color: "#fff" }} />
                        </div>
                        <div className="pc-identity-body">
                          <div className="pc-title" style={{ fontSize: '13px' }}>
                            {template.name}
                            {template.isDefault && (
                              <Star
                                size={12}
                                className="text-amber-500 ml-1.5 inline-block"
                                fill="currentColor"
                              />
                            )}
                          </div>
                          <div className="pc-client-line">
                            <span className="pc-client-key">Type:</span>
                            <span className="pc-client-val" style={{ textTransform: "capitalize" }}>
                              {template.billingType}
                            </span>
                          </div>
                        </div>
                        <Dropdown
                          menu={{ items: getMenuItems(template) }}
                          overlayClassName="pp-action-pop"
                          trigger={["click"]}
                          placement="bottomRight"
                        >
                          <button
                            type="button"
                            className="pc-actions"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical size={16} />
                          </button>
                        </Dropdown>
                      </div>

                      <div className="pc-foot">
                        <div className="pc-foot-row">
                          <span className="pc-foot-item">
                            <span className="pc-foot-key">Fields:</span>
                            <span className="pc-foot-val">
                              {template.fields?.slice(0, 2).map((f) => f.fieldLabel).join(", ") ||
                                "System default"}
                            </span>
                          </span>
                          <span className="pc-foot-div" />
                          <span className="pc-foot-item">
                            <span className="pc-foot-key">Count:</span>
                            <span className="pc-foot-val">
                              {template._count?.fields || 0} fields
                            </span>
                          </span>
                        </div>
                        <div className="pc-foot-row">
                          <span className="pc-foot-item">
                            <span className="pc-foot-key">Status:</span>
                            {template.isDefault ? (
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  color: "#3b82f6",
                                }}
                              >
                                DEFAULT
                              </span>
                            ) : template.isActive ? (
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  color: "#10b981",
                                }}
                              >
                                ACTIVE
                              </span>
                            ) : (
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  color: "#94a3b8",
                                }}
                              >
                                INACTIVE
                              </span>
                            )}
                          </span>
                          {canUseNewInvoice && (
                            <>
                              <span className="pc-foot-div" />
                              <button
                                type="button"
                                className="pc-foot-item pc-view-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/invoice/newinvoice?templateId=${template.id}`);
                                }}
                              >
                                Use Template
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Add card */}
                {canCreateInvoiceTemplate && (
                  <div
                    onClick={handleCreate}
                    className="pc-card flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-[var(--bg-slate-50)]"
                    style={{
                      background: "transparent",
                      border: "1.5px dashed var(--border-color)",
                      height: 154,
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center mb-1.5"
                      style={{
                        background: "var(--bg-blue-50)",
                        color: "var(--text-blue-700)",
                        border: "1px solid var(--border-blue-200)",
                      }}
                    >
                      <Plus size={16} strokeWidth={2.5} />
                    </div>
                    <span
                      className="text-[12.5px] font-bold"
                      style={{ color: "var(--text-slate-900)" }}
                    >
                      Create Template
                    </span>
                    <span
                      className="text-[10.5px] mt-0.5"
                      style={{ color: "var(--text-slate-400)" }}
                    >
                      Design a new billing structure
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="pp-table-wrap">
                <Table
                  rowKey="id"
                  size="small"
                  columns={columns}
                  dataSource={pagedTemplates}
                  pagination={false}
                  className="saas-table tl-table pp-table"
                  scroll={{ x: 'max-content' }}
                  onRow={(record) => ({
                    onClick: () => {
                      if (canUseNewInvoice) {
                        router.push(`/invoice/newinvoice?templateId=${record.id}`);
                      }
                    },
                    className: "pp-row",
                  })} locale={{ emptyText: <NoData /> }}
                />
              </div>
            )}
          </div>

          {/* Sticky footer pagination */}
          {total > 0 && (
            <div className="pp-footer">
              <div className="pp-footer-info">
                Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong>
              </div>
              <div className="pp-pager">
                <button type="button" className="pp-pager-btn" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>‹</button>
                {Array.from({ length: pageCount }, (_, i) => i + 1).slice(Math.max(0, currentPage - 3), Math.max(0, currentPage - 3) + 5).map((p) => (
                  <button key={p} type="button" className={`pp-pager-num ${p === currentPage ? 'is-active' : ''}`} onClick={() => setCurrentPage(p)}>{p}</button>
                ))}
                <button type="button" className="pp-pager-btn" disabled={currentPage >= pageCount} onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))}>›</button>
                <Select
                  className="pp-pagesize"
                  value={pageSize}
                  onChange={(v) => { setPageSize(v); setCurrentPage(1); }}
                  options={[10, 15, 20, 25, 50, 100].map((n) => ({ value: n, label: `${n} / page` }))}
                  popupMatchSelectWidth={120}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      <InvoiceTemplateDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        templateId={selectedTemplateId}
      />



      <style jsx global>{`
        .pp-shell {
          display: flex;
          margin: 0 -24px;
          min-height: calc(100vh - 54px);
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
          width: 256px;
          flex-shrink: 0;
          border-right: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white);
          display: flex;
          flex-direction: column;
          padding: 14px 14px 0 34px;
          position: sticky;
          top: 0;
          height: calc(100vh - 54px);
          z-index: 31;
        }
        .pp-side-head {
          display: flex; align-items: center; gap: 12px; padding: 2px 2px 14px; margin-bottom: 6px;
          border-bottom: 1px solid var(--border-slate-100);
        }
        .pp-side-logo {
          flex-shrink: 0; display: flex; align-items: center; justify-content: center;
          color: var(--text-slate-900);
        }
        .pp-side-head-text { display: flex; flex-direction: column; min-width: 0; }
        .pp-side-title { font-size: 16px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.025em; line-height: 1.1; }
        .pp-side-subtitle {
          font-size: 10.5px; color: var(--text-slate-400); font-weight: 700; margin-top: 4px;
          text-transform: uppercase; letter-spacing: 0.07em;
        }
        .pp-create-btn {
          height: 35px !important; border-radius: 8px !important; font-weight: 600 !important; font-size: 12.5px !important;
          background: #3B82F6 !important;
          border: none !important; box-shadow: none !important;
          margin-bottom: 12px;
          color: #fff !important;
        }
        .pp-create-btn:hover { background: #2563EB !important; }
        .pp-create-btn .anticon { font-size: 12px !important; }
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
        .pp-side-list { display: flex; flex-direction: column; gap: 1px; }
        .pp-view-item {
          display: flex; align-items: center; gap: 10px; width: 100%;
          padding: 7px 10px; border-radius: 8px; border: none; background: transparent;
          cursor: pointer; transition: background .12s ease; text-align: left;
        }
        .pp-view-item:hover { background: var(--bg-slate-50); }
        .pp-view-item.is-active { background: var(--bg-blue-50); }
        .pp-view-item.is-active .pp-view-label { color: var(--text-slate-900); font-weight: 600; }
        .pp-view-icon { font-size: 14px; width: 16px; display: inline-flex; justify-content: center; }
        .pp-view-label { flex: 1; font-size: 13px; font-weight: 500; color: var(--text-slate-700); }
        .pp-view-count {
          font-size: 11.5px; font-weight: 600; color: var(--text-slate-400);
          min-width: 18px; text-align: right;
        }
        .pp-view-item.is-active .pp-view-count {
          color: #3B82F6; font-weight: 700;
          background: rgba(59,130,246,0.12); border-radius: 6px; padding: 1px 7px; min-width: 0;
        }
        .pp-side-bottom-actions {
          margin: auto -14px 0 -38px;
          padding: 0 14px 0 38px;
          border-top: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white);
          height: 45px;
          display: flex;
          align-items: center;
        }

        .pp-shell {
          display: flex;
          margin: 0 -24px;
          height: calc(100vh - 54px);
          max-height: calc(100vh - 54px);
          background: var(--bg-pure-white);
          overflow: hidden;
        }

        /* ---------------- Main ---------------- */
        .pp-main {
          flex: 1;
          min-width: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          height: 100%;
          max-height: 100%;
          overflow: hidden;
          background: var(--bg-pure-white);
        }
        .pp-body {
          flex: 1;
          min-height: 0;
          padding-bottom: 0;
          min-width: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .pp-topbar { display: flex; align-items: center; gap: 10px; padding: 8px 24px 8px 14px; margin-bottom: 0; border-bottom: 1px solid var(--border-slate-200); background: var(--bg-pure-white); flex-wrap: wrap; }
        .pp-search-wrap {
          position: relative; flex: 1; max-width: 520px; min-width: 240px; display: flex; align-items: center;
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
        .pp-pulse { width: 6px; height: 6px; border-radius: 50%; background: #10b981; display: inline-block; box-shadow: 0 0 0 3px rgba(16,185,129,0.18); margin-right: 5px; }
        .pp-topbar-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }

        .pp-divider { display: none; }

        /* Overview Banner (Sprint head v2 style) */
        .invoice-overview-banner {
          background: var(--bg-slate-50, #f8fafc);
          border-top: none;
          border-left: none;
          border-right: none;
          border-bottom: 1px solid var(--border-slate-200, #e2e8f0);
          border-radius: 0;
          margin: 0;
        }
        .tl-sprint-head-v2 {
          display: flex !important;
          flex-direction: column;
          gap: 6px;
          padding: 10px 24px !important;
        }
        .tl-sprint-row1 {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .tl-sprint-title-block {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          flex: 1 1 auto;
        }
        .tl-sprint-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
          background: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        }
        .tl-sprint-title {
          font-size: 13.5px !important;
          font-weight: 800 !important;
          color: var(--text-slate-900, #0f172a) !important;
          letter-spacing: -0.01em;
          max-width: 460px;
        }
        [data-theme='dark'] .tl-sprint-title { color: #f1f5f9 !important; }
        .tl-sprint-tags {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }
        .tl-sprint-tag {
          display: inline-flex;
          align-items: center;
          height: 18px;
          padding: 0 6px;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.04em;
          border-radius: 4px;
          border: 1px solid transparent;
          text-transform: uppercase;
          line-height: 1;
        }
        .tl-sprint-tag-delayed {
          background: transparent;
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.32);
        }
        .tl-sprint-tag-overdue {
          background: transparent;
          color: #fbbf24;
          border-color: rgba(245, 158, 11, 0.32);
        }
        .tl-sprint-tag-today {
          background: transparent;
          color: #fbbf24;
          border-color: rgba(245, 158, 11, 0.32);
        }
        .tl-sprint-tag-active {
          background: transparent;
          color: #10b981;
          border-color: rgba(16, 185, 129, 0.32);
        }
        .tl-sprint-tag-neutral {
          background: transparent;
          color: var(--text-slate-500);
          border-color: var(--border-slate-200);
        }
        [data-theme='dark'] .tl-sprint-tag-delayed {
          background: transparent;
          color: #fca5a5;
        }
        [data-theme='dark'] .tl-sprint-tag-neutral {
          border-color: rgba(255, 255, 255, 0.12);
        }
        .tl-sprint-row2 {
          display: flex;
          align-items: center;
          gap: 18px;
          flex-wrap: wrap;
          padding-left: 15px;
        }
        .tl-sprint-meta {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 600;
          color: var(--text-slate-500, #64748b);
          letter-spacing: -0.005em;
        }
        .tl-sprint-meta b {
          color: var(--text-slate-900, #0f172a);
          font-weight: 800;
        }
        [data-theme='dark'] .tl-sprint-meta { color: #94a3b8 !important; }
        [data-theme='dark'] .tl-sprint-meta b { color: #f1f5f9 !important; }

        .tl-sprint-row3 {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-left: 15px;
        }
        .tl-sprint-progress-bar {
          flex: 1 1 auto;
          position: relative;
          height: 6px;
          background: var(--bg-slate-100, #f1f5f9);
          border-radius: 999px;
          overflow: hidden;
          min-width: 60px;
        }
        [data-theme='dark'] .tl-sprint-progress-bar { background: #1f2937 !important; }
        .tl-sprint-progress-fill {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, #3b82f6, #2563eb);
          border-radius: 999px;
          transition: width 0.4s ease;
        }
        .tl-sprint-progress-pct {
          flex-shrink: 0;
          font-size: 12px;
          font-weight: 800;
          color: var(--text-slate-900, #0f172a);
          font-variant-numeric: tabular-nums;
          min-width: 36px;
        }
        [data-theme='dark'] .tl-sprint-progress-pct { color: #f1f5f9 !important; }

        /* Grid view cards (matching accounts dashboard) */
        .pp-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          padding: 10px 24px 10px 14px;
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          align-content: start;
          align-items: start;
          grid-auto-rows: max-content;
        }
        .pp-grid-loading { padding: 40px; text-align: center; color: var(--text-slate-400); grid-column: 1 / -1; }

        .pc-card {
          border: 1px solid var(--border-slate-200); border-radius: 0; background: var(--bg-pure-white);
          cursor: pointer; overflow: hidden; display: flex; flex-direction: column;
          transition: box-shadow .15s ease, border-color .15s ease;
          height: 154px;
        }
        .pc-card:hover { box-shadow: 0 3px 12px rgba(15,23,42,0.06); border-color: #cbd5e1; }

        .pc-top { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; height: 74px; overflow: hidden; }
        .pc-avatar {
          width: 30px; height: 30px; border-radius: 6px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 800; font-size: 12px;
        }
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
        .pc-client-key { color: var(--text-slate-400); font-weight: 600; flex-shrink: 0; }
        .pc-client-val { color: var(--text-slate-700); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .pc-foot { display: flex; flex-direction: column; padding: 0; border-top: 1px solid var(--border-slate-200); background: var(--bg-slate-50); height: 78px; justify-content: center; }
        .pc-foot-row { display: flex; align-items: center; gap: 8px; flex-wrap: nowrap; padding: 6px 12px; overflow: hidden; }
        .pc-foot-row + .pc-foot-row { border-top: 1px solid var(--border-slate-200); }
        .pc-foot-item { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--text-slate-700); overflow: hidden; white-space: nowrap; }
        .pc-foot-key { font-size: 10.5px; font-weight: 600; color: var(--text-slate-400); }
        .pc-foot-val { font-size: 11.5px; color: var(--text-slate-700); overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
        .pc-foot-div { width: 1px; height: 11px; background: var(--border-slate-300, #cbd5e1); flex-shrink: 0; }
        .pc-view-btn {
          background: none; border: none; cursor: pointer; padding: 0;
          color: #3B82F6; font-weight: 700; font-size: 11.5px;
        }
        .pc-view-btn .anticon { font-size: 12px; }
        .pc-view-btn:hover { text-decoration: underline; }

        .pc-status-tag { display: inline-flex; align-items: center; gap: 4px; height: 19px; padding: 0 7px; border-radius: 5px; font-size: 10.5px; font-weight: 700; }

        .pp-btn-primary {
          background: #3B82F6 !important; border: none !important;
          border-radius: 0 !important; font-weight: 600 !important;
        }

        @media (max-width: 700px) {
          .pp-grid { grid-template-columns: 1fr; }
        }

        /* Table */
        .pp-table-wrap {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          background: var(--bg-pure-white);
          border: none;
          border-radius: 0;
          margin: 0;
          padding: 0;
          overflow-y: auto;
          overflow-x: auto;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .pp-table-wrap::-webkit-scrollbar,
        .pp-table-wrap .ant-table-body::-webkit-scrollbar,
        .pp-table-wrap .ant-table-content::-webkit-scrollbar {
          width: 0;
          height: 0;
          display: none;
        }
        .pp-table-wrap .ant-table-body,
        .pp-table-wrap .ant-table-content {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .pp-table .ant-table-cell-scrollbar,
        .tl-table .ant-table-cell-scrollbar {
          display: none !important;
          width: 0 !important;
          padding: 0 !important;
        }
        .pp-table, .pp-table.ant-table-wrapper {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: transparent;
          font-size: 12px;
          border-radius: 0 !important;
        }
        .pp-table .ant-spin-nested-loading,
        .pp-table.ant-table-wrapper,
        .pp-table .ant-spin-container,
        .pp-table .ant-table,
        .tl-table .ant-table,
        .pp-table .ant-table-container,
        .tl-table .ant-table-container {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: transparent;
          font-size: 12px;
          border-radius: 0 !important;
          border-start-start-radius: 0 !important;
          border-start-end-radius: 0 !important;
          border-end-start-radius: 0 !important;
          border-end-end-radius: 0 !important;
        }
        .pp-table .ant-table-header,
        .tl-table .ant-table-header,
        .pp-table .ant-table-thead,
        .tl-table .ant-table-thead,
        .pp-table .ant-table-thead > tr,
        .tl-table .ant-table-thead > tr {
          border-radius: 0 !important;
          border-start-start-radius: 0 !important;
          border-start-end-radius: 0 !important;
          border-end-start-radius: 0 !important;
          border-end-end-radius: 0 !important;
        }
        .pp-table .ant-table-body,
        .tl-table .ant-table-body,
        .pp-table .ant-table-content,
        .tl-table .ant-table-content {
          flex: 1;
          min-height: 0;
          overflow-y: auto !important;
        }
        .pp-table .ant-table-thead > tr > th,
        .tl-table .ant-table-thead > tr > th,
        .pp-table .ant-table-thead > tr > td,
        .tl-table .ant-table-thead > tr > td {
          background: var(--bg-slate-50) !important;
          border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 10px !important;
          font-weight: 800 !important;
          letter-spacing: 0.04em !important;
          text-transform: uppercase !important;
          color: var(--text-slate-500) !important;
          padding: 5px 10px !important;
          white-space: nowrap !important;
          position: sticky !important;
          top: 0 !important;
          z-index: 10 !important;
          border-radius: 0 !important;
          border-start-start-radius: 0 !important;
          border-start-end-radius: 0 !important;
          border-end-start-radius: 0 !important;
          border-end-end-radius: 0 !important;
        }
        .pp-table .ant-table-thead > tr > th::before,
        .tl-table .ant-table-thead > tr > th::before {
          display: none !important;
        }
        [data-theme='dark'] .pp-table .ant-table-thead > tr > th,
        [data-theme='dark'] .tl-table .ant-table-thead > tr > th {
          background: #0f1419 !important;
          border-bottom-color: #1f2937 !important;
          color: #94a3b8 !important;
        }
        .pp-table .ant-table-tbody > tr > td,
        .tl-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid var(--border-slate-100) !important;
          padding: 4px 10px !important;
          font-size: 11.5px !important;
          border-radius: 0 !important;
        }
        .pp-table .ant-table-cell,
        .tl-table .ant-table-cell {
          line-height: 1.3 !important;
          border-radius: 0 !important;
        }
        [data-theme='dark'] .pp-table .ant-table-tbody > tr > td,
        [data-theme='dark'] .tl-table .ant-table-tbody > tr > td {
          border-bottom-color: #1f2937 !important;
        }
        .pp-table .ant-table-tbody > tr:last-child > td,
        .tl-table .ant-table-tbody > tr:last-child > td {
          border-bottom: none !important;
        }
        .pp-table .ant-table-tbody > tr.pp-row:hover > td,
        .tl-table .ant-table-tbody > tr.pp-row:hover > td,
        .pp-table .ant-table-tbody > tr:hover > td,
        .tl-table .ant-table-tbody > tr:hover > td {
          background: var(--bg-slate-50) !important;
        }
        [data-theme='dark'] .pp-table .ant-table-tbody > tr.pp-row:hover > td,
        [data-theme='dark'] .tl-table .ant-table-tbody > tr.pp-row:hover > td,
        [data-theme='dark'] .pp-table .ant-table-tbody > tr:hover > td,
        [data-theme='dark'] .tl-table .ant-table-tbody > tr:hover > td {
          background: #1e293b !important;
        }
        .pp-table .ant-table-tbody > tr.pp-row {
          cursor: pointer;
        }
        .pp-table .ant-table-selection-column,
        .tl-table .ant-table-selection-column {
          padding-inline: 6px !important;
        }

        /* Footer + pager */
        .pp-footer {
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
          padding: 8px 24px 8px 14px; background: var(--bg-pure-white); border-top: 1px solid var(--border-slate-200);
          box-sizing: border-box; flex-shrink: 0; margin-top: auto;
          position: sticky; bottom: 0; z-index: 20;
        }
        [data-theme='dark'] .pp-footer { background: #0f1419; border-top-color: #1f2937; }
        .pp-footer-info { font-size: 12px; color: var(--text-slate-500); }
        .pp-footer-info strong { color: var(--text-slate-700); font-weight: 700; }
        [data-theme='dark'] .pp-footer-info strong { color: #f1f5f9; }
        .pp-footer-sel { color: #3B82F6; font-weight: 600; }
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


        /* Premium action dropdown */
        .pp-action-pop .ant-dropdown-menu {
          padding: 6px; border-radius: 0; min-width: 236px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-100);
          box-shadow: 0 16px 40px rgba(15,23,42,0.18), 0 2px 8px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.03);
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
          overflow: hidden !important;
        }
        .pp-action-pop .ant-dropdown-menu::-webkit-scrollbar { display: none !important; }
        .pp-action-pop,
        .pp-action-pop * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
        .pp-action-pop ::-webkit-scrollbar { display: none !important; }
        .pp-action-pop .ant-dropdown-menu-item {
          padding: 0 !important; border-radius: 0 !important; margin: 1px 0;
          transition: background .12s ease;
        }
        .pp-action-pop .ant-dropdown-menu-item:hover { background: var(--bg-slate-50) !important; }
        .pp-action-pop .ant-dropdown-menu-item-divider { margin: 5px 8px !important; background: var(--border-slate-100); }
        .pp-action-pop .ant-dropdown-menu-title-content { line-height: 1.2; }
        .pp-menu-item { display: flex; align-items: center; gap: 11px; padding: 7px 9px; }
        .pp-menu-ic {
          width: 30px; height: 30px; border-radius: 0; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center; font-size: 14px;
        }
        .pp-menu-text { display: flex; flex-direction: column; min-width: 0; }
        .pp-menu-title { font-size: 13px; font-weight: 600; color: var(--text-slate-900); letter-spacing: -0.01em; }
        .pp-menu-desc { font-size: 11px; color: var(--text-slate-400); margin-top: 1px; }
        .pp-action-pop .ant-dropdown-menu-item-danger:hover { background: rgba(239,68,68,0.08) !important; }
        .pp-action-pop .ant-dropdown-menu-item-danger .pp-menu-title { color: #ef4444; }
        .pp-action-pop .ant-dropdown-menu-item-disabled { opacity: 0.45; }
        .pp-action-pop .ant-dropdown-menu-item-disabled:hover { background: transparent !important; }

        .pp-backdrop {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(2px);
          z-index: 999;
        }
        .pp-mobile-toggle {
          display: none;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          padding: 8px;
          cursor: pointer;
          color: var(--text-slate-600);
          margin-right: 12px;
        }
        @media (max-width: 1024px) {
          .pp-sidebar {
            position: fixed;
            left: -280px;
            top: 54px;
            bottom: 0;
            height: calc(100vh - 54px);
            transition: left 0.3s ease;
            z-index: 1000;
            box-shadow: 4px 0 24px rgba(15, 23, 42, 0.1);
            display: flex;
          }
          .pp-sidebar.is-open { left: 0; }
          .pp-backdrop { display: block; }
          .pp-mobile-toggle { display: flex; }
          .pp-stats { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .pp-stats { grid-template-columns: 1fr; }
        }
      `}</style>
    </MainLayout >
  );
}
