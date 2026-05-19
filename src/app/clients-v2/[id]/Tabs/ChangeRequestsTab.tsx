"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Modal,
  Drawer,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  notification,
  Tooltip,
  Tag,
} from "antd";
import {
  Plus,
  GitPullRequest,
  ChevronRight,
  Send,
  Hash,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  Activity,
  AlertTriangle,
  Receipt,
  Layers,
} from "lucide-react";
import dayjs from "dayjs";
import { crService, CrListItem, CrDetail, CrStatus } from "@/services/crService";
import { useTheme } from "@/context/ThemeContext";
import {
  PremiumModal,
  ModalSection,
  ModalFooterActions,
} from "./_PremiumModal";

type Mode = "light" | "dark";

const palette = (mode: Mode) => {
  const dark = mode === "dark";
  return {
    surface: dark ? "#0B0F1A" : "#ffffff",
    surfaceElevated: dark ? "#131B2D" : "#ffffff",
    surfaceMuted: dark ? "#0F1626" : "#f8fafc",
    border: dark ? "#1E293B" : "#e5e7eb",
    borderStrong: dark ? "#273449" : "#d1d5db",
    text: dark ? "#F1F5F9" : "#0f172a",
    textMuted: dark ? "#CBD5E1" : "#475569",
    textSubtle: dark ? "#94A3B8" : "#64748b",
    textFaint: dark ? "#64748B" : "#94a3b8",
    accent: "#3b82f6",
    accentBg: dark ? "rgba(59,130,246,0.12)" : "#eff6ff",
    accentBorder: dark ? "rgba(59,130,246,0.35)" : "#bfdbfe",
    accentText: dark ? "#93c5fd" : "#1d4ed8",
    success: dark ? "#34d399" : "#059669",
    successBg: dark ? "rgba(16,185,129,0.12)" : "#ecfdf5",
    successBorder: dark ? "rgba(16,185,129,0.35)" : "#a7f3d0",
    successText: dark ? "#6ee7b7" : "#047857",
    warning: dark ? "#fbbf24" : "#d97706",
    warningBg: dark ? "rgba(245,158,11,0.12)" : "#fffbeb",
    warningBorder: dark ? "rgba(245,158,11,0.35)" : "#fde68a",
    warningText: dark ? "#fcd34d" : "#92400e",
    danger: dark ? "#f87171" : "#dc2626",
    dangerBg: dark ? "rgba(239,68,68,0.12)" : "#fef2f2",
    dangerBorder: dark ? "rgba(239,68,68,0.35)" : "#fecaca",
    dangerText: dark ? "#fca5a5" : "#b91c1c",
    purpleBg: dark ? "rgba(139,92,246,0.12)" : "#f5f3ff",
    purpleBorder: dark ? "rgba(139,92,246,0.35)" : "#ddd6fe",
    purpleText: dark ? "#c4b5fd" : "#6d28d9",
    overlay: dark ? "rgba(0,0,0,0.7)" : "rgba(15,23,42,0.45)",
  };
};

const STATUS_META: Record<
  string,
  { label: string; tone: keyof ReturnType<typeof toneMap>; icon: any }
> = {
  draft: { label: "Draft", tone: "neutral", icon: Layers },
  submitted: { label: "Submitted", tone: "accent", icon: Clock },
  under_review: { label: "Under review", tone: "purple", icon: Activity },
  estimated: { label: "Estimated", tone: "warning", icon: DollarSign },
  approved: { label: "Approved", tone: "success", icon: CheckCircle2 },
  rejected: { label: "Rejected", tone: "danger", icon: XCircle },
  scheduled: { label: "Scheduled", tone: "accent", icon: Calendar },
  in_progress: { label: "In progress", tone: "accent", icon: Activity },
  delivered: { label: "Delivered", tone: "success", icon: CheckCircle2 },
  closed: { label: "Closed", tone: "neutral", icon: XCircle },
  cancelled: { label: "Cancelled", tone: "neutral", icon: XCircle },
};
const PRIORITY_META: Record<
  string,
  { label: string; tone: keyof ReturnType<typeof toneMap> }
