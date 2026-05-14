"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Avatar, Drawer, Select, Tooltip, message, ConfigProvider, theme as antdTheme } from "antd";
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
} from "lucide-react";
import { useMembersSelect } from "@/hooks/useMembersSelect";
import { useTheme } from "@/context/ThemeContext";
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
  }, [open, editingBug]);

  const assignee = useMemo(
    () => members.find((m) => m.value === assigneeId),
    [members, assigneeId],
  );

  // ─── Attachments ───────────────────────────────────────────────────────
  const addFiles = async (files: FileList | File[]) => {
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
  };

  const removeAttachment = (idx: number) =>
    setAttachments((prev) => prev.filter((_, i) => i !== idx));

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

  // ─── Paste image into description ──────────────────────────────────────
  const onDescriptionPaste = async (
    e: React.ClipboardEvent<HTMLTextAreaElement>,
  ) => {
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
      e.preventDefault();
      await addFiles(files);
    }
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
        externalLinks: links,
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
        externalLinks: links,
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
    <Drawer
      open={open}
      onClose={onClose}
      width={560}
      destroyOnHidden
      closable={false}
      title={null}
      footer={null}
      maskClosable={!submitting}
      className={`hb-cbd ${theme === "dark" ? "hb-cbd-dark" : "hb-cbd-light"}`}
    >
      <div
        className="hb-cbd-shell"
        onKeyDown={onShellKeyDown}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <ConfigProvider
          theme={{
            algorithm: theme === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
            token: {
              colorBgContainer: theme === 'dark' ? '#0f1524' : '#ffffff',
              colorText: theme === 'dark' ? '#e6e8ee' : '#111827',
            }
          }}
        >
        {/* Drag overlay */}
        {dragOver && (
          <div className="hb-cbd-dropoverlay">
            <UploadCloud size={36} />
            <div className="hb-cbd-dropoverlay-title">Drop files to attach</div>
            <div className="hb-cbd-dropoverlay-sub">
              Up to {MAX_FILE_MB}MB each
            </div>
          </div>
        )}

        {/* Header */}
        <div className="hb-cbd-header">
          <div className="hb-cbd-headblock">
            <div className="hb-cbd-eyebrow">
              <Sparkles size={11} />
              {editingBug ? "Edit bug" : "New bug"}
            </div>
            <div className="hb-cbd-headtitle">
              {editingBug ? `${editingBug.bugNumber || "Bug"} · Refine` : "Capture a bug"}
            </div>
            <div className="hb-cbd-headsub">
              Describe what's broken — refinement happens later via AI.
            </div>
          </div>
          <button
            className="hb-cbd-iconbtn"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="hb-cbd-body">
          {/* Title */}
          <input
            type="text"
            className="hb-cbd-title-input"
            placeholder="Bug title (optional — AI can refine)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={140}
          />

          {/* Description */}
          <div
            className={`hb-cbd-fieldgroup ${
              !isValid && descriptionTouched ? "hb-cbd-error" : ""
            }`}
          >
            <div className="hb-cbd-fieldhead">
              <Label icon={<TypeIcon size={11} />} required>
                Description
              </Label>
              <Tooltip
                title={
                  description.trim()
                    ? "Lightly fix grammar & typos"
                    : "Write a description first"
                }
              >
                <button
                  type="button"
                  className="hb-cbd-linkbtn"
                  onClick={enhanceDescription}
                  disabled={enhancingDescription || !description.trim()}
                  aria-label="Enhance grammar"
                >
                  {enhancingDescription ? (
                    <Loader2 size={12} className="hb-cbd-spin" />
                  ) : (
                    <Wand2 size={12} />
                  )}
                  {enhancingDescription ? "Polishing…" : "Enhance grammar"}
                </button>
              </Tooltip>
            </div>
            <textarea
              className="hb-cbd-textarea"
              rows={5}
              placeholder="What's broken? Steps, observed behaviour, screenshots (paste images here)…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => setDescriptionTouched(true)}
              onPaste={onDescriptionPaste}
            />
            {!isValid && descriptionTouched && (
              <div className="hb-cbd-errortext">Description is required</div>
            )}
          </div>

          {/* Comments */}
          <div className="hb-cbd-fieldgroup">
            <Label icon={<FileText size={11} />}>Comments</Label>
            <textarea
              className="hb-cbd-textarea"
              rows={3}
              placeholder="Any additional internal comments or notes…"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
          </div>

          {/* Severity + Type */}
          <div className="hb-cbd-row">
            <div className="hb-cbd-fieldgroup hb-cbd-half">
              <Label icon={<AlertOctagon size={11} />} required>Severity</Label>
              <Select
                allowClear
                placeholder="Select severity"
                value={severity}
                onChange={(v) => setSeverity(v)}
                style={{ width: "100%" }}
                size="middle"
                options={(severityOptions || [])
                  .filter((s) => s.isActive)
                  .map((s) => ({
                    value: s.key,
                    label: (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        {s.color && (
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 999,
                              background: s.color,
                              flexShrink: 0,
                            }}
                          />
                        )}
                        {s.label}
                      </span>
                    ),
                  }))}
              />
            </div>
            <div className="hb-cbd-fieldgroup hb-cbd-half">
              <Label icon={<Layers size={11} />} required>Type</Label>
              <Select
                allowClear
                placeholder="Select type"
                value={bugType}
                onChange={(v) => setBugType(v)}
                style={{ width: "100%" }}
                size="middle"
                options={(typeOptions || [])
                  .filter((t) => t.isActive)
                  .map((t) => ({ value: t.key, label: t.label }))}
              />
            </div>
          </div>

          {/* Module + Assignee */}
          <div className="hb-cbd-row">
            <div className="hb-cbd-fieldgroup hb-cbd-half">
              <Label icon={<Hash size={11} />}>Module</Label>
              <input
                type="text"
                className="hb-cbd-input"
                placeholder="e.g. Auth, Payments"
                list="hb-cbd-module-options"
                value={module}
                onChange={(e) => setModule(e.target.value)}
              />
              <datalist id="hb-cbd-module-options">
                {modules.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>
            <div className="hb-cbd-fieldgroup hb-cbd-half">
              <Label icon={<UserPlus size={11} />}>Assignee</Label>
              <Select
                allowClear
                showSearch
                placeholder="Unassigned"
                value={assigneeId}
                onChange={(v) => setAssigneeId(v)}
                options={members.map((m) => ({
                  value: m.value,
                  label: m.label,
                }))}
                filterOption={(input, option) =>
                  (option?.label as string)
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                style={{ width: "100%" }}
                size="middle"
                suffixIcon={
                  assignee ? (
                    <Avatar
                      size={20}
                      style={{ background: "#1677ff", fontSize: 10 }}
                    >
                      {assignee.label.charAt(0).toUpperCase()}
                    </Avatar>
                  ) : undefined
                }
              />
            </div>
          </div>

          {/* Tags */}
          <div className="hb-cbd-fieldgroup">
            <Label icon={<Hash size={11} />}>Tags</Label>
            <div className="hb-cbd-tagbox">
              {tags.map((t) => (
                <span key={t} className="hb-cbd-tag">
                  #{t}
                  <button
                    onClick={() => removeTag(t)}
                    aria-label={`Remove ${t}`}
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
              <input
                className="hb-cbd-tag-input"
                placeholder={tags.length === 0 ? "Type a tag and press Enter" : ""}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    commitTag();
                  } else if (
                    e.key === "Backspace" &&
                    !tagInput &&
                    tags.length > 0
                  ) {
                    setTags((prev) => prev.slice(0, -1));
                  }
                }}
                onBlur={commitTag}
              />
            </div>
          </div>

          {/* Attachments */}
          <div className="hb-cbd-fieldgroup">
            <div className="hb-cbd-fieldhead">
              <Label icon={<Paperclip size={11} />}>Attachments</Label>
              <button
                className="hb-cbd-linkbtn"
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus size={12} />
                Add files
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              accept="image/*,application/pdf,.log,.txt"
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            {attachments.length === 0 ? (
              <button
                type="button"
                className="hb-cbd-dropzone"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud size={20} />
                <div>
                  <div className="hb-cbd-dropzone-title">
                    Drop files or click to browse
                  </div>
                  <div className="hb-cbd-dropzone-sub">
                    Images, PDFs, logs · max {MAX_FILE_MB}MB
                  </div>
                </div>
              </button>
            ) : (
              <div className="hb-cbd-attachments">
                {attachments.map((a, idx) => (
                  <AttachmentTile
                    key={`${a.fileName}-${idx}`}
                    attachment={a}
                    onRemove={() => removeAttachment(idx)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* External links */}
          <div className="hb-cbd-fieldgroup">
            <Label icon={<Link2 size={11} />}>External links</Label>
            <div className="hb-cbd-linkrow">
              <input
                className="hb-cbd-input"
                placeholder="Label (optional)"
                value={linkLabel}
                onChange={(e) => setLinkLabel(e.target.value)}
                style={{ flex: "0 0 35%" }}
              />
              <input
                className="hb-cbd-input"
                placeholder="https://…"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addLink();
                  }
                }}
              />
              <button
                className="hb-cbd-iconbtn"
                onClick={addLink}
                aria-label="Add link"
              >
                <Plus size={14} />
              </button>
            </div>
            {links.length > 0 && (
              <div className="hb-cbd-linklist">
                {links.map((l, idx) => (
                  <div key={`${l.url}-${idx}`} className="hb-cbd-link">
                    <ExternalLink size={12} />
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noreferrer"
                      className="hb-cbd-link-anchor"
                    >
                      {l.label || l.url}
                    </a>
                    <button
                      className="hb-cbd-iconbtn-sm"
                      onClick={() => removeLink(idx)}
                      aria-label="Remove link"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="hb-cbd-footer">
          <div className="hb-cbd-footer-hint">
            <span className="hb-cbd-kbd">⌘</span>
            <span className="hb-cbd-kbd">↵</span>
            to {editingBug ? "save" : "capture"}
          </div>
          <div className="hb-cbd-footer-actions">
            <button
              className="hb-cbd-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              className="hb-cbd-primary"
              onClick={handleSubmit}
              disabled={submitting || !isValid}
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="hb-cbd-spin" />
                  {editingBug ? "Saving…" : "Capturing…"}
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  {editingBug ? "Save changes" : "Capture bug"}
                </>
              )}
            </button>
          </div>
        </div>
        </ConfigProvider>
      </div>
    </Drawer>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────

function Label({
  icon,
  children,
  required,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="hb-cbd-label">
      {icon && <span className="hb-cbd-label-icon">{icon}</span>}
      <span>{children}</span>
      {required && <span className="hb-cbd-required">*</span>}
    </div>
  );
}

function AttachmentTile({
  attachment,
  onRemove,
}: {
  attachment: BugAttachment;
  onRemove: () => void;
}) {
  const [imageError, setImageError] = useState(false);

  const isImage =
    attachment.fileType?.startsWith("image/") ||
    attachment.fileUrl?.startsWith("data:image/") ||
    /\.(jpg|jpeg|png|gif|webp|svg)/i.test(attachment.fileUrl || "");

  const isVideo =
    attachment.fileType?.startsWith("video/") ||
    /\.(mp4|webm|ogg|mov)/i.test(attachment.fileUrl || "");

  // Fix previously mangled URLs (missing slash or wrong domain)
  const displayUrl = React.useMemo(() => {
    if (!attachment.fileUrl) return "";
    let url = attachment.fileUrl;

    // Redirect private cloudflarestorage.com URLs to the public R2 domain
    if (url.includes("r2.cloudflarestorage.com")) {
      url = url.replace(
        /https:\/\/[^/]+\.r2\.cloudflarestorage\.com\/[^/]+/,
        "https://pub-7f315f14b4bb4930bd64cae157207c92.r2.dev"
      );
    }

    // Fix mangled R2 domains (missing slash after .r2.dev)
    if (url.includes(".r2.dev") && !url.includes(".r2.dev/")) {
      url = url.replace(".r2.dev", ".r2.dev/");
    }
    return url;
  }, [attachment.fileUrl]);

  const handleOpen = () => {
    if (!displayUrl) return;
    if (displayUrl.startsWith("data:")) {
      try {
        const parts = displayUrl.split(",");
        const mime = parts[0].match(/:(.*?);/)?.[1];
        const b64 = parts[1];
        const bin = atob(b64);
        const u8 = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
        const blob = new Blob([u8], { type: mime });
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
      } catch (e) {
        window.open(displayUrl, "_blank");
      }
    } else {
      window.open(displayUrl, "_blank");
    }
  };

  return (
    <div className="hb-cbd-tile">
      <div
        className="hb-cbd-tile-preview"
        onClick={handleOpen}
        style={{ cursor: "pointer" }}
      >
        {isImage && !imageError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayUrl}
            alt={attachment.fileName}
            onError={() => setImageError(true)}
          />
        ) : isVideo ? (
          <div className="hb-cbd-tile-fallback video">
            <Play size={20} />
          </div>
        ) : (
          <div className="hb-cbd-tile-fallback">
            <FileText size={20} />
          </div>
        )}
        <button
          className="hb-cbd-tile-remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label="Remove attachment"
        >
          <X size={11} />
        </button>
        {attachment.isNew && <span className="hb-cbd-tile-new">NEW</span>}
      </div>
      <div className="hb-cbd-tile-info">
        <div className="hb-cbd-tile-name" title={attachment.fileName}>
          {attachment.fileName}
        </div>
        <div className="hb-cbd-tile-meta">
          {attachment.fileSize
            ? formatBytes(attachment.fileSize)
            : attachment.fileType}
        </div>
      </div>
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
