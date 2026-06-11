"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Spin, notification } from "antd";
import {
  ArrowLeft,
  Send,
  FileText,
  Download,
  Activity,
  User as UserIcon,
  Clock,
  CheckCircle2,
  AlertTriangle,
  LifeBuoy,
  Folder,
  MessageCircle,
  Calendar,
  Info,
  Shield,
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
  fmtDate,
  fmtDateTime,
  fmtRelative,
} from "../_ticketUi";
import { AttachmentPicker } from "@/app/portal/_components/AttachmentPicker";

const INDIGO = "#4f46e5";
const INDIGO_BG = "#eef2ff";
const INDIGO_BORDER = "#c7d2fe";
const INDIGO_TEXT = "#4338ca";
const SURFACE_TINTED = "#fafbff";

function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function prettify(s: string | null) {
  if (!s) return "—";
  return s.replace(/_/g, " ");
}

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
      <div style={{ padding: "48px 40px" }}>
        <EmptyState
          title="Ticket not found"
          body="The link may be wrong, or this ticket no longer exists."
          ctaLabel="Back to tickets"
          onCta={() => router.push("/portal/tickets")}
        />
      </div>
    );
  }

  const canReply = ticket.status !== "closed";
  const slaBreached =
    ticket.sla.firstResponseBreached || ticket.sla.resolutionBreached;
  const waitingOnClient = ticket.status === "waiting_on_client";

  return (
    <div
      style={{
        height: "100vh",
        overflowY: "auto",
        backgroundColor: "#ffffff",
      }}
    >
      {contextHolder}

      {/* Sticky header */}
      <StickyHeader
        ticket={ticket}
        onBack={() => router.push("/portal/tickets")}
      />

      <div
        className="portal-ticket-details-content"
        style={{ padding: "20px 40px 64px", maxWidth: 1200 }}
      >
        {/* Hero band */}
        <HeroBand ticket={ticket} />

        {/* Waiting-on-client banner */}
        {waitingOnClient && <WaitingBanner ticketId={ticket.id} />}

        {/* SLA banner */}
        {(ticket.sla.firstResponseDueAt || ticket.sla.resolutionDueAt) && (
          <SlaBanner ticket={ticket} breached={slaBreached} />
        )}

        {/* Body: single column (tickets don't carry linked entities right now) */}
        <div style={{ marginTop: 16 }}>
          <ConversationCard
            ticket={ticket}
            canReply={canReply}
            notify={notify}
            onPosted={load}
          />
        </div>
      </div>

      <style jsx global>{`
        .ant-input, .ant-input-affix-wrapper, .ant-input-textarea, textarea.ant-input {
          background-color: #ffffff !important;
          color: #0f172a !important;
          border-color: #e5e7eb !important;
          border-radius: 8px !important;
        }
        .ant-input::placeholder {
          color: #94a3b8 !important;
        }
        .ant-input-affix-wrapper:hover, .ant-input:hover, textarea.ant-input:hover {
          border-color: #a5b4fc !important;
        }
        .ant-input-affix-wrapper-focused, .ant-input-focused, textarea.ant-input:focus {
          border-color: #4f46e5 !important;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12) !important;
        }

        .premium-back-btn {
          transition: background 140ms ease, color 140ms ease;
        }
        .premium-back-btn:hover {
          background: #f1f5f9 !important;
          color: #0f172a !important;
        }
        .premium-cta-primary {
          transition: background 140ms ease, gap 140ms ease;
        }
        .premium-cta-primary:hover {
          background: #4338ca !important;
        }
        .premium-attachment-chip:hover {
          border-color: #a5b4fc !important;
          color: #4338ca !important;
        }

        @media (max-width: 640px) {
          .portal-ticket-details-header {
            padding: 12px 16px !important;
          }
          .portal-ticket-details-content {
            padding: 16px 16px 40px !important;
          }
          .portal-sla-banner {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 8px !important;
          }
        }
      `}</style>
    </div>
  );
}

/* --------------------------------------------------------------- */

