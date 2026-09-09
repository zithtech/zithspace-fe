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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button, Dropdown, Input, Tooltip, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import {
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  Layers,
  Lock,
  Pencil,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";

import MainLayout from "@/components/layout/MainLayout";
import NoData from "@/components/common/NoData";
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";
import { useSubscriptionFeature } from "@/hooks/useSubscriptionFeature";
import { useAuth } from "@/context/AuthContext";
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
  VISIBILITY_LABELS,
  type CollectionKind,
  type CollectionSummary,
  type PlaybookStatus,
  type PlaybookVisibility,
} from "@/components/qa/playbookShared";

/**
 * One collection on the shelf.
 */
function CollectionCard({
  collection,
  onOpen,
  onEdit,
  onStatusChange,
  canPublish,
}: {
  collection: CollectionSummary;
  onOpen: () => void;
  onEdit?: () => void;
  onStatusChange?: (status: PlaybookStatus, visibility?: PlaybookVisibility) => void;
  canPublish?: boolean;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      className="pbc-card"
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <div className="pbc-card__top">
        <span className="pbc-card__av">
          <CollectionIcon name={collection.icon} />
        </span>
        <div className="pbc-card__id">
          <span className="pbc-card__name">{collection.name}</span>
          <span
            className="pbc-card__tags"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {collection.pinned && <span className="pbc-tag is-pinned">Yours</span>}
            {onStatusChange ? (
              <Dropdown
                trigger={["click"]}
                placement="bottomLeft"
                menu={{
                  items: [
                    {
                      key: "draft",
                      label: (
                        <div style={{ display: "flex", flexDirection: "column", padding: "2px 0" }}>
                          <span style={{ fontWeight: 600, fontSize: 12.5, color: "#0f172a" }}>Draft</span>
                          <span style={{ fontSize: 11, color: "#64748b" }}>Work in progress (unlisted)</span>
                        </div>
                      ),
                      icon: collection.status === "draft" ? <Check size={14} color="#2563eb" /> : <div style={{ width: 14 }} />,
                      onClick: (e) => {
                        e.domEvent.stopPropagation();
                        onStatusChange("draft");
                      },
                    },
                    {
                      type: "divider",
                    },
                    {
                      key: "workspace",
                      label: (
                        <div style={{ display: "flex", flexDirection: "column", padding: "2px 0" }}>
                          <span style={{ fontWeight: 600, fontSize: 12.5, color: "#0f172a" }}>Publish (Private)</span>
                          <span style={{ fontSize: 11, color: "#64748b" }}>Visible only to your workspace</span>
                        </div>
                      ),
                      icon: collection.status === "published" && collection.visibility === "workspace" ? <Check size={14} color="#2563eb" /> : <div style={{ width: 14 }} />,
                      onClick: (e) => {
                        e.domEvent.stopPropagation();
                        onStatusChange("published", "workspace");
                      },
                    },
                    {
                      key: "public",
                      label: (
                        <div style={{ display: "flex", flexDirection: "column", padding: "2px 0" }}>
                          <span style={{ fontWeight: 600, fontSize: 12.5, color: "#0f172a" }}>Publish (Public)</span>
                          <span style={{ fontSize: 11, color: "#64748b" }}>Visible to all workspaces</span>
                        </div>
                      ),
                      icon: collection.status === "published" && collection.visibility === "public" ? <Check size={14} color="#2563eb" /> : <div style={{ width: 14 }} />,
                      onClick: (e) => {
                        e.domEvent.stopPropagation();
                        onStatusChange("published", "public");
                      },
                    },
                    ...(canPublish ? [
                      {
                        key: "premium",
                        label: (
                          <div style={{ display: "flex", flexDirection: "column", padding: "2px 0" }}>
                            <span style={{ fontWeight: 600, fontSize: 12.5, color: "#7e22ce" }}>Publish (Premium)</span>
                            <span style={{ fontSize: 11, color: "#64748b" }}>Listed globally, unlocked on purchase</span>
                          </div>
                        ),
                        icon: collection.status === "published" && collection.visibility === "premium" ? <Check size={14} color="#7e22ce" /> : <div style={{ width: 14 }} />,
                        onClick: (e: any) => {
                          e.domEvent.stopPropagation();
                          onStatusChange("published", "premium");
                        },
                      },
                    ] : []),
                  ],
                }}
              >
                <button
                  type="button"
                  className={`pb-tier ${collection.status === "draft" ? "pb-tier--draft" : `pb-tier--${collection.visibility}`} is-clickable`}
                  onClick={(e) => e.stopPropagation()}
                  title="Click to change status"
                  style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
                >
                  {collection.status === "draft" ? "Draft" : VISIBILITY_LABELS[collection.visibility]}
                  <ChevronDown size={11} style={{ opacity: 0.6 }} />
                </button>
              </Dropdown>
            ) : (
              collection.status === "draft" ? (
                <span className="pb-tier pb-tier--draft">Draft</span>
              ) : (
                <span className={`pb-tier pb-tier--${collection.visibility}`}>
                  {VISIBILITY_LABELS[collection.visibility]}
                </span>
              )
            )}
            {collection.locked && (
              <span className="pbc-tag is-locked">
                <Lock size={9} /> Premium
              </span>
            )}
          </span>
        </div>
        <span
          className="pbc-card__actions"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          style={{ display: "inline-flex", alignItems: "center", gap: 4, marginLeft: "auto" }}
        >
          {onEdit && (
            <Tooltip title="Edit collection">
              <button
                type="button"
                className="pb-iconbtn"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                aria-label="Edit collection"
              >
                <Pencil size={13} />
              </button>
            </Tooltip>
          )}
          <span className="pbc-card__go">
            <ArrowUpRight size={16} />
          </span>
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
    </div>
  );
}

