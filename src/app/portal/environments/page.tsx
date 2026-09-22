"use client";

import ZukvoLoader from "@/components/common/ZukvoLoader";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Empty,
  Pagination,
  Typography,
  Button,
  Space,
  Tooltip,
  Input,
} from "antd";
import {
  FilterOutlined,
  ExpandAltOutlined,
  CloseOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  Server,
  Globe,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  History,
  HardDrive,
  Folder,
  LayoutGrid,
  List as ListIcon,
  Search,
  CheckCircle2,
  ChevronRight,
  Activity,
  Layers,
} from "lucide-react";
import {
  portalEnvironmentsService,
  PortalEnvListItem,
} from "@/services/portalEnvironmentsService";
import {
  p,
  TONE,
  KIND_META,
  STATUS_META,
  daysUntil,
  fmtRelative,
} from "./_ui";
import TicketFilterPill, {
  FilterPillOption,
} from "@/components/projects/TicketFilterPill";

const KIND_FILTER_OPTIONS: FilterPillOption[] = [
  { value: "production", label: "Production" },
  { value: "staging", label: "Staging" },
  { value: "uat", label: "UAT" },
  { value: "qa", label: "QA" },
  { value: "dev", label: "Dev" },
  { value: "demo", label: "Demo" },
  { value: "preview", label: "Preview" },
  { value: "other", label: "Other" },
];

const STATUS_FILTER_OPTIONS: FilterPillOption[] = [
  { value: "operational", label: "Operational" },
  { value: "degraded", label: "Degraded" },
  { value: "down", label: "Down" },
  { value: "maintenance", label: "Maintenance" },
  { value: "unknown", label: "Unknown" },
];

