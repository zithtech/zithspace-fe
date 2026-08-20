"use client";

import dayjs from "dayjs";
import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Switch,
  Tooltip,
  Table,
  Dropdown,
  Drawer,
} from "antd";
import {
  Plus,
  Users,
  User as UserIcon,
  Mail,
  Phone,
  Star,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  Crown,
  Briefcase,
  Search,
  LayoutGrid,
  List,
  MoreHorizontal,
} from "lucide-react";
import {
  teamService,
  TeamMember,
  TeamDiscipline,
  TeamAvailability,
  CreateTeamMemberPayload,
  StaffOption,
} from "@/services/teamService";
import { useTheme } from "@/context/ThemeContext";
import {
  PremiumModal,
  ModalSection,
  ModalFooterActions,
} from "./_PremiumModal";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";
import { commonDrawerProps, SectionCard, drawerFormStyles } from "@/components/common/DrawerSection";
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
    warningBg: dark ? "rgba(245,158,11,0.12)" : "#fffbeb",
    warningBorder: dark ? "rgba(245,158,11,0.35)" : "#fde68a",
    warningText: dark ? "#fcd34d" : "#92400e",
    dangerBg: dark ? "rgba(239,68,68,0.12)" : "#fef2f2",
    dangerBorder: dark ? "rgba(239,68,68,0.35)" : "#fecaca",
    dangerText: dark ? "#fca5a5" : "#b91c1c",
    purpleBg: dark ? "rgba(139,92,246,0.12)" : "#f5f3ff",
    purpleBorder: dark ? "rgba(139,92,246,0.35)" : "#ddd6fe",
    purpleText: dark ? "#c4b5fd" : "#6d28d9",
    pinkBg: dark ? "rgba(236,72,153,0.12)" : "#fdf2f8",
    pinkBorder: dark ? "rgba(236,72,153,0.35)" : "#fbcfe8",
    pinkText: dark ? "#f9a8d4" : "#be185d",
    overlay: dark ? "rgba(0,0,0,0.7)" : "rgba(15,23,42,0.45)",
  };
};

function tonesOf(c: ReturnType<typeof palette>) {
  return {
    accent: { bg: c.accentBg, border: c.accentBorder, text: c.accentText },
    success: { bg: c.successBg, border: c.successBorder, text: c.successText },
    warning: { bg: c.warningBg, border: c.warningBorder, text: c.warningText },
    danger: { bg: c.dangerBg, border: c.dangerBorder, text: c.dangerText },
    purple: { bg: c.purpleBg, border: c.purpleBorder, text: c.purpleText },
    pink: { bg: c.pinkBg, border: c.pinkBorder, text: c.pinkText },
    neutral: {
      bg: c.surfaceMuted,
      border: c.border,
      text: c.textSubtle,
    },
  };
}

const DISCIPLINE_META: Record<
  string,
  { label: string; tone: keyof ReturnType<typeof tonesOf> }
> = {
  engineering: { label: "Engineering", tone: "accent" },
  design: { label: "Design", tone: "pink" },
  qa: { label: "QA", tone: "purple" },
  pm: { label: "PM", tone: "warning" },
  account: { label: "Account", tone: "success" },
  devops: { label: "DevOps", tone: "accent" },
  data: { label: "Data", tone: "purple" },
  support: { label: "Support", tone: "accent" },
  other: { label: "Other", tone: "neutral" },
};

const AVAILABILITY_META: Record<
  string,
  { label: string; tone: keyof ReturnType<typeof tonesOf>; dot: string }
> = {
  available: { label: "Available", tone: "success", dot: "#10b981" },
  limited: { label: "Limited capacity", tone: "warning", dot: "#f59e0b" },
  away: { label: "Away", tone: "neutral", dot: "#94a3b8" },
  unavailable: { label: "Unavailable", tone: "danger", dot: "#ef4444" },
};

