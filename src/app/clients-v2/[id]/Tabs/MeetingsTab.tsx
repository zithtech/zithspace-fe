"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Modal,
  Drawer,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  message,
  Tooltip,
  Popconfirm,
  Empty,
  Table,
  Tag,
} from "antd";
import {
  Plus,
  Calendar,
  Video,
  Users,
  CheckSquare,
  ChevronRight,
  GitPullRequest,
  X,
  Edit3,
  Trash2,
  Clock,
  ExternalLink,
  ListChecks,
  Lightbulb,
  ArrowRight,
  Paperclip,
  Link2,
  Upload as UploadIcon,
  FileText,
  Search,
  LayoutList,
  LayoutGrid,
  Eye,
  Download,
  Image as ImageIcon,
  FileType2,
} from "lucide-react";
import dayjs from "dayjs";
import {
  momService,
  MomListItem,
  MomListAttachment,
  MomDetail,
  MomAttendee,
  MomDecision,
  MomActionItem,
  MomAttachmentInput,
} from "@/services/momService";
import { teamService, StaffOption } from "@/services/teamService";
import { useTheme } from "@/context/ThemeContext";
import { useSocket } from "@/providers/SocketProvider";
import {
  PremiumModal,
  ModalSection,
  ModalFooterActions,
  FieldLabel as FLabel,
} from "./_PremiumModal";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";

type Mode = "light" | "dark";

const palette = (mode: Mode) => {
  const dark = mode === "dark";
  return {
    surface: dark ? "#0B0F1A" : "#ffffff",
    surfaceElevated: dark ? "#131B2D" : "#ffffff",
    surfaceMuted: dark ? "#0F1626" : "#f8fafc",
    border: dark ? "#1E293B" : "#e5e7eb",
    borderStrong: dark ? "#273449" : "#d1d5db",
    text: dark ? "#F1F5F9" : "#0f172a",
    textMuted: dark ? "#CBD5E1" : "#475569",
    textSubtle: dark ? "#94A3B8" : "#64748b",
    textFaint: dark ? "#64748B" : "#94a3b8",
    accent: "#3b82f6",
    accentBg: dark ? "rgba(59,130,246,0.12)" : "#eff6ff",
    accentBorder: dark ? "rgba(59,130,246,0.35)" : "#bfdbfe",
    accentText: dark ? "#93c5fd" : "#1d4ed8",
    success: dark ? "#34d399" : "#059669",
    successBg: dark ? "rgba(16,185,129,0.12)" : "#ecfdf5",
    successBorder: dark ? "rgba(16,185,129,0.35)" : "#a7f3d0",
    successText: dark ? "#6ee7b7" : "#047857",
    warning: dark ? "#fbbf24" : "#d97706",
    warningBg: dark ? "rgba(245,158,11,0.12)" : "#fffbeb",
    warningBorder: dark ? "rgba(245,158,11,0.35)" : "#fde68a",
    warningText: dark ? "#fcd34d" : "#92400e",
    danger: dark ? "#f87171" : "#dc2626",
    dangerBg: dark ? "rgba(239,68,68,0.12)" : "#fef2f2",
    dangerBorder: dark ? "rgba(239,68,68,0.35)" : "#fecaca",
    dangerText: dark ? "#fca5a5" : "#b91c1c",
    purpleBg: dark ? "rgba(139,92,246,0.12)" : "#f5f3ff",
    purpleBorder: dark ? "rgba(139,92,246,0.35)" : "#ddd6fe",
    purpleText: dark ? "#c4b5fd" : "#6d28d9",
    overlay: dark ? "rgba(0,0,0,0.7)" : "rgba(15,23,42,0.45)",
  };
};

const ACTION_STATUS_LABEL: Record<string, string> = {
  open: "Open",
  in_progress: "In progress",
  done: "Done",
  cancelled: "Cancelled",
  converted: "Converted",
};

function tone(
  c: ReturnType<typeof palette>,
  status: string,
): { bg: string; border: string; text: string } {
  if (status === "done")
    return { bg: c.successBg, border: c.successBorder, text: c.successText };
  if (status === "in_progress")
    return { bg: c.accentBg, border: c.accentBorder, text: c.accentText };
  if (status === "converted")
    return { bg: c.purpleBg, border: c.purpleBorder, text: c.purpleText };
  if (status === "cancelled")
    return {
      bg: c.surfaceMuted,
      border: c.border,
      text: c.textSubtle,
    };
  return { bg: c.warningBg, border: c.warningBorder, text: c.warningText };
}

function fmtDate(iso: string | null | undefined) {
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
function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(iso);
  }
}

/* --------------------------------------------------------------- */

/**
 * Shape used by both MeetingsTab and the embedded modals. Mirrors what the
 * parent client-detail page already loads into `client.contacts` — we only
 * need a subset for the attendee picker.
 */
export interface ClientContactOption {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  officialEmail?: string | null;
  designation?: string | null;
}

interface Props {
  clientId: string;
  projects?: { id: string; name: string; code?: string | null }[];
  contacts?: ClientContactOption[];
  onRefresh?: () => void;
}

