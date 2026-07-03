"use client";

import React, { useState } from "react";
import {
  Button,
  ColorPicker,
  Drawer,
  Empty,
  Form,
  Input,
  Popconfirm,
  Skeleton,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
  App,
  theme as antdTheme,
  ConfigProvider,
  Tabs,
  Badge,
  Grid,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ThunderboltFilled,
  AppstoreFilled,
  StarFilled,
  BugFilled,
  CloseOutlined,
} from "@ant-design/icons";
import {
  useBugSeverityOptions,
  useBugTypeOptions,
  useCreateBugSeverity,
  useCreateBugType,
  useDeleteBugSeverity,
  useDeleteBugType,
  useUpdateBugSeverity,
  useUpdateBugType,
} from "@/hooks/useBugList";
import type { BugConfigOption } from "@/services/bugListService";
import { useTheme } from "@/context/ThemeContext";
import { usePermission } from "@/hooks/usePermission";

const { Text } = Typography;

type EditorKind = "severity" | "type";
type EditState =
  | { kind: EditorKind; option: BugConfigOption | null }
  | null;

type SectionKey = "severity" | "type";

const SECTIONS: {
  key: SectionKey;
  title: string;
  description: string;
  shortDescription: string;
  icon: React.ReactNode;
  accent: string;
  accentBg: string;
  accentFg: string;
}[] = [
    {
      key: "severity",
      title: "Severity",
      description:
        "Tenant-scoped severity options. Shown in the Capture Bug dropdown and the bug table.",
      shortDescription: "Triage levels for the bug list",
      icon: <ThunderboltFilled />,
      accent: "#ef4444",
      accentBg: "rgba(239,68,68,0.10)",
      accentFg: "#ef4444",
    },
    {
      key: "type",
      title: "Type",
      description:
        "Bug type taxonomy (UI / Functional / API by default — extend as needed).",
      shortDescription: "Categorize bugs by area",
      icon: <AppstoreFilled />,
      accent: "#8b5cf6",
      accentBg: "rgba(139,92,246,0.12)",
      accentFg: "#8b5cf6",
    },
  ];

