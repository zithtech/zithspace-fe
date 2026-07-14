"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { useActivitySource } from "@/hooks/useActivitySource";
import { useLeads } from "@/hooks/useLeads";
import type { Lead } from "@/services/leadService";
import {
  Zap,
  Search,
  Flame,
  TrendingUp,
  Activity,
  Eye,
  Gauge,
  Target,
  Sparkles,
  FileText,
  Building2,
  Layers,
  LayoutGrid,
  List as ListIcon,
  Snowflake,
  Menu,
} from "lucide-react";
import { Table, Input, Empty, Tooltip, Tag, DatePicker, Skeleton, Select, Button } from "antd";
import dayjs, { Dayjs } from "dayjs";

const { RangePicker } = DatePicker;

type ViewKey = "all" | "hot" | "warm" | "cold" | "with_proposal";

/** A lead is considered "BidIq analyzed" once any AI analysis output exists. */
const hasBidiq = (l: Lead) =>
  (typeof l.ai_score === "number" && l.ai_score > 0) ||
  !!l.skill_analysis ||
  !!l.ai_summary;

const getScoreLevel = (score?: number) => {
  if (score === undefined || score === null)
    return { label: "—", color: "#64748b", icon: <Activity size={11} /> };
  if (score >= 80) return { label: "Hot", color: "#ef4444", icon: <Flame size={11} /> };
  if (score >= 60) return { label: "Warm", color: "#10b981", icon: <TrendingUp size={11} /> };
  if (score >= 40) return { label: "Mild", color: "#3b82f6", icon: <Activity size={11} /> };
  return { label: "Cold", color: "#64748b", icon: <Snowflake size={11} /> };
};

