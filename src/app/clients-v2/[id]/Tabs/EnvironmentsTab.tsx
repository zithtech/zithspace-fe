"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Modal,
  Drawer,
  Form,
  Input,
  Select,
  DatePicker,
  notification,
  Popconfirm,
  Empty,
  Tooltip,
  Tag,
} from "antd";
import {
  Plus,
  Server,
  Globe,
  Activity,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  HardDrive,
  History,
  Rocket,
  ExternalLink,
  Trash2,
  ChevronRight,
  Edit3,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  CircleDot,
} from "lucide-react";
import dayjs from "dayjs";
import {
  environmentsService,
  EnvListItem,
  EnvDetail,
  EnvKind,
  EnvStatus,
  Deployment,
  DeployStatus,
  CreateEnvPayload,
} from "@/services/environmentsService";
import { useTheme } from "@/context/ThemeContext";
import {
  PremiumModal,
  ModalSection,
  ModalFooterActions,
} from "./_PremiumModal";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";

type Mode = "light" | "dark";

const palette = (mode: Mode) => {
  const dark = mode === "dark";
  return {
    surfaceElevated: dark ? "#131B2D" : "#ffffff",
    surfaceMuted: dark ? "#0F1626" : "#f8fafc",
    border: dark ? "#1E293B" : "#e5e7eb",
    borderStrong: dark ? "#273449" : "#d1d5db",
    text: dark ? "#F1F5F9" : "#0f172a",
    textMuted: dark ? "#CBD5E1" : "#475569",
    textSubtle: dark ? "#94A3B8" : "#64748b",
    textFaint: dark ? "#64748B" : "#94a3b8",
    accentBg: dark ? "rgba(59,130,246,0.12)" : "#eff6ff",
    accentBorder: dark ? "rgba(59,130,246,0.35)" : "#bfdbfe",
    accentText: dark ? "#93c5fd" : "#1d4ed8",
    successBg: dark ? "rgba(16,185,129,0.12)" : "#ecfdf5",
    successBorder: dark ? "rgba(16,185,129,0.35)" : "#a7f3d0",
    successText: dark ? "#6ee7b7" : "#047857",
    warningBg: dark ? "rgba(245,158,11,0.12)" : "#fffbeb",
    warningBorder: dark ? "rgba(245,158,11,0.35)" : "#fde68a",
    warningText: dark ? "#fcd34d" : "#92400e",
    dangerBg: dark ? "rgba(239,68,68,0.12)" : "#fef2f2",
    dangerBorder: dark ? "rgba(239,68,68,0.35)" : "#fecaca",
    dangerText: dark ? "#fca5a5" : "#b91c1c",
    purpleBg: dark ? "rgba(139,92,246,0.12)" : "#f5f3ff",
    purpleBorder: dark ? "rgba(139,92,246,0.35)" : "#ddd6fe",
    purpleText: dark ? "#c4b5fd" : "#6d28d9",
    overlay: dark ? "rgba(0,0,0,0.7)" : "rgba(15,23,42,0.45)",
  };
};

const KIND_META: Record<string, { label: string; tone: keyof ReturnType<typeof tonesOf> }> = {
  production: { label: "Production", tone: "danger" },
  staging: { label: "Staging", tone: "warning" },
  uat: { label: "UAT", tone: "accent" },
  qa: { label: "QA", tone: "purple" },
  dev: { label: "Dev", tone: "neutral" },
  demo: { label: "Demo", tone: "neutral" },
  preview: { label: "Preview", tone: "neutral" },
  other: { label: "Other", tone: "neutral" },
};

const STATUS_META: Record<string, { label: string; tone: keyof ReturnType<typeof tonesOf>; icon: any }> = {
  operational: { label: "Operational", tone: "success", icon: CheckCircle2 },
  degraded: { label: "Degraded", tone: "warning", icon: AlertTriangle },
  down: { label: "Down", tone: "danger", icon: XCircle },
  maintenance: { label: "Maintenance", tone: "accent", icon: CircleDot },
  unknown: { label: "Unknown", tone: "neutral", icon: CircleDot },
};

const DEPLOY_STATUS_META: Record<string, { label: string; tone: keyof ReturnType<typeof tonesOf>; icon: any }> = {
  success: { label: "Success", tone: "success", icon: CheckCircle2 },
  failed: { label: "Failed", tone: "danger", icon: XCircle },
  rolled_back: { label: "Rolled back", tone: "warning", icon: History },
  in_progress: { label: "In progress", tone: "accent", icon: CircleDot },
};

function tonesOf(c: ReturnType<typeof palette>) {
  return {
    accent: { bg: c.accentBg, border: c.accentBorder, text: c.accentText },
    success: { bg: c.successBg, border: c.successBorder, text: c.successText },
    warning: { bg: c.warningBg, border: c.warningBorder, text: c.warningText },
    danger: { bg: c.dangerBg, border: c.dangerBorder, text: c.dangerText },
    purple: { bg: c.purpleBg, border: c.purpleBorder, text: c.purpleText },
    neutral: {
      bg: c.surfaceMuted,
      border: c.border,
      text: c.textSubtle,
    },
  };
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return String(iso);
  }
}
function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(iso);
  }
}
function fmtRelative(iso: string | null | undefined): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return fmtDate(iso);
}
function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}
function fmtDuration(seconds: number | null): string {
  if (seconds == null) return "—";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return `${h}h${m ? ` ${m}m` : ""}`;
}

