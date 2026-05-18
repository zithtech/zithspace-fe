"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Spin, Empty, notification, Input, Modal } from "antd";
import {
  ArrowLeft,
  GitPullRequest,
  Send,
  FileText,
  Download,
  Activity,
  CheckCircle2,
  XCircle,
  DollarSign,
  Calendar,
  Receipt,
  Clock,
  AlertTriangle,
  User as UserIcon,
} from "lucide-react";
import {
  portalCrService,
  PortalCrDetail,
  PortalCrMessage,
} from "@/services/portalCrService";
import {
  p,
  TONE,
  STATUS_META,
  PRIORITY_META,
  fmtCurrency,
  fmtDate,
  fmtDateTime,
  fmtRelative,
} from "../_crUi";
import { AttachmentPicker } from "@/app/portal/_components/AttachmentPicker";

/* --------------------------------------------------------------- */

export default function PortalCrDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [cr, setCr] = useState<PortalCrDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notify, contextHolder] = notification.useNotification();
  const [decisionOpen, setDecisionOpen] = useState<null | "approved" | "rejected">(
    null,
  );

  const load = async () => {
    if (!id) return;
    try {
      setCr(await portalCrService.detail(id));
    } catch {
      setCr(null);
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
  if (!cr) {
    return (
      <div style={{ padding: 48 }}>
        <Empty description="Change request not found" />
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button
            onClick={() => router.push("/portal/change-requests")}
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
            Back to change requests
          </button>
        </div>
      </div>
    );
  }

  const st = STATUS_META[cr.status] || STATUS_META.submitted;
  const pri = PRIORITY_META[cr.priority] || PRIORITY_META.medium;
  const StIcon = st.icon;
  const hasEstimate =
    cr.impactAnalysis ||
    cr.estimatedHoursMin ||
    cr.estimatedHoursMax ||
    cr.estimatedCost;
  const awaitingDecision = cr.status === "estimated" && !cr.clientDecision;
  const canReply = !["closed", "cancelled", "delivered"].includes(cr.status);

  return (
    <div style={{ padding: "32px 40px 56px", maxWidth: 1100 }}>
      {contextHolder}

      <button
        type="button"
        onClick={() => router.push("/portal/change-requests")}
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
        Back to change requests
      </button>

      {/* Header */}
      <div
        style={{
          padding: 24,
          background: p.surfaceElevated,
          border: `1px solid ${p.border}`,
          borderRadius: 14,
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 10,
              background: p.purpleBg,
              color: p.purpleText,
              border: `1px solid ${p.purpleBorder}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <GitPullRequest size={20} />
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
                {cr.crNumber}
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "3px 9px",
                  background: TONE[st.tone].bg,
                  border: `1px solid ${TONE[st.tone].border}`,
                  color: TONE[st.tone].text,
                  borderRadius: 999,
                  fontSize: 11.5,
                  fontWeight: 500,
                }}
              >
                <StIcon size={11} />
                {st.label}
              </span>
              <span
                style={{
                  padding: "2px 9px",
                  background: TONE[pri.tone].bg,
                  border: `1px solid ${TONE[pri.tone].border}`,
                  color: TONE[pri.tone].text,
                  borderRadius: 999,
                  fontSize: 11.5,
                  fontWeight: 500,
                }}
              >
                {pri.label} priority
              </span>
            </div>
            <h1
              style={{
                margin: "8px 0 0",
                fontSize: 22,
                fontWeight: 600,
                color: p.text,
                letterSpacing: "-0.01em",
                lineHeight: 1.25,
              }}
            >
              {cr.subject}
            </h1>
            <div
              style={{
                marginTop: 10,
                display: "flex",
                gap: 14,
                flexWrap: "wrap",
                fontSize: 12.5,
                color: p.textSubtle,
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Clock size={12} />
                Raised {fmtDateTime(cr.createdAt)}
              </span>
              {cr.projectName && <span>📁 {cr.projectName}</span>}
              {cr.assignedStaffName && (
                <span
                  style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                >
                  <UserIcon size={11} />
                  {cr.assignedStaffName}
                </span>
              )}
            </div>
            {cr.description && (
              <div
                style={{
                  marginTop: 12,
                  fontSize: 13.5,
                  color: p.textMuted,
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  maxWidth: 720,
                }}
              >
                {cr.description}
              </div>
            )}
          </div>
        </div>

        {/* Awaiting-decision banner */}
        {awaitingDecision && (
          <div
            style={{
              marginTop: 18,
              padding: "14px 16px",
              background: p.warningBg,
              border: `1px solid ${p.warningBorder}`,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <DollarSign size={18} color={p.warningText} />
              <div>
                <div
                  style={{
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: p.warningText,
                  }}
                >
                  Estimate ready — your decision needed
                </div>
                <div style={{ fontSize: 12, color: p.warningText }}>
                  Review the estimate below, then approve or reject. Work
                  starts once you approve.
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setDecisionOpen("rejected")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  background: "#ffffff",
                  color: p.dangerText,
                  border: `1px solid ${p.dangerBorder}`,
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <XCircle size={14} />
                Reject
              </button>
              <button
                onClick={() => setDecisionOpen("approved")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  background: p.success,
                  color: "#ffffff",
                  border: `1px solid ${p.success}`,
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <CheckCircle2 size={14} />
                Approve
              </button>
            </div>
          </div>
        )}
        {cr.clientDecision && (
          <div
            style={{
              marginTop: 18,
              padding: "12px 14px",
              background:
                cr.clientDecision === "approved" ? p.successBg : p.dangerBg,
              border: `1px solid ${
                cr.clientDecision === "approved"
                  ? p.successBorder
                  : p.dangerBorder
              }`,
              color:
                cr.clientDecision === "approved"
                  ? p.successText
                  : p.dangerText,
              borderRadius: 10,
              fontSize: 13,
            }}
          >
            You {cr.clientDecision} this estimate{" "}
            {fmtRelative(cr.clientDecisionAt)}
            {cr.clientDecisionNote && (
              <span style={{ fontStyle: "italic" }}>
                {" "}— &ldquo;{cr.clientDecisionNote}&rdquo;
              </span>
            )}
          </div>
        )}
      </div>

      {/* Two columns */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)",
          gap: 16,
          alignItems: "flex-start",
        }}
      >
        {/* Left: estimate + conversation */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {hasEstimate ? (
            <EstimateCard cr={cr} />
          ) : (
            <div
              style={{
                padding: 18,
                background: p.surfaceElevated,
                border: `1px dashed ${p.border}`,
                borderRadius: 12,
                fontSize: 13,
                color: p.textSubtle,
                lineHeight: 1.55,
              }}
            >
              No estimate yet. Our team is reviewing your request and will
              post the impact analysis + time and cost estimate here.
            </div>
          )}

          <ConversationCard
            cr={cr}
            canReply={canReply}
            notify={notify}
            onPosted={load}
          />
        </div>

        {/* Right: meta sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <SideCard title="Details" icon={Activity}>
            <Row label="Raised" value={fmtDateTime(cr.createdAt)} />
            <Row label="Last activity" value={fmtRelative(cr.lastActivityAt)} />
            {cr.projectName && (
              <Row
                label="Project"
                value={
                  cr.projectCode
                    ? `${cr.projectName} · ${cr.projectCode}`
                    : cr.projectName
                }
              />
            )}
            {cr.targetDeliveryDate && (
              <Row
                label="Target delivery"
                value={fmtDate(cr.targetDeliveryDate)}
              />
            )}
            {cr.assignedStaffName && (
              <Row label="Assigned to" value={cr.assignedStaffName} />
            )}
          </SideCard>

          {(cr.linkedInvoiceNumber || cr.linkedSprintVersion) && (
            <SideCard title="Links" icon={Receipt}>
              {cr.linkedInvoiceNumber && (
                <Row
                  label="Invoice"
                  value={
                    <a
                      href={`/portal/invoices/${cr.linkedInvoiceId}`}
                      style={{
                        color: p.accentText,
                        textDecoration: "none",
                        fontFamily:
                          "ui-monospace, SFMono-Regular, Menlo, monospace",
                      }}
                    >
                      {cr.linkedInvoiceNumber}
                    </a>
                  }
                />
              )}
              {cr.linkedSprintVersion && (
                <Row
                  label="Sprint"
                  value={
                    <a
                      href={`/portal/sprints/${cr.linkedSprintId}`}
                      style={{
                        color: p.accentText,
                        textDecoration: "none",
                      }}
                    >
                      {cr.linkedSprintVersion}
                    </a>
                  }
                />
              )}
            </SideCard>
          )}
        </div>
      </div>

      <DecisionModal
        decision={decisionOpen}
        onCancel={() => setDecisionOpen(null)}
        onConfirm={async (note) => {
          if (!decisionOpen || !cr) return;
          try {
            await portalCrService.decide(cr.id, decisionOpen, note);
            notify.success({
              message:
                decisionOpen === "approved"
                  ? "Approved — thank you"
                  : "Estimate rejected",
            });
            setDecisionOpen(null);
            load();
          } catch (err: any) {
            notify.error({
              message: "Decision failed",
              description: err?.message,
            });
          }
        }}
      />
    </div>
  );
}

/* --------------------------------------------------------------- */

function EstimateCard({ cr }: { cr: PortalCrDetail }) {
  const hoursText =
    cr.estimatedHoursMin || cr.estimatedHoursMax
      ? `${cr.estimatedHoursMin || "?"}–${cr.estimatedHoursMax || "?"} hours`
      : null;
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
          padding: "12px 18px",
          background: p.warningBg,
          borderBottom: `1px solid ${p.warningBorder}`,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <DollarSign size={14} color={p.warningText} />
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: p.warningText,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Estimate
        </div>
      </div>
      <div
        style={{
          padding: 18,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 14,
        }}
      >
        <Stat
          label="Cost"
          value={
            cr.estimatedCost
              ? fmtCurrency(cr.estimatedCost, cr.estimatedCurrency)
              : "—"
          }
          big
        />
        <Stat label="Effort" value={hoursText || "—"} />
        <Stat
          label="Target delivery"
          value={cr.targetDeliveryDate ? fmtDate(cr.targetDeliveryDate) : "—"}
        />
      </div>
      {cr.impactAnalysis && (
        <div
          style={{
            padding: "0 18px 18px",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: p.textSubtle,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 8,
            }}
          >
            Impact analysis
          </div>
          <div
            style={{
              fontSize: 13.5,
              color: p.textMuted,
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
              padding: "12px 14px",
              background: p.surfaceMuted,
              border: `1px solid ${p.border}`,
              borderRadius: 10,
            }}
          >
            {cr.impactAnalysis}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  big,
}: {
  label: string;
  value: string;
  big?: boolean;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 600,
          color: p.textSubtle,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 4,
          fontSize: big ? 22 : 15,
          fontWeight: 600,
          color: p.text,
          letterSpacing: "-0.01em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- */

function ConversationCard({
  cr,
  canReply,
  notify,
  onPosted,
}: {
  cr: PortalCrDetail;
  canReply: boolean;
  notify: any;
  onPosted: () => void;
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
      await portalCrService.reply(cr.id, {
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
          marginBottom: 12,
        }}
      >
        Conversation · {cr.messages.length}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {cr.messages.map((m) =>
          m.isSystemEvent ? (
            <SystemRow key={m.id} m={m} />
          ) : (
            <Bubble key={m.id} m={m} />
          ),
        )}
      </div>
      {canReply ? (
        <div style={{ marginTop: 14 }}>
          <Input.TextArea
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Reply…"
            style={{ marginBottom: 8 }}
          />
          <div style={{ marginBottom: 10 }}>
            <AttachmentPicker
              files={files}
              onAdd={handleFile}
              onRemove={(i) =>
                setFiles((prev) => prev.filter((_, idx) => idx !== i))
              }
            />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
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
              {sending ? "Sending…" : "Send"}
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            marginTop: 14,
            padding: 12,
            background: p.neutralBg,
            border: `1px dashed ${p.border}`,
            borderRadius: 8,
            fontSize: 12.5,
            color: p.textSubtle,
            textAlign: "center",
          }}
        >
          This change request is {STATUS_META[cr.status]?.label.toLowerCase()}.
          Replies are closed.
        </div>
      )}
    </div>
  );
}

function Bubble({ m }: { m: PortalCrMessage }) {
  const isStaff = m.authorType === "staff";
  const name =
    m.authorType === "portal"
      ? m.portalUserName || m.portalUserEmail || "You"
      : m.staffUserName || "Team member";
  return (
    <div
      style={{
        display: "flex",
        flexDirection: isStaff ? "row-reverse" : "row",
        gap: 10,
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 7,
          background: isStaff ? p.accentBg : p.purpleBg,
          color: isStaff ? p.accentText : p.purpleText,
          border: `1px solid ${isStaff ? p.accentBorder : p.purpleBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        {(name || "?")
          .split(" ")
          .map((s) => s[0])
          .filter(Boolean)
          .slice(0, 2)
          .join("")
          .toUpperCase()}
      </div>
      <div
        style={{
          maxWidth: "82%",
          display: "flex",
          flexDirection: "column",
          gap: 3,
          alignItems: isStaff ? "flex-end" : "flex-start",
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: p.textSubtle,
          }}
        >
          <strong style={{ color: p.text }}>{name}</strong> ·{" "}
          {fmtDateTime(m.createdAt)}
        </div>
        <div
          style={{
            padding: "10px 12px",
            background: isStaff ? p.accentBg : p.surfaceMuted,
            border: `1px solid ${isStaff ? p.accentBorder : p.border}`,
            borderRadius: 9,
            color: p.text,
            fontSize: 13.5,
            lineHeight: 1.55,
            whiteSpace: "pre-wrap",
          }}
        >
          {m.body}
        </div>
        {m.attachments && m.attachments.length > 0 && (
          <div
            style={{
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
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "4px 9px",
                  background: "#ffffff",
                  border: `1px solid ${p.border}`,
                  borderRadius: 7,
                  fontSize: 11.5,
                  color: p.accentText,
                  textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                <FileText size={11} />
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

function SystemRow({ m }: { m: PortalCrMessage }) {
  const desc =
    m.eventType === "status_change"
      ? `Status: ${prettify(m.eventFrom)} → ${prettify(m.eventTo)}`
      : m.eventType === "estimate_published"
      ? "Estimate published"
      : m.eventType === "estimate_updated"
      ? "Estimate updated"
      : m.eventType === "client_decision"
      ? m.body
      : m.eventType === "invoice_linked"
      ? `Invoice ${m.eventTo ? "linked" : "unlinked"}`
      : m.eventType === "sprint_linked"
      ? `Sprint ${m.eventTo ? "linked" : "unlinked"}`
      : m.eventType === "assignment"
      ? "Assignment changed"
      : m.eventType === "created_from_mom"
      ? m.body
      : m.body || "System event";
  return (
    <div
      style={{
        textAlign: "center",
        fontSize: 11.5,
        color: p.textSubtle,
        display: "inline-flex",
        alignSelf: "center",
        gap: 6,
        alignItems: "center",
      }}
    >
      <AlertTriangle size={11} />
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

function SideCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
}) {
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
          padding: "10px 14px",
          background: p.surfaceMuted,
          borderBottom: `1px solid ${p.border}`,
          fontSize: 11,
          fontWeight: 600,
          color: p.textSubtle,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          width: "100%",
        }}
      >
        <Icon size={12} />
        {title}
      </div>
      <div style={{ padding: "10px 14px" }}>{children}</div>
    </div>
  );
}
function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "6px 0",
        fontSize: 13,
        gap: 10,
      }}
    >
      <span style={{ color: p.textSubtle }}>{label}</span>
      <span style={{ color: p.text, fontWeight: 500, textAlign: "right" }}>
        {value}
      </span>
    </div>
  );
}

/* --------------------------------------------------------------- */

function DecisionModal({
  decision,
  onCancel,
  onConfirm,
}: {
  decision: "approved" | "rejected" | null;
  onCancel: () => void;
  onConfirm: (note?: string) => Promise<void>;
}) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    setNote("");
  }, [decision]);

  if (!decision) return null;
  const isApprove = decision === "approved";

  return (
    <Modal
      open={!!decision}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
      width={460}
      closable={false}
      styles={{
        mask: { backgroundColor: "rgba(15,23,42,0.45)" },
        content: {
          background: p.surfaceElevated,
          border: `1px solid ${p.border}`,
          padding: 0,
        },
        body: { padding: 0 },
      }}
    >
      <div
        style={{
          padding: "20px 22px 16px",
          borderBottom: `1px solid ${p.border}`,
          display: "flex",
          gap: 12,
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            background: isApprove ? p.successBg : p.dangerBg,
            color: isApprove ? p.successText : p.dangerText,
            border: `1px solid ${
              isApprove ? p.successBorder : p.dangerBorder
            }`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isApprove ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
        </div>
        <div>
          <div style={{ fontSize: 15.5, fontWeight: 600, color: p.text }}>
            {isApprove ? "Approve estimate" : "Reject estimate"}
          </div>
          <div
            style={{
              marginTop: 3,
              fontSize: 12.5,
              color: p.textSubtle,
            }}
          >
            {isApprove
              ? "Your approval lets us start work and creates an audit record."
              : "Add a note so we know what to adjust. We'll send back a revised estimate."}
          </div>
        </div>
      </div>
      <div style={{ padding: 20 }}>
        <Input.TextArea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={
            isApprove
              ? "Optional note (e.g. confirm any constraints)"
              : "Tell us what's off — scope, price, timing…"
          }
        />
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 14,
            paddingTop: 12,
            borderTop: `1px solid ${p.border}`,
          }}
        >
          <button
            onClick={onCancel}
            style={{
              padding: "8px 14px",
              background: "#ffffff",
              color: p.textMuted,
              border: `1px solid ${p.border}`,
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              setSubmitting(true);
              try {
                await onConfirm(note.trim() || undefined);
              } finally {
                setSubmitting(false);
              }
            }}
            disabled={submitting || (!isApprove && !note.trim())}
            style={{
              padding: "8px 14px",
              background: isApprove ? p.success : p.danger,
              color: "#ffffff",
              border: `1px solid ${isApprove ? p.success : p.danger}`,
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor:
                submitting || (!isApprove && !note.trim())
                  ? "not-allowed"
                  : "pointer",
              opacity:
                submitting || (!isApprove && !note.trim()) ? 0.6 : 1,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {isApprove ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
            {submitting ? "Submitting…" : isApprove ? "Approve" : "Reject"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