export default function BugListConfigManager() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const severities = useBugSeverityOptions();
  const types = useBugTypeOptions();

  const createSeverity = useCreateBugSeverity();
  const updateSeverity = useUpdateBugSeverity();
  const deleteSeverity = useDeleteBugSeverity();

  const createType = useCreateBugType();
  const updateType = useUpdateBugType();
  const deleteType = useDeleteBugType();
  const { canCreateTicketSetting, canUpdateTicketSetting, canDeleteTicketSetting } = usePermission();
  const { useBreakpoint } = Grid;
  const screens = useBreakpoint();

  const [editing, setEditing] = useState<EditState>(null);
  const [activeKey, setActiveKey] = useState<SectionKey>("severity");

  const closeEditor = () => setEditing(null);

  const counts: Record<SectionKey, number> = {
    severity: severities.data?.length ?? 0,
    type: types.data?.length ?? 0,
  };
  const loadingMap: Record<SectionKey, boolean> = {
    severity: severities.isLoading,
    type: types.isLoading,
  };

  return (
    <>
      <BcmStyles />
      <div
        className={`bcm-root ${isDark ? "bcm-dark" : "bcm-light"}`}
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
      >
        <Tabs
          activeKey={activeKey}
          onChange={(key) => setActiveKey(key as SectionKey)}
          tabPosition={!screens.lg ? 'top' : 'left'}
          className="bcm-manager-tabs"
          style={{ flex: 1, height: '100%' }}
          items={SECTIONS.map((s) => ({
            key: s.key,
            label: (
              <div className="tab-label-container bcm-tab-item">
                <div className={`tab-icon-box ${activeKey === s.key ? 'active' : ''}`} style={{ color: s.accent }}>
                  {s.icon}
                </div>
                <div className="tab-text-box">
                  <div className="tab-title">{s.title}</div>
                  <div className="tab-subtitle-count">
                    <Badge
                      count={counts[s.key]}
                      size="small"
                      style={{
                        backgroundColor: activeKey === s.key ? s.accent : 'rgba(0,0,0,0.06)',
                        color: activeKey === s.key ? '#fff' : 'var(--text-secondary)',
                        fontSize: 10,
                        boxShadow: "none",
                        border: 'none'
                      }}
                    />
                    <span className="tab-subtitle-text" style={{ marginLeft: 6 }}>Definitions</span>
                  </div>
                </div>
              </div>
            ),
            children: (
              <div className="bcm-pane">
                <ConfigSection
                  key={s.key}
                  accent={s.accent}
                  accentBg={s.accentBg}
                  accentFg={s.accentFg}
                  icon={s.icon}
                  eyebrow="Bug List"
                  title={s.title}
                  description={s.description}
                  loading={loadingMap[s.key]}
                  options={
                    s.key === "severity"
                      ? severities.data || []
                      : types.data || []
                  }
                  showColor={s.key === "severity"}
                  onCreate={() => setEditing({ kind: s.key, option: null })}
                  onEdit={(o) => setEditing({ kind: s.key, option: o })}
                  onDelete={async (id) => {
                    try {
                      if (s.key === "severity") {
                        await deleteSeverity.mutateAsync(id);
                      } else {
                        await deleteType.mutateAsync(id);
                      }
                    } catch {
                      /* hook surfaces toast */
                    }
                  }}
                  onToggleActive={(o) => {
                    if (s.key === "severity") {
                      updateSeverity.mutate({
                        id: o.id,
                        input: { isActive: !o.isActive },
                      });
                    } else {
                      updateType.mutate({
                        id: o.id,
                        input: { isActive: !o.isActive },
                      });
                    }
                  }}
                />
              </div>
            )
          }))}
        />
      </div>

      <OptionEditor
        editing={editing}
        isDark={isDark}
        onClose={closeEditor}
        onSubmit={async (kind, payload) => {
          try {
            if (kind === "severity") {
              if (editing?.kind === "severity" && editing.option) {
                await updateSeverity.mutateAsync({
                  id: editing.option.id,
                  input: payload,
                });
              } else {
                await createSeverity.mutateAsync(payload);
              }
            } else {
              if (editing?.kind === "type" && editing.option) {
                await updateType.mutateAsync({
                  id: editing.option.id,
                  input: payload,
                });
              } else {
                await createType.mutateAsync(payload);
              }
            }
            closeEditor();
          } catch {
            /* keep drawer open on error */
          }
        }}
        submitting={
          createSeverity.isPending ||
          updateSeverity.isPending ||
          createType.isPending ||
          updateType.isPending
        }
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Section
// ─────────────────────────────────────────────────────────────────────────

interface ConfigSectionProps {
  accent: string;
  accentBg: string;
  accentFg: string;
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  loading: boolean;
  options: BugConfigOption[];
  showColor: boolean;
  onCreate: () => void;
  onEdit: (o: BugConfigOption) => void;
  onDelete: (id: string) => Promise<void>;
  onToggleActive: (o: BugConfigOption) => void;
}

function ConfigSection({
  accent,
  accentBg,
  accentFg,
  icon,
  eyebrow,
  title,
  description,
  loading,
  options,
  showColor,
  onCreate,
  onEdit,
  onDelete,
  onToggleActive,
}: ConfigSectionProps) {
  const { canCreateTicketSetting, canUpdateTicketSetting, canDeleteTicketSetting } = usePermission();
  const columns: ColumnsType<BugConfigOption> = [
    {
      title: "Label",
      dataIndex: "label",
      width: 180,
      render: (_, row) => (
        <div className="bcm-label-row">
          {showColor && (
            <span
              className="bcm-color-swatch"
              style={
                {
                  background: row.color || "var(--bcm-muted-bg)",
                  ["--bcm-swatch-glow" as string]: row.color
                    ? `${row.color}1a`
                    : "transparent",
                } as React.CSSProperties
              }
            />
          )}
          <span className="bcm-label-text">{row.label}</span>
          {row.isDefault && (
            <span className="bcm-default-tag">
              <StarFilled />
              default
            </span>
          )}
        </div>
      ),
    },
    {
      title: "Key",
      dataIndex: "key",
      width: 140,
      render: (v: string) => <span className="bcm-key-chip">{v}</span>,
    },
    {
      title: "Description",
      dataIndex: "description",
      ellipsis: true,
      render: (v: string | null) =>
        v ? (
          <Tooltip title={v}>
            <Text className="bcm-desc-text">{v}</Text>
          </Tooltip>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>
            —
          </Text>
        ),
    },
    {
      title: "Active",
      dataIndex: "isActive",
      width: 70,
      align: "center",
      render: (val: boolean, row) => (
        <Switch checked={val} size="small" onChange={() => onToggleActive(row)} disabled={!canUpdateTicketSetting} />
      ),
    },
    {
      title: "",
      key: "actions",
      width: 96,
      align: "right",
      fixed: 'right',
      render: (_, row) => (
        <div
          className="ant-table-row-actions"
          style={{ display: "flex", justifyContent: "flex-end", gap: 2 }}
        >
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEdit(row)}
              disabled={!canUpdateTicketSetting}
            />
          </Tooltip>
          <Popconfirm
            title="Delete this option?"
            description={
              row.isDefault
                ? "This is the current default for new bugs."
                : undefined
            }
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => onDelete(row.id)}
            disabled={!canDeleteTicketSetting}
          >
            <Tooltip title="Delete">
              <Button type="text" size="small" danger icon={<DeleteOutlined />} disabled={!canDeleteTicketSetting} />
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div
      className="bcm-card"
      style={{ ["--bcm-accent" as string]: accent } as React.CSSProperties}
    >
      <div className="bcm-card-head">
        <div
          className="bcm-icon-chip"
          style={
            {
              ["--bcm-accent-bg" as string]: accentBg,
              ["--bcm-accent-fg" as string]: accentFg,
            } as React.CSSProperties
          }
        >
          {icon}
        </div>
        <div className="bcm-card-text">
          <div
            className="bcm-card-eyebrow"
            style={{ ["--bcm-accent-fg" as string]: accentFg } as React.CSSProperties}
          >
            <BugFilled />
            {eyebrow}
          </div>
          <div className="bcm-card-title">{title}</div>
          <div className="bcm-card-sub">{description}</div>
        </div>
        <span className="bcm-count">
          {options.length} option{options.length === 1 ? "" : "s"}
        </span>
        {canCreateTicketSetting && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onCreate}
            style={{
              background: accent,
              borderColor: accent,
              borderRadius: 8,
              fontWeight: 600,
              boxShadow: `0 1px 2px ${accent}40`,
            }}
          >
            Add option
          </Button>
        )}
      </div>
      <div className="bcm-card-body">
        {loading ? (
          <div style={{ padding: 16 }}>
            <Skeleton active paragraph={{ rows: 3 }} />
          </div>
        ) : options.length === 0 ? (
          <div className="bcm-empty">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No options yet"
            />
          </div>
        ) : (
          <Table
            className="bcm-table"
            rowKey="id"
            size="middle"
            columns={columns}
            dataSource={options}
            pagination={false}
            scroll={{ x: 'max-content' }}
          />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Editor — Drawer
// ─────────────────────────────────────────────────────────────────────────

interface OptionEditorProps {
  editing: EditState;
  isDark: boolean;
  onClose: () => void;
  onSubmit: (
    kind: EditorKind,
    payload: {
      key?: string;
      label: string;
      description?: string | null;
      color?: string | null;
      isDefault?: boolean;
    },
  ) => Promise<void>;
  submitting: boolean;
}

function OptionEditor({
  editing,
  isDark,
  onClose,
  onSubmit,
  submitting,
}: OptionEditorProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [colorPreview, setColorPreview] = useState<string | undefined>();
  const [labelPreview, setLabelPreview] = useState<string>("");

  React.useEffect(() => {
    if (!editing) {
      form.resetFields();
      setColorPreview(undefined);
      setLabelPreview("");
      return;
    }
    if (editing.option) {
      form.setFieldsValue({
        key: editing.option.key,
        label: editing.option.label,
        description: editing.option.description || "",
        color: editing.option.color || undefined,
        isDefault: editing.option.isDefault,
      });
      setColorPreview(editing.option.color || undefined);
      setLabelPreview(editing.option.label || "");
    } else {
      form.resetFields();
      setColorPreview(undefined);
      setLabelPreview("");
    }
  }, [editing, form]);

  const open = !!editing;
  const isEdit = !!editing?.option;
  const showColor = editing?.kind === "severity";

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(editing!.kind, {
        ...(isEdit ? {} : { key: values.key?.trim() || undefined }),
        label: values.label.trim(),
        description: values.description?.trim() || null,
        color: showColor ? values.color || null : undefined,
        isDefault: !!values.isDefault,
      });
    } catch {
      message.error("Please fill the required fields");
    }
  };

  const eyebrowKind =
    editing?.kind === "severity" ? "Severity option" : "Type option";
  const titleText = editing
    ? isEdit
      ? `Edit ${editing.kind}`
      : `New ${editing.kind}`
    : "";
  const subText =
    editing?.kind === "severity"
      ? "Severities surface in the Capture Bug dropdown and the table pill."
      : "Types categorize bugs (UI / Functional / API and any custom buckets).";

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={520}
      destroyOnHidden
      closable={false}
      title={null}
      footer={null}
      maskClosable={!submitting}
      className={`bcm-drawer ${isDark ? "bcm-drawer-dark" : "bcm-drawer-light"}`}
    >
      {editing && (
        <div className="bcm-drawer-shell">
          <div className="bcm-drawer-head">
            <div className="bcm-drawer-headblock">
              <div className="bcm-modal-eyebrow">
                <BugFilled />
                {eyebrowKind}
              </div>
              <div className="bcm-modal-title">{titleText}</div>
              <div className="bcm-modal-sub">{subText}</div>
            </div>
            <button
              className="bcm-drawer-close"
              aria-label="Close"
              onClick={onClose}
            >
              <CloseOutlined />
            </button>
          </div>

          <div className="bcm-modal-body">
            <ConfigProvider
              theme={{
                algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
                token: {
                  colorBgContainer: isDark ? '#161B22' : '#ffffff',
                  colorText: isDark ? '#F1F5F9' : '#1E293B',
                }
              }}
            >
              <Form
                form={form}
                layout="vertical"
                requiredMark="optional"
                onValuesChange={(_, all) => setLabelPreview(all.label || "")}
              >
                <Form.Item
                  name="label"
                  label="Label"
                  rules={[{ required: true, message: "Label is required" }]}
                >
                  <Input
                    placeholder={
                      editing.kind === "severity"
                        ? "e.g. Showstopper"
                        : "e.g. Performance"
                    }
                    autoFocus
                    size="large"
                  />
                </Form.Item>

                {!isEdit && (
                  <Form.Item
                    name="key"
                    label="Key"
                    extra="Lowercase slug stored on bugs (auto-generated from label if blank). Cannot change later."
                  >
                    <Input placeholder="auto" />
                  </Form.Item>
                )}
                {isEdit && (
                  <div style={{ marginBottom: 16 }}>
                    <div className="bcm-field-label">Key</div>
                    <div style={{ marginTop: 4 }}>
                      <span className="bcm-key-chip">{editing.option?.key}</span>
                    </div>
                  </div>
                )}

                <Form.Item
                  name="description"
                  label="Description"
                  extra="Help your team pick the right value (visible as a tooltip)."
                >
                  <Input.TextArea
                    rows={3}
                    placeholder="Optional — short hint about when to use this"
                    maxLength={240}
                    showCount
                  />
                </Form.Item>

                {showColor && (
                  <>
                    <Form.Item name="color" label="Color">
                      <ColorPickerWrapper onChange={(v) => setColorPreview(v)} />
                    </Form.Item>
                    <div className="bcm-color-preview" style={{ marginBottom: 16 }}>
                      <span
                        className="bcm-color-preview-swatch"
                        style={{ background: colorPreview || "var(--bcm-muted-bg)" }}
                      />
                      <div style={{ flex: 1 }}>
                        <div className="bcm-color-preview-title">Preview</div>
                        <div className="bcm-color-preview-label">
                          {colorPreview || "no color set"}
                        </div>
                      </div>
                      <Tag
                        style={{
                          background: colorPreview ? `${colorPreview}1a` : "transparent",
                          border: `1px solid ${colorPreview || "var(--bcm-border)"}`,
                          color: colorPreview || "var(--bcm-text-muted)",
                          margin: 0,
                          fontWeight: 600,
                        }}
                      >
                        {labelPreview || "Severity"}
                      </Tag>
                    </div>
                  </>
                )}

                <Form.Item
                  name="isDefault"
                  label="Default"
                  valuePropName="checked"
                  extra="Pre-selects this option for new bugs."
                >
                  <Switch />
                </Form.Item>
              </Form>
            </ConfigProvider>
          </div>

          <div className="bcm-drawer-foot">
            <Button onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="primary"
              loading={submitting}
              onClick={handleOk}
              style={{ borderRadius: 8, fontWeight: 600 }}
            >
              {isEdit ? "Save changes" : "Create option"}
            </Button>
          </div>
        </div>
      )}
    </Drawer>
  );
}

