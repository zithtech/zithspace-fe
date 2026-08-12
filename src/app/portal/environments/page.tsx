"use client";
import ZukvoLoader from "@/components/common/ZukvoLoader";


import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Empty, Row as AntRow, Col, Divider, Typography } from "antd";
import {
  Server,
  Globe,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  History,
  HardDrive,
  ChevronRight,
} from "lucide-react";

const { Title, Text } = Typography;

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

/* --------------------------------------------------------------- */

export default function PortalEnvironmentsListPage() {
  const [items, setItems] = useState<PortalEnvListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const data = await portalEnvironmentsService.list();
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

  return (
    <div style={{ height: "100vh", overflowY: "auto", backgroundColor: "#ffffff" }}>
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
                  <Server size={18} color="#3b82f6" />
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
                  Environments
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
                  Production / staging URLs, current versions, SSL expiry, backups, and recent deployment history.
                </Text>
              </div>
            </div>
          </Col>
        </AntRow>
      </div>

      <div style={{ padding: "32px 40px 56px", maxWidth: 1180 }}>

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
          <ZukvoLoader size="md" />
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
                No environments shared with you yet.
              </span>
            }
          />
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: 12,
          }}
        >
          {items.map((env) => (
            <EnvCard key={env.id} env={env} />
          ))}
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

function EnvCard({ env }: { env: PortalEnvListItem }) {
  const [hover, setHover] = useState(false);
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
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: p.surfaceElevated,
        border: `1px solid ${hover ? p.borderStrong : p.border}`,
        borderRadius: 14,
        overflow: "hidden",
        transition: "border-color 120ms ease",
        display: "flex",
        flexDirection: "column",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div
        style={{
          padding: "16px 18px",
          borderBottom: `1px solid ${p.border}`,
          background: p.surfaceMuted,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ minWidth: 0 }}>
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
              letterSpacing: "0.06em",
              display: "inline-block",
            }}
          >
            {kindMeta.label}
          </span>
          <div
            style={{
              marginTop: 8,
              fontSize: 15.5,
              fontWeight: 600,
              color: p.text,
              letterSpacing: "-0.01em",
            }}
          >
            {env.name}
          </div>
          {env.projectName && (
            <div style={{ marginTop: 3, fontSize: 11.5, color: p.textSubtle }}>
              {env.projectName}
            </div>
          )}
        </div>
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
            fontWeight: 500,
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          <StIcon size={11} />
          {st.label}
        </span>
      </div>

      <div
        style={{
          padding: 18,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          flex: 1,
        }}
      >
        {env.url && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 10px",
              background: p.accentBg,
              border: `1px solid ${p.accentBorder}`,
              borderRadius: 7,
              color: p.accentText,
              fontSize: 12.5,
              fontWeight: 500,
              alignSelf: "flex-start",
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={env.url}
          >
            <Globe size={12} />
            {env.url.replace(/^https?:\/\//, "")}
            <ExternalLink size={11} />
          </span>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            fontSize: 12,
          }}
        >
          <Metric
            label="Version"
            value={
              env.currentVersion ? (
                <span
                  style={{
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, monospace",
                  }}
                >
                  {env.currentVersion}
                </span>
              ) : (
                <span style={{ color: p.textFaint }}>—</span>
              )
            }
          />
          <Metric
            label="Last deploy"
            value={env.lastDeployedAt ? fmtRelative(env.lastDeployedAt) : "Never"}
          />
          <Metric
            label="Uptime"
            value={
              env.uptimePercent != null
                ? `${Number(env.uptimePercent).toFixed(2)}%`
                : "—"
            }
          />
          <Metric
            label="Backup"
            value={env.lastBackupAt ? fmtRelative(env.lastBackupAt) : "—"}
          />
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
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
              fontSize: 11,
              fontWeight: 500,
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
              padding: "2px 8px",
              background: p.surfaceMuted,
              border: `1px solid ${p.border}`,
              color: p.textSubtle,
              borderRadius: 999,
              fontSize: 11,
            }}
          >
            <History size={10} />
            {env.deploymentCount} deploys
          </span>
          {env.lastBackupAt && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "2px 8px",
                background: p.surfaceMuted,
                border: `1px solid ${p.border}`,
                color: p.textSubtle,
                borderRadius: 999,
                fontSize: 11,
              }}
            >
              <HardDrive size={10} />
              Backup {fmtRelative(env.lastBackupAt)}
            </span>
          )}
        </div>
      </div>

      <div
        style={{
          padding: "10px 14px",
          borderTop: `1px solid ${p.border}`,
          fontSize: 12.5,
          fontWeight: 500,
          color: p.textMuted,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        Open deploy history
        <ChevronRight size={14} color={p.textFaint} />
      </div>
    </Link>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: p.textSubtle,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </div>
      <div style={{ marginTop: 2, color: p.text, fontWeight: 500 }}>
        {value}
      </div>
    </div>
  );
}
