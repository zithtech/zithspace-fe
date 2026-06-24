"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Tabs, Button, message, Table, Switch, Input, Tooltip, Drawer, AutoComplete } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  Hash,
  IdCard,
  Pencil,
  Save,
  Lock,
  FileText,
  Plus,
  Trash2,
  X,
  Check,
  RefreshCw,
} from "lucide-react";
import OnboardingGuard from "@/components/onboarding/OnboardingGuard";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useEmployeeSetting } from "@/hooks/use-employee-settings";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { EmployeeOnboardingService } from "@/services/onboardingService";

// Employee codes are PREFIX-NNNNNN: a text prefix (1–30 letters) + a fixed
// 6-digit zero-padded sequence (e.g. EMP-000001). The prefix is tenant-based
// and configurable; the 6-digit width is mandatory.
const PREFIX_RE = /^[A-Za-z]{1,30}$/;

/* ───────────────────────── Tab 1: EMP Code Structure ───────────────────── */
function EmpCodeStructureTab() {
  const { canUpdateOnboardingSetting } = usePermission();
  const { setting, saveSetting, loading } = useEmployeeSetting();

  const [prefix, setPrefix] = useState("EMP");
  const [isSaved, setIsSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (setting?.employeeCodePrefix) {
      const p = String(setting.employeeCodePrefix);
      setPrefix(p ? p.charAt(0).toUpperCase() + p.slice(1) : p);
      setIsSaved(true);
      setIsEditing(false);
    }
  }, [setting]);

  const locked = (isSaved && !isEditing) || !canUpdateOnboardingSetting;

  const onChange = (v: string) => {
    // Letters only, capped at 30, with the first letter capitalized.
    let cleaned = v.replace(/[^A-Za-z]/g, "").slice(0, 30);
    if (cleaned) cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    setPrefix(cleaned);
    setErr(cleaned.length === 0 ? "Prefix is required" : null);
  };

  const save = async () => {
    if (!PREFIX_RE.test(prefix)) {
      setErr("Use 1–30 letters only (A–Z)");
      return;
    }
    const result = await saveSetting({ employeeCodePrefix: prefix });
    if (result) {
      message.success("Employee code structure saved");
      setIsSaved(true);
      setIsEditing(false);
    } else {
      message.error("Failed to save settings");
    }
  };

  const shown = prefix || "EMP";
  const preview = `${shown}-000001`;

  return (
    <div className="empc">
      <div className="empc-intro">
        <h3 className="empc-h">Employee Code Structure</h3>
        <p className="empc-sub">
          Define how employee codes are generated for your organization. Every code is a text prefix
          followed by a fixed <strong>6-digit</strong> sequence.
        </p>
      </div>

      {/* Structure blocks */}
      <div className="empc-structure">
        <div className="empc-seg">
          <span className="empc-seg-label">TEXT PREFIX</span>
          <span className="empc-seg-val">{shown}</span>
          <span className="empc-seg-hint">up to 30 letters</span>
        </div>
        <span className="empc-dash">-</span>
        <div className="empc-seg empc-seg--locked">
          <span className="empc-seg-label">
            <Lock size={11} style={{ marginRight: 4, verticalAlign: "-1px" }} />
            NUMBER
          </span>
          <span className="empc-seg-val">000001</span>
          <span className="empc-seg-hint">6 digits · auto · zero-padded</span>
        </div>
      </div>

      {/* Live preview */}
      <div className="empc-preview">
        <span className="empc-preview-label">Preview</span>
        <span className="empc-preview-code">{preview}</span>
      </div>

      {/* Prefix field */}
      <div className="empc-field">
        <label className="empc-field-label">Text Prefix</label>
        <div className="empc-field-row">
          <input
            type="text"
            value={prefix}
            placeholder="EMP"
            maxLength={30}
            disabled={locked || loading}
            onChange={(e) => onChange(e.target.value)}
            className="empc-input"
            style={{
              background: locked ? "var(--bg-slate-50)" : "var(--bg-pure-white)",
              cursor: locked ? "not-allowed" : "text",
            }}
          />
          <span className="empc-count">{prefix.length}/30</span>

          {canUpdateOnboardingSetting && (
            <>
              {(!isSaved || isEditing) && (
                <Button
                  type="primary"
                  icon={<Save size={15} />}
                  loading={loading}
                  onClick={save}
                  className="empc-btn"
                >
                  {isSaved ? "Update" : "Save"}
                </Button>
              )}
              {isSaved && !isEditing && (
                <Button
                  icon={<Pencil size={15} />}
                  onClick={() => setIsEditing(true)}
                  className="empc-btn"
                >
                  Edit
                </Button>
              )}
            </>
          )}
        </div>
        {err ? (
          <span className="empc-err">{err}</span>
        ) : (
          <span className="empc-help">Letters only (A–Z). This prefix applies to all new employees in your tenant.</span>
        )}
      </div>

      <style jsx global>{`
        .empc { max-width: 680px; }
        .empc-intro { margin-bottom: 22px; }
        .empc-h { font-size: 16px; font-weight: 700; color: var(--text-slate-900); margin: 0 0 4px; }
        .empc-sub { font-size: 13px; color: var(--text-slate-500); margin: 0; line-height: 1.55; }

        .empc-structure { display: flex; align-items: stretch; gap: 12px; margin-bottom: 18px; }
        .empc-seg {
          flex: 1; border: 1px solid var(--border-slate-200); border-radius: 12px;
          padding: 14px 16px; background: var(--bg-pure-white);
          display: flex; flex-direction: column; gap: 4px;
        }
        .empc-seg--locked { background: var(--bg-slate-50); }
        .empc-seg-label { font-size: 10px; font-weight: 700; letter-spacing: 0.06em; color: var(--text-slate-400); }
        .empc-seg-val { font-size: 20px; font-weight: 800; color: var(--text-slate-900); font-family: ui-monospace, monospace; letter-spacing: -0.01em; }
        .empc-seg-hint { font-size: 11px; color: var(--text-slate-400); }
        .empc-dash { align-self: center; font-size: 24px; font-weight: 800; color: var(--text-slate-300); }

        .empc-preview {
          display: flex; align-items: center; gap: 12px; margin-bottom: 24px;
          padding: 14px 16px; border-radius: 12px; border: 1px dashed var(--border-slate-200);
          background: var(--bg-blue-50, #eff6ff);
        }
        .empc-preview-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-slate-400); }
        .empc-preview-code {
          font-size: 18px; font-weight: 800; color: #2563eb; font-family: ui-monospace, monospace; letter-spacing: 0.02em;
        }

        .empc-field-label { display: block; font-size: 13px; font-weight: 600; color: var(--text-slate-700); margin-bottom: 8px; }
        .empc-field-row { display: flex; align-items: center; gap: 12px; }
        .empc-input {
          flex: 1; max-width: 280px; padding: 11px 14px; border-radius: 10px;
          border: 1px solid var(--border-slate-200); font-size: 14px; color: var(--text-slate-900);
          letter-spacing: 0.03em; outline: none;
          transition: border-color .12s ease, box-shadow .12s ease;
        }
        .empc-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.10); }
        .empc-count { font-size: 12px; color: var(--text-slate-400); font-variant-numeric: tabular-nums; }
        .empc-btn { height: 40px !important; border-radius: 10px !important; font-weight: 600 !important; }
        .empc-help { display: block; font-size: 12px; color: var(--text-slate-400); margin-top: 8px; }
        .empc-err { display: block; font-size: 12px; color: #ef4444; margin-top: 8px; font-weight: 500; }
      `}</style>
    </div>
  );
}

