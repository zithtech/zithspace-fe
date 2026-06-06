"use client";
import React, { useEffect, useMemo, useState } from "react";

import {
  Modal,
  Form,
  Input,
  ColorPicker,
  Typography,
  App,
  Tooltip,
} from "antd";
import {
  FolderOpenOutlined,
  FileTextOutlined,
  GlobalOutlined,
  LockOutlined,
  EditOutlined,
  CheckOutlined,
  BgColorsOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useUserProjects } from "@/hooks/useGlobalData";
import { useCreateBucket, useUpdateBucket } from "@/hooks/useBuckets";
import type { Bucket } from "@/services/bucketService";
import {
  SearchableDropdown,
  SearchableDropdownOption,
} from "@/components/common/SearchableDropdown";
import type { Color } from "antd/es/color-picker";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface CreateBucketModalProps {
  open: boolean;
  bucket?: Bucket | null;
  onClose: () => void;
  onSuccess: () => void;
}

const PRESET_SWATCHES = [
  "#3b82f6",
  "#6366f1",
  "#3b82f6",
  "#06b6d4",
  "#10b981",
  "#84cc16",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#64748b",
];

export function CreateBucketModal({
  open,
  bucket,
  onClose,
  onSuccess,
}: CreateBucketModalProps) {
  const { message: messageApi } = App.useApp();
  const [form] = Form.useForm();
  const { data: projects = [], isLoading: projectsLoading } = useUserProjects();

  const createBucket = useCreateBucket();
  const updateBucket = useUpdateBucket();

  const isEditing = !!bucket;

  // Only color is mirrored locally — it drives the header/stripe/button accents
  const [previewColor, setPreviewColor] = useState("#3b82f6");

  useEffect(() => {
    if (!open) return;
    if (bucket) {
      const projectId =
        typeof bucket.project === "string" ? bucket.project : bucket.project?.id;
      form.setFieldsValue({
        name: bucket.name,
        description: bucket.description,
        projectId,
        color: bucket.color || "#3b82f6",
        isShared: bucket.isShared ?? true,
      });
      setPreviewColor(bucket.color || "#3b82f6");
    } else {
      form.resetFields();
      form.setFieldsValue({ color: "#3b82f6", isShared: true });
      setPreviewColor("#3b82f6");
    }
  }, [open, bucket, form]);

  const projectOptions = useMemo<SearchableDropdownOption[]>(
    () =>
      projects.map((p: any) => ({
        value: p.value,
        label: p.label,
        description: p.code || undefined,
        badge: (
          <span
            className="cbm-proj-badge"
            style={{ background: previewColor + "14", color: previewColor, borderColor: previewColor + "44" }}
          >
            {(p.code || p.label || "?").charAt(0).toUpperCase()}
          </span>
        ),
      })),
    [projects, previewColor]
  );

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const colorValue =
        typeof values.color === "string"
          ? values.color
          : values.color?.toHexString?.() || "#3b82f6";

      const data = {
        name: values.name,
        description: values.description || "",
        projectId: values.projectId,
        color: colorValue,
        isShared: values.isShared ?? true,
      };

      if (isEditing && bucket) {
        await updateBucket.mutateAsync({ id: bucket.id, data });
        messageApi.success("Bucket updated");
      } else {
        await createBucket.mutateAsync(data);
        messageApi.success("Bucket created");
      }
      onSuccess();
    } catch (error: any) {
      if (error.errorFields) return;
      console.error("Failed to save bucket:", error);
      messageApi.error(error.message || "Failed to save bucket");
    }
  };

  const submitting = createBucket.isPending || updateBucket.isPending;

  return (
    <>
      <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        closable={false}
        width={620}
        centered
        maskClosable={false}
        className="cbm-modal"
        styles={{
          body: { padding: 0 },
          content: { padding: 0, overflow: "hidden", borderRadius: 16 },
        }}
      >
        {/* ── Header ──────────────────────────────────────── */}
        <header className="cbm-header" style={{ ["--accent" as any]: previewColor }}>
          <span className="cbm-header-stripe" style={{ background: previewColor }} />
          <div className="cbm-header-content">
            <div
              className="cbm-header-icon"
              style={{
                background: `linear-gradient(135deg, ${previewColor}22 0%, ${previewColor}3a 100%)`,
                color: previewColor,
                borderColor: `${previewColor}66`,
              }}
            >
              <FolderOpenOutlined />
            </div>
            <div className="cbm-header-text">
              <Title level={4} className="cbm-header-title">
                {isEditing ? "Configure bucket" : "Create new bucket"}
              </Title>
              <Text className="cbm-header-sub">
                {isEditing
                  ? "Update the name, scope, and visibility of this bucket."
                  : "Organize tickets across projects with a collaborative hub."}
              </Text>
            </div>
          </div>
          <button className="cbm-header-close" onClick={onClose} aria-label="Close">
            <CloseOutlined />
          </button>
        </header>

        {/* ── Form ────────────────────────────────────────── */}
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          initialValues={{ color: "#3b82f6", isShared: true }}
          onValuesChange={(changed, all) => {
            if ("color" in changed) {
              const c = changed.color;
              const hex =
                typeof c === "string" ? c : c?.toHexString?.() || all.color;
              if (hex) setPreviewColor(hex);
            }
          }}
          className="cbm-form"
        >
          {/* Section: Identity */}
          <div className="cbm-section">
            <div className="cbm-section-head">
              <span className="cbm-section-num">01</span>
              <div>
                <div className="cbm-section-title">Identity</div>
                <div className="cbm-section-sub">
                  Give the bucket a recognizable name and accent color.
                </div>
              </div>
            </div>

            <Form.Item
              label={<span className="cbm-label">Bucket name</span>}
              name="name"
              rules={[
                { required: true, message: "Bucket name is required" },
                { max: 100, message: "Name must be less than 100 characters" },
              ]}
            >
              <Input
                prefix={<EditOutlined style={{ color: "#94a3b8" }} />}
                placeholder="e.g. Q4 Performance Tickets"
                className="cbm-input"
              />
            </Form.Item>

            <Form.Item
              label={
                <span className="cbm-label">
                  <BgColorsOutlined style={{ fontSize: 10, marginRight: 5 }} />
                  Accent color
                </span>
              }
              name="color"
            >
              <ColorSwatchPicker />
            </Form.Item>
          </div>

          {/* Section: Project scope */}
          <div className="cbm-section">
            <div className="cbm-section-head">
              <span className="cbm-section-num">02</span>
              <div>
                <div className="cbm-section-title">Project scope</div>
                <div className="cbm-section-sub">
                  Pin this bucket to a project to share its sprint and team context.
                </div>
              </div>
            </div>
            <Form.Item
              label={<span className="cbm-label">Project</span>}
              name="projectId"
              rules={[{ required: true, message: "Project is required" }]}
            >
              <SearchableDropdown
                placeholder="Select a project"
                options={projectOptions}
                loading={projectsLoading}
                itemNoun="projects"
                width={420}
                style={{ height: 42, borderRadius: 8, width: "100%" }}
              />
            </Form.Item>
          </div>

          {/* Section: Description */}
          <div className="cbm-section">
            <div className="cbm-section-head">
              <span className="cbm-section-num">03</span>
              <div>
                <div className="cbm-section-title">Description</div>
                <div className="cbm-section-sub">
                  Optional context that appears on the bucket card and details view.
                </div>
              </div>
            </div>
            <Form.Item
              label={<span className="cbm-label">What is this bucket for?</span>}
              name="description"
              rules={[{ max: 500, message: "Description must be less than 500 characters" }]}
            >
              <TextArea
                rows={3}
                placeholder="Describe how this bucket should be used…"
                className="cbm-textarea"
              />
            </Form.Item>
          </div>

          {/* Section: Visibility */}
          <div className="cbm-section">
            <div className="cbm-section-head">
              <span className="cbm-section-num">04</span>
              <div>
                <div className="cbm-section-title">Visibility</div>
                <div className="cbm-section-sub">
                  Decide who can see and collaborate inside the bucket.
                </div>
              </div>
            </div>
            <Form.Item name="isShared" noStyle>
              <VisibilityChoice />
            </Form.Item>
          </div>
        </Form>

        {/* ── Footer ──────────────────────────────────────── */}
        <footer className="cbm-footer">
          <div className="cbm-footer-meta">
            <FileTextOutlined style={{ fontSize: 11 }} />
            <Text style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-slate-500)" }}>
              {isEditing
                ? "Changes apply immediately to all members."
                : "You can add members and tickets after creating."}
            </Text>
          </div>
          <div className="cbm-footer-actions">
            <button className="cbm-btn cbm-btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              className="cbm-btn cbm-btn-primary"
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                background: `linear-gradient(135deg, ${previewColor} 0%, ${previewColor}dd 100%)`,
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? (
                <span className="cbm-btn-dot-spinner" />
              ) : (
                <CheckOutlined style={{ fontSize: 12 }} />
              )}
              {isEditing ? "Save Changes" : "Create Bucket"}
            </button>
          </div>
        </footer>
      </Modal>

      <style jsx global>{`
        /* ── Modal shell ─────────────────────────────────── */
        .cbm-modal .ant-modal-content {
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
        }
        [data-theme="dark"] .cbm-modal .ant-modal-content {
          background: #0d1117 !important;
          border-color: #1f2937 !important;
        }

        /* ── Header ──────────────────────────────────────── */
        .cbm-header {
          position: relative;
          padding: 14px 22px 14px 26px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          border-bottom: 1px solid var(--border-slate-100);
        }
        [data-theme="dark"] .cbm-header {
          border-bottom-color: #1f2937 !important;
        }
        .cbm-header-stripe {
          position: absolute;
          left: 0;
          top: 12px;
          bottom: 12px;
          width: 3px;
          border-radius: 0 999px 999px 0;
          opacity: 0.85;
        }
        .cbm-header-content {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
        }
        .cbm-header-icon {
          width: 36px;
          height: 36px;
          border-radius: 9px;
          border: 1px solid;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          flex-shrink: 0;
        }
        .cbm-header-text {
          min-width: 0;
        }
        .cbm-header-title.ant-typography {
          margin: 0 !important;
          font-size: 15px !important;
          font-weight: 800 !important;
          letter-spacing: -0.02em;
          color: var(--text-slate-900);
          line-height: 1.25;
        }
        [data-theme="dark"] .cbm-header-title.ant-typography {
          color: #f1f5f9 !important;
        }
        .cbm-header-sub {
          font-size: 11.5px;
          color: var(--text-slate-500);
          font-weight: 500;
          line-height: 1.4;
        }
        .cbm-header-close {
          width: 28px;
          height: 28px;
          border-radius: 7px;
          background: transparent;
          border: 1px solid var(--border-slate-200);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: var(--text-slate-500);
          cursor: pointer;
          transition: color 0.12s ease, border-color 0.12s ease, background 0.12s ease;
          flex-shrink: 0;
        }
        .cbm-header-close:hover {
          color: var(--text-slate-900);
          border-color: var(--text-slate-400);
        }
        [data-theme="dark"] .cbm-header-close {
          border-color: #2d3748 !important;
          color: #94a3b8 !important;
        }

        /* ── Form ────────────────────────────────────────── */
        .cbm-form {
          padding: 8px 30px 0 30px;
          max-height: 56vh;
          overflow-y: auto;
        }
        .cbm-form::-webkit-scrollbar {
          width: 6px;
        }
        .cbm-form::-webkit-scrollbar-thumb {
          background: var(--border-slate-200);
          border-radius: 999px;
        }

        .cbm-section {
          padding: 14px 0;
          border-top: 1px solid var(--border-slate-100);
        }
        .cbm-section:first-of-type {
          border-top: none;
          padding-top: 8px;
        }
        [data-theme="dark"] .cbm-section {
          border-top-color: #1f2937 !important;
        }
        .cbm-section-head {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 12px;
        }
        .cbm-section-num {
          font-size: 10px;
          font-weight: 800;
          color: var(--text-slate-400);
          background: var(--bg-slate-50);
          border: 1px solid var(--border-slate-100);
          border-radius: 6px;
          padding: 3px 7px;
          letter-spacing: 0.05em;
          font-variant-numeric: tabular-nums;
          flex-shrink: 0;
        }
        [data-theme="dark"] .cbm-section-num {
          background: #1c232e !important;
          border-color: #2d3748 !important;
          color: #94a3b8 !important;
        }
        .cbm-section-title {
          font-size: 13.5px;
          font-weight: 800;
          color: var(--text-slate-900);
          letter-spacing: -0.015em;
        }
        [data-theme="dark"] .cbm-section-title {
          color: #f1f5f9 !important;
        }
        .cbm-section-sub {
          font-size: 11.5px;
          font-weight: 500;
          color: var(--text-slate-500);
          margin-top: 2px;
        }
        .cbm-label {
          font-size: 10px;
          font-weight: 800;
          color: var(--text-slate-500);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        [data-theme="dark"] .cbm-label {
          color: #94a3b8 !important;
        }
        .cbm-input.ant-input-affix-wrapper,
        .cbm-input {
          height: 42px;
          border-radius: 8px !important;
          font-size: 13px;
        }
        .cbm-textarea {
          border-radius: 8px !important;
          font-size: 13px;
          padding: 10px 12px;
        }

        /* SearchableDropdown tweak so it matches the input height */
        .cbm-modal .sd-trigger {
          height: 42px;
        }

        /* Project badge inside the SearchableDropdown options */
        .cbm-proj-badge {
          width: 22px;
          height: 22px;
          border-radius: 6px;
          border: 1px solid;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 800;
        }

        /* ── Color swatches ──────────────────────────────── */
        .cbm-swatches {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .cbm-swatch {
          width: 26px;
          height: 26px;
          border-radius: 8px;
          border: 2px solid transparent;
          cursor: pointer;
          padding: 0;
          background: transparent;
          position: relative;
          transition: transform 0.12s ease, border-color 0.12s ease;
        }
        .cbm-swatch:hover {
          transform: scale(1.08);
        }
        .cbm-swatch-inner {
          width: 100%;
          height: 100%;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 10px;
        }
        .cbm-swatch.active {
          border-color: var(--text-slate-900);
        }
        [data-theme="dark"] .cbm-swatch.active {
          border-color: #f1f5f9;
        }
        .cbm-swatch-custom {
          width: 26px;
          height: 26px;
          border-radius: 8px;
          border: 1px dashed var(--border-slate-300);
          background: var(--bg-slate-50);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: var(--text-slate-500);
          cursor: pointer;
          font-size: 11px;
        }
        [data-theme="dark"] .cbm-swatch-custom {
          background: #1c232e !important;
          border-color: #2d3748 !important;
          color: #94a3b8 !important;
        }
        .cbm-swatches .ant-color-picker-trigger {
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
          width: 26px !important;
          min-width: 26px !important;
          height: 26px !important;
          padding: 0 !important;
          border-radius: 8px !important;
        }

        /* ── Visibility choice cards ────────────────────── */
        .cbm-visibility {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }
        .cbm-vis-card {
          display: flex;
          gap: 12px;
          padding: 14px 14px;
          background: var(--bg-pure-white);
          border: 1.5px solid var(--border-slate-200);
          border-radius: 12px;
          cursor: pointer;
          text-align: left;
          transition: border-color 0.12s ease, background 0.12s ease;
          font-family: inherit;
        }
        .cbm-vis-card:hover {
          border-color: var(--text-slate-400);
        }
        [data-theme="dark"] .cbm-vis-card {
          background: #0d1117 !important;
          border-color: #2d3748 !important;
        }
        .cbm-vis-card.active {
          border-color: var(--accent, #3b82f6);
          background: var(--bg-slate-50);
        }
        [data-theme="dark"] .cbm-vis-card.active {
          background: #161b22 !important;
        }
        .cbm-vis-card-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          flex-shrink: 0;
        }
        .cbm-vis-card-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          font-weight: 800;
          color: var(--text-slate-900);
          letter-spacing: -0.005em;
        }
        [data-theme="dark"] .cbm-vis-card-title {
          color: #f1f5f9 !important;
        }
        .cbm-vis-card-check {
          margin-left: auto;
          width: 18px;
          height: 18px;
          border-radius: 999px;
          background: var(--accent, #3b82f6);
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
        }
        .cbm-vis-card-sub {
          font-size: 11.5px;
          color: var(--text-slate-500);
          margin-top: 3px;
          font-weight: 500;
          line-height: 1.45;
        }

        /* ── Footer ──────────────────────────────────────── */
        .cbm-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 16px 26px;
          border-top: 1px solid var(--border-slate-100);
          background: var(--bg-slate-50);
        }
        [data-theme="dark"] .cbm-footer {
          background: #0f1419 !important;
          border-top-color: #1f2937 !important;
        }
        .cbm-footer-meta {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--text-slate-500);
        }
        .cbm-footer-actions {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .cbm-btn {
          height: 38px;
          padding: 0 18px;
          border-radius: 9px;
          font-family: inherit;
          font-size: 12.5px;
          font-weight: 700;
          letter-spacing: -0.005em;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease;
        }
        .cbm-btn-ghost {
          background: transparent;
          border: 1px solid var(--border-slate-200);
          color: var(--text-slate-700);
        }
        .cbm-btn-ghost:hover {
          color: var(--text-slate-900);
          border-color: var(--text-slate-400);
        }
        [data-theme="dark"] .cbm-btn-ghost {
          border-color: #2d3748 !important;
          color: #cbd5e1 !important;
        }
        .cbm-btn-primary {
          color: #fff;
          border: none;
        }
        .cbm-btn-dot-spinner {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.6);
          border-top-color: #fff;
          animation: cbm-spin 0.7s linear infinite;
        }
        @keyframes cbm-spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}

/* ───────────────── Sub-components ───────────────── */

interface ControlledValue<T> {
  value?: T;
  onChange?: (v: T) => void;
}

function ColorSwatchPicker({ value, onChange }: ControlledValue<string | Color>) {
  const current =
    typeof value === "string" ? value : value?.toHexString?.() || "#3b82f6";
  return (
    <div className="cbm-swatches">
      {PRESET_SWATCHES.map((c) => (
        <Tooltip title={c} key={c}>
          <button
            type="button"
            className={`cbm-swatch ${current.toLowerCase() === c.toLowerCase() ? "active" : ""}`}
            onClick={() => onChange?.(c)}
          >
            <span className="cbm-swatch-inner" style={{ background: c }}>
              {current.toLowerCase() === c.toLowerCase() && (
                <CheckOutlined style={{ fontSize: 10, color: "#fff" }} />
              )}
            </span>
          </button>
        </Tooltip>
      ))}
      <ColorPicker
        value={current}
        onChange={(c) => onChange?.(c.toHexString())}
        size="small"
      >
        <Tooltip title="Custom color">
          <button type="button" className="cbm-swatch-custom" aria-label="Custom color">
            <BgColorsOutlined />
          </button>
        </Tooltip>
      </ColorPicker>
    </div>
  );
}

function VisibilityChoice({ value, onChange }: ControlledValue<boolean>) {
  const isShared = value !== false;
  const options = [
    {
      key: true,
      title: "Public",
      icon: <GlobalOutlined />,
      iconBg: "rgba(16,185,129,0.1)",
      iconColor: "#047857",
      iconBorder: "rgba(16,185,129,0.22)",
      accent: "#10b981",
      desc: "Anyone in the workspace can view and add tickets.",
    },
    {
      key: false,
      title: "Private",
      icon: <LockOutlined />,
      iconBg: "rgba(245,158,11,0.1)",
      iconColor: "#b45309",
      iconBorder: "rgba(245,158,11,0.22)",
      accent: "#f59e0b",
      desc: "Only invited members can see or edit this bucket.",
    },
  ] as const;
  return (
    <div className="cbm-visibility">
      {options.map((o) => {
        const active = isShared === o.key;
        return (
          <button
            key={String(o.key)}
            type="button"
            className={`cbm-vis-card ${active ? "active" : ""}`}
            style={active ? ({ ["--accent" as any]: o.accent }) : undefined}
            onClick={() => onChange?.(o.key)}
          >
            <div
              className="cbm-vis-card-icon"
              style={{
                background: o.iconBg,
                color: o.iconColor,
                border: `1px solid ${o.iconBorder}`,
              }}
            >
              {o.icon}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="cbm-vis-card-title">
                {o.title}
                {active && (
                  <span className="cbm-vis-card-check">
                    <CheckOutlined style={{ fontSize: 9 }} />
                  </span>
                )}
              </div>
              <div className="cbm-vis-card-sub">{o.desc}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
