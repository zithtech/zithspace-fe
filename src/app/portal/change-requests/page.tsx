"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Input,
  Empty,
  Spin,
  Pagination,
  Modal,
  Form,
  Select,
  notification,
  Row,
  Col,
  Divider,
  Typography,
} from "antd";
import { PullRequestOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;
import {
  Search,
  Plus,
  GitPullRequest,
  ChevronRight,
  MessageCircle,
  Send,
  Receipt,
  Calendar,
  Clock,
} from "lucide-react";
import {
  portalCrService,
  PortalCrListItem,
  PortalCrMeta,
  CrPriority,
} from "@/services/portalCrService";
import {
  p,
  TONE,
  STATUS_META,
  PRIORITY_META,
  fmtCurrency,
  fmtRelative,
  fmtDate,
} from "./_crUi";
import { AttachmentPicker } from "@/app/portal/_components/AttachmentPicker";

const FILTER_TABS: { key: string; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "submitted", label: "Submitted" },
  { key: "estimated", label: "Estimate ready" },
  { key: "approved", label: "Approved" },
  { key: "in_progress", label: "In progress" },
  { key: "delivered", label: "Delivered" },
  { key: "rejected", label: "Rejected" },
];

const PRIORITY_OPTIONS: { value: CrPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

/* --------------------------------------------------------------- */

export default function PortalCrListPage() {
  const [items, setItems] = useState<PortalCrListItem[]>([]);
  const [meta, setMeta] = useState<PortalCrMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [notify, contextHolder] = notification.useNotification();
  const limit = 20;

  const load = async () => {
    setLoading(true);
    try {
      const res = await portalCrService.list({
        page,
        limit,
        status: status === "ALL" ? undefined : status,
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
  }, [page, status]);
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const summary = useMemo(() => {
    const c = meta?.counts || ({} as Record<string, number>);
    return {
      total: meta?.total || 0,
      awaiting: c.estimated || 0,
      inFlight:
        (c.approved || 0) +
        (c.scheduled || 0) +
        (c.in_progress || 0),
      delivered: c.delivered || 0,
    };
  }, [meta]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#ffffff" }}>
      {contextHolder}

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
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
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
                  <PullRequestOutlined style={{ fontSize: 18, color: "#3b82f6" }} />
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
                  Change requests
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
                  Request a scope change, see our impact and cost estimate, and approve or reject before work starts.
                </Text>
              </div>
            </div>
          </Col>

          <Col flex="0 0 auto">
            <Row gutter={8} align="middle">
              <Col>
                <button
                  onClick={() => setCreateOpen(true)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 14px",
                    background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 2px 4px rgba(99, 102, 241, 0.1)",
                    transition: "all 0.2s ease",
                  }}
                >
                  <Plus size={14} />
                  New change request
                </button>
              </Col>
            </Row>
          </Col>
        </Row>
      </div>

      {/* Content Container */}
      <div style={{ padding: "16px 40px 56px", width: "100%", boxSizing: "border-box" }}>
        {/* Summary strip */}
        {(meta?.total || 0) > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 12,
              marginBottom: 18,
            }}
          >
            <SummaryCard label="Total" value={summary.total} tone="neutral" />
            <SummaryCard
              label="Awaiting your decision"
              value={summary.awaiting}
              tone="warning"
            />
            <SummaryCard
              label="In flight"
              value={summary.inFlight}
              tone="accent"
            />
            <SummaryCard
              label="Delivered"
              value={summary.delivered}
              tone="success"
            />
          </div>
        )}

        {/* Filter row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {FILTER_TABS.map((tab) => {
              const active = status === tab.key;
              const count =
                tab.key === "ALL" ? meta?.total : meta?.counts?.[tab.key as never];
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    setStatus(tab.key);
                    setPage(1);
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 14px",
                    backgroundColor: active ? "#4f46e5" : "#ffffff",
                    color: active ? "#ffffff" : "#475569",
                    border: "1px solid",
                    borderColor: active ? "#4f46e5" : "#e2e8f0",
                    borderRadius: 999,
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  {tab.label}
                  {count != null && count > 0 && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "1px 7px",
                        borderRadius: 999,
                        background: active
                          ? "rgba(255,255,255,0.15)"
                          : "#f1f5f9",
                        color: active ? "#ffffff" : "#64748b",
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <Input
            allowClear
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            prefix={<Search size={14} color={p.textFaint} />}
            placeholder="Search CR # or subject…"
            style={{ width: 280 }}
          />
        </div>

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
                  {search
                    ? `No change requests match "${search}".`
                    : status !== "ALL"
                    ? "Nothing in this status."
                    : "No change requests yet."}
                </span>
              }
            />
            <div style={{ marginTop: 14 }}>
              <button
                onClick={() => setCreateOpen(true)}
                style={{
                  padding: "8px 14px",
                  background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 2px 4px rgba(99, 102, 241, 0.1)",
                }}
              >
                <Plus size={14} />
                Raise your first CR
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              background: p.surfaceElevated,
              border: `1px solid ${p.border}`,
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            {items.map((cr, i) => (
              <CrRow key={cr.id} cr={cr} first={i === 0} />
            ))}
          </div>
        )}

        {meta && meta.total > limit && (
          <div
            style={{
              marginTop: 16,
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

        <RaiseCrModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          notify={notify}
          onCreated={() => {
            setCreateOpen(false);
            setPage(1);
            load();
          }}
        />

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
          
          /* Form Inputs and Select elements styling overrides */
          .ant-input, .ant-select-selector, .ant-input-affix-wrapper {
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

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "accent" | "success" | "warning" | "neutral";
}) {
  const t = TONE[tone];
  return (
    <div
      style={{
        padding: "16px 18px",
        background: p.surfaceElevated,
        border: `1px solid ${p.border}`,
        borderRadius: 12,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: p.textSubtle,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 24,
          fontWeight: 600,
          color: p.text,
          letterSpacing: "-0.01em",
        }}
      >
        {value}
      </div>
      <div
        style={{
          marginTop: 6,
          display: "inline-block",
          padding: "2px 8px",
          fontSize: 11.5,
          fontWeight: 500,
          background: t.bg,
          border: `1px solid ${t.border}`,
          color: t.text,
          borderRadius: 999,
        }}
      >
        {label.toLowerCase()}
      </div>
    </div>
  );
}

function CrRow({
  cr,
  first,
}: {
  cr: PortalCrListItem;
  first: boolean;
}) {
  const [hover, setHover] = useState(false);
  const st = STATUS_META[cr.status] || STATUS_META.submitted;
  const pri = PRIORITY_META[cr.priority] || PRIORITY_META.medium;
  const StIcon = st.icon;
  const awaitingDecision = cr.status === "estimated" && !cr.clientDecision;

  const estimateText = cr.estimatedCost
    ? fmtCurrency(cr.estimatedCost, cr.estimatedCurrency)
    : cr.estimatedHoursMin || cr.estimatedHoursMax
    ? `${cr.estimatedHoursMin || "?"}–${cr.estimatedHoursMax || "?"} h`
    : "—";

  return (
    <Link
      href={`/portal/change-requests/${cr.id}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "44px minmax(0, 1.4fr) 140px 110px 110px 30px",
        gap: 14,
        padding: "16px 18px",
        borderTop: first ? "none" : `1px solid ${p.border}`,
        background: hover ? p.surfaceMuted : "transparent",
        textDecoration: "none",
        color: "inherit",
        transition: "background 120ms ease",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 9,
          background: p.purpleBg,
          border: `1px solid ${p.purpleBorder}`,
          color: p.purpleText,
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
              background: p.surfaceMuted,
              border: `1px solid ${p.border}`,
              borderRadius: 6,
              color: p.textMuted,
            }}
          >
            {cr.crNumber}
          </span>
          <span
            style={{
              fontSize: 13.5,
              fontWeight: 600,
              color: p.text,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {cr.subject}
          </span>
          {awaitingDecision && (
            <span
              style={{
                padding: "1px 7px",
                fontSize: 10.5,
                fontWeight: 600,
                background: p.warningBg,
                border: `1px solid ${p.warningBorder}`,
                color: p.warningText,
                borderRadius: 999,
              }}
            >
              Awaiting your decision
            </span>
          )}
        </div>
        <div
          style={{
            marginTop: 4,
            fontSize: 12,
            color: p.textSubtle,
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {cr.projectName && <span>{cr.projectName}</span>}
          {cr.linkedInvoiceNumber && (
            <>
              <span style={{ color: p.textFaint }}>·</span>
              <span
                style={{ display: "inline-flex", gap: 3, alignItems: "center" }}
              >
                <Receipt size={11} />
                {cr.linkedInvoiceNumber}
              </span>
            </>
          )}
          {cr.targetDeliveryDate && (
            <>
              <span style={{ color: p.textFaint }}>·</span>
              <span
                style={{ display: "inline-flex", gap: 3, alignItems: "center" }}
              >
                <Calendar size={11} />
                {fmtDate(cr.targetDeliveryDate)}
              </span>
            </>
          )}
          <span style={{ color: p.textFaint }}>·</span>
          <span style={{ display: "inline-flex", gap: 3, alignItems: "center" }}>
            <MessageCircle size={11} />
            {cr.messageCount}
          </span>
          <span style={{ color: p.textFaint }}>·</span>
          <span style={{ display: "inline-flex", gap: 3, alignItems: "center" }}>
            <Clock size={11} />
            {fmtRelative(cr.lastActivityAt)}
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
            background: TONE[st.tone].bg,
            border: `1px solid ${TONE[st.tone].border}`,
            color: TONE[st.tone].text,
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
            background: TONE[pri.tone].bg,
            border: `1px solid ${TONE[pri.tone].border}`,
            color: TONE[pri.tone].text,
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
          color: p.text,
          fontWeight: 600,
          fontVariantNumeric: "tabular-nums",
          textAlign: "right",
        }}
      >
        {estimateText}
      </div>
      <ChevronRight size={16} color={p.textFaint} />
    </Link>
  );
}

/* --------------------------------------------------------------- */

function RaiseCrModal({
  open,
  onClose,
  onCreated,
  notify,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  notify: any;
}) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<
    { dataUrl: string; name: string; size: number }[]
  >([]);
  const [projects, setProjects] = useState<
    { id: string; name: string; code: string | null }[]
  >([]);

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setFiles([]);
      return;
    }
    portalCrService
      .projectOptions()
      .then((ps) => setProjects(ps || []))
      .catch(() => setProjects([]));
    form.setFieldsValue({ priority: "medium" });
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
    setSubmitting(true);
    try {
      await portalCrService.create({
        subject: values.subject.trim(),
        description: values.description.trim(),
        priority: values.priority,
        projectId: values.projectId || undefined,
        attachments: files.map((f) => ({
          dataUrl: f.dataUrl,
          fileName: f.name,
        })),
      });
      notify.success({ message: "Change request submitted" });
      onCreated();
    } catch (err: any) {
      notify.error({ message: "Submit failed", description: err?.message });
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
      width={620}
      closable={false}
      styles={{
        mask: { backgroundColor: "rgba(15,23,42,0.45)" },
        content: {
          background: p.surfaceElevated,
          border: `1px solid ${p.border}`,
          padding: 0,
        },
        body: { padding: 0 },
      }}
    >
      <div
        style={{
          padding: "20px 24px 16px",
          borderBottom: `1px solid ${p.border}`,
          display: "flex",
          gap: 14,
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 9,
            background: p.purpleBg,
            color: p.purpleText,
            border: `1px solid ${p.purpleBorder}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <GitPullRequest size={18} />
        </div>
        <div>
          <div style={{ fontSize: 15.5, fontWeight: 600, color: p.text }}>
            Raise a change request
          </div>
          <div
            style={{
              marginTop: 3,
              fontSize: 12.5,
              color: p.textSubtle,
            }}
          >
            Tell us what you&apos;d like to change. We&apos;ll come back with
            an impact analysis, time and cost estimate for you to approve.
          </div>
        </div>
      </div>

      <div style={{ padding: 22 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={submit}
          requiredMark={false}
        >
          <Form.Item
            name="subject"
            label={
              <span style={{ fontSize: 12.5, color: p.textMuted }}>
                Subject
              </span>
            }
            rules={[{ required: true, message: "Subject is required" }]}
          >
            <Input
              placeholder="Short summary (e.g. Add bulk-export to admin)"
              maxLength={200}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label={
              <span style={{ fontSize: 12.5, color: p.textMuted }}>
                What would you like changed?
              </span>
            }
            rules={[{ required: true, message: "Description is required" }]}
          >
            <Input.TextArea
              rows={5}
              placeholder="Describe the change. Why it matters, who needs it, any references…"
            />
          </Form.Item>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            <Form.Item
              name="priority"
              label={
                <span style={{ fontSize: 12.5, color: p.textMuted }}>
                  Priority
                </span>
              }
            >
              <Select options={PRIORITY_OPTIONS} />
            </Form.Item>
            <Form.Item
              name="projectId"
              label={
                <span style={{ fontSize: 12.5, color: p.textMuted }}>
                  Project (optional)
                </span>
              }
            >
              <Select
                allowClear
                placeholder="—"
                options={projects.map((pr) => ({
                  value: pr.id,
                  label: pr.code ? `${pr.name} · ${pr.code}` : pr.name,
                }))}
              />
            </Form.Item>
          </div>

          <div style={{ marginBottom: 18, marginTop: 10 }}>
            <div
              style={{
                fontSize: 12.5,
                color: p.textMuted,
                marginBottom: 10,
              }}
            >
              Attachments
              <span style={{ color: p.textFaint, fontSize: 11.5 }}>
                {" "}
                · optional · 10 MB each
              </span>
            </div>
            <AttachmentPicker
              files={files}
              onAdd={handleFile}
              onRemove={(i) =>
                setFiles((prev) => prev.filter((_, idx) => idx !== i))
              }
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 18,
              paddingTop: 14,
              borderTop: `1px solid ${p.border}`,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 14px",
                background: "#ffffff",
                border: `1px solid ${p.border}`,
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                color: p.textMuted,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.6 : 1,
                boxShadow: "0 2px 4px rgba(99, 102, 241, 0.1)",
              }}
            >
              <Send size={13} />
              {submitting ? "Submitting…" : "Submit"}
            </button>
          </div>
        </Form>
      </div>
    </Modal>
  );
}
