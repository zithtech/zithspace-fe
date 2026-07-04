"use client";

import { SectionCard, drawerFormStyles } from "@/components/common/DrawerSection";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Avatar, Drawer, Select, Tooltip, message, App, ConfigProvider, theme as antdTheme, notification, Form, Input, Button, Tag, Space, Typography } from "antd";
import { BugOutlined, FormatPainterOutlined, LoadingOutlined, AppstoreOutlined, PaperClipOutlined, EyeOutlined, DeleteOutlined, LinkOutlined, HistoryOutlined, UploadOutlined, FileTextOutlined, PlusOutlined, InfoCircleOutlined, TeamOutlined, CheckCircleOutlined } from "@ant-design/icons";

import {
  X,
  UploadCloud,
  Paperclip,
  Link2,
  Trash2,
  Plus,
  Sparkles,
  ImageIcon,
  ExternalLink,
  Type as TypeIcon,
  Layers,
  Hash,
  AlertOctagon,
  UserPlus,
  Loader2,
  Wand2,
  Play,
  FileText,
  Eye,
  Download,
  Edit2,
  Check,
  History,
} from "lucide-react";

const { Text } = Typography;
import { useMembersSelect } from "@/hooks/useMembersSelect";
import { useTheme } from "@/context/ThemeContext";
import { usePermission } from "@/hooks/usePermission";
import TransactionHistoryDrawer from "@/components/common/TransactionHistoryDrawer";
import BugListService, {
  BugAttachment,
  BugExternalLink,
  BugListItem,
  CreateBugInput,
  UpdateBugInput,
} from "@/services/bugListService";
import {
  useBugSeverityOptions,
  useBugTypeOptions,
} from "@/hooks/useBugList";

const MAX_FILE_MB = 5;

