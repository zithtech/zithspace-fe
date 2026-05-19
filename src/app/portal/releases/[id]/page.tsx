"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Spin, Empty } from "antd";
import {
  ArrowLeft,
  Rocket,
  Calendar,
  Sparkles,
  Wrench,
  Bug,
  AlertTriangle,
  Database,
  Eye,
  Lightbulb,
  Code2,
  Hash,
  GitPullRequest,
  GitBranch,
} from "lucide-react";
import {
  portalReleaseService,
  PortalReleaseDetail,
} from "@/services/portalReleaseService";

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

interface SectionConfig {
  key: keyof PortalReleaseDetail["sections"];
  label: string;
  icon: any;
  tone: { bg: string; border: string; text: string };
}

const SECTIONS: SectionConfig[] = [
  {
    key: "newFeatures",
    label: "New features",
    icon: Sparkles,
    tone: { bg: p.purpleBg, border: p.purpleBorder, text: p.purpleText },
  },
  {
    key: "improvements",
    label: "Improvements",
    icon: Wrench,
    tone: { bg: p.accentBg, border: p.accentBorder, text: p.accentText },
  },
  {
    key: "bugFixes",
    label: "Bug fixes",
    icon: Bug,
    tone: { bg: p.successBg, border: p.successBorder, text: p.successText },
  },
  {
    key: "breakingChanges",
    label: "Breaking changes",
    icon: AlertTriangle,
    tone: { bg: p.dangerBg, border: p.dangerBorder, text: p.dangerText },
  },
  {
    key: "apiChanges",
    label: "API changes",
    icon: Code2,
    tone: { bg: p.accentBg, border: p.accentBorder, text: p.accentText },
  },
  {
    key: "databaseChanges",
    label: "Database changes",
    icon: Database,
    tone: { bg: p.warningBg, border: p.warningBorder, text: p.warningText },
  },
  {
    key: "knownIssues",
    label: "Known issues",
    icon: Eye,
    tone: { bg: p.warningBg, border: p.warningBorder, text: p.warningText },
  },
];

/* --------------------------------------------------------------- */

