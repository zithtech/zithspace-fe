"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Empty,
  Pagination,
  Select,
  DatePicker,
  Row as AntRow,
  Col,
  Divider,
  Typography,
  Drawer
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import {
  Search,
  Rocket,
  ChevronRight,
  Calendar,
  Flag,
  FolderKanban,
  Tag,
  X,
  CalendarRange,
  Folder,
  Layers,
  CalendarClock,
  Hash,
  ArrowLeft
} from "lucide-react";
import {

  portalReleaseService,
  PortalRelease,
  PortalReleaseMeta,
  PortalReleaseStats
} from "@/services/portalReleaseService";
import ZukvoLoader from "@/components/common/ZukvoLoader";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

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
  accentBg: "#eff6ff",
  accentBorder: "#bfdbfe",
  accentText: "#1d4ed8",
  purpleBg: "#f5f3ff",
  purpleBorder: "#ddd6fe",
  purpleText: "#6d28d9",
  successBg: "#ecfdf5",
  successBorder: "#a7f3d0",
  successText: "#047857",
  warningBg: "#fffbeb",
  warningBorder: "#fde68a",
  warningText: "#92400e",
  neutralBg: "#f1f5f9",
  neutralBorder: "#e2e8f0",
  neutralText: "#475569",
  overlay: "rgba(15,23,42,0.45)"
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  } catch {
    return iso;
  }
}

