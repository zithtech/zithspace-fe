"use client";
import LoadingSpinner from "@/components/common/LoadingSpinner";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { notification, Input, Modal } from "antd";
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
  User as UserIcon,
  ArrowUpRight,
  MessageCircle,
  Folder,
  Sparkles,
  Info
} from "lucide-react";
import {
  portalCrService,
  PortalCrDetail,
  PortalCrMessage
} from "@/services/portalCrService";
import {
  p,
  TONE,
  STATUS_META,
  PRIORITY_META,
  fmtCurrency,
  fmtDate,
  fmtDateTime,
  fmtRelative
} from "../_crUi";
import { AttachmentPicker } from "@/app/portal/_components/AttachmentPicker";


const INDIGO = "#4f46e5";
const INDIGO_BG = "#eef2ff";
const INDIGO_BORDER = "#c7d2fe";
const INDIGO_TEXT = "#4338ca";
const SURFACE_TINTED = "#fafbff";

function daysBetween(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

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

export default function PortalCrDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [cr, setCr] = useState<PortalCrDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notify, contextHolder] = notification.useNotification();
  const [decisionOpen, setDecisionOpen] = useState<
    null | "approved" | "rejected"
  >(null);

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
          justifyContent: "center"
        }}
      >
        <LoadingSpinner size="large" fullScreen={false} />
      </div>
    );
  }

  if (!cr) {
    return (
      <div style={{ padding: "48px 40px" }}>
        <EmptyState
          title="Change request not found"
          body="The link may be wrong, or this CR no longer exists."
          ctaLabel="Back to change requests"
          onCta={() => router.push("/portal/change-requests")}
        />
      </div>
    );
  }

  const awaitingDecision = cr.status === "estimated" && !cr.clientDecision;
  const canReply = !["closed", "cancelled", "delivered"].includes(cr.status);
  const hasEstimate =
    cr.impactAnalysis ||
    cr.estimatedHoursMin ||
    cr.estimatedHoursMax ||
    cr.estimatedCost;
  const hasLinks = !!(cr.linkedInvoiceNumber || cr.linkedSprintVersion);

  return (
    <div
      style={{
        height: "100vh",
        overflowY: "auto",
        backgroundColor: "#ffffff"
      }}
    >
      {contextHolder}

      {/* Sticky bar */}
      <StickyHeader
        cr={cr}
        awaitingDecision={awaitingDecision}
        onBack={() => router.push("/portal/change-requests")}
        onApprove={() => setDecisionOpen("approved")}
        onReject={() => setDecisionOpen("rejected")}
      />

      <div style={{ padding: "20px 40px 64px", maxWidth: 1200 }}>
        {/* Hero band */}
        <HeroBand cr={cr} />

        {/* Awaiting decision banner */}
        {awaitingDecision && (
          <DecisionBanner
            onApprove={() => setDecisionOpen("approved")}
            onReject={() => setDecisionOpen("rejected")}
          />
        )}

        {/* Decision recorded banner */}
        {cr.clientDecision && (
          <DecisionRecorded
            decision={cr.clientDecision}
            at={cr.clientDecisionAt}
            note={cr.clientDecisionNote}
          />
        )}

        {/* Body */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: hasLinks
              ? "minmax(0, 1fr) 300px"
              : "minmax(0, 1fr)",
            gap: 16,
            alignItems: "flex-start",
            marginTop: 16
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {hasEstimate ? (
              <EstimateCard cr={cr} />
            ) : (
              <EstimatePendingCard />
            )}
            <ConversationCard
              cr={cr}
              canReply={canReply}
              notify={notify}
              onPosted={load}
            />
          </div>

          {hasLinks && (
            <aside
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                position: "sticky",
                top: 84
              }}
            >
              <LinksCard cr={cr} />
            </aside>
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
                  : "Estimate rejected"
            });
            setDecisionOpen(null);
            load();
          } catch (err: any) {
            notify.error({
              message: "Decision failed",
              description: err?.message
            });
          }
        }}
      />

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

        .premium-cta-primary {
          transition: background 140ms ease, gap 140ms ease;
        }
        .premium-cta-primary:hover {
          background: #4338ca !important;
        }
        .premium-cta-primary:hover .cta-arrow {
          transform: translate(2px, -2px);
        }
        .cta-arrow {
          transition: transform 140ms ease;
        }

        .premium-cta-approve {
          transition: background 140ms ease;
        }
        .premium-cta-approve:hover {
          background: #047857 !important;
        }
        .premium-cta-reject {
          transition: background 140ms ease, color 140ms ease;
        }
        .premium-cta-reject:hover {
          background: #fef2f2 !important;
          color: #991b1b !important;
        }
        .premium-cta-ghost {
          transition: background 140ms ease, color 140ms ease, border-color 140ms ease;
        }
        .premium-cta-ghost:hover {
          background: #eef2ff !important;
          color: #4338ca !important;
          border-color: #c7d2fe !important;
        }
        .premium-back-btn {
          transition: background 140ms ease, color 140ms ease;
        }
        .premium-back-btn:hover {
          background: #f1f5f9 !important;
          color: #0f172a !important;
        }
        .premium-link {
          transition: color 140ms ease;
        }
        .premium-link:hover {
          color: #4338ca !important;
        }
        .premium-attachment-chip:hover {
          border-color: #a5b4fc !important;
          color: #4338ca !important;
        }
      `}</style>
    </div>
  );
}

/* --------------------------------------------------------------- */

function StickyHeader({
  cr,
  awaitingDecision,
  onBack,
  onApprove,
  onReject }: {
    cr: PortalCrDetail;
    awaitingDecision: boolean;
    onBack: () => void;
    onApprove: () => void;
    onReject: () => void;
  }) {
  const st = STATUS_META[cr.status] || STATUS_META.submitted;
  const StIcon = st.icon;
  const tone = TONE[st.tone];
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        backgroundColor: "#ffffff",
        borderBottom: `1px solid ${p.border}`,
        padding: "12px 40px"
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          maxWidth: 1200
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
            flexShrink: 0
          }}
        >
          <ArrowLeft size={14} />
          Change requests
        </button>
        <div
          style={{
            width: 1,
            height: 18,
            background: p.border,
            flexShrink: 0
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            minWidth: 0,
            flex: 1
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
              flexShrink: 0
            }}
          >
            {cr.crNumber}
          </span>
          <span
            style={{
              fontSize: 13.5,
              fontWeight: 700,
              color: p.text,
              letterSpacing: "-0.005em",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}
          >
            {cr.subject}
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
              flexShrink: 0
            }}
          >
            <StIcon size={10} />
            {st.label}
          </span>
        </div>
        {awaitingDecision && (
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <button
              type="button"
              onClick={onReject}
              className="premium-cta-reject"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 12px",
                background: "#ffffff",
                color: p.dangerText,
                border: `1px solid ${p.dangerBorder}`,
                borderRadius: 7,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              <XCircle size={13} />
              Reject
            </button>
            <button
              type="button"
              onClick={onApprove}
              className="premium-cta-approve"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 12px",
                background: p.success,
                color: "#ffffff",
                border: `1px solid ${p.success}`,
                borderRadius: 7,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              <CheckCircle2 size={13} />
              Approve
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function HeroBand({ cr }: { cr: PortalCrDetail }) {
  const pri = PRIORITY_META[cr.priority] || PRIORITY_META.medium;
  const priTone = TONE[pri.tone];

  return (
    <div
      style={{
        position: "relative",
        padding: "22px 24px 22px 28px",
        background: SURFACE_TINTED,
        border: `1px solid ${p.border}`,
        borderRadius: 14,
        marginBottom: 14,
        overflow: "hidden"
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: `linear-gradient(180deg, ${INDIGO}, ${p.accent})`
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 10
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            background: INDIGO_BG,
            border: `1px solid ${INDIGO_BORDER}`,
            color: INDIGO,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <GitPullRequest size={15} />
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
            fontWeight: 600
          }}
        >
          {cr.crNumber}
        </span>
        <span
          style={{
            padding: "2px 8px",
            background: priTone.bg,
            border: `1px solid ${priTone.border}`,
            color: priTone.text,
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 600
          }}
        >
          {pri.label} priority
        </span>
        {cr.projectName && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11.5,
              color: p.textSubtle,
              fontWeight: 600
            }}
          >
            <Folder size={11} color={p.textFaint} />
            {cr.projectCode
              ? `${cr.projectName} · ${cr.projectCode}`
              : cr.projectName}
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
          lineHeight: 1.25
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
          fontSize: 12,
          color: p.textSubtle
        }}
      >
        <MetaItem
          icon={Clock}
          label="Raised"
          value={fmtDateTime(cr.createdAt)}
        />
        <MetaItem
          icon={Activity}
          label="Last activity"
          value={fmtRelative(cr.lastActivityAt)}
        />
        {cr.assignedStaffName && (
          <MetaItem
            icon={UserIcon}
            label="Assigned to"
            value={cr.assignedStaffName}
          />
        )}
      </div>
      {cr.description && (
        <div
          style={{
            marginTop: 14,
            padding: "12px 14px",
            background: "#ffffff",
            border: `1px solid ${p.border}`,
            borderRadius: 10,
            fontSize: 13.5,
            color: p.textMuted,
            lineHeight: 1.6,
            whiteSpace: "pre-wrap"
          }}
        >
          {cr.description}
        </div>
      )}
    </div>
  );
}

function MetaItem({
  icon: Icon,
  label,
  value }: {
    icon: any;
    label: string;
    value: string;
  }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5
      }}
    >
      <Icon size={11} color={p.textFaint} />
      <span style={{ color: p.textFaint, fontWeight: 500 }}>{label}:</span>
      <span style={{ color: p.text, fontWeight: 600 }}>{value}</span>
    </span>
  );
}

/* --------------------------------------------------------------- */

function DecisionBanner({
  onApprove,
  onReject }: {
    onApprove: () => void;
    onReject: () => void;
  }) {
  return (
    <div
      style={{
        position: "relative",
        marginBottom: 14,
        padding: "16px 18px 16px 22px",
        background: "linear-gradient(180deg, #fffbeb 0%, #ffffff 60%)",
        border: `1px solid ${p.warningBorder}`,
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 14,
        flexWrap: "wrap",
        overflow: "hidden"
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: `linear-gradient(180deg, ${p.warning}, #f97316)`
        }}
      />
      <div style={{ display: "flex", gap: 12, alignItems: "center", flex: 1, minWidth: 240 }}>
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
            flexShrink: 0
          }}
        >
          <DollarSign size={17} />
        </div>
        <div>
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 700,
              color: p.text,
              letterSpacing: "-0.005em"
            }}
          >
            Estimate ready — your decision needed
          </div>
          <div
            style={{
              fontSize: 12.5,
              color: p.textMuted,
              marginTop: 2
            }}
          >
            Review the estimate below, then approve to start work or reject with
            a note.
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={onReject}
          className="premium-cta-reject"
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
            cursor: "pointer"
          }}
        >
          <XCircle size={14} />
          Reject
        </button>
        <button
          onClick={onApprove}
          className="premium-cta-approve"
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
            cursor: "pointer"
          }}
        >
          <CheckCircle2 size={14} />
          Approve
        </button>
      </div>
    </div>
  );
}

