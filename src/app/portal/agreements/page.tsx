"use client";

/**
 * Agreements, as the client sees them.
 *
 * TWO STATUS CHIPS PER ROW, and that is the point of the screen. The first is
 * where the document stands — Pending, Active, Expired, Terminated. The second
 * is whether anyone here has opened it. An Active agreement nobody has read
 * and an Active agreement someone has read are the same contract in different
 * situations, and one field cannot say both.
 *
 * DRAFTS DO NOT APPEAR. The server filters them in SQL rather than trusting
 * this page — wording still being argued over on our side is not a document
 * the client has.
 *
 * Opening one marks it viewed, first time only.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Drawer, Empty, Input } from "antd";
import {
  CheckCircle2,
  Ban,
  CalendarX,
  Clock,
  Eye,
  EyeOff,
  FileSignature,
  Search,
  X,
} from "lucide-react";
import ZukvoLoader from "@/components/common/ZukvoLoader";
import {
  portalAgreementService,
  PortalAgreementDetail,
  PortalAgreementListItem,
  PortalAgreementStats,
} from "@/services/portalAgreementService";

/* The /portal subtree is light-mode only; this mirrors the invoices palette so
   the portal keeps one visual language. */
const p = {
  surface: "#ffffff",
  surfaceMuted: "#f8fafc",
  border: "#e2e8f0",
  text: "#0f172a",
  textMuted: "#475569",
  textSubtle: "#64748b",
  textFaint: "#94a3b8",
  accent: "#6366f1",
  accentBg: "#e0e7ff",
  accentBorder: "#c7d2fe",
  accentText: "#4338ca",
  successBg: "#ecfdf5",
  successBorder: "#a7f3d0",
  successText: "#047857",
  dangerBg: "#fef2f2",
  dangerBorder: "#fecaca",
  dangerText: "#b91c1c",
  warningBg: "#fffbeb",
  warningBorder: "#fde68a",
  warningText: "#b45309",
  neutralBg: "#f8fafc",
  neutralBorder: "#e2e8f0",
  neutralText: "#475569",
};

const TONE = {
  accent: { bg: p.accentBg, border: p.accentBorder, text: p.accentText },
  success: { bg: p.successBg, border: p.successBorder, text: p.successText },
  warning: { bg: p.warningBg, border: p.warningBorder, text: p.warningText },
  danger: { bg: p.dangerBg, border: p.dangerBorder, text: p.dangerText },
  neutral: { bg: p.neutralBg, border: p.neutralBorder, text: p.neutralText },
};

/** Where the document stands. Draft is absent because it never arrives. */
const STATUS_META: Record<string, { label: string; tone: keyof typeof TONE; icon: any }> = {
  pending: { label: "Pending", tone: "warning", icon: Clock },
  active: { label: "Active", tone: "success", icon: CheckCircle2 },
  expired: { label: "Expired", tone: "neutral", icon: CalendarX },
  terminated: { label: "Terminated", tone: "danger", icon: Ban },
};

const FILTERS: { key: string; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "active", label: "Active" },
  { key: "NOT_VIEWED", label: "Not viewed" },
  { key: "expired", label: "Expired" },
];

