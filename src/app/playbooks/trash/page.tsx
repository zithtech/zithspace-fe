"use client";

/**
 * QA Playbooks — Recycle Bin (Trash)
 *
 * Card-based administrative interface to manage and restore trashed playbooks,
 * collections, and categories. Matches the unified QA Playbooks design language.
 */

import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Checkbox, Input, Tooltip, message, Modal } from "antd";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckSquare,
  Clock,
  FolderArchive,
  Layers,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  Square,
  Trash2,
  User,
  X,
} from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import MainLayout from "@/components/layout/MainLayout";
import NoData from "@/components/common/NoData";
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { CollectionIcon } from "@/components/qa/CollectionIcon";
import { usePermission } from "@/hooks/usePermission";
import { useActivitySource } from "@/hooks/useActivitySource";
import { useDebounce } from "@/hooks/useDebounce";
import { api as axios } from "@/lib/axios";
import { PLAYBOOK_STYLES } from "@/components/qa/playbookShared";

dayjs.extend(relativeTime);

type TrashTab = "playbooks" | "collections" | "categories";

interface TrashedPlaybook {
  id: string;
  slug: string;
  name: string;
  category: string;
  version: string;
  summary: string | null;
  deleted_at: string;
  deleted_by: string | null;
  deleted_by_name: string;
  item_count: number;
}

interface TrashedCollection {
  id: string;
  slug: string;
  name: string;
  kind: string;
  summary: string | null;
  icon: string | null;
  deleted_at: string;
  deleted_by: string | null;
  deleted_by_name: string;
  playbook_count: number;
}

interface TrashedCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  deleted_at: string;
  deleted_by: string | null;
  deleted_by_name: string;
  playbook_count: number;
}

interface TrashData {
  playbooks: TrashedPlaybook[];
  collections: TrashedCollection[];
  categories: TrashedCategory[];
  counts: {
    playbooks: number;
    collections: number;
    categories: number;
    total: number;
  };
}

