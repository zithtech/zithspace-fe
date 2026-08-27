'use client';
import NoData from "@/components/common/NoData";
import ZukvoLoader from "@/components/common/ZukvoLoader";


import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { App, Button } from 'antd';
import { AtSign, ImagePlus, Newspaper, PenLine, Users } from 'lucide-react';
import { OpeningStyles, PALETTE, PanelHeader, TINT } from '@/components/openings/ui';
import { avatarColorFor, initialsFor } from '@/components/common/SearchableDropdown';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import HotspotBlogService, { BlogPost } from '@/services/hotspotBlogService';
import BlogComposer from './BlogComposer';
import BlogPostCard from './BlogPostCard';

const PAGE_SIZE = 10;

type FeedScope = 'all' | 'mine' | 'tagged';

// The Blogs feed: a single readable column of posts, newest first, with an
// Instagram-style composer prompt at the top.
//
// Paging is "load more" rather than numbered pages — a social feed is read by
// scrolling, and page 4 of a feed is not a place anyone means to return to.
// Loaded posts accumulate; a filter change resets them.
export default function BlogFeed() {
  const { message } = App.useApp();
  const { user } = useAuth();
  const perms = usePermission() as unknown as Record<string, any>;
  const canModerate = !!perms.canManageOpenings;

  const me = useMemo(
    () => (user ? { name: user.name, avatarUrl: user.avatarUrl ?? null } : null),
    [user]
  );

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [scope, setScope] = useState<FeedScope>('all');
  const [composerOpen, setComposerOpen] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);

  const query = useMemo(
    () => ({
      search: search || undefined,
      authorUserId: scope === 'mine' ? user?.id : undefined,
      mentioningMe: scope === 'tagged',
      pageSize: PAGE_SIZE,
    }),
    [search, scope, user?.id]
  );

  /** Load page 1 and replace the list. Used on mount and whenever a filter changes. */
  const loadFirstPage = useCallback(async () => {
    setLoading(true);
    try {
      const res = await HotspotBlogService.list({ ...query, page: 1 });
      setPosts(res.items);
      setTotal(res.total);
      setPage(1);
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Could not load the feed');
    } finally {
      setLoading(false);
    }
  }, [query, message]);

  // Debounced so typing in the header search does not fire a request per key.
  useEffect(() => {
    const t = setTimeout(loadFirstPage, 250);
    return () => clearTimeout(t);
  }, [loadFirstPage]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const next = page + 1;
      const res = await HotspotBlogService.list({ ...query, page: next });
      // Guard against a post that shifted pages between requests showing twice.
      setPosts((current) => {
        const seen = new Set(current.map((p) => p.id));
        return [...current, ...res.items.filter((p) => !seen.has(p.id))];
      });
      setTotal(res.total);
      setPage(next);
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Could not load more posts');
    } finally {
      setLoadingMore(false);
    }
  };

  /**
   * Swap one post in place after a reaction or an edit, so the reader keeps
   * their scroll position. A deleted post (null) drops out of the list without
   * a refetch for the same reason.
   */
  const replacePost = (id: string, next: BlogPost | null) => {
    setPosts((current) =>
      next ? current.map((p) => (p.id === id ? next : p)) : current.filter((p) => p.id !== id)
    );
    if (!next) setTotal((t) => Math.max(0, t - 1));
  };

  const openNew = () => {
    setEditing(null);
    setComposerOpen(true);
  };

  const scopes: { key: FeedScope; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: 'All posts', icon: <Users size={13} /> },
    { key: 'mine', label: 'My posts', icon: <PenLine size={13} /> },
    { key: 'tagged', label: 'Tagged me', icon: <AtSign size={13} /> },
  ];

  return (
    <div className="omp hsb-feed">
      <OpeningStyles />
      <PanelHeader
        icon={<Newspaper />}
        color={PALETTE.blue}
        tint={TINT.blue}
        title="Blogs"
        subtitle="Share what you are working on — tag people, react, discuss"
        search={search}
        onSearch={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="Search posts…"
        sidebarEvent="open-hotspot-sidebar"
      />

      <div className="hsb-col">
        <div className="hsb-scopes">
          {scopes.map((s) => (
            <button
              key={s.key}
              className={`hsb-scope ${scope === s.key ? 'is-on' : ''}`}
              onClick={() => {
                setScope(s.key);
                setPage(1);
              }}
            >
              {s.icon}
              {s.label}
            </button>
          ))}
        </div>

        {perms.canCreateHotspotBlog && (
          <div className="hsb-prompt">
            {me?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="hsb-prompt-avatar" src={me.avatarUrl} alt="" />
            ) : (
              <span
                className="hsb-prompt-avatar hsb-prompt-initials"
                style={{ background: avatarColorFor(me?.name || 'You') }}
              >
                {initialsFor(me?.name || 'You')}
              </span>
            )}
            <button className="hsb-prompt-btn" onClick={openNew}>
              Share something with the company…
            </button>
            <Button type="text" icon={<ImagePlus size={18} />} onClick={openNew} aria-label="Add photos" />
          </div>
        )}

        {loading ? (
          <div className="hsb-state">
            <ZukvoLoader size="md" />
          </div>
        ) : posts.length === 0 ? (
          <div style={{ gridColumn: '1 / -1' }}>
            <NoData description={
              <div className="hsb-state hsb-empty pp-empty">
                <div className="hsb-empty-title pp-empty-title">
                  {search
                    ? 'No posts match that search'
                    : scope === 'mine'
                      ? 'You have not posted yet'
                      : scope === 'tagged'
                        ? 'Nobody has tagged you yet'
                        : 'Nothing here yet'}
                </div>
                <div className="hsb-empty-sub pp-empty-sub">
                  {scope === 'all' && !search
                    ? 'Be the first — post a photo or a note and tag whoever should see it.'
                    : 'Try a different filter or search.'}
                </div>
              </div>
            } />
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <BlogPostCard
                key={post.id}
                post={post}
                currentUserId={user?.id ?? null}
                canModerate={canModerate}
                me={me}
                onEdit={(p) => {
                  setEditing(p);
                  setComposerOpen(true);
                }}
                onChanged={(next) => replacePost(post.id, next)}
              />
            ))}

            {posts.length < total && (
              <Button block loading={loadingMore} onClick={loadMore} className="hsb-more-btn">
                Load more
              </Button>
            )}
          </>
        )}
      </div>

      <BlogComposer
        open={composerOpen}
        post={editing}
        me={me}
        onClose={() => setComposerOpen(false)}
        onSaved={loadFirstPage}
      />

      <style jsx>{`
        .hsb-feed { padding: 0 0 40px 0; }
        /* One readable column, centred — a feed post is prose plus a photo,
           not a card in a grid. */
        .hsb-col {
          display: flex; flex-direction: column; gap: 12px;
          max-width: 680px; width: 100%; margin: 0 auto;
        }
        .hsb-scopes { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .hsb-scope {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 12px; border-radius: 100px; cursor: pointer;
          border: 1px solid var(--border-slate-200); background: var(--bg-pure-white);
          font-size: 12px; font-weight: 600; color: var(--text-slate-600);
          transition: border-color .12s ease, background .12s ease, color .12s ease;
        }
        .hsb-scope:hover { border-color: ${PALETTE.blue}55; }
        .hsb-scope.is-on {
          color: ${PALETTE.blue}; background: ${TINT.blue}; border-color: ${PALETTE.blue}55;
        }

        .hsb-prompt {
          display: flex; align-items: center; gap: 10px;
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
          border-radius: 12px; padding: 12px 14px;
        }
        .hsb-prompt-avatar {
          width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0; object-fit: cover;
        }
        .hsb-prompt-initials {
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-size: 14px; font-weight: 700;
        }
        .hsb-prompt-btn {
          flex: 1; text-align: left; cursor: pointer;
          padding: 11px 16px; border-radius: 100px;
          border: 1px solid var(--border-slate-200); background: var(--bg-slate-50);
          font-size: 13.5px; color: var(--text-slate-400); font-weight: 500;
          transition: background .12s ease, border-color .12s ease;
        }
        .hsb-prompt-btn:hover { background: var(--bg-slate-100); border-color: ${PALETTE.blue}44; }

        .hsb-state {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 6px; padding: 48px 16px;
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
          border-radius: 12px;
        }
        .hsb-empty-title { font-size: 14px; font-weight: 700; color: var(--text-slate-700); }
        .hsb-empty-sub {
          font-size: 12.5px; color: var(--text-slate-400); font-weight: 500; text-align: center;
        }
        .hsb-feed :global(.hsb-more-btn) { margin-top: 4px; }
      `}</style>
    </div>
  );
}