export default function PortalEnvironmentsListPage() {
  const [items, setItems] = useState<PortalEnvListItem[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kind, setKind] = useState<string>("ALL");
  const [status, setStatus] = useState<string>("ALL");
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [page, setPage] = useState(1);
  const [isFilterRowOpen, setIsFilterRowOpen] = useState(false);
  const [limit, setLimit] = useState(15);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await portalEnvironmentsService.list({
        page,
        limit,
        kind: kind === "ALL" ? undefined : kind,
        status: status === "ALL" ? undefined : status,
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
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, kind, status, projectId]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const projects = useMemo(() => {
    if (meta?.projects && meta.projects.length > 0) {
      return meta.projects;
    }
    const seen = new Map<string, { id: string; name: string }>();
    for (const env of items) {
      if (env.projectId && env.projectName && !seen.has(env.projectId)) {
        seen.set(env.projectId, { id: env.projectId, name: env.projectName });
      }
    }
    return Array.from(seen.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [items, meta?.projects]);

  const projectFilterOptions: FilterPillOption[] = useMemo(() => {
    return projects.map((p: any) => ({ value: p.id, label: p.name }));
  }, [projects]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (kind !== "ALL") count++;
    if (status !== "ALL") count++;
    if (projectId) count++;
    return count;
  }, [kind, status, projectId]);

  const stats = useMemo(() => {
    if (meta?.stats) return meta.stats;
    const total = items.length;
    const production = items.filter((e) => e.kind === "production").length;
    const operational = items.filter((e) => e.status === "operational").length;
    const sslValid = items.filter((e) => {
      const d = daysUntil(e.sslExpiresAt);
      return d == null || d >= 0;
    }).length;
    const totalDeploys = items.reduce(
      (acc, e) => acc + (e.deploymentCount || 0),
      0,
    );
    return { total, production, operational, sslValid, totalDeploys };
  }, [items, meta?.stats]);

  const total = meta?.total ?? items.length;
  const pagedItems = items;

  const healthPct =
    stats.total > 0 ? Math.round((stats.operational / stats.total) * 100) : 0;

  const activeKindLabel = useMemo(() => {
    if (kind === "ALL") return "All environments";
    const found = KIND_FILTER_OPTIONS.find((k) => k.value === kind);
    return found ? found.label : "All environments";
  }, [kind]);

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
      {/* ── Top Header Toolbar matching unified layout ── */}
      <div className="pm2-toolbar saas-header-container sc-header">
        <div className="pm2-head-id">
          <span className="pm2-head-ic">
            <Server size={16} />
          </span>
          <span className="pm2-head-text">
            <span className="pm2-head-title">Environments</span>
            <span className="pm2-head-sub">HOSTING, SSL & DEPLOYMENT TRACKING</span>
          </span>
        </div>

        <div className="sc-header-controls">
          <Input
            placeholder="Quick search environment name or URL..."
            prefix={
              <Search
                size={13}
                style={{ color: "var(--text-slate-400)", marginRight: 4 }}
              />
            }
            className="saas-input"
            style={{
              maxWidth: 280,
              borderRadius: 8,
              height: 32,
              background: "transparent",
              fontSize: 12.5,
            }}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            allowClear
          />

          <Space.Compact className="ticket-filter-group">
            <Button
              icon={<FilterOutlined />}
              className={activeFilterCount > 0 ? "saas-tag-blue" : ""}
              style={{ height: 32, fontWeight: 600, fontSize: 12 }}
              onClick={() => setIsFilterRowOpen((v) => !v)}
            >
              Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </Button>
            <Button
              icon={<ExpandAltOutlined />}
              style={{ height: 32 }}
              aria-label="Expand filters"
              onClick={() => setIsFilterRowOpen((v) => !v)}
            />
          </Space.Compact>

          {/* View Toggle */}
          <div
            className="premium-view-toggle"
            role="group"
            aria-label="View mode"
          >
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
          <Tooltip title="Refresh environments">
            <Button
              icon={<ReloadOutlined spin={refreshing} />}
              onClick={() => load(true)}
              disabled={loading}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            />
          </Tooltip>
        </Space>
      </div>

      {/* ── Inline filter row (when opened) ── */}
      {isFilterRowOpen && (
        <div className="tl-filter-row">
          <div className="tl-filter-row-label">
            <FilterOutlined style={{ fontSize: 11 }} />
            <span>Filters</span>
            <span className="tl-filter-row-count">{activeFilterCount}</span>
          </div>

          <div className="tl-filter-row-pills">
            {/* Kind Pill */}
            <TicketFilterPill
              icon={<Layers size={12} />}
              label="Kind"
              value={kind === "ALL" ? "" : kind}
              options={KIND_FILTER_OPTIONS}
              onChange={(val: any) => {
                setKind(val || "ALL");
                setPage(1);
              }}
              itemNoun="kinds"
              multiple={false}
            />

            {/* Status Pill */}
            <TicketFilterPill
              icon={<Activity size={12} />}
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

            {/* Project Pill */}
            {projectFilterOptions.length > 0 && (
              <TicketFilterPill
                icon={<Folder size={12} />}
                label="Project"
                value={projectId || ""}
                options={projectFilterOptions}
                onChange={(val: any) => {
                  setProjectId(val || undefined);
                  setPage(1);
                }}
                itemNoun="projects"
                multiple={false}
              />
            )}
          </div>

          <div className="tl-filter-row-actions">
            {activeFilterCount > 0 && (
              <button
                type="button"
                className="tl-filter-row-reset"
                onClick={() => {
                  setKind("ALL");
                  setStatus("ALL");
                  setProjectId(undefined);
                  setPage(1);
                }}
              >
                <ReloadOutlined style={{ fontSize: 10 }} />
                Reset
              </button>
            )}
            <button
              type="button"
              className="tl-filter-row-close"
              onClick={() => setIsFilterRowOpen(false)}
              aria-label="Close filters"
              title="Close filters"
            >
              <CloseOutlined style={{ fontSize: 10 }} />
            </button>
          </div>
        </div>
      )}

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
              Environments Overview — {activeKindLabel}
            </span>
            <span className="tl-sprint-tags">
              <span className="tl-sprint-tag tl-sprint-tag-neutral">
                {stats.total} ENVIRONMENTS
              </span>
              {stats.production > 0 && (
                <span className="tl-sprint-tag tl-sprint-tag-active">
                  {stats.production} PRODUCTION
                </span>
              )}
              {stats.operational > 0 && (
                <span className="tl-sprint-tag tl-sprint-tag-active">
                  {stats.operational} OPERATIONAL
                </span>
              )}
              {stats.sslValid > 0 && (
                <span className="tl-sprint-tag tl-sprint-tag-neutral">
                  {stats.sslValid} SSL VALID
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="tl-sprint-row2">
          <span className="tl-sprint-meta">
            <span className="pm2-pulse-dot" />
            <b>{items.length}</b>{" "}
            {items.length === 1 ? "environment" : "environments"} on this page
          </span>
          <span className="tl-sprint-meta">
            <b>{stats.operational}</b> operational
          </span>
          <span className="tl-sprint-meta">
            <b>{stats.sslValid}</b> secure SSL certificates
          </span>
          <span className="tl-sprint-meta">
            <b>{stats.totalDeploys}</b> total deployments
          </span>
        </div>

        <div className="tl-sprint-row3">
          <div className="tl-sprint-progress-bar">
            <div
              className="tl-sprint-progress-fill"
              style={{ width: `${healthPct}%` }}
            />
          </div>
          <span className="tl-sprint-progress-pct">{healthPct}%</span>
        </div>
      </div>

      {/* ── Main Content Container ── */}
      <div
        className="portal-environments-content"
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
        ) : items.length === 0 ? (
          <div style={{ padding: 56, textAlign: "center" }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ color: p.textSubtle }}>
                  {search || activeFilterCount > 0
                    ? "No environments match your filter criteria."
                    : "No environments shared with you yet."}
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
                  "minmax(240px, 2fr) 130px 120px 140px 140px minmax(180px, 1.5fr)",
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
              <div>ENVIRONMENT / URL</div>
              <div>KIND</div>
              <div>STATUS</div>
              <div>VERSION</div>
              <div>SSL CERTIFICATE</div>
              <div>LAST DEPLOY / BACKUP</div>
            </div>

            <div>
              {pagedItems.map((env, idx) => (
                <EnvironmentTableRow
                  key={env.id}
                  env={env}
                  isLast={idx === pagedItems.length - 1}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Card View */
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
              gap: 14,
              padding: "16px 24px",
            }}
          >
            {pagedItems.map((env) => (
              <EnvironmentCard key={env.id} env={env} />
            ))}
          </div>
        )}
      </div>

      {/* ── Fixed Sticky Bottom Footer ── */}
      <div
        className="portal-environments-pagination-footer"
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
              {total > 0 ? (page - 1) * limit + 1 : 0}–
              {Math.min(page * limit, total)}
            </span>{" "}
            of <span style={{ color: p.text, fontWeight: 700 }}>{total}</span>{" "}
            environment{total !== 1 ? "s" : ""}
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
          color: #d97706;
          border-color: rgba(217, 119, 6, 0.32);
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

        .portal-environments-pagination-footer .ant-pagination-item,
        .portal-environments-pagination-footer .ant-pagination-prev .ant-pagination-item-link,
        .portal-environments-pagination-footer .ant-pagination-next .ant-pagination-item-link {
          border: 1px solid var(--border-slate-200, #e2e8f0) !important;
          border-radius: 6px !important;
          background: transparent !important;
          color: var(--text-slate-500, #64748b) !important;
        }
        .portal-environments-pagination-footer .ant-pagination-item-active {
          background: #3b82f6 !important;
          border-color: #3b82f6 !important;
        }
        .portal-environments-pagination-footer .ant-pagination-item-active a {
          color: #ffffff !important;
        }
      `}</style>
    </div>
  );
}

/* --------------------------------------------------------------- */
/*  Table Row Component (Edge-to-edge, NO Actions Column)          */
/* --------------------------------------------------------------- */

function EnvironmentTableRow({
  env,
  isLast,
}: {
  env: PortalEnvListItem;
  isLast: boolean;
}) {
  const kindMeta = KIND_META[env.kind] || KIND_META.other;
  const st = STATUS_META[env.status] || STATUS_META.unknown;
  const StIcon = st.icon;
  const sslDays = daysUntil(env.sslExpiresAt);
  const sslTone =
    sslDays == null
      ? TONE.neutral
      : sslDays < 0
      ? TONE.danger
      : sslDays <= 14
      ? TONE.warning
      : TONE.success;
  const sslLabel =
    sslDays == null
      ? "SSL —"
      : sslDays < 0
      ? `SSL expired ${Math.abs(sslDays)}d ago`
      : `SSL ${sslDays}d left`;

  return (
    <Link
      href={`/portal/environments/${env.id}`}
      className="pm2-table-row"
      style={{
        display: "grid",
        gridTemplateColumns:
          "minmax(240px, 2fr) 130px 120px 140px 140px minmax(180px, 1.5fr)",
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
      {/* 1. Environment / URL */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <div
          style={{
            width: 26,
            height: 26,
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
          <Server size={13} />
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
            title={env.name}
          >
            {env.name}
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 1,
            }}
          >
            {env.url && (
              <span
                style={{
                  fontSize: 11,
                  color: "#2563eb",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                <Globe size={10} />
                {env.url.replace(/^https?:\/\//, "")}
              </span>
            )}
            {env.projectName && (
              <>
                <span style={{ color: "#cbd5e1", fontSize: 10 }}>·</span>
                <span
                  style={{
                    fontSize: 10.5,
                    color: "#64748b",
                    fontWeight: 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {env.projectName}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Kind */}
      <div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "1px 8px",
            background: TONE[kindMeta.tone].bg,
            border: `1px solid ${TONE[kindMeta.tone].border}`,
            color: TONE[kindMeta.tone].text,
            borderRadius: 999,
            fontSize: 10.5,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {kindMeta.label}
        </span>
      </div>

      {/* 3. Status */}
      <div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "2px 8px",
            background: TONE[st.tone].bg,
            border: `1px solid ${TONE[st.tone].border}`,
            color: TONE[st.tone].text,
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          <StIcon size={11} />
          {st.label}
        </span>
      </div>

      {/* 4. Version / Uptime */}
      <div>
        {env.currentVersion ? (
          <span
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 11,
              padding: "1px 6px",
              background: "#f1f5f9",
              border: "1px solid #e2e8f0",
              color: "#334155",
              borderRadius: 4,
              fontWeight: 600,
            }}
          >
            {env.currentVersion}
          </span>
        ) : (
          <span style={{ fontSize: 12, color: "#94a3b8" }}>—</span>
        )}
      </div>

      {/* 5. SSL Status */}
      <div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "2px 8px",
            background: sslTone.bg,
            border: `1px solid ${sslTone.border}`,
            color: sslTone.text,
            borderRadius: 999,
            fontSize: 10.5,
            fontWeight: 600,
          }}
        >
          {sslDays != null && sslDays < 0 ? (
            <ShieldAlert size={10} />
          ) : (
            <ShieldCheck size={10} />
          )}
          {sslLabel}
        </span>
      </div>

      {/* 6. Last Deploy / Backup */}
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <span style={{ fontSize: 11.5, color: "#334155", fontWeight: 600 }}>
          {env.lastDeployedAt ? fmtRelative(env.lastDeployedAt) : "Never deployed"}
        </span>
        {env.lastBackupAt && (
          <span style={{ fontSize: 10.5, color: "#64748b" }}>
            Backup {fmtRelative(env.lastBackupAt)}
          </span>
        )}
      </div>
    </Link>
  );
}

/* --------------------------------------------------------------- */
/*  Card Component                                                 */
/* --------------------------------------------------------------- */

function EnvironmentCard({ env }: { env: PortalEnvListItem }) {
  const kindMeta = KIND_META[env.kind] || KIND_META.other;
  const st = STATUS_META[env.status] || STATUS_META.unknown;
  const StIcon = st.icon;
  const sslDays = daysUntil(env.sslExpiresAt);
  const sslTone =
    sslDays == null
      ? TONE.neutral
      : sslDays < 0
      ? TONE.danger
      : sslDays <= 14
      ? TONE.warning
      : TONE.success;
  const sslLabel =
    sslDays == null
      ? "SSL —"
      : sslDays < 0
      ? `SSL expired ${Math.abs(sslDays)}d ago`
      : `SSL ${sslDays}d left`;

  return (
    <Link
      href={`/portal/environments/${env.id}`}
      className="pm2-card"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 12,
        padding: "16px 18px",
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        textDecoration: "none",
        color: "inherit",
        cursor: "pointer",
        position: "relative",
      }}
    >
      {/* Top row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            padding: "1px 8px",
            background: TONE[kindMeta.tone].bg,
            border: `1px solid ${TONE[kindMeta.tone].border}`,
            color: TONE[kindMeta.tone].text,
            borderRadius: 999,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {kindMeta.label}
        </span>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "2px 8px",
            background: TONE[st.tone].bg,
            border: `1px solid ${TONE[st.tone].border}`,
            color: TONE[st.tone].text,
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          <StIcon size={11} />
          {st.label}
        </span>
      </div>

      {/* Name & Project */}
      <div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "#0f172a",
            lineHeight: 1.3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={env.name}
        >
          {env.name}
        </div>
        {env.projectName && (
          <div
            style={{
              marginTop: 2,
              fontSize: 11.5,
              color: "#64748b",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Folder size={11} color="#94a3b8" />
            {env.projectName}
          </div>
        )}
      </div>

      {/* URL pill */}
      {env.url && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 8px",
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: 6,
            color: "#1d4ed8",
            fontSize: 11.5,
            fontWeight: 600,
            maxWidth: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          <Globe size={11} />
          {env.url.replace(/^https?:\/\//, "")}
          <ExternalLink size={10} style={{ marginLeft: "auto" }} />
        </div>
      )}

      {/* Metrics Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
          fontSize: 11.5,
          padding: "8px 10px",
          background: "#f8fafc",
          border: "1px solid #f1f5f9",
          borderRadius: 8,
        }}
      >
        <div>
          <div style={{ fontSize: 9.5, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>
            Version
          </div>
          <div style={{ color: "#0f172a", fontWeight: 700, marginTop: 1 }}>
            {env.currentVersion || "—"}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 9.5, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>
            Uptime
          </div>
          <div style={{ color: "#0f172a", fontWeight: 700, marginTop: 1 }}>
            {env.uptimePercent != null ? `${Number(env.uptimePercent).toFixed(1)}%` : "—"}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 9.5, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>
            Last deploy
          </div>
          <div style={{ color: "#475569", fontWeight: 600, marginTop: 1 }}>
            {env.lastDeployedAt ? fmtRelative(env.lastDeployedAt) : "Never"}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 9.5, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>
            Backup
          </div>
          <div style={{ color: "#475569", fontWeight: 600, marginTop: 1 }}>
            {env.lastBackupAt ? fmtRelative(env.lastBackupAt) : "—"}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 10,
          borderTop: "1px solid #f1f5f9",
          fontSize: 11,
          color: "#64748b",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "1px 7px",
            background: sslTone.bg,
            border: `1px solid ${sslTone.border}`,
            color: sslTone.text,
            borderRadius: 999,
            fontSize: 10.5,
            fontWeight: 600,
          }}
        >
          {sslDays != null && sslDays < 0 ? (
            <ShieldAlert size={10} />
          ) : (
            <ShieldCheck size={10} />
          )}
          {sslLabel}
        </span>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            color: "#64748b",
            fontSize: 11,
            fontWeight: 500,
          }}
        >
          <History size={11} color="#94a3b8" />
          {env.deploymentCount || 0} deploys
          <ChevronRight size={13} color="#94a3b8" style={{ marginLeft: 2 }} />
        </span>
      </div>
    </Link>
  );
}
