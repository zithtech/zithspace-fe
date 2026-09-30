"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { App, Button, Popconfirm, Tooltip } from "antd";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { RotateCcw, PenLine, Check, Sparkles } from "lucide-react";
import dayjs from "dayjs";
import ZukvoLoader from "@/components/common/ZukvoLoader";
import TiptapEditor, { TiptapEditorRef } from "@/components/common/TiptapEditor";
import {
  useMailSignature,
  useMailSignatureActions,
  usePlaceholderGroups,
} from "@/hooks/useMailTemplates";
import PlaceholderPanel from "./PlaceholderPanel";
import { LIBRARY_STYLES } from "./libraryStyles";

const TOKEN = /\{\{\s*([a-z0-9_]+)\s*\}\}/gi;

function tokensIn(source: string): string[] {
  const found = new Set<string>();
  for (const match of (source || "").matchAll(TOKEN)) found.add(match[1].toLowerCase());
  return [...found];
}

function initialsOf(name: string): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Resolve the sender placeholders locally.
 *
 * The server resolves these when the signature is actually used; doing it here
 * too means the preview answers a chip click immediately rather than after a
 * round trip per keystroke. A token with nothing behind it is left standing,
 * exactly as the server leaves it.
 */
function resolve(html: string, values: Record<string, string | null>): string {
  return (html || "").replace(TOKEN, (whole, raw: string) => values[raw.toLowerCase()] || whole);
}

/**
 * The signed-in member's signature.
 *
 * A member who has never saved one does not meet an empty box: the server
 * builds a signature from their own record — name, position, department, work
 * email, phone — and that is what loads here, already filled in. Editing and
 * saving makes it theirs; "Reset to my details" throws it away and the
 * autofilled one comes back.
 *
 * The My Details placeholders are the other half of that: a signature written
 * with {{my_position}} rather than the literal title follows a promotion on
 * its own, so the panel leads with that group here.
 */
