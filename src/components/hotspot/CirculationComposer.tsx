'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { App, Button, Drawer, Input, Switch, Tooltip, Upload } from 'antd';
import type { UploadFile } from 'antd';
import {
  Check,
  FileText,
  ImageIcon,
  Megaphone,
  Paperclip,
  Pin,
  Plus,
  SpellCheck2,
  Trash2,
  Undo2,
  UploadCloud,
  X,
} from 'lucide-react';
import TiptapEditor from '@/components/common/TiptapEditor';
import { PALETTE, TINT } from '@/components/openings/ui';
import HotspotCirculationService, {
  CirculationAttachment,
  CirculationCategory,
  CirculationCategoryItem,
  CirculationPost,
} from '@/services/hotspotCirculationService';
import { categoryMetaForItem, fileSizeLabel } from './circulationMeta';
import CirculationAiCompose from './CirculationAiCompose';

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_FILES_PER_UPLOAD = 10;

/** Visible text of an HTML fragment, whitespace-normalised. */
function plainText(html: string): string {
  return (html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Reading time, so the author can see when an update has grown too long. */
function bodyStats(html: string): { words: number; minutes: number } {
  const text = plainText(html);
  const words = text ? text.split(/\s+/).length : 0;
  return { words, minutes: Math.max(1, Math.round(words / 220)) };
}

// Compose or edit a circulation update: title, category, rich-text body, plus
// images and documents — with Zai on hand to draft it and to proofread it.
//
// Attachments upload AFTER the post exists, because the backend keys them on a
// post id. On create that means: save the post, then push the files — a failed
// upload therefore leaves a saved post with fewer files, never a lost draft.
export default function CirculationComposer({
  open,
  post,
  canModerate,
  categories,
  onCategoriesChanged,
  onClose,
  onSaved,
}: {
  open: boolean;
  /** Present when editing; null when composing a new update. */
  post: CirculationPost | null;
  canModerate: boolean;
  /** Built-ins plus this tenant's own — owned by the board so both stay in sync. */
  categories: CirculationCategoryItem[];
  onCategoriesChanged: () => void;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { message } = App.useApp();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<CirculationCategory>('general');
  const [isPinned, setIsPinned] = useState(false);
  const [pending, setPending] = useState<UploadFile[]>([]);
  const [existing, setExisting] = useState<CirculationAttachment[]>([]);
  const [saving, setSaving] = useState(false);
  const [grammarBusy, setGrammarBusy] = useState(false);

  // Inline "add category" — a chip that turns into a field, rather than a
  // dialog. Naming a category is a two-second job and should not cost a modal.
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [categoryBusy, setCategoryBusy] = useState(false);

  /** Snapshot taken before an AI edit, so it can be reverted in one click. */
  const [previous, setPrevious] = useState<{ title: string; body: string } | null>(null);
  // Tiptap 3 emits an update for content we set programmatically, and rewrites
  // the markup as it parses. So the "did the user type?" test compares VISIBLE
  // TEXT against what we last applied — comparing HTML would see the editor's
  // own normalisation as a manual edit and throw away the Undo straight away.
  const appliedTextRef = useRef<string | null>(null);

  const isEdit = !!post;

  // Reset the form whenever the drawer opens, so a cancelled edit never leaks
  // into the next compose.
  useEffect(() => {
    if (!open) return;
    setTitle(post?.title ?? '');
    setBody(post?.body ?? '');
    setCategory(post?.category ?? 'general');
    setIsPinned(post?.isPinned ?? false);
    setExisting(post?.attachments ?? []);
    setPending([]);
    setPrevious(null);
    setAddingCategory(false);
    setNewCategory('');
    appliedTextRef.current = null;
  }, [open, post]);

  const stats = useMemo(() => bodyStats(body), [body]);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.key === category) ?? null,
    [categories, category]
  );

  const addCategory = async () => {
    const label = newCategory.trim();
    if (label.length < 2) {
      message.error('Give the category a name');
      return;
    }
    setCategoryBusy(true);
    try {
      const created = await HotspotCirculationService.createCategory(label);
      // Select it straight away — someone who just named a category is filing
      // this update under it.
      setCategory(created.key);
      setAddingCategory(false);
      setNewCategory('');
      onCategoriesChanged();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Could not add the category');
    } finally {
      setCategoryBusy(false);
    }
  };
  const pendingImages = pending.filter((f) => (f.type ?? '').startsWith('image/'));
  const pendingDocs = pending.filter((f) => !(f.type ?? '').startsWith('image/'));

  /** Apply an AI result, keeping a snapshot for Undo. */
  const applyAi = (next: { title?: string; body?: string }) => {
    setPrevious({ title, body });
    if (next.title !== undefined && next.title) setTitle(next.title);
    if (next.body !== undefined) {
      appliedTextRef.current = plainText(next.body);
      setBody(next.body);
    }
  };

  const undoAi = () => {
    if (!previous) return;
    appliedTextRef.current = plainText(previous.body);
    setTitle(previous.title);
    setBody(previous.body);
    setPrevious(null);
    message.success('Reverted');
  };

  const runGrammar = async () => {
    if (!body.replace(/<[^>]*>/g, '').trim()) {
      message.error('Write something first');
      return;
    }
    setGrammarBusy(true);
    try {
      const result = await HotspotCirculationService.aiGrammar(body);
      if (!result.changed) {
        message.success('No grammar issues found');
        return;
      }
      applyAi({ body: result.html });
      message.success('Grammar corrected — wording and formatting kept');
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Could not run the grammar check');
    } finally {
      setGrammarBusy(false);
    }
  };

  /** Keep files client-side until the post exists; antd would POST them itself. */
  const holdFile = (file: any) => {
    if (file.size > MAX_FILE_BYTES) {
      message.error(`${file.name} is larger than 25 MB`);
      return Upload.LIST_IGNORE;
    }
    return false;
  };

  const onPendingChange = ({ fileList }: { fileList: UploadFile[] }) => {
    if (fileList.length > MAX_FILES_PER_UPLOAD) {
      message.warning(`Up to ${MAX_FILES_PER_UPLOAD} files per update`);
      setPending(fileList.slice(0, MAX_FILES_PER_UPLOAD));
      return;
    }
    setPending(fileList);
  };

  const removeExisting = async (attachment: CirculationAttachment) => {
    if (!post) return;
    try {
      const updated = await HotspotCirculationService.removeAttachment(post.id, attachment.id);
      setExisting(updated.attachments);
      onSaved();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Could not remove the file');
    }
  };

  const submit = async () => {
    if (!title.trim()) {
      message.error('Give the update a title');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        body,
        category,
        // The server ignores isPinned from a non-moderator; not sending it at
        // all keeps the intent honest.
        ...(canModerate ? { isPinned } : {}),
      };

      const saved = isEdit
        ? await HotspotCirculationService.update(post!.id, payload)
        : await HotspotCirculationService.create(payload);

      const files = pending
        .map((f) => (f.originFileObj as File) ?? null)
        .filter(Boolean) as File[];

      if (files.length > 0) {
        try {
          await HotspotCirculationService.uploadAttachments(saved.id, files);
        } catch (err: any) {
          // The post is already saved — say so rather than implying it was lost.
          message.error(
            err?.response?.data?.error || 'Update saved, but the files could not be uploaded'
          );
          onSaved();
          onClose();
          return;
        }
      }

      message.success(isEdit ? 'Update saved' : 'Update circulated');
      onSaved();
      onClose();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Could not save the update');
    } finally {
      setSaving(false);
    }
  };

  const attachmentCount = existing.length + pending.length;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={820}
      destroyOnClose
      closeIcon={null}
      styles={{ header: { display: 'none' }, body: { padding: 0 } }}
      footer={
        <ComposerFooter
          attachmentCount={attachmentCount}
          words={stats.words}
          minutes={stats.minutes}
          saving={saving}
          submitLabel={isEdit ? 'Save changes' : 'Post update'}
          onCancel={onClose}
          onSubmit={submit}
        />
      }
    >
      <div className="hscc">
        <header className="hscc-head">
          <span className="hscc-head-icon">
            <Megaphone size={18} />
          </span>
          <div className="hscc-head-text">
            <div className="hscc-head-title">{isEdit ? 'Edit update' : 'New circulation update'}</div>
            <div className="hscc-head-sub">
              {isEdit
                ? 'Changes are visible to everyone as soon as you save.'
                : 'This reaches everyone in the company. Lead with what matters.'}
            </div>
          </div>
          <Button type="text" icon={<X size={18} />} onClick={onClose} aria-label="Close" />
        </header>

        <div className="hscc-scroll">
          <CirculationAiCompose
            category={category}
            categoryLabel={selectedCategory && !selectedCategory.isBuiltIn ? selectedCategory.label : null}
            currentTitle={title}
            currentBody={body}
            disabled={saving}
            onDrafted={(draft) => applyAi(draft)}
          />

          <section className="hscc-section">
            <div className="hscc-section-head">
              <label className="hscc-label" htmlFor="hscc-title">
                Title
              </label>
              <span className="hscc-counter">{title.length}/250</span>
            </div>
            <Input
              id="hscc-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What is this update about?"
              maxLength={250}
              size="large"
            />
          </section>

          <section className="hscc-section">
            <label className="hscc-label">Category</label>
            <div className="hscc-cats">
              {categories.map((item) => {
                const meta = categoryMetaForItem(item);
                const on = category === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`hscc-cat ${on ? 'is-on' : ''}`}
                    style={
                      on
                        ? { color: meta.color, background: meta.tint, borderColor: `${meta.color}66` }
                        : undefined
                    }
                    onClick={() => setCategory(item.key)}
                  >
                    {meta.icon}
                    {meta.label}
                  </button>
                );
              })}

              {addingCategory ? (
                <span className="hscc-cat-new">
                  <Input
                    autoFocus
                    size="small"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onPressEnter={addCategory}
                    onBlur={() => {
                      // Blurring with nothing typed means they changed their
                      // mind — don't leave a stray field open.
                      if (!newCategory.trim() && !categoryBusy) setAddingCategory(false);
                    }}
                    placeholder="Category name"
                    maxLength={40}
                    disabled={categoryBusy}
                    variant="borderless"
                    className="hscc-cat-input"
                  />
                  <Tooltip title="Add category">
                    <Button
                      type="text"
                      size="small"
                      icon={<Check size={14} />}
                      loading={categoryBusy}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={addCategory}
                    />
                  </Tooltip>
                  <Tooltip title="Cancel">
                    <Button
                      type="text"
                      size="small"
                      icon={<X size={14} />}
                      disabled={categoryBusy}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setAddingCategory(false);
                        setNewCategory('');
                      }}
                    />
                  </Tooltip>
                </span>
              ) : (
                <button
                  type="button"
                  className="hscc-cat hscc-cat-add"
                  onClick={() => setAddingCategory(true)}
                >
                  <Plus size={13} />
                  New category
                </button>
              )}
            </div>
            {selectedCategory && !selectedCategory.isBuiltIn && (
              <span className="hscc-cat-hint">
                “{selectedCategory.label}” is your company&apos;s own category — everyone can
                file updates under it.
              </span>
            )}
          </section>

          <section className="hscc-section">
            <div className="hscc-section-head">
              <label className="hscc-label">Update</label>
              <div className="hscc-ai-bar">
                {previous && (
                  <Tooltip title="Undo the last AI change">
                    <Button size="small" type="text" icon={<Undo2 size={13} />} onClick={undoAi}>
                      Undo
                    </Button>
                  </Tooltip>
                )}
                <Tooltip title="Fix spelling and grammar only — your wording and formatting are kept">
                  <Button
                    size="small"
                    icon={<SpellCheck2 size={13} />}
                    loading={grammarBusy}
                    disabled={saving}
                    onClick={runGrammar}
                  >
                    Grammar
                  </Button>
                </Tooltip>
              </div>
            </div>
            <div className="hscc-editor">
              <TiptapEditor
                content={body}
                onChange={(html) => {
                  setBody(html);
                  // A hand edit invalidates the snapshot — keeping it would let
                  // Undo silently throw away the user's own typing.
                  if (previous && plainText(html) !== appliedTextRef.current) setPrevious(null);
                }}
                placeholder="Write the update. You can paste images inline, or attach them below."
                minHeight={240}
                maxHeight={460}
              />
            </div>
          </section>

          {existing.length > 0 && (
            <section className="hscc-section">
              <label className="hscc-label">
                <Paperclip size={12} /> Already attached
              </label>
              <div className="hscc-files">
                {existing.map((a) => (
                  <div className="hscc-file" key={a.id}>
                    <span className="hscc-file-icon">
                      {a.kind === 'image' ? <ImageIcon size={14} /> : <FileText size={14} />}
                    </span>
                    <a
                      className="hscc-file-name"
                      href={a.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {a.fileName}
                    </a>
                    <span className="hscc-file-size">{fileSizeLabel(a.fileSize)}</span>
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<Trash2 size={14} />}
                      onClick={() => removeExisting(a)}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="hscc-section">
            <div className="hscc-section-head">
              <label className="hscc-label">
                <Paperclip size={12} /> Images &amp; documents
              </label>
              {pending.length > 0 && (
                <span className="hscc-counter">
                  {pendingImages.length} image{pendingImages.length === 1 ? '' : 's'} ·{' '}
                  {pendingDocs.length} doc{pendingDocs.length === 1 ? '' : 's'}
                </span>
              )}
            </div>
            <Upload.Dragger
              multiple
              fileList={pending}
              beforeUpload={holdFile}
              onChange={onPendingChange}
              onRemove={(file) => setPending((list) => list.filter((f) => f.uid !== file.uid))}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt"
              listType="picture"
            >
              <p className="hscc-drop-icon">
                <UploadCloud size={24} />
              </p>
              <p className="hscc-drop-title">Drop files here, or click to browse</p>
              <p className="hscc-drop-sub">
                Images render as a gallery on the post; everything else becomes a download. Up to{' '}
                {MAX_FILES_PER_UPLOAD} files, 25 MB each.
              </p>
            </Upload.Dragger>
          </section>

          {canModerate && (
            <section className="hscc-section">
              <div className="hscc-pin">
                <span className="hscc-pin-icon">
                  <Pin size={15} />
                </span>
                <div className="hscc-pin-text">
                  <div className="hscc-pin-title">Pin to the top of the feed</div>
                  <div className="hscc-pin-sub">
                    Pinned updates stay above everything else for the whole company. Use it
                    sparingly.
                  </div>
                </div>
                <Switch checked={isPinned} onChange={setIsPinned} />
              </div>
            </section>
          )}
        </div>

        <style jsx>{`
          /* The Drawer body is the scroll container — nesting a second one here
             would give the drawer two scrollbars and break the sticky header. */
          .hscc { display: flex; flex-direction: column; }
          .hscc-head {
            display: flex; align-items: flex-start; gap: 12px;
            padding: 16px 20px; border-bottom: 1px solid var(--border-slate-100);
            background: var(--bg-pure-white); position: sticky; top: 0; z-index: 5;
          }
          .hscc-head-icon {
            display: flex; align-items: center; justify-content: center; flex-shrink: 0;
            width: 36px; height: 36px; border-radius: 10px;
            color: ${PALETTE.green}; background: ${TINT.green};
          }
          .hscc-head-text { flex: 1; min-width: 0; }
          .hscc-head-title {
            font-size: 15px; font-weight: 700; color: var(--text-slate-900);
            letter-spacing: -0.015em; line-height: 1.3;
          }
          .hscc-head-sub { font-size: 12px; color: var(--text-slate-500); font-weight: 500; }

          .hscc-scroll {
            padding: 16px 20px 24px;
            display: flex; flex-direction: column; gap: 18px;
          }
          .hscc-section { display: flex; flex-direction: column; gap: 8px; }
          .hscc-section-head {
            display: flex; align-items: center; justify-content: space-between; gap: 12px;
            min-height: 24px;
          }
          .hscc-label {
            display: flex; align-items: center; gap: 5px;
            font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
            color: var(--text-slate-400);
          }
          .hscc-counter { font-size: 11px; color: var(--text-slate-400); font-weight: 600; }
          .hscc-ai-bar { display: flex; align-items: center; gap: 6px; }

          .hscc-cats { display: flex; flex-wrap: wrap; gap: 6px; }
          .hscc-cat {
            display: inline-flex; align-items: center; gap: 6px;
            padding: 6px 12px; border-radius: 100px; cursor: pointer;
            border: 1px solid var(--border-slate-200); background: var(--bg-pure-white);
            font-size: 12px; font-weight: 600; color: var(--text-slate-600);
            transition: border-color .12s ease, background .12s ease, color .12s ease;
          }
          .hscc-cat:hover { border-color: ${PALETTE.blue}55; }
          .hscc-cat-add { border-style: dashed; color: var(--text-slate-500); }
          .hscc-cat-new {
            display: inline-flex; align-items: center; gap: 2px;
            padding: 1px 4px 1px 10px; border-radius: 100px;
            border: 1px solid ${PALETTE.blue}66; background: ${TINT.blue};
          }
          .hscc-cat-new :global(.hscc-cat-input) {
            width: 150px; font-size: 12px; font-weight: 600; padding: 2px 0;
            background: transparent;
          }
          .hscc-cat-hint {
            font-size: 11px; color: var(--text-slate-400); font-weight: 500;
          }

          .hscc-editor {
            border: 1px solid var(--border-slate-200); border-radius: 10px; overflow: hidden;
          }

          .hscc-files { display: flex; flex-direction: column; gap: 4px; }
          .hscc-file {
            display: flex; align-items: center; gap: 8px;
            padding: 6px 8px; border: 1px solid var(--border-slate-200); border-radius: 8px;
          }
          .hscc-file-icon {
            display: flex; align-items: center; justify-content: center; flex-shrink: 0;
            width: 26px; height: 26px; border-radius: 6px;
            color: ${PALETTE.ash}; background: ${TINT.ash};
          }
          .hscc-file-name {
            flex: 1; min-width: 0; font-size: 12.5px; font-weight: 600;
            color: var(--text-slate-800); text-decoration: none;
            overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          }
          .hscc-file-name:hover { color: ${PALETTE.blue}; }
          .hscc-file-size {
            font-size: 10.5px; color: var(--text-slate-400); font-weight: 500; flex-shrink: 0;
          }

          .hscc-drop-icon { color: var(--text-slate-400); margin-bottom: 4px; }
          .hscc-drop-title { font-size: 13px; font-weight: 600; color: var(--text-slate-700); margin: 0; }
          .hscc-drop-sub {
            font-size: 11.5px; color: var(--text-slate-400); font-weight: 500;
            margin: 4px 12px 0; line-height: 1.5;
          }

          .hscc-pin {
            display: flex; align-items: center; gap: 12px;
            padding: 12px 14px; border: 1px solid var(--border-slate-200); border-radius: 10px;
            background: var(--bg-slate-50);
          }
          .hscc-pin-icon {
            display: flex; align-items: center; justify-content: center; flex-shrink: 0;
            width: 30px; height: 30px; border-radius: 8px;
            color: ${PALETTE.blue}; background: ${TINT.blue};
          }
          .hscc-pin-text { flex: 1; min-width: 0; }
          .hscc-pin-title { font-size: 13px; font-weight: 600; color: var(--text-slate-800); }
          .hscc-pin-sub {
            font-size: 11.5px; color: var(--text-slate-500); font-weight: 500; line-height: 1.5;
          }
        `}</style>
      </div>
    </Drawer>
  );
}

/**
 * The drawer's footer, as its own component.
 *
 * It cannot be inline JSX in the `footer` prop: styled-jsx only stamps its
 * scope class onto elements in a component's returned tree, and JSX passed
 * through an attribute is not part of it — the footer rendered unstyled, with
 * the buttons and the summary line stacked and unaligned.
 */
function ComposerFooter({
  attachmentCount,
  words,
  minutes,
  saving,
  submitLabel,
  onCancel,
  onSubmit,
}: {
  attachmentCount: number;
  words: number;
  minutes: number;
  saving: boolean;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="hscc-footer">
      <span className="hscc-footer-summary">
        {attachmentCount > 0
          ? `${attachmentCount} file${attachmentCount > 1 ? 's' : ''} attached`
          : 'No files attached'}
        {words > 0 && ` \u00b7 ${words} words \u00b7 ~${minutes} min read`}
      </span>
      <div className="hscc-footer-actions">
        <Button onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="primary" onClick={onSubmit} loading={saving}>
          {submitLabel}
        </Button>
      </div>

      <style jsx>{`
        .hscc-footer {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          flex-wrap: wrap;
        }
        .hscc-footer-summary {
          font-size: 11.5px; color: var(--text-slate-400); font-weight: 500;
        }
        .hscc-footer-actions { display: flex; gap: 8px; margin-left: auto; }
      `}</style>
    </div>
  );
}
