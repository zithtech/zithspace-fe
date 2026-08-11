'use client';

import React, { useState } from 'react';
import { App, Button, Dropdown } from 'antd';
import { MoreHorizontal, Pencil, Send, Trash2 } from 'lucide-react';
import { PALETTE, TINT, fmtDateTime } from '@/components/openings/ui';
import { avatarColorFor, initialsFor } from '@/components/common/SearchableDropdown';
import HotspotBlogService, {
  BlogComment,
  BlogReaction,
  BlogUser,
} from '@/services/hotspotBlogService';
import { REACTION_META, REACTION_ORDER, timeAgo } from './blogMeta';
import { MentionText } from './mentions';
import MentionTextArea from './MentionTextArea';

// The comment thread under a post. Two levels: comments and their replies —
// deeper nesting is unreadable in a feed, and the server folds a reply-to-a-
// reply back onto its parent rather than growing a third level.
//
// Every mutation returns the WHOLE thread from the server, so this component
// never patches its own state and can't drift out of sync with reality.
//
// STRUCTURAL RULE — why CommentRow is its own component:
//   styled-jsx scopes per FUNCTION, not per file. An earlier version rendered
//   each comment from a `renderComment` helper declared inside this component.
//   The helper is a separate function, so the transform never stamped the scope
//   class onto its elements and every comment rendered COMPLETELY UNSTYLED —
//   the name ran into the designation, the timestamp ran into the actions.
//   Anything that returns JSX with its own look must be a component with its
//   own <style jsx>. Do not collapse CommentRow back into a helper.