function StickyHeader({
  ticket,
  onBack,
}: {
  ticket: PortalTicketDetail;
  onBack: () => void;
}) {
  const st = STATUS_META[ticket.status] || STATUS_META.new;
  const StIcon = st.icon;
  const tone = TONE[st.tone];
  return (
    <div
      className="portal-ticket-details-header"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        backgroundColor: "#ffffff",
        borderBottom: `1px solid ${p.border}`,
        padding: "12px 40px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          maxWidth: 1200,
        }}
      >
        <button
          type="button"
          onClick={onBack}
          className="premium-back-btn"
          aria-label="Back"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 10px",
            background: "transparent",
            border: "none",
            color: p.textMuted,
            fontSize: 12.5,
            fontWeight: 600,
            cursor: "pointer",
            borderRadius: 7,
            flexShrink: 0,
          }}
        >
          <ArrowLeft size={14} />
          Tickets
        </button>
        <div
          style={{
            width: 1,
            height: 18,
            background: p.border,
            flexShrink: 0,
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            minWidth: 0,
            flex: 1,
          }}
        >
          <span
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 11.5,
              padding: "1px 7px",
              background: p.surfaceMuted,
              border: `1px solid ${p.border}`,
              borderRadius: 5,
              color: p.textMuted,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {ticket.ticketNumber}
          </span>
          <span
            style={{
              fontSize: 13.5,
              fontWeight: 700,
              color: p.text,
              letterSpacing: "-0.005em",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {ticket.subject}
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "2px 8px",
              background: tone.bg,
              border: `1px solid ${tone.border}`,
              color: tone.text,
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            <StIcon size={10} />
            {st.label}
          </span>
        </div>
      </div>
    </div>
  );
}

function HeroBand({ ticket }: { ticket: PortalTicketDetail }) {
  const cat = CATEGORY_META[ticket.category] || CATEGORY_META.other;
  const pri = PRIORITY_META[ticket.priority] || PRIORITY_META.medium;
  const catTone = TONE[cat.tone];
  const priTone = TONE[pri.tone];
  const CatIcon = cat.icon;
  return (
    <div
      style={{
        position: "relative",
        padding: "22px 24px 22px 28px",
        background: SURFACE_TINTED,
        border: `1px solid ${p.border}`,
        borderRadius: 14,
        marginBottom: 14,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: `linear-gradient(180deg, ${INDIGO}, ${p.accent})`,
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 10,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            background: catTone.bg,
            border: `1px solid ${catTone.border}`,
            color: catTone.text,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CatIcon size={15} />
        </div>
        <span
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 11.5,
            padding: "2px 8px",
            background: "#ffffff",
            border: `1px solid ${p.border}`,
            borderRadius: 5,
            color: p.textMuted,
            fontWeight: 600,
          }}
        >
          {ticket.ticketNumber}
        </span>
        <span
          style={{
            padding: "2px 8px",
            background: catTone.bg,
            border: `1px solid ${catTone.border}`,
            color: catTone.text,
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {cat.label}
        </span>
        <span
          style={{
            padding: "2px 8px",
            background: priTone.bg,
            border: `1px solid ${priTone.border}`,
            color: priTone.text,
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {pri.label} priority
        </span>
        {ticket.projectName && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11.5,
              color: p.textSubtle,
              fontWeight: 600,
            }}
          >
            <Folder size={11} color={p.textFaint} />
            {ticket.projectName}
          </span>
        )}
      </div>
      <h1
        style={{
          margin: 0,
          fontSize: 22,
          fontWeight: 700,
          color: p.text,
          letterSpacing: "-0.015em",
          lineHeight: 1.25,
        }}
      >
        {ticket.subject}
      </h1>
      <div
        style={{
          marginTop: 10,
          display: "flex",
          gap: 14,
          flexWrap: "wrap",
          fontSize: 12,
          color: p.textSubtle,
        }}
      >
        <MetaItem
          icon={Clock}
          label="Raised"
          value={fmtDateTime(ticket.createdAt)}
        />
        <MetaItem
          icon={Activity}
          label="Last activity"
          value={fmtRelative(ticket.lastActivityAt)}
        />
        <MetaItem
          icon={UserIcon}
          label="Assigned to"
          value={ticket.assignedStaffName || "Unassigned"}
        />
        {ticket.dueDate && (
          <MetaItem
            icon={Calendar}
            label="Due"
            value={fmtDate(ticket.dueDate)}
          />
        )}
      </div>
    </div>
  );
}

function MetaItem({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
      }}
    >
      <Icon size={11} color={p.textFaint} />
      <span style={{ color: p.textFaint, fontWeight: 500 }}>{label}:</span>
      <span style={{ color: p.text, fontWeight: 600 }}>{value}</span>
    </span>
  );
}

/* --------------------------------------------------------------- */

