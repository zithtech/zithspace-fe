"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Input,
  Empty,
  Spin,
  Pagination,
  Select,
  Modal,
  Form,
  notification,
} from "antd";
import {
  Search,
  ChevronRight,
  Plus,
  MessageCircle,
  Paperclip,
  Upload,
  X,
  FileText,
  Send,
  AlertTriangle,
  Clock,
} from "lucide-react";
import {
  portalTicketService,
  PortalTicketListItem,
  PortalTicketMeta,
  TicketCategory,
  TicketPriority,
} from "@/services/portalTicketService";
import {
  p,
  TONE,
  CATEGORY_META,
  PRIORITY_META,
  STATUS_META,
  fmtRelative,
} from "./_ticketUi";
import { AttachmentPicker } from "@/app/portal/_components/AttachmentPicker";

const FILTER_TABS: { key: string; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "new", label: "New" },
  { key: "in_progress", label: "In progress" },
  { key: "waiting_on_client", label: "Waiting on you" },
  { key: "resolved", label: "Resolved" },
  { key: "closed", label: "Closed" },
];

const CATEGORY_OPTIONS: { value: TicketCategory; label: string }[] = [
  { value: "bug", label: "Bug" },
  { value: "enhancement", label: "Enhancement" },
  { value: "support", label: "Support" },
  { value: "infra", label: "Infra issue" },
  { value: "access", label: "Access request" },
  { value: "other", label: "Other" },
];