function DecisionRecorded({
  decision,
  at,
  note }: {
    decision: "approved" | "rejected";
    at: string | null;
    note: string | null;
  }) {
  const isApproved = decision === "approved";
  return (
    <div
      style={{
        position: "relative",
        marginBottom: 14,
        padding: "12px 14px 12px 18px",
        background: isApproved ? p.successBg : p.dangerBg,
        border: `1px solid ${isApproved ? p.successBorder : p.dangerBorder}`,
        borderRadius: 10,
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        color: isApproved ? p.successText : p.dangerText,
        fontSize: 13,
        overflow: "hidden"
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: isApproved ? p.success : p.danger
        }}
      />
      {isApproved ? (
        <CheckCircle2 size={16} style={{ marginTop: 1, flexShrink: 0 }} />
      ) : (
        <XCircle size={16} style={{ marginTop: 1, flexShrink: 0 }} />
      )}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontWeight: 600 }}>
          You {decision} this estimate{at ? ` ${fmtRelative(at)}` : ""}
        </div>
        {note && (
          <div
            style={{
              marginTop: 3,
              fontStyle: "italic",
              fontSize: 12.5,
              fontWeight: 500,
              opacity: 0.92
            }}
          >
            “{note}”
          </div>
        )}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- */

function EstimateCard({ cr }: { cr: PortalCrDetail }) {
  const days = daysBetween(cr.targetDeliveryDate);
  const hoursText =
    cr.estimatedHoursMin || cr.estimatedHoursMax
      ? `${cr.estimatedHoursMin || "?"}–${cr.estimatedHoursMax || "?"} h`
      : "—";
  return (
    <div
      style={{
        background: p.surfaceElevated,
        border: `1px solid ${p.border}`,
        borderRadius: 12,
        overflow: "hidden"
      }}
    >
      <CardHeader icon={Sparkles} title="Estimate" tone="indigo" />
      <div
        style={{
          padding: "18px 20px",
          display: "grid",
          gridTemplateColumns: "minmax(180px, 1.4fr) 1fr 1fr",
          gap: 18,
          alignItems: "flex-end"
        }}
      >
        <div>
          <StatLabel icon={DollarSign} label="Estimated cost" />
          <div
            style={{
              marginTop: 4,
              fontSize: 30,
              fontWeight: 700,
              color: p.text,
              letterSpacing: "-0.025em",
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1.1
            }}
          >
            {cr.estimatedCost
              ? fmtCurrency(cr.estimatedCost, cr.estimatedCurrency)
              : "—"}
          </div>
          {cr.estimatedCurrency && cr.estimatedCost && (
            <div
              style={{
                marginTop: 3,
                fontSize: 11,
                color: p.textSubtle,
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                fontWeight: 600
              }}
            >
              {cr.estimatedCurrency}
            </div>
          )}
        </div>
        <div>
          <StatLabel icon={Clock} label="Effort" />
          <div
            style={{
              marginTop: 4,
              fontSize: 18,
              fontWeight: 700,
              color: p.text,
              letterSpacing: "-0.01em",
              fontVariantNumeric: "tabular-nums"
            }}
          >
            {hoursText}
          </div>
        </div>
        <div>
          <StatLabel
            icon={Calendar}
            label={
              days != null && days >= 0
                ? "Target in"
                : days != null && days < 0
                  ? "Past target"
                  : "Target delivery"
            }
          />
          <div
            style={{
              marginTop: 4,
              fontSize: 18,
              fontWeight: 700,
              color:
                days != null && days < 0
                  ? p.dangerText
                  : days != null && days <= 3
                    ? p.warningText
                    : p.text,
              letterSpacing: "-0.01em",
              fontVariantNumeric: "tabular-nums"
            }}
          >
            {cr.targetDeliveryDate
              ? days == null
                ? fmtDate(cr.targetDeliveryDate)
                : days > 0
                  ? `${days}d`
                  : days === 0
                    ? "today"
                    : `${-days}d`
              : "—"}
          </div>
          {cr.targetDeliveryDate && days != null && (
            <div
              style={{
                marginTop: 3,
                fontSize: 11,
                color: p.textSubtle,
                fontWeight: 500
              }}
            >
              {fmtDate(cr.targetDeliveryDate)}
            </div>
          )}
        </div>
      </div>
      {cr.impactAnalysis && (
        <div style={{ padding: "0 20px 20px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 10.5,
              fontWeight: 700,
              color: p.textSubtle,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 8
            }}
          >
            <Info size={11} />
            Impact analysis
          </div>
          <div
            style={{
              fontSize: 13.5,
              color: p.textMuted,
              lineHeight: 1.65,
              whiteSpace: "pre-wrap",
              padding: "14px 16px",
              background: SURFACE_TINTED,
              border: `1px solid ${p.border}`,
              borderRadius: 10
            }}
          >
            {cr.impactAnalysis}
          </div>
        </div>
      )}
    </div>
  );
}

