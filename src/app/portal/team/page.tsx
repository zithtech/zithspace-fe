"use client";

import ZukvoLoader from "@/components/common/ZukvoLoader";
import React, { useEffect, useMemo, useState } from "react";
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
  Users,
  Mail,
  Phone,
  Crown,
  Search,
  Briefcase,
  Folder,
  LayoutGrid,
  List as ListIcon,
  Wifi,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import {
  portalTeamService,
  PortalTeamMember,
} from "@/services/portalTeamService";
import TicketFilterPill, {
  FilterPillOption,
} from "@/components/projects/TicketFilterPill";

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
  indigo: "#4f46e5",
  indigoBg: "#eef2ff",
  indigoBorder: "#c7d2fe",
  indigoText: "#4338ca",
  accent: "#3b82f6",
  accentBg: "#eff6ff",
  accentBorder: "#bfdbfe",
  accentText: "#1d4ed8",
  successBg: "#ecfdf5",
  successBorder: "#a7f3d0",
  successText: "#047857",
  warningBg: "#fffbeb",
  warningBorder: "#fde68a",
  warningText: "#92400e",
  dangerBg: "#fef2f2",
  dangerBorder: "#fecaca",
  dangerText: "#b91c1c",
  purpleBg: "#f5f3ff",
  purpleBorder: "#ddd6fe",
  purpleText: "#6d28d9",
  pinkBg: "#fdf2f8",
  pinkBorder: "#fbcfe8",
  pinkText: "#be185d",
  neutralBg: "#f1f5f9",
  neutralBorder: "#e2e8f0",
  neutralText: "#475569",
};

const TONE = {
  accent: { bg: p.accentBg, border: p.accentBorder, text: p.accentText },
  success: { bg: p.successBg, border: p.successBorder, text: p.successText },
  warning: { bg: p.warningBg, border: p.warningBorder, text: p.warningText },
  danger: { bg: p.dangerBg, border: p.dangerBorder, text: p.dangerText },
  purple: { bg: p.purpleBg, border: p.purpleBorder, text: p.purpleText },
  pink: { bg: p.pinkBg, border: p.pinkBorder, text: p.pinkText },
  neutral: { bg: p.neutralBg, border: p.neutralBorder, text: p.neutralText },
};

const DISCIPLINE_META: Record<
  string,
  { label: string; tone: keyof typeof TONE }
> = {
  engineering: { label: "Engineering", tone: "accent" },
  design: { label: "Design", tone: "pink" },
  qa: { label: "QA", tone: "purple" },
  pm: { label: "PM", tone: "warning" },
  account: { label: "Account", tone: "success" },
  devops: { label: "DevOps", tone: "accent" },
  data: { label: "Data", tone: "purple" },
  support: { label: "Support", tone: "accent" },
  other: { label: "Other", tone: "neutral" },
};

const AVAILABILITY_META: Record<
  string,
  { label: string; dot: string; text: string; bg: string; border: string }
> = {
  available: {
    label: "Available",
    dot: "#10b981",
    text: p.successText,
    bg: p.successBg,
    border: p.successBorder,
  },
  limited: {
    label: "Limited capacity",
    dot: "#f59e0b",
    text: p.warningText,
    bg: p.warningBg,
    border: p.warningBorder,
  },
  away: {
    label: "Away",
    dot: "#94a3b8",
    text: p.textSubtle,
    bg: p.neutralBg,
    border: p.neutralBorder,
  },
  unavailable: {
    label: "Unavailable",
    dot: "#ef4444",
    text: p.dangerText,
    bg: p.dangerBg,
    border: p.dangerBorder,
  },
};

const DISCIPLINE_FILTER_OPTIONS: FilterPillOption[] = [
  { value: "engineering", label: "Engineering" },
  { value: "design", label: "Design" },
  { value: "qa", label: "QA" },
  { value: "pm", label: "PM" },
  { value: "account", label: "Account" },
  { value: "devops", label: "DevOps" },
  { value: "data", label: "Data" },
  { value: "support", label: "Support" },
  { value: "other", label: "Other" },
];

const AVAILABILITY_FILTER_OPTIONS: FilterPillOption[] = [
  { value: "available", label: "Available" },
  { value: "limited", label: "Limited capacity" },
  { value: "away", label: "Away" },
  { value: "unavailable", label: "Unavailable" },
];