const PRIORITY_OPTIONS: { value: TicketPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

/* --------------------------------------------------------------- */

export default function PortalTicketsPage() {
  const [items, setItems] = useState<PortalTicketListItem[]>([]);
  const [meta, setMeta] = useState<PortalTicketMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const limit = 20;
  const [notify, contextHolder] = notification.useNotification();

  const load = async () => {
    setLoading(true);
    try {
      const res = await portalTicketService.list({
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

  const stats = useMemo(() => {
    const c = meta?.counts || ({} as Record<string, number>);
    const open =
      (c.new || 0) +
      (c.in_review || 0) +
      (c.in_progress || 0) +
      (c.waiting_on_client || 0);
    return {
      total: meta?.total || 0,
      open,
      waiting: c.waiting_on_client || 0,
      resolved: (c.resolved || 0) + (c.closed || 0),
    };
  }, [meta]);

  return (
    <div style={{ padding: "32px 40px 56px", maxWidth: 1280 }}>
      {contextHolder}

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          alignItems: "flex-start",
          flexWrap: "wrap",
          marginBottom: 24,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: p.textSubtle,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 6,
            }}
          >
            Zukvo · Support
          </div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: p.text,
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Tickets
          </h1>
          <div style={{ marginTop: 6, fontSize: 13.5, color: p.textMuted }}>
            Raise issues, request changes, and track resolution timelines with
            our team.
          </div>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 16px",
            background: p.text,
            color: "#ffffff",
            border: `1px solid ${p.text}`,
            borderRadius: 10,
            fontSize: 13.5,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <Plus size={15} />
          Raise ticket
        </button>
      </div>

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
          <SummaryCard label="Total" value={stats.total} tone="neutral" />
          <SummaryCard label="Open" value={stats.open} tone="accent" />
          <SummaryCard
            label="Waiting on you"
            value={stats.waiting}
            tone="warning"
          />
          <SummaryCard
            label="Resolved"
            value={stats.resolved}
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
                  padding: "7px 12px",
                  background: active ? p.text : p.surfaceElevated,
                  color: active ? "#ffffff" : p.textMuted,
                  border: `1px solid ${active ? p.text : p.border}`,
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
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
                        : p.neutralBg,
                      color: active ? "#ffffff" : p.textSubtle,
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
          placeholder="Search ticket # or subject…"
          style={{ width: 280 }}
        />
      </div>

      {/* List */}
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
                  ? `No tickets match "${search}".`
                  : status !== "ALL"
                  ? `No tickets in this status.`
                  : "No tickets raised yet."}
              </span>
            }
          />
          <div style={{ marginTop: 14 }}>
            <button
              onClick={() => setCreateOpen(true)}
              style={{
                padding: "8px 14px",
                background: p.text,
                color: "#ffffff",
                border: `1px solid ${p.text}`,
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Plus size={14} />
              Raise your first ticket
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
          {items.map((t, i) => (
            <TicketRow key={t.id} ticket={t} first={i === 0} />
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

      <RaiseTicketModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        notify={notify}
        onCreated={() => {
          setCreateOpen(false);
          setPage(1);
          load();
        }}
      />
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

function TicketRow({
  ticket,
  first,
}: {
  ticket: PortalTicketListItem;
  first: boolean;
}) {
  const [hover, setHover] = useState(false);
  const cat = CATEGORY_META[ticket.category] || CATEGORY_META.other;
  const pri = PRIORITY_META[ticket.priority] || PRIORITY_META.medium;
  const st = STATUS_META[ticket.status] || STATUS_META.new;
  const StIcon = st.icon;
  const CatIcon = cat.icon;

  const slaBreach =
    ticket.sla.firstResponseBreached || ticket.sla.resolutionBreached;

  return (
    <Link
      href={`/portal/tickets/${ticket.id}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "44px minmax(0, 1fr) 130px 110px 110px 36px",
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
      {/* Category icon */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 9,
          background: TONE[cat.tone].bg,
          border: `1px solid ${TONE[cat.tone].border}`,
          color: TONE[cat.tone].text,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CatIcon size={16} />
      </div>

      {/* Subject + meta */}
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
            {ticket.ticketNumber}
          </span>
          <span
            style={{
              fontSize: 13.5,
              fontWeight: 600,
              color: p.text,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={ticket.subject}
          >
            {ticket.subject}
          </span>
          {slaBreach && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "1px 7px",
                fontSize: 10.5,
                fontWeight: 600,
                background: p.dangerBg,
                border: `1px solid ${p.dangerBorder}`,
                color: p.dangerText,
                borderRadius: 999,
              }}
            >
              <AlertTriangle size={10} />
              SLA breach
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
          <span>{cat.label}</span>
          {ticket.projectName && (
            <>
              <span style={{ color: p.textFaint }}>·</span>
              <span>{ticket.projectName}</span>
            </>
          )}
          <span style={{ color: p.textFaint }}>·</span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            <MessageCircle size={11} />
            {ticket.messageCount}
          </span>
        </div>
      </div>

      {/* Status */}
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

      {/* Priority */}
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

      {/* Last activity */}
      <div
        style={{
          fontSize: 12,
          color: p.textSubtle,
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <Clock size={11} />
        {fmtRelative(ticket.lastActivityAt)}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <ChevronRight size={16} color={p.textFaint} />
      </div>
    </Link>
  );
}

/* ====================================================================== */
/*  Raise Ticket modal                                                     */
/* ====================================================================== */

function RaiseTicketModal({
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
    portalTicketService
      .projectOptions()
      .then((list) => setProjects(list || []))
      .catch(() => setProjects([]));
    form.setFieldsValue({ category: "support", priority: "medium" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleFile = (f: File) => {
    if (f.size > 10 * 1024 * 1024) {
      notify.error({ message: `${f.name} exceeds 10 MB` });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFiles((prev) => [
        ...prev,
        { dataUrl: String(reader.result), name: f.name, size: f.size },
      ]);
    };
    reader.readAsDataURL(f);
  };

  const submit = async (values: any) => {
    setSubmitting(true);
    try {
      await portalTicketService.create({
        subject: values.subject.trim(),
        category: values.category,
        priority: values.priority,
        projectId: values.projectId || undefined,
        body: values.body.trim(),
        attachments: files.map((f) => ({
          dataUrl: f.dataUrl,
          fileName: f.name,
        })),
      });
      notify.success({ message: "Ticket raised" });
      onCreated();
    } catch (err: any) {
      notify.error({
        message: "Could not raise ticket",
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
      width={620}
      closable={false}
      styles={{
        mask: { backgroundColor: "rgba(15,23,42,0.45)" },
        content: {
          background: p.surfaceElevated,
          border: `1px solid ${p.border}`,
          padding: 0,
          overflow: "hidden",
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
            background: p.accentBg,
            color: p.accentText,
            border: `1px solid ${p.accentBorder}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Plus size={18} />
        </div>
        <div>
          <div style={{ fontSize: 15.5, fontWeight: 600, color: p.text }}>
            Raise a new ticket
          </div>
          <div
            style={{
              marginTop: 3,
              fontSize: 12.5,
              color: p.textSubtle,
            }}
          >
            We&apos;ll respond based on the priority you choose. Critical
            issues get a 1-hour first-response target.
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
              <span style={{ fontSize: 12.5, color: p.textMuted }}>Subject</span>
            }
            rules={[{ required: true, message: "Subject is required" }]}
          >
            <Input
              placeholder="Brief, specific summary (e.g. Login page returns 500)"
              maxLength={120}
              showCount
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
              name="category"
              label={
                <span style={{ fontSize: 12.5, color: p.textMuted }}>
                  Category
                </span>
              }
              rules={[{ required: true }]}
            >
              <Select options={CATEGORY_OPTIONS} />
            </Form.Item>
            <Form.Item
              name="priority"
              label={
                <span style={{ fontSize: 12.5, color: p.textMuted }}>
                  Priority
                </span>
              }
              rules={[{ required: true }]}
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
                options={projects.map((p) => ({
                  value: p.id,
                  label: p.code ? `${p.name} · ${p.code}` : p.name,
                }))}
              />
            </Form.Item>
          </div>

          <Form.Item
            name="body"
            label={
              <span style={{ fontSize: 12.5, color: p.textMuted }}>
                Details
              </span>
            }
            rules={[{ required: true, message: "Please describe the issue" }]}
          >
            <Input.TextArea
              rows={5}
              placeholder={
                "What did you expect to happen? What actually happened?\n\nSteps to reproduce, browser/device, URLs, screenshots help a lot."
              }
            />
          </Form.Item>

          {/* Attachments */}
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 12.5,
                color: p.textMuted,
                marginBottom: 6,
              }}
            >
              Attachments{" "}
              <span style={{ color: p.textFaint, fontSize: 11.5 }}>
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
                background: p.text,
                color: "#ffffff",
                border: `1px solid ${p.text}`,
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.6 : 1,
              }}
            >
              <Send size={13} />
              {submitting ? "Submitting…" : "Submit ticket"}
            </button>
          </div>
        </Form>
      </div>
    </Modal>
  );
}