function EstimatePendingCard() {
  return (
    <div
      style={{
        padding: "28px 22px",
        background: SURFACE_TINTED,
        border: `1px dashed ${p.neutralBorder}`,
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        gap: 14
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: "#ffffff",
          border: `1px solid ${p.border}`,
          color: p.textFaint,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0
        }}
      >
        <Clock size={18} />
      </div>
      <div>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: p.text
          }}
        >
          Estimate in progress
        </div>
        <div
          style={{
            fontSize: 12.5,
            color: p.textSubtle,
            marginTop: 3,
            lineHeight: 1.5
          }}
        >
          Our team is reviewing your request. The impact analysis, effort, and
          cost estimate will appear here.
        </div>
      </div>
    </div>
  );
}

function StatLabel({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 10.5,
        fontWeight: 700,
        color: p.textSubtle,
        textTransform: "uppercase",
        letterSpacing: "0.08em"
      }}
    >
      <Icon size={11} />
      {label}
    </div>
  );
}

/* --------------------------------------------------------------- */

function ConversationCard({
  cr,
  canReply,
  notify,
  onPosted }: {
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
  const [composerFocused, setComposerFocused] = useState(false);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);

  const messageCount = useMemo(
    () => cr.messages.filter((m) => !m.isSystemEvent).length,
    [cr.messages],
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
      await portalCrService.reply(cr.id, {
        body: body.trim(),
        attachments: files.map((f) => ({
          dataUrl: f.dataUrl,
          fileName: f.name
        }))
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
        overflow: "hidden"
      }}
    >
      <CardHeader
        icon={MessageCircle}
        title="Conversation"
        tone="indigo"
        countLabel={`${messageCount} message${messageCount === 1 ? "" : "s"}`}
      />
      <div style={{ padding: "18px 20px 0" }}>
        {cr.messages.length === 0 ? (
          <div
            style={{
              padding: "32px 0 20px",
              textAlign: "center",
              fontSize: 12.5,
              color: p.textSubtle
            }}
          >
            No messages yet. Start the conversation below.
          </div>
        ) : (
          <Timeline messages={cr.messages} />
        )}
      </div>
      {canReply ? (
        <div
          style={{
            padding: "14px 20px 20px",
            borderTop: `1px solid ${p.border}`,
            marginTop: 14,
            background: SURFACE_TINTED
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
              transition: "border-color 140ms ease, box-shadow 140ms ease"
            }}
          >
            <textarea
              ref={composerRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onFocus={() => setComposerFocused(true)}
              onBlur={() => setComposerFocused(false)}
              placeholder="Reply… (Cmd/Ctrl + Enter to send)"
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
                minHeight: 70
              }}
            />
            <div
              style={{
                padding: "8px 10px 10px",
                borderTop: files.length > 0 ? `1px solid ${p.border}` : "none"
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
                  gap: 8
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
                    opacity: sending || !body.trim() ? 0.55 : 1
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
            textAlign: "center"
          }}
        >
          This change request is{" "}
          {STATUS_META[cr.status]?.label.toLowerCase()}. Replies are closed.
        </div>
      )}
    </div>
  );
}

