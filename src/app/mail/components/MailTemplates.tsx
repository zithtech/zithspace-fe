"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { App, Button, Drawer, Input, Popconfirm, Space, Tooltip } from "antd";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import {
  FileText,
  PenSquare,
  Search,
  Star,
  Trash2,
  X,
  Send,
  Eye,
} from "lucide-react";
import NoData from "@/components/common/NoData";
import TiptapEditor, { TiptapEditorRef } from "@/components/common/TiptapEditor";
import {
  useMailTemplateActions,
  useMailTemplates,
  usePlaceholderGroups,
} from "@/hooks/useMailTemplates";
import { MailTemplate, UNCATEGORIZED } from "@/services/mailTemplateService";
import PlaceholderPanel from "./PlaceholderPanel";
import { LIBRARY_STYLES } from "./libraryStyles";

const TOKEN = /\{\{\s*([a-z0-9_]+)\s*\}\}/gi;

const BLANK = { name: "", category: "", subject: "", body: "" };

/** A readable excerpt of an HTML body for the list. */
function excerpt(html: string, length = 150): string {
  const text = (html || "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|li|h1|h2|h3)>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > length ? `${text.slice(0, length)}…` : text;
}

/** Wrap every placeholder so it stands out from the copy around it. */
function highlight(html: string): string {
  return (html || "").replace(TOKEN, (_whole, field: string) => `<mark class="mt-token">{{${field}}}</mark>`);
}

function tokensIn(...sources: string[]): string[] {
  const found = new Set<string>();
  for (const source of sources) {
    if (!source) continue;
    for (const match of source.matchAll(TOKEN)) found.add(match[1].toLowerCase());
  }
  return [...found];
}

/**
 * The Templates workspace, shown in place of the thread list when Templates is
 * chosen in the mail sidebar.
 *
 * Browsing templates should not mean opening each one in an editor, so the
 * list opens a read-only preview laid out the way the message itself will read
 * — subject, body, placeholders highlighted — and editing is one click from
 * there.
 */
export default function MailTemplates({
  canCreate,
  canUpdate,
  canDelete,
  isSidebarOpen,
  onToggleSidebar,
  category,
  onClearCategory,
  signatureHtml,
  onUseTemplate,
}: {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  /**
   * The sidebar toggle lives in the mail topbar, which this view replaces —
   * so it is repeated here, or a narrow screen (where the sidebar collapses on
   * its own) would strand the reader with no way back to the folders.
   */
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  /** The category chosen in the sidebar; null means every template. */
  category: string | null;
  onClearCategory: () => void;
  /**
   * The sender's signature, resolved — shown under the body in the preview so
   * a template is read the way it will arrive, signature included.
   */
  signatureHtml: string;
  /** Hand a template to Compose, which fills it in for the recipient. */
  onUseTemplate: (template: MailTemplate) => void;
}) {
  const { message } = App.useApp();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: templates = [], isLoading } = useMailTemplates(
    debouncedSearch || undefined,
    category || undefined
  );

  const categoryLabel = category === UNCATEGORIZED ? "Uncategorised" : category;
  const { data: placeholderGroups = [] } = usePlaceholderGroups();
  const {
    createTemplate,
    isCreating,
    updateTemplate,
    isUpdating,
    deleteTemplate,
    setDefaultTemplate,
  } = useMailTemplateActions();

  const [editing, setEditing] = useState<MailTemplate | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState(BLANK);
  const [previewing, setPreviewing] = useState<MailTemplate | null>(null);

  const bodyRef = useRef<TiptapEditorRef>(null);
  const subjectRef = useRef<any>(null);
  /**
   * Which field a placeholder click should land in. Defaults to the body —
   * that is where all but a handful of placeholders belong.
   */
  const lastFocused = useRef<"subject" | "body">("body");

  const busy = isCreating || isUpdating;
  const usedTokens = useMemo(() => tokensIn(draft.subject, draft.body), [draft.subject, draft.body]);

  function openCreate() {
    setEditing(null);
    // Writing a template while a shelf is selected almost always means writing
    // one FOR that shelf, so it is filled in rather than left for the user.
    setDraft({
      ...BLANK,
      category: category && category !== UNCATEGORIZED ? category : "",
    });
    lastFocused.current = "body";
    setEditorOpen(true);
  }

  function openEdit(template: MailTemplate) {
    setEditing(template);
    setDraft({
      name: template.name,
      category: template.category || "",
      subject: template.subject,
      body: template.body,
    });
    lastFocused.current = "body";
    setPreviewing(null);
    setEditorOpen(true);
  }

  /**
   * Drop a token where the writer last was.
   *
   * In the subject that means at the caret, not at the end — a template named
   * "Great to connect, {{client_name}}" is written by typing the greeting and
   * then clicking the chip mid-sentence.
   */
  function insertPlaceholder(field: string) {
    const token = `{{${field}}}`;
    if (lastFocused.current === "subject") {
      const input: HTMLInputElement | undefined = subjectRef.current?.input;
      const start = input?.selectionStart ?? draft.subject.length;
      const end = input?.selectionEnd ?? draft.subject.length;
      const next = draft.subject.slice(0, start) + token + draft.subject.slice(end);
      setDraft((d) => ({ ...d, subject: next }));
      // Restore the caret after React has written the new value back.
      requestAnimationFrame(() => {
        input?.focus();
        input?.setSelectionRange(start + token.length, start + token.length);
      });
      return;
    }
    bodyRef.current?.insertContentAtCursor(token);
  }

  async function save() {
    if (!draft.name.trim() || !draft.subject.trim() || !excerpt(draft.body)) {
      message.error("A name, subject and body are all required.");
      return;
    }
    const payload = {
      name: draft.name.trim(),
      subject: draft.subject.trim(),
      body: draft.body,
      category: draft.category.trim() || null,
    };
    try {
      if (editing) {
        await updateTemplate({ id: editing.id, payload });
        message.success("Template updated");
      } else {
        await createTemplate(payload);
        message.success("Template created");
      }
      setEditorOpen(false);
      setEditing(null);
      setDraft(BLANK);
    } catch (err: any) {
      message.error(err?.message || "Could not save that template");
    }
  }

  async function remove(template: MailTemplate) {
    try {
      await deleteTemplate(template.id);
      if (previewing?.id === template.id) setPreviewing(null);
      message.success("Template deleted");
    } catch (err: any) {
      message.error(err?.message || "Could not delete that template");
    }
  }

  async function makeDefault(template: MailTemplate) {
    try {
      await setDefaultTemplate(template.id);
      message.success(`“${template.name}” is now the default`);
    } catch (err: any) {
      message.error(err?.message || "Could not change the default");
    }
  }

  const placeholderLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    for (const group of placeholderGroups) {
      for (const field of group.fields) labels[field.field] = `${group.label.replace(/s$/, "")} · ${field.label}`;
    }
    return labels;
  }, [placeholderGroups]);

  return (
    <>
      <style>{LIBRARY_STYLES}</style>

      <div className="mt-toolbar">
        <Tooltip title={isSidebarOpen ? "Hide sidebar" : "Show sidebar"} placement="bottom">
          <button
            type="button"
            className="mail-sidebar-show-toggle"
            onClick={onToggleSidebar}
            aria-label={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
            aria-pressed={!isSidebarOpen}
          >
            {isSidebarOpen ? (
              <MenuFoldOutlined style={{ fontSize: 14 }} />
            ) : (
              <MenuUnfoldOutlined style={{ fontSize: 14 }} />
            )}
          </button>
        </Tooltip>

        <div className="mt-search">
          <Search size={15} />
          <input
            placeholder="Search templates by name or subject…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && <X size={13} style={{ cursor: "pointer" }} onClick={() => setSearch("")} />}
        </div>
        {categoryLabel && (
          <button type="button" className="mt-filter-chip" onClick={onClearCategory}>
            <span>{categoryLabel}</span>
            <X size={12} />
          </button>
        )}

        <span className="mt-count">
          {templates.length} {templates.length === 1 ? "template" : "templates"}
        </span>
        {canCreate && (
          <Button type="primary" size="small" className="mt-new-btn" onClick={openCreate}>
            <PenSquare size={13} strokeWidth={2.2} />
            New template
          </Button>
        )}
      </div>

      <div className="mt-list">
        {isLoading ? (
          [0, 1, 2, 3].map((i) => (
            <div key={i} className="mt-card mt-skeleton">
              <div className="mt-skel-line" style={{ width: "24%" }} />
              <div className="mt-skel-line" style={{ width: "58%" }} />
              <div className="mt-skel-line" style={{ width: "80%" }} />
            </div>
          ))
        ) : templates.length === 0 ? (
          <NoData
            description={
              <div className="mt-empty">
                <div className="mt-empty-icon">
                  <FileText size={30} strokeWidth={1.7} />
                </div>
                <h3>
                  {search
                    ? "No templates match that search"
                    : categoryLabel
                      ? `Nothing filed under ${categoryLabel}`
                      : "No templates yet"}
                </h3>
                <p>
                  {search
                    ? "Try a different name or subject line."
                    : categoryLabel
                      ? "Write one here, or clear the category to see them all."
                      : "Write an email once, drop in placeholders for the client contact or member, and send it to anyone."}
                </p>
              </div>
            }
          />
        ) : (
          templates.map((t) => (
            <article key={t.id} className="mt-card" onClick={() => setPreviewing(t)}>
              <div className="mt-card-head">
                <div className="mt-card-titles">
                  <h4>
                    {t.name}
                    {t.isDefault && <span className="mt-chip mt-chip-default">Default</span>}
                    {t.category && <span className="mt-chip">{t.category}</span>}
                  </h4>
                  <p className="mt-card-subject">{t.subject}</p>
                </div>

                <Space size={4} onClick={(e) => e.stopPropagation()}>
                  <Tooltip title="Preview">
                    <button className="mt-icon-btn" onClick={() => setPreviewing(t)}>
                      <Eye size={14} />
                    </button>
                  </Tooltip>
                  <Tooltip title="Use in a new message">
                    <button className="mt-icon-btn" onClick={() => onUseTemplate(t)}>
                      <Send size={14} />
                    </button>
                  </Tooltip>
                  {canUpdate && (
                    <Tooltip title={t.isDefault ? "This is the default" : "Make default"}>
                      <button
                        className={`mt-icon-btn ${t.isDefault ? "is-on" : ""}`}
                        disabled={t.isDefault}
                        onClick={() => makeDefault(t)}
                      >
                        <Star size={14} fill={t.isDefault ? "currentColor" : "none"} />
                      </button>
                    </Tooltip>
                  )}
                  {canUpdate && (
                    <Tooltip title="Edit">
                      <button className="mt-icon-btn" onClick={() => openEdit(t)}>
                        <PenSquare size={14} />
                      </button>
                    </Tooltip>
                  )}
                  {canDelete && (
                    <Popconfirm
                      title="Delete this template?"
                      description="It cannot be recovered."
                      okText="Delete"
                      cancelText="Cancel"
                      okButtonProps={{ danger: true }}
                      onConfirm={() => remove(t)}
                    >
                      <button className="mt-icon-btn is-danger">
                        <Trash2 size={14} />
                      </button>
                    </Popconfirm>
                  )}
                </Space>
              </div>

              <p className="mt-card-excerpt">{excerpt(t.body)}</p>

              <div className="mt-card-tokens">
                {t.placeholders.length === 0 ? (
                  <span className="mt-muted">No placeholders — every recipient gets identical copy</span>
                ) : (
                  t.placeholders.map((token) => (
                    <span
                      key={token}
                      className={`mt-token-tag ${t.unknownPlaceholders.includes(token) ? "is-unknown" : ""}`}
                    >
                      {placeholderLabels[token] || `{{${token}}}`}
                    </span>
                  ))
                )}
              </div>
            </article>
          ))
        )}
      </div>

      {/* ============== PREVIEW ============== */}
      <Drawer
        placement="right"
        width={620}
        open={!!previewing}
        onClose={() => setPreviewing(null)}
        title={<span className="mt-drawer-title">{previewing?.name}</span>}
        extra={
          previewing && (
            <Space>
              <Button size="small" onClick={() => onUseTemplate(previewing)}>
                Use
              </Button>
              {canUpdate && (
                <Button size="small" type="primary" onClick={() => openEdit(previewing)}>
                  Edit
                </Button>
              )}
            </Space>
          )
        }
      >
        {previewing && (
          <>
            {previewing.unknownPlaceholders.length > 0 && (
              <div className="mt-banner">
                Not a known placeholder, so it will be sent literally:{" "}
                {previewing.unknownPlaceholders.map((u) => `{{${u}}}`).join(", ")}
              </div>
            )}

            <div className="mt-mailcard">
              <div className="mt-mailcard-head">
                <p className="mt-mailcard-line">
                  <span>To</span>
                  <em>the contact or member you address it to</em>
                </p>
                <p
                  className="mt-mailcard-subject"
                  dangerouslySetInnerHTML={{ __html: highlight(previewing.subject) }}
                />
              </div>
              {/* Sanitised server-side on save, so the stored markup is safe to render. */}
              <div
                className="mt-mailcard-body"
                dangerouslySetInnerHTML={{ __html: highlight(previewing.body) }}
              />

              {signatureHtml && (
                <div
                  className="mt-mailcard-signature"
                  dangerouslySetInnerHTML={{ __html: highlight(signatureHtml) }}
                />
              )}
            </div>

            <p className="mt-muted" style={{ marginTop: 14, display: "block" }}>
              Placeholders are highlighted here; each recipient sees their own values.
              {!signatureHtml && " No signature is set, so nothing is appended."}
            </p>
          </>
        )}
      </Drawer>

      {/* ============== EDITOR ============== */}
      <Drawer
        placement="right"
        width={980}
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={<span className="mt-drawer-title">{editing ? "Edit template" : "New template"}</span>}
        extra={
          <Space>
            <Button size="small" onClick={() => setEditorOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button size="small" type="primary" loading={busy} onClick={save}>
              {editing ? "Save changes" : "Create template"}
            </Button>
          </Space>
        }
      >
        <div className="mt-editor">
          <div className="mt-editor-main">
            <label className="mt-field">
              <span>Template name</span>
              <Input
                value={draft.name}
                disabled={busy}
                placeholder="First introduction"
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </label>

            <label className="mt-field">
              <span>Category (optional)</span>
              <Input
                value={draft.category}
                disabled={busy}
                placeholder="Client, Internal, Follow-up…"
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              />
            </label>

            <label className="mt-field">
              <span>Subject</span>
              <Input
                ref={subjectRef}
                value={draft.subject}
                disabled={busy}
                placeholder="Great to connect, {{client_name}}"
                onFocus={() => (lastFocused.current = "subject")}
                onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
              />
            </label>

            <div className="mt-field mt-field-body" onFocus={() => (lastFocused.current = "body")}>
              <span>Body</span>
              <TiptapEditor
                ref={bodyRef}
                content={draft.body}
                minHeight={320}
                placeholder="Hi {{client_first_name}}, …"
                onChange={(html) => setDraft((d) => ({ ...d, body: html }))}
              />
            </div>
          </div>

          <aside className="mt-editor-side">
            <PlaceholderPanel
              groups={placeholderGroups}
              usedTokens={usedTokens}
              onInsert={insertPlaceholder}
            />
          </aside>
        </div>
      </Drawer>
    </>
  );
}
