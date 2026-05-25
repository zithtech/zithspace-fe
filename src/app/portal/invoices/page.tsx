"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Input, Empty, Spin, Pagination, DatePicker, Drawer, notification } from "antd";
import { PortalInvoiceDetailContent as PortalInvoiceDetailPage } from "./_InvoiceDetail";
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
  Clock,
  FileText,
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
  surfaceSubtle: "#f1f5f9",
  border: "#e2e8f0",
  borderStrong: "#cbd5e1",
  text: "#0f172a",
  textMuted: "#475569",
  textSubtle: "#64748b",
  textFaint: "#94a3b8",
  accent: "#6366f1",
  accentBg: "#e0e7ff",
  accentBorder: "#c7d2fe",
  accentText: "#4338ca",
  success: "#10b981",
  successBg: "#ecfdf5",
  successBorder: "#a7f3d0",
  successText: "#047857",
  danger: "#ef4444",
  dangerBg: "#fef2f2",
  dangerBorder: "#fecaca",
  dangerText: "#b91c1c",
  warning: "#f59e0b",
  warningBg: "#fffbeb",
  warningBorder: "#fde68a",
  warningText: "#b45309",
  neutralBg: "#f8fafc",
  neutralBorder: "#e2e8f0",
  neutralText: "#475569",
};

const STATUS_META: Record<
  string,
  { label: string; tone: keyof typeof STATUS_TONE; icon: any }