> = {
  critical: { label: "Critical", tone: "danger" },
  high: { label: "High", tone: "warning" },
  medium: { label: "Medium", tone: "accent" },
  low: { label: "Low", tone: "neutral" },
};

function toneMap(c: ReturnType<typeof palette>) {
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

function fmtCurrency(value: any, currency?: string | null) {
  if (value == null || value === "") return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (isNaN(n)) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${currency || ""} ${n.toFixed(2)}`.trim();
  }
}

/* --------------------------------------------------------------- */

interface Props {
  clientId: string;
  projects?: { id: string; name: string; code?: string | null }[];
  onRefresh?: () => void;
}

export default function ChangeRequestsTab({ clientId, projects = [] }: Props) {
  const { theme } = useTheme();
  const c = useMemo(() => palette(theme as Mode), [theme]);
  const tones = useMemo(() => toneMap(c), [c]);

  const [items, setItems] = useState<CrListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [notify, contextHolder] = notification.useNotification();

  const load = async () => {
    setLoading(true);
    try {
      setItems(await crService.listForClient(clientId));
    } catch (err: any) {
      notify.error({
        message: "Failed to load change requests",
        description: err?.message,
      });
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
      <div
        style={{
          padding: 22,
          background: c.surfaceElevated,
          border: `1px solid ${c.border}`,
          borderRadius: 14,
          marginBottom: 16,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 24,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: 16, flex: 1, minWidth: 280 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: c.purpleBg,
              color: c.purpleText,
              border: `1px solid ${c.purpleBorder}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <GitPullRequest size={20} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: c.text }}>
              Change requests
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 13,
                color: c.textSubtle,
                lineHeight: 1.55,
                maxWidth: 580,
              }}
            >
              Track every scope change with impact, time and cost estimates.
              The client approves the estimate from their portal before work
              kicks off.
            </div>
          </div>
        </div>
        <Button
          type="primary"
          icon={<Plus size={15} />}
          onClick={() => setCreateOpen(true)}
        >
          New change request
        </Button>
      </div>

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
              background: c.purpleBg,
              color: c.purpleText,
              border: `1px solid ${c.purpleBorder}`,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 14,
            }}
          >
            <GitPullRequest size={22} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: c.text }}>
            No change requests yet
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: 13,
              color: c.textSubtle,
              maxWidth: 460,
              margin: "6px auto 0",
            }}
          >
            Log a scope change here or wait for the client to raise one from
            their portal. Either way, the workflow is the same.
          </div>
          <div style={{ marginTop: 18 }}>
            <Button
              type="primary"
              icon={<Plus size={15} />}
              onClick={() => setCreateOpen(true)}
            >
              Log first change request
            </Button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((cr) => (
            <CrRow
              key={cr.id}
              cr={cr}
              c={c}
              tones={tones}
              onOpen={() => setOpenId(cr.id)}
            />
          ))}
        </div>
      )}

      <CreateCrModal
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

      <CrDetailDrawer
        id={openId}
        c={c}
        tones={tones}
        notify={notify}
        onClose={() => setOpenId(null)}
        onMutated={load}
      />
    </div>
  );
}

/* --------------------------------------------------------------- */

