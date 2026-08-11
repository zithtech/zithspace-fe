"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Empty, Tooltip } from "antd";
import {
  ArrowLeft,
  Server,
  Globe,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  HardDrive,
  History,
  Activity,
  Calendar
} from "lucide-react";
import {
  portalEnvironmentsService,
  PortalEnvDetail,
  PortalEnvDeployment
} from "@/services/portalEnvironmentsService";
import {

  p,
  TONE,
  KIND_META,
  STATUS_META,
  DEPLOY_STATUS_META,
  fmtDate,
  fmtDateTime,
  fmtRelative,
  fmtDuration,
  daysUntil
} from "../_ui";
import ZukvoLoader from "@/components/common/ZukvoLoader";

/* --------------------------------------------------------------- */

export default function PortalEnvDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [data, setData] = useState<PortalEnvDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancel = false;
    (async () => {
      try {
        const d = await portalEnvironmentsService.detail(id);
        if (!cancel) setData(d);
      } catch {
        if (!cancel) setData(null);
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
          justifyContent: "center"
        }}
      >
        <ZukvoLoader size="lg" />
      </div>
    );
  }
  if (!data) {
    return (
      <div style={{ padding: 48 }}>
        <Empty description="Environment not found" />
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button
            onClick={() => router.push("/portal/environments")}
            style={{
              padding: "8px 14px",
              background: p.text,
              color: "#ffffff",
              border: `1px solid ${p.text}`,
              borderRadius: 8,
              fontSize: 13,
              cursor: "pointer"
            }}
          >
            Back to environments
          </button>
        </div>
      </div>
    );
  }

  const kindMeta = KIND_META[data.kind] || KIND_META.other;
  const st = STATUS_META[data.status] || STATUS_META.unknown;
  const StIcon = st.icon;
  const sslDays = daysUntil(data.sslExpiresAt);
  const sslTone =
    sslDays == null
      ? TONE.neutral
      : sslDays < 0
        ? TONE.danger
        : sslDays <= 14
          ? TONE.warning
          : TONE.success;

  return (
    <div style={{ padding: "32px 40px 56px", maxWidth: 1080 }}>
      <button
        type="button"
        onClick={() => router.push("/portal/environments")}
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
          marginBottom: 14
        }}
      >
        <ArrowLeft size={14} />
        Back to environments
      </button>

      {/* Header */}
      <div
        style={{
          padding: 24,
          background: p.surfaceElevated,
          border: `1px solid ${p.border}`,
          borderRadius: 14,
          marginBottom: 16
        }}
      >
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 10,
              background: p.accentBg,
              border: `1px solid ${p.accentBorder}`,
              color: p.accentText,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}
          >
            <Server size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                flexWrap: "wrap"
              }}
            >
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  padding: "1px 8px",
                  background: TONE[kindMeta.tone].bg,
                  border: `1px solid ${TONE[kindMeta.tone].border}`,
                  color: TONE[kindMeta.tone].text,
                  borderRadius: 999,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em"
                }}
              >
                {kindMeta.label}
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "3px 9px",
                  background: TONE[st.tone].bg,
                  border: `1px solid ${TONE[st.tone].border}`,
                  color: TONE[st.tone].text,
                  borderRadius: 999,
                  fontSize: 11.5,
                  fontWeight: 500
                }}
              >
                <StIcon size={11} />
                {st.label}
              </span>
            </div>
            <h1
              style={{
                margin: "8px 0 0",
                fontSize: 22,
                fontWeight: 600,
                color: p.text,
                letterSpacing: "-0.01em"
              }}
            >
              {data.name}
            </h1>
            {data.url && (
              <a
                href={data.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  marginTop: 8,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 11px",
                  background: p.accentBg,
                  border: `1px solid ${p.accentBorder}`,
                  borderRadius: 8,
                  color: p.accentText,
                  textDecoration: "none",
                  fontSize: 12.5,
                  fontWeight: 500
                }}
              >
                <Globe size={12} />
                {data.url.replace(/^https?:\/\//, "")}
                <ExternalLink size={11} />
              </a>
            )}
            <div
              style={{
                marginTop: 10,
                display: "flex",
                gap: 14,
                flexWrap: "wrap",
                fontSize: 12.5,
                color: p.textSubtle
              }}
            >
              {data.projectName && (
                <span>
                  📁 {data.projectName}
                  {data.projectCode ? ` · ${data.projectCode}` : ""}
                </span>
              )}
              {data.lastHealthCheckAt && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4
                  }}
                >
                  <Activity size={11} />
                  Last health check {fmtRelative(data.lastHealthCheckAt)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Metrics strip */}
        <div
          style={{
            marginTop: 22,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 0,
            border: `1px solid ${p.border}`,
            borderRadius: 10,
            overflow: "hidden"
          }}
        >
          <MoneyBlock
            label="Version"
            value={
              data.currentVersion ? (
                <span
                  style={{
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, monospace"
                  }}
                >
                  {data.currentVersion}
                </span>
              ) : (
                "—"
              )
            }
            emphasized
          />
          <MoneyBlock
            label="Uptime"
            value={
              data.uptimePercent != null
                ? `${Number(data.uptimePercent).toFixed(2)}%`
                : "—"
            }
          />
          <MoneyBlock
            label="SSL"
            value={
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  color: sslTone.text
                }}
              >
                {sslDays != null && sslDays < 0 ? (
                  <ShieldAlert size={12} />
                ) : (
                  <ShieldCheck size={12} />
                )}
                {sslDays == null
                  ? "—"
                  : sslDays < 0
                    ? `Expired ${Math.abs(sslDays)}d ago`
                    : `${sslDays}d`}
              </span>
            }
          />
          <MoneyBlock
            label="Last backup"
            value={
              data.lastBackupAt ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5
                  }}
                >
                  <HardDrive size={12} color={p.textSubtle} />
                  {fmtRelative(data.lastBackupAt)}
                </span>
              ) : (
                "—"
              )
            }
          />
        </div>

        {data.notes && (
          <div
            style={{
              marginTop: 14,
              padding: "12px 14px",
              background: p.surfaceMuted,
              border: `1px solid ${p.border}`,
              borderRadius: 10,
              fontSize: 13,
              color: p.textMuted,
              lineHeight: 1.55,
              whiteSpace: "pre-wrap"
            }}
          >
            {data.notes}
          </div>
        )}
      </div>

      {/* Deployment history */}
      <Card title={`Deployment history · ${data.deployments.length}`} icon={History}>
        {data.deployments.length === 0 ? (
          <div style={{ fontSize: 12.5, color: p.textSubtle }}>
            No deployments logged yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {data.deployments.map((d, i) => (
              <DeployRow
                key={d.id}
                d={d}
                first={i === 0}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* --------------------------------------------------------------- */

function MoneyBlock({
  label,
  value,
  emphasized }: {
    label: string;
    value: React.ReactNode;
    emphasized?: boolean;
  }) {
  return (
    <div
      style={{
        padding: "12px 14px",
        background: emphasized ? p.surfaceMuted : p.surfaceElevated,
        borderRight: `1px solid ${p.border}`
      }}
    >
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 600,
          color: p.textSubtle,
          textTransform: "uppercase",
          letterSpacing: "0.06em"
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 4,
          fontSize: 14,
          fontWeight: 600,
          color: p.text,
          fontVariantNumeric: "tabular-nums"
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Card({
  title,
  icon: Icon,
  children }: {
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
        overflow: "hidden"
      }}
    >
      <div
        style={{
          padding: "10px 16px",
          background: p.surfaceMuted,
          borderBottom: `1px solid ${p.border}`,
          fontSize: 11,
          fontWeight: 600,
          color: p.textSubtle,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          display: "flex",
          alignItems: "center",
          gap: 6
        }}
      >
        <Icon size={12} />
        {title}
      </div>
      <div style={{ padding: 14 }}>{children}</div>
    </div>
  );
}

function DeployRow({
  d,
  first }: {
    d: PortalEnvDeployment;
    first: boolean;
  }) {
  const meta = DEPLOY_STATUS_META[d.status] || DEPLOY_STATUS_META.success;
  const Icon = meta.icon;
  return (
    <div
      style={{
        padding: "12px 4px",
        borderTop: first ? "none" : `1px solid ${p.border}`,
        display: "grid",
        gridTemplateColumns: "1fr 120px 110px",
        gap: 12,
        alignItems: "center"
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap"
          }}
        >
          <span
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 13,
              fontWeight: 600,
              color: p.text
            }}
          >
            {d.version}
          </span>
          {d.releaseNoteVersion && (
            <Tooltip
              title={`Release: ${d.releaseNoteTitle || d.releaseNoteVersion}`}
            >
              <a
                href={`/portal/releases/${d.releaseNoteId}`}
                style={{
                  fontSize: 10.5,
                  fontWeight: 500,
                  padding: "1px 7px",
                  background: p.purpleBg,
                  border: `1px solid ${p.purpleBorder}`,
                  color: p.purpleText,
                  borderRadius: 999,
                  textDecoration: "none"
                }}
              >
                {d.releaseNoteVersion}
              </a>
            </Tooltip>
          )}
          {d.rollbackOfDeploymentId && (
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 500,
                padding: "1px 7px",
                background: p.warningBg,
                border: `1px solid ${p.warningBorder}`,
                color: p.warningText,
                borderRadius: 999
              }}
            >
              Rollback
            </span>
          )}
        </div>
        <div
          style={{
            marginTop: 3,
            fontSize: 11.5,
            color: p.textSubtle,
            display: "flex",
            gap: 8,
            flexWrap: "wrap"
          }}
        >
          <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
            <Calendar size={11} />
            {fmtDateTime(d.finishedAt)}
          </span>
          {d.durationSeconds != null && (
            <>
              <span style={{ color: p.textFaint }}>·</span>
              <span>{fmtDuration(d.durationSeconds)}</span>
            </>
          )}
          {d.deployedBy && (
            <>
              <span style={{ color: p.textFaint }}>·</span>
              <span>by {d.deployedBy}</span>
            </>
          )}
        </div>
        {d.changelogExcerpt && (
          <div
            style={{
              marginTop: 5,
              fontSize: 12,
              color: p.textMuted,
              lineHeight: 1.55,
              whiteSpace: "pre-wrap"
            }}
          >
            {d.changelogExcerpt}
          </div>
        )}
      </div>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "2px 9px",
          background: TONE[meta.tone].bg,
          border: `1px solid ${TONE[meta.tone].border}`,
          color: TONE[meta.tone].text,
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 500,
          justifySelf: "start"
        }}
      >
        <Icon size={11} />
        {meta.label}
      </span>
      <span
        style={{
          fontSize: 11.5,
          color: p.textSubtle
        }}
      >
        {fmtRelative(d.finishedAt)}
      </span>
    </div>
  );
}