function ColorPickerWrapper(props: {
  value?: string;
  onChange?: (v: string) => void;
}) {
  return (
    <ColorPicker
      value={props.value}
      onChange={(c) => props.onChange?.(c.toHexString())}
      showText
      size="large"
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Styles — palette via CSS variables on .bcm-light / .bcm-dark
// ─────────────────────────────────────────────────────────────────────────

function BcmStyles() {
  return (
    <style jsx global>{`
      .bcm-light, .bcm-drawer-light {
        --bcm-bg: #ffffff;
        --bcm-bg-elev: #ffffff;
        --bcm-bg-soft: #fafbfc;
        --bcm-bg-hover: #f3f4f6;
        --bcm-muted-bg: #cbd5e1;
        --bcm-border: #eef0f4;
        --bcm-border-strong: #e2e8f0;
        --bcm-text: #0f172a;
        --bcm-text-soft: #475569;
        --bcm-text-muted: #94a3b8;
        --bcm-shadow: 0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(15,23,42,0.06);
        --bcm-default-bg: linear-gradient(135deg, #fef3c7, #fde68a);
        --bcm-default-fg: #b45309;
        --bcm-default-border: #fcd34d;
      }
      .bcm-dark, .bcm-drawer-dark {
        --bcm-bg: #070a12;
        --bcm-bg-elev: #0f1524;
        --bcm-bg-soft: #141b2c;
        --bcm-bg-hover: #1a2235;
        --bcm-muted-bg: #2a3140;
        --bcm-border: #1f2530;
        --bcm-border-strong: #2a3140;
        --bcm-text: #e6e8ee;
        --bcm-text-soft: #aab1bd;
        --bcm-text-muted: #6f7684;
        --bcm-shadow: 0 1px 2px rgba(0,0,0,0.5), 0 16px 32px -12px rgba(0,0,0,0.6);
        --bcm-default-bg: linear-gradient(135deg, rgba(252,211,77,0.16), rgba(180,83,9,0.16));
        --bcm-default-fg: #fbbf24;
        --bcm-default-border: rgba(252,211,77,0.4);
      }

      /* ============ Tabs styling (Matching DropdownManager) ============ */
      .bcm-root { height: 100%; min-height: 0; }
      
      .bcm-manager-tabs, 
      .bcm-manager-tabs .ant-tabs-content, 
      .bcm-manager-tabs .ant-tabs-content-holder,
      .bcm-manager-tabs .ant-tabs-tabpane {
        height: 100% !important;
      }

      /* ── Desktop Left Sidebar Nav ──────────────────────────────────────── */
      .bcm-manager-tabs.ant-tabs-left > .ant-tabs-nav {
        width: 264px;
        background: transparent;
        margin-bottom: 0 !important;
        border-right: 1px solid rgba(0, 0, 0, 0.08);
        padding: 20px 10px;
      }
      .bcm-dark .bcm-manager-tabs.ant-tabs-left > .ant-tabs-nav {
        background: transparent !important;
        border-right-color: #1f2937 !important;
      }
      
      /* ── Mobile/Tablet Top Nav ─────────────────────────────────────────── */
      .bcm-manager-tabs.ant-tabs-top > .ant-tabs-nav {
        width: 100%;
        background: transparent;
        margin-bottom: 0 !important;
        border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        padding: 10px 16px 0;
      }
      .bcm-dark .bcm-manager-tabs.ant-tabs-top > .ant-tabs-nav {
        background: transparent !important;
        border-bottom-color: #1f2937 !important;
      }
      .bcm-manager-tabs.ant-tabs-top .tab-label-container {
        width: auto;
      }
      .bcm-manager-tabs.ant-tabs-top .tab-subtitle-count span:last-child,
      .bcm-manager-tabs.ant-tabs-top .tab-subtitle-text {
        display: none !important;
      }
      .bcm-manager-tabs.ant-tabs-top .bcm-tab-item {
        gap: 8px !important;
      }
      .bcm-manager-tabs.ant-tabs-top .tab-icon-box {
        display: none !important;
      }
      .bcm-manager-tabs.ant-tabs-top .tab-text-box {
        align-items: center;
        text-align: center;
      }
      .bcm-manager-tabs.ant-tabs-top .tab-title {
        font-size: 13px !important;
      }
      .bcm-manager-tabs.ant-tabs-top .ant-tabs-tab {
        padding: 8px 10px !important;
        margin: 0 4px !important;
      }

      .bcm-manager-tabs .ant-tabs-tab {
        margin: 4px 0 !important;
        padding: 10px 12px !important;
        border-radius: 12px !important;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        border: 1px solid transparent !important;
        position: relative;
      }
      .bcm-manager-tabs.ant-tabs-left .ant-tabs-tab:hover {
        background: rgba(15, 23, 42, 0.03) !important;
        transform: translateX(2px);
      }
      .bcm-manager-tabs.ant-tabs-top .ant-tabs-tab:hover {
        background: rgba(15, 23, 42, 0.03) !important;
        transform: translateY(-2px);
      }
      .bcm-dark .bcm-manager-tabs .ant-tabs-tab:hover {
        background: rgba(255, 255, 255, 0.04) !important;
      }
      .bcm-manager-tabs .ant-tabs-tab-active {
        background: transparent !important;
        border-color: transparent !important;
        box-shadow: none;
      }
      .bcm-manager-tabs.ant-tabs-left .ant-tabs-tab-active::before {
        content: '';
        position: absolute;
        left: -10px;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 24px;
        background: linear-gradient(180deg, #3b82f6 0%, #8b5cf6 100%);
        border-radius: 2px;
        box-shadow: none;
      }
      .bcm-manager-tabs .ant-tabs-ink-bar {
        display: none;
      }

      /* ── Tab labels ───────────────────────────────────────────── */
      .tab-label-container {
        width: 100%;
        text-align: left;
      }
      .bcm-tab-item {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .tab-text-box {
        display: flex;
        flex-direction: column;
      }
      .tab-icon-box {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 17px;
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid var(--border-slate-100);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .bcm-dark .tab-icon-box {
        background: rgba(255, 255, 255, 0.04) !important;
        border-color: rgba(255, 255, 255, 0.05) !important;
      }
      .tab-icon-box.active {
        background: var(--bg-pure-white);
        box-shadow: none;
        transform: scale(1.05);
      }
      .bcm-dark .tab-icon-box.active {
        background: #1a2035 !important;
        box-shadow: none;
        border-color: rgba(255, 255, 255, 0.08) !important;
      }
      .tab-title {
        font-weight: 600;
        font-size: 14px;
        color: var(--bcm-text);
        line-height: 1.2;
        transition: color 0.3s;
      }
      .tab-subtitle-count {
        display: flex;
        align-items: center;
        color: var(--bcm-text-soft);
      }
      .tab-subtitle-text {
        font-size: 12px;
        font-weight: 500;
      }

      .bcm-pane {
        min-width: 0;
        overflow-y: auto;
        padding: 16px 24px 32px;
      }
      .bcm-pane::-webkit-scrollbar {
        display: none;
      }
      .bcm-pane {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }

      .bcm-card {
        border: 1px solid var(--bcm-border);
        border-radius: 16px;
        background: var(--bcm-bg-elev);
        overflow: hidden;
        box-shadow: var(--bcm-shadow);
        margin-bottom: 24px;
      }
      .bcm-card-head {
        display: flex; align-items: center; gap: 16px;
        flex-wrap: wrap;
        padding: 20px 24px;
        position: relative;
        border-bottom: 1px solid var(--bcm-border);
      }
      .bcm-card-head::before {
        content: ""; position: absolute; left: 0; top: 0; bottom: 0;
        width: 4px;
        background: var(--bcm-accent, #6366f1);
        border-radius: 0 4px 4px 0;
      }
      .bcm-icon-chip {
        width: 44px; height: 44px;
        border-radius: 12px;
        display: inline-flex; align-items: center; justify-content: center;
        background: var(--bcm-accent-bg, rgba(99,102,241,0.12));
        color: var(--bcm-accent-fg, #6366f1);
        font-size: 20px;
        flex-shrink: 0;
      }
      .bcm-card-text { flex: 1 1 200px; min-width: 0; }
      .bcm-card-eyebrow {
        display: inline-flex; align-items: center; gap: 6px;
        font-size: 10px; font-weight: 700; letter-spacing: 0.12em;
        color: var(--bcm-accent-fg, #6366f1);
        text-transform: uppercase;
        margin-bottom: 4px;
      }
      .bcm-card-title { font-size: 16px; font-weight: 700; color: var(--bcm-text); line-height: 1.2; }
      .bcm-card-sub { font-size: 12.5px; color: var(--bcm-text-soft); margin-top: 4px; line-height: 1.5; }
      .bcm-count {
        padding: 3px 10px;
        background: var(--bcm-bg-soft);
        border: 1px solid var(--bcm-border-strong);
        border-radius: 999px;
        font-size: 11px; font-weight: 600; color: var(--bcm-text-soft);
        font-variant-numeric: tabular-nums;
      }
      .bcm-card-body { 
        padding: 12px 16px 18px; 
        overflow-x: auto;
        max-width: 100%;
      }

      .bcm-table .ant-table { background: transparent !important; }
      .bcm-table .ant-table-thead > tr > th {
        background: var(--bcm-bg-soft) !important;
        color: var(--bcm-text-muted) !important;
        font-size: 11px !important;
        font-weight: 600 !important;
        letter-spacing: 0.08em !important;
        text-transform: uppercase !important;
        border-bottom: 1px solid var(--bcm-border) !important;
      }
      .bcm-table .ant-table-tbody > tr > td {
        background: var(--bcm-bg) !important;
        border-bottom: 1px solid var(--bcm-border) !important;
        padding: 14px 12px !important;
        vertical-align: middle;
        color: var(--bcm-text);
      }
      .bcm-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
      .bcm-table .ant-table-tbody > tr:hover > td { background: var(--bcm-bg-soft) !important; }
      .bcm-table .ant-table-row-actions { opacity: 0; transition: opacity 120ms ease; }
      .bcm-table .ant-table-tbody > tr:hover .ant-table-row-actions { opacity: 1; }
      .bcm-dark .bcm-table .ant-btn { color: var(--bcm-text-soft); }
      .bcm-dark .bcm-table .ant-btn:hover { color: var(--bcm-text); }
      .bcm-dark .bcm-table .ant-btn-dangerous { color: #ff8a7d; }
      .bcm-dark .bcm-table .ant-switch { background: var(--bcm-border-strong); }
      .bcm-dark .bcm-table .ant-switch.ant-switch-checked { background: #3b82f6; }
      .bcm-dark .bcm-table .ant-empty-description { color: var(--bcm-text-muted); }

      .bcm-label-row {
        display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
      }
      .bcm-color-swatch {
        width: 14px; height: 14px;
        border-radius: 999px;
        flex-shrink: 0;
        box-shadow: 0 0 0 1px rgba(0,0,0,0.06), 0 0 0 4px var(--bcm-swatch-glow, transparent);
      }
      .bcm-label-text {
        font-weight: 600; color: var(--bcm-text); font-size: 13.5px;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .bcm-key-chip {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 11px;
        padding: 2px 8px;
        background: var(--bcm-bg-soft);
        border: 1px solid var(--bcm-border-strong);
        border-radius: 6px;
        color: var(--bcm-text-soft);
      }
      .bcm-default-tag {
        display: inline-flex; align-items: center; gap: 4px;
        padding: 2px 8px;
        background: var(--bcm-default-bg);
        color: var(--bcm-default-fg);
        border: 1px solid var(--bcm-default-border);
        border-radius: 999px;
        font-size: 10px; font-weight: 700; letter-spacing: 0.04em;
        text-transform: uppercase;
        flex-shrink: 0;
        white-space: nowrap;
      }
      .bcm-desc-text { font-size: 12.5px; color: var(--bcm-text-soft); }
      .bcm-empty { padding: 40px 16px; text-align: center; color: var(--bcm-text-muted); }
      .bcm-dark .bcm-empty .ant-empty-description { color: var(--bcm-text-muted); }

      .bcm-field-label {
        font-size: 11px; color: var(--bcm-text-muted);
        letter-spacing: 0.06em; text-transform: uppercase; font-weight: 600;
      }

      /* ============ Drawer ============ */
      .bcm-drawer .ant-drawer-content {
        background: var(--bcm-bg-elev) !important;
      }
      .bcm-drawer .ant-drawer-body {
        padding: 0 !important;
        background: var(--bcm-bg-elev) !important;
      }
      .bcm-drawer .ant-drawer-mask {
        background: rgba(15,23,42,0.30) !important;
        backdrop-filter: blur(4px);
      }
      .bcm-drawer-dark .ant-drawer-mask {
        background: rgba(7,10,18,0.55) !important;
      }
      .bcm-drawer-shell {
        display: flex;
        flex-direction: column;
        height: 100%;
        color: var(--bcm-text);
      }
      .bcm-drawer-head {
        display: flex; align-items: flex-start; justify-content: space-between;
        padding: 22px 24px 18px;
        background:
          radial-gradient(120% 80% at 0% 0%, rgba(124,156,255,0.10), transparent 60%),
          radial-gradient(100% 100% at 100% 0%, rgba(245,159,59,0.08), transparent 60%);
        border-bottom: 1px solid var(--bcm-border);
      }
      .bcm-drawer-headblock { display: flex; flex-direction: column; gap: 4px; }
      .bcm-modal-eyebrow {
        display: inline-flex; align-items: center; gap: 6px;
        align-self: flex-start;
        padding: 3px 9px;
        background: rgba(124,156,255,0.14);
        color: #b3c7ff;
        border: 1px solid rgba(124,156,255,0.30);
        border-radius: 999px;
        font-size: 10px; font-weight: 700; letter-spacing: 0.12em;
        text-transform: uppercase;
        margin-bottom: 6px;
      }
      .bcm-drawer-light .bcm-modal-eyebrow {
        background: #eef2ff; color: #4f46e5; border-color: #c7d2fe;
      }
      .bcm-modal-title {
        font-size: 18px; font-weight: 700; line-height: 1.2;
        color: var(--bcm-text);
      }
      .bcm-modal-sub { color: var(--bcm-text-soft); font-size: 13px; margin-top: 4px; }

      .bcm-drawer-close {
        background: transparent;
        border: 1px solid var(--bcm-border);
        color: var(--bcm-text-muted);
        width: 32px; height: 32px;
        border-radius: 8px;
        display: inline-flex; align-items: center; justify-content: center;
        cursor: pointer;
      }
      .bcm-drawer-close:hover {
        color: var(--bcm-text);
        background: var(--bcm-bg-hover);
      }

      .bcm-modal-body {
        padding: 20px 24px 4px;
        flex: 1; overflow-y: auto;
      }
      .bcm-drawer-foot {
        display: flex; justify-content: flex-end; gap: 8px;
        padding: 14px 24px 18px;
        border-top: 1px solid var(--bcm-border);
        background: var(--bcm-bg-soft);
      }

      .bcm-color-preview {
        display: flex; align-items: center; gap: 12px;
        padding: 10px 14px;
        background: var(--bcm-bg-soft);
        border: 1px solid var(--bcm-border);
        border-radius: 10px;
      }
      .bcm-color-preview-swatch {
        width: 24px; height: 24px;
        border-radius: 8px;
        box-shadow: 0 0 0 1px rgba(0,0,0,0.08);
        flex-shrink: 0;
      }
      .bcm-color-preview-title { font-size: 12px; color: var(--bcm-text); font-weight: 600; }
      .bcm-color-preview-label {
        font-size: 12px; color: var(--bcm-text-soft);
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      }

      /* AntD form polish for dark drawer */
      .bcm-drawer-dark :where(.ant-form-item-label > label) { color: var(--bcm-text-soft) !important; }
      .bcm-drawer-dark :where(.ant-form-item-extra) { color: var(--bcm-text-muted) !important; }
      .bcm-drawer-dark :where(.ant-input, .ant-input-affix-wrapper, .ant-input-textarea, textarea.ant-input) {
        background: var(--bcm-bg-soft) !important;
        border-color: var(--bcm-border) !important;
        color: var(--bcm-text) !important;
      }
      .bcm-drawer-dark :where(.ant-input::placeholder, textarea.ant-input::placeholder) {
        color: var(--bcm-text-muted) !important;
      }
      .bcm-drawer-dark :where(.ant-input-data-count) { color: var(--bcm-text-muted) !important; }
      .bcm-drawer-dark :where(.ant-color-picker-trigger) {
        background: var(--bcm-bg-soft);
        border-color: var(--bcm-border);
        color: var(--bcm-text);
      }
      .bcm-drawer-dark :where(.ant-switch) { background: var(--bcm-border-strong); }
      .bcm-drawer-dark :where(.ant-switch-checked) { background: #3b82f6; }
      .bcm-drawer-dark :where(.ant-btn-default) {
        background: var(--bcm-bg-soft) !important;
        border-color: var(--bcm-border) !important;
        color: var(--bcm-text) !important;
      }
      .bcm-drawer-dark :where(.ant-btn-default:hover) {
        background: var(--bcm-bg-hover) !important;
      }
    `}</style>
  );
}
