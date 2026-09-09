"use client";

/**
 * QA Playbooks — the catalog.
 *
 * Three tiers share this one list, by design:
 *   public     free, from the maintained library
 *   premium    listed with a lock and a price — you cannot decide to buy what
 *              you cannot see, so it is never hidden
 *   workspace  this workspace's own playbooks, grouped first
 *
 * Deliberately not project-scoped: a playbook is a library entry, so making the
 * QA choose a project first would be a gate in front of a library.
 */

import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button, Dropdown, Input, Tooltip, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Copy,
  Download,
  FileUp,
  Inbox,
  Layers,
  ListOrdered,
  Lock,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";

import MainLayout from "@/components/layout/MainLayout";
import NoData from "@/components/common/NoData";
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { useActivitySource } from "@/hooks/useActivitySource";
import { useDebounce } from "@/hooks/useDebounce";
import { api as axios } from "@/lib/axios";
import { PlaybookCatalogCard } from "@/components/qa/PlaybookCards";
import RequestPlaybookDrawer from "@/components/qa/RequestPlaybookDrawer";
import ImportPlaybooksModal from "@/components/qa/ImportPlaybooksModal";
import CollectionFormModal from "@/components/qa/CollectionFormModal";
import NewPlaybookCollectionModal from "@/components/qa/NewPlaybookCollectionModal";
import { CollectionIcon } from "@/components/qa/CollectionIcon";
import { downloadTemplate, templatePrompt } from "@/components/qa/playbookTemplate";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import {
  PLAYBOOK_STYLES,
  VISIBILITY_LABELS,
  type CollectionSummary,
  type PlaybookStatus,
  type PlaybookVisibility,
  type PlaybookSummary,
} from "@/components/qa/playbookShared";

const OWN_GROUP = "My workspace";
const ALL_GROUP = "__all__";
/** Playbooks no collection has claimed. Only ever shown when there are some. */
const UNSORTED_GROUP = "__unsorted__";

/**
 * The two ways to cut the same library.
 *
 * COLLECTIONS is the default, and that is the whole point of migration 008: a
 * category answers "what part of an app is this about?", which only helps a QA
 * who already knows. A collection answers "which of these are mine?", which is
 * the question someone opening a library of hundreds actually has — and it is
 * many-to-many, so Login can be under Authentication AND School Management at
 * once. Categories stay because they are still how a playbook says what it is.
 */
type BrowseBy = "collections" | "categories";

type SortKey = "updated" | "name" | "size";

/* Recently updated leads: a playbook that moved is the one worth re-reading,
   and it is the only ordering that surfaces what changed since you last looked. */
const SORTS: { value: SortKey; label: string; description: string }[] = [
  { value: "updated", label: "Recently updated", description: "Newest changes first" },
  { value: "name", label: "Name (A–Z)", description: "Alphabetical" },
  { value: "size", label: "Most recommendations", description: "Biggest playbooks first" },
];

