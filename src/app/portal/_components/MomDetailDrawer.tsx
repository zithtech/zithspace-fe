"use client";

import React, { useEffect, useState } from "react";
import { Drawer, Spin, Empty } from "antd";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Video,
  Users,
  Lightbulb,
  ListChecks,
  CheckCircle2,
  Circle,
  Pause,
  XCircle,
  GitPullRequest,
  Sparkles,
  ExternalLink,
  Paperclip,
  FileText,
  FileType2,
  Image as ImageIcon,
  Link2,
  CalendarDays,
  Building2,
  Hash,
  User,
  CalendarRange,
  Eye,
  Download,
} from "lucide-react";
import AttachmentPreviewDrawer, {
  PreviewAttachment,
} from "@/app/portal/_components/AttachmentPreviewDrawer";
import {
  portalMomService,
  PortalMomDetail,
  PortalMomAttachment,
} from "@/services/portalMomService";

/* ─────────────────────────────────────────────────────────
 * Design tokens — consistent with portal premium-dense theme
 * ─────────────────────────────────────────────────────── */
const T = {
  pageBg: "#f6f7f9",
  cardBg: "#ffffff",
  border: "#e5e7eb",
  borderHover: "#cbd5e1",
  borderSoft: "#f1f5f9",
  text: "#0f172a",
  textMuted: "#475569",
  textSubtle: "#64748b",
  textFaint: "#94a3b8",
  accent: "#4338ca",
  accentBg: "#eef2ff",
  accentBorder: "#c7d2fe",
  numFont:
    'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace',
};

const ACTION_META: Record<
  string,
  { label: string; icon: any; bg: string; border: string; text: string }
> = {
  open: {
    label: "Open",
    icon: Circle,
    bg: "#fffbeb",
    border: "#fde68a",
    text: "#92400e",
  },
  in_progress: {
    label: "In progress",
    icon: Pause,
    bg: "#eef2ff",
    border: "#c7d2fe",
    text: "#4338ca",
  },
  done: {
    label: "Done",
    icon: CheckCircle2,
    bg: "#ecfdf5",
    border: "#a7f3d0",
    text: "#047857",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    bg: "#f1f5f9",
    border: "#e2e8f0",
    text: "#475569",
  },
  converted: {
    label: "Converted",
    icon: GitPullRequest,
    bg: "#f5f3ff",
    border: "#ddd6fe",
    text: "#6d28d9",
  },
};

