"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Spin, Empty, notification, Input } from "antd";
import {
  ArrowLeft,
  Send,
  FileText,
  Download,
  Activity,
  User as UserIcon,
  Building2,
  Hash,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  portalTicketService,
  PortalTicketDetail,
  PortalTicketMessage,
} from "@/services/portalTicketService";
import {
  p,
  TONE,
  CATEGORY_META,
  PRIORITY_META,
  STATUS_META,
  fmtDateTime,
  fmtRelative,
} from "../_ticketUi";
import { AttachmentPicker } from "@/app/portal/_components/AttachmentPicker";

/* --------------------------------------------------------------- */

export default function PortalTicketDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [ticket, setTicket] = useState<PortalTicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notify, contextHolder] = notification.useNotification();

  const load = async () => {
    if (!id) return;
    try {
      const data = await portalTicketService.detail(id);
      setTicket(data);
    } catch {
      setTicket(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }
  if (!ticket) {
    return (
      <div style={{ padding: 48 }}>
        <Empty description="Ticket not found" />
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button
            onClick={() => router.push("/portal/tickets")}
            style={{
              padding: "8px 14px",
              background: p.text,
              color: "#ffffff",
              border: `1px solid ${p.text}`,
              borderRadius: 8,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Back to tickets
          </button>
        </div>
      </div>
    );
  }

  const cat = CATEGORY_META[ticket.category] || CATEGORY_META.other;
  const pri = PRIORITY_META[ticket.priority] || PRIORITY_META.medium;
  const st = STATUS_META[ticket.status] || STATUS_META.new;
  const StIcon = st.icon;
  const CatIcon = cat.icon;
  const canReply = ticket.status !== "closed";

  return (
    <div style={{ padding: "32px 40px 56px", maxWidth: 1100 }}>
      {contextHolder}

      {/* Back */}
      <button
        type="button"
        onClick={() => router.push("/portal/tickets")}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 8px",
          background: "transparent",
          border: "none",
          color: p.textMuted,
          fontSize: 13,
          cursor: "pointer",
          marginBottom: 14,
        }}
      >
        <ArrowLeft size={14} />
        Back to tickets
      </button>

      {/* Header card */}
      <div
        style={{
          padding: 24,
          background: p.surfaceElevated,
          border: `1px solid ${p.border}`,
          borderRadius: 14,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", gap: 14, minWidth: 0, flex: 1 }}>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 10,
                background: TONE[cat.tone].bg,
                color: TONE[cat.tone].text,
                border: `1px solid ${TONE[cat.tone].border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <CatIcon size={20} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
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
                    background: p.surfaceMuted,
                    border: `1px solid ${p.border}`,
                    borderRadius: 6,
                    color: p.textMuted,
                  }}
                >
                  {ticket.ticketNumber}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: p.textSubtle,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {cat.label}
                </span>
              </div>
              <h1
                style={{
                  margin: "6px 0 0",
                  fontSize: 22,
                  fontWeight: 600,
                  color: p.text,
                  letterSpacing: "-0.01em",
                  lineHeight: 1.25,
                }}
              >
                {ticket.subject}
              </h1>
              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <Pill
                  bg={TONE[st.tone].bg}
                  border={TONE[st.tone].border}
                  text={TONE[st.tone].text}
                  icon={<StIcon size={11} />}
                >
                  {st.label}
                </Pill>
                <Pill
                  bg={TONE[pri.tone].bg}
                  border={TONE[pri.tone].border}
                  text={TONE[pri.tone].text}
                >
                  {pri.label} priority
                </Pill>
              </div>
            </div>
          </div>
        </div>

        {/* Meta grid */}
        <div
          style={{
            marginTop: 18,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 0,
            border: `1px solid ${p.border}`,
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          <MetaCell
            label="Raised"
            value={fmtDateTime(ticket.createdAt)}
            icon={<Hash size={11} />}
          />
          <MetaCell
            label="Last activity"
            value={fmtRelative(ticket.lastActivityAt)}
            icon={<Clock size={11} />}
          />
          <MetaCell
            label="Project"
            value={ticket.projectName || "—"}
            icon={<Building2 size={11} />}
          />
          <MetaCell
            label="Assigned"
            value={ticket.assignedStaffName || "Unassigned"}
            icon={<UserIcon size={11} />}
          />
        </div>

        {/* SLA strip */}
        {(ticket.sla.firstResponseDueAt || ticket.sla.resolutionDueAt) && (
          <div
            style={{
              marginTop: 14,
              padding: "10px 14px",
              background: ticket.sla.firstResponseBreached ||
              ticket.sla.resolutionBreached
                ? p.dangerBg
                : p.accentBg,
              border: `1px solid ${
                ticket.sla.firstResponseBreached ||
                ticket.sla.resolutionBreached
                  ? p.dangerBorder
                  : p.accentBorder
              }`,
              borderRadius: 10,
              color:
                ticket.sla.firstResponseBreached ||
                ticket.sla.resolutionBreached
                  ? p.dangerText
                  : p.accentText,
              fontSize: 12.5,
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            {ticket.sla.firstResponseDueAt && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {ticket.sla.firstResponseBreached ? (
                  <AlertTriangle size={12} />
                ) : (
                  <CheckCircle2 size={12} />
                )}
                First response{" "}
                {ticket.firstResponseAt
                  ? `· received ${fmtRelative(ticket.firstResponseAt)}`
                  : `target ${fmtDateTime(ticket.sla.firstResponseDueAt)}`}
              </span>
            )}
            {ticket.sla.resolutionDueAt && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {ticket.sla.resolutionBreached ? (
                  <AlertTriangle size={12} />
                ) : (
                  <CheckCircle2 size={12} />
                )}
                Resolution{" "}
                {ticket.resolvedAt
                  ? `· resolved ${fmtRelative(ticket.resolvedAt)}`
                  : `target ${fmtDateTime(ticket.sla.resolutionDueAt)}`}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Conversation */}
      <div
        style={{
          background: p.surfaceElevated,
          border: `1px solid ${p.border}`,
          borderRadius: 14,
          padding: 22,
          marginBottom: canReply ? 16 : 0,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: p.textSubtle,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 14,
          }}
        >
          Conversation · {ticket.messages.length} message
          {ticket.messages.length === 1 ? "" : "s"}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {ticket.messages.map((m) =>
            m.isSystemEvent ? (
              <SystemEvent key={m.id} m={m} />
            ) : (
              <MessageBubble key={m.id} m={m} />
            ),
          )}
        </div>
      </div>

      {/* Reply box */}
      {canReply && <ReplyBox ticketId={ticket.id} notify={notify} onSent={load} />}
      {!canReply && (
        <div
          style={{
            padding: 16,
            textAlign: "center",
            background: p.neutralBg,
            border: `1px dashed ${p.border}`,
            borderRadius: 12,
            color: p.textSubtle,
            fontSize: 13,
          }}
        >
          This ticket is closed. Please raise a new one if you need further
          help.
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- */

function Pill({
  bg,
  border,
  text,
  icon,
  children,
}: {
  bg: string;
  border: string;
  text: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        background: bg,
        border: `1px solid ${border}`,
        color: text,
        borderRadius: 999,
        fontSize: 11.5,
        fontWeight: 500,
      }}
    >
      {icon}
      {children}
    </span>
  );
}

function MetaCell({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: "12px 14px",
        background: p.surfaceMuted,
        borderRight: `1px solid ${p.border}`,
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          fontSize: 10.5,
          fontWeight: 600,
          color: p.textSubtle,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {icon}
        {label}
      </div>
      <div
        style={{
          marginTop: 4,
          fontSize: 13,
          fontWeight: 500,
          color: p.text,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function MessageBubble({ m }: { m: PortalTicketMessage }) {
  const isStaff = m.authorType === "staff";
  const authorName =
    m.authorType === "portal"
      ? m.portalUserName || m.portalUserEmail || "You"
      : m.staffUserName || "Team member";

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        flexDirection: isStaff ? "row-reverse" : "row",
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 8,
          background: isStaff ? p.accentBg : p.purpleBg,
          color: isStaff ? p.accentText : p.purpleText,
          border: `1px solid ${isStaff ? p.accentBorder : p.purpleBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        {(authorName || "?").substring(0, 2).toUpperCase()}
      </div>
      <div
        style={{
          maxWidth: "min(680px, 80%)",
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: 4,
          alignItems: isStaff ? "flex-end" : "flex-start",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            gap: 8,
            alignItems: "center",
            fontSize: 11.5,
            color: p.textSubtle,
            flexDirection: isStaff ? "row-reverse" : "row",
          }}
        >
          <span style={{ fontWeight: 600, color: p.text }}>{authorName}</span>
          <span style={{ color: p.textFaint }}>·</span>
          <span>{fmtDateTime(m.createdAt)}</span>
        </div>
        <div
          style={{
            padding: "12px 14px",
            background: isStaff ? p.accentBg : p.surfaceMuted,
            border: `1px solid ${isStaff ? p.accentBorder : p.border}`,
            borderRadius: 10,
            color: p.text,
            fontSize: 13.5,
            lineHeight: 1.55,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {m.body}
        </div>
        {m.attachments && m.attachments.length > 0 && (
          <div
            style={{
              marginTop: 4,
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              justifyContent: isStaff ? "flex-end" : "flex-start",
            }}
          >
            {m.attachments.map((a) => (
              <a
                key={a.fileUrl}
                href={a.fileUrl}
                download={a.fileName}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 10px",
                  background: "#ffffff",
                  border: `1px solid ${p.border}`,
                  borderRadius: 8,
                  fontSize: 12,
                  color: p.accentText,
                  textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                <FileText size={12} />
                {a.fileName}
                <Download size={11} />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SystemEvent({ m }: { m: PortalTicketMessage }) {
  const desc =
    m.eventType === "status_change"
      ? `Status changed from ${prettify(m.eventFrom)} → ${prettify(m.eventTo)}`
      : m.eventType === "assignment"
      ? `Assignment changed${m.eventTo ? ` to staff member` : ""}`
      : m.eventType === "attachment_upload_failed"
      ? `Attachment upload failed${m.body ? `: ${m.body}` : ""}`
      : "System event";
  return (
    <div
      style={{
        textAlign: "center",
        padding: "6px 0",
        color: p.textSubtle,
        fontSize: 11.5,
        display: "flex",
        alignItems: "center",
        gap: 8,
        justifyContent: "center",
      }}
    >
      <Activity size={11} />
      <span>
        {desc} · {fmtRelative(m.createdAt)}
      </span>
    </div>
  );
}

function prettify(s: string | null) {
  if (!s) return "—";
  return s.replace(/_/g, " ");
}

/* --------------------------------------------------------------- */

function ReplyBox({
  ticketId,
  notify,
  onSent,
}: {
  ticketId: string;
  notify: any;
  onSent: () => void;
}) {
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<
    { dataUrl: string; name: string; size: number }[]
  >([]);
  const [sending, setSending] = useState(false);

  const handleFile = (f: File) => {
    if (f.size > 10 * 1024 * 1024) {
      notify.error({ message: `${f.name} exceeds 10 MB` });
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      setFiles((prev) => [
        ...prev,
        { dataUrl: String(reader.result), name: f.name, size: f.size },
      ]);
    reader.readAsDataURL(f);
  };

  const send = async () => {
    if (!body.trim()) return;
    setSending(true);
    try {
      await portalTicketService.reply(ticketId, {
        body: body.trim(),
        attachments: files.map((f) => ({
          dataUrl: f.dataUrl,
          fileName: f.name,
        })),
      });
      setBody("");
      setFiles([]);
      onSent();
    } catch (err: any) {
      notify.error({ message: "Send failed", description: err?.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      style={{
        background: p.surfaceElevated,
        border: `1px solid ${p.border}`,
        borderRadius: 14,
        padding: 18,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: p.textSubtle,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 10,
        }}
      >
        Reply
      </div>
      <Input.TextArea
        rows={4}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Type your reply…"
        style={{ marginBottom: 10 }}
      />
      <div style={{ marginBottom: 12 }}>
        <AttachmentPicker
          files={files}
          onAdd={handleFile}
          onRemove={(i) =>
            setFiles((prev) => prev.filter((_, idx) => idx !== i))
          }
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <button
          onClick={send}
          disabled={sending || !body.trim()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            background: p.text,
            color: "#ffffff",
            border: `1px solid ${p.text}`,
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: sending || !body.trim() ? "not-allowed" : "pointer",
            opacity: sending || !body.trim() ? 0.6 : 1,
          }}
        >
          <Send size={13} />
          {sending ? "Sending…" : "Send reply"}
        </button>
      </div>
    </div>
  );
}
