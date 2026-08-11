'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Input, Spin } from 'antd';
import type { TextAreaRef } from 'antd/es/input/TextArea';
import { PALETTE, TINT } from '@/components/openings/ui';
import { avatarColorFor, initialsFor } from '@/components/common/SearchableDropdown';
import HotspotBlogService, { BlogUser } from '@/services/hotspotBlogService';

// A textarea that turns "@" into a colleague picker.
//
// WHAT IT STORES: the plain text the author sees, with mentions written as
// "@Full Name" — no ids, no tokens, no hidden markup. The picked users ride
// alongside in `mentionedUsers`, and the server re-checks every one against the
// text before recording it. That means an author who deletes "@Priya" from the
// sentence un-tags her automatically, with no bookkeeping in this component.
//
// The trade-off, stated plainly: two colleagues with identical display names
// cannot be told apart by the text alone. Both would be tagged. That is rare,
// and the alternative — hidden id tokens in a plain-text field — breaks the
// moment someone edits the sentence by hand.

const MAX_SUGGESTIONS = 8;

/** The "@query" being typed at the caret, if any. */
interface ActiveQuery {
  /** Index of the "@". */
  start: number;
  query: string;
}

/**
 * Find an in-progress mention at the caret.
 *
 * A mention query runs from an "@" that starts a word up to the caret, and may
 * contain at most one space — people type "@Priya Sharma", but a whole sentence
 * after an "@" is not a lookup.
 */
