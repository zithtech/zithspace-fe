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
} from "antd";
import {
  Plus,
  CheckSquare,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  Hourglass,
  Ban,
  Users,
  Link2,
  Send,
  Trash2,
  ExternalLink,
  FileText,
  Download,
  Upload as UploadIcon,
  X,
  Calendar,
} from "lucide-react";
import dayjs from "dayjs";
import {
  approvalsService,
  ApprovalListItem,
  ApprovalDetail,
  ApprovalSubjectType,
  CreateApprovalPayload,
} from "@/services/approvalsService";
import { clientPortalService } from "@/services/clientPortalService";
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

const STATUS_META: Record<
  string,
  { label: string; tone: keyof ReturnType<typeof tonesOf>; icon: any }
> = {
  open: { label: "Open", tone: "warning", icon: Hourglass },
  approved: { label: "Approved", tone: "success", icon: CheckCircle2 },
  rejected: { label: "Rejected", tone: "danger", icon: XCircle },
  cancelled: { label: "Cancelled", tone: "neutral", icon: Ban },
  expired: { label: "Expired", tone: "neutral", icon: Clock },
};
const SUBJECT_LABEL: Record<string, string> = {
  design: "Design",
  requirement: "Requirement",
  sprint: "Sprint signoff",
  uat: "UAT signoff",
  production_release: "Production release",
  cr: "Change request",
  invoice: "Invoice",
  document: "Document",
  custom: "Custom",
};
const SUBJECT_OPTIONS: { value: ApprovalSubjectType; label: string }[] = (
  Object.keys(SUBJECT_LABEL) as ApprovalSubjectType[]
).map((k) => ({ value: k, label: SUBJECT_LABEL[k] }));

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

/* --------------------------------------------------------------- */

interface Props {
  clientId: string;
  projects?: { id: string; name: string; code?: string | null }[];
  onRefresh?: () => void;
}

