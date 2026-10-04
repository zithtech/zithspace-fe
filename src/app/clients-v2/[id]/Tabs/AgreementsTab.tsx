"use client";

/**
 * Every agreement raised against this client.
 * UI: sticky header, table/card view toggle, bordered table (no radius),
 * sticky footer pagination, server-side pagination.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Table, Tooltip, message, Pagination, Typography } from "antd";
import {
  Eye,
  FileSignature,
  ExternalLink,
  RefreshCw,
  Search,
  LayoutGrid,
  List,
  Calendar,
  DollarSign,
  FileText,
} from "lucide-react";
import NoData from "@/components/common/NoData";
import ZukvoLoader from "@/components/common/ZukvoLoader";
import {
  AGREEMENT_STATUS_META,
  Agreement,
  AgreementStatus,
  ProjectAgreementsService,
  formatMoney,
} from "@/services/projectAgreementsService";

/* ── helpers ──────────────────────────────────────────────────────────────── */

function fmtDate(value?: string | null): string {
  if (!value) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return value;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${Number(m[3])} ${months[Number(m[2]) - 1]} ${m[1]}`;
}

function initials(str: string) {
  return str.trim().charAt(0).toUpperCase();
}

const STATUS_COLORS: Record<string, string> = {
  draft: "#64748b",
  pending: "#f59e0b",
  active: "#22c55e",
  expired: "#94a3b8",
  terminated: "#ef4444",
};

const PAGE_SIZE = 15;

/* ── Card component matching .pc-card pattern ────────────────────────────── */

function AgreementCard({ row }: { row: Agreement }) {
  const meta = AGREEMENT_STATUS_META[row.status as AgreementStatus] ?? {
    bg: "#f1f5f9",
    color: "#64748b",
    label: row.status,
  };
  const color = STATUS_COLORS[row.status] ?? "#64748b";

  return (
    <div className="pc-card">
      <div className="pc-top">
        {/* Avatar */}
        <div
          className="pc-avatar"
          style={{ background: color }}
        >
          {initials(row.title || "A")}
        </div>

        {/* Body */}
        <div className="pc-identity-body">
          <div className="pc-title">{row.title}</div>
          <div className="pc-client-line">
            <span className="pc-client-key">TYPE</span>
            <span className="pc-client-val">{row.documentTypeName || "—"}</span>
          </div>
          {row.documentNumber && (
            <div className="pc-client-line">
              <span className="pc-client-key">REF</span>
              <span className="pc-client-val">{row.documentNumber}</span>
            </div>
          )}
          {row.projectName && (
            <div className="pc-client-line">
              <span className="pc-client-key">PROJECT</span>
              <span className="pc-client-val">{row.projectName}</span>
            </div>
          )}
        </div>

        {/* Status chip */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              height: 22,
              padding: "0 8px",
              borderRadius: 6,
              background: meta.bg,
              color: meta.color,
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: meta.color }} />
            {meta.label}
          </span>
          {row.portalViewedAt && (
            <Tooltip title={`Client viewed ${fmtDate(row.portalViewedAt)}`}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  height: 20,
                  padding: "0 7px",
                  borderRadius: 5,
                  background: "rgba(99,102,241,0.12)",
                  color: "#4338ca",
                  fontSize: 10.5,
                  fontWeight: 600,
                }}
              >
                <Eye size={10} /> Viewed
              </span>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="pc-foot">
        <div className="pc-foot-row">
          <span className="pc-foot-item">
            <DollarSign size={11} style={{ color: "var(--text-slate-400)" }} />
            <span>{formatMoney(row.totalValue, row.valueCurrency) || "—"}</span>
          </span>
          {row.effectiveDate && (
            <>
              <div className="pc-foot-div" />
              <span className="pc-foot-item">
                <Calendar size={11} style={{ color: "var(--text-slate-400)" }} />
                <span>
                  {fmtDate(row.effectiveDate)}
                  {row.expiryDate ? ` → ${fmtDate(row.expiryDate)}` : ""}
                </span>
              </span>
            </>
          )}
          <div style={{ flex: 1 }} />
          <Link
            href={`/project-agreements/agreements?open=${row.id}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 26,
              height: 26,
              display: "inline-grid",
              placeItems: "center",
              borderRadius: 6,
              border: "1px solid var(--border-slate-200)",
              color: "var(--text-slate-500)",
            }}
            aria-label="Open agreement"
          >
            <ExternalLink size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────────────────── */

