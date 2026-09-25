"use client";

import ZukvoLoader from "@/components/common/ZukvoLoader";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Input,
  Empty,
  Pagination,
  DatePicker,
  Drawer,
  notification,
  Divider,
  Typography,
  Button,
  Space,
  Segmented,
  Tooltip,
  Tag,
} from "antd";
import {
  FilterOutlined,
  ExpandAltOutlined,
  CloseOutlined,
  ReloadOutlined,
  AppstoreOutlined,
  AlertOutlined,
  BellOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import quarterOfYear from "dayjs/plugin/quarterOfYear";
import { PortalInvoiceDetailContent as PortalInvoiceDetailPage } from "./_InvoiceDetail";
import {
  Receipt,
  Search,
  ChevronRight,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Ban,
  Send,
  CreditCard,
  Clock,
  FileText,
  X,
  Calendar,
  RotateCw,
  Filter,
  User,
  List as ListIcon,
  LayoutGrid,
} from "lucide-react";
import {
  portalInvoiceService,
  PortalInvoiceListItem,
  PortalInvoiceListMeta,
} from "@/services/portalInvoiceService";
import TicketFilterPill, {
  FilterPillOption,
} from "@/components/projects/TicketFilterPill";
import { FilterBar, FilterToggleButton } from "@/components/common/FilterBar";

dayjs.extend(quarterOfYear);

const { RangePicker } = DatePicker;

/* --------------------------------------------------------------- */
/*  Theme palette                                                  */
/* --------------------------------------------------------------- */

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

const STATUS_FILTER_OPTIONS: FilterPillOption[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING", label: "Pending" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "SENT", label: "Sent" },
  { value: "VIEWED", label: "Viewed" },
  { value: "PARTIALLY_PAID", label: "Partially paid" },
  { value: "PAID", label: "Paid" },
  { value: "CANCELLED", label: "Cancelled" },
];

function fmtCurrency(
  value: number | string | null | undefined,
  currency?: string | null
) {
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
  const [customerFilter, setCustomerFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [datePicked, setDatePicked] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isFilterRowOpen, setIsFilterRowOpen] = useState(false);
  const [limit, setLimit] = useState(15);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await portalInvoiceService.list({
        page,
        limit,
        status: status === "ALL" ? undefined : status,
        search: search || undefined,
      });
      setItems(res.data);
      setMeta(res.meta);
    } catch {
      setItems([]);
      setMeta(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, status]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const customerOptions: FilterPillOption[] = useMemo(() => {
    const map = new Map<string, string>();
    for (const it of items) {
      if (it.customerName) {
        map.set(it.customerName, it.customerName);
      }
    }
    return Array.from(map.entries()).map(([k, v]) => ({
      value: k,
      label: v,
    }));
  }, [items]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (status !== "ALL") count++;
    if (customerFilter) count++;
    if (datePicked && (datePicked[0] || datePicked[1])) count++;
    return count;
  }, [status, customerFilter, datePicked]);

  // Filter items locally by customer and date range if selected
  const displayedItems = useMemo(() => {
    return items.filter((inv) => {
      if (customerFilter && inv.customerName !== customerFilter) {
        return false;
      }
      if (datePicked && datePicked[0] && datePicked[1]) {
        if (!inv.invoiceDate) return false;
        const d = dayjs(inv.invoiceDate);
        if (
          !((d.isAfter(datePicked[0], "day") || d.isSame(datePicked[0], "day")) &&
            (d.isBefore(datePicked[1], "day") || d.isSame(datePicked[1], "day")))
        ) {
          return false;
        }
      }
      return true;
    });
  }, [items, customerFilter, datePicked]);

  const summary = meta?.summary;
  const summaryCounts = summary?.counts || {};
  const total = summary?.totalInvoices ?? (meta?.total ?? displayedItems.length);
  const paidCount =
    summaryCounts.PAID ?? items.filter((i) => i.status === "PAID").length;
  const overdueCount =
    summaryCounts.OVERDUE ?? items.filter((i) => i.isOverdue).length;
  const unpaidCount =
    (summaryCounts.SENT || 0) +
      (summaryCounts.PENDING || 0) +
      (summaryCounts.PARTIALLY_PAID || 0) +
      (summaryCounts.DRAFT || 0) ||
    items.filter((i) => i.status !== "PAID" && i.status !== "CANCELLED").length;
  const completedPct = total > 0 ? Math.round((paidCount / total) * 100) : 0;

  const activeStatusLabel = useMemo(() => {
    const tab = STATUS_FILTER_OPTIONS.find((t) => t.value === status);
    return tab ? tab.label : "All invoices";
  }, [status]);

  const rangePresets: { label: string; value: [Dayjs, Dayjs] }[] = [
    { label: "Last 7 days", value: [dayjs().subtract(6, "day"), dayjs()] },
    { label: "Last 30 days", value: [dayjs().subtract(29, "day"), dayjs()] },
    {
      label: "This month",
      value: [dayjs().startOf("month"), dayjs().endOf("month")],
    },
    {
      label: "Last month",
      value: [
        dayjs().subtract(1, "month").startOf("month"),
        dayjs().subtract(1, "month").endOf("month"),
      ],
    },
    {
      label: "This quarter",
      value: [dayjs().startOf("quarter"), dayjs().endOf("quarter")],
    },
  ];

  return (
    <div
      style={{
        height: "100vh",
        overflowY: "auto",
        backgroundColor: "#ffffff",
        display: "flex",
        flexDirection: "column",
        width: "100%",
      }}
    >
      {/* ── Top Header Toolbar matching Projects Management ── */}
      <div className="pm2-toolbar saas-header-container sc-header">
        <div className="pm2-head-id">
          <span className="pm2-head-ic">
            <Receipt size={16} />
          </span>
          <span className="pm2-head-text">
            <span className="pm2-head-title">Invoices</span>
            <span className="pm2-head-sub">OVERSEE INVOICES & PAYMENTS</span>
          </span>
        </div>

        <div className="sc-header-controls">
          <Input
            placeholder="Quick search invoice name..."
            prefix={<Search size={13} style={{ color: "var(--text-slate-400)", marginRight: 4 }} />}
            className="saas-input"
            style={{ maxWidth: 280, borderRadius: 8, height: 32, background: "transparent", fontSize: 12.5 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />

          <FilterToggleButton
            isOpen={isFilterRowOpen}
            onToggle={() => setIsFilterRowOpen((v) => !v)}
            activeCount={activeFilterCount}
          />

          {/* View Toggle */}
          <div className="premium-view-toggle" role="group" aria-label="View mode">
            <button
              type="button"
              data-active={viewMode === "table" ? "true" : "false"}
              onClick={() => setViewMode("table")}
              title="Table View"
            >
              <ListIcon size={13} />
            </button>
            <button
              type="button"
              data-active={viewMode === "card" ? "true" : "false"}
              onClick={() => setViewMode("card")}
              title="Card View"
            >
              <LayoutGrid size={13} />
            </button>
          </div>
        </div>

        <Space size={10} className="sc-header-right">
          <Tooltip title="Refresh invoices">
            <Button
              icon={<ReloadOutlined spin={refreshing} />}
              onClick={() => load(true)}
              disabled={loading}
              style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}
            />
          </Tooltip>
        </Space>
      </div>

      {/* ── Inline filter row (when opened) ── */}
      <FilterBar
        isOpen={isFilterRowOpen}
        activeCount={activeFilterCount}
        onClose={() => setIsFilterRowOpen(false)}
        onReset={() => {
          setStatus("ALL");
          setCustomerFilter("");
          setDatePicked(null);
          setPage(1);
        }}
      >
        {/* Status Pill */}
        <TicketFilterPill
          icon={<CheckCircle2 size={12} />}
          label="Status"
          value={status === "ALL" ? "" : status}
          options={STATUS_FILTER_OPTIONS}
          onChange={(val: any) => {
            setStatus(val || "ALL");
            setPage(1);
          }}
          itemNoun="statuses"
          multiple={false}
        />

        {/* Customer Pill */}
        {customerOptions.length > 0 && (
          <TicketFilterPill
            icon={<User size={12} />}
            label="Customer"
            value={customerFilter}
            options={customerOptions}
            onChange={(val: any) => {
              setCustomerFilter(val || "");
              setPage(1);
            }}
            itemNoun="customers"
            width={260}
            multiple={false}
          />
        )}

        {/* Date Range Picker */}
        <RangePicker
          value={datePicked}
          onChange={(dates) => {
            setDatePicked(dates as [Dayjs | null, Dayjs | null] | null);
            setPage(1);
          }}
          presets={rangePresets}
          className="premium-rangepicker"
          style={{ height: 28, borderRadius: 6, fontSize: 12 }}
          placeholder={["Start", "End"]}
          format="DD MMM YY"
          suffixIcon={<Calendar size={12} color={p.textFaint} />}
          allowClear
        />
      </FilterBar>

      {/* ── Main Overview Banner (Sprint head style) ── */}
      <div className="tl-section-head tl-sprint-head-v2 tl-section-head--static">
        <div className="tl-sprint-row1">
          <div className="tl-sprint-title-block">
            <span
              className="tl-sprint-dot"
              style={{
                background: "#3b82f6",
                boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.2)",
              }}
            />
            <span className="tl-sprint-title pm2-banner-title">
              Invoices — {activeStatusLabel}
            </span>
            <span className="tl-sprint-tags">
              <span className="tl-sprint-tag tl-sprint-tag-neutral">
                {total} INVOICES
              </span>
              {unpaidCount > 0 && (
                <span className="tl-sprint-tag tl-sprint-tag-active">
                  {unpaidCount} ACTIVE
                </span>
              )}
              {overdueCount > 0 && (
                <span className="tl-sprint-tag tl-sprint-tag-delayed">
                  {overdueCount} ON HOLD
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="tl-sprint-row2">
          <span className="tl-sprint-meta">
            <span className="pm2-pulse-dot" />
            <b>{displayedItems.length}</b>{" "}
            {displayedItems.length === 1 ? "result" : "results"} on this page
          </span>
          <span className="tl-sprint-meta">
            <b>{unpaidCount}</b> active
          </span>
          <span className="tl-sprint-meta">
            <b>{overdueCount}</b> on hold
          </span>
          <span className="tl-sprint-meta">
            <b>{paidCount}</b> completed
          </span>
        </div>

        <div className="tl-sprint-row3">
          <div className="tl-sprint-progress-bar">
            <div
              className="tl-sprint-progress-fill"
              style={{ width: `${Math.min(100, completedPct)}%` }}
            />
          </div>
          <span className="tl-sprint-progress-pct">{completedPct}%</span>
        </div>
      </div>

      {/* ── Main Content Container ── */}
      <div
        className="portal-invoices-content"
        style={{
          padding: 0,
          width: "100%",
          flex: "1 0 auto",
        }}
      >
        {loading ? (
          <div style={{ padding: 60, textAlign: "center" }}>
            <ZukvoLoader size="md" />
          </div>
        ) : displayedItems.length === 0 ? (
          <div style={{ padding: 56, textAlign: "center" }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ color: p.textSubtle }}>
                  {search || activeFilterCount > 0
                    ? "No invoices match your filter criteria."
                    : "No invoices yet."}
                </span>
              }
            />
          </div>
        ) : viewMode === "table" ? (
          /* Table View */
          <div
            className="pm-table-wrap"
            style={{
              background: "#ffffff",
              overflowX: "auto",
            }}
          >
            {/* Table Header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(220px, 2fr) 110px 150px 120px 120px 110px 110px",
                minWidth: 920,
                gap: 12,
                padding: "7px 16px",
                background: "var(--bg-slate-50, #f8fafc)",
                borderBottom: "1px solid var(--border-slate-200, #e2e8f0)",
                fontSize: 10,
                fontWeight: 800,
                color: "var(--text-slate-400, #94a3b8)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                alignItems: "center",
              }}
            >
              <div>PROJECT / INVOICE</div>
              <div>STATUS</div>
              <div>CLIENT</div>
              <div>START DATE</div>
              <div>END DATE</div>
              <div style={{ textAlign: "right" }}>AMOUNT</div>
              <div style={{ textAlign: "right" }}>BALANCE DUE</div>
            </div>

            <div>
              {displayedItems.map((inv, idx) => (
                <InvoiceRow
                  key={inv.id}
                  inv={inv}
                  isLast={idx === displayedItems.length - 1}
                  onClick={() => setSelectedId(inv.id)}
                  onStatusChange={async (newStatus) => {
                    const previousStatus = inv.clientStatus;
                    try {
                      setItems((prevItems) =>
                        prevItems.map((item) =>
                          item.id === inv.id
                            ? { ...item, clientStatus: newStatus }
                            : item
                        )
                      );
                      await portalInvoiceService.updateClientStatus(
                        inv.id,
                        newStatus
                      );
                      notification.success({
                        message: "Client status updated",
                      });
                    } catch (err: any) {
                      setItems((prevItems) =>
                        prevItems.map((item) =>
                          item.id === inv.id
                            ? { ...item, clientStatus: previousStatus }
                            : item
                        )
                      );
                      notification.error({
                        message: "Failed to update status",
                        description: err.message,
                      });
                    }
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Card View */
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 14,
              padding: "16px 24px",
            }}
          >
            {displayedItems.map((inv) => (
              <InvoiceCard
                key={inv.id}
                inv={inv}
                onClick={() => setSelectedId(inv.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Fixed Sticky Bottom Footer ── */}
      <div
        className="portal-invoices-pagination-footer"
        style={{
          position: "sticky",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          background: "#ffffff",
          borderTop: `1px solid ${p.border}`,
          boxShadow: "0 -4px 16px rgba(15, 23, 42, 0.04)",
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          marginTop: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Typography.Text style={{ fontSize: 13, color: p.textSubtle }}>
            Showing{" "}
            <span style={{ color: p.text, fontWeight: 700 }}>
              {displayedItems.length > 0 ? (page - 1) * limit + 1 : 0}–
              {Math.min(page * limit, total)}
            </span>{" "}
            of <span style={{ color: p.text, fontWeight: 700 }}>{total}</span>{" "}
            invoice{total !== 1 ? "s" : ""}
          </Typography.Text>
        </div>

        <Pagination
          current={page}
          pageSize={limit}
          total={total}
          showSizeChanger
          pageSizeOptions={["10", "15", "20", "25", "50", "100"]}
          onChange={(p, size) => {
            setPage(p);
            if (size && size !== limit) {
              setLimit(size);
            }
          }}
          onShowSizeChange={(current, size) => {
            setPage(1);
            setLimit(size);
          }}
        />
      </div>

      {/* Invoice Detail Drawer */}
      <Drawer
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
        width={1000}
        closable={false}
        destroyOnClose
        styles={{
          body: { padding: 0, background: "#f6f7f9" },
          header: { display: "none" },
        }}
      >
        {selectedId && (
          <PortalInvoiceDetailPage
            invoiceId={selectedId}
            onClose={() => setSelectedId(null)}
          />
        )}
      </Drawer>

      <style jsx global>{`
        /* ── Header Toolbar ── */
        .pm2-toolbar.sc-header {
          position: sticky;
          top: 0;
          z-index: 100;
          height: auto;
          min-height: 0;
          margin: 0;
          padding: 10px 24px;
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          flex-shrink: 0;
        }
        .sc-header-controls {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          min-width: 0;
        }
        .sc-header-right {
          flex-shrink: 0;
        }

        .pm2-head-id {
          display: flex;
          align-items: center;
          gap: 9px;
          min-width: 0;
          flex-shrink: 0;
        }
        .pm2-head-ic {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          font-size: 14px;
          color: #3b82f6;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.18);
        }
        .pm2-head-text {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .pm2-head-title {
          font-size: 13.5px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.01em;
          line-height: 1.2;
        }
        .pm2-head-sub {
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #94a3b8;
          margin-top: 1px;
        }

        /* ── Segmented Control ── */
        .sc-owner-seg .ant-segmented-item-label {
          padding: 0 4px;
        }
        .sc-owner-opt {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 100%;
          padding: 2px 4px;
        }
        .sc-owner-opt__ic {
          display: inline-flex;
          align-items: center;
          font-size: 11px;
        }
        .sc-owner-opt__label {
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }
        .sc-owner-opt__count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 17px;
          padding: 0 5px;
          border-radius: 999px;
          background: #f1f5f9;
          color: #64748b;
          font-size: 10px;
          font-weight: 800;
          font-variant-numeric: tabular-nums;
        }
        .ant-segmented-item-selected .sc-owner-opt__count {
          background: #eff6ff;
          color: #3b82f6;
        }

        /* ── Overview Banner ── */
        .tl-section-head {
          padding: 10px 24px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          flex-shrink: 0;
        }
        .tl-sprint-head-v2 {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .tl-sprint-row1 {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .tl-sprint-title-block {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          flex: 1 1 auto;
        }
        .tl-sprint-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .pm2-banner-title {
          font-size: 13.5px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .tl-sprint-tags {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }
        .tl-sprint-tag {
          display: inline-flex;
          align-items: center;
          height: 18px;
          padding: 0 6px;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.04em;
          border-radius: 4px;
          border: 1px solid transparent;
          text-transform: uppercase;
          line-height: 1;
        }
        .tl-sprint-tag-active {
          background: transparent;
          color: #10b981;
          border-color: rgba(16, 185, 129, 0.32);
        }
        .tl-sprint-tag-neutral {
          background: transparent;
          color: #64748b;
          border-color: rgba(100, 116, 139, 0.32);
        }
        .tl-sprint-tag-delayed {
          background: transparent;
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.32);
        }

        .tl-sprint-row2 {
          display: flex;
          align-items: center;
          gap: 18px;
          flex-wrap: wrap;
          padding-left: 15px;
        }
        .tl-sprint-meta {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 600;
          color: #64748b;
          letter-spacing: -0.005em;
        }
        .tl-sprint-meta b {
          color: #0f172a;
          font-weight: 800;
        }
        .pm2-pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
          display: inline-block;
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
        }

        .tl-sprint-row3 {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-left: 15px;
        }
        .tl-sprint-progress-bar {
          flex: 1 1 auto;
          position: relative;
          height: 6px;
          background: #f1f5f9;
          border-radius: 999px;
          overflow: hidden;
          min-width: 60px;
        }
        .tl-sprint-progress-fill {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, #3b82f6, #2563eb);
          border-radius: 999px;
          transition: width 0.4s ease;
        }
        .tl-sprint-progress-pct {
          flex-shrink: 0;
          font-size: 12px;
          font-weight: 800;
          color: #0f172a;
          font-variant-numeric: tabular-nums;
          min-width: 36px;
          text-align: right;
        }

        /* ── Inline Filter Row ── */
        .tl-filter-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 24px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          flex-shrink: 0;
        }
        .tl-filter-row-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 10.5px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          flex-shrink: 0;
        }
        .tl-filter-row-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 6px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #475569;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0;
          font-variant-numeric: tabular-nums;
        }
        .tl-filter-row-pills {
          flex: 1 1 auto;
          min-width: 0;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 6px;
        }
        .tl-filter-row-actions {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .tl-filter-row-reset {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          height: 28px;
          padding: 0 10px;
          background: transparent;
          border: 1px dashed #cbd5e1;
          border-radius: 6px;
          font-family: inherit;
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          cursor: pointer;
          transition: all 0.12s ease;
        }
        .tl-filter-row-reset:hover {
          color: #1d4ed8;
          border-color: rgba(59, 130, 246, 0.45);
          background: rgba(59, 130, 246, 0.06);
          border-style: solid;
        }
        .tl-filter-row-close {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: transparent;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          color: #64748b;
          cursor: pointer;
          transition: all 0.12s ease;
        }
        .tl-filter-row-close:hover {
          color: #0f172a;
          background: #ffffff;
          border-color: #94a3b8;
        }

        .saas-tag-blue {
          background: #eff6ff !important;
          color: #1d4ed8 !important;
          border-color: #bfdbfe !important;
        }

        /* ── View Toggle ── */
        .premium-view-toggle {
          display: inline-flex;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 2px;
        }
        .premium-view-toggle button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border: none;
          background: transparent;
          color: #64748b;
          border-radius: 4px;
          cursor: pointer;
          transition: all 120ms ease;
        }
        .premium-view-toggle button:hover {
          color: #0f172a;
          background: #f1f5f9;
        }
        .premium-view-toggle button[data-active='true'] {
          background: #eff6ff;
          color: #1d4ed8;
        }

        /* Card hover */
        .pm2-card {
          transition: all 140ms ease;
        }
        .pm2-card:hover {
          border-color: #cbd5e1 !important;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
          transform: translateY(-1px);
        }

        /* Row hover */
        .pm2-table-row {
          transition: background 120ms ease;
        }
        .pm2-table-row:hover {
          background: #f8fafc !important;
        }

        .portal-invoices-pagination-footer .ant-pagination-item,
        .portal-invoices-pagination-footer .ant-pagination-prev .ant-pagination-item-link,
        .portal-invoices-pagination-footer .ant-pagination-next .ant-pagination-item-link {
          border: 1px solid var(--border-slate-200, #e2e8f0) !important;
          border-radius: 6px !important;
          background: transparent !important;
          color: var(--text-slate-500, #64748b) !important;
        }
        .portal-invoices-pagination-footer .ant-pagination-item-active {
          background: #3b82f6 !important;
          border-color: #3b82f6 !important;
        }
        .portal-invoices-pagination-footer .ant-pagination-item-active a {
          color: #ffffff !important;
        }
      `}</style>
    </div>
  );
}

function InvoiceRow({
  inv,
  isLast,
  onClick,
  onStatusChange,
}: {
  inv: PortalInvoiceListItem;
  isLast: boolean;
  onClick: () => void;
  onStatusChange: (s: string) => void;
}) {
  const dDue = daysUntil(inv.dueDate);
  const dueLabel = (() => {
    if (!inv.dueDate) return "—";
    return fmtDate(inv.dueDate);
  })();

  const currentStatus = inv.clientStatus || "UNPAID";
  const statusTag =
    currentStatus === "PAID"
      ? { color: "#10b981", bg: "#d1fae5", label: "PAID" }
      : currentStatus === "PARTIALLY_PAID"
      ? { color: "#f59e0b", bg: "#fef3c7", label: "PARTIAL" }
      : { color: "#10b981", bg: "#d1fae5", label: "ACTIVE" };

  return (
    <div
      onClick={onClick}
      className="pm2-table-row"
      style={{
        display: "grid",
        gridTemplateColumns:
          "minmax(220px, 2fr) 110px 150px 120px 120px 110px 110px",
        minWidth: 920,
        gap: 12,
        padding: "8px 16px",
        alignItems: "center",
        borderBottom: isLast ? "none" : "1px solid #f1f5f9",
        textDecoration: "none",
        color: "inherit",
        cursor: "pointer",
      }}
    >
      {/* 1. Project / Invoice */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#3B82F6",
            background: "rgba(59, 130, 246, 0.08)",
            border: "1px solid rgba(59, 130, 246, 0.16)",
          }}
        >
          <Receipt size={13} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#0f172a",
              lineHeight: 1.25,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {inv.customerName || inv.description || "Invoice"}
          </span>
          <span
            style={{
              fontSize: 10,
              color: "#64748b",
              marginTop: 1,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontWeight: 600,
            }}
          >
            {inv.invoiceNumber}
          </span>
        </div>
      </div>

      {/* 2. Status */}
      <div>
        <Tag
          style={{
            borderRadius: 6,
            padding: "1px 8px",
            fontWeight: 700,
            fontSize: 10,
            textTransform: "uppercase",
            border: "none",
            margin: 0,
            color: statusTag.color,
            background: statusTag.bg,
          }}
        >
          {statusTag.label}
        </Tag>
      </div>

      {/* 3. Client */}
      <div>
        {inv.customerName ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "2px 8px",
              borderRadius: 6,
              background: "#eff6ff",
              color: "#2563eb",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "#3b82f6",
              }}
            />
            {inv.customerName}
          </span>
        ) : (
          <span style={{ color: "#94a3b8", fontSize: 12 }}>—</span>
        )}
      </div>

      {/* 4. Start Date / Invoice Date */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 11.5,
          color: "#475569",
        }}
      >
        <Calendar size={12} color="#94a3b8" />
        <span>{fmtDate(inv.invoiceDate)}</span>
      </div>

      {/* 5. End Date / Due Date */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 11.5,
          color: "#475569",
        }}
      >
        <Calendar size={12} color="#94a3b8" />
        <span>{dueLabel}</span>
      </div>

      {/* 6. Amount */}
      <div
        style={{
          fontSize: 12.5,
          fontWeight: 700,
          color: "#0f172a",
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {fmtCurrency(inv.grandTotal ?? inv.subtotal, inv.currency)}
      </div>

      {/* 7. Balance Due */}
      <div
        style={{
          fontSize: 12.5,
          fontWeight: Number(inv.balanceDue) > 0 ? 700 : 500,
          color: Number(inv.balanceDue) > 0 ? "#0f172a" : "#64748b",
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {fmtCurrency(inv.balanceDue, inv.currency)}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- */
/*  Card Component (Card View)                                     */
/* --------------------------------------------------------------- */

function InvoiceCard({
  inv,
  onClick,
}: {
  inv: PortalInvoiceListItem;
  onClick: () => void;
}) {
  const dDue = daysUntil(inv.dueDate);
  const dueLabel = (() => {
    if (!inv.dueDate) return "—";
    return fmtDate(inv.dueDate);
  })();

  const currentStatus = inv.clientStatus || "UNPAID";
  const statusTag =
    currentStatus === "PAID"
      ? { color: "#10b981", bg: "#d1fae5", label: "PAID" }
      : currentStatus === "PARTIALLY_PAID"
      ? { color: "#f59e0b", bg: "#fef3c7", label: "PARTIAL" }
      : { color: "#10b981", bg: "#d1fae5", label: "ACTIVE" };

  return (
    <div
      onClick={onClick}
      className="pm2-card"
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        padding: "16px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        position: "relative",
      }}
    >
      {/* Card Top */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#3B82F6",
              background: "rgba(59, 130, 246, 0.08)",
              border: "1px solid rgba(59, 130, 246, 0.16)",
            }}
          >
            <Receipt size={13} />
          </div>
          <span
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 11,
              fontWeight: 600,
              color: "#64748b",
              background: "#f1f5f9",
              padding: "2px 6px",
              borderRadius: 4,
            }}
          >
            {inv.invoiceNumber}
          </span>
        </div>

        <Tag
          style={{
            borderRadius: 6,
            padding: "1px 8px",
            fontWeight: 700,
            fontSize: 10,
            textTransform: "uppercase",
            border: "none",
            margin: 0,
            color: statusTag.color,
            background: statusTag.bg,
          }}
        >
          {statusTag.label}
        </Tag>
      </div>

      {/* Customer / Description */}
      <div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#0f172a",
            lineHeight: 1.35,
            letterSpacing: "-0.01em",
          }}
        >
          {inv.customerName || inv.description || "Invoice"}
        </div>
        {inv.customerName && inv.description && (
          <div
            style={{
              fontSize: 12,
              color: "#64748b",
              marginTop: 4,
              lineHeight: 1.4,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {inv.description}
          </div>
        )}
      </div>

      {/* Dates */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          fontSize: 11.5,
          color: "#64748b",
          marginTop: "auto",
          paddingTop: 8,
          borderTop: "1px solid #f1f5f9",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <Calendar size={12} color="#94a3b8" />
          <span>Issued {fmtDate(inv.invoiceDate)}</span>
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <Clock size={12} color="#94a3b8" />
          <span>Due {dueLabel}</span>
        </div>
      </div>

      {/* Amounts */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          background: "#f8fafc",
          padding: "8px 12px",
          borderRadius: 6,
        }}
      >
        <div>
          <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>
            Total
          </span>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
            {fmtCurrency(inv.grandTotal ?? inv.subtotal, inv.currency)}
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>
            Balance Due
          </span>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: Number(inv.balanceDue) > 0 ? "#b91c1c" : "#10b981",
            }}
          >
            {fmtCurrency(inv.balanceDue, inv.currency)}
          </div>
        </div>
      </div>
    </div>
  );
}