export default function MeetingsTab({
  clientId,
  projects = [],
  contacts = [],
}: Props) {
  const { theme } = useTheme();
  const c = useMemo(() => palette(theme as Mode), [theme]);

  const [items, setItems] = useState<MomListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  // Toolbar state
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "card">("list");

  const load = async () => {
    setLoading(true);
    try {
      const data = await momService.listForClient(clientId);
      setItems(data || []);
    } catch (err: any) {
      messageApi.error(`Failed to load meetings: ${err?.message}`);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  // Real-time: when any MOM for this client changes (locally or elsewhere),
  // reload the list so staff in another tab / window stays in sync.
  const { socket, connected } = useSocket();
  useEffect(() => {
    if (!socket || !connected) return;
    const handler = (payload: { clientId?: string } | undefined) => {
      if (payload?.clientId && payload.clientId !== clientId) return;
      load();
    };
    socket.on("mom:created", handler);
    socket.on("mom:updated", handler);
    socket.on("mom:deleted", handler);
    return () => {
      socket.off("mom:created", handler);
      socket.off("mom:updated", handler);
      socket.off("mom:deleted", handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, connected, clientId]);

  const handleDeleteRow = async (id: string) => {
    try {
      await momService.remove(id);
      messageApi.success("Meeting deleted");
      load();
    } catch (err: any) {
      messageApi.error(`Delete failed: ${err?.message}`);
    }
  };

  return (
    <div style={{ padding: "4px 0 24px", color: c.text }}>
      {contextHolder}

      {/* Header */}
      <div className="meetings-header-wrap" style={{ margin: "0 -32px" }}>
        <TimeTrackingHeader
          icon={<Calendar size={20} color="#3b82f6" />}
          title="Meeting minutes"
          description="Capture decisions and action items from meetings with the client."
          extra={
            <Button
              type="primary"
              icon={<Plus size={15} />}
              onClick={() => setCreateOpen(true)}
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
              New meeting
            </Button>
          }
          style={{ background: "transparent", borderBottom: "1px solid var(--border-slate-100)" }}
        />
      </div>

      {/* ── Toolbar ── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
          marginTop: 20,
          marginBottom: 20,
          padding: "12px 16px",
          background: c.surfaceElevated,
          border: `1px solid ${c.border}`,
          borderRadius: 12,
        }}
      >
        {/* Search */}
        <Input
          allowClear
          prefix={<Search size={14} style={{ color: c.textFaint }} />}
          placeholder="Search meetings…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: 220,
            background: c.surfaceMuted,
            borderColor: c.border,
            color: c.text,
            borderRadius: 8,
          }}
        />

        {/* Date range */}
        <DatePicker.RangePicker
          allowClear
          placeholder={["From date", "To date"]}
          onChange={(val) => setDateRange(val as any)}
          style={{
            background: c.surfaceMuted,
            borderColor: c.border,
            borderRadius: 8,
            color: c.text,
          }}
        />

        {/* Project filter */}
        {projects.length > 0 && (
          <Select
            allowClear
            placeholder="All projects"
            value={projectFilter}
            onChange={(v) => setProjectFilter(v ?? null)}
            options={projects.map((p) => ({ label: p.name, value: p.id }))}
            style={{ minWidth: 160, borderRadius: 8 }}
          />
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* View toggle */}
        <div
          style={{
            display: "flex",
            gap: 2,
            background: c.surfaceMuted,
            border: `1px solid ${c.border}`,
            borderRadius: 8,
            padding: 3,
          }}
        >
          <Tooltip title="List view">
            <button
              onClick={() => setViewMode("list")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 30,
                height: 30,
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                background: viewMode === "list" ? c.accent : "transparent",
                color: viewMode === "list" ? "#fff" : c.textSubtle,
                transition: "background 150ms ease",
              }}
            >
              <LayoutList size={15} />
            </button>
          </Tooltip>
          <Tooltip title="Card view">
            <button
              onClick={() => setViewMode("card")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 30,
                height: 30,
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                background: viewMode === "card" ? c.accent : "transparent",
                color: viewMode === "card" ? "#fff" : c.textSubtle,
                transition: "background 150ms ease",
              }}
            >
              <LayoutGrid size={15} />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* ── Content ── */}
      {(() => {
        // Filter items
        const filtered = items.filter((m) => {
          if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase();
            if (
              !m.title?.toLowerCase().includes(q) &&
              !m.momNumber?.toLowerCase().includes(q) &&
              !m.projectName?.toLowerCase().includes(q)
            ) return false;
          }
          if (projectFilter && m.projectId !== projectFilter) return false;
          if (dateRange && dateRange[0] && dateRange[1]) {
            const d = dayjs(m.meetingDate);
            if (d.isBefore(dateRange[0], "day") || d.isAfter(dateRange[1], "day")) return false;
          }
          return true;
        });

        if (loading) return (
          <div style={{ padding: 48, textAlign: "center", border: `1px solid ${c.border}`, borderRadius: 12, background: c.surfaceElevated, color: c.textSubtle }}>
            Loading…
          </div>
        );

        if (items.length === 0) return (
          <div style={{ padding: 56, textAlign: "center", background: c.surfaceElevated, border: `1px dashed ${c.border}`, borderRadius: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: c.accentBg, color: c.accentText, border: `1px solid ${c.accentBorder}`, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <Calendar size={22} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: c.text }}>No meetings logged yet</div>
            <div style={{ marginTop: 6, fontSize: 13, color: c.textSubtle, maxWidth: 420, margin: "6px auto 0" }}>
              Log your first MOM to start tracking action items and decisions with this client.
            </div>
            <div style={{ marginTop: 18 }}>
              <Button type="primary" icon={<Plus size={15} />} onClick={() => setCreateOpen(true)}>Log first meeting</Button>
            </div>
          </div>
        );

        if (filtered.length === 0) return (
          <div style={{ padding: 40, textAlign: "center", border: `1px dashed ${c.border}`, borderRadius: 12, color: c.textSubtle }}>
            No meetings match your filters.
          </div>
        );

        // ── CARD VIEW ──
        if (viewMode === "card") return (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
            {filtered.map((m) => (
              <div
                key={m.id}
                onClick={() => setOpenId(m.id)}
                style={{
                  background: c.surfaceElevated,
                  border: `1px solid ${c.border}`,
                  borderRadius: 14,
                  cursor: "pointer",
                  transition: "border-color 140ms ease, box-shadow 140ms ease, transform 140ms ease",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = c.accentBorder;
                  el.style.boxShadow = `0 8px 28px rgba(59,130,246,0.10), 0 2px 8px rgba(0,0,0,0.06)`;
                  el.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = c.border;
                  el.style.boxShadow = "none";
                  el.style.transform = "translateY(0)";
                }}
              >
                {/* Top accent bar */}
                <div style={{ height: 3, background: `linear-gradient(90deg, ${c.accent}, ${c.accent}66)`, flexShrink: 0 }} />

                {/* Card body */}
                <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>

                  {/* Header row: icon + title + badges */}
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    {/* Icon tile */}
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      background: c.accentBg, border: `1px solid ${c.accentBorder}`,
                      color: c.accentText, display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Calendar size={17} />
                    </div>

                    {/* Title + MOM number */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontFamily: "ui-monospace, SFMono-Regular, monospace",
                        fontSize: 10, color: c.textFaint, marginBottom: 3, letterSpacing: "0.05em",
                      }}>
                        {m.momNumber}
                      </div>
                      <div style={{
                        fontSize: 14, fontWeight: 700, color: c.text, lineHeight: 1.3,
                        overflow: "hidden", display: "-webkit-box",
                        WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                      }}>
                        {m.title}
                      </div>
                    </div>

                    {/* Badges */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end", flexShrink: 0 }}>
                      {m.status === "draft" && (
                        <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", background: c.warningBg, border: `1px solid ${c.warningBorder}`, color: c.warningText, borderRadius: 999 }}>
                          Draft
                        </span>
                      )}
                      {m.visibility === "internal" && (
                        <span style={{ fontSize: 10, fontWeight: 500, padding: "2px 8px", background: c.surfaceMuted, border: `1px solid ${c.border}`, color: c.textSubtle, borderRadius: 999 }}>
                          Internal
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Meta chips row */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {/* Date chip */}
                    <span style={{
                      display: "inline-flex", gap: 5, alignItems: "center",
                      padding: "4px 10px", borderRadius: 999,
                      background: c.surfaceMuted, border: `1px solid ${c.border}`,
                      fontSize: 11.5, color: c.textMuted, fontWeight: 500,
                    }}>
                      <Clock size={11} />{fmtDate(m.meetingDate)}
                    </span>

                    {/* Duration chip */}
                    {m.durationMinutes && (
                      <span style={{
                        display: "inline-flex", gap: 5, alignItems: "center",
                        padding: "4px 10px", borderRadius: 999,
                        background: c.surfaceMuted, border: `1px solid ${c.border}`,
                        fontSize: 11.5, color: c.textMuted, fontWeight: 500,
                      }}>
                        {m.durationMinutes} min
                      </span>
                    )}

                    {/* Project chip */}
                    {m.projectName && (
                      <span style={{
                        display: "inline-flex", gap: 5, alignItems: "center",
                        padding: "4px 10px", borderRadius: 999,
                        background: c.accentBg, border: `1px solid ${c.accentBorder}`,
                        fontSize: 11.5, color: c.accentText, fontWeight: 500,
                      }}>
                        <GitPullRequest size={11} />{m.projectName}
                      </span>
                    )}

                    {/* Recording chip */}
                    {m.recordingUrl && (
                      <span style={{
                        display: "inline-flex", gap: 5, alignItems: "center",
                        padding: "4px 10px", borderRadius: 999,
                        background: c.purpleBg, border: `1px solid ${c.purpleBorder}`,
                        fontSize: 11.5, color: c.purpleText, fontWeight: 500,
                      }}>
                        <Video size={11} />Recording
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer stats bar */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 0,
                  borderTop: `1px solid ${c.border}`,
                  background: c.surfaceMuted,
                }}>
                  <div style={{
                    flex: 1, display: "flex", alignItems: "center", gap: 6,
                    padding: "10px 18px", fontSize: 12, color: c.textSubtle,
                    borderRight: `1px solid ${c.border}`,
                  }}>
                    <Users size={12} />
                    <span>{m.attendeeCount} attendee{m.attendeeCount === 1 ? "" : "s"}</span>
                  </div>
                  <div style={{
                    flex: 1, display: "flex", alignItems: "center", gap: 6,
                    padding: "10px 18px", fontSize: 12,
                    color: m.openActionCount > 0 ? c.warningText : c.textSubtle,
                    fontWeight: m.openActionCount > 0 ? 600 : 400,
                  }}>
                    <CheckSquare size={12} />
                    <span>{m.openActionCount} open · {m.actionCount} total</span>
                  </div>
                  <div
                    style={{
                      padding: "6px 8px",
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      borderLeft: `1px solid ${c.border}`,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Tooltip title="Edit meeting">
                      <Button
                        type="text"
                        size="small"
                        icon={<Edit3 size={13} color={c.textMuted} />}
                        onClick={() => setEditingId(m.id)}
                      />
                    </Tooltip>
                    <Popconfirm
                      title="Delete this meeting?"
                      description="Action items already converted to tickets will remain."
                      onConfirm={() => handleDeleteRow(m.id)}
                      okText="Delete"
                      okButtonProps={{ danger: true }}
                    >
                      <Tooltip title="Delete">
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<Trash2 size={13} />}
                        />
                      </Tooltip>
                    </Popconfirm>
                  </div>
                  <div style={{
                    padding: "10px 14px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: c.textFaint,
                  }}>
                    <ChevronRight size={15} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        );


        // ── TABLE VIEW ──
        const columns = [
          {
            title: "MOM #",
            dataIndex: "momNumber",
            key: "momNumber",
            width: 110,
            render: (v: string) => (
              <span style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace", fontSize: 11.5, color: c.textMuted }}>{v}</span>
            ),
          },
          {
            title: "Title",
            dataIndex: "title",
            key: "title",
            render: (v: string, m: MomListItem) => (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: c.text }}>{v}</span>
                {m.status === "draft" && (
                  <Tag color="warning" style={{ fontSize: 10, margin: 0 }}>Draft</Tag>
                )}
                {m.visibility === "internal" && (
                  <Tag style={{ fontSize: 10, margin: 0, background: c.surfaceMuted, border: `1px solid ${c.border}`, color: c.textSubtle }}>Internal</Tag>
                )}
              </div>
            ),
          },
          {
            title: "Date",
            dataIndex: "meetingDate",
            key: "meetingDate",
            width: 160,
            render: (v: string) => (
              <span style={{ fontSize: 12.5, color: c.textMuted, display: "inline-flex", gap: 5, alignItems: "center" }}>
                <Clock size={12} />{fmtDate(v)}
              </span>
            ),
          },
          {
            title: "Duration",
            dataIndex: "durationMinutes",
            key: "durationMinutes",
            width: 100,
            render: (v: number | null) => (
              <span style={{ fontSize: 12.5, color: c.textSubtle }}>{v ? `${v} min` : "—"}</span>
            ),
          },
          {
            title: "Project",
            dataIndex: "projectName",
            key: "projectName",
            width: 140,
            render: (v: string | null) => v ? (
              <span style={{ fontSize: 12, color: c.accentText, display: "inline-flex", gap: 4, alignItems: "center" }}>
                <GitPullRequest size={11} />{v}
              </span>
            ) : <span style={{ color: c.textFaint }}>—</span>,
          },
          {
            title: "Attendees",
            dataIndex: "attendeeCount",
            key: "attendeeCount",
            width: 100,
            render: (v: number) => (
              <span style={{ fontSize: 12.5, color: c.textSubtle, display: "inline-flex", gap: 4, alignItems: "center" }}>
                <Users size={12} />{v}
              </span>
            ),
          },
          // {
          //   title: "Actions",
          //   dataIndex: "openActionCount",
          //   key: "actions",
          //   width: 120,
          //   render: (open: number, m: MomListItem) => (
          //     <span style={{ fontSize: 12.5, display: "inline-flex", gap: 4, alignItems: "center", color: open > 0 ? c.warningText : c.textSubtle, fontWeight: open > 0 ? 600 : 400 }}>
          //       <CheckSquare size={12} />{open} open · {m.actionCount} total
          //     </span>
          //   ),
          // },
          {
            title: "",
            key: "actions",
            width: 110,
            align: "right" as const,
            fixed: "right" as const,
            render: (_: any, m: MomListItem) => (
              <div
                style={{ display: "inline-flex", gap: 6 }}
                onClick={(e) => e.stopPropagation()}
              >
                <Tooltip title="Edit meeting">
                  <Button
                    type="text"
                    size="small"
                    icon={<Edit3 size={14} color={c.textMuted} />}
                    onClick={() => setEditingId(m.id)}
                  />
                </Tooltip>
                <Popconfirm
                  title="Delete this meeting?"
                  description="Action items already converted to tickets will remain."
                  onConfirm={() => handleDeleteRow(m.id)}
                  okText="Delete"
                  okButtonProps={{ danger: true }}
                >
                  <Tooltip title="Delete">
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<Trash2 size={14} />}
                    />
                  </Tooltip>
                </Popconfirm>
              </div>
            ),
          },
        ];

        return (
          <>
            <style dangerouslySetInnerHTML={{
              __html: `
              .meetings-table .ant-table {
                background: transparent !important;
                color: ${c.text} !important;
              }
              .meetings-table .ant-table-thead > tr > th {
                background: ${c.surfaceMuted} !important;
                color: ${c.textSubtle} !important;
                font-weight: 600 !important;
                font-size: 11px !important;
                text-transform: uppercase !important;
                letter-spacing: 0.06em !important;
                border-bottom: 1px solid ${c.border} !important;
                padding: 10px 16px !important;
              }
              .meetings-table .ant-table-thead > tr > th::before { display: none !important; }
              .meetings-table .ant-table-tbody > tr > td {
                background: ${c.surfaceElevated} !important;
                border-bottom: 1px solid ${c.border} !important;
                padding: 12px 16px !important;
              }
              .meetings-table .ant-table-tbody > tr:hover > td {
                background: ${c.surfaceMuted} !important;
              }
              .meetings-table .ant-table-tbody > tr > td:first-child { border-radius: 0 !important; }
              .meetings-table { border: 1px solid ${c.border}; border-radius: 12px; overflow: hidden; }
            ` }} />
            <Table
              className="meetings-table"
              dataSource={filtered}
              columns={columns}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10, hideOnSinglePage: true }}
              scroll={{ x: "max-content" }}
              onRow={(m) => ({ onClick: () => setOpenId(m.id), style: { cursor: "pointer" } })}
            />
          </>
        );
      })()}

      {/* Create / Edit modal */}
      <CreateMeetingModal
        open={createOpen || !!editingId}
        editingId={editingId}
        onClose={() => {
          setCreateOpen(false);
          setEditingId(null);
        }}
        onCreated={() => {
          setCreateOpen(false);
          setEditingId(null);
          load();
        }}
        clientId={clientId}
        projects={projects}
        contacts={contacts}
        c={c}
        messageApi={messageApi}
      />
      {/* Detail drawer */}
      <MomDetailDrawer
        id={openId}
        c={c}
        messageApi={messageApi}
        onClose={() => setOpenId(null)}
        onMutated={load}
      />

      {/* Premium adaptive header styling */}
      <style dangerouslySetInnerHTML={{
        __html: `
        /* Full bleed header styling flush with vertical sidebar border */
        .meetings-header-wrap {
          margin-bottom: 24px !important;
          display: block !important;
        }
        .meetings-header-wrap .saas-header-container {
          margin-left: -32px !important;
          margin-right: -32px !important;
          padding-left: 32px !important;
          padding-right: 32px !important;
          padding-top: 10px !important;
          padding-bottom: 12px !important;
          margin-bottom: 0 !important;
        }
        @media (max-width: 900px) {
          .meetings-header-wrap .saas-header-container {
            margin-left: -20px !important;
            margin-right: -20px !important;
            padding-left: 20px !important;
            padding-right: 20px !important;
          }
        }
        @media (max-width: 720px) {
          .meetings-header-wrap .saas-header-container {
            margin-left: -16px !important;
            margin-right: -16px !important;
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
        }
      `}} />
    </div>
  );
}

