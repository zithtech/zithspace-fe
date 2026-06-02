"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Typography,
  Button,
  Space,
  Row,
  Col,
  Table,
  Form,
  Input,
  Select,
  DatePicker,
  notification,
  Tag,
  Drawer,
  List,
  Avatar,
  Spin,
  Popconfirm,
  Tooltip,
  ConfigProvider,
  Divider,
  App,
  theme as antdTheme,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CalendarOutlined,
  PlayCircleOutlined,
  RocketOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ProjectOutlined,
  PieChartOutlined,
  HistoryOutlined,
  InfoCircleOutlined,
  SearchOutlined,
  LineChartOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  FireOutlined,
  TrophyOutlined,
  ThunderboltOutlined,
  FlagOutlined,
  UserOutlined,
  WarningOutlined,
  ArrowRightOutlined,
  CalendarTwoTone,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import ReleasePlanService, {
  ReleasePlan,
  ReleasePlanFormData,
  ProjectTicket,
} from "@/services/releasePlanService";
import { ProjectService } from "@/services/projectService";
import { SprintCompletionModal } from "./sprint-completion";
import { useSocket } from "@/providers/SocketProvider";
import { usePermission } from "@/hooks/usePermission";
import { useTheme } from "@/context/ThemeContext";
import { TicketDetailDrawer } from "@/components/projects/drawer/TicketDetailDrawer";

const { Title, Text } = Typography;
const { Option } = Select;

