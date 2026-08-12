'use client';
import ZukvoLoader from "@/components/common/ZukvoLoader";


import React, { useState } from 'react';
import { App, Button, Dropdown, Popover } from 'antd';
import { AtSign, MessageCircle, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { PALETTE, fmtDateTime } from '@/components/openings/ui';
import { avatarColorFor, initialsFor } from '@/components/common/SearchableDropdown';
import HotspotBlogService, {
  BlogComment,
  BlogPost,
  BlogReaction,
  BlogUser,
} from '@/services/hotspotBlogService';
import { REACTION_META, reactorSummary, timeAgo } from './blogMeta';
import { usePermission } from '@/hooks/usePermission';
import { MentionHtml } from './mentions';
import BlogImageGrid from './BlogImageGrid';
import ReactionBar, { ReactionSummaryChips } from './ReactionBar';
import CommentThread from './CommentThread';

const COLLAPSE_AT = 420;

// One post in the feed: LinkedIn's information layout (author, text, reactions,
// a comment thread that expands in place) over Instagram's image treatment.
//
// Comments load lazily on first expand. A feed page carries ten posts; fetching
// every thread up front would be ten queries for conversations most readers
// will scroll straight past.
export default function BlogPostCard({
  post,
  currentUserId,
  canModerate,
  me,
  onEdit,
  onChanged,
}: {
  post: BlogPost;
  currentUserId: string | null;
  canModerate: boolean;
  me: { name: string; avatarUrl: string | null } | null;
  onEdit: (post: BlogPost) => void;
  /** Replace this post in the feed, or refetch when it is gone. */
  onChanged: (post: BlogPost | null) => void;
}) {
  const { message, modal } = App.useApp();
  const perms = usePermission() as unknown as Record<string, any>;

  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<BlogComment[] | null>(null);
  const [loadingComments, setLoadingComments] = useState(false);
  const [reactors, setReactors] = useState<{ user: BlogUser; reaction: BlogReaction }[] | null>(
    null
  );

  // Measured on the TEXT, not the HTML — otherwise a short post wrapped in
  // markup would collapse and a long unformatted one would not. The body itself
  // is never truncated: cutting HTML mid-tag would break the markup, so the
  // collapse is done with a CSS max-height instead.
  const isLong = post.bodyText.length > COLLAPSE_AT;
  const commentCount = comments
    ? comments.reduce((n, c) => n + 1 + c.replies.length, 0)
    : post.commentCount;

  const react = async (reaction: BlogReaction) => {
    try {
      onChanged(await HotspotBlogService.reactToPost(post.id, reaction));
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Could not react');
    }
  };

  const toggleComments = async () => {
    const next = !showComments;
    setShowComments(next);
    if (next && comments === null) {
      setLoadingComments(true);
      try {
        setComments(await HotspotBlogService.listComments(post.id));
      } catch (err: any) {
        message.error(err?.response?.data?.error || 'Could not load comments');
        setComments([]);
      } finally {
        setLoadingComments(false);
      }
    }
  };

  const loadReactors = async () => {
    if (reactors !== null) return;
    try {
      setReactors(await HotspotBlogService.listPostReactors(post.id));
    } catch {
      setReactors([]);
    }
  };

  const confirmDelete = () => {
    modal.confirm({
      title: 'Delete this post?',
      content: 'It will be removed from the feed for everyone, along with its comments.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await HotspotBlogService.remove(post.id);
          message.success('Post deleted');
          onChanged(null);
        } catch (err: any) {
          message.error(err?.response?.data?.error || 'Could not delete the post');
        }
      },
    });
  };

  return (
    <article className="hsb-post">
      <header className="hsb-post-head">
        {post.author.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="hsb-post-avatar" src={post.author.avatarUrl} alt="" />
        ) : (
          <span
            className="hsb-post-avatar hsb-post-initials"
            style={{ background: avatarColorFor(post.author.name) }}
          >
            {initialsFor(post.author.name)}
          </span>
        )}

        {/* Role and time share one line: as separate rows they made the header
            three lines tall on every card in the feed, for two pieces of
            secondary information. */}
        <div className="hsb-post-who">
          <div className="hsb-post-name">{post.author.name}</div>
          <div className="hsb-post-meta">
            {post.author.designation && (
              <>
                <span className="hsb-post-role">{post.author.designation}</span>
                <span className="hsb-post-dot">·</span>
              </>
            )}
            <span className="hsb-post-time" title={fmtDateTime(post.createdAt)}>
              {timeAgo(post.createdAt)}
              {post.updatedAt !== post.createdAt && ' · edited'}
            </span>
          </div>
        </div>

        {(perms.canUpdateHotspotBlog || perms.canDeleteHotspotBlog) && (
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                perms.canUpdateHotspotBlog ? { key: 'edit', label: 'Edit', icon: <Pencil size={14} /> } : null,
                perms.canDeleteHotspotBlog ? { key: 'delete', label: 'Delete', icon: <Trash2 size={14} />, danger: true } : null,
              ].filter(Boolean) as any[],
              onClick: ({ key }) => {
                if (key === 'edit') onEdit(post);
                if (key === 'delete') confirmDelete();
              },
            }}
          >
            <Button type="text" size="small" icon={<MoreHorizontal size={18} />} />
          </Dropdown>
        )}
      </header>

      {post.bodyText && (
        <div className="hsb-post-body">
          <div className={isLong && !expanded ? 'hsb-post-clip' : undefined}>
            <MentionHtml body={post.body} mentions={post.mentions} />
          </div>
          {isLong && (
            <button className="hsb-post-more" onClick={() => setExpanded((v) => !v)}>
              {expanded ? 'see less' : 'see more'}
            </button>
          )}
        </div>
      )}

      {post.mentions.length > 0 && (
        <div className="hsb-post-tagged">
          <AtSign size={12} />
          {post.mentions.length === 1
            ? post.mentions[0].name
            : `${post.mentions[0].name} and ${post.mentions.length - 1} other${
                post.mentions.length === 2 ? '' : 's'
              }`}
        </div>
      )}

      <BlogImageGrid images={post.images} />

      {(post.reactions.total > 0 || commentCount > 0) && (
        <div className="hsb-post-tally">
          <Popover
            trigger="hover"
            onOpenChange={(o) => o && loadReactors()}
            content={
              reactors === null ? (
                <ZukvoLoader size="sm" />
              ) : (
                // Styles for this live in the component's single <style jsx>
                // block below — styled-jsx forbids nesting a second one inside
                // an element tree that already has one.
                <div className="hsb-reactors">
                  {reactors.length === 0 ? (
                    <span className="hsb-reactors-empty">No reactions yet</span>
                  ) : (
                    reactors.map(({ user, reaction }) => (
                      <div className="hsb-reactor" key={user.id}>
                        <span>{REACTION_META[reaction].emoji}</span>
                        <span className="hsb-reactor-name">{user.name}</span>
                      </div>
                    ))
                  )}
                </div>
              )
            }
          >
            <span>
              <ReactionSummaryChips reactions={post.reactions} onClick={loadReactors} />
            </span>
          </Popover>

          {post.reactions.total > 0 && reactors && reactors.length > 0 && (
            <span className="hsb-post-names">
              {reactorSummary(
                reactors.map((r) => r.user.name),
                post.reactions.total
              )}
            </span>
          )}

          {commentCount > 0 && (
            <button className="hsb-post-commentcount" onClick={toggleComments}>
              {commentCount} comment{commentCount === 1 ? '' : 's'}
            </button>
          )}
        </div>
      )}

      <div className="hsb-post-actions">
        <ReactionBar reactions={post.reactions} onReact={react} />
        <button className="hsb-post-action" onClick={toggleComments}>
          <MessageCircle size={15} />
          Comment
        </button>
      </div>

      {showComments &&
        (loadingComments ? (
          <div className="hsb-post-loading">
            <ZukvoLoader size="sm" />
          </div>
        ) : (
          <CommentThread
            postId={post.id}
            postAuthorId={post.author.id}
            currentUserId={currentUserId}
            canModerate={canModerate}
            comments={comments ?? []}
            onChanged={setComments}
            me={me}
          />
        ))}

      <style jsx>{`
        .hsb-post {
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 12px;
          overflow: hidden;
        }
        .hsb-post-head {
          display: flex; align-items: center; gap: 10px; padding: 8px 14px 4px;
        }
        .hsb-post-avatar {
          width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0; object-fit: cover;
        }
        .hsb-post-initials {
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-size: 13px; font-weight: 700;
        }
        .hsb-post-who { flex: 1; min-width: 0; }
        .hsb-post-name {
          font-size: 13.5px; font-weight: 700; color: var(--text-slate-900); line-height: 1.25;
        }
        .hsb-post-meta {
          display: flex; align-items: center; gap: 5px; min-width: 0;
          line-height: 1.3;
        }
        .hsb-post-role {
          font-size: 11.5px; color: var(--text-slate-500); font-weight: 500; min-width: 0;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .hsb-post-dot { font-size: 11.5px; color: var(--text-slate-300); flex-shrink: 0; }
        .hsb-post-time {
          font-size: 11.5px; color: var(--text-slate-400); font-weight: 500;
          flex-shrink: 0; white-space: nowrap;
        }

        .hsb-post-body {
          padding: 0 14px 8px; font-size: 13.5px; line-height: 1.5;
          color: var(--text-slate-800);
        }
        /* Collapsing by CSS rather than by slicing the string keeps the markup
           intact — a cut through "<stro" would corrupt the whole post. */
        .hsb-post-clip {
          max-height: 120px;
          overflow: hidden;
          -webkit-mask-image: linear-gradient(180deg, #000 65%, transparent 100%);
          mask-image: linear-gradient(180deg, #000 65%, transparent 100%);
        }
        .hsb-post-more {
          border: none; background: transparent; padding: 0 0 0 4px; cursor: pointer;
          font-size: 13px; font-weight: 600; color: var(--text-slate-400);
        }
        .hsb-post-more:hover { color: ${PALETTE.blue}; }

        .hsb-post-tagged {
          display: flex; align-items: center; gap: 4px; padding: 0 14px 6px;
          font-size: 11.5px; font-weight: 600; color: var(--text-slate-500);
        }

        .hsb-post-tally {
          display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
          padding: 5px 14px 2px;
        }
        .hsb-post-names {
          font-size: 12px; color: var(--text-slate-500); font-weight: 500;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 45%;
        }
        .hsb-post-commentcount {
          margin-left: auto; border: none; background: transparent; padding: 0; cursor: pointer;
          font-size: 12px; font-weight: 500; color: var(--text-slate-500);
        }
        .hsb-post-commentcount:hover { color: ${PALETTE.blue}; text-decoration: underline; }

        .hsb-post-actions {
          display: flex; align-items: center; gap: 4px;
          padding: 1px 8px; margin: 0 6px; border-top: 1px solid var(--border-slate-100);
        }
        .hsb-post-action {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 9px; border-radius: 8px; cursor: pointer;
          border: none; background: transparent;
          font-size: 12.5px; font-weight: 600; color: var(--text-slate-500);
          transition: background .12s ease, color .12s ease;
        }
        .hsb-post-action:hover { background: var(--bg-slate-50); color: ${PALETTE.blue}; }

        .hsb-post-loading {
          display: flex; justify-content: center; padding: 16px;
          border-top: 1px solid var(--border-slate-100);
        }

        /* Reactor popover. It renders through a portal, but styled-jsx stamps
           the scope class at build time, so these still match. */
        .hsb-reactors {
          display: flex; flex-direction: column; gap: 4px;
          max-height: 240px; overflow-y: auto; min-width: 180px;
        }
        .hsb-reactor { display: flex; align-items: center; gap: 8px; }
        .hsb-reactor-name { font-size: 12.5px; color: var(--text-slate-700); }
        .hsb-reactors-empty { font-size: 12px; color: var(--text-slate-400); }
      `}</style>
    </article>
  );
}
