"use client";

/**
 * QA Modules — the tenant's own module list, curated in QA Space → Settings.
 *
 * Modules are what everything in QA Space is filed under, and each one belongs
 * to a project: "Billing" only means something inside a product, so the project
 * is required when a module is created. Naming a module while creating a test
 * scope registers it here on save under that scope's product, and the API
 * adopts the ones older scopes already named — a scope's modules and this list
 * are one list. That is also why a module a scope still names cannot be
 * deleted: the scope would be left planning against something that is gone.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Form, Input, Modal, Table, Tooltip } from "antd";
import { message } from "@/providers/AntdGlobalProvider";
import { CloseOutlined } from "@ant-design/icons";
import { ArrowUpRight, Boxes, FolderKanban, Lock, Pencil, Plus, Trash2, Search } from "lucide-react";

import ConfirmDialog from "@/components/common/ConfirmDialog";
import SearchableDropdown from "@/components/common/SearchableDropdown";
import ZukvoLoader from "@/components/common/ZukvoLoader";
import PostCreationSuccessScreen from "@/components/common/PostCreationSuccessScreen";
import { ProjectService } from "@/services/projectService";
import { api as axios } from "@/lib/axios";

const { TextArea } = Input;

export interface QaModule {
  id: string;
  module_name: string;
  description?: string | null;
  /** The project this module belongs to. Null only on rows created before projects were required. */
  project_id?: string | null;
  project_name?: string | null;
  case_count?: number | string;
  suite_count?: number | string;
  /** Test scopes that name this module — counted by the API, and what blocks a delete. */
  scope_count?: number | string;
}

/** A test scope that names a module — the rows behind the locked delete button. */
export interface ScopeLink {
  id: string;
  name: string;
  status?: string | null;
  product?: string | null;
}

/** Module name (lowercased) → the scopes that name it. */
export type ScopeModuleIndex = Record<string, ScopeLink[]>;

export const MODULES_HELP = "Groups scopes, scenarios, cases, and suites by project.";

const norm = (s: any) => String(s ?? "").trim().toLowerCase();

/**
 * The API's own wording for a refusal. `api` rejects with an ApiError whose
 * `message` is the body's `error` and whose `details` is the body — reading
 * `response.data` here would quietly swallow every message the API sends.
 */
const apiError = (err: any, fallback: string) =>
  err?.details?.error || err?.response?.data?.error || err?.message || fallback;

/** The module list, shared by the sidebar count and the pane. */
export function useQaModules(enabled = true) {
  const [items, setItems] = useState<QaModule[]>([]);
  const [loading, setLoading] = useState(enabled);

  const refetch = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const res: any = await axios.get(`/api/v2/qa/modules?_t=${Date.now()}`);
      const data = Array.isArray(res) ? res : (res?.data ?? []);
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch QA modules", err);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => { refetch(); }, [refetch]);

  return { items, loading, refetch };
}

/** The projects the signed-in user can file a module under. */
export function useProjectOptions(enabled: boolean) {
  const [options, setOptions] = useState<{ value: string; label: string; description?: string }[]>([]);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);
    ProjectService.getUserProjects(true)
      .then((res: any) => {
        if (cancelled) return;
        const list: any[] = Array.isArray(res) ? res : (res?.data ?? []);
        setOptions(
          list
            .map((p: any) => ({
              value: String(p.value ?? p.id ?? ""),
              label: String(p.label ?? p.name ?? ""),
              description: p.code || undefined,
            }))
            .filter(o => o.value && o.label),
        );
      })
      .catch(err => console.error("Failed to fetch projects", err))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [enabled]);

  return { options, loading };
}

/**
 * Every module name typed onto a test scope, with the scopes that named it.
 * Scopes store these as free text in `details.modules`, so this is the only
 * way to name the scopes standing in the way of a delete.
 */
