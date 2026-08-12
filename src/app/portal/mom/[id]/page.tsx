"use client";
import ZukvoLoader from "@/components/common/ZukvoLoader";


import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {  Empty } from "antd";
import {
  ArrowLeft,
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
} from "lucide-react";
import AttachmentPreviewDrawer, {
  PreviewAttachment,
} from "@/app/portal/_components/AttachmentPreviewDrawer";
import {
  portalMomService,
  PortalMomDetail,
  PortalMomAttachment,
} from "@/services/portalMomService";

const p = {
  surface: "#ffffff",
  surfaceElevated: "#ffffff",
  surfaceMuted: "#f8fafc",
  border: "#e5e7eb",
  borderStrong: "#d1d5db",
  text: "#0f172a",
  textMuted: "#475569",
  textSubtle: "#64748b",
  textFaint: "#94a3b8",
  accent: "#3b82f6",
  accentBg: "#eff6ff",
  accentBorder: "#bfdbfe",
  accentText: "#1d4ed8",
  success: "#059669",
  successBg: "#ecfdf5",
  successBorder: "#a7f3d0",
  successText: "#047857",
  warning: "#d97706",
  warningBg: "#fffbeb",
  warningBorder: "#fde68a",
  warningText: "#92400e",
  purpleBg: "#f5f3ff",
  purpleBorder: "#ddd6fe",
  purpleText: "#6d28d9",
  neutralBg: "#f1f5f9",
  neutralBorder: "#e2e8f0",
  neutralText: "#475569",
};

const ACTION_META: Record<
  string,
  { label: string; tone: string; icon: any; bg: string; border: string; text: string }