function initials(name: string): string {
  return (name || "?")
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function PortalTeamPage() {
  const [items, setItems] = useState<PortalTeamMember[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [discipline, setDiscipline] = useState<string>("ALL");
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [availability, setAvailability] = useState<string | undefined>(
    undefined,
  );
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [page, setPage] = useState(1);
  const [isFilterRowOpen, setIsFilterRowOpen] = useState(false);
  const [limit, setLimit] = useState(15);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await portalTeamService.list({
        page,
        limit,
        discipline: discipline === "ALL" ? undefined : discipline,
        projectId,
        availability: availability === "ALL" ? undefined : availability,
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
  }, [page, limit, discipline, projectId, availability]);

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
    for (const m of items) {
      if (m.projectId && m.projectName && !seen.has(m.projectId)) {
        seen.set(m.projectId, { id: m.projectId, name: m.projectName });
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
    if (discipline !== "ALL") count++;
    if (projectId) count++;
    if (availability) count++;
    return count;
  }, [discipline, projectId, availability]);

  const stats = useMemo(() => {
    if (meta?.stats) return meta.stats;
    const total = items.length;
    const primaries = items.filter((m) => m.isPrimaryContact).length;
    const available = items.filter((m) => m.availabilityStatus === "available")
      .length;
    const disciplines = new Set<string>();
    for (const m of items) disciplines.add(m.discipline || "other");
    return {
      total,
      primaries,
      available,
      disciplines: disciplines.size,
    };
  }, [items, meta?.stats]);

  const total = meta?.total ?? items.length;
  const pagedItems = items;

  const availablePct =
    stats.total > 0 ? Math.round((stats.available / stats.total) * 100) : 0;

  const activeDisciplineLabel = useMemo(() => {
    if (discipline === "ALL") return "All team members";
    const found = DISCIPLINE_FILTER_OPTIONS.find((d) => d.value === discipline);
    return found ? found.label : "All team members";
  }, [discipline]);

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
            <Users size={16} />
          </span>
          <span className="pm2-head-text">
            <span className="pm2-head-title">Your Team</span>
            <span className="pm2-head-sub">WHO TO CONTACT & AVAILABILITY</span>
          </span>
        </div>

        <div className="sc-header-controls">
          <Input
            placeholder="Quick search team member or role..."
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
          <Tooltip title="Refresh team">
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
            {/* Discipline Pill */}
            <TicketFilterPill
              icon={<Briefcase size={12} />}
              label="Discipline"
              value={discipline === "ALL" ? "" : discipline}
              options={DISCIPLINE_FILTER_OPTIONS}
              onChange={(val: any) => {
                setDiscipline(val || "ALL");
                setPage(1);
              }}
              itemNoun="disciplines"
              multiple={false}
            />

            {/* Availability Pill */}
            <TicketFilterPill
              icon={<Wifi size={12} />}
              label="Availability"
              value={availability || ""}
              options={AVAILABILITY_FILTER_OPTIONS}
              onChange={(val: any) => {
                setAvailability(val || undefined);
                setPage(1);
              }}
              itemNoun="availabilities"
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
                  setDiscipline("ALL");
                  setAvailability(undefined);
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
              Team Overview — {activeDisciplineLabel}
            </span>
            <span className="tl-sprint-tags">
              <span className="tl-sprint-tag tl-sprint-tag-neutral">
                {stats.total} MEMBERS
              </span>
              {stats.primaries > 0 && (
                <span className="tl-sprint-tag tl-sprint-tag-delayed">
                  {stats.primaries} PRIMARY CONTACTS
                </span>
              )}
              {stats.available > 0 && (
                <span className="tl-sprint-tag tl-sprint-tag-active">
                  {stats.available} AVAILABLE NOW
                </span>
              )}
              {stats.disciplines > 0 && (
                <span className="tl-sprint-tag tl-sprint-tag-neutral">
                  {stats.disciplines} DISCIPLINES
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="tl-sprint-row2">
          <span className="tl-sprint-meta">
            <span className="pm2-pulse-dot" />
            <b>{items.length}</b>{" "}
            {items.length === 1 ? "member" : "members"} on this page
          </span>
          <span className="tl-sprint-meta">
            <b>{stats.primaries}</b> key project leaders
          </span>
          <span className="tl-sprint-meta">
            <b>{stats.available}</b> available right now
          </span>
          <span className="tl-sprint-meta">
            <b>{stats.disciplines}</b> specializations
          </span>
        </div>

        <div className="tl-sprint-row3">
          <div className="tl-sprint-progress-bar">
            <div
              className="tl-sprint-progress-fill"
              style={{ width: `${availablePct}%` }}
            />
          </div>
          <span className="tl-sprint-progress-pct">{availablePct}%</span>
        </div>
      </div>

      {/* ── Main Content Container ── */}
      <div
        className="portal-team-content"
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
                    ? "No team members match your filter criteria."
                    : "No team members assigned yet."}
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
                  "minmax(240px, 2fr) 140px 140px 140px minmax(200px, 1.5fr)",
                minWidth: 880,
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
              <div>MEMBER / ROLE</div>
              <div>DISCIPLINE</div>
              <div>AVAILABILITY</div>
              <div>PROJECT</div>
              <div>CONTACT</div>
            </div>

            <div>
              {pagedItems.map((m, idx) => (
                <TeamMemberTableRow
                  key={m.id}
                  m={m}
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
            {pagedItems.map((m) => (
              <TeamMemberCard key={m.id} m={m} />
            ))}
          </div>
        )}
      </div>

      {/* ── Fixed Sticky Bottom Footer ── */}
      <div
        className="portal-team-pagination-footer"
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
            member{total !== 1 ? "s" : ""}
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

        .portal-team-pagination-footer .ant-pagination-item,
        .portal-team-pagination-footer .ant-pagination-prev .ant-pagination-item-link,
        .portal-team-pagination-footer .ant-pagination-next .ant-pagination-item-link {
          border: 1px solid var(--border-slate-200, #e2e8f0) !important;
          border-radius: 6px !important;
          background: transparent !important;
          color: var(--text-slate-500, #64748b) !important;
        }
        .portal-team-pagination-footer .ant-pagination-item-active {
          background: #3b82f6 !important;
          border-color: #3b82f6 !important;
        }
        .portal-team-pagination-footer .ant-pagination-item-active a {
          color: #ffffff !important;
        }
      `}</style>
    </div>
  );
}

/* --------------------------------------------------------------- */
/*  Table Row Component (Edge-to-edge, NO Actions Column)          */
/* --------------------------------------------------------------- */

function TeamMemberTableRow({
  m,
  isLast,
}: {
  m: PortalTeamMember;
  isLast: boolean;
}) {
  const disc = DISCIPLINE_META[m.discipline || "other"] || DISCIPLINE_META.other;
  const tone = TONE[disc.tone];
  const avail =
    AVAILABILITY_META[m.availabilityStatus] || AVAILABILITY_META.available;

  return (
    <div
      className="pm2-table-row"
      style={{
        display: "grid",
        gridTemplateColumns:
          "minmax(240px, 2fr) 140px 140px 140px minmax(200px, 1.5fr)",
        minWidth: 880,
        gap: 12,
        padding: "8px 16px",
        alignItems: "center",
        borderBottom: isLast ? "none" : "1px solid #f1f5f9",
        color: "inherit",
      }}
    >
      {/* 1. Member / Role */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: m.isPrimaryContact
              ? "linear-gradient(135deg, #fef3c7, #fde68a)"
              : "linear-gradient(135deg, #eff6ff, #dbeafe)",
            border: `1px solid ${m.isPrimaryContact ? "#f59e0b" : "#bfdbfe"}`,
            color: m.isPrimaryContact ? "#92400e" : "#1d4ed8",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            position: "relative",
          }}
        >
          {initials(m.displayName)}
          {m.isPrimaryContact && (
            <Crown
              size={11}
              color="#d97706"
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.15))",
              }}
            />
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
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
              title={m.displayName}
            >
              {m.displayName}
            </span>
            {m.isPrimaryContact && (
              <span
                style={{
                  fontSize: 9.5,
                  padding: "0 5px",
                  background: "#fffbeb",
                  border: "1px solid #fde68a",
                  color: "#92400e",
                  borderRadius: 4,
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                Lead Contact
              </span>
            )}
          </div>
          <span
            style={{
              fontSize: 11,
              color: "#64748b",
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {m.roleLabel || "Team Member"}
          </span>
        </div>
      </div>

      {/* 2. Discipline */}
      <div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "1px 8px",
            background: tone.bg,
            border: `1px solid ${tone.border}`,
            color: tone.text,
            borderRadius: 999,
            fontSize: 10.5,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {disc.label}
        </span>
      </div>

      {/* 3. Availability */}
      <div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "2px 8px",
            background: avail.bg,
            border: `1px solid ${avail.border}`,
            color: avail.text,
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: avail.dot,
            }}
          />
          {avail.label}
        </span>
      </div>

      {/* 4. Project */}
      <div style={{ minWidth: 0 }}>
        {m.projectName ? (
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#334155",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "100%",
            }}
            title={m.projectName}
          >
            <Folder size={11} color="#94a3b8" />
            {m.projectName}
          </span>
        ) : (
          <span style={{ fontSize: 12, color: "#94a3b8" }}>—</span>
        )}
      </div>

      {/* 5. Contact (Email / Phone) */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        {m.contactEmail && (
          <a
            href={`mailto:${m.contactEmail}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11.5,
              color: "#1d4ed8",
              textDecoration: "none",
              fontWeight: 600,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={m.contactEmail}
          >
            <Mail size={12} />
            {m.contactEmail}
          </a>
        )}
        {m.contactPhone && (
          <a
            href={`tel:${m.contactPhone}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11.5,
              color: "#475569",
              textDecoration: "none",
              fontWeight: 500,
            }}
            title={m.contactPhone}
          >
            <Phone size={12} />
            {m.contactPhone}
          </a>
        )}
        {!m.contactEmail && !m.contactPhone && (
          <span style={{ fontSize: 12, color: "#94a3b8" }}>—</span>
        )}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- */
/*  Card Component                                                 */
/* --------------------------------------------------------------- */

function TeamMemberCard({ m }: { m: PortalTeamMember }) {
  const disc = DISCIPLINE_META[m.discipline || "other"] || DISCIPLINE_META.other;
  const tone = TONE[disc.tone];
  const avail =
    AVAILABILITY_META[m.availabilityStatus] || AVAILABILITY_META.available;

  return (
    <div
      className="pm2-card"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 12,
        padding: "16px 18px",
        background: "#ffffff",
        border: `1px solid ${m.isPrimaryContact ? "#fde68a" : "#e2e8f0"}`,
        borderRadius: 10,
        position: "relative",
      }}
    >
      {/* Top row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              flexShrink: 0,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: m.isPrimaryContact
                ? "linear-gradient(135deg, #fef3c7, #fde68a)"
                : "linear-gradient(135deg, #eff6ff, #dbeafe)",
              border: `1px solid ${m.isPrimaryContact ? "#f59e0b" : "#bfdbfe"}`,
              color: m.isPrimaryContact ? "#92400e" : "#1d4ed8",
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              position: "relative",
            }}
          >
            {initials(m.displayName)}
            {m.isPrimaryContact && (
              <Crown
                size={12}
                color="#d97706"
                style={{
                  position: "absolute",
                  top: -5,
                  right: -5,
                  filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.15))",
                }}
              />
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#0f172a",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={m.displayName}
            >
              {m.displayName}
            </span>
            <span
              style={{
                fontSize: 11.5,
                color: "#64748b",
                fontWeight: 500,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {m.roleLabel || "Team Member"}
            </span>
          </div>
        </div>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "2px 7px",
            background: avail.bg,
            border: `1px solid ${avail.border}`,
            color: avail.text,
            borderRadius: 999,
            fontSize: 10.5,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: avail.dot,
            }}
          />
          {avail.label}
        </span>
      </div>

      {/* Chips */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "1px 7px",
            background: tone.bg,
            border: `1px solid ${tone.border}`,
            color: tone.text,
            borderRadius: 999,
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {disc.label}
        </span>
        {m.isPrimaryContact && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              padding: "1px 7px",
              background: "#fffbeb",
              border: "1px solid #fde68a",
              color: "#92400e",
              borderRadius: 999,
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            <Crown size={9} />
            Lead Contact
          </span>
        )}
      </div>

      {/* Bio snippet if available */}
      {m.bio && (
        <div
          style={{
            fontSize: 12,
            color: "#64748b",
            lineHeight: 1.45,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {m.bio}
        </div>
      )}

      {/* Footer: Contacts & Project */}
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
        <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0 }}>
          {m.projectName && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontWeight: 600,
                color: "#334155",
                maxWidth: 150,
              }}
            >
              <Folder size={11} color="#94a3b8" />
              {m.projectName}
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {m.contactEmail && (
            <a
              href={`mailto:${m.contactEmail}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 26,
                height: 26,
                borderRadius: 6,
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                color: "#1d4ed8",
              }}
              title={m.contactEmail}
            >
              <Mail size={12} />
            </a>
          )}
          {m.contactPhone && (
            <a
              href={`tel:${m.contactPhone}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 26,
                height: 26,
                borderRadius: 6,
                background: "#f1f5f9",
                border: "1px solid #e2e8f0",
                color: "#475569",
              }}
              title={m.contactPhone}
            >
              <Phone size={12} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