function stripHtml(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/* --------------------------------------------------------------- */

export default function PortalReleasesPage() {
  const [items, setItems] = useState<PortalRelease[]>([]);
  const [meta, setMeta] = useState<PortalReleaseMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [datePicked, setDatePicked] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);
  const [page, setPage] = useState(1);
  const limit = 20;
  const [activeId, setActiveId] = useState<string | null>(null);

  const fromIso = datePicked?.[0]?.format("YYYY-MM-DD") || undefined;
  const toIso = datePicked?.[1]?.format("YYYY-MM-DD") || undefined;

  const load = async () => {
    setLoading(true);
    try {
      const res = await portalReleaseService.list({
        page,
        limit,
        projectId,
        search: search || undefined,
        from: fromIso,
        to: toIso
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
  }, [page, projectId, fromIso, toIso]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const projectName = useMemo(() => {
    if (!projectId || !meta) return undefined;
    return meta.projects.find((pr) => pr.id === projectId)?.name;
  }, [projectId, meta]);

  const hasAnyFilter =
    !!search ||
    !!projectId ||
    !!fromIso ||
    !!toIso;

  const stats: PortalReleaseStats = meta?.stats || {
    total: 0,
    thisMonth: 0,
    distinctProjects: 0,
    withMilestone: 0,
    latestVersion: null,
    latestDate: null
  };

  return (
    <div style={{ height: "100vh", overflowY: "auto", backgroundColor: "#ffffff" }}>
      {/* Header */}
      <div
        className="saas-header-container portal-releases-header-container"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          backdropFilter: "blur(12px)",
          padding: "20px 40px 20px 40px",
          marginBottom: 0,
          backgroundColor: "#ffffff",
          borderBottom: "1px solid rgba(0, 0, 0, 0.05)"
        }}
      >
        <AntRow justify="space-between" align="middle" gutter={[16, 16]}>
          <Col flex="1 1 auto" style={{ minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap"
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      "linear-gradient(135deg, rgba(59, 130, 246, 0.18), rgba(37, 99, 235, 0.08))",
                    color: "#3b82f6"
                  }}
                >
                  <Rocket size={18} color="#3b82f6" />
                </div>
                <Title
                  level={4}
                  className="portal-releases-header-title"
                  style={{
                    margin: 0,
                    fontWeight: 800,
                    color: "var(--text-slate-900)",
                    letterSpacing: "-0.01em"
                  }}
                >
                  Releases
                </Title>
              </div>

              <Divider
                type="vertical"
                style={{
                  height: 20,
                  borderColor: "rgba(0, 0, 0, 0.08)",
                  margin: "0 12px"
                }}
              />

              <div>
                <Text
                  className="portal-releases-header-desc"
                  style={{
                    fontSize: 12,
                    color: "var(--text-slate-600)",
                    fontWeight: 600
                  }}
                >
                  What we've shipped — each release links back to the milestone
                  it ships under.
                </Text>
              </div>
            </div>
          </Col>
        </AntRow>
      </div>

      <div style={{ padding: "20px 40px 56px", maxWidth: 1280 }}>
        {/* Stats strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 10,
            marginBottom: 14
          }}
        >
          <StatCard
            icon={Rocket}
            label="Releases"
            value={String(stats.total)}
            tone="accent"
          />
          <StatCard
            icon={CalendarClock}
            label="This month"
            value={String(stats.thisMonth)}
            tone="success"
          />
          <StatCard
            icon={Folder}
            label="Across projects"
            value={String(stats.distinctProjects)}
            tone="purple"
          />
          <StatCard
            icon={Hash}
            label="Latest"
            value={stats.latestVersion || "—"}
            sub={stats.latestDate ? fmtDate(stats.latestDate) : undefined}
            tone="neutral"
          />
        </div>

        {/* Filter bar */}
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          projects={meta?.projects || []}
          projectId={projectId}
          onProjectChange={(v) => {
            setProjectId(v);
            setPage(1);
          }}
          datePicked={datePicked}
          onDateChange={(r) => {
            setDatePicked(r);
            setPage(1);
          }}
        />

        {/* Active filter chips */}
        {hasAnyFilter && (
          <ActiveFilterChips
            search={search}
            onClearSearch={() => setSearch("")}
            projectName={projectName}
            onClearProject={() => setProjectId(undefined)}
            datePicked={datePicked}
            onClearDateRange={() => setDatePicked(null)}
          />
        )}

        {/* Body */}
        {loading ? (
          <div
            style={{
              padding: 80,
              textAlign: "center",
              background: p.surfaceElevated,
              border: `1px solid ${p.border}`,
              borderRadius: 12
            }}
          >
            <ZukvoLoader size="md" />
          </div>
        ) : items.length === 0 ? (
          <div
            style={{
              padding: 64,
              textAlign: "center",
              background: p.surfaceElevated,
              border: `1px dashed ${p.border}`,
              borderRadius: 12
            }}
          >
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ color: p.textSubtle, fontSize: 13 }}>
                  {hasAnyFilter
                    ? "No releases match the current filters."
                    : "No releases published yet."}
                </span>
              }
            />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {items.map((r) => (
              <ReleaseCard
                key={r.id}
                release={r}
                onOpen={() => setActiveId(r.id)}
              />
            ))}
          </div>
        )}

        {meta && meta.total > limit && (
          <div
            style={{
              marginTop: 18,
              display: "flex",
              justifyContent: "flex-end"
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

        <style
          dangerouslySetInnerHTML={{
            __html: `
          .portal-releases-header-container,
          [data-theme='dark'] .portal-releases-header-container,
          [data-theme='dark'] .saas-header-container.portal-releases-header-container,
          .saas-header-container.portal-releases-header-container {
            background: #ffffff !important;
            border-bottom: 1px solid #e2e8f0 !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02) !important;
          }
          .portal-releases-header-title { color: #0f172a !important; }
          .portal-releases-header-desc { color: #475569 !important; }
        ` }}
        />
      </div>

      <ReleaseDetailDrawer
        id={activeId}
        onClose={() => setActiveId(null)}
      />
    </div>
  );
}

/* --------------------------------------------------------------- */

const TONES = {
  accent: { bg: p.accentBg, border: p.accentBorder, text: p.accentText },
  success: { bg: p.successBg, border: p.successBorder, text: p.successText },
  warning: { bg: p.warningBg, border: p.warningBorder, text: p.warningText },
  purple: { bg: p.purpleBg, border: p.purpleBorder, text: p.purpleText },
  neutral: {
    bg: p.neutralBg,
    border: p.neutralBorder,
    text: p.neutralText
  }
} as const;

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone = "neutral" }: {
    icon: any;
    label: string;
    value: string;
    sub?: string;
    tone?: keyof typeof TONES;
  }) {
  const t = TONES[tone];
  return (
    <div
      style={{
        padding: "10px 12px",
        background: p.surfaceElevated,
        border: `1px solid ${p.border}`,
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        gap: 10,
        height: 56
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: t.bg,
          color: t.text,
          border: `1px solid ${t.border}`,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0
        }}
      >
        <Icon size={15} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 10.5,
            color: p.textSubtle,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            lineHeight: 1.2
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: p.text,
            letterSpacing: "-0.01em",
            lineHeight: 1.25,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}
        >
          {value}
          {sub && (
            <span
              style={{
                marginLeft: 6,
                fontSize: 11,
                fontWeight: 500,
                color: p.textFaint
              }}
            >
              {sub}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- */

function FilterBar({
  search,
  onSearchChange,
  projects,
  projectId,
  onProjectChange,
  datePicked,
  onDateChange }: {
    search: string;
    onSearchChange: (v: string) => void;
    projects: { id: string; name: string }[];
    projectId: string | undefined;
    onProjectChange: (v: string | undefined) => void;
    datePicked: [Dayjs | null, Dayjs | null] | null;
    onDateChange: (r: [Dayjs | null, Dayjs | null] | null) => void;
  }) {
  const [searchFocused, setSearchFocused] = useState(false);
  const today = dayjs();
  const rangePresets: { label: string; value: [Dayjs, Dayjs] }[] = [
    { label: "Last 7 days", value: [today.subtract(6, "day"), today] },
    { label: "Last 30 days", value: [today.subtract(29, "day"), today] },
    {
      label: "This month",
      value: [today.startOf("month"), today.endOf("month")]
    },
    {
      label: "Last month",
      value: [
        today.subtract(1, "month").startOf("month"),
        today.subtract(1, "month").endOf("month"),
      ]
    },
    {
      label: "This quarter",
      value: [today.startOf("quarter" as any), today.endOf("quarter" as any)]
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        alignItems: "stretch",
        flexWrap: "wrap",
        marginBottom: 10
      }}
    >
      <div
        style={{
          flex: "1 1 280px",
          minWidth: 240,
          maxWidth: 480,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          height: 34,
          padding: "0 10px 0 12px",
          background: p.surface,
          border: `1px solid ${searchFocused ? p.indigo : p.border}`,
          borderRadius: 8,
          boxShadow: searchFocused
            ? "0 0 0 3px rgba(99, 102, 241, 0.12)"
            : "none",
          transition: "border-color 140ms ease, box-shadow 140ms ease"
        }}
      >
        <Search
          size={14}
          color={searchFocused ? p.indigo : p.textFaint}
          style={{ flexShrink: 0, transition: "color 140ms ease" }}
        />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          placeholder="Search title or version…"
          style={{
            flex: 1,
            minWidth: 0,
            height: "100%",
            border: "none",
            outline: "none",
            background: "transparent",
            color: p.text,
            fontSize: 13,
            fontWeight: 500
          }}
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            aria-label="Clear search"
            style={{
              flexShrink: 0,
              width: 18,
              height: 18,
              padding: 0,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: p.neutralBg,
              border: "none",
              borderRadius: 999,
              color: p.textSubtle,
              cursor: "pointer"
            }}
          >
            <X size={11} />
          </button>
        )}
      </div>

      <Select
        allowClear
        showSearch
        placeholder={
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: p.textSubtle,
              fontWeight: 500
            }}
          >
            <Folder size={13} color={p.textFaint} />
            {projects.length > 0
              ? `All projects · ${projects.length}`
              : "Projects"}
          </span>
        }
        suffixIcon={<Folder size={13} color={p.textFaint} />}
        value={projectId}
        onChange={(v) => onProjectChange(v)}
        optionFilterProp="label"
        style={{ width: 220, height: 34 }}
        options={projects.map((proj) => ({
          value: proj.id,
          label: proj.name
        }))}
        notFoundContent={
          <div style={{ padding: 8, fontSize: 12, color: p.textSubtle }}>
            No projects available
          </div>
        }
      />

      <RangePicker
        value={datePicked as any}
        onChange={(r) => onDateChange(r as any)}
        format="MMM D, YYYY"
        allowEmpty={[true, true]}
        placeholder={["From", "To"]}
        suffixIcon={<CalendarRange size={13} color={p.textFaint} />}
        separator={<span style={{ color: p.textFaint }}>→</span>}
        presets={rangePresets as any}
        style={{ height: 34 }}
      />
    </div>
  );
}