/* --------------------------------------------------------------- */

interface Props {
  clientId: string;
  projects?: { id: string; name: string; code?: string | null }[];
  onRefresh?: () => void;
}

export default function EnvironmentsTab({ clientId, projects = [] }: Props) {
  const { theme } = useTheme();
  const c = useMemo(() => palette(theme as Mode), [theme]);
  const tones = useMemo(() => tonesOf(c), [c]);

  const [items, setItems] = useState<EnvListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [notify, contextHolder] = notification.useNotification();

  const load = async () => {
    setLoading(true);
    try {
      setItems(await environmentsService.listForClient(clientId));
    } catch (err: any) {
      notify.error({ message: "Failed to load environments", description: err?.message });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  return (
    <div style={{ padding: "4px 0 24px", color: c.text }}>
      {contextHolder}

      {/* Header */}
      <div className="env-header-wrap" style={{ margin: "0 -32px" }}>
        <TimeTrackingHeader
          icon={<Server size={20} color="#3b82f6" />}
          title="Environments"
          description="Track production, staging and UAT URLs, current versions, SSL certificates and backups."
          extra={
            <Button
              type="primary"
              icon={<Plus size={15} />}
              onClick={() => setCreateOpen(true)}
              style={{
                background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                borderColor: "transparent",
                borderRadius: "8px",
                height: "36px",
                fontWeight: 600,
                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.15)",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Add environment
            </Button>
          }
          style={{ background: "transparent", borderBottom: "1px solid var(--border-slate-100)" }}
        />
      </div>

      <div style={{ marginTop: 20 }}>
      {loading ? (
        <div
          style={{
            padding: 48,
            textAlign: "center",
            border: `1px solid ${c.border}`,
            borderRadius: 12,
            background: c.surfaceElevated,
            color: c.textSubtle,
          }}
        >
          Loading…
        </div>
      ) : items.length === 0 ? (
        <EmptyState c={c} onCreate={() => setCreateOpen(true)} />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
            gap: 12,
          }}
        >
          {items.map((env) => (
            <EnvCard
              key={env.id}
              env={env}
              c={c}
              tones={tones}
              onOpen={() => setOpenId(env.id)}
            />
          ))}
        </div>
      )}
      </div>

      <CreateEnvModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false);
          load();
        }}
        clientId={clientId}
        projects={projects}
        c={c}
        notify={notify}
      />

      <EnvDetailDrawer
        id={openId}
        c={c}
        tones={tones}
        projects={projects}
        notify={notify}
        onClose={() => setOpenId(null)}
        onMutated={load}
      />

      {/* Premium adaptive header styling */}
      <style dangerouslySetInnerHTML={{
        __html: `
        /* Full bleed header styling flush with vertical sidebar border */
        .env-header-wrap {
          margin-bottom: 24px !important;
          display: block !important;
        }
        .env-header-wrap .saas-header-container {
          margin-left: -32px !important;
          margin-right: -32px !important;
          padding-left: 32px !important;
          padding-right: 32px !important;
          padding-top: 10px !important;
          padding-bottom: 12px !important;
          margin-bottom: 0 !important;
        }
        @media (max-width: 900px) {
          .env-header-wrap .saas-header-container {
            margin-left: -20px !important;
            margin-right: -20px !important;
            padding-left: 20px !important;
            padding-right: 20px !important;
          }
        }
        @media (max-width: 720px) {
          .env-header-wrap .saas-header-container {
            margin-left: -16px !important;
            margin-right: -16px !important;
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
        }

        /* Force header elements to stay on the exact same line, overriding TimeTrackingHeader media query */
        @media (max-width: 1200px) {
          html body .env-header-wrap .saas-header-container .saas-header-row {
            flex-wrap: nowrap !important;
          }
          html body .env-header-wrap .saas-header-container .saas-header-left-col {
            width: auto !important;
            flex: 1 1 auto !important;
            min-width: 0 !important;
          }
          html body .env-header-wrap .saas-header-container .saas-header-extra-col {
            width: auto !important;
            flex: 0 0 auto !important;
            margin-top: 0 !important;
          }
          html body .env-header-wrap .saas-header-container .saas-header-left-group {
            flex-direction: row !important;
            align-items: center !important;
            gap: 16px !important;
          }
          html body .env-header-wrap .saas-header-container .bh-header-divider {
            display: inline-block !important;
          }
        }
      `}} />
    </div>
  );
}

/* --------------------------------------------------------------- */

function EmptyState({
  c,
  onCreate,
}: {
  c: ReturnType<typeof palette>;
  onCreate: () => void;
}) {
  return (
    <div
      style={{
        padding: 56,
        textAlign: "center",
        background: c.surfaceElevated,
        border: `1px dashed ${c.border}`,
        borderRadius: 14,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: c.accentBg,
          color: c.accentText,
          border: `1px solid ${c.accentBorder}`,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 14,
        }}
      >
        <Server size={22} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: c.text }}>
        No environments registered yet
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 13,
          color: c.textSubtle,
          maxWidth: 480,
          margin: "6px auto 0",
        }}
      >
        Add Production / Staging URLs so the client always knows where to
        check and what version is live.
      </div>
      <div style={{ marginTop: 18 }}>
        <Button type="primary" icon={<Plus size={15} />} onClick={onCreate}>
          Add first environment
        </Button>
      </div>
    </div>
  );
}