function Chip({
  tone,
  icon: Icon,
  children,
}: {
  tone: keyof typeof TONE;
  icon?: any;
  children: React.ReactNode;
}) {
  const t = TONE[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        height: 23,
        padding: "0 9px",
        borderRadius: 999,
        background: t.bg,
        border: `1px solid ${t.border}`,
        color: t.text,
        fontSize: 11.5,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
}

function fmtDate(value?: string | null): string {
  if (!value) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  const d = m ? new Date(`${m[0]}T00:00:00`) : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function fmtMoney(value?: string | null, currency?: string | null): string {
  if (value == null || value === "") return "";
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${currency || ""} ${n.toLocaleString()}`.trim();
  }
}

export default function PortalAgreementsPage() {
  const [items, setItems] = useState<PortalAgreementListItem[]>([]);
  const [stats, setStats] = useState<PortalAgreementStats>({
    total: 0,
    pending: 0,
    active: 0,
    notViewed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<PortalAgreementDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await portalAgreementService.list();
      setItems(data.items ?? []);
      setStats(data.stats ?? { total: 0, pending: 0, active: 0, notViewed: 0 });
    } catch (err: any) {
      setError(err?.message || "Could not load your agreements");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const open = async (id: string) => {
    setOpenId(id);
    setDetailLoading(true);
    setDetail(null);
    try {
      const record = await portalAgreementService.detail(id);
      setDetail(record);
      // The row behind the drawer is now stale: the server just marked it
      // viewed, and leaving "Not viewed" on screen would contradict the act of
      // reading it.
      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? {
                ...i,
                portalViewedAt: record.portalViewedAt,
                viewStatus: record.viewStatus,
                viewStatusLabel: record.viewStatusLabel,
              }
            : i
        )
      );
    } catch (err: any) {
      setError(err?.message || "Could not open that agreement");
      setOpenId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      if (filter === "NOT_VIEWED" && i.viewStatus !== "NOT_VIEWED") return false;
      if (filter !== "ALL" && filter !== "NOT_VIEWED" && i.status !== filter) return false;
      if (!q) return true;
      return [i.title, i.documentNumber, i.documentTypeName, i.projectName]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [items, search, filter]);

  const notViewedCount = items.filter((i) => i.viewStatus === "NOT_VIEWED").length;

  return (
    <div style={{ padding: "20px 24px 32px", maxWidth: 1200, margin: "0 auto" }}>
      <header style={{ marginBottom: 18 }}>
        <h1
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            margin: 0,
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: p.text,
          }}
        >
          <FileSignature size={20} style={{ color: p.accent }} />
          Agreements
        </h1>
        <p style={{ margin: "6px 0 0", fontSize: 13, color: p.textSubtle }}>
          Every agreement shared with you. Opening one marks it as viewed.
        </p>
      </header>

      {/* The two numbers worth leading with: what is waiting, and what nobody
          here has read yet. */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
        {(
          [
            ["Total", stats.total, "neutral"],
            ["Pending", stats.pending, "warning"],
            ["Active", stats.active, "success"],
            ["Not viewed", notViewedCount, "accent"],
          ] as Array<[string, number, keyof typeof TONE]>
        ).map(([label, value, tone]) => (
          <div
            key={label}
            style={{
              flex: "1 1 130px",
              padding: "10px 13px",
              borderRadius: 11,
              background: TONE[tone].bg,
              border: `1px solid ${TONE[tone].border}`,
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 800, color: TONE[tone].text, lineHeight: 1.1 }}>
              {value}
            </div>
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: TONE[tone].text,
                opacity: 0.8,
                marginTop: 3,
              }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        <Input
          allowClear
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, reference or project"
          prefix={<Search size={14} style={{ color: p.textFaint }} />}
          style={{ flex: "1 1 260px", maxWidth: 380, borderRadius: 9 }}
        />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {FILTERS.map((f) => {
            const on = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                style={{
                  height: 32,
                  padding: "0 13px",
                  borderRadius: 9,
                  cursor: "pointer",
                  fontSize: 12.5,
                  fontWeight: 600,
                  background: on ? p.accentBg : p.surface,
                  border: `1px solid ${on ? p.accentBorder : p.border}`,
                  color: on ? p.accentText : p.textMuted,
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div style={{ display: "grid", placeItems: "center", padding: "70px 0" }}>
          <ZukvoLoader size="md" />
        </div>
      ) : error ? (
        <div
          style={{
            padding: "14px 16px",
            borderRadius: 11,
            background: p.dangerBg,
            border: `1px solid ${p.dangerBorder}`,
            color: p.dangerText,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      ) : visible.length === 0 ? (
        <div
          style={{
            padding: "48px 0",
            borderRadius: 12,
            background: p.surface,
            border: `1px solid ${p.border}`,
          }}
        >
          <Empty
            description={
              items.length === 0
                ? "No agreements have been shared with you yet"
                : "Nothing matches that search"
            }
          />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {visible.map((a) => {
            const meta = STATUS_META[a.status] ?? {
              label: a.status,
              tone: "neutral" as const,
              icon: FileSignature,
            };
            const viewed = a.viewStatus === "VIEWED";
            const money = fmtMoney(a.totalValue, a.valueCurrency);
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => open(a.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  width: "100%",
                  padding: "13px 15px",
                  borderRadius: 12,
                  cursor: "pointer",
                  textAlign: "left",
                  background: p.surface,
                  border: `1px solid ${p.border}`,
                  transition: "border-color .15s, box-shadow .15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = p.accentBorder;
                  e.currentTarget.style.boxShadow = "0 4px 14px -8px rgba(99,102,241,.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = p.border;
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <span
                  style={{
                    width: 36,
                    height: 36,
                    flexShrink: 0,
                    borderRadius: 10,
                    display: "grid",
                    placeItems: "center",
                    background: p.accentBg,
                    color: p.accentText,
                  }}
                >
                  <FileSignature size={17} />
                </span>

                <span style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: p.text,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {a.title}
                  </span>
                  <span
                    style={{
                      display: "block",
                      marginTop: 2,
                      fontSize: 11.5,
                      color: p.textSubtle,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {[
                      a.documentTypeName,
                      a.documentNumber,
                      a.projectName,
                      money,
                      a.effectiveDate ? `From ${fmtDate(a.effectiveDate)}` : null,
                    ]
                      .filter(Boolean)
                      .join("  ·  ")}
                  </span>
                </span>

                {/* The two statuses, side by side. */}
                <span style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <Chip tone={meta.tone} icon={meta.icon}>
                    {meta.label}
                  </Chip>
                  <Chip tone={viewed ? "neutral" : "accent"} icon={viewed ? Eye : EyeOff}>
                    {viewed ? "Viewed" : "Not viewed"}
                  </Chip>
                </span>
              </button>
            );
          })}
        </div>
      )}

      <Drawer
        open={Boolean(openId)}
        onClose={() => {
          setOpenId(null);
          setDetail(null);
        }}
        placement="right"
        width="min(900px, 96vw)"
        closable={false}
        destroyOnHidden
        styles={{ body: { padding: 0, display: "flex", flexDirection: "column" } }}
        title={null}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 16px",
            borderBottom: `1px solid ${p.border}`,
          }}
        >
          <button
            type="button"
            onClick={() => setOpenId(null)}
            aria-label="Close"
            style={{
              width: 32,
              height: 32,
              display: "grid",
              placeItems: "center",
              borderRadius: 9,
              background: p.surface,
              border: `1px solid ${p.border}`,
              cursor: "pointer",
              color: p.textMuted,
            }}
          >
            <X size={15} />
          </button>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: p.text,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {detail?.title || "Agreement"}
            </div>
            <div style={{ fontSize: 12, color: p.textSubtle, marginTop: 2 }}>
              {detail
                ? [detail.documentTypeName, detail.documentNumber, detail.projectName]
                    .filter(Boolean)
                    .join("  ·  ")
                : "Loading…"}
            </div>
          </div>
          {detail && (
            <span style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <Chip
                tone={STATUS_META[detail.status]?.tone ?? "neutral"}
                icon={STATUS_META[detail.status]?.icon}
              >
                {STATUS_META[detail.status]?.label ?? detail.status}
              </Chip>
              <Chip tone="neutral" icon={Eye}>
                Viewed
              </Chip>
            </span>
          )}
        </div>

        {detailLoading || !detail ? (
          <div style={{ flex: 1, display: "grid", placeItems: "center" }}>
            <ZukvoLoader size="md" />
          </div>
        ) : (
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", background: p.surfaceMuted }}>
            {/* The agreed wording, as stored. Sandboxed with no allow-scripts:
                it is our own HTML, but nothing in a contract needs to run. */}
            <iframe
              title={detail.title}
              sandbox=""
              srcDoc={`<!doctype html><meta charset="utf-8"><style>
                body{margin:0;padding:32px;font:11pt/1.65 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0f172a;background:#fff}
                table{border-collapse:collapse;width:100%}
                td,th{border:1px solid #e2e8f0;padding:6px 8px;text-align:left}
                img{max-width:100%}
              </style>${detail.contentHtml || "<p>This agreement has no content.</p>"}`}
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                minHeight: 600,
                border: "none",
                background: "#fff",
              }}
            />
          </div>
        )}
      </Drawer>
    </div>
  );
}
