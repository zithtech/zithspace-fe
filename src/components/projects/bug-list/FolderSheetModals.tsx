"use client";

import React, { useEffect, useState } from "react";
import { Form, Input, Modal, Select, ConfigProvider, theme as antdTheme } from "antd";
import {
  FolderPlus,
  FileSpreadsheet,
  Sparkles,
  Loader2,
  X,
  Folder,
  Layers,
  Link2,
  Check,
} from "lucide-react";
import {
  useCreateBugFolder,
  useCreateBugSheet,
  useUpdateBugFolder,
  useUpdateBugSheet,
} from "@/hooks/useBugList";
import type { BugFolder, BugSheet } from "@/services/bugListService";
import { useAllProjects, useUserProjects } from "@/hooks/useGlobalData";
import { useTheme } from "@/context/ThemeContext";

const FOLDER_COLORS = [
  "#5b9bff",
  "#7c5cff",
  "#3fbf8f",
  "#0ea5e9",
  "#ff5a4e",
  "#ec4899",
  "#06b6d4",
  "#a855f7",
  "#64748b",
];

interface FolderModalProps {
  open: boolean;
  editing: BugFolder | null;
  defaultProjectId?: string | null;
  onClose: () => void;
}

export function FolderModal({ open, editing, defaultProjectId, onClose }: FolderModalProps) {
  const [form] = Form.useForm();
  const createMut = useCreateBugFolder();
  const updateMut = useUpdateBugFolder();
  const { data: projects } = useAllProjects();
  const { theme } = useTheme();
  const [color, setColor] = useState<string>(FOLDER_COLORS[0]);
  const [name, setName] = useState("");

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.setFieldsValue({
        name: editing.name,
        description: editing.description || "",
        color: editing.color || FOLDER_COLORS[0],
        projectId: editing.projectId || undefined,
      });
      setColor(editing.color || FOLDER_COLORS[0]);
      setName(editing.name || "");
    } else {
      form.resetFields();
      form.setFieldsValue({ 
        color: FOLDER_COLORS[0],
        projectId: defaultProjectId || undefined,
      });
      setColor(FOLDER_COLORS[0]);
      setName("");
    }
  }, [open, editing, defaultProjectId, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    if (editing) {
      await updateMut.mutateAsync({ id: editing.id, input: values });
    } else {
      await createMut.mutateAsync(values);
    }
    onClose();
  };

  const submitting = createMut.isPending || updateMut.isPending;
  const initial = (name || "?").trim().charAt(0).toUpperCase();

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closable={false}
      destroyOnHidden
      width={520}
      centered
      maskClosable={!submitting}
      wrapClassName={`hb-fsm-wrap ${theme === "dark" ? "hb-fsm-dark" : "hb-fsm-light"}`}
      styles={{
        mask: { backdropFilter: "blur(8px)", background: "rgba(8,12,24,0.55)" },
        content: { padding: 0, borderRadius: 18, overflow: "hidden", background: "transparent", boxShadow: "0 30px 80px rgba(8,12,24,0.45)" },
        body: { padding: 0 },
      }}
    >
      <ConfigProvider
        theme={{
          algorithm: theme === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
          token: {
            colorBgContainer: theme === 'dark' ? '#0d1426' : '#ffffff',
            colorText: theme === 'dark' ? '#e8ecf5' : '#0f172a',
          }
        }}
      >
        <div className="hb-fsm">
        {/* Hero */}
        <div className="hb-fsm-hero" style={{ ["--hb-fsm-accent" as any]: color }}>
          <div className="hb-fsm-hero-bg" />
          <div className="hb-fsm-hero-row">
            <div className="hb-fsm-hero-avatar">
              {editing ? (
                <Folder size={20} />
              ) : (
                <span className="hb-fsm-hero-initial">{initial}</span>
              )}
            </div>
            <div className="hb-fsm-hero-text">
              <div className="hb-fsm-eyebrow">
                <Sparkles size={11} />
                {editing ? "Edit folder" : "New folder"}
              </div>
              <div className="hb-fsm-title">
                {editing ? editing.name : name.trim() || "Untitled folder"}
              </div>
              <div className="hb-fsm-sub">
                Folders group sheets — one workspace per project, release, or client.
              </div>
            </div>
            <button
              className="hb-fsm-close"
              onClick={onClose}
              disabled={submitting}
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="hb-fsm-body">
          <Form
            form={form}
            layout="vertical"
            requiredMark={false}
            onValuesChange={(_, all) => {
              if (typeof all.name === "string") setName(all.name);
              if (typeof all.color === "string") setColor(all.color);
            }}
          >
            <div className="hb-fsm-field">
              <label className="hb-fsm-label">
                <FolderPlus size={11} />
                <span>Folder name</span>
                <span className="hb-fsm-req">*</span>
              </label>
              <Form.Item
                name="name"
                rules={[{ required: true, message: "Name is required" }]}
                className="hb-fsm-fitem"
              >
                <Input
                  placeholder="e.g. Acme · Mobile App"
                  autoFocus
                  className="hb-fsm-input"
                  size="large"
                />
              </Form.Item>
            </div>

            <div className="hb-fsm-field">
              <label className="hb-fsm-label">
                <Layers size={11} />
                <span>Description</span>
                <span className="hb-fsm-opt">optional</span>
              </label>
              <Form.Item name="description" className="hb-fsm-fitem">
                <Input.TextArea
                  rows={2}
                  placeholder="What lives in this folder?"
                  className="hb-fsm-textarea"
                />
              </Form.Item>
            </div>

            {!editing && (
              <div className="hb-fsm-field">
                <label className="hb-fsm-label">
                  <Link2 size={11} />
                  <span>Link to project</span>
                  <span className="hb-fsm-req">*</span>
                </label>
                <Form.Item 
                  name="projectId" 
                  rules={[{ required: true, message: "Project selection is required" }]}
                  className="hb-fsm-fitem"
                >
                  <Select
                    allowClear
                    showSearch
                    placeholder="Pick a project to link bugs against"
                    size="large"
                    className="hb-fsm-select"
                    popupClassName={`hb-fsm-popup ${theme === "dark" ? "hb-fsm-dark" : "hb-fsm-light"}`}
                    notFoundContent={
                      projects === undefined ? "Loading…" : "No projects yet"
                    }
                    options={(projects || []).map((p: any) => ({
                      value: p.value ?? p.id,
                      label: p.label ?? p.name,
                    }))}
                    filterOption={(input, option) =>
                      (option?.label as string)
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  />
                </Form.Item>
              </div>
            )}

            <div className="hb-fsm-field">
              <label className="hb-fsm-label">
                <span className="hb-fsm-swatch-dot" style={{ background: color }} />
                <span>Accent colour</span>
              </label>
              <Form.Item name="color" className="hb-fsm-fitem hb-fsm-fitem-no-mb">
                <input type="hidden" />
              </Form.Item>
              <div className="hb-fsm-swatches">
                {FOLDER_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`hb-fsm-swatch ${color === c ? "active" : ""}`}
                    style={{ background: c }}
                    aria-label={`Color ${c}`}
                    onClick={() => {
                      setColor(c);
                      form.setFieldsValue({ color: c });
                    }}
                  >
                    {color === c && <Check size={12} />}
                  </button>
                ))}
              </div>
            </div>
          </Form>
        </div>

        {/* Footer */}
        <div className="hb-fsm-footer">
          <button
            className="hb-fsm-secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            className="hb-fsm-primary"
            onClick={handleOk}
            disabled={submitting}
            style={{ ["--hb-fsm-accent" as any]: color }}
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="hb-fsm-spin" />
                {editing ? "Saving…" : "Creating…"}
              </>
            ) : (
              <>
                <Sparkles size={14} />
                {editing ? "Save changes" : "Create folder"}
              </>
            )}
          </button>
        </div>
      </div>
      </ConfigProvider>
    </Modal>
  );
}

