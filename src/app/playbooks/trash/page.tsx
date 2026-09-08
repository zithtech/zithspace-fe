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
import {
  Button,
  Checkbox,
  Input,
  Modal,
  Popconfirm,
  Tooltip,
  message,
} from "antd";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckSquare,
  Clock,
  FolderArchive,
  Layers,
  RefreshCw,
  RotateCcw,
  Search,
  Square,
  Trash2,
  User,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import MainLayout from "@/components/layout/MainLayout";
import NoData from "@/components/common/NoData";
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";
import { usePermission } from "@/hooks/usePermission";
import { useActivitySource } from "@/hooks/useActivitySource";
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

  const q = search.trim().toLowerCase();
  const filteredPlaybooks = useMemo(
    () =>
      playbooks.filter(
        (p) =>
          !q ||
          (p.name || "").toLowerCase().includes(q) ||
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
        .pb-trash-page {
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: calc(100vh - 64px);
          background: #f8fafc;
        }
        .pb-trash-hero {
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          border-bottom: 1px solid #e2e8f0;
          padding: 24px 32px 20px 32px;
        }
        .pb-trash-hero__top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          gap: 16px;
        }
        .pb-trash-hero__title-wrap {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .pb-trash-hero__icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #fee2e2;
          border: 1px solid #fecaca;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #dc2626;
          box-shadow: 0 2px 6px rgba(220, 38, 38, 0.08);
        }
        .pb-trash-hero__title {
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
          line-height: 1.2;
        }
        .pb-trash-hero__sub {
          font-size: 13px;
          color: #64748b;
          margin-top: 4px;
        }
        .pb-trash-stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }
        @media (max-width: 900px) {
          .pb-trash-stats-row {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        .pb-trash-stat-box {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
          transition: transform 0.15s ease, border-color 0.15s ease;
        }
        .pb-trash-stat-box:hover {
          border-color: #cbd5e1;
          transform: translateY(-1px);
        }
        .pb-trash-stat-box__label {
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
        }
        .pb-trash-stat-box__val {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
        }

        /* ── Controls Toolbar ── */
        .pb-trash-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 32px;
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          gap: 16px;
          flex-wrap: wrap;
        }
        .pb-trash-pills {
          display: flex;
          gap: 6px;
          background: #f1f5f9;
          padding: 4px;
          border-radius: 9px;
        }
        .pb-trash-pill {
          border: none;
          background: transparent;
          font-size: 13px;
          font-weight: 500;
          color: #64748b;
          padding: 6px 14px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .pb-trash-pill:hover {
          color: #0f172a;
        }
        .pb-trash-pill.is-active {
          background: #ffffff;
          color: #2563eb;
          font-weight: 600;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }
        .pb-trash-pill__count {
          padding: 1px 6px;
          border-radius: 10px;
          font-size: 11px;
          background: #e2e8f0;
          color: #475569;
        }
        .pb-trash-pill.is-active .pb-trash-pill__count {
          background: #eff6ff;
          color: #2563eb;
        }

        /* ── Bulk Action Bar ── */
        .pb-trash-bulk-bar {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 10px;
          padding: 10px 18px;
          margin: 16px 32px 0 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ── Cards Grid ── */
        .pb-trash-content {
          padding: 24px 32px;
          flex: 1;
        }
        .pb-trash-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 18px;
        }

        /* ── Trash Card Component ── */
        .pb-tcard {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          position: relative;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
          transition: all 0.2s ease;
        }
        .pb-tcard:hover {
          border-color: #cbd5e1;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
          transform: translateY(-2px);
        }
        .pb-tcard.is-selected {
          border-color: #3b82f6;
          background: #f8faff;
          box-shadow: 0 0 0 1px #3b82f6, 0 4px 12px rgba(59, 130, 246, 0.08);
        }
        .pb-tcard__top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 12px;
        }
        .pb-tcard__badge-row {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .pb-tcard__category-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #e2e8f0;
        }
        .pb-tcard__version-badge {
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 500;
          background: #eff6ff;
          color: #2563eb;
          border: 1px solid #dbeafe;
        }
        .pb-tcard__kind-badge {
          padding: 3px 9px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          background: #faf5ff;
          color: #7e22ce;
          border: 1px solid #f3e8ff;
          text-transform: capitalize;
        }
        .pb-tcard__head {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 10px;
        }
        .pb-tcard__icon {
          width: 36px;
          height: 36px;
          border-radius: 9px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #475569;
          flex-shrink: 0;
        }
        .pb-tcard__title {
          font-size: 15px;
          font-weight: 600;
          color: #0f172a;
          margin: 0;
          line-height: 1.35;
        }
        .pb-tcard__slug {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 2px;
          font-family: ui-monospace, monospace;
        }
        .pb-tcard__summary {
          font-size: 12px;
          color: #64748b;
          line-height: 1.5;
          margin-bottom: 16px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          flex: 1;
        }
        .pb-tcard__meta-bar {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 10px 12px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #f1f5f9;
          margin-bottom: 16px;
        }
        .pb-tcard__meta-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12px;
          color: #475569;
        }
        .pb-tcard__meta-label {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: #64748b;
        }
        .pb-tcard__actions {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-top: 14px;
          border-top: 1px solid #f1f5f9;
        }
      `}</style>

      <div className="pb-trash-page">
        {/* ── Top Hero Area ── */}
        <div className="pb-trash-hero">
          <div className="pb-trash-hero__top">
            <div className="pb-trash-hero__title-wrap">
              <div className="pb-trash-hero__icon">
                <Trash2 size={22} />
              </div>
              <div>
                <h1 className="pb-trash-hero__title">Playbooks Recycle Bin</h1>
                <p className="pb-trash-hero__sub">
                  Safely review, restore, or permanently purge deleted playbooks, collections, and categories.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
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
                <Button
                  danger
                  className="pb-btn"
                  icon={<Trash2 size={14} />}
                  onClick={handleEmptyTrash}
                  loading={actionLoading}
                >
                  Empty Recycle Bin
                </Button>
              )}
            </div>
          </div>

          {/* Stats Counters */}
          <div className="pb-trash-stats-row">
            <div className="pb-trash-stat-box">
              <span className="pb-trash-stat-box__label">Trashed Playbooks</span>
              <span className="pb-trash-stat-box__val">{counts.playbooks}</span>
            </div>
            <div className="pb-trash-stat-box">
              <span className="pb-trash-stat-box__label">Trashed Collections</span>
              <span className="pb-trash-stat-box__val">{counts.collections}</span>
            </div>
            <div className="pb-trash-stat-box">
              <span className="pb-trash-stat-box__label">Trashed Categories</span>
              <span className="pb-trash-stat-box__val">{counts.categories}</span>
            </div>
            <div className="pb-trash-stat-box" style={{ background: "#fff1f2", borderColor: "#fecdd3" }}>
              <span className="pb-trash-stat-box__label" style={{ color: "#e11d48" }}>Total Items in Trash</span>
              <span className="pb-trash-stat-box__val" style={{ color: "#be123c" }}>{counts.total}</span>
            </div>
          </div>
        </div>

        {/* ── Filter Toolbar ── */}
        <div className="pb-trash-toolbar">
          <div className="pb-trash-pills">
            <button
              type="button"
              className={`pb-trash-pill ${tab === "playbooks" ? "is-active" : ""}`}
              onClick={() => handleTabChange("playbooks")}
            >
              <BookOpen size={14} />
              <span>Playbooks</span>
              <span className="pb-trash-pill__count">{counts.playbooks}</span>
            </button>
            <button
              type="button"
              className={`pb-trash-pill ${tab === "collections" ? "is-active" : ""}`}
              onClick={() => handleTabChange("collections")}
            >
              <FolderArchive size={14} />
              <span>Collections</span>
              <span className="pb-trash-pill__count">{counts.collections}</span>
            </button>
            <button
              type="button"
              className={`pb-trash-pill ${tab === "categories" ? "is-active" : ""}`}
              onClick={() => handleTabChange("categories")}
            >
              <Layers size={14} />
              <span>Categories</span>
              <span className="pb-trash-pill__count">{counts.categories}</span>
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, maxWidth: 440 }}>
            <Input
              allowClear
              prefix={<Search size={14} style={{ color: "#94a3b8" }} />}
              placeholder={`Search trashed ${tab}…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ borderRadius: 8, height: 38 }}
            />
          </div>

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
              {selectedIds.length === currentIds.length ? "Deselect All" : "Select All"}
            </Button>
          )}
        </div>

        {/* ── Bulk Bar ── */}
        {selectedIds.length > 0 && (
          <div className="pb-trash-bulk-bar">
            <span style={{ fontSize: 13, fontWeight: 600, color: "#166534" }}>
              {selectedIds.length} {tab} selected
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              {canRestorePlaybookTrash && (
                <Button
                  size="small"
                  type="primary"
                  icon={<RotateCcw size={13} />}
                  onClick={handleBulkRestore}
                  loading={actionLoading}
                >
                  Restore Selected ({selectedIds.length})
                </Button>
              )}
              {canDeletePlaybookTrash && (
                <Button
                  size="small"
                  danger
                  icon={<Trash2 size={13} />}
                  onClick={handleBulkPermanentDelete}
                  loading={actionLoading}
                >
                  Delete Permanently
                </Button>
              )}
            </div>
          </div>
        )}

        {/* ── Cards Grid View ── */}
        <div className="pb-trash-content">
          <ZukvoLoadingOverlay loading={isLoading || actionLoading} minHeight={340}>
            {currentList.length === 0 ? (
              <div style={{ padding: "60px 24px", background: "#ffffff", borderRadius: 14, border: "1px solid #e2e8f0" }}>
                <NoData
                  title="Recycle bin is clean"
                  description={
                    search
                      ? `No trashed ${tab} match "${search}".`
                      : `No ${tab} are currently in the recycle bin.`
                  }
                />
              </div>
            ) : (
              <div className="pb-trash-grid">
                {/* ── Tab: Playbooks ── */}
                {tab === "playbooks" &&
                  filteredPlaybooks.map((p) => {
                    const isSelected = selectedIds.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        className={`pb-tcard ${isSelected ? "is-selected" : ""}`}
                      >
                        <div className="pb-tcard__top">
                          <div className="pb-tcard__badge-row">
                            <span className="pb-tcard__category-badge">
                              <Layers size={11} />
                              {p.category || "General"}
                            </span>
                            <span className="pb-tcard__version-badge">v{p.version}</span>
                          </div>
                          <Checkbox
                            checked={isSelected}
                            onChange={() => toggleSelectOne(p.id)}
                          />
                        </div>

                        <div className="pb-tcard__head">
                          <div className="pb-tcard__icon" style={{ background: "#eff6ff", color: "#2563eb", borderColor: "#dbeafe" }}>
                            <BookOpen size={18} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h3 className="pb-tcard__title">{p.name}</h3>
                            <div className="pb-tcard__slug">{p.slug}</div>
                          </div>
                        </div>

                        <p className="pb-tcard__summary">
                          {p.summary || "No summary provided for this playbook."}
                        </p>

                        <div className="pb-tcard__meta-bar">
                          <div className="pb-tcard__meta-row">
                            <span className="pb-tcard__meta-label">
                              <Sparkles size={12} />
                              Test items
                            </span>
                            <span style={{ fontWeight: 600, color: "#0f172a" }}>
                              {p.item_count} recommendation{p.item_count === 1 ? "" : "s"}
                            </span>
                          </div>
                          <div className="pb-tcard__meta-row">
                            <span className="pb-tcard__meta-label">
                              <User size={12} />
                              Deleted by
                            </span>
                            <span style={{ fontWeight: 500 }}>{p.deleted_by_name || "Workspace Member"}</span>
                          </div>
                          <div className="pb-tcard__meta-row">
                            <span className="pb-tcard__meta-label">
                              <Clock size={12} />
                              Deleted at
                            </span>
                            <Tooltip title={dayjs(p.deleted_at).format("YYYY-MM-DD HH:mm:ss")}>
                              <span>{dayjs(p.deleted_at).fromNow()}</span>
                            </Tooltip>
                          </div>
                        </div>

                        <div className="pb-tcard__actions">
                          {canRestorePlaybookTrash && (
                            <Button
                              type="primary"
                              ghost
                              style={{ flex: 1, borderRadius: 8 }}
                              icon={<RotateCcw size={14} />}
                              onClick={() => handleRestorePlaybook(p.id, p.name)}
                              loading={actionLoading}
                            >
                              Restore
                            </Button>
                          )}
                          {canDeletePlaybookTrash && (
                            <Popconfirm
                              title="Delete playbook permanently?"
                              description="This playbook and all its test items will be permanently erased."
                              okText="Delete"
                              okButtonProps={{ danger: true }}
                              cancelText="Cancel"
                              onConfirm={() => handlePermanentDeletePlaybook(p.id, p.name)}
                            >
                              <Button
                                danger
                                style={{ flex: 1, borderRadius: 8 }}
                                icon={<Trash2 size={14} />}
                                loading={actionLoading}
                              >
                                Delete
                              </Button>
                            </Popconfirm>
                          )}
                        </div>
                      </div>
                    );
                  })}

                {/* ── Tab: Collections ── */}
                {tab === "collections" &&
                  filteredCollections.map((c) => {
                    const isSelected = selectedIds.includes(c.id);
                    return (
                      <div
                        key={c.id}
                        className={`pb-tcard ${isSelected ? "is-selected" : ""}`}
                      >
                        <div className="pb-tcard__top">
                          <div className="pb-tcard__badge-row">
                            <span className="pb-tcard__kind-badge">{c.kind || "Curated"}</span>
                            <span className="pb-tcard__category-badge">
                              {c.playbook_count} playbook{c.playbook_count === 1 ? "" : "s"}
                            </span>
                          </div>
                          <Checkbox
                            checked={isSelected}
                            onChange={() => toggleSelectOne(c.id)}
                          />
                        </div>

                        <div className="pb-tcard__head">
                          <div className="pb-tcard__icon" style={{ background: "#faf5ff", color: "#9333ea", borderColor: "#f3e8ff" }}>
                            <FolderArchive size={18} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h3 className="pb-tcard__title">{c.name}</h3>
                            <div className="pb-tcard__slug">{c.slug}</div>
                          </div>
                        </div>

                        <p className="pb-tcard__summary">
                          {c.summary || "Curated collection bundle of test playbooks."}
                        </p>

                        <div className="pb-tcard__meta-bar">
                          <div className="pb-tcard__meta-row">
                            <span className="pb-tcard__meta-label">
                              <Layers size={12} />
                              Linked playbooks
                            </span>
                            <span style={{ fontWeight: 600, color: "#0f172a" }}>
                              {c.playbook_count}
                            </span>
                          </div>
                          <div className="pb-tcard__meta-row">
                            <span className="pb-tcard__meta-label">
                              <User size={12} />
                              Deleted by
                            </span>
                            <span style={{ fontWeight: 500 }}>{c.deleted_by_name || "Workspace Member"}</span>
                          </div>
                          <div className="pb-tcard__meta-row">
                            <span className="pb-tcard__meta-label">
                              <Clock size={12} />
                              Deleted at
                            </span>
                            <Tooltip title={dayjs(c.deleted_at).format("YYYY-MM-DD HH:mm:ss")}>
                              <span>{dayjs(c.deleted_at).fromNow()}</span>
                            </Tooltip>
                          </div>
                        </div>

                        <div className="pb-tcard__actions">
                          {canRestorePlaybookTrash && (
                            <Button
                              type="primary"
                              ghost
                              style={{ flex: 1, borderRadius: 8 }}
                              icon={<RotateCcw size={14} />}
                              onClick={() => handleRestoreCollection(c.id, c.name)}
                              loading={actionLoading}
                            >
                              Restore
                            </Button>
                          )}
                          {canDeletePlaybookTrash && (
                            <Popconfirm
                              title="Delete collection permanently?"
                              description="This collection bundle will be permanently erased. Its playbooks remain intact."
                              okText="Delete"
                              okButtonProps={{ danger: true }}
                              cancelText="Cancel"
                              onConfirm={() => handlePermanentDeleteCollection(c.id, c.name)}
                            >
                              <Button
                                danger
                                style={{ flex: 1, borderRadius: 8 }}
                                icon={<Trash2 size={14} />}
                                loading={actionLoading}
                              >
                                Delete
                              </Button>
                            </Popconfirm>
                          )}
                        </div>
                      </div>
                    );
                  })}

                {/* ── Tab: Categories ── */}
                {tab === "categories" &&
                  filteredCategories.map((cat) => {
                    const isSelected = selectedIds.includes(cat.id);
                    return (
                      <div
                        key={cat.id}
                        className={`pb-tcard ${isSelected ? "is-selected" : ""}`}
                      >
                        <div className="pb-tcard__top">
                          <div className="pb-tcard__badge-row">
                            <span className="pb-tcard__category-badge" style={{ background: "#fff1f2", color: "#e11d48", borderColor: "#fecdd3" }}>
                              <AlertTriangle size={11} />
                              {cat.playbook_count} cascaded playbook{cat.playbook_count === 1 ? "" : "s"}
                            </span>
                          </div>
                          <Checkbox
                            checked={isSelected}
                            onChange={() => toggleSelectOne(cat.id)}
                          />
                        </div>

                        <div className="pb-tcard__head">
                          <div className="pb-tcard__icon" style={{ background: "#f0fdf4", color: "#16a34a", borderColor: "#dcfce7" }}>
                            <Layers size={18} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h3 className="pb-tcard__title">{cat.name}</h3>
                            <div className="pb-tcard__slug">{cat.slug}</div>
                          </div>
                        </div>

                        <p className="pb-tcard__summary">
                          {cat.description || "Category grouping for playbooks."}
                        </p>

                        <div className="pb-tcard__meta-bar">
                          <div className="pb-tcard__meta-row">
                            <span className="pb-tcard__meta-label">
                              <BookOpen size={12} />
                              Child playbooks
                            </span>
                            <span style={{ fontWeight: 600, color: "#0f172a" }}>
                              {cat.playbook_count}
                            </span>
                          </div>
                          <div className="pb-tcard__meta-row">
                            <span className="pb-tcard__meta-label">
                              <User size={12} />
                              Deleted by
                            </span>
                            <span style={{ fontWeight: 500 }}>{cat.deleted_by_name || "Workspace Member"}</span>
                          </div>
                          <div className="pb-tcard__meta-row">
                            <span className="pb-tcard__meta-label">
                              <Clock size={12} />
                              Deleted at
                            </span>
                            <Tooltip title={dayjs(cat.deleted_at).format("YYYY-MM-DD HH:mm:ss")}>
                              <span>{dayjs(cat.deleted_at).fromNow()}</span>
                            </Tooltip>
                          </div>
                        </div>

                        <div className="pb-tcard__actions">
                          {canRestorePlaybookTrash && (
                            <Tooltip title="Restoring will also restore all child playbooks in this category">
                              <Button
                                type="primary"
                                ghost
                                style={{ flex: 1, borderRadius: 8 }}
                                icon={<RotateCcw size={14} />}
                                onClick={() => handleRestoreCategory(cat.id, cat.name)}
                                loading={actionLoading}
                              >
                                Restore Category
                              </Button>
                            </Tooltip>
                          )}
                          {canDeletePlaybookTrash && (
                            <Popconfirm
                              title="Delete category permanently?"
                              description="This category and its category-deleted playbooks will be permanently purged."
                              okText="Delete"
                              okButtonProps={{ danger: true }}
                              cancelText="Cancel"
                              onConfirm={() => handlePermanentDeleteCategory(cat.id, cat.name)}
                            >
                              <Button
                                danger
                                style={{ flex: 1, borderRadius: 8 }}
                                icon={<Trash2 size={14} />}
                                loading={actionLoading}
                              >
                                Delete
                              </Button>
                            </Popconfirm>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </ZukvoLoadingOverlay>
        </div>
      </div>
    </MainLayout>
  );
}