function EnvCard({
  env,
  c,
  tones,
  onOpen,
}: {
  env: EnvListItem;
  c: ReturnType<typeof palette>;
  tones: ReturnType<typeof tonesOf>;
  onOpen: () => void;
}) {
  const [hover, setHover] = useState(false);
  const kindMeta = KIND_META[env.kind] || KIND_META.other;
  const st = STATUS_META[env.status] || STATUS_META.unknown;
  const StIcon = st.icon;
  const sslDays = daysUntil(env.sslExpiresAt);
  const sslTone =
    sslDays == null
      ? tones.neutral
      : sslDays < 0
        ? tones.danger
        : sslDays <= 14
          ? tones.warning
          : tones.success;
  const sslLabel =
    sslDays == null
      ? "SSL —"
      : sslDays < 0
        ? `SSL expired ${Math.abs(sslDays)}d ago`
        : `SSL ${sslDays}d left`;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: c.surfaceElevated,
        border: `1px solid ${hover ? c.borderStrong : c.border}`,
        borderRadius: 14,
        overflow: "hidden",
        transition: "border-color 120ms ease",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: "16px 18px",
          borderBottom: `1px solid ${c.border}`,
          background: c.surfaceMuted,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                padding: "1px 8px",
                background: tones[kindMeta.tone].bg,
                border: `1px solid ${tones[kindMeta.tone].border}`,
                color: tones[kindMeta.tone].text,
                borderRadius: 999,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {kindMeta.label}
            </span>
            {env.visibility === "internal" && (
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 500,
                  padding: "1px 7px",
                  background: c.surfaceElevated,
                  border: `1px solid ${c.border}`,
                  color: c.textSubtle,
                  borderRadius: 999,
                }}
              >
                Internal only
              </span>
            )}
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: 15,
              fontWeight: 600,
              color: c.text,
              letterSpacing: "-0.01em",
            }}
          >
            {env.name}
          </div>
        </div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "3px 9px",
            background: tones[st.tone].bg,
            border: `1px solid ${tones[st.tone].border}`,
            color: tones[st.tone].text,
            borderRadius: 999,
            fontSize: 11.5,
            fontWeight: 500,
            whiteSpace: "nowrap",
          }}
        >
          <StIcon size={11} />
          {st.label}
        </span>
      </div>

      <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
        {env.url && (
          <a
            href={env.url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 10px",
              background: c.accentBg,
              border: `1px solid ${c.accentBorder}`,
              borderRadius: 7,
              color: c.accentText,
              textDecoration: "none",
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
          </a>
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
            c={c}
            label="Version"
            value={
              env.currentVersion ? (
                <span
                  style={{
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, monospace",
                    fontSize: 12.5,
                  }}
                >
                  {env.currentVersion}
                </span>
              ) : (
                <span style={{ color: c.textFaint }}>—</span>
              )
            }
          />
          <Metric
            c={c}
            label="Last deploy"
            value={
              env.lastDeployedAt
                ? fmtRelative(env.lastDeployedAt)
                : "Never"
            }
          />
          <Metric
            c={c}
            label="Uptime"
            value={
              env.uptimePercent != null
                ? `${Number(env.uptimePercent).toFixed(2)}%`
                : "—"
            }
          />
          <Metric
            c={c}
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
              background: c.surfaceMuted,
              border: `1px solid ${c.border}`,
              color: c.textSubtle,
              borderRadius: 999,
              fontSize: 11,
            }}
          >
            <History size={10} />
            {env.deploymentCount} deploys
          </span>
        </div>
      </div>

      <button
        onClick={onOpen}
        style={{
          padding: "10px 14px",
          background: "transparent",
          borderTop: `1px solid ${c.border}`,
          border: "none",
          borderBottom: "none",
          cursor: "pointer",
          fontSize: 12.5,
          fontWeight: 500,
          color: c.textMuted,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        Open details &amp; deploy history
        <ChevronRight size={14} color={c.textFaint} />
      </button>
    </div>
  );
}

function Metric({
  c,
  label,
  value,
}: {
  c: ReturnType<typeof palette>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: c.textSubtle,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </div>
      <div style={{ marginTop: 2, color: c.text, fontWeight: 500 }}>
        {value}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- */

function CreateEnvModal({
  open,
  onClose,
  onCreated,
  clientId,
  projects,
  c,
  notify,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  clientId: string;
  projects: { id: string; name: string; code?: string | null }[];
  c: ReturnType<typeof palette>;
  notify: any;
}) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) form.resetFields();
    else
      form.setFieldsValue({
        kind: "production",
        visibility: "client",
        status: "operational",
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async (values: any) => {
    setSubmitting(true);
    try {
      const payload: CreateEnvPayload = {
        name: values.name.trim(),
        kind: values.kind,
        url: values.url || undefined,
        projectId: values.projectId || undefined,
        visibility: values.visibility,
        status: values.status,
        currentVersion: values.currentVersion || undefined,
        sslExpiresAt: values.sslExpiresAt
          ? dayjs(values.sslExpiresAt).format("YYYY-MM-DD")
          : undefined,
        lastBackupAt: values.lastBackupAt
          ? dayjs(values.lastBackupAt).toISOString()
          : undefined,
        notes: values.notes || undefined,
      };
      await environmentsService.create(clientId, payload);
      notify.success({ message: "Environment added" });
      onCreated();
    } catch (err: any) {
      notify.error({
        message: "Could not create environment",
        description: err?.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PremiumModal
      open={open}
      onClose={onClose}
      width={660}
      c={c}
      ribbonColor={c.accentText}
      iconTile={{ bg: c.accentBg, border: c.accentBorder, text: c.accentText }}
      icon={<Server size={20} />}
      title="Add an environment"
      subtitle="Production · Staging · UAT — anything you want to track for this client. Visibility controls whether it shows in their portal."
      tip={
        <span>
          <ShieldCheck
            size={11}
            style={{ verticalAlign: -1, marginRight: 5, color: c.successText }}
          />
          SSL and backup fields are color-coded in the client portal based on
          how soon they expire.
        </span>
      }
      footer={
        <ModalFooterActions c={c} kbdHint="⌘ ↵ to save">
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            onClick={() => form.submit()}
            icon={<Server size={14} />}
          >
            Save environment
          </Button>
        </ModalFooterActions>
      }
    >
      <Form form={form} layout="vertical" onFinish={submit} requiredMark={false}>
        <ModalSection
          c={c}
          title="Identity"
          description="What this environment is, where it lives, and who sees it."
          icon={<Server size={11} />}
          plain
        >
          <Form.Item
            name="name"
            label={<L c={c}>Display name</L>}
            rules={[{ required: true, message: "Name is required" }]}
            style={{ marginBottom: 12 }}
          >
            <Input
              prefix={<Server size={13} color={c.textFaint} />}
              placeholder="e.g. Production · Web"
              maxLength={120}
            />
          </Form.Item>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 10,
            }}
          >
            <Form.Item
              name="kind"
              label={<L c={c}>Type</L>}
              rules={[{ required: true }]}
              style={{ marginBottom: 12 }}
            >
              <Select
                options={(Object.keys(KIND_META) as EnvKind[]).map((k) => ({
                  value: k,
                  label: KIND_META[k].label,
                }))}
              />
            </Form.Item>
            <Form.Item
              name="status"
              label={<L c={c}>Status</L>}
              style={{ marginBottom: 12 }}
            >
              <Select
                options={(Object.keys(STATUS_META) as EnvStatus[]).map((s) => ({
                  value: s,
                  label: STATUS_META[s].label,
                }))}
              />
            </Form.Item>
            <Form.Item
              name="visibility"
              label={<L c={c}>Visibility</L>}
              style={{ marginBottom: 12 }}
            >
              <Select
                options={[
                  { value: "client", label: "Visible to client" },
                  { value: "internal", label: "Internal only" },
                ]}
              />
            </Form.Item>
          </div>

          <Form.Item
            name="url"
            label={<L c={c}>URL</L>}
            style={{ marginBottom: 0 }}
          >
            <Input
              prefix={<Globe size={13} color={c.textFaint} />}
              placeholder="https://app.example.com"
            />
          </Form.Item>
        </ModalSection>

        <ModalSection
          c={c}
          title="Health & metadata"
          description="Version, SSL expiry and backup state — all surfaced as color-coded chips in the portal."
          icon={<ShieldCheck size={11} />}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1.2fr",
              gap: 10,
            }}
          >
            <Form.Item
              name="currentVersion"
              label={<L c={c}>Current version</L>}
              style={{ marginBottom: 12 }}
            >
              <Input placeholder="e.g. v2.4.1" maxLength={60} />
            </Form.Item>
            <Form.Item
              name="sslExpiresAt"
              label={<L c={c}>SSL expires</L>}
              style={{ marginBottom: 12 }}
            >
              <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item
              name="lastBackupAt"
              label={<L c={c}>Last backup</L>}
              style={{ marginBottom: 12 }}
            >
              <DatePicker
                showTime
                style={{ width: "100%" }}
                format="YYYY-MM-DD HH:mm"
              />
            </Form.Item>
          </div>

          <Form.Item
            name="projectId"
            label={<L c={c} hint="optional">Project</L>}
            style={{ marginBottom: 12 }}
          >
            <Select
              allowClear
              placeholder="—"
              options={projects.map((p) => ({
                value: p.id,
                label: p.code ? `${p.name} · ${p.code}` : p.name,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="notes"
            label={<L c={c} hint="optional">Notes</L>}
            style={{ marginBottom: 0 }}
          >
            <Input.TextArea rows={2} placeholder="Anything else worth noting" />
          </Form.Item>
        </ModalSection>
      </Form>
    </PremiumModal>
  );
}

function L({
  c,
  children,
  hint,
}: {
  c: ReturnType<typeof palette>;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <span style={{ fontSize: 12.5, color: c.textMuted, fontWeight: 500 }}>
      {children}
      {hint && (
        <span
          style={{
            marginLeft: 6,
            fontSize: 11.5,
            color: c.textFaint,
            fontWeight: 400,
          }}
        >
          · {hint}
        </span>
      )}
    </span>
  );
}

/* ====================================================================== */
/*  Detail drawer — settings + deploy history + log new deploy             */
/* ====================================================================== */

function EnvDetailDrawer({
  id,
  c,
  tones,
  projects,
  notify,
  onClose,
  onMutated,
}: {
  id: string | null;
  c: ReturnType<typeof palette>;
  tones: ReturnType<typeof tonesOf>;
  projects: { id: string; name: string; code?: string | null }[];
  notify: any;
  onClose: () => void;
  onMutated: () => void;
}) {
  const [data, setData] = useState<EnvDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [logDeployOpen, setLogDeployOpen] = useState(false);
  const [settingsForm] = Form.useForm();

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const d = await environmentsService.detail(id);
      setData(d);
      settingsForm.setFieldsValue({
        name: d.name,
        kind: d.kind,
        url: d.url,
        status: d.status,
        currentVersion: d.currentVersion,
        sslExpiresAt: d.sslExpiresAt ? dayjs(d.sslExpiresAt) : undefined,
        lastBackupAt: d.lastBackupAt ? dayjs(d.lastBackupAt) : undefined,
        uptimePercent: d.uptimePercent != null ? Number(d.uptimePercent) : undefined,
        notes: d.notes,
        visibility: d.visibility,
        projectId: d.projectId,
      });
    } catch (err: any) {
      notify.error({ message: "Failed to load", description: err?.message });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    setData(null);
    setEditing(false);
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const saveSettings = async () => {
    if (!data) return;
    const v = settingsForm.getFieldsValue();
    try {
      await environmentsService.update(data.id, {
        name: v.name,
        kind: v.kind,
        url: v.url || undefined,
        status: v.status,
        currentVersion: v.currentVersion || undefined,
        sslExpiresAt: v.sslExpiresAt
          ? dayjs(v.sslExpiresAt).format("YYYY-MM-DD")
          : undefined,
        lastBackupAt: v.lastBackupAt
          ? dayjs(v.lastBackupAt).toISOString()
          : undefined,
        uptimePercent: v.uptimePercent ?? undefined,
        notes: v.notes || undefined,
        visibility: v.visibility,
        projectId: v.projectId || undefined,
      });
      notify.success({ message: "Saved" });
      setEditing(false);
      load();
      onMutated();
    } catch (err: any) {
      notify.error({ message: "Save failed", description: err?.message });
    }
  };

  const removeEnv = async () => {
    if (!data) return;
    try {
      await environmentsService.remove(data.id);
      notify.success({ message: "Environment deleted" });
      onClose();
      onMutated();
    } catch (err: any) {
      notify.error({ message: "Delete failed", description: err?.message });
    }
  };

  const removeDeploy = async (deploymentId: string) => {
    try {
      await environmentsService.removeDeployment(deploymentId);
      notify.success({ message: "Deployment removed" });
      load();
    } catch (err: any) {
      notify.error({ message: "Delete failed", description: err?.message });
    }
  };

  return (
    <Drawer
      open={!!id}
      onClose={onClose}
      width={760}
      title={null}
      closable={false}
      styles={{
        mask: { backgroundColor: c.overlay },
        content: { background: c.surfaceElevated },
        header: { display: "none" },
        body: { padding: 0, background: c.surfaceElevated },
      }}
    >
      {!data || loading ? (
        <div
          style={{
            minHeight: "60vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: c.textSubtle,
          }}
        >
          {loading ? "Loading…" : <Empty description="Nothing to show" />}
        </div>
      ) : (
        <>
          <DrawerHeader
            data={data}
            c={c}
            tones={tones}
            editing={editing}
            onToggleEdit={() => setEditing((v) => !v)}
            onDelete={removeEnv}
            onLogDeploy={() => setLogDeployOpen(true)}
          />

          <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 18 }}>
            {editing ? (
              <SettingsForm
                form={settingsForm}
                c={c}
                projects={projects}
                onSave={saveSettings}
                onCancel={() => setEditing(false)}
              />
            ) : (
              <SettingsView data={data} c={c} tones={tones} />
            )}

            <DeployHistory
              deployments={data.deployments}
              c={c}
              tones={tones}
              onRemove={removeDeploy}
            />
          </div>

          <LogDeploymentModal
            open={logDeployOpen}
            onClose={() => setLogDeployOpen(false)}
            onLogged={() => {
              setLogDeployOpen(false);
              load();
              onMutated();
            }}
            envId={data.id}
            c={c}
            notify={notify}
          />
        </>
      )}
    </Drawer>
  );
}

function DrawerHeader({
  data,
  c,
  tones,
  editing,
  onToggleEdit,
  onDelete,
  onLogDeploy,
}: {
  data: EnvDetail;
  c: ReturnType<typeof palette>;
  tones: ReturnType<typeof tonesOf>;
  editing: boolean;
  onToggleEdit: () => void;
  onDelete: () => void;
  onLogDeploy: () => void;
}) {
  const kindMeta = KIND_META[data.kind] || KIND_META.other;
  const st = STATUS_META[data.status] || STATUS_META.unknown;
  const StIcon = st.icon;
  return (
    <div
      style={{
        padding: "20px 22px 14px",
        borderBottom: `1px solid ${c.border}`,
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: c.accentBg,
          border: `1px solid ${c.accentBorder}`,
          color: c.accentText,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Server size={18} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              padding: "1px 8px",
              background: tones[kindMeta.tone].bg,
              border: `1px solid ${tones[kindMeta.tone].border}`,
              color: tones[kindMeta.tone].text,
              borderRadius: 999,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
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
              background: tones[st.tone].bg,
              border: `1px solid ${tones[st.tone].border}`,
              color: tones[st.tone].text,
              borderRadius: 999,
              fontSize: 11.5,
              fontWeight: 500,
            }}
          >
            <StIcon size={11} />
            {st.label}
          </span>
          {data.visibility === "internal" && (
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 500,
                padding: "1px 7px",
                background: c.surfaceMuted,
                border: `1px solid ${c.border}`,
                color: c.textSubtle,
                borderRadius: 999,
              }}
            >
              Internal only
            </span>
          )}
        </div>
        <h2
          style={{
            margin: "8px 0 0",
            fontSize: 18,
            fontWeight: 600,
            color: c.text,
            letterSpacing: "-0.01em",
          }}
        >
          {data.name}
        </h2>
        {data.url && (
          <a
            href={data.url}
            target="_blank"
            rel="noreferrer"
            style={{
              marginTop: 6,
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 12.5,
              color: c.accentText,
              textDecoration: "none",
            }}
          >
            <Globe size={11} />
            {data.url.replace(/^https?:\/\//, "")}
            <ExternalLink size={11} />
          </a>
        )}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <Button
          size="small"
          icon={<Rocket size={13} />}
          onClick={onLogDeploy}
        >
          Log deploy
        </Button>
        <Button
          size="small"
          icon={<Edit3 size={13} />}
          onClick={onToggleEdit}
        >
          {editing ? "Done editing" : "Edit"}
        </Button>
        <Popconfirm
          title="Delete this environment?"
          description="All deployment history attached to it is also deleted."
          onConfirm={onDelete}
          okText="Delete"
          okButtonProps={{ danger: true }}
        >
          <Button size="small" danger icon={<Trash2 size={13} />} />
        </Popconfirm>
      </div>
    </div>
  );
}

function SettingsView({
  data,
  c,
  tones,
}: {
  data: EnvDetail;
  c: ReturnType<typeof palette>;
  tones: ReturnType<typeof tonesOf>;
}) {
  const sslDays = daysUntil(data.sslExpiresAt);
  const sslTone =
    sslDays == null
      ? tones.neutral
      : sslDays < 0
        ? tones.danger
        : sslDays <= 14
          ? tones.warning
          : tones.success;

  return (
    <div
      style={{
        background: c.surfaceElevated,
        border: `1px solid ${c.border}`,
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "10px 16px",
          background: c.surfaceMuted,
          borderBottom: `1px solid ${c.border}`,
          fontSize: 11,
          fontWeight: 600,
          color: c.textSubtle,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        Health &amp; metadata
      </div>
      <div
        style={{
          padding: 14,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
        }}
      >
        <KV
          c={c}
          label="Current version"
          value={
            data.currentVersion ? (
              <span
                style={{
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                }}
              >
                {data.currentVersion}
              </span>
            ) : (
              "—"
            )
          }
        />
        <KV
          c={c}
          label="SSL expires"
          value={
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "1px 8px",
                background: sslTone.bg,
                border: `1px solid ${sslTone.border}`,
                color: sslTone.text,
                borderRadius: 999,
                fontSize: 11.5,
                fontWeight: 500,
              }}
            >
              {sslDays != null && sslDays < 0 ? (
                <ShieldAlert size={11} />
              ) : (
                <ShieldCheck size={11} />
              )}
              {sslDays == null
                ? "—"
                : sslDays < 0
                  ? `Expired ${Math.abs(sslDays)}d ago`
                  : sslDays === 0
                    ? "Today"
                    : `${sslDays}d`}
            </span>
          }
        />
        <KV
          c={c}
          label="Last backup"
          value={
            data.lastBackupAt ? (
              <span>
                <HardDrive
                  size={11}
                  style={{ verticalAlign: -1, marginRight: 4, color: c.textSubtle }}
                />
                {fmtRelative(data.lastBackupAt)}
              </span>
            ) : (
              "—"
            )
          }
        />
        <KV
          c={c}
          label="Uptime"
          value={
            data.uptimePercent != null
              ? `${Number(data.uptimePercent).toFixed(2)}%`
              : "—"
          }
        />
        <KV c={c} label="Project" value={data.projectName || "—"} />
        <KV
          c={c}
          label="Created"
          value={`${fmtDate(data.createdAt)} · ${data.createdByName || "—"}`}
        />
      </div>
      {data.notes && (
        <div
          style={{
            padding: "12px 16px",
            borderTop: `1px solid ${c.border}`,
            fontSize: 13,
            color: c.textMuted,
            lineHeight: 1.55,
            whiteSpace: "pre-wrap",
          }}
        >
          {data.notes}
        </div>
      )}
    </div>
  );
}

function KV({
  c,
  label,
  value,
}: {
  c: ReturnType<typeof palette>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 600,
          color: c.textSubtle,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </div>
      <div style={{ marginTop: 4, fontSize: 13, color: c.text, fontWeight: 500 }}>
        {value}
      </div>
    </div>
  );
}

function SettingsForm({
  form,
  c,
  projects,
  onSave,
  onCancel,
}: {
  form: any;
  c: ReturnType<typeof palette>;
  projects: { id: string; name: string; code?: string | null }[];
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      style={{
        background: c.surfaceElevated,
        border: `1px solid ${c.border}`,
        borderRadius: 12,
        padding: 16,
      }}
    >
      <Form form={form} layout="vertical" requiredMark={false}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr 1fr",
            gap: 10,
          }}
        >
          <Form.Item name="name" label={<L c={c}>Name</L>}>
            <Input />
          </Form.Item>
          <Form.Item name="kind" label={<L c={c}>Type</L>}>
            <Select
              options={(Object.keys(KIND_META) as EnvKind[]).map((k) => ({
                value: k,
                label: KIND_META[k].label,
              }))}
            />
          </Form.Item>
          <Form.Item name="status" label={<L c={c}>Status</L>}>
            <Select
              options={(Object.keys(STATUS_META) as EnvStatus[]).map((s) => ({
                value: s,
                label: STATUS_META[s].label,
              }))}
            />
          </Form.Item>
        </div>
        <Form.Item name="url" label={<L c={c}>URL</L>}>
          <Input />
        </Form.Item>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 10,
          }}
        >
          <Form.Item name="currentVersion" label={<L c={c}>Current version</L>}>
            <Input />
          </Form.Item>
          <Form.Item name="sslExpiresAt" label={<L c={c}>SSL expires</L>}>
            <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="lastBackupAt" label={<L c={c}>Last backup</L>}>
            <DatePicker
              showTime
              style={{ width: "100%" }}
              format="YYYY-MM-DD HH:mm"
            />
          </Form.Item>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 10,
          }}
        >
          <Form.Item name="uptimePercent" label={<L c={c}>Uptime %</L>}>
            <Input type="number" step="0.01" min={0} max={100} />
          </Form.Item>
          <Form.Item name="visibility" label={<L c={c}>Visibility</L>}>
            <Select
              options={[
                { value: "client", label: "Client" },
                { value: "internal", label: "Internal" },
              ]}
            />
          </Form.Item>
          <Form.Item name="projectId" label={<L c={c}>Project</L>}>
            <Select
              allowClear
              options={projects.map((p) => ({
                value: p.id,
                label: p.code ? `${p.name} · ${p.code}` : p.name,
              }))}
            />
          </Form.Item>
        </div>
        <Form.Item name="notes" label={<L c={c}>Notes</L>}>
          <Input.TextArea rows={2} />
        </Form.Item>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            paddingTop: 8,
            borderTop: `1px solid ${c.border}`,
          }}
        >
          <Button size="small" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="small" type="primary" onClick={onSave}>
            Save changes
          </Button>
        </div>
      </Form>
    </div>
  );
}

