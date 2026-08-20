"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Drawer,
  Form,
  Input,
  DatePicker,
  message,
  Popconfirm,
  Tooltip,
  Dropdown,
  Table,
  Space,
  Avatar,
  Modal,
} from "antd";
import {
  Plus,
  Rocket,
  Calendar,
  Flag,
  Edit3,
  Trash2,
  Tag,
  FolderKanban,
  ChevronDown,
  ChevronRight,
  X,
  Search,
  LayoutGrid,
  List,
  MoreHorizontal,
} from "lucide-react";
import dayjs from "dayjs";
import {
  releaseService,
  ClientRelease,
  MilestoneOption,
  CreateReleasePayload,
} from "@/services/releaseService";
import { useTheme } from "@/context/ThemeContext";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";
import { commonDrawerProps, SectionCard, drawerFormStyles } from "@/components/common/DrawerSection";
import TiptapEditor from "@/components/common/TiptapEditor";
import SearchableDropdown from "@/components/common/SearchableDropdown";

type Mode = "light" | "dark";

const palette = (mode: Mode) => {
  const dark = mode === "dark";
  return {
    surfaceElevated: dark ? "#131B2D" : "#ffffff",
    surfaceMuted: dark ? "#0F1626" : "#f8fafc",
    border: dark ? "#1E293B" : "#e5e7eb",
    borderStrong: dark ? "#273449" : "#d1d5db",
    text: dark ? "#F1F5F9" : "#0f172a",
    textMuted: dark ? "#CBD5E1" : "#475569",
    textSubtle: dark ? "#94A3B8" : "#64748b",
    textFaint: dark ? "#64748B" : "#94a3b8",
    accentBg: dark ? "rgba(59,130,246,0.12)" : "#eff6ff",
    accentBorder: dark ? "rgba(59,130,246,0.35)" : "#bfdbfe",
    accentText: dark ? "#93c5fd" : "#1d4ed8",
    successBg: dark ? "rgba(16,185,129,0.12)" : "#ecfdf5",
    successBorder: dark ? "rgba(16,185,129,0.35)" : "#a7f3d0",
    successText: dark ? "#6ee7b7" : "#047857",
    purpleBg: dark ? "rgba(139,92,246,0.12)" : "#f5f3ff",
    purpleBorder: dark ? "rgba(139,92,246,0.35)" : "#ddd6fe",
    purpleText: dark ? "#c4b5fd" : "#6d28d9",
    overlay: dark ? "rgba(0,0,0,0.7)" : "rgba(15,23,42,0.45)",
  };
};

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return String(iso);
  }
}

/* --------------------------------------------------------------- */

interface Props {
  clientId: string;
  projects?: { id: string; name: string; code?: string | null }[];
  onRefresh?: () => void;
}