function Timeline({ messages }: { messages: PortalCrMessage[] }) {
  return (
    <div
      style={{
        position: "relative",
        paddingLeft: 24,
        paddingBottom: 6
      }}
    >
      {/* vertical rail */}
      <div
        style={{
          position: "absolute",
          left: 11,
          top: 6,
          bottom: 6,
          width: 1,
          background: p.border
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

function MessageNode({ m }: { m: PortalCrMessage }) {
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
          fontFamily: "ui-sans-serif, system-ui"
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
            marginBottom: 5
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
                letterSpacing: "0.07em"
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
              fontWeight: 500
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
              wordBreak: "break-word"
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
              flexWrap: "wrap"
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
                  transition: "border-color 140ms ease, color 140ms ease"
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

function SystemNode({ m }: { m: PortalCrMessage }) {
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
          justifyContent: "center"
        }}
      >
        <span
          style={{
            width: 4,
            height: 4,
            borderRadius: 999,
            background: p.textFaint
          }}
        />
      </div>
      <div
        style={{
          fontSize: 11.5,
          color: p.textSubtle,
          fontWeight: 500,
          paddingTop: 2
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

function CardHeader({
  icon: Icon,
  title,
  tone,
  countLabel }: {
    icon: any;
    title: string;
    tone: "indigo" | "warning" | "neutral";
    countLabel?: string;
  }) {
  const toneMap = {
    indigo: { bg: INDIGO_BG, border: INDIGO_BORDER, color: INDIGO_TEXT },
    warning: { bg: p.warningBg, border: p.warningBorder, color: p.warningText },
    neutral: { bg: p.neutralBg, border: p.neutralBorder, color: p.neutralText }
  };
  const t = toneMap[tone];
  return (
    <div
      style={{
        padding: "10px 16px",
        background: p.surfaceMuted,
        borderBottom: `1px solid ${p.border}`,
        display: "flex",
        alignItems: "center",
        gap: 8
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: 5,
          background: t.bg,
          border: `1px solid ${t.border}`,
          color: t.color,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0
        }}
      >
        <Icon size={11} />
      </div>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: p.textMuted,
          textTransform: "uppercase",
          letterSpacing: "0.08em"
        }}
      >
        {title}
      </span>
      {countLabel && (
        <span
          style={{
            fontSize: 11,
            color: p.textSubtle,
            fontWeight: 500
          }}
        >
          · {countLabel}
        </span>
      )}
    </div>
  );
}

function LinksCard({ cr }: { cr: PortalCrDetail }) {
  return (
    <div
      style={{
        background: p.surfaceElevated,
        border: `1px solid ${p.border}`,
        borderRadius: 12,
        overflow: "hidden"
      }}
    >
      <CardHeader icon={Receipt} title="Linked" tone="neutral" />
      <div style={{ padding: "10px 14px" }}>
        {cr.linkedInvoiceNumber && (
          <LinkRow
            icon={Receipt}
            label="Invoice"
            value={cr.linkedInvoiceNumber}
            href={`/portal/invoices/${cr.linkedInvoiceId}`}
            mono
          />
        )}
        {cr.linkedSprintVersion && (
          <LinkRow
            icon={Activity}
            label="Sprint"
            value={cr.linkedSprintVersion}
            href={`/portal/sprints/${cr.linkedSprintId}`}
            mono
          />
        )}
      </div>
    </div>
  );
}

function LinkRow({
  icon: Icon,
  label,
  value,
  href,
  mono }: {
    icon: any;
    label: string;
    value: string;
    href: string;
    mono?: boolean;
  }) {
  return (
    <Link
      href={href}
      className="premium-link"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "9px 10px",
        margin: "2px -6px",
        borderRadius: 7,
        textDecoration: "none",
        color: "inherit",
        transition: "background 140ms ease"
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          fontSize: 12,
          color: p.textSubtle,
          fontWeight: 500
        }}
      >
        <Icon size={12} color={p.textFaint} />
        {label}
      </span>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontSize: 12.5,
          color: INDIGO_TEXT,
          fontWeight: 600,
          fontFamily: mono
            ? "ui-monospace, SFMono-Regular, Menlo, monospace"
            : "inherit"
        }}
      >
        {value}
        <ArrowUpRight size={11} />
      </span>
    </Link>
  );
}

