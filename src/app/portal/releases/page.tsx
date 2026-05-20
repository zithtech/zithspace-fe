"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Input, Empty, Spin, Pagination, Select, Row as AntRow, Col, Divider, Typography } from "antd";
import {
  Search,
  Rocket,
  ChevronRight,
  Calendar,
  Sparkles,
  Bug,
  Wrench,
  AlertTriangle,
  Database,
  Eye,
  Hash,
} from "lucide-react";
import {
  portalReleaseService,
  PortalReleaseListItem,
  PortalReleaseMeta,
} from "@/services/portalReleaseService";

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
  purpleBg: "#f5f3ff",
  purpleBorder: "#ddd6fe",
  purpleText: "#6d28d9",
  neutralBg: "#f1f5f9",
  neutralBorder: "#e2e8f0",
  neutralText: "#475569",
};

const ENV_META: Record<string, { bg: string; border: string; text: string }> = {
  PROD: { bg: p.successBg, border: p.successBorder, text: p.successText },
  PRODUCTION: { bg: p.successBg, border: p.successBorder, text: p.successText },
  STAGING: { bg: p.warningBg, border: p.warningBorder, text: p.warningText },
  STAGE: { bg: p.warningBg, border: p.warningBorder, text: p.warningText },
  DEV: { bg: p.purpleBg, border: p.purpleBorder, text: p.purpleText },
  UAT: { bg: p.accentBg, border: p.accentBorder, text: p.accentText },
};
function envTone(env: string | null) {
  if (!env) return { bg: p.neutralBg, border: p.neutralBorder, text: p.neutralText };
  return (
    ENV_META[env.toUpperCase()] || {
      bg: p.neutralBg,
      border: p.neutralBorder,
      text: p.neutralText,
    }
  );
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

/* --------------------------------------------------------------- */

export default function PortalReleasesPage() {
  const [items, setItems] = useState<PortalReleaseListItem[]>([]);
  const [meta, setMeta] = useState<PortalReleaseMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [environment, setEnvironment] = useState<string>("ALL");
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const load = async () => {
    setLoading(true);
    try {
      const res = await portalReleaseService.list({
        page,
        limit,
        environment: environment === "ALL" ? undefined : environment,
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
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, environment, projectId]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#ffffff" }}>
      {/* Workstation Header */}
      <div
        className="saas-header-container portal-mom-header-container"
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
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
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
                    color: "#3b82f6",
                  }}
                >
                  <Rocket size={18} color="#3b82f6" />
                </div>
                <Title
                  level={4}
                  className="portal-mom-header-title"
                  style={{
                    margin: 0,
                    fontWeight: 800,
                    color: "var(--text-slate-900)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Release notes
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
                  className="portal-mom-header-desc"
                  style={{
                    fontSize: 12,
                    color: "var(--text-slate-600)",
                    fontWeight: 600,
                  }}
                >
                  What we've shipped — new features, fixes, breaking changes, and known issues across each release.
                </Text>
              </div>
            </div>
          </Col>
        </AntRow>
      </div>

      <div style={{ padding: "32px 40px 56px", maxWidth: 1100 }}>

      {/* Filter row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <FilterPill
            label="All environments"
            active={environment === "ALL"}
            onClick={() => {
              setEnvironment("ALL");
              setPage(1);
            }}
          />
          {(meta?.environments || []).map((env) => (
            <FilterPill
              key={env}
              label={env}
              active={environment === env}
              onClick={() => {
                setEnvironment(env);
                setPage(1);
              }}
            />
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {meta && meta.projects.length > 1 && (
            <Select
              allowClear
              placeholder="All projects"
              style={{ width: 200 }}
              value={projectId}
              onChange={(v) => {
                setProjectId(v);
                setPage(1);
              }}
              options={meta.projects.map((p) => ({
                value: p.id,
                label: p.name,
              }))}
            />
          )}
          <Input
            allowClear
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            prefix={<Search size={14} color={p.textFaint} />}
            placeholder="Search version or title…"
            style={{ width: 260 }}
          />
        </div>
      </div>

      {/* Body — vertical timeline of release cards */}
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
                {search
                  ? `No releases match "${search}".`
                  : "No client-visible releases published yet."}
              </span>
            }
          />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map((r) => (
            <ReleaseCard key={r.id} release={r} />
          ))}
        </div>
      )}

      {meta && meta.total > limit && (
        <div
          style={{
            marginTop: 18,
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
      <style jsx global>{`
          .portal-mom-header-container,
          [data-theme='dark'] .portal-mom-header-container,
          [data-theme='dark'] .saas-header-container.portal-mom-header-container,
          .saas-header-container.portal-mom-header-container {
            background: #ffffff !important;
            border-bottom: 1px solid #e2e8f0 !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02) !important;
          }
          .portal-mom-header-title {
            color: #0f172a !important;
          }
          .portal-mom-header-desc {
            color: #475569 !important;
          }
          
          /* Form Inputs, Select elements styling overrides */
          .ant-input, .ant-select-selector, .ant-input-affix-wrapper, .ant-input-textarea, textarea.ant-input {
            background-color: #ffffff !important;
            color: #0f172a !important;
            border-color: #cbd5e1 !important;
          }
          .ant-input::placeholder, .ant-select-selection-placeholder {
            color: #94a3b8 !important;
          }
          .ant-select-selection-item {
            color: #0f172a !important;
          }
          .ant-input-affix-wrapper .ant-input {
            background-color: transparent !important;
            color: #0f172a !important;
          }
          .ant-input-affix-wrapper:hover, .ant-input:hover, .ant-select-selector:hover {
            border-color: #cbd5e1 !important;
          }
          .ant-input-affix-wrapper-focused, .ant-input-focused, .ant-select-focused .ant-select-selector {
            border-color: #4f46e5 !important;
            box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1) !important;
          }
          .ant-select-arrow {
            color: #94a3b8 !important;
          }
          
          /* Empty state SVG path overrides to force light colors */
          .ant-empty-img-simple path,
          .ant-empty-image svg path,
          .ant-empty-image path {
            fill: #f8fafc !important;
            stroke: #cbd5e1 !important;
          }
          .ant-empty-img-simple ellipse,
          .ant-empty-image svg ellipse,
          .ant-empty-image ellipse {
            fill: #e2e8f0 !important;
            stroke: #cbd5e1 !important;
          }
          .ant-empty-img-simple g,
          .ant-empty-image svg g,
          .ant-empty-image g {
            stroke: #cbd5e1 !important;
          }
          
          /* Target specific nested elements inside simple image for fine tuning */
          .ant-empty-img-simple [fill="#434343"],
          .ant-empty-image [fill="#434343"],
          .ant-empty-img-simple [fill="#1f1f1f"],
          .ant-empty-image [fill="#1f1f1f"] {
            fill: #f1f5f9 !important;
          }
          .ant-empty-img-simple [stroke="#434343"],
          .ant-empty-image [stroke="#434343"] {
            stroke: #cbd5e1 !important;
          }
      `}</style>
    </div>
    </div>
  );
}

/* --------------------------------------------------------------- */

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "7px 12px",
        background: active ? "#4f46e5" : p.surfaceElevated,
        color: active ? "#ffffff" : p.textMuted,
        border: `1px solid ${active ? "#4f46e5" : p.border}`,
        borderRadius: 999,
        fontSize: 12.5,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function CountChip({
  count,
  label,
  icon: Icon,
  tone,
}: {
  count: number;
  label: string;
  icon: any;
  tone: { bg: string; border: string; text: string };
}) {
  if (count === 0) return null;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        background: tone.bg,
        border: `1px solid ${tone.border}`,
        color: tone.text,
        borderRadius: 999,
        fontSize: 11.5,
        fontWeight: 500,
      }}
    >
      <Icon size={11} />
      {count} {label}
    </span>
  );
}

