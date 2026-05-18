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
  notification,
  Tooltip,
  Popconfirm,
  Empty,
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
import {
  PremiumModal,
  ModalSection,
  ModalFooterActions,
  FieldLabel as FLabel,
} from "./_PremiumModal";

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
  const [openId, setOpenId] = useState<string | null>(null);
  const [notify, contextHolder] = notification.useNotification();

  const load = async () => {
    setLoading(true);
    try {
      const data = await momService.listForClient(clientId);
      setItems(data || []);
    } catch (err: any) {
      notify.error({
        message: "Failed to load meetings",
        description: err?.message,
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

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
            <Calendar size={20} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: c.text }}>
              Meeting minutes
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
              Capture decisions and action items from your meetings with the
              client. Action items can be converted into portal tickets in
              one click.
            </div>
          </div>
        </div>
        <Button
          type="primary"
          icon={<Plus size={15} />}
          onClick={() => setCreateOpen(true)}
        >
          New meeting
        </Button>
      </div>

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
            <Calendar size={22} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: c.text }}>
            No meetings logged yet
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: 13,
              color: c.textSubtle,
              maxWidth: 420,
              margin: "6px auto 0",
            }}
          >
            Log your first MOM to start tracking action items and decisions
            with this client.
          </div>
          <div style={{ marginTop: 18 }}>
            <Button
              type="primary"
              icon={<Plus size={15} />}
              onClick={() => setCreateOpen(true)}
            >
              Log first meeting
            </Button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((m) => (
            <MeetingRow
              key={m.id}
              mom={m}
              c={c}
              onOpen={() => setOpenId(m.id)}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      <CreateMeetingModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false);
          load();
        }}
        clientId={clientId}
        projects={projects}
        contacts={contacts}
        c={c}
        notify={notify}
      />

      {/* Detail drawer */}
      <MomDetailDrawer
        id={openId}
        c={c}
        notify={notify}
        onClose={() => setOpenId(null)}
        onMutated={load}
      />
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
  notify,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  clientId: string;
  projects: { id: string; name: string; code?: string | null }[];
  contacts: ClientContactOption[];
  c: ReturnType<typeof palette>;
  notify: any;
}) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
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
    form.setFieldsValue({
      visibility: "client",
      status: "published",
      meetingDate: dayjs(),
    });
    // Pre-fetch staff users so the "internal" attendee picker is instant.
    // teamService.staffOptions is the same endpoint the Team tab uses —
    // tenant-scoped, ~50 results, supports `?search=` for narrowing.
    teamService
      .staffOptions(clientId, "")
      .then((list) => setStaffOptions(list || []))
      .catch(() => setStaffOptions([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async (values: any) => {
    if (!values.title?.trim()) {
      notify.error({ message: "Title is required" });
      return;
    }
    setSubmitting(true);
    try {
      await momService.create(clientId, {
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
            (a.kind === "file" && a.fileDataUrl && a.fileName) ||
            (a.kind === "link" && a.linkUrl?.trim()),
        ),
      });
      notify.success({ message: "Meeting logged" });
      onCreated();
    } catch (err: any) {
      notify.error({
        message: "Could not log meeting",
        description: err?.message,
      });
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
      title="Log a meeting"
      subtitle="Captured here for the audit trail and shared with the client portal when visibility is set to Client."
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
            onClick={() => form.submit()}
            icon={<Calendar size={14} />}
          >
            Save meeting
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
            notify={notify}
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
  notify,
}: {
  c: ReturnType<typeof palette>;
  value: MomAttachmentInput[];
  onChange: (next: MomAttachmentInput[]) => void;
  notify: any;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [adding, setAdding] = useState<null | "link">(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((f) => {
      if (f.size > 25 * 1024 * 1024) {
        notify.error({ message: `${f.name} exceeds 25 MB` });
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
        notify.error({
          message: "Only http(s) links are supported",
        });
        return;
      }
      // The URL constructor is too lenient — "https://Project Overview"
      // parses successfully because spaces are allowed in the path. Require
      // a hostname with a dot (real TLD) so labels can't masquerade as URLs.
      if (!parsed.hostname.includes(".")) {
        notify.error({
          message: "That doesn't look like a valid URL",
          description: "URL must include a real domain (e.g. example.com)",
        });
        return;
      }
    } catch {
      notify.error({
        message: "That doesn't look like a valid URL",
        description: cleaned,
      });
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
      {/* Existing list */}
      {value.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            marginBottom: 10,
          }}
        >
          {value.map((a, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                background: c.surfaceElevated,
                border: `1px solid ${c.border}`,
                borderRadius: 8,
                fontSize: 12.5,
              }}
            >
              {a.kind === "file" ? (
                <FileText size={13} color={c.textSubtle} />
              ) : (
                <Link2 size={13} color={c.accentText} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    color: c.text,
                    fontWeight: 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {a.kind === "file"
                    ? a.fileName
                    : a.linkLabel || a.linkUrl}
                </div>
                {a.kind === "link" && a.linkLabel && (
                  <div
                    style={{
                      fontSize: 11.5,
                      color: c.textSubtle,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {a.linkUrl}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeAt(i)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: c.textSubtle,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add buttons */}
      {adding !== "link" ? (
        <div style={{ display: "flex", gap: 8 }}>
          <input
            ref={inputRef}
            type="file"
            multiple
            hidden
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            style={{
              flex: 1,
              padding: "10px 12px",
              background: c.surfaceElevated,
              border: `1px dashed ${c.borderStrong}`,
              borderRadius: 9,
              cursor: "pointer",
              color: c.textMuted,
              fontSize: 12.5,
              fontWeight: 500,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <UploadIcon size={13} />
            Upload file
          </button>
          <button
            type="button"
            onClick={() => setAdding("link")}
            style={{
              flex: 1,
              padding: "10px 12px",
              background: c.surfaceElevated,
              border: `1px dashed ${c.borderStrong}`,
              borderRadius: 9,
              cursor: "pointer",
              color: c.textMuted,
              fontSize: 12.5,
              fontWeight: 500,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Link2 size={13} />
            Paste link
          </button>
        </div>
      ) : (
        <div
          style={{
            padding: 10,
            background: c.surfaceElevated,
            border: `1px solid ${c.border}`,
            borderRadius: 9,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <Input
            size="small"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            prefix={<Link2 size={12} color={c.textFaint} />}
            placeholder="https://docs.example.com/doc/…"
            autoFocus
          />
          <Input
            size="small"
            value={linkLabel}
            onChange={(e) => setLinkLabel(e.target.value)}
            placeholder="Optional label (e.g. Sprint 4 retro doc)"
          />
          <div
            style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}
          >
            <Button
              size="small"
              onClick={() => {
                setAdding(null);
                setLinkUrl("");
                setLinkLabel("");
              }}
            >
              Cancel
            </Button>
            <Button
              size="small"
              type="primary"
              onClick={addLink}
              disabled={!linkUrl.trim()}
              icon={<Plus size={12} />}
            >
              Add link
            </Button>
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

/* --------------------------------------------------------------- */

function MomDetailDrawer({
  id,
  c,
  notify,
  onClose,
  onMutated,
}: {
  id: string | null;
  c: ReturnType<typeof palette>;
  notify: any;
  onClose: () => void;
  onMutated: () => void;
}) {
  const [mom, setMom] = useState<MomDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      setMom(await momService.detail(id));
    } catch (err: any) {
      notify.error({ message: "Failed to load", description: err?.message });
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
      notify.error({
        message: "Update failed",
        description: err?.message,
      });
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
      notify.success({
        message: `Converted to ${r.ticketNumber}`,
        description: "The action item is now a ticket visible in the client portal.",
      });
      load();
      onMutated();
    } catch (err: any) {
      notify.error({
        message: "Conversion failed",
        description: err?.message,
      });
    } finally {
      setConvertingId(null);
    }
  };

  const handleDelete = async () => {
    if (!mom) return;
    try {
      await momService.remove(mom.id);
      notify.success({ message: "Meeting deleted" });
      onMutated();
      onClose();
    } catch (err: any) {
      notify.error({ message: "Delete failed", description: err?.message });
    }
  };

  return (
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
                    <a
                      key={a.id}
                      href={a.kind === "file" ? a.fileUrl || "#" : a.linkUrl || "#"}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "5px 11px",
                        background: c.surfaceMuted,
                        border: `1px solid ${c.border}`,
                        borderRadius: 8,
                        color: c.accentText,
                        textDecoration: "none",
                        fontSize: 12.5,
                        fontWeight: 500,
                        maxWidth: 280,
                      }}
                      title={a.kind === "file" ? a.fileName ?? "" : a.linkUrl ?? ""}
                    >
                      {a.kind === "file" ? (
                        <FileText size={12} />
                      ) : (
                        <Link2 size={12} />
                      )}
                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {a.kind === "file"
                          ? a.fileName
                          : a.linkLabel || a.linkUrl}
                      </span>
                      <ExternalLink size={10} />
                    </a>
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