/* --------------------------------------------------------------- */

function ActiveFilterChips({
  search,
  onClearSearch,
  projectName,
  onClearProject,
  datePicked,
  onClearDateRange }: {
    search: string;
    onClearSearch: () => void;
    projectName: string | undefined;
    onClearProject: () => void;
    datePicked: [Dayjs | null, Dayjs | null] | null;
    onClearDateRange: () => void;
  }) {
  const hasDates = !!(datePicked && (datePicked[0] || datePicked[1]));
  const any = !!search || !!projectName || hasDates;
  if (!any) return null;

  const dateLabel = hasDates
    ? `${datePicked?.[0] ? datePicked[0].format("MMM D") : "Any"} → ${datePicked?.[1] ? datePicked[1].format("MMM D, YYYY") : "Any"
    }`
    : "";

  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        alignItems: "center",
        flexWrap: "wrap",
        marginBottom: 14
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: p.textSubtle,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          marginRight: 2
        }}
      >
        Active
      </span>
      {projectName && (
        <FilterChip
          icon={Folder}
          label={`Project: ${projectName}`}
          onClear={onClearProject}
        />
      )}
      {hasDates && (
        <FilterChip
          icon={CalendarRange}
          label={dateLabel}
          onClear={onClearDateRange}
        />
      )}
      {search && (
        <FilterChip
          icon={Search}
          label={`"${search}"`}
          onClear={onClearSearch}
        />
      )}
      <button
        type="button"
        onClick={() => {
          if (search) onClearSearch();
          if (projectName) onClearProject();
          if (hasDates) onClearDateRange();
        }}
        style={{
          marginLeft: 4,
          padding: "2px 8px",
          background: "transparent",
          border: "none",
          color: p.indigoText,
          fontSize: 11.5,
          fontWeight: 600,
          cursor: "pointer"
        }}
      >
        Clear all
      </button>
    </div>
  );
}