function initials(name: string): string {
  return (name || "?")
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/* --------------------------------------------------------------- */

interface Props {
  clientId: string;
  projects?: { id: string; name: string; code?: string | null }[];
  onRefresh?: () => void;
  onCountChange?: (n: number) => void;
}

export default function TeamTab({ clientId, projects = [], onCountChange, onRefresh }: Props) {
  const { theme } = useTheme();
  const c = useMemo(() => palette(theme as Mode), [theme]);
  const tones = useMemo(() => tonesOf(c), [c]);

  const [items, setItems] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    return items.filter((m) => {
      const searchLower = searchQuery.toLowerCase().trim();
      if (searchLower) {
        const nameMatch = m.displayName?.toLowerCase().includes(searchLower);
        const roleMatch = m.roleLabel?.toLowerCase().includes(searchLower);
        const disc = m.discipline ? DISCIPLINE_META[m.discipline]?.label.toLowerCase() : "";
        const discMatch = disc ? disc.includes(searchLower) : false;
        if (!nameMatch && !roleMatch && !discMatch) return false;
      }
      if (projectFilter && m.projectId !== projectFilter) return false;
      return true;
    });
  }, [items, searchQuery, projectFilter]);

  const teamMemberActionMenu = (m: TeamMember) => {
    return {
      items: [
        {
          key: "toggle-visibility",
          label: (
            <div className="pp-menu-item">
              <span className="pp-menu-ic" style={{ color: "#3b82f6", background: "rgba(59, 130, 246, 0.12)" }}>
                {m.isVisible ? <EyeOff size={13} /> : <Eye size={13} />}
              </span>
              <span className="pp-menu-text">
                <span className="pp-menu-title">{m.isVisible ? "Hide from portal" : "Make visible"}</span>
                <span className="pp-menu-desc">{m.isVisible ? "Hide from client portal" : "Show to client portal"}</span>
              </span>
            </div>
          ),
          onClick: () => toggleVisible(m),
        },
        {
          key: "toggle-primary",
          label: (
            <div className="pp-menu-item">
              <span className="pp-menu-ic" style={{ color: "#eab308", background: "rgba(234, 179, 8, 0.12)" }}>
                <Star size={13} fill={m.isPrimaryContact ? "#eab308" : "none"} color="#eab308" />
              </span>
              <span className="pp-menu-text">
                <span className="pp-menu-title">{m.isPrimaryContact ? "Remove primary" : "Set as primary"}</span>
                <span className="pp-menu-desc">{m.isPrimaryContact ? "Remove primary contact role" : "Mark as primary contact"}</span>
              </span>
            </div>
          ),
          onClick: () => togglePrimary(m),
        },
        {
          key: "edit",
          label: (
            <div className="pp-menu-item">
              <span className="pp-menu-ic" style={{ color: "#8b5cf6", background: "rgba(139, 92, 246, 0.12)" }}>
                <Edit3 size={13} />
              </span>
              <span className="pp-menu-text">
                <span className="pp-menu-title">Edit details</span>
                <span className="pp-menu-desc">Modify team member info</span>
              </span>
            </div>
          ),
          onClick: () => {
            setEditing(m);
            setModalOpen(true);
          },
        },
        {
          key: "remove",
          danger: true,
          label: (
            <div className="pp-menu-item">
              <span className="pp-menu-ic" style={{ color: "#ef4444", background: "rgba(239, 68, 68, 0.12)" }}>
                <Trash2 size={13} />
              </span>
              <span className="pp-menu-text">
                <span className="pp-menu-title" style={{ color: "#ef4444" }}>Remove member</span>
                <span className="pp-menu-desc">Remove from client portal</span>
              </span>
            </div>
          ),
          onClick: () => {
            Modal.confirm({
              title: "Remove team member?",
              content: "They will disappear from the client portal immediately.",
              okText: "Remove",
              okType: "danger",
              cancelText: "Cancel",
              centered: true,
              onOk: () => remove(m),
            });
          },
        },
      ],
    };
  };

  const load = async () => {
    setLoading(true);
    try {
      const loaded = await teamService.listForClient(clientId);
      setItems(loaded);
      onCountChange?.(loaded.length);
    } catch (err: any) {
      messageApi.error(`Failed to load team: ${err?.message || ""}`);
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

  const toggleVisible = async (m: TeamMember) => {
    try {
      await teamService.update(m.id, { isVisible: !m.isVisible });
      load();
    } catch (err: any) {
      messageApi.error(`Update failed: ${err?.message || ""}`);
    }
  };
  const togglePrimary = async (m: TeamMember) => {
    try {
      await teamService.update(m.id, { isPrimaryContact: !m.isPrimaryContact });
      load();
    } catch (err: any) {
      messageApi.error(`Update failed: ${err?.message || ""}`);
    }
  };
  const remove = async (m: TeamMember) => {
    try {
      await teamService.remove(m.id);
      messageApi.success("Team member removed");
      load();
    } catch (err: any) {
      messageApi.error(`Delete failed: ${err?.message || ""}`);
    }
  };

  const columns = useMemo(() => {
    return [
      {
        title: "Team Member",
        key: "displayName",
        render: (_: any, m: TeamMember) => {
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar member={m} c={c} size={32} />
              <div>
                <div style={{ fontWeight: 600, color: c.text, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                  {m.displayName}
                  {m.isPrimaryContact && (
                    <Tooltip title="Primary contact for this client">
                      <Crown size={11} style={{ color: "#eab308" }} />
                    </Tooltip>
                  )}
                </div>
                <div style={{ fontSize: 11.5, color: c.textSubtle }}>
                  {m.roleLabel}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        title: "Discipline",
        dataIndex: "discipline",
        key: "discipline",
        render: (v: string) => {
          const disc = v ? DISCIPLINE_META[v] : null;
          if (!disc) return <span style={{ color: c.textFaint }}>—</span>;
          return (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "1px 8px",
                background: tones[disc.tone].bg,
                border: `1px solid ${tones[disc.tone].border}`,
                color: tones[disc.tone].text,
                borderRadius: 999,
                fontSize: 10,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.03em",
              }}
            >
              {disc.label}
            </span>
          );
        },
      },
      {
        title: "Contact Info",
        key: "contact",
        render: (_: any, m: TeamMember) => {
          return (
            <div style={{ fontSize: 12, display: "flex", flexDirection: "column", gap: 2 }}>
              {m.contactEmail && (
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Mail size={11} style={{ color: c.textFaint }} />
                  <span style={{ color: c.textMuted }}>{m.contactEmail}</span>
                </div>
              )}
              {m.contactPhone && (
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Phone size={11} style={{ color: c.textFaint }} />
                  <span style={{ color: c.textMuted }}>{m.contactPhone}</span>
                </div>
              )}
              {!m.contactEmail && !m.contactPhone && <span style={{ color: c.textFaint }}>—</span>}
            </div>
          );
        },
      },
      {
        title: "Project",
        dataIndex: "projectName",
        key: "projectName",
        render: (v: string | null) => {
          if (!v) return <span style={{ color: c.textFaint }}>—</span>;
          return (
            <span style={{ fontSize: 12, color: c.textMuted, display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Briefcase size={11} style={{ color: c.textFaint }} />
              {v}
            </span>
          );
        },
      },
      {
        title: "Availability",
        dataIndex: "availabilityStatus",
        key: "availability",
        render: (v: string, m: TeamMember) => {
          const avail = AVAILABILITY_META[v] || AVAILABILITY_META.available;
          return (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: tones[avail.tone].text, fontWeight: 600 }}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 999,
                    background: avail.dot,
                  }}
                />
                {avail.label}
              </span>
              {m.availabilityNote && (
                <span style={{ fontSize: 11, color: c.textFaint }}>
                  {m.availabilityNote}
                </span>
              )}
            </div>
          );
        },
      },
      {
        title: "Portal Visibility",
        dataIndex: "isVisible",
        key: "visibility",
        render: (v: boolean, m: TeamMember) => {
          return (
            <Tooltip title={v ? "Visible to client" : "Hidden from client portal"}>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  toggleVisible(m);
                }}
                style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 500, color: v ? c.successText : c.dangerText }}
              >
                {v ? <Eye size={13} /> : <EyeOff size={13} />}
                {v ? "Visible" : "Hidden"}
              </span>
            </Tooltip>
          );
        },
      },
      {
        title: "",
        key: "actions",
        width: 50,
        render: (_: any, m: TeamMember) => {
          return (
            <Dropdown
              menu={teamMemberActionMenu(m)}
              overlayClassName="pp-action-pop"
              trigger={["click"]}
              placement="bottomRight"
            >
              <button
                type="button"
                className="pc-actions"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal size={14} />
              </button>
            </Dropdown>
          );
        },
      },
    ];
  }, [c, tones, items]);

  return (
    <div style={{ padding: "4px 0 24px", color: c.text }}>
      {contextHolder}

      {/* Header */}
      <div className="cd-tab-sticky-head">
      <div className="team-header-wrap" style={{ margin: "0 -32px" }}>
          <TimeTrackingHeader
            icon={<Users size={20} color="#3b82f6" />}
            title="Team &amp; contacts"
            description="Devs, designers, QA and account managers who build your products."
            onRefresh={handleRefresh}
            refreshing={refreshing}
            extra={
              <Button
                type="primary"
                icon={<Plus size={15} />}
                onClick={() => {
                  setEditing(null);
                  setModalOpen(true);
                }}
                style={{
                  background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                  borderColor: "transparent",
                  borderRadius: "8px",
                  height: "32px",
                  fontWeight: 600,
                  boxShadow: "0 4px 12px rgba(59, 130, 246, 0.15)",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                Add team member
              </Button>
            }
            style={{ background: "transparent", borderBottom: "1px solid var(--border-slate-100)", padding: "4px 32px", marginBottom: "8px" }}
          />
        </div>
  
        {/* Toolbar */}
        {items.length > 0 && (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                margin: "12px 0 8px 0",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <Input
                  allowClear
                  className="contacts-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, role…"
                  prefix={<Search size={14} style={{ color: c.textFaint }} />}
                  style={{
                    width: 240,
                  }}
                />
  
                {projects.length > 0 && (
                  <SearchableDropdown
                    placeholder="All projects"
                    searchPlaceholder="Search projects"
                    itemNoun="projects"
                    value={projectFilter ?? undefined}
                    onChange={(v) => setProjectFilter(v ?? null)}
                    options={projects.map((p) => ({ value: p.id, label: p.name }))}
                    width={180}
                    className="contacts-filter-select-sd"
                  />
                )}
              </div>
  
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
            <div className="ptab-divider" />
          </>
        )}
      </div>

      <div style={{ marginTop: 20 }}>
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
      ) : items.length === 0 ? (
        <EmptyState
          c={c}
          onAdd={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        />
      ) : viewMode === "list" ? (
        <div className="pp-table-wrap">
          <Table
            className="pp-table"
            dataSource={filteredItems}
            columns={columns}
            rowKey="id"
            pagination={{ pageSizeOptions: [10, 20, 25, 50, 100], pageSize: 20, hideOnSinglePage: true }}
            scroll={{ x: "max-content" }}
          />
        </div>
      ) : (
        <div className="pp-grid">
          {filteredItems.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", border: `1px dashed ${c.border}`, borderRadius: 12, color: c.textSubtle, gridColumn: "1/-1" }}>
              No team members match your filters.
            </div>
          ) : (
            filteredItems.map((m) => (
              <TeamCard
                key={m.id}
                member={m}
                c={c}
                tones={tones}
                onEdit={() => {
                  setEditing(m);
                  setModalOpen(true);
                }}
                onToggleVisible={() => toggleVisible(m)}
                onTogglePrimary={() => togglePrimary(m)}
                onRemove={() => remove(m)}
              />
            ))
          )}
        </div>
      )}
      </div>

      <TeamMemberModal
        open={modalOpen}
        editing={editing}
        clientId={clientId}
        projects={projects}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSaved={() => {
          setModalOpen(false);
          setEditing(null);
          load();
        }}
        c={c}
        messageApi={messageApi}
      />

      {/* Premium adaptive header styling */}
      <style dangerouslySetInnerHTML={{
        __html: `
        /* Full bleed header styling flush with vertical sidebar border */
        .team-header-wrap {
          margin-bottom: 24px !important;
          display: block !important;
        }
        .team-header-wrap .saas-header-container {
          margin-left: -32px !important;
          margin-right: -32px !important;
          padding-left: 32px !important;
          padding-right: 32px !important;
          padding-top: 4px !important;
          padding-bottom: 4px !important;
          margin-bottom: 0 !important;
        }
        @media (max-width: 900px) {
          .team-header-wrap .saas-header-container {
            margin-left: -20px !important;
            margin-right: -20px !important;
            padding-left: 20px !important;
            padding-right: 20px !important;
          }
        }
        @media (max-width: 720px) {
          .team-header-wrap .saas-header-container {
            margin-left: -16px !important;
            margin-right: -16px !important;
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
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
          border-color: var(--border-slate-800);
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

        /* Proposal Style Cards Grid */
        .pp-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .ptab-empty-wrapper { grid-column: 1 / -1; }
        @media (max-width: 700px) { .pp-grid { grid-template-columns: 1fr; } }

        .pc-card {
          border: 1px solid var(--border-slate-200); border-radius: 0; background: var(--bg-pure-white);
          cursor: pointer; overflow: hidden; display: flex; flex-direction: column;
          transition: box-shadow .15s ease, border-color .15s ease;
        }
        .pc-card:hover { box-shadow: 0 3px 12px rgba(15,23,42,0.06); border-color: #cbd5e1; }

        .pc-top { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; flex: 1; }
        .pc-avatar {
          width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
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

        /* Dark Theme Support */
        [data-theme="dark"] .pp-table-wrap {
          border-color: var(--border-slate-800);
          background: var(--bg-secondary);
        }
        [data-theme="dark"] .pp-table .ant-table-thead > tr > th {
          background: var(--bg-slate-800) !important;
          border-color: var(--border-slate-700) !important;
        }
        [data-theme="dark"] .pp-table .ant-table-tbody > tr > td {
          border-color: var(--border-slate-800) !important;
        }
        [data-theme="dark"] .pp-table .ant-table-tbody > tr:hover > td {
          background: var(--bg-slate-800) !important;
        }
        [data-theme="dark"] .pc-card {
          border-color: var(--border-slate-800);
          background: var(--bg-secondary);
        }
        [data-theme="dark"] .pc-card:hover {
          border-color: var(--border-slate-700);
          box-shadow: 0 4px 20px rgba(0,0,0,0.25);
        }
        [data-theme="dark"] .pc-foot {
          border-color: var(--border-slate-800);
          background: var(--bg-slate-800);
        }
        [data-theme="dark"] .pc-foot-row + .pc-foot-row {
          border-color: var(--border-slate-700);
        }
        [data-theme="dark"] .pc-foot-item {
          color: var(--text-slate-300);
        }
        [data-theme="dark"] .pc-foot-div {
          background: var(--border-slate-700);
        }
        [data-theme="dark"] .pc-title {
          color: var(--text-slate-100);
        }
        [data-theme="dark"] .pc-client-val {
          color: var(--text-slate-300);
        }
        [data-theme="dark"] .pc-actions:hover {
          background: var(--bg-slate-700);
          color: var(--text-slate-100);
        }
        [data-theme="dark"] .pp-action-pop .ant-dropdown-menu {
          background: var(--bg-secondary) !important;
          border-color: var(--border-slate-800) !important;
        }
        [data-theme="dark"] .pp-action-pop .ant-dropdown-menu-item:hover {
          background: var(--bg-slate-800) !important;
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
        <Users size={22} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: c.text }}>
        No team members visible to this client yet
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
        Add the account manager and key people so the client knows who to
        contact for what.
      </div>
      <div style={{ marginTop: 18 }}>
        <Button type="primary" icon={<Plus size={15} />} onClick={onAdd}>
          Add first team member
        </Button>
      </div>
    </div>
  );
}

function TeamCard({
  member,
  c,
  tones,
  onEdit,
  onToggleVisible,
  onTogglePrimary,
  onRemove,
}: {
  member: TeamMember;
  c: ReturnType<typeof palette>;
  tones: ReturnType<typeof tonesOf>;
  onEdit: () => void;
  onToggleVisible: () => void;
  onTogglePrimary: () => void;
  onRemove: () => void;
}) {
  const disc = member.discipline ? DISCIPLINE_META[member.discipline] : null;
  const avail = AVAILABILITY_META[member.availabilityStatus] || AVAILABILITY_META.available;

  const teamMemberActionMenu = {
    items: [
      {
        key: "toggle-visibility",
        label: (
          <div className="pp-menu-item">
            <span className="pp-menu-ic" style={{ color: "#3b82f6", background: "rgba(59, 130, 246, 0.12)" }}>
              {member.isVisible ? <EyeOff size={13} /> : <Eye size={13} />}
            </span>
            <span className="pp-menu-text">
              <span className="pp-menu-title">{member.isVisible ? "Hide from portal" : "Make visible"}</span>
              <span className="pp-menu-desc">{member.isVisible ? "Hide from client portal" : "Show to client portal"}</span>
            </span>
          </div>
        ),
        onClick: onToggleVisible,
      },
      {
        key: "toggle-primary",
        label: (
          <div className="pp-menu-item">
            <span className="pp-menu-ic" style={{ color: "#eab308", background: "rgba(234, 179, 8, 0.12)" }}>
              <Star size={13} fill={member.isPrimaryContact ? "#eab308" : "none"} color="#eab308" />
            </span>
            <span className="pp-menu-text">
              <span className="pp-menu-title">{member.isPrimaryContact ? "Remove primary" : "Set as primary"}</span>
              <span className="pp-menu-desc">{member.isPrimaryContact ? "Remove primary contact role" : "Mark as primary contact"}</span>
            </span>
          </div>
        ),
        onClick: onTogglePrimary,
      },
      {
        key: "edit",
        label: (
          <div className="pp-menu-item">
            <span className="pp-menu-ic" style={{ color: "#8b5cf6", background: "rgba(139, 92, 246, 0.12)" }}>
              <Edit3 size={13} />
            </span>
            <span className="pp-menu-text">
              <span className="pp-menu-title">Edit details</span>
              <span className="pp-menu-desc">Modify team member info</span>
            </span>
          </div>
        ),
        onClick: onEdit,
      },
      {
        key: "remove",
        danger: true,
        label: (
          <div className="pp-menu-item">
            <span className="pp-menu-ic" style={{ color: "#ef4444", background: "rgba(239, 68, 68, 0.12)" }}>
              <Trash2 size={13} />
            </span>
            <span className="pp-menu-text">
              <span className="pp-menu-title" style={{ color: "#ef4444" }}>Remove member</span>
              <span className="pp-menu-desc">Remove from client portal</span>
            </span>
          </div>
        ),
        onClick: () => {
          Modal.confirm({
            title: "Remove team member?",
            content: "They will disappear from the client portal immediately.",
            okText: "Remove",
            okType: "danger",
            cancelText: "Cancel",
            centered: true,
            onOk: onRemove,
          });
        },
      },
    ],
  };

  return (
    <div
      className="pc-card"
      style={{
        opacity: member.isVisible ? 1 : 0.65,
      }}
    >
      <div className="pc-top">
        <Avatar member={member} c={c} />
        <div className="pc-identity-body">
          <div
            className="pc-title"
            style={{
              display: "flex",
              gap: 6,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <span>{member.displayName}</span>
            {member.isPrimaryContact && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  padding: "1px 6px",
                  background: "rgba(250, 204, 21, 0.08)",
                  border: `1px solid rgba(250, 204, 21, 0.3)`,
                  color: "#eab308",
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 600,
                }}
              >
                <Crown size={9} strokeWidth={2.5} />
                Primary
              </span>
            )}
            {disc && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "1px 8px",
                  background: tones[disc.tone].bg,
                  border: `1px solid ${tones[disc.tone].border}`,
                  color: tones[disc.tone].text,
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                }}
              >
                {disc.label}
              </span>
            )}
          </div>
          <div className="pc-client-line">
            <span className="pc-client-val" style={{ color: c.textMuted }}>{member.roleLabel}</span>
          </div>
        </div>
        <Dropdown
          menu={teamMemberActionMenu}
          overlayClassName="pp-action-pop"
          trigger={["click"]}
          placement="bottomRight"
        >
          <button
            type="button"
            className="pc-actions"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <MoreHorizontal size={14} />
          </button>
        </Dropdown>
      </div>

      <div className="pc-foot">
        {/* Row 1 — Created & Updated */}
        <div className="pc-foot-row">
          <span className="pc-foot-item">
            <span className="pc-foot-key">Created</span>
            <span className="pc-foot-val">
              {member.createdAt ? dayjs(member.createdAt).format("MMM D, YYYY · h:mm A") : "—"}
            </span>
          </span>
          <span className="pc-foot-div" />
          <span className="pc-foot-item">
            <span className="pc-foot-key">Updated</span>
            <span className="pc-foot-val">
              {member.updatedAt ? dayjs(member.updatedAt).format("MMM D, YYYY · h:mm A") : "—"}
            </span>
          </span>
        </div>

        {/* Row 3 — Mail, Phone, Availability */}
        <div className="pc-foot-row">
          {member.contactEmail && (
            <span className="pc-foot-item" style={{ minWidth: 0 }}>
              <Mail size={12} style={{ color: "var(--text-slate-400)", flexShrink: 0 }} />
              <span style={{ fontSize: "11.5px", color: "var(--text-slate-700)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {member.contactEmail}
              </span>
            </span>
          )}
          {member.contactPhone && (
            <>
              {member.contactEmail && <span className="pc-foot-div" />}
              <span className="pc-foot-item" style={{ flexShrink: 0 }}>
                <Phone size={12} style={{ color: "var(--text-slate-400)", flexShrink: 0 }} />
                <span style={{ fontSize: "11.5px", color: "var(--text-slate-700)" }}>
                  {member.contactPhone}
                </span>
              </span>
            </>
          )}
          {(member.contactEmail || member.contactPhone) && <span className="pc-foot-div" />}
          <span className="pc-foot-item">
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: avail.dot,
                display: "inline-block",
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: "11.5px", color: tones[avail.tone].text, fontWeight: 600 }}>
              {avail.label}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

function Avatar({
  member,
  c,
  size = 44,
}: {
  member: { displayName: string; avatarUrl: string | null };
  c: ReturnType<typeof palette>;
  size?: number;
}) {
  if (member.avatarUrl) {
    return (
      <img
        src={member.avatarUrl}
        alt=""
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          border: `1px solid ${c.border}`,
          flexShrink: 0,
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#3b82f6",
        border: "none",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: Math.round(size * 0.32),
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {initials(member.displayName)}
    </div>
  );
}

/* --------------------------------------------------------------- */

function TeamMemberModal({
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
  editing: TeamMember | null;
  clientId: string;
  projects: { id: string; name: string; code?: string | null }[];
  onClose: () => void;
  onSaved: () => void;
  c: ReturnType<typeof palette>;
  messageApi: any;
}) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [staffSearch, setStaffSearch] = useState("");

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setStaffSearch("");
      return;
    }
    if (editing) {
      form.setFieldsValue({
        staffUserId: editing.staffUserId || undefined,
        displayName: editing.displayName,
        roleLabel: editing.roleLabel,
        discipline: editing.discipline || undefined,
        contactEmail: editing.contactEmailOverride || undefined,
        contactPhone: editing.contactPhone || undefined,
        isPrimaryContact: editing.isPrimaryContact,
        bio: editing.bio || undefined,
        availabilityStatus: editing.availabilityStatus,
        availabilityNote: editing.availabilityNote || undefined,
        isVisible: editing.isVisible,
        projectId: editing.projectId || undefined,
      });
    } else {
      form.setFieldsValue({
        availabilityStatus: "available",
        isPrimaryContact: false,
        isVisible: true,
      });
    }
    // Load staff list
    teamService
      .staffOptions(clientId, "")
      .then((list) => setStaffOptions(list || []))
      .catch(() => setStaffOptions([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  // Search debounce
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      teamService
        .staffOptions(clientId, staffSearch)
        .then((list) => setStaffOptions(list || []))
        .catch(() => undefined);
    }, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffSearch]);

  const handleStaffPick = (id: string | undefined) => {
    if (!id) return;
    const picked = staffOptions.find((s) => s.id === id);
    if (!picked) return;
    const cur = form.getFieldsValue();
    const next: any = {};
    if (!cur.displayName) next.displayName = picked.name;
    if (!cur.contactEmail) next.contactEmail = picked.work_email || undefined;
    if (picked.title) next.roleLabel = picked.title;
    if (Object.keys(next).length) form.setFieldsValue(next);
  };

  const submit = async (v: any) => {
    setSubmitting(true);
    try {
      const payload: CreateTeamMemberPayload = {
        staffUserId: v.staffUserId || undefined,
        displayName: v.displayName?.trim() || undefined,
        roleLabel: v.roleLabel.trim(),
        discipline: v.discipline || undefined,
        contactEmail: v.contactEmail || undefined,
        contactPhone: v.contactPhone || undefined,
        isPrimaryContact: v.isPrimaryContact === true,
        bio: v.bio || undefined,
        availabilityStatus: v.availabilityStatus || "available",
        availabilityNote: v.availabilityNote || undefined,
        isVisible: v.isVisible !== false,
        projectId: v.projectId || undefined,
      };
      if (editing) {
        await teamService.update(editing.id, payload);
        messageApi.success("Saved");
      } else {
        await teamService.create(clientId, payload);
        messageApi.success("Team member added");
      }
      onSaved();
    } catch (err: any) {
      messageApi.error(`Save failed: ${err?.message || ""}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{drawerFormStyles}</style>
      <Drawer
        {...commonDrawerProps}
        open={open}
        onClose={onClose}
      >
        <div className="flex flex-col h-full bg-[var(--customers-page-bg,#0B0F1A)]">
          <div className="customer-drawer-header shrink-0 flex items-center justify-between px-6 py-4 border-b border-dashed border-[var(--border-color)]">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
                style={{ background: c.accentBg, border: `1px solid ${c.accentBorder}`, color: c.accentText }}
              >
                <UserIcon size={16} />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-[var(--text-primary)] leading-tight m-0">{editing ? "Edit team member" : "Add team member"}</h2>
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
                  Pick a staff member to auto-fill basics, or add an external/free-text entry without linking.
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
            <div className="mb-6 p-3 rounded-lg flex gap-3" style={{ background: c.warningBg, border: `1px solid ${c.warningBorder}` }}>
              <Crown size={16} className="shrink-0 mt-0.5" style={{ color: c.warningText }} />
              <div className="text-[12.5px] font-medium" style={{ color: c.warningText }}>
                Marking someone as <strong>Primary contact</strong> pins them to the
                top of the portal team page with a highlighted badge.
              </div>
            </div>
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
          title="Who"
          subtitle="Auto-fill name + email from a staff user, or type them in manually."
          icon={<UserIcon size={14} />}
          step="STEP 1"
        >
          <Form.Item
            name="staffUserId"
            label="Link to staff member"
            style={{ marginBottom: 12 }}
          >
            <SearchableDropdown
              searchPlaceholder="Search staff by name or email…"
              placeholder="Search staff by name or email…"
              onChange={handleStaffPick}
              options={staffOptions.map((s) => ({
                value: s.id,
                label: s.name,
                description: s.work_email || undefined,
                avatarUrl: s.avatar_url || undefined,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="displayName"
            label="Display name"
            rules={[{ required: true, message: "Required" }]}
            style={{ marginBottom: 12 }}
          >
            <Input
              prefix={<UserIcon size={13} color={c.textFaint} />}
              placeholder="Name shown to client"
              maxLength={200}
            />
          </Form.Item>
          <Form.Item
            name="discipline"
            label="Discipline"
            style={{ marginBottom: 12 }}
          >
            <SearchableDropdown
              placeholder="—"
              options={(Object.keys(DISCIPLINE_META) as TeamDiscipline[]).map(
                (d) => ({ value: d, label: DISCIPLINE_META[d].label }),
              )}
            />
          </Form.Item>

          <Form.Item
            name="roleLabel"
            label="Role / title"
            rules={[{ required: true, message: "Required" }]}
            style={{ marginBottom: 0 }}
          >
            <Input
              placeholder="e.g. Senior Engineer · Frontend"
              maxLength={160}
            />
          </Form.Item>
        </SectionCard>

        <SectionCard
          title="Contact & context"
          subtitle="How the client can reach them, and what they're working on."
          icon={<Mail size={14} />}
          step="STEP 2"
        >
          <Form.Item
            name="contactEmail"
            label="Email"
            rules={[
              { type: "email", message: "Please enter a valid email address" },
            ]}
            style={{ marginBottom: 12 }}
          >
            <Input
              prefix={<Mail size={13} color={c.textFaint} />}
              placeholder="custom@email.com"
            />
          </Form.Item>
          <Form.Item
            name="contactPhone"
            label="Phone"
            style={{ marginBottom: 12 }}
          >
            <Input
              prefix={<Phone size={13} color={c.textFaint} />}
              placeholder="+1 555 …"
            />
          </Form.Item>

          <Form.Item
            name="projectId"
            label="Linked project"
            style={{ marginBottom: 12 }}
          >
            <SearchableDropdown
              placeholder={
                projects.length
                  ? "Pick a project this member works on"
                  : "No projects linked to this client yet"
              }
              searchPlaceholder="Search projects..."
              disabled={projects.length === 0}
              options={projects.map((p) => ({
                value: p.id,
                label: p.name,
                description: p.code ? `Project Code: ${p.code}` : undefined,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="bio"
            label="Short bio"
            style={{ marginBottom: 16 }}
          >
            <Input.TextArea
              rows={3}
              placeholder="What they specialise in, years at the company, etc."
              maxLength={500}
              showCount
              style={{ padding: "10px 12px" }}
            />
          </Form.Item>
        </SectionCard>

        <SectionCard
          title="Availability & visibility"
          subtitle="The portal page shows availability dots — set yours here."
          icon={<Eye size={14} />}
          step="STEP 3"
        >
          <Form.Item
            name="availabilityStatus"
            label="Status"
            style={{ marginBottom: 12 }}
          >
            <SearchableDropdown
              options={(
                Object.keys(AVAILABILITY_META) as TeamAvailability[]
              ).map((a) => ({
                value: a,
                label: AVAILABILITY_META[a].label,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="availabilityNote"
            label="Note"
            style={{ marginBottom: 12 }}
          >
            <Input placeholder="e.g. Out until 15 Mar · OOO Fridays" />
          </Form.Item>

          <div
            style={{
              display: "flex",
              gap: 24,
              padding: "10px 12px",
              background: c.surfaceElevated,
              border: `1px solid ${c.border}`,
              borderRadius: 8,
              marginLeft: "29.16666667%", // to align with wrapperCol
            }}
          >
            <Form.Item
              name="isPrimaryContact"
              valuePropName="checked"
              style={{ marginBottom: 0 }}
              label={null}
            >
              <Switch />
            </Form.Item>
            <span
              style={{
                fontSize: 12.5,
                color: c.textMuted,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                marginTop: 6
              }}
            >
              <Crown size={11} color={c.warningText} />
              Primary contact
            </span>
            <Form.Item
              name="isVisible"
              valuePropName="checked"
              style={{ marginBottom: 0 }}
              label={null}
            >
              <Switch />
            </Form.Item>
            <span
              style={{
                fontSize: 12.5,
                color: c.textMuted,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                marginTop: 6
              }}
            >
              <Eye size={11} color={c.successText} />
              Visible to client
            </span>
          </div>
        </SectionCard>
      </Form>
    </div>
    
    <div className="customer-drawer-footer shrink-0 px-6 py-4 border-t border-[var(--border-color)] flex items-center justify-end gap-3 bg-[var(--customers-page-bg,#0B0F1A)]">
      <Button onClick={onClose} className="border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] bg-transparent">
        Cancel
      </Button>
      <Button
        type="primary"
        htmlType="submit"
        loading={submitting}
        onClick={() => form.submit()}
        icon={<UserIcon size={14} />}
        className="font-medium shadow-sm hover:opacity-90"
      >
        {editing ? "Save changes" : "Add team member"}
      </Button>
    </div>
  </div>
</Drawer>
</>
  );
}

function L({
  c,
  children,
  hint,
}: {
  c: ReturnType<typeof palette>;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <span style={{ fontSize: 12.5, color: c.textMuted, fontWeight: 500 }}>
      {children}
      {hint && (
        <span
          style={{
            marginLeft: 6,
            fontSize: 11.5,
            color: c.textFaint,
            fontWeight: 400,
          }}
        >
          · {hint}
        </span>
      )}
    </span>
  );
}

function StaffOptionRow({
  option,
  c,
}: {
  option: StaffOption;
  c: ReturnType<typeof palette>;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "2px 0",
        minWidth: 0,
      }}
    >
      {option.avatar_url ? (
        <img
          src={option.avatar_url}
          alt=""
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            objectFit: "cover",
            border: `1px solid ${c.border}`,
            flexShrink: 0,
          }}
        />
      ) : (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: c.accentBg,
            color: c.accentText,
            border: `1px solid ${c.accentBorder}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {initials(option.name)}
        </div>
      )}
      <div style={{ minWidth: 0, flex: 1, lineHeight: 1.25 }}>
        <div
          style={{
            fontSize: 13,
            color: c.text,
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {option.name}
          {option.title && (
            <span
              style={{
                marginLeft: 8,
                fontSize: 11,
                color: c.textSubtle,
                fontWeight: 400,
              }}
            >
              · {option.title}
            </span>
          )}
        </div>
        {option.work_email && (
          <div
            style={{
              fontSize: 11.5,
              color: c.textFaint,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {option.work_email}
          </div>
        )}
      </div>
    </div>
  );
}
