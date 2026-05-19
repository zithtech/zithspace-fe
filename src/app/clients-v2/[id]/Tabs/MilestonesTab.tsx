"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Form,
  Input,
  Select,
  DatePicker,
  notification,
  Popconfirm,
  Tooltip,
} from "antd";
import {
  Plus,
  Flag,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  PauseCircle,
  XCircle,
  Edit3,
  Trash2,
  FolderKanban,
  ListChecks,
  X,
  CheckSquare,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import dayjs from "dayjs";
import {
  milestoneService,
  Milestone,
  MilestoneItem,
  MilestoneStatus,
  CreateMilestonePayload,
} from "@/services/milestoneService";
import { useTheme } from "@/context/ThemeContext";
import {
  PremiumModal,
  ModalSection,
  ModalFooterActions,
} from "./_PremiumModal";

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
    neutral: {
      bg: c.surfaceMuted,
      border: c.border,
      text: c.textSubtle,
    },
  };
}

const STATUS_META: Record<
  MilestoneStatus,
  {
    label: string;
    tone: keyof ReturnType<typeof tonesOf>;
    icon: any;
    color: string;
  }
> = {
  not_started: { label: "Not started", tone: "neutral", icon: Circle, color: "#94a3b8" },
  in_progress: { label: "In progress", tone: "warning", icon: Clock, color: "#f59e0b" },
  completed: { label: "Completed", tone: "success", icon: CheckCircle2, color: "#10b981" },
  on_hold: { label: "On hold", tone: "purple", icon: PauseCircle, color: "#8b5cf6" },
  cancelled: { label: "Cancelled", tone: "danger", icon: XCircle, color: "#ef4444" },
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

export default function MilestonesTab({ clientId, projects = [] }: Props) {
  const { theme } = useTheme();
  const c = useMemo(() => palette(theme as Mode), [theme]);
  const tones = useMemo(() => tonesOf(c), [c]);

  const [items, setItems] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Milestone | null>(null);
  const [notify, contextHolder] = notification.useNotification();

  const load = async () => {
    setLoading(true);
    try {
      setItems(await milestoneService.list(clientId));
    } catch (err: any) {
      notify.error({ message: "Failed to load milestones", description: err?.message });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const remove = async (m: Milestone) => {
    try {
      await milestoneService.remove(m.id);
      notify.success({ message: "Milestone removed" });
      load();
    } catch (err: any) {
      notify.error({ message: "Delete failed", description: err?.message });
    }
  };

  const counts = useMemo(() => {
    const total = items.length;
    const completed = items.filter((m) => m.status === "completed").length;
    const inProgress = items.filter((m) => m.status === "in_progress").length;
    const itemsTotal = items.reduce((a, m) => a + m.itemsTotal, 0);
    const itemsDone = items.reduce((a, m) => a + m.itemsDone, 0);
    return { total, completed, inProgress, itemsTotal, itemsDone };
  }, [items]);

  return (
    <div style={{ padding: "4px 0 24px", color: c.text }}>
      {contextHolder}

      {/* Header */}
      <div
        style={{
          padding: 22,
          background: c.surfaceElevated,
          border: `1px solid ${c.border}`,
          borderRadius: 14,
          marginBottom: 16,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 24,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: 16, flex: 1, minWidth: 280 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: c.accentBg,
              color: c.accentText,
              border: `1px solid ${c.accentBorder}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Flag size={20} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: c.text }}>
              Delivery tracker
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 13,
                color: c.textSubtle,
                lineHeight: 1.55,
                maxWidth: 580,
              }}
            >
              Milestones the client should know about, with a breakdown of the
              work behind each one. When every breakdown item is checked, the
              milestone auto-completes.
            </div>
          </div>
        </div>
        <Button
          type="primary"
          icon={<Plus size={15} />}
          onClick={() => {
            setEditing(null);
            setCreateOpen(true);
          }}
        >
          Add milestone
        </Button>
      </div>

      {/* Summary strip */}
      {items.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <SummaryStat
            c={c}
            tone={tones.accent}
            icon={Flag}
            label="Milestones"
            value={String(counts.total)}
          />
          <SummaryStat
            c={c}
            tone={tones.warning}
            icon={Clock}
            label="In progress"
            value={String(counts.inProgress)}
          />
          <SummaryStat
            c={c}
            tone={tones.success}
            icon={CheckCircle2}
            label="Completed"
            value={String(counts.completed)}
          />
          <SummaryStat
            c={c}
            tone={tones.purple}
            icon={ListChecks}
            label="Items done"
            value={`${counts.itemsDone} / ${counts.itemsTotal}`}
          />
        </div>
      )}

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
            setCreateOpen(true);
          }}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map((m) => (
            <MilestoneCard
              key={m.id}
              milestone={m}
              c={c}
              tones={tones}
              onEdit={() => {
                setEditing(m);
                setCreateOpen(true);
              }}
              onRemove={() => remove(m)}
              onChanged={load}
              notify={notify}
            />
          ))}
        </div>
      )}

      <MilestoneModal
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
        notify={notify}
      />
    </div>
  );
}

/* --------------------------------------------------------------- */

function SummaryStat({
  c,
  tone,
  icon: Icon,
  label,
  value,
}: {
  c: ReturnType<typeof palette>;
  tone: { bg: string; border: string; text: string };
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        padding: 14,
        background: c.surfaceElevated,
        border: `1px solid ${c.border}`,
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 9,
          background: tone.bg,
          color: tone.text,
          border: `1px solid ${tone.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={17} />
      </div>
      <div>
        <div
          style={{
            fontSize: 10.5,
            color: c.textSubtle,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {label}
        </div>
        <div
          style={{
            marginTop: 2,
            fontSize: 17,
            fontWeight: 700,
            color: c.text,
            letterSpacing: "-0.01em",
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

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
        <Flag size={22} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: c.text }}>
        No milestones yet
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
        Lay out the delivery plan as milestones — "Landing page", "Auth",
        "Payments" — with a breakdown of the work behind each one.
      </div>
      <div style={{ marginTop: 18 }}>
        <Button type="primary" icon={<Plus size={15} />} onClick={onAdd}>
          Add first milestone
        </Button>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- */

function MilestoneCard({
  milestone,
  c,
  tones,
  onEdit,
  onRemove,
  onChanged,
  notify,
}: {
  milestone: Milestone;
  c: ReturnType<typeof palette>;
  tones: ReturnType<typeof tonesOf>;
  onEdit: () => void;
  onRemove: () => void;
  onChanged: () => void;
  notify: any;
}) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const statusMeta = STATUS_META[milestone.status] || STATUS_META.not_started;
  const StatusIcon = statusMeta.icon;

  const overdue =
    milestone.estEndDate &&
    milestone.status !== "completed" &&
    milestone.status !== "cancelled" &&
    dayjs(milestone.estEndDate).isBefore(dayjs(), "day");

  const toggleItem = async (it: MilestoneItem) => {
    try {
      await milestoneService.updateItem(it.id, { isCompleted: !it.isCompleted });
      onChanged();
    } catch (err: any) {
      notify.error({ message: "Update failed", description: err?.message });
    }
  };

  const removeItem = async (it: MilestoneItem) => {
    try {
      await milestoneService.removeItem(it.id);
      onChanged();
    } catch (err: any) {
      notify.error({ message: "Delete failed", description: err?.message });
    }
  };

  const addItem = async () => {
    const name = newItemName.trim();
    if (!name) return;
    setAdding(true);
    try {
      await milestoneService.addItem(milestone.id, { name });
      setNewItemName("");
      onChanged();
    } catch (err: any) {
      notify.error({ message: "Add failed", description: err?.message });
    } finally {
      setAdding(false);
    }
  };

  return (
    <div
      style={{
        background: c.surfaceElevated,
        border: `1px solid ${c.border}`,
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      {/* Top row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "16px 18px",
          cursor: "pointer",
        }}
        onClick={() => setOpen((o) => !o)}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: tones[statusMeta.tone].bg,
            color: tones[statusMeta.tone].text,
            border: `1px solid ${tones[statusMeta.tone].border}`,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <StatusIcon size={17} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: 14.5,
                fontWeight: 600,
                color: c.text,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: 480,
              }}
            >
              {milestone.name}
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "1px 8px",
                background: tones[statusMeta.tone].bg,
                border: `1px solid ${tones[statusMeta.tone].border}`,
                color: tones[statusMeta.tone].text,
                borderRadius: 999,
                fontSize: 10.5,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              {statusMeta.label}
            </span>
            {milestone.projectName && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  color: c.textSubtle,
                }}
              >
                <FolderKanban size={11} />
                {milestone.projectName}
              </span>
            )}
          </div>
          <div
            style={{
              marginTop: 6,
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              fontSize: 11.5,
              color: c.textSubtle,
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Calendar size={11} />
              {fmtDate(milestone.estStartDate)} → {fmtDate(milestone.estEndDate)}
            </span>
            {milestone.actualEndDate && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  color: tones.success.text,
                }}
              >
                <CheckCircle2 size={11} />
                Delivered {fmtDate(milestone.actualEndDate)}
              </span>
            )}
            {overdue && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  color: tones.danger.text,
                  fontWeight: 600,
                }}
              >
                Overdue
              </span>
            )}
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <ListChecks size={11} />
              {milestone.itemsDone}/{milestone.itemsTotal} items
            </span>
          </div>
          {/* Progress bar */}
          <div style={{ marginTop: 8 }}>
            <div
              style={{
                position: "relative",
                height: 6,
                background: c.surfaceMuted,
                border: `1px solid ${c.border}`,
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  width: `${milestone.progress}%`,
                  background:
                    milestone.status === "completed"
                      ? "linear-gradient(90deg, #10b981, #14b8a6)"
                      : "linear-gradient(90deg, #8b5cf6, #6366f1)",
                  transition: "width 220ms ease",
                }}
              />
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 11,
                color: c.textFaint,
                fontWeight: 500,
              }}
            >
              {milestone.progress}% complete
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <Tooltip title="Edit">
            <Button
              size="small"
              type="text"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              icon={<Edit3 size={13} color={c.textSubtle} />}
            />
          </Tooltip>
          <Popconfirm
            title="Remove milestone?"
            description="Items inside are removed too."
            onConfirm={(e: any) => {
              e?.stopPropagation?.();
              onRemove();
            }}
            okText="Remove"
            okButtonProps={{ danger: true }}
          >
            <Button
              size="small"
              type="text"
              onClick={(e) => e.stopPropagation()}
              icon={<Trash2 size={13} color={c.textSubtle} />}
            />
          </Popconfirm>
          <Button
            size="small"
            type="text"
            onClick={(e) => {
              e.stopPropagation();
              setOpen((o) => !o);
            }}
            icon={
              open ? (
                <ChevronDown size={14} color={c.textSubtle} />
              ) : (
                <ChevronRight size={14} color={c.textSubtle} />
              )
            }
          />
        </div>
      </div>

      {/* Expanded body */}
      {open && (
        <div
          style={{
            padding: "0 18px 18px",
            borderTop: `1px solid ${c.border}`,
          }}
        >
          {milestone.description && (
            <div
              style={{
                marginTop: 14,
                padding: "10px 12px",
                background: c.surfaceMuted,
                border: `1px solid ${c.border}`,
                borderRadius: 8,
                fontSize: 12.5,
                color: c.textMuted,
                lineHeight: 1.55,
                whiteSpace: "pre-wrap",
              }}
            >
              {milestone.description}
            </div>
          )}

          <div
            style={{
              marginTop: 14,
              fontSize: 11,
              fontWeight: 600,
              color: c.textSubtle,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <ListChecks size={12} />
            Breakdown
          </div>

          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
            {milestone.items.length === 0 && (
              <div style={{ fontSize: 12, color: c.textFaint, padding: 6 }}>
                No breakdown items yet. Add the work below.
              </div>
            )}
            {milestone.items.map((it) => (
              <ItemRow
                key={it.id}
                item={it}
                c={c}
                tones={tones}
                onToggle={() => toggleItem(it)}
                onRemove={() => removeItem(it)}
              />
            ))}
          </div>

          <div
            style={{
              marginTop: 10,
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <Input
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Add a breakdown item (Frontend, Backend, Integration…)"
              onPressEnter={addItem}
              size="middle"
            />
            <Button
              type="primary"
              icon={<Plus size={14} />}
              onClick={addItem}
              loading={adding}
              disabled={!newItemName.trim()}
            >
              Add
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ItemRow({
  item,
  c,
  tones,
  onToggle,
  onRemove,
}: {
  item: MilestoneItem;
  c: ReturnType<typeof palette>;
  tones: ReturnType<typeof tonesOf>;
  onToggle: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 10px",
        background: item.isCompleted ? tones.success.bg : c.surfaceMuted,
        border: `1px solid ${item.isCompleted ? tones.success.border : c.border}`,
        borderRadius: 8,
        transition: "all 120ms ease",
      }}
    >
      <button
        onClick={onToggle}
        type="button"
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          background: item.isCompleted ? tones.success.text : c.surfaceElevated,
          border: `1px solid ${item.isCompleted ? tones.success.text : c.borderStrong}`,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "#ffffff",
          padding: 0,
          flexShrink: 0,
        }}
        aria-label={item.isCompleted ? "Mark incomplete" : "Mark complete"}
      >
        {item.isCompleted && <CheckSquare size={14} />}
      </button>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: 13,
            color: c.text,
            textDecoration: item.isCompleted ? "line-through" : "none",
            opacity: item.isCompleted ? 0.7 : 1,
          }}
        >
          {item.name}
        </div>
        {item.description && (
          <div
            style={{
              marginTop: 2,
              fontSize: 11.5,
              color: c.textSubtle,
            }}
          >
            {item.description}
          </div>
        )}
      </div>
      <button
        onClick={onRemove}
        type="button"
        style={{
          width: 24,
          height: 24,
          borderRadius: 5,
          background: "transparent",
          border: "none",
          color: c.textFaint,
          cursor: "pointer",
          padding: 0,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        aria-label="Remove item"
      >
        <X size={13} />
      </button>
    </div>
  );
}

/* --------------------------------------------------------------- */

function MilestoneModal({
  open,
  editing,
  clientId,
  projects,
  onClose,
  onSaved,
  c,
  notify,
}: {
  open: boolean;
  editing: Milestone | null;
  clientId: string;
  projects: { id: string; name: string; code?: string | null }[];
  onClose: () => void;
  onSaved: () => void;
  c: ReturnType<typeof palette>;
  notify: any;
}) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [itemDrafts, setItemDrafts] = useState<{ name: string }[]>([]);
  const [draftInput, setDraftInput] = useState("");

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setItemDrafts([]);
      setDraftInput("");
      return;
    }
    if (editing) {
      form.setFieldsValue({
        name: editing.name,
        description: editing.description || undefined,
        status: editing.status,
        projectId: editing.projectId || undefined,
        estStartDate: editing.estStartDate ? dayjs(editing.estStartDate) : null,
        estEndDate: editing.estEndDate ? dayjs(editing.estEndDate) : null,
        actualEndDate: editing.actualEndDate ? dayjs(editing.actualEndDate) : null,
      });
    } else {
      form.setFieldsValue({ status: "not_started" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const addDraft = () => {
    const v = draftInput.trim();
    if (!v) return;
    setItemDrafts((arr) => [...arr, { name: v }]);
    setDraftInput("");
  };

  const submit = async (v: any) => {
    setSubmitting(true);
    try {
      const payload: CreateMilestonePayload = {
        name: v.name.trim(),
        description: v.description?.trim() || undefined,
        status: v.status,
        projectId: v.projectId || undefined,
        estStartDate: v.estStartDate ? v.estStartDate.format("YYYY-MM-DD") : null,
        estEndDate: v.estEndDate ? v.estEndDate.format("YYYY-MM-DD") : null,
        actualEndDate: v.actualEndDate ? v.actualEndDate.format("YYYY-MM-DD") : null,
      };
      if (editing) {
        await milestoneService.update(editing.id, payload);
        notify.success({ message: "Milestone updated" });
      } else {
        await milestoneService.create(clientId, {
          ...payload,
          items: itemDrafts.length > 0 ? itemDrafts : undefined,
        });
        notify.success({ message: "Milestone created" });
      }
      onSaved();
    } catch (err: any) {
      notify.error({ message: "Save failed", description: err?.message });
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
      ribbonColor={c.accentText}
      iconTile={{ bg: c.accentBg, border: c.accentBorder, text: c.accentText }}
      icon={<Flag size={20} />}
      title={editing ? "Edit milestone" : "Add milestone"}
      subtitle={
        editing
          ? "Update the milestone details. Manage breakdown items inline on the card."
          : "Define a delivery checkpoint. Optionally seed it with a breakdown of the work."
      }
      footer={
        <ModalFooterActions c={c} kbdHint="⌘ ↵ to save">
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            onClick={() => form.submit()}
            icon={<Plus size={14} />}
          >
            {editing ? "Save changes" : "Create milestone"}
          </Button>
        </ModalFooterActions>
      }
    >
      <Form form={form} layout="vertical" onFinish={submit} requiredMark={false}>
        <ModalSection
          c={c}
          title="What ships"
          description="A short name and what's being delivered. Visible in the client portal."
          icon={<Flag size={11} />}
          plain
        >
          <Form.Item
            name="name"
            label={<L c={c}>Milestone name</L>}
            rules={[{ required: true, message: "Required" }]}
            style={{ marginBottom: 12 }}
          >
            <Input placeholder="e.g. Landing page, Auth, Payments" maxLength={200} />
          </Form.Item>
          <Form.Item
            name="description"
            label={<L c={c} hint="optional">Description</L>}
            style={{ marginBottom: 0 }}
          >
            <Input.TextArea
              rows={3}
              placeholder="What the client gets when this lands…"
              maxLength={1000}
              showCount
            />
          </Form.Item>
        </ModalSection>

        <ModalSection
          c={c}
          title="Status & dates"
          description="Status is auto-managed by the breakdown items, but you can override."
          icon={<Calendar size={11} />}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              marginBottom: 12,
            }}
          >
            <Form.Item
              name="status"
              label={<L c={c}>Status</L>}
              style={{ marginBottom: 0 }}
            >
              <Select
                options={(Object.keys(STATUS_META) as MilestoneStatus[]).map(
                  (k) => ({ value: k, label: STATUS_META[k].label }),
                )}
              />
            </Form.Item>
            <Form.Item
              name="projectId"
              label={
                <L c={c} hint={`${projects.length} linked`}>
                  Project
                </L>
              }
              style={{ marginBottom: 0 }}
            >
              <Select
                allowClear
                placeholder="—"
                disabled={projects.length === 0}
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
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 10,
            }}
          >
            <Form.Item
              name="estStartDate"
              label={<L c={c}>EST start</L>}
              style={{ marginBottom: 0 }}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              name="estEndDate"
              label={<L c={c}>EST end</L>}
              style={{ marginBottom: 0 }}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              name="actualEndDate"
              label={<L c={c} hint="auto-set on complete">Actual end</L>}
              style={{ marginBottom: 0 }}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </div>
        </ModalSection>

        {!editing && (
          <ModalSection
            c={c}
            title="Breakdown items"
            description="Optional starter list — e.g. Frontend, Backend, Integration, Wire-up."
            icon={<ListChecks size={11} />}
          >
            <div
              style={{
                display: "flex",
                gap: 8,
                marginBottom: itemDrafts.length > 0 ? 10 : 0,
              }}
            >
              <Input
                value={draftInput}
                onChange={(e) => setDraftInput(e.target.value)}
                placeholder="e.g. Frontend"
                onPressEnter={(e) => {
                  e.preventDefault();
                  addDraft();
                }}
              />
              <Button onClick={addDraft} icon={<Plus size={13} />} disabled={!draftInput.trim()}>
                Add
              </Button>
            </div>
            {itemDrafts.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {itemDrafts.map((it, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 10px",
                      background: c.surfaceMuted,
                      border: `1px solid ${c.border}`,
                      borderRadius: 8,
                    }}
                  >
                    <Circle size={13} color={c.textFaint} />
                    <span style={{ flex: 1, fontSize: 13, color: c.text }}>
                      {it.name}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setItemDrafts((arr) => arr.filter((_, i) => i !== idx))
                      }
                      style={{
                        background: "transparent",
                        border: "none",
                        color: c.textFaint,
                        cursor: "pointer",
                        padding: 4,
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </ModalSection>
        )}
      </Form>
    </PremiumModal>
  );
}

/* --------------------------------------------------------------- */

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
