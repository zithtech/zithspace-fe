"use client";

/**
 * The collection shelf — "which of these playbooks are mine?"
 *
 * The catalog answers a QA who already knows which area they are working on.
 * This page answers the question that comes BEFORE that one, asked by someone
 * who has just opened a library of hundreds: we build a lending app / a school
 * ERP / a marketplace — where do I start?
 *
 * Grouped by kind rather than listed flat, because "By what you build" and "By
 * standard" are different questions and a single alphabetical list makes the
 * reader do the sorting.
 */

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button, Input } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { ArrowUpRight, BookOpen, Layers, Lock, Search, Sparkles } from "lucide-react";

import MainLayout from "@/components/layout/MainLayout";
import NoData from "@/components/common/NoData";
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";
import { usePermission } from "@/hooks/usePermission";
import { useActivitySource } from "@/hooks/useActivitySource";
import { useDebounce } from "@/hooks/useDebounce";
import { api as axios } from "@/lib/axios";
import CollectionFormModal from "@/components/qa/CollectionFormModal";
import CollectionPinModal from "@/components/qa/CollectionPinModal";
import { CollectionIcon } from "@/components/qa/CollectionIcon";
import {
  COLLECTION_KIND_HEADINGS,
  COLLECTION_KIND_ORDER,
  PLAYBOOK_STYLES,
  type CollectionKind,
  type CollectionSummary,
} from "@/components/qa/playbookShared";

/**
 * One collection on the shelf.
 *
 * Extracted because the pinned band and the kind sections render the SAME card
 * — a second copy is how the two quietly stop agreeing about what a locked or
 * empty pack looks like.
 */
function CollectionCard({
  collection,
  onOpen,
}: {
  collection: CollectionSummary;
  onOpen: () => void;
}) {
  return (
    <button type="button" className="pbc-card" onClick={onOpen}>
      <div className="pbc-card__top">
        <span className="pbc-card__av">
          <CollectionIcon name={collection.icon} />
        </span>
        <div className="pbc-card__id">
          <span className="pbc-card__name">{collection.name}</span>
          <span className="pbc-card__tags">
            {collection.pinned && <span className="pbc-tag is-pinned">Yours</span>}
            {/* A premium pack this workspace has not bought. It still opens —
                you cannot decide to buy what you cannot see. */}
            {collection.locked && (
              <span className="pbc-tag is-locked">
                <Lock size={9} /> Premium
              </span>
            )}
            {/* Only a curator ever sees a draft, so the tag is only ever
                meaningful to them. */}
            {collection.status !== "published" && (
              <span className="pbc-tag is-draft">{collection.status}</span>
            )}
          </span>
        </div>
        <span className="pbc-card__go">
          <ArrowUpRight size={16} />
        </span>
      </div>

      <p className="pbc-card__summary">{collection.summary}</p>

      <div className="pbc-card__foot">
        {collection.playbookCount === 0 ? (
          <span className="pbc-card__empty">Nothing mapped yet</span>
        ) : (
          <>
            <span className="pbc-card__stat">
              <BookOpen size={13} />
              <b>{collection.playbookCount}</b> playbooks
            </span>
            <span className="pbc-card__stat">
              <Layers size={13} />
              <b>{collection.itemCount}</b> recommendations
            </span>
          </>
        )}
      </div>
    </button>
  );
}

