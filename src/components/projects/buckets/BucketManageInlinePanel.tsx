"use client";

import React, { useState, useMemo } from "react";
import {
  Avatar,
  Button,
  Checkbox,
  Empty,
  Input,
  Modal,
  Pagination,
  Popconfirm,
  Popover,
  Select,
  Skeleton,
  Tooltip,
  Typography,
  Badge,
  Divider,
  App,
} from "antd";
import {
  CalendarOutlined,
  CloseOutlined,
  CrownOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileTextOutlined,
  FilterOutlined,
  FlagOutlined,
  InfoCircleOutlined,
  MailOutlined,
  ProjectOutlined,
  RocketOutlined,
  RollbackOutlined,
  SearchOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  UserAddOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useBucket,
  useBucketTickets,
  useRemoveBucketMember,
  bucketKeys,
} from "@/hooks/useBuckets";
import { BucketMemberManager } from "./BucketMemberManager";
import { TicketDetailDrawer } from "@/components/projects/drawer/TicketDetailDrawer";
import { useAvailableSprints } from "@/hooks/useAvailableSprints";
import { useUserProjects } from "@/hooks/useGlobalData";
import TicketService from "@/services/ticketService";
import { ticketKeys } from "@/hooks/useTickets";
import { SearchableDropdown, SearchableDropdownOption } from "@/components/common/SearchableDropdown";

const { Text } = Typography;

interface BucketManageInlinePanelProps {
  bucketId: string;
  accent: string;
  onClose: () => void;
  /** When true, render flush inside the parent card (no own border / stripe / connector). */
  nested?: boolean;
}

type TabKey = "overview" | "tickets" | "members";

const STATUS_CFG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  completed: { color: "#047857", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.22)", label: "Completed" },
  in_progress: { color: "#1d4ed8", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.22)", label: "In Progress" },
  in_testing: { color: "#b45309", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.22)", label: "In Testing" },
  not_started: { color: "#475569", bg: "rgba(100,116,139,0.08)", border: "rgba(100,116,139,0.22)", label: "Not Started" },
};

const PRIORITY_CFG: Record<string, { color: string; bg: string; border: string }> = {
  P1: { color: "#b91c1c", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.22)" },
  P2: { color: "#b45309", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.22)" },
  P3: { color: "#047857", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.22)" },
};

const initialsOf = (name?: string) =>
  (name || "?")
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