interface SheetModalProps {
  open: boolean;
  folderId: string | null;
  editing: BugSheet | null;
  onClose: () => void;
}

export function SheetModal({ open, folderId, editing, onClose }: SheetModalProps) {
  const [form] = Form.useForm();
  const createMut = useCreateBugSheet();
  const updateMut = useUpdateBugSheet();
  const { theme } = useTheme();
  const [name, setName] = useState("");

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.setFieldsValue({
        name: editing.name,
        description: editing.description || "",
      });
      setName(editing.name || "");
    } else {
      form.resetFields();
      setName("");
    }
  }, [open, editing, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    if (editing) {
      await updateMut.mutateAsync({ id: editing.id, input: values });
    } else {
      if (!folderId) return;
      await createMut.mutateAsync({ folderId, ...values });
    }
    onClose();
  };

  const submitting = createMut.isPending || updateMut.isPending;
  const SHEET_PRESETS = ["Sprint 1", "Release 1.0", "Hotfix", "Smoke test", "UAT"];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closable={false}
      destroyOnHidden
      width={520}
      centered
      maskClosable={!submitting}
      wrapClassName={`hb-fsm-wrap hb-fsm-sheet ${theme === "dark" ? "hb-fsm-dark" : "hb-fsm-light"}`}
      styles={{
        mask: { backdropFilter: "blur(8px)", background: "rgba(8,12,24,0.55)" },
        content: { padding: 0, borderRadius: 18, overflow: "hidden", background: "transparent", boxShadow: "0 30px 80px rgba(8,12,24,0.45)" },
        body: { padding: 0 },
      }}
    >
      <ConfigProvider
        theme={{
          algorithm: theme === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
          token: {
            colorBgContainer: theme === 'dark' ? '#0d1426' : '#ffffff',
            colorText: theme === 'dark' ? '#e8ecf5' : '#0f172a',
          }
        }}
      >
        <div className="hb-fsm">
        {/* Hero */}
        <div className="hb-fsm-hero">
          <div className="hb-fsm-hero-bg" />
          <div className="hb-fsm-hero-row">
            <div className="hb-fsm-hero-avatar">
              <FileSpreadsheet size={20} />
            </div>
            <div className="hb-fsm-hero-text">
              <div className="hb-fsm-eyebrow">
                <Sparkles size={11} />
                {editing ? "Edit sheet" : "New sheet"}
              </div>
              <div className="hb-fsm-title">
                {editing ? editing.name : name.trim() || "Untitled sheet"}
              </div>
              <div className="hb-fsm-sub">
                A sheet is one bug list — typically per sprint, release, or test pass.
              </div>
            </div>
            <button
              className="hb-fsm-close"
              onClick={onClose}
              disabled={submitting}
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="hb-fsm-body">
          <Form
            form={form}
            layout="vertical"
            requiredMark={false}
            onValuesChange={(_, all) => {
              if (typeof all.name === "string") setName(all.name);
            }}
          >
            <div className="hb-fsm-field">
              <label className="hb-fsm-label">
                <FileSpreadsheet size={11} />
                <span>Sheet name</span>
                <span className="hb-fsm-req">*</span>
              </label>
              <Form.Item
                name="name"
                rules={[{ required: true, message: "Name is required" }]}
                className="hb-fsm-fitem"
              >
                <Input
                  placeholder="e.g. Sprint 23 · Regression"
                  autoFocus
                  className="hb-fsm-input"
                  size="large"
                />
              </Form.Item>
              {!editing && (
                <div className="hb-fsm-presets">
                  <span className="hb-fsm-presets-label">Quick:</span>
                  {SHEET_PRESETS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      className="hb-fsm-preset"
                      onClick={() => {
                        form.setFieldsValue({ name: p });
                        setName(p);
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="hb-fsm-field">
              <label className="hb-fsm-label">
                <Layers size={11} />
                <span>Description</span>
                <span className="hb-fsm-opt">optional</span>
              </label>
              <Form.Item name="description" className="hb-fsm-fitem">
                <Input.TextArea
                  rows={2}
                  placeholder="What's the scope of this sheet?"
                  className="hb-fsm-textarea"
                />
              </Form.Item>
            </div>
          </Form>
        </div>

        {/* Footer */}
        <div className="hb-fsm-footer">
          <button
            className="hb-fsm-secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            className="hb-fsm-primary"
            onClick={handleOk}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="hb-fsm-spin" />
                {editing ? "Saving…" : "Creating…"}
              </>
            ) : (
              <>
                <Sparkles size={14} />
                {editing ? "Save changes" : "Create sheet"}
              </>
            )}
          </button>
        </div>
      </div>
      </ConfigProvider>
    </Modal>
  );
}