export default function PlaybooksTrashPage() {
  useActivitySource({ section: "WORK", module: "QA", page: "PlaybooksTrash" });

  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const {
    canReadPlaybookTrash,
    canRestorePlaybookTrash,
    canDeletePlaybookTrash,
  } = usePermission();

  const tabParam = searchParams?.get("tab") as TrashTab | null;
  const [tab, setTab] = useState<TrashTab>(
    tabParam === "collections" || tabParam === "categories" ? tabParam : "playbooks"
  );

  useEffect(() => {
    if (tabParam === "playbooks" || tabParam === "collections" || tabParam === "categories") {
      setTab(tabParam);
    }
  }, [tabParam]);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 250);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  const { data, isLoading, refetch } = useQuery<TrashData>({
    queryKey: ["qa", "playbooks", "trash"],
    queryFn: async () => {
      const res: any = await axios.get("/api/v2/qa/playbooks/trash?tab=all");
      if (res?.playbooks) return res;
      if (res?.data?.playbooks) return res.data;
      if (res?.data?.data?.playbooks) return res.data.data;
      return (
        res || {
          playbooks: [],
          collections: [],
          categories: [],
          counts: { playbooks: 0, collections: 0, categories: 0, total: 0 },
        }
      );
    },
    enabled: !!canReadPlaybookTrash,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const playbooks = data?.playbooks || [];
  const collections = data?.collections || [];
  const categories = data?.categories || [];
  const counts = data?.counts || { playbooks: 0, collections: 0, categories: 0, total: 0 };

  const q = debouncedSearch.trim().toLowerCase();
  const filteredPlaybooks = useMemo(
    () =>
      playbooks.filter(
        (p) =>
          !q ||
          (p.name || "").toLowerCase().includes(q) ||
          (p.slug || "").toLowerCase().includes(q) ||
          (p.category || "").toLowerCase().includes(q) ||
          (p.summary || "").toLowerCase().includes(q) ||
          (p.deleted_by_name || "").toLowerCase().includes(q)
      ),
    [playbooks, q]
  );

  const filteredCollections = useMemo(
    () =>
      collections.filter(
        (c) =>
          !q ||
          (c.name || "").toLowerCase().includes(q) ||
          (c.slug || "").toLowerCase().includes(q) ||
          (c.kind || "").toLowerCase().includes(q) ||
          (c.summary || "").toLowerCase().includes(q) ||
          (c.deleted_by_name || "").toLowerCase().includes(q)
      ),
    [collections, q]
  );

  const filteredCategories = useMemo(
    () =>
      categories.filter(
        (cat) =>
          !q ||
          (cat.name || "").toLowerCase().includes(q) ||
          (cat.slug || "").toLowerCase().includes(q) ||
          (cat.description || "").toLowerCase().includes(q) ||
          (cat.deleted_by_name || "").toLowerCase().includes(q)
      ),
    [categories, q]
  );

  const currentList =
    tab === "playbooks"
      ? filteredPlaybooks
      : tab === "collections"
      ? filteredCollections
      : filteredCategories;

  const currentIds = useMemo(() => currentList.map((item) => item.id), [currentList]);

  const handleTabChange = (val: TrashTab) => {
    setTab(val);
    setSelectedIds([]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === currentIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds([...currentIds]);
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ── Restore actions ────────────────────────────────────────────────────────
  const handleRestorePlaybook = async (id: string, name: string) => {
    try {
      setActionLoading(true);
      await axios.post(`/api/v2/qa/playbooks/trash/playbooks/${id}/restore`);
      message.success(`Restored playbook "${name}"`);
      setSelectedIds((prev) => prev.filter((k) => k !== id));
      queryClient.invalidateQueries({ queryKey: ["qa", "playbooks"] });
    } catch (err: any) {
      message.error(err?.response?.data?.error || err?.message || "Failed to restore playbook");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestoreCollection = async (id: string, name: string) => {
    try {
      setActionLoading(true);
      await axios.post(`/api/v2/qa/playbooks/trash/collections/${id}/restore`);
      message.success(`Restored collection "${name}"`);
      setSelectedIds((prev) => prev.filter((k) => k !== id));
      queryClient.invalidateQueries({ queryKey: ["qa", "playbooks"] });
    } catch (err: any) {
      message.error(err?.response?.data?.error || err?.message || "Failed to restore collection");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestoreCategory = async (id: string, name: string) => {
    try {
      setActionLoading(true);
      const res: any = await axios.post(`/api/v2/qa/playbooks/trash/categories/${id}/restore`);
      const count = res?.restoredPlaybooks ?? res?.data?.restoredPlaybooks ?? 0;
      message.success(
        count > 0
          ? `Restored category "${name}" and ${count} child playbook${count === 1 ? "" : "s"}`
          : `Restored category "${name}"`
      );
      setSelectedIds((prev) => prev.filter((k) => k !== id));
      queryClient.invalidateQueries({ queryKey: ["qa", "playbooks"] });
    } catch (err: any) {
      message.error(err?.response?.data?.error || err?.message || "Failed to restore category");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Permanent delete actions ───────────────────────────────────────────────
  const handlePermanentDeletePlaybook = async (id: string, name: string) => {
    try {
      setActionLoading(true);
      await axios.delete(`/api/v2/qa/playbooks/trash/playbooks/${id}/permanent`);
      message.success(`Permanently deleted playbook "${name}"`);
      setSelectedIds((prev) => prev.filter((k) => k !== id));
      queryClient.invalidateQueries({ queryKey: ["qa", "playbooks"] });
    } catch (err: any) {
      message.error(err?.response?.data?.error || err?.message || "Failed to permanently delete playbook");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePermanentDeleteCollection = async (id: string, name: string) => {
    try {
      setActionLoading(true);
      await axios.delete(`/api/v2/qa/playbooks/trash/collections/${id}/permanent`);
      message.success(`Permanently deleted collection "${name}"`);
      setSelectedIds((prev) => prev.filter((k) => k !== id));
      queryClient.invalidateQueries({ queryKey: ["qa", "playbooks"] });
    } catch (err: any) {
      message.error(err?.response?.data?.error || err?.message || "Failed to permanently delete collection");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePermanentDeleteCategory = async (id: string, name: string) => {
    try {
      setActionLoading(true);
      await axios.delete(`/api/v2/qa/playbooks/trash/categories/${id}/permanent`);
      message.success(`Permanently deleted category "${name}" and its child playbooks`);
      setSelectedIds((prev) => prev.filter((k) => k !== id));
      queryClient.invalidateQueries({ queryKey: ["qa", "playbooks"] });
    } catch (err: any) {
      message.error(err?.response?.data?.error || err?.message || "Failed to permanently delete category");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Bulk Actions ───────────────────────────────────────────────────────────
  const handleBulkRestore = async () => {
    if (selectedIds.length === 0) return;
    try {
      setActionLoading(true);
      for (const id of selectedIds) {
        if (tab === "playbooks") {
          await axios.post(`/api/v2/qa/playbooks/trash/playbooks/${id}/restore`);
        } else if (tab === "collections") {
          await axios.post(`/api/v2/qa/playbooks/trash/collections/${id}/restore`);
        } else if (tab === "categories") {
          await axios.post(`/api/v2/qa/playbooks/trash/categories/${id}/restore`);
        }
      }
      message.success(`Restored ${selectedIds.length} ${tab}`);
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ["qa", "playbooks"] });
    } catch (err: any) {
      message.error(err?.response?.data?.error || err?.message || `Failed to bulk restore ${tab}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkPermanentDelete = async () => {
    if (selectedIds.length === 0) return;
    Modal.confirm({
      title: `Permanently delete ${selectedIds.length} ${tab}?`,
      content:
        "These items will be permanently erased from the system. This action cannot be undone.",
      okText: "Delete Permanently",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          setActionLoading(true);
          for (const id of selectedIds) {
            if (tab === "playbooks") {
              await axios.delete(`/api/v2/qa/playbooks/trash/playbooks/${id}/permanent`);
            } else if (tab === "collections") {
              await axios.delete(`/api/v2/qa/playbooks/trash/collections/${id}/permanent`);
            } else if (tab === "categories") {
              await axios.delete(`/api/v2/qa/playbooks/trash/categories/${id}/permanent`);
            }
          }
          message.success(`Permanently deleted ${selectedIds.length} ${tab}`);
          setSelectedIds([]);
          queryClient.invalidateQueries({ queryKey: ["qa", "playbooks"] });
        } catch (err: any) {
          message.error(err?.response?.data?.error || err?.message || `Failed to delete ${tab}`);
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleEmptyTrash = () => {
    Modal.confirm({
      title: "Empty Entire Playbooks Recycle Bin?",
      content:
        "Are you sure you want to permanently delete all trashed playbooks, collections, and categories? This action is completely irreversible.",
      okText: "Empty Recycle Bin",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          setActionLoading(true);
          await axios.delete("/api/v2/qa/playbooks/trash/empty?tab=all");
          message.success("Recycle bin emptied successfully");
          setSelectedIds([]);
          queryClient.invalidateQueries({ queryKey: ["qa", "playbooks"] });
        } catch (err: any) {
          message.error(err?.response?.data?.error || err?.message || "Failed to empty recycle bin");
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  if (!canReadPlaybookTrash) {
    return (
      <MainLayout>
        <NoData
          title="No access to Recycle Bin"
          description="You need playbook trash read permissions to view deleted items."
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout noPadding>
      <style dangerouslySetInnerHTML={{ __html: PLAYBOOK_STYLES }} />
      <style jsx global>{`
        /* ── Unified Trash Styling ─────────────────────────────────────────── */
        .pb-trash-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 16px;
        }

        .pb-card.is-trashed {
          position: relative;
          cursor: default;
          transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
        }
        .pb-card.is-trashed:hover {
          border-color: var(--border-slate-300, #cbd5e1);
          box-shadow: 0 6px 20px rgba(15, 23, 42, 0.06);
          transform: translateY(-2px);
        }
        .pb-card.is-trashed.is-selected {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.03);
          box-shadow: 0 0 0 1px #3b82f6, 0 4px 14px rgba(59, 130, 246, 0.08);
        }

        .pb-trash-av--playbook {
          color: #dc2626;
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.2);
        }
        .pb-trash-av--collection {
          color: #9333ea;
          background: rgba(147, 51, 234, 0.1);
          border-color: rgba(147, 51, 234, 0.2);
        }
        .pb-trash-av--category {
          color: #ea580c;
          background: rgba(234, 88, 12, 0.1);
          border-color: rgba(234, 88, 12, 0.2);
        }

        .pb-trash-meta-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 10px;
          margin-top: 10px;
          border-radius: 8px;
          background: var(--bg-slate-50, #f8fafc);
          border: 1px solid var(--border-slate-200, #e2e8f0);
          font-size: 11.5px;
          color: var(--text-slate-500, #64748b);
        }
        [data-theme='dark'] .pb-trash-meta-row {
          background: #0b0f14;
          border-color: #1f2937;
        }

        .pb-trash-bulk-floating {
          position: sticky;
          top: 12px;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 16px;
          margin-bottom: 16px;
          background: #ffffff;
          border: 1px solid #3b82f6;
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.15), 0 4px 10px -2px rgba(0, 0, 0, 0.05);
          animation: slideDownFade 0.2s ease-out;
        }
        [data-theme='dark'] .pb-trash-bulk-floating {
          background: #0f1419;
          border-color: #3b82f6;
        }

        @keyframes slideDownFade {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .pb-pill__count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 18px;
          padding: 0 6px;
          border-radius: 999px;
          font-size: 10.5px;
          font-weight: 700;
          background: rgba(100, 116, 139, 0.12);
          color: var(--text-slate-500, #64748b);
          margin-left: 4px;
        }
        .pb-pill.is-on .pb-pill__count {
          background: rgba(59, 130, 246, 0.18);
          color: #2563eb;
        }
      `}</style>

      <div className="dh-shell">
        <main className="dh-main">
          {/* ── Top Hero Area ── */}
          <div className="pb-hero">
            <span className="pb-hero__badge" style={{ color: "#dc2626", background: "rgba(220, 38, 38, 0.1)", borderColor: "rgba(220, 38, 38, 0.2)" }}>
              <Trash2 size={18} />
            </span>
            <div className="pb-hero__text">
              <h1 className="pb-hero__title">Playbooks Recycle Bin</h1>
              <p className="pb-hero__sub">
                Safely review, restore, or permanently purge deleted playbooks, collections, and categories.
              </p>
            </div>

            {/* Total counts chips */}
            <div className="pb-hero__stats">
              <div className="pb-hero__stat">
                <BookOpen size={14} />
                <b>{counts.playbooks}</b>
                <span>{counts.playbooks === 1 ? "playbook" : "playbooks"}</span>
              </div>
              <div className="pb-hero__stat">
                <FolderArchive size={14} />
                <b>{counts.collections}</b>
                <span>{counts.collections === 1 ? "collection" : "collections"}</span>
              </div>
              <div className="pb-hero__stat">
                <Layers size={14} />
                <b>{counts.categories}</b>
                <span>{counts.categories === 1 ? "category" : "categories"}</span>
              </div>
            </div>
          </div>

          {/* ── Filter Toolbar ── */}
          <div className="pb-toolbar">
            <div className="pb-pills">
              {(
                [
                  ["playbooks", "Playbooks", counts.playbooks, BookOpen],
                  ["collections", "Collections", counts.collections, FolderArchive],
                  ["categories", "Categories", counts.categories, Layers],
                ] as [TrashTab, string, number, any][]
              ).map(([value, label, count, Icon]) => (
                <button
                  key={value}
                  type="button"
                  className={`pb-pill ${tab === value ? "is-on" : ""}`}
                  onClick={() => handleTabChange(value)}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <Icon size={13} />
                    {label}
                    <span className="pb-pill__count">{count}</span>
                  </span>
                </button>
              ))}
            </div>

            <Input
              allowClear
              prefix={<Search size={14} style={{ color: "#94a3b8" }} />}
              placeholder={`Search trashed ${tab}…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pb-search is-wide"
            />

            {currentList.length > 0 && (
              <Button
                className="pb-btn"
                onClick={toggleSelectAll}
                icon={
                  selectedIds.length > 0 && selectedIds.length === currentIds.length ? (
                    <CheckSquare size={14} color="#2563eb" />
                  ) : (
                    <Square size={14} />
                  )
                }
              >
                {selectedIds.length === currentIds.length ? "Deselect all" : "Select all"}
              </Button>
            )}

            <div className="pb-toolbar__actions">
              <Button
                className="pb-btn"
                icon={<ArrowLeft size={14} />}
                onClick={() => router.push("/playbooks")}
              >
                Back to Playbooks
              </Button>

              <Button
                className="pb-btn"
                icon={<RefreshCw size={14} />}
                onClick={() => refetch()}
                loading={isLoading}
              >
                Refresh
              </Button>

              {canDeletePlaybookTrash && counts.total > 0 && (
                <Tooltip title="Permanently delete all items currently in the recycle bin">
                  <Button
                    danger
                    className="pb-btn"
                    icon={<Trash2 size={14} />}
                    onClick={handleEmptyTrash}
                    loading={actionLoading}
                  >
                    Empty Recycle Bin
                  </Button>
                </Tooltip>
              )}
            </div>
          </div>

          {/* ── Main Scroll Area ── */}
          <div className="dh-main-scroll">
            <ZukvoLoadingOverlay loading={isLoading || actionLoading} minHeight={340}>
              {/* Floating bulk actions bar */}
              {selectedIds.length > 0 && (
                <div className="pb-trash-bulk-floating">
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontWeight: 700,
                        fontSize: 13,
                        color: "#2563eb",
                      }}
                    >
                      <CheckSquare size={16} />
                      {selectedIds.length} {tab} selected
                    </span>
                    <Button
                      type="text"
                      size="small"
                      icon={<X size={13} />}
                      onClick={() => setSelectedIds([])}
                      style={{ fontSize: 12, color: "#64748b" }}
                    >
                      Clear
                    </Button>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {canRestorePlaybookTrash && (
                      <Button
                        type="primary"
                        className="pb-btn"
                        icon={<RotateCcw size={14} />}
                        onClick={handleBulkRestore}
                        loading={actionLoading}
                      >
                        Restore selected ({selectedIds.length})
                      </Button>
                    )}

                    {canDeletePlaybookTrash && (
                      <Button
                        danger
                        className="pb-btn"
                        icon={<Trash2 size={14} />}
                        onClick={handleBulkPermanentDelete}
                        loading={actionLoading}
                      >
                        Delete permanently
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Cards Grid or Empty State */}
              {currentList.length === 0 ? (
                <div style={{ padding: "64px 24px", background: "var(--bg-pure-white)", borderRadius: 14, border: "1px solid var(--border-slate-200)" }}>
                  <NoData
                    title="Recycle bin is empty"
                    description={
                      search
                        ? `No trashed ${tab} match "${search}".`
                        : `No ${tab} are currently in the recycle bin.`
                    }
                  />
                </div>
              ) : (
                <div className="pb-trash-grid">
                  {/* ── TAB 1: PLAYBOOKS ── */}
                  {tab === "playbooks" &&
                    filteredPlaybooks.map((p) => {
                      const isSelected = selectedIds.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          className={`pb-card is-trashed ${isSelected ? "is-selected" : ""}`}
                          onClick={() => toggleSelectOne(p.id)}
                        >
                          <div className="pb-card__top">
                            <div
                              onClick={(e) => e.stopPropagation()}
                              style={{ display: "inline-flex", alignItems: "center", marginRight: 2 }}
                            >
                              <Checkbox
                                checked={isSelected}
                                onChange={() => toggleSelectOne(p.id)}
                              />
                            </div>

                            <span className="pb-card__av pb-trash-av--playbook">
                              <BookOpen size={16} />
                            </span>

                            <div className="pb-card__id">
                              <span className="pb-card__name">{p.name}</span>
                              <span className="pb-card__meta">
                                v{p.version} · <code style={{ fontSize: 10, color: "#94a3b8" }}>{p.slug}</code>
                              </span>
                            </div>

                            <span
                              className="pb-card__actions"
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                            >
                              {canRestorePlaybookTrash && (
                                <Tooltip title="Restore playbook">
                                  <button
                                    type="button"
                                    className="pb-iconbtn"
                                    onClick={() => handleRestorePlaybook(p.id, p.name)}
                                    aria-label="Restore"
                                    disabled={actionLoading}
                                  >
                                    <RotateCcw size={14} />
                                  </button>
                                </Tooltip>
                              )}

                              {canDeletePlaybookTrash && (
                                <ConfirmDialog
                                  tone="danger"
                                  title="Permanently delete playbook?"
                                  description={`"${p.name}" and all its recommendations will be permanently erased.`}
                                  confirmText="Delete permanently"
                                  onConfirm={() => handlePermanentDeletePlaybook(p.id, p.name)}
                                >
                                  <Tooltip title="Delete permanently">
                                    <button
                                      type="button"
                                      className="pb-iconbtn is-danger"
                                      aria-label="Delete permanently"
                                      disabled={actionLoading}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </Tooltip>
                                </ConfirmDialog>
                              )}
                            </span>
                          </div>

                          <p className="pb-card__summary">
                            {p.summary || "No summary provided for this playbook."}
                          </p>

                          <div className="pb-trash-meta-row">
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                              <User size={12} />
                              {p.deleted_by_name || "Workspace member"}
                            </span>
                            <Tooltip title={dayjs(p.deleted_at).format("YYYY-MM-DD HH:mm:ss")}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                                <Clock size={12} />
                                {dayjs(p.deleted_at).fromNow()}
                              </span>
                            </Tooltip>
                          </div>

                          <div className="pb-card__foot">
                            <span className="pb-card__total">
                              <Layers size={13} />
                              {p.item_count} {p.item_count === 1 ? "recommendation" : "recommendations"}
                            </span>

                            <span className="pb-card__state">
                              <span className="pb-tier pb-tier--public">
                                {p.category || "General"}
                              </span>
                            </span>
                          </div>
                        </div>
                      );
                    })}

                  {/* ── TAB 2: COLLECTIONS ── */}
                  {tab === "collections" &&
                    filteredCollections.map((c) => {
                      const isSelected = selectedIds.includes(c.id);
                      return (
                        <div
                          key={c.id}
                          className={`pb-card is-trashed ${isSelected ? "is-selected" : ""}`}
                          onClick={() => toggleSelectOne(c.id)}
                        >
                          <div className="pb-card__top">
                            <div
                              onClick={(e) => e.stopPropagation()}
                              style={{ display: "inline-flex", alignItems: "center", marginRight: 2 }}
                            >
                              <Checkbox
                                checked={isSelected}
                                onChange={() => toggleSelectOne(c.id)}
                              />
                            </div>

                            <span className="pb-card__av pb-trash-av--collection">
                              <CollectionIcon name={c.icon} />
                            </span>

                            <div className="pb-card__id">
                              <span className="pb-card__name">{c.name}</span>
                              <span className="pb-card__meta">
                                {c.kind || "Curated"} · <code style={{ fontSize: 10, color: "#94a3b8" }}>{c.slug}</code>
                              </span>
                            </div>

                            <span
                              className="pb-card__actions"
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                            >
                              {canRestorePlaybookTrash && (
                                <Tooltip title="Restore collection">
                                  <button
                                    type="button"
                                    className="pb-iconbtn"
                                    onClick={() => handleRestoreCollection(c.id, c.name)}
                                    aria-label="Restore"
                                    disabled={actionLoading}
                                  >
                                    <RotateCcw size={14} />
                                  </button>
                                </Tooltip>
                              )}

                              {canDeletePlaybookTrash && (
                                <ConfirmDialog
                                  tone="danger"
                                  title="Permanently delete collection?"
                                  description={`"${c.name}" bundle will be permanently erased. Linked playbooks remain safe.`}
                                  confirmText="Delete permanently"
                                  onConfirm={() => handlePermanentDeleteCollection(c.id, c.name)}
                                >
                                  <Tooltip title="Delete permanently">
                                    <button
                                      type="button"
                                      className="pb-iconbtn is-danger"
                                      aria-label="Delete permanently"
                                      disabled={actionLoading}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </Tooltip>
                                </ConfirmDialog>
                              )}
                            </span>
                          </div>

                          <p className="pb-card__summary">
                            {c.summary || "Curated collection bundle of test playbooks."}
                          </p>

                          <div className="pb-trash-meta-row">
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                              <User size={12} />
                              {c.deleted_by_name || "Workspace member"}
                            </span>
                            <Tooltip title={dayjs(c.deleted_at).format("YYYY-MM-DD HH:mm:ss")}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                                <Clock size={12} />
                                {dayjs(c.deleted_at).fromNow()}
                              </span>
                            </Tooltip>
                          </div>

                          <div className="pb-card__foot">
                            <span className="pb-card__total">
                              <BookOpen size={13} />
                              {c.playbook_count} {c.playbook_count === 1 ? "playbook" : "playbooks"}
                            </span>

                            <span className="pb-card__state">
                              <span className="pb-tier pb-tier--premium" style={{ textTransform: "capitalize" }}>
                                {c.kind || "Curated"}
                              </span>
                            </span>
                          </div>
                        </div>
                      );
                    })}

                  {/* ── TAB 3: CATEGORIES ── */}
                  {tab === "categories" &&
                    filteredCategories.map((cat) => {
                      const isSelected = selectedIds.includes(cat.id);
                      return (
                        <div
                          key={cat.id}
                          className={`pb-card is-trashed ${isSelected ? "is-selected" : ""}`}
                          onClick={() => toggleSelectOne(cat.id)}
                        >
                          <div className="pb-card__top">
                            <div
                              onClick={(e) => e.stopPropagation()}
                              style={{ display: "inline-flex", alignItems: "center", marginRight: 2 }}
                            >
                              <Checkbox
                                checked={isSelected}
                                onChange={() => toggleSelectOne(cat.id)}
                              />
                            </div>

                            <span className="pb-card__av pb-trash-av--category">
                              <Layers size={16} />
                            </span>

                            <div className="pb-card__id">
                              <span className="pb-card__name">{cat.name}</span>
                              <span className="pb-card__meta">
                                Category · <code style={{ fontSize: 10, color: "#94a3b8" }}>{cat.slug}</code>
                              </span>
                            </div>

                            <span
                              className="pb-card__actions"
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                            >
                              {canRestorePlaybookTrash && (
                                <Tooltip title="Restore category (and child playbooks)">
                                  <button
                                    type="button"
                                    className="pb-iconbtn"
                                    onClick={() => handleRestoreCategory(cat.id, cat.name)}
                                    aria-label="Restore"
                                    disabled={actionLoading}
                                  >
                                    <RotateCcw size={14} />
                                  </button>
                                </Tooltip>
                              )}

                              {canDeletePlaybookTrash && (
                                <ConfirmDialog
                                  tone="danger"
                                  title="Permanently delete category?"
                                  description={`"${cat.name}" and any playbooks deleted with it will be permanently erased.`}
                                  confirmText="Delete permanently"
                                  onConfirm={() => handlePermanentDeleteCategory(cat.id, cat.name)}
                                >
                                  <Tooltip title="Delete permanently">
                                    <button
                                      type="button"
                                      className="pb-iconbtn is-danger"
                                      aria-label="Delete permanently"
                                      disabled={actionLoading}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </Tooltip>
                                </ConfirmDialog>
                              )}
                            </span>
                          </div>

                          <p className="pb-card__summary">
                            {cat.description || "Category grouping for playbooks."}
                          </p>

                          <div className="pb-trash-meta-row">
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                              <User size={12} />
                              {cat.deleted_by_name || "Workspace member"}
                            </span>
                            <Tooltip title={dayjs(cat.deleted_at).format("YYYY-MM-DD HH:mm:ss")}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                                <Clock size={12} />
                                {dayjs(cat.deleted_at).fromNow()}
                              </span>
                            </Tooltip>
                          </div>

                          <div className="pb-card__foot">
                            <span className="pb-card__total" style={{ color: "#e11d48" }}>
                              <AlertTriangle size={13} />
                              {cat.playbook_count} cascaded {cat.playbook_count === 1 ? "playbook" : "playbooks"}
                            </span>

                            <span className="pb-card__state">
                              <span className="pb-tier pb-tier--draft">
                                Category
                              </span>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </ZukvoLoadingOverlay>
          </div>
        </main>
      </div>
    </MainLayout>
  );
}