export default function PortalReleaseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [release, setRelease] = useState<PortalReleaseDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancel = false;
    (async () => {
      setLoading(true);
      try {
        const data = await portalReleaseService.detail(id);
        if (!cancel) setRelease(data);
      } catch {
        if (!cancel) setRelease(null);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!release) {
    return (
      <div style={{ padding: 48 }}>
        <Empty description="Release not found" />
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button
            onClick={() => router.push("/portal/releases")}
            style={{
              padding: "8px 14px",
              background: p.text,
              color: "#ffffff",
              border: `1px solid ${p.text}`,
              borderRadius: 8,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Back to releases
          </button>
        </div>
      </div>
    );
  }

  const env = envTone(release.environment);
  const hasAnyDetail =
    release.sections.summary.length > 0 ||
    release.sections.keyInsights.length > 0 ||
    SECTIONS.some((s) => release.sections[s.key].length > 0);

  return (
    <div style={{ padding: "32px 40px 56px", maxWidth: 980 }}>
      {/* Back */}
      <button
        type="button"
        onClick={() => router.push("/portal/releases")}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 8px",
          background: "transparent",
          border: "none",
          color: p.textMuted,
          fontSize: 13,
          cursor: "pointer",
          marginBottom: 14,
        }}
      >
        <ArrowLeft size={14} />
        Back to releases
      </button>

      {/* Header */}
      <div
        style={{
          padding: 26,
          background: p.surfaceElevated,
          border: `1px solid ${p.border}`,
          borderRadius: 14,
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: 11,
              background: env.bg,
              border: `1px solid ${env.border}`,
              color: env.text,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Rocket size={22} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: p.textSubtle,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {release.project.name}
              {release.project.code ? ` · ${release.project.code}` : ""}
            </div>
            <div
              style={{
                marginTop: 4,
                display: "flex",
                gap: 12,
                alignItems: "baseline",
                flexWrap: "wrap",
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: 26,
                  fontWeight: 600,
                  color: p.text,
                  letterSpacing: "-0.02em",
                }}
              >
                {release.version}
              </h1>
              {release.title && (
                <span
                  style={{
                    fontSize: 16,
                    color: p.textMuted,
                    fontWeight: 500,
                  }}
                >
                  {release.title}
                </span>
              )}
            </div>
            <div
              style={{
                marginTop: 10,
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              {release.environment && (
                <span
                  style={{
                    padding: "3px 10px",
                    background: env.bg,
                    border: `1px solid ${env.border}`,
                    color: env.text,
                    borderRadius: 999,
                    fontSize: 11.5,
                    fontWeight: 600,
                    letterSpacing: "0.02em",
                  }}
                >
                  {release.environment}
                </span>
              )}
              <span
                style={{
                  fontSize: 12.5,
                  color: p.textSubtle,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Calendar size={12} />
                Released {fmtDate(release.releaseDate || release.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {!hasAnyDetail ? (
        <div
          style={{
            padding: 56,
            textAlign: "center",
            background: p.surfaceElevated,
            border: `1px dashed ${p.border}`,
            borderRadius: 12,
            color: p.textSubtle,
            fontSize: 13,
          }}
        >
          No detail captured for this release.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 280px", gap: 16, alignItems: "flex-start" }}>
          {/* Left: sections */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {release.sections.summary.length > 0 && (
              <SectionCard
                label="Summary"
                icon={Lightbulb}
                tone={{ bg: p.accentBg, border: p.accentBorder, text: p.accentText }}
                paragraphs={release.sections.summary}
                prominent
              />
            )}
            {release.sections.keyInsights.length > 0 && (
              <SectionCard
                label="Key insights"
                icon={Sparkles}
                tone={{ bg: p.purpleBg, border: p.purpleBorder, text: p.purpleText }}
                paragraphs={release.sections.keyInsights}
              />
            )}
            {SECTIONS.map((s) => {
              const paragraphs = release.sections[s.key];
              if (paragraphs.length === 0) return null;
              return (
                <SectionCard
                  key={s.key}
                  label={s.label}
                  icon={s.icon}
                  tone={s.tone}
                  paragraphs={paragraphs}
                />
              );
            })}
          </div>

          {/* Right: linked stuff */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {release.linkedTickets.length > 0 && (
              <SideCard title="Linked tickets" icon={Hash}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {release.linkedTickets.map((t) => (
                    <span
                      key={t}
                      style={{
                        fontFamily:
                          "ui-monospace, SFMono-Regular, Menlo, monospace",
                        fontSize: 11.5,
                        padding: "2px 8px",
                        background: p.surfaceMuted,
                        border: `1px solid ${p.border}`,
                        color: p.textMuted,
                        borderRadius: 6,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </SideCard>
            )}
            {release.repositories.length > 0 && (
              <SideCard title="Repositories" icon={GitBranch}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {release.repositories.map((r) => (
                    <span
                      key={r}
                      style={{
                        fontSize: 12.5,
                        color: p.textMuted,
                        fontFamily:
                          "ui-monospace, SFMono-Regular, Menlo, monospace",
                      }}
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </SideCard>
            )}
            {release.pullRequests.length > 0 && (
              <SideCard title="Pull requests" icon={GitPullRequest}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {release.pullRequests.map((pr) => {
                    const isUrl = /^https?:\/\//i.test(pr);
                    return isUrl ? (
                      <a
                        key={pr}
                        href={pr}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: 12.5,
                          color: p.accentText,
                          textDecoration: "none",
                          fontFamily:
                            "ui-monospace, SFMono-Regular, Menlo, monospace",
                          wordBreak: "break-all",
                        }}
                      >
                        {pr}
                      </a>
                    ) : (
                      <span
                        key={pr}
                        style={{
                          fontSize: 12.5,
                          color: p.textMuted,
                          fontFamily:
                            "ui-monospace, SFMono-Regular, Menlo, monospace",
                        }}
                      >
                        {pr}
                      </span>
                    );
                  })}
                </div>
              </SideCard>
            )}
            {release.linkedTickets.length === 0 &&
              release.repositories.length === 0 &&
              release.pullRequests.length === 0 && (
                <SideCard title="Linked items" icon={Hash}>
                  <div
                    style={{
                      fontSize: 12.5,
                      color: p.textSubtle,
                    }}
                  >
                    No linked tickets or pull requests.
                  </div>
                </SideCard>
              )}
          </div>
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- */

function SectionCard({
  label,
  icon: Icon,
  tone,
  paragraphs,
  prominent,
}: {
  label: string;
  icon: any;
  tone: { bg: string; border: string; text: string };
  paragraphs: string[];
  prominent?: boolean;
}) {
  return (
    <div
      style={{
        background: p.surfaceElevated,
        border: `1px solid ${p.border}`,
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "12px 18px",
          borderBottom: `1px solid ${p.border}`,
          background: prominent ? tone.bg : p.surfaceMuted,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            background: tone.bg,
            border: `1px solid ${tone.border}`,
            color: tone.text,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={12} />
        </div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: prominent ? tone.text : p.text,
            letterSpacing: "-0.005em",
          }}
        >
          {label}
        </div>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 11,
            fontWeight: 600,
            color: p.textSubtle,
          }}
        >
          {paragraphs.length}
        </span>
      </div>
      <div style={{ padding: "12px 18px 16px" }}>
        <ul style={{ margin: 0, paddingLeft: 18, color: p.text }}>
          {paragraphs.map((para, i) => (
            <li
              key={i}
              style={{
                fontSize: 13.5,
                lineHeight: 1.6,
                color: p.textMuted,
                marginBottom: i < paragraphs.length - 1 ? 6 : 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {para}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function SideCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: p.surfaceElevated,
        border: `1px solid ${p.border}`,
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "10px 14px",
          borderBottom: `1px solid ${p.border}`,
          background: p.surfaceMuted,
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 11,
          fontWeight: 600,
          color: p.textSubtle,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        <Icon size={12} />
        {title}
      </div>
      <div style={{ padding: "12px 14px" }}>{children}</div>
    </div>
  );
}
