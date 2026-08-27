'use client';
import NoData from "@/components/common/NoData";
import ZukvoLoader from "@/components/common/ZukvoLoader";


import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { App, Button, Input, Pagination } from 'antd';
import { ChevronDown, Megaphone, Plus, Search, X } from 'lucide-react';
import { OpeningStyles, PALETTE, PanelHeader, TINT } from '@/components/openings/ui';
import { usePermission } from '@/hooks/usePermission';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import HotspotCirculationService, {
  BUILT_IN_CATEGORIES,
  CirculationAuthor,
  CirculationCategory,
  CirculationPost,
} from '@/services/hotspotCirculationService';
import { categoryMetaForItem } from './circulationMeta';
import { useCirculationCategories } from './useCirculationCategories';
import CirculationComposer from './CirculationComposer';
import CirculationDetailDrawer from './CirculationDetailDrawer';
import CirculationPostCard from './CirculationPostCard';

const PAGE_SIZE = 15;
/**
 * Category chips shown before the rest fold into "N more". Sized so the strip
 * always holds one line at the column's width — the chips never wrap, because a
 * second row of filters pushes the feed down the page for no gain.
 */
const INLINE_CATEGORIES = 4;

/** Canonical order of the built-ins, independent of how the API returns them. */
const BUILT_IN_ORDER = new Map(BUILT_IN_CATEGORIES.map((key, i) => [key as string, i]));