function FilterChip({
  icon: Icon,
  label,
  onClear }: {
    icon: any;
    label: string;
    onClear: () => void;
  }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 4px 3px 9px",
        background: p.indigoBg,
        border: `1px solid ${p.indigoBorder}`,
        color: p.indigoText,
        borderRadius: 999,
        fontSize: 11.5,
        fontWeight: 600
      }}
    >
      <Icon size={11} />
      {label}
      <button
        type="button"
        onClick={onClear}
        aria-label="Clear filter"
        style={{
          width: 16,
          height: 16,
          padding: 0,
          marginLeft: 2,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(99,102,241,0.15)",
          border: "none",
          borderRadius: 999,
          color: p.indigoText,
          cursor: "pointer"
        }}
      >
        <X size={9} />
      </button>
    </span>
  );
}

/* --------------------------------------------------------------- */

function ReleaseCard({
  release,
  onOpen }: {
    release: PortalRelease;
    onOpen: () => void;
  }) {
  const preview = stripHtml(release.description).slice(0, 220);

  return (
    <button
      onClick={onOpen}
      type="button"
      style={{
        textAlign: "left",
        background: p.surfaceElevated,
        border: `1px solid ${p.border}`,
        borderRadius: 14,
        padding: "16px 18px",
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        cursor: "pointer",
        font: "inherit",
        color: "inherit",
        transition: "border-color 120ms ease"
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = p.accentBorder;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = p.border;
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: p.accentBg,
          color: p.accentText,
          border: `1px solid ${p.accentBorder}`,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0
        }}
      >
        <Rocket size={17} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap"
          }}
        >
          <span
            style={{
              fontSize: 14.5,
              fontWeight: 600,
              color: p.text,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 480
            }}
          >
            {release.title}
          </span>
          {release.version && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "1px 8px",
                background: p.purpleBg,
                border: `1px solid ${p.purpleBorder}`,
                color: p.purpleText,
                borderRadius: 999,
                fontSize: 10.5,
                fontWeight: 600
              }}
            >
              <Tag size={10} />
              {release.version}
            </span>
          )}
          {release.milestone && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 11,
                color: p.textSubtle
              }}
            >
              <Flag size={11} />
              {release.milestone.name}
            </span>
          )}
          {release.project && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 11,
                color: p.textSubtle
              }}
            >
              <FolderKanban size={11} />
              {release.project.name}
            </span>
          )}
        </div>

        <div
          style={{
            marginTop: 6,
            fontSize: 11.5,
            color: p.textSubtle,
            display: "inline-flex",
            alignItems: "center",
            gap: 4
          }}
        >
          <Calendar size={11} />
          Released {fmtDate(release.releaseDate)}
        </div>

        {preview && (
          <div
            style={{
              marginTop: 10,
              fontSize: 13,
              color: p.textMuted,
              lineHeight: 1.55,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden"
            }}
          >
            {preview}
          </div>
        )}
      </div>

      <div
        style={{
          color: p.textFaint,
          display: "inline-flex",
          alignItems: "center",
          paddingTop: 4
        }}
      >
        <ChevronRight size={16} />
      </div>
    </button>
  );
}

/* --------------------------------------------------------------- */

