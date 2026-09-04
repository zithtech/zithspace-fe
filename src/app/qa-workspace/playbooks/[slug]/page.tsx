"use client";

/**
 * QA Playbooks — the reader.
 *
 * Left: the section tree. Right: recommendation cards in the format the spec
 * asks for — What to test / Examples / Expected / Level / Category / Risk / Why
 * it matters. Selecting recommendations and hitting Generate turns them into
 * real test cases through the drawer.
 *
 * Level and category filters are applied SERVER-side (the API prunes empty
 * sections), so the tree never shows a heading with nothing under it.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Button, Input, Tooltip, message } from "antd";
import { ArrowLeft, BookOpen, CheckCheck, Layers, Search, Sparkles, Lock, Pencil } from "lucide-react";
import dayjs from "dayjs";

import MainLayout from "@/components/layout/MainLayout";
import NoData from "@/components/common/NoData";
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";
import TicketFilterPill from "@/components/projects/TicketFilterPill";
import { usePermission } from "@/hooks/usePermission";
import { useActivitySource } from "@/hooks/useActivitySource";
import { useDebounce } from "@/hooks/useDebounce";
import { api as axios } from "@/lib/axios";
import GenerateFromPlaybookDrawer from "@/components/qa/GenerateFromPlaybookDrawer";
// The card and the overview renderer are shared with the author form's live
// preview, so what an author sees while writing is literally what renders here.
import { PlaybookItemCard, PlaybookOverview } from "@/components/qa/PlaybookCards";
import {
  PLAYBOOK_STYLES,
  LEVEL_ORDER,
  LEVEL_LABELS,
  VISIBILITY_LABELS,
  priceLabel,
  flattenItems,
  type PlaybookDetail,
  type PlaybookItem,
  type PlaybookSection,
} from "@/components/qa/playbookShared";

function SectionBlock({
  section,
  depth,
  categoryLabels,
  selected,
  onToggle,
  onToggleSection,
}: {
  section: PlaybookSection;
  depth: number;
  categoryLabels: Record<string, string>;
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleSection: (ids: string[], pick: boolean) => void;
}) {
  const allIds = useMemo(() => flattenItems([section]).map((i) => i.id), [section]);
  const allPicked = allIds.length > 0 && allIds.every((id) => selected.has(id));

  return (
    <section
      id={`pb-section-${section.id}`}
      className={depth === 0 ? "pb-section" : "pb-section pb-section__sub"}
    >
      <div className="pb-section__head">
        <h3 className={`pb-section__title ${depth > 0 ? "is-sub" : ""}`}>{section.title}</h3>
        {allIds.length > 0 && (
          <button
            type="button"
            className="pb-selectall"
            onClick={() => onToggleSection(allIds, !allPicked)}
          >
            <CheckCheck size={13} />
            {allPicked ? "Clear section" : `Select all ${allIds.length}`}
          </button>
        )}
      </div>

      {section.description && <p className="pb-section__desc">{section.description}</p>}

      {section.items.map((item) => (
        <PlaybookItemCard
          key={item.id}
          item={item}
          categoryLabels={categoryLabels}
          picked={selected.has(item.id)}
          onToggle={onToggle}
        />
      ))}

      {section.sections.map((child) => (
        <SectionBlock
          key={child.id}
          section={child}
          depth={depth + 1}
          categoryLabels={categoryLabels}
          selected={selected}
          onToggle={onToggle}
          onToggleSection={onToggleSection}
        />
      ))}
    </section>
  );
}

export default function PlaybookReaderPage() {
  useActivitySource({ section: "WORK", module: "QA", page: "PlaybookDetail" });

  const router = useRouter();
  const params = useParams();
  const slug = String((params as any)?.slug ?? "");
  const { canReadCase, canCreateCase } = usePermission();

  const [levels, setLevels] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 250);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [requested, setRequested] = useState(false);

  const { data: meta } = useQuery<{
    levels: { value: string; label: string }[];
    categories: { value: string; label: string }[];
    canPublish: boolean;
  }>({
    queryKey: ["qa", "playbooks", "meta"],
    queryFn: () => axios.get("/api/v2/qa/playbooks/meta"),
    enabled: canReadCase,
    staleTime: 60 * 60 * 1000,
  });

  const { data: playbook, isLoading } = useQuery<PlaybookDetail>({
    queryKey: ["qa", "playbooks", slug, levels, categories],
    queryFn: () => {
      const query: string[] = [];
      if (levels.length) query.push(`levels=${levels.join(",")}`);
      if (categories.length) query.push(`categories=${categories.join(",")}`);
      return axios.get(
        `/api/v2/qa/playbooks/${encodeURIComponent(slug)}${query.length ? `?${query.join("&")}` : ""}`
      );
    },
    enabled: canReadCase && !!slug,
    staleTime: 5 * 60 * 1000,
  });

  const categoryLabels = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of meta?.categories ?? []) map[c.value] = c.label;
    return map;
  }, [meta]);

  /* The filter offers this playbook's own categories, labelled from the shared
     vocabulary. `playbook.categories` is built from unfiltered facets, so the
     menu does not shrink as the reader narrows it. */
  const categoryFilterOptions = useMemo(() => {
    const present = playbook?.categories ?? [];
    if (present.length === 0) {
      return (meta?.categories ?? []).map((c) => ({ value: c.value, label: c.label }));
    }
    const order = new Map((meta?.categories ?? []).map((c, i) => [c.value, i]));
    return [...present]
      .sort((a, b) => (order.get(a) ?? 99) - (order.get(b) ?? 99))
      .map((value) => ({ value, label: categoryLabels[value] ?? value }));
  }, [playbook, meta, categoryLabels]);

  /* A locked playbook is listed but its body is withheld. Asking for access
     raises a request a Testiez admin decides on; the button then stays in its
     "asked" state so nobody queues a second one. */
  const requestAccess = useCallback(async () => {
    try {
      setRequesting(true);
      await axios.post(`/api/v2/qa/playbooks/${encodeURIComponent(slug)}/unlock-request`, {});
      setRequested(true);
      message.success("Access requested — you'll be notified once it's reviewed");
    } catch (err: any) {
      message.error(err?.message || "Could not send the access request");
    } finally {
      setRequesting(false);
    }
  }, [slug]);

  const toggleItem = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSection = useCallback((ids: string[], pick: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (pick ? next.add(id) : next.delete(id)));
      return next;
    });
  }, []);

  /**
   * Search runs on the client. The whole playbook is already in memory and the
   * biggest one is ~160 recommendations, so a round trip per keystroke would be
   * slower than the render it replaces — and it composes with the level and
   * category filters the API applied without a second request.
   *
   * A section whose own title matches keeps everything under it: someone typing
   * "token" wants the Token Lifecycle section, not the three items that happen
   * to repeat the word.
   */
  const sections = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    const all = playbook?.sections ?? [];
    if (!term) return all;

    const haystack = (item: PlaybookItem) =>
      [
        item.title,
        item.whatToTest,
        item.expected,
        item.whyItMatters,
        ...(item.steps ?? []),
        ...(item.examples ?? []).map((e) =>
          typeof e === "string" ? e : `${e.input} ${e.verdict}`
        ),
        categoryLabels[item.category] ?? item.category,
        item.level,
        item.risk,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

    const walk = (list: PlaybookSection[]): PlaybookSection[] =>
      list
        .map((section) =>
          section.title.toLowerCase().includes(term)
            ? section
            : {
                ...section,
                items: section.items.filter((item) => haystack(item).includes(term)),
                sections: walk(section.sections),
              }
        )
        .filter((section) => section.items.length > 0 || section.sections.length > 0);

    return walk(all);
  }, [playbook, debouncedSearch, categoryLabels]);

  /**
   * Which section the reader is actually looking at, so the outline on the left
   * says where you are in the playbook on the right. A 157-recommendation
   * playbook is several screens per section — without this the nav is a list of
   * links with no sense of place.
   *
   * A scroll listener rather than IntersectionObserver: sections nest, and two
   * or three are on screen at once, so "which one owns the top of the pane" is
   * the question — not "which ones are visible".
   */
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const navRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [activeSection, setActiveSection] = useState<string | null>(null);

  /** Section ids in document order — depth first, exactly as they render. */
  const sectionIds = useMemo(() => {
    const walk = (list: PlaybookSection[]): string[] =>
      list.flatMap((section) => [section.id, ...walk(section.sections)]);
    return walk(sections);
  }, [sections]);

  /** Every ancestor of the active section, so a parent lights up with its child. */
  const activeTrail = useMemo(() => {
    const trail = new Set<string>();
    const walk = (list: PlaybookSection[], parents: string[]): boolean =>
      list.some((section) => {
        if (section.id === activeSection) {
          parents.forEach((id) => trail.add(id));
          return true;
        }
        return walk(section.sections, [...parents, section.id]);
      });
    walk(sections, []);
    return trail;
  }, [sections, activeSection]);

  useEffect(() => {
    const container = bodyRef.current;
    if (!container || sectionIds.length === 0) return;

    let frame = 0;
    const pick = () => {
      frame = 0;
      // A little below the top edge, so a heading counts as "here" as it lands
      // rather than only once it has been scrolled past.
      const line = container.getBoundingClientRect().top + 28;
      let current = sectionIds[0];
      for (const id of sectionIds) {
        const el = document.getElementById(`pb-section-${id}`);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= line) current = id;
        else break; // ids are in document order, so the rest are below the fold
      }
      setActiveSection(current);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(pick);
    };

    pick();
    container.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      container.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [sectionIds]);

  /* Keep the highlighted entry in view when the outline is longer than the
     rail. `nearest` so it only moves when it has to — scrolling the nav out
     from under someone reading it would be worse than losing the highlight. */
  useEffect(() => {
    if (!activeSection) return;
    navRefs.current[activeSection]?.scrollIntoView({ block: "nearest" });
  }, [activeSection]);

  /* The filters hide items, but a hidden item stays selected — narrowing the
     filter to review one level must not silently drop the rest of a selection.
     Only the ids actually present are sent on generate. */
  const visibleIds = useMemo(
    () => new Set(flattenItems(sections).map((i) => i.id)),
    [sections]
  );
  const isFiltered =
    levels.length > 0 || categories.length > 0 || debouncedSearch.trim().length > 0;
  const selectedVisible = useMemo(
    () => [...selected].filter((id) => visibleIds.has(id)),
    [selected, visibleIds]
  );
  const hiddenSelectedCount = selected.size - selectedVisible.length;

  if (!canReadCase) {
    return (
      <MainLayout>
        <NoData
          title="No access to QA Playbooks"
          description="You need test case read access to open the playbook library."
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout noPadding>
      <style dangerouslySetInnerHTML={{ __html: PLAYBOOK_STYLES }} />

      <div className="dh-shell">
        <main className="dh-main">
          <div className="saas-header-container sc-header">
            <div className="sc-header-controls">
              <Button
                type="text"
                icon={<ArrowLeft size={17} />}
                onClick={() => router.push("/qa-workspace/playbooks")}
              >
                Playbooks
              </Button>

              {/* Each level carries its own count, so the reader can see there is
                  nothing at Expert before filtering to an empty page. Counts come
                  from the unfiltered facets, so they never move as you filter. */}
              <div className="pb-seg" role="group" aria-label="Level">
                <button
                  type="button"
                  className={`pb-seg__btn ${levels.length === 0 ? "is-on" : ""}`}
                  onClick={() => setLevels([])}
                >
                  All levels
                  {playbook ? <span className="pb-seg__n">{playbook.itemCount}</span> : null}
                </button>
                {LEVEL_ORDER.map((level) => {
                  const count = playbook?.levelCounts?.[level] ?? 0;
                  const empty = !!playbook && count === 0;
                  return (
                    <Tooltip
                      key={level}
                      title={empty ? `No ${LEVEL_LABELS[level]} recommendations here` : ""}
                    >
                      {/* Empty levels stay hoverable rather than `disabled` — a
                          disabled button swallows the mouse events the tooltip
                          needs, so the reader would get a dead pill with no
                          explanation. */}
                      <button
                        type="button"
                        aria-disabled={empty}
                        className={`pb-seg__btn ${empty ? "is-empty" : ""} ${
                          levels[0] === level ? "is-on" : ""
                        }`}
                        onClick={() => !empty && setLevels([level])}
                      >
                        {LEVEL_LABELS[level]}
                        {playbook ? <span className="pb-seg__n">{count}</span> : null}
                      </button>
                    </Tooltip>
                  );
                })}
              </div>

              <Input
                allowClear
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                disabled={!!playbook?.locked}
                prefix={<Search size={14} style={{ color: "#94a3b8" }} />}
                placeholder="Search recommendations"
                className="pb-search"
              />

              {/* Only the categories this playbook actually uses. The global
                  vocabulary has twelve; offering the ten that would filter to
                  nothing is a menu of dead ends. */}
              <TicketFilterPill
                label="Category"
                values={categories}
                multiple
                options={categoryFilterOptions}
                onChange={(next: string[]) => setCategories(next ?? [])}
                itemNoun="categories"
                placeholder="All categories"
              />
            </div>

            <div className="sc-header-right">
              {playbook && (
                <>
                  <span className={`pb-tier pb-tier--${playbook.visibility}`}>
                    {VISIBILITY_LABELS[playbook.visibility]}
                  </span>
                  <span className="pb-tag">
                    v{playbook.version}
                    {playbook.lastUpdatedAt
                      ? ` · ${dayjs(playbook.lastUpdatedAt).format("D MMM YYYY")}`
                      : ""}
                  </span>
                  {/* Same rule the API enforces: your workspace's own playbooks,
                      and the maintained library for a super_admin — who would
                      otherwise have no way back into a library playbook they
                      just wrote. */}
                  {canCreateCase && (playbook.isOwn || meta?.canPublish) && (
                    <Button
                      className="pb-btn is-sm"
                      icon={<Pencil size={14} />}
                      onClick={() =>
                        router.push(`/qa-workspace/playbooks/${playbook.slug}/edit`)
                      }
                    >
                      Edit
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="dh-main-scroll">
              <ZukvoLoadingOverlay loading minHeight={360}>
                <div />
              </ZukvoLoadingOverlay>
            </div>
          ) : !playbook ? (
            <div className="dh-main-scroll">
              <NoData
                title="Playbook not found"
                description="This playbook is not available in your workspace."
              />
            </div>
          ) : (
            <>
              <div className="pb-hero">
                <span className="pb-hero__badge">
                  <BookOpen size={18} />
                </span>
                <div className="pb-hero__text">
                  <h1 className="pb-hero__title">
                    {playbook.category} → {playbook.name}
                  </h1>
                  {/* One line, ellipsised: the summary sets the scene, and the
                      overview below it is where the detail belongs. The full
                      text stays reachable on hover. */}
                  <p className="pb-hero__sub" title={playbook.summary ?? ""}>
                    {playbook.summary}
                  </p>
                </div>
                <div className="pb-hero__stat">
                  <Layers size={14} />
                  <b>
                    {isFiltered && !playbook.locked
                      ? `${visibleIds.size} of ${playbook.itemCount}`
                      : playbook.itemCount}
                  </b>
                  <span>{isFiltered && !playbook.locked ? "shown" : "recommendations"}</span>
                </div>
              </div>

              <div className="pb-reader">
                <nav className="pb-nav">
                  {sections.map((section) => (
                    <div className="pb-nav__group" key={section.id}>
                      <button
                        type="button"
                        ref={(el) => {
                          navRefs.current[section.id] = el;
                        }}
                        className={`pb-nav__link ${
                          activeSection === section.id
                            ? "is-on"
                            : activeTrail.has(section.id)
                            ? "is-within"
                            : ""
                        }`}
                        onClick={() => {
                          setActiveSection(section.id);
                          document
                            .getElementById(`pb-section-${section.id}`)
                            ?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }}
                      >
                        <span className="pb-nav__label">{section.title}</span>
                        <span className="pb-nav__count">{flattenItems([section]).length}</span>
                      </button>
                      {section.sections.length > 0 && (
                        <div className="pb-nav__children">
                          {section.sections.map((child) => (
                            <button
                              key={child.id}
                              type="button"
                              ref={(el) => {
                                navRefs.current[child.id] = el;
                              }}
                              className={`pb-nav__link is-sub ${
                                activeSection === child.id ? "is-on" : ""
                              }`}
                              onClick={() => {
                                setActiveSection(child.id);
                                document
                                  .getElementById(`pb-section-${child.id}`)
                                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
                              }}
                            >
                              <span className="pb-nav__label">{child.title}</span>
                              <span className="pb-nav__count">
                                {flattenItems([child]).length}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </nav>

                <div className="pb-body" ref={bodyRef}>
                  {playbook.overview && <PlaybookOverview text={playbook.overview} />}

                  {playbook.locked ? (
                    /* Premium and not unlocked: the outline and the overview are
                       shown so the reader can judge what they'd be getting, and
                       the bodies stay behind the lock. */
                    <>
                      <div className="pb-lock">
                        <span className="pb-lock__badge">
                          <Lock size={18} />
                        </span>
                        <h3 className="pb-lock__title">This playbook is locked</h3>
                        <p className="pb-lock__sub">
                          {playbook.itemCount} recommendations across {playbook.sections.length}{" "}
                          sections, covering{" "}
                          {LEVEL_ORDER.filter((l) => playbook.levelCounts?.[l]).map(
                            (l) => LEVEL_LABELS[l]
                          ).join(", ")}
                          . Request access and a Testiez admin will review it for your workspace.
                        </p>
                        <span className="pb-lock__price">{priceLabel(playbook)}</span>
                        <Button
                          type="primary"
                          size="small"
                          icon={<Lock size={14} />}
                          loading={requesting}
                          disabled={requested || playbook.pendingRequest}
                          onClick={requestAccess}
                        >
                          {requested || playbook.pendingRequest
                            ? "Access requested"
                            : "Request access"}
                        </Button>
                      </div>

                      {playbook.sections.map((section) => (
                        <section key={section.id} className="pb-section">
                          <div className="pb-section__head">
                            <h3 className="pb-section__title">{section.title}</h3>
                          </div>
                          {section.description && (
                            <p className="pb-section__desc">{section.description}</p>
                          )}
                          {[section, ...section.sections].map((node) =>
                            node.itemCount > 0 ? (
                              <div className="pb-ghost" key={node.id}>
                                <Lock size={13} />
                                {node === section ? "" : `${node.title} — `}
                                {node.itemCount} recommendation
                                {node.itemCount === 1 ? "" : "s"}
                              </div>
                            ) : null
                          )}
                        </section>
                      ))}
                    </>
                  ) : sections.length === 0 ? (
                    <NoData
                      title={
                        debouncedSearch.trim()
                          ? `Nothing matches “${debouncedSearch.trim()}”`
                          : "Nothing matches these filters"
                      }
                      description={
                        debouncedSearch.trim()
                          ? "Try a shorter term, or clear the search to see the whole playbook."
                          : "Widen the level or category filter to see recommendations."
                      }
                    />
                  ) : (
                    sections.map((section) => (
                      <SectionBlock
                        key={section.id}
                        section={section}
                        depth={0}
                        categoryLabels={categoryLabels}
                        selected={selected}
                        onToggle={toggleItem}
                        onToggleSection={toggleSection}
                      />
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          {selected.size > 0 && (
            <div className="pb-selbar">
              <span className="pb-selbar__count">
                {selected.size} recommendation{selected.size === 1 ? "" : "s"} selected
              </span>
              {hiddenSelectedCount > 0 && (
                <span className="pb-selbar__hint">
                  {hiddenSelectedCount} hidden by the current filter — still included
                </span>
              )}
              <div className="pb-selbar__actions">
                <Button size="small" onClick={() => setSelected(new Set())}>
                  Clear
                </Button>
                <Button
                  type="primary"
                  size="small"
                  icon={<Sparkles size={14} />}
                  disabled={!canCreateCase}
                  onClick={() => {
                    if (!canCreateCase) {
                      message.error("You do not have permission to create test cases");
                      return;
                    }
                    setDrawerOpen(true);
                  }}
                >
                  Generate Test Cases
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>

      {playbook && (
        <GenerateFromPlaybookDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          playbookSlug={playbook.slug}
          playbookName={playbook.name}
          itemIds={[...selected]}
          onGenerated={(parentId) => {
            setDrawerOpen(false);
            setSelected(new Set());
            router.push(`/qa-workspace/test-cases/${parentId}`);
          }}
        />
      )}
    </MainLayout>
  );
}
