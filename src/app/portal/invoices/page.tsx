"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Input, Empty, Spin, Pagination } from "antd";
import {
  Receipt,
  Search,
  ChevronRight,
  ChevronDown,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Ban,
  Send,
  CreditCard,
} from "lucide-react";
import {
  portalInvoiceService,
  PortalInvoiceListItem,
  PortalInvoiceListMeta,
} from "@/services/portalInvoiceService";

/* --------------------------------------------------------------- */
/*  Theme palette (mirrors PortalAccessTab — keep portal cohesive) */
/* --------------------------------------------------------------- */

// The /portal subtree is light-mode-only for now (no theme toggle in shell).
// Mirroring the staff palette so visual language stays consistent.
const p = {
  surface: "#ffffff",
  surfaceElevated: "#ffffff",
  surfaceMuted: "#f8fafc",
  surfaceSubtle: "#f9fafb",
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
  danger: "#dc2626",
  dangerBg: "#fef2f2",
  dangerBorder: "#fecaca",
  dangerText: "#b91c1c",
  warning: "#d97706",
  warningBg: "#fffbeb",
  warningBorder: "#fde68a",
  warningText: "#92400e",
  neutralBg: "#f1f5f9",
  neutralBorder: "#e2e8f0",
  neutralText: "#475569",
};

const STATUS_META: Record<
  string,
  { label: string; tone: keyof typeof STATUS_TONE; icon: any }
> = {
  SENT: { label: "Sent", tone: "accent", icon: Send },
  VIEWED: { label: "Viewed", tone: "neutral", icon: Eye },
  PARTIALLY_PAID: { label: "Partially paid", tone: "warning", icon: CreditCard },
  PAID: { label: "Paid", tone: "success", icon: CheckCircle2 },
  OVERDUE: { label: "Overdue", tone: "danger", icon: AlertTriangle },
  CANCELLED: { label: "Cancelled", tone: "neutral", icon: Ban },
};

const STATUS_TONE = {
  accent: { bg: p.accentBg, border: p.accentBorder, text: p.accentText },
  success: { bg: p.successBg, border: p.successBorder, text: p.successText },
  warning: { bg: p.warningBg, border: p.warningBorder, text: p.warningText },
  danger: { bg: p.dangerBg, border: p.dangerBorder, text: p.dangerText },
  neutral: { bg: p.neutralBg, border: p.neutralBorder, text: p.neutralText },
};

const FILTER_TABS: { key: string; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "OVERDUE", label: "Overdue" },
  { key: "SENT", label: "Sent" },
  { key: "VIEWED", label: "Viewed" },
  { key: "PARTIALLY_PAID", label: "Partially paid" },
  { key: "PAID", label: "Paid" },
  { key: "CANCELLED", label: "Cancelled" },
];