export default function MailSignature({
  canEdit,
  isSidebarOpen,
  onToggleSidebar,
}: {
  canEdit: boolean;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}) {
  const { message } = App.useApp();
  const { data: signature, isLoading } = useMailSignature();
  const { data: placeholderGroups = [] } = usePlaceholderGroups();
  const { saveSignature, isSavingSignature, resetSignature, isResettingSignature } =
    useMailSignatureActions();

  const [draft, setDraft] = useState("");
  const [saved, setSaved] = useState("");
  const editorRef = useRef<TiptapEditorRef>(null);

  /**
   * An autofilled signature loads RESOLVED — the member reads their own name
   * and title, not a row of braces. One they have written loads exactly as
   * they wrote it, placeholders and all.
   */
  useEffect(() => {
    if (!signature) return;
    const initial = signature.isAutofilled ? signature.resolvedHtml : signature.html;
    setDraft(initial);
    setSaved(initial);
  }, [signature]);

  const dirty = draft !== saved;
  const busy = isSavingSignature || isResettingSignature;
  const sender = signature?.sender;
  // Memoised: a fresh {} each render would re-resolve the preview every time.
  const senderValues = useMemo(() => sender?.values ?? {}, [sender]);
  const used = useMemo(() => tokensIn(draft), [draft]);
  const preview = useMemo(() => resolve(draft, senderValues), [draft, senderValues]);

  async function save() {
    try {
      await saveSignature(draft);
      setSaved(draft);
      message.success("Signature saved");
    } catch (err: any) {
      message.error(err?.message || "Could not save your signature");
    }
  }

  async function reset() {
    try {
      const next = await resetSignature();
      setDraft(next.resolvedHtml);
      setSaved(next.resolvedHtml);
      message.success("Signature reset to your details");
    } catch (err: any) {
      message.error(err?.message || "Could not reset your signature");
    }
  }

  return (
    <>
      <style>{LIBRARY_STYLES}</style>
      <style>{signatureStyles}</style>

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

        <div className="mt-sig-heading">
          <PenLine size={14} strokeWidth={2.2} />
          <div>
            <div className="mt-sig-heading-title">My signature</div>
            <div className="mt-sig-heading-sub">
              Added below your message when you use a template
            </div>
          </div>
        </div>

        {canEdit && (
          <div className="mt-sig-actions">
            {dirty ? (
              <span className="mt-sig-state is-dirty">Unsaved changes</span>
            ) : signature?.isAutofilled ? (
              <span className="mt-sig-state">
                <Sparkles size={11} /> Autofilled
              </span>
            ) : (
              <span className="mt-sig-state is-saved">
                <Check size={11} />
                {signature?.updatedAt
                  ? `Saved ${dayjs(signature.updatedAt).format("MMM D, h:mm A")}`
                  : "Saved"}
              </span>
            )}

            <Popconfirm
              title="Reset your signature?"
              description="It goes back to the one built from your member details."
              okText="Reset"
              cancelText="Cancel"
              onConfirm={reset}
              disabled={busy || signature?.isAutofilled}
            >
              <Button
                size="small"
                loading={isResettingSignature}
                disabled={busy || signature?.isAutofilled}
                icon={<RotateCcw size={12} />}
              >
                Reset to my details
              </Button>
            </Popconfirm>
            <Button
              size="small"
              type="primary"
              loading={isSavingSignature}
              disabled={!dirty}
              onClick={save}
            >
              Save signature
            </Button>
          </div>
        )}
      </div>

      <div className="mt-sig-body">
        {isLoading ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <ZukvoLoader />
          </div>
        ) : (
          <div className="mt-editor">
            <div className="mt-editor-main">
              {/* Whose details these are, so an autofilled signature is never
                  mistaken for somebody else's. */}
              {sender && (
                <div className="mt-sig-identity">
                  <div className="mt-sig-avatar">{initialsOf(sender.name)}</div>
                  <div className="mt-sig-identity-text">
                    <div className="mt-sig-identity-name">{sender.name}</div>
                    <div className="mt-sig-identity-meta">
                      {[
                        senderValues.my_position,
                        senderValues.my_department,
                        sender.email,
                        senderValues.my_phone,
                      ]
                        .filter(Boolean)
                        .join("  ·  ")}
                    </div>
                  </div>
                  {signature?.isAutofilled && (
                    <span className="mt-sig-identity-tag">From your member details</span>
                  )}
                </div>
              )}

              <section className="mt-sig-card">
                <header className="mt-sig-card-head">
                  <span>Signature</span>
                  <span className="mt-sig-card-hint">
                    {signature?.isAutofilled
                      ? "Edit it however you like — saving makes it yours"
                      : "Placeholders fill in each time it is used"}
                  </span>
                </header>
                <div className="mt-sig-card-body">
                  <TiptapEditor
                    ref={editorRef}
                    content={draft}
                    editable={canEdit}
                    minHeight={200}
                    placeholder="Your name, position, phone…"
                    onChange={setDraft}
                  />
                </div>
              </section>

              <section className="mt-sig-card">
                <header className="mt-sig-card-head">
                  <span>How it will appear</span>
                  {used.length > 0 && (
                    <span className="mt-sig-card-hint">
                      {used.length} placeholder{used.length === 1 ? "" : "s"} filled in with your
                      details
                    </span>
                  )}
                </header>
                <div className="mt-sig-card-body">
                  <div className="mt-sig-sample">
                    <p>…thanks again, and do let me know if anything is unclear.</p>
                  </div>
                  {preview.trim() ? (
                    <div
                      className="mt-sig-sample-signature"
                      dangerouslySetInnerHTML={{ __html: preview }}
                    />
                  ) : (
                    <div className="mt-sig-sample-empty">
                      Nothing is signed off — messages go out with just your text.
                    </div>
                  )}
                </div>
              </section>
            </div>

            <aside className="mt-editor-side">
              <PlaceholderPanel
                groups={placeholderGroups}
                usedTokens={used}
                primaryGroup="sender"
                subtitle="Click one to drop it in. My Details fill in from your own profile every time the signature is used."
                onInsert={(field) => editorRef.current?.insertContentAtCursor(`{{${field}}}`)}
              />
            </aside>
          </div>
        )}
      </div>
    </>
  );
}