> = {
  open: {
    label: "Open",
    tone: "warning",
    icon: Circle,
    bg: p.warningBg,
    border: p.warningBorder,
    text: p.warningText,
  },
  in_progress: {
    label: "In progress",
    tone: "accent",
    icon: Pause,
    bg: p.accentBg,
    border: p.accentBorder,
    text: p.accentText,
  },
  done: {
    label: "Done",
    tone: "success",
    icon: CheckCircle2,
    bg: p.successBg,
    border: p.successBorder,
    text: p.successText,
  },
  cancelled: {
    label: "Cancelled",
    tone: "neutral",
    icon: XCircle,
    bg: p.neutralBg,
    border: p.neutralBorder,
    text: p.neutralText,
  },
  converted: {
    label: "Converted to ticket",
    tone: "purple",
    icon: GitPullRequest,
    bg: p.purpleBg,
    border: p.purpleBorder,
    text: p.purpleText,
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

/**
 * URLs hosted under our own domains should bypass the in-app preview drawer
 * and open in a new tab. The iframe sandbox blocks our own staff apps from
 * functioning correctly (cookies, X-Frame-Options), and the user is already
 * signed in to those, so a new-tab handoff is the right call.
 *
 * Uses literal substring match (per product spec) so a malformed URL or
 * stray whitespace can't silently disable the rule.
 */
const INTERNAL_HOST_NEEDLES = ["zithspace.com", "zukvo.com"];
function isInternalHostedUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return INTERNAL_HOST_NEEDLES.some((needle) => lower.includes(needle));
}

/**
 * Some legacy link attachments were saved with URL/label swapped (the form
 * validation used to be lenient enough that "https://Project Overview"
 * passed). When linkUrl doesn't look like a real http(s) URL but linkLabel
 * does, prefer linkLabel as the actual destination.
 */
function looksLikeRealUrl(s: string | null | undefined): boolean {
  if (!s) return false;
  try {
    const u = new URL(s.trim());
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    // Require at least one dot in the hostname so "Project Overview" or
    // "localhost" patterns don't masquerade as URLs.
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

/* --------------------------------------------------------------- */

export default function PortalMomDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [mom, setMom] = useState<PortalMomDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewAttachment, setPreviewAttachment] =
    useState<PreviewAttachment | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancel = false;
    (async () => {
      setLoading(true);
      try {
        const data = await portalMomService.detail(id);
        if (!cancel) setMom(data);
      } catch {
        if (!cancel) setMom(null);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
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
        <ZukvoLoader size="lg" />
      </div>
    );
  }

  if (!mom) {
    return (
      <div style={{ padding: 48 }}>
        <Empty description="Meeting not found" />
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button
            onClick={() => router.push("/portal/mom")}
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
            Back to meetings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "32px 40px 56px", maxWidth: 1000 }}>
      {/* Back */}
      <button
        type="button"
        onClick={() => router.push("/portal/mom")}
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
        Back to meetings
      </button>

      {/* Header */}
      <div
        style={{
          padding: "28px 30px",
          background: "transparent",
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 6px 16px -2px rgba(99, 102, 241, 0.25)",
            }}
          >
            <Calendar size={22} color="#ffffff" />
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
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: 10.5,
                  fontWeight: 600,
                  padding: "2px 8px",
                  background: "rgba(99, 102, 241, 0.07)",
                  border: "1px solid rgba(99, 102, 241, 0.15)",
                  borderRadius: 6,
                  color: "#4f46e5",
                  letterSpacing: "0.02em",
                }}
              >
                {mom.momNumber}
              </span>
              {mom.project && (
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 600,
                    color: "#475569",
                    background: "rgba(15, 23, 42, 0.05)",
                    padding: "2px 8px",
                    borderRadius: 6,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {mom.project.name}
                  {mom.project.code ? ` · ${mom.project.code}` : ""}
                </span>
              )}
            </div>
            <h1
              style={{
                margin: "10px 0 0",
                fontSize: 24,
                fontWeight: 700,
                color: "#0f172a",
                letterSpacing: "-0.02em",
                lineHeight: 1.25,
              }}
            >
              {mom.title}
            </h1>
            <div
              style={{
                marginTop: 12,
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                alignItems: "center",
                fontSize: 12.5,
                color: "#64748b",
              }}
            >
              <MetaPiece icon={<Clock size={12} color="#6366f1" style={{ opacity: 0.85 }} />} value={fmtDateTime(mom.meetingDate)} />
              {mom.durationMinutes && (
                <>
                  <span style={{ width: 3, height: 3, borderRadius: "50%", backgroundColor: "#cbd5e1" }}></span>
                  <MetaPiece icon={<Clock size={12} color="#6366f1" style={{ opacity: 0.85 }} />} value={`${mom.durationMinutes} min`} />
                </>
              )}
              {mom.location && (
                <>
                  <span style={{ width: 3, height: 3, borderRadius: "50%", backgroundColor: "#cbd5e1" }}></span>
                  <MetaPiece icon={<MapPin size={12} color="#6366f1" style={{ opacity: 0.85 }} />} value={mom.location} />
                </>
              )}
            </div>
            {mom.recordingUrl && (
              <a
                href={mom.recordingUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  marginTop: 14,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                  border: "1px solid #bfdbfe",
                  borderRadius: 10,
                  color: "#1d4ed8",
                  fontSize: 12.5,
                  textDecoration: "none",
                  fontWeight: 600,
                  boxShadow: "0 1px 2px rgba(37, 99, 235, 0.04)",
                  transition: "all 0.2s ease",
                }}
              >
                <Video size={13.5} color="#2563eb" />
                Watch recording
                <ExternalLink size={11} color="#2563eb" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 280px",
          gap: 16,
          alignItems: "flex-start",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {(mom.summary || mom.aiSummary) && (
            <Card
              title={mom.aiSummary && !mom.summary ? "AI summary" : "Summary"}
              icon={mom.aiSummary && !mom.summary ? Sparkles : Lightbulb}
              accent
            >
              <div
                style={{
                  fontSize: 13.5,
                  color: p.textMuted,
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                }}
              >
                {mom.summary || mom.aiSummary}
              </div>
              {mom.summary && mom.aiSummary && (
                <div
                  style={{
                    marginTop: 14,
                    paddingTop: 14,
                    borderTop: `1px dashed ${p.border}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: p.purpleText,
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
                      fontSize: 13,
                      color: p.textMuted,
                      lineHeight: 1.6,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {mom.aiSummary}
                  </div>
                </div>
              )}
            </Card>
          )}

          {mom.decisions.length > 0 && (
            <Card
              title={`Decisions · ${mom.decisions.length}`}
              icon={Lightbulb}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {mom.decisions.map((d, index) => (
                  <div
                    key={d.id}
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                      fontSize: 13.5,
                      color: "#1e293b",
                      lineHeight: 1.55,
                      paddingBottom: index === mom.decisions.length - 1 ? 0 : 10,
                      borderBottom: index === mom.decisions.length - 1 ? "none" : "1px solid #f1f5f9",
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "#8b5cf6",
                        marginTop: 7,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 500 }}>{d.decision}</span>
                      {d.decided_by && (
                        <span 
                          style={{ 
                            color: "#64748b", 
                            fontSize: 12, 
                            marginLeft: 8, 
                            fontWeight: 500,
                            background: "#f1f5f9",
                            padding: "1px 6px",
                            borderRadius: 4
                          }}
                        >
                          — {d.decided_by}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card
            title={`Action items · ${mom.actionItems.length}`}
            icon={ListChecks}
          >
            {mom.actionItems.length === 0 ? (
              <div style={{ fontSize: 12.5, color: "#64748b" }}>
                No action items.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {mom.actionItems.map((ai) => {
                  const meta = ACTION_META[ai.status || "open"];
                  const Icon = meta.icon;
                  return (
                    <div
                      key={ai.id}
                      style={{
                        padding: "14px 16px",
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: 12,
                        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.02)",
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
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              fontSize: 13.5,
                              color: "#0f172a",
                              lineHeight: 1.5,
                              fontWeight: 600,
                            }}
                          >
                            {ai.text}
                          </div>
                          <div
                            style={{
                              marginTop: 8,
                              display: "flex",
                              gap: 8,
                              flexWrap: "wrap",
                              alignItems: "center",
                              fontSize: 11.5,
                              color: "#64748b",
                            }}
                          >
                            {ai.ownerName && (
                              <span
                                style={{
                                  background: "#f1f5f9",
                                  padding: "2px 8px",
                                  borderRadius: 6,
                                  color: "#334155",
                                  fontWeight: 500,
                                }}
                              >
                                👤 {ai.ownerName}
                              </span>
                            )}
                            {ai.dueDate && (
                              <span
                                style={{
                                  background: "rgba(239, 68, 68, 0.05)",
                                  padding: "2px 8px",
                                  borderRadius: 6,
                                  color: "#ef4444",
                                  fontWeight: 500,
                                }}
                              >
                                Due {fmtDate(ai.dueDate)}
                              </span>
                            )}
                            {ai.convertedTicketNumber && (
                              <span
                                style={{
                                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                                  color: "#6d28d9",
                                  background: "#f5f3ff",
                                  border: "1px solid #ddd6fe",
                                  padding: "2px 8px",
                                  borderRadius: 6,
                                  fontWeight: 600,
                                }}
                              >
                                → {ai.convertedTicketNumber}
                              </span>
                            )}
                          </div>
                        </div>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "3px 9px",
                            background: meta.bg,
                            border: `1px solid ${meta.border}`,
                            color: meta.text,
                            borderRadius: 999,
                            fontSize: 11.5,
                            fontWeight: 600,
                            flexShrink: 0,
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
            )}
          </Card>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {mom.attachments && mom.attachments.length > 0 && (
            <Card
              title={`Attachments · ${mom.attachments.length}`}
              icon={Paperclip}
            >
              <div
                style={{ display: "flex", flexDirection: "column", gap: 6 }}
              >
                {mom.attachments.map((a) => {
                  const url = resolveAttachmentUrl(a);
                  // Same-org links (zithspace / zukvo) render as a real
                  // anchor so the browser handles the new-tab navigation
                  // natively — window.open from a handler can be silently
                  // blocked by popup blockers.
                  const externalHref =
                    url && isInternalHostedUrl(url) ? url : null;
                  return (
                    <AttachmentRow
                      key={a.id}
                      attachment={a}
                      externalHref={externalHref}
                      onOpen={() => {
                        setPreviewAttachment({
                          id: a.id,
                          kind: a.kind,
                          fileName: a.fileName,
                          fileUrl: a.fileUrl,
                          fileSizeBytes: a.fileSizeBytes,
                          mimeType: a.mimeType,
                          linkUrl: a.linkUrl,
                          linkLabel: a.linkLabel,
                        });
                      }}
                    />
                  );
                })}
              </div>
            </Card>
          )}

          <Card title={`Attendees · ${mom.attendees.length}`} icon={Users}>
            {mom.attendees.length === 0 ? (
              <div style={{ fontSize: 12.5, color: "#64748b" }}>
                Not recorded.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {mom.attendees.map((a) => {
                  const isInternal = a.party === "internal";
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
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: isInternal 
                            ? "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)" 
                            : "linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%)",
                          border: `1px solid ${isInternal ? "#bfdbfe" : "#f5d0fe"}`,
                          color: isInternal ? "#2563eb" : "#d946ef",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 700,
                          flexShrink: 0,
                          boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                        }}
                      >
                        {(a.name || "?")
                          .split(" ")
                          .map((s) => s[0])
                          .filter(Boolean)
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#0f172a",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {a.name}
                        </div>
                        <div
                          style={{
                            fontSize: 11.5,
                            color: "#64748b",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {a.role || a.party || "Attendee"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      <AttachmentPreviewDrawer
        attachment={previewAttachment}
        onClose={() => setPreviewAttachment(null)}
      />
    </div>
  );
}

/* --------------------------------------------------------------- */

function AttachmentRow({
  attachment,
  externalHref,
  onOpen,
}: {
  attachment: PortalMomAttachment;
  externalHref: string | null;
  onOpen: () => void;
}) {
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
    ? new URL(attachment.linkUrl).hostname.replace(/^www\./, "")
    : "";

  const rowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 14px",
    background: hover ? "#eff6ff" : "#ffffff",
    border: hover ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
    borderRadius: 12,
    textAlign: "left",
    cursor: "pointer",
    width: "100%",
    transition: "all 0.2s ease",
    textDecoration: "none",
    color: hover ? "#2563eb" : "inherit",
    boxSizing: "border-box",
    boxShadow: hover ? "0 4px 12px -2px rgba(37, 99, 235, 0.05)" : "0 1px 2px rgba(0, 0, 0, 0.02)",
  };

  const inner = (
    <>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: isFile ? "rgba(99, 102, 241, 0.08)" : "rgba(139, 92, 246, 0.08)",
          border: isFile ? "1px solid rgba(99, 102, 241, 0.15)" : "1px solid rgba(139, 92, 246, 0.15)",
          color: isFile ? "#4f46e5" : "#7c3aed",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "all 0.2s ease",
        }}
      >
        <Icon size={14} color={isFile ? "#4f46e5" : "#7c3aed"} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 550,
            color: hover ? "#1d4ed8" : "#1e293b",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </div>
        <div
          style={{
            marginTop: 2,
            fontSize: 11,
            color: "#64748b",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {sub}
        </div>
      </div>
      <ExternalLink size={12} color={hover ? "#2563eb" : "#94a3b8"} style={{ transition: "all 0.2s ease" }} />
    </>
  );

  if (externalHref) {
    return (
      <a
        href={externalHref}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={rowStyle}
      >
        {inner}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={rowStyle}
    >
      {inner}
    </button>
  );
}

function MetaPiece({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      {icon}
      {value}
    </span>
  );
}

function Card({
  title,
  icon: Icon,
  accent,
  children,
}: {
  title: string;
  icon: any;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "transparent",
        border: "1px solid #e2e8f0",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "12px 18px",
          borderBottom: accent ? "1px solid rgba(99, 102, 241, 0.15)" : "1px solid #e2e8f0",
          background: accent 
            ? "rgba(99, 102, 241, 0.04)" 
            : "rgba(248, 250, 252, 0.4)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Icon size={14} color={accent ? "#4f46e5" : "#64748b"} />
        <div
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            color: accent ? "#4f46e5" : "#334155",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {title}
        </div>
      </div>
      <div style={{ padding: "18px 20px" }}>{children}</div>
    </div>
  );
}