/* --------------------------------------------------------------- */

function MeetingRow({
  mom,
  c,
  onOpen,
}: {
  mom: MomListItem;
  c: ReturnType<typeof palette>;
  onOpen: () => void;
}) {
  const [hover, setHover] = useState(false);
  const attachments = mom.attachments ?? [];
  return (
    <div
      role="button"
      tabIndex={0}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      style={{
        display: "grid",
        gridTemplateColumns: "44px minmax(0, 1fr) 130px 130px 30px",
        gap: 14,
        padding: "14px 18px",
        background: hover ? c.surfaceMuted : c.surfaceElevated,
        border: `1px solid ${hover ? c.borderStrong : c.border}`,
        borderRadius: 12,
        cursor: "pointer",
        textAlign: "left",
        alignItems: "center",
        transition: "border-color 120ms ease, background 120ms ease",
        color: c.text,
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 9,
          background: c.accentBg,
          border: `1px solid ${c.accentBorder}`,
          color: c.accentText,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Calendar size={16} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 11.5,
              padding: "1px 7px",
              background: c.surfaceMuted,
              border: `1px solid ${c.border}`,
              borderRadius: 6,
              color: c.textMuted,
            }}
          >
            {mom.momNumber}
          </span>
          <span
            style={{
              fontSize: 13.5,
              fontWeight: 600,
              color: c.text,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {mom.title}
          </span>
          {mom.status === "draft" && (
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 500,
                padding: "1px 7px",
                background: c.warningBg,
                border: `1px solid ${c.warningBorder}`,
                color: c.warningText,
                borderRadius: 999,
              }}
            >
              Draft
            </span>
          )}
          {mom.visibility === "internal" && (
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 500,
                padding: "1px 7px",
                background: c.surfaceMuted,
                border: `1px solid ${c.border}`,
                color: c.textSubtle,
                borderRadius: 999,
              }}
            >
              Internal only
            </span>
          )}
        </div>
        <div
          style={{
            marginTop: 4,
            fontSize: 12,
            color: c.textSubtle,
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <span style={{ display: "inline-flex", gap: 3, alignItems: "center" }}>
            <Clock size={11} />
            {fmtDateTime(mom.meetingDate)}
          </span>
          {mom.durationMinutes && (
            <>
              <span style={{ color: c.textFaint }}>·</span>
              <span>{mom.durationMinutes} min</span>
            </>
          )}
          {mom.projectName && (
            <>
              <span style={{ color: c.textFaint }}>·</span>
              <span>{mom.projectName}</span>
            </>
          )}
          {mom.recordingUrl && (
            <>
              <span style={{ color: c.textFaint }}>·</span>
              <span style={{ display: "inline-flex", gap: 3, alignItems: "center" }}>
                <Video size={11} />
                Recording
              </span>
            </>
          )}
        </div>
      </div>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontSize: 12,
          color: c.textSubtle,
        }}
      >
        <Users size={12} />
        {mom.attendeeCount} attendee{mom.attendeeCount === 1 ? "" : "s"}
      </div>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontSize: 12,
          color: mom.openActionCount > 0 ? c.warningText : c.textSubtle,
          fontWeight: mom.openActionCount > 0 ? 600 : 400,
        }}
      >
        <CheckSquare size={12} />
        {mom.openActionCount} open · {mom.actionCount} total
      </div>
      <ChevronRight size={16} color={c.textFaint} />
      {attachments.length > 0 && (
        <div
          style={{
            gridColumn: "2 / -1",
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginTop: 2,
          }}
        >
          {attachments.map((a) => (
            <AttachmentChip key={a.id} attachment={a} c={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function resolveListAttachmentUrl(a: MomListAttachment): string | null {
  if (a.kind === "file") return a.fileUrl ?? null;
  // Legacy records sometimes have linkUrl/linkLabel swapped — prefer
  // whichever one parses as a real http(s) URL with a real hostname.
  const ok = (s: string | null | undefined) => {
    if (!s) return false;
    try {
      const u = new URL(s.trim());
      return (
        (u.protocol === "http:" || u.protocol === "https:") &&
        u.hostname.includes(".")
      );
    } catch {
      return false;
    }
  };
  if (ok(a.linkUrl)) return a.linkUrl;
  if (ok(a.linkLabel)) return a.linkLabel;
  return a.linkUrl ?? null;
}

function AttachmentChip({
  attachment,
  c,
}: {
  attachment: MomListAttachment;
  c: ReturnType<typeof palette>;
}) {
  const url = resolveListAttachmentUrl(attachment);
  const isFile = attachment.kind === "file";
  const label = isFile
    ? attachment.fileName || "File"
    : attachment.linkLabel || attachment.linkUrl || "Link";
  return (
    <a
      href={url || "#"}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      title={label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        maxWidth: 220,
        padding: "3px 9px",
        background: c.surfaceElevated,
        border: `1px solid ${c.border}`,
        borderRadius: 999,
        color: c.accentText,
        textDecoration: "none",
        fontSize: 11.5,
        fontWeight: 500,
      }}
    >
      {isFile ? <FileText size={11} /> : <Link2 size={11} />}
      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          minWidth: 0,
        }}
      >
        {label}
      </span>
      <ExternalLink size={9} />
    </a>
  );
}

/* --------------------------------------------------------------- */

function CreateMeetingModal({
  open,
  onClose,
  onCreated,
  clientId,
  projects,
  contacts,
  c,
  messageApi,
  editingId,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  clientId: string;
  projects: { id: string; name: string; code?: string | null }[];
  contacts: ClientContactOption[];
  c: ReturnType<typeof palette>;
  messageApi: any;
  editingId?: string | null;
}) {
  const isEdit = !!editingId;
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [attendees, setAttendees] = useState<MomAttendee[]>([]);
  const [decisions, setDecisions] = useState<MomDecision[]>([]);
  const [actionItems, setActionItems] = useState<MomActionItem[]>([]);
  const [attachments, setAttachments] = useState<MomAttachmentInput[]>([]);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setAttendees([]);
      setDecisions([]);
      setActionItems([]);
      setAttachments([]);
      return;
    }

    // Pre-fetch staff users so the "internal" attendee picker is instant.
    teamService
      .staffOptions(clientId, "")
      .then((list) => setStaffOptions(list || []))
      .catch(() => setStaffOptions([]));

    if (editingId) {
      setLoadingDetail(true);
      momService
        .detail(editingId)
        .then((detail) => {
          form.setFieldsValue({
            title: detail.title,
            meetingDate: detail.meetingDate ? dayjs(detail.meetingDate) : dayjs(),
            durationMinutes: detail.durationMinutes ?? undefined,
            projectId: detail.projectId ?? undefined,
            location: detail.location ?? undefined,
            recordingUrl: detail.recordingUrl ?? undefined,
            visibility: detail.visibility,
            status: detail.status,
            summary: detail.summary ?? undefined,
          });
          setAttendees(detail.attendees || []);
          setDecisions(detail.decisions || []);
          setActionItems(detail.actionItems || []);
          setAttachments(
            (detail.attachments || []).map((a) => ({
              id: a.id,
              kind: a.kind,
              fileName: a.fileName || undefined,
              linkUrl: a.linkUrl || undefined,
              linkLabel: a.linkLabel || undefined,
            })),
          );
        })
        .catch((err: any) => {
          messageApi.error(`Could not load meeting: ${err?.message}`);
          onClose();
        })
        .finally(() => setLoadingDetail(false));
    } else {
      form.setFieldsValue({
        visibility: "client",
        status: "published",
        meetingDate: dayjs(),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingId]);

  const submit = async (values: any) => {
    if (!values.title?.trim()) {
      messageApi.error("Title is required");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        title: values.title.trim(),
        meetingDate:
          values.meetingDate?.toISOString() ?? new Date().toISOString(),
        projectId: values.projectId || null,
        durationMinutes: values.durationMinutes || null,
        location: values.location || null,
        recordingUrl: values.recordingUrl || null,
        summary: values.summary || null,
        visibility: values.visibility || "client",
        status: values.status || "published",
        attendees: attendees.filter((a) => a.name?.trim()),
        decisions: decisions.filter((d) => d.decision?.trim()),
        actionItems: actionItems.filter((a) => a.text?.trim()),
        attachments: attachments.filter(
          (a) =>
            !!a.id ||
            (a.kind === "file" && a.fileDataUrl && a.fileName) ||
            (a.kind === "link" && a.linkUrl?.trim()),
        ),
      };
      if (isEdit && editingId) {
        await momService.update(editingId, payload);
        messageApi.success("Meeting updated");
      } else {
        await momService.create(clientId, payload);
        messageApi.success("Meeting logged");
      }
      onCreated();
    } catch (err: any) {
      messageApi.error(
        `${isEdit ? "Could not update meeting" : "Could not log meeting"}: ${err?.message}`
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PremiumModal
      open={open}
      onClose={onClose}
      width={720}
      c={c}
      ribbonColor={c.accent}
      iconTile={{ bg: c.accentBg, border: c.accentBorder, text: c.accentText }}
      icon={<Calendar size={20} />}
      title={isEdit ? "Edit meeting" : "Log a meeting"}
      subtitle={
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
          <Calendar size={12} style={{ flexShrink: 0 }} />
          Captured for the audit trail · shared with the portal when visibility is set to <strong style={{ marginLeft: 3 }}>Client</strong>
        </div>
      }
      tip={
        <span>
          Convert any action item into a <strong>portal ticket</strong> or
          <strong> change request</strong> after saving — one-click from the
          meeting detail drawer.
        </span>
      }
      footer={
        <ModalFooterActions c={c} kbdHint="⌘ ↵ to save">
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            disabled={loadingDetail}
            onClick={() => form.submit()}
            icon={<Calendar size={14} />}
          >
            {isEdit ? "Save changes" : "Save meeting"}
          </Button>
        </ModalFooterActions>
      }
    >
      <Form form={form} layout="vertical" onFinish={submit} requiredMark={false}>
        <ModalSection
          c={c}
          title="Meeting basics"
          description="When it happened, who runs the work, where it was held."
          icon={<Calendar size={11} />}
          plain
        >
          <Form.Item
            name="title"
            label={<FLabel c={c}>Title</FLabel>}
            rules={[{ required: true, message: "Title is required" }]}
            style={{ marginBottom: 12 }}
          >
            <Input
              prefix={<Lightbulb size={13} color={c.textFaint} />}
              placeholder="e.g. Sprint 4 review and planning"
            />
          </Form.Item>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 1fr 1fr",
              gap: 10,
            }}
          >
            <Form.Item
              name="meetingDate"
              label={<FLabel c={c}>Date / time</FLabel>}
              rules={[{ required: true }]}
              style={{ marginBottom: 12 }}
            >
              <DatePicker
                showTime
                style={{ width: "100%" }}
                format="YYYY-MM-DD HH:mm"
              />
            </Form.Item>
            <Form.Item
              name="durationMinutes"
              label={<FLabel c={c} hint="min">Duration</FLabel>}
              style={{ marginBottom: 12 }}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={5}
                max={600}
                placeholder="60"
              />
            </Form.Item>
            <Form.Item
              name="projectId"
              label={<FLabel c={c} hint="optional">Project</FLabel>}
              style={{ marginBottom: 12 }}
            >
              <Select
                allowClear
                placeholder="—"
                options={projects.map((p) => ({
                  value: p.id,
                  label: p.code ? `${p.name} · ${p.code}` : p.name,
                }))}
              />
            </Form.Item>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.4fr 1fr",
              gap: 10,
            }}
          >
            <Form.Item
              name="location"
              label={<FLabel c={c}>Location</FLabel>}
              style={{ marginBottom: 0 }}
            >
              <Input placeholder="Zoom · Google Meet · On-site" />
            </Form.Item>
            <Form.Item
              name="recordingUrl"
              label={<FLabel c={c} hint="optional">Recording URL</FLabel>}
              style={{ marginBottom: 0 }}
            >
              <Input
                prefix={<Lightbulb size={13} color={c.textFaint} />}
                placeholder="https://…"
              />
            </Form.Item>
            <Form.Item
              name="visibility"
              label={<FLabel c={c}>Visibility</FLabel>}
              style={{ marginBottom: 0 }}
            >
              <Select
                options={[
                  { value: "client", label: "Visible to client" },
                  { value: "internal", label: "Internal only" },
                ]}
              />
            </Form.Item>
          </div>
        </ModalSection>

        <ModalSection
          c={c}
          title="Summary & status"
          description="Plain text — the rich text view comes later via the detail drawer."
          icon={<Lightbulb size={11} />}
          plain
        >
          <Form.Item
            name="summary"
            label={<FLabel c={c}>Summary</FLabel>}
            style={{ marginBottom: 12 }}
          >
            <Input.TextArea rows={3} placeholder="What was discussed…" />
          </Form.Item>

          <Form.Item
            name="status"
            label={<FLabel c={c}>Status</FLabel>}
            style={{ marginBottom: 0 }}
          >
            <Select
              options={[
                { value: "published", label: "Published — visible to client" },
                { value: "draft", label: "Draft — not shown yet" },
              ]}
            />
          </Form.Item>
        </ModalSection>

        <ModalSection
          c={c}
          title="Participants & outcomes"
          description="Add attendees, decisions, and action items. Action items become trackable in the portal."
          icon={<Users size={11} />}
        >
          {/* Attendees editor */}
          <RepeaterSection<MomAttendee>
            title="Attendees"
            icon={<Users size={13} />}
            c={c}
            items={attendees}
            onChange={setAttendees}
            blank={() => ({ name: "", party: "client" })}
            render={(item, update) => (
              <AttendeeRow
                item={item}
                update={update}
                c={c}
                staffOptions={staffOptions}
                contacts={contacts}
              />
            )}
          />

          {/* Decisions editor */}
          <RepeaterSection<MomDecision>
            title="Decisions"
            icon={<Lightbulb size={13} />}
            c={c}
            items={decisions}
            onChange={setDecisions}
            blank={() => ({ decision: "" })}
            render={(item, update) => (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2.5fr 1fr",
                  gap: 8,
                }}
              >
                <Input
                  size="small"
                  value={item.decision}
                  onChange={(e) => update({ decision: e.target.value })}
                  placeholder="Decision"
                />
                <Input
                  size="small"
                  value={item.decidedBy || ""}
                  onChange={(e) => update({ decidedBy: e.target.value })}
                  placeholder="Decided by"
                />
              </div>
            )}
          />

          {/* Action items editor */}
          <RepeaterSection<MomActionItem>
            title="Action items"
            icon={<ListChecks size={13} />}
            c={c}
            items={actionItems}
            onChange={setActionItems}
            blank={() => ({ text: "", status: "open" })}
            render={(item, update) => (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2.2fr 1fr 1fr",
                  gap: 8,
                }}
              >
                <Input
                  size="small"
                  value={item.text}
                  onChange={(e) => update({ text: e.target.value })}
                  placeholder="What needs to be done"
                />
                <Input
                  size="small"
                  value={item.ownerName || ""}
                  onChange={(e) => update({ ownerName: e.target.value })}
                  placeholder="Owner"
                />
                <DatePicker
                  size="small"
                  style={{ width: "100%" }}
                  value={item.dueDate ? dayjs(item.dueDate) : undefined}
                  onChange={(d) =>
                    update({
                      dueDate: d ? d.format("YYYY-MM-DD") : null,
                    })
                  }
                  placeholder="Due"
                />
              </div>
            )}
          />
        </ModalSection>

        <ModalSection
          c={c}
          title="Attachments"
          description="Upload a file or paste a DocumentHub / Figma / Drive link. Clients open both inside the portal."
          icon={<Paperclip size={11} />}
        >
          <AttachmentsEditor
            c={c}
            value={attachments}
            onChange={setAttachments}
            messageApi={messageApi}
          />
        </ModalSection>
      </Form>
    </PremiumModal>
  );
}