export function useScopeModuleNames(enabled: boolean) {
  const [index, setIndex] = useState<ScopeModuleIndex>({});

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    axios
      .get("/api/v2/qa/test-scopes?pageSize=1000")
      .then((res: any) => {
        if (cancelled) return;
        const list = Array.isArray(res) ? res : (res?.data?.data ?? res?.data ?? []);
        const tally: ScopeModuleIndex = {};
        (Array.isArray(list) ? list : []).forEach((s: any) => {
          const named: any[] = Array.isArray(s?.details?.modules) ? s.details.modules : [];
          const link: ScopeLink = {
            id: String(s?.id ?? ""),
            name: String(s?.name ?? "Untitled scope"),
            status: s?.status ?? null,
            product: s?.details?.product ?? null,
          };
          new Set(named.filter(Boolean).map((n: any) => norm(n))).forEach(key => {
            if (!key) return;
            (tally[key] ||= []).push(link);
          });
        });
        setIndex(tally);
      })
      .catch(() => { /* the API still refuses the delete — the tooltip just says less */ });
    return () => { cancelled = true; };
  }, [enabled]);

  return index;
}

/**
 * The scopes that link a module. A scope only counts when it names the same
 * product, or names none at all — otherwise another project's "Billing" scope
 * would lock this project's "Billing" module.
 */
export function scopeLinksFor(index: ScopeModuleIndex, module: QaModule): ScopeLink[] {
  const links = index[norm(module.module_name)] || [];
  const project = norm(module.project_name);
  if (!project) return links;
  return links.filter(l => !norm(l.product) || norm(l.product) === project);
}

const usageOf = (m: QaModule) => Number(m.case_count || 0) + Number(m.suite_count || 0);

/**
 * How many scopes link a module. The API counts them with the same rule the
 * delete guard uses, so it wins; the locally built index only stands in for an
 * API that hasn't sent the field.
 */
const scopeCountOf = (m: QaModule, index: ScopeModuleIndex) =>
  m.scope_count == null ? scopeLinksFor(index, m).length : Number(m.scope_count) || 0;

/** The rich hover card shown on a delete button a scope is holding open. */
function LockedDeleteTip({ links, count }: { links: ScopeLink[]; count: number }) {
  const shown = links.slice(0, 4);
  const rest = Math.max(count - shown.length, 0);
  return (
    <div className="mlock">
      <div className="mlock__head">
        <span className="mlock__icon"><Lock size={14} /></span>
        <div className="min-w-0">
          <div className="mlock__title">Linked to {count} test scope{count === 1 ? "" : "s"}</div>
          <div className="mlock__sub">A module a scope plans against can’t be deleted.</div>
        </div>
      </div>

      {shown.length > 0 && (
        <ul className="mlock__list">
          {shown.map((l, i) => (
            <li key={l.id || i} className="mlock__row">
              <span className="mlock__dot" />
              <span className="mlock__name">{l.name}</span>
              {l.status ? <span className="mlock__chip">{l.status}</span> : null}
            </li>
          ))}
          {rest > 0 && <li className="mlock__more">+{rest} more scope{rest === 1 ? "" : "s"}</li>}
        </ul>
      )}

      <div className="mlock__foot">Remove it from {count === 1 ? "that scope" : "those scopes"} first, then delete.</div>
    </div>
  );
}

interface ModulesTableProps {
  items: QaModule[];
  loading: boolean;
  canManage: boolean;
  /** Module name → the scopes that named it. */
  scopeIndex: ScopeModuleIndex;
  onCreate: () => void;
  onEdit: (item: QaModule) => void;
  onChanged: () => void;
}

