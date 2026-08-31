"use client";

/**
 * Test Scope option lists — the three dropdowns (Scope Type, Priority, Status)
 * a workspace admin curates for test scopes.
 *
 * This used to live behind a Settings tab on the Test Scope page. It now sits in
 * QA Space → Settings alongside the bug definitions, so every option list a
 * workspace curates is configured in one place.
 */

import React, { useCallback, useEffect, useState } from "react";
import { Button, Form, Input, Modal, Table, Tag, Tooltip, message } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { Check, CheckCircle2, FileText, Pencil, Plus, Settings, Trash2, TrendingUp, Search } from "lucide-react";

import ConfirmDialog from "@/components/common/ConfirmDialog";
import ZukvoLoader from "@/components/common/ZukvoLoader";
import { api as axios } from "@/lib/axios";

export type ScopeCategory = "scope_type" | "priority" | "status";

/** The three option lists a workspace admin can curate. */
export const SCOPE_SETTING_CATEGORIES: {
  key: ScopeCategory;
  label: string;
  icon: any;
  blurb: string;
  help: string;
}[] = [
  {
    key: "scope_type",
    label: "Scope Type",
    icon: FileText,
    blurb: "Kinds of test scope",
    help: "Choices offered in the Scope Type dropdown when creating or editing a test scope.",
  },
  {
    key: "priority",
    label: "Priority",
    icon: TrendingUp,
    blurb: "Urgency levels",
    help: "Priority levels available on every test scope, ordered from lowest to highest.",
  },
  {
    key: "status",
    label: "Status",
    icon: CheckCircle2,
    blurb: "Lifecycle states",
    help: "Statuses a test scope moves through, from first draft to final approval.",
  },
];

export const SCOPE_CATEGORY_LABELS: Record<ScopeCategory, string> = {
  scope_type: "Scope Type",
  priority: "Priority",
  status: "Status",
};

const COLOR_OPTIONS = [
  { value: "default", label: "Grey" }, { value: "blue", label: "Blue" }, { value: "green", label: "Green" },
  { value: "orange", label: "Orange" }, { value: "red", label: "Red" }, { value: "purple", label: "Purple" },
  { value: "cyan", label: "Cyan" }, { value: "gold", label: "Gold" },
];

/** Label → snake_case key, so admins never have to invent one by hand. */
function slugify(s: string) {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/** Which scope field a category is stored on — used for the usage count. */
const FIELD_FOR: Record<ScopeCategory, string> = {
  scope_type: "type",
  priority: "priority",
  status: "status",
};

/**
 * The option list itself. Shared by the sidebar (for counts) and the pane, so
 * both read the same fetch rather than each firing their own.
 */
export function useScopeSettings(enabled = true) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(enabled);

  const refetch = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const res: any = await axios.get(`/api/v2/qa/test-scopes/settings?_t=${Date.now()}`);
      let data: any[] = [];
      if (Array.isArray(res)) data = res;
      else if (Array.isArray(res?.data)) data = res.data;
      else if (Array.isArray(res?.data?.data)) data = res.data.data;
      setItems(data);
    } catch (err) {
      console.error("Failed to fetch test scope settings", err);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => { refetch(); }, [refetch]);

  return { items, loading, refetch };
}

/**
 * Every scope, purely so an option can say how many records still reference it
 * before an admin deletes it. Fetched once and reused across the categories.
 */
export function useScopeUsage(enabled: boolean) {
  const [scopes, setScopes] = useState<any[]>([]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    axios
      .get("/api/v2/qa/test-scopes?limit=1000")
      .then((res: any) => {
        if (cancelled) return;
        const data = Array.isArray(res) ? res : res?.data?.data || res?.data || [];
        setScopes(Array.isArray(data) ? data : []);
      })
      .catch(() => { /* the usage column simply reads "Not used" */ });
    return () => { cancelled = true; };
  }, [enabled]);

  return scopes;
}

interface ScopeOptionsTableProps {
  category: ScopeCategory;
  items: any[];
  loading: boolean;
  scopes: any[];
  canManage: boolean;
  onCreate: () => void;
  onEdit: (item: any) => void;
  onChanged: () => void;
}