/* --------------------------------------------------------------- */

/* --------------------------------------------------------------- */

/**
 * Party-aware row used by the Attendees repeater.
 *
 *  - `internal` → searchable staff picker (filters tenant users via
 *    `teamService.staffOptions`). Picking a row auto-fills name + email and
 *    stashes `staffUserId` for traceability. Role stays editable.
 *  - `client`   → searchable client-contact picker (filters the contacts
 *    already loaded on the parent client). Picking auto-fills name + email
 *    + designation as the role.
 *  - `external` → original free-text name/email/role fields, for guests
 *    who aren't staff or a known contact.
 *
 * The `party` select is always on the right so the user can change tier
 * mid-edit and the appropriate picker swaps in. Switching the party clears
 * the previously linked identity to avoid stale FKs.
 */
function AttendeeRow({
  item,
  update,
  c,
  staffOptions,
  contacts,
}: {
  item: MomAttendee;
  update: (patch: Partial<MomAttendee>) => void;
  c: ReturnType<typeof palette>;
  staffOptions: StaffOption[];
  contacts: ClientContactOption[];
}) {
  const party = item.party || "client";

  const partySelect = (
    <Select
      size="small"
      value={party}
      onChange={(v) => {
        // Reset linked identity + cached display fields when switching tiers,
        // so we never end up with a staff-user id attached to a client party.
        update({
          party: v as MomAttendee["party"],
          staffUserId: null,
          portalUserId: null,
          name: "",
          email: null,
          role: null,
        });
      }}
      options={[
        { value: "client", label: "Client" },
        { value: "internal", label: "Internal" },
        { value: "external", label: "External" },
      ]}
    />
  );

  if (party === "external") {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1.4fr 1fr 1fr",
          gap: 8,
        }}
      >
        <Input
          size="small"
          value={item.name}
          onChange={(e) => update({ name: e.target.value })}
          placeholder="Name"
        />
        <Input
          size="small"
          value={item.email || ""}
          onChange={(e) => update({ email: e.target.value })}
          placeholder="Email"
        />
        <Input
          size="small"
          value={item.role || ""}
          onChange={(e) => update({ role: e.target.value })}
          placeholder="Role"
        />
        {partySelect}
      </div>
    );
  }

  if (party === "internal") {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.8fr 1.4fr 1fr 1fr",
          gap: 8,
        }}
      >
        <Select
          size="small"
          showSearch
          allowClear
          placeholder="Pick a staff member…"
          // Identity lives on staffUserId; surface it as the controlled value.
          value={item.staffUserId || undefined}
          filterOption={(input, option: any) =>
            (option?.search || "").toLowerCase().includes(input.toLowerCase())
          }
          onChange={(uid) => {
            if (!uid) {
              update({ staffUserId: null, name: "", email: null, role: null });
              return;
            }
            const picked = staffOptions.find((u) => u.id === uid);
            update({
              staffUserId: uid,
              name: picked?.name || "",
              email: picked?.work_email || null,
            });
          }}
          options={staffOptions.map((u) => ({
            value: u.id,
            search: `${u.name} ${u.work_email || ""}`,
            label: (
              <span style={{ display: "inline-flex", flexDirection: "column", lineHeight: 1.2 }}>
                <span style={{ fontSize: 12.5, fontWeight: 500 }}>{u.name}</span>
                {u.work_email && (
                  <span style={{ fontSize: 11, opacity: 0.7 }}>{u.work_email}</span>
                )}
              </span>
            ),
          }))}
          notFoundContent={
            <div
              style={{
                padding: 8,
                fontSize: 11.5,
                color: c.textSubtle,
                textAlign: "center",
              }}
            >
              No staff users available.
            </div>
          }
        />
        <Input
          size="small"
          value={item.email || ""}
          onChange={(e) => update({ email: e.target.value })}
          placeholder="Email"
        // Auto-filled from picker but staff can override (e.g. personal email)
        />
        <Input
          size="small"
          value={item.role || ""}
          onChange={(e) => update({ role: e.target.value })}
          placeholder="Role (e.g. PM, Tech Lead)"
        />
        {partySelect}
      </div>
    );
  }

  // party === 'client'
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.8fr 1.4fr 1fr 1fr",
        gap: 8,
      }}
    >
      <Select
        size="small"
        showSearch
        allowClear
        placeholder="Pick a client contact…"
        // Contacts don't have a dedicated FK on the attendee row; we identify
        // the chosen contact in the picker by name match (sufficient for the
        // controlled value here — the actual identity is denormalized).
        value={item.name || undefined}
        filterOption={(input, option: any) =>
          (option?.search || "").toLowerCase().includes(input.toLowerCase())
        }
        onChange={(name) => {
          if (!name) {
            update({ name: "", email: null, role: null });
            return;
          }
          const picked = contacts.find(
            (k) => `${k.firstName || ""} ${k.lastName || ""}`.trim() === name,
          );
          update({
            name,
            email: picked?.officialEmail || null,
            role: picked?.designation || null,
          });
        }}
        options={contacts.map((k) => {
          const fullName =
            `${k.firstName || ""} ${k.lastName || ""}`.trim() ||
            k.officialEmail ||
            "Contact";
          return {
            value: fullName,
            search: `${fullName} ${k.officialEmail || ""} ${k.designation || ""}`,
            label: (
              <span style={{ display: "inline-flex", flexDirection: "column", lineHeight: 1.2 }}>
                <span style={{ fontSize: 12.5, fontWeight: 500 }}>{fullName}</span>
                <span style={{ fontSize: 11, opacity: 0.7 }}>
                  {k.officialEmail}
                  {k.designation ? ` · ${k.designation}` : ""}
                </span>
              </span>
            ),
          };
        })}
        notFoundContent={
          <div
            style={{
              padding: 8,
              fontSize: 11.5,
              color: c.textSubtle,
              textAlign: "center",
            }}
          >
            No contacts on this client. Add them in the Contacts tab first.
          </div>
        }
      />
      <Input
        size="small"
        value={item.email || ""}
        onChange={(e) => update({ email: e.target.value })}
        placeholder="Email"
      />
      <Input
        size="small"
        value={item.role || ""}
        onChange={(e) => update({ role: e.target.value })}
        placeholder="Role / designation"
      />
      {partySelect}
    </div>
  );
}

