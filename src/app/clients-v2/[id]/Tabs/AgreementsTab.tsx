"use client";

/**
 * Every agreement raised against this client.
 *
 * The same records the Project Agreements module owns, filtered to one client
 * — so the question "what have we actually signed with them?" is answerable
 * from the client, which is where it gets asked, rather than only from the
 * agreements list with a filter applied.
 *
 * READ-ONLY. Raising and editing live in the composer, which needs the screen;
 * the rows here link into it.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Table, Tooltip, message } from "antd";
import {
  Eye,
  FileSignature,
  ExternalLink,
  RefreshCw,
  Search,
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

function fmtDate(value?: string | null): string {
  if (!value) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return value;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${Number(m[3])} ${months[Number(m[2]) - 1]} ${m[1]}`;
}

export default function AgreementsTab({ clientId }: { clientId: string }) {
  const [items, setItems] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ProjectAgreementsService.listAgreements({ clientId });
      setItems(data.items ?? []);
    } catch (err: any) {
      // The tab is one of fifteen; a failure here must not take the page with
      // it, so it reports and leaves an empty table rather than throwing.
      message.error(err?.message || "Could not load agreements for this client");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((a) =>
      [a.title, a.documentNumber, a.documentTypeName, a.projectName, a.partyName]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [items, search]);

  const counts = useMemo(() => {
    const base: Record<string, number> = {};
    for (const a of items) base[a.status] = (base[a.status] ?? 0) + 1;
    return base;
  }, [items]);

  const columns = [
    {
      title: "Document",
      dataIndex: "title",
      key: "title",
      render: (_: unknown, row: Agreement) => (
        <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
          <span
            style={{
              width: 26,
              height: 26,
              flexShrink: 0,
              borderRadius: 7,
              display: "grid",
              placeItems: "center",
              background: "rgba(59,130,246,0.10)",
              color: "#3b82f6",
            }}
          >
            <FileSignature size={13} />
          </span>
          <span style={{ minWidth: 0 }}>
            <span
              style={{
                display: "block",
                fontSize: 12.5,
                fontWeight: 600,
                color: "var(--text-slate-900)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {row.title}
            </span>
            <span style={{ display: "block", fontSize: 11, color: "var(--text-slate-400)" }}>
              {[row.documentTypeName, row.documentNumber, row.projectName]
                .filter(Boolean)
                .join(" · ") || "No reference"}
            </span>
          </span>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 180,
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
              <span
                style={{ width: 6, height: 6, borderRadius: "50%", background: meta.color }}
              />
              {meta.label}
            </span>
            {/* Whether the client has opened it in their portal. */}
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
        <span style={{ fontSize: 12, color: "var(--text-slate-700)" }}>
          {formatMoney(row.totalValue, row.valueCurrency) || "—"}
        </span>
      ),
    },
    {
      title: "Effective",
      key: "effectiveDate",
      width: 165,
      render: (_: unknown, row: Agreement) => (
        <span style={{ fontSize: 12, color: "var(--text-slate-600)" }}>
          {fmtDate(row.effectiveDate)}
          {row.expiryDate ? ` → ${fmtDate(row.expiryDate)}` : ""}
        </span>
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            flex: "1 1 240px",
            maxWidth: 360,
            height: 34,
            padding: "0 10px",
            borderRadius: 9,
            border: "1px solid var(--border-slate-200)",
            background: "var(--bg-pure-white)",
            color: "var(--text-slate-400)",
          }}
        >
          <Search size={14} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agreements"
            aria-label="Search agreements"
            style={{
              flex: 1,
              minWidth: 0,
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: 13,
              color: "var(--text-slate-900)",
              fontFamily: "inherit",
            }}
          />
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, flex: 1 }}>
          {(Object.keys(AGREEMENT_STATUS_META) as AgreementStatus[])
            .filter((s) => counts[s])
            .map((s) => {
              const meta = AGREEMENT_STATUS_META[s];
              return (
                <span
                  key={s}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    height: 24,
                    padding: "0 9px",
                    borderRadius: 999,
                    background: meta.bg,
                    color: meta.color,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {counts[s]} {meta.label}
                </span>
              );
            })}
        </div>

        <Tooltip title="Refresh">
          <button
            type="button"
            onClick={load}
            aria-label="Refresh"
            style={{
              width: 34,
              height: 34,
              display: "grid",
              placeItems: "center",
              borderRadius: 9,
              border: "1px solid var(--border-slate-200)",
              background: "var(--bg-pure-white)",
              color: "var(--text-slate-600)",
              cursor: "pointer",
            }}
          >
            <RefreshCw size={14} />
          </button>
        </Tooltip>
      </div>

      {loading ? (
        <div style={{ display: "grid", placeItems: "center", padding: "56px 0" }}>
          <ZukvoLoader size="md" />
        </div>
      ) : (
        <Table
          rowKey="id"
          size="small"
          columns={columns as any}
          dataSource={visible}
          pagination={visible.length > 10 ? { pageSize: 10, size: "small" } : false}
          scroll={{ x: "max-content" }}
          locale={{
            emptyText: (
              <NoData
                title={
                  items.length === 0
                    ? "No agreements with this client yet"
                    : "Nothing matches that search"
                }
                description={
                  items.length === 0
                    ? "Raise one from Project Agreements and pick this client."
                    : "Try a different term."
                }
                accent="#3b82f6"
              />
            ),
          }}
        />
      )}
    </div>
  );
}