export default function CollectionsPage() {
  useActivitySource({ section: "WORK", module: "QA", page: "Playbook Collections" });

  const router = useRouter();
  const { canReadCase, canCreateCase } = usePermission();

  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [pinning, setPinning] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useQuery<{
    collections: CollectionSummary[];
    industries: string[];
    canCurate: boolean;
  }>({
    queryKey: ["qa", "collections", debouncedSearch],
    queryFn: () => {
      /* `all=true` asks for drafts as well. The API grants it only to a
         super_admin and ignores it for everyone else — without it a curator
         creates a collection and the shelf they are standing on never shows it
         back to them. */
      const params = new URLSearchParams({ all: "true" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      return axios.get(`/api/v2/qa/playbooks/collections?${params.toString()}`);
    },
    enabled: canReadCase,
    staleTime: 5 * 60 * 1000,
  });

  const canCurate = data?.canCurate ?? false;

  const all = useMemo(() => data?.collections ?? [], [data]);
  /* What this workspace said it builds. The API already sorts these first; the
     band gives them a heading so the answer is visible rather than merely
     obeyed. */
  const pinned = useMemo(() => all.filter((c) => c.pinned), [all]);

  /* Kinds in a fixed editorial order, and only the ones that have something in
     them — an empty "By platform" heading is a promise the shelf is not
     keeping. Pinned packs are shown above rather than twice. */
  const sections = useMemo(() => {
    const byKind = new Map<CollectionKind, CollectionSummary[]>();
    for (const collection of all) {
      if (collection.pinned) continue;
      const list = byKind.get(collection.kind) ?? [];
      list.push(collection);
      byKind.set(collection.kind, list);
    }
    return COLLECTION_KIND_ORDER.filter((kind) => (byKind.get(kind)?.length ?? 0) > 0).map(
      (kind) => ({ kind, collections: byKind.get(kind) ?? [] })
    );
  }, [all]);

  const totals = useMemo(() => {
    const collections = data?.collections ?? [];
    return {
      collections: collections.length,
      playbooks: collections.reduce((sum, c) => sum + c.playbookCount, 0),
    };
  }, [data]);

  if (!canReadCase) {
    return (
      <MainLayout>
        <NoData
          title="No access to collections"
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
          <div className="pb-hero">
            <span className="pb-hero__badge">
              <Layers size={18} />
            </span>
            <div className="pb-hero__text">
              <h1 className="pb-hero__title">Collections</h1>
              <p className="pb-hero__sub">
                Playbooks bundled for what you build — pick your industry and read them in order
              </p>
            </div>
            <div className="pb-hero__stats">
              <span className="pb-hero__stat">
                <b>{totals.collections}</b>
                <span>Collections</span>
              </span>
              <span className="pb-hero__stat">
                <b>{totals.playbooks}</b>
                <span>Playbooks</span>
              </span>
            </div>
          </div>

          <div className="pb-toolbar">
            <Input
              className="pb-search is-wide"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search collections…"
              prefix={<Search size={14} />}
              allowClear
            />
            <div style={{ marginLeft: "auto", display: "inline-flex", gap: 8 }}>
              <Button onClick={() => router.push("/playbooks")}>All playbooks</Button>
              <Button icon={<Sparkles size={14} />} onClick={() => setPinning(true)}>
                What do you build?
              </Button>
              {/* Anyone who can author a playbook can author a pack of their own.
                  What the write MEANS is decided on the server from who is
                  asking: a curator's is published to the platform, a team's is
                  their workspace's alone. */}
              {canCreateCase && (
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreating(true)}>
                  New collection
                </Button>
              )}
            </div>
          </div>

          <div className="dh-main-scroll">
            {isLoading ? (
              <ZukvoLoadingOverlay loading minHeight={320}>
                <div />
              </ZukvoLoadingOverlay>
            ) : all.length === 0 ? (
              <NoData
                title="No collections yet"
                description={
                  canCurate
                    ? "Create a collection, then map playbooks into the order they should be read."
                    : "Nothing has been published to the shelf yet."
                }
              />
            ) : (
              <>
                {/* Asked once, and only while unanswered. A band that keeps
                    asking after you have told it becomes noise on the page you
                    open most. */}
                {pinned.length === 0 && (
                  <div className="pbc-ask">
                    <span className="pb-hero__badge">
                      <Sparkles size={17} />
                    </span>
                    <div className="pbc-ask__text">
                      <div className="pbc-ask__title">What do you build?</div>
                      <div className="pbc-ask__sub">
                        Tell us and the collections that match your product come first —
                        here and on the catalog. Nothing gets hidden.
                      </div>
                    </div>
                    <Button type="primary" onClick={() => setPinning(true)}>
                      Choose
                    </Button>
                  </div>
                )}

                {pinned.length > 0 && (
                  <section className="pbc-kind">
                    <div className="pbc-kind__head">
                      <span className="pbc-kind__title">Yours</span>
                      <span className="pbc-kind__count">{pinned.length}</span>
                      <button
                        type="button"
                        className="pbc-strip__more"
                        style={{ marginLeft: "auto" }}
                        onClick={() => setPinning(true)}
                      >
                        Change
                      </button>
                    </div>
                    <div className="pbc-grid">
                      {pinned.map((collection) => (
                        <CollectionCard
                          key={collection.id}
                          collection={collection}
                          onOpen={() =>
                            router.push(`/playbooks/collections/${collection.slug}`)
                          }
                        />
                      ))}
                    </div>
                  </section>
                )}

                {sections.map(({ kind, collections }) => (
                  <section className="pbc-kind" key={kind}>
                    <div className="pbc-kind__head">
                      <span className="pbc-kind__title">{COLLECTION_KIND_HEADINGS[kind]}</span>
                      <span className="pbc-kind__count">{collections.length}</span>
                    </div>
                    <div className="pbc-grid">
                      {collections.map((collection) => (
                        <CollectionCard
                          key={collection.id}
                          collection={collection}
                          onOpen={() =>
                            router.push(`/playbooks/collections/${collection.slug}`)
                          }
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </>
            )}
          </div>
        </main>
      </div>

      <CollectionPinModal
        collections={all}
        open={pinning}
        onClose={() => setPinning(false)}
      />

      <CollectionFormModal
        open={creating}
        canCurate={canCurate}
        existing={all}
        industries={data?.industries ?? []}
        onClose={() => setCreating(false)}
        onSaved={(slug) => slug && router.push(`/playbooks/collections/${slug}`)}
      />
    </MainLayout>
  );
}
