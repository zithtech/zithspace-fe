"use client";

/**
 * QA Modules — the tenant's own module list, curated in QA Space → Settings.
 *
 * Modules are what everything in QA Space is filed under. Naming a module while
 * creating a test scope registers it here on save, and the API adopts the ones
 * older scopes already named — a scope's modules and this list are one list.
 */

import React, { useCallback, useEffect, useState } from "react";
import { Button, Form, Input, Modal, Table, Tooltip, message } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { Boxes, Pencil, Plus, Trash2 } from "lucide-react";

import ConfirmDialog from "@/components/common/ConfirmDialog";
import ZukvoLoader from "@/components/common/ZukvoLoader";
import { api as axios } from "@/lib/axios";

const { TextArea } = Input;

export interface QaModule {
  id: string;
  module_name: string;
  description?: string | null;
  case_count?: number | string;
  suite_count?: number | string;
}

export const MODULES_HELP =
  "Modules group everything in QA Space — scopes, scenarios, cases and suites are all filed under one.";

const norm = (s: any) => String(s ?? "").trim().toLowerCase();

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

/**
 * Every module name typed onto a test scope, with how many scopes used it.
 * Scopes store these as free text in `details.modules`, so this is the only
 * way to know which modules the workspace is actually planning against.
 */
export function useScopeModuleNames(enabled: boolean) {
  const [counts, setCounts] = useState<Record<string, { name: string; scopes: number }>>({});

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    axios
      .get("/api/v2/qa/test-scopes?pageSize=1000")
      .then((res: any) => {
        if (cancelled) return;
        const list = Array.isArray(res) ? res : (res?.data?.data ?? res?.data ?? []);
        const tally: Record<string, { name: string; scopes: number }> = {};
        (Array.isArray(list) ? list : []).forEach((s: any) => {
          const named: any[] = Array.isArray(s?.details?.modules) ? s.details.modules : [];
          new Set(named.filter(Boolean).map((n: any) => String(n).trim())).forEach(name => {
            const key = norm(name);
            if (!key) return;
            if (!tally[key]) tally[key] = { name, scopes: 0 };
            tally[key].scopes += 1;
          });
        });
        setCounts(tally);
      })
      .catch(() => { /* the suggestions strip simply stays empty */ });
    return () => { cancelled = true; };
  }, [enabled]);

  return counts;
}

const usageOf = (m: QaModule) => Number(m.case_count || 0) + Number(m.suite_count || 0);

interface ModulesTableProps {
  items: QaModule[];
  loading: boolean;
  canManage: boolean;
  /** Module name → how many scopes named it. */
  scopeCounts: Record<string, { name: string; scopes: number }>;
  onCreate: () => void;
  onEdit: (item: QaModule) => void;
  onChanged: () => void;
}

export function ModulesTable({
  items, loading, canManage, scopeCounts, onCreate, onEdit, onChanged,
}: ModulesTableProps) {
  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/v2/qa/modules/${id}`);
      message.success("Deleted");
      onChanged();
    } catch (err: any) {
      // The API refuses modules that scenarios or suites still use — say which.
      message.error(err?.response?.data?.error || "Failed to delete");
    }
  };

  return (
    <div className="sc-tablewrap">
      <div className="st-head">
        <div className="min-w-0">
          <div className="st-head__title">Modules</div>
          <div className="st-head__desc">{MODULES_HELP}</div>
        </div>
        {canManage && (
          <Button type="primary" size="small" icon={<Plus size={14} />} onClick={onCreate}>Add Module</Button>
        )}
      </div>

      <Table
        className="ts-table sc-table"
        dataSource={items}
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
              <p className="sc-empty__title">No modules yet</p>
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
              const scopes = scopeCounts[norm(record.module_name)]?.scopes || 0;
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
              return (
                <div className="sc-rowactions">
                  <Tooltip title="Edit">
                    <button onClick={() => onEdit(record)} aria-label="Edit"><Pencil size={15} /></button>
                  </Tooltip>
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
  onClose: () => void;
  onSaved: () => void;
}

export function ModuleModal({ open, editing, onClose, onSaved }: ModuleModalProps) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.setFieldsValue({ module_name: editing.module_name, description: editing.description || "" });
    } else {
      form.resetFields();
    }
  }, [open, editing, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const payload = {
        module_name: values.module_name?.trim(),
        description: values.description?.trim() || null,
      };
      if (editing) {
        await axios.put(`/api/v2/qa/modules/${editing.id}`, payload);
        message.success("Updated successfully");
      } else {
        await axios.post("/api/v2/qa/modules", payload);
        message.success("Created successfully");
      }
      onSaved();
      onClose();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err?.response?.data?.error || "Failed to save");
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
      <div className="so-modal">
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
      </div>
    </Modal>
  );
}