function CrRow({
  cr,
  c,
  tones,
  onOpen,
}: {
  cr: CrListItem;
  c: ReturnType<typeof palette>;
  tones: ReturnType<typeof toneMap>;
  onOpen: () => void;
}) {
  const [hover, setHover] = useState(false);
  const st = STATUS_META[cr.status] || STATUS_META.submitted;
  const pri = PRIORITY_META[cr.priority] || PRIORITY_META.medium;
  const StIcon = st.icon;

  const estimateText = cr.estimatedCost
    ? fmtCurrency(cr.estimatedCost, cr.estimatedCurrency)
    : cr.estimatedHoursMin || cr.estimatedHoursMax
    ? `${cr.estimatedHoursMin || "?"}–${cr.estimatedHoursMax || "?"} h`
    : "—";

  return (
    <button
      onClick={onOpen}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "44px minmax(0, 1.6fr) 130px 100px 130px 30px",
        gap: 14,
        padding: "14px 18px",
        background: hover ? c.surfaceMuted : c.surfaceElevated,
        border: `1px solid ${hover ? c.borderStrong : c.border}`,
        borderRadius: 12,
        cursor: "pointer",
        textAlign: "left",
        alignItems: "center",
        transition: "border-color 120ms ease, background 120ms ease",
        color: c.text,
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 9,
          background: c.purpleBg,
          border: `1px solid ${c.purpleBorder}`,
          color: c.purpleText,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <GitPullRequest size={16} />
      </div>
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
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 11.5,
              padding: "1px 7px",
              background: c.surfaceMuted,
              border: `1px solid ${c.border}`,
              borderRadius: 6,
              color: c.textMuted,
            }}
          >
            {cr.crNumber}
          </span>
          <span
            style={{
              fontSize: 13.5,
              fontWeight: 600,
              color: c.text,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {cr.subject}
          </span>
          {cr.createdByPortalUserId && (
            <Tooltip title="Raised by the client from the portal">
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 500,
                  padding: "1px 6px",
                  background: c.accentBg,
                  border: `1px solid ${c.accentBorder}`,
                  color: c.accentText,
                  borderRadius: 999,
                }}
              >
                Client-raised
              </span>
            </Tooltip>
          )}
        </div>
        <div
          style={{
            marginTop: 4,
            fontSize: 12,
            color: c.textSubtle,
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {cr.projectName && <span>{cr.projectName}</span>}
          {cr.linkedInvoiceNumber && (
            <>
              <span style={{ color: c.textFaint }}>·</span>
              <span
                style={{ display: "inline-flex", gap: 3, alignItems: "center" }}
              >
                <Receipt size={11} />
                {cr.linkedInvoiceNumber}
              </span>
            </>
          )}
          {cr.linkedSprintVersion && (
            <>
              <span style={{ color: c.textFaint }}>·</span>
              <span>Sprint {cr.linkedSprintVersion}</span>
            </>
          )}
          <span style={{ color: c.textFaint }}>·</span>
          <span style={{ display: "inline-flex", gap: 3, alignItems: "center" }}>
            <Hash size={11} />
            {cr.messageCount}
          </span>
        </div>
      </div>
      <div>
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
      </div>
      <div>
        <span
          style={{
            display: "inline-block",
            padding: "2px 9px",
            background: tones[pri.tone].bg,
            border: `1px solid ${tones[pri.tone].border}`,
            color: tones[pri.tone].text,
            borderRadius: 999,
            fontSize: 11.5,
            fontWeight: 500,
          }}
        >
          {pri.label}
        </span>
      </div>
      <div
        style={{
          fontSize: 12.5,
          color: c.textMuted,
          fontWeight: 500,
          fontVariantNumeric: "tabular-nums",
          textAlign: "right",
        }}
      >
        {estimateText}
      </div>
      <ChevronRight size={16} color={c.textFaint} />
    </button>
  );
}

/* --------------------------------------------------------------- */