const BulbDot = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="M9 21h6m-3-3v3M7 12a5 5 0 1 1 10 0c0 2-1 3-2 4v2H9v-2c-1-1-2-2-2-4Z" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function SprintPlanComponent() {
  const { theme } = useTheme();
  const router = useRouter();
  const [form] = Form.useForm();
  // const [api, contextHolder] = notification.useNotification({
  //   placement: 'top',
  // });
  const { message } = App.useApp();
  const { socket, connected } = useSocket();
  const {
    canCreateTicketPlan,
    canUpdateTicketPlan,
    canDeleteTicketPlan,
    canReadTicketPlan
  } = usePermission();

  // State management
  const [sprintPlans, setSprintPlans] = useState<ReleasePlan[]>([]);
  const [allPlans, setAllPlans] = useState<ReleasePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ReleasePlan | null>(null);
  const [projects, setProjects] = useState<
    Array<{ value: string; label: string; code: string }>
  >([]);

  // Ticket selection state
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [availableTickets, setAvailableTickets] = useState<ProjectTicket[]>([]);
  const [, setTicketSearch] = useState("");
  const [ticketLoading, setTicketLoading] = useState(false);
  const [, setSearchLoading] = useState(false);
  const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null);

  // Drawer state for ticket details
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerSprintPlan, setDrawerSprintPlan] = useState<ReleasePlan | null>(null);
  const [ticketBoardFilter, setTicketBoardFilter] = useState<'all' | 'done' | 'progress' | 'todo'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'progress' | 'endDate'>('recent');

  // Sprint Completion Modal state
  const [sprintCompletionModalOpen, setSprintCompletionModalOpen] = useState(false);
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);

  // Ticket Detail Drawer state
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Table Filters state
  const [tableFilters, setTableFilters] = useState({
    search: "",
    projectId: "",
    status: "",
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadData();
    loadProjects();
  }, []);

  // Socket listener for real-time updates
  useEffect(() => {
    if (!socket || !connected) return;

    const handlePlanEvent = () => {
      console.log("Socket: Plan event received, reloading data...");
      loadData();
    };

    socket.on("plan:created", handlePlanEvent);
    socket.on("plan:updated", handlePlanEvent);
    socket.on("plan:deleted", handlePlanEvent);

    return () => {
      socket.off("plan:created", handlePlanEvent);
      socket.off("plan:updated", handlePlanEvent);
      socket.off("plan:deleted", handlePlanEvent);
    };
  }, [socket, connected]);

  const loadData = async (filtersOverride?: any) => {
    try {
      setLoading(true);
      const activeFilters = filtersOverride || tableFilters;

      // Fetch plans respecting search and project, but NOT status
      // This allows us to calculate accurate status counts in JS
      const data = await ReleasePlanService.getReleasePlans({
        type: "sprint_plan",
        search: activeFilters.search || undefined,
        projectId: activeFilters.projectId || undefined,
        // We omit status here to get the full set for metrics
        limit: 100, // Increased limit to ensure we get all plans for the current view
      });

      const plans = data?.data || [];
      setAllPlans(plans);

      // Now filter by status for the display table
      if (activeFilters.status) {
        setSprintPlans(plans.filter(p => p.status === activeFilters.status));
      } else {
        setSprintPlans(plans);
      }
    } catch (error) {
      console.error("Failed to load sprint plans:", error);
      message.error("Error!, Failed to load sprint plans.");
      // api.error({
      //   message: "Error",
      //   description: "Failed to load sprint plans",
      // });
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 500);
    return () => clearTimeout(timer);
  }, [tableFilters.search]);

  // Immediate load for status/project
  useEffect(() => {
    loadData();
  }, [tableFilters.projectId, tableFilters.status]);

  const loadProjects = async () => {
    try {
      const projectsData = await ProjectService.getProjectsForSelect();
      setProjects(projectsData || []);
    } catch (error) {
      console.error("Failed to load projects:", error);
    }
  };

  // Listen for socket events (via custom DOM event dispatched from useTicketSocketEvents)
  useEffect(() => {
    const handler = () => {
      console.log("Re-loading Sprint Plan data due to socket event...");
      loadData();
    };
    window.addEventListener("zith:plan_changed", handler);
    return () => window.removeEventListener("zith:plan_changed", handler);
  }, [loadData]);

  const loadTicketsByProject = useCallback(
    async (projectId: string, search?: string, isSearching?: boolean) => {
      if (!projectId) return;

      try {
        if (isSearching) {
          setSearchLoading(true);
        } else {
          setTicketLoading(true);
        }

        const tickets = await ReleasePlanService.getTicketsByProject(
          projectId,
          {
            search: search || undefined,
            limit: search ? 50 : 20,
            excludeReleasePlan: editingPlan?.id,
          }
        );

        setAvailableTickets(tickets || []);
      } catch (error) {
        console.error("Failed to load tickets:", error);
        setAvailableTickets([]);
      } finally {
        setTicketLoading(false);
        setSearchLoading(false);
      }
    },
    [editingPlan]
  );

  const handleProjectChange = useCallback(
    (projectId: string) => {
      if (searchTimer) {
        clearTimeout(searchTimer);
        setSearchTimer(null);
      }

      setSelectedProject(projectId);
      setTicketSearch("");
      setAvailableTickets([]);
      if (projectId) {
        loadTicketsByProject(projectId);
      }
    },
    [loadTicketsByProject, searchTimer]
  );

  const handleTicketSearch = useCallback(
    (value: string) => {
      setTicketSearch(value);
      if (searchTimer) {
        clearTimeout(searchTimer);
      }

      const newTimer = setTimeout(() => {
        if (selectedProject) {
          loadTicketsByProject(
            selectedProject,
            value.trim() || undefined,
            true
          );
        }
      }, 300);

      setSearchTimer(newTimer);
    },
    [selectedProject, loadTicketsByProject, searchTimer]
  );

  const handleCreateOrUpdate = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const formData: ReleasePlanFormData = {
        version: values?.name || "",
        description: values?.description || "",
        projectId: values?.project || "",
        releaseDate: values?.deadline?.toISOString() || "",
        startDate: values?.startDate?.toISOString() || undefined,
        endDate: values?.endDate?.toISOString() || undefined,
        goal: values?.goal || "",
        status: "planning",
        type: "sprint_plan",
        tickets: values?.tickets || [],
      };

      if (editingPlan) {
        await ReleasePlanService.updateReleasePlan(editingPlan.id, formData);
        message.success(`Sprint Plan "${values.name}" updated successfully`);
      } else {
        await ReleasePlanService.createReleasePlan(formData);
        message.success(`Sprint Plan "${values.name}" created successfully`);
      }

      handleCloseModal();
      loadData();
    } catch (error: any) {
      console.error("Failed to save Sprint Plan:", error);
      const errorMessage = error?.message || "Failed to save Sprint Plan";

      if (errorMessage.includes("already exists")) {
        message.error(errorMessage);
      } else {
        message.error(`Error!, ${errorMessage}`);
        // api.error({
        //   message: "Error",
        //   description: errorMessage,
        // });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (plan: ReleasePlan) => {
    setEditingPlan(plan);
    const projectId = typeof plan?.project === "object" ? plan.project?.id : "";
    setSelectedProject(projectId || "");

    const ticketIds = plan?.tickets?.map((t) => t?.id) || [];

    form.setFieldsValue({
      name: plan?.name,
      description: plan?.description,
      project: projectId,
      deadline: plan?.deadline ? dayjs(plan.deadline) : null,
      startDate: plan?.startDate ? dayjs(plan.startDate) : null,
      endDate: plan?.endDate ? dayjs(plan.endDate) : null,
      goal: plan?.goal,
      priority: plan?.priority,
      tickets: ticketIds,
    });

    if (projectId) {
      loadTicketsByProject(projectId);
    }
    setShowCreateModal(true);
  };

  const handleDelete = async (planId: string) => {
    try {
      await ReleasePlanService.deleteReleasePlan(planId);
      message.success("Sprint Plan deleted successfully");
      loadData();
    } catch (error) {
      console.error("Failed to delete Sprint Plan:", error);
    }
  };

  const handleStartSprint = async (plan: ReleasePlan) => {
    try {
      await ReleasePlanService.startSprint(plan.id);
      message.success("Sprint started successfully");
      loadData();
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to start sprint";
      message.error(`Error!, ${errorMessage}`);
      // api.error({
      //   message: "Error",
      //   description: errorMessage,
      // });
    }
  };

  const handleCompleteSprint = (plan: ReleasePlan) => {
    setSelectedSprintId(plan.id);
    setSprintCompletionModalOpen(true);
  };

  const handleSprintCompletionSuccess = () => {
    setSprintCompletionModalOpen(false);
    setSelectedSprintId(null);
    loadData();
    message.success("Sprint completed successfully");
  };

  const handleCloseModal = () => {
    if (searchTimer) {
      clearTimeout(searchTimer);
      setSearchTimer(null);
    }
    setShowCreateModal(false);
    setEditingPlan(null);
    setSelectedProject("");
    setTicketSearch("");
    setAvailableTickets([]);
    setTicketLoading(false);
    setSearchLoading(false);
    form.resetFields();
  };

  const handleViewTickets = async (plan: ReleasePlan) => {
    setTicketBoardFilter('all');
    setDrawerVisible(true);
    setDrawerSprintPlan(plan);
    try {
      const freshPlan = await ReleasePlanService.getReleasePlanById(plan.id);
      setDrawerSprintPlan(freshPlan);
    } catch (error) {
      console.error('Failed to fetch fresh sprint details:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "success";
      case "active": return "processing";
      case "planning": return "default";
      case "cancelled": return "error";
      case "on_hold": return "warning";
      default: return "default";
    }
  };

  // Metrics calculation (Universal - based on allPlans)
  const metrics = useMemo(() => {
    const active = allPlans.filter(p => p.status === 'active').length;
    const planning = allPlans.filter(p => p.status === 'planning').length;
    const completed = allPlans.filter(p => p.status === 'completed').length;

    // Average progress
    const avgProgress = allPlans.length > 0
      ? Math.round(allPlans.reduce((acc, p) => acc + (p.progress || 0), 0) / allPlans.length)
      : 0;

    return { active, planning, completed, avgProgress };
  }, [allPlans]);

  // Status counts for the segmented filter (respects search + project filters)
  const statusCounts = useMemo(() => {
    const base = allPlans.filter(p => {
      if (tableFilters.projectId) {
        const pid = typeof p.project === 'object' ? p.project?.id : p.project;
        if (pid !== tableFilters.projectId) return false;
      }
      if (tableFilters.search) {
        const q = tableFilters.search.toLowerCase();
        const name = (p.name || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        const goal = (p.goal || '').toLowerCase();
        if (!name.includes(q) && !desc.includes(q) && !goal.includes(q)) return false;
      }
      return true;
    });
    return {
      all: base.length,
      active: base.filter(p => p.status === 'active').length,
      planning: base.filter(p => p.status === 'planning').length,
      completed: base.filter(p => p.status === 'completed').length,
    };
  }, [allPlans, tableFilters.projectId, tableFilters.search]);

  // Sorted view of sprintPlans
  const sortedSprintPlans = useMemo(() => {
    const arr = [...sprintPlans];
    if (sortBy === 'name') arr.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    else if (sortBy === 'progress') arr.sort((a, b) => (b.progress || 0) - (a.progress || 0));
    else if (sortBy === 'endDate') arr.sort((a, b) => {
      const ax = a.endDate ? dayjs(a.endDate).valueOf() : Infinity;
      const bx = b.endDate ? dayjs(b.endDate).valueOf() : Infinity;
      return ax - bx;
    });
    else arr.sort((a, b) => dayjs(b.updatedAt || b.createdAt).valueOf() - dayjs(a.updatedAt || a.createdAt).valueOf());
    return arr;
  }, [sprintPlans, sortBy]);

  const activeFilterCount = (tableFilters.search ? 1 : 0) + (tableFilters.projectId ? 1 : 0) + (tableFilters.status ? 1 : 0);

  const columns = [
    {
      title: "Sprint",
      dataIndex: "name",
      key: "name",
      width: 380,
      render: (text: string, record: ReleasePlan) => {
        const project = typeof record.project === 'object' ? record.project : null;
        const initial = (text || '?').charAt(0).toUpperCase();
        const accent =
          record.status === 'active' ? '#3b82f6' :
            record.status === 'completed' ? '#10b981' :
              record.status === 'planning' ? '#f59e0b' : '#64748b';
        return (
          <div
            className="sp-row-name"
            role="button"
            tabIndex={0}
            onClick={() => handleViewTickets(record)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleViewTickets(record); } }}
            style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
          >
            <div className="sp-row-avatar" style={{ background: `${accent}14`, color: accent, borderColor: `${accent}33` }}>
              {initial}
            </div>
            <div style={{ minWidth: 0 }}>
              <Text strong className="sp-row-name-title" style={{ fontSize: 13.5, color: 'var(--text-slate-900)', display: 'block', lineHeight: 1.3, letterSpacing: '-0.005em' }}>
                {text}
              </Text>
              <div className="sp-row-meta">
                {project ? (
                  <span className="sp-row-meta-chip">
                    <ProjectOutlined style={{ fontSize: 9.5 }} />
                    {project.name}
                  </span>
                ) : (
                  <span className="sp-row-meta-muted">No project</span>
                )}
                {record.goal && (
                  <Tooltip title={record.goal}>
                    <span className="sp-row-meta-goal">
                      <BulbDot />
                      {record.goal.length > 28 ? record.goal.substring(0, 28) + '…' : record.goal}
                    </span>
                  </Tooltip>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status: string) => {
        const cfg =
          status === 'active' ? { dot: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', color: '#047857', label: 'Active', pulse: true } :
            status === 'planning' ? { dot: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', color: '#b45309', label: 'Planning', pulse: false } :
              status === 'completed' ? { dot: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', color: '#1d4ed8', label: 'Completed', pulse: false } :
                { dot: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)', color: '#475569', label: status?.toUpperCase() || '—', pulse: false };
        return (
          <span className="sp-status-pill" style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
            <span className={`sp-status-pill-dot ${cfg.pulse ? 'pulse' : ''}`} style={{ background: cfg.dot }} />
            {cfg.label}
          </span>
        );
      },
    },
    {
      title: "Progress",
      dataIndex: "progress",
      key: "progress",
      width: 250,
      render: (progress: number, record: ReleasePlan) => {
        const pct = progress || 0;
        const done = record?.completedTickets || 0;
        const total = record?.totalTickets || 0;
        const accent = pct >= 100 ? '#10b981' : pct >= 60 ? '#3b82f6' : pct >= 30 ? '#6366f1' : '#94a3b8';
        return (
          <div style={{ minWidth: 200 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <Text style={{ fontSize: 14, fontWeight: 800, color: accent, letterSpacing: '-0.02em', lineHeight: 1 }}>{pct}<span style={{ fontSize: 10 }}>%</span></Text>
                {pct >= 100 && <CheckCircleOutlined style={{ color: '#10b981', fontSize: 11 }} />}
              </div>
              <Text style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-slate-500)', fontVariantNumeric: 'tabular-nums' }}>
                <b style={{ color: 'var(--text-slate-900)' }}>{done}</b>/{total}
              </Text>
            </div>
            <div className="sp-progress-track">
              <div className="sp-progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${accent}, ${accent}cc)` }} />
            </div>
          </div>
        );
      },
    },
    {
      title: "Timeline",
      key: "timeline",
      width: 250,
      render: (_: any, record: ReleasePlan) => {
        const today = dayjs();
        const start = record.startDate ? dayjs(record.startDate) : null;
        const end = record.endDate ? dayjs(record.endDate) : null;
        const hasDates = start && end;
        const days = hasDates ? Math.max(end.diff(start, 'day'), 1) : 0;
        let phaseLabel = '';
        let phaseColor = '#64748b';
        let phaseBg = 'rgba(100,116,139,0.08)';
        if (record.status === 'completed') {
          phaseLabel = 'Closed';
          phaseColor = '#3b82f6';
          phaseBg = 'rgba(59,130,246,0.08)';
        } else if (start && end) {
          if (today.isBefore(start)) {
            phaseLabel = `Starts in ${start.diff(today, 'day')}d`;
            phaseColor = '#8b5cf6';
            phaseBg = 'rgba(139,92,246,0.08)';
          } else if (today.isAfter(end)) {
            phaseLabel = `${today.diff(end, 'day')}d overdue`;
            phaseColor = '#ef4444';
            phaseBg = 'rgba(239,68,68,0.08)';
          } else {
            const remaining = end.diff(today, 'day');
            phaseLabel = remaining === 0 ? 'Ends today' : `${remaining}d left`;
            phaseColor = remaining <= 2 ? '#f59e0b' : '#10b981';
            phaseBg = remaining <= 2 ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)';
          }
        }
        const elapsedPct = hasDates ? Math.min(Math.max((today.diff(start, 'day') / days) * 100, 0), 100) : 0;
        return (
          <div style={{ minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Text style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-slate-900)', fontVariantNumeric: 'tabular-nums' }}>
                {start ? start.format("MMM D") : "—"}
              </Text>
              <span style={{ flex: 1, height: 1, background: 'var(--border-slate-200)', position: 'relative' }}>
                {hasDates && (
                  <span style={{ position: 'absolute', left: 0, top: '50%', height: 1, width: `${elapsedPct}%`, background: phaseColor, transform: 'translateY(-50%)' }} />
                )}
              </span>
              <Text style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-slate-900)', fontVariantNumeric: 'tabular-nums' }}>
                {end ? end.format("MMM D") : "—"}
              </Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {phaseLabel && (
                <span className="sp-phase-chip" style={{ color: phaseColor, background: phaseBg, borderColor: `${phaseColor}33` }}>
                  {phaseLabel}
                </span>
              )}
              {hasDates && (
                <Text style={{ fontSize: 10.5, color: 'var(--text-slate-400)', fontWeight: 600 }}>{days}d cycle</Text>
              )}
            </div>
          </div>
        );
      },
    },
    // {
    //   title: "Team",
    //   key: "team",
    //   width: 130,
    //   render: (_: any, record: ReleasePlan) => {
    //     const seen = new Map<string, { name: string; color: string }>();
    //     const palette = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];
    //     (record.tickets || []).forEach((t, i) => {
    //       if (t.assignee?.id && !seen.has(t.assignee.id)) {
    //         seen.set(t.assignee.id, { name: t.assignee.name, color: palette[seen.size % palette.length] });
    //       }
    //     });
    //     const members = Array.from(seen.values());
    //     const visible = members.slice(0, 3);
    //     const overflow = Math.max(members.length - 3, 0);
    //     if (members.length === 0) {
    //       return <Text style={{ fontSize: 11, color: 'var(--text-slate-400)', fontWeight: 500 }}>—</Text>;
    //     }
    //     return (
    //       <Tooltip title={members.map(m => m.name).join(', ')}>
    //         <div className="sp-avatar-stack">
    //           {visible.map((m, i) => (
    //             <span key={i} className="sp-avatar-stack-item" style={{ background: `${m.color}1a`, color: m.color, borderColor: `${m.color}55` }}>
    //               {m.name.charAt(0).toUpperCase()}
    //             </span>
    //           ))}
    //           {overflow > 0 && (
    //             <span className="sp-avatar-stack-item sp-avatar-stack-more">+{overflow}</span>
    //           )}
    //         </div>
    //       </Tooltip>
    //     );
    //   },
    // },
    {
      title: "",
      key: "actions",
      align: "right" as const,
      width: 180,
      render: (_: any, record: ReleasePlan) => (
        <div className="sp-row-actions">
          {record.status === 'planning' && canUpdateTicketPlan && (
            <Popconfirm title="Activate this sprint?" onConfirm={() => handleStartSprint(record)}>
              <Tooltip title="Start sprint">
                <Button type="text" size="small" icon={<PlayCircleOutlined style={{ color: '#10b981' }} />} className="sp-row-action-btn" />
              </Tooltip>
            </Popconfirm>
          )}
          {record.status === 'active' && canUpdateTicketPlan && (
            <Tooltip title="Complete sprint">
              <Button type="text" size="small" icon={<CheckCircleOutlined style={{ color: '#3b82f6' }} />} onClick={() => handleCompleteSprint(record)} className="sp-row-action-btn" />
            </Tooltip>
          )}
          {(record.status === 'active' || record.status === 'completed') && (
            <Tooltip title="View report">
              <Button type="text" size="small" icon={<LineChartOutlined style={{ color: '#6366f1' }} />} onClick={() => router.push(`/tickets/reports/${record.id}`)} className="sp-row-action-btn" />
            </Tooltip>
          )}
          <Tooltip title="View details">
            <Button type="text" size="small" icon={<EyeOutlined style={{ color: '#64748b' }} />} onClick={() => handleViewTickets(record)} className="sp-row-action-btn" />
          </Tooltip>
          {canUpdateTicketPlan && (
            <Tooltip title="Edit">
              <Button type="text" size="small" icon={<EditOutlined style={{ color: '#64748b' }} />} onClick={() => handleEdit(record)} className="sp-row-action-btn" />
            </Tooltip>
          )}
          {canDeleteTicketPlan && (
            <Popconfirm title="Delete this sprint?" onConfirm={() => handleDelete(record.id)} okText="Delete" okButtonProps={{ danger: true }}>
              <Tooltip title="Delete">
                <Button type="text" size="small" danger icon={<DeleteOutlined />} className="sp-row-action-btn" />
              </Tooltip>
            </Popconfirm>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ background: "var(--bg-pure-white)", minHeight: "100vh" }}>
      {/* {contextHolder} */}

      {/* Workstation Header */}
      <div className="saas-header-container" style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(12px)',
        padding: '13px 48px 6px 48px',
        margin: '0 -24px 24px',
        marginBottom: 24
      }}>
        <Row justify="space-between" align="middle" gutter={[16, 16]} className="sp-header-responsive-row">
          <Col flex="1 1 auto" style={{ minWidth: 0 }} className="sp-header-left-col">
            <div className="sp-header-main-flex">
              <div className="sp-header-title-row">
                <div className="sp-header-icon-box">
                  <CalendarOutlined style={{ fontSize: 18, color: '#3b82f6' }} />
                </div>
                <Title level={4} style={{ margin: 0, fontWeight: 800, color: 'var(--text-slate-900)', letterSpacing: '-0.01em' }}>
                  Sprint Cycles
                </Title>
              </div>

              <Divider type="vertical" className="sp-header-divider" />

              <div className="sp-header-description-box">
                <Text style={{ fontSize: 12, color: 'var(--text-slate-600)', fontWeight: 600 }}>
                  Engineered for continuous delivery and milestone tracking
                </Text>
              </div>
            </div>
          </Col>
          <Col flex="0 0 auto" className="sp-header-extra-col">
            <Space size={12} className="sp-header-extra-space">
              <Button
                icon={<ReloadOutlined spin={isRefreshing} />}
                onClick={async () => {
                  setIsRefreshing(true);
                  await loadData();
                  setIsRefreshing(false);
                  message.success("Success, Sprint view refreshed");
                  // api.success({
                  //   message: "Success",
                  //   description: "Sprint view refreshed",
                  // });
                }}
                loading={loading && !isRefreshing}
                className="saas-button-item"
                style={{ height: 36, fontWeight: 600 }}
              />
              {canCreateTicketPlan && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setShowCreateModal(true)}
                  className="saas-button-item"
                  style={{
                    height: 36,
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    border: 'none'
                  }}
                >
                  Plan New Sprint
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </div>

      <div style={{ padding: "0 32px 32px" }}>
        {/* Premium KPI Hero Row */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} lg={6}>
            <div className="sp-kpi-card sp-kpi-blue">
              <div className="sp-kpi-header">
                <div className="sp-kpi-icon blue">
                  <RocketOutlined style={{ fontSize: 16 }} />
                </div>
                <span className="sp-kpi-label">Active Cycles</span>
                <span className="sp-kpi-pulse" />
              </div>
              <div className="sp-kpi-value-row">
                <span className="sp-kpi-value">{metrics.active}</span>
                <span className="sp-kpi-sub">in flight</span>
              </div>
              <div className="sp-kpi-bar">
                <div
                  className="sp-kpi-bar-fill blue"
                  style={{ width: `${allPlans.length ? (metrics.active / allPlans.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <div className="sp-kpi-card sp-kpi-amber">
              <div className="sp-kpi-header">
                <div className="sp-kpi-icon amber">
                  <PieChartOutlined style={{ fontSize: 16 }} />
                </div>
                <span className="sp-kpi-label">In Planning</span>
              </div>
              <div className="sp-kpi-value-row">
                <span className="sp-kpi-value">{metrics.planning}</span>
                <span className="sp-kpi-sub">queued</span>
              </div>
              <div className="sp-kpi-bar">
                <div
                  className="sp-kpi-bar-fill amber"
                  style={{ width: `${allPlans.length ? (metrics.planning / allPlans.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <div className="sp-kpi-card sp-kpi-emerald">
              <div className="sp-kpi-header">
                <div className="sp-kpi-icon emerald">
                  <CheckCircleOutlined style={{ fontSize: 16 }} />
                </div>
                <span className="sp-kpi-label">Shipped</span>
              </div>
              <div className="sp-kpi-value-row">
                <span className="sp-kpi-value">{metrics.completed}</span>
                <span className="sp-kpi-sub">delivered</span>
              </div>
              <div className="sp-kpi-bar">
                <div
                  className="sp-kpi-bar-fill emerald"
                  style={{ width: `${allPlans.length ? (metrics.completed / allPlans.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <div className="sp-kpi-card sp-kpi-violet">
              <div className="sp-kpi-header">
                <div className="sp-kpi-icon violet">
                  <LineChartOutlined style={{ fontSize: 16 }} />
                </div>
                <span className="sp-kpi-label">Avg. Progress</span>
              </div>
              <div className="sp-kpi-value-row">
                <span className="sp-kpi-value">{metrics.avgProgress}<span className="sp-kpi-unit">%</span></span>
                <span className="sp-kpi-sub">across cycles</span>
              </div>
              <div className="sp-kpi-bar">
                <div className="sp-kpi-bar-fill violet" style={{ width: `${metrics.avgProgress}%` }} />
              </div>
            </div>
          </Col>
        </Row>

        {/* Premium Filter Workbench */}
        <div className="sp-workbench">
          {/* Top row: search + actions */}
          <div className="sp-workbench-top">
            <div className={`sp-search-box ${tableFilters.search ? 'active' : ''}`}>
              <SearchOutlined style={{ color: tableFilters.search ? '#3b82f6' : '#94a3b8', fontSize: 14 }} />
              <Input
                placeholder="Search by name, goal, or description"
                variant="borderless"
                style={{ fontSize: 13, fontWeight: 500, padding: '6px 0', flex: 1, background: 'transparent' }}
                value={tableFilters.search}
                onChange={(e) => setTableFilters(prev => ({ ...prev, search: e.target.value }))}
                allowClear
              />
              {/* {!tableFilters.search && (
                <div className="sp-search-kbd">
                  <Text style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-slate-400)' }}>⌘K</Text>
                </div>
              )} */}
            </div>

            <div className="sp-workbench-divider" />

            <Select
              placeholder="All projects"
              className="sp-filter-pill"
              allowClear
              suffixIcon={<ProjectOutlined style={{ color: '#64748b', fontSize: 12 }} />}
              value={tableFilters.projectId || undefined}
              onChange={(val) => setTableFilters(prev => ({ ...prev, projectId: val || "" }))}
              popupMatchSelectWidth={false}
              styles={{ popup: { root: { minWidth: 280, borderRadius: 10 } } }}
            >
              {projects?.map((project: any) => (
                <Option key={project.value} value={project.value} label={project.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <Text style={{ fontSize: 12, fontWeight: 500 }}>{project.label}</Text>
                    <Tag className="sp-project-code-tag">{project.code}</Tag>
                  </div>
                </Option>
              ))}
            </Select>

            <Select
              className="sp-filter-pill sp-sort-pill"
              value={sortBy}
              onChange={(v) => setSortBy(v as any)}
              suffixIcon={<LineChartOutlined style={{ color: '#64748b', fontSize: 12 }} />}
              popupMatchSelectWidth={false}
              styles={{ popup: { root: { minWidth: 200, borderRadius: 10 } } }}
            >
              <Option value="recent">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <HistoryOutlined style={{ fontSize: 12, color: '#64748b' }} />
                  <Text style={{ fontSize: 12, fontWeight: 500 }}>Recently updated</Text>
                </div>
              </Option>
              <Option value="endDate">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CalendarOutlined style={{ fontSize: 12, color: '#64748b' }} />
                  <Text style={{ fontSize: 12, fontWeight: 500 }}>End date · soonest</Text>
                </div>
              </Option>
              <Option value="progress">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <LineChartOutlined style={{ fontSize: 12, color: '#64748b' }} />
                  <Text style={{ fontSize: 12, fontWeight: 500 }}>Progress · highest</Text>
                </div>
              </Option>
              <Option value="name">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ProjectOutlined style={{ fontSize: 12, color: '#64748b' }} />
                  <Text style={{ fontSize: 12, fontWeight: 500 }}>Name · A → Z</Text>
                </div>
              </Option>
            </Select>

            {activeFilterCount > 0 && (
              <Button
                size="small"
                type="text"
                icon={<ReloadOutlined />}
                className="sp-reset-btn"
                onClick={() => {
                  setTableFilters({ search: "", projectId: "", status: "" });
                  loadData({ search: "", projectId: "", status: "" });
                }}
              >
                Clear · {activeFilterCount}
              </Button>
            )}
          </div>

          {/* Bottom row: segmented status filter with live counts */}
          <div className="sp-segmented">
            {([
              { k: 'all', label: 'All', n: statusCounts.all, color: '#64748b' },
              { k: 'active', label: 'Active', n: statusCounts.active, color: '#10b981' },
              { k: 'planning', label: 'Planning', n: statusCounts.planning, color: '#f59e0b' },
              { k: 'completed', label: 'Completed', n: statusCounts.completed, color: '#3b82f6' },
            ] as const).map(seg => {
              const active = (tableFilters.status || 'all') === seg.k;
              return (
                <button
                  key={seg.k}
                  className={`sp-segmented-item ${active ? 'active' : ''}`}
                  style={active ? ({ ['--seg-color' as any]: seg.color }) : undefined}
                  onClick={() => setTableFilters(prev => ({ ...prev, status: seg.k === 'all' ? '' : seg.k }))}
                >
                  <span className="sp-segmented-dot" style={{ background: seg.color, boxShadow: active ? `0 0 0 3px ${seg.color}22` : 'none' }} />
                  <span className="sp-segmented-label">{seg.label}</span>
                  <span className="sp-segmented-count" style={active ? { background: `${seg.color}1a`, color: seg.color } : undefined}>
                    {seg.n}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Table */}
        <div className="sp-table-card">
          <div className="sp-table-toolbar">
            <div className="sp-table-toolbar-title">
              <span className="sp-table-toolbar-icon">
                <CalendarOutlined style={{ fontSize: 13, color: '#3b82f6' }} />
              </span>
              <Text style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-slate-900)' }}>Sprint Cycles</Text>
              <span className="sp-table-toolbar-chip">{sortedSprintPlans.length} {sortedSprintPlans.length === 1 ? 'result' : 'results'}</span>
            </div>
            <div className="sp-table-toolbar-meta">
              <span className="sp-table-toolbar-meta-item">
                <span className="sp-segmented-dot" style={{ background: '#10b981', width: 6, height: 6 }} />
                {metrics.active} active
              </span>
              <span className="sp-table-toolbar-meta-divider" />
              <span className="sp-table-toolbar-meta-item">
                Avg <b style={{ color: 'var(--text-slate-900)', marginLeft: 4 }}>{metrics.avgProgress}%</b>
              </span>
            </div>
          </div>
          <Table
            columns={columns}
            dataSource={sortedSprintPlans}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) => (
                <Text style={{ fontSize: 12, color: 'var(--text-slate-500)', fontWeight: 500 }}>
                  <span style={{ color: 'var(--text-slate-900)', fontWeight: 700 }}>{range[0]}–{range[1]}</span> of <span style={{ color: 'var(--text-slate-900)', fontWeight: 700 }}>{total}</span> sprint{total !== 1 ? 's' : ''}
                </Text>
              ),
              style: { padding: '16px 24px', margin: 0 }
            }}
            className="sp-premium-table"
            scroll={{ x: 1200 }}
            locale={{
              emptyText: (
                <div className="sp-empty-state">
                  <div className="sp-empty-icon">
                    <CalendarOutlined style={{ fontSize: 28, color: '#3b82f6' }} />
                  </div>
                  <Title level={5} style={{ margin: '0 0 6px', fontWeight: 700, color: 'var(--text-slate-900)' }}>
                    No sprint cycles yet
                  </Title>
                  <Text style={{ fontSize: 13, color: 'var(--text-slate-500)', display: 'block', marginBottom: 20, maxWidth: 360, textAlign: 'center' }}>
                    Plan your first sprint to start tracking delivery, milestones, and team velocity in one place.
                  </Text>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setShowCreateModal(true)}
                    style={{
                      height: 38,
                      fontWeight: 700,
                      borderRadius: 8,
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                    }}
                  >
                    Plan your first sprint
                  </Button>
                </div>
              )
            }}
          />
        </div>

        {/* Create/Edit Drawer */}
        <Drawer
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="sp-drawer-icon-box">
                <RocketOutlined style={{ color: '#0369a1', fontSize: 20 }} />
              </div>
              <div>
                <Title level={4} style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.01em' }}>
                  {editingPlan ? "Refine Sprint Parameters" : "Initiate New Sprint"}
                </Title>
                <Text style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-slate-600)' }}>
                  Configure the Plan
                </Text>
              </div>
            </div>
          }
          open={showCreateModal}
          onClose={handleCloseModal}
          width={560}
          maskClosable={true}
          destroyOnClose
          extra={
            <Space size="middle">
              <Button onClick={handleCloseModal} style={{ borderRadius: 0, fontWeight: 600 }}>Cancel</Button>
              <Button
                type="primary"
                loading={saving}
                onClick={handleCreateOrUpdate}
                style={{ fontWeight: 700, borderRadius: 0, background: '#2563eb', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }}
              >
                {editingPlan ? "Update Sprint" : "Kick-off Sprint"}
              </Button>
            </Space>
          }
          styles={{
            header: { borderBottom: '1px solid var(--border-slate-200)', padding: '20px 24px', background: 'var(--bg-pure-white)' },
            body: { padding: "24px", background: 'var(--bg-slate-50)' },
            mask: { backdropFilter: 'blur(4px)', background: 'rgba(15, 23, 42, 0.1)' }
          }}
        >
          <Form form={form} layout="vertical" requiredMark={false}>
            <ConfigProvider
              theme={{
                algorithm: theme === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
                token: {
                  colorBgContainer: theme === 'dark' ? '#161B22' : '#ffffff',
                  colorText: theme === 'dark' ? '#F1F5F9' : '#1E293B',
                },
                components: {
                  Input: { borderRadius: 0 },
                  Select: { borderRadius: 0 },
                  DatePicker: { borderRadius: 0 }
                }
              }}
            >
              {/* Section: Basic Information */}
              <div className="sp-form-section">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                  <div className="sp-section-icon slate">
                    <InfoCircleOutlined style={{ color: 'var(--text-slate-600)', fontSize: 14 }} />
                  </div>
                  <Text style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-slate-900)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>General Details</Text>
                </div>

                <Form.Item
                  label={<Text style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-slate-600)' }}>Sprint Name</Text>}
                  name="name"
                  rules={[{ required: true, message: "Sprint Name is required" }]}
                  style={{ marginBottom: 20 }}
                >
                  <Input placeholder="e.g. Q2 Core Infrastructure - Sprint 04" size="middle" />
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label={<Text style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-slate-600)' }}>Target Project</Text>} name="project" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                      <Select
                        placeholder="Select project"
                        size="middle"
                        onChange={handleProjectChange}
                        disabled={!!editingPlan}
                        options={projects}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label={<Text style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-slate-600)' }}>Primary Objective</Text>} name="goal" style={{ marginBottom: 0 }}>
                      <Input placeholder="High-level goal..." size="middle" />
                    </Form.Item>
                  </Col>
                </Row>
              </div>

              {/* Section: Timeline & Planning */}
              <div className="sp-form-section">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                  <div className="sp-section-icon orange">
                    <CalendarOutlined style={{ color: '#f59e0b', fontSize: 14 }} />
                  </div>
                  <Text style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-slate-900)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Planning & Schedule</Text>
                </div>

                <Form.Item label={<Text style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-slate-600)' }}>Release Cycle Duration</Text>} style={{ marginBottom: 20 }}>
                  <Select
                    placeholder="Select duration"
                    size="middle"
                    onChange={(val) => {
                      if (val === 'custom') return;
                      const start = form.getFieldValue('startDate') || dayjs();
                      let end = dayjs(start);
                      if (val === '1w') end = end.add(1, 'week');
                      if (val === '2w') end = end.add(2, 'week');
                      if (val === '4w') end = end.add(1, 'month');
                      form.setFieldsValue({ startDate: start, endDate: end, deadline: end });
                    }}
                  >
                    <Option value="custom">Manual Range</Option>
                    <Option value="1w">1 Week Sprint</Option>
                    <Option value="2w">2 Weeks (Standard)</Option>
                    <Option value="4w">Monthly Release</Option>
                  </Select>
                </Form.Item>

                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item label={<Text style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-slate-600)' }}>Start Date</Text>} name="startDate" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                      <DatePicker size="middle" style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label={<Text style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-slate-600)' }}>End Date</Text>} name="endDate" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                      <DatePicker size="middle" style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                </Row>
              </div>

              {/* Section: Backlog Allocation */}
              <div className="sp-form-section">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                  <div className="sp-section-icon green">
                    <ProjectOutlined style={{ color: '#10b981', fontSize: 14 }} />
                  </div>
                  <Text style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-slate-900)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Backlog Allocation</Text>
                </div>

                <Form.Item
                  label={<Text style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-slate-600)' }}>Assign Selected Issues</Text>}
                  name="tickets"
                  tooltip="Map existing backlog tickets to this sprint session"
                  style={{ marginBottom: 12 }}
                >
                  <Select
                    mode="multiple"
                    size="middle"
                    placeholder="ID or Title search..."
                    style={{ width: '100%' }}
                    onSearch={handleTicketSearch}
                    filterOption={false}
                    notFoundContent={ticketLoading ? <Spin size="small" /> : null}
                    options={availableTickets.map(t => ({
                      label: t.ticketNumber,
                      value: t.id,
                      item: t
                    }))}
                    dropdownStyle={{ borderRadius: 0 }}
                    optionRender={(option) => {
                      const t = option.data.item;
                      return (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                          <Space>
                            <Tag className="sp-ticket-num-tag">{t.ticketNumber}</Tag>
                            <Text ellipsis style={{ maxWidth: 220, fontSize: 13, fontWeight: 500 }}>{t.title}</Text>
                          </Space>
                          <Tag color={getStatusColor(t.status)} style={{ fontSize: 9, borderRadius: 0, fontWeight: 600 }}>{t.status.toUpperCase()}</Tag>
                        </div>
                      );
                    }}
                  />
                </Form.Item>
                <div className="sp-info-hint">
                  <HistoryOutlined style={{ fontSize: 12, color: 'var(--text-slate-600)' }} />
                  <Text style={{ fontSize: 10, color: 'var(--text-slate-600)', fontWeight: 500 }}>Only unassigned tickets from the selected project are visible</Text>
                </div>
              </div>
            </ConfigProvider>
            <Form.Item name="deadline" hidden><Input /></Form.Item>
          </Form>
        </Drawer>

        {/* Ticket Details Drawer */}
        <Drawer
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingTop: 2 }}>
              <div className="sp-view-icon-box">
                <CalendarOutlined style={{ color: '#3b82f6', fontSize: 18 }} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <Text style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-slate-400)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sprint Detail</Text>
                  {drawerSprintPlan?.priority && (
                    <span className={`sp-priority-chip sp-priority-${(drawerSprintPlan.priority || '').toLowerCase()}`}>
                      <FlagOutlined style={{ fontSize: 9 }} />
                      {drawerSprintPlan.priority}
                    </span>
                  )}
                </div>
                <Title level={4} style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.015em', color: 'var(--text-slate-900)' }} ellipsis>
                  {drawerSprintPlan?.name}
                </Title>
              </div>
            </div>
          }
          placement="right"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          width={Math.min(typeof window !== 'undefined' ? window.innerWidth - 60 : 1600, 1600)}
          styles={{
            header: { borderBottom: '1px solid var(--border-slate-200)', padding: '16px 28px', background: 'var(--bg-pure-white)' },
            body: { padding: 0, background: 'var(--bg-slate-50)' },
            mask: { backdropFilter: 'blur(6px)', background: 'rgba(15, 23, 42, 0.18)' }
          }}
          extra={
            <Space size={8}>
              {drawerSprintPlan?.status === 'planning' && (
                <Popconfirm title="Activate this sprint?" onConfirm={() => { handleStartSprint(drawerSprintPlan); setDrawerVisible(false); }}>
                  <Button icon={<PlayCircleOutlined />} style={{ borderRadius: 8, fontWeight: 600, height: 36 }}>
                    Start Sprint
                  </Button>
                </Popconfirm>
              )}
              <Button icon={<EditOutlined />} onClick={() => { handleEdit(drawerSprintPlan!); setDrawerVisible(false); }} style={{ borderRadius: 8, fontWeight: 600, height: 36 }}>
                Edit
              </Button>
              {drawerSprintPlan && (drawerSprintPlan.status === 'active' || drawerSprintPlan.status === 'completed') && (
                <Button
                  icon={<LineChartOutlined />}
                  onClick={() => { router.push(`/tickets/reports/${drawerSprintPlan.id}`); setDrawerVisible(false); }}
                  style={{ borderRadius: 8, fontWeight: 600, height: 36 }}
                >
                  View Report
                </Button>
              )}
              {drawerSprintPlan?.status === 'active' && (
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => {
                    handleCompleteSprint(drawerSprintPlan);
                    setDrawerVisible(false);
                  }}
                  style={{
                    borderRadius: 8,
                    fontWeight: 700,
                    height: 36,
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                  }}
                >
                  Complete Sprint
                </Button>
              )}
            </Space>
          }
        >
          {drawerSprintPlan && (() => {
            const pct = drawerSprintPlan?.progress || 0;
            const done = drawerSprintPlan?.completedTickets || 0;
            const total = drawerSprintPlan?.totalTickets || 0;
            const inProgress = drawerSprintPlan?.inProgressTickets ?? Math.max(total - done - (drawerSprintPlan?.notStartedTickets || 0), 0);
            const notStarted = drawerSprintPlan?.notStartedTickets ?? Math.max(total - done - inProgress, 0);
            const status = drawerSprintPlan?.status;
            const startDate = drawerSprintPlan?.startedAt || drawerSprintPlan?.startDate;
            const endDate = drawerSprintPlan?.endDate;
            const completedAt = drawerSprintPlan?.completedAt;
            const start = startDate ? dayjs(startDate) : null;
            const end = endDate ? dayjs(endDate) : null;
            const closed = completedAt ? dayjs(completedAt) : null;
            const totalDays = start && end ? Math.max(end.diff(start, 'day'), 1) : 0;
            const today = dayjs();
            const elapsed = start ? Math.max(Math.min(today.diff(start, 'day'), totalDays), 0) : 0;
            const timePct = totalDays ? Math.round((elapsed / totalDays) * 100) : 0;

            // Delivery delta
            let deliveryNote: { label: string; color: string; icon: React.ReactNode; sub: string } | null = null;
            if (status === 'completed' && closed && end) {
              const diff = closed.diff(end, 'day');
              if (diff < 0) deliveryNote = { label: `Delivered ${Math.abs(diff)}d early`, color: '#10b981', icon: <TrophyOutlined />, sub: `Closed on ${closed.format('MMM D, YYYY')}` };
              else if (diff === 0) deliveryNote = { label: 'Delivered on time', color: '#3b82f6', icon: <CheckCircleOutlined />, sub: `Closed on ${closed.format('MMM D, YYYY')}` };
              else deliveryNote = { label: `Delivered ${diff}d late`, color: '#ef4444', icon: <WarningOutlined />, sub: `Closed on ${closed.format('MMM D, YYYY')}` };
            } else if (status === 'active' && end) {
              const diff = today.diff(end, 'day');
              if (diff > 0) deliveryNote = { label: `${diff}d overdue`, color: '#ef4444', icon: <WarningOutlined />, sub: `Target was ${end.format('MMM D')}` };
              else if (diff === 0) deliveryNote = { label: 'Ends today', color: '#f59e0b', icon: <FireOutlined />, sub: `Last day of cycle` };
              else deliveryNote = { label: `${Math.abs(diff)}d remaining`, color: '#10b981', icon: <ThunderboltOutlined />, sub: `Target ${end.format('MMM D, YYYY')}` };
            }

            // Velocity / pace
            const expectedDone = totalDays && total ? Math.round((elapsed / totalDays) * total) : 0;
            const paceDelta = done - expectedDone;

            const radius = 52;
            const circ = 2 * Math.PI * radius;
            const dash = (pct / 100) * circ;
            const ringColor = pct >= 100 ? '#10b981' : pct >= 60 ? '#3b82f6' : '#6366f1';
            const statusCfg =
              status === 'active' ? { color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', label: 'Active' } :
                status === 'planning' ? { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', label: 'Planning' } :
                  status === 'completed' ? { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)', label: 'Completed' } :
                    { color: '#64748b', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.25)', label: status?.toUpperCase() || '—' };
            const project = typeof drawerSprintPlan.project === 'object' ? drawerSprintPlan.project : null;

            // Contributor aggregation
            type Contrib = { id: string; name: string; total: number; done: number; inProgress: number; notStarted: number; tickets: typeof drawerSprintPlan.tickets };
            const contribMap = new Map<string, Contrib>();
            (drawerSprintPlan.tickets || []).forEach(t => {
              const a = t.assignee;
              const key = a?.id || '__unassigned__';
              const name = a?.name || 'Unassigned';
              if (!contribMap.has(key)) {
                contribMap.set(key, { id: key, name, total: 0, done: 0, inProgress: 0, notStarted: 0, tickets: [] });
              }
              const c = contribMap.get(key)!;
              c.total += 1;
              c.tickets.push(t);
              const s = (t.status || '').toLowerCase();
              if (s === 'completed' || s === 'done') c.done += 1;
              else if (s === 'in_progress' || s === 'active' || s === 'review') c.inProgress += 1;
              else c.notStarted += 1;
            });
            const contributors = Array.from(contribMap.values()).sort((a, b) => b.done - a.done || b.total - a.total);
            const topContribTotal = total || 1;

            // Priority breakdown
            const prioMap: Record<string, number> = { High: 0, Medium: 0, Low: 0, None: 0 };
            (drawerSprintPlan.tickets || []).forEach((t: any) => {
              const p = t.priority || 'None';
              prioMap[p] = (prioMap[p] || 0) + 1;
            });

            // Filtered tickets for board view
            const visibleTickets = (drawerSprintPlan.tickets || []).filter(t => {
              const s = (t.status || '').toLowerCase();
              if (ticketBoardFilter === 'all') return true;
              if (ticketBoardFilter === 'done') return s === 'completed' || s === 'done';
              if (ticketBoardFilter === 'progress') return s === 'in_progress' || s === 'active' || s === 'review';
              if (ticketBoardFilter === 'todo') return !(s === 'completed' || s === 'done' || s === 'in_progress' || s === 'active' || s === 'review');
              return true;
            });

            const tCfg = (s: string) => {
              const k = (s || '').toLowerCase();
              if (k === 'completed' || k === 'done') return { c: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.22)', label: 'Done' };
              if (k === 'in_progress' || k === 'active') return { c: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.22)', label: 'In Progress' };
              if (k === 'review') return { c: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.22)', label: 'Review' };
              if (k === 'pending' || k === 'todo' || k === 'open') return { c: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.22)', label: k.replace(/_/g, ' ') };
              return { c: '#64748b', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.22)', label: k.replace(/_/g, ' ') || '—' };
            };

            const prioCfg = (p: string) => {
              if (p === 'High') return { c: '#ef4444', bg: 'rgba(239,68,68,0.08)' };
              if (p === 'Medium') return { c: '#f59e0b', bg: 'rgba(245,158,11,0.08)' };
              if (p === 'Low') return { c: '#10b981', bg: 'rgba(16,185,129,0.08)' };
              return { c: '#94a3b8', bg: 'rgba(148,163,184,0.08)' };
            };

            return (
              <div className="sp-detail-shell">
                {/* ── LEFT RAIL — Analytics ─────────────────────── */}
                <aside className="sp-detail-left">


                  {/* Hero ring + KPIs */}
                  <div className="sp-detail-card">
                    <div className="sp-detail-hero-row">
                      <div className="sp-view-ring sp-detail-ring">
                        <svg width="100%" height="100%" viewBox="0 0 130 130" preserveAspectRatio="xMidYMid meet">
                          <defs>
                            <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor={ringColor} stopOpacity="0.95" />
                              <stop offset="100%" stopColor={ringColor} stopOpacity="0.65" />
                            </linearGradient>
                          </defs>
                          <circle cx="65" cy="65" r={radius} fill="none" stroke="var(--border-slate-200)" strokeWidth="9" />
                          <circle
                            cx="65" cy="65" r={radius}
                            fill="none"
                            stroke="url(#ringGrad)"
                            strokeWidth="9"
                            strokeLinecap="round"
                            strokeDasharray={`${dash} ${circ}`}
                            transform="rotate(-90 65 65)"
                            style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)' }}
                          />
                        </svg>
                        <div className="sp-view-ring-label">
                          <div style={{ fontSize: 26, fontWeight: 800, color: ringColor, lineHeight: 1, letterSpacing: '-0.02em' }}>{pct}<span style={{ fontSize: 14 }}>%</span></div>
                          <div style={{ fontSize: 9.5, color: 'var(--text-slate-500)', fontWeight: 700, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Complete</div>
                        </div>
                      </div>

                      <div className="sp-mini-stat-grid">
                        <div className="sp-mini-stat">
                          <div className="sp-mini-stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                            <CheckCircleOutlined />
                          </div>
                          <div className="sp-mini-stat-text">
                            <div className="sp-mini-stat-value">{done}</div>
                            <div className="sp-mini-stat-label">Done</div>
                          </div>
                        </div>
                        <div className="sp-mini-stat">
                          <div className="sp-mini-stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                            <ThunderboltOutlined />
                          </div>
                          <div className="sp-mini-stat-text">
                            <div className="sp-mini-stat-value">{inProgress}</div>
                            <div className="sp-mini-stat-label">Active</div>
                          </div>
                        </div>
                        <div className="sp-mini-stat">
                          <div className="sp-mini-stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                            <ClockCircleOutlined />
                          </div>
                          <div className="sp-mini-stat-text">
                            <div className="sp-mini-stat-value">{notStarted}</div>
                            <div className="sp-mini-stat-label">To do</div>
                          </div>
                        </div>
                        <div className="sp-mini-stat">
                          <div className="sp-mini-stat-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
                            <ProjectOutlined />
                          </div>
                          <div className="sp-mini-stat-text">
                            <div className="sp-mini-stat-value">{total}</div>
                            <div className="sp-mini-stat-label">Total</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stacked composition bar */}
                    {total > 0 && (
                      <div className="sp-stack-bar" title={`${done} done · ${inProgress} active · ${notStarted} to do`}>
                        <div style={{ width: `${(done / total) * 100}%`, background: '#10b981' }} />
                        <div style={{ width: `${(inProgress / total) * 100}%`, background: '#3b82f6' }} />
                        <div style={{ width: `${(notStarted / total) * 100}%`, background: '#f59e0b' }} />
                      </div>
                    )}

                    {/* Pace insight */}
                    {status === 'active' && total > 0 && (
                      <div className="sp-pace-row">
                        <FireOutlined style={{ color: paceDelta >= 0 ? '#10b981' : '#ef4444' }} />
                        <Text style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-slate-700)' }}>
                          {paceDelta >= 0
                            ? <>Ahead of pace by <b style={{ color: '#10b981' }}>{paceDelta}</b> ticket{paceDelta !== 1 ? 's' : ''}</>
                            : <>Behind pace by <b style={{ color: '#ef4444' }}>{Math.abs(paceDelta)}</b> ticket{Math.abs(paceDelta) !== 1 ? 's' : ''}</>
                          }
                        </Text>
                      </div>
                    )}
                  </div>

                  {/* Timeline card */}
                  <div className="sp-detail-card">
                    <div className="sp-card-header">
                      <CalendarTwoTone twoToneColor="#3b82f6" style={{ fontSize: 14 }} />
                      <Text className="sp-card-title">Timeline</Text>
                    </div>
                    {start && end ? (
                      <>
                        <div className="sp-tl-grid">
                          <div className="sp-tl-stat">
                            <div className="sp-tl-stat-label">Started</div>
                            <div className="sp-tl-stat-value">{start.format('MMM D, YYYY')}</div>
                            <div className="sp-tl-stat-sub">{start.format('dddd')}</div>
                          </div>
                          <div className="sp-tl-stat">
                            <div className="sp-tl-stat-label">{closed ? 'Closed' : 'Target'}</div>
                            <div className="sp-tl-stat-value">{(closed || end).format('MMM D, YYYY')}</div>
                            <div className="sp-tl-stat-sub">{(closed || end).format('dddd')}</div>
                          </div>
                        </div>
                        <div style={{ marginTop: 14 }}>
                          <div className="sp-view-timeline-header">
                            <Text style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {status === 'completed' ? 'Final' : 'Elapsed'}
                            </Text>
                            <Text style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-slate-700)' }}>
                              {timePct}% · {elapsed}/{totalDays}d
                            </Text>
                          </div>
                          <div className="sp-view-timeline-bar">
                            <div className="sp-view-timeline-fill" style={{ width: `${timePct}%` }} />
                          </div>
                        </div>
                        <div className="sp-tl-tags">
                          <span className="sp-tl-tag"><HistoryOutlined /> {totalDays} day cycle</span>
                          {closed && <span className="sp-tl-tag" style={{ color: deliveryNote?.color }}>
                            {closed.diff(end, 'day') < 0 ? `${Math.abs(closed.diff(end, 'day'))}d early` : closed.diff(end, 'day') === 0 ? 'On time' : `${closed.diff(end, 'day')}d late`}
                          </span>}
                        </div>
                      </>
                    ) : (
                      <Text style={{ fontSize: 12, color: 'var(--text-slate-500)' }}>Timeline not set.</Text>
                    )}
                  </div>

                  {/* Status banner */}
                  <div className="sp-detail-banner" style={{ borderColor: statusCfg.border, background: statusCfg.bg }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="sp-status-pill" style={{ background: 'var(--bg-pure-white)', border: `1px solid ${statusCfg.border}`, color: statusCfg.color }}>
                        <span className={`sp-status-pill-dot ${status === 'active' ? 'pulse' : ''}`} style={{ background: statusCfg.color }} />
                        {statusCfg.label}
                      </span>
                      {project && (
                        <span className="sp-view-project-chip">
                          <ProjectOutlined style={{ fontSize: 11 }} />
                          {project.name}
                        </span>
                      )}
                    </div>
                    {deliveryNote && (
                      <div className="sp-delivery-note" style={{ color: deliveryNote.color }}>
                        {deliveryNote.icon}
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 700 }}>{deliveryNote.label}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-slate-500)', fontWeight: 500 }}>{deliveryNote.sub}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Priority breakdown */}
                  {total > 0 && (
                    <div className="sp-detail-card">
                      <div className="sp-card-header">
                        <FlagOutlined style={{ color: '#ef4444', fontSize: 13 }} />
                        <Text className="sp-card-title">Priority Mix</Text>
                      </div>
                      <div className="sp-prio-grid">
                        {(['High', 'Medium', 'Low', 'None'] as const).map(k => {
                          const v = prioMap[k] || 0;
                          const cfg = prioCfg(k);
                          const wpct = total ? Math.round((v / total) * 100) : 0;
                          return (
                            <div key={k} className="sp-prio-row">
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 78 }}>
                                <div className="sp-prio-dot" style={{ background: cfg.c }} />
                                <Text style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-slate-700)' }}>{k}</Text>
                              </div>
                              <div className="sp-prio-bar">
                                <div className="sp-prio-bar-fill" style={{ width: `${wpct}%`, background: cfg.c }} />
                              </div>
                              <Text style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-slate-700)', minWidth: 38, textAlign: 'right' }}>{v} <span style={{ color: 'var(--text-slate-400)', fontWeight: 500 }}>· {wpct}%</span></Text>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Sprint goal */}
                  {drawerSprintPlan.goal && (
                    <div className="sp-detail-card">
                      <div className="sp-card-header">
                        <BulbDot />
                        <Text className="sp-card-title">Sprint Goal</Text>
                      </div>
                      <Text style={{ fontSize: 12.5, color: 'var(--text-slate-700)', lineHeight: 1.6 }}>
                        {drawerSprintPlan.goal}
                      </Text>
                    </div>
                  )}

                  {/* Description */}
                  {drawerSprintPlan.description && (
                    <div className="sp-detail-card">
                      <div className="sp-card-header">
                        <InfoCircleOutlined style={{ color: '#64748b', fontSize: 13 }} />
                        <Text className="sp-card-title">Description</Text>
                      </div>
                      <Text style={{ fontSize: 12.5, color: 'var(--text-slate-700)', lineHeight: 1.6 }}>
                        {drawerSprintPlan.description}
                      </Text>
                    </div>
                  )}
                </aside>

                {/* ── MIDDLE COLUMN — Team Contributors (row-wise) ─── */}
                <section className="sp-detail-mid">
                  <div className="sp-detail-card sp-detail-card-flush">
                    <div className="sp-card-header" style={{ justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <TeamOutlined style={{ color: '#8b5cf6', fontSize: 14 }} />
                        <Text className="sp-card-title">Team Contribution</Text>
                      </div>
                      <Text style={{ fontSize: 11, color: 'var(--text-slate-500)', fontWeight: 600 }}>
                        {contributors.length} contributor{contributors.length !== 1 ? 's' : ''}
                      </Text>
                    </div>

                    {contributors.length === 0 ? (
                      <div className="sp-view-empty-tickets">
                        <TeamOutlined style={{ fontSize: 22, color: 'var(--text-slate-400)' }} />
                        <Text style={{ fontSize: 13, color: 'var(--text-slate-500)', fontWeight: 500 }}>No contributors yet.</Text>
                      </div>
                    ) : (
                      <div className="sp-contrib-list">
                        {contributors.map((c, i) => {
                          const ownership = Math.round((c.total / topContribTotal) * 100);
                          const completion = c.total ? Math.round((c.done / c.total) * 100) : 0;
                          const palette = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];
                          const color = c.id === '__unassigned__' ? '#94a3b8' : palette[i % palette.length];
                          return (
                            <div key={c.id} className="sp-contrib-row-card">
                              <div className="sp-contrib-rank" style={{ color }}>#{i + 1}</div>
                              <div className="sp-contrib-avatar" style={{ background: `${color}18`, color, borderColor: `${color}33` }}>
                                {c.id === '__unassigned__' ? <UserOutlined /> : c.name.charAt(0).toUpperCase()}
                              </div>

                              <div className="sp-contrib-meta">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <Text style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-slate-900)' }} ellipsis>
                                    {c.name}
                                  </Text>
                                  {i === 0 && c.id !== '__unassigned__' && (
                                    <span className="sp-top-badge"><TrophyOutlined /> Top</span>
                                  )}
                                </div>
                                <Text style={{ fontSize: 11.5, color: 'var(--text-slate-500)', fontWeight: 500 }}>
                                  {c.total} ticket{c.total !== 1 ? 's' : ''} · {completion}% completion
                                </Text>

                                {c.total > 0 && (
                                  <div className="sp-stack-bar" style={{ height: 5, margin: '8px 0 6px', maxWidth: 320 }}>
                                    <div style={{ width: `${(c.done / c.total) * 100}%`, background: '#10b981' }} />
                                    <div style={{ width: `${(c.inProgress / c.total) * 100}%`, background: '#3b82f6' }} />
                                    <div style={{ width: `${(c.notStarted / c.total) * 100}%`, background: '#f59e0b' }} />
                                  </div>
                                )}

                                <div className="sp-contrib-stats">
                                  <span style={{ color: '#10b981' }}>● {c.done} done</span>
                                  <span style={{ color: '#3b82f6' }}>● {c.inProgress} active</span>
                                  <span style={{ color: '#f59e0b' }}>● {c.notStarted} to do</span>
                                </div>
                              </div>

                              <div className="sp-contrib-share">
                                <div className="sp-contrib-share-pct" style={{ color }}>{ownership}<span style={{ fontSize: 13 }}>%</span></div>
                                <div className="sp-contrib-share-label">Sprint share</div>
                                <div className="sp-prio-bar sp-contrib-share-bar">
                                  <div className="sp-prio-bar-fill" style={{ width: `${ownership}%`, background: color }} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </section>

                {/* ── RIGHT COLUMN — All Tickets ───────────────────── */}
                <section className="sp-detail-right">
                  <div className="sp-detail-card sp-detail-card-flush">
                    <div className="sp-card-header" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ProjectOutlined style={{ color: '#3b82f6', fontSize: 14 }} />
                        <Text className="sp-card-title">All Tickets</Text>
                        <Text style={{ fontSize: 11, color: 'var(--text-slate-500)', fontWeight: 600 }}>
                          ({total})
                        </Text>
                      </div>
                      <div className="sp-tab-group">
                        {([
                          { k: 'all', label: 'All', n: total },
                          { k: 'done', label: 'Done', n: done },
                          { k: 'progress', label: 'Active', n: inProgress },
                          { k: 'todo', label: 'To do', n: notStarted },
                        ] as const).map(tab => (
                          <button
                            key={tab.k}
                            className={`sp-tab ${ticketBoardFilter === tab.k ? 'active' : ''}`}
                            onClick={() => setTicketBoardFilter(tab.k as any)}
                          >
                            {tab.label}
                            <span className="sp-tab-count">{tab.n}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {visibleTickets.length === 0 ? (
                      <div className="sp-view-empty-tickets">
                        <ProjectOutlined style={{ fontSize: 24, color: 'var(--text-slate-400)' }} />
                        <Text style={{ fontSize: 13, color: 'var(--text-slate-500)', fontWeight: 500 }}>
                          {total === 0 ? 'No tickets in this sprint.' : 'No tickets match this filter.'}
                        </Text>
                      </div>
                    ) : (
                      <div className="sp-ticket-grid">
                        {visibleTickets.map(ticket => {
                          const cfg = tCfg(ticket.status);
                          const pcfg = prioCfg((ticket as any).priority || 'None');
                          const aColor = ticket.assignee ? '#3b82f6' : '#94a3b8';
                          return (
                            <div key={ticket.id} className="sp-ticket-row" onClick={() => setSelectedTicketId(ticket.id)}>
                              <div className="sp-ticket-row-accent" style={{ background: cfg.c }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                                  <span className="sp-view-ticket-num">{ticket.ticketNumber}</span>
                                  <span className="sp-status-pill sp-status-pill-sm" style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.c }}>
                                    <span className="sp-status-pill-dot" style={{ background: cfg.c }} />
                                    {cfg.label}
                                  </span>
                                  {(ticket as any).priority && (ticket as any).priority !== 'None' && (
                                    <span className="sp-prio-pill" style={{ background: pcfg.bg, color: pcfg.c }}>
                                      <FlagOutlined style={{ fontSize: 9 }} />
                                      {(ticket as any).priority}
                                    </span>
                                  )}
                                </div>
                                <Text style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-slate-900)', display: 'block', lineHeight: 1.4 }} ellipsis>
                                  {ticket.title}
                                </Text>
                              </div>
                              <div className="sp-ticket-meta">
                                {ticket.assignee ? (
                                  <Tooltip title={ticket.assignee.name}>
                                    <div className="sp-assignee-avatar" style={{ background: `${aColor}18`, color: aColor, borderColor: `${aColor}33` }}>
                                      {ticket.assignee.name.charAt(0).toUpperCase()}
                                    </div>
                                  </Tooltip>
                                ) : (
                                  <Tooltip title="Unassigned">
                                    <div className="sp-assignee-avatar" style={{ background: '#f1f5f9', color: '#94a3b8', borderColor: '#e2e8f0' }}>
                                      <UserOutlined style={{ fontSize: 11 }} />
                                    </div>
                                  </Tooltip>
                                )}
                                <ArrowRightOutlined className="sp-ticket-row-arrow" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </section>
              </div>
            );
          })()}
        </Drawer>

        {/* Completion Modal */}
        <SprintCompletionModal
          sprintId={selectedSprintId}
          open={sprintCompletionModalOpen}
          onClose={() => {
            setSprintCompletionModalOpen(false);
            setSelectedSprintId(null);
          }}
          onSuccess={handleSprintCompletionSuccess}
        />

        {/* Ticket Details Drawer */}
        <TicketDetailDrawer
          ticketId={selectedTicketId}
          open={!!selectedTicketId}
          onClose={() => setSelectedTicketId(null)}
        />

        <style jsx global>{`
        /* ── Header ────────────────────────────────────────────── */
        .sp-header-icon-box {
          width: 38px;
          height: 38px;
          background: linear-gradient(135deg, rgba(59,130,246,0.12), rgba(99,102,241,0.12));
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(59,130,246,0.2);
        }
        [data-theme='dark'] .sp-header-icon-box {
          background: linear-gradient(135deg, rgba(59,130,246,0.18), rgba(99,102,241,0.18)) !important;
          border-color: rgba(59,130,246,0.3) !important;
        }
        .sp-header-divider {
          height: 18px;
          border-left: 1.5px solid var(--border-slate-200);
          margin: 0 !important;
        }
        [data-theme='dark'] .sp-header-divider {
          border-left-color: #1f2937 !important;
        }
        .sp-header-main-flex {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .sp-header-title-row {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        @media (max-width: 836px) {
          .sp-header-main-flex {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 8px !important;
          }
          .sp-header-divider {
            display: none !important;
          }
          .sp-header-extra-col {
            width: 100% !important;
            flex: 1 1 100% !important;
            margin-top: 4px;
          }
          .sp-header-extra-space {
            width: 100%;
            justify-content: flex-start !important;
          }
        }

        /* ── KPI Cards ─────────────────────────────────────────── */
        .sp-kpi-card {
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 14px;
          padding: 16px 18px;
          position: relative;
          overflow: hidden;
          transition: all 0.25s ease;
          box-shadow: 0 1px 3px rgba(15,23,42,0.03);
        }
        .sp-kpi-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          opacity: 0.85;
        }
        .sp-kpi-blue::before { background: linear-gradient(90deg, #3b82f6, #6366f1); }
        .sp-kpi-amber::before { background: linear-gradient(90deg, #f59e0b, #f97316); }
        .sp-kpi-emerald::before { background: linear-gradient(90deg, #10b981, #059669); }
        .sp-kpi-violet::before { background: linear-gradient(90deg, #8b5cf6, #6366f1); }
        .sp-kpi-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(15,23,42,0.06);
          border-color: var(--border-slate-300, #cbd5e1);
        }
        [data-theme='dark'] .sp-kpi-card {
          background: #161b22 !important;
          border-color: #1f2937 !important;
        }
        [data-theme='dark'] .sp-kpi-card:hover {
          border-color: #374151 !important;
        }
        .sp-kpi-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
        }
        .sp-kpi-icon {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sp-kpi-icon.blue { background: rgba(59,130,246,0.1); color: #3b82f6; }
        .sp-kpi-icon.amber { background: rgba(245,158,11,0.1); color: #f59e0b; }
        .sp-kpi-icon.emerald { background: rgba(16,185,129,0.1); color: #10b981; }
        .sp-kpi-icon.violet { background: rgba(139,92,246,0.1); color: #8b5cf6; }
        .sp-kpi-label {
          font-size: 11.5px;
          font-weight: 600;
          color: var(--text-slate-500);
          letter-spacing: 0.01em;
          flex: 1;
        }
        [data-theme='dark'] .sp-kpi-label { color: #94a3b8 !important; }
        .sp-kpi-pulse {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 0 0 rgba(16,185,129,0.7);
          animation: sp-pulse 2s infinite;
        }
        @keyframes sp-pulse {
          0% { box-shadow: 0 0 0 0 rgba(16,185,129,0.7); }
          70% { box-shadow: 0 0 0 8px rgba(16,185,129,0); }
          100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
        }
        .sp-kpi-value-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-bottom: 12px;
        }
        .sp-kpi-value {
          font-size: 30px;
          font-weight: 800;
          color: var(--text-slate-900);
          letter-spacing: -0.025em;
          line-height: 1;
        }
        [data-theme='dark'] .sp-kpi-value { color: #f1f5f9 !important; }
        .sp-kpi-unit {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-slate-400);
        }
        .sp-kpi-sub {
          font-size: 11.5px;
          color: var(--text-slate-500);
          font-weight: 500;
        }
        [data-theme='dark'] .sp-kpi-sub { color: #94a3b8 !important; }
        .sp-kpi-bar {
          height: 4px;
          background: var(--bg-slate-50);
          border-radius: 999px;
          overflow: hidden;
        }
        [data-theme='dark'] .sp-kpi-bar { background: #1f2937 !important; }
        .sp-kpi-bar-fill {
          height: 100%;
          border-radius: 999px;
          transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .sp-kpi-bar-fill.blue { background: linear-gradient(90deg, #3b82f6, #6366f1); }
        .sp-kpi-bar-fill.amber { background: linear-gradient(90deg, #f59e0b, #f97316); }
        .sp-kpi-bar-fill.emerald { background: linear-gradient(90deg, #10b981, #059669); }
        .sp-kpi-bar-fill.violet { background: linear-gradient(90deg, #8b5cf6, #6366f1); }

        /* ── Filter Workbench (premium) ────────────────────────── */
        .sp-workbench {
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 14px;
          margin-bottom: 16px;
          box-shadow: 0 1px 3px rgba(15,23,42,0.03);
          overflow: hidden;
        }
        [data-theme='dark'] .sp-workbench {
          background: #161b22 !important;
          border-color: #1f2937 !important;
        }
        .sp-workbench-top {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          flex-wrap: wrap;
        }
        .sp-workbench-divider {
          width: 1px;
          height: 22px;
          background: var(--border-slate-200);
        }
        [data-theme='dark'] .sp-workbench-divider { background: #2d3748 !important; }
        .sp-workbench .sp-search-box {
          flex: 1;
          min-width: 280px;
          max-width: none;
        }

        /* Segmented status filter */
        .sp-segmented {
          display: flex;
          gap: 0;
          padding: 0 14px;
          border-top: 1px dashed var(--border-slate-200);
          background: var(--bg-slate-50);
        }
        [data-theme='dark'] .sp-segmented {
          background: #0f1419 !important;
          border-top-color: #2d3748 !important;
        }
        .sp-segmented-item {
          background: transparent;
          border: none;
          padding: 11px 16px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          position: relative;
          color: var(--text-slate-500);
          transition: all 0.15s ease;
          border-bottom: 2px solid transparent;
          font-family: inherit;
        }
        .sp-segmented-item:hover {
          color: var(--text-slate-900);
        }
        [data-theme='dark'] .sp-segmented-item:hover {
          color: #f1f5f9;
        }
        .sp-segmented-item.active {
          color: var(--text-slate-900);
          border-bottom-color: var(--seg-color, #3b82f6);
        }
        [data-theme='dark'] .sp-segmented-item.active {
          color: #f1f5f9;
        }
        .sp-segmented-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          transition: box-shadow 0.2s ease;
        }
        .sp-segmented-label {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: -0.005em;
        }
        .sp-segmented-count {
          padding: 1px 8px;
          font-size: 10.5px;
          font-weight: 800;
          background: var(--bg-pure-white);
          border-radius: 999px;
          font-variant-numeric: tabular-nums;
          color: var(--text-slate-500);
          line-height: 1.6;
          border: 1px solid var(--border-slate-200);
        }
        [data-theme='dark'] .sp-segmented-count {
          background: #1c232e !important;
          border-color: #2d3748 !important;
          color: #94a3b8 !important;
        }
        .sp-sort-pill { min-width: 180px; }
        .sp-search-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: transparent !important;
          padding: 4px 12px;
          border-radius: 10px;
          border: 1px solid var(--border-slate-200);
          width: 100%;
          max-width: 460px;
          transition: all 0.2s ease;
        }
        .sp-search-box.active {
          background: transparent !important;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }
        [data-theme='dark'] .sp-search-box {
          background: transparent !important;
          border-color: #374151 !important;
        }
        [data-theme='dark'] .sp-search-box.active {
          background: transparent !important;
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.15) !important;
        }
        .sp-search-kbd {
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          padding: 2px 7px;
          border-radius: 5px;
          font-family: ui-monospace, monospace;
        }
        [data-theme='dark'] .sp-search-kbd {
          background: #0b0f1a !important;
          border-color: #374151 !important;
        }
        .sp-filter-pill {
          min-width: 160px;
          height: 36px !important;
          font-size: 12.5px;
          font-weight: 500;
        }
        .sp-filter-pill .ant-select-selector {
          border-radius: 8px !important;
          background: var(--bg-slate-50) !important;
          border: 1px solid var(--border-slate-200) !important;
          height: 36px !important;
          padding: 0 12px !important;
          display: flex; align-items: center;
        }
        .sp-filter-pill:hover .ant-select-selector {
          border-color: #cbd5e1 !important;
        }
        .sp-filter-pill.ant-select-focused .ant-select-selector {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1) !important;
        }
        [data-theme='dark'] .sp-filter-pill .ant-select-selector {
          background: #1f2937 !important;
          border-color: #374151 !important;
          color: #f1f5f9 !important;
        }
        .sp-status-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
        }
        .sp-status-dot.all { background: #94a3b8; }
        .sp-status-dot.active { background: #10b981; box-shadow: 0 0 0 2px rgba(16,185,129,0.15); }
        .sp-status-dot.planning { background: #f59e0b; }
        .sp-status-dot.completed { background: #3b82f6; }
        .sp-reset-btn {
          color: var(--text-slate-500) !important;
          font-weight: 600 !important;
          font-size: 12px !important;
        }
        .sp-reset-btn:hover {
          color: #3b82f6 !important;
          background: rgba(59,130,246,0.06) !important;
        }
        .sp-project-code-tag {
          margin: 0;
          font-size: 9.5px;
          font-weight: 700;
          background: var(--bg-slate-50);
          border: 1px solid var(--border-slate-200);
          color: var(--text-slate-600);
          border-radius: 4px;
          padding: 0 6px;
        }
        [data-theme='dark'] .sp-project-code-tag {
          background: #374151 !important;
          border-color: #4b5563 !important;
          color: #cbd5e1 !important;
        }

        /* ── Status pill (table & drawer) ──────────────────────── */
        .sp-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.01em;
          text-transform: capitalize;
          line-height: 1;
          white-space: nowrap;
        }
        .sp-status-pill-sm {
          padding: 2px 8px;
          font-size: 10px;
        }
        .sp-status-pill-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .sp-status-pill-dot.pulse {
          animation: sp-pulse-dot 2s infinite;
        }
        @keyframes sp-pulse-dot {
          0% { box-shadow: 0 0 0 0 rgba(16,185,129,0.5); }
          70% { box-shadow: 0 0 0 6px rgba(16,185,129,0); }
          100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
        }

        /* ── Table card ────────────────────────────────────────── */
        .sp-table-card {
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(15,23,42,0.03);
        }
        [data-theme='dark'] .sp-table-card {
          background: #161b22 !important;
          border-color: #1f2937 !important;
        }
        .sp-table-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 18px;
          border-bottom: 1px solid var(--border-slate-100);
          background: linear-gradient(180deg, var(--bg-pure-white) 0%, var(--bg-slate-50) 100%);
        }
        [data-theme='dark'] .sp-table-toolbar {
          background: linear-gradient(180deg, #161b22 0%, #0f1419 100%) !important;
          border-bottom-color: #1f2937 !important;
        }
        .sp-table-toolbar-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .sp-table-toolbar-icon {
          width: 26px;
          height: 26px;
          border-radius: 7px;
          background: rgba(59,130,246,0.1);
          border: 1px solid rgba(59,130,246,0.18);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sp-table-toolbar-chip {
          font-size: 10.5px;
          font-weight: 700;
          color: var(--text-slate-600);
          background: var(--bg-slate-50);
          border: 1px solid var(--border-slate-200);
          padding: 2px 8px;
          border-radius: 999px;
          letter-spacing: 0.01em;
        }
        [data-theme='dark'] .sp-table-toolbar-chip {
          background: #1c232e !important;
          border-color: #2d3748 !important;
          color: #cbd5e1 !important;
        }
        .sp-table-toolbar-meta {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .sp-table-toolbar-meta-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 600;
          color: var(--text-slate-500);
        }
        .sp-table-toolbar-meta-divider {
          width: 1px;
          height: 12px;
          background: var(--border-slate-200);
        }
        [data-theme='dark'] .sp-table-toolbar-meta-divider { background: #2d3748 !important; }

        /* Row meta chips */
        .sp-row-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 4px;
          flex-wrap: wrap;
        }
        .sp-row-meta-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10.5px;
          font-weight: 600;
          color: var(--text-slate-600);
          background: var(--bg-slate-50);
          border: 1px solid var(--border-slate-200);
          padding: 1.5px 7px;
          border-radius: 5px;
          line-height: 1.5;
          max-width: 180px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        [data-theme='dark'] .sp-row-meta-chip {
          background: #1c232e !important;
          border-color: #2d3748 !important;
          color: #cbd5e1 !important;
        }
        .sp-row-meta-muted {
          font-size: 10.5px;
          font-weight: 500;
          color: var(--text-slate-400);
          font-style: italic;
        }
        .sp-row-meta-goal {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10.5px;
          font-weight: 500;
          color: var(--text-slate-500);
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Phase chip in timeline column */
        .sp-phase-chip {
          display: inline-flex;
          align-items: center;
          padding: 1.5px 8px;
          font-size: 10px;
          font-weight: 800;
          border-radius: 4px;
          border: 1px solid;
          letter-spacing: 0.01em;
          text-transform: uppercase;
          line-height: 1.5;
        }

        /* Avatar stack */
        .sp-avatar-stack {
          display: inline-flex;
          align-items: center;
        }
        .sp-avatar-stack-item {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          border: 2px solid var(--bg-pure-white);
          margin-left: -8px;
          flex-shrink: 0;
          background-clip: padding-box;
        }
        .sp-avatar-stack-item:first-child { margin-left: 0; }
        [data-theme='dark'] .sp-avatar-stack-item {
          border-color: #161b22 !important;
        }
        .sp-avatar-stack-more {
          background: var(--bg-slate-50) !important;
          color: var(--text-slate-600) !important;
          border-color: var(--bg-pure-white) !important;
        }
        [data-theme='dark'] .sp-avatar-stack-more {
          background: #1c232e !important;
          color: #94a3b8 !important;
          border-color: #161b22 !important;
        }
        .sp-premium-table .ant-table {
          background: transparent !important;
        }
        .sp-premium-table .ant-table-thead > tr > th {
          background: var(--bg-slate-50);
          font-weight: 700;
          color: var(--text-slate-500);
          font-size: 10.5px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding: 12px 16px;
          white-space: nowrap;
          border-bottom: 1px solid var(--border-slate-200);
        }
        .sp-premium-table .ant-table-thead > tr > th::before { display: none; }
        [data-theme='dark'] .sp-premium-table .ant-table-thead > tr > th {
          background: #0f1419 !important;
          color: #94a3b8 !important;
          border-bottom-color: #1f2937 !important;
        }
        .sp-premium-table .ant-table-tbody > tr > td {
          padding: 16px;
          border-bottom: 1px solid var(--border-slate-100);
          background: var(--bg-pure-white);
          transition: background 0.15s ease;
        }
        .sp-premium-table .ant-table-tbody > tr:hover > td {
          background: var(--bg-slate-50) !important;
        }
        .sp-premium-table .ant-table-tbody > tr:last-child > td {
          border-bottom: none;
        }
        [data-theme='dark'] .sp-premium-table .ant-table-tbody > tr > td {
          background: #161b22 !important;
          border-bottom-color: #1f2937 !important;
        }
        [data-theme='dark'] .sp-premium-table .ant-table-tbody > tr:hover > td {
          background: #1c232e !important;
        }
        .sp-premium-table .ant-pagination {
          margin: 0 !important;
        }
        .sp-row-name {
          outline: none;
          border-radius: 8px;
          padding: 2px 4px;
          margin: -2px -4px;
          transition: color 0.15s ease;
        }
        .sp-row-name:hover .sp-row-name-title {
          color: #2563eb !important;
        }
        [data-theme='dark'] .sp-row-name:hover .sp-row-name-title {
          color: #60a5fa !important;
        }
        .sp-row-name:focus-visible {
          box-shadow: 0 0 0 2px rgba(59,130,246,0.35);
        }
        .sp-row-avatar {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 14px;
          border: 1px solid;
          flex-shrink: 0;
        }
        .sp-progress-track {
          width: 100%;
          height: 6px;
          background: var(--bg-slate-50);
          border-radius: 999px;
          overflow: hidden;
        }
        [data-theme='dark'] .sp-progress-track { background: #1f2937 !important; }
        .sp-progress-fill {
          height: 100%;
          border-radius: 999px;
          transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .sp-row-actions {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          opacity: 0.7;
          transition: opacity 0.2s;
        }
        .sp-premium-table .ant-table-tbody > tr:hover .sp-row-actions {
          opacity: 1;
        }
        .sp-row-action-btn {
          width: 30px;
          height: 30px;
          border-radius: 8px !important;
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }
        .sp-row-action-btn:hover {
          background: var(--bg-slate-50) !important;
          transform: scale(1.05);
        }
        [data-theme='dark'] .sp-row-action-btn:hover {
          background: #1f2937 !important;
        }

        /* ── Empty state ───────────────────────────────────────── */
        .sp-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 24px;
        }
        .sp-empty-icon {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(59,130,246,0.08), rgba(99,102,241,0.08));
          border: 1px solid rgba(59,130,246,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }

        /* ── View Drawer hero ──────────────────────────────────── */
        .sp-view-icon-box {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: linear-gradient(135deg, rgba(59,130,246,0.12), rgba(99,102,241,0.12));
          border: 1px solid rgba(59,130,246,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        [data-theme='dark'] .sp-view-icon-box {
          background: linear-gradient(135deg, rgba(59,130,246,0.18), rgba(99,102,241,0.18)) !important;
          border-color: rgba(59,130,246,0.3) !important;
        }
        .sp-view-hero {
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(15,23,42,0.03);
        }
        [data-theme='dark'] .sp-view-hero {
          background: #161b22 !important;
          border-color: #1f2937 !important;
        }
        .sp-view-hero-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .sp-view-project-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: var(--bg-slate-50);
          border: 1px solid var(--border-slate-200);
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-slate-700);
        }
        [data-theme='dark'] .sp-view-project-chip {
          background: #1f2937 !important;
          border-color: #374151 !important;
          color: #cbd5e1 !important;
        }
        .sp-view-hero-body {
          display: flex;
          align-items: center;
          gap: 24px;
          padding: 8px 0;
        }
        .sp-view-ring {
          position: relative;
          width: 110px;
          height: 110px;
          flex-shrink: 0;
        }
        .sp-view-ring-label {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .sp-view-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          flex: 1;
        }
        .sp-view-stat {
          padding: 12px;
          background: var(--bg-slate-50);
          border-radius: 10px;
          text-align: center;
          border: 1px solid var(--border-slate-200);
        }
        [data-theme='dark'] .sp-view-stat {
          background: #1f2937 !important;
          border-color: #374151 !important;
        }
        .sp-view-stat-value {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1;
        }
        .sp-view-stat-label {
          font-size: 10.5px;
          color: var(--text-slate-500);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-top: 6px;
        }
        [data-theme='dark'] .sp-view-stat-label { color: #94a3b8 !important; }
        .sp-view-timeline {
          margin-top: 18px;
          padding-top: 16px;
          border-top: 1px dashed var(--border-slate-200);
        }
        [data-theme='dark'] .sp-view-timeline {
          border-top-color: #374151 !important;
        }
        .sp-view-timeline-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .sp-view-timeline-bar {
          height: 6px;
          background: var(--bg-slate-50);
          border-radius: 999px;
          overflow: hidden;
          margin-bottom: 8px;
        }
        [data-theme='dark'] .sp-view-timeline-bar { background: #1f2937 !important; }
        .sp-view-timeline-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #6366f1);
          border-radius: 999px;
          transition: width 0.6s ease;
        }
        .sp-view-timeline-dates {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        /* ── View Drawer ticket cards ──────────────────────────── */
        .sp-view-empty-tickets {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 32px;
          background: var(--bg-pure-white);
          border: 1px dashed var(--border-slate-200);
          border-radius: 12px;
        }
        [data-theme='dark'] .sp-view-empty-tickets {
          background: #161b22 !important;
          border-color: #374151 !important;
        }
        .sp-view-ticket-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 12px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
          position: relative;
        }
        .sp-view-ticket-card:hover {
          border-color: #3b82f6;
          box-shadow: 0 2px 8px rgba(59,130,246,0.08);
          transform: translateX(2px);
        }
        [data-theme='dark'] .sp-view-ticket-card {
          background: #161b22 !important;
          border-color: #1f2937 !important;
        }
        [data-theme='dark'] .sp-view-ticket-card:hover {
          border-color: #3b82f6 !important;
        }
        .sp-view-ticket-accent {
          width: 3px;
          align-self: stretch;
          border-radius: 999px;
          flex-shrink: 0;
        }
        .sp-view-ticket-num {
          font-family: ui-monospace, monospace;
          font-size: 11px;
          font-weight: 700;
          color: #3b82f6;
          background: rgba(59,130,246,0.08);
          padding: 2px 6px;
          border-radius: 4px;
          letter-spacing: 0.02em;
        }
        [data-theme='dark'] .sp-view-ticket-num {
          background: rgba(59,130,246,0.15) !important;
          color: #60a5fa !important;
        }
        .sp-view-ticket-arrow {
          color: var(--text-slate-300);
          font-size: 18px;
          font-weight: 700;
          opacity: 0;
          transition: all 0.2s;
        }
        .sp-view-ticket-card:hover .sp-view-ticket-arrow {
          opacity: 1;
          color: #3b82f6;
          transform: translateX(2px);
        }

        /* ── Create/Edit Drawer form sections (preserved) ──────── */
        .sp-form-section {
          background: var(--bg-pure-white);
          padding: 20px;
          border-radius: 12px;
          border: 1px solid var(--border-slate-200);
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
          margin-bottom: 16px;
        }
        [data-theme='dark'] .sp-form-section {
          background: #161b22 !important;
          border-color: #1f2937 !important;
        }
        .sp-section-icon {
          padding: 6px;
          border-radius: 6px;
          display: flex;
        }
        .sp-section-icon.slate { background: var(--bg-slate-50); }
        .sp-section-icon.orange { background: var(--bg-orange-50); }
        .sp-section-icon.green { background: var(--bg-green-50); }
        [data-theme='dark'] .sp-section-icon.slate { background: #1f2937 !important; }
        [data-theme='dark'] .sp-section-icon.orange { background: rgba(249,115,22,0.12) !important; }
        [data-theme='dark'] .sp-section-icon.green { background: rgba(16,185,129,0.12) !important; }
        .sp-info-hint {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: var(--bg-slate-50);
          border-radius: 6px;
          border: 1px dashed var(--border-slate-200);
        }
        [data-theme='dark'] .sp-info-hint {
          background: #1f2937 !important;
          border-color: #374151 !important;
        }
        .sp-ticket-num-tag {
          background: var(--bg-blue-50);
          border: 1px solid var(--border-blue-200);
          color: #2563eb;
          font-weight: 700;
          border-radius: 4px;
          font-size: 10px;
        }
        [data-theme='dark'] .sp-ticket-num-tag {
          background: rgba(59,130,246,0.15) !important;
          border-color: rgba(59,130,246,0.25) !important;
          color: #60a5fa !important;
        }
        .sp-drawer-icon-box {
          padding: 8px;
          background: var(--bg-sky-50);
          border-radius: 8px;
          display: flex;
        }
        [data-theme='dark'] .sp-drawer-icon-box {
          background: rgba(14,165,233,0.15) !important;
        }

        /* ── Drawer dark overrides (Ant Design) ────────────────── */
        [data-theme='dark'] .ant-drawer-header {
          background: #161b22 !important;
          border-bottom-color: #1f2937 !important;
        }
        [data-theme='dark'] .ant-drawer-body {
          background: #0b0f1a !important;
        }
        [data-theme='dark'] .ant-drawer-title {
          color: var(--text-slate-900) !important;
        }

        /* ── Sprint Detail Drawer — three column shell ─────────── */
        .sp-detail-shell {
          display: grid;
          grid-template-columns: 380px minmax(420px, 1fr) minmax(440px, 1.1fr);
          gap: 0;
          min-height: 100%;
        }
        @media (max-width: 1400px) {
          .sp-detail-shell { grid-template-columns: 360px 1fr 1fr; }
        }
        @media (max-width: 1100px) {
          .sp-detail-shell { grid-template-columns: 1fr; }
          .sp-detail-left, .sp-detail-mid { border-right: none !important; }
        }
        .sp-detail-left {
          padding: 24px 20px 24px 28px;
          border-right: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white);
          display: flex;
          flex-direction: column;
          gap: 16px;
          overflow-y: auto;
          max-height: calc(100vh - 73px);
        }
        [data-theme='dark'] .sp-detail-left {
          background: #0f1419 !important;
          border-right-color: #1f2937 !important;
        }
        .sp-detail-mid {
          padding: 24px 20px;
          border-right: 1px solid var(--border-slate-200);
          display: flex;
          flex-direction: column;
          gap: 16px;
          overflow-y: auto;
          max-height: calc(100vh - 73px);
          background: var(--bg-slate-50);
        }
        [data-theme='dark'] .sp-detail-mid {
          background: #0b0f1a !important;
          border-right-color: #1f2937 !important;
        }
        .sp-detail-right {
          padding: 24px 28px 24px 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          overflow-y: auto;
          max-height: calc(100vh - 73px);
        }
        .sp-detail-card-flush {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        /* Hide scrollbars between column layout while keeping scroll functional */
        .sp-detail-left,
        .sp-detail-mid,
        .sp-detail-right {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .sp-detail-left::-webkit-scrollbar,
        .sp-detail-mid::-webkit-scrollbar,
        .sp-detail-right::-webkit-scrollbar {
          width: 0;
          height: 0;
          display: none;
        }

        /* Cards on detail */
        .sp-detail-card {
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 14px;
          padding: 18px;
          box-shadow: 0 1px 3px rgba(15,23,42,0.03);
        }
        [data-theme='dark'] .sp-detail-card {
          background: #161b22 !important;
          border-color: #1f2937 !important;
        }
        .sp-card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 14px;
        }
        .sp-card-title {
          font-size: 11.5px !important;
          font-weight: 800 !important;
          color: var(--text-slate-700) !important;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        [data-theme='dark'] .sp-card-title { color: #cbd5e1 !important; }

        /* Banner */
        .sp-detail-banner {
          padding: 14px 16px;
          border-radius: 14px;
          border: 1px solid;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .sp-delivery-note {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 12px;
          background: var(--bg-pure-white);
          border-radius: 10px;
          font-size: 14px;
        }
        [data-theme='dark'] .sp-delivery-note {
          background: #161b22 !important;
        }

        /* Priority chip in header */
        .sp-priority-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          font-size: 10px;
          font-weight: 800;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .sp-priority-high { background: rgba(239,68,68,0.1); color: #dc2626; }
        .sp-priority-medium { background: rgba(245,158,11,0.1); color: #d97706; }
        .sp-priority-low { background: rgba(16,185,129,0.1); color: #059669; }

        /* Hero ring + mini stats */
        .sp-detail-hero-row {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          gap: 14px;
          margin-bottom: 16px;
        }
        .sp-detail-ring {
          width: 120px;
          height: 120px;
          align-self: center;
        }
        .sp-mini-stat-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
          width: 100%;
        }
        .sp-mini-stat {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: var(--bg-slate-50);
          border-radius: 10px;
          border: 1px solid var(--border-slate-200);
          min-width: 0;
        }
        [data-theme='dark'] .sp-mini-stat {
          background: #1c232e !important;
          border-color: #2d3748 !important;
        }
        .sp-mini-stat-icon {
          width: 28px;
          height: 28px;
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          flex-shrink: 0;
        }
        .sp-mini-stat-text { min-width: 0; }
        .sp-mini-stat-value {
          font-size: 17px;
          font-weight: 800;
          color: var(--text-slate-900);
          line-height: 1;
          letter-spacing: -0.01em;
        }
        [data-theme='dark'] .sp-mini-stat-value { color: #f1f5f9 !important; }
        .sp-mini-stat-label {
          font-size: 10.5px;
          color: var(--text-slate-500);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-top: 3px;
          white-space: nowrap;
        }

        /* Stacked composition bar */
        .sp-stack-bar {
          display: flex;
          height: 8px;
          background: var(--bg-slate-50);
          border-radius: 999px;
          overflow: hidden;
          margin-bottom: 12px;
        }
        [data-theme='dark'] .sp-stack-bar { background: #1f2937 !important; }
        .sp-stack-bar > div {
          height: 100%;
          transition: width 0.6s cubic-bezier(0.4,0,0.2,1);
        }

        /* Pace insight */
        .sp-pace-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: var(--bg-slate-50);
          border-radius: 8px;
          border: 1px dashed var(--border-slate-200);
        }
        [data-theme='dark'] .sp-pace-row {
          background: #1c232e !important;
          border-color: #2d3748 !important;
        }

        /* Timeline detail grid */
        .sp-tl-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .sp-tl-stat {
          padding: 12px;
          background: var(--bg-slate-50);
          border-radius: 10px;
          border: 1px solid var(--border-slate-200);
        }
        [data-theme='dark'] .sp-tl-stat {
          background: #1c232e !important;
          border-color: #2d3748 !important;
        }
        .sp-tl-stat-label {
          font-size: 10.5px;
          color: var(--text-slate-500);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 4px;
        }
        .sp-tl-stat-value {
          font-size: 13.5px;
          font-weight: 700;
          color: var(--text-slate-900);
          letter-spacing: -0.01em;
        }
        [data-theme='dark'] .sp-tl-stat-value { color: #f1f5f9 !important; }
        .sp-tl-stat-sub {
          font-size: 11px;
          color: var(--text-slate-500);
          font-weight: 500;
          margin-top: 2px;
        }
        .sp-tl-tags {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-top: 12px;
        }
        .sp-tl-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 9px;
          background: var(--bg-slate-50);
          border: 1px solid var(--border-slate-200);
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-slate-600);
        }
        [data-theme='dark'] .sp-tl-tag {
          background: #1c232e !important;
          border-color: #2d3748 !important;
          color: #cbd5e1 !important;
        }

        /* Priority breakdown */
        .sp-prio-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .sp-prio-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .sp-prio-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
        }
        .sp-prio-bar {
          flex: 1;
          height: 6px;
          background: var(--bg-slate-50);
          border-radius: 999px;
          overflow: hidden;
        }
        [data-theme='dark'] .sp-prio-bar { background: #1f2937 !important; }
        .sp-prio-bar-fill {
          height: 100%;
          border-radius: 999px;
          transition: width 0.6s cubic-bezier(0.4,0,0.2,1);
        }
        .sp-prio-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 7px;
          font-size: 10px;
          font-weight: 700;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        /* Contributors row-wise */
        .sp-contrib-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .sp-contrib-row-card {
          display: grid;
          grid-template-columns: 36px 44px 1fr 130px;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 12px;
          transition: all 0.2s ease;
        }
        .sp-contrib-row-card:hover {
          border-color: #cbd5e1;
          box-shadow: 0 2px 12px rgba(15,23,42,0.05);
          transform: translateX(2px);
        }
        [data-theme='dark'] .sp-contrib-row-card {
          background: #161b22 !important;
          border-color: #1f2937 !important;
        }
        [data-theme='dark'] .sp-contrib-row-card:hover {
          border-color: #475569 !important;
        }
        .sp-contrib-rank {
          font-size: 16px;
          font-weight: 800;
          letter-spacing: -0.02em;
          opacity: 0.85;
          font-family: ui-monospace, monospace;
          text-align: center;
        }
        .sp-contrib-meta {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .sp-contrib-share {
          text-align: right;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }
        .sp-contrib-share-pct {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1;
        }
        .sp-contrib-share-label {
          font-size: 9.5px;
          color: var(--text-slate-500);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .sp-contrib-share-bar {
          width: 100%;
          margin-top: 2px;
        }
        @media (max-width: 600px) {
          .sp-contrib-row-card { grid-template-columns: 28px 40px 1fr; }
          .sp-contrib-share { display: none; }
        }

        /* legacy grid kept for fallback */
        .sp-contrib-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 12px;
        }
        .sp-contrib-card {
          padding: 14px;
          background: var(--bg-slate-50);
          border: 1px solid var(--border-slate-200);
          border-radius: 12px;
          transition: all 0.2s ease;
        }
        .sp-contrib-card:hover {
          border-color: #cbd5e1;
          box-shadow: 0 2px 8px rgba(15,23,42,0.04);
        }
        [data-theme='dark'] .sp-contrib-card {
          background: #1c232e !important;
          border-color: #2d3748 !important;
        }
        [data-theme='dark'] .sp-contrib-card:hover {
          border-color: #475569 !important;
        }
        .sp-contrib-head {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }
        .sp-contrib-avatar {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 14px;
          border: 1px solid;
          flex-shrink: 0;
        }
        .sp-contrib-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }
        .sp-contrib-stats {
          display: flex;
          gap: 10px;
          font-size: 10.5px;
          font-weight: 600;
          flex-wrap: wrap;
        }
        .sp-top-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          color: #fff;
          font-size: 9.5px;
          font-weight: 800;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          box-shadow: 0 2px 6px rgba(245,158,11,0.3);
        }

        /* Tab group for ticket board */
        .sp-tab-group {
          display: inline-flex;
          background: var(--bg-slate-50);
          border: 1px solid var(--border-slate-200);
          border-radius: 8px;
          padding: 3px;
        }
        [data-theme='dark'] .sp-tab-group {
          background: #1c232e !important;
          border-color: #2d3748 !important;
        }
        .sp-tab {
          background: transparent;
          border: none;
          padding: 5px 12px;
          font-size: 11.5px;
          font-weight: 600;
          color: var(--text-slate-500);
          border-radius: 6px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.15s ease;
        }
        .sp-tab:hover { color: var(--text-slate-900); }
        [data-theme='dark'] .sp-tab:hover { color: #f1f5f9; }
        .sp-tab.active {
          background: var(--bg-pure-white);
          color: var(--text-slate-900);
          box-shadow: 0 1px 3px rgba(15,23,42,0.06);
        }
        [data-theme='dark'] .sp-tab.active {
          background: #0f1419 !important;
          color: #f1f5f9 !important;
        }
        .sp-tab-count {
          font-size: 10px;
          font-weight: 800;
          padding: 1px 6px;
          background: var(--bg-slate-100, #e2e8f0);
          color: var(--text-slate-600);
          border-radius: 999px;
          line-height: 1.4;
        }
        .sp-tab.active .sp-tab-count {
          background: rgba(59,130,246,0.12);
          color: #2563eb;
        }
        [data-theme='dark'] .sp-tab-count {
          background: #2d3748 !important;
          color: #cbd5e1 !important;
        }
        [data-theme='dark'] .sp-tab.active .sp-tab-count {
          background: rgba(59,130,246,0.2) !important;
          color: #60a5fa !important;
        }

        /* Ticket grid in board */
        .sp-ticket-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .sp-ticket-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s ease;
          position: relative;
        }
        .sp-ticket-row:hover {
          border-color: #3b82f6;
          box-shadow: 0 2px 12px rgba(59,130,246,0.08);
          transform: translateX(2px);
        }
        [data-theme='dark'] .sp-ticket-row {
          background: #0f1419 !important;
          border-color: #2d3748 !important;
        }
        [data-theme='dark'] .sp-ticket-row:hover {
          border-color: #3b82f6 !important;
        }
        .sp-ticket-row-accent {
          width: 3px;
          align-self: stretch;
          border-radius: 999px;
          flex-shrink: 0;
        }
        .sp-ticket-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .sp-assignee-avatar {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 12px;
          border: 1px solid;
        }
        .sp-ticket-row-arrow {
          color: var(--text-slate-300);
          opacity: 0;
          transition: all 0.2s;
          font-size: 12px;
        }
        .sp-ticket-row:hover .sp-ticket-row-arrow {
          opacity: 1;
          color: #3b82f6;
          transform: translateX(2px);
        }
      `}</style>
      </div>
    </div>
  );
}