> = {
  DRAFT: { label: "Draft", tone: "neutral", icon: FileText },
  PENDING: { label: "Pending", tone: "warning", icon: Clock },
  APPROVAL: { label: "Approval", tone: "warning", icon: Clock },
  SUBMITTED: { label: "Submitted", tone: "accent", icon: Send },
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
  { key: "DRAFT", label: "Draft" },
  { key: "PENDING", label: "Pending" },
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
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const limit = 20;

  const load = async () => {
    setLoading(true);
    try {
      const res = await portalInvoiceService.list({
        page,
        limit,
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
  }, [page]);

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
    <div style={{ padding: "24px 32px 48px", maxWidth: 1280, margin: "0 auto", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Top Header Card */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
          padding: "16px 24px",
          background: p.surfaceElevated,
          border: `1px solid ${p.border}`,
          borderRadius: 10,
          marginBottom: 16,
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 2px 10px rgba(0,0,0,0.02)"
        }}
      >
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: p.accent }} />
        
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, background: p.accentBg, color: p.accentText,
            display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${p.accentBorder}`
          }}>
            <Receipt size={18} />
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: p.text, margin: 0, letterSpacing: "-0.01em" }}>Invoices</h1>
            <div style={{ fontSize: 12.5, color: p.textSubtle, marginTop: 2 }}>
              Every issued invoice, payment logged, and outstanding balance — shared securely.
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <MiniStat label="TOTAL" value={summary?.totalInvoices || 0} color={p.accentText} />
          <MiniStat label="OVERDUE" value={summaryCounts.OVERDUE || overdueCount || 0} color={p.dangerText} />
          <MiniStat label="UNPAID" value={(summaryCounts.SENT || 0) + (summaryCounts.PARTIALLY_PAID || 0)} color={p.warningText} />
          <MiniStat label="PAID" value={summaryCounts.PAID || 0} color={p.accentText} />
          <button style={{
            width: 44, height: 44, borderRadius: 8, border: `1px solid ${p.border}`, background: p.surfaceElevated,
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: p.textMuted,
            marginLeft: 4
          }} onClick={load}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path></svg>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {/* Search */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10, padding: "0 14px",
          border: `1px solid ${p.border}`, borderRadius: 8, background: p.surfaceElevated,
          height: 40, flex: 1, fontSize: 13, color: p.textSubtle
        }}>
          <Search size={16} color={p.textFaint} />
          <input 
            type="text" 
            placeholder="Search invoices, amounts, descriptions..."
            style={{ border: "none", outline: "none", background: "transparent", width: "100%", color: p.text }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Date Filter */}
        <DatePicker.RangePicker 
          style={{ width: 240, height: 40, borderRadius: 8, border: `1px solid ${p.border}`, background: p.surfaceElevated }}
          onChange={(dates) => {
             // Hooked up for visual rendering, API connection depends on backend support
             console.log("Selected dates:", dates);
          }}
        />
      </div>

      {/* Main List Container */}
      <style dangerouslySetInnerHTML={{__html: `
        .invoice-row:hover { background: #f8fafc !important; }
        .invoice-row:last-child { border-bottom: none !important; }
      `}} />
      <div
        style={{
          background: p.surfaceElevated,
          border: `1px solid ${p.border}`,
          borderRadius: 12,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        }}
      >
        {/* Table header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "120px 1.5fr 110px 110px 150px 120px 120px 30px",
          gap: 12,
          padding: "14px 24px",
          borderBottom: `1px solid ${p.border}`,
          background: p.surfaceElevated,
          fontSize: 10.5,
          fontWeight: 700,
          color: p.textSubtle,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
        }}>
          <div>INVOICE NUMBER</div>
          <div>CUSTOMER</div>
          <div>INVOICE DATE</div>
          <div>DUE DATE</div>
          <div>CLIENT STATUS</div>
          <div style={{ textAlign: "right" }}>AMOUNT</div>
          <div style={{ textAlign: "right" }}>BALANCE DUE</div>
          <div></div>
        </div>

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
                      : "No invoices in this status."}
                </span>
              }
            />
          </div>
        ) : (
          <div>
            {items.map((inv) => (
              <InvoiceRow 
                key={inv.id} 
                inv={inv} 
                onClick={() => setSelectedId(inv.id)} 
                onStatusChange={async (newStatus) => {
                  const previousStatus = inv.clientStatus;
                  try {
                    // Optimistic update
                    setItems((prevItems) => 
                      prevItems.map(item => 
                        item.id === inv.id ? { ...item, clientStatus: newStatus } : item
                      )
                    );
                    await portalInvoiceService.updateClientStatus(inv.id, newStatus);
                    notification.success({ message: "Client status updated" });
                    // No need to call load() and show a spinner since we optimistically updated
                  } catch (err: any) {
                    // Revert optimistic update
                    setItems((prevItems) => 
                      prevItems.map(item => 
                        item.id === inv.id ? { ...item, clientStatus: previousStatus } : item
                      )
                    );
                    notification.error({ message: "Failed to update status", description: err.message });
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer / Pagination */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 24px",
        background: p.surfaceElevated,
        border: `1px solid ${p.border}`,
        borderTop: "none",
        borderRadius: "0 0 12px 12px",
        fontSize: 13,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: p.successText, fontWeight: 600 }}>
          <div style={{ width: 6, height: 6, borderRadius: 3, background: p.success }} />
          All invoices loaded
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, color: p.textMuted }}>
          {items.length > 0 ? (
            <span>{(page - 1) * limit + 1}-{Math.min(page * limit, meta?.total || items.length)} of {meta?.total || items.length} invoices</span>
          ) : (
            <span>0 invoices</span>
          )}
          <div style={{ display: "flex", gap: 6 }}>
            <button style={{ width: 32, height: 32, borderRadius: 16, border: `1px solid ${p.border}`, background: p.surfaceElevated, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: p.textFaint }} disabled={page === 1} onClick={() => setPage(Math.max(1, page - 1))}><ChevronRight size={14} style={{ transform: "rotate(180deg)" }} /></button>
            <button style={{ width: 32, height: 32, borderRadius: 16, border: `1px solid ${p.accentBorder}`, background: p.accentBg, color: p.accentText, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>{page}</button>
            <button style={{ width: 32, height: 32, borderRadius: 16, border: `1px solid ${p.border}`, background: p.surfaceElevated, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: p.textMuted }} onClick={() => setPage(page + 1)}><ChevronRight size={14} /></button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", border: `1px solid ${p.border}`, borderRadius: 16, background: p.surfaceElevated, cursor: "pointer" }}>
            20 / page <ChevronDown size={14} color={p.textFaint} />
          </div>
        </div>
      </div>

      <Drawer
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
        width={1000}
        closable={false}
        destroyOnClose
        styles={{ body: { padding: 0, background: "#f6f7f9" }, header: { display: "none" } }}
      >
        {selectedId && <PortalInvoiceDetailPage invoiceId={selectedId} onClose={() => setSelectedId(null)} />}
      </Drawer>
    </div>
  );
}

/* --------------------------------------------------------------- */
/*  Sub-components                                                  */
/* --------------------------------------------------------------- */

function MiniStat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{
      padding: "6px 14px",
      background: p.surfaceElevated,
      border: `1px solid ${p.border}`,
      borderRadius: 8,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minWidth: 70,
      height: 44
    }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, color: p.textSubtle, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color, marginTop: 1 }}>
        {value}
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
    icon: FileText,
  };
  const tone = STATUS_TONE[meta.tone];
  const Icon = meta.icon;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "4px 10px",
        background: `linear-gradient(to right, ${tone.bg}, #ffffff)`,
        border: `1px solid ${tone.border}`,
        color: tone.text,
        borderRadius: 999,
        fontSize: 11.5,
        fontWeight: 600,
        lineHeight: 1.2,
      }}
    >
      <Icon size={12} />
      {meta.label}
    </span>
  );
}