// The Circulation feed: company-wide updates, newest first with pinned posts on
// top. Anyone can post; the server decides who may touch someone else's post
// and hands back `canEdit` per row, so the UI never has to guess.
export default function CirculationBoard() {
  const { message } = App.useApp();
  const perms = usePermission() as unknown as Record<string, any>;
  const canModerate = !!perms.canManageOpenings;

  const { categories, reload: reloadCategories } = useCirculationCategories();

  const [posts, setPosts] = useState<CirculationPost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CirculationCategory | null>(null);
  // Replaces the old "My updates" toggle: picking yourself in the dropdown does
  // the same job and also covers everyone else.
  const [authorUserId, setAuthorUserId] = useState<string | null>(null);
  const [authors, setAuthors] = useState<CirculationAuthor[]>([]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [editing, setEditing] = useState<CirculationPost | null>(null);
  // Open state is kept apart from the post so the drawer still has content to
  // render while it slides out — clearing the post on close would unmount it
  // mid-animation.
  const [detail, setDetail] = useState<CirculationPost | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // The category strip sticks directly under the page header, which is itself
  // sticky at top: 0. Its height is not a constant — the actions row wraps on
  // narrow screens — so measure it instead of hard-coding an offset.
  const boardRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const header = boardRef.current?.querySelector('.omp-header');
    if (!header) return;

    // offsetHeight, not contentRect: the offset has to clear the header's
    // padding and border too, or the strip parks 20-odd pixels under it.
    const observer = new ResizeObserver(([entry]) => {
      setHeaderHeight((entry.target as HTMLElement).offsetHeight);
    });
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await HotspotCirculationService.list({
        search: search || undefined,
        category: category ?? undefined,
        authorUserId: authorUserId ?? undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      setPosts(res.items);
      setTotal(res.total);
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Could not load the circulation feed');
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, [search, category, authorUserId, page, message]);

  // Debounced so typing in the header search does not fire a request per key.
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  // Any filter change puts us back on page 1; staying on page 4 of a narrower
  // result set shows an empty feed that looks like a failure.
  const applyFilter = (next: () => void) => {
    setPage(1);
    next();
  };

  // Empty built-ins stay visible so the vocabulary is discoverable; an empty
  // category the tenant created is just clutter until something is filed there.
  const visibleCategories = useMemo(
    () => categories.filter((c) => c.isBuiltIn || c.postCount > 0 || c.key === category),
    [categories, category],
  );

  const loadAuthors = useCallback(async () => {
    try {
      setAuthors(await HotspotCirculationService.listAuthors());
    } catch {
      // The dropdown degrades to "Anyone" — not worth interrupting the reader.
    }
  }, []);

  useEffect(() => {
    loadAuthors();
  }, [loadAuthors]);

  const totalPosts = useMemo(
    () => categories.reduce((sum, c) => sum + c.postCount, 0),
    [categories],
  );

  // One row, always. The built-ins lead in their canonical order (General,
  // Announcement, Policy, Event, Celebration, Alert) so the strip reads the same
  // on every visit rather than reshuffling with the week's traffic; tenant
  // categories follow, busiest first. Whatever does not fit the row folds into
  // "N more". The SELECTED category is always promoted inline — a filter you
  // cannot see is a filter you forget is on.
  const { inlineCategories, overflowCategories } = useMemo(() => {
    const ordered = [
      ...visibleCategories
        .filter((c) => c.isBuiltIn)
        .sort((a, b) => (BUILT_IN_ORDER.get(a.key) ?? 0) - (BUILT_IN_ORDER.get(b.key) ?? 0)),
      ...visibleCategories.filter((c) => !c.isBuiltIn).sort((a, b) => b.postCount - a.postCount),
    ];

    const inline = ordered.slice(0, INLINE_CATEGORIES);
    const overflow = ordered.slice(INLINE_CATEGORIES);

    const selectedIndex = overflow.findIndex((c) => c.key === category);
    if (selectedIndex !== -1) {
      inline.push(overflow.splice(selectedIndex, 1)[0]);
    }
    return { inlineCategories: inline, overflowCategories: overflow };
  }, [visibleCategories, category]);

  const overflowOptions = useMemo(
    () =>
      overflowCategories.map((item) => {
        const meta = categoryMetaForItem(item);
        return {
          value: item.key,
          label: meta.label,
          description: `${item.postCount} update${item.postCount === 1 ? '' : 's'}`,
        };
      }),
    [overflowCategories],
  );

  const authorOptions = useMemo(
    () =>
      authors.map((a) => ({
        value: a.id,
        label: a.name,
        description: a.designation ?? undefined,
        avatarUrl: a.avatarUrl,
        meta: `${a.postCount}`,
      })),
    [authors],
  );

  const activeFilters = [search, category, authorUserId].filter(Boolean).length;

  const clearFilters = () => {
    setPage(1);
    setSearch('');
    setCategory(null);
    setAuthorUserId(null);
  };

  const refresh = () => {
    load();
    reloadCategories();
    loadAuthors();
  };

  const openNew = () => {
    setEditing(null);
    setComposerOpen(true);
  };

  const openEdit = (post: CirculationPost) => {
    setEditing(post);
    setComposerOpen(true);
  };

  return (
    <div
      className="omp hsc-board"
      ref={boardRef}
      style={{ '--hsc-head-h': `${headerHeight}px` } as React.CSSProperties}
    >
      <OpeningStyles />
      <PanelHeader
        icon={<Megaphone />}
        color={PALETTE.green}
        tint={TINT.green}
        title="Circulation"
        subtitle="Important updates shared across the company"
        sidebarEvent="open-hotspot-sidebar"
      >
        {/* Search and author sit with the page actions, not over the feed: they
            narrow what the whole page is showing, so they belong to the page
            chrome. Categories stay down with the posts they label. */}
        <div className="hsc-head-tool hsc-head-search">
          <Input
            allowClear
            prefix={<Search size={14} className="hsc-search-icon" />}
            placeholder="Search updates…"
            value={search}
            onChange={(e) => applyFilter(() => setSearch(e.target.value))}
          />
        </div>

        <div className="hsc-head-tool hsc-head-author">
          <SearchableDropdown
            value={authorUserId}
            onChange={(v) => applyFilter(() => setAuthorUserId((v as string) || null))}
            options={authorOptions}
            placeholder="Posted by"
            searchPlaceholder="Find a colleague…"
            itemNoun="people"
            showSelectedAvatar
            width={280}
          />
        </div>

        {perms.canCreateHotspotCirculation && (
          <Button type="primary" icon={<Plus size={15} />} onClick={openNew}>
            New Update
          </Button>
        )}
      </PanelHeader>

      <div className="hsc-col">
        {/* Categories read as a table of contents for the feed, so they are
            centred over the reading column rather than pinned to the page edge,
            and they stay pinned under the header as the feed scrolls. */}
        <div className="hsc-catbar">
          <div className="hsc-chips">
            <button
              className={`hsc-chip ${category === null ? 'is-on' : ''}`}
              onClick={() => applyFilter(() => setCategory(null))}
            >
              All
              <span className="hsc-chip-count">{totalPosts}</span>
            </button>

            {inlineCategories.map((item) => {
              const meta = categoryMetaForItem(item);
              const on = category === item.key;
              return (
                <button
                  key={item.key}
                  className={`hsc-chip ${on ? 'is-on' : ''}`}
                  style={
                    on
                      ? { color: meta.color, background: meta.tint, borderColor: `${meta.color}66` }
                      : undefined
                  }
                  onClick={() => applyFilter(() => setCategory(on ? null : item.key))}
                >
                  {meta.icon}
                  <span className="hsc-chip-label">{meta.label}</span>
                  <span className="hsc-chip-count">{item.postCount}</span>
                </button>
              );
            })}

            {/* Overflow. The selected category is always promoted inline, so this
                never hides the one filter that is actually on. */}
            {overflowCategories.length > 0 && (
              // SearchableDropdown wraps a customTrigger in a `width: 100%` div.
              // Unconstrained, that makes the chip claim the whole flex row.
              // `width: max-content` on this wrapper gives the 100% something
              // definite (and natural) to resolve against.
              <span className="hsc-more-wrap">
                <SearchableDropdown
                  value={category}
                  onChange={(v) => applyFilter(() => setCategory((v as string) || null))}
                  options={overflowOptions}
                  searchPlaceholder="Find a category…"
                  itemNoun="categories"
                  hideAvatar
                  width={260}
                  customTrigger={
                    <button className="hsc-chip hsc-chip-more">
                      {overflowCategories.length} more
                      <ChevronDown size={13} />
                    </button>
                  }
                />
              </span>
            )}
          </div>

          {/* Result count and the filter reset sit in the right corner of the
              strip — a running tally of what the chips left standing, out of the
              chips' way. Reflects the ACTIVE filters, which is what the old
              "All N" chip could not do. */}
          <div className="hsc-catmeta">
            {/* Kept mounted once it has a number to show: dropping it during
                every reload re-centres the chips beside it, and the strip
                twitches on each keystroke in search. */}
            {hasLoaded && (
              <span className="hsc-count" style={{ opacity: loading ? 0.45 : 1 }}>
                {total} update{total === 1 ? '' : 's'}
              </span>
            )}
            {activeFilters > 0 && (
              <button className="hsc-clear" onClick={clearFilters}>
                <X size={13} />
                Clear {activeFilters} filter{activeFilters === 1 ? '' : 's'}
              </button>
            )}
          </div>
        </div>

        <div className="hsc-feed">
          {loading ? (
            <div className="omp-empty">
              <ZukvoLoader size="md" />
            </div>
          ) : posts.length === 0 ? (
            <div style={{ gridColumn: '1 / -1' }}>
              <NoData description={
                <div className="omp-empty pp-empty">
                  <div className="omp-empty-title pp-empty-title">
                    {activeFilters > 0 ? 'No matching updates' : 'Nothing circulated yet'}
                  </div>
                  <div className="omp-empty-sub pp-empty-sub">
                    {activeFilters > 0
                      ? 'Try a different search, category or author.'
                      : 'Post the first update — it will reach everyone in the company.'}
                  </div>
                </div>
              } />
            </div>
          ) : (
            posts.map((post) => (
              <CirculationPostCard
                key={post.id}
                post={post}
                onOpen={() => {
                  setDetail(post);
                  setDetailOpen(true);
                }}
              />
            ))
          )}
        </div>

        {total > PAGE_SIZE && (
          <div className="hsc-pager">
            <Pagination
              current={page}
              pageSize={PAGE_SIZE}
              total={total}
              showSizeChanger={false}
              onChange={setPage}
            />
          </div>
        )}
      </div>

      <CirculationDetailDrawer
        open={detailOpen}
        post={detail}
        canModerate={canModerate}
        onClose={() => setDetailOpen(false)}
        onEdit={(post) => {
          // Hand straight over to the composer: leaving the detail open behind
          // an edit dialog would put two views of the same post on screen.
          setDetailOpen(false);
          openEdit(post);
        }}
        onChanged={refresh}
      />

      <CirculationComposer
        open={composerOpen}
        post={editing}
        canModerate={canModerate}
        categories={categories}
        onCategoriesChanged={reloadCategories}
        onClose={() => setComposerOpen(false)}
        onSaved={refresh}
      />

      <style jsx>{`
        .hsc-board {
          padding: 0 0 40px 0;
        }
        /* The shared panel header is spaced for pages that open straight into
           content. This one has the category strip under it, so the stacked
           paddings left a dead band across the top — tighten both. */
        .hsc-board :global(.omp-header) {
          padding-top: 10px !important;
          padding-bottom: 12px !important;
          margin-bottom: 0 !important;
        }
        /* Search and the author picker live in the header actions row, sized to
           match the 32px buttons that sit beside them. */
        .hsc-head-tool {
          display: flex;
          align-items: center;
          min-width: 0;
        }
        .hsc-head-search {
          width: 240px;
        }
        .hsc-head-search :global(.ant-input-affix-wrapper) {
          height: 32px;
          border-radius: 8px;
        }
        .hsc-board :global(.hsc-search-icon) {
          color: var(--text-slate-400);
        }
        .hsc-head-author {
          width: 180px;
        }
        .hsc-head-author :global(.sd-trigger) {
          height: 32px;
          min-width: 0;
        }
        @media (max-width: 720px) {
          .hsc-head-search,
          .hsc-head-author {
            width: 100%;
          }
        }

        /* One centred reading column. The categories, the feed and the pager all
           live inside it so they share a left edge — capping the feed's width
           without also centring it (and without bringing the categories along)
           left the posts hugging the left of a wide screen. */
        .hsc-col {
          display: flex;
          flex-direction: column;
          max-width: 820px;
          width: 100%;
          margin: 0 auto;
        }
        /* Category strip: centred over the feed it filters, and pinned under the
           page header so the filters stay reachable however far you scroll.
           --hsc-head-h is measured from the sticky header above it. */
        .hsc-catbar {
          position: sticky;
          top: var(--hsc-head-h, 0px);
          z-index: 20;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 0 10px;
          margin-bottom: 14px;
          background: var(--bg-pure-white);
          border-bottom: 1px solid var(--border-slate-100);
        }

        /* Never wraps: anything that does not fit is already behind "N more".
           On a narrow screen the row scrolls sideways instead of growing a
           second line. */
        .hsc-chips {
          flex: 1 1 auto;
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          flex-wrap: nowrap;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .hsc-chips::-webkit-scrollbar {
          display: none;
        }
        .hsc-catmeta {
          flex: 0 0 auto;
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        /* Stacked on narrow screens: six chips plus the tally will not share a
           row there, and squeezing them makes both unreadable. */
        @media (max-width: 720px) {
          .hsc-catbar {
            flex-direction: column;
            align-items: stretch;
            gap: 6px;
          }
          .hsc-catmeta {
            margin-left: 0;
            justify-content: flex-end;
          }
        }
        .hsc-chip {
          display: inline-flex;
          align-items: center;
          flex: 0 0 auto;
          max-width: 180px;
          white-space: nowrap;
          gap: 6px;
          padding: 5px 10px;
          border-radius: 100px;
          cursor: pointer;
          border: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white);
          font-size: 12px;
          font-weight: 600;
          color: var(--text-slate-600);
          transition:
            border-color 0.12s ease,
            background 0.12s ease,
            color 0.12s ease;
        }
        .hsc-chip:hover {
          border-color: ${PALETTE.blue}55;
        }
        .hsc-chip.is-on {
          color: ${PALETTE.blue};
          background: ${TINT.blue};
          border-color: ${PALETTE.blue}55;
        }
        /* A promoted tenant category can carry a long label; clip it rather than
           let one chip push the rest off the row. */
        .hsc-chip-label {
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .hsc-chip-count {
          flex: 0 0 auto;
          font-size: 10.5px;
          font-weight: 700;
          color: var(--text-slate-400);
        }
        .hsc-chip-more {
          border-style: dashed;
        }
        .hsc-more-wrap {
          display: inline-block;
          width: max-content;
        }
        .hsc-clear {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          border: none;
          background: transparent;
          padding: 0;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-slate-500);
        }
        .hsc-clear:hover {
          color: ${PALETTE.blue};
        }
        .hsc-count {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-slate-400);
          white-space: nowrap;
        }

        /* A single readable column — an update is prose, not a card in a grid.
           Width and centring come from .hsc-col above. */
        .hsc-feed {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .hsc-pager {
          display: flex;
          justify-content: center;
          margin-top: 20px;
        }
      `}</style>
    </div>
  );
}