/* ──────────────────────── Tab 2: Documents Needed ──────────────────────── */
interface DocumentType {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
}

// Suggestions shown in the searchable Name dropdown. Users can also type their
// own value (AutoComplete accepts free text).
const DOC_SUGGESTIONS = [
  "Offer Letter",
  "Appointment Letter",
  "Relieving Letter",
  "Experience Letter",
  "Service Letter",
  "Resignation Acceptance Letter",
  "Form 16",
  "3 Months Payslip",
  "6 Months Payslip",
  "Salary Slip",
  "Last Drawn Salary Certificate",
  "Appraisal Letter",
  "Promotion Letter",
  "Bank Statement",
  "PF Statement",
  "Address Proof",
];

function DocumentsNeededTab() {
  const { canUpdateOnboardingSetting } = usePermission();

  const [rows, setRows] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(false);

  // Add form (in a Drawer, opened by the "Add Document" button).
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Inline edit state.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // Per-row toggle busy flag (so we only disable the row being toggled).
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // ── Defensive readers: the api helper may unwrap to the value, or hand back
  // the full body. Accept the array/object at any of res / res.data / res.data.data.
  const readList = (res: any): DocumentType[] => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.data)) return res.data.data;
    return [];
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await EmployeeOnboardingService.listDocumentTypes();
      setRows(readList(res));
    } catch (err: any) {
      message.error(err?.message || "Failed to load document types");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ── Create ────────────────────────────────────────────────────────────────
  const resetAdd = () => {
    setName("");
    setDescription("");
    setDrawerOpen(false);
  };

  const create = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      message.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      await EmployeeOnboardingService.createDocumentType({
        name: trimmed,
        description: description.trim() || undefined,
      });
      message.success("Document added");
      resetAdd();
      await load();
    } catch (err: any) {
      // 409 → duplicate name (the service surfaces the server message).
      message.error(err?.message || "Failed to add document");
    } finally {
      setSaving(false);
    }
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const startEdit = (r: DocumentType) => {
    setEditingId(r.id);
    setEditName(r.name);
    setEditDescription(r.description || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditDescription("");
  };

  const saveEdit = async (r: DocumentType) => {
    const trimmed = editName.trim();
    if (!trimmed) {
      message.error("Name is required");
      return;
    }
    setEditSaving(true);
    try {
      await EmployeeOnboardingService.updateDocumentType(r.id, {
        name: trimmed,
        description: editDescription.trim() || undefined,
      });
      message.success("Document updated");
      cancelEdit();
      await load();
    } catch (err: any) {
      message.error(err?.message || "Failed to update document");
    } finally {
      setEditSaving(false);
    }
  };

  // ── Toggle active ───────────────────────────────────────────────────────────
  const toggleActive = async (r: DocumentType, next: boolean) => {
    setTogglingId(r.id);
    try {
      await EmployeeOnboardingService.updateDocumentType(r.id, { isActive: next });
      message.success(next ? "Document enabled" : "Document disabled");
      await load();
    } catch (err: any) {
      message.error(err?.message || "Failed to update document");
    } finally {
      setTogglingId(null);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const remove = async (r: DocumentType) => {
    try {
      await EmployeeOnboardingService.deleteDocumentType(r.id);
      message.success("Document removed");
      await load();
    } catch (err: any) {
      message.error(err?.message || "Failed to remove document");
    }
  };

  const columns: ColumnsType<DocumentType> = [
    {
      title: "Name",
      key: "name",
      render: (_, r) => {
        if (editingId === r.id) {
          return (
            <Input
              autoFocus
              value={editName}
              maxLength={120}
              onChange={(e) => setEditName(e.target.value)}
              onPressEnter={() => saveEdit(r)}
              placeholder="Document name"
              style={{ borderRadius: 8 }}
            />
          );
        }
        return <span style={{ fontWeight: 600, color: "var(--text-slate-900)" }}>{r.name}</span>;
      },
    },
    {
      title: "Description",
      key: "description",
      render: (_, r) => {
        if (editingId === r.id) {
          return (
            <Input
              value={editDescription}
              maxLength={240}
              onChange={(e) => setEditDescription(e.target.value)}
              onPressEnter={() => saveEdit(r)}
              placeholder="Optional description"
              style={{ borderRadius: 8 }}
            />
          );
        }
        return (
          <span style={{ color: "var(--text-slate-500)" }}>{r.description || "—"}</span>
        );
      },
    },
    {
      title: "Active",
      key: "isActive",
      width: 90,
      render: (_, r) => (
        <Switch
          size="small"
          checked={!!r.isActive}
          loading={togglingId === r.id}
          disabled={!canUpdateOnboardingSetting || editingId === r.id}
          onChange={(next) => toggleActive(r, next)}
        />
      ),
    },
    {
      title: "",
      key: "actions",
      width: 120,
      align: "right",
      render: (_, r) => {
        if (!canUpdateOnboardingSetting) return null;
        if (editingId === r.id) {
          return (
            <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
              <Tooltip title="Save">
                <Button
                  type="text"
                  size="small"
                  loading={editSaving}
                  icon={<Check size={15} />}
                  style={{ color: "#10B981" }}
                  onClick={() => saveEdit(r)}
                />
              </Tooltip>
              <Tooltip title="Cancel">
                <Button
                  type="text"
                  size="small"
                  icon={<X size={15} />}
                  onClick={cancelEdit}
                />
              </Tooltip>
            </div>
          );
        }
        return (
          <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
            <Tooltip title="Edit">
              <Button
                type="text"
                size="small"
                icon={<Pencil size={15} />}
                onClick={() => startEdit(r)}
              />
            </Tooltip>
            <ConfirmDialog
              tone="danger"
              icon={<Trash2 size={16} />}
              title="Remove this document?"
              description={`"${r.name}" will no longer be requested from new hires.`}
              confirmText="Remove"
              placement="bottomRight"
              onConfirm={() => remove(r)}
            >
              <Tooltip title="Remove">
                <Button type="text" size="small" danger icon={<Trash2 size={15} />} />
              </Tooltip>
            </ConfirmDialog>
          </div>
        );
      },
    },
  ];

  return (
    <div className="docn">
      <div className="docn-intro">
        <div className="docn-intro-text">
          <h3 className="docn-h">Documents Needed</h3>
          <p className="docn-sub">
            Documents you want new hires to provide from their previous employer. These appear in
            each Employment-History entry on the onboarding form.
          </p>
        </div>
        <div className="docn-intro-actions">
          <Tooltip title="Refresh">
            <button type="button" className="docn-ghost-btn" onClick={load} aria-label="Refresh">
              <RefreshCw size={15} className={loading ? "docn-spin" : ""} />
            </button>
          </Tooltip>
          {canUpdateOnboardingSetting && (
            <Button
              type="primary"
              icon={<Plus size={16} />}
              onClick={() => setDrawerOpen(true)}
              className="docn-btn"
            >
              Add Document
            </Button>
          )}
        </div>
      </div>

      {/* Add Document drawer */}
      <Drawer
        title={null}
        open={drawerOpen}
        onClose={resetAdd}
        width={460}
        closable={false}
        destroyOnClose
        styles={{
          body: { padding: 0, background: "var(--bg-pure-white)" },
          header: { display: "none" },
          mask: { backdropFilter: "blur(2px)", background: "rgba(15,23,42,0.45)" },
        }}
      >
        <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
          {/* Header */}
          <div className="docn-drawer-head">
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              <span className="docn-drawer-icon"><FileText size={18} /></span>
              <div style={{ minWidth: 0 }}>
                <div className="docn-drawer-title">Add Document</div>
                <div className="docn-drawer-sub">Pick from common documents or type your own</div>
              </div>
            </div>
            <Button type="text" shape="circle" icon={<X size={18} />} onClick={resetAdd} />
          </div>

          {/* Body */}
          <div className="docn-drawer-body">
            <div className="docn-field">
              <label className="docn-field-label">
                Name <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <AutoComplete
                value={name}
                onChange={(v) => setName(v)}
                style={{ width: "100%" }}
                allowClear
                options={DOC_SUGGESTIONS.map((s) => ({ value: s }))}
                filterOption={(input, option) =>
                  String(option?.value ?? "").toLowerCase().includes(input.toLowerCase())
                }
                placeholder="Search or type a document name…"
              >
                <Input maxLength={120} onPressEnter={create} />
              </AutoComplete>
              <span className="docn-field-hint">
                Choose a suggestion or enter a custom document name.
              </span>
            </div>

            <div className="docn-field">
              <label className="docn-field-label">Description</label>
              <Input.TextArea
                value={description}
                maxLength={240}
                rows={3}
                placeholder="Optional — what this is / why it's needed"
                onChange={(e) => setDescription(e.target.value)}
                style={{ borderRadius: 8 }}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="docn-drawer-foot">
            <Button onClick={resetAdd} className="docn-btn-sm">Cancel</Button>
            <Button
              type="primary"
              icon={<Save size={15} />}
              loading={saving}
              onClick={create}
              className="docn-btn-sm"
            >
              Save Document
            </Button>
          </div>
        </div>
      </Drawer>

      {/* List */}
      <div className="docn-table-wrap">
        <Table
          rowKey="id"
          size="small"
          className="docn-table"
          loading={loading}
          columns={columns}
          dataSource={rows}
          pagination={{ pageSize: 10, hideOnSinglePage: true, size: "small" }}
          locale={{ emptyText: "No documents yet — add the ones you need from new hires." }}
        />
      </div>

      <style jsx global>{`
        .docn { width: 100%; }
        .docn-intro {
          display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
          margin-bottom: 18px;
        }
        .docn-intro-text { min-width: 0; }
        .docn-h { font-size: 16px; font-weight: 700; color: var(--text-slate-900); margin: 0 0 4px; }
        .docn-sub { font-size: 13px; color: var(--text-slate-500); margin: 0; line-height: 1.55; max-width: 520px; }
        .docn-intro-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .docn-ghost-btn {
          width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--border-slate-200);
          background: var(--bg-slate-50); color: var(--text-slate-700); cursor: pointer;
          display: inline-flex; align-items: center; justify-content: center;
        }
        .docn-ghost-btn:hover { color: #2563eb; border-color: #bfdbfe; }
        .docn-spin { animation: docn-rot 0.9s linear infinite; }
        @keyframes docn-rot { to { transform: rotate(360deg); } }
        .docn-btn { height: 36px !important; border-radius: 8px !important; font-weight: 600 !important; }
        .docn-btn-sm { height: 34px !important; border-radius: 8px !important; font-weight: 600 !important; }

        .docn-field-label {
          display: block; font-size: 12px; font-weight: 600; color: var(--text-slate-700); margin-bottom: 6px;
        }
        /* Add-Document drawer */
        .docn-drawer-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 18px 14px; border-bottom: 1px solid var(--border-slate-200);
        }
        .docn-drawer-icon {
          width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
          background: var(--bg-blue-50, #eff6ff); color: #2563eb;
          display: inline-flex; align-items: center; justify-content: center;
        }
        .docn-drawer-title { font-size: 16px; font-weight: 700; color: var(--text-slate-900); line-height: 1.2; }
        .docn-drawer-sub { font-size: 12px; color: var(--text-slate-500); margin-top: 2px; }
        .docn-drawer-body {
          flex: 1; overflow-y: auto; padding: 20px 18px;
          display: flex; flex-direction: column; gap: 18px;
          background: var(--bg-secondary, #f8fafc);
        }
        .docn-field-hint { display: block; font-size: 11.5px; color: var(--text-slate-400); margin-top: 6px; }
        .docn-drawer-foot {
          display: flex; justify-content: flex-end; gap: 10px;
          padding: 14px 18px; border-top: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white);
        }

        .docn-table-wrap {
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
          border-radius: 12px; overflow: hidden;
        }
        .docn-table .ant-table { background: transparent; font-size: 13px; }
        .docn-table .ant-table-thead > tr > th {
          background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em;
          text-transform: uppercase; color: var(--text-slate-400) !important; padding: 9px 14px !important;
          white-space: nowrap !important;
        }
        .docn-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 10px 14px !important; }
        .docn-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .docn-table .ant-table-tbody > tr:hover > td { background: var(--bg-slate-50) !important; }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────── Page ──────────────────────────────────── */
const Settings = () => {
  const { canReadOnboardingSetting } = usePermission();
  const { isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !canReadOnboardingSetting) {
      router.push("/onboarding/onboarded");
    }
  }, [authLoading, canReadOnboardingSetting, router]);

  if (authLoading || !canReadOnboardingSetting) return null;

  return (
    <OnboardingGuard itemKey="settings">
      <div style={{ width: "100%", padding: "24px 24px 40px" }}>
        {/* 1 — Header + subtitle + divider (full width) */}
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: "var(--text-slate-900)", letterSpacing: "-0.02em" }}>
          Settings
        </h1>
        <p style={{ color: "var(--text-slate-500)", marginTop: 4, marginBottom: 0, fontSize: 13 }}>
          Manage your employee onboarding configuration
        </p>
        <div style={{ height: 1, background: "var(--border-slate-200)", margin: "16px 0 4px" }} />

        {/* 2 — Tabs (extensible)   ·   3 — Content (no card, full width) */}
        <Tabs
          defaultActiveKey="empcode"
          className="onb-settings-tabs"
          items={[
            {
              key: "empcode",
              label: (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <IdCard size={15} /> EMP Code Structure
                </span>
              ),
              children: <EmpCodeStructureTab />,
            },
            {
              key: "documents",
              label: (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <FileText size={15} /> Documents Needed
                </span>
              ),
              children: <DocumentsNeededTab />,
            },
          ]}
        />
      </div>

      <style jsx global>{`
        .onb-settings-tabs .ant-tabs-nav { margin-bottom: 22px; }
        .onb-settings-tabs .ant-tabs-tab { padding: 12px 2px !important; font-weight: 600; color: var(--text-slate-500); }
        .onb-settings-tabs .ant-tabs-tab + .ant-tabs-tab { margin-left: 28px !important; }
        .onb-settings-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color: #2563eb !important; }
        .onb-settings-tabs .ant-tabs-ink-bar { background: #2563eb !important; height: 3px !important; border-radius: 3px 3px 0 0; }
      `}</style>
    </OnboardingGuard>
  );
};

export default Settings;