export default function ReleasesTab({ clientId, projects = [], onRefresh }: Props) {
  const { theme } = useTheme();
  const c = useMemo(() => palette(theme as Mode), [theme]);

  const [items, setItems] = useState<ClientRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<ClientRelease | null>(null);
  const [viewingRelease, setViewingRelease] = useState<ClientRelease | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");

  const load = async () => {
    setLoading(true);
    try {
      setItems(await releaseService.list(clientId));
    } catch (err: any) {
      messageApi.error(`Failed to load releases: ${err?.message || ""}`);
    } finally {
      setLoading(false);
    }
  };
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await Promise.all([
        load(),
        onRefresh ? onRefresh() : Promise.resolve(),
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const remove = async (r: ClientRelease) => {
    try {
      await releaseService.remove(r.id);
      messageApi.success("Release removed");
      load();
    } catch (err: any) {
      messageApi.error(`Delete failed: ${err?.message || ""}`);
    }
  };

  const releaseActionMenu = (r: ClientRelease) => ({
    className: "pp-action-pop",
    items: [
      {
        key: "edit",
        label: (
          <div className="pp-menu-item">
            <span className="pp-menu-ic" style={{ color: "#3b82f6", background: "rgba(59, 130, 246, 0.12)" }}><Edit3 size={13} /></span>
            <span className="pp-menu-text">
              <span className="pp-menu-title">Edit</span>
              <span className="pp-menu-desc">Modify details</span>
            </span>
          </div>
        )
      },
      {
        key: "delete",
        danger: true,
        label: (
          <div className="pp-menu-item">
            <span className="pp-menu-ic" style={{ color: "#ef4444", background: "rgba(239, 68, 68, 0.12)" }}><Trash2 size={13} /></span>
            <span className="pp-menu-text">
              <span className="pp-menu-title" style={{ color: "#ef4444" }}>Delete</span>
              <span className="pp-menu-desc">Remove release</span>
            </span>
          </div>
        )
      }
    ],
    onClick: ({ key, domEvent }: any) => {
      domEvent?.stopPropagation();
      if (key === "edit") {
        setEditing(r);
        setCreateOpen(true);
      } else if (key === "delete") {
        Modal.confirm({
          title: "Delete Release",
          content: `Are you sure you want to delete "${r.title}"? This action cannot be undone.`,
          okText: "Delete",
          okType: "danger",
          cancelText: "Cancel",
          onOk: () => remove(r),
        });
      }
    }
  });

  const filteredItems = items.filter((item) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      (item.title || "").toLowerCase().includes(search) ||
      (item.version || "").toLowerCase().includes(search) ||
      (item.projectName || "").toLowerCase().includes(search) ||
      (item.milestoneName || "").toLowerCase().includes(search);

    let matchesProject = true;
    if (selectedProject !== "all") {
      matchesProject = item.projectId === selectedProject;
    }

    return matchesSearch && matchesProject;
  });

  const columns = [
    {
      title: "Release",
      key: "title",
      render: (_: any, record: ClientRelease) => (
        <Space size={12} style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: c.accentBg,
              border: `1px solid ${c.accentBorder}`,
              color: c.accentText,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Rocket size={14} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 600, color: "var(--text-slate-900)", fontSize: 13.5, display: "flex", alignItems: "center", gap: 6, minWidth: 0, width: "100%" }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "300px", flexShrink: 1, minWidth: 0 }} title={record.title}>
                {record.title}
              </span>
              {record.version && (
                <span
                  className="pc-status-tag"
                  style={{
                    color: c.purpleText,
                    background: c.purpleBg,
                    border: `1px solid ${c.purpleBorder}`,
                    height: "18px",
                    padding: "0 6px",
                    fontSize: "9.5px",
                    fontWeight: 700,
                    borderRadius: "4px",
                    lineHeight: "16px",
                  }}
                >
                  {record.version}
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-slate-500)", display: "flex", gap: 8, marginTop: 2 }}>
              {record.projectName && <span>Project: {record.projectName}</span>}
            </div>
          </div>
        </Space>
      )
    },
    {
      title: "Milestone",
      key: "milestone",
      render: (_: any, record: ClientRelease) =>
        record.milestoneName ? (
          <span
            className="pc-status-tag"
            style={{
              color: c.accentText,
              background: c.accentBg,
              border: `1px solid ${c.accentBorder}`,
              height: "20px",
              padding: "0 8px",
              fontSize: "11px",
              fontWeight: 600,
              borderRadius: "6px",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Flag size={11} />
            {record.milestoneName}
          </span>
        ) : <span style={{ color: "var(--text-slate-400)" }}>—</span>
    },
    {
      title: "Released Date",
      key: "releaseDate",
      render: (_: any, record: ClientRelease) => (
        <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-slate-700)" }}>
          {fmtDate(record.releaseDate)}
        </span>
      )
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) =>
        date ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-slate-700)" }}>{dayjs(date).format("MMM D, YYYY")}</span>
            <span style={{ fontSize: "11px", color: "var(--text-slate-400)" }}>{dayjs(date).format("h:mm A")}</span>
          </div>
        ) : <span style={{ color: "var(--text-slate-400)" }}>—</span>,
    },
    {
      title: "Created By",
      key: "createdBy",
      render: (_: any, record: ClientRelease) => {
        const name = record.createdByName;
        if (!name) return <span style={{ color: "var(--text-slate-400)" }}>—</span>;
        return (
          <div className="pp-creator" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Avatar size={20} style={{ background: "var(--bg-blue-50)", color: "#3b82f6", fontSize: 9, fontWeight: 700 }}>
              {(name[0] || "").toUpperCase()}
            </Avatar>
            <span className="pp-creator-name" style={{ fontSize: "11.5px", color: "var(--text-slate-700)", whiteSpace: "nowrap" }}>{name}</span>
          </div>
        );
      },
    },
    {
      title: "Updated At",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (date: string) =>
        date ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-slate-700)" }}>{dayjs(date).format("MMM D, YYYY")}</span>
            <span style={{ fontSize: "11px", color: "var(--text-slate-400)" }}>{dayjs(date).format("h:mm A")}</span>
          </div>
        ) : <span style={{ color: "var(--text-slate-400)" }}>—</span>,
    },
    {
      title: "Actions",
      key: "actions",
      align: "right" as const,
      width: 72,
      fixed: "right" as const,
      render: (_: any, record: ClientRelease) => (
        <Dropdown
          menu={releaseActionMenu(record)}
          overlayClassName="pp-action-pop"
          trigger={["click"]}
          placement="bottomRight"
        >
          <Button
            type="text"
            className="pp-icon-btn"
            icon={<MoreHorizontal size={16} />}
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      ),
    },
  ];

  return (
    <div style={{ padding: "4px 0 24px", color: c.text }}>
      {contextHolder}

      {/* Header */}
      <div className="cd-tab-sticky-head">
      <div className="releases-header-wrap" style={{ margin: "0 -32px" }}>
          <TimeTrackingHeader
            icon={<Rocket size={20} color="#3b82f6" />}
            title="Releases"
            description="Shipped versions, the milestone they belong to, and what changed."
            onRefresh={handleRefresh}
            refreshing={refreshing}
            extra={
              <Button
                type="primary"
                icon={<Plus size={15} />}
                onClick={() => {
                  setEditing(null);
                  setCreateOpen(true);
                }}
                style={{
                  background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                  borderColor: "transparent",
                  borderRadius: "8px",
                  height: "36px",
                  fontWeight: 600,
                  boxShadow: "0 4px 12px rgba(59, 130, 246, 0.15)",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                Add release
              </Button>
            }
            style={{ background: "transparent", borderBottom: "1px solid var(--border-slate-100)" }}
          />
        </div>
  
        {/* Filters & Toggles */}
        <div style={{ margin: "12px 0 8px 0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", flex: 1, minWidth: 0 }}>
            <Input
              placeholder="Search by release title, version or project..."
              prefix={<Search size={15} style={{ color: "var(--text-slate-400)", marginRight: 8 }} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="contacts-search-input"
              style={{ width: "320px" }}
              allowClear
            />
  
            <SearchableDropdown
              placeholder="Project"
              searchPlaceholder="Search projects"
              itemNoun="projects"
              value={selectedProject === "all" ? undefined : selectedProject}
              onChange={(v) => setSelectedProject(v ?? "all")}
              options={projects.map((p) => ({ value: p.id, label: p.name }))}
              width={220}
              disabled={projects.length === 0}
              className="contacts-filter-select-sd"
            />
          </div>
  
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div className="ptab-segmented">
              <button
                type="button"
                className={viewMode === "grid" ? "is-active" : ""}
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                className={viewMode === "list" ? "is-active" : ""}
                onClick={() => setViewMode("list")}
                aria-label="List view"
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>
  
        <div className="ptab-divider" />
      </div>

      <div>
        {loading ? (
          <div
            style={{
              padding: 48,
              textAlign: "center",
              border: `1px solid ${c.border}`,
              borderRadius: 12,
              background: c.surfaceElevated,
              color: c.textSubtle,
            }}
          >
            Loading…
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            c={c}
            onAdd={() => {
              setEditing(null);
              setCreateOpen(true);
            }}
          />
        ) : viewMode === "list" ? (
          <div className="pp-table-wrap">
            <Table
              dataSource={filteredItems}
              columns={columns}
              rowKey="id"
              pagination={false}
              className="pp-table"
              scroll={{ x: "max-content" }}
              onRow={(record) => ({
                onClick: () => setViewingRelease(record),
                style: { cursor: "pointer" },
              })}
            />
          </div>
        ) : (
          <div className="pp-grid">
            {filteredItems.map((r) => (
              <ReleaseCard
                key={r.id}
                release={r}
                c={c}
                onEdit={() => {
                  setEditing(r);
                  setCreateOpen(true);
                }}
                onRemove={() => remove(r)}
                releaseActionMenu={releaseActionMenu}
                onViewDetails={() => setViewingRelease(r)}
              />
            ))}
          </div>
        )}
      </div>

      <ReleaseModal
        open={createOpen}
        editing={editing}
        clientId={clientId}
        projects={projects}
        onClose={() => {
          setCreateOpen(false);
          setEditing(null);
        }}
        onSaved={() => {
          setCreateOpen(false);
          setEditing(null);
          load();
        }}
        c={c}
        messageApi={messageApi}
      />

      <ReleaseDetailDrawer
        release={viewingRelease}
        open={!!viewingRelease}
        onClose={() => setViewingRelease(null)}
        c={c}
      />

      <style dangerouslySetInnerHTML={{
        __html: `
        .releases-header-wrap {
          margin-bottom: 24px !important;
          display: block !important;
        }
        .releases-header-wrap .saas-header-container {
          margin-left: -32px !important;
          margin-right: -32px !important;
          padding-left: 32px !important;
          padding-right: 32px !important;
          padding-top: 4px !important;
          padding-bottom: 4px !important;
          margin-bottom: 0 !important;
        }
        @media (max-width: 900px) {
          .releases-header-wrap .saas-header-container {
            margin-left: -20px !important;
            margin-right: -20px !important;
            padding-left: 20px !important;
            padding-right: 20px !important;
          }
        }
        @media (max-width: 720px) {
          .releases-header-wrap .saas-header-container {
            margin-left: -16px !important;
            margin-right: -16px !important;
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
        }

        .contacts-search-input.ant-input-affix-wrapper {
          height: 32px !important;
          border-radius: 8px !important;
          background: var(--bg-slate-50) !important;
          border: 1px solid var(--border-slate-200) !important;
          box-shadow: none !important;
          transition: all 0.2s ease !important;
          padding: 4px 12px !important;
        }
        .contacts-search-input.ant-input-affix-wrapper:hover {
          border-color: var(--border-slate-200) !important;
        }
        .contacts-search-input.ant-input-affix-wrapper:focus-within {
          border-color: #8b5cf6 !important;
          background: var(--bg-pure-white) !important;
          box-shadow: none !important;
        }
        .contacts-search-input .ant-input {
          background: transparent !important;
          font-size: 13px !important;
          font-weight: 500 !important;
          color: var(--text-slate-800) !important;
        }
        [data-theme="dark"] .contacts-search-input.ant-input-affix-wrapper {
          background: var(--bg-secondary) !important;
          border-color: var(--border-slate-200) !important;
        }
        [data-theme="dark"] .contacts-search-input.ant-input-affix-wrapper:focus-within {
          background: var(--bg-slate-900) !important;
          border-color: #8b5cf6 !important;
        }

        .contacts-filter-select-sd.sd-trigger {
          height: 32px !important;
          border-radius: 8px !important;
          background: var(--bg-slate-50) !important;
          border: 1px solid var(--border-slate-200) !important;
          transition: all 0.2s ease !important;
          padding: 4px 12px !important;
          width: auto !important;
          min-width: 160px;
        }
        .contacts-filter-select-sd.sd-trigger.is-active {
          border-color: #8b5cf6 !important;
          background: var(--bg-pure-white) !important;
        }
        .contacts-filter-select-sd.sd-trigger.is-open {
          border-color: #8b5cf6 !important;
          background: var(--bg-pure-white) !important;
        }
        [data-theme="dark"] .contacts-filter-select-sd.sd-trigger {
          background: var(--bg-secondary) !important;
          border-color: var(--border-slate-200) !important;
        }
        [data-theme="dark"] .contacts-filter-select-sd.sd-trigger.is-active,
        [data-theme="dark"] .contacts-filter-select-sd.sd-trigger.is-open {
          background: var(--bg-slate-900) !important;
          border-color: #8b5cf6 !important;
        }

        /* Segmented Toggles */
        .ptab-segmented {
          display: inline-flex;
          border: 1px solid var(--border-slate-200);
          border-radius: 8px;
          overflow: hidden;
          background: var(--bg-pure-white);
        }
        .ptab-segmented button {
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          cursor: pointer;
          color: var(--text-slate-400);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }
        .ptab-segmented button:hover {
          color: var(--text-slate-600);
          background: var(--bg-slate-50);
        }
        .ptab-segmented button.is-active {
          background: var(--bg-blue-50) !important;
          color: #3b82f6 !important;
        }
        [data-theme='dark'] .ptab-segmented {
          border-color: var(--border-slate-200);
          background: var(--bg-secondary);
        }
        [data-theme='dark'] .ptab-segmented button.is-active {
          background: rgba(59, 130, 246, 0.15) !important;
          color: #60a5fa !important;
        }

        /* Proposal Style Table */
        .pp-table-wrap { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 0; overflow: hidden; }
        .pp-table .ant-table { background: transparent; font-size: 12px; }
        .pp-table .ant-table-thead > tr > th {
          background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em;
          text-transform: uppercase; color: var(--text-slate-400) !important; padding: 6px 10px !important;
          white-space: nowrap !important;
        }
        .pp-table .ant-table-thead > tr > th::before { display: none !important; }
        .pp-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 6.5px 10px !important; }
        .pp-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .pp-table .ant-table-tbody > tr:hover > td { background: var(--bg-slate-50) !important; }
        .pp-table .ant-table-placeholder > td { background: transparent !important; }

        .pp-icon-btn { color: var(--text-slate-400) !important; width: 26px !important; height: 26px !important; min-width: 26px !important; padding: 0 !important; }
        .pp-icon-btn:hover { color: var(--text-slate-900) !important; background: var(--bg-slate-100) !important; }

        .pp-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        @media (max-width: 700px) {
          .pp-grid { grid-template-columns: 1fr; }
        }

        .pc-card {
          border: 1px solid var(--border-slate-200); border-radius: 0; background: var(--bg-pure-white);
          cursor: pointer; overflow: hidden; display: flex; flex-direction: column;
          transition: box-shadow .15s ease, border-color .15s ease;
        }
        .pc-card:hover { box-shadow: 0 3px 12px rgba(15,23,42,0.06); border-color: #cbd5e1; }

        .pc-top { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; flex: 1; }
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

        .pc-foot { display: flex; flex-direction: column; padding: 0; border-top: 1px solid var(--border-slate-200); background: var(--bg-slate-50); }
        .pc-foot-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 8px 12px; }
        .pc-foot-row + .pc-foot-row { border-top: 1px solid var(--border-slate-200); }
        .pc-foot-item { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--text-slate-700); }
        .pc-foot-key { font-size: 10.5px; font-weight: 600; color: var(--text-slate-400); }
        .pc-foot-div { width: 1px; height: 11px; background: var(--border-slate-300, #cbd5e1); }
        .pc-status-tag { display: inline-flex; align-items: center; gap: 4px; height: 19px; padding: 0 7px; border-radius: 5px; font-size: 10.5px; font-weight: 700; }

        /* Dropdown Action Popover */
        .pp-action-pop .ant-dropdown-menu {
          padding: 6px; border-radius: 0; min-width: 200px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-100);
          box-shadow: 0 16px 40px rgba(15,23,42,0.18), 0 2px 8px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.03);
        }
        .pp-action-pop .ant-dropdown-menu-item {
          padding: 0 !important; border-radius: 0 !important; margin: 1px 0;
          transition: background .12s ease;
        }
        .pp-action-pop .ant-dropdown-menu-item:hover { background: var(--bg-slate-50) !important; }
        .pp-menu-item { display: flex; align-items: center; gap: 11px; padding: 7px 9px; }
        .pp-menu-ic {
          width: 30px; height: 30px; border-radius: 0; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center; font-size: 14px;
        }
        .pp-menu-text { display: flex; flex-direction: column; min-width: 0; }
        .pp-menu-title { font-size: 13px; font-weight: 600; color: var(--text-slate-900); letter-spacing: -0.01em; }
        .pp-menu-desc { font-size: 11px; color: var(--text-slate-400); margin-top: 1px; }
        .pp-action-pop .ant-dropdown-menu-item-danger:hover { background: rgba(239,68,68,0.08) !important; }

        .release-description-body img {
          max-width: 100%;
          height: auto;
          border-radius: 6px;
        }
        .release-description-body p {
          margin: 0 0 8px 0;
        }
        .release-description-body p:last-child {
          margin-bottom: 0;
        }
        .release-description-body ul,
        .release-description-body ol {
          padding-left: 22px;
          margin: 0 0 8px 0;
        }
      `}} />
    </div>
  );
}

/* --------------------------------------------------------------- */

function EmptyState({
  c,
  onAdd,
}: {
  c: ReturnType<typeof palette>;
  onAdd: () => void;
}) {
  return (
    <div
      style={{
        padding: 56,
        textAlign: "center",
        background: c.surfaceElevated,
        border: `1px dashed ${c.border}`,
        borderRadius: 14,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: c.accentBg,
          color: c.accentText,
          border: `1px solid ${c.accentBorder}`,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 14,
        }}
      >
        <Rocket size={22} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: c.text }}>
        No releases yet
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 13,
          color: c.textSubtle,
          maxWidth: 480,
          margin: "6px auto 0",
        }}
      >
        Log each version you ship — title, what's in it, and the milestone it
        belongs to.
      </div>
      <div style={{ marginTop: 18 }}>
        <Button type="primary" icon={<Plus size={15} />} onClick={onAdd}>
          Add first release
        </Button>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- */