function InvoiceRow({ inv, onClick, onStatusChange }: { inv: PortalInvoiceListItem; onClick: () => void; onStatusChange: (s: string) => void }) {
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
        : p.text;

  return (
    <div
      onClick={onClick}
      style={{
        display: "grid",
        gridTemplateColumns: "120px 1.5fr 110px 110px 150px 120px 120px 30px",
        gap: 12,
        padding: "14px 24px",
        borderBottom: `1px solid ${p.border}`,
        textDecoration: "none",
        color: "inherit",
        alignItems: "center",
        transition: "background 150ms ease",
        cursor: "pointer"
      }}
      className="invoice-row"
    >
      {/* 1. Invoice # */}
      <div>
        <span style={{
          background: p.accentBg,
          color: p.accentText,
          padding: "4px 10px",
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 600,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          border: `1px solid ${p.accentBorder}`
        }}>
          {inv.invoiceNumber}
        </span>
      </div>

      {/* 2. Customer */}
      <div style={{ fontSize: 13.5, fontWeight: 600, color: p.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {inv.customerName || inv.description || "Invoice Services"}
      </div>

      {/* 3. Invoice Date */}
      <div style={{ fontSize: 13, fontWeight: 500, color: p.textMuted }}>
        {fmtDate(inv.invoiceDate)}
      </div>

      {/* 4. Due Date */}
      <div style={{ fontSize: 13, fontWeight: 600, color: dueColor }}>
        {dueLabel}
      </div>

      {/* 4.5. Client Status */}
      <div onClick={(e) => e.stopPropagation()}>
        <select
          value={inv.clientStatus || "UNPAID"}
          onChange={(e) => onStatusChange(e.target.value)}
          style={{
            padding: "4px 8px",
            borderRadius: 6,
            border: `1px solid ${p.border}`,
            background: p.surfaceElevated,
            color: p.text,
            fontSize: 12,
            outline: "none",
            cursor: "pointer",
            width: "100%",
          }}
        >
          <option value="UNPAID">Unpaid</option>
          <option value="PARTIALLY_PAID">Partially Paid</option>
          <option value="PAID">Paid</option>
        </select>
      </div>

      {/* 5. Amount */}
      <div style={{ fontSize: 13.5, fontWeight: 600, color: p.text, textAlign: "right" }}>
        {fmtCurrency(inv.grandTotal ?? inv.subtotal, inv.currency)}
      </div>

      {/* 6. Balance Due */}
      <div style={{ fontSize: 13.5, fontWeight: Number(inv.balanceDue) > 0 ? 600 : 500, color: Number(inv.balanceDue) > 0 ? p.text : p.textMuted, textAlign: "right" }}>
        {fmtCurrency(inv.balanceDue, inv.currency)}
      </div>

      {/* 7. Chevron */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <ChevronRight size={16} color={p.textFaint} />
      </div>
    </div>
  );
}