export function BucketManageInlinePanel({
  bucketId,
  accent,
  onClose,
  nested = false,
}: BucketManageInlinePanelProps) {
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>("tickets");
  const [memberManagerOpen, setMemberManagerOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [openTicketId, setOpenTicketId] = useState<string | null>(null);
  const [selectedTicketIds, setSelectedTicketIds] = useState<Set<string>>(new Set());
  const [sprintPopoverOpen, setSprintPopoverOpen] = useState(false);
  const [sprintTargetProjectId, setSprintTargetProjectId] = useState<string | undefined>();
  const [selectedSprintId, setSelectedSprintId] = useState<string | undefined>();

  const { data: bucket, isLoading, refetch } = useBucket(bucketId, true);
  const {
    data: ticketsData,
    isLoading: ticketsLoading,
  } = useBucketTickets(bucketId, page, pageSize);

  const { data: projects } = useUserProjects();
  const removeMember = useRemoveBucketMember();

  // Sprint target project — default to bucket project if available, else require user pick
  React.useEffect(() => {
    if (bucket?.projectId && !sprintTargetProjectId) {
      setSprintTargetProjectId(bucket.projectId);
    }
  }, [bucket?.projectId, sprintTargetProjectId]);

  const { data: availableSprints, isLoading: sprintsLoading } = useAvailableSprints(sprintTargetProjectId);

  const invalidateBucketAndTickets = () => {
    queryClient.invalidateQueries({ queryKey: bucketKeys.all });
    queryClient.invalidateQueries({ queryKey: ticketKeys.all });
  };

  const bulkMoveToSprintMutation = useMutation({
    mutationFn: async ({ ticketIds, sprintId }: { ticketIds: string[]; sprintId: string }) => {
      await Promise.all(
        ticketIds.map((id) =>
          TicketService.updateTicket(id, { releasePlan: sprintId, bucketId: null })
        )
      );
    },
    onSuccess: (_, vars) => {
      message.success(`${vars.ticketIds.length} ticket(s) moved to sprint`);
      setSelectedTicketIds(new Set());
      setSprintPopoverOpen(false);
      setSelectedSprintId(undefined);
      invalidateBucketAndTickets();
    },
    onError: (err: any) => message.error(err.message || "Failed to move to sprint"),
  });

  const bulkMoveToBacklogMutation = useMutation({
    mutationFn: async (ticketIds: string[]) => {
      await Promise.all(
        ticketIds.map((id) =>
          TicketService.updateTicket(id, { releasePlan: null })
        )
      );
    },
    onSuccess: (_, ticketIds) => {
      message.success(`${ticketIds.length} ticket(s) moved to backlog`);
      setSelectedTicketIds(new Set());
      invalidateBucketAndTickets();
    },
    onError: (err: any) => message.error(err.message || "Failed to move to backlog"),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ticketIds: string[]) => TicketService.bulkDelete(ticketIds),
    onSuccess: (_, ticketIds) => {
      message.success(`${ticketIds.length} ticket(s) moved to trash`);
      setSelectedTicketIds(new Set());
      invalidateBucketAndTickets();
    },
    onError: (err: any) => message.error(err.message || "Failed to move to trash"),
  });

  const tickets = ticketsData?.tickets || [];
  const ticketIds = tickets.map((t) => t.id);

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter && t.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!t.title.toLowerCase().includes(q) && !t.ticketNumber.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const statusCounts = tickets.reduce<Record<string, number>>((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  const statusOptions = useMemo<SearchableDropdownOption[]>(
    () =>
      Object.entries(statusCounts).map(([s, n]) => {
        const cfg = STATUS_CFG[s] || {
          color: "#475569",
          bg: "rgba(100,116,139,0.08)",
          border: "rgba(100,116,139,0.22)",
          label: s.replace(/_/g, " "),
        };
        return {
          value: s,
          label: cfg.label,
          description: `${n} ticket${n === 1 ? "" : "s"}`,
          badge: (
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: 999,
                background: cfg.bg,
                border: `1px solid ${cfg.border}`,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: cfg.color,
                }}
              />
            </span>
          ),
        };
      }),
    [statusCounts]
  );

  const visibleTicketIds = useMemo(() => filteredTickets.map((t) => t.id), [filteredTickets]);
  const selectedCount = selectedTicketIds.size;
  const allVisibleSelected =
    visibleTicketIds.length > 0 && visibleTicketIds.every((id) => selectedTicketIds.has(id));
  const someVisibleSelected =
    !allVisibleSelected && visibleTicketIds.some((id) => selectedTicketIds.has(id));

  const toggleTicket = (id: string) => {
    setSelectedTicketIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleAllVisible = () => {
    setSelectedTicketIds((prev) => {
      if (allVisibleSelected) {
        const next = new Set(prev);
        visibleTicketIds.forEach((id) => next.delete(id));
        return next;
      }
      const next = new Set(prev);
      visibleTicketIds.forEach((id) => next.add(id));
      return next;
    });
  };
  const clearSelection = () => setSelectedTicketIds(new Set());

  const handleBulkMoveToSprint = () => {
    if (!selectedSprintId || selectedCount === 0) return;
    bulkMoveToSprintMutation.mutate({
      ticketIds: Array.from(selectedTicketIds),
      sprintId: selectedSprintId,
    });
  };
  const handleBulkMoveToBacklog = () => {
    if (selectedCount === 0) return;
    modal.confirm({
      title: "Move to backlog",
      content: `Remove ${selectedCount} ticket(s) from their sprint and move to backlog?`,
      okText: "Move",
      onOk: () => bulkMoveToBacklogMutation.mutate(Array.from(selectedTicketIds)),
    });
  };
  const handleBulkDelete = () => {
    if (selectedCount === 0) return;
    modal.confirm({
      title: "Move to trash",
      content: `Move ${selectedCount} selected ticket(s) to trash? You can restore them later from the trash page.`,
      okText: "Move to Trash",
      okType: "danger",
      onOk: () => bulkDeleteMutation.mutate(Array.from(selectedTicketIds)),
    });
  };

  const sprintPopoverContent = (
    <div className="bmp-sprint-pop">
      <div className="bmp-sprint-pop-head">
        <div
          className="bmp-sprint-pop-icon"
          style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}
        >
          <RocketOutlined />
        </div>
        <div>
          <div className="bmp-sprint-pop-title">Move to Sprint</div>
          <div className="bmp-sprint-pop-sub">
            Reassign {selectedCount} ticket(s) to an active or planning sprint.
          </div>
        </div>
      </div>
      <Divider style={{ margin: "10px 0" }} />
      {!bucket?.projectId && (
        <div className="bmp-sprint-pop-field">
          <span className="bmp-sprint-pop-label">
            <ProjectOutlined style={{ fontSize: 9 }} /> Target project
          </span>
          <Select
            placeholder="Select project"
            size="small"
            style={{ width: "100%" }}
            value={sprintTargetProjectId}
            onChange={(v) => {
              setSprintTargetProjectId(v);
              setSelectedSprintId(undefined);
            }}
          >
            {projects?.map((p: any) => (
              <Select.Option key={p.value} value={p.value}>
                {p.label}
              </Select.Option>
            ))}
          </Select>
        </div>
      )}
      <div className="bmp-sprint-pop-field">
        <span className="bmp-sprint-pop-label">
          <ThunderboltOutlined style={{ fontSize: 9 }} /> Target sprint
        </span>
        <Select
          placeholder={sprintsLoading ? "Loading sprints…" : "Select sprint"}
          size="small"
          style={{ width: "100%" }}
          value={selectedSprintId}
          onChange={setSelectedSprintId}
          disabled={!sprintTargetProjectId || sprintsLoading}
          notFoundContent={
            sprintTargetProjectId && !sprintsLoading ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No available sprints" />
            ) : null
          }
        >
          {availableSprints?.map((s) => (
            <Select.Option key={s.id} value={s.id}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Badge status={s.status === "active" ? "processing" : "default"} />
                <span style={{ fontSize: 12, fontWeight: 600 }}>{s.version}</span>
                {s.status === "active" && (
                  <span className="bmp-sprint-pop-badge">ACTIVE</span>
                )}
              </span>
            </Select.Option>
          ))}
        </Select>
      </div>
      <div className="bmp-sprint-pop-preview">
        <span>
          <FileTextOutlined style={{ color: accent }} /> <b>{selectedCount}</b> ticket(s)
        </span>
        <Tooltip title="Selected tickets will be reassigned to the chosen sprint.">
          <InfoCircleOutlined style={{ color: "#94a3b8" }} />
        </Tooltip>
      </div>
      <Button
        type="primary"
        block
        size="small"
        disabled={!selectedSprintId}
        loading={bulkMoveToSprintMutation.isPending}
        onClick={handleBulkMoveToSprint}
        style={{
          fontWeight: 700,
          background: `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)`,
          border: "none",
        }}
      >
        Move to Sprint
      </Button>
    </div>
  );

  const handleRemoveMember = async (userId: string) => {
    if (!bucket) return;
    try {
      await removeMember.mutateAsync({ bucketId: bucket.id, userId });
      message.success("Member removed");
      refetch();
    } catch (e: any) {
      message.error(e.message || "Failed to remove member");
    }
  };

  const memberCount =
    bucket?._count?.members || bucket?.members?.length || 0;
  const ticketTotal = ticketsData?.pagination.total ?? bucket?._count?.tickets ?? 0;

  return (
    <>
      <section
        className={`bmp-panel ${nested ? "bmp-panel-nested" : ""}`}
        style={{ ["--accent" as any]: accent }}
      >
        {!nested && (
          <>
            <span className="bmp-panel-stripe" style={{ background: accent }} />
            <span className="bmp-panel-connector" />
          </>
        )}

        {/* Tabs row removed per user request */}        {/* Body */}
        <div className="bmp-body">
          {activeTab === "tickets" && (
            <div className="bmp-tickets">
              {/* Toolbar — bulk-actions when selection, otherwise filters+search */}
              {selectedCount > 0 ? (
                <div className="bmp-bulk-bar" style={{ borderColor: `${accent}3a` }}>
                  <div className="bmp-bulk-left">
                    <Checkbox
                      checked={allVisibleSelected}
                      indeterminate={someVisibleSelected}
                      onChange={toggleAllVisible}
                    />
                    <span className="bmp-bulk-count" style={{ color: accent }}>
                      {selectedCount} selected
                    </span>
                    <button className="bmp-bulk-clear" onClick={clearSelection}>
                      Clear
                    </button>
                  </div>
                  <div className="bmp-bulk-actions">
                    <Popover
                      content={sprintPopoverContent}
                      title={null}
                      trigger="click"
                      open={sprintPopoverOpen}
                      onOpenChange={setSprintPopoverOpen}
                      placement="bottomRight"
                      overlayInnerStyle={{ borderRadius: 12, padding: 12, width: 300 }}
                    >
                      <Button
                        size="small"
                        type="primary"
                        icon={<RocketOutlined />}
                        loading={bulkMoveToSprintMutation.isPending}
                        style={{
                          fontWeight: 700,
                          background: `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)`,
                          border: "none",
                        }}
                      >
                        Move to Sprint
                      </Button>
                    </Popover>
                    <Button
                      size="small"
                      icon={<RollbackOutlined />}
                      onClick={handleBulkMoveToBacklog}
                      loading={bulkMoveToBacklogMutation.isPending}
                      style={{ fontWeight: 700 }}
                    >
                      Move to Backlog
                    </Button>
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={handleBulkDelete}
                      loading={bulkDeleteMutation.isPending}
                      style={{ fontWeight: 700 }}
                    >
                      Move to Trash
                    </Button>
                  </div>
                  <Tooltip title="Close">
                    <Button
                      type="text"
                      icon={<CloseOutlined style={{ fontSize: 13, color: "var(--text-slate-500)" }} />}
                      onClick={onClose}
                      className="bmp-panel-close-toolbar"
                      style={{ marginLeft: 8 }}
                    />
                  </Tooltip>
                </div>
              ) : (
                <div className="bmp-tickets-toolbar">
                  <div className="bmp-toolbar-left">
                    {visibleTicketIds.length > 0 && (
                      <Tooltip title="Select all on this page">
                        <span className="bmp-bulk-select-all">
                          <Checkbox
                            checked={false}
                            indeterminate={false}
                            onChange={toggleAllVisible}
                          />
                        </span>
                      </Tooltip>
                    )}
                    <span className="bmp-toolbar-count">
                      <b>{filteredTickets.length}</b> of <b>{tickets.length}</b>{" "}
                      {tickets.length === 1 ? "ticket" : "tickets"}
                    </span>
                    <SearchableDropdown
                      placeholder="All statuses"
                      options={statusOptions}
                      value={statusFilter || undefined}
                      onChange={(v) => setStatusFilter(v || null)}
                      itemNoun="statuses"
                      style={{ height: 30, minWidth: 160, borderRadius: 8 }}
                      width={240}
                    />
                  </div>
                  <div className={`bmp-search ${search ? "active" : ""}`}>
                    <SearchOutlined style={{ color: search ? accent : "#94a3b8", fontSize: 12 }} />
                    <Input
                      placeholder="Search tickets…"
                      variant="borderless"
                      style={{ fontSize: 12, padding: "2px 0", background: "transparent" }}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      allowClear
                    />
                  </div>
                  <Tooltip title="Close">
                    <Button
                      type="text"
                      icon={<CloseOutlined style={{ fontSize: 13, color: "var(--text-slate-500)" }} />}
                      onClick={onClose}
                      className="bmp-panel-close-toolbar"
                      style={{ marginLeft: 8 }}
                    />
                  </Tooltip>
                </div>
              )}

              {/* List */}
              {ticketsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bmp-ticket-row bmp-ticket-row-skel">
                    <Skeleton active paragraph={{ rows: 1 }} />
                  </div>
                ))
              ) : filteredTickets.length === 0 ? (
                <div className="bmp-empty-block">
                  <FileTextOutlined style={{ fontSize: 22, color: accent, opacity: 0.7 }} />
                  <Text style={{ fontSize: 12.5, color: "var(--text-slate-500)", marginTop: 8 }}>
                    {tickets.length === 0 ? "No tickets in this bucket yet" : "No matches for filters"}
                  </Text>
                </div>
              ) : (
                <div className="bmp-ticket-list">
                  {filteredTickets.map((t) => {
                    const statusCfg = STATUS_CFG[t.status] || {
                      color: "#475569",
                      bg: "rgba(100,116,139,0.08)",
                      border: "rgba(100,116,139,0.22)",
                      label: t.status,
                    };
                    const prioCfg = PRIORITY_CFG[t.priority];
                    const isSelected = selectedTicketIds.has(t.id);
                    return (
                      <div
                        key={t.id}
                        className={`bmp-ticket-row ${isSelected ? "selected" : ""}`}
                        style={isSelected ? { borderColor: "#3b82f6", background: `rgba(59, 130, 246, 0.08)` } : undefined}
                      >
                        <span
                          className="bmp-ticket-check"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={isSelected}
                            onChange={() => toggleTicket(t.id)}
                          />
                        </span>
                        <button
                          type="button"
                          className="bmp-ticket-clickable"
                          onClick={() => setOpenTicketId(t.id)}
                        >
                          <span className="bmp-ticket-num">{t.ticketNumber}</span>
                          <span className="bmp-ticket-title" title={t.title}>
                            {t.title}
                          </span>
                          <span className="bmp-ticket-meta">
                            {t.assignee ? (
                              <Tooltip title={t.assignee.workEmail || t.assignee.name}>
                                <span className="bmp-ticket-assignee">
                                  {t.assignee.avatarUrl ? (
                                    <Avatar
                                      src={t.assignee.avatarUrl}
                                      size={26}
                                      className="bmp-assignee-avatar"
                                    />
                                  ) : (
                                    <Avatar
                                      size={26}
                                      className="bmp-assignee-avatar"
                                    >
                                      {initialsOf(t.assignee.name)}
                                    </Avatar>
                                  )}
                                  <span className="bmp-ticket-assignee-name">
                                    {t.assignee.name}
                                  </span>
                                </span>
                              </Tooltip>
                            ) : (
                              <span className="bmp-ticket-assignee unassigned">
                                <span className="bmp-ticket-unassigned">
                                  <UserOutlined style={{ fontSize: 9 }} />
                                </span>
                                <span className="bmp-ticket-assignee-name muted">
                                  Unassigned
                                </span>
                              </span>
                            )}
                            {prioCfg && (
                              <span
                                className="bmp-ticket-prio"
                                style={{ background: prioCfg.bg, borderColor: prioCfg.border, color: prioCfg.color }}
                              >
                                <FlagOutlined style={{ fontSize: 8 }} />
                                {t.priority}
                              </span>
                            )}
                            <span
                              className="bmp-ticket-status"
                              style={{
                                background: statusCfg.bg,
                                borderColor: statusCfg.border,
                                color: statusCfg.color,
                              }}
                            >
                              <span className="bmp-ticket-status-dot" style={{ background: statusCfg.color }} />
                              {statusCfg.label}
                            </span>
                            <span className="bmp-ticket-eye">
                              <EyeOutlined style={{ fontSize: 12 }} />
                            </span>
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {!ticketsLoading && ticketsData && ticketsData.pagination.total > 0 && (
                <div className="bmp-pagination">
                  <Text style={{ fontSize: 11.5, color: "var(--text-slate-500)" }}>
                    <b style={{ color: "var(--text-slate-800)" }}>
                      {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, ticketsData.pagination.total)}
                    </b>{" "}
                    of <b style={{ color: "var(--text-slate-800)" }}>{ticketsData.pagination.total}</b>
                  </Text>
                  <Pagination
                    current={page}
                    pageSize={pageSize}
                    total={ticketsData.pagination.total}
                    onChange={(p, s) => {
                      setPage(p);
                      setPageSize(s);
                    }}
                    showSizeChanger
                    size="small"
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === "members" && (
            <div className="bmp-members">
              <div className="bmp-members-toolbar">
                <Text style={{ fontSize: 12, color: "var(--text-slate-500)", fontWeight: 600 }}>
                  <FilterOutlined style={{ fontSize: 11, marginRight: 6 }} />
                  {memberCount} {memberCount === 1 ? "member" : "members"}
                </Text>
                <Button
                  type="primary"
                  size="small"
                  icon={<UserAddOutlined />}
                  onClick={() => setMemberManagerOpen(true)}
                  style={{
                    fontWeight: 700,
                    background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                    border: "none",
                  }}
                >
                  Add Members
                </Button>
              </div>

              {isLoading ? (
                <Skeleton active paragraph={{ rows: 4 }} />
              ) : !bucket?.members || bucket.members.length === 0 ? (
                <div className="bmp-empty-block">
                  <TeamOutlined style={{ fontSize: 22, color: accent, opacity: 0.7 }} />
                  <Text style={{ fontSize: 12.5, color: "var(--text-slate-500)", marginTop: 8 }}>
                    No members yet
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color: "var(--text-slate-400)",
                      marginTop: 2,
                      maxWidth: 280,
                      textAlign: "center",
                    }}
                  >
                    Invite collaborators to share this bucket and assign tickets.
                  </Text>
                </div>
              ) : (
                <div className="bmp-member-list">
                  {bucket.members.map((m) => (
                    <div key={m.id} className="bmp-member-row">
                      <Avatar
                        size={32}
                        style={{
                          background: `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)`,
                          fontSize: 12,
                          fontWeight: 800,
                        }}
                      >
                        {initialsOf(m.user?.name)}
                      </Avatar>
                      <div className="bmp-member-info">
                        <span className="bmp-member-name">{m.user?.name || "Unknown"}</span>
                        <span className="bmp-member-email">
                          <MailOutlined style={{ fontSize: 9, marginRight: 4 }} />
                          {m.user?.workEmail}
                        </span>
                      </div>
                      <span
                        className={`bmp-member-role bmp-role-${m.role}`}
                      >
                        {m.role === "owner" && <CrownOutlined style={{ fontSize: 9, marginRight: 4 }} />}
                        {m.role.toUpperCase()}
                      </span>
                      {m.role !== "owner" && (
                        <Popconfirm
                          title="Remove member?"
                          onConfirm={() => handleRemoveMember(m.userId)}
                          okText="Remove"
                          cancelText="Cancel"
                          okButtonProps={{ danger: true }}
                        >
                          <Tooltip title="Remove member">
                            <Button
                              type="text"
                              size="small"
                              danger
                              icon={<DeleteOutlined style={{ fontSize: 13 }} />}
                              loading={
                                removeMember.isPending &&
                                removeMember.variables?.userId === m.userId
                              }
                            />
                          </Tooltip>
                        </Popconfirm>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "overview" && (
            <div className="bmp-overview">
              {isLoading || !bucket ? (
                <Skeleton active paragraph={{ rows: 5 }} />
              ) : (
                <>
                  <div className="bmp-overview-card">
                    <div className="bmp-overview-card-head">
                      <FileTextOutlined style={{ fontSize: 11, color: accent }} />
                      <span>Description</span>
                    </div>
                    <div className="bmp-overview-card-body">
                      {bucket.description || (
                        <span className="bmp-muted">No description provided</span>
                      )}
                    </div>
                  </div>

                  <div className="bmp-overview-grid">
                    <div className="bmp-overview-card">
                      <div className="bmp-overview-card-head">
                        <CrownOutlined style={{ fontSize: 11, color: accent }} />
                        <span>Created by</span>
                      </div>
                      <div className="bmp-overview-card-body bmp-owner-row">
                        <Avatar
                          size={32}
                          style={{
                            background: `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)`,
                            fontSize: 12,
                            fontWeight: 800,
                          }}
                        >
                          {initialsOf(bucket.createdBy?.name)}
                        </Avatar>
                        <div>
                          <div className="bmp-overview-strong">{bucket.createdBy?.name || "—"}</div>
                          {bucket.createdBy?.workEmail && (
                            <div className="bmp-muted" style={{ fontSize: 11 }}>
                              {bucket.createdBy.workEmail}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bmp-overview-card">
                      <div className="bmp-overview-card-head">
                        <CalendarOutlined style={{ fontSize: 11, color: accent }} />
                        <span>Activity</span>
                      </div>
                      <div className="bmp-overview-card-body">
                        <div className="bmp-overview-line">
                          <span className="bmp-overview-line-label">Created</span>
                          <span className="bmp-overview-strong">
                            {dayjs(bucket.createdAt).format("MMM D, YYYY")}
                          </span>
                        </div>
                        <div className="bmp-overview-line">
                          <span className="bmp-overview-line-label">Updated</span>
                          <span className="bmp-overview-strong">
                            {dayjs(bucket.updatedAt).fromNow()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {bucket && (
        <BucketMemberManager
          bucketId={bucket.id}
          open={memberManagerOpen}
          onClose={() => setMemberManagerOpen(false)}
          onSuccess={() => {
            setMemberManagerOpen(false);
            refetch();
          }}
        />
      )}

      {openTicketId && (
        <TicketDetailDrawer
          ticketId={openTicketId}
          open={!!openTicketId}
          onClose={() => setOpenTicketId(null)}
          ticketIds={ticketIds}
          onNavigate={(id) => setOpenTicketId(id)}
        />
      )}

      <style jsx global>{`
        /* ── Inline manage panel (child card) ────────────────────── */
        .bmp-panel {
          position: relative;
          margin: -6px 0 0 28px;
          background: var(--bg-slate-50);
          border: 1px solid var(--border-slate-200);
          border-top-left-radius: 4px;
          border-top-right-radius: 14px;
          border-bottom-left-radius: 14px;
          border-bottom-right-radius: 14px;
          padding: 14px 18px 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          overflow: hidden;
          animation: bmp-slide-in 0.24s ease-out;
        }
        [data-theme="dark"] .bmp-panel {
          background: #131820 !important;
          border-color: #1f2937 !important;
        }
        @keyframes bmp-slide-in {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .bmp-panel-stripe {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          opacity: 0.85;
        }
        /* Nested-in-parent variant: no own border / stripe / margins */
        .bmp-panel-nested {
          margin: 0;
          padding: 0;
          background: transparent;
          border: none;
          border-radius: 0;
          overflow: visible;
        }
        [data-theme="dark"] .bmp-panel-nested {
          background: transparent !important;
          border: none !important;
        }

        /* L-shaped connector that visually ties child to parent */
        .bmp-panel-connector {
          position: absolute;
          left: -16px;
          top: -6px;
          width: 16px;
          height: 28px;
          border-left: 2px solid var(--border-slate-200);
          border-bottom: 2px solid var(--border-slate-200);
          border-bottom-left-radius: 10px;
          pointer-events: none;
        }
        [data-theme="dark"] .bmp-panel-connector {
          border-color: #2d3748 !important;
        }

        .bmp-tabs-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .bmp-panel-close {
          width: 28px;
          height: 28px;
          border-radius: 7px !important;
          padding: 0 !important;
          color: var(--text-slate-500) !important;
        }
        .bmp-panel-close:hover {
          color: var(--accent, #3b82f6) !important;
        }

        /* Tabs */
        .bmp-tabs {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 10px;
        }
        [data-theme="dark"] .bmp-tabs {
          background: #0f1419 !important;
          border-color: #2d3748 !important;
        }
        .bmp-tab {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 7px;
          cursor: pointer;
          font-family: inherit;
          font-size: 12px;
          font-weight: 700;
          color: var(--text-slate-500);
          transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease;
        }
        .bmp-tab:hover {
          color: var(--text-slate-800);
        }
        [data-theme="dark"] .bmp-tab {
          color: #94a3b8 !important;
        }
        [data-theme="dark"] .bmp-tab:hover {
          color: #e2e8f0 !important;
        }
        .bmp-tab.active {
          background: rgba(59, 130, 246, 0.08);
          border-color: rgba(59, 130, 246, 0.22);
          color: var(--accent, #3b82f6);
        }
        [data-theme="dark"] .bmp-tab.active {
          background: rgba(59, 130, 246, 0.16) !important;
          border-color: rgba(59, 130, 246, 0.3) !important;
          color: var(--accent, #60a5fa) !important;
        }
        .bmp-tab-icon {
          display: inline-flex;
          align-items: center;
          font-size: 11px;
        }
        .bmp-tab-count {
          font-size: 10px;
          font-weight: 700;
          background: var(--border-slate-100);
          color: var(--text-slate-500);
          padding: 0 6px;
          border-radius: 999px;
          line-height: 1.6;
          font-variant-numeric: tabular-nums;
        }
        [data-theme="dark"] .bmp-tab-count {
          background: #1c232e !important;
          color: #94a3b8 !important;
        }
        .bmp-tab.active .bmp-tab-count {
          background: var(--accent, #3b82f6);
          color: #fff;
        }

        /* Body */
        .bmp-body {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* Tickets tab wrapper — vertical rhythm between toolbar / list / pagination */
        .bmp-tickets {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        /* Tickets toolbar */
        .bmp-tickets-toolbar {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .bmp-toolbar-left {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          flex: 1;
          min-width: 0;
        }
        .bmp-toolbar-count {
          font-size: 11.5px;
          font-weight: 600;
          color: var(--text-slate-500);
          letter-spacing: -0.005em;
        }
        .bmp-toolbar-count b {
          color: var(--text-slate-900);
          font-weight: 800;
        }
        [data-theme="dark"] .bmp-toolbar-count b {
          color: #f1f5f9 !important;
        }

        .bmp-search {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 4px 12px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 8px;
          flex-shrink: 0;
          width: 240px;
          transition: border-color 0.15s ease;
        }
        .bmp-search.active {
          border-color: var(--accent, #3b82f6);
        }
        [data-theme="dark"] .bmp-search {
          background: #0f1419 !important;
          border-color: #2d3748 !important;
        }

        /* Ticket list */
        .bmp-ticket-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .bmp-ticket-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 12px 6px 10px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 0px;
          font-family: inherit;
          text-align: left;
          transition: border-color 0.12s ease, background 0.12s ease;
        }
        .bmp-ticket-row:hover {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.04);
        }
        [data-theme="dark"] .bmp-ticket-row {
          background: #1c232e !important;
          border-color: #2d3748 !important;
        }
        [data-theme="dark"] .bmp-ticket-row:hover {
          background: #0f1419 !important;
          border-color: #1d4ed8 !important;
        }
        .bmp-ticket-row.selected {
          border-width: 1.5px;
        }
        .bmp-ticket-row-skel {
          padding: 12px;
        }
        .bmp-ticket-check {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          padding: 4px 2px 4px 4px;
        }
        .bmp-ticket-clickable {
          flex: 1;
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 4px 0;
          background: transparent;
          border: none;
          cursor: pointer;
          font-family: inherit;
          text-align: left;
          outline: none;
        }
        .bmp-ticket-clickable:focus-visible {
          outline: 2px solid rgba(59, 130, 246, 0.3);
          outline-offset: 2px;
          border-radius: 6px;
        }
        .bmp-ticket-row:hover .bmp-ticket-eye {
          color: var(--accent, #3b82f6);
        }
        .bmp-ticket-num {
          font-size: 10.5px;
          font-weight: 800;
          font-variant-numeric: tabular-nums;
          padding: 2px 8px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 6px;
          color: var(--text-slate-600);
          flex-shrink: 0;
          letter-spacing: 0.01em;
        }
        [data-theme="dark"] .bmp-ticket-num {
          background: #0f1419 !important;
          border-color: #2d3748 !important;
          color: #cbd5e1 !important;
        }
        .bmp-ticket-title {
          flex: 1;
          min-width: 0;
          font-size: 12.5px;
          font-weight: 600;
          color: var(--text-slate-800);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        [data-theme="dark"] .bmp-ticket-title {
          color: #e2e8f0 !important;
        }
        .bmp-ticket-meta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .bmp-ticket-prio,
        .bmp-ticket-status {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          border-radius: 999px;
          border: 1px solid;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.01em;
        }
        .bmp-ticket-status-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
        }
        .bmp-ticket-unassigned {
          width: 20px;
          height: 20px;
          border-radius: 999px;
          background: var(--bg-pure-white);
          border: 1px dashed var(--border-slate-200);
          color: var(--text-slate-400);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        [data-theme="dark"] .bmp-ticket-unassigned {
          background: #0f1419 !important;
          border-color: #2d3748 !important;
        }
        .bmp-ticket-assignee {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 2px 10px 2px 3px;
          background: var(--bg-slate-50);
          border: 1px solid var(--border-slate-200);
          border-radius: 999px;
          max-width: 180px;
        }
        .bmp-ticket-assignee.unassigned {
          background: transparent;
          border-style: dashed;
        }
        [data-theme="dark"] .bmp-ticket-assignee {
          background: #1c232e !important;
          border-color: #2d3748 !important;
        }
        .bmp-ticket-assignee-name {
          font-size: 11.5px;
          font-weight: 700;
          color: var(--text-slate-700);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 130px;
          letter-spacing: -0.005em;
        }
        [data-theme="dark"] .bmp-ticket-assignee-name {
          color: #cbd5e1 !important;
        }
        .bmp-ticket-assignee-name.muted {
          color: var(--text-slate-400);
          font-style: italic;
          font-weight: 600;
        }
        .bmp-ticket-eye {
          color: var(--text-slate-400);
          display: inline-flex;
          align-items: center;
        }

        /* Bulk action bar */
        .bmp-bulk-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 8px 12px;
          background: var(--bg-pure-white);
          border: 1.5px solid;
          border-radius: 10px;
          flex-wrap: wrap;
        }
        [data-theme="dark"] .bmp-bulk-bar {
          background: #0f1419 !important;
        }
        .bmp-bulk-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .bmp-bulk-count {
          font-size: 12.5px;
          font-weight: 800;
          letter-spacing: -0.005em;
        }
        .bmp-bulk-clear {
          background: transparent;
          border: none;
          color: var(--text-slate-500);
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 3px;
          padding: 2px 4px;
        }
        .bmp-bulk-clear:hover {
          color: var(--text-slate-700);
        }
        .bmp-bulk-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .bmp-bulk-select-all {
          display: inline-flex;
          align-items: center;
          padding: 2px 10px 2px 14px;
          margin-right: 2px;
        }

        /* Sprint popover */
        .bmp-sprint-pop {
          width: 280px;
        }
        .bmp-sprint-pop-head {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        .bmp-sprint-pop-icon {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 14px;
          flex-shrink: 0;
        }
        .bmp-sprint-pop-title {
          font-size: 13px;
          font-weight: 800;
          color: var(--text-slate-900);
          letter-spacing: -0.01em;
        }
        [data-theme="dark"] .bmp-sprint-pop-title {
          color: #f1f5f9 !important;
        }
        .bmp-sprint-pop-sub {
          font-size: 11px;
          color: var(--text-slate-500);
          line-height: 1.4;
          margin-top: 1px;
        }
        .bmp-sprint-pop-field {
          margin-bottom: 10px;
        }
        .bmp-sprint-pop-label {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 9.5px;
          font-weight: 800;
          color: var(--text-slate-500);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 5px;
        }
        .bmp-sprint-pop-preview {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 7px 10px;
          background: var(--bg-slate-50);
          border: 1px solid var(--border-slate-100);
          border-radius: 6px;
          margin-bottom: 10px;
          font-size: 11.5px;
          color: var(--text-slate-700);
        }
        [data-theme="dark"] .bmp-sprint-pop-preview {
          background: #1c232e !important;
          border-color: #2d3748 !important;
          color: #cbd5e1 !important;
        }
        .bmp-sprint-pop-badge {
          font-size: 8px;
          font-weight: 900;
          background: #ecfdf5;
          color: #059669;
          padding: 1px 4px;
          border-radius: 3px;
          border: 1px solid #d1fae5;
          line-height: 1;
        }

        /* Pagination */
        .bmp-pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding-top: 8px;
          border-top: 1px solid var(--border-slate-100);
        }
        [data-theme="dark"] .bmp-pagination {
          border-top-color: #1f2937 !important;
        }

        /* Members */
        .bmp-members-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .bmp-member-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .bmp-member-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 10px;
        }
        [data-theme="dark"] .bmp-member-row {
          background: #1c232e !important;
          border-color: #2d3748 !important;
        }
        .bmp-member-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }
        .bmp-member-name {
          font-size: 12.5px;
          font-weight: 700;
          color: var(--text-slate-800);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        [data-theme="dark"] .bmp-member-name {
          color: #e2e8f0 !important;
        }
        .bmp-member-email {
          font-size: 10.5px;
          font-weight: 500;
          color: var(--text-slate-500);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .bmp-member-role {
          display: inline-flex;
          align-items: center;
          padding: 2px 9px;
          border-radius: 999px;
          font-size: 9.5px;
          font-weight: 800;
          letter-spacing: 0.04em;
          border: 1px solid;
        }
        .bmp-role-owner {
          background: rgba(245, 158, 11, 0.08);
          border-color: rgba(245, 158, 11, 0.25);
          color: #b45309;
        }
        .bmp-role-editor {
          background: rgba(59, 130, 246, 0.08);
          border-color: rgba(59, 130, 246, 0.25);
          color: #1d4ed8;
        }
        .bmp-role-viewer {
          background: rgba(100, 116, 139, 0.08);
          border-color: rgba(100, 116, 139, 0.25);
          color: #475569;
        }

        /* Overview */
        .bmp-overview {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .bmp-overview-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 10px;
        }
        .bmp-overview-card {
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 10px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        [data-theme="dark"] .bmp-overview-card {
          background: #1c232e !important;
          border-color: #2d3748 !important;
        }
        .bmp-overview-card-head {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 800;
          color: var(--text-slate-500);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .bmp-overview-card-body {
          font-size: 12.5px;
          color: var(--text-slate-700);
          line-height: 1.5;
        }
        [data-theme="dark"] .bmp-overview-card-body {
          color: #cbd5e1 !important;
        }
        .bmp-owner-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .bmp-overview-strong {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-slate-900);
        }
        [data-theme="dark"] .bmp-overview-strong {
          color: #f1f5f9 !important;
        }
        .bmp-overview-line {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 3px 0;
        }
        .bmp-overview-line-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-slate-500);
        }
        .bmp-muted {
          color: var(--text-slate-400);
          font-style: italic;
        }

        /* Empty block */
        .bmp-empty-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 36px 20px;
          background: var(--bg-slate-50);
          border: 1px dashed var(--border-slate-200);
          border-radius: 10px;
        }
        [data-theme="dark"] .bmp-empty-block {
          background: #1c232e !important;
          border-color: #2d3748 !important;
        }

        /* ── Responsive ────────────────────────────────────────────── */
        @media (max-width: 900px) {
          .bmp-tickets-toolbar {
            gap: 8px;
          }
          .bmp-search {
            width: 200px;
          }
          .bmp-ticket-row {
            gap: 8px;
            padding: 8px 12px 8px 8px;
          }
          .bmp-ticket-meta {
            gap: 6px;
          }
        }

        @media (max-width: 720px) {
          .bmp-overview-grid {
            grid-template-columns: 1fr;
          }
          .bmp-panel-head {
            flex-direction: column;
          }
          .bmp-panel-head-right {
            width: 100%;
            justify-content: flex-start;
          }
          /* Tabs row stacks the close button beside the tab strip */
          .bmp-tabs-row {
            align-items: center;
            gap: 8px;
          }
          /* Filter row goes vertical */
          .bmp-tickets-toolbar {
            flex-direction: column;
            align-items: stretch;
          }
          .bmp-toolbar-left {
            width: 100%;
            justify-content: space-between;
          }
          .bmp-search {
            width: 100%;
          }
          /* Bulk action bar wraps cleanly */
          .bmp-bulk-bar {
            row-gap: 8px;
          }
          .bmp-bulk-actions {
            width: 100%;
            justify-content: flex-end;
          }
          /* Ticket rows: allow the meta block to break under the title */
          .bmp-ticket-clickable {
            flex-wrap: wrap;
            gap: 8px 10px;
          }
          .bmp-ticket-title {
            flex: 1 1 100%;
            order: 2;
            white-space: normal;
            font-size: 13px;
          }
          .bmp-ticket-num {
            order: 1;
          }
          .bmp-ticket-meta {
            order: 3;
            flex: 1 1 100%;
            flex-wrap: wrap;
            justify-content: flex-start;
          }
          /* Member row trims email visibility */
          .bmp-member-email {
            font-size: 10px;
          }
        }

        /* Phone */
        @media (max-width: 480px) {
          .bmp-tabs {
            width: 100%;
            overflow-x: auto;
            scrollbar-width: none;
          }
          .bmp-tabs::-webkit-scrollbar {
            display: none;
          }
          .bmp-tab {
            flex-shrink: 0;
          }
          /* Hide time on very small to free row space */
          .bmp-ticket-time {
            display: none;
          }
          .bmp-ticket-assignee-name {
            max-width: 80px;
          }
          .bmp-ticket-prio {
            font-size: 9.5px;
            padding: 2px 6px;
          }
          .bmp-ticket-status-dot {
            display: none;
          }
          /* Sprint popover sits more cosily on tiny widths */
          .bmp-sprint-pop {
            width: 240px;
          }
          /* Member row: stack the role + email */
          .bmp-member-row {
            flex-wrap: wrap;
            row-gap: 6px;
          }
        }
        .bmp-assignee-avatar {
          background: #3b82f6 !important;
          color: #ffffff !important;
          font-weight: 800;
        }
        .bmp-assignee-avatar .ant-avatar-string {
          font-size: 11px !important;
        }
        [data-theme='dark'] .bmp-assignee-avatar {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%) !important;
          border: none;
        }
      `}</style>
    </>
  );
}