function ReleaseCard({ release }: { release: PortalReleaseListItem }) {
  const [hover, setHover] = useState(false);
  const env = envTone(release.environment);

  return (
    <Link
      href={`/portal/releases/${release.id}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: 22,
        background: p.surfaceElevated,
        border: `1px solid ${hover ? p.borderStrong : p.border}`,
        borderRadius: 14,
        textDecoration: "none",
        color: "inherit",
        transition: "border-color 120ms ease",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          alignItems: "flex-start",
        }}
      >
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", minWidth: 0 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: env.bg,
              border: `1px solid ${env.border}`,
              color: env.text,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Rocket size={18} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: p.textSubtle,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {release.project.name}
              {release.project.code ? ` · ${release.project.code}` : ""}
            </div>
            <div
              style={{
                marginTop: 4,
                display: "flex",
                alignItems: "baseline",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: 17,
                  fontWeight: 600,
                  color: p.text,
                  letterSpacing: "-0.02em",
                }}
              >
                {release.version}
              </span>
              {release.title && (
                <span style={{ fontSize: 14, color: p.textMuted }}>
                  {release.title}
                </span>
              )}
            </div>
            <div
              style={{
                marginTop: 6,
                display: "flex",
                gap: 10,
                alignItems: "center",
                flexWrap: "wrap",
                fontSize: 12,
                color: p.textSubtle,
              }}
            >
              {release.environment && (
                <span
                  style={{
                    padding: "1px 8px",
                    background: env.bg,
                    border: `1px solid ${env.border}`,
                    color: env.text,
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.02em",
                  }}
                >
                  {release.environment}
                </span>
              )}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Calendar size={11} />
                {fmtDate(release.releaseDate || release.createdAt)}
              </span>
            </div>
          </div>
        </div>
        <ChevronRight size={16} color={p.textFaint} />
      </div>

      {release.summaryPreview && (
        <div
          style={{
            fontSize: 13,
            color: p.textMuted,
            lineHeight: 1.55,
            whiteSpace: "pre-line",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            paddingLeft: 58,
          }}
        >
          {release.summaryPreview}
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          paddingLeft: 58,
        }}
      >
        <CountChip
          count={release.counts.newFeatures}
          label="new"
          icon={Sparkles}
          tone={{ bg: p.purpleBg, border: p.purpleBorder, text: p.purpleText }}
        />
        <CountChip
          count={release.counts.improvements}
          label="improvements"
          icon={Wrench}
          tone={{ bg: p.accentBg, border: p.accentBorder, text: p.accentText }}
        />
        <CountChip
          count={release.counts.bugFixes}
          label="fixes"
          icon={Bug}
          tone={{ bg: p.successBg, border: p.successBorder, text: p.successText }}
        />
        <CountChip
          count={release.counts.breakingChanges}
          label="breaking"
          icon={AlertTriangle}
          tone={{ bg: p.dangerBg, border: p.dangerBorder, text: p.dangerText }}
        />
        <CountChip
          count={release.counts.databaseChanges}
          label="DB"
          icon={Database}
          tone={{ bg: p.warningBg, border: p.warningBorder, text: p.warningText }}
        />
        <CountChip
          count={release.counts.knownIssues}
          label="known issues"
          icon={Eye}
          tone={{ bg: p.warningBg, border: p.warningBorder, text: p.warningText }}
        />
        {release.linkedTicketCount > 0 && (
          <CountChip
            count={release.linkedTicketCount}
            label="tickets"
            icon={Hash}
            tone={{ bg: p.neutralBg, border: p.neutralBorder, text: p.neutralText }}
          />
        )}
      </div>
    </Link>
  );
}