function WaitingBanner({ ticketId }: { ticketId: string }) {
  return (
    <div
      style={{
        position: "relative",
        marginBottom: 14,
        padding: "14px 18px 14px 22px",
        background: "linear-gradient(180deg, #fffbeb 0%, #ffffff 60%)",
        border: `1px solid ${p.warningBorder}`,
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        gap: 14,
        flexWrap: "wrap",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: `linear-gradient(180deg, ${p.warning}, #f97316)`,
        }}
      />
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 9,
          background: p.warningBg,
          border: `1px solid ${p.warningBorder}`,
          color: p.warningText,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Clock size={17} />
      </div>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 700,
            color: p.text,
            letterSpacing: "-0.005em",
          }}
        >
          Waiting on you
        </div>
        <div
          style={{
            fontSize: 12.5,
            color: p.textMuted,
            marginTop: 2,
          }}
        >
          We need more info before we can move forward. Reply below to keep
          this ticket moving.
        </div>
      </div>
      <a
        href={`#reply-${ticketId}`}
        className="premium-cta-primary"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 14px",
          background: INDIGO,
          color: "#ffffff",
          border: "none",
          borderRadius: 8,
          fontSize: 12.5,
          fontWeight: 600,
          cursor: "pointer",
          textDecoration: "none",
        }}
      >
        <Send size={13} />
        Reply now
      </a>
    </div>
  );
}

function SlaBanner({
  ticket,
  breached,
}: {
  ticket: PortalTicketDetail;
  breached: boolean;
}) {
  const bg = breached ? p.dangerBg : "#ffffff";
  const border = breached ? p.dangerBorder : p.border;
  const accent = breached ? p.danger : INDIGO;
  return (
    <div
      className="portal-sla-banner"
      style={{
        position: "relative",
        marginBottom: 14,
        padding: "12px 16px 12px 20px",
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 11,
        display: "flex",
        gap: 18,
        flexWrap: "wrap",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: accent,
        }}
      />
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          fontSize: 10.5,
          fontWeight: 700,
          color: breached ? p.dangerText : p.textMuted,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          flexShrink: 0,
        }}
      >
        <Shield size={12} />
        SLA
      </div>
      {ticket.sla.firstResponseDueAt && (
        <SlaItem
          label="First response"
          target={ticket.sla.firstResponseDueAt}
          metAt={ticket.firstResponseAt}
          breached={ticket.sla.firstResponseBreached}
        />
      )}
      {ticket.sla.resolutionDueAt && (
        <SlaItem
          label="Resolution"
          target={ticket.sla.resolutionDueAt}
          metAt={ticket.resolvedAt}
          breached={ticket.sla.resolutionBreached}
        />
      )}
    </div>
  );
}

function SlaItem({
  label,
  target,
  metAt,
  breached,
}: {
  label: string;
  target: string;
  metAt: string | null;
  breached: boolean;
}) {
  const met = !!metAt;
  const Icon = met ? CheckCircle2 : breached ? AlertTriangle : Clock;
  const tone = met
    ? { color: p.successText }
    : breached
    ? { color: p.dangerText }
    : { color: p.textMuted };
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        fontSize: 12,
        color: tone.color,
        fontWeight: 500,
      }}
    >
      <Icon size={13} />
      <span style={{ fontWeight: 700 }}>{label}:</span>
      <span style={{ fontWeight: 600 }}>
        {met
          ? `met ${fmtRelative(metAt)}`
          : breached
          ? `breached · target was ${fmtDateTime(target)}`
          : `target ${fmtDateTime(target)}`}
      </span>
    </div>
  );
}

/* --------------------------------------------------------------- */