export default function ApprovalsTab({ clientId, projects = [] }: Props) {
  const { theme } = useTheme();
  const c = useMemo(() => palette(theme as Mode), [theme]);
  const tones = useMemo(() => tonesOf(c), [c]);

  const [items, setItems] = useState<ApprovalListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [notify, contextHolder] = notification.useNotification();

  const load = async () => {
    setLoading(true);
    try {
      setItems(await approvalsService.listForClient(clientId));
    } catch (err: any) {
      notify.error({
        message: "Failed to load approvals",
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
      <div className="approvals-header-wrap" style={{ margin: "0 -32px" }}>
        <TimeTrackingHeader
          icon={<CheckSquare size={20} color="#3b82f6" />}
          title="Approvals"
          description="Request explicit client sign-off on designs, requirements, deliverables or releases."
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
              Request approval
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
            <CheckSquare size={22} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: c.text }}>
            No approvals requested yet
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
            Capture sign-off before delivery so there are no disputes later.
          </div>
          <div style={{ marginTop: 18 }}>
            <Button
              type="primary"
              icon={<Plus size={15} />}
              onClick={() => setCreateOpen(true)}
            >
              Request first approval
            </Button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((a) => (
            <ApprovalRow
              key={a.id}
              row={a}
              c={c}
              tones={tones}
              onOpen={() => setOpenId(a.id)}
            />
          ))}
        </div>
      )}
      </div>

      <CreateApprovalModal
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

      <ApprovalDetailDrawer
        id={openId}
        c={c}
        tones={tones}
        clientId={clientId}
        notify={notify}
        onClose={() => setOpenId(null)}
        onMutated={load}
      />

      {/* Premium adaptive header styling */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* Full bleed header styling flush with vertical sidebar border */
        .approvals-header-wrap {
          margin-bottom: 24px !important;
          display: block !important;
        }
        .approvals-header-wrap .saas-header-container {
          margin-left: -32px !important;
          margin-right: -32px !important;
          padding-left: 32px !important;
          padding-right: 32px !important;
          padding-top: 10px !important;
          padding-bottom: 12px !important;
          margin-bottom: 0 !important;
        }
        @media (max-width: 900px) {
          .approvals-header-wrap .saas-header-container {
            margin-left: -20px !important;
            margin-right: -20px !important;
            padding-left: 20px !important;
            padding-right: 20px !important;
          }
        }
        @media (max-width: 720px) {
          .approvals-header-wrap .saas-header-container {
            margin-left: -16px !important;
            margin-right: -16px !important;
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
        }

        /* Force header elements to stay on the exact same line, overriding TimeTrackingHeader media query */
        @media (max-width: 1200px) {
          html body .approvals-header-wrap .saas-header-container .saas-header-row {
            flex-wrap: nowrap !important;
          }
          html body .approvals-header-wrap .saas-header-container .saas-header-left-col {
            width: auto !important;
            flex: 1 1 auto !important;
            min-width: 0 !important;
          }
          html body .approvals-header-wrap .saas-header-container .saas-header-extra-col {
            width: auto !important;
            flex: 0 0 auto !important;
            margin-top: 0 !important;
          }
          html body .approvals-header-wrap .saas-header-container .saas-header-left-group {
            flex-direction: row !important;
            align-items: center !important;
            gap: 16px !important;
          }
          html body .approvals-header-wrap .saas-header-container .bh-header-divider {
            display: inline-block !important;
          }
        }
      `}} />
    </div>
  );
}

/* --------------------------------------------------------------- */

function ApprovalRow({
  row,
  c,
  tones,
  onOpen,
}: {
  row: ApprovalListItem;
  c: ReturnType<typeof palette>;
  tones: ReturnType<typeof tonesOf>;
  onOpen: () => void;
}) {
  const [hover, setHover] = useState(false);
  const st = STATUS_META[row.status] || STATUS_META.open;
  const StIcon = st.icon;

  const progress =
    row.requiredCount > 0
      ? `${row.approvedCount}/${row.requiredCount} signed off`
      : "—";

  return (
    <button
      onClick={onOpen}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "44px minmax(0, 1.6fr) 130px 130px 130px 30px",
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
          background: c.accentBg,
          border: `1px solid ${c.accentBorder}`,
          color: c.accentText,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CheckSquare size={16} />
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
            {row.approvalNumber}
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
            {row.title}
          </span>
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
          <span
            style={{
              padding: "1px 7px",
              background: c.purpleBg,
              border: `1px solid ${c.purpleBorder}`,
              color: c.purpleText,
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 500,
            }}
          >
            {SUBJECT_LABEL[row.subjectType] || row.subjectType}
          </span>
          {row.subjectLabel && (
            <>
              <span style={{ color: c.textFaint }}>·</span>
              <span style={{ minWidth: 0 }}>{row.subjectLabel}</span>
            </>
          )}
          {row.projectName && (
            <>
              <span style={{ color: c.textFaint }}>·</span>
              <span>{row.projectName}</span>
            </>
          )}
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
      <div style={{ fontSize: 12, color: c.textMuted, fontWeight: 500 }}>
        {progress}
        {row.rejectedCount > 0 && (
          <span style={{ color: c.dangerText, marginLeft: 6 }}>
            · {row.rejectedCount} rejected
          </span>
        )}
      </div>
      <div style={{ fontSize: 12, color: c.textSubtle }}>
        {row.dueDate ? `Due ${fmtDate(row.dueDate)}` : fmtDate(row.createdAt)}
      </div>
      <ChevronRight size={16} color={c.textFaint} />
    </button>
  );
}

/* --------------------------------------------------------------- */

function CreateApprovalModal({
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
  const [portalUsers, setPortalUsers] = useState<
    { id: string; displayName: string | null; email: string; status: string }[]
  >([]);
  const [approverIds, setApproverIds] = useState<string[]>([]);
  const [files, setFiles] = useState<
    { dataUrl: string; name: string; size: number }[]
  >([]);

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setApproverIds([]);
      setFiles([]);
      return;
    }
    form.setFieldsValue({
      subjectType: "design",
    });
    clientPortalService
      .listForClient(clientId)
      .then((list) =>
        setPortalUsers(
          (list || [])
            .filter((u: any) => u.status === "active")
            .map((u: any) => ({
              id: u.id,
              displayName: u.displayName,
              email: u.email,
              status: u.status,
            })),
        ),
      )
      .catch(() => setPortalUsers([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleFile = (f: File) => {
    if (f.size > 10 * 1024 * 1024) {
      notify.error({ message: `${f.name} exceeds 10 MB` });
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      setFiles((prev) => [
        ...prev,
        { dataUrl: String(reader.result), name: f.name, size: f.size },
      ]);
    reader.readAsDataURL(f);
  };

  const submit = async (values: any) => {
    if (approverIds.length === 0) {
      notify.error({ message: "Pick at least one approver" });
      return;
    }
    setSubmitting(true);
    try {
      const payload: CreateApprovalPayload = {
        title: values.title.trim(),
        subjectType: values.subjectType,
        subjectLabel: values.subjectLabel || undefined,
        projectId: values.projectId || undefined,
        description: values.description || undefined,
        previewUrl: values.previewUrl || undefined,
        dueDate: values.dueDate
          ? dayjs(values.dueDate).toISOString()
          : undefined,
        expiresAt: values.expiresAt
          ? dayjs(values.expiresAt).toISOString()
          : undefined,
        approvers: approverIds.map((portalUserId) => ({
          approverType: "portal",
          portalUserId,
          required: true,
        })),
        attachments: files.map((f) => ({
          dataUrl: f.dataUrl,
          fileName: f.name,
        })),
      };
      await approvalsService.create(clientId, payload);
      notify.success({ message: "Approval request sent" });
      onCreated();
    } catch (err: any) {
      notify.error({
        message: "Could not create approval",
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
      ribbonColor={c.accentText}
      iconTile={{ bg: c.accentBg, border: c.accentBorder, text: c.accentText }}
      icon={<CheckSquare size={20} />}
      title="Request an approval"
      subtitle="Pick what needs sign-off and who must approve. Every decision is logged for the audit trail."
      tip={
        <span>
          All required approvers must approve before the request is closed.
          Any rejection from a required approver flips the whole request to{" "}
          <strong>rejected</strong>.
        </span>
      }
      footer={
        <ModalFooterActions c={c} kbdHint="⌘ ↵ to send">
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            onClick={() => form.submit()}
            icon={<Send size={14} />}
          >
            Send to approvers
          </Button>
        </ModalFooterActions>
      }
    >
      <Form form={form} layout="vertical" onFinish={submit} requiredMark={false}>
        <ModalSection
          c={c}
          title="What needs approval"
          description="Subject + project + a clear ask. Add a preview URL so reviewers can decide quickly."
          icon={<CheckSquare size={11} />}
          plain
        >
          <Form.Item
            name="title"
            label={<L c={c}>Title</L>}
            rules={[{ required: true, message: "Title is required" }]}
            style={{ marginBottom: 12 }}
          >
            <Input
              prefix={<CheckSquare size={13} color={c.textFaint} />}
              placeholder="e.g. Approve homepage design v3"
              maxLength={200}
            />
          </Form.Item>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.4fr 1fr",
              gap: 10,
            }}
          >
            <Form.Item
              name="subjectType"
              label={<L c={c}>Type</L>}
              rules={[{ required: true }]}
              style={{ marginBottom: 12 }}
            >
              <Select options={SUBJECT_OPTIONS} />
            </Form.Item>
            <Form.Item
              name="subjectLabel"
              label={<L c={c} hint="optional">Subject label</L>}
              style={{ marginBottom: 12 }}
            >
              <Input placeholder="e.g. Homepage v3" maxLength={200} />
            </Form.Item>
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
          </div>

          <Form.Item
            name="description"
            label={<L c={c}>What are they approving?</L>}
            style={{ marginBottom: 12 }}
          >
            <Input.TextArea
              rows={3}
              placeholder="Describe what the approver should review and confirm…"
            />
          </Form.Item>

          <Form.Item
            name="previewUrl"
            label={
              <L c={c} hint="Figma · Loom · staging URL">
                Preview URL
              </L>
            }
            style={{ marginBottom: 0 }}
          >
            <Input
              prefix={<Link2 size={13} color={c.textFaint} />}
              placeholder="https://…"
            />
          </Form.Item>
        </ModalSection>

        <ModalSection
          c={c}
          title="Required approvers"
          description="At least one portal user. Each must approve for the request to close."
          icon={<Users size={11} />}
        >
          <Select
            mode="multiple"
            placeholder="Pick portal users who must approve"
            value={approverIds}
            onChange={setApproverIds}
            style={{ width: "100%" }}
            options={portalUsers.map((u) => ({
              value: u.id,
              label: (
                <span>
                  {u.displayName || u.email}
                  <span
                    style={{
                      color: c.textSubtle,
                      marginLeft: 6,
                      fontSize: 11.5,
                    }}
                  >
                    {u.email}
                  </span>
                </span>
              ),
            }))}
            notFoundContent={
              <div
                style={{
                  padding: 12,
                  fontSize: 12,
                  color: c.textSubtle,
                  textAlign: "center",
                }}
              >
                No active portal users for this client. Create credentials in
                the Portal Access tab first.
              </div>
            }
          />
        </ModalSection>

        <ModalSection
          c={c}
          title="Timing & attachments"
          description="When approval is needed and any supporting files (mocks, specs, PDFs)."
          icon={<Clock size={11} />}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              marginBottom: 12,
            }}
          >
            <Form.Item
              name="dueDate"
              label={<L c={c} hint="soft target">Due by</L>}
              style={{ marginBottom: 0 }}
            >
              <DatePicker
                showTime
                needConfirm={false}
                style={{ width: "100%" }}
                format="YYYY-MM-DD HH:mm"
              />
            </Form.Item>
            <Form.Item
              name="expiresAt"
              label={<L c={c} hint="hard cutoff">Expires</L>}
              style={{ marginBottom: 0 }}
            >
              <DatePicker
                showTime
                needConfirm={false}
                style={{ width: "100%" }}
                format="YYYY-MM-DD HH:mm"
              />
            </Form.Item>
          </div>
          <AttachmentBox
            c={c}
            files={files}
            onAdd={handleFile}
            onRemove={(i) =>
              setFiles((prev) => prev.filter((_, idx) => idx !== i))
            }
          />
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

function AttachmentBox({
  c,
  files,
  onAdd,
  onRemove,
}: {
  c: ReturnType<typeof palette>;
  files: { name: string; size: number }[];
  onAdd: (f: File) => void;
  onRemove: (i: number) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        multiple
        style={{ marginBottom: 12 }}
        onChange={(e) => {
          const fs = e.target.files;
          if (!fs) return;
          for (let i = 0; i < fs.length; i++) onAdd(fs[i]);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        style={{
          width: "100%",
          padding: 14,
          background: c.surfaceMuted,
          border: `1px dashed ${c.borderStrong}`,
          borderRadius: 10,
          cursor: "pointer",
          color: c.textMuted,
          fontSize: 12.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <UploadIcon size={14} />
        Click to attach files
      </button>
      {files.length > 0 && (
        <div
          style={{
            marginTop: 8,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {files.map((f, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                padding: "8px 10px",
                background: c.surfaceMuted,
                border: `1px solid ${c.border}`,
                borderRadius: 8,
                fontSize: 12.5,
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  minWidth: 0,
                }}
              >
                <FileText size={13} color={c.textSubtle} />
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {f.name}
                </span>
                <span style={{ color: c.textFaint, fontSize: 11 }}>
                  · {(f.size / 1024).toFixed(1)} KB
                </span>
              </span>
              <button
                type="button"
                onClick={() => onRemove(i)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: c.textSubtle,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ====================================================================== */
/*  Detail drawer                                                          */
/* ====================================================================== */

function ApprovalDetailDrawer({
  id,
  c,
  tones,
  clientId,
  notify,
  onClose,
  onMutated,
}: {
  id: string | null;
  c: ReturnType<typeof palette>;
  tones: ReturnType<typeof tonesOf>;
  clientId: string;
  notify: any;
  onClose: () => void;
  onMutated: () => void;
}) {
  const [data, setData] = useState<ApprovalDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [addingPortalUserId, setAddingPortalUserId] = useState<string | null>(
    null,
  );
  const [portalUsers, setPortalUsers] = useState<
    { id: string; displayName: string | null; email: string }[]
  >([]);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      setData(await approvalsService.detail(id));
    } catch (err: any) {
      notify.error({ message: "Failed to load", description: err?.message });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    setData(null);
    if (id) {
      load();
      clientPortalService
        .listForClient(clientId)
        .then((list) =>
          setPortalUsers(
            (list || [])
              .filter((u: any) => u.status === "active")
              .map((u: any) => ({
                id: u.id,
                displayName: u.displayName,
                email: u.email,
              })),
          ),
        )
        .catch(() => setPortalUsers([]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const addApprover = async () => {
    if (!data || !addingPortalUserId) return;
    try {
      await approvalsService.addApprover(data.id, {
        approverType: "portal",
        portalUserId: addingPortalUserId,
        required: true,
      });
      setAddingPortalUserId(null);
      load();
      onMutated();
    } catch (err: any) {
      notify.error({
        message: "Could not add approver",
        description: err?.message,
      });
    }
  };
  const removeApprover = async (approverId: string) => {
    if (!data) return;
    try {
      await approvalsService.removeApprover(data.id, approverId);
      load();
      onMutated();
    } catch (err: any) {
      notify.error({ message: "Remove failed", description: err?.message });
    }
  };
  const cancel = async () => {
    if (!data) return;
    try {
      await approvalsService.cancel(data.id);
      load();
      onMutated();
    } catch (err: any) {
      notify.error({ message: "Cancel failed", description: err?.message });
    }
  };

  const availableToAdd = useMemo(() => {
    if (!data) return [] as typeof portalUsers;
    const taken = new Set(
      data.approvers
        .filter((a) => a.approverType === "portal" && a.portalUserId)
        .map((a) => a.portalUserId as string),
    );
    return portalUsers.filter((u) => !taken.has(u.id));
  }, [portalUsers, data]);

  return (
    <Drawer
      open={!!id}
      onClose={onClose}
      width={720}
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
                background: c.accentBg,
                border: `1px solid ${c.accentBorder}`,
                color: c.accentText,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <CheckSquare size={18} />
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
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, monospace",
                    fontSize: 11.5,
                    padding: "1px 7px",
                    background: c.surfaceMuted,
                    border: `1px solid ${c.border}`,
                    borderRadius: 6,
                    color: c.textMuted,
                  }}
                >
                  {data.approvalNumber}
                </span>
                <StatusPill status={data.status} tones={tones} />
                <span
                  style={{
                    padding: "2px 9px",
                    background: c.purpleBg,
                    border: `1px solid ${c.purpleBorder}`,
                    color: c.purpleText,
                    borderRadius: 999,
                    fontSize: 11.5,
                    fontWeight: 500,
                  }}
                >
                  {SUBJECT_LABEL[data.subjectType] || data.subjectType}
                </span>
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
                {data.title}
              </h2>
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  fontSize: 12.5,
                  color: c.textSubtle,
                }}
              >
                {data.projectName && <span>📁 {data.projectName}</span>}
                {data.dueDate && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    <Calendar size={11} />
                    Due {fmtDateTime(data.dueDate)}
                  </span>
                )}
                {data.expiresAt && (
                  <span style={{ color: c.warningText, fontWeight: 500 }}>
                    Expires {fmtDateTime(data.expiresAt)}
                  </span>
                )}
              </div>
            </div>
            {data.status === "open" && (
              <Popconfirm
                title="Cancel this approval?"
                description="Approvers will see it marked cancelled. Pending decisions are discarded."
                onConfirm={cancel}
                okText="Cancel approval"
                okButtonProps={{ danger: true }}
              >
                <Button size="small" danger>
                  Cancel
                </Button>
              </Popconfirm>
            )}
          </div>

          {/* Body */}
          <div
            style={{
              padding: 22,
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            {data.description && (
              <Section c={c} title="Description">
                <div
                  style={{
                    fontSize: 13.5,
                    color: c.textMuted,
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.6,
                  }}
                >
                  {data.description}
                </div>
              </Section>
            )}
            {data.previewUrl && (
              <Section c={c} title="Preview">
                <a
                  href={data.previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 10px",
                    background: c.accentBg,
                    border: `1px solid ${c.accentBorder}`,
                    borderRadius: 8,
                    color: c.accentText,
                    fontSize: 12.5,
                    textDecoration: "none",
                    fontWeight: 500,
                  }}
                >
                  <Link2 size={12} />
                  Open preview
                  <ExternalLink size={11} />
                </a>
              </Section>
            )}

            {data.attachments.length > 0 && (
              <Section c={c} title={`Attachments · ${data.attachments.length}`}>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                  }}
                >
                  {data.attachments.map((a) => (
                    <a
                      key={a.id}
                      href={a.file_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "5px 10px",
                        background: c.surfaceMuted,
                        border: `1px solid ${c.border}`,
                        borderRadius: 7,
                        color: c.accentText,
                        textDecoration: "none",
                        fontSize: 12,
                      }}
                    >
                      <FileText size={12} />
                      {a.file_name}
                      <Download size={11} />
                    </a>
                  ))}
                </div>
              </Section>
            )}

            {/* Approvers */}
            <Section
              c={c}
              title={`Approvers · ${data.approvers.length}`}
              right={
                data.status === "open" && availableToAdd.length > 0 ? (
                  <div style={{ display: "flex", gap: 6 }}>
                    <Select
                      size="small"
                      placeholder="Add approver"
                      value={addingPortalUserId || undefined}
                      onChange={(v) => setAddingPortalUserId(v)}
                      style={{ width: 200 }}
                      options={availableToAdd.map((u) => ({
                        value: u.id,
                        label: u.displayName || u.email,
                      }))}
                    />
                    <Button
                      size="small"
                      type="primary"
                      icon={<Plus size={12} />}
                      disabled={!addingPortalUserId}
                      onClick={addApprover}
                    >
                      Add
                    </Button>
                  </div>
                ) : null
              }
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {data.approvers.map((ap) => {
                  const decisionTone =
                    ap.decision === "approved"
                      ? tones.success
                      : ap.decision === "rejected"
                      ? tones.danger
                      : tones.warning;
                  const name =
                    ap.portalUserName ||
                    ap.portalUserEmail ||
                    ap.staffUserName ||
                    "?";
                  return (
                    <div
                      key={ap.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        padding: "10px 12px",
                        background: c.surfaceMuted,
                        border: `1px solid ${c.border}`,
                        borderRadius: 9,
                      }}
                    >
                      <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 7,
                            background: c.purpleBg,
                            border: `1px solid ${c.purpleBorder}`,
                            color: c.purpleText,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {name
                            .split(" ")
                            .map((s) => s[0])
                            .filter(Boolean)
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 500,
                              color: c.text,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {name}
                            {ap.required ? (
                              <span
                                style={{
                                  marginLeft: 6,
                                  fontSize: 10.5,
                                  fontWeight: 500,
                                  padding: "0px 6px",
                                  background: c.dangerBg,
                                  border: `1px solid ${c.dangerBorder}`,
                                  color: c.dangerText,
                                  borderRadius: 999,
                                }}
                              >
                                required
                              </span>
                            ) : null}
                          </div>
                          {ap.portalUserEmail && (
                            <div
                              style={{
                                fontSize: 11.5,
                                color: c.textSubtle,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {ap.portalUserEmail}
                            </div>
                          )}
                          {ap.decisionNote && (
                            <div
                              style={{
                                marginTop: 4,
                                fontSize: 11.5,
                                color: c.textMuted,
                                fontStyle: "italic",
                              }}
                            >
                              &ldquo;{ap.decisionNote}&rdquo;
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "3px 9px",
                            background: decisionTone.bg,
                            border: `1px solid ${decisionTone.border}`,
                            color: decisionTone.text,
                            borderRadius: 999,
                            fontSize: 11.5,
                            fontWeight: 500,
                          }}
                        >
                          {ap.decision === "approved" ? (
                            <CheckCircle2 size={11} />
                          ) : ap.decision === "rejected" ? (
                            <XCircle size={11} />
                          ) : (
                            <Hourglass size={11} />
                          )}
                          {ap.decision === "approved"
                            ? `Approved ${fmtRelative(ap.decidedAt)}`
                            : ap.decision === "rejected"
                            ? `Rejected ${fmtRelative(ap.decidedAt)}`
                            : "Pending"}
                        </span>
                        {!ap.decision && data.status === "open" && (
                          <Tooltip title="Remove approver">
                            <Button
                              size="small"
                              icon={<Trash2 size={12} />}
                              onClick={() => removeApprover(ap.id)}
                            />
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>

            {/* Audit trail */}
            <Section c={c} title={`Audit trail · ${data.events.length}`}>
              {data.events.length === 0 ? (
                <div style={{ fontSize: 12.5, color: c.textSubtle }}>
                  No events yet.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {data.events.map((e) => (
                    <div
                      key={e.id}
                      style={{
                        fontSize: 12,
                        color: c.textMuted,
                        padding: "4px 0",
                      }}
                    >
                      <span style={{ color: c.text, fontWeight: 500 }}>
                        {describeEvent(e)}
                      </span>
                      <span style={{ color: c.textFaint }}>
                        {" "}— {fmtDateTime(e.createdAt)}
                        {e.actorPortalName
                          ? ` · ${e.actorPortalName}`
                          : e.actorStaffName
                          ? ` · ${e.actorStaffName}`
                          : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>
        </>
      )}
    </Drawer>
  );
}

function describeEvent(e: any): string {
  switch (e.eventType) {
    case "created":
      return "Approval requested";
    case "approver_added":
      return "Approver added";
    case "approver_removed":
      return "Approver removed";
    case "approver_decision":
      return `Approver ${e.payload?.decision || "decided"}`;
    case "cancelled":
      return "Cancelled";
    case "attachment_upload_failed":
      return "Attachment upload failed";
    default:
      return e.eventType;
  }
}

function StatusPill({
  status,
  tones,
}: {
  status: string;
  tones: ReturnType<typeof tonesOf>;
}) {
  const st = STATUS_META[status] || STATUS_META.open;
  const Icon = st.icon;
  return (
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
      <Icon size={11} />
      {st.label}
    </span>
  );
}

function Section({
  c,
  title,
  right,
  children,
}: {
  c: ReturnType<typeof palette>;
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: c.textSubtle,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <span>{title}</span>
        {right}
      </div>
      {children}
    </div>
  );
}

function fmtRelative(iso: string | null) {
  if (!iso) return "";
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