const signatureStyles = `
  .mt-sig-heading {
    display: inline-flex; align-items: center; gap: 9px;
    color: var(--mail-primary);
  }
  .mt-sig-heading-title {
    font-size: 13px; font-weight: 600; color: var(--text-slate-900); line-height: 1.25;
  }
  .mt-sig-heading-sub { font-size: 11px; color: var(--text-slate-500); }

  .mt-sig-actions { margin-left: auto; display: flex; align-items: center; gap: 10px; }
  .mt-sig-state {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 11px; font-weight: 600;
    padding: 3px 9px; border-radius: 12px;
    background: var(--bg-slate-100); color: var(--text-slate-500);
  }
  .mt-sig-state.is-saved { background: var(--bg-green-50); color: var(--mail-emerald); }
  .mt-sig-state.is-dirty { background: var(--bg-blue-50); color: var(--mail-primary); }

  .mt-sig-body { flex: 1; min-height: 0; overflow-y: auto; padding: 18px 24px 36px; }

  .mt-sig-identity {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 14px; margin-bottom: 14px;
    border: 1px solid var(--border-slate-200); border-radius: 10px;
    background: var(--bg-pure-white);
  }
  .mt-sig-avatar {
    display: flex; align-items: center; justify-content: center;
    width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
    font-size: 13px; font-weight: 700; letter-spacing: 0.02em; color: #fff;
    background: linear-gradient(135deg, #60A5FA 0%, #2563EB 100%);
  }
  .mt-sig-identity-text { min-width: 0; }
  .mt-sig-identity-name {
    font-size: 13.5px; font-weight: 600; color: var(--text-slate-900);
  }
  .mt-sig-identity-meta {
    font-size: 11.5px; color: var(--text-slate-500); margin-top: 2px;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .mt-sig-identity-tag {
    margin-left: auto; flex-shrink: 0;
    font-size: 10.5px; font-weight: 600;
    padding: 3px 8px; border-radius: 10px;
    background: var(--bg-blue-50); color: var(--mail-primary);
  }

  .mt-sig-card {
    border: 1px solid var(--border-slate-200); border-radius: 10px;
    background: var(--bg-pure-white); overflow: hidden;
    margin-bottom: 14px;
  }
  .mt-sig-card-head {
    display: flex; align-items: baseline; gap: 10px;
    padding: 9px 14px;
    border-bottom: 1px solid var(--border-slate-200);
    background: var(--bg-slate-50);
    font-size: 11px; font-weight: 600; letter-spacing: 0.04em;
    text-transform: uppercase; color: var(--text-slate-400);
  }
  .mt-sig-card-hint {
    margin-left: auto; text-transform: none; letter-spacing: 0;
    font-weight: 500; font-size: 11px; color: var(--text-slate-400);
  }
  .mt-sig-card-body { padding: 14px; }

  /* A line of ordinary message text above the signature, so its spacing and
     weight are judged against the mail it will sit in. */
  .mt-sig-sample {
    font-size: 13px; line-height: 1.6; color: var(--text-slate-500);
  }
  .mt-sig-sample p { margin: 0 0 14px; }
  .mt-sig-sample-signature {
    padding-top: 12px;
    border-top: 1px dashed var(--border-slate-200);
    font-size: 13px; line-height: 1.6; color: var(--text-slate-700);
  }
  .mt-sig-sample-signature img { max-width: 100%; }
  .mt-sig-sample-empty {
    padding-top: 12px; border-top: 1px dashed var(--border-slate-200);
    font-size: 12px; color: var(--text-slate-400);
  }

  @media (max-width: 1080px) {
    .mt-editor { flex-direction: column; }
    .mt-editor-side { width: 100%; position: static; }
  }
`;