function CreateCrModal({
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
        priority: "medium",
        status: "under_review",
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async (values: any) => {
    setSubmitting(true);
    try {
      await crService.create(clientId, {
        subject: values.subject.trim(),
        description: values.description.trim(),
        priority: values.priority,
        projectId: values.projectId || undefined,
        status: values.status,
        impactAnalysis: values.impactAnalysis || undefined,
        estimatedHoursMin: values.estimatedHoursMin ?? undefined,
        estimatedHoursMax: values.estimatedHoursMax ?? undefined,
        estimatedCost: values.estimatedCost ?? undefined,
        estimatedCurrency: values.estimatedCurrency || undefined,
        targetDeliveryDate: values.targetDeliveryDate
          ? dayjs(values.targetDeliveryDate).format("YYYY-MM-DD")
          : undefined,
      });
      notify.success({ message: "Change request created" });
      onCreated();
    } catch (err: any) {
      notify.error({
        message: "Could not create CR",
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
      width={720}
      c={c}
      ribbonColor={c.purpleText}
      iconTile={{ bg: c.purpleBg, border: c.purpleBorder, text: c.purpleText }}
      icon={<GitPullRequest size={20} />}
      title="Log a change request"
      subtitle="Capture the ask now. Estimate fields are optional — you can fill them in later from the detail drawer once you've assessed impact."
      tip={
        <span>
          <DollarSign
            size={11}
            style={{ verticalAlign: -1, marginRight: 5, color: c.warningText }}
          />
          When you fill in the estimate and set status to{" "}
          <strong>Estimated</strong>, the client sees an Approve / Reject prompt
          on their portal.
        </span>
      }
      footer={
        <ModalFooterActions c={c} kbdHint="⌘ ↵ to create">
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            onClick={() => form.submit()}
            icon={<GitPullRequest size={14} />}
          >
            Create change request
          </Button>
        </ModalFooterActions>
      }
    >
      <Form form={form} layout="vertical" onFinish={submit} requiredMark={false}>
        <ModalSection
          c={c}
          title="The ask"
          description="What the client wants changed, in their words plus your context."
          icon={<GitPullRequest size={11} />}
          plain
        >
          <Form.Item
            name="subject"
            label={<L c={c}>Subject</L>}
            rules={[{ required: true, message: "Subject is required" }]}
            style={{ marginBottom: 12 }}
          >
            <Input
              prefix={<Layers size={13} color={c.textFaint} />}
              placeholder="Short description of the change"
              maxLength={200}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label={<L c={c}>Full description</L>}
            rules={[{ required: true, message: "Description is required" }]}
            style={{ marginBottom: 12 }}
          >
            <Input.TextArea
              rows={4}
              placeholder="What did the client request? What context matters?"
            />
          </Form.Item>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1.2fr",
              gap: 10,
            }}
          >
            <Form.Item
              name="priority"
              label={<L c={c}>Priority</L>}
              style={{ marginBottom: 0 }}
            >
              <Select
                options={[
                  { value: "low", label: "Low" },
                  { value: "medium", label: "Medium" },
                  { value: "high", label: "High" },
                  { value: "critical", label: "Critical" },
                ]}
              />
            </Form.Item>
            <Form.Item
              name="projectId"
              label={<L c={c} hint="optional">Project</L>}
              style={{ marginBottom: 0 }}
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
              name="status"
              label={<L c={c}>Initial status</L>}
              style={{ marginBottom: 0 }}
            >
              <Select
                options={[
                  { value: "under_review", label: "Under review" },
                  { value: "submitted", label: "Submitted" },
                  { value: "estimated", label: "Estimated" },
                  { value: "draft", label: "Draft — hidden from client" },
                ]}
              />
            </Form.Item>
          </div>
        </ModalSection>

        <ModalSection
          c={c}
          title="Estimate"
          description="Optional now. Once published, the client gets a one-click approve / reject prompt."
          icon={<DollarSign size={11} />}
        >
          <Form.Item
            name="impactAnalysis"
            label={<L c={c}>Impact analysis</L>}
            style={{ marginBottom: 12 }}
          >
            <Input.TextArea
              rows={2}
              placeholder="What's affected? Dependencies? Risks?"
            />
          </Form.Item>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1.2fr 0.8fr 1fr",
              gap: 10,
            }}
          >
            <Form.Item
              name="estimatedHoursMin"
              label={<L c={c}>Hours min</L>}
              style={{ marginBottom: 0 }}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                step={0.5}
                placeholder="8"
              />
            </Form.Item>
            <Form.Item
              name="estimatedHoursMax"
              label={<L c={c}>Hours max</L>}
              style={{ marginBottom: 0 }}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                step={0.5}
                placeholder="16"
              />
            </Form.Item>
            <Form.Item
              name="estimatedCost"
              label={<L c={c}>Cost</L>}
              style={{ marginBottom: 0 }}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                step={100}
                placeholder="2500"
              />
            </Form.Item>
            <Form.Item
              name="estimatedCurrency"
              label={<L c={c}>Currency</L>}
              style={{ marginBottom: 0 }}
            >
              <Select
                allowClear
                placeholder="USD"
                options={["USD", "INR", "EUR", "GBP", "AED"].map((cur) => ({
                  value: cur,
                  label: cur,
                }))}
              />
            </Form.Item>
            <Form.Item
              name="targetDeliveryDate"
              label={<L c={c}>Target delivery</L>}
              style={{ marginBottom: 0 }}
            >
              <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
            </Form.Item>
          </div>
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
/*  Detail drawer — staff view, with estimate editor + status controls     */
/* ====================================================================== */

function CrDetailDrawer({
  id,
  c,
  tones,
  notify,
  onClose,
  onMutated,
}: {
  id: string | null;
  c: ReturnType<typeof palette>;
  tones: ReturnType<typeof toneMap>;
  notify: any;
  onClose: () => void;
  onMutated: () => void;
}) {
  const [cr, setCr] = useState<CrDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [estimateForm] = Form.useForm();
  const [replyBody, setReplyBody] = useState("");

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await crService.detail(id);
      setCr(data);
      estimateForm.setFieldsValue({
        impactAnalysis: data.impactAnalysis || "",
        estimatedHoursMin: data.estimatedHoursMin
          ? Number(data.estimatedHoursMin)
          : undefined,
        estimatedHoursMax: data.estimatedHoursMax
          ? Number(data.estimatedHoursMax)
          : undefined,
        estimatedCost: data.estimatedCost
          ? Number(data.estimatedCost)
          : undefined,
        estimatedCurrency: data.estimatedCurrency || undefined,
        targetDeliveryDate: data.targetDeliveryDate
          ? dayjs(data.targetDeliveryDate)
          : undefined,
      });
    } catch (err: any) {
      notify.error({ message: "Failed to load", description: err?.message });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    setCr(null);
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const saveEstimate = async (publish: boolean) => {
    if (!cr) return;
    const values = estimateForm.getFieldsValue();
    try {
      await crService.updateEstimate(cr.id, {
        impactAnalysis: values.impactAnalysis || undefined,
        estimatedHoursMin: values.estimatedHoursMin ?? undefined,
        estimatedHoursMax: values.estimatedHoursMax ?? undefined,
        estimatedCost: values.estimatedCost ?? undefined,
        estimatedCurrency: values.estimatedCurrency || undefined,
        targetDeliveryDate: values.targetDeliveryDate
          ? dayjs(values.targetDeliveryDate).format("YYYY-MM-DD")
          : undefined,
        publish,
      });
      notify.success({
        message: publish ? "Estimate published" : "Estimate saved",
      });
      load();
      onMutated();
    } catch (err: any) {
      notify.error({
        message: "Save failed",
        description: err?.message,
      });
    }
  };

  const changeStatus = async (s: CrStatus) => {
    if (!cr) return;
    try {
      await crService.updateStatus(cr.id, s);
      load();
      onMutated();
    } catch (err: any) {
      notify.error({ message: "Update failed", description: err?.message });
    }
  };

  const sendReply = async () => {
    if (!cr || !replyBody.trim()) return;
    try {
      await crService.reply(cr.id, replyBody.trim());
      setReplyBody("");
      load();
    } catch (err: any) {
      notify.error({ message: "Send failed", description: err?.message });
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
      {!cr || loading ? (
        <div
          style={{
            minHeight: "60vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: c.textSubtle,
          }}
        >
          {loading ? "Loading…" : "Nothing to show"}
        </div>
      ) : (
        <CrDetailBody
          cr={cr}
          c={c}
          tones={tones}
          estimateForm={estimateForm}
          onSaveEstimate={saveEstimate}
          onChangeStatus={changeStatus}
          replyBody={replyBody}
          setReplyBody={setReplyBody}
          onReply={sendReply}
        />
      )}
    </Drawer>
  );
}

function CrDetailBody({
  cr,
  c,
  tones,
  estimateForm,
  onSaveEstimate,
  onChangeStatus,
  replyBody,
  setReplyBody,
  onReply,
}: {
  cr: CrDetail;
  c: ReturnType<typeof palette>;
  tones: ReturnType<typeof toneMap>;
  estimateForm: any;
  onSaveEstimate: (publish: boolean) => void;
  onChangeStatus: (s: CrStatus) => void;
  replyBody: string;
  setReplyBody: (s: string) => void;
  onReply: () => void;
}) {
  const st = STATUS_META[cr.status] || STATUS_META.submitted;
  const pri = PRIORITY_META[cr.priority] || PRIORITY_META.medium;
  const StIcon = st.icon;
  const canEditEstimate = !["closed", "cancelled", "delivered"].includes(
    cr.status,
  );

  return (
    <>
      {/* Header */}
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
            background: c.purpleBg,
            border: `1px solid ${c.purpleBorder}`,
            color: c.purpleText,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <GitPullRequest size={18} />
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
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: 11.5,
                padding: "1px 7px",
                background: c.surfaceMuted,
                border: `1px solid ${c.border}`,
                borderRadius: 6,
                color: c.textMuted,
              }}
            >
              {cr.crNumber}
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
            <span
              style={{
                padding: "2px 9px",
                background: tones[pri.tone].bg,
                border: `1px solid ${tones[pri.tone].border}`,
                color: tones[pri.tone].text,
                borderRadius: 999,
                fontSize: 11.5,
                fontWeight: 500,
              }}
            >
              {pri.label}
            </span>
            {cr.createdByPortalUserId && (
              <span
                style={{
                  padding: "2px 9px",
                  background: c.accentBg,
                  border: `1px solid ${c.accentBorder}`,
                  color: c.accentText,
                  borderRadius: 999,
                  fontSize: 11.5,
                  fontWeight: 500,
                }}
              >
                Client-raised
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
            {cr.subject}
          </h2>
          <div
            style={{
              marginTop: 8,
              fontSize: 12.5,
              color: c.textSubtle,
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            {cr.projectName && <span>📁 {cr.projectName}</span>}
            {cr.targetDeliveryDate && (
              <span>Target {fmtDate(cr.targetDeliveryDate)}</span>
            )}
            {cr.linkedInvoiceNumber && (
              <span>
                <Receipt
                  size={11}
                  style={{ verticalAlign: -1, marginRight: 2 }}
                />
                {cr.linkedInvoiceNumber}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Status transition row */}
      {canEditEstimate && (
        <div
          style={{
            padding: "12px 22px",
            background: c.surfaceMuted,
            borderBottom: `1px solid ${c.border}`,
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: c.textSubtle,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Status
          </span>
          <Select
            size="small"
            value={cr.status}
            style={{ width: 170 }}
            onChange={(v) => onChangeStatus(v as CrStatus)}
            options={(
              [
                "submitted",
                "under_review",
                "estimated",
                "approved",
                "rejected",
                "scheduled",
                "in_progress",
                "delivered",
                "closed",
                "cancelled",
              ] as CrStatus[]
            ).map((s) => ({
              value: s,
              label: STATUS_META[s]?.label || s,
            }))}
          />
          {cr.clientDecision && (
            <Tag
              color="default"
              style={{
                background:
                  cr.clientDecision === "approved" ? c.successBg : c.dangerBg,
                borderColor:
                  cr.clientDecision === "approved"
                    ? c.successBorder
                    : c.dangerBorder,
                color:
                  cr.clientDecision === "approved"
                    ? c.successText
                    : c.dangerText,
              }}
            >
              Client {cr.clientDecision} {fmtDate(cr.clientDecisionAt)}
            </Tag>
          )}
        </div>
      )}

      {/* Body — two columns: estimate editor + conversation */}
      <div
        style={{
          padding: 22,
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
          gap: 16,
          alignItems: "flex-start",
        }}
      >
        {/* Estimate editor */}
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
              gap: 6,
              alignItems: "center",
            }}
          >
            <DollarSign size={12} /> Estimate
          </div>
          <div style={{ padding: 14 }}>
            {!canEditEstimate ? (
              <div style={{ fontSize: 12.5, color: c.textSubtle }}>
                Estimate locked — CR is {STATUS_META[cr.status]?.label}.
              </div>
            ) : (
              <Form form={estimateForm} layout="vertical" requiredMark={false}>
                <Form.Item
                  name="impactAnalysis"
                  label={<L c={c}>Impact analysis</L>}
                  style={{ marginBottom: 10 }}
                >
                  <Input.TextArea rows={3} />
                </Form.Item>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                  }}
                >
                  <Form.Item
                    name="estimatedHoursMin"
                    label={<L c={c}>Hours min</L>}
                    style={{ marginBottom: 10 }}
                  >
                    <InputNumber style={{ width: "100%" }} min={0} step={0.5} />
                  </Form.Item>
                  <Form.Item
                    name="estimatedHoursMax"
                    label={<L c={c}>Hours max</L>}
                    style={{ marginBottom: 10 }}
                  >
                    <InputNumber style={{ width: "100%" }} min={0} step={0.5} />
                  </Form.Item>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.4fr 0.8fr 1fr",
                    gap: 8,
                  }}
                >
                  <Form.Item
                    name="estimatedCost"
                    label={<L c={c}>Cost</L>}
                    style={{ marginBottom: 10 }}
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      min={0}
                      step={100}
                    />
                  </Form.Item>
                  <Form.Item
                    name="estimatedCurrency"
                    label={<L c={c}>Cur.</L>}
                    style={{ marginBottom: 10 }}
                  >
                    <Select
                      allowClear
                      options={["USD", "INR", "EUR", "GBP", "AED"].map(
                        (cur) => ({ value: cur, label: cur }),
                      )}
                    />
                  </Form.Item>
                  <Form.Item
                    name="targetDeliveryDate"
                    label={<L c={c}>Target</L>}
                    style={{ marginBottom: 10 }}
                  >
                    <DatePicker
                      style={{ width: "100%" }}
                      format="YYYY-MM-DD"
                    />
                  </Form.Item>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 8,
                    marginTop: 6,
                  }}
                >
                  <Button size="small" onClick={() => onSaveEstimate(false)}>
                    Save draft
                  </Button>
                  <Button
                    size="small"
                    type="primary"
                    icon={<Send size={12} />}
                    onClick={() => onSaveEstimate(true)}
                  >
                    Publish to client
                  </Button>
                </div>
                {cr.clientDecision && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: "8px 10px",
                      background:
                        cr.clientDecision === "approved"
                          ? c.successBg
                          : c.dangerBg,
                      border: `1px solid ${
                        cr.clientDecision === "approved"
                          ? c.successBorder
                          : c.dangerBorder
                      }`,
                      color:
                        cr.clientDecision === "approved"
                          ? c.successText
                          : c.dangerText,
                      fontSize: 12,
                      borderRadius: 8,
                    }}
                  >
                    Client {cr.clientDecision} this estimate{" "}
                    {fmtDate(cr.clientDecisionAt)}
                    {cr.clientDecisionNote && (
                      <>
                        {" "}
                        — &ldquo;
                        <span style={{ fontStyle: "italic" }}>
                          {cr.clientDecisionNote}
                        </span>
                        &rdquo;
                      </>
                    )}
                  </div>
                )}
              </Form>
            )}
          </div>
        </div>

        {/* Conversation */}
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
            Conversation · {cr.messages.length}
          </div>
          <div
            style={{
              padding: 14,
              maxHeight: 460,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {cr.messages.length === 0 ? (
              <div style={{ fontSize: 12.5, color: c.textSubtle }}>
                No messages yet.
              </div>
            ) : (
              cr.messages.map((m) =>
                m.isSystemEvent ? (
                  <SystemRow key={m.id} m={m} c={c} />
                ) : (
                  <BubbleRow key={m.id} m={m} c={c} />
                ),
              )
            )}
          </div>
          <div
            style={{
              padding: 12,
              borderTop: `1px solid ${c.border}`,
              background: c.surfaceMuted,
              display: "flex",
              gap: 6,
            }}
          >
            <Input.TextArea
              rows={2}
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Reply…"
            />
            <Button
              type="primary"
              icon={<Send size={13} />}
              disabled={!replyBody.trim()}
              onClick={onReply}
            />
          </div>
        </div>
      </div>
    </>
  );
}