/* --------------------------------------------------------------- */

function EmptyState({
  title,
  body,
  ctaLabel,
  onCta }: {
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
        margin: "0 auto"
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
          marginBottom: 14
        }}
      >
        <GitPullRequest size={18} color={p.textFaint} />
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
              cursor: "pointer"
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

/* --------------------------------------------------------------- */

function DecisionModal({
  decision,
  onCancel,
  onConfirm }: {
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
      width={480}
      closable={false}
      styles={{
        mask: { backgroundColor: "rgba(15,23,42,0.45)" },
        content: {
          background: p.surfaceElevated,
          border: `1px solid ${p.border}`,
          padding: 0,
          borderRadius: 14,
          overflow: "hidden"
        },
        body: { padding: 0 }
      }}
    >
      <div
        style={{
          padding: "20px 22px 16px",
          borderBottom: `1px solid ${p.border}`,
          display: "flex",
          gap: 12,
          alignItems: "flex-start"
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: isApprove ? p.successBg : p.dangerBg,
            color: isApprove ? p.successText : p.dangerText,
            border: `1px solid ${isApprove ? p.successBorder : p.dangerBorder
              }`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}
        >
          {isApprove ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
        </div>
        <div>
          <div
            style={{
              fontSize: 15.5,
              fontWeight: 700,
              color: p.text,
              letterSpacing: "-0.005em"
            }}
          >
            {isApprove ? "Approve estimate" : "Reject estimate"}
          </div>
          <div
            style={{
              marginTop: 3,
              fontSize: 12.5,
              color: p.textSubtle,
              lineHeight: 1.5
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
            paddingTop: 14,
            borderTop: `1px solid ${p.border}`
          }}
        >
          <button
            onClick={onCancel}
            className="premium-cta-ghost"
            style={{
              padding: "8px 14px",
              background: "#ffffff",
              color: p.textMuted,
              border: `1px solid ${p.border}`,
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer"
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
            className={isApprove ? "premium-cta-approve" : ""}
            style={{
              padding: "8px 14px",
              background: isApprove ? p.success : p.danger,
              color: "#ffffff",
              border: `1px solid ${isApprove ? p.success : p.danger}`,
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 600,
              cursor:
                submitting || (!isApprove && !note.trim())
                  ? "not-allowed"
                  : "pointer",
              opacity:
                submitting || (!isApprove && !note.trim()) ? 0.55 : 1,
              display: "inline-flex",
              alignItems: "center",
              gap: 6
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
