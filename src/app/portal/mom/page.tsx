"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Empty, Spin, Pagination, Select } from "antd";
import {
  Search,
  Calendar,
  ChevronRight,
  Users,
  CheckSquare,
  Video,
  Clock,
  Lightbulb,
  Paperclip,
  FileText,
  Link2,
  ExternalLink,
} from "lucide-react";
import {
  portalMomService,
  PortalMomListItem,
  PortalMomListAttachment,
  PortalMomMeta,
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
  warning: "#d97706",
  warningBg: "#fffbeb",
  warningBorder: "#fde68a",
  warningText: "#92400e",
  success: "#059669",
  successBg: "#ecfdf5",
  successBorder: "#a7f3d0",
  successText: "#047857",
  purpleBg: "#f5f3ff",
  purpleBorder: "#ddd6fe",
  purpleText: "#6d28d9",
  neutralBg: "#f1f5f9",
  neutralBorder: "#e2e8f0",
  neutralText: "#475569",
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

/* --------------------------------------------------------------- */

export default function PortalMomPage() {
  const [items, setItems] = useState<PortalMomListItem[]>([]);
  const [meta, setMeta] = useState<PortalMomMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const load = async () => {
    setLoading(true);
    try {
      const res = await portalMomService.list({
        page,
        limit,
        projectId,
        search: search || undefined,
      });
      setItems(res.data);
      setMeta(res.meta);
    } catch {
      setItems([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, projectId]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const totals = useMemo(() => {
    const totalOpen = items.reduce((s, m) => s + m.openActionCount, 0);
    return { totalOpen };
  }, [items]);

  return (
    <div style={{ padding: "32px 40px 56px", maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: p.textSubtle,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: 6,
          }}
        >
          Zukvo · Meetings
        </div>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 600,
            color: p.text,
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          Minutes of meeting
        </h1>
        <div style={{ marginTop: 6, fontSize: 13.5, color: p.textMuted }}>
          Every meeting summary, decision logged, and action item — shared
          back from your account team.
        </div>
      </div>

      {/* Filter row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 12,
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            fontSize: 12.5,
            color: p.textSubtle,
          }}
        >
          {meta && meta.total > 0 && (
            <span>
              {meta.total} meeting{meta.total === 1 ? "" : "s"}
              {totals.totalOpen > 0 && (
                <span style={{ color: p.warningText, fontWeight: 500 }}>
                  {" "}
                  · {totals.totalOpen} open action item
                  {totals.totalOpen === 1 ? "" : "s"} on this page
                </span>
              )}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {meta && meta.projects.length > 1 && (
            <Select
              allowClear
              placeholder="All projects"
              style={{ width: 200 }}
              value={projectId}
              onChange={(v) => {
                setProjectId(v);
                setPage(1);
              }}
              options={meta.projects.map((p) => ({
                value: p.id,
                label: p.name,
              }))}
            />
          )}
          <Input
            allowClear
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            prefix={<Search size={14} color={p.textFaint} />}
            placeholder="Search title or number…"
            style={{ width: 280 }}
          />
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div
          style={{
            padding: 80,
            textAlign: "center",
            background: p.surfaceElevated,
            border: `1px solid ${p.border}`,
            borderRadius: 12,
          }}
        >
          <Spin />
        </div>
      ) : items.length === 0 ? (
        <div
          style={{
            padding: 64,
            textAlign: "center",
            background: p.surfaceElevated,
            border: `1px dashed ${p.border}`,
            borderRadius: 12,
          }}
        >
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span style={{ color: p.textSubtle, fontSize: 13 }}>
                {search
                  ? `No meetings match "${search}".`
                  : "No meeting minutes shared yet."}
              </span>
            }
          />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map((m) => (
            <MeetingCard key={m.id} mom={m} />
          ))}
        </div>
      )}

      {meta && meta.total > limit && (
        <div
          style={{
            marginTop: 18,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Pagination
            current={page}
            pageSize={limit}
            total={meta.total}
            onChange={setPage}
            showSizeChanger={false}
          />
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- */

function MeetingCard({ mom }: { mom: PortalMomListItem }) {
  const router = useRouter();
  const [hover, setHover] = useState(false);
  const attachments = mom.attachments ?? [];
  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/portal/mom/${mom.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(`/portal/mom/${mom.id}`);
        }
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: 18,
        background: p.surfaceElevated,
        border: `1px solid ${hover ? p.borderStrong : p.border}`,
        borderRadius: 12,
        textDecoration: "none",
        color: "inherit",
        cursor: "pointer",
        transition: "border-color 120ms ease",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 14,
          alignItems: "flex-start",
        }}
      >
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", minWidth: 0 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: p.accentBg,
              border: `1px solid ${p.accentBorder}`,
              color: p.accentText,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Calendar size={18} />
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
                {mom.momNumber}
              </span>
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: p.text,
                  letterSpacing: "-0.01em",
                }}
              >
                {mom.title}
              </span>
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 12.5,
                color: p.textSubtle,
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
                <Clock size={11} />
                {fmtDateTime(mom.meetingDate)}
              </span>
              {mom.durationMinutes && (
                <>
                  <span style={{ color: p.textFaint }}>·</span>
                  <span>{mom.durationMinutes} min</span>
                </>
              )}
              {mom.projectName && (
                <>
                  <span style={{ color: p.textFaint }}>·</span>
                  <span>{mom.projectName}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <ChevronRight size={16} color={p.textFaint} style={{ flexShrink: 0 }} />
      </div>

      {mom.summaryPreview && (
        <div
          style={{
            fontSize: 13,
            color: p.textMuted,
            lineHeight: 1.55,
            paddingLeft: 56,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {mom.summaryPreview}
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          paddingLeft: 56,
        }}
      >
        <MiniChip
          icon={Users}
          value={mom.attendeeCount}
          label="attendees"
          tone="neutral"
        />
        <MiniChip
          icon={Lightbulb}
          value={mom.decisionCount}
          label="decisions"
          tone="purple"
        />
        <MiniChip
          icon={CheckSquare}
          value={mom.actionCount}
          label={`actions${
            mom.openActionCount > 0 ? ` (${mom.openActionCount} open)` : ""
          }`}
          tone={mom.openActionCount > 0 ? "warning" : "success"}
        />
        {mom.recordingUrl && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "2px 8px",
              background: p.accentBg,
              border: `1px solid ${p.accentBorder}`,
              color: p.accentText,
              borderRadius: 999,
              fontSize: 11.5,
              fontWeight: 500,
            }}
          >
            <Video size={11} />
            Recording
          </span>
        )}
      </div>

      {attachments.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            paddingLeft: 56,
            alignItems: "center",
          }}
        >
          <Paperclip size={11} color={p.textFaint} />
          {attachments.map((a) => (
            <AttachmentChip key={a.id} attachment={a} />
          ))}
        </div>
      )}
    </div>
  );
}

