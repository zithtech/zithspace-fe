'use client';
import ZukvoLoader from "@/components/common/ZukvoLoader";


import React, { useCallback, useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { Placeholder } from '@tiptap/extensions';
import {  Tooltip } from 'antd';
import {
  AtSign,
  Bold,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
} from 'lucide-react';
import { PALETTE, TINT } from '@/components/openings/ui';
import { avatarColorFor, initialsFor } from '@/components/common/SearchableDropdown';
import HotspotBlogService, { BlogUser } from '@/services/hotspotBlogService';

// The post composer's editor: Tiptap for formatting, plus the same "@" picker
// the plain comment box has.
//
// WHY THE MENTION IS PLAIN TEXT INSIDE THE HTML, not a custom node:
//   The server records a mention only when the tagged person's name actually
//   appears in what everyone reads (see blog.service.resolveMentions). Keeping
//   "@Priya Sharma" as ordinary text in the document means that check works
//   unchanged, the plain-text projection is honest, and deleting the name from
//   the sentence un-tags her with no bookkeeping. A custom mention node would
//   need its own schema, its own serialiser and its own sanitiser allowance to
//   buy nothing the reader can see.
//
// The picker is driven from the text immediately before the caret rather than
// from a ProseMirror suggestion plugin — no extra dependency, and it behaves
// identically to the comment box, which matters more than either is elegant.

const MAX_SUGGESTIONS = 8;

interface ActiveQuery {
  /** Document position of the "@". */
  from: number;
  query: string;
}

/**
 * Find an in-progress mention immediately before the caret.
 *
 * The query starts at an "@" that begins a word and may contain at most one
 * space — people type "@Priya Sharma", but a whole sentence after an "@" is not
 * a lookup.
 */
function activeQueryFrom(textBefore: string, caret: number): ActiveQuery | null {
  const at = textBefore.lastIndexOf('@');
  if (at === -1) return null;

  // Must start a word, or the "@" in an email address opens the picker.
  const before = at > 0 ? textBefore[at - 1] : ' ';
  if (!/[\s(]/.test(before)) return null;

  const query = textBefore.slice(at + 1);
  if (/[\n\r]/.test(query)) return null;
  if ((query.match(/ /g) ?? []).length > 1) return null;

  return { from: caret - (textBefore.length - at), query };
}

export default function BlogRichEditor({
  value,
  onChange,
  mentionedUsers,
  onMentionedUsersChange,
  placeholder = 'What do you want to share? Use @ to tag a colleague.',
  disabled,
  autoFocus,
}: {
  /** HTML. */
  value: string;
  onChange: (html: string, text: string) => void;
  mentionedUsers: BlogUser[];
  onMentionedUsersChange: (users: BlogUser[]) => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  const [active, setActive] = useState<ActiveQuery | null>(null);
  const [suggestions, setSuggestions] = useState<BlogUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(0);
  // Read inside the keydown handler, which Tiptap binds once — state read there
  // would be stale.
  const stateRef = useRef({ active, suggestions, highlight });
  stateRef.current = { active, suggestions, highlight };

  const editor = useEditor({
    immediatelyRender: false,
    autofocus: autoFocus,
    editable: !disabled,
    extensions: [
      StarterKit.configure({ heading: { levels: [3] } }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editorProps: {
      attributes: { class: 'hsb-rte-content' },
      handleKeyDown: (_view, event) => {
        const { active: a, suggestions: s, highlight: h } = stateRef.current;
        if (!a || s.length === 0) return false;

        if (event.key === 'ArrowDown') {
          setHighlight((prev) => (prev + 1) % s.length);
          return true;
        }
        if (event.key === 'ArrowUp') {
          setHighlight((prev) => (prev - 1 + s.length) % s.length);
          return true;
        }
        if (event.key === 'Enter' || event.key === 'Tab') {
          pickRef.current?.(s[h]);
          return true;
        }
        if (event.key === 'Escape') {
          setActive(null);
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML(), ed.getText());
      refreshQuery();
    },
    onSelectionUpdate: () => refreshQuery(),
  });

  /** Look at the text between the start of the block and the caret. */
  const refreshQuery = useCallback(() => {
    // Deferred so it reads the state AFTER the transaction that triggered it.
    queueMicrotask(() => {
      const ed = editorRef.current;
      if (!ed) return;
      const { from, empty } = ed.state.selection;
      if (!empty) {
        setActive(null);
        return;
      }
      const start = Math.max(0, from - 120);
      const textBefore = ed.state.doc.textBetween(start, from, '\n', '\n');
      setActive(activeQueryFrom(textBefore, from));
    });
  }, []);

  const editorRef = useRef<typeof editor>(null);
  editorRef.current = editor;

  // Keep the document in step when the parent replaces the value wholesale
  // (opening the composer to edit an existing post).
  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) editor.commands.setContent(value, { emitUpdate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  // Look colleagues up as the query changes, debounced so a fast typist does
  // not fire a request per keystroke.
  useEffect(() => {
    if (!active) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const users = await HotspotBlogService.mentionableUsers(active.query, MAX_SUGGESTIONS);
        if (!cancelled) {
          setSuggestions(users);
          setHighlight(0);
        }
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 180);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [active?.query, active]);

  const pick = useCallback(
    (user: BlogUser) => {
      const ed = editorRef.current;
      const a = stateRef.current.active;
      if (!ed || !a) return;

      ed.chain()
        .focus()
        .insertContentAt({ from: a.from, to: ed.state.selection.from }, `@${user.name} `)
        .run();

      if (!mentionedUsers.some((u) => u.id === user.id)) {
        onMentionedUsersChange([...mentionedUsers, user]);
      }
      setActive(null);
      setSuggestions([]);
    },
    [mentionedUsers, onMentionedUsersChange]
  );

  const pickRef = useRef(pick);
  pickRef.current = pick;

  // Drop tagged users whose name is no longer in the document — the server does
  // this too, but doing it here keeps the composer's "N tagged" count honest.
  const text = editor?.getText() ?? '';
  useEffect(() => {
    const kept = mentionedUsers.filter((u) => text.includes(`@${u.name}`));
    if (kept.length !== mentionedUsers.length) onMentionedUsersChange(kept);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  if (!editor) {
    return (
      <div className="hsb-rte-boot">
        <ZukvoLoader size="sm" />
        <style jsx>{`
          .hsb-rte-boot { display: flex; justify-content: center; padding: 32px; }
        `}</style>
      </div>
    );
  }

  // Renders a COMPONENT, not JSX from a helper — styled-jsx scopes per
  // function, so a helper's <button> would come out unstyled. Same trap as
  // CommentThread's renderComment.
  const btn = (
    key: string,
    label: string,
    icon: React.ReactNode,
    run: () => void,
    isActive = false
  ) => (
    <ToolbarButton key={key} label={label} icon={icon} run={run} isActive={isActive} />
  );

  const addLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined;
    const href = window.prompt('Link URL', previous ?? 'https://');
    if (href === null) return;
    if (href === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
  };

  return (
    <div className="hsb-rte">
      <div className="hsb-rte-bar">
        {btn('bold', 'Bold', <Bold size={15} />, () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'))}
        {btn('italic', 'Italic', <Italic size={15} />, () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'))}
        {btn('underline', 'Underline', <UnderlineIcon size={15} />, () => editor.chain().focus().toggleUnderline().run(), editor.isActive('underline'))}
        {btn('strike', 'Strikethrough', <Strikethrough size={15} />, () => editor.chain().focus().toggleStrike().run(), editor.isActive('strike'))}
        <span className="hsb-rte-sep" />
        {btn('bullet', 'Bulleted list', <List size={15} />, () => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'))}
        {btn('ordered', 'Numbered list', <ListOrdered size={15} />, () => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'))}
        {btn('quote', 'Quote', <Quote size={15} />, () => editor.chain().focus().toggleBlockquote().run(), editor.isActive('blockquote'))}
        <span className="hsb-rte-sep" />
        {btn('link', 'Link', <LinkIcon size={15} />, addLink, editor.isActive('link'))}
        {btn('mention', 'Tag a colleague', <AtSign size={15} />, () =>
          editor.chain().focus().insertContent('@').run()
        )}
        <span className="hsb-rte-spacer" />
        {btn('undo', 'Undo', <Undo2 size={15} />, () => editor.chain().focus().undo().run())}
        {btn('redo', 'Redo', <Redo2 size={15} />, () => editor.chain().focus().redo().run())}
      </div>

      <div className="hsb-rte-surface">
        <EditorContent editor={editor} />

        {active && (loading || suggestions.length > 0) && (
          <div className="hsb-rte-menu">
            {loading && suggestions.length === 0 ? (
              <div className="hsb-rte-loading">
                <ZukvoLoader size="sm" />
              </div>
            ) : (
              suggestions.map((user, i) => (
                <button
                  key={user.id}
                  type="button"
                  className={`hsb-rte-item ${i === highlight ? 'is-on' : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => pick(user)}
                >
                  {user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="hsb-rte-avatar" src={user.avatarUrl} alt="" />
                  ) : (
                    <span
                      className="hsb-rte-avatar hsb-rte-initials"
                      style={{ background: avatarColorFor(user.name) }}
                    >
                      {initialsFor(user.name)}
                    </span>
                  )}
                  <span className="hsb-rte-text">
                    <span className="hsb-rte-name">{user.name}</span>
                    {user.designation && <span className="hsb-rte-role">{user.designation}</span>}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .hsb-rte {
          border: 1px solid var(--border-slate-200);
          border-radius: 10px;
          overflow: visible;
          background: var(--bg-pure-white);
        }
        .hsb-rte-bar {
          display: flex; align-items: center; gap: 2px; flex-wrap: wrap;
          padding: 6px 8px; border-bottom: 1px solid var(--border-slate-100);
          background: var(--bg-slate-50); border-radius: 10px 10px 0 0;
        }
        .hsb-rte-sep {
          width: 1px; height: 18px; background: var(--border-slate-200); margin: 0 4px;
        }
        .hsb-rte-spacer { flex: 1; }

        .hsb-rte-surface { position: relative; }
        .hsb-rte :global(.hsb-rte-content) {
          min-height: 150px; max-height: 340px; overflow-y: auto;
          padding: 12px 14px; font-size: 14px; line-height: 1.6;
          color: var(--text-slate-800); outline: none;
        }
        .hsb-rte :global(.hsb-rte-content p) { margin: 0 0 8px; }
        .hsb-rte :global(.hsb-rte-content p:last-child) { margin-bottom: 0; }
        .hsb-rte :global(.hsb-rte-content ul),
        .hsb-rte :global(.hsb-rte-content ol) { margin: 0 0 8px; padding-left: 20px; }
        .hsb-rte :global(.hsb-rte-content blockquote) {
          margin: 0 0 8px; padding-left: 12px;
          border-left: 3px solid var(--border-slate-200); color: var(--text-slate-600);
        }
        .hsb-rte :global(.hsb-rte-content a) { color: ${PALETTE.blue}; text-decoration: underline; }
        /* Tiptap's Placeholder renders as a ::before on the first empty node. */
        .hsb-rte :global(.hsb-rte-content p.is-editor-empty:first-child::before) {
          content: attr(data-placeholder);
          float: left; height: 0; pointer-events: none;
          color: var(--text-slate-400);
        }

        .hsb-rte-menu {
          position: absolute; left: 12px; right: 12px; top: 100%; z-index: 20;
          margin-top: 4px; max-height: 260px; overflow-y: auto;
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
          border-radius: 10px; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12); padding: 4px;
        }
        .hsb-rte-loading { display: flex; justify-content: center; padding: 12px; }
        .hsb-rte-item {
          display: flex; align-items: center; gap: 10px; width: 100%;
          padding: 6px 8px; border: none; background: transparent; border-radius: 8px;
          cursor: pointer; text-align: left;
        }
        .hsb-rte-item.is-on { background: ${TINT.blue}; }
        .hsb-rte-avatar {
          width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0; object-fit: cover;
        }
        .hsb-rte-initials {
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-size: 11px; font-weight: 700;
        }
        .hsb-rte-text { display: flex; flex-direction: column; min-width: 0; }
        .hsb-rte-name {
          font-size: 13px; font-weight: 600; color: var(--text-slate-800); line-height: 1.3;
        }
        .hsb-rte-role {
          font-size: 11px; color: var(--text-slate-400); font-weight: 500;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .hsb-rte-item.is-on .hsb-rte-name { color: ${PALETTE.blue}; }
      `}</style>
    </div>
  );
}

/** One toolbar button — its own component so styled-jsx scopes its styles. */
function ToolbarButton({
  label,
  icon,
  run,
  isActive,
}: {
  label: string;
  icon: React.ReactNode;
  run: () => void;
  isActive: boolean;
}) {
  return (
    <Tooltip title={label}>
      <button
        type="button"
        className={`hsb-rte-btn ${isActive ? 'is-on' : ''}`}
        aria-label={label}
        aria-pressed={isActive}
        // Keep the selection: a mousedown on the toolbar would blur the editor
        // and the formatting command would apply to nothing.
        onMouseDown={(e) => e.preventDefault()}
        onClick={run}
      >
        {icon}
        <style jsx>{`
          .hsb-rte-btn {
            display: inline-flex; align-items: center; justify-content: center;
            width: 28px; height: 28px; border-radius: 6px; cursor: pointer;
            border: none; background: transparent; color: var(--text-slate-500);
            transition: background .12s ease, color .12s ease;
          }
          .hsb-rte-btn:hover { background: var(--bg-slate-100); color: var(--text-slate-800); }
          .hsb-rte-btn.is-on { background: ${TINT.blue}; color: ${PALETTE.blue}; }
        `}</style>
      </button>
    </Tooltip>
  );
}