interface Props {
  open: boolean;
  onClose: () => void;
  folderId: string | null;
  sheetId: string | null;
  editingBug?: BugListItem | null;
  modules?: string[];
  onSubmit: (
    payload: CreateBugInput | (UpdateBugInput & { id: string }),
  ) => Promise<void>;
  submitting?: boolean;
}

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function CreateBugDrawer({
  open,
  onClose,
  folderId,
  sheetId,
  editingBug,
  modules = [],
  onSubmit,
  submitting,
}: Props) {
  const { theme } = useTheme();
  const { users: members } = useMembersSelect();
  const { canReadActivityLog } = usePermission();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [notificationApi, notificationContextHolder] = notification.useNotification();
  const { message } = App.useApp();
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [module, setModule] = useState<string>("");
  const [bugType, setBugType] = useState<string | undefined>();
  const [severity, setSeverity] = useState<string | undefined>();
  const { data: severityOptions } = useBugSeverityOptions();
  const { data: typeOptions } = useBugTypeOptions();
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [assigneeId, setAssigneeId] = useState<string | undefined>();
  const [attachments, setAttachments] = useState<BugAttachment[]>([]);
  const [links, setLinks] = useState<BugExternalLink[]>([]);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [descriptionTouched, setDescriptionTouched] = useState(false);
  const [enhancingDescription, setEnhancingDescription] = useState(false);
  const [comments, setComments] = useState("");
  const [previewAttachment, setPreviewAttachment] = useState<BugAttachment | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  useEffect(() => {
    if (!open) return;
    if (editingBug) {
      setTitle(editingBug.title || "");
      setDescription(editingBug.description || "");
      setModule(editingBug.module || "");
      setBugType(editingBug.bugType || undefined);
      setSeverity(editingBug.severity || undefined);
      setTags(editingBug.tags || []);
      setAssigneeId(editingBug.assigneeId || undefined);
      setAttachments(editingBug.attachments || []);
      setLinks(editingBug.externalLinks || []);
      setComments(editingBug.comments || "");
    } else {
      setTitle("");
      setDescription("");
      setModule("");
      const defaultSeverity = severityOptions?.find(
        (s) => s.isActive && s.isDefault,
      )?.key;
      const defaultType = typeOptions?.find(
        (t) => t.isActive && t.isDefault,
      )?.key;
      setBugType(defaultType);
      setSeverity(defaultSeverity);
      setTags([]);
      setAssigneeId(undefined);
      setAttachments([]);
      setLinks([]);
      setComments("");
    }
    setTagInput("");
    setLinkUrl("");
    setLinkLabel("");
    setDragOver(false);
    setDescriptionTouched(false);
  }, [open, editingBug, severityOptions, typeOptions]);

  const assignee = useMemo(
    () => members.find((m) => m.value === assigneeId),
    [members, assigneeId],
  );

  // ─── Global Paste Handler (Direct Paste Fix) ──────────────────────────
  const addFiles = React.useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files);
    for (const file of list) {
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > MAX_FILE_MB) {
        message.error(`${file.name} is over ${MAX_FILE_MB}MB`);
        continue;
      }
      try {
        const base64 = await fileToBase64(file);
        setAttachments((prev) => [
          ...prev,
          {
            fileName: file.name,
            fileUrl: base64,
            fileSize: file.size,
            fileType: file.type || "application/octet-stream",
            isNew: true,
          },
        ]);
      } catch {
        message.error(`Failed to read ${file.name}`);
      }
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleWindowPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (it.kind === "file") {
          const f = it.getAsFile();
          if (f) files.push(f);
        }
      }

      if (files.length > 0) {
        const target = e.target as HTMLElement;
        const isInput =
          target.tagName === "INPUT" || target.tagName === "TEXTAREA";
        if (!isInput) {
          e.preventDefault();
        }
        addFiles(files);
      }
    };

    window.addEventListener("paste", handleWindowPaste);
    return () => window.removeEventListener("paste", handleWindowPaste);
  }, [open, addFiles]);

  const removeAttachment = (idx: number) =>
    setAttachments((prev) => prev.filter((_, i) => i !== idx));

  const renameAttachment = (idx: number, newName: string) => {
    setAttachments((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, fileName: newName } : a)),
    );
  };

  // ─── Drag-and-drop ─────────────────────────────────────────────────────
  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer?.types?.includes("Files")) {
      dragCounter.current++;
      setDragOver(true);
    }
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setDragOver(false);
    }
  };
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setDragOver(false);
    if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
  };

  // ─── Tags ──────────────────────────────────────────────────────────────
  const commitTag = () => {
    const v = tagInput.trim().replace(/^#/, "");
    if (!v) return;
    setTags((prev) => (prev.includes(v) ? prev : [...prev, v]));
    setTagInput("");
  };
  const removeTag = (t: string) =>
    setTags((prev) => prev.filter((x) => x !== t));

  // ─── Links ─────────────────────────────────────────────────────────────
  const addLink = () => {
    const url = linkUrl.trim();
    if (!url) return;
    setLinks((prev) => [
      ...prev,
      { url, label: linkLabel.trim() || undefined },
    ]);
    setLinkUrl("");
    setLinkLabel("");
  };
  const removeLink = (idx: number) =>
    setLinks((prev) => prev.filter((_, i) => i !== idx));

  // ─── Enhance grammar ───────────────────────────────────────────────────
  const enhanceDescription = async () => {
    const current = description.trim();
    if (!current || enhancingDescription) return;
    setEnhancingDescription(true);
    try {
      const enhanced = await BugListService.aiEnhanceText(current);
      if (enhanced && enhanced !== current) {
        setDescription(enhanced);
        message.success("Grammar polished");
      } else {
        message.info("Already looks good");
      }
    } catch (err: any) {
      console.error("enhanceDescription error:", err);
      message.error(err?.response?.data?.error || "Couldn't enhance text");
    } finally {
      setEnhancingDescription(false);
    }
  };

  // ─── Submit ────────────────────────────────────────────────────────────
  const isValid =
    description.trim().length > 0 &&
    !!severity &&
    !!bugType;

  const handleSubmit = async () => {
    setDescriptionTouched(true);
    if (!isValid) return;

    let finalLinks = [...links];
    if (linkUrl.trim()) {
      finalLinks.push({
        url: linkUrl.trim(),
        label: linkLabel.trim() || undefined,
      });
    }

    if (editingBug) {
      await onSubmit({
        id: editingBug.id,
        title: title.trim() || null,
        description: description.trim(),
        module: module.trim() || null,
        bugType: bugType || null,
        severity: severity || null,
        tags,
        assigneeId: assigneeId || null,
        attachments,
        externalLinks: finalLinks,
        comments: comments.trim() || null,
      });
    } else {
      if (!folderId || !sheetId) {
        message.error("Select a sheet first");
        return;
      }
      await onSubmit({
        folderId,
        sheetId,
        title: title.trim() || undefined,
        description: description.trim(),
        module: module.trim() || undefined,
        bugType,
        severity,
        tags,
        assigneeId,
        attachments,
        externalLinks: finalLinks,
        comments: comments.trim() || undefined,
      });
    }
  };

  // ⌘/Ctrl + Enter
  const onShellKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
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
                {editingBug ? `${editingBug.bugNumber || "Bug"} · Refine` : "Capture a bug"}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-slate-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {editingBug ? "Edit Bug Node" : "New Bug Entry"}
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
            {editingBug && canReadActivityLog && (
              <Button onClick={() => setHistoryOpen(true)} style={{ borderRadius: 0 }} icon={<HistoryOutlined />}>History</Button>
            )}
            <Button onClick={onClose} style={{ borderRadius: 0, fontWeight: 600, fontSize: 12, height: 32 }}>Cancel</Button>
            <Button
              type="primary"
              loading={submitting}
              onClick={handleSubmit}
              icon={<CheckCircleOutlined style={{ fontSize: 13 }} />}
              style={{
                borderRadius: 0,
                fontSize: 12,
                fontWeight: 700,
                background: '#2563eb',
                border: 'none',
                height: 32,
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)'
              }}
            >
              {editingBug ? "Save Changes" : "Create Bug"}
            </Button>
          </Space>
        }
      >
        <div
          onKeyDown={onShellKeyDown}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
          style={{ position: 'relative', height: '100%' }}
        >
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
            {dragOver && (
              <div style={{
                position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(37, 99, 235, 0.1)', backdropFilter: 'blur(4px)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                border: '2px dashed #2563eb', color: '#2563eb'
              }}>
                <UploadOutlined style={{ fontSize: 36, marginBottom: 12 }} />
                <div style={{ fontWeight: 700, fontSize: 16 }}>Drop files to attach</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>Up to {MAX_FILE_MB}MB each</div>
              </div>
            )}

            <style>{drawerFormStyles}</style>
            <Form
              layout="horizontal"
              labelCol={{ span: 8 }}
              wrapperCol={{ span: 16 }}
              labelAlign="left"
              colon={false}
              className="lead-drawer-form customer-drawer-form"
            >
              <SectionCard step="STEP 1" icon={<InfoCircleOutlined style={{ color: '#475569', fontSize: 13 }} />} title="General Details" subtitle="Core bug information">
                <Form.Item label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: "#64748b" }}>Bug Title</Text>}>
                  <Input
                    placeholder="Bug title (optional — AI can refine)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={140}
                  />
                </Form.Item>
                <Form.Item label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: "#64748b" }}>Description</Text>} required validateStatus={description.trim().length === 0 && descriptionTouched ? 'error' : ''} help={description.trim().length === 0 && descriptionTouched ? 'Description is required' : ''}>
                  <Input.TextArea
                    rows={4}
                    placeholder="What went wrong? Steps to reproduce?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={() => setDescriptionTouched(true)}
                  />
                  <div style={{ marginTop: 8, textAlign: 'right' }}>
                    <Button
                      type="dashed"
                      size="small"
                      icon={enhancingDescription ? <LoadingOutlined /> : <FormatPainterOutlined />}
                      onClick={enhanceDescription}
                      disabled={enhancingDescription || !description.trim()}
                    >
                      {enhancingDescription ? "Polishing…" : "Enhance grammar"}
                    </Button>
                  </div>
                </Form.Item>
                <Form.Item label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: "#64748b" }}>Comments</Text>}>
                  <Input.TextArea
                    rows={2}
                    placeholder="Any additional internal comments or notes…"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                  />
                </Form.Item>
              </SectionCard>

              <SectionCard step="STEP 2" icon={<AppstoreOutlined style={{ color: '#475569', fontSize: 13 }} />} title="Classification" subtitle="Severity and module">
                <Form.Item label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: "#64748b" }}>Severity</Text>} required validateStatus={!severity && descriptionTouched ? 'error' : ''}>
                  <Select
                    allowClear
                    placeholder="Select severity"
                    value={severity}
                    onChange={(v) => setSeverity(v)}
                    options={(severityOptions || []).filter((s) => s.isActive).map((s) => ({
                      value: s.key,
                      label: (
                        <Space>
                          {s.color && <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />}
                          {s.label}
                        </Space>
                      )
                    }))}
                  />
                </Form.Item>
                <Form.Item label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: "#64748b" }}>Type</Text>} required validateStatus={!bugType && descriptionTouched ? 'error' : ''}>
                  <Select
                    allowClear
                    placeholder="Select type"
                    value={bugType}
                    onChange={(v) => setBugType(v)}
                    options={(typeOptions || []).filter((t) => t.isActive).map((t) => ({ value: t.key, label: t.label }))}
                  />
                </Form.Item>
                <Form.Item label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: "#64748b" }}>Module</Text>}>
                  <Input
                    placeholder="e.g. Auth, Payments"
                    value={module}
                    onChange={(e) => setModule(e.target.value)}
                    list="hb-cbd-module-options"
                  />
                  <datalist id="hb-cbd-module-options">
                    {modules.map((m) => <option key={m} value={m} />)}
                  </datalist>
                </Form.Item>
              </SectionCard>

              <SectionCard step="STEP 3" icon={<TeamOutlined style={{ color: '#10b981', fontSize: 13 }} />} title="Assignments & Tags" subtitle="Ownership and categorization">
                <Form.Item label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: "#64748b" }}>Assignee</Text>}>
                  <Select
                    allowClear
                    showSearch
                    placeholder="Unassigned"
                    value={assigneeId}
                    onChange={(v) => setAssigneeId(v)}
                    options={members.map((m) => ({ value: m.value, label: m.label }))}
                    filterOption={(input, option) => (option?.label as string).toLowerCase().includes(input.toLowerCase())}
                  />
                </Form.Item>
                <Form.Item label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: "#64748b" }}>Tags</Text>}>
                  <div style={{ border: '1px solid #d9d9d9', padding: '4px 8px', minHeight: 32, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {tags.map((t) => (
                      <Tag key={t} closable onClose={() => removeTag(t)} style={{ margin: 0 }}>#{t}</Tag>
                    ))}
                    <Input
                      variant="borderless"
                      size="small"
                      placeholder={tags.length === 0 ? "Type tag & Enter" : ""}
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      style={{ width: 120, padding: 0 }}
                      onPressEnter={(e) => { e.preventDefault(); commitTag(); }}
                      onKeyDown={(e) => {
                        if (e.key === "," || e.key === "Enter") {
                          e.preventDefault();
                          commitTag();
                        } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
                          setTags(prev => prev.slice(0, -1));
                        }
                      }}
                      onBlur={commitTag}
                    />
                  </div>
                </Form.Item>
              </SectionCard>

              <SectionCard step="STEP 4" icon={<PaperClipOutlined style={{ color: '#f59e0b', fontSize: 13 }} />} title="Attachments & Links" subtitle="Files and external resources">
                <Form.Item label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: "#64748b" }}>Files</Text>}>
                  <Button icon={<UploadOutlined />} onClick={() => fileInputRef.current?.click()} style={{ marginBottom: 12 }}>Upload Files</Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    hidden
                    accept="image/*,video/*,application/pdf,.log,.txt"
                    onChange={(e) => {
                      if (e.target.files) addFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {attachments.map((a, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 8, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                        <Space>
                          <FileTextOutlined style={{ color: 'var(--text-slate-400)' }} />
                          <Text style={{ fontSize: 12 }}>{a.fileName}</Text>
                        </Space>
                        <Space>
                          <Button size="small" type="text" icon={<EyeOutlined />} onClick={() => setPreviewAttachment(a)} />
                          <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => removeAttachment(i)} />
                        </Space>
                      </div>
                    ))}
                  </div>
                </Form.Item>

                <Form.Item label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: "#64748b" }}>Links</Text>}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <Input placeholder="URL" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} onPressEnter={addLink} />
                    <Input placeholder="Label (optional)" value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} onPressEnter={addLink} style={{ width: 120 }} />
                    <Button onClick={addLink} type="primary" icon={<PlusOutlined />} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {links.map((lnk, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 8, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                        <Space>
                          <LinkOutlined style={{ color: '#3b82f6' }} />
                          <a href={lnk.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12 }}>{lnk.label || lnk.url}</a>
                        </Space>
                        <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => removeLink(i)} />
                      </div>
                    ))}
                  </div>
                </Form.Item>
              </SectionCard>
            </Form>
          </ConfigProvider>
        </div>

        {editingBug && (
          <TransactionHistoryDrawer
            open={historyOpen}
            onClose={() => setHistoryOpen(false)}
            entityType="bug"
            entityId={editingBug.id}
            subtitle={`${editingBug.bugNumber || "Bug"}${editingBug.title ? ` — ${editingBug.title}` : ""}`}
          />
        )}
      </Drawer>
      {previewAttachment && (
        <Drawer
          open={!!previewAttachment}
          onClose={() => setPreviewAttachment(null)}
          placement="left"
          width={700}
          title="File Preview"
        >
          {(() => {
            let url = previewAttachment.fileUrl || "";
            if (url.includes("r2.cloudflarestorage.com")) {
              url = url.replace(/https:\/\/[^/]+\.r2\.cloudflarestorage\.com\/[^/]+/, "https://pub-7f315f14b4bb4930bd64cae157207c92.r2.dev");
            }
            if (url.includes(".r2.dev") && !url.includes(".r2.dev/")) {
              url = url.replace(".r2.dev", ".r2.dev/");
            }

            const isImage = previewAttachment.fileType?.startsWith("image/") || url.startsWith("data:image/") || /\.(jpg|jpeg|png|gif|webp|svg)/i.test(url);
            const isVideo = previewAttachment.fileType?.startsWith("video/") || /\.(mp4|webm|ogg|mov)/i.test(url);
            const isPdf = previewAttachment.fileType === "application/pdf" || /\.pdf/i.test(url);

            if (isImage) return <img src={url} alt="Preview" style={{ width: '100%', objectFit: 'contain' }} />;
            if (isVideo) return <video src={url} controls style={{ width: '100%' }} />;
            if (isPdf) return <iframe src={url} style={{ width: '100%', height: '80vh', border: 'none' }} />;
            return (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <p>Preview not available</p>
                <Button onClick={() => window.open(url, '_blank')} type="primary">Open in New Tab</Button>
              </div>
            );
          })()}
        </Drawer>
      )}
    </>
  );
}
