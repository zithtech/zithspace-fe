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

import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button, Dropdown, Input, Tooltip, message, Modal } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import {
  BookOpen,
  Copy,
  Download,
  FileUp,
  Inbox,
  Layers,
  Lock,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";

import MainLayout from "@/components/layout/MainLayout";
import NoData from "@/components/common/NoData";
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";
import { usePermission } from "@/hooks/usePermission";
import { useActivitySource } from "@/hooks/useActivitySource";
import { useDebounce } from "@/hooks/useDebounce";
import { api as axios } from "@/lib/axios";
import { PlaybookCatalogCard } from "@/components/qa/PlaybookCards";
import RequestPlaybookDrawer from "@/components/qa/RequestPlaybookDrawer";
import ImportPlaybooksModal from "@/components/qa/ImportPlaybooksModal";
import PlaybookTrashDrawer from "@/components/qa/PlaybookTrashDrawer";
import { downloadTemplate, templatePrompt } from "@/components/qa/playbookTemplate";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import { PLAYBOOK_STYLES, type PlaybookSummary } from "@/components/qa/playbookShared";

const OWN_GROUP = "My workspace";
const ALL_GROUP = "__all__";

type SortKey = "updated" | "name" | "size";

/* Recently updated leads: a playbook that moved is the one worth re-reading,
   and it is the only ordering that surfaces what changed since you last looked. */
const SORTS: { value: SortKey; label: string; description: string }[] = [
  { value: "updated", label: "Recently updated", description: "Newest changes first" },
  { value: "name", label: "Name (A–Z)", description: "Alphabetical" },
  { value: "size", label: "Most recommendations", description: "Biggest playbooks first" },
];

function PlaybookCategoryNavItem({
  group,
  isActive,
  canEdit,
  onSelect,
  onRename,
  onDelete,
}: {
  group: { key: string; label: string; items: PlaybookSummary[] };
  isActive: boolean;
  canEdit: boolean;
  onSelect: () => void;
  onRename: (from: string, to: string) => void;
  onDelete?: (category: string, count: number) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(group.label);

  // Sync if label changes externally
  React.useEffect(() => {
    if (!isEditing) {
      setEditTitle(group.label);
    }
  }, [group.label, isEditing]);

  const handleRename = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== group.label) {
      onRename(group.label, trimmed);
    } else {
      setEditTitle(group.label);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleRename();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setEditTitle(group.label);
      setIsEditing(false);
    }
  };

  return (
    <div
      className={`pb-nav__link is-sub ${isActive ? "is-on" : ""}`}
      onClick={onSelect}
      onDoubleClick={(e) => {
        if (!canEdit) return;
        e.stopPropagation();
        setEditTitle(group.label);
        setIsEditing(true);
      }}
      title={canEdit && !isEditing ? "Double click to rename" : undefined}
    >
      {isEditing ? (
        <Input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleRename}
          onKeyDown={handleKeyDown}
          autoFocus
          size="small"
          className="pb-nav__input"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <>
          <span className="pb-nav__label truncate flex-1 min-w-0">{group.label}</span>
          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            <span className="pb-nav__count" style={{ marginLeft: 0 }}>{group.items.length}</span>
            {canEdit && onDelete && (
              <Tooltip title="Move category to trash">
                <button
                  type="button"
                  className="pb-nav__trash-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(group.label, group.items.length);
                  }}
                  aria-label="Move category to trash"
                >
                  <Trash2 size={12} />
                </button>
              </Tooltip>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function PlaybooksPage() {
  useActivitySource({ section: "WORK", module: "QA", page: "Playbooks" });

  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    canReadPlaybook,
    canCreatePlaybook,
    canUpdatePlaybook,
    canDeletePlaybook,
    canTemplatePlaybook,
    canUploadPlaybook,
    canRequestPlaybook,
    canRequestedPlaybook,
    canAccessPlaybookRequests,
    canAccessPlaybookTemplate,
    canAccessPlaybookUpload,
    canAccessPlaybookRequest,
    canAccessPlaybookRequested,
    canAccessPlaybookAccess,
    canAccessPlaybookCreate,
  } = usePermission();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>(ALL_GROUP);
  const [sort, setSort] = useState<SortKey>("updated");
  const [requestOpen, setRequestOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [trashOpen, setTrashOpen] = useState(false);

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

  const canPublish = data?.canPublish ?? false;

  /**
   * The rail on the left is the parent list: every category, plus the two
   * cross-cutting groups a QA actually navigates by. Selecting one shows its
   * playbooks on the right — the old stacked groups meant scrolling past
   * Authentication to reach anything else.
   *
   * The rail is built from whatever the search returned, so its counts and the
   * cards on the right always agree; a category the search empties drops out of
   * the rail rather than sitting there offering nothing.
   */
  const groups = useMemo(() => {
    const playbooks = data?.playbooks ?? [];
    const byCategory = new Map<string, PlaybookSummary[]>();
    const own: PlaybookSummary[] = [];

    for (const playbook of playbooks) {
      if (playbook.isOwn) own.push(playbook);
      const list = byCategory.get(playbook.category) ?? [];
      list.push(playbook);
      byCategory.set(playbook.category, list);
    }

    const rail: {
      key: string;
      label: string;
      kind: "lead" | "category";
      items: PlaybookSummary[];
    }[] = [{ key: ALL_GROUP, label: "All playbooks", kind: "lead", items: playbooks }];
    /* Your own playbooks are the ones you came to edit, so they get their own
       entry — they still appear under their category as well. */
    if (own.length > 0)
      rail.push({ key: OWN_GROUP, label: OWN_GROUP, kind: "lead", items: own });
    for (const [name, items] of [...byCategory.entries()].sort(([a], [b]) =>
      a.localeCompare(b)
    )) {
      rail.push({ key: name, label: name, kind: "category", items });
    }
    return rail;
  }, [data]);

  /* The prompt names what to write about. Standing in a category, that is the
     category — it is the most likely answer and saves an edit. */
  function activeGroupLabelForPrompt() {
    return category !== ALL_GROUP && category !== OWN_GROUP
      ? `the ${category} area — features a QA on this team tests`
      : "the features your product ships";
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

  const visible = useMemo(() => {
    const items = [...activeGroup.items];
    if (sort === "name") return items.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "size") return items.sort((a, b) => (b.itemCount ?? 0) - (a.itemCount ?? 0));
    return items.sort(
      (a, b) =>
        new Date(b.lastUpdatedAt ?? 0).getTime() - new Date(a.lastUpdatedAt ?? 0).getTime()
    );
  }, [activeGroup, sort]);

  /* Only what the API would accept: your workspace's own playbooks, and for a
     super_admin the maintained library as well. Mirrors assertCanEdit on the
     server, so no card offers an action that would come back 403. */
  const canManage = (playbook: PlaybookSummary) =>
    (canUpdatePlaybook || canCreatePlaybook) && (playbook.isOwn || canPublish);

  const canManageCategory = (group: { items: PlaybookSummary[] }) =>
    (canUpdatePlaybook || canCreatePlaybook) && (group.items.some((p) => p.isOwn) || canPublish);

  const renameCategory = useMutation({
    mutationFn: ({ from, to }: { from: string; to: string }) =>
      axios.put("/api/v2/qa/playbooks/categories/rename", { from, to }),
    onSuccess: (_, variables) => {
      message.success(`Category renamed to "${variables.to}"`);
      if (category === variables.from) {
        setCategory(variables.to);
      }
      queryClient.invalidateQueries({ queryKey: ["qa", "playbooks"] });
      queryClient.invalidateQueries({ queryKey: ["qa", "playbooks", "meta"] });
    },
    onError: (err: any) => {
      message.error(
        err?.response?.data?.error || err?.message || "Could not rename the category"
      );
    },
  });

  const [modal, modalContextHolder] = Modal.useModal();

  const removeCategory = useMutation({
    mutationFn: (categoryName: string) =>
      axios.delete(`/api/v2/qa/playbooks/categories/${encodeURIComponent(categoryName)}`),
    onSuccess: (_, categoryName) => {
      message.success(`Category "${categoryName}" moved to trash`);
      if (category === categoryName) {
        setCategory(ALL_GROUP);
      }
      queryClient.invalidateQueries({ queryKey: ["qa", "playbooks"] });
      queryClient.invalidateQueries({ queryKey: ["qa", "playbooks", "meta"] });
      queryClient.invalidateQueries({ queryKey: ["qa", "playbooks", "trash"] });
    },
    onError: (err: any) => {
      message.error(
        err?.response?.data?.error || err?.message || "Could not delete the category"
      );
    },
  });

  const handleDeleteCategory = (catName: string, count: number) => {
    modal.confirm({
      title: "Move category to trash?",
      content: `Are you sure you want to move "${catName}" and its ${count} playbook(s) to trash?`,
      okText: "Move to trash",
      okType: "danger",
      centered: true,
      onOk: () => removeCategory.mutateAsync(catName),
    });
  };

  const remove = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/v2/qa/playbooks/${id}`),
    onSuccess: () => {
      message.success("Playbook deleted");
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
          description="You need playbook read access to open the playbook library."
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout noPadding>
      {modalContextHolder}
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

            <div className="pb-toolbar__actions">
              {/* The downloadable prompt / offline template. Lets the QA use an LLM they
                  already pay for, and bring the result back through Import. */}
              {canTemplatePlaybook && canAccessPlaybookTemplate && (
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

              {canUploadPlaybook && canAccessPlaybookUpload && (
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

              {canRequestPlaybook && canAccessPlaybookRequest && (
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

              {canRequestedPlaybook && canAccessPlaybookRequested && (
                <Button
                  className="pb-btn"
                  icon={<Inbox size={14} />}
                  onClick={() => router.push("/qa-workspace/playbooks/requested")}
                >
                  Requested
                </Button>
              )}

              <Tooltip title="View and restore deleted playbooks">
                <Button
                  className="pb-btn"
                  icon={<Trash2 size={14} />}
                  onClick={() => setTrashOpen(true)}
                >
                  Trash
                </Button>
              </Tooltip>

              {/* The premium ACCESS queue is a different job, and Testiez's
                  alone — it only appears for them. */}
              {canPublish && canAccessPlaybookAccess && canAccessPlaybookRequests && (
                <Tooltip title="Workspaces asking for access to premium playbooks">
                  <Button
                    className="pb-btn"
                    icon={<Lock size={14} />}
                    onClick={() => router.push("/qa-workspace/playbooks/requests")}
                  >
                    Access
                  </Button>
                </Tooltip>
              )}

              {canCreatePlaybook && canAccessPlaybookCreate && (
                <Button
                  type="primary"
                  className="pb-btn"
                  icon={<PlusOutlined />}
                  onClick={() => router.push("/qa-workspace/playbooks/create")}
                >
                  New playbook
                </Button>
              )}
            </div>
          </div>

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
              <aside className="pb-sidebar">
                <nav className="pb-nav" aria-label="Playbook categories">
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

                  {/* Categories hang off the heading on the same tree line the
                      reader uses for sub-sections, so the parent/child reading is
                      the same on both pages. */}
                  <div className="pb-nav__sep">Categories</div>
                  <div className="pb-nav__children">
                    {groups
                      .filter((g) => g.kind === "category")
                      .map((group) => (
                        <PlaybookCategoryNavItem
                          key={group.key}
                          group={group}
                          isActive={group.key === activeGroup.key}
                          canEdit={canManageCategory(group)}
                          onSelect={() => setCategory(group.key)}
                          onRename={(from, to) => renameCategory.mutate({ from, to })}
                          onDelete={(name, count) => handleDeleteCategory(name, count)}
                        />
                      ))}
                  </div>
                </nav>

                {canCreatePlaybook && (
                  <button
                    type="button"
                    className="pb-side-trash"
                    onClick={() => setTrashOpen(true)}
                  >
                    <Trash2 size={15} strokeWidth={2} />
                    <span>Trash</span>
                  </button>
                )}
              </aside>

              <div className="pb-body">
                <div className="pb-group__head">
                  <h2 className="pb-group__title">{activeGroup.label}</h2>
                  <span className="pb-group__count">{visible.length}</span>

                  {/* The same action as the tile at the end of the grid, kept at
                      the top for a group long enough that the tile is a scroll
                      away. */}
                  {canCreatePlaybook && canAccessPlaybookCreate ? (
                    <Button
                      className="pb-btn is-sm pb-group__action"
                      icon={<Plus size={13} />}
                      onClick={() =>
                        router.push(
                          `/qa-workspace/playbooks/create${
                            activeGroup.kind === "category"
                              ? `?category=${encodeURIComponent(activeGroup.label)}`
                              : ""
                          }`
                        )
                      }
                    >
                      {activeGroup.kind === "category"
                        ? `New in ${activeGroup.label}`
                        : "New playbook"}
                    </Button>
                  ) : canAccessPlaybookRequest ? (
                    <Button
                      className="pb-btn is-sm pb-group__action"
                      icon={<Sparkles size={13} />}
                      onClick={() => setRequestOpen(true)}
                    >
                      Request a playbook
                    </Button>
                  ) : null}
                </div>

                {visible.length === 0 ? (
                  <NoData
                    title="Nothing in this group"
                    description={
                      search
                        ? "Nothing here matches that search. Try a broader term or another category."
                        : "This category has no playbooks yet."
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
                        onOpen={() => router.push(`/qa-workspace/playbooks/${playbook.slug}`)}
                        onEdit={
                          canManage(playbook)
                            ? () =>
                                router.push(
                                  `/qa-workspace/playbooks/${playbook.slug}/edit`
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
                        deleting={remove.isPending && remove.variables === playbook.id}
                      />
                    ))}

                    {canCreatePlaybook && canAccessPlaybookCreate ? (
                      <button
                        type="button"
                        className="pb-card pb-card--add"
                        onClick={() =>
                          router.push(
                            `/qa-workspace/playbooks/create${
                              activeGroup.kind === "category"
                                ? `?category=${encodeURIComponent(activeGroup.label)}`
                                : ""
                            }`
                          )
                        }
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
                    ) : (
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
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      <ImportPlaybooksModal open={importOpen} onClose={() => setImportOpen(false)} />

      <RequestPlaybookDrawer
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        category={activeGroup.kind === "category" ? activeGroup.label : undefined}
      />

      <PlaybookTrashDrawer
        open={trashOpen}
        onClose={() => setTrashOpen(false)}
      />
    </MainLayout>
  );
}
