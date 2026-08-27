"use client";

import NoData from "@/components/common/NoData";
import { SectionCard, drawerFormStyles } from "@/components/common/DrawerSection";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import ZukvoLoader from "@/components/common/ZukvoLoader";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Button,
  ColorPicker,
  Drawer,
  Form,
  Input,
  Popconfirm,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
  App,
  theme as antdTheme,
  ConfigProvider,
  Space,
  Tabs,
  Badge,
  Grid,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  EditOutlined,
  PlusOutlined,
  ThunderboltFilled,
  AppstoreFilled,
  StarFilled,
  BugFilled,
  CloseOutlined,
  BugOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { Boxes, Menu, Pencil, Plus, RotateCw, Settings, Trash2 } from "lucide-react";
import {
  MODULE_SETTINGS_STYLES,
  ModuleModal,
  ModulesTable,
  useQaModules,
  useScopeModuleNames,
  type QaModule,
} from "@/components/qa/ModuleSettingsSection";
import {
  SCOPE_CATEGORY_LABELS,
  SCOPE_SETTINGS_STYLES,
  SCOPE_SETTING_CATEGORIES,
  ScopeOptionModal,
  ScopeOptionsTable,
  useScopeSettings,
  useScopeUsage,
  type ScopeCategory,
} from "@/components/qa/ScopeSettingsSection";
import {
  useBugSeverityOptions,
  useBugTypeOptions,
  useCreateBugSeverity,
  useCreateBugType,
  useDeleteBugSeverity,
  useDeleteBugType,
  useUpdateBugSeverity,
  useUpdateBugType,
  useBugPriorityOptions,
  useCreateBugPriority,
  useUpdateBugPriority,
  useDeleteBugPriority,
} from "@/hooks/useBugList";
import type { BugConfigOption } from "@/services/bugListService";
import { useTheme } from "@/context/ThemeContext";
import { usePermission } from "@/hooks/usePermission";

const { Text } = Typography;

type EditorKind = "severity" | "type" | "priority";
type EditState =
  | { kind: EditorKind; option: BugConfigOption | null }
  | null;

type SectionKey = "severity" | "type" | "priority";

/**
 * The Test Scope option lists, moved here from the Test Scope page so a
 * workspace curates every QA dropdown in one screen. They are keyed apart from
 * the bug sections because "priority" exists on both sides and means different
 * things.
 */
type ScopeNavKey = `scope:${ScopeCategory}`;
/** The module list is neither a bug definition nor a scope option list. */
const MODULES_KEY = "modules" as const;
type NavKey = SectionKey | ScopeNavKey | typeof MODULES_KEY;

const isScopeNav = (k: NavKey): k is ScopeNavKey => k.startsWith("scope:");
const scopeCategoryOf = (k: ScopeNavKey) => k.slice("scope:".length) as ScopeCategory;

