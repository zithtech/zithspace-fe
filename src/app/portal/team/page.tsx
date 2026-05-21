"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Empty,
  Spin,
  Select,
  Row as AntRow,
  Col,
  Divider,
  Typography,
} from "antd";
import {
  Users,
  Mail,
  Phone,
  Crown,
  Search,
  Briefcase,
  Folder,
  X,
  SlidersHorizontal,
  UserCheck,
  Activity,
  Hash,
  Wifi,
} from "lucide-react";
import {
  portalTeamService,
  PortalTeamMember,
} from "@/services/portalTeamService";

const { Title, Text } = Typography;

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
  { label: string; dot: string; text: string }
> = {
  available: { label: "Available", dot: "#10b981", text: p.successText },
  limited: { label: "Limited capacity", dot: "#f59e0b", text: p.warningText },
  away: { label: "Away", dot: "#94a3b8", text: p.textSubtle },
  unavailable: { label: "Unavailable", dot: "#ef4444", text: p.dangerText },
};

function initials(name: string): string {
  return (name || "?")
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/* --------------------------------------------------------------- */

export default function PortalTeamPage() {
  const [items, setItems] = useState<PortalTeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [discipline, setDiscipline] = useState<string>("ALL");
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [availability, setAvailability] = useState<string | undefined>(
    undefined,
  );
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const data = await portalTeamService.list();
        if (!cancel) setItems(data || []);
      } catch {
        if (!cancel) setItems([]);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const projects = useMemo(() => {
    const seen = new Map<string, { id: string; name: string }>();
    for (const m of items) {
      if (m.projectId && m.projectName && !seen.has(m.projectId)) {
        seen.set(m.projectId, { id: m.projectId, name: m.projectName });
      }
    }
    return Array.from(seen.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [items]);

  const disciplineCounts = useMemo(() => {
    const c: Record<string, number> = { ALL: items.length };
    for (const m of items) {
      const key = m.discipline || "other";
      c[key] = (c[key] || 0) + 1;
    }
    return c;
  }, [items]);

  // Tabs are derived from disciplines that actually appear
  const disciplineTabs = useMemo(() => {
    const present = new Set<string>();
    for (const m of items) present.add(m.discipline || "other");
    const ordered = [
      "engineering",
      "design",
      "qa",
      "pm",
      "account",
      "devops",
      "data",
      "support",
      "other",
    ].filter((k) => present.has(k));
    return [{ key: "ALL", label: "All" }, ...ordered.map((k) => ({
      key: k,
      label: DISCIPLINE_META[k]?.label || k,
    }))];
  }, [items]);

  const filteredAll = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((m) => {
      if (discipline !== "ALL" && (m.discipline || "other") !== discipline)
        return false;
      if (projectId && m.projectId !== projectId) return false;
      if (availability && m.availabilityStatus !== availability) return false;
      if (q) {
        const haystack = `${m.displayName} ${m.roleLabel} ${
          m.contactEmail || ""
        } ${m.bio || ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [items, discipline, projectId, availability, search]);

  const stats = useMemo(() => {
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
  }, [items]);

  const hasAnyFilter =
    discipline !== "ALL" || !!projectId || !!availability || !!search;

  // When no filters active, split into Primary / Wider team
  const primaries = filteredAll.filter((m) => m.isPrimaryContact);
  const others = filteredAll.filter((m) => !m.isPrimaryContact);

  const projectName = projects.find((pr) => pr.id === projectId)?.name;
  const disciplineLabel =
    discipline !== "ALL"
      ? DISCIPLINE_META[discipline]?.label || discipline
      : undefined;
  const availabilityLabel = availability
    ? AVAILABILITY_META[availability]?.label || availability
    : undefined;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#ffffff" }}>
      {/* Sticky Header */}
      <div
        className="saas-header-container portal-team-header-container"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          backdropFilter: "blur(12px)",
          padding: "20px 40px 20px 40px",
          marginBottom: 0,
          backgroundColor: "#ffffff",
          borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
        }}
      >
        <AntRow justify="space-between" align="middle" gutter={[16, 16]}>
          <Col flex="1 1 auto" style={{ minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: 8 }}
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
                    color: "#3b82f6",
                  }}
                >
                  <Users size={18} color="#3b82f6" />
                </div>
                <Title
                  level={4}
                  className="portal-team-header-title"
                  style={{
                    margin: 0,
                    fontWeight: 800,
                    color: "var(--text-slate-900)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Your team
                </Title>
              </div>

              <Divider
                type="vertical"
                style={{
                  height: 20,
                  borderColor: "rgba(0, 0, 0, 0.08)",
                  margin: "0 12px",
                }}
              />

              <div>
                <Text
                  className="portal-team-header-desc"
                  style={{
                    fontSize: 12,
                    color: "var(--text-slate-600)",
                    fontWeight: 600,
                  }}
                >
                  The people working on your account — who to contact for what,
                  and when they're available.
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
            marginBottom: 14,
          }}
        >
          <StatCard
            icon={Users}
            label="Team members"
            value={String(stats.total)}
            tone="accent"
          />
          <StatCard
            icon={Crown}
            label="Primary contacts"
            value={String(stats.primaries)}
            tone="warning"
          />
          <StatCard
            icon={Wifi}
            label="Available now"
            value={String(stats.available)}
            tone="success"
          />
          <StatCard
            icon={Hash}
            label="Disciplines"
            value={String(stats.disciplines)}
            tone="purple"
          />
        </div>

        {/* Discipline tabs */}
        {items.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              marginBottom: 10,
            }}
          >
            {disciplineTabs.map((tab) => {
              const active = discipline === tab.key;
              const count = disciplineCounts[tab.key];
              return (
                <button
                  key={tab.key}
                  onClick={() => setDiscipline(tab.key)}
                  type="button"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 11px",
                    background: active ? p.indigo : p.surfaceElevated,
                    color: active ? "#ffffff" : p.textMuted,
                    border: `1px solid ${active ? p.indigo : p.border}`,
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 120ms ease",
                  }}
                >
                  {tab.label}
                  {count != null && count > 0 && (
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: "0 6px",
                        borderRadius: 999,
                        background: active
                          ? "rgba(255,255,255,0.18)"
                          : p.neutralBg,
                        color: active ? "#ffffff" : p.textSubtle,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Filter bar */}
        {items.length > 0 && (
          <FilterBar
            search={search}
            onSearchChange={setSearch}
            projects={projects}
            projectId={projectId}
            onProjectChange={setProjectId}
            availability={availability}
            onAvailabilityChange={setAvailability}
          />
        )}

        {/* Active filter chips */}
        {hasAnyFilter && (
          <ActiveFilterChips
            search={search}
            onClearSearch={() => setSearch("")}
            projectName={projectName}
            onClearProject={() => setProjectId(undefined)}
            availabilityLabel={availabilityLabel}
            onClearAvailability={() => setAvailability(undefined)}
            disciplineLabel={disciplineLabel}
            onClearDiscipline={() => setDiscipline("ALL")}
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
              borderRadius: 12,
            }}
          >
            <Spin />
          </div>
        ) : items.length === 0 ? (
          <div
            style={{
              padding: 64,
              textAlign: "center",
              background: p.surfaceElevated,
              border: `1px dashed ${p.border}`,
              borderRadius: 12,
            }}
          >
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ color: p.textSubtle, fontSize: 13 }}>
                  No team members published yet. Your account manager will add
                  them soon.
                </span>
              }
            />
          </div>
        ) : filteredAll.length === 0 ? (
          <div
            style={{
              padding: 48,
              textAlign: "center",
              background: p.surfaceElevated,
              border: `1px dashed ${p.border}`,
              borderRadius: 12,
              color: p.textSubtle,
              fontSize: 13,
            }}
          >
            No team members match the current filters.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {!hasAnyFilter && primaries.length > 0 && (
              <Section
                icon={Crown}
                title="Primary contacts"
                subtitle="Your go-to people"
                count={primaries.length}
              >
                <Grid>
                  {primaries.map((m) => (
                    <TeamCard key={m.id} m={m} primary />
                  ))}
                </Grid>
              </Section>
            )}
            {!hasAnyFilter && others.length > 0 && (
              <Section
                icon={UserCheck}
                title={primaries.length > 0 ? "Wider team" : "Team members"}
                count={others.length}
              >
                <Grid>
                  {others.map((m) => (
                    <TeamCard key={m.id} m={m} />
                  ))}
                </Grid>
              </Section>
            )}
            {hasAnyFilter && (
              <Section
                icon={UserCheck}
                title="Matching team members"
                count={filteredAll.length}
              >
                <Grid>
                  {filteredAll.map((m) => (
                    <TeamCard
                      key={m.id}
                      m={m}
                      primary={m.isPrimaryContact}
                    />
                  ))}
                </Grid>
              </Section>
            )}
          </div>
        )}

        <style
          dangerouslySetInnerHTML={{
            __html: `
          .portal-team-header-container,
          [data-theme='dark'] .portal-team-header-container,
          [data-theme='dark'] .saas-header-container.portal-team-header-container,
          .saas-header-container.portal-team-header-container {
            background: #ffffff !important;
            border-bottom: 1px solid #e2e8f0 !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02) !important;
          }
          .portal-team-header-title { color: #0f172a !important; }
          .portal-team-header-desc { color: #475569 !important; }
        `,
          }}
        />
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- */

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: any;
  label: string;
  value: string;
  tone?: keyof typeof TONE;
}) {
  const t = TONE[tone];
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
        height: 56,
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
          flexShrink: 0,
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
            lineHeight: 1.2,
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
            whiteSpace: "nowrap",
          }}
        >
          {value}
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
  availability,
  onAvailabilityChange,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  projects: { id: string; name: string }[];
  projectId: string | undefined;
  onProjectChange: (v: string | undefined) => void;
  availability: string | undefined;
  onAvailabilityChange: (v: string | undefined) => void;
}) {
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        alignItems: "stretch",
        flexWrap: "wrap",
        marginBottom: 10,
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
          transition: "border-color 140ms ease, box-shadow 140ms ease",
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
          placeholder="Search name, role, email…"
          style={{
            flex: 1,
            minWidth: 0,
            height: "100%",
            border: "none",
            outline: "none",
            background: "transparent",
            color: p.text,
            fontSize: 13,
            fontWeight: 500,
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
              cursor: "pointer",
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
              fontWeight: 500,
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
          label: proj.name,
        }))}
        notFoundContent={
          <div style={{ padding: 8, fontSize: 12, color: p.textSubtle }}>
            No projects available
          </div>
        }
      />

      <Select
        allowClear
        placeholder={
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: p.textSubtle,
              fontWeight: 500,
            }}
          >
            <Activity size={13} color={p.textFaint} />
            All availability
          </span>
        }
        suffixIcon={<Activity size={13} color={p.textFaint} />}
        value={availability}
        onChange={(v) => onAvailabilityChange(v)}
        style={{ width: 200, height: 34 }}
        options={Object.entries(AVAILABILITY_META).map(([key, meta]) => ({
          value: key,
          label: meta.label,
        }))}
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
  availabilityLabel,
  onClearAvailability,
  disciplineLabel,
  onClearDiscipline,
}: {
  search: string;
  onClearSearch: () => void;
  projectName: string | undefined;
  onClearProject: () => void;
  availabilityLabel: string | undefined;
  onClearAvailability: () => void;
  disciplineLabel: string | undefined;
  onClearDiscipline: () => void;
}) {
  const any =
    !!search || !!projectName || !!availabilityLabel || !!disciplineLabel;
  if (!any) return null;

  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        alignItems: "center",
        flexWrap: "wrap",
        marginBottom: 14,
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontSize: 11,
          fontWeight: 700,
          color: p.textSubtle,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          marginRight: 2,
        }}
      >
        <SlidersHorizontal size={11} />
        Active
      </span>
      {disciplineLabel && (
        <FilterChip
          icon={Activity}
          label={`Discipline: ${disciplineLabel}`}
          onClear={onClearDiscipline}
        />
      )}
      {projectName && (
        <FilterChip
          icon={Folder}
          label={`Project: ${projectName}`}
          onClear={onClearProject}
        />
      )}
      {availabilityLabel && (
        <FilterChip
          icon={Wifi}
          label={`Availability: ${availabilityLabel}`}
          onClear={onClearAvailability}
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
          if (availabilityLabel) onClearAvailability();
          if (disciplineLabel) onClearDiscipline();
        }}
        style={{
          marginLeft: 4,
          padding: "2px 8px",
          background: "transparent",
          border: "none",
          color: p.indigoText,
          fontSize: 11.5,
          fontWeight: 600,
          cursor: "pointer",
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
  onClear,
}: {
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
        fontWeight: 600,
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
          cursor: "pointer",
        }}
      >
        <X size={9} />
      </button>
    </span>
  );
}

/* --------------------------------------------------------------- */

function Section({
  icon: Icon,
  title,
  subtitle,
  count,
  children,
}: {
  icon?: any;
  title: string;
  subtitle?: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          marginBottom: 10,
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        {Icon && <Icon size={14} color={p.textSubtle} />}
        <h2
          style={{
            margin: 0,
            fontSize: 13.5,
            fontWeight: 600,
            color: p.text,
            letterSpacing: "-0.005em",
          }}
        >
          {title}
        </h2>
        {count != null && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "1px 7px",
              borderRadius: 999,
              background: p.neutralBg,
              color: p.textSubtle,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {count}
          </span>
        )}
        {subtitle && (
          <span style={{ fontSize: 12, color: p.textSubtle }}>{subtitle}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: 12,
      }}
    >
      {children}
    </div>
  );
}

function TeamCard({
  m,
  primary,
}: {
  m: PortalTeamMember;
  primary?: boolean;
}) {
  const [hover, setHover] = useState(false);
  const disc = m.discipline ? DISCIPLINE_META[m.discipline] : null;
  const avail =
    AVAILABILITY_META[m.availabilityStatus] || AVAILABILITY_META.available;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: p.surfaceElevated,
        border: `1px solid ${
          primary ? p.warningBorder : hover ? p.borderStrong : p.border
        }`,
        borderRadius: 14,
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        transition: "border-color 120ms ease",
      }}
    >
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <Avatar m={m} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              display: "flex",
              gap: 6,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: p.text,
                lineHeight: 1.25,
                letterSpacing: "-0.005em",
              }}
            >
              {m.displayName}
            </div>
            {primary && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  padding: "1px 7px",
                  background: p.warningBg,
                  border: `1px solid ${p.warningBorder}`,
                  color: p.warningText,
                  borderRadius: 999,
                  fontSize: 10.5,
                  fontWeight: 600,
                }}
              >
                <Crown size={10} />
                Primary
              </span>
            )}
          </div>
          <div
            style={{
              marginTop: 3,
              fontSize: 12.5,
              color: p.textMuted,
              lineHeight: 1.4,
            }}
          >
            {m.roleLabel}
          </div>
          {disc && (
            <div style={{ marginTop: 6 }}>
              <span
                style={{
                  padding: "1px 8px",
                  background: TONE[disc.tone].bg,
                  border: `1px solid ${TONE[disc.tone].border}`,
                  color: TONE[disc.tone].text,
                  borderRadius: 999,
                  fontSize: 10.5,
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {disc.label}
              </span>
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 5,
          fontSize: 12.5,
          color: p.textMuted,
        }}
      >
        {m.contactEmail && (
          <a
            href={`mailto:${m.contactEmail}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: p.accentText,
              textDecoration: "none",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <Mail size={11} color={p.textSubtle} />
            {m.contactEmail}
          </a>
        )}
        {m.contactPhone && (
          <a
            href={`tel:${m.contactPhone}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: p.accentText,
              textDecoration: "none",
            }}
          >
            <Phone size={11} color={p.textSubtle} />
            {m.contactPhone}
          </a>
        )}
        {m.projectName && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Briefcase size={11} color={p.textSubtle} />
            <span>{m.projectName}</span>
          </div>
        )}
      </div>

      {m.bio && (
        <div
          style={{
            fontSize: 12.5,
            color: p.textSubtle,
            lineHeight: 1.55,
            padding: "10px 12px",
            background: p.surfaceMuted,
            border: `1px solid ${p.border}`,
            borderRadius: 8,
          }}
        >
          {m.bio}
        </div>
      )}

      <div
        style={{
          marginTop: "auto",
          paddingTop: 10,
          borderTop: `1px solid ${p.border}`,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: avail.dot,
            display: "inline-block",
          }}
        />
        <span
          style={{
            fontSize: 11.5,
            color: avail.text,
            fontWeight: 500,
          }}
        >
          {avail.label}
        </span>
        {m.availabilityNote && (
          <span style={{ fontSize: 11.5, color: p.textFaint }}>
            · {m.availabilityNote}
          </span>
        )}
      </div>
    </div>
  );
}

function Avatar({ m }: { m: PortalTeamMember }) {
  const size = 46;
  if (m.avatarUrl) {
    return (
      <img
        src={m.avatarUrl}
        alt=""
        style={{
          width: size,
          height: size,
          borderRadius: size / 4,
          objectFit: "cover",
          border: `1px solid ${p.border}`,
          flexShrink: 0,
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 4,
        background: p.accentBg,
        border: `1px solid ${p.accentBorder}`,
        color: p.accentText,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 15,
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {initials(m.displayName)}
    </div>
  );
}