function ConversationCard({
  ticket,
  canReply,
  notify,
  onPosted,
}: {
  ticket: PortalTicketDetail;
  canReply: boolean;
  notify: any;
  onPosted: () => void;
}) {
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<
    { dataUrl: string; name: string; size: number }[]
  >([]);
  const [sending, setSending] = useState(false);
  const [composerFocused, setComposerFocused] = useState(false);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);

  const messageCount = useMemo(
    () => ticket.messages.filter((m) => !m.isSystemEvent).length,
    [ticket.messages],
  );

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
      await portalTicketService.reply(ticket.id, {
        body: body.trim(),
        attachments: files.map((f) => ({
          dataUrl: f.dataUrl,
          fileName: f.name,
        })),
      });
      setBody("");
      setFiles([]);
      onPosted();
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
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "10px 16px",
          background: p.surfaceMuted,
          borderBottom: `1px solid ${p.border}`,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: 5,
            background: INDIGO_BG,
            border: `1px solid ${INDIGO_BORDER}`,
            color: INDIGO_TEXT,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <MessageCircle size={11} />
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: p.textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Conversation
        </span>
        <span
          style={{
            fontSize: 11,
            color: p.textSubtle,
            fontWeight: 500,
          }}
        >
          · {messageCount} message{messageCount === 1 ? "" : "s"}
        </span>
      </div>
      <div style={{ padding: "18px 20px 0" }}>
        {ticket.messages.length === 0 ? (
          <div
            style={{
              padding: "32px 0 20px",
              textAlign: "center",
              fontSize: 12.5,
              color: p.textSubtle,
            }}
          >
            No messages yet. Start the conversation below.
          </div>
        ) : (
          <Timeline messages={ticket.messages} />
        )}
      </div>
      {canReply ? (
        <div
          id={`reply-${ticket.id}`}
          style={{
            padding: "14px 20px 20px",
            borderTop: `1px solid ${p.border}`,
            marginTop: 14,
            background: SURFACE_TINTED,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              border: `1px solid ${composerFocused ? INDIGO : p.border}`,
              borderRadius: 10,
              boxShadow: composerFocused
                ? "0 0 0 3px rgba(99, 102, 241, 0.12)"
                : "none",
              transition: "border-color 140ms ease, box-shadow 140ms ease",
            }}
          >
            <textarea
              ref={composerRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onFocus={() => setComposerFocused(true)}
              onBlur={() => setComposerFocused(false)}
              placeholder="Type your reply… (Cmd/Ctrl + Enter to send)"
              rows={3}
              onKeyDown={(e) => {
                if (
                  (e.metaKey || e.ctrlKey) &&
                  e.key === "Enter" &&
                  body.trim() &&
                  !sending
                ) {
                  e.preventDefault();
                  send();
                }
              }}
              style={{
                width: "100%",
                padding: "12px 14px",
                background: "transparent",
                border: "none",
                outline: "none",
                resize: "vertical",
                color: p.text,
                fontSize: 13.5,
                lineHeight: 1.55,
                fontFamily: "inherit",
                minHeight: 70,
              }}
            />
            <div
              style={{
                padding: "8px 10px 10px",
                borderTop: files.length > 0 ? `1px solid ${p.border}` : "none",
              }}
            >
              {files.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <AttachmentPicker
                    files={files}
                    onAdd={handleFile}
                    onRemove={(i) =>
                      setFiles((prev) => prev.filter((_, idx) => idx !== i))
                    }
                  />
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                {files.length === 0 ? (
                  <AttachmentPicker
                    files={files}
                    onAdd={handleFile}
                    onRemove={(i) =>
                      setFiles((prev) => prev.filter((_, idx) => idx !== i))
                    }
                  />
                ) : (
                  <span style={{ fontSize: 11, color: p.textSubtle }}>
                    {files.length} attachment{files.length === 1 ? "" : "s"}
                  </span>
                )}
                <button
                  onClick={send}
                  disabled={sending || !body.trim()}
                  className="premium-cta-primary"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 14px",
                    background: INDIGO,
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 7,
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: sending || !body.trim() ? "not-allowed" : "pointer",
                    opacity: sending || !body.trim() ? 0.55 : 1,
                  }}
                >
                  <Send size={13} />
                  {sending ? "Sending…" : "Send reply"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: "14px 18px",
            margin: 18,
            marginTop: 14,
            background: SURFACE_TINTED,
            border: `1px dashed ${p.neutralBorder}`,
            borderRadius: 10,
            fontSize: 12.5,
            color: p.textSubtle,
            textAlign: "center",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            justifyContent: "center",
            width: "calc(100% - 36px)",
          }}
        >
          <Info size={12} />
          This ticket is closed. Raise a new one if you need further help.
        </div>
      )}
    </div>
  );
}