const SECTIONS: {
  key: SectionKey;
  title: string;
  description: string;
  shortDescription: string;
  icon: React.ReactNode;
}[] = [
    {
      key: "severity",
      title: "Severity",
      description:
        "Tenant-scoped severity options. Shown in the Capture Bug dropdown and the bug table.",
      shortDescription: "Triage levels",
      icon: <ThunderboltFilled />,
    },
    {
      key: "type",
      title: "Type",
      description:
        "Bug type taxonomy (UI / Functional / API by default — extend as needed).",
      shortDescription: "Categorize bugs by area",
      icon: <AppstoreFilled />,
    },
    {
      key: "priority",
      title: "Priority",
      description:
        "Priority levels shared across the QA workspace.",
      shortDescription: "How urgent the work is",
      icon: <StarFilled />,
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

  const priorities = useBugPriorityOptions();
  const createPriority = useCreateBugPriority();
  const updatePriority = useUpdateBugPriority();
  const deletePriority = useDeleteBugPriority();
  // Two separate grants meet on this screen: bug definitions are bug.manage,
  // the test scope option lists are qa.manage. Each group is shown only to the
  // grant that owns it rather than gating the whole page on one of them.
  const { canManageBugs, canManageQa } = usePermission();
  const { useBreakpoint } = Grid;
  const screens = useBreakpoint();

  const [editing, setEditing] = useState<EditState>(null);
  const [activeKey, setActiveKey] = useState<NavKey>("severity");

  /**
   * `?section=modules` opens straight onto a pane. The module dropdowns across
   * QA Space link here when a project has no modules yet, and landing on the
   * severity list would leave the reader to hunt for the screen they asked for.
   */
  const searchParams = useSearchParams();
  const requestedSection = searchParams?.get("section");
  useEffect(() => {
    if (requestedSection === MODULES_KEY) setActiveKey(MODULES_KEY);
    else if (requestedSection && SCOPE_SETTING_CATEGORIES.some(c => c.key === requestedSection)) {
      setActiveKey(`scope:${requestedSection}` as ScopeNavKey);
    }
  }, [requestedSection]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // ── QA modules ───────────────────────────────────────────────────────────
  const qaModules = useQaModules(canManageQa);
  /** Module names already typed onto test scopes — they name what blocks a delete. */
  const scopeModuleIndex = useScopeModuleNames(canManageQa);
  /** null while closed; { item: null } means "create a new module". */
  const [moduleEditing, setModuleEditing] = useState<{ item: QaModule | null } | null>(null);

  // ── Test Scope option lists ──────────────────────────────────────────────
  const scopeSettings = useScopeSettings(canManageQa);
  /**
   * Permissions arrive with auth rather than on the first render, so the
   * default lands on the bug sections and falls through to the scope lists only
   * once we know the viewer cannot configure bugs.
   */
  const effectiveKey: NavKey =
    !canManageBugs && !isScopeNav(activeKey) && activeKey !== MODULES_KEY ? "scope:scope_type" : activeKey;
  const scopeNavActive = isScopeNav(effectiveKey);
  const modulesNavActive = effectiveKey === MODULES_KEY;
  const scopeCategory: ScopeCategory = scopeNavActive ? scopeCategoryOf(effectiveKey) : "scope_type";
  // Only worth pulling the scope list once one of these panes is open — it is
  // there purely to answer "how many scopes still use this option?".
  const scopeRecords = useScopeUsage(scopeNavActive && canManageQa);
  /** null while closed; { item: null } means "create a new option". */
  const [scopeEditing, setScopeEditing] = useState<{ item: any | null } | null>(null);

  const closeEditor = () => setEditing(null);

  const counts: Record<SectionKey, number> = {
    severity: severities.data?.length ?? 0,
    type: types.data?.length ?? 0,
    priority: priorities.data?.length ?? 0,
  };
  const loadingMap: Record<SectionKey, boolean> = {
    severity: severities.isLoading,
    type: types.isLoading,
    priority: priorities.isLoading,
  };

  const isRefreshing =
    severities.isFetching || priorities.isFetching || types.isFetching || scopeSettings.loading || qaModules.loading;

  const handleRefresh = async () => {
    try {
      if (modulesNavActive) {
        await qaModules.refetch();
      } else if (scopeNavActive) {
        await scopeSettings.refetch();
      } else if (effectiveKey === "severity") {
        await severities.refetch();
      } else if (effectiveKey === "priority") {
        await priorities.refetch();
      } else {
        await types.refetch();
      }
    } catch (error) {
      console.error("Failed to refresh configurations:", error);
    }
  };

  const activeSection = SECTIONS.find(s => s.key === effectiveKey) ?? SECTIONS[0];
  const activeScopeMeta = SCOPE_SETTING_CATEGORIES.find(c => c.key === scopeCategory)!;

  /** What the topbar names, whichever side of the sidebar is selected. */
  const paneTitle = modulesNavActive ? "Modules" : scopeNavActive ? activeScopeMeta.label : activeSection.title;
  const paneSubtitle = modulesNavActive
    ? "What everything is filed under"
    : scopeNavActive ? activeScopeMeta.blurb : activeSection.shortDescription;

  return (
    <>
      <BcmStyles />
      <style dangerouslySetInnerHTML={{ __html: SCOPE_SETTINGS_STYLES + MODULE_SETTINGS_STYLES }} />
      <div className={`dh-shell bcm-root ${isDark ? 'bcm-dark' : 'bcm-light'}`}>
        <div
          className={`dh-sidebar-backdrop ${mobileSidebarOpen ? 'is-open' : ''}`}
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden
        />
        <aside className={`dh-sidebar ${mobileSidebarOpen ? 'is-mobile-open' : ''}`}>
          <div className="dh-sidebar-top">
            <div className="pp-side-head">
              <div className="pp-side-logo"><BugOutlined /></div>
              <div>
                <h1 className="pp-side-title">Settings</h1>
                <p className="pp-side-subtitle">QA Space</p>
              </div>
            </div>
          </div>
          <div className="dh-sidebar-scroll">
            {canManageBugs && <span className="pp-nav-caption">Bug Definitions</span>}
            {canManageBugs && SECTIONS.map((s) => (
              <button
                key={s.key}
                className={`pp-nav-item ${effectiveKey === s.key ? 'is-active' : ''}`}
                onClick={() => { setActiveKey(s.key as SectionKey); setMobileSidebarOpen(false); }}
              >
                {React.cloneElement(s.icon as React.ReactElement, { size: 15, className: "pp-nav-icon" })}
                <span className="pp-nav-label">{s.title}</span>
                <span className="pp-nav-count">{counts[s.key]}</span>
              </button>
            ))}

            {canManageQa && <span className="pp-nav-caption">Test Cases</span>}
            {canManageQa && (
              <button
                className={`pp-nav-item ${modulesNavActive ? 'is-active' : ''}`}
                onClick={() => { setActiveKey(MODULES_KEY); setMobileSidebarOpen(false); }}
              >
                <Boxes size={15} className="pp-nav-icon" />
                <span className="pp-nav-label">Modules</span>
                <span className="pp-nav-count">{qaModules.items.length}</span>
              </button>
            )}

            {canManageQa && <span className="pp-nav-caption">Test Scope</span>}
            {canManageQa && SCOPE_SETTING_CATEGORIES.map((c) => {
              const navKey = `scope:${c.key}` as ScopeNavKey;
              const Icon = c.icon;
              return (
                <button
                  key={navKey}
                  className={`pp-nav-item ${effectiveKey === navKey ? 'is-active' : ''}`}
                  onClick={() => { setActiveKey(navKey); setMobileSidebarOpen(false); }}
                >
                  <Icon size={15} className="pp-nav-icon" />
                  <span className="pp-nav-label">{c.label}</span>
                  <span className="pp-nav-count">
                    {scopeSettings.items.filter((i: any) => i.category === c.key).length}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="dh-main">
          <div className="dh-main-topbar sc-topbar">
            <div className="sc-topbar__title" style={{ display: 'flex', alignItems: 'center' }}>
              <Button
                className="dh-mobile-menu-btn"
                type="text"
                icon={<Menu size={18} />}
                onClick={() => setMobileSidebarOpen(true)}
              />
              <span className="sc-topbar__h1">{paneTitle}</span>
              <span className="sc-topbar__div" />
              <span className="sc-topbar__sub">{paneSubtitle}</span>
            </div>
            <div className="dh-main-controls">
              <Button
                type="default"
                icon={<RotateCw size={14} className={isRefreshing ? "animate-spin" : ""} />}
                onClick={handleRefresh}
                disabled={isRefreshing}
                title="Refresh"
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, padding: 0 }}
              />
              {(scopeNavActive || modulesNavActive ? canManageQa : canManageBugs) && (
                modulesNavActive ? (
                  <Button
                    type="primary"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => setModuleEditing({ item: null })}
                  >
                    New Module
                  </Button>
                ) : scopeNavActive ? (
                  <Button
                    type="primary"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => setScopeEditing({ item: null })}
                  >
                    New {SCOPE_CATEGORY_LABELS[scopeCategory]}
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => setEditing({ kind: activeSection.key as EditorKind, option: null })}
                  >
                    New {activeSection.title}
                  </Button>
                )
              )}
            </div>
          </div>
          <div className="dh-main-scroll bcm-pane">
            {modulesNavActive ? (
              <ModulesTable
                items={qaModules.items}
                loading={qaModules.loading}
                canManage={canManageQa}
                scopeIndex={scopeModuleIndex}
                onCreate={() => setModuleEditing({ item: null })}
                onEdit={(item) => setModuleEditing({ item })}
                onChanged={qaModules.refetch}
              />
            ) : scopeNavActive ? (
              <ScopeOptionsTable
                key={scopeCategory}
                category={scopeCategory}
                items={scopeSettings.items}
                loading={scopeSettings.loading}
                scopes={scopeRecords}
                canManage={canManageQa}
                onCreate={() => setScopeEditing({ item: null })}
                onEdit={(item) => setScopeEditing({ item })}
                onChanged={scopeSettings.refetch}
              />
            ) : (
            <ConfigSection
              key={activeSection.key}
              title={activeSection.title}
              description={activeSection.description}
              loading={loadingMap[activeSection.key as SectionKey]}
              options={
                activeSection.key === "severity"
                  ? severities.data || []
                  : activeSection.key === "priority"
                    ? priorities.data || []
                    : types.data || []
              }
              showColor={activeSection.key === "severity" || activeSection.key === "priority"}
              onCreate={() => setEditing({ kind: activeSection.key as EditorKind, option: null })}
              onEdit={(o) => setEditing({ kind: activeSection.key as EditorKind, option: o })}
              onDelete={async (id) => {
                try {
                  if (activeSection.key === "severity") {
                    await deleteSeverity.mutateAsync(id);
                  } else if (activeSection.key === "priority") {
                    await deletePriority.mutateAsync(id);
                  } else {
                    await deleteType.mutateAsync(id);
                  }
                } catch {
                  /* hook surfaces toast */
                }
              }}
              onToggleActive={(o) => {
                if (activeSection.key === "severity") {
                  updateSeverity.mutate({
                    id: o.id,
                    input: { isActive: !o.isActive },
                  });
                } else if (activeSection.key === "priority") {
                  updatePriority.mutate({
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
            )}
          </div>
        </main>
      </div>

      <ModuleModal
        open={!!moduleEditing}
        editing={moduleEditing?.item ?? null}
        onClose={() => setModuleEditing(null)}
        onSaved={qaModules.refetch}
      />

      <ScopeOptionModal
        open={!!scopeEditing}
        category={scopeCategory}
        editing={scopeEditing?.item ?? null}
        onClose={() => setScopeEditing(null)}
        onSaved={scopeSettings.refetch}
      />

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
            } else if (kind === "priority") {
              if (editing?.kind === "priority" && editing.option) {
                await updatePriority.mutateAsync({
                  id: editing.option.id,
                  input: payload,
                });
              } else {
                await createPriority.mutateAsync(payload);
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
          updateType.isPending ||
          createPriority.isPending ||
          updatePriority.isPending
        }
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Section
// ─────────────────────────────────────────────────────────────────────────

interface ConfigSectionProps {
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
  const { canManageBugs } = usePermission();
  const lowerTitle = title.toLowerCase();

  const columns: ColumnsType<BugConfigOption> = [
    {
      title: "Option",
      dataIndex: "label",
      render: (_, row) => (
        <div className="st-option">
          {/* Tinted from the option's own colour, so it reads like the badge it
              becomes in the bug table rather than a solid block of it. */}
          <span
            className="st-tag"
            style={showColor && row.color ? {
              color: row.color,
              background: `${row.color}1a`,
              borderColor: `${row.color}33`,
            } : undefined}
          >
            {row.label}
          </span>
          {row.isDefault ? (
            <span className="bcm-default-tag"><StarFilled />default</span>
          ) : (
            <span className="st-option__hint">as it appears in dropdowns</span>
          )}
        </div>
      ),
    },
    {
      title: "Value key",
      dataIndex: "key",
      width: 200,
      render: (v: string) => <code className="st-code">{v}</code>,
    },
    {
      title: "Description",
      dataIndex: "description",
      ellipsis: true,
      render: (v: string | null) =>
        v ? (
          <Tooltip title={v}><span className="st-desc">{v}</span></Tooltip>
        ) : (
          <span className="st-usage is-empty">No description</span>
        ),
    },
    {
      title: "Active",
      dataIndex: "isActive",
      width: 80,
      align: "center",
      render: (val: boolean, row) => (
        <Switch checked={val} size="small" onChange={() => onToggleActive(row)} disabled={!canManageBugs} />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      align: "right",
      render: (_, row) => {
        // Bug definitions are a bug.manage action
        if (!canManageBugs) return <span className="sc-muted">—</span>;
        return (
          <div className="sc-rowactions">
            <Tooltip title="Edit">
              <button onClick={() => onEdit(row)} aria-label="Edit"><Pencil size={15} /></button>
            </Tooltip>
            <ConfirmDialog
              tone="danger"
              title="Delete this option?"
              description={row.isDefault
                ? "This is the current default for new bugs — they'll fall back to the next option."
                : `It will no longer be selectable as a bug ${lowerTitle}.`}
              confirmText="Delete"
              onConfirm={() => onDelete(row.id)}
            >
              <Tooltip title="Delete">
                <button className="is-danger" aria-label="Delete"><Trash2 size={15} /></button>
              </Tooltip>
            </ConfirmDialog>
          </div>
        );
      },
    },
  ];

  return (
    <div className="sc-tablewrap">
      <div className="st-head">
        <div className="min-w-0">
          <div className="st-head__title">{title} options</div>
          <div className="st-head__desc">{description}</div>
        </div>
        {canManageBugs && (
          <Button type="primary" size="small" icon={<Plus size={14} />} onClick={onCreate}>Add Option</Button>
        )}
      </div>

      <Table
        className="ts-table sc-table"
        rowKey="id"
        size="middle"
        columns={columns}
        dataSource={options}
        pagination={false}
        scroll={{ x: "max-content" }}
        locale={{
          emptyText: loading ? (
            <ZukvoLoader size="md" message="Loading options…" />
          ) : (
            <div className="sc-empty">
              <Settings size={26} className="sc-empty__icon" />
              <p className="sc-empty__title">No {lowerTitle} options yet</p>
              <p className="sc-empty__desc">{description}</p>
              {canManageBugs && (
                <Button type="primary" size="small" icon={<Plus size={14} />} onClick={onCreate}>Add the first option</Button>
              )}
            </div>
          ),
        }}
      />
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
  const showColor = editing?.kind === "severity" || editing?.kind === "priority";

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
    editing?.kind === "severity" ? "Severity option"
      : editing?.kind === "priority" ? "Priority option"
        : "Type option";
  const titleText = editing
    ? isEdit
      ? `Edit ${editing.kind}`
      : `New ${editing.kind}`
    : "";
  const subText =
    editing?.kind === "severity"
      ? "Severities surface in the Capture Bug dropdown and the table pill."
      : editing?.kind === "priority"
        ? "Priorities are shared across test cases and runs."
        : "Types categorize bugs (UI / Functional / API and any custom buckets).";

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={680}
      destroyOnHidden
      maskClosable={!submitting}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 0,
            background: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
          }}>
            <BugOutlined style={{ fontSize: 16 }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              {titleText || "Configuration Option"}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-slate-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {eyebrowKind}
            </div>
          </div>
        </div>
      }
      styles={{
        header: { borderBottom: '1px solid var(--border-color)', padding: '12px 16px', background: 'var(--bg-secondary)' },
        body: { padding: '12px 16px', backgroundColor: 'var(--bg-primary)' },
        mask: { backdropFilter: 'blur(4px)', background: 'rgba(15, 23, 42, 0.1)' }
      }}
      extra={
        <Space size={8}>
          <Button onClick={onClose} disabled={submitting} style={{ borderRadius: 8, fontWeight: 600, fontSize: 12, height: 32 }}>Cancel</Button>
          <Button
            type="primary"
            loading={submitting}
            onClick={handleOk}
            icon={isEdit ? <EditOutlined style={{ fontSize: 13 }} /> : <PlusOutlined style={{ fontSize: 13 }} />}
            style={{
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              background: '#2563eb',
              border: 'none',
              height: 32,
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)'
            }}
          >
            {isEdit ? "Save changes" : "Create option"}
          </Button>
        </Space>
      }
    >
      {editing && (
        <div style={{ position: 'relative', height: '100%' }}>
          <ConfigProvider
            theme={{
              token: {
                borderRadius: 0,
                borderRadiusSM: 0,
                borderRadiusLG: 0,
                borderRadiusXS: 0,
              },
              components: {
                Select: { borderRadius: 0 },
                Input: { borderRadius: 0 },
                Button: { borderRadius: 0 }
              }
            }}
          >
            <style>{drawerFormStyles}</style>
            <Form
              form={form}
              layout="horizontal"
              labelCol={{ span: 8 }}
              wrapperCol={{ span: 16 }}
              labelAlign="left"
              colon={false}
              requiredMark="optional"
              onValuesChange={(_, all) => setLabelPreview(all.label || "")}
              className="lead-drawer-form customer-drawer-form"
            >
              <SectionCard step="STEP 1" icon={<InfoCircleOutlined style={{ color: '#475569', fontSize: 13 }} />} title="Configuration Details" subtitle="Core metadata">
                <Form.Item
                  name="label"
                  label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: "#64748b" }}>Label</Text>}
                  rules={[{ required: true, message: "Label is required" }]}
                >
                  <Input
                    placeholder={
                      editing.kind === "severity" ? "e.g. Showstopper"
                        : editing.kind === "priority" ? "e.g. Urgent"
                          : "e.g. Performance"
                    }
                    autoFocus
                  />
                </Form.Item>

                {!isEdit && (
                  <Form.Item
                    name="key"
                    label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: "#64748b" }}>Key</Text>}
                    extra="Lowercase slug stored on bugs (auto-generated if blank). Cannot change later."
                  >
                    <Input placeholder="auto" />
                  </Form.Item>
                )}
                {isEdit && (
                  <Form.Item label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: "#64748b" }}>Key</Text>}>
                    <Tag>{editing.option?.key}</Tag>
                  </Form.Item>
                )}

                <Form.Item
                  name="description"
                  label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: "#64748b" }}>Description</Text>}
                  extra="Help your team pick the right value (visible as a tooltip)."
                >
                  <Input.TextArea
                    rows={3}
                    placeholder="Optional — short hint about when to use this"
                    maxLength={240}
                    showCount
                  />
                </Form.Item>
              </SectionCard>

              <SectionCard step="STEP 2" icon={<StarFilled style={{ color: '#f59e0b', fontSize: 13 }} />} title="Appearance & Defaults" subtitle="Visual configuration">
                {showColor && (
                  <Form.Item name="color" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: "#64748b" }}>Color</Text>}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <ColorPickerWrapper onChange={(v) => setColorPreview(v)} />
                      <Tag
                        style={{
                          background: colorPreview ? `${colorPreview}1a` : "transparent",
                          border: `1px solid ${colorPreview || "var(--border-color)"}`,
                          color: colorPreview || "var(--text-slate-400)",
                          margin: 0,
                          fontWeight: 600,
                        }}
                      >
                        {labelPreview || "Severity"}
                      </Tag>
                    </div>
                  </Form.Item>
                )}

                <Form.Item
                  name="isDefault"
                  label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: "#64748b" }}>Default Option</Text>}
                  valuePropName="checked"
                  extra="Pre-selects this option for new bugs."
                >
                  <Switch checkedChildren="ON" unCheckedChildren="OFF" />
                </Form.Item>
              </SectionCard>
            </Form>
          </ConfigProvider>
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

      /* Removed Tabs styling as we are using standard dh-shell */

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

      .bcm-table .ant-table-tbody > tr > td {
        background: var(--bcm-bg) !important;
        border-bottom: 1px solid var(--bcm-border) !important;
        padding: 14px 12px !important;
        vertical-align: middle;
        color: var(--bcm-text);
      }
      .bcm-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
      .bcm-table .ant-table-tbody > tr:hover > td { background: var(--bcm-bg-soft) !important; }
      .bcm-table .ant-table-row-actions { opacity: 1; }
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