function DeployHistory({
  deployments,
  c,
  tones,
  onRemove,
}: {
  deployments: Deployment[];
  c: ReturnType<typeof palette>;
  tones: ReturnType<typeof tonesOf>;
  onRemove: (id: string) => void;
}) {
  return (
    <div
      style={{
        background: c.surfaceElevated,
        border: `1px solid ${c.border}`,
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "10px 16px",
          background: c.surfaceMuted,
          borderBottom: `1px solid ${c.border}`,
          fontSize: 11,
          fontWeight: 600,
          color: c.textSubtle,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <History size={12} />
        Deployment history · {deployments.length}
      </div>
      {deployments.length === 0 ? (
        <div style={{ padding: 22, fontSize: 12.5, color: c.textSubtle }}>
          No deployments logged yet. Use “Log deploy” to record one.
        </div>
      ) : (
        <div>
          {deployments.map((d) => {
            const meta = DEPLOY_STATUS_META[d.status] || DEPLOY_STATUS_META.success;
            const Icon = meta.icon;
            return (
              <div
                key={d.id}
                style={{
                  padding: "12px 16px",
                  borderBottom: `1px solid ${c.border}`,
                  display: "grid",
                  gridTemplateColumns: "1fr 120px 110px 30px",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontFamily:
                          "ui-monospace, SFMono-Regular, Menlo, monospace",
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: c.text,
                      }}
                    >
                      {d.version}
                    </span>
                    {d.releaseNoteVersion && (
                      <Tooltip
                        title={`Release: ${d.releaseNoteTitle || d.releaseNoteVersion}`}
                      >
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 500,
                            padding: "1px 6px",
                            background: c.purpleBg,
                            border: `1px solid ${c.purpleBorder}`,
                            color: c.purpleText,
                            borderRadius: 999,
                          }}
                        >
                          {d.releaseNoteVersion}
                        </span>
                      </Tooltip>
                    )}
                    {d.rollbackOfDeploymentId && (
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 500,
                          padding: "1px 6px",
                          background: c.warningBg,
                          border: `1px solid ${c.warningBorder}`,
                          color: c.warningText,
                          borderRadius: 999,
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
                      color: c.textSubtle,
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <span>{fmtDateTime(d.finishedAt)}</span>
                    {d.durationSeconds != null && (
                      <>
                        <span style={{ color: c.textFaint }}>·</span>
                        <span>{fmtDuration(d.durationSeconds)}</span>
                      </>
                    )}
                    {(d.deployedByStaffName || d.deployedBy) && (
                      <>
                        <span style={{ color: c.textFaint }}>·</span>
                        <span>
                          by {d.deployedByStaffName || d.deployedBy}
                        </span>
                      </>
                    )}
                  </div>
                  {d.changelogExcerpt && (
                    <div
                      style={{
                        marginTop: 4,
                        fontSize: 12,
                        color: c.textMuted,
                        lineHeight: 1.5,
                        whiteSpace: "pre-wrap",
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
                    background: tones[meta.tone].bg,
                    border: `1px solid ${tones[meta.tone].border}`,
                    color: tones[meta.tone].text,
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 500,
                  }}
                >
                  <Icon size={11} />
                  {meta.label}
                </span>
                <span
                  style={{
                    fontSize: 11.5,
                    color: c.textSubtle,
                  }}
                >
                  {fmtRelative(d.finishedAt)}
                </span>
                <Popconfirm
                  title="Remove this deployment record?"
                  onConfirm={() => onRemove(d.id)}
                >
                  <Button
                    size="small"
                    type="text"
                    icon={<Trash2 size={13} color={c.textSubtle} />}
                  />
                </Popconfirm>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- */

function LogDeploymentModal({
  open,
  onClose,
  onLogged,
  envId,
  c,
  notify,
}: {
  open: boolean;
  onClose: () => void;
  onLogged: () => void;
  envId: string;
  c: ReturnType<typeof palette>;
  notify: any;
}) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    if (!open) form.resetFields();
    else
      form.setFieldsValue({
        status: "success",
        finishedAt: dayjs(),
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async (v: any) => {
    if (!v.version?.trim()) {
      notify.error({ message: "Version is required" });
      return;
    }
    setSubmitting(true);
    try {
      await environmentsService.createDeployment(envId, {
        version: v.version.trim(),
        status: v.status,
        startedAt: v.startedAt ? dayjs(v.startedAt).toISOString() : undefined,
        finishedAt: v.finishedAt
          ? dayjs(v.finishedAt).toISOString()
          : undefined,
        deployedBy: v.deployedBy || undefined,
        changelogExcerpt: v.changelogExcerpt || undefined,
      });
      notify.success({ message: "Deployment logged" });
      onLogged();
    } catch (err: any) {
      notify.error({
        message: "Could not log deployment",
        description: err?.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      width={540}
      closable={false}
      styles={{
        mask: { backgroundColor: c.overlay },
        content: {
          background: c.surfaceElevated,
          border: `1px solid ${c.border}`,
          padding: 0,
        },
        body: { padding: 0 },
      }}
    >
      <div
        style={{
          padding: "20px 22px 16px",
          borderBottom: `1px solid ${c.border}`,
          display: "flex",
          gap: 12,
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            background: c.accentBg,
            color: c.accentText,
            border: `1px solid ${c.accentBorder}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Rocket size={16} />
        </div>
        <div>
          <div style={{ fontSize: 15.5, fontWeight: 600, color: c.text }}>
            Log a deployment
          </div>
          <div style={{ marginTop: 3, fontSize: 12.5, color: c.textSubtle }}>
            Successful deploys auto-update the environment&apos;s current
            version.
          </div>
        </div>
      </div>
      <div style={{ padding: 22 }}>
        <Form form={form} layout="vertical" onFinish={submit} requiredMark={false}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            <Form.Item
              name="version"
              label={<L c={c}>Version</L>}
              rules={[{ required: true }]}
            >
              <Input placeholder="e.g. v2.4.2" maxLength={60} />
            </Form.Item>
            <Form.Item name="status" label={<L c={c}>Status</L>}>
              <Select
                options={(Object.keys(DEPLOY_STATUS_META) as DeployStatus[]).map(
                  (s) => ({
                    value: s,
                    label: DEPLOY_STATUS_META[s].label,
                  }),
                )}
              />
            </Form.Item>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            <Form.Item name="startedAt" label={<L c={c}>Started at</L>}>
              <DatePicker
                showTime
                style={{ width: "100%" }}
                format="YYYY-MM-DD HH:mm"
              />
            </Form.Item>
            <Form.Item name="finishedAt" label={<L c={c}>Finished at</L>}>
              <DatePicker
                showTime
                style={{ width: "100%" }}
                format="YYYY-MM-DD HH:mm"
              />
            </Form.Item>
          </div>
          <Form.Item name="deployedBy" label={<L c={c}>Deployed by</L>}>
            <Input placeholder="Name or initials" />
          </Form.Item>
          <Form.Item
            name="changelogExcerpt"
            label={<L c={c}>Changelog snippet</L>}
          >
            <Input.TextArea
              rows={3}
              placeholder="Optional notes the client will see"
            />
          </Form.Item>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 14,
              paddingTop: 14,
              borderTop: `1px solid ${c.border}`,
            }}
          >
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Log deployment
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
}
