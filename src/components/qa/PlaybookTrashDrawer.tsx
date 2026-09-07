"use client";

import React, { useMemo, useState } from "react";
import {
  Drawer,
  Input,
  Button,
  message,
  Tooltip,
  Modal,
  Skeleton,
  Avatar,
} from "antd";
import {
  UndoOutlined,
  DeleteOutlined,
  SearchOutlined,
  CloseOutlined,
  InboxOutlined,
  ClockCircleOutlined,
  FolderOutlined,
  FolderOpenOutlined,
} from "@ant-design/icons";
import { BookOpen, Layers } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { api as axios } from "@/lib/axios";
import { usePermission } from "@/hooks/usePermission";
import NoData from "@/components/common/NoData";

export interface TrashPlaybook {
  id: string;
  slug: string;
  name: string;
  category: string;
  summary: string;
  version: string;
  visibility: string;
  status: string;
  isOwn: boolean;
  itemCount: number;
  deletedAt: string;
  deletedBy: string | null;
  deletedByName: string | null;
}

export interface TrashedCategoryGroup {
  name: string;
  playbookCount: number;
  totalItems: number;
  latestDeletedAt: string;
  deletedByName: string | null;
}

export interface TrashApiResponse {
  playbooks: TrashPlaybook[];
  categories: TrashedCategoryGroup[];
}

type TabKey = "playbooks" | "categories";

const tabAccent: Record<TabKey, { gradient: string; shadow: string; tint: string; text: string }> = {
  playbooks: {
    gradient: "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)",
    shadow: "rgba(59, 130, 246, 0.28)",
    tint: "var(--bg-blue-50, #eff6ff)",
    text: "var(--text-blue-700, #1d4ed8)",
  },
  categories: {
    gradient: "linear-gradient(135deg, #F97316 0%, #F59E0B 100%)",
    shadow: "rgba(249, 115, 22, 0.28)",
    tint: "var(--bg-orange-50, #fff7ed)",
    text: "#b45309",
  },
};