export default function CollectionsPage() {
  useActivitySource({ section: "WORK", module: "QA", page: "Playbook Collections" });

  const router = useRouter();
  const { user } = useAuth();
  const { canReadPlaybook, canCreatePlaybook, canReadPlaybookTrash } = usePermission();

  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [pinning, setPinning] = useState(false);
  const [editingCollection, setEditingCollection] = useState<CollectionSummary | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  const hasNewCollectionFeature = Boolean(
    user?.subscriptionFeatures &&
    (user.subscriptionFeatures.includes("work_playbooks_collections_new_collections") ||
     user.subscriptionFeatures.includes("work_playbooks_qa_playbooks_new_collections"))
  );

  const hasTrashFeature = useSubscriptionFeature("work_playbooks_playbook_trash");

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
    enabled: canReadPlaybook,
    staleTime: 5 * 60 * 1000,
  });

  const canCurate = data?.canCurate ?? false;
  const queryClient = useQueryClient();

  const setStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      visibility,
    }: {
      id: string;
      status: PlaybookStatus;
      visibility?: PlaybookVisibility;
    }) => {
      const res = await axios.post(`/api/v2/qa/playbooks/collections/${id}/status`, {
        status,
        visibility,
      });
      return res.data;
    },
    onSuccess: (_, variables) => {
      message.success(
        variables.status === "draft"
          ? "Collection moved to Draft"
          : `Collection published as ${VISIBILITY_LABELS[variables.visibility || "workspace"]}`
      );
      queryClient.invalidateQueries({ queryKey: ["qa", "collections"] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.error || "Failed to update status");
    },
  });

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

  if (!canReadPlaybook) {
    return (
      <MainLayout>
        <NoData
          title="No access to collections"
          description="You need test playbook read access to open the playbook library."
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
              {canReadPlaybookTrash && (
                <Button
                  icon={<Trash2 size={14} />}
                  onClick={() => router.push("/playbooks/trash?tab=collections")}
                >
                  Trash
                </Button>
              )}
              <Button icon={<Sparkles size={14} />} onClick={() => setPinning(true)}>
                What do you build?
              </Button>
              {/* Anyone who can author a playbook can author a pack of their own.
                  What the write MEANS is decided on the server from who is
                  asking: a curator's is published to the platform, a team's is
                  their workspace's alone. */}
              {canCreatePlaybook && hasNewCollectionFeature && (
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
                          onEdit={
                            collection.isOwn
                              ? () => setEditingCollection(collection)
                              : undefined
                          }
                          canPublish={Boolean(collection.isOwn)}
                          onStatusChange={
                            collection.isOwn
                              ? (status, visibility) =>
                                  setStatusMutation.mutate({
                                    id: collection.id,
                                    status,
                                    visibility,
                                  })
                              : undefined
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
                          onEdit={
                            collection.isOwn
                              ? () => setEditingCollection(collection)
                              : undefined
                          }
                          canPublish={Boolean(collection.isOwn)}
                          onStatusChange={
                            collection.isOwn
                              ? (status, visibility) =>
                                  setStatusMutation.mutate({
                                    id: collection.id,
                                    status,
                                    visibility,
                                  })
                              : undefined
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
        collection={editingCollection}
        open={creating || editingCollection !== null}
        canCurate={Boolean(editingCollection?.isOwn ?? true)}
        existing={all}
        industries={data?.industries ?? []}
        onClose={() => {
          setCreating(false);
          setEditingCollection(null);
        }}
        onSaved={(slug) => {
          setEditingCollection(null);
          if (slug && creating) router.push(`/playbooks/collections/${slug}`);
        }}
      />
    </MainLayout>
  );
}