export function ModulesTable({
  items, loading, canManage, scopeIndex, onCreate, onEdit, onChanged,
}: ModulesTableProps) {
  /** "" = every project. Modules are filed per project, so this is how you read the list. */
  const [projectFilter, setProjectFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/v2/qa/modules/${id}`);
      message.success("Deleted");
      onChanged();
    } catch (err: any) {
      // The API refuses modules that scopes, scenarios or suites still use.
      message.error(apiError(err, "Failed to delete"));
    }
  };

  /** Project options come from the modules themselves, so the filter can't offer an empty bucket. */
  const projectOptions = useMemo(() => {
    const seen = new Map<string, { value: string; label: string; description?: string }>();
    items.forEach(m => {
      const key = m.project_id || norm(m.project_name) || "__none__";
      if (seen.has(key)) return;
      seen.set(key, {
        value: key,
        label: m.project_name || "No project",
        description: m.project_name ? undefined : "Added before projects were required",
      });
    });
    return [{ value: "", label: "All projects" }, ...Array.from(seen.values())];
  }, [items]);

  const visible = useMemo(() => {
    let result = items;
    if (projectFilter) {
      result = result.filter(m => (m.project_id || norm(m.project_name) || "__none__") === projectFilter);
    }
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(m => 
        m.module_name.toLowerCase().includes(lowerSearch) ||
        (m.description && m.description.toLowerCase().includes(lowerSearch))
      );
    }
    return result;
  }, [items, projectFilter, searchTerm]);

  return (
    <div className="sc-tablewrap">
      <div className="st-head">
        <div className="min-w-0">
          <div className="st-head__title">Modules</div>
          <div className="st-head__desc">{MODULES_HELP}</div>
        </div>
        <div className="st-head__actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Input
            placeholder="Search modules…"
            prefix={<Search size={14} style={{ color: "var(--text-slate-400)" }} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          {projectOptions.length > 2 && (
            <SearchableDropdown
              options={projectOptions}
              value={projectFilter}
              onChange={(v: any) => setProjectFilter(v || "")}
              placeholder="All projects"
              searchPlaceholder="Search projects…"
              itemNoun="projects"
              allowClear={false}
              width={260}
              className="mod-filter"
            />
          )}
          {canManage && (
            <Button type="primary" size="small" icon={<Plus size={14} />} onClick={onCreate}>Add Module</Button>
          )}
        </div>
      </div>

      <Table
        className="ts-table sc-table"
        dataSource={visible}
        rowKey="id"
        size="middle"
        pagination={false}
        scroll={{ x: "max-content" }}
        locale={{
          emptyText: loading ? (
            <ZukvoLoader size="md" message="Loading modules…" />
          ) : (
            <div className="sc-empty">
              <Boxes size={26} className="sc-empty__icon" />
              <p className="sc-empty__title">{projectFilter ? "No modules in this project" : "No modules yet"}</p>
              <p className="sc-empty__desc">{MODULES_HELP}</p>
              {canManage && (
                <Button type="primary" size="small" icon={<Plus size={14} />} onClick={onCreate}>Add the first module</Button>
              )}
            </div>
          ),
        }}
        columns={[
          {
            title: "Module",
            dataIndex: "module_name",
            render: (name: string) => (
              <div className="st-option">
                <span className="st-tag">{name}</span>
                <span className="st-option__hint">as it appears in dropdowns</span>
              </div>
            ),
          },
          {
            title: "Project",
            dataIndex: "project_name",
            width: 200,
            render: (v: string | null) =>
              v ? (
                <span className="mod-project"><FolderKanban size={13} />{v}</span>
              ) : (
                <Tooltip title="Added before projects were required — edit it to pick one.">
                  <span className="st-usage is-empty">Not set</span>
                </Tooltip>
              ),
          },
          {
            title: "Description",
            dataIndex: "description",
            ellipsis: true,
            render: (v: string | null) =>
              v ? <Tooltip title={v}><span className="st-desc">{v}</span></Tooltip>
                : <span className="st-usage is-empty">No description</span>,
          },
          {
            title: "Used by",
            key: "usage",
            width: 260,
            render: (_: any, record: QaModule) => {
              const cases = Number(record.case_count || 0);
              const suites = Number(record.suite_count || 0);
              const scopes = scopeCountOf(record, scopeIndex);
              if (!cases && !suites && !scopes) return <span className="st-usage is-empty">Not used</span>;
              return (
                <span className="st-usage">
                  {[
                    scopes ? `${scopes} scope${scopes === 1 ? "" : "s"}` : null,
                    cases ? `${cases} scenario${cases === 1 ? "" : "s"}` : null,
                    suites ? `${suites} suite${suites === 1 ? "" : "s"}` : null,
                  ].filter(Boolean).join(" · ")}
                </span>
              );
            },
          },
          {
            title: "Actions",
            key: "actions",
            width: 100,
            align: "right" as const,
            render: (_: any, record: QaModule) => {
              if (!canManage) return <span className="sc-muted">—</span>;
              const inUse = usageOf(record);
              const links = scopeLinksFor(scopeIndex, record);
              const scopeCount = scopeCountOf(record, scopeIndex);

              return (
                <div className="sc-rowactions">
                  <Tooltip title="Edit">
                    <button onClick={() => onEdit(record)} aria-label="Edit"><Pencil size={15} /></button>
                  </Tooltip>

                  {scopeCount > 0 ? (
                    // Locked rather than disabled: a disabled button swallows the
                    // hover, and the whole point here is to explain why.
                    <Tooltip
                      title={<LockedDeleteTip links={links} count={scopeCount} />}
                      overlayClassName="mlock-tip"
                      color="var(--bg-pure-white)"
                      placement="topRight"
                    >
                      <button
                        className="is-locked"
                        aria-disabled="true"
                        aria-label={`Can't delete — linked to ${scopeCount} test scope${scopeCount === 1 ? "" : "s"}`}
                        onClick={e => e.preventDefault()}
                      >
                        <Trash2 size={15} />
                        <span className="is-locked__badge"><Lock size={9} /></span>
                      </button>
                    </Tooltip>
                  ) : (
                    <ConfirmDialog
                      tone="danger"
                      title="Delete this module?"
                      description={inUse > 0
                        ? `${inUse} record${inUse === 1 ? "" : "s"} still use it — reassign them before deleting.`
                        : "It will no longer be selectable on scenarios, cases or suites."}
                      confirmText="Delete"
                      onConfirm={() => handleDelete(record.id)}
                    >
                      <Tooltip title="Delete">
                        <button className="is-danger" aria-label="Delete"><Trash2 size={15} /></button>
                      </Tooltip>
                    </ConfirmDialog>
                  )}
                </div>
              );
            },
          },
        ]}
      />
    </div>
  );
}