/* --------------------------------------------------------------- */

function AttachmentsEditor({
  c,
  value,
  onChange,
  messageApi,
}: {
  c: ReturnType<typeof palette>;
  value: MomAttachmentInput[];
  onChange: (next: MomAttachmentInput[]) => void;
  messageApi: any;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [adding, setAdding] = useState<null | "link">(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((f) => {
      if (f.size > 25 * 1024 * 1024) {
        messageApi.error(`${f.name} exceeds 25 MB`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        onChange([
          ...value,
          {
            kind: "file",
            fileName: f.name,
            fileDataUrl: String(reader.result),
          },
        ]);
      };
      reader.readAsDataURL(f);
    });
  };

  const addLink = () => {
    // Strip any invisible whitespace (zero-width, NBSP) that some keyboards
    // and clipboards smuggle in, then auto-prepend https:// when the user
    // pasted a bare domain. Validate with the URL constructor — it's far
    // more lenient than a regex and handles UTF-8 hostnames + weird paths.
    const cleaned = linkUrl
      .replace(/[​-‍﻿ ]/g, "")
      .trim();
    if (!cleaned) return;

    const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(cleaned)
      ? cleaned
      : `https://${cleaned}`;

    try {
      const parsed = new URL(candidate);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        messageApi.error("Only http(s) links are supported");
        return;
      }
      // The URL constructor is too lenient — "https://Project Overview"
      // parses successfully because spaces are allowed in the path. Require
      // a hostname with a dot (real TLD) so labels can't masquerade as URLs.
      if (!parsed.hostname.includes(".")) {
        messageApi.error("That doesn't look like a valid URL: URL must include a real domain (e.g. example.com)");
        return;
      }
    } catch {
      messageApi.error(`That doesn't look like a valid URL: ${cleaned}`);
      return;
    }

    onChange([
      ...value,
      {
        kind: "link",
        linkUrl: candidate,
        linkLabel: linkLabel.trim() || undefined,
      },
    ]);
    setLinkUrl("");
    setLinkLabel("");
    setAdding(null);
  };

  const removeAt = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div>
      {/* Existing attachment list */}
      {value.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
          {value.map((a, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 12px",
                background: c.surfaceMuted,
                border: `1px solid ${c.border}`,
                borderRadius: 10,
                fontSize: 12.5,
              }}
            >
              <div style={{
                width: 30, height: 30, borderRadius: 7, flexShrink: 0,
                background: a.kind === "file" ? c.accentBg : c.purpleBg,
                border: `1px solid ${a.kind === "file" ? c.accentBorder : c.purpleBorder}`,
                color: a.kind === "file" ? c.accentText : c.purpleText,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {a.kind === "file" ? <FileText size={13} /> : <Link2 size={13} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: c.text, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {a.kind === "file" ? a.fileName : (a.linkLabel || a.linkUrl)}
                </div>
                {a.kind === "link" && a.linkLabel && (
                  <div style={{ fontSize: 11, color: c.textFaint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>
                    {a.linkUrl}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeAt(i)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: c.textSubtle, display: "flex", alignItems: "center", padding: 4, borderRadius: 6 }}
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add controls */}
      {adding !== "link" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Drop zone */}
          <input
            ref={inputRef}
            type="file"
            multiple
            style={{ marginBottom: 12 }}
            onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
            style={{
              width: "100%",
              padding: "28px 16px",
              background: c.surfaceMuted,
              border: `2px dashed ${c.accentBorder}`,
              borderRadius: 14,
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
              textAlign: "center",
              transition: "border-color 150ms ease, background 150ms ease",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = c.accent; (e.currentTarget as HTMLElement).style.background = c.accentBg; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = c.accentBorder; (e.currentTarget as HTMLElement).style.background = c.surfaceMuted; }}
          >
            {/* Purple icon tile */}
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: `linear-gradient(135deg, #8b5cf6, #6d28d9)`,
              boxShadow: "0 4px 16px rgba(109,40,217,0.28)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff",
            }}>
              <UploadIcon size={22} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 4 }}>
                Drop file here or click to browse
              </div>
              <div style={{ fontSize: 12, color: c.textSubtle }}>
                PDF, DOCX, JPG · single file · up to 25 MB
              </div>
            </div>
          </button>

          {/* Paste link shortcut */}
          <button
            type="button"
            onClick={() => setAdding("link")}
            style={{
              width: "100%",
              padding: "10px 14px",
              background: "transparent",
              border: `1px solid ${c.border}`,
              borderRadius: 10,
              cursor: "pointer",
              color: c.textSubtle,
              fontSize: 12.5,
              fontWeight: 500,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              transition: "border-color 150ms ease, color 150ms ease",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = c.borderStrong; (e.currentTarget as HTMLElement).style.color = c.text; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = c.border; (e.currentTarget as HTMLElement).style.color = c.textSubtle; }}
          >
            <Link2 size={13} />
            Paste a link (Figma, Drive, Notion…)
          </button>
        </div>
      ) : (
        <div style={{
          padding: 14,
          background: c.surfaceMuted,
          border: `1px solid ${c.border}`,
          borderRadius: 12,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: c.textSubtle, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>Paste a link</div>
          <Input
            size="small"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            prefix={<Link2 size={12} color={c.textFaint} />}
            placeholder="https://docs.example.com/doc/…"
            autoFocus
            onPressEnter={addLink}
          />
          <Input
            size="small"
            value={linkLabel}
            onChange={(e) => setLinkLabel(e.target.value)}
            placeholder="Optional label (e.g. Sprint 4 retro doc)"
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 2 }}>
            <Button size="small" onClick={() => { setAdding(null); setLinkUrl(""); setLinkLabel(""); }}>Cancel</Button>
            <Button size="small" type="primary" onClick={addLink} disabled={!linkUrl.trim()} icon={<Plus size={12} />}>Save the link</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function RepeaterSection<T>({
  title,
  icon,
  c,
  items,
  onChange,
  blank,
  render,
}: {
  title: string;
  icon: React.ReactNode;
  c: ReturnType<typeof palette>;
  items: T[];
  onChange: (next: T[]) => void;
  blank: () => T;
  render: (item: T, update: (patch: Partial<T>) => void, idx: number) => React.ReactNode;
}) {
  const updateAt = (idx: number, patch: Partial<T>) => {
    onChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };
  const removeAt = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
  };
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11.5,
            fontWeight: 600,
            color: c.textSubtle,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {icon}
          {title}
          {items.length > 0 && (
            <span style={{ color: c.textFaint, fontWeight: 500 }}>
              · {items.length}
            </span>
          )}
        </div>
        <Button
          size="small"
          icon={<Plus size={12} />}
          onClick={() => onChange([...items, blank()])}
        >
          Add
        </Button>
      </div>
      {items.length === 0 ? (
        <div
          style={{
            padding: "10px 12px",
            background: c.surfaceMuted,
            border: `1px dashed ${c.border}`,
            borderRadius: 8,
            color: c.textSubtle,
            fontSize: 12,
          }}
        >
          None yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {items.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                gap: 6,
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  flex: 1,
                  padding: 8,
                  background: c.surfaceMuted,
                  border: `1px solid ${c.border}`,
                  borderRadius: 8,
                }}
              >
                {render(item, (patch) => updateAt(idx, patch), idx)}
              </div>
              <button
                type="button"
                onClick={() => removeAt(idx)}
                style={{
                  width: 28,
                  height: 28,
                  background: "transparent",
                  border: `1px solid ${c.border}`,
                  borderRadius: 7,
                  color: c.textSubtle,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 1,
                }}
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AttachmentViewerCard({ a, c, onView, onDownload }: any) {
  const [hover, setHover] = useState(false);
  const isFile = a.kind === "file";
  const isImage = !!a.mimeType?.startsWith("image/");
  const isPdf = a.mimeType === "application/pdf";
  const Icon = !isFile
    ? Link2
    : isImage
      ? ImageIcon
      : isPdf
        ? FileType2
        : FileText;

  const name = isFile ? a.fileName || "File" : a.linkLabel || a.linkUrl || "Link";
  const sub = isFile
    ? a.mimeType || "file"
    : a.linkUrl
      ? (() => {
          try {
            return new URL(a.linkUrl).hostname.replace(/^www\./, "");
          } catch {
            return "";
          }
        })()
      : "";

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 12px',
        background: hover ? c.surfaceElevated : c.surfaceMuted,
        border: `1px solid ${hover ? c.borderStrong : c.border}`,
        borderRadius: 10,
        textAlign: 'left',
        cursor: 'pointer',
        width: '100%',
        transition: 'background 120ms ease, border-color 120ms ease',
        textDecoration: 'none',
        color: 'inherit',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 7,
          background: isFile ? c.accentBg : c.purpleBg,
          border: `1px solid ${isFile ? c.accentBorder : c.purpleBorder}`,
          color: isFile ? c.accentText : c.purpleText,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={13} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: c.text,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </div>
        <div
          style={{
            marginTop: 1,
            fontSize: 10.5,
            color: c.textSubtle,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontWeight: 500,
          }}
        >
          {sub}
        </div>
      </div>
      <ExternalLink size={12} color={c.textFaint} />

      {hover && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(2px)' }}>
          <div role="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onView(); }} style={{ width: 28, height: 28, border: `1px solid ${c.borderStrong}`, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.text, cursor: 'pointer', background: c.surfaceElevated, transition: 'background 0.2s', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }} onMouseEnter={(e) => (e.currentTarget.style.background = c.surfaceMuted)} onMouseLeave={(e) => (e.currentTarget.style.background = c.surfaceElevated)}>
            <Eye size={13} />
          </div>
          {onDownload && (
            <div role="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDownload(); }} style={{ width: 28, height: 28, border: `1px solid ${c.borderStrong}`, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.text, cursor: 'pointer', background: c.surfaceElevated, transition: 'background 0.2s', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }} onMouseEnter={(e) => (e.currentTarget.style.background = c.surfaceMuted)} onMouseLeave={(e) => (e.currentTarget.style.background = c.surfaceElevated)}>
              <Download size={13} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- */

function MomDetailDrawer({
  id,
  c,
  messageApi,
  onClose,
  onMutated,
}: {
  id: string | null;
  c: ReturnType<typeof palette>;
  messageApi: any;
  onClose: () => void;
  onMutated: () => void;
}) {
  const [mom, setMom] = useState<MomDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<any>(null);

  const getDocPreview = (url: string | null) => {
    if (!url) return null;
    let m = url.match(/drive\.google\.com\/file\/d\/([^/?#]+)/);
    if (m) return { kind: "iframe", src: `https://drive.google.com/file/d/${m[1]}/preview` };
    m = url.match(/docs\.google\.com\/(document|spreadsheets|presentation)\/d\/([^/?#]+)/);
    if (m) return { kind: "iframe", src: `https://docs.google.com/${m[1]}/d/${m[2]}/preview` };
    m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?#]+)/);
    if (m) return { kind: "iframe", src: `https://www.youtube.com/embed/${m[1]}` };
    if (/\.(png|jpe?g|gif|webp|svg|bmp)(\?|$|#)/i.test(url)) return { kind: "image", src: url };
    if (/\.(docx?|xlsx?|pptx?)(\?|$|#)/i.test(url)) {
      return { kind: "iframe", src: `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true` };
    }
    return { kind: "iframe", src: url };
  };

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      setMom(await momService.detail(id));
    } catch (err: any) {
      messageApi.error(`Failed to load: ${err?.message}`);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    setMom(null);
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleStatusChange = async (
    itemId: string,
    status: "open" | "in_progress" | "done" | "cancelled",
  ) => {
    try {
      await momService.updateActionItemStatus(itemId, status);
      load();
    } catch (err: any) {
      messageApi.error(`Update failed: ${err?.message}`);
    }
  };

  const handleConvert = async (itemId: string) => {
    setConvertingId(itemId);
    try {
      const r = await momService.convertActionItem(itemId, {
        target: "portal_ticket",
        priority: "medium",
        category: "support",
      });
      messageApi.success(
        `Converted to ${r.ticketNumber}: The action item is now a ticket visible in the client portal.`
      );
      load();
      onMutated();
    } catch (err: any) {
      messageApi.error(`Conversion failed: ${err?.message}`);
    } finally {
      setConvertingId(null);
    }
  };

  const handleDelete = async () => {
    if (!mom) return;
    try {
      await momService.remove(mom.id);
      messageApi.success("Meeting deleted");
      onMutated();
      onClose();
    } catch (err: any) {
      messageApi.error(`Delete failed: ${err?.message}`);
    }
  };

  return (
    <>
    <Drawer
      open={!!id}
      onClose={onClose}
      width={680}
      title={null}
      closable={false}
      styles={{
        mask: { backgroundColor: c.overlay },
        content: { background: c.surfaceElevated },
        header: { display: "none" },
        body: { padding: 0, background: c.surfaceElevated },
      }}
    >
      {!mom || loading ? (
        <div
          style={{
            minHeight: "60vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: c.textSubtle,
          }}
        >
          {loading ? "Loading…" : <Empty description="Nothing to show" />}
        </div>
      ) : (
        <>
          {/* Header */}
          <div
            style={{
              padding: "20px 22px 14px",
              borderBottom: `1px solid ${c.border}`,
              display: "flex",
              gap: 14,
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: c.accentBg,
                border: `1px solid ${c.accentBorder}`,
                color: c.accentText,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Calendar size={18} />
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
                <span
                  style={{
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, monospace",
                    fontSize: 11.5,
                    padding: "1px 7px",
                    background: c.surfaceMuted,
                    border: `1px solid ${c.border}`,
                    borderRadius: 6,
                    color: c.textMuted,
                  }}
                >
                  {mom.momNumber}
                </span>
                {mom.status === "draft" && (
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 500,
                      padding: "1px 7px",
                      background: c.warningBg,
                      border: `1px solid ${c.warningBorder}`,
                      color: c.warningText,
                      borderRadius: 999,
                    }}
                  >
                    Draft
                  </span>
                )}
                {mom.visibility === "internal" && (
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 500,
                      padding: "1px 7px",
                      background: c.surfaceMuted,
                      border: `1px solid ${c.border}`,
                      color: c.textSubtle,
                      borderRadius: 999,
                    }}
                  >
                    Internal only
                  </span>
                )}
              </div>
              <h2
                style={{
                  margin: "6px 0 0",
                  fontSize: 18,
                  fontWeight: 600,
                  color: c.text,
                  letterSpacing: "-0.01em",
                }}
              >
                {mom.title}
              </h2>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 12.5,
                  color: c.textSubtle,
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
                  <Clock size={11} />
                  {fmtDateTime(mom.meetingDate)}
                </span>
                {mom.durationMinutes && <span>· {mom.durationMinutes} min</span>}
                {mom.projectName && <span>· {mom.projectName}</span>}
                {mom.location && <span>· {mom.location}</span>}
              </div>
              {mom.recordingUrl && (
                <a
                  href={mom.recordingUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    marginTop: 8,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "4px 9px",
                    background: c.surfaceMuted,
                    border: `1px solid ${c.border}`,
                    borderRadius: 7,
                    color: c.accentText,
                    textDecoration: "none",
                    fontSize: 12,
                  }}
                >
                  <Video size={12} />
                  Recording
                  <ExternalLink size={11} />
                </a>
              )}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <Popconfirm
                title="Delete this meeting?"
                description="Action items already converted to tickets will remain."
                onConfirm={handleDelete}
                okText="Delete"
                okButtonProps={{ danger: true }}
              >
                <Button size="small" danger icon={<Trash2 size={13} />} />
              </Popconfirm>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 18 }}>
            {mom.summary && (
              <Section title="Summary" icon={<Lightbulb size={12} />} c={c}>
                <div
                  style={{
                    fontSize: 13.5,
                    color: c.textMuted,
                    lineHeight: 1.55,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {mom.summary}
                </div>
              </Section>
            )}

            {mom.attendees.length > 0 && (
              <Section
                title={`Attendees · ${mom.attendees.length}`}
                icon={<Users size={12} />}
                c={c}
              >
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                  }}
                >
                  {mom.attendees.map((a) => (
                    <span
                      key={a.id || a.name}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "4px 10px",
                        background: c.surfaceMuted,
                        border: `1px solid ${c.border}`,
                        borderRadius: 999,
                        fontSize: 12,
                        color: c.text,
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>{a.name}</span>
                      {a.role && (
                        <span style={{ color: c.textSubtle, fontSize: 11.5 }}>
                          · {a.role}
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: 10,
                          padding: "0px 6px",
                          background: c.surfaceElevated,
                          border: `1px solid ${c.border}`,
                          color: c.textSubtle,
                          borderRadius: 999,
                        }}
                      >
                        {a.party || "client"}
                      </span>
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {mom.decisions.length > 0 && (
              <Section
                title={`Decisions · ${mom.decisions.length}`}
                icon={<Lightbulb size={12} />}
                c={c}
              >
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {mom.decisions.map((d) => (
                    <li
                      key={d.id || d.decision}
                      style={{
                        fontSize: 13,
                        color: c.textMuted,
                        marginBottom: 4,
                      }}
                    >
                      {d.decision}
                      {d.decidedBy && (
                        <span style={{ color: c.textSubtle }}>
                          {" "}
                          · {d.decidedBy}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {mom.attachments && mom.attachments.length > 0 && (
              <Section
                title={`Attachments · ${mom.attachments.length}`}
                icon={<Paperclip size={12} />}
                c={c}
              >
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                  }}
                >
                  {mom.attachments.map((a) => (
                    <AttachmentViewerCard
                      key={a.id}
                      a={a}
                      c={c}
                      onView={() => setPreviewDoc(a)}
                      onDownload={async () => {
                        const url = a.kind === "file" ? a.fileUrl : a.linkUrl;
                        const filename = a.kind === "file" ? (a.fileName || "download") : "link";
                        if (!url) return;
                        // Use the local proxy route to force a direct download without CORS or new tab issues
                        const proxyUrl = `/api/download?url=${encodeURIComponent(url)}&name=${encodeURIComponent(filename)}`;
                        const link = document.createElement("a");
                        link.href = proxyUrl;
                        link.download = filename;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                    />
                  ))}
                </div>
              </Section>
            )}

            <Section
              title={`Action items · ${mom.actionItems.length}`}
              icon={<ListChecks size={12} />}
              c={c}
            >
              {mom.actionItems.length === 0 ? (
                <div style={{ fontSize: 12.5, color: c.textSubtle }}>
                  No action items recorded.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {mom.actionItems.map((ai) => {
                    const t = tone(c, ai.status || "open");
                    const isConverted = !!ai.convertedToId;
                    return (
                      <div
                        key={ai.id}
                        style={{
                          padding: 12,
                          background: c.surfaceMuted,
                          border: `1px solid ${c.border}`,
                          borderRadius: 10,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 12,
                            alignItems: "flex-start",
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 13.5,
                                fontWeight: 500,
                                color: c.text,
                                lineHeight: 1.5,
                              }}
                            >
                              {ai.text}
                            </div>
                            <div
                              style={{
                                marginTop: 5,
                                display: "flex",
                                gap: 10,
                                flexWrap: "wrap",
                                alignItems: "center",
                                fontSize: 11.5,
                                color: c.textSubtle,
                              }}
                            >
                              {ai.ownerName && (
                                <span>👤 {ai.ownerName}</span>
                              )}
                              {ai.dueDate && (
                                <span>Due {fmtDate(ai.dueDate)}</span>
                              )}
                              <span
                                style={{
                                  padding: "1px 7px",
                                  background: t.bg,
                                  border: `1px solid ${t.border}`,
                                  color: t.text,
                                  borderRadius: 999,
                                  fontWeight: 500,
                                }}
                              >
                                {ACTION_STATUS_LABEL[ai.status || "open"]}
                              </span>
                              {isConverted && ai.convertedTicketNumber && (
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 3,
                                    padding: "1px 7px",
                                    background: c.purpleBg,
                                    border: `1px solid ${c.purpleBorder}`,
                                    color: c.purpleText,
                                    borderRadius: 999,
                                    fontWeight: 500,
                                    fontFamily:
                                      "ui-monospace, SFMono-Regular, Menlo, monospace",
                                  }}
                                >
                                  <GitPullRequest size={10} />
                                  {ai.convertedTicketNumber}
                                </span>
                              )}
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 6 }}>
                            {!isConverted && (
                              <>
                                <Select
                                  size="small"
                                  value={ai.status || "open"}
                                  style={{ width: 130 }}
                                  onChange={(v) =>
                                    handleStatusChange(ai.id!, v as any)
                                  }
                                  options={[
                                    { value: "open", label: "Open" },
                                    {
                                      value: "in_progress",
                                      label: "In progress",
                                    },
                                    { value: "done", label: "Done" },
                                    { value: "cancelled", label: "Cancelled" },
                                  ]}
                                />
                                <Tooltip title="Convert to a portal support ticket">
                                  <Button
                                    size="small"
                                    type="primary"
                                    icon={<ArrowRight size={12} />}
                                    loading={convertingId === ai.id}
                                    onClick={() => handleConvert(ai.id!)}
                                  >
                                    Ticket
                                  </Button>
                                </Tooltip>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Section>
          </div>
        </>
      )}
    </Drawer>

    <Drawer
      placement="left"
      width={720}
      open={!!previewDoc}
      onClose={() => setPreviewDoc(null)}
      title={previewDoc?.kind === "file" ? previewDoc?.fileName : (previewDoc?.linkLabel || previewDoc?.linkUrl)}
      styles={{ body: { padding: 0 } }}
      closeIcon={<X size={16} />}
    >
      {previewDoc && (
        (() => {
          const url = previewDoc.kind === "file" ? previewDoc.fileUrl : previewDoc.linkUrl;
          const info = getDocPreview(url);
          if (!info) return <div style={{ padding: 24, textAlign: 'center' }}>No preview available.</div>;
          
          if (info.kind === "image") {
            return (
              <div style={{ padding: 24, textAlign: 'center', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={info.src} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} alt="Preview" />
              </div>
            );
          }
          return (
            <iframe
              src={info.src}
              style={{ width: "100%", height: "100%", border: "none" }}
              title="Preview"
            />
          );
        })()
      )}
    </Drawer>
    </>
  );
}

function Section({
  title,
  icon,
  c,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  c: ReturnType<typeof palette>;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: c.textSubtle,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 8,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}