export default function PlaybooksPage() {
  useActivitySource({ section: "WORK", module: "QA", page: "Playbooks" });

  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const {
    canReadPlaybook,
    canCreatePlaybook,
    canUpdatePlaybook,
    canDeletePlaybook,
    canRequestPlaybook,
    canTemplatePlaybook,
    canUploadPlaybook,
    canManagePlaybook,
    canReadPlaybookTrash,
  } = usePermission();

  const [search, setSearch] = useState("");
  const [browseBy, setBrowseBy] = useState<BrowseBy>("collections");
  const [category, setCategory] = useState<string>(ALL_GROUP);

  const hasRequestPlaybookFeature = Boolean(
    user?.subscriptionFeatures &&
    (user.subscriptionFeatures.includes("work_playbooks_requested_playbooks_request_playbook") ||
     user.subscriptionFeatures.includes("work_playbooks_qa_playbooks_request_playbook"))
  );
  const hasRequestedFeature = Boolean(
    user?.subscriptionFeatures &&
    (user.subscriptionFeatures.includes("work_playbooks_requested_playbooks_requested") ||
     user.subscriptionFeatures.includes("work_playbooks_qa_playbooks_requested") ||
     user.subscriptionFeatures.includes("work_playbooks_requested_playbooks"))
  );

  const hasTemplateFeature = Boolean(
    user?.subscriptionFeatures &&
    user.subscriptionFeatures.includes("work_playbooks_qa_playbooks_template")
  );
  const hasUploadFeature = Boolean(
    user?.subscriptionFeatures &&
    user.subscriptionFeatures.includes("work_playbooks_qa_playbooks_upload")
  );
  const hasAccessFeature = Boolean(
    user?.subscriptionFeatures &&
    user.subscriptionFeatures.includes("work_playbooks_qa_playbooks_access")
  );
  const hasNewCollectionFeature = Boolean(
    user?.subscriptionFeatures &&
    (user.subscriptionFeatures.includes("work_playbooks_collections_new_collections") ||
     user.subscriptionFeatures.includes("work_playbooks_qa_playbooks_new_collections"))
  );
  const hasNewPlaybookFeature = Boolean(
    user?.subscriptionFeatures &&
    user.subscriptionFeatures.includes("work_playbooks_qa_playbooks_new_playbook")
  );
  /**
   * The second step INSIDE a collection.
   *
   * A collection is a bundle for an audience, and the audience does not think
   * in playbook names — "School & College Management" holds Login, Logout,
   * Registration and Forgot Password, which is four cards that all turn out to
   * be one subject. Showing its categories first says what the pack is made of
   * in one line each, and the playbooks are one click away.
   *
   * null = standing at the collection, looking at its categories.
   */
  const [drillCategory, setDrillCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("updated");
  const [requestOpen, setRequestOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [fileIntoOpen, setFileIntoOpen] = useState(false);

  /* The vocabularies the prompt quotes. Fetched from the same endpoint the
     author form uses, so a category added to the API turns up in the prompt
     without anyone remembering to edit it. */
  const { data: meta } = useQuery<{
    levels: { value: string; label: string }[];
    categories: { value: string; label: string }[];
    risks: string[];
  }>({
    queryKey: ["qa", "playbooks", "meta"],
    queryFn: () => axios.get("/api/v2/qa/playbooks/meta"),
    enabled: canReadPlaybook,
    staleTime: 60 * 60 * 1000,
  });

  const copyPrompt = async () => {
    const prompt = templatePrompt(
      {
        levels: meta?.levels ?? [],
        categories: meta?.categories ?? [],
        risks: meta?.risks ?? [],
      },
      activeGroupLabelForPrompt()
    );
    try {
      await navigator.clipboard.writeText(prompt);
      message.success("Prompt copied — paste it into any AI platform");
    } catch {
      message.error("Could not reach the clipboard. Download the template instead.");
    }
  };
  const debouncedSearch = useDebounce(search, 300);

  /* Stepping into a different collection, or switching how the library is cut,
     puts you back at the top of that collection rather than inside a category
     that may not exist there. */
  useEffect(() => {
    setDrillCategory(null);
  }, [category, browseBy]);

  const { data, isLoading } = useQuery<{
    playbooks: PlaybookSummary[];
    categories: string[];
    canPublish: boolean;
  }>({
    queryKey: ["qa", "playbooks", debouncedSearch],
    queryFn: () => {
      /* `all=true` asks for unpublished library rows as well. The API grants it
         only to a super_admin and ignores it for everyone else, and the detail
         endpoint already reads that way — without it a super_admin creates a
         library playbook (tenant_id NULL, status 'draft') and the catalog that
         only lists published library rows never shows it back to them. */
      const params = new URLSearchParams({ all: "true" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      return axios.get(`/api/v2/qa/playbooks?${params.toString()}`);
    },
    enabled: canReadPlaybook,
    staleTime: 5 * 60 * 1000,
  });

  /* The shelf, for the strip above the rail. Deliberately a separate query from
     the catalog: it is small, it changes far less often, and a curator saving a
     collection must not invalidate every card on this page.

     `all=true` so the create form gets the WHOLE picture — every name already
     taken, and every industry already in use, drafts included. The API ignores
     it for anyone who is not a super_admin. The strip below filters drafts back
     out on its own, so what this asks for and what that row shows stay
     separate questions. */
  const { data: collectionData } = useQuery<{
    collections: CollectionSummary[];
    industries: string[];
  }>({
    queryKey: ["qa", "collections", "strip"],
    queryFn: () => axios.get("/api/v2/qa/playbooks/collections?all=true"),
    enabled: canReadPlaybook,
    staleTime: 10 * 60 * 1000,
  });

  /* Published, and with something in them. A draft is a curator's work in
     progress and an empty pack is a click that leads nowhere — this row is a
     shortcut, not an inventory. */
  const strip = useMemo(
    () =>
      (collectionData?.collections ?? [])
        .filter((c) => c.status === "published" && c.playbookCount > 0)
        .slice(0, 8),
    [collectionData]
  );

  const canPublish = data?.canPublish ?? false;

  const canShowManage =
    (hasTemplateFeature && canTemplatePlaybook) ||
    (hasUploadFeature && canUploadPlaybook) ||
    (hasAccessFeature && (canPublish || canManagePlaybook)) ||
    (hasNewCollectionFeature && canCreatePlaybook) ||
    (hasNewPlaybookFeature && canCreatePlaybook);

  /**
   * The rail on the left is the parent list: the two cross-cutting groups a QA
   * navigates by, then either the collections or the categories beneath them.
   * Selecting one shows its playbooks on the right.
   *
   * BUILT FROM THE SEARCH RESULT, not from the collections endpoint — the same
   * rule the category rail already followed. A collection the search empties
   * drops out of the rail rather than sitting there offering nothing, and an
   * empty collection never appears at all, so a count on the rail and the cards
   * beside it cannot disagree.
   *
   * A playbook in several collections appears under EACH of them. That is not a
   * duplicate to be cleaned up — it is the many-to-many the whole feature
   * exists for.
   */
  const groups = useMemo(() => {
    const playbooks = data?.playbooks ?? [];
    const own = playbooks.filter((p) => p.isOwn);

    const rail: {
      key: string;
      label: string;
      kind: "lead" | "category" | "collection";
      items: PlaybookSummary[];
      /** Collection groups only — lets the pane link to the reading list. */
      slug?: string;
    }[] = [{ key: ALL_GROUP, label: "All playbooks", kind: "lead", items: playbooks }];

    /* Your own playbooks are the ones you came to edit, so they get their own
       entry — they still appear under their collection or category as well. */
    if (own.length > 0)
      rail.push({ key: OWN_GROUP, label: OWN_GROUP, kind: "lead", items: own });

    if (browseBy === "categories") {
      const byCategory = new Map<string, PlaybookSummary[]>();
      for (const playbook of playbooks) {
        const list = byCategory.get(playbook.category) ?? [];
        list.push(playbook);
        byCategory.set(playbook.category, list);
      }
      for (const [name, items] of [...byCategory.entries()].sort(([a], [b]) =>
        a.localeCompare(b)
      )) {
        rail.push({ key: name, label: name, kind: "category", items });
      }
      return rail;
    }

    const byCollection = new Map<string, { label: string; items: PlaybookSummary[] }>();
    const unsorted: PlaybookSummary[] = [];
    for (const playbook of playbooks) {
      const memberships = playbook.collections ?? [];
      if (memberships.length === 0) {
        unsorted.push(playbook);
        continue;
      }
      for (const membership of memberships) {
        const entry = byCollection.get(membership.slug) ?? {
          label: membership.name,
          items: [],
        };
        entry.items.push(playbook);
        byCollection.set(membership.slug, entry);
      }
    }

    /* A collection nothing points at yet.
       
       The rail is built from playbooks, so a pack with no members cannot appear
       in it — which is right for a reader (an empty shelf entry is a click that
       leads nowhere) and wrong for whoever just created one and is looking for
       it. So empty packs are added back for the people who can fill them: a
       curator for the library, a workspace for its own. They show a count of 0
       and open on the "map playbooks into this" step. */
    for (const collection of collectionData?.collections ?? []) {
      if (byCollection.has(collection.slug)) continue;
      if (!canPublish && !collection.isOwn) continue;
      byCollection.set(collection.slug, { label: collection.name, items: [] });
    }

    /* Shelf order, which already puts what this workspace said it builds first.
       A collection the strip query has not heard of sorts last rather than
       jumping the queue. */
    const shelfOrder = new Map(
      (collectionData?.collections ?? []).map((c, index) => [c.slug, index] as const)
    );
    /* Populated packs first, empty ones after them — both in shelf order.
       A curator sees every pack including the ones they have not filled yet,
       and without this an empty shelf entry sitting at position 0 pushes the
       collections people actually browse below the fold. */
    const ordered = [...byCollection.entries()].sort(([a, ea], [b, eb]) => {
      const emptyA = ea.items.length === 0 ? 1 : 0;
      const emptyB = eb.items.length === 0 ? 1 : 0;
      if (emptyA !== emptyB) return emptyA - emptyB;
      const pa = shelfOrder.get(a) ?? Number.MAX_SAFE_INTEGER;
      const pb = shelfOrder.get(b) ?? Number.MAX_SAFE_INTEGER;
      return pa - pb || a.localeCompare(b);
    });
    for (const [slug, entry] of ordered) {
      rail.push({
        key: `collection:${slug}`,
        label: entry.label,
        kind: "collection",
        items: entry.items,
        slug,
      });
    }

    /* Only when there are some. An always-present "Not in a collection" reads
       as a backlog even when it is empty. */
    if (unsorted.length > 0) {
      rail.push({
        key: UNSORTED_GROUP,
        label: "Not in a collection",
        kind: "collection",
        items: unsorted,
      });
    }

    return rail;
  }, [data, collectionData, browseBy, canPublish]);

  /* The prompt names what to write about. Standing in a category, that is the
     category — it is the most likely answer and saves an edit. */
  function activeGroupLabelForPrompt() {
    if (activeGroup.kind === "category") {
      return `the ${activeGroup.label} area — features a QA on this team tests`;
    }
    if (activeGroup.kind === "collection" && activeGroup.key !== UNSORTED_GROUP) {
      return `the ${activeGroup.label} collection — features a product in that area ships`;
    }
    return "the features your product ships";
  }

  const totals = useMemo(() => {
    const playbooks = data?.playbooks ?? [];
    return {
      playbooks: playbooks.length,
      items: playbooks.reduce((sum, p) => sum + (p.itemCount ?? 0), 0),
    };
  }, [data]);

  /* A category can disappear under you — deleting the last playbook in it, or a
     search that empties it — so the rail selection falls back rather than
     leaving the pane blank with a heading for a group that is gone. */
  const activeGroup =
    groups.find((g) => g.key === category) ??
    groups[0] ?? { key: ALL_GROUP, label: "All playbooks", kind: "lead" as const, items: [] };

  /**
   * The subjects inside the collection you are standing in.
   *
   * Derived from the SAME items the rail counted, so the tiles here and the
   * count on the rail cannot disagree — the rule every other grouping on this
   * page follows.
   */
  const collectionCategories = useMemo(() => {
    if (browseBy !== "collections" || activeGroup.kind !== "collection") return [];
    const byCategory = new Map<string, PlaybookSummary[]>();
    for (const playbook of activeGroup.items) {
      const list = byCategory.get(playbook.category) ?? [];
      list.push(playbook);
      byCategory.set(playbook.category, list);
    }
    return [...byCategory.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, items]) => ({ name, items }));
  }, [activeGroup, browseBy]);

  /* Standing at a collection with nothing picked yet: the pane shows what the
     pack is made of rather than every card in it at once. */
  const showCategoryStep =
    browseBy === "collections" && activeGroup.kind === "collection" && !drillCategory;

  const visible = useMemo(() => {
    const items = activeGroup.items.filter(
      (p) => !drillCategory || p.category === drillCategory
    );
    if (sort === "name") return items.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "size") return items.sort((a, b) => (b.itemCount ?? 0) - (a.itemCount ?? 0));
    return items.sort(
      (a, b) =>
        new Date(b.lastUpdatedAt ?? 0).getTime() - new Date(a.lastUpdatedAt ?? 0).getTime()
    );
  }, [activeGroup, sort, drillCategory]);

  /**
   * Open the author, having settled which collection the playbook goes in.
   *
   * Standing inside a collection already answers the question, so it is not
   * asked again — you told the rail a moment ago. Anywhere else (All playbooks,
   * a category, the manage row) it is asked once, up front, because a playbook
   * nobody files never reaches the shelf a customer browses.
   */
  const startNewPlaybook = () => {
    const activeCollection =
      browseBy === "collections" && activeGroup.kind === "collection" && activeGroup.slug
        ? (collectionData?.collections ?? []).find((c) => c.slug === activeGroup.slug)
        : undefined;

    if (activeCollection) {
      openAuthor(activeCollection.id);
      return;
    }
    setFileIntoOpen(true);
  };

  const openAuthor = (collectionId: string | null) => {
    const params = new URLSearchParams();
    /* Whatever subject you are standing in comes with you, whether you reached
       it through the category rail or by drilling into a collection. */
    const carriedCategory =
      drillCategory || (activeGroup.kind === "category" ? activeGroup.label : "");
    if (carriedCategory) params.set("category", carriedCategory);
    if (collectionId) params.set("collection", collectionId);
    const query = params.toString();
    router.push(`/playbooks/create${query ? `?${query}` : ""}`);
  };

  /* Only the creator of the playbook can edit, delete, or change status. */
  const canManage = (playbook: PlaybookSummary) =>
    (canUpdatePlaybook || canCreatePlaybook) &&
    hasNewPlaybookFeature &&
    Boolean(playbook.isOwn);

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
      const res = await axios.post(`/api/v2/qa/playbooks/${id}/status`, {
        status,
        visibility,
      });
      return res.data;
    },
    onSuccess: (_, variables) => {
      message.success(
        variables.status === "draft"
          ? "Playbook moved to Draft"
          : `Playbook published as ${VISIBILITY_LABELS[variables.visibility || "workspace"]}`
      );
      queryClient.invalidateQueries({ queryKey: ["qa", "playbooks"] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.error || "Failed to update status");
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/v2/qa/playbooks/${id}`),
    onSuccess: () => {
      message.success("Playbook moved to Trash");
      queryClient.invalidateQueries({ queryKey: ["qa", "playbooks"] });
    },
    onError: (err: any) => {
      message.error(
        err?.response?.data?.error || err?.message || "Could not delete the playbook"
      );
    },
  });

  if (!canReadPlaybook) {
    return (
      <MainLayout>
        <NoData
          title="No access to QA Playbooks"
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
              <BookOpen size={18} />
            </span>
            <div className="pb-hero__text">
              <h1 className="pb-hero__title">QA Playbooks</h1>
              {/* One line, and it has to survive being ellipsised on a narrow
                  screen — so the two things that matter lead it. */}
              <p className="pb-hero__sub">
                Know what to test — basic checks through to security and failure cases,
                turned into real test cases.
              </p>
            </div>
            {/* What the library actually holds, in the same stat chips the
                reader uses — the header says what you can do, this says what is
                there. */}
            <div className="pb-hero__stats">
              <div className="pb-hero__stat">
                <BookOpen size={14} />
                <b>{totals.playbooks}</b>
                <span>{totals.playbooks === 1 ? "playbook" : "playbooks"}</span>
              </div>
              <div className="pb-hero__stat">
                <Layers size={14} />
                <b>{totals.items}</b>
                <span>recommendations</span>
              </div>
            </div>
          </div>

          {/* The toolbar sits under the hero, not above it: the band says what
              this page is, and everything below it acts on that. */}
          <div className="pb-toolbar">
            {/* Collections first, and default: "which of these are mine?" is the
                question someone opening the library actually has. Categories
                stay one click away for a QA who already knows the area. */}
            <div className="pb-pills">
              {(
                [
                  ["collections", "Collections"],
                  ["categories", "Categories"],
                ] as [BrowseBy, string][]
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`pb-pill ${browseBy === value ? "is-on" : ""}`}
                  onClick={() => {
                    setBrowseBy(value);
                    // The other mode's keys do not exist here, and landing on
                    // "All playbooks" is a better answer than a silent fallback.
                    setCategory(ALL_GROUP);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <Input
              allowClear
              prefix={<Search size={14} style={{ color: "#94a3b8" }} />}
              placeholder="Search playbooks"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pb-search is-wide"
            />

            <div className="pb-toolbar__sort">
              {/* No triggerLabel: that is what puts the dropdown in its compact
                  30px form, level with the search box beside it. */}
              <SearchableDropdown
                value={sort}
                onChange={(value: string) => setSort((value as SortKey) || "updated")}
                options={SORTS}
                placeholder="Recently updated"
                allowClear={false}
                hideAvatar
                width={240}
              />
            </div>

            {((hasRequestPlaybookFeature && canRequestPlaybook) ||
              (hasRequestedFeature && canReadPlaybook) ||
              canReadPlaybookTrash) && (
              <div className="pb-toolbar__actions">
                {hasRequestPlaybookFeature && canRequestPlaybook && (
                  <Tooltip title="Nothing in the library for the feature you are testing? Ask for it.">
                    <Button
                      className="pb-btn"
                      icon={<Sparkles size={14} />}
                      onClick={() => setRequestOpen(true)}
                    >
                      Request playbook
                    </Button>
                  </Tooltip>
                )}

                {hasRequestedFeature && canReadPlaybook && (
                  <Button
                    className="pb-btn"
                    icon={<Inbox size={14} />}
                    onClick={() => router.push("/playbooks/requested")}
                  >
                    Requested
                  </Button>
                )}

                {canReadPlaybookTrash && (
                  <Tooltip title="View and restore deleted playbooks, collections, and categories">
                    <Button
                      className="pb-btn"
                      icon={<Trash2 size={14} />}
                      onClick={() => router.push("/playbooks/trash")}
                    >
                      Trash
                    </Button>
                  </Tooltip>
                )}
              </div>
            )}
          </div>

          {/* ── Layer three: acting ON the library, rather than reading it ──
              Split off deliberately. Everything above is what a QA opening the
              page does — browse, search, ask for something that is missing.
              Everything here writes: authoring, importing, and granting access.
              Mixing them put six buttons of unequal weight in one row and made
              the two most-used ones the hardest to find.

              The row renders only when this person has at least one of these,
              so a reader gets two layers rather than an empty band. Each button
              keeps the permission it already had — the row is a grouping, not a
              new gate. */}
          {canShowManage && (
            <div className="pb-toolbar is-manage">
              <span className="pb-toolbar__eyebrow">Manage</span>
              {/* Writing a playbook in the app costs tokens per recommendation.
                  The template lets a QA do the writing on an AI platform they
                  already pay for, and bring the result back through Import. */}
              {hasTemplateFeature && canTemplatePlaybook && (
                <Dropdown
                  trigger={["click"]}
                  menu={{
                    items: [
                      {
                        key: "prompt",
                        icon: <Copy size={14} />,
                        label: "Copy the AI prompt",
                        onClick: copyPrompt,
                      },
                      {
                        key: "file",
                        icon: <Download size={14} />,
                        label: "Download template (.json)",
                        onClick: () => {
                          downloadTemplate();
                          message.success("Template downloaded");
                        },
                      },
                    ],
                  }}
                >
                  <Button className="pb-btn" icon={<Download size={14} />}>
                    Template
                  </Button>
                </Dropdown>
              )}

              {hasUploadFeature && canUploadPlaybook && (
                <Tooltip title="Paste back what an AI platform wrote from the template">
                  <Button
                    className="pb-btn"
                    icon={<FileUp size={14} />}
                    onClick={() => setImportOpen(true)}
                  >
                    Upload
                  </Button>
                </Tooltip>
              )}

              {/* The premium ACCESS queue is a different job, and Testiez's
                  alone — it only appears for them. */}
              {hasAccessFeature && (canPublish || canManagePlaybook) && (
                <Tooltip title="Workspaces asking for access to premium playbooks">
                  <Button
                    className="pb-btn"
                    icon={<Lock size={14} />}
                    onClick={() => router.push("/playbooks/requests")}
                  >
                    Access
                  </Button>
                </Tooltip>
              )}

              {/* A collection is authored here too, not only on the shelf.
                  This is the page people stand on, and "New playbook" without a
                  "New collection" beside it reads as though packs are something
                  only the seed data can have. Saving lands on the new
                  collection so the next step — mapping playbooks into it, in
                  order — is where you already are. */}
              {hasNewCollectionFeature && canCreatePlaybook && (
                <Tooltip title="Bundle playbooks for an audience — an industry, a standard, a release">
                  <Button
                    className="pb-btn pb-toolbar__primary"
                    icon={<Layers size={14} />}
                    onClick={() => setCollectionOpen(true)}
                  >
                    New collection
                  </Button>
                </Tooltip>
              )}

              {hasNewPlaybookFeature && canCreatePlaybook && (
                <Button
                  type="primary"
                  className="pb-btn"
                  icon={<PlusOutlined />}
                  onClick={startNewPlaybook}
                >
                  New playbook
                </Button>
              )}
            </div>
          )}

          {/* Only in the categories view. When the rail is already collections
              this row says the same thing twice. */}
          {browseBy === "categories" && strip.length > 0 && (
            <div className="pbc-strip">
              <span className="pbc-strip__label">Collections</span>
              {strip.map((collection) => (
                <button
                  key={collection.id}
                  type="button"
                  className="pbc-strip__item"
                  onClick={() => router.push(`/playbooks/collections/${collection.slug}`)}
                >
                  <CollectionIcon name={collection.icon} size={13} />
                  {collection.name}
                  <b>{collection.playbookCount}</b>
                </button>
              ))}
              <button
                type="button"
                className="pbc-strip__more"
                onClick={() => router.push("/playbooks/collections")}
              >
                All collections
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="dh-main-scroll">
              <ZukvoLoadingOverlay loading minHeight={320}>
                <div />
              </ZukvoLoadingOverlay>
            </div>
          ) : (data?.playbooks ?? []).length === 0 ? (
            <div className="dh-main-scroll">
              <NoData
                title="No playbooks found"
                description={
                  search
                    ? "Nothing matches that search. Try a broader term."
                    : "No playbooks are available for this workspace yet."
                }
              />
            </div>
          ) : (
            <div className="pb-reader">
              <nav
                className="pb-nav"
                aria-label={browseBy === "collections" ? "Collections" : "Playbook categories"}
              >
                {groups
                  .filter((g) => g.kind === "lead")
                  .map((group) => (
                    <button
                      key={group.key}
                      type="button"
                      className={`pb-nav__link ${group.key === activeGroup.key ? "is-on" : ""}`}
                      onClick={() => setCategory(group.key)}
                    >
                      <span className="pb-nav__label">{group.label}</span>
                      <span className="pb-nav__count">{group.items.length}</span>
                    </button>
                  ))}

                {/* The children hang off the heading on the same tree line the
                    reader uses for sub-sections, so the parent/child reading is
                    the same on both pages. */}
                <div className="pb-nav__sep">
                  {browseBy === "collections" ? "Collections" : "Categories"}
                </div>
                <div className="pb-nav__children">
                  {groups
                    .filter((g) => g.kind !== "lead")
                    .map((group) => (
                      <button
                        key={group.key}
                        type="button"
                        className={`pb-nav__link is-sub ${
                          group.key === activeGroup.key ? "is-on" : ""
                        }`}
                        onClick={() => setCategory(group.key)}
                      >
                        <span className="pb-nav__label">{group.label}</span>
                        <span className="pb-nav__count">{group.items.length}</span>
                      </button>
                    ))}
                </div>
              </nav>

              <div className="pb-body">
                <div className="pb-group__head">
                  {/* Drilled into a category, the heading becomes the trail that
                      got you here — the collection is a click back, not a
                      browser-history guess. */}
                  {drillCategory ? (
                    <>
                      <button
                        type="button"
                        className="pb-group__crumb"
                        onClick={() => setDrillCategory(null)}
                      >
                        <ArrowLeft size={13} />
                        {activeGroup.label}
                      </button>
                      <span className="pb-group__sep">/</span>
                      <h2 className="pb-group__title">{drillCategory}</h2>
                    </>
                  ) : (
                    <h2 className="pb-group__title">{activeGroup.label}</h2>
                  )}
                  <span className="pb-group__count">
                    {showCategoryStep ? collectionCategories.length : visible.length}
                  </span>

                  {/* Both actions in one cluster at the right end. They used to
                      each carry `margin-left: auto`, which pushed them apart and
                      left the first one stranded mid-header. */}
                  <div className="pb-group__actions">
                    {/* The rail shows a collection's playbooks; the collection's
                        own page shows them IN ORDER, with the curator's note on
                        each. That ordering is most of what a pack is worth, so
                        there is a way through to it from here. */}
                    {activeGroup.kind === "collection" && activeGroup.slug && (
                      <Button
                        className="pb-btn is-sm"
                        icon={<ListOrdered size={13} />}
                        onClick={() =>
                          router.push(`/playbooks/collections/${activeGroup.slug}`)
                        }
                      >
                        Reading order
                      </Button>
                    )}

                    {/* The same action as the tile at the end of the grid, kept
                        at the top for a group long enough that the tile is a
                        scroll away. Shown in collections/categories, hidden in All Playbooks */}
                    {activeGroup.key !== ALL_GROUP && (
                      hasNewPlaybookFeature && canCreatePlaybook ? (
                        <Button
                          className="pb-btn is-sm"
                          icon={<Plus size={13} />}
                          onClick={startNewPlaybook}
                        >
                          {drillCategory
                            ? `New in ${drillCategory}`
                            : activeGroup.kind === "category"
                            ? `New in ${activeGroup.label}`
                            : "New playbook"}
                        </Button>
                      ) : hasRequestPlaybookFeature && canRequestPlaybook ? (
                        <Button
                          className="pb-btn is-sm"
                          icon={<Sparkles size={13} />}
                          onClick={() => setRequestOpen(true)}
                        >
                          Request a playbook
                        </Button>
                      ) : null
                    )}
                  </div>
                </div>

                {/* Step one inside a collection: what the pack is made of.
                    Each tile is a subject, not a playbook — clicking opens its
                    playbooks with the collection still in the trail above. */}
                {showCategoryStep ? (
                  collectionCategories.length === 0 ? (
                    <NoData
                      title="Nothing in this collection yet"
                      description={
                        search
                          ? "Nothing here matches that search. Try a broader term."
                          : "No playbooks have been mapped into this collection."
                      }
                    />
                  ) : (
                    <div className="pb-catgrid">
                      {collectionCategories.map((entry) => (
                        <button
                          key={entry.name}
                          type="button"
                          className="pb-catcard"
                          onClick={() => setDrillCategory(entry.name)}
                        >
                          <span className="pb-catcard__av">
                            <Layers size={16} />
                          </span>
                          <span className="pb-catcard__body">
                            <span className="pb-catcard__name">{entry.name}</span>
                            <span className="pb-catcard__meta">
                              {entry.items.length} playbook
                              {entry.items.length === 1 ? "" : "s"} ·{" "}
                              {entry.items.reduce((sum, p) => sum + (p.itemCount ?? 0), 0)}{" "}
                              recommendations
                            </span>
                          </span>
                          <span className="pb-catcard__go">
                            <ArrowUpRight size={16} />
                          </span>
                        </button>
                      ))}
                    </div>
                  )
                ) : visible.length === 0 ? (
                  <NoData
                    title="Nothing in this group"
                    description={
                      search
                        ? `Nothing here matches that search. Try a broader term or another ${
                            browseBy === "collections" ? "collection" : "category"
                          }.`
                        : `This ${
                            browseBy === "collections" ? "collection" : "category"
                          } has no playbooks yet.`
                    }
                  />
                ) : (
                  <div className="pb-grid">
                    {/* The tile that adds to what you are looking at. In a
                        category it carries that category with it, so the author
                        form opens already filed in the right place. */}
                    {visible.map((playbook) => (
                      <PlaybookCatalogCard
                        key={playbook.id}
                        playbook={playbook}
                        onOpen={() => router.push(`/playbooks/${playbook.slug}`)}
                        onEdit={
                          canManage(playbook)
                            ? () =>
                                router.push(
                                  `/playbooks/${playbook.slug}/edit`
                                )
                          : undefined
                        }
                        /* mutateAsync, so the confirmation card keeps spinning
                           until the row is actually gone. */
                        onDelete={
                          canManage(playbook)
                            ? () => remove.mutateAsync(playbook.id).catch(() => {})
                            : undefined
                        }
                        onStatusChange={
                          canManage(playbook)
                            ? (status, visibility) =>
                                setStatusMutation.mutate({
                                  id: playbook.id,
                                  status,
                                  visibility,
                                })
                            : undefined
                        }
                        canPublish={canPublish}
                        deleting={remove.isPending && remove.variables === playbook.id}
                      />
                    ))}

                    {activeGroup.key !== ALL_GROUP && (
                      hasNewPlaybookFeature && canCreatePlaybook ? (
                        /* Same route as the header button, so the tile cannot
                           quietly skip the "which collection?" step. */
                        <button
                          type="button"
                          className="pb-card pb-card--add"
                          onClick={startNewPlaybook}
                        >
                          <span className="pb-card--add__badge">
                            <Plus size={18} />
                          </span>
                          <span className="pb-card--add__title">New playbook</span>
                          <span className="pb-card--add__sub">
                            {activeGroup.kind === "category"
                              ? `Write one for ${activeGroup.label}`
                              : "Write one for a feature your team tests"}
                          </span>
                        </button>
                      ) : hasRequestPlaybookFeature && canRequestPlaybook ? (
                        /* No authoring rights: the same gap, asked for instead of
                           written. */
                        <button
                          type="button"
                          className="pb-card pb-card--add"
                          onClick={() => setRequestOpen(true)}
                        >
                          <span className="pb-card--add__badge">
                            <Sparkles size={17} />
                          </span>
                          <span className="pb-card--add__title">Request a playbook</span>
                          <span className="pb-card--add__sub">
                            {activeGroup.kind === "category"
                              ? `Ask Testiez to cover more of ${activeGroup.label}`
                              : "Ask Testiez to cover what you are testing"}
                          </span>
                        </button>
                      ) : null
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      <NewPlaybookCollectionModal
        open={fileIntoOpen}
        collections={collectionData?.collections ?? []}
        industries={collectionData?.industries ?? []}
        canPublish={canPublish}
        onClose={() => setFileIntoOpen(false)}
        onContinue={openAuthor}
      />

      <CollectionFormModal
        open={collectionOpen}
        canCurate={canPublish}
        existing={collectionData?.collections ?? []}
        industries={collectionData?.industries ?? []}
        onClose={() => setCollectionOpen(false)}
        onSaved={(slug) => slug && router.push(`/playbooks/collections/${slug}`)}
      />

      <ImportPlaybooksModal open={importOpen} onClose={() => setImportOpen(false)} />

      <RequestPlaybookDrawer
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        category={activeGroup.kind === "category" ? activeGroup.label : undefined}
      />
    </MainLayout>
  );
}