interface PlaybookTrashDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function PlaybookTrashDrawer({ open, onClose }: PlaybookTrashDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("playbooks");
  const [searchValue, setSearchValue] = useState("");
  const { canCreateCase } = usePermission();
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();
  const [modal, modalContextHolder] = Modal.useModal();

  const { data, isLoading, refetch } = useQuery<TrashApiResponse>({
    queryKey: ["qa", "playbooks", "trash"],
    queryFn: () => axios.get("/api/v2/qa/playbooks/trash"),
    enabled: open,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
  });

  const trashItems = data?.playbooks || [];
  const trashedCategories = data?.categories || [];

  const handleRestorePlaybook = (item: TrashPlaybook) => {
    modal.confirm({
      title: "Restore playbook?",
      content: `"${item.name}" will be moved back to your active playbooks library.`,
      okText: "Restore",
      cancelText: "Cancel",
      centered: true,
      onOk: async () => {
        try {
          await axios.post(`/api/v2/qa/playbooks/${item.id}/restore`);
          messageApi.success(`"${item.name}" restored`);
          refetch();
          queryClient.invalidateQueries({ queryKey: ["qa", "playbooks"] });
          queryClient.invalidateQueries({ queryKey: ["qa", "playbooks", "meta"] });
        } catch (error: any) {
          console.error(error);
          messageApi.error(
            error?.response?.data?.error || error?.message || "Failed to restore playbook"
          );
        }
      },
    });
  };

  const handleDeletePlaybookPermanent = (item: TrashPlaybook) => {
    modal.confirm({
      title: "Permanently delete playbook?",
      content: `"${item.name}" and all of its recommendations will be permanently deleted. This action cannot be undone.`,
      okText: "Delete permanently",
      okType: "danger",
      cancelText: "Cancel",
      centered: true,
      onOk: async () => {
        try {
          await axios.delete(`/api/v2/qa/playbooks/${item.id}/permanent`);
          messageApi.success(`"${item.name}" permanently deleted`);
          refetch();
          queryClient.invalidateQueries({ queryKey: ["qa", "playbooks"] });
          queryClient.invalidateQueries({ queryKey: ["qa", "playbooks", "meta"] });
        } catch (error: any) {
          console.error(error);
          messageApi.error(
            error?.response?.data?.error || error?.message || "Failed to delete playbook permanently"
          );
        }
      },
    });
  };

  const handleRestoreCategory = (cat: TrashedCategoryGroup) => {
    modal.confirm({
      title: "Restore category?",
      content: `"${cat.name}" and its ${cat.playbookCount} playbook(s) will be restored to your active library.`,
      okText: "Restore all",
      cancelText: "Cancel",
      centered: true,
      onOk: async () => {
        try {
          await axios.post(`/api/v2/qa/playbooks/categories/${encodeURIComponent(cat.name)}/restore`);
          messageApi.success(`Category "${cat.name}" restored`);
          refetch();
          queryClient.invalidateQueries({ queryKey: ["qa", "playbooks"] });
          queryClient.invalidateQueries({ queryKey: ["qa", "playbooks", "meta"] });
        } catch (error: any) {
          console.error(error);
          messageApi.error(
            error?.response?.data?.error || error?.message || "Failed to restore category"
          );
        }
      },
    });
  };

  const handleDeleteCategoryPermanent = (cat: TrashedCategoryGroup) => {
    modal.confirm({
      title: "Permanently delete category?",
      content: `"${cat.name}" and all ${cat.playbookCount} playbook(s) in it will be permanently deleted. This action cannot be undone.`,
      okText: "Delete permanently",
      okType: "danger",
      cancelText: "Cancel",
      centered: true,
      onOk: async () => {
        try {
          await axios.delete(`/api/v2/qa/playbooks/categories/${encodeURIComponent(cat.name)}/permanent`);
          messageApi.success(`Category "${cat.name}" permanently deleted`);
          refetch();
          queryClient.invalidateQueries({ queryKey: ["qa", "playbooks"] });
          queryClient.invalidateQueries({ queryKey: ["qa", "playbooks", "meta"] });
        } catch (error: any) {
          console.error(error);
          messageApi.error(
            error?.response?.data?.error || error?.message || "Failed to delete category permanently"
          );
        }
      },
    });
  };

  const visiblePlaybooks = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    return trashItems.filter((item) => {
      return (
        !q ||
        (item.name || "").toLowerCase().includes(q) ||
        (item.category || "").toLowerCase().includes(q) ||
        (item.summary || "").toLowerCase().includes(q)
      );
    });
  }, [trashItems, searchValue]);

  const visibleCategories = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    return trashedCategories.filter((cat) => {
      return (
        !q ||
        cat.name.toLowerCase().includes(q)
      );
    });
  }, [trashedCategories, searchValue]);

  const totalCount = trashItems.length;

  const TabPill: React.FC<{
    tab: TabKey;
    label: string;
    count: number;
  }> = ({ tab, label, count }) => {
    const active = activeTab === tab;
    const accent = tabAccent[tab];
    return (
      <button
        onClick={() => setActiveTab(tab)}
        className="flex-1 flex items-center justify-center gap-2 transition-all"
        style={{
          padding: "8px 12px",
          borderRadius: 9,
          border: "none",
          cursor: "pointer",
          fontSize: 12.5,
          fontWeight: 600,
          color: active ? "var(--text-slate-900)" : "var(--text-slate-600)",
          background: active ? "var(--bg-pure-white)" : "transparent",
          boxShadow: active ? "0 1px 3px rgba(15, 23, 42, 0.08)" : "none",
        }}
      >
        {label}
        <span
          className="text-[10.5px] font-bold uppercase tracking-wider px-1.5 py-[1px] rounded"
          style={{
            background: active ? accent.tint : "var(--bg-slate-100)",
            color: active ? accent.text : "var(--text-slate-400)",
          }}
        >
          {count}
        </span>
      </button>
    );
  };

  const renderLoading = () => (
    <div className="flex flex-col gap-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-2xl p-4"
          style={{
            border: "1px solid var(--border-slate-200)",
            background: "var(--bg-pure-white)",
          }}
        >
          <Skeleton avatar active paragraph={{ rows: 2 }} />
        </div>
      ))}
    </div>
  );

  return (
    <Drawer
      title={null}
      closable={false}
      placement="right"
      width={520}
      onClose={onClose}
      open={open}
      styles={{
        header: { display: "none" },
        body: { padding: 0, background: "var(--bg-pure-white)" },
        content: { background: "var(--bg-pure-white)" },
        mask: { backdropFilter: "blur(4px)", background: "rgba(15, 23, 42, 0.35)" },
      }}
    >
      {contextHolder}
      {modalContextHolder}

      {/* Hero header */}
      <div
        className="px-5 pt-5 pb-4"
        style={{
          background:
            "linear-gradient(135deg, rgba(239, 68, 68, 0.06) 0%, rgba(239, 68, 68, 0.02) 100%)",
          borderBottom: "1px solid var(--border-slate-200)",
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="flex items-center justify-center shrink-0 text-white"
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
              boxShadow:
                "0 4px 12px rgba(239, 68, 68, 0.32), inset 0 1px 0 rgba(255,255,255,0.18)",
            }}
          >
            <InboxOutlined style={{ fontSize: 18 }} />
          </div>
          <div className="flex-1 min-w-0">
            <h2
              className="text-[17px] font-bold tracking-tight m-0"
              style={{ color: "var(--text-slate-900)", letterSpacing: "-0.02em" }}
            >
              Playbooks Trash
            </h2>
            <p
              className="m-0 mt-0.5 text-[12.5px]"
              style={{ color: "var(--text-slate-400)" }}
            >
              {totalCount === 0
                ? "Trash bin is empty."
                : `${totalCount} ${totalCount === 1 ? "playbook" : "playbooks"} can be restored`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 flex items-center justify-center rounded-lg transition-colors"
            style={{
              width: 30,
              height: 30,
              color: "var(--text-slate-400)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-slate-100)";
              e.currentTarget.style.color = "var(--text-slate-700)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--text-slate-400)";
            }}
            aria-label="Close"
          >
            <CloseOutlined style={{ fontSize: 13 }} />
          </button>
        </div>

        {/* Search */}
        <div className="mt-4">
          <Input
            size="large"
            placeholder="Search trash…"
            prefix={<SearchOutlined style={{ color: "var(--text-slate-400)" }} />}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            allowClear
            style={{ borderRadius: 10, fontSize: 13 }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 pt-4">
        <div
          className="flex items-center p-1 rounded-xl"
          style={{
            background: "var(--bg-slate-50, #f8fafc)",
            border: "1px solid var(--border-slate-200, #e2e8f0)",
          }}
        >
          <TabPill tab="playbooks" label="Playbooks" count={trashItems.length} />
          <TabPill tab="categories" label="Categories" count={trashedCategories.length} />
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-4 flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-190px)]">
        {isLoading ? (
          renderLoading()
        ) : activeTab === "playbooks" ? (
          visiblePlaybooks.length === 0 ? (
            <div
              className="rounded-2xl py-10 mt-2"
              style={{
                border: "1px dashed var(--border-slate-200)",
                background: "var(--bg-pure-white)",
              }}
            >
              <NoData
                description={
                  <span style={{ color: "var(--text-slate-400)", fontSize: 13 }}>
                    {searchValue.trim()
                      ? "No matching playbooks in trash."
                      : "No trashed playbooks."}
                  </span>
                }
              />
            </div>
          ) : (
            visiblePlaybooks.map((item) => (
              <div
                key={item.id}
                className="group rounded-2xl p-4 transition-all duration-200"
                style={{
                  border: "1px solid var(--border-slate-200)",
                  background: "var(--bg-pure-white)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 24px rgba(59, 130, 246, 0.12)";
                  e.currentTarget.style.borderColor =
                    "var(--border-blue-200, #bfdbfe)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = "var(--border-slate-200)";
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Gradient icon */}
                  <div
                    className="flex items-center justify-center shrink-0 text-white"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: tabAccent.playbooks.gradient,
                      boxShadow: `0 4px 12px ${tabAccent.playbooks.shadow}, inset 0 1px 0 rgba(255,255,255,0.18)`,
                    }}
                  >
                    <BookOpen size={17} />
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4
                        className="text-[14px] font-semibold m-0 truncate tracking-tight"
                        style={{
                          color: "var(--text-slate-900)",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {item.name}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {item.category && (
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-[1px] rounded text-[10.5px] font-medium"
                          style={{
                            background: tabAccent.playbooks.tint,
                            color: tabAccent.playbooks.text,
                          }}
                        >
                          {item.category}
                        </span>
                      )}
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-medium"
                        style={{ color: "var(--text-slate-500)" }}
                      >
                        <Layers size={11} />
                        {item.itemCount} {item.itemCount === 1 ? "check" : "checks"}
                      </span>
                    </div>

                    <div
                      className="flex items-center gap-2 mt-2"
                      style={{ color: "var(--text-slate-400)" }}
                    >
                      <Avatar
                        size={18}
                        style={{
                          background: tabAccent.playbooks.tint,
                          color: tabAccent.playbooks.text,
                          fontSize: 9,
                        }}
                      >
                        {(item.deletedByName || "U").charAt(0).toUpperCase()}
                      </Avatar>
                      <span
                        className="text-[11.5px] font-medium"
                        style={{ color: "var(--text-slate-600)" }}
                      >
                        {item.deletedByName || "Unknown user"}
                      </span>
                      <span style={{ color: "var(--border-slate-200)" }}>·</span>
                      <Tooltip
                        title={item.deletedAt ? format(new Date(item.deletedAt), "PPp") : ""}
                      >
                        <span className="inline-flex items-center gap-1 text-[11.5px]">
                          <ClockCircleOutlined style={{ fontSize: 10 }} />
                          {item.deletedAt
                            ? formatDistanceToNow(new Date(item.deletedAt), { addSuffix: true })
                            : "Recently"}
                        </span>
                      </Tooltip>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {canCreateCase && (
                  <div
                    className="flex items-center justify-end gap-2 mt-3 pt-3"
                    style={{ borderTop: "1px solid var(--border-slate-200)" }}
                  >
                    <Button
                      size="small"
                      icon={<UndoOutlined />}
                      onClick={() => handleRestorePlaybook(item)}
                      style={{
                        borderRadius: 8,
                        height: 30,
                        fontSize: 12,
                        fontWeight: 600,
                        paddingInline: 12,
                        background: tabAccent.playbooks.gradient,
                        color: "#fff",
                        border: "none",
                        boxShadow: `0 2px 8px ${tabAccent.playbooks.shadow}, inset 0 1px 0 rgba(255,255,255,0.18)`,
                      }}
                    >
                      Restore
                    </Button>
                    <Button
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeletePlaybookPermanent(item)}
                      danger
                      style={{
                        borderRadius: 8,
                        height: 30,
                        fontSize: 12,
                        fontWeight: 600,
                        paddingInline: 12,
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            ))
          )
        ) : (
          /* Categories Tab */
          visibleCategories.length === 0 ? (
            <div
              className="rounded-2xl py-10 mt-2"
              style={{
                border: "1px dashed var(--border-slate-200)",
                background: "var(--bg-pure-white)",
              }}
            >
              <NoData
                description={
                  <span style={{ color: "var(--text-slate-400)", fontSize: 13 }}>
                    {searchValue.trim()
                      ? "No matching categories in trash."
                      : "No trashed categories."}
                  </span>
                }
              />
            </div>
          ) : (
            visibleCategories.map((cat) => (
              <div
                key={cat.name}
                className="group rounded-2xl p-4 transition-all duration-200"
                style={{
                  border: "1px solid var(--border-slate-200)",
                  background: "var(--bg-pure-white)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow =
                    `0 8px 24px ${tabAccent.categories.shadow}`;
                  e.currentTarget.style.borderColor = "#fdba74";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = "var(--border-slate-200)";
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Gradient icon */}
                  <div
                    className="flex items-center justify-center shrink-0 text-white"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: tabAccent.categories.gradient,
                      boxShadow: `0 4px 12px ${tabAccent.categories.shadow}, inset 0 1px 0 rgba(255,255,255,0.18)`,
                    }}
                  >
                    <FolderOutlined style={{ fontSize: 18 }} />
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4
                        className="text-[14px] font-semibold m-0 truncate tracking-tight"
                        style={{
                          color: "var(--text-slate-900)",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {cat.name}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-[1px] rounded text-[10.5px] font-medium"
                        style={{
                          background: tabAccent.categories.tint,
                          color: tabAccent.categories.text,
                        }}
                      >
                        <BookOpen size={11} />
                        {cat.playbookCount} {cat.playbookCount === 1 ? "playbook" : "playbooks"}
                      </span>
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-medium"
                        style={{ color: "var(--text-slate-500)" }}
                      >
                        <Layers size={11} />
                        {cat.totalItems} {cat.totalItems === 1 ? "check" : "checks"}
                      </span>
                    </div>

                    <div
                      className="flex items-center gap-2 mt-2"
                      style={{ color: "var(--text-slate-400)" }}
                    >
                      <Avatar
                        size={18}
                        style={{
                          background: tabAccent.categories.tint,
                          color: tabAccent.categories.text,
                          fontSize: 9,
                        }}
                      >
                        {(cat.deletedByName || "U").charAt(0).toUpperCase()}
                      </Avatar>
                      <span
                        className="text-[11.5px] font-medium"
                        style={{ color: "var(--text-slate-600)" }}
                      >
                        {cat.deletedByName || "Unknown user"}
                      </span>
                      <span style={{ color: "var(--border-slate-200)" }}>·</span>
                      <Tooltip
                        title={cat.latestDeletedAt ? format(new Date(cat.latestDeletedAt), "PPp") : ""}
                      >
                        <span className="inline-flex items-center gap-1 text-[11.5px]">
                          <ClockCircleOutlined style={{ fontSize: 10 }} />
                          {cat.latestDeletedAt
                            ? formatDistanceToNow(new Date(cat.latestDeletedAt), { addSuffix: true })
                            : "Recently"}
                        </span>
                      </Tooltip>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {canCreateCase && (
                  <div
                    className="flex items-center justify-end gap-2 mt-3 pt-3"
                    style={{ borderTop: "1px solid var(--border-slate-200)" }}
                  >
                    <Button
                      size="small"
                      icon={<UndoOutlined />}
                      onClick={() => handleRestoreCategory(cat)}
                      style={{
                        borderRadius: 8,
                        height: 30,
                        fontSize: 12,
                        fontWeight: 600,
                        paddingInline: 12,
                        background: tabAccent.categories.gradient,
                        color: "#fff",
                        border: "none",
                        boxShadow: `0 2px 8px ${tabAccent.categories.shadow}, inset 0 1px 0 rgba(255,255,255,0.18)`,
                      }}
                    >
                      Restore all
                    </Button>
                    <Button
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteCategoryPermanent(cat)}
                      danger
                      style={{
                        borderRadius: 8,
                        height: 30,
                        fontSize: 12,
                        fontWeight: 600,
                        paddingInline: 12,
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            ))
          )
        )}
      </div>
    </Drawer>
  );
}