export default function CommentThread({
  postId,
  postAuthorId,
  currentUserId,
  canModerate,
  comments,
  onChanged,
  me,
}: {
  postId: string;
  postAuthorId: string;
  currentUserId: string | null;
  canModerate: boolean;
  comments: BlogComment[];
  onChanged: (comments: BlogComment[]) => void;
  me: { name: string; avatarUrl: string | null } | null;
}) {
  return (
    <div className="hsb-thread">
      <div className="hsb-thread-new">
        <Avatar
          user={{ id: '', name: me?.name || 'You', avatarUrl: me?.avatarUrl ?? null, designation: null }}
          size={32}
        />
        <CommentEditor
          placeholder="Add a comment… use @ to tag someone"
          submitLabel="Comment"
          onSubmit={async (body, mentionUserIds) => {
            onChanged(await HotspotBlogService.addComment(postId, { body, mentionUserIds }));
          }}
        />
      </div>

      {comments.length > 0 && (
        <div className="hsb-thread-list">
          {comments.map((c) => (
            <CommentRow
              key={c.id}
              comment={c}
              isReply={false}
              postId={postId}
              postAuthorId={postAuthorId}
              currentUserId={currentUserId}
              canModerate={canModerate}
              onChanged={onChanged}
              me={me}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        .hsb-thread {
          padding: 12px 16px 16px;
          border-top: 1px solid var(--border-slate-100);
          background: var(--bg-slate-50);
        }
        .hsb-thread-new { display: flex; align-items: flex-start; gap: 10px; }
        .hsb-thread-list {
          margin-top: 16px; display: flex; flex-direction: column; gap: 16px;
        }
      `}</style>
    </div>
  );
}

// ─── One comment ────────────────────────────────────────────────────────────

function CommentRow({
  comment,
  isReply,
  postId,
  postAuthorId,
  currentUserId,
  canModerate,
  onChanged,
  me,
}: {
  comment: BlogComment;
  isReply: boolean;
  postId: string;
  postAuthorId: string;
  currentUserId: string | null;
  canModerate: boolean;
  onChanged: (comments: BlogComment[]) => void;
  me: { name: string; avatarUrl: string | null } | null;
}) {
  const { message, modal } = App.useApp();
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);

  /**
   * Deleting is broader than editing: the comment's author, the author of the
   * post (they moderate the conversation under it) and a Hotspot moderator.
   * The server enforces the same rule — this only decides what to show.
   */
  const canDelete =
    canModerate || comment.author.id === currentUserId || postAuthorId === currentUserId;

  const react = async (reaction: BlogReaction) => {
    try {
      onChanged(await HotspotBlogService.reactToComment(comment.id, reaction));
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Could not react');
    }
  };

  const confirmDelete = () => {
    const replyCount = comment.replies.length;
    modal.confirm({
      title: 'Delete this comment?',
      content: replyCount
        ? `Its ${replyCount} repl${replyCount === 1 ? 'y' : 'ies'} will be removed too.`
        : 'This cannot be undone.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          onChanged(await HotspotBlogService.removeComment(comment.id));
          message.success('Comment deleted');
        } catch (err: any) {
          message.error(err?.response?.data?.error || 'Could not delete the comment');
        }
      },
    });
  };

  const menuItems = [
    ...(comment.canEdit ? [{ key: 'edit', label: 'Edit', icon: <Pencil size={13} /> }] : []),
    ...(canDelete
      ? [{ key: 'delete', label: 'Delete', icon: <Trash2 size={13} />, danger: true }]
      : []),
  ];

  return (
    <div className="hsb-c">
      <Avatar user={comment.author} size={isReply ? 28 : 34} />

      <div className="hsb-c-main">
        {editing ? (
          <CommentEditor
            initialBody={comment.body}
            initialMentions={comment.mentions}
            submitLabel="Save"
            autoFocus
            onCancel={() => setEditing(false)}
            onSubmit={async (body, mentionUserIds) => {
              const next = await HotspotBlogService.updateComment(comment.id, {
                body,
                mentionUserIds,
              });
              setEditing(false);
              onChanged(next);
            }}
          />
        ) : (
          <>
            <div className="hsb-c-bubble">
              <div className="hsb-c-head">
                <span className="hsb-c-name">{comment.author.name}</span>
                {comment.author.designation && (
                  <span className="hsb-c-role">{comment.author.designation}</span>
                )}
                <span className="hsb-c-time" title={fmtDateTime(comment.createdAt)}>
                  {timeAgo(comment.createdAt)}
                  {comment.updatedAt !== comment.createdAt && ' · edited'}
                </span>
              </div>
              <div className="hsb-c-body">
                <MentionText body={comment.body} mentions={comment.mentions} />
              </div>
            </div>

            <div className="hsb-c-actions">
              <CommentReactions mine={comment.reactions.mine} onReact={react} />

              {!isReply && (
                <button className="hsb-c-action" onClick={() => setReplying((v) => !v)}>
                  Reply
                </button>
              )}

              {comment.reactions.total > 0 && (
                <span className="hsb-c-tally">
                  <span className="hsb-c-tally-emoji">
                    {REACTION_ORDER.filter((k) => (comment.reactions.counts[k] ?? 0) > 0)
                      .slice(0, 3)
                      .map((k) => REACTION_META[k].emoji)
                      .join('')}
                  </span>
                  {comment.reactions.total}
                </span>
              )}

              {menuItems.length > 0 && (
                <Dropdown
                  trigger={['click']}
                  menu={{
                    items: menuItems,
                    onClick: ({ key }) => {
                      if (key === 'edit') setEditing(true);
                      if (key === 'delete') confirmDelete();
                    },
                  }}
                >
                  <button className="hsb-c-action hsb-c-more" aria-label="Comment actions">
                    <MoreHorizontal size={15} />
                  </button>
                </Dropdown>
              )}
            </div>
          </>
        )}

        {comment.replies.length > 0 && (
          <div className="hsb-c-replies">
            {comment.replies.map((reply) => (
              <CommentRow
                key={reply.id}
                comment={reply}
                isReply
                postId={postId}
                postAuthorId={postAuthorId}
                currentUserId={currentUserId}
                canModerate={canModerate}
                onChanged={onChanged}
                me={me}
              />
            ))}
          </div>
        )}

        {replying && (
          <div className="hsb-c-reply-box">
            <Avatar
              user={{ id: '', name: me?.name || 'You', avatarUrl: me?.avatarUrl ?? null, designation: null }}
              size={28}
            />
            <CommentEditor
              autoFocus
              placeholder={`Reply to ${comment.author.name.split(' ')[0]}…`}
              submitLabel="Reply"
              onCancel={() => setReplying(false)}
              onSubmit={async (body, mentionUserIds) => {
                const next = await HotspotBlogService.addComment(postId, {
                  body,
                  parentCommentId: comment.id,
                  mentionUserIds,
                });
                setReplying(false);
                onChanged(next);
              }}
            />
          </div>
        )}
      </div>

      <style jsx>{`
        .hsb-c { display: flex; align-items: flex-start; gap: 10px; }
        .hsb-c-main { flex: 1; min-width: 0; }

        .hsb-c-bubble {
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 4px 12px 12px 12px;
          padding: 9px 13px;
        }
        /* Baseline, gap and wrapping all matter here: without them the name,
           the designation and the timestamp render as one run-on string. */
        .hsb-c-head {
          display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap;
          margin-bottom: 3px;
        }
        .hsb-c-name {
          font-size: 13px; font-weight: 700; color: var(--text-slate-900); line-height: 1.35;
        }
        .hsb-c-role {
          font-size: 11px; color: var(--text-slate-400); font-weight: 500;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 220px;
        }
        .hsb-c-time {
          font-size: 11px; color: var(--text-slate-400); font-weight: 500;
          margin-left: auto; white-space: nowrap;
        }
        .hsb-c-body {
          font-size: 13.5px; color: var(--text-slate-700); line-height: 1.55;
        }

        .hsb-c-actions {
          display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
          padding: 6px 0 0 4px; min-height: 24px;
        }
        .hsb-c-action {
          border: none; background: transparent; padding: 0; cursor: pointer;
          font-size: 12px; font-weight: 700; color: var(--text-slate-500);
          display: inline-flex; align-items: center;
        }
        .hsb-c-action:hover { color: ${PALETTE.blue}; }
        .hsb-c-more { color: var(--text-slate-400); }
        .hsb-c-tally {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 11.5px; color: var(--text-slate-500); font-weight: 600;
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
          border-radius: 100px; padding: 1px 8px;
        }
        .hsb-c-tally-emoji { font-size: 12px; line-height: 1; }

        .hsb-c-replies {
          margin-top: 12px; display: flex; flex-direction: column; gap: 12px;
          /* A rule down the left says "these hang off the comment above" far
             better than indentation alone. */
          padding-left: 12px;
          border-left: 2px solid var(--border-slate-200);
        }
        .hsb-c-reply-box {
          display: flex; align-items: flex-start; gap: 10px; margin-top: 12px;
        }
      `}</style>
    </div>
  );
}

// ─── Pieces ─────────────────────────────────────────────────────────────────

/**
 * One avatar, photo or initials.
 *
 * Both branches render inside the same component so they share one style block
 * — an early `return <img>` would leave the photo case with no `.hsb-av` rules
 * at all, and styled-jsx would reject a second block anyway.
 */
function Avatar({ user, size }: { user: BlogUser; size: number }) {
  const style: React.CSSProperties = { width: size, height: size };

  return (
    <>
      {user.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="hsb-av" src={user.avatarUrl} alt="" style={style} />
      ) : (
        <span
          className="hsb-av hsb-av-initials"
          style={{ ...style, background: avatarColorFor(user.name), fontSize: size * 0.38 }}
        >
          {initialsFor(user.name)}
        </span>
      )}
      <style jsx>{`
        .hsb-av { border-radius: 50%; flex-shrink: 0; object-fit: cover; }
        .hsb-av-initials {
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 700;
        }
      `}</style>
    </>
  );
}

/** The small react control on a comment — the six emoji, no big picker. */
function CommentReactions({
  mine,
  onReact,
}: {
  mine: BlogReaction | null;
  onReact: (r: BlogReaction) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className="hsb-cr"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        className={`hsb-cr-btn ${mine ? 'is-on' : ''}`}
        onClick={() => onReact(mine ?? 'like')}
      >
        {mine ? (
          <>
            <span className="hsb-cr-mine">{REACTION_META[mine].emoji}</span>
            {REACTION_META[mine].label}
          </>
        ) : (
          'React'
        )}
      </button>
      {open && (
        <span className="hsb-cr-picker">
          {REACTION_ORDER.map((k) => (
            <button
              key={k}
              className="hsb-cr-opt"
              title={REACTION_META[k].label}
              aria-label={REACTION_META[k].label}
              onClick={() => {
                onReact(k);
                setOpen(false);
              }}
            >
              {REACTION_META[k].emoji}
            </button>
          ))}
        </span>
      )}
      <style jsx>{`
        .hsb-cr { position: relative; display: inline-flex; }
        .hsb-cr-btn {
          display: inline-flex; align-items: center; gap: 5px;
          border: none; background: transparent; padding: 0; cursor: pointer;
          font-size: 12px; font-weight: 700; color: var(--text-slate-500);
        }
        .hsb-cr-btn:hover, .hsb-cr-btn.is-on { color: ${PALETTE.blue}; }
        .hsb-cr-mine { font-size: 13px; line-height: 1; }
        .hsb-cr-picker {
          position: absolute; bottom: calc(100% + 6px); left: 0; z-index: 30;
          display: flex; gap: 1px; padding: 4px;
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
          border-radius: 100px; box-shadow: 0 6px 18px rgba(15, 23, 42, 0.14);
        }
        .hsb-cr-opt {
          width: 28px; height: 28px; border: none; background: transparent; cursor: pointer;
          border-radius: 50%; font-size: 16px; line-height: 1;
          transition: transform .12s ease, background .12s ease;
        }
        .hsb-cr-opt:hover { transform: scale(1.25); background: ${TINT.blue}; }
      `}</style>
    </span>
  );
}

/** A mention-aware box for writing or editing a comment. */
function CommentEditor({
  initialBody = '',
  initialMentions = [],
  placeholder,
  submitLabel,
  autoFocus,
  onSubmit,
  onCancel,
}: {
  initialBody?: string;
  initialMentions?: BlogUser[];
  placeholder?: string;
  submitLabel: string;
  autoFocus?: boolean;
  onSubmit: (body: string, mentionUserIds: string[]) => Promise<void>;
  onCancel?: () => void;
}) {
  const { message } = App.useApp();
  const [body, setBody] = useState(initialBody);
  const [mentioned, setMentioned] = useState<BlogUser[]>(initialMentions);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!body.trim()) return;
    setBusy(true);
    try {
      await onSubmit(
        body.trim(),
        mentioned.map((u) => u.id)
      );
      setBody('');
      setMentioned([]);
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Could not post the comment');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="hsb-ce">
      <div className="hsb-ce-field">
        <MentionTextArea
          value={body}
          onChange={setBody}
          mentionedUsers={mentioned}
          onMentionedUsersChange={setMentioned}
          placeholder={placeholder}
          autoSize={{ minRows: 1, maxRows: 8 }}
          disabled={busy}
          autoFocus={autoFocus}
          onSubmit={submit}
        />
      </div>

      {/* The action row only appears once there is something to send, or when
          this is a reply/edit the user can back out of. An always-visible pair
          of buttons under every empty box pushed the thread around. */}
      {(body.trim().length > 0 || !!onCancel) && (
        <div className="hsb-ce-actions">
          {onCancel && (
            <Button size="small" type="text" onClick={onCancel} disabled={busy}>
              Cancel
            </Button>
          )}
          <Button
            size="small"
            type="primary"
            icon={<Send size={12} />}
            loading={busy}
            disabled={!body.trim()}
            onClick={submit}
          >
            {submitLabel}
          </Button>
        </div>
      )}

      <style jsx>{`
        .hsb-ce { flex: 1; min-width: 0; }
        .hsb-ce-field {
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
          border-radius: 18px; padding: 8px 14px;
          transition: border-color .12s ease;
        }
        .hsb-ce-field:focus-within { border-color: ${PALETTE.blue}66; }
        .hsb-ce-actions {
          display: flex; justify-content: flex-end; gap: 6px; margin-top: 8px;
        }
      `}</style>
    </div>
  );
}