interface ModuleModalProps {
  open: boolean;
  /** null → creating a new module. */
  editing: QaModule | null;
  /**
   * Project to open a new module on, for callers that already know it — the
   * API Hub is filing under one project, so making the reader pick it again
   * is a question with only one right answer.
   */
  defaultProjectId?: string | null;
  onClose: () => void;
  /**
   * The module that was just written, so a caller can select it straight
   * away. Callers that only need to refresh a list can ignore it.
   */
  onSaved: (saved?: QaModule) => void;
}

export function ModuleModal({ open, editing, defaultProjectId, onClose, onSaved }: ModuleModalProps) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [successData, setSuccessData] = useState<{ name: string } | null>(null);
  const { options: projectOptions, loading: loadingProjects } = useProjectOptions(open);

  useEffect(() => {
    if (!open) {
      setSuccessData(null);
      return;
    }
    if (editing) {
      form.setFieldsValue({
        module_name: editing.module_name,
        description: editing.description || "",
        project_id: editing.project_id || undefined,
      });
    } else {
      form.resetFields();
      if (defaultProjectId) form.setFieldsValue({ project_id: defaultProjectId });
    }
    // Deliberately not keyed on projectOptions: they arrive after the modal
    // opens, and re-running this would wipe whatever has been typed by then.
  }, [open, editing, defaultProjectId, form]);

  /** Rows from before projects were required carry only the product's name — match it back. */
  useEffect(() => {
    if (!open || !editing || editing.project_id || !editing.project_name) return;
    if (form.getFieldValue("project_id")) return;
    const match = projectOptions.find(p => norm(p.label) === norm(editing.project_name));
    if (match) form.setFieldsValue({ project_id: match.value });
  }, [open, editing, form, projectOptions]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const payload = {
        module_name: values.module_name?.trim(),
        description: values.description?.trim() || null,
        project_id: values.project_id,
      };
      // `api` already unwraps to the row, so this is the module itself.
      let saved: any;
      if (editing) {
        saved = await axios.put(`/api/v2/qa/modules/${editing.id}`, payload);
        message.success("Updated successfully");
        onSaved(saved?.module_name ? (saved as QaModule) : ({ ...payload } as QaModule));
        onClose();
      } else {
        saved = await axios.post("/api/v2/qa/modules", payload);
        onSaved(saved?.module_name ? (saved as QaModule) : ({ ...payload } as QaModule));
        setSuccessData({ name: values.module_name?.trim() });
      }
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(apiError(err, "Failed to save"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={null}
      open={open}
      onCancel={onClose}
      footer={null}
      closable={false}
      width={480}
      destroyOnHidden
      centered
      styles={{
        content: { padding: 0, borderRadius: 16, overflow: "hidden" },
        body: { padding: 0 },
        mask: { backdropFilter: "blur(3px)", background: "rgba(15,23,42,0.45)" },
      }}
    >
      <div className="so-modal" data-tour="settings-new-module-modal">
        {successData ? (
          <PostCreationSuccessScreen
            itemType="Module"
            itemName={successData.name}
            onCreateAnother={() => {
              setSuccessData(null);
              form.resetFields();
              if (defaultProjectId) form.setFieldsValue({ project_id: defaultProjectId });
            }}
            onContinue={onClose}
          />
        ) : (
          <>
            <div className="so-head">
              <span className="so-head__icon"><Boxes size={17} /></span>
              <div className="so-head__text">
                <div className="so-head__title">{editing ? "Edit" : "New"} module</div>
                <div className="so-head__sub">{MODULES_HELP}</div>
              </div>
              <button className="so-head__close" onClick={onClose} aria-label="Close"><CloseOutlined /></button>
            </div>

            <Form form={form} layout="vertical" className="so-form" requiredMark={false}>
              <Form.Item
                name="project_id"
                label={<span className="so-label">Project <span className="so-req">*</span></span>}
                rules={[{ required: true, message: "Please choose the project this module belongs to" }]}
                extra={
                  <span className="so-extra">
                    {loadingProjects
                      ? "Loading your projects…"
                      : projectOptions.length
                        ? "Modules are filed per project — this one will only be offered on that project's QA work."
                        : "No active projects found — you need to belong to a project to add a module."}
                  </span>
                }
              >
                <SearchableDropdown
                  options={projectOptions}
                  placeholder="Select project"
                  searchPlaceholder="Search your projects…"
                  itemNoun="projects"
                  loading={loadingProjects}
                  style={{ width: "100%" }}
                />
              </Form.Item>

              <Form.Item
                name="module_name"
                label={<span className="so-label">Module name <span className="so-req">*</span></span>}
                rules={[{ required: true, message: "Please enter a module name" }]}
              >
                <Input placeholder="e.g. Billing" autoFocus maxLength={255} />
              </Form.Item>

              <Form.Item
                name="description"
                label={<span className="so-label">Description</span>}
                extra={<span className="so-extra">Optional — what this module covers, for whoever files cases under it.</span>}
              >
                <TextArea placeholder="e.g. Invoices, payment methods and dunning" rows={3} maxLength={500} />
              </Form.Item>
            </Form>

            <div className="so-foot">
              <Button onClick={onClose}>Cancel</Button>
              <Button type="primary" onClick={handleSave} loading={saving}>
                {editing ? "Save changes" : "Create module"}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

/** CSS for the module pane — the project cell, the filter and the locked-delete hover card. */
export const MODULE_SETTINGS_STYLES = `
/* ── Modules table: header row and project cell ─────────────── */
.st-head__actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.mod-filter { min-width: 168px; }
.mod-project {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 12.5px; font-weight: 600; color: var(--text-slate-600);
}
.mod-project svg { color: var(--text-slate-400); flex-shrink: 0; }

/* ── Delete button locked open by a test scope ──────────────── */
.sc-rowactions button.is-locked {
  position: relative; cursor: not-allowed; color: var(--text-slate-300);
}
.sc-rowactions button.is-locked:hover {
  background: rgba(239, 68, 68, .06); color: #ef4444;
}
.sc-rowactions button.is-locked .is-locked__badge {
  position: absolute; right: 2px; bottom: 2px;
  display: inline-flex; align-items: center; justify-content: center;
  width: 12px; height: 12px; border-radius: 999px;
  background: var(--bg-pure-white); color: var(--text-slate-400);
  box-shadow: 0 0 0 1px var(--border-slate-200);
}
.sc-rowactions button.is-locked:hover .is-locked__badge { color: #ef4444; }

.mlock-tip { max-width: 320px; }
.mlock-tip .ant-tooltip-inner {
  padding: 0; border-radius: 12px; overflow: hidden;
  border: 1px solid var(--border-slate-200);
  box-shadow: 0 12px 32px rgba(15, 23, 42, .14);
}
.mlock { width: 280px; background: var(--bg-pure-white); }
.mlock__head {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 11px 13px 10px; border-bottom: 1px solid var(--border-slate-100);
  background: var(--bg-slate-50);
}
.mlock__icon {
  display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
  width: 26px; height: 26px; border-radius: 8px;
  background: rgba(239, 68, 68, .1); color: #ef4444;
  border: 1px solid rgba(239, 68, 68, .18);
}
.mlock__title { font-size: 12.5px; font-weight: 700; color: var(--text-slate-900); line-height: 1.3; }
.mlock__sub { margin-top: 2px; font-size: 11px; line-height: 1.45; color: var(--text-slate-500); }
.mlock__list { list-style: none; margin: 0; padding: 8px 13px 6px; display: flex; flex-direction: column; gap: 6px; }
.mlock__row { display: flex; align-items: center; gap: 8px; min-width: 0; }
.mlock__dot { width: 5px; height: 5px; border-radius: 999px; background: #3B82F6; flex-shrink: 0; }
.mlock__name {
  flex: 1; min-width: 0; font-size: 12px; font-weight: 600; color: var(--text-slate-700);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.mlock__chip {
  flex-shrink: 0; font-size: 10px; font-weight: 600; letter-spacing: .02em;
  padding: 1px 6px; border-radius: 5px;
  color: var(--text-slate-500); background: var(--bg-slate-50);
  border: 1px solid var(--border-slate-200);
}
.mlock__more { font-size: 11px; font-weight: 600; color: var(--text-slate-400); padding-left: 13px; }
.mlock__foot {
  padding: 8px 13px 10px; border-top: 1px solid var(--border-slate-100);
  font-size: 11px; line-height: 1.45; color: var(--text-slate-500);
}

@media (max-width: 640px) {
  .st-head__actions { flex-wrap: wrap; justify-content: flex-end; }
  .mod-filter { min-width: 140px; }
}
`;


/** Deep link onto QA Space → Settings → Modules. */
export const MODULES_SETTINGS_HREF = "/qa-workspace/settings?section=modules";

/**
 * What a module dropdown shows when there is nothing to pick.
 *
 * Modules are curated in one place, so an empty dropdown is not a dead end —
 * it is a prompt to go and add the first one. Pass it to SearchableDropdown as
 * `emptyComponent`.
 */
export function NoModulesEmpty({
  projectName,
  onRefresh,
}: {
  /** Named so the reader knows *which* project has none. */
  projectName?: string | null;
  /** Re-reads the module list, for once the reader has added one next door. */
  onRefresh?: () => void;
}) {
  return (
    <div className="qa-nomod">
      <span className="qa-nomod__icon"><Boxes size={16} /></span>
      <div className="qa-nomod__title">
        {projectName ? `No modules in ${projectName} yet` : "No modules yet"}
      </div>
      <div className="qa-nomod__desc">
        Modules are the list scopes, test cases and bugs are all filed under.
        Add the first one in QA Space settings.
      </div>
      {/* A new tab, deliberately: every dropdown that shows this sits inside a
          half-filled form, and navigating away would throw that work out. */}
      <a
        className="qa-nomod__cta"
        href={MODULES_SETTINGS_HREF}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Plus size={13} />
        Create new Module
        <ArrowUpRight size={13} className="qa-nomod__go" />
      </a>
      {onRefresh && (
        <button type="button" className="qa-nomod__refresh" onClick={() => onRefresh()}>
          Added one? Refresh the list
        </button>
      )}
    </div>
  );
}

/** Styles for NoModulesEmpty — injected by every screen that offers the dropdown. */
export const NO_MODULES_STYLES = `
.qa-nomod { padding: 16px 14px 14px; text-align: center; }
.qa-nomod__icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 34px; height: 34px; margin-bottom: 9px; border-radius: 10px;
  color: #3B82F6; background: rgba(59,130,246,.1); border: 1px solid rgba(59,130,246,.2);
}
.qa-nomod__title { font-size: 12.5px; font-weight: 700; color: var(--text-slate-900); }
.qa-nomod__desc {
  margin: 4px auto 11px; max-width: 230px;
  font-size: 11.5px; line-height: 1.5; color: var(--text-slate-500);
}
.qa-nomod__cta {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px; border-radius: 999px;
  font-size: 12px; font-weight: 600;
  color: #3B82F6; background: rgba(59,130,246,.08);
  border: 1px solid rgba(59,130,246,.22);
  transition: background .15s ease, color .15s ease, border-color .15s ease;
}
.qa-nomod__cta:hover { color: #fff; background: #3B82F6; border-color: #3B82F6; }
.qa-nomod__go { opacity: .75; }
.qa-nomod__refresh {
  display: block; margin: 9px auto 0; padding: 0; border: none; background: none;
  font-size: 11px; font-weight: 600; color: var(--text-slate-400);
  cursor: pointer; text-decoration: underline; text-underline-offset: 2px;
}
.qa-nomod__refresh:hover { color: var(--text-slate-600); }
`;