/** Leads-style area sparkline used in the stat-card chart slot. */
const AreaSparkline: React.FC<{ values: number[]; color: string }> = ({ values, color }) => {
  const w = 96;
  const h = 26;
  if (!values.length) return null;
  const max = Math.max(...values, 1);
  const step = values.length > 1 ? w / (values.length - 1) : w;
  const pts = values.map((v, i) => [i * step, h - (v / max) * (h - 4) - 2] as const);
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  const gid = `biq-spark-${color.replace("#", "")}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
};

const fmtDate = (d?: string) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

export default function BidIqPage() {
  console.log("Forcing HMR reload for BidIqPage");
  useActivitySource({ section: "WORK", module: "BidIq", page: "BidIqList" });
  const { user, isLoading } = useAuth();
  const { canReadBidiq } = usePermission();
  const router = useRouter();
  const { leads, loading, fetchLeads } = useLeads();

  const [searchText, setSearchText] = useState("");
  const [view, setView] = useState<ViewKey>("all");
  const [filterPlatform, setFilterPlatform] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [layout, setLayout] = useState<"list" | "grid">("list");
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(20);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Route guard — gated by the dedicated BidIq read permission.
  useEffect(() => {
    if (!isLoading && user && !canReadBidiq) {
      router.push("/dashboard");
    }
  }, [user, isLoading, canReadBidiq, router]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const analyzed = useMemo(() => leads.filter(hasBidiq), [leads]);

  const counts = useMemo(() => {
    const hot = analyzed.filter((l) => (l.ai_score || 0) >= 80).length;
    const warm = analyzed.filter((l) => (l.ai_score || 0) >= 50 && (l.ai_score || 0) < 80).length;
    const cold = analyzed.filter((l) => (l.ai_score || 0) < 50).length;
    const withProposal = analyzed.filter((l) => !!l.proposal_id || !!l.proposal_text).length;
    const avg =
      analyzed.length > 0
        ? Math.round(analyzed.reduce((s, l) => s + (l.ai_score || 0), 0) / analyzed.length)
        : 0;
    return { total: analyzed.length, hot, warm, cold, withProposal, avg };
  }, [analyzed]);

  // Distribution of scores across 8 buckets (0→100) — feeds the card sparklines.
  const scoreSpread = useMemo(() => {
    const buckets = new Array(8).fill(0);
    for (const l of analyzed) {
      const s = Math.max(0, Math.min(100, l.ai_score || 0));
      buckets[Math.min(7, Math.floor(s / 12.5))]++;
    }
    return buckets;
  }, [analyzed]);

  const platforms = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of analyzed) {
      const p = l.platform || "Other";
      m.set(p, (m.get(p) || 0) + 1);
    }
    return [...m.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [analyzed]);

  const filtered = useMemo(() => {
    let rows = [...analyzed];

    if (view === "hot") rows = rows.filter((l) => (l.ai_score || 0) >= 80);
    else if (view === "warm")
      rows = rows.filter((l) => (l.ai_score || 0) >= 50 && (l.ai_score || 0) < 80);
    else if (view === "cold") rows = rows.filter((l) => (l.ai_score || 0) < 50);
    else if (view === "with_proposal")
      rows = rows.filter((l) => !!l.proposal_id || !!l.proposal_text);

    if (filterPlatform)
      rows = rows.filter((l) => (l.platform || "Other") === filterPlatform);

    if (dateRange && dateRange[0] && dateRange[1]) {
      const start = dateRange[0].startOf("day");
      const end = dateRange[1].endOf("day");
      rows = rows.filter((l) => {
        const analyzedAt = l.updated_at || l.created_at;
        if (!analyzedAt) return false;
        const d = dayjs(analyzedAt);
        return !d.isBefore(start) && !d.isAfter(end);
      });
    }

    const q = searchText.trim().toLowerCase();
    if (q) {
      rows = rows.filter((l) =>
        [l.title, l.client_name, l.company, l.platform]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      );
    }

    return rows.sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0));
  }, [analyzed, view, filterPlatform, dateRange, searchText]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / tablePageSize));

  // Reset to first page whenever the active filter set shrinks the result below the current page.
  useEffect(() => {
    if (tablePage > totalPages) setTablePage(1);
  }, [totalPages, tablePage]);

  const paged = useMemo(
    () => filtered.slice((tablePage - 1) * tablePageSize, tablePage * tablePageSize),
    [filtered, tablePage, tablePageSize]
  );

  const openBidiq = (id: string) => router.push(`/leads/bidiq/${id}`);

  const VIEWS: { key: ViewKey; label: string; icon: React.ReactNode; count: number; color: string }[] = [
    { key: "all", label: "All Analyses", icon: <Layers size={14} />, count: counts.total, color: "#3b82f6" },
    { key: "hot", label: "Hot", icon: <Flame size={14} />, count: counts.hot, color: "#ef4444" },
    { key: "warm", label: "Warm", icon: <TrendingUp size={14} />, count: counts.warm, color: "#10b981" },
    { key: "cold", label: "Cold", icon: <Snowflake size={14} />, count: counts.cold, color: "#64748b" },
    { key: "with_proposal", label: "With Proposal", icon: <FileText size={14} />, count: counts.withProposal, color: "#10b981" },
  ];

  const StatCard: React.FC<{
    icon: React.ComponentType<any>;
    label: string;
    value: React.ReactNode;
    accent: string;
    subtle?: string;
    chart?: React.ReactNode;
  }> = ({ icon: Icon, label, value, accent, subtle, chart }) => (
    <div className="biq-stat-card">
      <div className="biq-stat-head">
        <div
          className="biq-stat-icon"
          style={{ background: `${accent}14`, color: accent, boxShadow: `inset 0 0 0 1px ${accent}26` }}
        >
          <Icon size={14} />
        </div>
        <span className="biq-stat-label">{label}</span>
        <div className="biq-stat-value-wrap">
          {loading ? (
            <Skeleton.Input active size="small" style={{ width: 50, height: 20 }} />
          ) : (
            <span className="biq-stat-value">{value}</span>
          )}
        </div>
      </div>
      {subtle && <span className="biq-stat-subtle">{subtle}</span>}
      {chart && <div className="biq-stat-chart">{chart}</div>}
    </div>
  );

  const columns = [
    {
      title: "Score",
      dataIndex: "ai_score",
      key: "ai_score",
      width: 110,
      render: (score: number | undefined) => {
        const level = getScoreLevel(score);
        return (
          <div className="biq-score">
            <span className="biq-score-num" style={{ color: level.color }}>
              {typeof score === "number" ? score : "—"}
            </span>
            <span className="biq-score-tag" style={{ color: level.color }}>
              {level.icon}
              {level.label}
            </span>
          </div>
        );
      },
    },
    {
      title: "Lead",
      key: "lead",
      render: (_: unknown, record: Lead) => (
        <div className="biq-lead">
          <div className="biq-lead-title" title={record.title}>
            {record.title || "Untitled lead"}
          </div>
          <div className="biq-lead-meta">
            <span>
              <Building2 size={11} />
              {record.company || record.client_name || "—"}
            </span>
            {record.platform && (
              <span>
                <Sparkles size={11} />
                {record.platform}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Skill Match",
      key: "skill_match",
      width: 130,
      render: (_: unknown, record: Lead) => {
        const pct = record.skill_analysis?.matchPercentage;
        if (typeof pct !== "number") return <span className="biq-muted">—</span>;
        return (
          <Tooltip
            title={`${record.skill_analysis?.matchedSkills?.length ?? 0} matched · ${
              record.skill_analysis?.missingSkills?.length ?? 0
            } missing`}
          >
            <div className="biq-match">
              <Target size={12} />
              {pct}%
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: "Budget",
      key: "budget",
      width: 120,
      render: (_: unknown, record: Lead) => (
        <span className="biq-muted">
          {record.budget ||
            (record.hour_based_amount ? `$${record.hour_based_amount}/hr` : "—")}
        </span>
      ),
    },
    {
      title: "Proposal",
      key: "proposal",
      width: 110,
      render: (_: unknown, record: Lead) =>
        record.proposal_id || record.proposal_text ? (
          <Tag className="biq-tag-green">Ready</Tag>
        ) : (
          <span className="biq-muted">—</span>
        ),
    },
    {
      title: "Analyzed",
      key: "analyzed",
      width: 130,
      render: (_: unknown, record: Lead) => (
        <span className="biq-muted">{fmtDate(record.updated_at || record.created_at)}</span>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 130,
      fixed: "right" as const,
      render: (_: unknown, record: Lead) => (
        <button
          className="biq-view-btn"
          onClick={(e) => {
            e.stopPropagation();
            openBidiq(record.id);
          }}
        >
          <Eye size={13} />
          View BidIq
        </button>
      ),
    },
  ];

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="biq-page">
          <div className="biq-shell">
            {mobileSidebarOpen && <div className="biq-mobile-overlay" onClick={() => setMobileSidebarOpen(false)} />}
            {/* ─── Sidebar ─────────────────────────────── */}
            <aside className={`biq-sidebar ${mobileSidebarOpen ? "is-open" : ""}`}>
              <div className="biq-sidebar-top">
                <div className="biq-side-head">
                  <div className="biq-side-logo">
                    <Zap size={18} />
                  </div>
                  <div className="biq-side-head-text">
                    <div className="biq-side-title">BidIq</div>
                    <div className="biq-side-subtitle">Lead Intelligence</div>
                  </div>
                </div>
              </div>

              <div className="biq-side-scroll">
                <div className="biq-side-section-label">Views</div>
                <div className="biq-side-list">
                  {VIEWS.map((v) => {
                    const isActive = view === v.key && !filterPlatform;
                    return (
                      <button
                        key={v.key}
                        type="button"
                        className={`biq-view-item ${isActive ? "is-active" : ""}`}
                        onClick={() => {
                          setView(v.key);
                          setFilterPlatform(null);
                        }}
                      >
                        <span
                          className="biq-view-icon"
                          style={{ color: isActive ? v.color : "var(--text-slate-400)" }}
                        >
                          {v.icon}
                        </span>
                        <span className="biq-view-label">{v.label}</span>
                        <span className="biq-view-count">{v.count}</span>
                      </button>
                    );
                  })}
                </div>

                {platforms.length > 0 && (
                  <>
                    <div className="biq-side-section-label">Platforms</div>
                    <div className="biq-side-list">
                      {platforms.map((p) => {
                        const isActive = filterPlatform === p.name;
                        return (
                          <button
                            key={p.name}
                            type="button"
                            className={`biq-view-item ${isActive ? "is-active" : ""}`}
                            onClick={() =>
                              setFilterPlatform((prev) => (prev === p.name ? null : p.name))
                            }
                          >
                            <span
                              className="biq-view-icon"
                              style={{ color: isActive ? "var(--text-slate-600)" : "var(--text-slate-400)" }}
                            >
                              <Sparkles size={14} />
                            </span>
                            <span className="biq-view-label">{p.name}</span>
                            <span className="biq-view-count">{p.count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </aside>

            {/* ─── Main ─────────────────────────────────── */}
            <div className="biq-main">
              {/* Topbar */}
              <div className="biq-topbar">
                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0, maxWidth: 400, width: "100%" }}>
                  <Button
                    className="biq-mobile-menu-btn"
                    type="text"
                    icon={<Menu size={18} />}
                    onClick={() => setMobileSidebarOpen(true)}
                  />
                  <div className="biq-topbar-search-wrap" style={{ flex: 1, margin: 0, maxWidth: "none" }}>
                    <Input
                      allowClear
                      prefix={<Search size={15} style={{ color: "var(--text-slate-400)" }} />}
                      placeholder="Search lead, client, or platform…"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className="biq-search-input"
                    />
                  </div>
                </div>
                <div className="biq-topbar-actions">
                  <RangePicker
                    value={dateRange as any}
                    onChange={(v) => setDateRange(v as [Dayjs | null, Dayjs | null] | null)}
                    allowClear
                    format="DD MMM YYYY"
                    placeholder={["Analyzed from", "Analyzed to"]}
                    className="biq-range"
                  />
                  <div className="biq-segmented">
                    <button
                      className={layout === "list" ? "is-active" : ""}
                      onClick={() => setLayout("list")}
                      title="List view"
                    >
                      <ListIcon size={15} />
                    </button>
                    <button
                      className={layout === "grid" ? "is-active" : ""}
                      onClick={() => setLayout("grid")}
                      title="Grid view"
                    >
                      <LayoutGrid size={15} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="biq-divider" />

              {/* Stat cards */}
              <div className="biq-stat-grid">
                {(() => {
                  const t = counts.total || 1;
                  const spark = (color: string) => (
                    <div className="biq-stat-spark-wrap">
                      <span className="biq-spark-label">Score spread</span>
                      <AreaSparkline values={scoreSpread} color={color} />
                    </div>
                  );
                  return (
                    <>
                      <StatCard
                        icon={Gauge}
                        label="Analyzed"
                        value={counts.total}
                        accent="#3b82f6"
                        subtle={counts.total > 0 ? "Leads scored by BidIq" : "No analyses yet"}
                        chart={counts.total > 0 ? spark("#3b82f6") : null}
                      />
                      <StatCard
                        icon={Flame}
                        label="Hot Leads"
                        value={counts.hot}
                        accent="#ef4444"
                        subtle={counts.total > 0 ? `${Math.round((counts.hot / t) * 100)}% of analyses · score ≥ 80` : "Score ≥ 80"}
                        chart={counts.total > 0 ? spark("#ef4444") : null}
                      />
                      <StatCard
                        icon={TrendingUp}
                        label="Avg Score"
                        value={counts.avg}
                        accent="#64748b"
                        subtle={counts.total > 0 ? "Average win-probability" : "Run BidIq to see scores"}
                        chart={counts.total > 0 ? spark("#64748b") : null}
                      />
                      <StatCard
                        icon={FileText}
                        label="Proposal Ready"
                        value={counts.withProposal}
                        accent="#10b981"
                        subtle={counts.total > 0 ? `${Math.round((counts.withProposal / t) * 100)}% have a proposal` : "No proposals yet"}
                        chart={counts.total > 0 ? spark("#10b981") : null}
                      />
                    </>
                  );
                })()}
              </div>

              {/* Body */}
              <div className="biq-body">
                {layout === "list" ? (
                  <div className="biq-table-card">
                    <Table<Lead>
                      rowKey="id"
                      loading={loading}
                      dataSource={paged}
                      columns={columns as any}
                      className="biq-table"
                      rowClassName="biq-row"
                      size="middle"
                      scroll={{ x: "max-content" }}
                      onRow={(record) => ({
                        onClick: () => openBidiq(record.id),
                        style: { cursor: "pointer" },
                      })}
                      pagination={false}
                      locale={{
                        emptyText: (
                          <div className="biq-empty">
                            <div className="biq-empty-icon">
                              <Zap size={26} />
                            </div>
                            <div className="biq-empty-title">No BidIq analyses yet</div>
                            <div className="biq-empty-text">
                              Run BidIq on a lead and it will appear here.
                            </div>
                          </div>
                        ),
                      }}
                    />
                  </div>
                ) : (
                  <div className="biq-grid-view">
                    {filtered.length === 0 ? (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="No BidIq analyses yet."
                        style={{ padding: "60px 0" }}
                      />
                    ) : (
                      <div className="biq-grid">
                        {paged.map((record) => {
                          const level = getScoreLevel(record.ai_score);
                          const pct = record.skill_analysis?.matchPercentage;
                          return (
                            <div
                              key={record.id}
                              className="biq-card"
                              onClick={() => openBidiq(record.id)}
                            >
                              <div className="biq-card-head">
                                <div
                                  className="biq-card-avatar"
                                  style={{ background: level.color }}
                                >
                                  {typeof record.ai_score === "number" ? record.ai_score : "—"}
                                </div>
                                <div className="biq-card-title-group">
                                  <div className="biq-card-title" title={record.title}>
                                    {record.title || "Untitled lead"}
                                  </div>
                                  <div className="biq-card-subtitle">
                                    <span className="biq-card-subtitle-key">Client:</span>
                                    <span className="biq-card-subtitle-val">
                                      {record.company || record.client_name || "—"}
                                    </span>
                                  </div>
                                </div>
                                <span className="biq-card-level" style={{ color: level.color }}>
                                  {level.icon}
                                  {level.label}
                                </span>
                              </div>
                              <div className="biq-card-footer">
                                <div className="biq-card-footer-row">
                                  <span className="biq-card-footer-item">
                                    <span className="biq-card-footer-key">Platform:</span>
                                    <span className="biq-card-footer-val">
                                      {record.platform || "—"}
                                    </span>
                                  </span>
                                  <span className="biq-card-footer-div" />
                                  <span className="biq-card-footer-item">
                                    <span className="biq-card-footer-key">Match:</span>
                                    <span className="biq-card-footer-val">
                                      {typeof pct === "number" ? `${pct}%` : "—"}
                                    </span>
                                  </span>
                                </div>
                                <div className="biq-card-footer-row">
                                  <span className="biq-card-footer-item">
                                    <span className="biq-card-footer-key">Analyzed:</span>
                                    <span className="biq-card-footer-val">
                                      {fmtDate(record.updated_at || record.created_at)}
                                    </span>
                                  </span>
                                  <span className="biq-card-footer-div" />
                                  <span className="biq-card-footer-item">
                                    {record.proposal_id || record.proposal_text ? (
                                      <Tag className="biq-tag-green">Proposal</Tag>
                                    ) : (
                                      <span className="biq-card-footer-val">No proposal</span>
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {filtered.length > 0 && (
                <div className="biq-bottom-bar">
                    <div className="biq-bottom-info">
                      Showing{" "}
                      <strong>
                        {(tablePage - 1) * tablePageSize + 1}–
                        {Math.min(tablePage * tablePageSize, filtered.length)}
                      </strong>{" "}
                      of <strong>{filtered.length}</strong>
                    </div>
                    <div className="biq-pager">
                      <button
                        type="button"
                        className="biq-pager-btn"
                        disabled={tablePage <= 1}
                        onClick={() => setTablePage((p) => Math.max(1, p - 1))}
                      >
                        ‹
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .slice(Math.max(0, tablePage - 3), Math.max(0, tablePage - 3) + 5)
                        .map((p) => (
                          <button
                            key={p}
                            type="button"
                            className={`biq-pager-num ${p === tablePage ? "is-active" : ""}`}
                            onClick={() => setTablePage(p)}
                          >
                            {p}
                          </button>
                        ))}
                      <button
                        type="button"
                        className="biq-pager-btn"
                        disabled={tablePage >= totalPages}
                        onClick={() => setTablePage((p) => Math.min(totalPages, p + 1))}
                      >
                        ›
                      </button>
                      <Select
                        className="biq-pagesize"
                        value={tablePageSize}
                        onChange={(v) => {
                          setTablePageSize(v);
                          setTablePage(1);
                        }}
                        options={[10, 20, 25, 50, 100].map((n) => ({ value: n, label: `${n} / page` }))}
                        popupMatchSelectWidth={120}
                      />
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          /* ====================================================== */
          /*                BidIq — mirrors Leads UI                 */
          /* ====================================================== */
          .biq-page {
            position: relative;
            background: var(--bg-pure-white);
            height: calc(100vh - 64px);
            overflow: hidden;
          }
          .biq-shell {
            display: flex;
            margin: 0 -16px;
            height: 100%;
            background: var(--bg-pure-white);
          }

          /* ---------- Sidebar ---------- */
          .biq-sidebar {
            width: 240px;
            flex-shrink: 0;
            border-right: 1px solid var(--border-slate-200);
            background: var(--bg-pure-white);
            display: flex;
            flex-direction: column;
            position: sticky;
            top: 0;
            height: calc(100vh - 64px);
          }
          .biq-sidebar-top {
            padding: 14px 14px 12px 18px;
            border-bottom: 1px solid var(--border-slate-200);
          }
          .biq-side-head { display: flex; align-items: center; gap: 10px; }
          .biq-side-logo {
            width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
            color: #fff; background: linear-gradient(135deg, #3b82f6, #2563eb);
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
          }
          .biq-side-head-text { display: flex; flex-direction: column; min-width: 0; }
          .biq-side-title { font-size: 16px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.025em; line-height: 1.1; }
          .biq-side-subtitle {
            font-size: 10.5px; color: var(--text-slate-400); font-weight: 700; margin-top: 4px;
            text-transform: uppercase; letter-spacing: 0.07em;
          }
          .biq-side-scroll {
            flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden;
            padding: 10px 10px 6px 16px; scrollbar-width: none; -ms-overflow-style: none;
          }
          .biq-side-scroll::-webkit-scrollbar { width: 0; height: 0; display: none; }
          .biq-side-section-label {
            font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em;
            color: var(--text-slate-400); padding: 12px 8px 0; margin: 16px 0 6px;
            border-top: 1px solid var(--border-slate-200);
          }
          .biq-side-scroll > .biq-side-section-label:first-child { margin-top: 6px; border-top: none; padding-top: 0; }
          .biq-side-list { display: flex; flex-direction: column; gap: 1px; }
          .biq-view-item {
            display: flex; align-items: center; gap: 10px; width: 100%;
            padding: 7px 10px; border-radius: 8px; border: none; background: transparent;
            cursor: pointer; transition: background .12s ease; text-align: left;
          }
          .biq-view-item:hover { background: var(--bg-slate-50); }
          .biq-view-item.is-active { background: var(--bg-blue-50); }
          .biq-view-item.is-active .biq-view-label { color: var(--text-slate-900); font-weight: 600; }
          .biq-view-icon { font-size: 14px; width: 16px; display: inline-flex; justify-content: center; }
          .biq-view-label { flex: 1; font-size: 13px; font-weight: 500; color: var(--text-slate-700); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .biq-view-count { font-size: 11.5px; font-weight: 600; color: var(--text-slate-400); min-width: 18px; text-align: right; }
          .biq-view-item.is-active .biq-view-count {
            color: #3B82F6; font-weight: 700;
            background: rgba(59,130,246,0.12); border-radius: 6px; padding: 1px 7px; min-width: 0;
          }

          /* ---------- Main ---------- */
          .biq-main {
            flex: 1; min-width: 0;
            padding: 8px 18px 0;
            display: flex; flex-direction: column; height: 100%;
          }
          .biq-topbar {
            display: flex; align-items: center; justify-content: space-between;
            gap: 12px; padding-bottom: 4px; flex-wrap: wrap;
          }
          .biq-topbar-search-wrap { flex: 1; min-width: 220px; max-width: 420px; }
          .biq-search-input.ant-input-affix-wrapper {
            border-radius: 8px;
            border: 1px solid var(--border-slate-200);
            background: var(--bg-slate-50);
          }
          .biq-topbar-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
          .biq-range.ant-picker { border-radius: 8px; }
          .biq-divider { height: 1px; background: var(--border-slate-200); margin: 0 -18px 12px; }

          /* ---------- Segmented (list/grid) ---------- */
          .biq-segmented {
            display: flex; align-items: center;
            background: var(--bg-slate-50); padding: 4px; border-radius: 8px;
            border: 1px solid var(--border-slate-200); gap: 4px;
          }
          .biq-segmented button {
            background: transparent; border: none; border-radius: 6px;
            padding: 5px 10px; color: var(--text-slate-500); cursor: pointer;
            display: flex; align-items: center; justify-content: center; transition: all 0.2s;
          }
          .biq-segmented button:hover { color: var(--text-slate-800); }
          .biq-segmented button.is-active {
            background: var(--bg-pure-white); color: #3b82f6;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1); font-weight: 600;
          }

          /* ---------- Stat grid ---------- */
          .biq-stat-grid {
            display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 12px; margin-bottom: 14px;
          }
          @media (max-width: 1100px) { .biq-stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
          @media (max-width: 600px) { .biq-stat-grid { grid-template-columns: 1fr; } }
          .biq-stat-card {
            position: relative; background: transparent;
            border: 1px solid var(--border-slate-100); border-radius: 0;
            padding: 6px 12px; overflow: hidden; transition: border-color .15s ease;
          }
          .biq-stat-card:hover { border-color: var(--border-slate-200); }
          .biq-stat-card:hover { border-color: var(--border-slate-200); }
          .biq-stat-head { display: flex; align-items: center; gap: 8px; min-width: 0; }
          .biq-stat-icon { width: 24px; height: 24px; border-radius: 7px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
          .biq-stat-label {
            flex: 1; min-width: 0; font-size: 11px; font-weight: 700; color: var(--text-slate-500);
            letter-spacing: 0.04em; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          }
          .biq-stat-value-wrap { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
          .biq-stat-value { font-size: 18px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1; font-variant-numeric: tabular-nums; }
          .biq-stat-subtle {
            display: block; font-size: 10.5px; color: var(--text-slate-500); margin-top: 2px;
            padding-left: 32px; font-weight: 500; line-height: 1.35; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          }
          .biq-stat-chart { margin-top: 4px; padding-top: 4px; padding-left: 32px; border-top: 1px dashed var(--border-slate-100); }
          .biq-stat-spark-wrap { display: flex; align-items: center; justify-content: space-between; width: 100%; padding-right: 4px; }
          .biq-spark-label { font-size: 11px; font-weight: 600; color: var(--text-slate-400); }
          .biq-stat-chart svg { display: block; }

          /* ---------- Body ---------- */
          .biq-body { flex: 1; min-height: 0; overflow-y: auto; padding-bottom: 0; }

          /* ---------- Fixed full-bleed pagination footer ---------- */
          .biq-bottom-bar {
            flex-shrink: 0;
            display: flex; align-items: center; justify-content: space-between;
            flex-wrap: wrap; gap: 10px;
            margin: 0 -18px;          /* full-bleed: cancel .biq-main horizontal padding */
            padding: 8px 18px;
            background: var(--bg-pure-white);
            border-top: 1px solid var(--border-slate-200);
            box-shadow: 0 -4px 14px rgba(15,23,42,0.05);
          }
          .biq-bottom-info { font-size: 12px; color: var(--text-slate-500); }
          .biq-bottom-info strong { color: var(--text-slate-700); font-weight: 700; font-variant-numeric: tabular-nums; }
          .biq-pager { display: flex; align-items: center; gap: 3px; }
          .biq-pager-btn, .biq-pager-num {
            min-width: 24px; height: 24px; border-radius: 5px; border: 1px solid var(--border-slate-200);
            background: var(--bg-pure-white); color: var(--text-slate-600); cursor: pointer; font-size: 11px; font-weight: 600;
          }
          .biq-pager-btn:hover:not(:disabled), .biq-pager-num:hover { border-color: #3b82f6; color: #3b82f6; }
          .biq-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
          .biq-pager-num.is-active { background: #3B82F6; border-color: #3B82F6; color: #fff; }
          .biq-pagesize { margin-left: 5px; }
          .biq-pagesize .ant-select-selector { border-radius: 7px !important; height: 24px !important; font-size: 11px !important; padding: 0 8px !important; }

          /* ---------- Table (list) ---------- */
          .biq-table-card {
            position: relative; background: var(--bg-pure-white);
            border-radius: 0; border: 1px solid var(--border-slate-200); overflow: hidden;
          }
          .biq-table,
          .biq-table.ant-table-wrapper,
          .biq-table .ant-table,
          .biq-table .ant-table-wrapper,
          .biq-table .ant-table-container,
          .biq-table .ant-table-content,
          .biq-table .ant-table-header,
          .biq-table .ant-table-body {
            background: transparent !important;
            border-radius: 0px !important;
          }
          .biq-table .ant-table-thead > tr > th, .biq-table .ant-table-thead > tr > td {
            background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important;
            font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em !important;
            text-transform: uppercase !important; color: var(--text-slate-400) !important; padding: 6px 10px !important;
            white-space: nowrap !important;
            border-radius: 0 !important;
            border-start-start-radius: 0 !important;
            border-start-end-radius: 0 !important;
          }
          .biq-table .ant-table-thead > tr > th::before { display: none !important; }
          .biq-table.ant-table-wrapper .ant-table-tbody > tr > td {
            padding: 14px 10px !important; border-bottom: 1px solid var(--border-slate-100) !important;
            transition: background .15s ease; position: relative;
            background: var(--bg-pure-white);
          }
          .biq-table.ant-table-wrapper .biq-row > td:first-child::before {
            content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
            background: linear-gradient(180deg, #3b82f6, #2563eb); opacity: 0; transition: opacity .2s ease; pointer-events: none;
          }
          .biq-table.ant-table-wrapper .biq-row:hover > td { background: var(--bg-slate-50) !important; }
          .biq-table.ant-table-wrapper .biq-row:hover > td:first-child::before { opacity: 1; }
          .biq-table.ant-table-wrapper .ant-table-tbody > tr > td.ant-table-cell-fix-right { background: var(--bg-pure-white) !important; }
          .biq-table.ant-table-wrapper .biq-row:hover > td.ant-table-cell-fix-right { background: var(--bg-slate-50) !important; }
          .biq-table.ant-table-wrapper .ant-table-thead > tr > th.ant-table-cell-fix-right { background: var(--bg-slate-50) !important; }
          .biq-table.ant-table-wrapper .ant-pagination { padding: 12px 16px; margin: 0 !important; }

          /* ---------- Cell content ---------- */
          .biq-score { display: flex; flex-direction: column; gap: 2px; }
          .biq-score-num { font-size: 18px; font-weight: 800; line-height: 1; font-variant-numeric: tabular-nums; }
          .biq-score-tag { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; }
          .biq-lead-title {
            font-size: 13px; font-weight: 700; color: var(--text-slate-900);
            max-width: 360px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          }
          .biq-lead-meta { display: flex; gap: 14px; margin-top: 3px; }
          .biq-lead-meta span { display: inline-flex; align-items: center; gap: 4px; font-size: 11.5px; color: var(--text-slate-500); }
          .biq-match { display: inline-flex; align-items: center; gap: 5px; font-size: 12.5px; font-weight: 650; color: var(--text-blue-700); }
          .biq-muted { font-size: 12.5px; color: var(--text-slate-500); }
          .biq-tag-green {
            border: none !important; border-radius: 6px !important;
            background: rgba(16,185,129,0.12) !important; color: #059669 !important; font-weight: 600 !important;
          }
          .biq-view-btn {
            display: inline-flex; align-items: center; gap: 5px; border: none;
            background: rgba(16, 185, 129, 0.1); color: #10b981; font-size: 12px; font-weight: 700;
            padding: 6px 12px; border-radius: 8px; cursor: pointer; transition: background 0.15s ease;
          }
          .biq-view-btn:hover { background: rgba(16, 185, 129, 0.18); }

          /* ---------- Grid (cards) ---------- */
          .biq-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 24px; }
          @media (max-width: 760px) { .biq-grid { grid-template-columns: 1fr; } }
          .biq-card {
            border: 1px solid var(--border-slate-200); border-radius: 0; background: var(--bg-pure-white);
            cursor: pointer; overflow: hidden; display: flex; flex-direction: column;
            transition: box-shadow .15s ease, border-color .15s ease;
          }
          .biq-card:hover { box-shadow: 0 3px 12px rgba(15,23,42,0.06); border-color: #cbd5e1; }
          .biq-card-head { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; flex: 1; }
          .biq-card-avatar {
            width: 34px; height: 30px; border-radius: 6px; flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
            color: #fff; font-weight: 800; font-size: 13px; font-variant-numeric: tabular-nums;
          }
          .biq-card-title-group { display: flex; flex-direction: column; min-width: 0; gap: 3px; flex: 1; }
          .biq-card-title {
            font-size: 13px; font-weight: 700; color: var(--text-slate-900); letter-spacing: -0.01em; line-height: 1.3;
            display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin: 0;
          }
          .biq-card-subtitle { display: flex; align-items: center; gap: 5px; font-size: 11.5px; min-width: 0; }
          .biq-card-subtitle-key { color: var(--text-slate-400); font-weight: 600; flex-shrink: 0; }
          .biq-card-subtitle-val { color: var(--text-slate-700); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .biq-card-level { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; flex-shrink: 0; }
          .biq-card-footer { display: flex; flex-direction: column; border-top: 1px solid var(--border-slate-200); background: var(--bg-slate-50); }
          .biq-card-footer-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 8px 12px; }
          .biq-card-footer-row + .biq-card-footer-row { border-top: 1px solid var(--border-slate-200); }
          .biq-card-footer-item { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--text-slate-700); font-weight: 600; }
          .biq-card-footer-key { font-size: 10.5px; font-weight: 600; color: var(--text-slate-400); }
          .biq-card-footer-val { color: var(--text-slate-700); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .biq-card-footer-div { width: 1px; height: 11px; background: var(--border-slate-300, #cbd5e1); }

          /* ---------- Empty ---------- */
          .biq-empty { padding: 56px 24px; text-align: center; }
          .biq-empty-icon {
            width: 64px; height: 64px; border-radius: 16px; margin: 0 auto 14px;
            display: flex; align-items: center; justify-content: center;
            background: var(--bg-blue-50); color: #3b82f6;
          }
          .biq-empty-title { font-size: 15px; font-weight: 700; color: var(--text-slate-900); }
          .biq-empty-text { font-size: 13px; color: var(--text-slate-500); margin-top: 4px; }

          .biq-mobile-menu-btn { display: none !important; }

          @media (max-width: 700px) {
            .biq-grid { grid-template-columns: 1fr; }
            .biq-stats { grid-template-columns: 1fr !important; }
          }
          @media (max-width: 1100px) {
            .biq-stats { grid-template-columns: repeat(2, 1fr); }
          }
          @media (max-width: 820px) {
            .biq-shell { flex-direction: column; height: auto; min-height: calc(100vh - 64px); overflow: visible; }
            .biq-main { height: auto; overflow: visible; }
            .biq-body { overflow: visible; }
            .biq-sidebar {
              position: fixed; top: 0; left: -320px; bottom: 0; z-index: 1100;
              height: 100%; max-height: none; display: flex; flex-direction: column;
              align-items: stretch; background: var(--bg-pure-white); width: 280px;
              box-sizing: border-box; transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              box-shadow: 4px 0 24px rgba(0,0,0,0.08); display: flex !important;
            }
            .biq-sidebar.is-open { left: 0; }
            .biq-topbar { flex-direction: column; align-items: flex-start; gap: 12px; }
            .biq-topbar-actions { width: 100%; justify-content: flex-start; flex-wrap: wrap; }
            .biq-mobile-menu-btn { display: flex !important; align-items: center; justify-content: center; color: var(--text-slate-700); }
            .biq-mobile-overlay {
              position: fixed; top: 0; left: 0; right: 0; bottom: 0;
              background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(2px); z-index: 1099;
            }
          }

          /* ---------- Dark theme — mirrors Leads page ---------- */
          /* Surfaces (page/shell/sidebar/grid-card/bottom-bar) use --bg-pure-white,
             which flips to #0B0F1A in dark automatically — no override needed.
             Only elevated cards + the table internals get explicit overrides. */
          [data-theme='dark'] .biq-table-card { background: var(--bg-secondary); border-color: var(--border-slate-100); }
          [data-theme='dark'] .biq-search-input.ant-input-affix-wrapper { background: var(--bg-secondary) !important; }
          [data-theme='dark'] .biq-table.ant-table-wrapper .ant-table-thead > tr > th,
          [data-theme='dark'] .biq-table.ant-table-wrapper .ant-table-thead > tr > td { background: #161B22 !important; color: #94A3B8 !important; border-bottom-color: #374151 !important; }
          [data-theme='dark'] .biq-table.ant-table-wrapper .ant-table-tbody > tr > td { border-bottom-color: var(--border-slate-100) !important; }
          [data-theme='dark'] .biq-table.ant-table-wrapper .biq-row:hover > td { background: var(--bg-primary) !important; }
          [data-theme='dark'] .biq-table.ant-table-wrapper .ant-table-tbody > tr > td.ant-table-cell-fix-right { background: var(--bg-pure-white) !important; }
          [data-theme='dark'] .biq-table.ant-table-wrapper .biq-row:hover > td.ant-table-cell-fix-right { background: var(--bg-primary) !important; }
          [data-theme='dark'] .biq-table.ant-table-wrapper .ant-table-thead > tr > th.ant-table-cell-fix-right { background: var(--bg-primary) !important; }
        `}} />
      </MainLayout>
    </ProtectedRoute>
  );
}