function fmtCurrency(value: number | string | null | undefined, currency?: string | null) {
  if (value == null || value === "") return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (isNaN(n)) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${currency || ""} ${n.toFixed(2)}`.trim();
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

function daysUntil(due: string | null) {
  if (!due) return null;
  const ms = new Date(due).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

/* --------------------------------------------------------------- */

export default function PortalInvoicesPage() {
  const [items, setItems] = useState<PortalInvoiceListItem[]>([]);
  const [meta, setMeta] = useState<PortalInvoiceListMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const load = async () => {
    setLoading(true);
    try {
      const res = await portalInvoiceService.list({
        page,
        limit,
        status: status === "ALL" ? undefined : status,
        search: search || undefined,
      });
      setItems(res.data);
      setMeta(res.meta);
    } catch (err) {
      setItems([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const summary = meta?.summary;
  const summaryCounts = summary?.counts || {};
  const overdueCount = useMemo(() => {
    // items has decorated status; overdue is computed
    return items.filter((i) => i.isOverdue).length;
  }, [items]);

  return (
    <div style={{ padding: "32px 40px 48px", maxWidth: 1280 }}>
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
          Zukvo · Billing
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <h1
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: p.text,
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Invoices
          </h1>
        </div>
        <div style={{ marginTop: 6, fontSize: 13.5, color: p.textMuted }}>
          Review every invoice issued to your organisation, download PDFs, and
          upload payment proof.
        </div>
      </div>

      {/* Summary strip */}
      {summary && summary.totalInvoices > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
            marginBottom: 18,
          }}
        >
          <SummaryCard
            label="Outstanding balance"
            value={fmtCurrency(summary.totalBalanceDue, summary.currency)}
            sub={`${summary.totalInvoices} invoice${
              summary.totalInvoices === 1 ? "" : "s"
            } total`}
            tone="accent"
          />
          <SummaryCard
            label="Overdue"
            value={String(summaryCounts.OVERDUE || overdueCount || 0)}
            sub="Past due date"
            tone="danger"
          />
          <SummaryCard
            label="Awaiting payment"
            value={String(
              (summaryCounts.SENT || 0) + (summaryCounts.PARTIALLY_PAID || 0),
            )}
            sub="Sent or partially paid"
            tone="warning"
          />
          <SummaryCard
            label="Paid"
            value={String(summaryCounts.PAID || 0)}
            sub="Fully settled"
            tone="success"
          />
        </div>
      )}

      {/* Filter pills + search */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {FILTER_TABS.map((tab) => {
            const active = status === tab.key;
            const count =
              tab.key === "ALL"
                ? summary?.totalInvoices
                : summaryCounts[tab.key];
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setStatus(tab.key);
                  setPage(1);
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 12px",
                  background: active ? p.text : p.surfaceElevated,
                  color: active ? "#ffffff" : p.textMuted,
                  border: `1px solid ${active ? p.text : p.border}`,
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 120ms ease",
                }}
              >
                {tab.label}
                {count != null && count > 0 && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "1px 7px",
                      borderRadius: 999,
                      background: active ? "rgba(255,255,255,0.15)" : p.neutralBg,
                      color: active ? "#ffffff" : p.textSubtle,
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <Input
          allowClear
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          prefix={<Search size={14} color={p.textFaint} />}
          placeholder="Search invoice # or description…"
          style={{ width: 280 }}
        />
      </div>

      {/* List */}
      <div
        style={{
          background: p.surfaceElevated,
          border: `1px solid ${p.border}`,
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div style={{ padding: 60, textAlign: "center" }}>
            <Spin />
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: 56, textAlign: "center" }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ color: p.textSubtle }}>
                  {search
                    ? `No invoices match "${search}".`
                    : status === "ALL"
                    ? "No invoices yet."
                    : `No invoices in this status.`}
                </span>
              }
            />
          </div>
        ) : (
          <>
            {/* Header row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(220px, 1.4fr) 110px 130px 140px 1fr 36px",
                gap: 14,
                padding: "12px 18px",
                background: p.surfaceMuted,
                borderBottom: `1px solid ${p.border}`,
                fontSize: 11,
                fontWeight: 600,
                color: p.textSubtle,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              <div>Invoice</div>
              <div>Status</div>
              <div>Due</div>
              <div style={{ textAlign: "right" }}>Amount</div>
              <div style={{ textAlign: "right" }}>Balance</div>
              <div />
            </div>

            {items.map((inv) => (
              <InvoiceRow key={inv.id} inv={inv} />
            ))}
          </>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.total > limit && (
        <div
          style={{
            marginTop: 16,
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
/*  Sub-components                                                  */
/* --------------------------------------------------------------- */

function SummaryCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: "accent" | "success" | "warning" | "danger";
}) {
  const t = STATUS_TONE[tone];
  return (
    <div
      style={{
        padding: "16px 18px",
        background: p.surfaceElevated,
        border: `1px solid ${p.border}`,
        borderRadius: 12,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: p.textSubtle,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 22,
          fontWeight: 600,
          color: p.text,
          letterSpacing: "-0.01em",
        }}
      >
        {value}
      </div>
      <div
        style={{
          marginTop: 6,
          display: "inline-flex",
          alignItems: "center",
          padding: "2px 8px",
          fontSize: 11.5,
          fontWeight: 500,
          background: t.bg,
          border: `1px solid ${t.border}`,
          color: t.text,
          borderRadius: 999,
        }}
      >
        {sub}
      </div>
    </div>
  );
}

function StatusPill({
  status,
}: {
  status: string;
}) {
  const meta = STATUS_META[status] || {
    label: status,
    tone: "neutral" as const,
    icon: Receipt,
  };
  const tone = STATUS_TONE[meta.tone];
  const Icon = meta.icon;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 8px",
        background: tone.bg,
        border: `1px solid ${tone.border}`,
        color: tone.text,
        borderRadius: 999,
        fontSize: 11.5,
        fontWeight: 500,
        lineHeight: 1.2,
      }}
    >
      <Icon size={11} />
      {meta.label}
    </span>
  );
}

function InvoiceRow({ inv }: { inv: PortalInvoiceListItem }) {
  const [hover, setHover] = useState(false);
  const dDue = daysUntil(inv.dueDate);
  const dueLabel = (() => {
    if (!inv.dueDate) return "—";
    if (inv.status === "PAID" || inv.status === "CANCELLED")
      return fmtDate(inv.dueDate);
    if (dDue == null) return fmtDate(inv.dueDate);
    if (dDue < 0)
      return `${Math.abs(dDue)}d overdue`;
    if (dDue === 0) return "Due today";
    if (dDue <= 7) return `${dDue}d left`;
    return fmtDate(inv.dueDate);
  })();
  const dueColor =
    inv.isOverdue || (dDue != null && dDue < 0)
      ? p.dangerText
      : dDue != null && dDue <= 7 && inv.status !== "PAID" && inv.status !== "CANCELLED"
      ? p.warningText
      : p.textMuted;

  return (
    <Link
      href={`/portal/invoices/${inv.id}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "grid",
        gridTemplateColumns:
          "minmax(220px, 1.4fr) 110px 130px 140px 1fr 36px",
        gap: 14,
        padding: "16px 18px",
        borderBottom: `1px solid ${p.border}`,
        textDecoration: "none",
        background: hover ? p.surfaceMuted : "transparent",
        color: "inherit",
        transition: "background 120ms ease",
        alignItems: "center",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: p.text,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            letterSpacing: "-0.01em",
          }}
        >
          {inv.invoiceNumber}
        </div>
        <div
          style={{
            marginTop: 3,
            fontSize: 12,
            color: p.textSubtle,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          Issued {fmtDate(inv.invoiceDate)}
          {inv.description ? ` · ${inv.description}` : ""}
        </div>
      </div>
      <div>
        <StatusPill status={inv.status} />
      </div>
      <div style={{ fontSize: 12.5, color: dueColor, fontWeight: 500 }}>
        {dueLabel}
      </div>
      <div
        style={{
          fontSize: 13.5,
          fontWeight: 600,
          color: p.text,
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {fmtCurrency(inv.grandTotal ?? inv.subtotal, inv.currency)}
      </div>
      <div
        style={{
          fontSize: 13,
          color: Number(inv.balanceDue) > 0 ? p.text : p.textFaint,
          fontWeight: Number(inv.balanceDue) > 0 ? 600 : 400,
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {fmtCurrency(inv.balanceDue, inv.currency)}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <ChevronRight size={16} color={p.textFaint} />
      </div>
    </Link>
  );
}