function BubbleRow({
  m,
  c,
}: {
  m: CrDetail["messages"][number];
  c: ReturnType<typeof palette>;
}) {
  const isStaff = m.authorType === "staff";
  const name =
    m.authorType === "portal"
      ? m.portalUserName || m.portalUserEmail || "Client"
      : m.staffUserName || "Team member";
  return (
    <div
      style={{
        display: "flex",
        flexDirection: isStaff ? "row-reverse" : "row",
        gap: 8,
      }}
    >
      <div
        style={{
          maxWidth: "85%",
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: 3,
          alignItems: isStaff ? "flex-end" : "flex-start",
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: c.textSubtle,
          }}
        >
          <strong style={{ color: c.text }}>{name}</strong> ·{" "}
          {new Date(m.createdAt).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
        <div
          style={{
            padding: "8px 10px",
            background: isStaff ? c.accentBg : c.surfaceMuted,
            border: `1px solid ${isStaff ? c.accentBorder : c.border}`,
            borderRadius: 8,
            color: c.text,
            fontSize: 13,
            lineHeight: 1.5,
            whiteSpace: "pre-wrap",
          }}
        >
          {m.body}
        </div>
      </div>
    </div>
  );
}

function SystemRow({
  m,
  c,
}: {
  m: CrDetail["messages"][number];
  c: ReturnType<typeof palette>;
}) {
  const desc =
    m.eventType === "status_change"
      ? `Status: ${prettify(m.eventFrom)} → ${prettify(m.eventTo)}`
      : m.eventType === "estimate_published"
      ? "Estimate published to client"
      : m.eventType === "estimate_updated"
      ? "Estimate updated"
      : m.eventType === "client_decision"
      ? m.body
      : m.eventType === "invoice_linked"
      ? `Invoice link ${m.eventTo ? "set" : "cleared"}`
      : m.eventType === "sprint_linked"
      ? `Sprint link ${m.eventTo ? "set" : "cleared"}`
      : m.eventType === "assignment"
      ? "Assignment changed"
      : m.eventType === "created_from_mom"
      ? m.body
      : m.eventType === "attachment_upload_failed"
      ? `Attachment upload failed${m.body ? `: ${m.body}` : ""}`
      : m.body || "System event";
  return (
    <div
      style={{
        textAlign: "center",
        fontSize: 11,
        color: c.textSubtle,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
      }}
    >
      <AlertTriangle size={11} />
      {desc}
    </div>
  );
}

function prettify(s: string | null) {
  if (!s) return "—";
  return s.replace(/_/g, " ");
}