function activeQueryAt(value: string, caret: number): ActiveQuery | null {
  const upto = value.slice(0, caret);
  const at = upto.lastIndexOf('@');
  if (at === -1) return null;

  // Must start a word, or the "@" in an email address becomes a picker.
  const before = at > 0 ? upto[at - 1] : ' ';
  if (!/[\s(]/.test(before)) return null;

  const query = upto.slice(at + 1);
  if (query.includes('\n')) return null;
  if ((query.match(/ /g) ?? []).length > 1) return null;

  return { start: at, query };
}

export default function MentionTextArea({
  value,
  onChange,
  mentionedUsers,
  onMentionedUsersChange,
  placeholder,
  autoSize = { minRows: 3, maxRows: 12 },
  disabled,
  autoFocus,
  onSubmit,
}: {
  value: string;
  onChange: (value: string) => void;
  /** Users picked so far. The parent sends their ids with the post. */
  mentionedUsers: BlogUser[];
  onMentionedUsersChange: (users: BlogUser[]) => void;
  placeholder?: string;
  autoSize?: { minRows: number; maxRows: number };
  disabled?: boolean;
  autoFocus?: boolean;
  /** Ctrl/Cmd+Enter — used by the inline comment box. */
  onSubmit?: () => void;
}) {
  const ref = useRef<TextAreaRef>(null);
  const [active, setActive] = useState<ActiveQuery | null>(null);
  const [suggestions, setSuggestions] = useState<BlogUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const textarea = () => ref.current?.resizableTextArea?.textArea ?? null;

  const refreshQuery = useCallback(() => {
    const el = textarea();
    if (!el) return;
    setActive(activeQueryAt(el.value, el.selectionStart ?? el.value.length));
  }, []);

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

  const pick = (user: BlogUser) => {
    if (!active) return;
    const el = textarea();
    const caret = el?.selectionStart ?? value.length;

    const next = `${value.slice(0, active.start)}@${user.name} ${value.slice(caret)}`;
    onChange(next);

    if (!mentionedUsers.some((u) => u.id === user.id)) {
      onMentionedUsersChange([...mentionedUsers, user]);
    }
    setActive(null);
    setSuggestions([]);

    // Put the caret after the inserted name so typing continues naturally.
    const nextCaret = active.start + user.name.length + 2;
    requestAnimationFrame(() => {
      const node = textarea();
      node?.focus();
      node?.setSelectionRange(nextCaret, nextCaret);
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && onSubmit) {
      e.preventDefault();
      onSubmit();
      return;
    }
    if (!active || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => (h + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      pick(suggestions[highlight]);
    } else if (e.key === 'Escape') {
      setActive(null);
    }
  };

  const open = !!active && (loading || suggestions.length > 0);

  // Drop tagged users whose name is no longer in the text. The server does this
  // too — doing it here as well keeps the composer's own "tagging N people"
  // count honest while typing.
  const prunedIds = useMemo(
    () => mentionedUsers.filter((u) => value.includes(`@${u.name}`)).map((u) => u.id).join(','),
    [mentionedUsers, value]
  );
  useEffect(() => {
    const kept = mentionedUsers.filter((u) => value.includes(`@${u.name}`));
    if (kept.length !== mentionedUsers.length) onMentionedUsersChange(kept);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prunedIds]);

  return (
    <div className="hsb-mta">
      <Input.TextArea
        ref={ref}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          // Read the caret after React has the new value.
          requestAnimationFrame(refreshQuery);
        }}
        onClick={refreshQuery}
        onKeyUp={refreshQuery}
        onKeyDown={onKeyDown}
        onBlur={() => {
          // Let a click on a suggestion land before the list unmounts.
          setTimeout(() => setActive(null), 150);
        }}
        placeholder={placeholder}
        autoSize={autoSize}
        disabled={disabled}
        autoFocus={autoFocus}
        variant="borderless"
        className="hsb-mta-input"
      />

      {open && (
        <div className="hsb-mta-menu">
          {loading && suggestions.length === 0 ? (
            <div className="hsb-mta-loading">
              <Spin size="small" />
            </div>
          ) : (
            suggestions.map((user, i) => (
              <button
                key={user.id}
                type="button"
                className={`hsb-mta-item ${i === highlight ? 'is-on' : ''}`}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => pick(user)}
              >
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="hsb-mta-avatar" src={user.avatarUrl} alt="" />
                ) : (
                  <span
                    className="hsb-mta-avatar hsb-mta-initials"
                    style={{ background: avatarColorFor(user.name) }}
                  >
                    {initialsFor(user.name)}
                  </span>
                )}
                <span className="hsb-mta-text">
                  <span className="hsb-mta-name">{user.name}</span>
                  {user.designation && (
                    <span className="hsb-mta-role">{user.designation}</span>
                  )}
                </span>
              </button>
            ))
          )}
        </div>
      )}

      <style jsx>{`
        .hsb-mta { position: relative; }
        .hsb-mta :global(.hsb-mta-input) {
          font-size: 14px; line-height: 1.6; padding: 0; resize: none;
        }
        .hsb-mta-menu {
          position: absolute; left: 0; right: 0; top: 100%; z-index: 20;
          margin-top: 6px; max-height: 260px; overflow-y: auto;
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
          border-radius: 10px; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
          padding: 4px;
        }
        .hsb-mta-loading { display: flex; justify-content: center; padding: 12px; }
        .hsb-mta-item {
          display: flex; align-items: center; gap: 10px; width: 100%;
          padding: 6px 8px; border: none; background: transparent; border-radius: 8px;
          cursor: pointer; text-align: left;
        }
        .hsb-mta-item.is-on { background: ${TINT.blue}; }
        .hsb-mta-avatar {
          width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0; object-fit: cover;
        }
        .hsb-mta-initials {
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-size: 11px; font-weight: 700;
        }
        .hsb-mta-text { display: flex; flex-direction: column; min-width: 0; }
        .hsb-mta-name {
          font-size: 13px; font-weight: 600; color: var(--text-slate-800); line-height: 1.3;
        }
        .hsb-mta-role {
          font-size: 11px; color: var(--text-slate-400); font-weight: 500;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .hsb-mta-item.is-on .hsb-mta-name { color: ${PALETTE.blue}; }
      `}</style>
    </div>
  );
}