function looksLikeRealUrl(s: string | null | undefined): boolean {
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
}

function resolveAttachmentUrl(a: PortalMomListAttachment): string | null {
  if (a.kind === "file") return a.fileUrl ?? null;
  if (looksLikeRealUrl(a.linkUrl)) return a.linkUrl;
  if (looksLikeRealUrl(a.linkLabel)) return a.linkLabel;
  return a.linkUrl ?? null;
}

function AttachmentChip({
  attachment,
}: {
  attachment: PortalMomListAttachment;
}) {
  const url = resolveAttachmentUrl(attachment);
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
        background: p.surfaceMuted,
        border: `1px solid ${p.border}`,
        borderRadius: 999,
        color: p.accentText,
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

function MiniChip({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: any;
  value: number;
  label: string;
  tone: "neutral" | "purple" | "warning" | "success";
}) {
  if (value === 0) return null;
  const map = {
    neutral: { bg: p.neutralBg, border: p.neutralBorder, text: p.neutralText },
    purple: { bg: p.purpleBg, border: p.purpleBorder, text: p.purpleText },
    warning: { bg: p.warningBg, border: p.warningBorder, text: p.warningText },
    success: { bg: p.successBg, border: p.successBorder, text: p.successText },
  }[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        background: map.bg,
        border: `1px solid ${map.border}`,
        color: map.text,
        borderRadius: 999,
        fontSize: 11.5,
        fontWeight: 500,
      }}
    >
      <Icon size={11} />
      {value} {label}
    </span>
  );
}