export function ScopeOptionsTable({
  category, items, loading, scopes, canManage, onCreate, onEdit, onChanged,
}: ScopeOptionsTableProps) {
  const meta = SCOPE_SETTING_CATEGORIES.find(c => c.key === category);

  const [searchTerm, setSearchTerm] = useState("");

  /** How many scopes currently reference an option — shown before deleting. */
  const usageCountFor = (record: any) => {
    const field = FIELD_FOR[category];
    return scopes.filter(s => s[field] === record.value || s[field] === record.label).length;
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/v2/qa/test-scopes/settings/${id}`);
      message.success("Deleted");
      onChanged();
    } catch { message.error("Failed to delete"); }
  };

  const visible = items.filter(s => {
    if (s.category !== category) return false;
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      return (
        s.label.toLowerCase().includes(lowerSearch) ||
        s.value.toLowerCase().includes(lowerSearch)
      );
    }
    return true;
  });

  return (
    <div className="sc-tablewrap">
      <div className="st-head">
        <div className="min-w-0">
          <div className="st-head__title">{SCOPE_CATEGORY_LABELS[category]} options</div>
          <div className="st-head__desc">{meta?.help}</div>
        </div>
        <div className="st-head__actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Input
            placeholder="Search…"
            prefix={<Search size={14} style={{ color: "var(--text-slate-400)" }} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          {canManage && (
            <Button type="primary" size="small" icon={<Plus size={14} />} onClick={onCreate}>Add Option</Button>
          )}
        </div>
      </div>

      <Table
        className="ts-table sc-table"
        dataSource={visible}
        rowKey="id"
        pagination={false}
        scroll={{ x: "max-content" }}
        locale={{
          emptyText: loading ? (
            <ZukvoLoader size="md" message="Loading options…" />
          ) : (
            <div className="sc-empty">
              <Settings size={26} className="sc-empty__icon" />
              <p className="sc-empty__title">No {SCOPE_CATEGORY_LABELS[category].toLowerCase()} options yet</p>
              <p className="sc-empty__desc">{meta?.help}</p>
              {canManage && (
                <Button type="primary" size="small" icon={<Plus size={14} />} onClick={onCreate}>Add the first option</Button>
              )}
            </div>
          ),
        }}
        columns={[
          {
            title: "Option",
            dataIndex: "label",
            render: (label: string, record: any) => (
              <div className="st-option">
                <Tag color={record.color && record.color !== "default" ? record.color : undefined} className="st-option__tag">
                  {label}
                </Tag>
                <span className="st-option__hint">as it appears in dropdowns</span>
              </div>
            ),
          },
          {
            title: "Value key",
            dataIndex: "value",
            width: 220,
            render: (v: string) => <code className="st-code">{v}</code>,
          },
          {
            title: "Used by",
            key: "usage",
            width: 140,
            render: (_: any, record: any) => {
              const n = usageCountFor(record);
              return n > 0
                ? <span className="st-usage">{n} scope{n === 1 ? "" : "s"}</span>
                : <span className="st-usage is-empty">Not used</span>;
            },
          },
          {
            title: "Actions",
            key: "actions",
            width: 100,
            align: "right" as const,
            render: (_: any, record: any) => {
              const inUse = usageCountFor(record);
              // Curating the option lists is a QA-manage action
              if (!canManage) return <span className="sc-muted">—</span>;
              return (
                <div className="sc-rowactions">
                  <Tooltip title="Edit">
                    <button onClick={() => onEdit(record)} aria-label="Edit"><Pencil size={15} /></button>
                  </Tooltip>
                  <ConfirmDialog
                    tone="danger"
                    title="Delete this option?"
                    description={inUse > 0
                      ? `${inUse} scope${inUse === 1 ? "" : "s"} still use this — they'll keep the value but it won't be selectable.`
                      : "It will no longer be selectable on test scopes."}
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

interface ScopeOptionModalProps {
  open: boolean;
  category: ScopeCategory;
  /** null → creating a new option. */
  editing: any | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ScopeOptionModal({ open, category, editing, onClose, onSaved }: ScopeOptionModalProps) {
  const [form] = Form.useForm();
  /** Once the user edits the key by hand we stop deriving it from the label. */
  const [keyTouched, setKeyTouched] = useState(false);
  const draftLabel = Form.useWatch("label", form);
  const draftColor = Form.useWatch("color", form);
  const meta = SCOPE_SETTING_CATEGORIES.find(c => c.key === category);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setKeyTouched(true);
      form.setFieldsValue({ value: editing.value, label: editing.label, color: editing.color || "default" });
    } else {
      setKeyTouched(false);
      form.resetFields();
      form.setFieldsValue({ color: "default" });
    }
  }, [open, editing, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        await axios.put(`/api/v2/qa/test-scopes/settings/${editing.id}`, values);
        message.success("Updated successfully");
      } else {
        await axios.post("/api/v2/qa/test-scopes/settings", { ...values, category });
        message.success("Created successfully");
      }
      onSaved();
      onClose();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error("Failed to save");
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
          <span className="so-head__icon">
            {(() => { const Icon = meta?.icon || Settings; return <Icon size={17} />; })()}
          </span>
          <div className="so-head__text">
            <div className="so-head__title">
              {editing ? "Edit" : "New"} {SCOPE_CATEGORY_LABELS[category]} option
            </div>
            <div className="so-head__sub">{meta?.help}</div>
          </div>
          <button className="so-head__close" onClick={onClose} aria-label="Close">
            <CloseOutlined />
          </button>
        </div>

        {/* Live preview of the badge being configured */}
        <div className="so-preview">
          <span className="so-preview__label">Preview</span>
          <Tag
            color={draftColor && draftColor !== "default" ? draftColor : undefined}
            className="so-preview__tag"
          >
            {draftLabel?.trim() || `New ${SCOPE_CATEGORY_LABELS[category].toLowerCase()}`}
          </Tag>
        </div>

        <Form form={form} layout="vertical" className="so-form" requiredMark={false}>
          <Form.Item
            name="label"
            label={<span className="so-label">Display label <span className="so-req">*</span></span>}
            rules={[{ required: true, message: "Please enter a label" }]}
          >
            <Input
              placeholder="e.g. Feature Release"
              autoFocus
              onChange={(e) => {
                // Keep the key in sync until the user edits it themselves
                if (!keyTouched && !editing) {
                  form.setFieldsValue({ value: slugify(e.target.value) });
                }
              }}
            />
          </Form.Item>

          <Form.Item
            name="value"
            label={<span className="so-label">Value key <span className="so-req">*</span></span>}
            rules={[{ required: true, message: "Please enter a value key" }]}
            extra={<span className="so-extra">Stored on each scope. Auto-filled from the label — edit it if you need a different key.</span>}
          >
            <Input placeholder="e.g. feature_release" onChange={() => setKeyTouched(true)} />
          </Form.Item>

          {/* The field stays registered here; the swatches drive it directly,
              so antd never injects value/onChange onto a plain element. */}
          <Form.Item name="color" hidden><Input /></Form.Item>
          <div className="so-colorblock">
            <span className="so-label">Badge colour</span>
            <div className="so-swatches">
              {COLOR_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  title={opt.label}
                  aria-label={opt.label}
                  onClick={() => form.setFieldsValue({ color: opt.value })}
                  className={`so-swatch so-swatch--${opt.value}${draftColor === opt.value ? " is-active" : ""}`}
                >
                  {draftColor === opt.value ? <Check size={12} strokeWidth={3.5} /> : null}
                </button>
              ))}
            </div>
          </div>
        </Form>

        <div className="so-foot">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" onClick={handleSave}>
            {editing ? "Save changes" : "Create option"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/** CSS for the table and the option modal — scoped to the classes used above. */
export const SCOPE_SETTINGS_STYLES = `
/* ── Scope Settings: table header + cells ───────────────────── */
.st-head {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 11px 14px; border-bottom: 1px solid var(--border-slate-200);
  background: var(--bg-slate-50);
}
.st-head__title { font-size: 13px; font-weight: 650; color: var(--text-slate-900); }
.st-head__desc { font-size: 11.5px; color: var(--text-slate-400); margin-top: 2px; }
.st-option { display: flex; align-items: center; gap: 10px; }
.st-option__tag { margin: 0 !important; font-size: 12px; border-radius: 6px; }
.st-option__hint { font-size: 11px; color: var(--text-slate-400); }
/* Colour-carrying option badge — tinted from the option's own hex. */
.st-tag {
  display: inline-flex; align-items: center; height: 22px; padding: 0 9px;
  border-radius: 6px; font-size: 12px; font-weight: 600; white-space: nowrap;
  color: var(--text-slate-600); background: var(--bg-slate-50);
  border: 1px solid var(--border-slate-200);
}
.st-code {
  font-size: 11.5px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  padding: 2px 7px; border-radius: 6px;
  background: var(--bg-slate-50); border: 1px solid var(--border-slate-100);
  color: var(--text-slate-600);
}
.st-desc { font-size: 12.5px; color: var(--text-slate-600); }
.st-usage { font-size: 12px; font-weight: 600; color: var(--text-slate-600); }
.st-usage.is-empty { font-weight: 500; color: var(--text-slate-400); }
.sc-muted { color: var(--text-slate-400); }

.sc-rowactions button {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 8px; border: none; background: transparent;
  color: var(--text-slate-400); cursor: pointer; transition: all .15s ease;
}
.sc-rowactions button:hover { background: var(--bg-slate-50); color: var(--text-slate-700); }
.sc-rowactions button.is-danger:hover { background: rgba(239,68,68,0.08); color: #ef4444; }

`;

/**
 * Chrome for the settings-option modal — head, form rows and footer.
 *
 * Split out from the pane styles because the modals themselves are reused
 * outside QA Settings (the API Hub opens ModuleModal from its module picker),
 * and a modal that travels without its CSS arrives unstyled.
 */
export const SETTINGS_MODAL_STYLES = `
/* ── Settings option modal ──────────────────────────────────── */
.so-modal { background: var(--bg-pure-white); }
.so-head {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 18px 20px 16px; border-bottom: 1px solid var(--border-slate-100);
}
.so-head__icon {
  display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
  width: 36px; height: 36px; border-radius: 10px;
  background: rgba(59,130,246,.1); color: #3B82F6;
  border: 1px solid rgba(59,130,246,.2);
}
.so-head__text { flex: 1; min-width: 0; }
.so-head__title { font-size: 15px; font-weight: 700; color: var(--text-slate-900); letter-spacing: -.01em; }
.so-head__sub { margin-top: 3px; font-size: 12px; line-height: 1.45; color: var(--text-slate-500); }
.so-head__close {
  display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
  width: 28px; height: 28px; border-radius: 8px; font-size: 12px; border: none; background: transparent;
  color: var(--text-slate-400); transition: all .15s ease; cursor: pointer;
}
.so-head__close:hover { color: var(--text-slate-900); background: var(--bg-slate-50); }

.so-preview {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 20px; background: var(--bg-slate-50);
  border-bottom: 1px solid var(--border-slate-100);
}
.so-preview__label {
  font-size: 10.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
  color: var(--text-slate-400);
}
.so-preview__tag { margin: 0 !important; font-size: 12.5px; border-radius: 6px; }

.so-form { padding: 18px 20px 4px; }
.so-form .ant-form-item { margin-bottom: 16px; }
.so-form .ant-input { border-radius: 8px; height: 36px; }
.so-label { font-size: 12.5px; font-weight: 600; color: var(--text-slate-700); }
.so-req { color: #ef4444; }
.so-extra { font-size: 11.5px; color: var(--text-slate-400); line-height: 1.45; }

.so-colorblock { padding-bottom: 18px; }
.so-colorblock .so-label { display: block; margin-bottom: 8px; }
.so-swatches { display: flex; flex-wrap: wrap; gap: 8px; }
.so-swatch {
  width: 28px; height: 28px; border-radius: 8px; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  color: #fff; border: 1px solid rgba(15,23,42,.08);
  transition: transform .15s ease, box-shadow .15s ease;
}
.so-swatch:hover { transform: translateY(-1px); }
.so-swatch.is-active { box-shadow: 0 0 0 2px var(--bg-pure-white), 0 0 0 4px currentColor; }
.so-swatch--default { background: #94a3b8; color: #64748b; }
.so-swatch--blue { background: #3b82f6; color: #3b82f6; }
.so-swatch--green { background: #10b981; color: #10b981; }
.so-swatch--orange { background: #f59e0b; color: #f59e0b; }
.so-swatch--red { background: #ef4444; color: #ef4444; }
.so-swatch--purple { background: #8b5cf6; color: #8b5cf6; }
.so-swatch--cyan { background: #06b6d4; color: #06b6d4; }
.so-swatch--gold { background: #d97706; color: #d97706; }
.so-swatch.is-active svg { color: #fff; }

.so-foot {
  display: flex; align-items: center; justify-content: flex-end; gap: 8px;
  padding: 14px 20px; border-top: 1px solid var(--border-slate-100);
  background: var(--bg-slate-50);
}
.so-foot .ant-btn { height: 34px; border-radius: 8px; }
`;