function Timeline({ messages }: { messages: PortalTicketMessage[] }) {
  return (
    <div
      style={{
        position: "relative",
        paddingLeft: 24,
        paddingBottom: 6,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 11,
          top: 6,
          bottom: 6,
          width: 1,
          background: p.border,
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {messages.map((m) =>
          m.isSystemEvent ? (
            <SystemNode key={m.id} m={m} />
          ) : (
            <MessageNode key={m.id} m={m} />
          ),
        )}
      </div>
    </div>
  );
}

function MessageNode({ m }: { m: PortalTicketMessage }) {
  const isStaff = m.authorType === "staff";
  const name =
    m.authorType === "portal"
      ? m.portalUserName || m.portalUserEmail || "You"
      : m.staffUserName || "Team member";

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          position: "absolute",
          left: -24,
          top: 2,
          width: 22,
          height: 22,
          borderRadius: 999,
          background: isStaff ? INDIGO_BG : "#ffffff",
          border: `1px solid ${isStaff ? INDIGO_BORDER : p.borderStrong}`,
          color: isStaff ? INDIGO_TEXT : p.textMuted,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 9,
          fontWeight: 700,
        }}
      >
        {initials(name)}
      </div>
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 6,
            marginBottom: 5,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 12.5, fontWeight: 700, color: p.text }}>
            {name}
          </span>
          {isStaff && (
            <span
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                padding: "1px 6px",
                background: INDIGO_BG,
                border: `1px solid ${INDIGO_BORDER}`,
                color: INDIGO_TEXT,
                borderRadius: 999,
                textTransform: "uppercase",
                letterSpacing: "0.07em",
              }}
            >
              Team
            </span>
          )}
          <span style={{ fontSize: 11, color: p.textSubtle }}>·</span>
          <span
            style={{
              fontSize: 11,
              color: p.textSubtle,
              fontWeight: 500,
            }}
            title={fmtDateTime(m.createdAt)}
          >
            {fmtRelative(m.createdAt)}
          </span>
        </div>
        {m.body && (
          <div
            style={{
              padding: "11px 14px",
              background: isStaff ? SURFACE_TINTED : p.surface,
              border: `1px solid ${isStaff ? INDIGO_BORDER : p.border}`,
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
        )}
        {m.attachments && m.attachments.length > 0 && (
          <div
            style={{
              marginTop: 6,
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
            }}
          >
            {m.attachments.map((a) => (
              <a
                key={a.fileUrl}
                href={a.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="premium-attachment-chip"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 10px",
                  background: "#ffffff",
                  border: `1px solid ${p.border}`,
                  borderRadius: 7,
                  fontSize: 12,
                  color: p.textMuted,
                  textDecoration: "none",
                  fontWeight: 500,
                  transition: "border-color 140ms ease, color 140ms ease",
                }}
              >
                <FileText size={11} color={INDIGO} />
                {a.fileName}
                <Download size={10} />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SystemNode({ m }: { m: PortalTicketMessage }) {
  const desc =
    m.eventType === "status_change"
      ? `Status: ${prettify(m.eventFrom)} → ${prettify(m.eventTo)}`
      : m.eventType === "assignment"
      ? "Assignment changed"
      : m.eventType === "attachment_upload_failed"
      ? `Attachment upload failed${m.body ? `: ${m.body}` : ""}`
      : m.eventType === "sla_breach"
      ? "SLA breached"
      : m.body || "System event";

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          position: "absolute",
          left: -19,
          top: 7,
          width: 11,
          height: 11,
          borderRadius: 999,
          background: "#ffffff",
          border: `1.5px solid ${p.textFaint}`,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            width: 4,
            height: 4,
            borderRadius: 999,
            background: p.textFaint,
          }}
        />
      </div>
      <div
        style={{
          fontSize: 11.5,
          color: p.textSubtle,
          fontWeight: 500,
          paddingTop: 2,
        }}
      >
        <span style={{ color: p.textMuted, fontWeight: 600 }}>{desc}</span>
        <span style={{ margin: "0 6px", color: p.textFaint }}>·</span>
        <span title={fmtDateTime(m.createdAt)}>{fmtRelative(m.createdAt)}</span>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- */

function EmptyState({
  title,
  body,
  ctaLabel,
  onCta,
}: {
  title: string;
  body: string;
  ctaLabel?: string;
  onCta?: () => void;
}) {
  return (
    <div
      style={{
        padding: 56,
        textAlign: "center",
        background: SURFACE_TINTED,
        border: `1px dashed ${p.neutralBorder}`,
        borderRadius: 12,
        maxWidth: 520,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 11,
          background: p.surface,
          border: `1px solid ${p.border}`,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 14,
        }}
      >
        <LifeBuoy size={18} color={p.textFaint} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: p.text }}>
        {title}
      </div>
      <div style={{ fontSize: 12.5, color: p.textSubtle, marginTop: 4 }}>
        {body}
      </div>
      {ctaLabel && onCta && (
        <div style={{ marginTop: 16 }}>
          <button
            onClick={onCta}
            className="premium-cta-primary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              background: INDIGO,
              color: "#ffffff",
              border: "none",
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <ArrowLeft size={13} />
            {ctaLabel}
          </button>
        </div>
      )}
    </div>
  );
}