export default function AgreementsTab({ clientId }: { clientId: string }) {
  const [items, setItems] = useState<Agreement[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [stats, setStats] = useState<Record<string, number>>({});
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(
    async (p = 1, q = "", isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const data = await ProjectAgreementsService.listAgreements({
          clientId,
          search: q.trim() || undefined,
          page: p,
          limit: PAGE_SIZE,
        });
        setItems(data.items ?? []);
        setTotal(data.meta?.total ?? data.items?.length ?? 0);
        // Derive per-status counts from page items
        const counts: Record<string, number> = {};
        for (const a of data.items ?? []) counts[a.status] = (counts[a.status] ?? 0) + 1;
        setStats(counts);
      } catch (err: any) {
        message.error(err?.message || "Could not load agreements for this client");
        setItems([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [clientId]
  );

  useEffect(() => {
    load(1, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(1);
      load(1, val);
    }, 300);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    load(p, search);
  };

  const handleRefresh = () => {
    load(page, search, true);
  };

  /* Table columns */
  const columns = [
    {
      title: "Document",
      dataIndex: "title",
      key: "title",
      render: (_: unknown, row: Agreement) => (
        <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
          <div
            style={{
              width: 30,
              height: 30,
              flexShrink: 0,
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--bg-slate-50)",
              color: "var(--text-slate-500)",
            }}
          >
            <FileText size={15} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--text-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {row.title}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-slate-400)", marginTop: 1 }}>
              {[row.documentTypeName, row.documentNumber, row.projectName].filter(Boolean).join(" · ") || "No reference"}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 190,
      render: (_: unknown, row: Agreement) => {
        const meta = AGREEMENT_STATUS_META[row.status as AgreementStatus];
        return (
          <span style={{ display: "inline-flex", gap: 5, alignItems: "center" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                height: 22,
                padding: "0 8px",
                borderRadius: 6,
                background: meta.bg,
                color: meta.color,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: meta.color }} />
              {meta.label}
            </span>
            {row.portalViewedAt && (
              <Tooltip title={`Client viewed ${fmtDate(row.portalViewedAt)}`}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    height: 22,
                    padding: "0 8px",
                    borderRadius: 6,
                    background: "rgba(99,102,241,0.12)",
                    color: "#4338ca",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  <Eye size={11} /> Viewed
                </span>
              </Tooltip>
            )}
          </span>
        );
      },
    },
    {
      title: "Value",
      key: "value",
      width: 140,
      render: (_: unknown, row: Agreement) => (
        <div style={{ fontWeight: 600, fontSize: 12.5, color: "var(--text-primary)" }}>
          {formatMoney(row.totalValue, row.valueCurrency) || "—"}
        </div>
      ),
    },
    {
      title: "Effective Date",
      key: "effectiveDate",
      width: 180,
      render: (_: unknown, row: Agreement) => (
        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
          {fmtDate(row.effectiveDate)}
          {row.expiryDate ? ` → ${fmtDate(row.expiryDate)}` : ""}
        </div>
      ),
    },
    {
      title: "",
      key: "open",
      width: 48,
      render: (_: unknown, row: Agreement) => (
        <Tooltip title="Open in Project Agreements">
          <Link
            href={`/project-agreements/agreements?open=${row.id}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 28,
              height: 28,
              display: "inline-grid",
              placeItems: "center",
              borderRadius: 7,
              border: "1px solid var(--border-slate-200)",
              color: "var(--text-slate-500)",
            }}
            aria-label="Open agreement"
          >
            <ExternalLink size={13} />
          </Link>
        </Tooltip>
      ),
    },
  ];

  const showingFrom = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(page * PAGE_SIZE, total);

  return (
    <div style={{ animation: "fadeIn 0.3s ease-in-out" }} className="agr-tab-container">

      {/* ── Sticky Header ───────────────────────────────────────────────── */}
      <div className="cd-tab-sticky-head">
        {/* Title bar */}
        <div className="projects-header-wrap" style={{ margin: "0 -32px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "8px 32px 8px",
              borderBottom: "1px solid var(--border-slate-100)",
            }}
          >
            <span
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                display: "grid",
                placeItems: "center",
                background: "rgba(59,130,246,0.10)",
                color: "#3b82f6",
                flexShrink: 0,
              }}
            >
              <FileSignature size={17} />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-slate-900)", lineHeight: 1.2 }}>
                Agreements
              </div>
              <div style={{ fontSize: 11.5, color: "var(--text-slate-400)", marginTop: 2 }}>
                All agreements raised against this client
              </div>
            </div>
            {/* Status chips */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
              {(Object.keys(AGREEMENT_STATUS_META) as AgreementStatus[])
                .filter((s) => stats[s])
                .map((s) => {
                  const meta = AGREEMENT_STATUS_META[s];
                  return (
                    <span
                      key={s}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        height: 22,
                        padding: "0 8px",
                        borderRadius: 999,
                        background: meta.bg,
                        color: meta.color,
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {stats[s]} {meta.label}
                    </span>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div style={{ margin: "10px 0 6px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {/* Search */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              flex: "1 1 200px",
              maxWidth: 320,
              height: 32,
              padding: "0 10px",
              borderRadius: 8,
              border: "1px solid var(--border-slate-200)",
              background: "var(--bg-slate-50)",
            }}
          >
            <Search size={13} style={{ color: "var(--text-slate-400)", flexShrink: 0 }} />
            <input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search agreements…"
              aria-label="Search agreements"
              style={{
                flex: 1,
                minWidth: 0,
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: 12.5,
                color: "var(--text-slate-900)",
                fontFamily: "inherit",
              }}
            />
          </div>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            {/* View toggle */}
            <div className="ptab-segmented">
              <button
                type="button"
                className={viewMode === "table" ? "is-active" : ""}
                onClick={() => setViewMode("table")}
                aria-label="Table view"
              >
                <List size={14} />
              </button>
              <button
                type="button"
                className={viewMode === "card" ? "is-active" : ""}
                onClick={() => setViewMode("card")}
                aria-label="Card view"
              >
                <LayoutGrid size={14} />
              </button>
            </div>

            {/* Refresh */}
            <Tooltip title="Refresh">
              <button
                type="button"
                onClick={handleRefresh}
                aria-label="Refresh"
                style={{
                  width: 32,
                  height: 32,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 8,
                  border: "1px solid var(--border-slate-200)",
                  background: "var(--bg-pure-white)",
                  color: "var(--text-slate-600)",
                  cursor: "pointer",
                }}
              >
                <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
              </button>
            </Tooltip>
          </div>
        </div>
        <div className="ptab-divider" />
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="agr-tab-body">
        {loading ? (
          <div style={{ display: "grid", placeItems: "center", padding: "56px 0" }}>
            <ZukvoLoader size="md" />
          </div>
        ) : viewMode === "card" ? (
          items.length === 0 ? (
            <NoData
              title={search ? "Nothing matches that search" : "No agreements with this client yet"}
              description={
                search ? "Try a different term." : "Raise one from Project Agreements and pick this client."
              }
              accent="#3b82f6"
            />
          ) : (
            <div className="pp-grid">
              {items.map((row) => (
                <AgreementCard key={row.id} row={row} />
              ))}
            </div>
          )
        ) : (
          /* Table view: left+right border via wrapper, no radius */
          <div className="pp-table-wrap">
            <Table
              rowKey="id"
              size="small"
              className="pp-table premium-table"
              columns={columns as any}
              dataSource={items}
              pagination={false}
              scroll={{ x: "max-content" }}
              locale={{
                emptyText: (
                  <NoData
                    title={search ? "Nothing matches that search" : "No agreements with this client yet"}
                    description={
                      search ? "Try a different term." : "Raise one from Project Agreements and pick this client."
                    }
                    accent="#3b82f6"
                  />
                ),
              }}
            />
          </div>
        )}
      </div>

      {/* ── Sticky Footer Pagination ─────────────────────────────────────── */}
      {total > PAGE_SIZE && (
        <div className="invoices-pagination-footer">
          <Typography.Text style={{ fontSize: 12, color: "var(--text-slate-400)" }}>
            Showing{" "}
            <span style={{ color: "var(--text-slate-700)", fontWeight: 700 }}>{showingFrom}–{showingTo}</span>{" "}
            of{" "}
            <span style={{ color: "var(--text-slate-700)", fontWeight: 700 }}>{total}</span>{" "}
            agreement{total !== 1 ? "s" : ""}
          </Typography.Text>
          <Pagination
            current={page}
            pageSize={PAGE_SIZE}
            total={total}
            onChange={handlePageChange}
            showSizeChanger={false}
            size="small"
          />
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .agr-tab-container {
          display: flex !important;
          flex-direction: column !important;
          flex: 1 !important;
          min-height: 100% !important;
          padding: 4px 0 0 0 !important;
          position: relative !important;
        }
        .agr-tab-body {
          flex: 1 0 auto !important;
          padding-bottom: 16px !important;
        }
        .ptab-divider {
          height: 1px;
          background: var(--border-slate-100, #f1f5f9);
          margin-bottom: 8px;
        }
      `}} />
    </div>
  );
}
