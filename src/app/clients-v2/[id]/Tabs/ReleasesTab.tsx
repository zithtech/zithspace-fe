"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Drawer,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Popconfirm,
  Tooltip,
} from "antd";
import {
  Plus,
  Rocket,
  Calendar,
  Flag,
  Edit3,
  Trash2,
  Tag,
  FolderKanban,
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react";
import dayjs from "dayjs";
import {
  releaseService,
  ClientRelease,
  MilestoneOption,
  CreateReleasePayload,
} from "@/services/releaseService";
import { useTheme } from "@/context/ThemeContext";
import { ModalSection } from "./_PremiumModal";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";
import TiptapEditor from "@/components/common/TiptapEditor";

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
    purpleBg: dark ? "rgba(139,92,246,0.12)" : "#f5f3ff",
    purpleBorder: dark ? "rgba(139,92,246,0.35)" : "#ddd6fe",
    purpleText: dark ? "#c4b5fd" : "#6d28d9",
    overlay: dark ? "rgba(0,0,0,0.7)" : "rgba(15,23,42,0.45)",
  };
};

function fmtDate(iso: string | null | undefined): string {
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

/* --------------------------------------------------------------- */

interface Props {
  clientId: string;
  projects?: { id: string; name: string; code?: string | null }[];
  onRefresh?: () => void;
}

export default function ReleasesTab({ clientId, projects = [] }: Props) {
  const { theme } = useTheme();
  const c = useMemo(() => palette(theme as Mode), [theme]);

  const [items, setItems] = useState<ClientRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<ClientRelease | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const load = async () => {
    setLoading(true);
    try {
      setItems(await releaseService.list(clientId));
    } catch (err: any) {
      messageApi.error(`Failed to load releases: ${err?.message || ""}`);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const remove = async (r: ClientRelease) => {
    try {
      await releaseService.remove(r.id);
      messageApi.success("Release removed");
      load();
    } catch (err: any) {
      messageApi.error(`Delete failed: ${err?.message || ""}`);
    }
  };

  return (
    <div style={{ padding: "4px 0 24px", color: c.text }}>
      {contextHolder}

      {/* Header */}
      <div className="releases-header-wrap" style={{ margin: "0 -32px" }}>
        <TimeTrackingHeader
          icon={<Rocket size={20} color="#3b82f6" />}
          title="Releases"
          description="Shipped versions, the milestone they belong to, and what changed."
          extra={
            <Button
              type="primary"
              icon={<Plus size={15} />}
              onClick={() => {
                setEditing(null);
                setCreateOpen(true);
              }}
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
              Add release
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
          <EmptyState
            c={c}
            onAdd={() => {
              setEditing(null);
              setCreateOpen(true);
            }}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {items.map((r) => (
              <ReleaseCard
                key={r.id}
                release={r}
                c={c}
                onEdit={() => {
                  setEditing(r);
                  setCreateOpen(true);
                }}
                onRemove={() => remove(r)}
              />
            ))}
          </div>
        )}
      </div>

      <ReleaseModal
        open={createOpen}
        editing={editing}
        clientId={clientId}
        projects={projects}
        onClose={() => {
          setCreateOpen(false);
          setEditing(null);
        }}
        onSaved={() => {
          setCreateOpen(false);
          setEditing(null);
          load();
        }}
        c={c}
        messageApi={messageApi}
      />

      <style dangerouslySetInnerHTML={{
        __html: `
        .releases-header-wrap {
          margin-bottom: 24px !important;
          display: block !important;
        }
        .releases-header-wrap .saas-header-container {
          margin-left: -32px !important;
          margin-right: -32px !important;
          padding-left: 32px !important;
          padding-right: 32px !important;
          padding-top: 10px !important;
          padding-bottom: 12px !important;
          margin-bottom: 0 !important;
        }
        @media (max-width: 900px) {
          .releases-header-wrap .saas-header-container {
            margin-left: -20px !important;
            margin-right: -20px !important;
            padding-left: 20px !important;
            padding-right: 20px !important;
          }
        }
        @media (max-width: 720px) {
          .releases-header-wrap .saas-header-container {
            margin-left: -16px !important;
            margin-right: -16px !important;
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
        }
        @media (max-width: 1200px) {
          html body .releases-header-wrap .saas-header-container .saas-header-row {
            flex-wrap: nowrap !important;
          }
          html body .releases-header-wrap .saas-header-container .saas-header-left-col {
            width: auto !important;
            flex: 1 1 auto !important;
            min-width: 0 !important;
          }
          html body .releases-header-wrap .saas-header-container .saas-header-extra-col {
            width: auto !important;
            flex: 0 0 auto !important;
            margin-top: 0 !important;
          }
          html body .releases-header-wrap .saas-header-container .saas-header-left-group {
            flex-direction: row !important;
            align-items: center !important;
            gap: 16px !important;
          }
          html body .releases-header-wrap .saas-header-container .bh-header-divider {
            display: inline-block !important;
          }
        }
        .release-description-body img {
          max-width: 100%;
          height: auto;
          border-radius: 6px;
        }
        .release-description-body p {
          margin: 0 0 8px 0;
        }
        .release-description-body p:last-child {
          margin-bottom: 0;
        }
        .release-description-body ul,
        .release-description-body ol {
          padding-left: 22px;
          margin: 0 0 8px 0;
        }
      `}} />
    </div>
  );
}

/* --------------------------------------------------------------- */

function EmptyState({
  c,
  onAdd,
}: {
  c: ReturnType<typeof palette>;
  onAdd: () => void;
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
        <Rocket size={22} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: c.text }}>
        No releases yet
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
        Log each version you ship — title, what's in it, and the milestone it
        belongs to.
      </div>
      <div style={{ marginTop: 18 }}>
        <Button type="primary" icon={<Plus size={15} />} onClick={onAdd}>
          Add first release
        </Button>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- */

function ReleaseCard({
  release,
  c,
  onEdit,
  onRemove,
}: {
  release: ClientRelease;
  c: ReturnType<typeof palette>;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        background: c.surfaceElevated,
        border: `1px solid ${c.border}`,
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      {/* Top row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "16px 18px",
          cursor: "pointer",
        }}
        onClick={() => setOpen((o) => !o)}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: c.accentBg,
            color: c.accentText,
            border: `1px solid ${c.accentBorder}`,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Rocket size={17} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: 14.5,
                fontWeight: 600,
                color: c.text,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: 480,
              }}
            >
              {release.title}
            </span>
            {release.version && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "1px 8px",
                  background: c.purpleBg,
                  border: `1px solid ${c.purpleBorder}`,
                  color: c.purpleText,
                  borderRadius: 999,
                  fontSize: 10.5,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                }}
              >
                <Tag size={10} />
                {release.version}
              </span>
            )}
            {release.milestoneName && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  color: c.textSubtle,
                }}
              >
                <Flag size={11} />
                {release.milestoneName}
              </span>
            )}
            {release.projectName && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  color: c.textSubtle,
                }}
              >
                <FolderKanban size={11} />
                {release.projectName}
              </span>
            )}
          </div>
          <div
            style={{
              marginTop: 6,
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              fontSize: 11.5,
              color: c.textSubtle,
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Calendar size={11} />
              Released {fmtDate(release.releaseDate)}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <Tooltip title="Edit">
            <Button
              size="small"
              type="text"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              icon={<Edit3 size={13} color={c.textSubtle} />}
            />
          </Tooltip>
          <Popconfirm
            title="Remove release?"
            onConfirm={(e: any) => {
              e?.stopPropagation?.();
              onRemove();
            }}
            okText="Remove"
            okButtonProps={{ danger: true }}
          >
            <Button
              size="small"
              type="text"
              onClick={(e) => e.stopPropagation()}
              icon={<Trash2 size={13} color={c.textSubtle} />}
            />
          </Popconfirm>
          <Button
            size="small"
            type="text"
            onClick={(e) => {
              e.stopPropagation();
              setOpen((o) => !o);
            }}
            icon={
              open ? (
                <ChevronDown size={14} color={c.textSubtle} />
              ) : (
                <ChevronRight size={14} color={c.textSubtle} />
              )
            }
          />
        </div>
      </div>

      {/* Expanded body */}
      {open && (
        <div
          style={{
            padding: "14px 18px 18px",
            borderTop: `1px solid ${c.border}`,
          }}
        >
          {release.description ? (
            <div
              className="release-description-body"
              style={{
                padding: "12px 14px",
                background: c.surfaceMuted,
                border: `1px solid ${c.border}`,
                borderRadius: 8,
                fontSize: 13,
                color: c.textMuted,
                lineHeight: 1.6,
              }}
              dangerouslySetInnerHTML={{ __html: release.description }}
            />
          ) : (
            <div style={{ fontSize: 12, color: c.textFaint }}>
              No description.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- */

function ReleaseModal({
  open,
  editing,
  clientId,
  projects,
  onClose,
  onSaved,
  c,
  messageApi,
}: {
  open: boolean;
  editing: ClientRelease | null;
  clientId: string;
  projects: { id: string; name: string; code?: string | null }[];
  onClose: () => void;
  onSaved: () => void;
  c: ReturnType<typeof palette>;
  messageApi: any;
}) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [milestones, setMilestones] = useState<MilestoneOption[]>([]);
  const [loadingMilestones, setLoadingMilestones] = useState(false);
  const [descHtml, setDescHtml] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(
    undefined,
  );

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setDescHtml("");
      setSelectedProjectId(undefined);
      return;
    }
    let cancelled = false;
    setLoadingMilestones(true);
    releaseService
      .milestoneOptions(clientId)
      .then((opts) => {
        if (cancelled) return;
        // Always include the editing release's milestone even if completed
        if (
          editing?.milestoneId &&
          !opts.find((o) => o.id === editing.milestoneId)
        ) {
          opts = [
            ...opts,
            {
              id: editing.milestoneId,
              name: editing.milestoneName || "(milestone)",
              status: editing.milestoneStatus || "",
              projectId: editing.projectId,
              projectName: editing.projectName,
            },
          ];
        }
        setMilestones(opts);
      })
      .catch((err: any) => {
        messageApi.error(`Failed to load milestones: ${err?.message || ""}`);
      })
      .finally(() => {
        if (!cancelled) setLoadingMilestones(false);
      });

    if (editing) {
      setDescHtml(editing.description || "");
      setSelectedProjectId(editing.projectId || undefined);
      form.setFieldsValue({
        title: editing.title,
        version: editing.version || undefined,
        releaseDate: editing.releaseDate ? dayjs(editing.releaseDate) : null,
        projectId: editing.projectId || undefined,
        milestoneId: editing.milestoneId || undefined,
        description: editing.description || "",
      });
    } else {
      setDescHtml("");
      setSelectedProjectId(undefined);
      form.setFieldsValue({
        releaseDate: dayjs(),
      });
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing, clientId]);

  const filteredMilestones = useMemo(() => {
    if (!selectedProjectId) return milestones;
    return milestones.filter((m) => m.projectId === selectedProjectId);
  }, [milestones, selectedProjectId]);

  const onProjectChange = (next: string | undefined) => {
    setSelectedProjectId(next);
    const currentMs = form.getFieldValue("milestoneId");
    if (currentMs) {
      const stillValid =
        !next ||
        milestones.find((m) => m.id === currentMs && m.projectId === next);
      if (!stillValid) form.setFieldValue("milestoneId", undefined);
    }
  };

  const submit = async (v: any) => {
    setSubmitting(true);
    try {
      const payload: CreateReleasePayload = {
        title: v.title.trim(),
        version: v.version?.trim() || undefined,
        description: descHtml?.trim() || undefined,
        releaseDate: v.releaseDate ? v.releaseDate.format("YYYY-MM-DD") : null,
        projectId: v.projectId || null,
        milestoneId: v.milestoneId || null,
      };
      if (editing) {
        await releaseService.update(editing.id, payload);
        messageApi.success("Release updated");
      } else {
        await releaseService.create(clientId, payload);
        messageApi.success("Release created");
      }
      onSaved();
    } catch (err: any) {
      messageApi.error(`Save failed: ${err?.message || ""}`);
    } finally {
      setSubmitting(false);
    }
  };

  const title = editing ? "Edit release" : "Add release";
  const subtitle = editing
    ? "Update the release details. The full description supports rich text."
    : "Log a new version. Pick the milestone it ships under and describe what changed.";

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={760}
      title={null}
      closable={false}
      destroyOnClose
      styles={{
        mask: { backgroundColor: c.overlay },
        content: { background: c.surfaceElevated },
        header: { display: "none" },
        body: {
          padding: 0,
          background: c.surfaceElevated,
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* Custom header */}
      <div
        style={{
          padding: "18px 22px",
          borderBottom: `1px solid ${c.border}`,
          display: "flex",
          alignItems: "flex-start",
          gap: 14,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: c.accentBg,
            color: c.accentText,
            border: `1px solid ${c.accentBorder}`,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Rocket size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: c.text,
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: 12.5,
              color: c.textSubtle,
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </div>
        </div>
        <Button
          type="text"
          onClick={onClose}
          icon={<X size={16} color={c.textSubtle} />}
          style={{ marginTop: -4 }}
          aria-label="Close"
        />
      </div>

      {/* Scrollable body */}
      <div
        style={{
          padding: 22,
          flex: 1,
          overflowY: "auto",
        }}
      >
      <Form form={form} layout="vertical" onFinish={submit} requiredMark={false}>
        <ModalSection
          c={c}
          title="What ships"
          description="Title and version, plus the milestone this release belongs to."
          icon={<Rocket size={11} />}
          plain
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.6fr 1fr",
              gap: 10,
              marginBottom: 12,
            }}
          >
            <Form.Item
              name="title"
              label={<L c={c}>Title</L>}
              rules={[{ required: true, message: "Required" }]}
              style={{ marginBottom: 0 }}
            >
              <Input placeholder="e.g. Payments hardening" maxLength={200} />
            </Form.Item>
            <Form.Item
              name="version"
              label={<L c={c}>Version</L>}
              style={{ marginBottom: 0 }}
            >
              <Input placeholder="e.g. v1.2.0" maxLength={64} />
            </Form.Item>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              marginBottom: 12,
            }}
          >
            <Form.Item
              name="projectId"
              label={<L c={c}>Project</L>}
              style={{ marginBottom: 0 }}
            >
              <Select
                allowClear
                placeholder={
                  projects.length === 0 ? "No projects linked" : "Select project"
                }
                disabled={projects.length === 0}
                showSearch
                optionFilterProp="label"
                onChange={(v) => onProjectChange(v)}
                onClear={() => onProjectChange(undefined)}
                options={projects.map((p) => ({
                  value: p.id,
                  label: p.code ? `${p.name} · ${p.code}` : p.name,
                }))}
              />
            </Form.Item>
            <Form.Item
              name="releaseDate"
              label={<L c={c}>Release date</L>}
              style={{ marginBottom: 0 }}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </div>

          <Form.Item
            name="milestoneId"
            label={<L c={c}>Milestone</L>}
            style={{ marginBottom: 4 }}
          >
            <Select
              allowClear
              placeholder={
                loadingMilestones
                  ? "Loading…"
                  : selectedProjectId
                    ? "Select milestone for this project"
                    : "Select milestone"
              }
              loading={loadingMilestones}
              showSearch
              optionFilterProp="label"
              options={filteredMilestones.map((m) => ({
                value: m.id,
                label: m.projectName ? `${m.name} · ${m.projectName}` : m.name,
              }))}
              notFoundContent={
                loadingMilestones
                  ? "Loading…"
                  : selectedProjectId
                    ? "No active milestones for this project"
                    : "No active milestones"
              }
            />
          </Form.Item>
        </ModalSection>

        <ModalSection
          c={c}
          title="Description"
          description="Release notes — what changed, why, and anything the client should know."
          icon={<Flag size={11} />}
        >
          <Form.Item name="description" style={{ marginBottom: 0 }}>
            <TiptapEditor
              content={descHtml}
              onChange={(html) => {
                setDescHtml(html);
                form.setFieldValue("description", html);
              }}
              minHeight={220}
              maxHeight={420}
            />
          </Form.Item>
        </ModalSection>
      </Form>
      </div>

      {/* Sticky footer */}
      <div
        style={{
          padding: "14px 22px",
          borderTop: `1px solid ${c.border}`,
          background: c.surfaceElevated,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 8,
          flexShrink: 0,
        }}
      >
        <Button onClick={onClose}>Cancel</Button>
        <Button
          type="primary"
          htmlType="submit"
          loading={submitting}
          onClick={() => form.submit()}
          icon={<Plus size={14} />}
        >
          {editing ? "Save changes" : "Create release"}
        </Button>
      </div>
    </Drawer>
  );
}

/* --------------------------------------------------------------- */

function L({
  c,
  children,
}: {
  c: ReturnType<typeof palette>;
  children: React.ReactNode;
}) {
  return (
    <span style={{ fontSize: 12.5, color: c.textMuted, fontWeight: 500 }}>
      {children}
    </span>
  );
}