function ReleaseDetailDrawer({
  id,
  onClose }: {
    id: string | null;
    onClose: () => void;
  }) {
  const [data, setData] = useState<PortalRelease | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) {
      setData(null);
      setNotFound(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    portalReleaseService
      .detail(id)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <Drawer
      open={!!id}
      onClose={onClose}
      width={760}
      title={null}
      closable={false}
      destroyOnClose
      styles={{
        mask: { backgroundColor: p.overlay },
        content: { background: p.surfaceElevated },
        header: { display: "none" },
        body: {
          padding: 0,
          background: p.surfaceElevated,
          display: "flex",
          flexDirection: "column"
        }
      }}
    >
      {/* Top bar */}
      <div
        style={{
          padding: "14px 22px",
          borderBottom: `1px solid ${p.border}`,
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexShrink: 0
        }}
      >
        <button
          onClick={onClose}
          type="button"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            background: "#ffffff",
            border: `1px solid ${p.border}`,
            borderRadius: 8,
            fontSize: 12.5,
            color: p.textMuted,
            cursor: "pointer",
            fontWeight: 500
          }}
        >
          <ArrowLeft size={14} />
          Close
        </button>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "22px 24px 28px"
        }}
      >
        {loading ? (
          <div
            style={{
              minHeight: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <ZukvoLoader size="md" />
          </div>
        ) : notFound || !data ? (
          <div
            style={{
              minHeight: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ color: p.textSubtle, fontSize: 13 }}>
                  Release not found.
                </span>
              }
            />
          </div>
        ) : (
          <ReleaseDetailBody data={data} />
        )}
      </div>
    </Drawer>
  );
}

function ReleaseDetailBody({ data }: { data: PortalRelease }) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: p.accentBg,
            color: p.accentText,
            border: `1px solid ${p.accentBorder}`,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}
        >
          <Rocket size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap"
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 800,
                color: p.text,
                letterSpacing: "-0.015em"
              }}
            >
              {data.title}
            </h1>
            {data.version && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "2px 10px",
                  background: p.purpleBg,
                  border: `1px solid ${p.purpleBorder}`,
                  color: p.purpleText,
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 600
                }}
              >
                <Tag size={11} />
                {data.version}
              </span>
            )}
          </div>
          <div
            style={{
              marginTop: 8,
              display: "flex",
              alignItems: "center",
              gap: 14,
              flexWrap: "wrap",
              fontSize: 12.5,
              color: p.textSubtle
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5
              }}
            >
              <Calendar size={12} />
              Released {fmtDate(data.releaseDate)}
            </span>
            {data.milestone && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5
                }}
              >
                <Flag size={12} />
                {data.milestone.name}
              </span>
            )}
            {data.project && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5
                }}
              >
                <FolderKanban size={12} />
                {data.project.name}
                {data.project.code ? ` · ${data.project.code}` : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 24,
          padding: "18px 20px",
          background: p.surfaceElevated,
          border: `1px solid ${p.border}`,
          borderRadius: 12
        }}
      >
        {data.description ? (
          <div
            className="portal-release-description"
            style={{
              fontSize: 13.5,
              color: p.textMuted,
              lineHeight: 1.65
            }}
            dangerouslySetInnerHTML={{ __html: data.description }}
          />
        ) : (
          <div style={{ fontSize: 13, color: p.textFaint }}>
            No description for this release.
          </div>
        )}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .portal-release-description img { max-width: 100%; height: auto; border-radius: 8px; }
        .portal-release-description p { margin: 0 0 10px 0; }
        .portal-release-description p:last-child { margin-bottom: 0; }
        .portal-release-description h1,
        .portal-release-description h2,
        .portal-release-description h3 {
          color: #0f172a; margin: 16px 0 8px 0; font-weight: 700;
        }
        .portal-release-description h1 { font-size: 17px; }
        .portal-release-description h2 { font-size: 15.5px; }
        .portal-release-description h3 { font-size: 14px; }
        .portal-release-description ul,
        .portal-release-description ol { padding-left: 22px; margin: 0 0 10px 0; }
        .portal-release-description li { margin: 3px 0; }
        .portal-release-description a { color: #1d4ed8; text-decoration: underline; }
        .portal-release-description code {
          background: #f8fafc; border: 1px solid #e5e7eb;
          padding: 1px 6px; border-radius: 4px; font-size: 12.5px;
        }
        .portal-release-description blockquote {
          margin: 10px 0; padding: 8px 14px;
          border-left: 3px solid #bfdbfe; background: #f8fafc;
          color: #475569; border-radius: 4px;
        }
      ` }}
      />
    </>
  );
}