function fmtDateTime(iso: string | null) {
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
    return iso;
  }
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function fmtDateShort(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function fmtTime(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

const INTERNAL_HOST_NEEDLES = ["zithspace.com", "zukvo.com"];
function isInternalHostedUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return INTERNAL_HOST_NEEDLES.some((needle) => lower.includes(needle));
}
function looksLikeRealUrl(s: string | null | undefined): boolean {
  if (!s) return false;
  try {
    const u = new URL(s.trim());
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    return u.hostname.includes(".");
  } catch {
    return false;
  }
}
function resolveAttachmentUrl(a: PortalMomAttachment): string | null {
  if (a.kind === "file") return a.fileUrl ?? null;
  if (looksLikeRealUrl(a.linkUrl)) return a.linkUrl;
  if (looksLikeRealUrl(a.linkLabel)) return a.linkLabel;
  return a.linkUrl ?? null;
}

/* ─────────────────────────────────────────────────────────
 * Component
 * ─────────────────────────────────────────────────────── */
export interface MomDetailDrawerProps {
  momId: string | null;
  onClose: () => void;
}

export default function MomDetailDrawer({
  momId,
  onClose,
}: MomDetailDrawerProps) {
  const [mom, setMom] = useState<PortalMomDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewAttachment, setPreviewAttachment] =
    useState<PreviewAttachment | null>(null);

  useEffect(() => {
    if (!momId) {
      setMom(null);
      return;
    }
    let cancel = false;
    setLoading(true);
    portalMomService
      .detail(momId)
      .then((data) => {
        if (!cancel) setMom(data);
      })
      .catch(() => {
        if (!cancel) setMom(null);
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [momId]);

  return (
    <Drawer
      open={!!momId}
      onClose={onClose}
      placement="right"
      width={920}
      closable={false}
      destroyOnClose
      rootClassName="mom-detail-drawer-root"
      styles={{
        body: { padding: 0, background: T.pageBg },
        header: { display: "none" },
        mask: { background: "rgba(15, 23, 42, 0.32)" },
      }}
    >
      {/* Sticky header */}
      <DrawerHeader mom={mom} loading={loading} onClose={onClose} />

      {/* Body */}
      {loading && !mom ? (
        <div
          style={{
            padding: 80,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Spin size="large" />
        </div>
      ) : !mom ? (
        <div style={{ padding: 64, textAlign: "center" }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span style={{ color: T.textSubtle, fontSize: 13 }}>
                Meeting not found
              </span>
            }
          />
        </div>
      ) : (
        <div
          style={{
            padding: "16px 20px 32px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <MetaStrip mom={mom} />
          <KPITiles mom={mom} />

          {(mom.summary || mom.aiSummary) && <SummarySection mom={mom} />}

          {mom.decisions.length > 0 && <DecisionsSection mom={mom} />}

          <ActionItemsSection mom={mom} />

          <div
            className="mom-drawer-bottom-row"
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
              gap: 12,
              alignItems: "start",
            }}
          >
            <AttendeesSection mom={mom} />
            <AttachmentsSection
              mom={mom}
              onPreview={setPreviewAttachment}
            />
          </div>
        </div>
      )}

      <AttachmentPreviewDrawer
        attachment={previewAttachment}
        onClose={() => setPreviewAttachment(null)}
      />

      <style jsx global>{`
        .mom-detail-drawer-root .ant-drawer-body {
          padding: 0 !important;
        }
        @media (max-width: 720px) {
          .mom-drawer-bottom-row {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </Drawer>
  );
}

/* ─────────────────────────────────────────────────────────
 * Sticky header
 * ─────────────────────────────────────────────────────── */
const DrawerHeader: React.FC<{
  mom: PortalMomDetail | null;
  loading: boolean;
  onClose: () => void;
}> = ({ mom, loading, onClose }) => (
  <div
    style={{
      position: "sticky",
      top: 0,
      zIndex: 10,
      background: T.cardBg,
      borderBottom: `1px solid ${T.border}`,
      padding: "14px 20px",
    }}
  >
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: T.accentBg,
          color: T.accent,
          border: `1px solid ${T.accentBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Calendar size={18} strokeWidth={2.2} />
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
          {mom ? (
            <>
              <MomNumberPill momNumber={mom.momNumber} />
              {mom.project && (
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 600,
                    color: T.textMuted,
                    background: T.borderSoft,
                    padding: "2px 8px",
                    borderRadius: 5,
                    border: `1px solid ${T.border}`,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Building2 size={10} />
                  {mom.project.name}
                  {mom.project.code ? ` · ${mom.project.code}` : ""}
                </span>
              )}
            </>
          ) : (
            <span
              style={{
                width: 80,
                height: 16,
                background: T.borderSoft,
                borderRadius: 4,
              }}
            />
          )}
        </div>
        <div
          style={{
            marginTop: 6,
            fontSize: 17,
            fontWeight: 700,
            color: T.text,
            letterSpacing: "-0.02em",
            lineHeight: 1.3,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {mom?.title || (loading ? "Loading meeting…" : "Meeting")}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
        {mom?.recordingUrl && (
          <a
            href={mom.recordingUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "6px 11px",
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: 8,
              color: "#1d4ed8",
              fontSize: 12,
              textDecoration: "none",
              fontWeight: 600,
              whiteSpace: "nowrap",
              transition: "background 120ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#dbeafe";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#eff6ff";
            }}
          >
            <Video size={13} />
            Watch recording
            <ExternalLink size={11} />
          </a>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            border: `1px solid ${T.border}`,
            background: T.cardBg,
            color: T.textMuted,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 120ms ease, color 120ms ease, border-color 120ms ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = T.borderSoft;
            e.currentTarget.style.borderColor = T.borderHover;
            e.currentTarget.style.color = T.text;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = T.cardBg;
            e.currentTarget.style.borderColor = T.border;
            e.currentTarget.style.color = T.textMuted;
          }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────
 * Meta — 2-col WHEN / WHERE cards
 * ─────────────────────────────────────────────────────── */
const MetaStrip: React.FC<{ mom: PortalMomDetail }> = ({ mom }) => {
  const dateObj = mom.meetingDate ? new Date(mom.meetingDate) : null;
  const weekday = dateObj
    ? dateObj.toLocaleDateString(undefined, { weekday: "long" })
    : "—";
  const fullDate = dateObj
    ? dateObj.toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Date not set";
  const time = dateObj
    ? dateObj.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;
  const duration = mom.durationMinutes ? `${mom.durationMinutes} min` : null;

  const isOnline = !mom.location && !!mom.recordingUrl;
  const whereTitle = mom.location || (isOnline ? "Online meeting" : "Not specified");
  const whereSub = mom.project
    ? `${mom.project.name}${mom.project.code ? ` · ${mom.project.code}` : ""}`
    : null;

  return (
    <div
      className="mom-drawer-meta-row"
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
        gap: 12,
      }}
    >
      {/* WHEN */}
      <MetaCard
        label="When"
        icon={CalendarRange}
        accent="#4338ca"
        accentBg={T.accentBg}
        accentBorder={T.accentBorder}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: T.text,
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {fullDate}
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: T.accent,
              background: T.accentBg,
              border: `1px solid ${T.accentBorder}`,
              padding: "1px 7px",
              borderRadius: 999,
              letterSpacing: "0.02em",
            }}
          >
            {weekday}
          </span>
        </div>
        <div
          style={{
            marginTop: 8,
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 12.5,
            color: T.textMuted,
            fontWeight: 600,
            flexWrap: "wrap",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {time && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Clock size={12} color={T.textSubtle} />
              {time}
            </span>
          )}
          {duration && (
            <>
              {time && (
                <span
                  style={{
                    width: 3,
                    height: 3,
                    borderRadius: "50%",
                    background: T.textFaint,
                  }}
                />
              )}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Clock size={12} color={T.textSubtle} />
                {duration}
              </span>
            </>
          )}
          {!time && !duration && (
            <span style={{ color: T.textFaint, fontWeight: 500 }}>
              Time not recorded
            </span>
          )}
        </div>
      </MetaCard>

      {/* WHERE */}
      <MetaCard
        label="Where"
        icon={isOnline ? Video : MapPin}
        accent="#0d9488"
        accentBg="#ccfbf1"
        accentBorder="#99f6e4"
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: mom.location || isOnline ? T.text : T.textFaint,
              letterSpacing: "-0.015em",
              lineHeight: 1.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "100%",
            }}
            title={whereTitle}
          >
            {whereTitle}
          </div>
          {isOnline && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#0d9488",
                background: "#ccfbf1",
                border: "1px solid #99f6e4",
                padding: "1px 7px",
                borderRadius: 999,
                letterSpacing: "0.02em",
              }}
            >
              Remote
            </span>
          )}
        </div>
        <div
          style={{
            marginTop: 8,
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12.5,
            color: T.textMuted,
            fontWeight: 600,
            flexWrap: "wrap",
          }}
        >
          {whereSub ? (
            <>
              <Building2 size={12} color={T.textSubtle} />
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={whereSub}
              >
                {whereSub}
              </span>
            </>
          ) : (
            <span style={{ color: T.textFaint, fontWeight: 500 }}>
              No project linked
            </span>
          )}
        </div>
      </MetaCard>

      <style jsx>{`
        @media (max-width: 640px) {
          .mom-drawer-meta-row {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

const MetaCard: React.FC<{
  label: string;
  icon: any;
  accent: string;
  accentBg: string;
  accentBorder: string;
  children: React.ReactNode;
}> = ({ label, icon: Icon, accent, accentBg, accentBorder, children }) => (
  <div
    style={{
      background: T.cardBg,
      border: `1px solid ${T.border}`,
      borderRadius: 12,
      padding: "13px 16px 14px",
      minHeight: 84,
      display: "flex",
      flexDirection: "column",
      gap: 6,
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          background: accentBg,
          border: `1px solid ${accentBorder}`,
          color: accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={12} strokeWidth={2.4} />
      </div>
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: accent,
        }}
      >
        {label}
      </span>
    </div>
    <div>{children}</div>
  </div>
);

/* ─────────────────────────────────────────────────────────
 * KPI tiles
 * ─────────────────────────────────────────────────────── */
const KPITiles: React.FC<{ mom: PortalMomDetail }> = ({ mom }) => {
  const openCount = mom.actionItems.filter(
    (a) => a.status === "open" || a.status === "in_progress",
  ).length;
  const tiles = [
    { label: "Attendees", value: mom.attendees.length, accent: "#4338ca", icon: Users },
    { label: "Decisions", value: mom.decisions.length, accent: "#7c3aed", icon: Lightbulb },
    { label: "Action items", value: mom.actionItems.length, accent: "#0d9488", icon: ListChecks },
    {
      label: "Open",
      value: openCount,
      accent: openCount > 0 ? "#b45309" : "#059669",
      icon: openCount > 0 ? Circle : CheckCircle2,
    },
    { label: "Attachments", value: mom.attachments?.length || 0, accent: "#be123c", icon: Paperclip },
  ];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
        gap: 8,
      }}
    >
      {tiles.map((t) => (
        <div
          key={t.label}
          style={{
            background: T.cardBg,
            border: `1px solid ${T.border}`,
            borderRadius: 10,
            padding: "10px 12px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: `${t.accent}14`,
              color: t.accent,
              border: `1px solid ${t.accent}33`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <t.icon size={13} strokeWidth={2.4} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 9.5,
                color: T.textSubtle,
                fontWeight: 600,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              {t.label}
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: T.text,
                lineHeight: 1.1,
                marginTop: 1,
                letterSpacing: "-0.02em",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {t.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
 * Section primitive
 * ─────────────────────────────────────────────────────── */
const Section: React.FC<{
  title: string;
  icon: any;
  accent?: string;
  count?: number;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, icon: Icon, accent = T.textMuted, count, trailing, children }) => (
  <div
    style={{
      background: T.cardBg,
      border: `1px solid ${T.border}`,
      borderRadius: 12,
      overflow: "hidden",
    }}
  >
    <div
      style={{
        padding: "11px 14px",
        borderBottom: `1px solid ${T.borderSoft}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#fcfcfd",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontWeight: 600,
          color: T.text,
          fontSize: 12.5,
          letterSpacing: "-0.005em",
        }}
      >
        <span style={{ color: accent, display: "inline-flex" }}>
          <Icon size={13} />
        </span>
        {title}
        {count != null && (
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: accent,
              background: `${accent}14`,
              border: `1px solid ${accent}33`,
              padding: "1px 7px",
              borderRadius: 999,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {count}
          </span>
        )}
      </div>
      {trailing}
    </div>
    <div style={{ padding: "14px 16px" }}>{children}</div>
  </div>
);

/* ─────────────────────────────────────────────────────────
 * Sections
 * ─────────────────────────────────────────────────────── */
const SummarySection: React.FC<{ mom: PortalMomDetail }> = ({ mom }) => {
  const hasBoth = !!mom.summary && !!mom.aiSummary;
  return (
    <Section
      title={hasBoth ? "Summary" : mom.summary ? "Summary" : "AI Summary"}
      icon={hasBoth || mom.summary ? Lightbulb : Sparkles}
      accent={mom.summary ? T.accent : "#7c3aed"}
    >
      <div
        style={{
          fontSize: 13,
          color: T.textMuted,
          lineHeight: 1.65,
          whiteSpace: "pre-wrap",
        }}
      >
        {mom.summary || mom.aiSummary}
      </div>
      {hasBoth && (
        <div
          style={{
            marginTop: 14,
            paddingTop: 14,
            borderTop: `1px dashed ${T.border}`,
          }}
        >
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: "#6d28d9",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 6,
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <Sparkles size={11} />
            AI summary
          </div>
          <div
            style={{
              fontSize: 12.5,
              color: T.textMuted,
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
            }}
          >
            {mom.aiSummary}
          </div>
        </div>
      )}
    </Section>
  );
};

const DecisionsSection: React.FC<{ mom: PortalMomDetail }> = ({ mom }) => (
  <Section
    title="Decisions"
    icon={Lightbulb}
    accent="#7c3aed"
    count={mom.decisions.length}
  >
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {mom.decisions.map((d, index) => (
        <div
          key={d.id}
          style={{
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
            padding: index === 0 ? "0 0 12px" : "12px 0",
            borderBottom:
              index === mom.decisions.length - 1
                ? "none"
                : `1px solid ${T.borderSoft}`,
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              background: "#f5f3ff",
              border: "1px solid #ddd6fe",
              color: "#7c3aed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10.5,
              fontWeight: 700,
              flexShrink: 0,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {index + 1}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                color: T.text,
                lineHeight: 1.55,
                fontWeight: 500,
              }}
            >
              {d.decision}
            </div>
            {d.decided_by && (
              <div
                style={{
                  marginTop: 5,
                  fontSize: 11,
                  color: T.textSubtle,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontWeight: 500,
                }}
              >
                <User size={10} />
                Decided by {d.decided_by}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  </Section>
);

const ActionItemsSection: React.FC<{ mom: PortalMomDetail }> = ({ mom }) => {
  if (mom.actionItems.length === 0) {
    return (
      <Section
        title="Action items"
        icon={ListChecks}
        accent="#0d9488"
        count={0}
      >
        <div style={{ fontSize: 12.5, color: T.textSubtle, fontWeight: 500 }}>
          No action items.
        </div>
      </Section>
    );
  }
  const openCount = mom.actionItems.filter(
    (a) => a.status === "open" || a.status === "in_progress",
  ).length;
  return (
    <Section
      title="Action items"
      icon={ListChecks}
      accent="#0d9488"
      count={mom.actionItems.length}
      trailing={
        openCount > 0 ? (
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: "#b45309",
              background: "#fffbeb",
              border: "1px solid #fde68a",
              padding: "1px 8px",
              borderRadius: 999,
            }}
          >
            {openCount} open
          </span>
        ) : (
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: "#047857",
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              padding: "1px 8px",
              borderRadius: 999,
            }}
          >
            All resolved
          </span>
        )
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {mom.actionItems.map((ai) => {
          const meta = ACTION_META[ai.status || "open"];
          const Icon = meta.icon;
          return (
            <div
              key={ai.id}
              style={{
                padding: "11px 13px",
                background: "#fafbfc",
                border: `1px solid ${T.borderSoft}`,
                borderRadius: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  alignItems: "flex-start",
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: 13,
                      color: T.text,
                      lineHeight: 1.5,
                      fontWeight: 600,
                    }}
                  >
                    {ai.text}
                  </div>
                  <div
                    style={{
                      marginTop: 7,
                      display: "flex",
                      gap: 6,
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    {ai.ownerName && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          background: T.cardBg,
                          border: `1px solid ${T.border}`,
                          padding: "1.5px 7px",
                          borderRadius: 999,
                          color: T.textMuted,
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        <User size={10} />
                        {ai.ownerName}
                      </span>
                    )}
                    {ai.dueDate && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          background: "#fef2f2",
                          border: "1px solid #fecaca",
                          padding: "1.5px 7px",
                          borderRadius: 999,
                          color: "#b91c1c",
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        <CalendarDays size={10} />
                        Due {fmtDate(ai.dueDate)}
                      </span>
                    )}
                    {ai.convertedTicketNumber && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontFamily: T.numFont,
                          color: "#6d28d9",
                          background: "#f5f3ff",
                          border: "1px solid #ddd6fe",
                          padding: "1.5px 7px",
                          borderRadius: 999,
                          fontSize: 10.5,
                          fontWeight: 700,
                        }}
                      >
                        <GitPullRequest size={10} />
                        {ai.convertedTicketNumber}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "2.5px 8px",
                    background: meta.bg,
                    border: `1px solid ${meta.border}`,
                    color: meta.text,
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  <Icon size={11} />
                  {meta.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
};

const AttendeesSection: React.FC<{ mom: PortalMomDetail }> = ({ mom }) => (
  <Section
    title="Attendees"
    icon={Users}
    accent="#4338ca"
    count={mom.attendees.length}
  >
    {mom.attendees.length === 0 ? (
      <div style={{ fontSize: 12.5, color: T.textSubtle, fontWeight: 500 }}>
        Not recorded.
      </div>
    ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {mom.attendees.map((a) => {
          const isInternal = a.party === "internal";
          const initials = (a.name || "?")
            .split(" ")
            .map((s) => s[0])
            .filter(Boolean)
            .slice(0, 2)
            .join("")
            .toUpperCase();
          return (
            <div
              key={a.id}
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: isInternal ? "#eef2ff" : "#fdf4ff",
                  border: `1px solid ${isInternal ? "#c7d2fe" : "#f5d0fe"}`,
                  color: isInternal ? "#4338ca" : "#a21caf",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10.5,
                  fontWeight: 700,
                  flexShrink: 0,
                  letterSpacing: "-0.01em",
                }}
              >
                {initials}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: T.text,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {a.name}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: T.textSubtle,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontWeight: 500,
                  }}
                >
                  {a.role || (isInternal ? "Internal" : "Client")}
                </div>
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  padding: "1.5px 6px",
                  borderRadius: 4,
                  background: isInternal ? "#eef2ff" : "#fdf4ff",
                  border: `1px solid ${isInternal ? "#c7d2fe" : "#f5d0fe"}`,
                  color: isInternal ? "#4338ca" : "#a21caf",
                  flexShrink: 0,
                }}
              >
                {a.party}
              </span>
            </div>
          );
        })}
      </div>
    )}
  </Section>
);

const AttachmentsSection: React.FC<{
  mom: PortalMomDetail;
  onPreview: (a: PreviewAttachment) => void;
}> = ({ mom, onPreview }) => (
  <Section
    title="Attachments"
    icon={Paperclip}
    accent="#be123c"
    count={mom.attachments?.length || 0}
  >
    {!mom.attachments || mom.attachments.length === 0 ? (
      <div style={{ fontSize: 12.5, color: T.textSubtle, fontWeight: 500 }}>
        No attachments shared.
      </div>
    ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {mom.attachments.map((a) => {
          const url = resolveAttachmentUrl(a);
          const externalHref = url && isInternalHostedUrl(url) ? url : null;
          return (
            <AttachmentRow
              key={a.id}
              attachment={a}
              externalHref={externalHref}
              onOpen={() =>
                onPreview({
                  id: a.id,
                  kind: a.kind,
                  fileName: a.fileName,
                  fileUrl: a.fileUrl,
                  fileSizeBytes: a.fileSizeBytes,
                  mimeType: a.mimeType,
                  linkUrl: a.linkUrl,
                  linkLabel: a.linkLabel,
                })
              }
              onDownload={() => {
                const u = resolveAttachmentUrl(a);
                const filename = a.kind === "file" ? (a.fileName || "download") : (a.linkLabel || "link");
                if (!u) return;
                const proxyUrl = `/api/download?url=${encodeURIComponent(u)}&name=${encodeURIComponent(filename)}`;
                const link = document.createElement("a");
                link.href = proxyUrl;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            />
          );
        })}
      </div>
    )}
  </Section>
);

/* ─────────────────────────────────────────────────────────
 * Attachment row
 * ─────────────────────────────────────────────────────── */
const AttachmentRow: React.FC<{
  attachment: PortalMomAttachment;
  externalHref: string | null;
  onOpen: () => void;
  onDownload?: () => void;
}> = ({ attachment, externalHref, onOpen, onDownload }) => {
  const [hover, setHover] = useState(false);
  const isFile = attachment.kind === "file";
  const isImage = !!attachment.mimeType?.startsWith("image/");
  const isPdf = attachment.mimeType === "application/pdf";
  const Icon = !isFile
    ? Link2
    : isImage
      ? ImageIcon
      : isPdf
        ? FileType2
        : FileText;

  const label = isFile
    ? attachment.fileName || "File"
    : attachment.linkLabel || attachment.linkUrl || "Link";
  const sub = isFile
    ? attachment.mimeType || "file"
    : attachment.linkUrl
      ? (() => {
          try {
            return new URL(attachment.linkUrl).hostname.replace(/^www\./, "");
          } catch {
            return "";
          }
        })()
      : "";

  const rowStyle: React.CSSProperties = {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 12px",
    background: hover ? "#fafbfc" : T.cardBg,
    border: `1px solid ${hover ? T.borderHover : T.border}`,
    borderRadius: 10,
    textAlign: "left" as const,
    cursor: "pointer",
    width: "100%",
    transition: "background 120ms ease, border-color 120ms ease",
    textDecoration: "none",
    color: "inherit",
    boxSizing: "border-box" as const,
    overflow: "hidden" as const,
  };

  const inner = (
    <>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 7,
          background: isFile ? T.accentBg : "#f5f3ff",
          border: `1px solid ${isFile ? T.accentBorder : "#ddd6fe"}`,
          color: isFile ? T.accent : "#7c3aed",
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
            color: T.text,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </div>
        <div
          style={{
            marginTop: 1,
            fontSize: 10.5,
            color: T.textSubtle,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontWeight: 500,
          }}
        >
          {sub}
        </div>
      </div>
      <ExternalLink size={12} color={T.textFaint} />
      {hover && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(2px)' }}>
          <div role="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpen(); }} style={{ width: 28, height: 28, border: `1px solid ${T.borderHover}`, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text, cursor: 'pointer', background: T.cardBg, transition: 'background 0.2s', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#fafbfc')} onMouseLeave={(e) => (e.currentTarget.style.background = T.cardBg)}>
            <Eye size={13} />
          </div>
          {onDownload && (
            <div role="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDownload(); }} style={{ width: 28, height: 28, border: `1px solid ${T.borderHover}`, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text, cursor: 'pointer', background: T.cardBg, transition: 'background 0.2s', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#fafbfc')} onMouseLeave={(e) => (e.currentTarget.style.background = T.cardBg)}>
              <Download size={13} />
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <div
      onClick={(e) => {
        if (externalHref) {
          window.open(externalHref, "_blank", "noopener,noreferrer");
        } else {
          onOpen();
        }
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={rowStyle}
    >
      {inner}
    </div>
  );
};

const MomNumberPill: React.FC<{ momNumber: string }> = ({ momNumber }) => (
  <span
    style={{
      fontFamily: T.numFont,
      fontSize: 10.5,
      fontWeight: 700,
      padding: "2px 7px",
      background: T.accentBg,
      border: `1px solid ${T.accentBorder}`,
      borderRadius: 5,
      color: T.accent,
      letterSpacing: "0.02em",
      whiteSpace: "nowrap",
      display: "inline-flex",
      alignItems: "center",
      gap: 3,
    }}
  >
    <Hash size={9} />
    {momNumber}
  </span>
);