function ReleaseCard({
  release,
  c,
  onEdit,
  onRemove,
  releaseActionMenu,
  onViewDetails,
}: {
  release: ClientRelease;
  c: ReturnType<typeof palette>;
  onEdit: () => void;
  onRemove: () => void;
  releaseActionMenu: any;
  onViewDetails: () => void;
}) {
  return (
    <div
      className="pc-card"
      style={{
        background: c.surfaceElevated,
        border: `1px solid ${c.border}`,
        borderRadius: 0,
        overflow: "hidden",
      }}
    >
      {/* Top row (Row 1) */}
      <div
        className="pc-top"
        style={{
          cursor: "pointer",
          alignItems: "center",
        }}
        onClick={onViewDetails}
      >
        <div
          className="pc-avatar"
          style={{
            background: c.accentBg,
            border: `1px solid ${c.accentBorder}`,
            color: c.accentText,
          }}
        >
          <Rocket size={14} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="pc-title" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%", fontWeight: 700 }} title={release.title}>
            {release.title}
          </div>
          <div className="pc-client-line" style={{ marginTop: 2, display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            <span className="pc-client-key">Project:</span>
            <span className="pc-client-val" style={{ maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {release.projectName || "No Project"}
            </span>
            {release.version && (
              <span
                className="pc-status-tag"
                style={{
                  color: c.purpleText,
                  background: c.purpleBg,
                  border: `1px solid ${c.purpleBorder}`,
                  height: "18px",
                  padding: "0 6px",
                  fontSize: "9.5px",
                  fontWeight: 700,
                  borderRadius: "4px",
                  lineHeight: "16px",
                }}
              >
                {release.version}
              </span>
            )}
            {release.milestoneName && (
              <span
                className="pc-status-tag"
                style={{
                  color: c.accentText,
                  background: c.accentBg,
                  border: `1px solid ${c.accentBorder}`,
                  height: "18px",
                  padding: "0 6px",
                  fontSize: "9.5px",
                  fontWeight: 700,
                  borderRadius: "4px",
                  lineHeight: "16px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <Flag size={9} />
                {release.milestoneName}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 4, alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
          <Dropdown
            menu={releaseActionMenu(release)}
            overlayClassName="pp-action-pop"
            trigger={["click"]}
            placement="bottomRight"
          >
            <button type="button" className="pc-actions">
              <MoreHorizontal size={14} />
            </button>
          </Dropdown>
        </div>
      </div>

      <div className="pc-foot">
        {/* Foot Row 1 (Row 2): Created, Created By, Updated */}
        <div className="pc-foot-row">
          <span className="pc-foot-item">
            <span className="pc-foot-key">Created:</span>
            <span className="pc-foot-val">{release.createdAt ? dayjs(release.createdAt).format("MMM D, YYYY · h:mm A") : "—"}</span>
          </span>
          <span className="pc-foot-div" />
          <span className="pc-foot-item">
            <span className="pc-foot-key">Created by:</span>
            {release.createdByName ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <Avatar size={16} style={{ background: "var(--bg-blue-50)", color: "#3b82f6", fontSize: 8, fontWeight: 700 }}>
                  {(release.createdByName[0] || "").toUpperCase()}
                </Avatar>
                <span className="pc-foot-val">
                  {release.createdByName.trim().split(/\s+/)[0]}
                </span>
              </span>
            ) : (
              <span className="pc-foot-val">—</span>
            )}
          </span>
          <span className="pc-foot-div" />
          <span className="pc-foot-item">
            <span className="pc-foot-key">Updated:</span>
            <span className="pc-foot-val">{release.updatedAt ? dayjs(release.updatedAt).format("MMM D, YYYY · h:mm A") : "—"}</span>
          </span>
        </div>

        {/* Foot Row 2 (Row 3): Released date */}
        <div className="pc-foot-row">
          <span className="pc-foot-item">
            <span className="pc-foot-key">Released on:</span>
            <span className="pc-foot-val" style={{ fontWeight: 600 }}>{fmtDate(release.releaseDate)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function ReleaseDetailDrawer({
  release,
  open,
  onClose,
  c,
}: {
  release: ClientRelease | null;
  open: boolean;
  onClose: () => void;
  c: ReturnType<typeof palette>;
}) {
  if (!release) return null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={640}
      title={null}
      closable={false}
      styles={{
        mask: { backgroundColor: c.overlay },
        content: { background: c.surfaceElevated },
        header: { display: "none" },
        body: {
          padding: 0,
          background: c.surfaceElevated,
        },
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 22px 12px",
          borderBottom: `1px solid ${c.border}`,
          display: "flex",
          gap: 14,
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: c.accentBg,
            border: `1px solid ${c.accentBorder}`,
            color: c.accentText,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Rocket size={16} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {release.version && (
              <span
                style={{
                  color: c.purpleText,
                  background: c.purpleBg,
                  border: `1px solid ${c.purpleBorder}`,
                  padding: "2px 8px",
                  fontSize: "11px",
                  fontWeight: 700,
                  borderRadius: "4px",
                }}
              >
                {release.version}
              </span>
            )}
            {release.milestoneName && (
              <span
                style={{
                  color: c.accentText,
                  background: c.accentBg,
                  border: `1px solid ${c.accentBorder}`,
                  padding: "2px 8px",
                  fontSize: "11px",
                  fontWeight: 600,
                  borderRadius: "6px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Flag size={11} />
                {release.milestoneName}
              </span>
            )}
          </div>
          <h2
            style={{
              margin: "6px 0 0",
              fontSize: 16,
              fontWeight: 600,
              color: c.text,
              letterSpacing: "-0.01em",
            }}
          >
            {release.title}
          </h2>
          <div
            style={{
              marginTop: 6,
              fontSize: 12,
              color: c.textSubtle,
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            {release.projectName && <span>📁 {release.projectName}</span>}
            {release.releaseDate && (
              <span>Released {fmtDate(release.releaseDate)}</span>
            )}
          </div>
        </div>
        <Button
          type="text"
          onClick={onClose}
          icon={<X size={16} color={c.textSubtle} />}
          style={{ marginTop: -4 }}
          aria-label="Close"
        />
      </div>

      {/* Body */}
      <div
        style={{
          padding: 22,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Info Grid */}
        <div
          style={{
            background: c.surfaceMuted,
            border: `1px solid ${c.border}`,
            borderRadius: 0,
            padding: "12px 16px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: c.textSubtle, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Created By
            </div>
            <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
              <Avatar size={20} style={{ background: "var(--bg-blue-50)", color: "#3b82f6", fontSize: 9, fontWeight: 700 }}>
                {((release.createdByName || "?")[0] || "").toUpperCase()}
              </Avatar>
              <span style={{ fontSize: 12.5, fontWeight: 500, color: c.text }}>
                {release.createdByName || "—"}
              </span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: c.textSubtle, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Created At
            </div>
            <div style={{ marginTop: 4, fontSize: 12.5, color: c.text }}>
              {release.createdAt ? dayjs(release.createdAt).format("MMM D, YYYY · h:mm A") : "—"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: c.textSubtle, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Last Updated
            </div>
            <div style={{ marginTop: 4, fontSize: 12.5, color: c.text }}>
              {release.updatedAt ? dayjs(release.updatedAt).format("MMM D, YYYY · h:mm A") : "—"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: c.textSubtle, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Released Date
            </div>
            <div style={{ marginTop: 4, fontSize: 12.5, color: c.text }}>
              {fmtDate(release.releaseDate)}
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div
          style={{
            background: c.surfaceElevated,
            border: `1px solid ${c.border}`,
            borderRadius: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "8px 12px",
              background: c.surfaceMuted,
              borderBottom: `1px solid ${c.border}`,
              fontSize: 11,
              fontWeight: 600,
              color: c.textSubtle,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Release Notes
          </div>
          <div style={{ padding: "14px 16px" }}>
            {release.description ? (
              <div
                className="release-description-body"
                style={{
                  fontSize: 13,
                  color: c.textMuted,
                  lineHeight: 1.6,
                }}
                dangerouslySetInnerHTML={{ __html: release.description }}
              />
            ) : (
              <div style={{ fontSize: 12.5, color: c.textSubtle, fontStyle: "italic" }}>
                No description provided.
              </div>
            )}
          </div>
        </div>
      </div>
    </Drawer>
  );
}

/* --------------------------------------------------------------- */

function ReleaseModal({
  open,
  editing,
  clientId,
  projects,
  onClose,
  onSaved,
  c,
  messageApi,
}: {
  open: boolean;
  editing: ClientRelease | null;
  clientId: string;
  projects: { id: string; name: string; code?: string | null }[];
  onClose: () => void;
  onSaved: () => void;
  c: ReturnType<typeof palette>;
  messageApi: any;
}) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [milestones, setMilestones] = useState<MilestoneOption[]>([]);
  const [loadingMilestones, setLoadingMilestones] = useState(false);
  const [descHtml, setDescHtml] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(
    undefined,
  );

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setDescHtml("");
      setSelectedProjectId(undefined);
      return;
    }
    let cancelled = false;
    setLoadingMilestones(true);
    releaseService
      .milestoneOptions(clientId)
      .then((opts) => {
        if (cancelled) return;
        // Always include the editing release's milestone even if completed
        if (
          editing?.milestoneId &&
          !opts.find((o) => o.id === editing.milestoneId)
        ) {
          opts = [
            ...opts,
            {
              id: editing.milestoneId,
              name: editing.milestoneName || "(milestone)",
              status: editing.milestoneStatus || "",
              projectId: editing.projectId,
              projectName: editing.projectName,
            },
          ];
        }
        setMilestones(opts);
      })
      .catch((err: any) => {
        messageApi.error(`Failed to load milestones: ${err?.message || ""}`);
      })
      .finally(() => {
        if (!cancelled) setLoadingMilestones(false);
      });

    if (editing) {
      setDescHtml(editing.description || "");
      setSelectedProjectId(editing.projectId || undefined);
      form.setFieldsValue({
        title: editing.title,
        version: editing.version || undefined,
        releaseDate: editing.releaseDate ? dayjs(editing.releaseDate) : null,
        projectId: editing.projectId || undefined,
        milestoneId: editing.milestoneId || undefined,
        description: editing.description || "",
      });
    } else {
      setDescHtml("");
      setSelectedProjectId(undefined);
      form.setFieldsValue({
        releaseDate: dayjs(),
      });
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing, clientId]);

  const filteredMilestones = useMemo(() => {
    if (!selectedProjectId) return milestones;
    return milestones.filter((m) => m.projectId === selectedProjectId);
  }, [milestones, selectedProjectId]);

  const onProjectChange = (next: string | undefined) => {
    setSelectedProjectId(next);
    const currentMs = form.getFieldValue("milestoneId");
    if (currentMs) {
      const stillValid =
        !next ||
        milestones.find((m) => m.id === currentMs && m.projectId === next);
      if (!stillValid) form.setFieldValue("milestoneId", undefined);
    }
  };

  const submit = async (v: any) => {
    setSubmitting(true);
    try {
      const payload: CreateReleasePayload = {
        title: v.title.trim(),
        version: v.version?.trim() || undefined,
        description: descHtml?.trim() || undefined,
        releaseDate: v.releaseDate ? v.releaseDate.format("YYYY-MM-DD") : null,
        projectId: v.projectId || null,
        milestoneId: v.milestoneId || null,
      };
      if (editing) {
        await releaseService.update(editing.id, payload);
        messageApi.success("Release updated");
      } else {
        await releaseService.create(clientId, payload);
        messageApi.success("Release created");
      }
      onSaved();
    } catch (err: any) {
      messageApi.error(`Save failed: ${err?.message || ""}`);
    } finally {
      setSubmitting(false);
    }
  };

  const title = editing ? "Edit release" : "Add release";
  const subtitle = editing
    ? "Update the release details. The full description supports rich text."
    : "Log a new version. Pick the milestone it ships under and describe what changed.";

  return (
    <>
      <style>{drawerFormStyles}</style>
      <Drawer
        {...commonDrawerProps}
        open={open}
        onClose={onClose}
        destroyOnClose
      >
        <div className="flex flex-col h-full bg-[var(--customers-page-bg,#0B0F1A)]">
          <div className="customer-drawer-header shrink-0 flex items-center justify-between px-6 py-4 border-b border-dashed border-[var(--border-color)]">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
                style={{ background: c.accentBg, border: `1px solid ${c.accentBorder}`, color: c.accentText }}
              >
                <Rocket size={16} />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-[var(--text-primary)] leading-tight m-0">{title}</h2>
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 6,
                  padding: "6px 12px",
                  background: `rgba(59,130,246,0.08)`,
                  border: `1px solid rgba(59,130,246,0.22)`,
                  borderRadius: 8,
                  fontSize: 12,
                  color: c.accentText,
                  lineHeight: 1.5,
                }}>
                  {subtitle}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 customer-drawer-form">
        <Form
          form={form}
          layout="horizontal"
          labelCol={{ span: 7 }}
          wrapperCol={{ span: 17 }}
          labelAlign="left"
          onFinish={submit}
          requiredMark={false}
        >
          <SectionCard
            title="What ships"
            subtitle="Title and version, plus the milestone this release belongs to."
            icon={<Rocket size={14} />}
            step="STEP 1"
          >
            <Form.Item
              name="title"
              label="Title"
              rules={[
                { required: true, message: "Required" },
                { 
                  pattern: /^[a-zA-Z0-9\s\-_.&()]+$/, 
                  message: "Only alphanumeric characters, spaces, and basic punctuation (-_.&()) are allowed" 
                }
              ]}
              style={{ marginBottom: 12 }}
            >
              <Input placeholder="e.g. Payments hardening" maxLength={100} />
            </Form.Item>
            <Form.Item
              name="version"
              label="Version"
              style={{ marginBottom: 12 }}
            >
              <Input placeholder="e.g. v1.2.0" maxLength={64} />
            </Form.Item>

            <Form.Item
              name="projectId"
              label="Project"
              style={{ marginBottom: 12 }}
            >
              <SearchableDropdown
                placeholder={
                  projects.length === 0 ? "No projects linked" : "Select project"
                }
                searchPlaceholder="Search projects..."
                disabled={projects.length === 0}
                onChange={(v) => onProjectChange(v as string)}
                options={projects.map((p) => ({
                  value: p.id,
                  label: p.code ? `${p.name} · ${p.code}` : p.name,
                }))}
              />
            </Form.Item>
            <Form.Item
              name="releaseDate"
              label="Release date"
              style={{ marginBottom: 12 }}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              name="milestoneId"
              label="Milestone"
              style={{ marginBottom: 0 }}
            >
              <SearchableDropdown
                placeholder={
                  loadingMilestones
                    ? "Loading…"
                    : selectedProjectId
                      ? "Select milestone for this project"
                      : "Select milestone"
                }
                searchPlaceholder="Search milestones..."
                loading={loadingMilestones}
                options={filteredMilestones.map((m) => ({
                  value: m.id,
                  label: m.projectName ? `${m.name} · ${m.projectName}` : m.name,
                }))}
              />
            </Form.Item>
          </SectionCard>

          <SectionCard
            title="Description"
            subtitle="Release notes — what changed, why, and anything the client should know."
            icon={<Flag size={14} />}
            step="STEP 2"
          >
            <Form.Item name="description" style={{ marginBottom: 0 }} wrapperCol={{ span: 24 }}>
              <TiptapEditor
                content={descHtml}
                onChange={(html) => {
                  setDescHtml(html);
                  form.setFieldValue("description", html);
                }}
                minHeight={220}
                maxHeight={420}
              />
            </Form.Item>
          </SectionCard>
        </Form>
      </div>

      {/* Sticky footer */}
      <div className="customer-drawer-footer shrink-0 px-6 py-4 border-t border-[var(--border-color)] flex items-center justify-end gap-3 bg-[var(--customers-page-bg,#0B0F1A)]">
        <Button onClick={onClose} className="border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] bg-transparent">
          Cancel
        </Button>
        <Button
          type="primary"
          htmlType="submit"
          loading={submitting}
          onClick={() => form.submit()}
          icon={<Plus size={14} />}
          className="font-medium shadow-sm hover:opacity-90"
        >
          {editing ? "Save changes" : "Create release"}
        </Button>
      </div>
    </div>
  </Drawer>
  </>
  );
}

/* --------------------------------------------------------------- */

function L({
  c,
  children,
}: {
  c: ReturnType<typeof palette>;
  children: React.ReactNode;
}) {
  return (
    <span style={{ fontSize: 12.5, color: c.textMuted, fontWeight: 500 }}>
      {children}
    </span>
  );
}
