"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Typography,
  Button,
  Space,
  Row,
  Col,
  Pagination,
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
  DownOutlined,
  LeftOutlined,
  RightOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
  CloseCircleOutlined,
  TableOutlined,
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
import TransactionHistoryDrawer from "@/components/common/TransactionHistoryDrawer";

const { Title, Text } = Typography;
const { Option } = Select;

const BulbDot = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="M9 21h6m-3-3v3M7 12a5 5 0 1 1 10 0c0 2-1 3-2 4v2H9v-2c-1-1-2-2-2-4Z" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Sparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  const min = Math.min(...data);
  const max = Math.max(...data, min + 1);
  const range = max - min;
  const width = 72;
  const height = 28;
  const bottomPadding = 4;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    let y = height - bottomPadding;
    if (max > min) {
      y = height - bottomPadding - ((d - min) / range) * (height - bottomPadding - 2);
    }
    return { x, y };
  });

  let pathD = `M ${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    pathD += ` L ${points[i].x},${points[i].y}`;
  }

  const fillD = `${pathD} L ${width},${height} L 0,${height} Z`;

  const isFlat = data.every(d => d === data[0]);
  const flatY = 2;
  const flatPathD = `M 0,${flatY} L ${width},${flatY}`;
  const flatFillD = `${flatPathD} L ${width},${height} L 0,${height} Z`;

  const gradId = `spark-grad-${color.replace('#', '')}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0.05} />
        </linearGradient>
      </defs>
      <path d={isFlat ? flatFillD : fillD} fill={`url(#${gradId})`} />
      <path d={isFlat ? flatPathD : pathD} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

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
    canReadTicketPlan,
    canReadActivityLog
  } = usePermission();
  const [historyOpen, setHistoryOpen] = useState(false);

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

  const ticketOptions = useMemo(() => {
    const optionsMap = new Map<string, { label: string; value: string; item: any }>();

    // Add available tickets
    availableTickets.forEach(t => {
      optionsMap.set(t.id, {
        label: `${t.ticketNumber} - ${t.title}`,
        value: t.id,
        item: t
      });
    });

    // Add editing plan tickets to ensure their labels render correctly even if not in availableTickets
    if (editingPlan?.tickets) {
      editingPlan.tickets.forEach(t => {
        if (!optionsMap.has(t.id)) {
          optionsMap.set(t.id, {
            label: `${t.ticketNumber} - ${t.title}`,
            value: t.id,
            item: t
          });
        }
      });
    }

    return Array.from(optionsMap.values());
  }, [availableTickets, editingPlan]);

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

      // Fetch plans respecting search, but NOT project or status
      // This allows us to calculate accurate status and project counts in JS
      const data = await ReleasePlanService.getReleasePlans({
        type: "sprint_plan",
        search: activeFilters.search || undefined,
        // We omit status and projectId here to get the full set for metrics
        limit: 100, // Increased limit to ensure we get all plans for the current view
      });

      const plans = data?.data || [];
      setAllPlans(plans);

      // Filter by project and status in Javascript for display in the table/calendar
      let filteredPlans = plans;
      if (activeFilters.projectId) {
        filteredPlans = filteredPlans.filter(p => {
          const pid = typeof p.project === 'object' ? p.project?.id : p.project;
          return pid === activeFilters.projectId;
        });
      }
      if (activeFilters.status) {
        filteredPlans = filteredPlans.filter(p => p.status === activeFilters.status);
      }
      setSprintPlans(filteredPlans);
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
        status: editingPlan ? editingPlan.status : "planning",
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

  const handleEdit = async (plan: ReleasePlan) => {
    const hideLoading = message.loading("Loading plan details...", 0);
    try {
      const fullPlan = await ReleasePlanService.getReleasePlanById(plan.id);
      setEditingPlan(fullPlan);
      const projectId = typeof fullPlan?.project === "object" ? fullPlan.project?.id : "";
      setSelectedProject(projectId || "");

      const ticketIds = fullPlan?.tickets?.map((t) => t?.id) || [];

      form.setFieldsValue({
        name: fullPlan?.name,
        description: fullPlan?.description,
        project: projectId,
        deadline: fullPlan?.deadline ? dayjs(fullPlan.deadline) : null,
        startDate: fullPlan?.startDate ? dayjs(fullPlan.startDate) : null,
        endDate: fullPlan?.endDate ? dayjs(fullPlan.endDate) : null,
        goal: fullPlan?.goal,
        priority: fullPlan?.priority,
        tickets: ticketIds,
      });

      if (projectId) {
        await loadTicketsByProject(projectId);
      }
      setShowCreateModal(true);
    } catch (error) {
      console.error("Failed to load plan details for editing:", error);
      message.error("Failed to load plan details");
    } finally {
      hideLoading();
    }
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

  // Per-project plan counts (respects search + status filters, ignores projectId so user can switch)
  const projectCounts = useMemo(() => {
    const base = allPlans.filter(p => {
      if (tableFilters.status && p.status !== tableFilters.status) return false;
      if (tableFilters.search) {
        const q = tableFilters.search.toLowerCase();
        const name = (p.name || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        const goal = (p.goal || '').toLowerCase();
        if (!name.includes(q) && !desc.includes(q) && !goal.includes(q)) return false;
      }
      return true;
    });
    const map = new Map<string, number>();
    base.forEach(p => {
      const pid = typeof p.project === 'object' ? p.project?.id : p.project;
      if (pid) map.set(pid, (map.get(pid) || 0) + 1);
    });
    return { map, total: base.length };
  }, [allPlans, tableFilters.status, tableFilters.search]);

  const PROJECT_PALETTE = ['#3b82f6'];

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

  // List vs Calendar vs Table view
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'table'>('table');
  const [calendarMonth, setCalendarMonth] = useState(() => dayjs());
  const [calLegendExpanded, setCalLegendExpanded] = useState(false);
  const CAL_LEGEND_LIMIT = 8;

  // Expanded card rows (for actual start/end details)
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Expanded table rows -> reveal a details panel (meta info not shown in the parent row)
  const [expandedTableRows, setExpandedTableRows] = useState<Set<string>>(new Set());
  const toggleTableRow = useCallback((id: string) => {
    setExpandedTableRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  // Sidebar projects show more/less
  const PROJECTS_COLLAPSED_LIMIT = 8;
  const [showAllProjects, setShowAllProjects] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  useEffect(() => { setCurrentPage(1); }, [tableFilters.search, tableFilters.projectId, tableFilters.status, sortBy]);

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

  const pagedSprintPlans = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedSprintPlans.slice(start, start + pageSize);
  }, [sortedSprintPlans, currentPage, pageSize]);

  // Project color helper (stable per project index)
  const getProjectColor = useCallback((projectId?: string) => {
    if (!projectId) return '#94a3b8';
    const idx = projects.findIndex((p: any) => p.value === projectId);
    return idx === -1 ? '#94a3b8' : PROJECT_PALETTE[idx % PROJECT_PALETTE.length];
  }, [projects]);

  // Calendar navigation bounds (clamped to actual sprint date range)
  const calendarBounds = useMemo(() => {
    const dates: dayjs.Dayjs[] = [];
    allPlans.forEach(p => {
      if (p.startDate) dates.push(dayjs(p.startDate));
      if (p.endDate) dates.push(dayjs(p.endDate));
    });
    if (!dates.length) return null;
    const earliest = dates.reduce((a, b) => (a.isBefore(b) ? a : b)).startOf('month');
    const latest = dates.reduce((a, b) => (a.isAfter(b) ? a : b)).startOf('month');
    return { earliest, latest };
  }, [allPlans]);

  // Projects & sprints visible in the current month (header stat)
  const calendarMonthStats = useMemo(() => {
    const monthStart = calendarMonth.startOf('month');
    const monthEnd = calendarMonth.endOf('month');
    const sprintsInMonth = sortedSprintPlans.filter(p => {
      if (!p.startDate || !p.endDate) return false;
      const s = dayjs(p.startDate);
      const e = dayjs(p.endDate);
      return !(e.isBefore(monthStart) || s.isAfter(monthEnd));
    });
    const uniqueProjects = new Set<string>();
    sprintsInMonth.forEach(p => {
      const pid = typeof p.project === 'object' ? p.project?.id : (p.project as any);
      if (pid) uniqueProjects.add(pid);
    });
    return { sprintCount: sprintsInMonth.length, projectCount: uniqueProjects.size };
  }, [sortedSprintPlans, calendarMonth]);

  const canGoPrevMonth = !calendarBounds || calendarMonth.isAfter(calendarBounds.earliest, 'month');
  // Allow up to 3 months past the latest sprint for forward planning
  const canGoNextMonth = !calendarBounds || calendarMonth.isBefore(calendarBounds.latest.add(3, 'month'), 'month');

  // Snap current month into range if sprints load and we're outside the bounds
  useEffect(() => {
    if (!calendarBounds) return;
    if (calendarMonth.isBefore(calendarBounds.earliest, 'month')) {
      setCalendarMonth(calendarBounds.earliest);
    } else if (calendarMonth.isAfter(calendarBounds.latest.add(3, 'month'), 'month')) {
      setCalendarMonth(calendarBounds.latest);
    }
  }, [calendarBounds]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Calendar data ─────────────────────────────────────────────
  // Monday-start, month grid, lane-assigned sprint ribbons per week.
  const calendarData = useMemo(() => {
    const startOfWeekMon = (d: dayjs.Dayjs) => {
      const dow = d.day();
      const offset = (dow + 6) % 7;
      return d.subtract(offset, 'day').startOf('day');
    };
    const endOfWeekMon = (d: dayjs.Dayjs) => startOfWeekMon(d).add(6, 'day').endOf('day');

    const calStart = startOfWeekMon(calendarMonth.startOf('month'));
    const calEnd = endOfWeekMon(calendarMonth.endOf('month'));

    const weeks: dayjs.Dayjs[][] = [];
    let cursor = calStart;
    while (cursor.isBefore(calEnd) || cursor.isSame(calEnd, 'day')) {
      const days: dayjs.Dayjs[] = [];
      for (let i = 0; i < 7; i++) {
        days.push(cursor);
        cursor = cursor.add(1, 'day');
      }
      weeks.push(days);
      if (weeks.length > 8) break; // safety
    }

    const filtered = sortedSprintPlans.filter(p => p.startDate && p.endDate);

    type Ribbon = {
      plan: ReleasePlan;
      startCol: number;
      span: number;
      continuesLeft: boolean;
      continuesRight: boolean;
      color: string;
      projectName?: string;
      lane: number;
    };

    const weekRibbons: Ribbon[][] = weeks.map(week => {
      const weekStart = week[0];
      const weekEnd = week[6].endOf('day');

      const overlapping = filtered
        .filter(p => {
          const s = dayjs(p.startDate!);
          const e = dayjs(p.endDate!);
          return !(e.isBefore(weekStart) || s.isAfter(weekEnd));
        })
        .map(p => {
          const s = dayjs(p.startDate!);
          const e = dayjs(p.endDate!);
          const clipStart = s.isBefore(weekStart) ? weekStart : s.startOf('day');
          const clipEnd = e.isAfter(weekEnd) ? weekEnd : e.endOf('day');
          const startCol = clipStart.diff(weekStart, 'day');
          const span = Math.max(clipEnd.startOf('day').diff(clipStart.startOf('day'), 'day') + 1, 1);
          const projectObj = typeof p.project === 'object' ? p.project : null;
          const projectId = projectObj?.id;
          return {
            plan: p,
            startCol,
            span,
            continuesLeft: s.isBefore(weekStart),
            continuesRight: e.isAfter(weekEnd),
            color: getProjectColor(projectId),
            projectName: projectObj?.name,
            lane: 0,
          };
        })
        .sort((a, b) => a.startCol - b.startCol || b.span - a.span);

      // Lane assignment: greedy, first available lane
      const lanes: number[] = []; // each entry = end col (exclusive) of last ribbon in that lane
      overlapping.forEach(r => {
        let li = lanes.findIndex(end => end <= r.startCol);
        if (li === -1) {
          li = lanes.length;
          lanes.push(0);
        }
        lanes[li] = r.startCol + r.span;
        r.lane = li;
      });

      return overlapping;
    });

    const maxLanesByWeek = weekRibbons.map(r => r.reduce((m, x) => Math.max(m, x.lane), -1) + 1);

    return { weeks, weekRibbons, maxLanesByWeek };
  }, [sortedSprintPlans, calendarMonth, getProjectColor]);

  const activeFilterCount = (tableFilters.search ? 1 : 0) + (tableFilters.projectId ? 1 : 0) + (tableFilters.status ? 1 : 0);


  return (
    <div className="sp-page-root" style={{ minHeight: "calc(100vh - 54px)" }}>
      {/* {contextHolder} */}
      <div className="sp-shell-wrap">
        <div className="sp-shell">
          {/* ── Sidebar ──────────────────────────────────────────── */}
          <aside className="sp-sidebar">
            <div className="sp-sidebar-top">
              <div className="sp-sidebar-brand">
                <div className="sp-hero-icon-box">
                  <CalendarOutlined style={{ fontSize: 24, color: 'var(--text-slate-900)' }} />
                </div>
                <div className="min-w-0">
                  <h1 className="sp-sidebar-title">Sprint Plans</h1>
                  <p className="sp-sidebar-subtitle">Milestone tracking</p>
                </div>
              </div>
              {canCreateTicketPlan && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setShowCreateModal(true)}
                  className="sp-side-create"
                  block
                >
                  Plan New Sprint
                </Button>
              )}
            </div>

            <div className="sp-sidebar-scroll">
              {/* Projects */}
              <div className="sp-sidebar-section">
                <div className="dh-side-label">PROJECTS</div>
                <div className="sp-sidebar-list sp-sidebar-list-scroll">
                  <button
                    className={`sp-sidebar-item ${!tableFilters.projectId ? 'active' : ''}`}
                    onClick={() => setTableFilters(prev => ({ ...prev, projectId: "" }))}
                  >
                    <span className="sp-sidebar-item-avatar sp-sidebar-item-avatar-all">
                      <ProjectOutlined style={{ fontSize: 10 }} />
                    </span>
                    <span className="sp-sidebar-item-label">All projects</span>
                    <span className="sp-sidebar-item-count">{projectCounts.total}</span>
                  </button>
                  {(showAllProjects ? projects : projects.slice(0, PROJECTS_COLLAPSED_LIMIT)).map((proj: any, i: number) => {
                    const count = projectCounts.map.get(proj.value) || 0;
                    const active = tableFilters.projectId === proj.value;
                    const color = PROJECT_PALETTE[i % PROJECT_PALETTE.length];
                    return (
                      <button
                        key={proj.value}
                        className={`sp-sidebar-item ${active ? 'active' : ''}`}
                        onClick={() => setTableFilters(prev => ({ ...prev, projectId: prev.projectId === proj.value ? "" : proj.value }))}
                        title={proj.label}
                      >
                        <span className="sp-sidebar-item-avatar" style={{ background: `${color}14`, color: `${color}70`, borderColor: `${color}33` }}>
                          <ProjectOutlined style={{ fontSize: 11 }} />
                        </span>
                        <span className="sp-sidebar-item-label">{proj.label}</span>
                        <span className="sp-sidebar-item-count">{count}</span>
                      </button>
                    );
                  })}
                  {projects.length > PROJECTS_COLLAPSED_LIMIT && (
                    <button
                      className="sp-sidebar-toggle"
                      onClick={() => setShowAllProjects(v => !v)}
                    >
                      {showAllProjects
                        ? 'Show less'
                        : `Show ${projects.length - PROJECTS_COLLAPSED_LIMIT} more`}
                      <DownOutlined style={{ fontSize: 9, transform: showAllProjects ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
                    </button>
                  )}
                  {projects.length === 0 && (
                    <div className="sp-sidebar-empty">No projects yet</div>
                  )}
                </div>
              </div>

              {/* Status */}
              {/* <div className="sp-sidebar-divider" /> */}
              <div className="sp-sidebar-section">
                <div className="dh-side-label">STATUS</div>
                <div className="sp-sidebar-list">
                  {([
                    { k: 'all', label: 'All', n: statusCounts.all, color: '#64748b', pulse: false, icon: <AppstoreOutlined /> },
                    { k: 'active', label: 'Active', n: statusCounts.active, color: '#3b82f6', pulse: true, icon: <PlayCircleOutlined /> },
                    { k: 'planning', label: 'Planning', n: statusCounts.planning, color: '#f59e0b', pulse: false, icon: <ClockCircleOutlined /> },
                    { k: 'completed', label: 'Completed', n: statusCounts.completed, color: '#10b981', pulse: false, icon: <CheckCircleOutlined /> },
                  ] as const).map(seg => {
                    const active = (tableFilters.status || 'all') === seg.k;
                    return (
                      <button
                        key={seg.k}
                        className={`sp-sidebar-item sp-sidebar-status-item ${active ? 'active' : ''}`}
                        onClick={() => setTableFilters(prev => ({ ...prev, status: seg.k === 'all' ? '' : seg.k }))}
                        style={active ? { ['--sp-accent' as any]: seg.color } : undefined}
                      >
                        <span
                          className="sp-sidebar-status-chip"
                          style={{ background: `${seg.color}14`, borderColor: `${seg.color}33` }}
                        >
                          {seg.k === 'all' ? (
                            <span
                              className={`sp-sidebar-status-dot ${seg.pulse ? 'pulse' : ''}`}
                              style={{ background: seg.color, ['--sp-dot' as any]: seg.color }}
                            />
                          ) : (
                            <span style={{ color: seg.color, fontSize: 11, display: 'flex' }}>{seg.icon}</span>
                          )}
                        </span>
                        <span className="sp-sidebar-item-label">{seg.label}</span>
                        <span
                          className="sp-sidebar-item-count"
                          style={active ? { background: `${seg.color}1a`, borderColor: `${seg.color}40`, color: seg.color } : undefined}
                        >
                          {seg.n}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {activeFilterCount > 0 && (
                <>
                  <div className="sp-sidebar-divider" />
                  <button
                    className="sp-sidebar-clear"
                    onClick={() => {
                      setTableFilters({ search: "", projectId: "", status: "" });
                      loadData({ search: "", projectId: "", status: "" });
                    }}
                  >
                    <CloseCircleOutlined style={{ fontSize: 12 }} /> Clear filters
                  </button>
                </>
              )}
            </div>
          </aside>
          {/* ── Main Content ─────────────────────────────────────── */}
          <main className="sp-main">
            {/* Top bar: search · live stats · view controls */}
            <div className="sp-main-topbar">
              <div className="pp-search-wrap" style={{ flex: 1, maxWidth: 320 }}>
                <SearchOutlined className="pp-search-icon" />
                <input
                  className="pp-search"
                  placeholder="Search by name, goal, or description..."
                  value={tableFilters.search}
                  onChange={(e) => setTableFilters(prev => ({ ...prev, search: e.target.value }))}
                />
                {/* {!tableFilters.search && <span className="pp-kbd">⌘K</span>} */}
              </div>

              <div className="sp-main-stats" style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', color: 'var(--text-slate-500)', whiteSpace: 'nowrap' }}>
                <span className="inline-flex items-center gap-1.5">
                  <span className="sp-pulse-dot" />
                  <strong style={{ color: 'var(--text-slate-700)' }}>{metrics.active}</strong> active cycles
                </span>
                <span style={{ color: 'var(--text-slate-300)' }}>·</span>
                <span><strong style={{ color: 'var(--text-slate-700)' }}>{metrics.planning}</strong> in planning</span>
              </div>

              <div className="pp-topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                <div className="pp-segmented">
                  <button type="button" className={viewMode === 'table' ? 'is-active' : ''} onClick={() => setViewMode('table')} aria-label="Table view"><TableOutlined /></button>
                  <button type="button" className={viewMode === 'list' ? 'is-active' : ''} onClick={() => setViewMode('list')} aria-label="Card view"><UnorderedListOutlined /></button>
                  <button type="button" className={viewMode === 'calendar' ? 'is-active' : ''} onClick={() => setViewMode('calendar')} aria-label="Calendar view"><AppstoreOutlined /></button>
                </div>

                <Tooltip title="Refresh">
                  <button
                    type="button"
                    className="pp-ghost-btn"
                    onClick={async () => {
                      setIsRefreshing(true);
                      await loadData();
                      setIsRefreshing(false);
                      message.success("Success, Sprint view refreshed");
                    }}
                    disabled={loading && !isRefreshing}
                  >
                    <ReloadOutlined spin={isRefreshing} />
                  </button>
                </Tooltip>

                <Select
                  value={sortBy}
                  onChange={(v) => setSortBy(v as any)}
                  suffixIcon={<DownOutlined style={{ color: 'var(--text-slate-400)', fontSize: 10 }} />}
                  popupMatchSelectWidth={false}
                  styles={{ popup: { root: { minWidth: 200, borderRadius: 10 } } }}
                  style={{ height: 32, width: 170 }}
                  className="sp-premium-select"
                >
                  <Option value="recent">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <HistoryOutlined style={{ fontSize: 12, color: 'var(--text-slate-400)' }} />
                      <Text style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-slate-700)' }}>Recently updated</Text>
                    </div>
                  </Option>
                  <Option value="endDate">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CalendarOutlined style={{ fontSize: 12, color: 'var(--text-slate-400)' }} />
                      <Text style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-slate-700)' }}>End date · soonest</Text>
                    </div>
                  </Option>
                  <Option value="progress">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <LineChartOutlined style={{ fontSize: 12, color: 'var(--text-slate-400)' }} />
                      <Text style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-slate-700)' }}>Progress · highest</Text>
                    </div>
                  </Option>
                  <Option value="name">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <ProjectOutlined style={{ fontSize: 12, color: 'var(--text-slate-400)' }} />
                      <Text style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-slate-700)' }}>Name · A → Z</Text>
                    </div>
                  </Option>
                </Select>
              </div>
            </div>

            {/* Premium KPI Hero Row */}
            <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
              <Col xs={24} sm={12} lg={6}>
                <div className="pp-stat-card">
                  <div className="pp-stat-top">
                    <div className="pp-stat-left">
                      <span className="pp-stat-icon" style={{ background: 'rgba(59,130,246,0.10)', color: '#3b82f6' }}>
                        <RocketOutlined />
                      </span>
                      <span className="pp-stat-label">Active Cycles</span>
                    </div>
                    <span className="sp-stat-pulse" />
                  </div>
                  <div className="pp-stat-bottom">
                    <div className="pp-stat-value-wrap">
                      <span className="pp-stat-value">{metrics.active}</span>
                      <span className="pp-stat-period">in flight</span>
                    </div>
                    <div className="pp-stat-spark">
                      <Sparkline data={[0.0, 0.2, 0.4, 0.55, 0.75, 0.85, 1.0].map(r => r * metrics.active)} color="#3b82f6" />
                    </div>
                  </div>
                </div>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <div className="pp-stat-card">
                  <div className="pp-stat-top">
                    <div className="pp-stat-left">
                      <span className="pp-stat-icon" style={{ background: 'rgba(100,116,139,0.10)', color: '#64748b' }}>
                        <PieChartOutlined />
                      </span>
                      <span className="pp-stat-label">In Planning</span>
                    </div>
                  </div>
                  <div className="pp-stat-bottom">
                    <div className="pp-stat-value-wrap">
                      <span className="pp-stat-value">{metrics.planning}</span>
                      <span className="pp-stat-period">queued</span>
                    </div>
                    <div className="pp-stat-spark">
                      <Sparkline data={[0.0, 0.3, 0.25, 0.5, 0.65, 0.8, 1.0].map(r => r * metrics.planning)} color="#64748b" />
                    </div>
                  </div>
                </div>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <div className="pp-stat-card">
                  <div className="pp-stat-top">
                    <div className="pp-stat-left">
                      <span className="pp-stat-icon" style={{ background: 'rgba(16,185,129,0.10)', color: '#10b981' }}>
                        <CheckCircleOutlined />
                      </span>
                      <span className="pp-stat-label">Shipped</span>
                    </div>
                  </div>
                  <div className="pp-stat-bottom">
                    <div className="pp-stat-value-wrap">
                      <span className="pp-stat-value">{metrics.completed}</span>
                      <span className="pp-stat-period">delivered</span>
                    </div>
                    <div className="pp-stat-spark">
                      <Sparkline data={[0.0, 0.1, 0.3, 0.5, 0.7, 0.9, 1.0].map(r => r * metrics.completed)} color="#10b981" />
                    </div>
                  </div>
                </div>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <div className="pp-stat-card">
                  <div className="pp-stat-top">
                    <div className="pp-stat-left">
                      <span className="pp-stat-icon" style={{ background: 'rgba(59,130,246,0.10)', color: '#3b82f6' }}>
                        <LineChartOutlined />
                      </span>
                      <span className="pp-stat-label">Avg. Progress</span>
                    </div>
                  </div>
                  <div className="pp-stat-bottom">
                    <div className="pp-stat-value-wrap">
                      <span className="pp-stat-value">{metrics.avgProgress}<span style={{ fontSize: 18, color: 'var(--text-slate-400)', marginLeft: 2 }}>%</span></span>
                      <span className="pp-stat-period">across cycles</span>
                    </div>
                    <div className="pp-stat-spark">
                      <Sparkline data={[0.0, 0.2, 0.3, 0.45, 0.6, 0.8, 1.0].map(r => r * metrics.avgProgress)} color="#3b82f6" />
                    </div>
                  </div>
                </div>
              </Col>
            </Row>

            {/* Main Content — List or Calendar */}
            {viewMode === 'calendar' && (
              <div className="sp-cal-card">
                <div className="sp-cal-header">
                  <div className="sp-cal-title-block">
                    <Text className="sp-cal-title">{calendarMonth.format('MMMM YYYY')}</Text>
                    <div className="sp-cal-stat-row">
                      <span className="sp-cal-stat">
                        <span className="sp-cal-stat-num">{calendarMonthStats.projectCount}</span>
                        <span className="sp-cal-stat-label">Project{calendarMonthStats.projectCount !== 1 ? 's' : ''}</span>
                      </span>
                      <span className="sp-cal-stat-sep" />
                      <span className="sp-cal-stat">
                        <span className="sp-cal-stat-num">{calendarMonthStats.sprintCount}</span>
                        <span className="sp-cal-stat-label">Sprint{calendarMonthStats.sprintCount !== 1 ? 's' : ''}</span>
                      </span>
                    </div>
                  </div>
                  <div className="sp-cal-nav">
                    <Tooltip title={canGoPrevMonth ? 'Previous month' : `No sprints before ${calendarBounds?.earliest.format('MMM YYYY')}`}>
                      <Button
                        size="small"
                        icon={<LeftOutlined />}
                        onClick={() => canGoPrevMonth && setCalendarMonth(m => m.subtract(1, 'month'))}
                        disabled={!canGoPrevMonth}
                        className="sp-cal-nav-btn"
                      />
                    </Tooltip>
                    <Button
                      size="small"
                      onClick={() => {
                        const today = dayjs();
                        if (!calendarBounds) { setCalendarMonth(today); return; }
                        if (today.isBefore(calendarBounds.earliest, 'month')) setCalendarMonth(calendarBounds.earliest);
                        else if (today.isAfter(calendarBounds.latest.add(3, 'month'), 'month')) setCalendarMonth(calendarBounds.latest);
                        else setCalendarMonth(today);
                      }}
                      className="sp-cal-nav-btn sp-cal-nav-today"
                    >
                      Current Month
                    </Button>
                    <Tooltip title={canGoNextMonth ? 'Next month' : 'No sprints further ahead'}>
                      <Button
                        size="small"
                        icon={<RightOutlined />}
                        onClick={() => canGoNextMonth && setCalendarMonth(m => m.add(1, 'month'))}
                        disabled={!canGoNextMonth}
                        className="sp-cal-nav-btn"
                      />
                    </Tooltip>
                  </div>
                </div>

                <div className="sp-cal-body sp-cal-body-weeks">
                  {loading ? (
                    <div className="sp-card-loading"><Spin /></div>
                  ) : calendarData.weeks.map((week, wi) => {
                    const lanes = calendarData.maxLanesByWeek[wi];
                    const ribbonHeight = lanes > 0 ? lanes * 26 + 14 : 0;
                    const ribbons = calendarData.weekRibbons[wi];
                    const weekStart = week[0];
                    const weekEnd = week[6];
                    const dayOfYear = weekStart.diff(weekStart.startOf('year'), 'day');
                    const weekNum = Math.floor(dayOfYear / 7) + 1;
                    const containsToday = week.some(d => d.isSame(dayjs(), 'day'));
                    return (
                      <section className={`sp-cal-week-section ${containsToday ? 'has-today' : ''}`} key={wi}>
                        <header className="sp-cal-week-label">
                          <div className="sp-cal-week-label-left">
                            <span className="sp-cal-week-num">Week {weekNum}</span>
                            <span className="sp-cal-week-range">
                              {weekStart.format(weekStart.month() === weekEnd.month() ? 'MMM D' : 'MMM D')} – {weekEnd.format(weekStart.month() === weekEnd.month() ? 'D, YYYY' : 'MMM D, YYYY')}
                            </span>
                          </div>
                          <span className="sp-cal-week-count">
                            {ribbons.length === 0 ? 'No sprints' : `${ribbons.length} sprint${ribbons.length !== 1 ? 's' : ''}`}
                          </span>
                        </header>
                        <div className="sp-cal-week-grid">
                          <div className="sp-cal-week-days">
                            {week.map((day, di) => {
                              const isOutside = day.month() !== calendarMonth.month();
                              const isToday = day.isSame(dayjs(), 'day');
                              const isWeekend = day.day() === 0 || day.day() === 6;
                              return (
                                <div
                                  key={di}
                                  className={`sp-cal-day-cell ${isOutside ? 'outside' : ''} ${isToday ? 'today' : ''} ${isWeekend ? 'weekend' : ''}`}
                                >
                                  <span className="sp-cal-day-weekday">{day.format('ddd')}</span>
                                  <span className={`sp-cal-day-num ${isToday ? 'today' : ''}`}>
                                    {day.format('D')}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                          {ribbonHeight > 0 ? (
                            <div className="sp-cal-week-ribbons" style={{ height: ribbonHeight }}>
                              {ribbons.map(r => {
                                const left = (r.startCol / 7) * 100;
                                const width = (r.span / 7) * 100;
                                const cfg =
                                  r.plan.status === 'active' ? { dot: '#3b82f6', pulse: true } :
                                    r.plan.status === 'completed' ? { dot: '#10b981', pulse: false } :
                                      r.plan.status === 'planning' ? { dot: '#f59e0b', pulse: false } :
                                        { dot: '#94a3b8', pulse: false };
                                const hoverStart = r.plan.startDate ? dayjs(r.plan.startDate) : null;
                                const hoverEnd = r.plan.endDate ? dayjs(r.plan.endDate) : null;
                                const hoverDays = hoverStart && hoverEnd ? Math.max(hoverEnd.diff(hoverStart, 'day'), 1) : 0;
                                const hoverPct = r.plan.progress || 0;
                                const hoverDone = r.plan.completedTickets || 0;
                                const hoverTotal = r.plan.totalTickets || 0;
                                const hoverProgressColor = hoverPct >= 100 ? '#10b981' : hoverPct >= 60 ? '#3b82f6' : hoverPct >= 30 ? '#6366f1' : '#94a3b8';
                                const hoverStartedAt = r.plan.startedAt ? dayjs(r.plan.startedAt) : null;
                                const hoverCompletedAt = r.plan.completedAt ? dayjs(r.plan.completedAt) : null;
                                const hoverStatusCfg =
                                  r.plan.status === 'active' ? { color: '#1d4ed8', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)', dot: '#3b82f6', label: 'Active', pulse: true } :
                                    r.plan.status === 'planning' ? { color: '#b45309', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', dot: '#f59e0b', label: 'Planning', pulse: false } :
                                      r.plan.status === 'completed' ? { color: '#047857', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', dot: '#10b981', label: 'Completed', pulse: false } :
                                        { color: '#475569', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.25)', dot: '#94a3b8', label: r.plan.status || '—', pulse: false };

                                return (
                                  <Tooltip
                                    key={`${r.plan.id}-${wi}`}
                                    overlayClassName="sp-cal-tooltip-wrap"
                                    mouseEnterDelay={0.15}
                                    placement="top"
                                    title={
                                      <div className="sp-cal-tooltip">
                                        <span className="sp-cal-tooltip-accent" style={{ background: cfg.dot }} />
                                        <div className="sp-cal-tooltip-head">
                                          <div className="sp-cal-tooltip-title-block">
                                            <div className="sp-cal-tooltip-name">{r.plan.name}</div>
                                            {r.projectName && (
                                              <div className="sp-cal-tooltip-project">
                                                <span className="sp-cal-tooltip-project-dot" style={{ background: r.color }} />
                                                {r.projectName}
                                              </div>
                                            )}
                                          </div>
                                          <div className="sp-cal-tooltip-badges">
                                            <span
                                              className="sp-cal-tooltip-status"
                                              style={{ background: hoverStatusCfg.bg, borderColor: hoverStatusCfg.border, color: hoverStatusCfg.color }}
                                            >
                                              <span
                                                className={`sp-cal-tooltip-status-dot ${hoverStatusCfg.pulse ? 'pulse' : ''}`}
                                                style={{ background: hoverStatusCfg.dot }}
                                              />
                                              {hoverStatusCfg.label}
                                            </span>
                                            {r.plan.priority && (
                                              <span className={`sp-cal-tooltip-prio sp-cal-tooltip-prio-${(r.plan.priority || '').toLowerCase()}`}>
                                                <FlagOutlined style={{ fontSize: 8 }} />
                                                {r.plan.priority}
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        <div className="sp-cal-tooltip-divider" />

                                        <div className="sp-cal-tooltip-stats">
                                          <div className="sp-cal-tooltip-stat">
                                            <div className="sp-cal-tooltip-stat-label">
                                              <CalendarOutlined style={{ fontSize: 9 }} />
                                              Timeline
                                            </div>
                                            <div className="sp-cal-tooltip-stat-value">
                                              {hoverStart ? hoverStart.format('MMM D') : '—'}
                                              <span className="sp-cal-tooltip-stat-arrow">→</span>
                                              {hoverEnd ? hoverEnd.format('MMM D, YYYY') : '—'}
                                            </div>
                                            <div className="sp-cal-tooltip-stat-sub">{hoverDays}d cycle</div>
                                          </div>
                                          <div className="sp-cal-tooltip-stat">
                                            <div className="sp-cal-tooltip-stat-label">
                                              <LineChartOutlined style={{ fontSize: 9 }} />
                                              Progress
                                            </div>
                                            <div className="sp-cal-tooltip-stat-value">
                                              <span className="sp-cal-tooltip-pct" style={{ color: hoverProgressColor }}>
                                                {hoverPct}<span className="sp-cal-tooltip-pct-unit">%</span>
                                              </span>
                                            </div>
                                            <div className="sp-cal-tooltip-stat-sub">
                                              <b>{hoverDone}</b> of <b>{hoverTotal}</b> done
                                            </div>
                                          </div>
                                        </div>

                                        <div className="sp-cal-tooltip-bar">
                                          <div
                                            className="sp-cal-tooltip-bar-fill"
                                            style={{
                                              width: `${hoverPct}%`,
                                              background: `linear-gradient(90deg, ${hoverProgressColor}, ${hoverProgressColor}cc)`,
                                            }}
                                          />
                                        </div>

                                        {(hoverStartedAt || hoverCompletedAt) && (
                                          <div className="sp-cal-tooltip-actuals">
                                            {hoverStartedAt && (
                                              <span className="sp-cal-tooltip-actual">
                                                <PlayCircleOutlined style={{ fontSize: 9, color: '#3b82f6' }} />
                                                Started <b>{hoverStartedAt.format('MMM D')}</b>
                                              </span>
                                            )}
                                            {hoverCompletedAt && (
                                              <span className="sp-cal-tooltip-actual">
                                                <CheckCircleOutlined style={{ fontSize: 9, color: '#10b981' }} />
                                                Closed <b>{hoverCompletedAt.format('MMM D')}</b>
                                              </span>
                                            )}
                                          </div>
                                        )}

                                        {r.plan.goal && (
                                          <>
                                            <div className="sp-cal-tooltip-divider" />
                                            <div className="sp-cal-tooltip-goal">
                                              <div className="sp-cal-tooltip-stat-label">
                                                <BulbDot />
                                                Sprint Goal
                                              </div>
                                              <div className="sp-cal-tooltip-goal-text">
                                                {r.plan.goal.length > 140 ? `${r.plan.goal.substring(0, 140)}…` : r.plan.goal}
                                              </div>
                                            </div>
                                          </>
                                        )}

                                        <div className="sp-cal-tooltip-footer">
                                          <ArrowRightOutlined style={{ fontSize: 9 }} />
                                          Click to view full details
                                        </div>
                                      </div>
                                    }
                                  >
                                    <button
                                      className={`sp-cal-ribbon ${r.continuesLeft ? 'cont-left' : ''} ${r.continuesRight ? 'cont-right' : ''}`}
                                      style={{
                                        left: `calc(${left}% + 4px)`,
                                        width: `calc(${width}% - 8px)`,
                                        top: 6 + r.lane * 26,
                                        background: `linear-gradient(135deg, ${cfg.dot}1f, ${cfg.dot}40)`,
                                        borderColor: `${cfg.dot}66`,
                                        color: cfg.dot,
                                      }}
                                      onClick={() => handleViewTickets(r.plan)}
                                    >
                                      <span className={`sp-cal-ribbon-dot ${cfg.pulse ? 'pulse' : ''}`} style={{ background: cfg.dot }} />
                                      <span className="sp-cal-ribbon-name">{r.plan.name}</span>
                                      {r.projectName && r.span > 1 && (
                                        <span className="sp-cal-ribbon-proj">· {r.projectName}</span>
                                      )}
                                    </button>
                                  </Tooltip>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="sp-cal-week-empty">No sprints scheduled this week</div>
                          )}
                        </div>
                      </section>
                    );
                  })}
                </div>

                {projects.length > 0 && (
                  <div className="sp-cal-legend">
                    <span className="sp-cal-legend-label">Projects</span>
                    {(calLegendExpanded ? projects : projects.slice(0, CAL_LEGEND_LIMIT)).map((p: any) => {
                      const c = getProjectColor(p.value);
                      const active = !tableFilters.projectId || tableFilters.projectId === p.value;
                      return (
                        <button
                          key={p.value}
                          className={`sp-cal-legend-chip ${!active ? 'muted' : ''}`}
                          onClick={() => setTableFilters(prev => ({ ...prev, projectId: prev.projectId === p.value ? '' : p.value }))}
                          title={p.label}
                        >
                          <span className="sp-cal-legend-dot" style={{ background: c }} />
                          {p.label}
                        </button>
                      );
                    })}
                    {projects.length > CAL_LEGEND_LIMIT && (
                      <button
                        className="sp-cal-legend-toggle"
                        onClick={() => setCalLegendExpanded(v => !v)}
                      >
                        {calLegendExpanded
                          ? 'Show less'
                          : `+${projects.length - CAL_LEGEND_LIMIT} more`}
                        <DownOutlined style={{ fontSize: 9, transform: calLegendExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
            {viewMode === 'list' && (
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
                {/* Premium card list */}
                <div className="sp-plist">
                  {loading ? (
                    <div className="sp-card-loading">
                      <Spin />
                    </div>
                  ) : pagedSprintPlans.length === 0 ? (
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
                      {canCreateTicketPlan && (
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={() => setShowCreateModal(true)}
                          style={{
                            height: 36,
                            fontWeight: 700,
                            borderRadius: 8,
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            border: 'none'
                          }}
                        >
                          Plan your first sprint
                        </Button>
                      )}
                    </div>
                  ) : (
                    pagedSprintPlans.map((record) => {
                      const project = typeof record.project === 'object' ? record.project : null;
                      const initial = (record.name || '?').charAt(0).toUpperCase();
                      const accent =
                        record.status === 'active' ? '#3b82f6' :
                          record.status === 'completed' ? '#10b981' :
                            record.status === 'planning' ? '#f59e0b' : '#64748b';

                      const statusCfg =
                        record.status === 'active' ? { dot: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', color: '#1d4ed8', label: 'Active', pulse: true } :
                          record.status === 'planning' ? { dot: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', color: '#b45309', label: 'Planning', pulse: false } :
                            record.status === 'completed' ? { dot: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', color: '#047857', label: 'Completed', pulse: false } :
                              { dot: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)', color: '#475569', label: record.status?.toUpperCase() || '—', pulse: false };

                      const pct = record.progress || 0;
                      const done = record?.completedTickets || 0;
                      const total = record?.totalTickets || 0;
                      const progressAccent = pct >= 100 ? '#10b981' : pct >= 60 ? '#3b82f6' : pct >= 30 ? '#6366f1' : '#94a3b8';

                      const today = dayjs();
                      const start = record.startDate ? dayjs(record.startDate) : null;
                      const end = record.endDate ? dayjs(record.endDate) : null;
                      const hasDates = !!(start && end);
                      const days = hasDates ? Math.max(end!.diff(start!, 'day'), 1) : 0;
                      let phaseLabel = '';
                      let phaseColor = '#64748b';
                      let phaseBg = 'rgba(100,116,139,0.08)';
                      if (record.status === 'completed') {
                        phaseLabel = 'Closed';
                        phaseColor = '#10b981';
                        phaseBg = 'rgba(16,185,129,0.08)';
                      } else if (hasDates) {
                        if (today.isBefore(start!)) {
                          phaseLabel = `Starts in ${start!.diff(today, 'day')}d`;
                          phaseColor = '#8b5cf6';
                          phaseBg = 'rgba(139,92,246,0.08)';
                        } else if (today.isAfter(end!)) {
                          phaseLabel = `${today.diff(end!, 'day')}d overdue`;
                          phaseColor = '#ef4444';
                          phaseBg = 'rgba(239,68,68,0.08)';
                        } else {
                          const remaining = end!.diff(today, 'day');
                          phaseLabel = remaining === 0 ? 'Ends today' : `${remaining}d left`;
                          phaseColor = remaining <= 2 ? '#f59e0b' : (record.status === 'active' ? '#3b82f6' : '#10b981');
                          phaseBg = remaining <= 2 ? 'rgba(245,158,11,0.08)' : (record.status === 'active' ? 'rgba(59,130,246,0.08)' : 'rgba(16,185,129,0.08)');
                        }
                      }
                      const elapsedPct = hasDates ? Math.min(Math.max((today.diff(start!, 'day') / days) * 100, 0), 100) : 0;

                      const startedAt = record.startedAt ? dayjs(record.startedAt) : null;
                      const completedAt = record.completedAt ? dayjs(record.completedAt) : null;
                      const startVariance = startedAt && start ? startedAt.diff(start, 'day') : null;
                      const endVariance = completedAt && end ? completedAt.diff(end, 'day') : null;
                      const actualDuration = startedAt && completedAt ? Math.max(completedAt.diff(startedAt, 'day'), 1) : null;
                      const isExpanded = expandedRowId === record.id;

                      return (
                        <article
                          key={record.id}
                          className="sp-plist-card"
                          style={{ ['--row-accent' as any]: accent }}
                        >
                          {/* Header — single row: avatar | project | sprint name | priority | status */}
                          <header className="sp-plist-head">
                            <div
                              className="sp-plist-row"
                              role="button"
                              tabIndex={0}
                              onClick={() => handleViewTickets(record)}
                              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleViewTickets(record); } }}
                            >
                              <div
                                className="sp-plist-avatar sp-custom-avatar"
                              >
                                <span className="sp-plist-avatar-letter">{initial}</span>
                              </div>

                              <div className="sp-plist-row-segments">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0, marginTop: '10px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span className="sp-plist-seg-name" title={record.name}>{record.name}</span>
                                  </div>
                                  <span className="sp-plist-seg sp-plist-seg-project">
                                    <span className="sp-plist-seg-label">Project:</span>
                                    {project ? (
                                      <span className="sp-plist-seg-value" title={project.name}>
                                        <span className="sp-plist-seg-dot" style={{ background: accent }} />
                                        {project.name}
                                      </span>
                                    ) : (
                                      <span className="sp-plist-seg-value muted">—</span>
                                    )}
                                  </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                  {record.priority && (
                                    <span className={`sp-plist-prio sp-plist-prio-${(record.priority || '').toLowerCase()}`}>
                                      <FlagOutlined style={{ fontSize: 9 }} />
                                      {record.priority}
                                    </span>
                                  )}
                                  <span
                                    className="sp-plist-status"
                                    style={{
                                      background: `linear-gradient(135deg, ${statusCfg.bg}, ${statusCfg.dot}26)`,
                                      borderColor: statusCfg.border,
                                      color: statusCfg.color,
                                    }}
                                  >
                                    <span
                                      className={`sp-plist-status-dot ${statusCfg.pulse ? 'pulse' : ''}`}
                                      style={{ background: statusCfg.dot, boxShadow: `0 0 0 3px ${statusCfg.dot}26` }}
                                    />
                                    {statusCfg.label}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </header>

                          {record.goal && (
                            <p className="sp-plist-goal-row" title={record.goal}>
                              <BulbDot />
                              {record.goal.length > 140 ? `${record.goal.substring(0, 140)}…` : record.goal}
                            </p>
                          )}

                          {/* Body — Progress + Timeline */}
                          <div className="sp-plist-body">
                            {/* Progress block */}
                            <div className="sp-plist-block">
                              <div className="sp-plist-block-head">
                                <div className="sp-plist-block-label">
                                  <LineChartOutlined style={{ fontSize: 10 }} />
                                  Progress
                                </div>
                                <div className="sp-plist-block-pct" style={{ color: progressAccent }}>
                                  <span className="sp-plist-block-pct-num">{pct}</span>
                                  <span className="sp-plist-block-pct-unit">%</span>
                                  {pct >= 100 && <CheckCircleOutlined style={{ color: '#10b981', fontSize: 11, marginLeft: 4 }} />}
                                </div>
                              </div>
                              <div className="sp-plist-bar">
                                <div
                                  className="sp-plist-bar-fill"
                                  style={{
                                    width: `${pct}%`,
                                    background: `linear-gradient(90deg, ${progressAccent}, ${progressAccent}cc)`,
                                  }}
                                />
                              </div>
                              <div className="sp-plist-chips">
                                <span className="sp-plist-chip done">
                                  <span className="sp-plist-chip-dot" />
                                  <b>{done}</b> done
                                </span>
                                <span className="sp-plist-chip total">
                                  <b>{total}</b> total
                                </span>
                              </div>
                            </div>

                            {/* Timeline block */}
                            <div className="sp-plist-block">
                              <div className="sp-plist-block-head">
                                <div className="sp-plist-block-label">
                                  <CalendarOutlined style={{ fontSize: 10 }} />
                                  Timeline
                                </div>
                                {hasDates && (
                                  <span className="sp-plist-cycle">{days}d cycle</span>
                                )}
                              </div>
                              <div className="sp-plist-dates">
                                <div className="sp-plist-date-cell">
                                  <span className="sp-plist-date-label">Start</span>
                                  <span className="sp-plist-date-value">{start ? start.format('MMM D') : '—'}</span>
                                </div>
                                <div className="sp-plist-date-link">
                                  <div
                                    className="sp-plist-date-link-fill"
                                    style={{ width: `${elapsedPct}%`, background: phaseColor }}
                                  />
                                </div>
                                <div className="sp-plist-date-cell sp-plist-date-cell-right">
                                  <span className="sp-plist-date-label">End</span>
                                  <span className="sp-plist-date-value">{end ? end.format('MMM D') : '—'}</span>
                                </div>
                              </div>
                              {phaseLabel && (
                                <div className="sp-plist-phase-row">
                                  <span
                                    className="sp-plist-phase"
                                    style={{ color: phaseColor, background: phaseBg, borderColor: `${phaseColor}40` }}
                                  >
                                    <span className="sp-plist-phase-dot" style={{ background: phaseColor }} />
                                    {phaseLabel}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Footer — single inline meta line */}
                          <footer className="sp-plist-foot">
                            <div className="sp-plist-foot-inline">
                              <span className="sp-plist-foot-item sp-plist-foot-item-creator" title={record.createdBy?.email}>
                                <span className="sp-plist-foot-label">Created by:</span>
                                {record.createdBy ? (
                                  <span className="sp-plist-creator-mini">
                                    {record.createdBy.avatarUrl ? (
                                      <img
                                        src={record.createdBy.avatarUrl}
                                        alt={record.createdBy.name}
                                        className="sp-plist-creator-avatar-sm sp-custom-avatar"
                                        style={{ objectFit: 'cover' }}
                                      />
                                    ) : (
                                      <span className="sp-plist-creator-avatar-sm sp-custom-avatar">
                                        <span className="sp-plist-avatar-letter">{(record.createdBy.name || '?').charAt(0).toUpperCase()}</span>
                                      </span>
                                    )}
                                    <b>{record.createdBy.name || record.createdBy.email}</b>
                                  </span>
                                ) : (
                                  <span className="sp-plist-foot-muted">—</span>
                                )}
                              </span>

                              {record.createdAt && (
                                <>
                                  <span className="sp-plist-foot-div" />
                                  <span className="sp-plist-foot-item">
                                    <CalendarOutlined style={{ fontSize: 10, color: '#64748b' }} />
                                    <span className="sp-plist-foot-label">Created:</span>
                                    <b>{dayjs(record.createdAt).format('MMM D, YYYY')}</b>
                                  </span>
                                </>
                              )}

                              {startedAt && (
                                <>
                                  <span className="sp-plist-foot-div" />
                                  <span className="sp-plist-foot-item">
                                    <PlayCircleOutlined style={{ fontSize: 10, color: '#3b82f6' }} />
                                    <span className="sp-plist-foot-label">Started:</span>
                                    <b>{startedAt.format('MMM D, YYYY')}</b>
                                    {startVariance !== null && startVariance !== 0 && (
                                      <span className={`sp-plist-variance ${startVariance > 0 ? 'late' : 'early'}`}>
                                        {startVariance > 0 ? `+${startVariance}d` : `${startVariance}d`}
                                      </span>
                                    )}
                                  </span>
                                </>
                              )}

                              {completedAt && (
                                <>
                                  <span className="sp-plist-foot-div" />
                                  <span className="sp-plist-foot-item">
                                    <CheckCircleOutlined style={{ fontSize: 10, color: '#10b981' }} />
                                    <span className="sp-plist-foot-label">Closed:</span>
                                    <b>{completedAt.format('MMM D, YYYY')}</b>
                                    {endVariance !== null && endVariance !== 0 && (
                                      <span className={`sp-plist-variance ${endVariance > 0 ? 'late' : 'early'}`}>
                                        {endVariance > 0 ? `+${endVariance}d` : `${endVariance}d`}
                                      </span>
                                    )}
                                  </span>
                                </>
                              )}

                              {(record.status === 'active' || record.status === 'completed') && (
                                <>
                                  <span className="sp-plist-foot-div" />
                                  <button
                                    className="sp-plist-foot-link"
                                    onClick={() => router.push(`/tickets/reports/${record.id}`)}
                                  >
                                    <LineChartOutlined style={{ fontSize: 11 }} />
                                    Report
                                  </button>
                                </>
                              )}
                            </div>

                            <div className="sp-plist-actions">
                              {record.status === 'planning' && canUpdateTicketPlan && (
                                <Popconfirm title="Activate this sprint?" onConfirm={() => handleStartSprint(record)}>
                                  <Tooltip title="Start sprint">
                                    <Button
                                      type="text"
                                      size="small"
                                      icon={<RocketOutlined style={{ fontSize: 14, color: '#3b82f6' }} />}
                                      className="sp-foot-btn sp-foot-btn-start"
                                    >
                                      Start Sprint
                                    </Button>
                                  </Tooltip>
                                </Popconfirm>
                              )}
                              {record.status === 'active' && canUpdateTicketPlan && (
                                <Tooltip title="Complete sprint">
                                  <Button
                                    type="text"
                                    size="small"
                                    icon={<CheckCircleOutlined style={{ fontSize: 14, color: '#10b981' }} />}
                                    onClick={() => handleCompleteSprint(record)}
                                    className="sp-foot-btn sp-foot-btn-complete"
                                  >
                                    Complete Sprint
                                  </Button>
                                </Tooltip>
                              )}
                              <Tooltip title="View details">
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<EyeOutlined style={{ fontSize: 12, color: '#3b82f6' }} />}
                                  onClick={() => handleViewTickets(record)}
                                  className="sp-foot-btn sp-foot-btn-view"
                                >
                                  View Details
                                </Button>
                              </Tooltip>
                              {canUpdateTicketPlan && (
                                <Tooltip title="Edit">
                                  <Button type="text" size="small" icon={<EditOutlined style={{ color: '#64748b' }} />} onClick={() => handleEdit(record)} className="sp-plist-action-btn" />
                                </Tooltip>
                              )}
                              {canDeleteTicketPlan && (
                                <Popconfirm title="Delete this sprint?" onConfirm={() => handleDelete(record.id)} okText="Delete" okButtonProps={{ danger: true }}>
                                  <Tooltip title="Delete">
                                    <Button type="text" size="small" danger icon={<DeleteOutlined />} className="sp-plist-action-btn" />
                                  </Tooltip>
                                </Popconfirm>
                              )}
                            </div>
                          </footer>
                        </article>
                      );
                    })
                  )}
                </div>

              </div>
            )}

            {/* ─── Table view (expandable child rows = tickets) ─── */}
            {viewMode === 'table' && (
              <div className="sp-table-card">
                <div className="sp-table-toolbar">
                  <div className="sp-table-toolbar-title">
                    <span className="sp-table-toolbar-icon">
                      <TableOutlined style={{ fontSize: 13, color: '#3b82f6' }} />
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

                {loading ? (
                  <div className="sp-card-loading"><Spin /></div>
                ) : pagedSprintPlans.length === 0 ? (
                  <div className="sp-empty-state">
                    <div className="sp-empty-icon">
                      <TableOutlined style={{ fontSize: 28, color: '#3b82f6' }} />
                    </div>
                    <Title level={5} style={{ margin: '0 0 6px', fontWeight: 700, color: 'var(--text-slate-900)' }}>
                      No sprint cycles yet
                    </Title>
                    <Text style={{ fontSize: 13, color: 'var(--text-slate-500)', display: 'block', maxWidth: 360, textAlign: 'center' }}>
                      Plan your first sprint to start tracking delivery in one place.
                    </Text>
                  </div>
                ) : (
                  <div className="sp-tbl-wrap" role="table" aria-label="Sprint cycles table">
                    <div className="sp-tbl-head" role="row">
                      <span className="sp-tbl-th sp-tbl-col-name">Sprint</span>
                      <span className="sp-tbl-th sp-tbl-col-status">Status</span>
                      <span className="sp-tbl-th sp-tbl-col-progress">Progress</span>
                      <span className="sp-tbl-th sp-tbl-col-tickets">Tickets</span>
                      <span className="sp-tbl-th sp-tbl-col-timeline">Timeline</span>
                      <span className="sp-tbl-th sp-tbl-col-actions">Actions</span>
                    </div>

                    {pagedSprintPlans.map((record) => {
                      const project = typeof record.project === 'object' ? record.project : null;
                      const initial = (record.name || '?').charAt(0).toUpperCase();
                      const accent =
                        record.status === 'active' ? '#3b82f6' :
                          record.status === 'completed' ? '#10b981' :
                            record.status === 'planning' ? '#f59e0b' : '#64748b';
                      const statusCfg =
                        record.status === 'active' ? { dot: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', color: '#047857', label: 'Active', pulse: true } :
                          record.status === 'planning' ? { dot: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', color: '#b45309', label: 'Planning', pulse: false } :
                            record.status === 'completed' ? { dot: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', color: '#1d4ed8', label: 'Completed', pulse: false } :
                              { dot: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)', color: '#475569', label: record.status?.toUpperCase() || '—', pulse: false };
                      const pct = record.progress || 0;
                      const done = record?.completedTickets || 0;
                      const total = record?.totalTickets || 0;
                      const progressAccent = pct >= 100 ? '#10b981' : pct >= 60 ? '#3b82f6' : pct >= 30 ? '#6366f1' : '#94a3b8';

                      const today = dayjs();
                      const start = record.startDate ? dayjs(record.startDate) : null;
                      const end = record.endDate ? dayjs(record.endDate) : null;
                      const hasDates = !!(start && end);
                      const days = hasDates ? Math.max(end!.diff(start!, 'day'), 1) : 0;
                      let phaseLabel = '';
                      let phaseColor = '#64748b';
                      let phaseBg = 'rgba(100,116,139,0.08)';
                      if (record.status === 'completed') {
                        phaseLabel = 'Closed'; phaseColor = '#3b82f6'; phaseBg = 'rgba(59,130,246,0.08)';
                      } else if (hasDates) {
                        if (today.isBefore(start!)) {
                          phaseLabel = `Starts in ${start!.diff(today, 'day')}d`; phaseColor = '#8b5cf6'; phaseBg = 'rgba(139,92,246,0.08)';
                        } else if (today.isAfter(end!)) {
                          phaseLabel = `${today.diff(end!, 'day')}d overdue`; phaseColor = '#ef4444'; phaseBg = 'rgba(239,68,68,0.08)';
                        } else {
                          const remaining = end!.diff(today, 'day');
                          phaseLabel = remaining === 0 ? 'Ends today' : `${remaining}d left`;
                          phaseColor = remaining <= 2 ? '#f59e0b' : '#10b981';
                          phaseBg = remaining <= 2 ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)';
                        }
                      }

                      // Detail fields surfaced in the expanded child panel
                      const startedAt = record.startedAt ? dayjs(record.startedAt) : null;
                      const completedAt = record.completedAt ? dayjs(record.completedAt) : null;
                      const startVariance = startedAt && start ? startedAt.diff(start, 'day') : null;
                      const endVariance = completedAt && end ? completedAt.diff(end, 'day') : null;
                      const isOpen = expandedTableRows.has(record.id);

                      return (
                        <div className="sp-tbl-group" key={record.id} style={{ ['--row-accent' as any]: accent }}>
                          <div className={`sp-tbl-row ${isOpen ? 'is-open' : ''}`} role="row">
                            {/* Sprint name + expand */}
                            <span className="sp-tbl-td sp-tbl-col-name">
                              <button
                                type="button"
                                className={`sp-tbl-expand ${isOpen ? 'is-open' : ''}`}
                                onClick={() => toggleTableRow(record.id)}
                                aria-label={isOpen ? 'Collapse details' : 'Expand details'}
                                aria-expanded={isOpen}
                              >
                                <RightOutlined style={{ fontSize: 10 }} />
                              </button>
                              <span className="sp-tbl-avatar sp-custom-avatar"><span className="sp-plist-avatar-letter">{initial}</span></span>
                              <span className="sp-tbl-name-block">
                                <button type="button" className="sp-tbl-name" title={record.name} onClick={() => handleViewTickets(record)}>{record.name}</button>
                                <span className="sp-tbl-project" title={project?.name}>
                                  <span className="sp-plist-seg-dot" style={{ background: accent }} />
                                  {project ? project.name : '—'}
                                </span>
                              </span>
                            </span>

                            {/* Status */}
                            <span className="sp-tbl-td sp-tbl-col-status">
                              <span
                                className="sp-plist-status"
                                style={{ background: `linear-gradient(135deg, ${statusCfg.bg}, ${statusCfg.dot}26)`, borderColor: statusCfg.border, color: statusCfg.color }}
                              >
                                <span className={`sp-plist-status-dot ${statusCfg.pulse ? 'pulse' : ''}`} style={{ background: statusCfg.dot, boxShadow: `0 0 0 3px ${statusCfg.dot}26` }} />
                                {statusCfg.label}
                              </span>
                            </span>

                            {/* Progress */}
                            <span className="sp-tbl-td sp-tbl-col-progress">
                              <span className="sp-tbl-progress">
                                <span className="sp-tbl-progress-bar">
                                  <span className="sp-tbl-progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${progressAccent}, ${progressAccent}cc)` }} />
                                </span>
                                <span className="sp-tbl-progress-pct" style={{ color: progressAccent }}>{pct}%</span>
                              </span>
                            </span>

                            {/* Tickets */}
                            <span className="sp-tbl-td sp-tbl-col-tickets">
                              <span className="sp-tbl-tickets-chip"><b>{done}</b>/{total}</span>
                            </span>

                            {/* Timeline */}
                            <span className="sp-tbl-td sp-tbl-col-timeline">
                              <span className="sp-tbl-dates">
                                {start ? start.format('MMM D') : '—'} <ArrowRightOutlined style={{ fontSize: 8, color: 'var(--text-slate-400)' }} /> {end ? end.format('MMM D') : '—'}
                              </span>
                              {phaseLabel && (
                                <span className="sp-tbl-phase-text" style={{ color: phaseColor }}>
                                  <span className="sp-plist-phase-dot" style={{ background: phaseColor }} />
                                  {phaseLabel}
                                </span>
                              )}
                            </span>

                            {/* Actions */}
                            <span className="sp-tbl-td sp-tbl-col-actions">
                              {[
                                record.status === 'planning' && canUpdateTicketPlan && (
                                  <Popconfirm key="start" title="Activate this sprint?" onConfirm={() => handleStartSprint(record)}>
                                    <Tooltip title="Start sprint"><Button type="text" size="small" icon={<RocketOutlined style={{ fontSize: 13, color: '#10b981' }} />} className="sp-plist-action-btn" /></Tooltip>
                                  </Popconfirm>
                                ),
                                record.status === 'active' && canUpdateTicketPlan && (
                                  <Tooltip key="complete" title="Complete sprint"><Button type="text" size="small" icon={<CheckCircleOutlined style={{ fontSize: 13, color: '#3b82f6' }} />} onClick={() => handleCompleteSprint(record)} className="sp-plist-action-btn" /></Tooltip>
                                ),
                                <Tooltip key="view" title="View details"><Button type="text" size="small" icon={<EyeOutlined style={{ fontSize: 12, color: '#3b82f6' }} />} onClick={() => handleViewTickets(record)} className="sp-plist-action-btn" /></Tooltip>,
                                (record.status === 'active' || record.status === 'completed') && (
                                  <Tooltip key="report" title="Report"><Button type="text" size="small" icon={<LineChartOutlined style={{ fontSize: 13, color: '#6366f1' }} />} onClick={() => router.push(`/tickets/reports/${record.id}`)} className="sp-plist-action-btn" /></Tooltip>
                                ),
                                canUpdateTicketPlan && (
                                  <Tooltip key="edit" title="Edit"><Button type="text" size="small" icon={<EditOutlined style={{ color: '#64748b' }} />} onClick={() => handleEdit(record)} className="sp-plist-action-btn" /></Tooltip>
                                ),
                                canDeleteTicketPlan && (
                                  <Popconfirm key="delete" title="Delete this sprint?" onConfirm={() => handleDelete(record.id)} okText="Delete" okButtonProps={{ danger: true }}>
                                    <Tooltip title="Delete"><Button type="text" size="small" danger icon={<DeleteOutlined />} className="sp-plist-action-btn" /></Tooltip>
                                  </Popconfirm>
                                ),
                              ].filter(Boolean)}
                            </span>
                          </div>

                          {/* Child row — details panel (meta not shown in the parent row) */}
                          {isOpen && (
                            <div className="sp-tbl-children">
                              {record.goal && (
                                <div className="sp-tbl-detail-goal" title={record.goal}>
                                  <BulbDot />
                                  <span><b>Goal:</b> {record.goal}</span>
                                </div>
                              )}
                              <div className="sp-tbl-detail-row">
                                <div className="sp-tbl-detail-item">
                                  <span className="sp-tbl-detail-label"><FlagOutlined style={{ fontSize: 10 }} /> Priority</span>
                                  <span className="sp-tbl-detail-value">{record.priority || '—'}</span>
                                </div>

                                <div className="sp-tbl-detail-item">
                                  <span className="sp-tbl-detail-label"><CalendarOutlined style={{ fontSize: 10 }} /> Cycle</span>
                                  <span className="sp-tbl-detail-value">{hasDates ? `${days}d` : '—'}</span>
                                </div>

                                <div className="sp-tbl-detail-item">
                                  <span className="sp-tbl-detail-label"><UserOutlined style={{ fontSize: 10 }} /> Created by</span>
                                  <span className="sp-tbl-detail-value" title={record.createdBy?.email}>
                                    {record.createdBy ? (
                                      <span className="sp-tbl-detail-creator">
                                        {record.createdBy.avatarUrl ? (
                                          <img src={record.createdBy.avatarUrl} alt={record.createdBy.name} className="sp-tbl-detail-avatar sp-custom-avatar" style={{ objectFit: 'cover' }} />
                                        ) : (
                                          <span className="sp-tbl-detail-avatar sp-custom-avatar"><span className="sp-plist-avatar-letter">{(record.createdBy.name || '?').charAt(0).toUpperCase()}</span></span>
                                        )}
                                        {record.createdBy.name || record.createdBy.email}
                                      </span>
                                    ) : '—'}
                                  </span>
                                </div>

                                <div className="sp-tbl-detail-item">
                                  <span className="sp-tbl-detail-label"><CalendarOutlined style={{ fontSize: 10 }} /> Created</span>
                                  <span className="sp-tbl-detail-value">{record.createdAt ? dayjs(record.createdAt).format('MMM D, YYYY') : '—'}</span>
                                </div>

                                <div className="sp-tbl-detail-item">
                                  <span className="sp-tbl-detail-label"><PlayCircleOutlined style={{ fontSize: 10, color: '#10b981' }} /> Started</span>
                                  <span className="sp-tbl-detail-value">
                                    {startedAt ? startedAt.format('MMM D, YYYY') : '—'}
                                    {startVariance !== null && startVariance !== 0 && (
                                      <span className={`sp-plist-variance ${startVariance > 0 ? 'late' : 'early'}`}>{startVariance > 0 ? `+${startVariance}d` : `${startVariance}d`}</span>
                                    )}
                                  </span>
                                </div>

                                <div className="sp-tbl-detail-item">
                                  <span className="sp-tbl-detail-label"><CheckCircleOutlined style={{ fontSize: 10, color: '#3b82f6' }} /> Closed</span>
                                  <span className="sp-tbl-detail-value">
                                    {completedAt ? completedAt.format('MMM D, YYYY') : '—'}
                                    {endVariance !== null && endVariance !== 0 && (
                                      <span className={`sp-plist-variance ${endVariance > 0 ? 'late' : 'early'}`}>{endVariance > 0 ? `+${endVariance}d` : `${endVariance}d`}</span>
                                    )}
                                  </span>
                                </div>

                                {(record.status === 'active' || record.status === 'completed') && (
                                  <button className="sp-tbl-detail-report" onClick={() => router.push(`/tickets/reports/${record.id}`)}>
                                    <LineChartOutlined style={{ fontSize: 12 }} />
                                    View Report
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Fixed pagination footer */}
            {!loading && sortedSprintPlans.length > 0 && (viewMode === 'list' || viewMode === 'table') && (
              <div className="sp-card-pagination">
                <Text style={{ fontSize: 13, color: 'var(--text-slate-500)' }}>
                  Showing <span style={{ color: 'var(--text-slate-700)', fontWeight: 700 }}>
                    {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, sortedSprintPlans.length)}
                  </span> of <span style={{ color: 'var(--text-slate-700)', fontWeight: 700 }}>{sortedSprintPlans.length}</span> sprint{sortedSprintPlans.length !== 1 ? 's' : ''}
                </Text>
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={sortedSprintPlans.length}
                  onChange={(p, s) => { setCurrentPage(p); setPageSize(s); }}
                  showSizeChanger
                  pageSizeOptions={[10, 20, 25, 50, 100]}
                />
              </div>
            )}
          </main>
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
                    optionLabelProp="label"
                    onSearch={handleTicketSearch}
                    filterOption={false}
                    notFoundContent={ticketLoading ? <Spin size="small" /> : null}
                    options={ticketOptions}
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
          title={(() => {
            const hStatus = drawerSprintPlan?.status;
            const hCfg =
              hStatus === 'active' ? { color: '#10b981', label: 'Active', pulse: true } :
                hStatus === 'completed' ? { color: '#3b82f6', label: 'Completed', pulse: false } :
                  hStatus === 'planning' ? { color: '#64748b', label: 'Planning', pulse: false } :
                    { color: '#64748b', label: hStatus?.toUpperCase() || '—', pulse: false };
            const hProject = typeof drawerSprintPlan?.project === 'object' ? drawerSprintPlan?.project : null;
            const hPct = drawerSprintPlan?.progress || 0;
            const hDone = drawerSprintPlan?.completedTickets || 0;
            const hTotal = drawerSprintPlan?.totalTickets || 0;
            const hStart = drawerSprintPlan?.startedAt || drawerSprintPlan?.startDate;
            const hEnd = drawerSprintPlan?.endDate;
            const hRange = hStart && hEnd ? `${dayjs(hStart).format('MMM D')} → ${dayjs(hEnd).format('MMM D')}` : null;
            const hPctColor = hPct >= 100 ? '#10b981' : '#3b82f6';
            return (
              <div className="sp-detail-head">
                <div className="sp-view-icon-box">
                  <CalendarOutlined style={{ color: '#3b82f6', fontSize: 18 }} />
                </div>
                <div className="sp-detail-head-text">
                  <div className="sp-detail-head-eyebrow">
                    <span className="sp-detail-head-kicker">Sprint Detail</span>
                    {drawerSprintPlan?.priority && (
                      <span className={`sp-priority-chip sp-priority-${(drawerSprintPlan.priority || '').toLowerCase()}`}>
                        <FlagOutlined style={{ fontSize: 9 }} />
                        {drawerSprintPlan.priority}
                      </span>
                    )}
                    <span className="sp-status-pill" style={{ background: 'var(--bg-pure-white)', border: `1px solid ${hCfg.color}40`, color: hCfg.color }}>
                      <span className={`sp-status-pill-dot ${hCfg.pulse ? 'pulse' : ''}`} style={{ background: hCfg.color }} />
                      {hCfg.label}
                    </span>
                  </div>
                  <Title level={4} className="sp-detail-head-title" style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.015em', color: 'var(--text-slate-900)' }} ellipsis>
                    {drawerSprintPlan?.name}
                  </Title>
                  <div className="sp-detail-head-meta">
                    {hProject && (
                      <span className="sp-head-stat">
                        <ProjectOutlined style={{ fontSize: 12, color: '#3b82f6' }} />
                        {hProject.name}
                      </span>
                    )}
                    <span className="sp-head-stat">
                      <LineChartOutlined style={{ fontSize: 12, color: hPctColor }} />
                      <b style={{ color: hPctColor }}>{hPct}%</b> complete
                    </span>
                    <span className="sp-head-stat">
                      <CheckCircleOutlined style={{ fontSize: 12, color: '#10b981' }} />
                      <b>{hDone}</b>/{hTotal} tickets
                    </span>
                    {hRange && (
                      <span className="sp-head-stat">
                        <CalendarOutlined style={{ fontSize: 12, color: 'var(--text-slate-400)' }} />
                        {hRange}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
          placement="right"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          width={Math.min(typeof window !== 'undefined' ? window.innerWidth - 60 : 1600, 1600)}
          rootClassName="sp-detail-drawer"
          styles={{
            header: { borderBottom: '1px solid var(--border-slate-200)', padding: '16px 28px', background: 'var(--bg-pure-white)' },
            body: { padding: 0, background: 'var(--bg-slate-50)' },
            mask: { backdropFilter: 'blur(6px)', background: 'rgba(15, 23, 42, 0.18)' }
          }}
          extra={
            <Space size={8} wrap>
              {canReadActivityLog && drawerSprintPlan && (
                <Tooltip title="Activity history">
                  <Button
                    icon={<HistoryOutlined />}
                    onClick={() => setHistoryOpen(true)}
                    style={{ borderRadius: 8, fontWeight: 600, height: 36 }}
                  >
                    History
                  </Button>
                </Tooltip>
              )}
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
              else deliveryNote = { label: `${Math.abs(diff)}d remaining`, color: '#3b82f6', icon: <ThunderboltOutlined />, sub: `Target ${end.format('MMM D, YYYY')}` };
            }

            // Velocity / pace
            const expectedDone = totalDays && total ? Math.round((elapsed / totalDays) * total) : 0;
            const paceDelta = done - expectedDone;

            const radius = 52;
            const circ = 2 * Math.PI * radius;
            const dash = (pct / 100) * circ;
            const ringColor = pct >= 100 ? '#10b981' : pct >= 60 ? '#3b82f6' : '#3b82f6';
            const statusCfg =
              status === 'active' ? { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)', label: 'Active' } :
                status === 'planning' ? { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', label: 'Planning' } :
                  status === 'completed' ? { color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', label: 'Completed' } :
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
              if (k === 'review') return { c: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.22)', label: 'Review' };
              if (k === 'pending' || k === 'todo' || k === 'open') return { c: '#64748b', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.22)', label: k.replace(/_/g, ' ') };
              return { c: '#64748b', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.22)', label: k.replace(/_/g, ' ') || '—' };
            };

            const prioCfg = (p: string) => {
              if (p === 'High') return { c: '#ef4444', bg: 'rgba(239,68,68,0.08)' };
              if (p === 'Medium') return { c: '#3b82f6', bg: 'rgba(59,130,246,0.08)' };
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
                          <div className="sp-mini-stat-icon" style={{ background: 'rgba(100,116,139,0.1)', color: '#64748b' }}>
                            <ClockCircleOutlined />
                          </div>
                          <div className="sp-mini-stat-text">
                            <div className="sp-mini-stat-value">{notStarted}</div>
                            <div className="sp-mini-stat-label">To do</div>
                          </div>
                        </div>
                        <div className="sp-mini-stat">
                          <div className="sp-mini-stat-icon" style={{ background: 'rgba(100,116,139,0.16)', color: '#475569' }}>
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
                        <div style={{ width: `${(notStarted / total) * 100}%`, background: '#94a3b8' }} />
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
                      <div
                        className="sp-rte-content"
                        style={{ fontSize: 12.5, color: 'var(--text-slate-700)', lineHeight: 1.6 }}
                        dangerouslySetInnerHTML={{ __html: drawerSprintPlan.description }}
                      />
                    </div>
                  )}
                </aside>

                {/* ── MIDDLE COLUMN — Team Contributors (row-wise) ─── */}
                <section className="sp-detail-mid">
                  <div className="sp-detail-card sp-detail-card-flush">
                    <div className="sp-card-header" style={{ justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <TeamOutlined style={{ color: '#3b82f6', fontSize: 14 }} />
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
                          // Palette restricted to blue / green / grey (red reserved for errors)
                          const palette = ['#3b82f6', '#10b981', '#64748b'];
                          const color = c.id === '__unassigned__' ? '#94a3b8' : palette[i % palette.length];
                          return (
                            <div
                              key={c.id}
                              className="sp-contrib-row-card"
                              style={{ ['--contrib-accent' as any]: color }}
                            >
                              <div
                                className="sp-contrib-avatar"
                                style={{ background: `${color}14`, color, borderColor: `${color}40` }}
                              >
                                {c.id === '__unassigned__' ? <UserOutlined /> : c.name.charAt(0).toUpperCase()}
                              </div>

                              <div className="sp-contrib-meta">
                                <div className="sp-contrib-name-row">
                                  <span className="sp-contrib-rank">#{i + 1}</span>
                                  <Text className="sp-contrib-name" ellipsis>{c.name}</Text>
                                  {i === 0 && c.id !== '__unassigned__' && (
                                    <span className="sp-top-badge"><TrophyOutlined /> Top</span>
                                  )}
                                </div>
                                <div className="sp-contrib-statline">
                                  <span className="sp-contrib-stat-total"><b>{c.total}</b> ticket{c.total !== 1 ? 's' : ''}</span>
                                  <span className="sp-contrib-stat-sep">·</span>
                                  <span className="sp-contrib-stat g"><b>{c.done}</b> done</span>
                                  <span className="sp-contrib-stat b"><b>{c.inProgress}</b> active</span>
                                  <span className="sp-contrib-stat m"><b>{c.notStarted}</b> to do</span>
                                </div>
                                {c.total > 0 && (
                                  <div className="sp-stack-bar sp-contrib-stack" title={`${c.done} done · ${c.inProgress} active · ${c.notStarted} to do`}>
                                    <div style={{ width: `${(c.done / c.total) * 100}%`, background: '#10b981' }} />
                                    <div style={{ width: `${(c.inProgress / c.total) * 100}%`, background: '#3b82f6' }} />
                                    <div style={{ width: `${(c.notStarted / c.total) * 100}%`, background: '#94a3b8' }} />
                                  </div>
                                )}
                              </div>

                              <div className="sp-contrib-share">
                                <div className="sp-contrib-share-pct" style={{ color }}>
                                  {ownership}<span className="sp-contrib-share-pct-unit">%</span>
                                </div>
                                <div className="sp-contrib-share-label">share</div>
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

        {drawerSprintPlan && (
          <TransactionHistoryDrawer
            open={historyOpen}
            onClose={() => setHistoryOpen(false)}
            entityType="release_plan"
            entityId={drawerSprintPlan.id}
            subtitle={drawerSprintPlan.name}
          />
        )}

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
        /* ── Rich-text (Tiptap HTML) rendered inside detail cards ─ */
        .sp-rte-content > :first-child { margin-top: 0; }
        .sp-rte-content > :last-child { margin-bottom: 0; }
        .sp-rte-content p { margin: 0 0 6px 0; }
        .sp-rte-content ul, .sp-rte-content ol { margin: 4px 0; padding-left: 18px; }
        .sp-rte-content li { margin: 2px 0; }
        .sp-rte-content h1, .sp-rte-content h2, .sp-rte-content h3 { font-size: 13px; font-weight: 700; margin: 8px 0 4px; }
        .sp-rte-content a { color: var(--premium-blue, #2563eb); text-decoration: underline; }
        .sp-rte-content img { max-width: 100%; height: auto; border-radius: 4px; }

        /* ── Proposals Toolbar Classes ─────────────────────────── */
        .pp-segmented { display: inline-flex; border: 1px solid var(--border-slate-200); border-radius: 9px; overflow: hidden; background: var(--bg-pure-white); }
        .pp-segmented button {
          width: 32px; height: 32px; border: none; background: transparent; cursor: pointer;
          color: var(--text-slate-400); font-size: 14px; display: inline-flex; align-items: center; justify-content: center;
        }
        .pp-segmented button.is-active { background: var(--bg-blue-50); color: #3B82F6; }
        .pp-search-wrap {
          position: relative; flex: 1; display: flex; align-items: center;
          height: 32px; border-radius: 8px; background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200); padding: 0 10px;
        }
        .pp-search-wrap:focus-within { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.10); }
        .pp-search-icon { color: var(--text-slate-400); font-size: 14px; }
        .pp-search {
          flex: 1; border: none; outline: none; background: transparent; margin-left: 9px;
          font-size: 13px; color: var(--text-slate-900); min-width: 0;
        }
        .pp-search::placeholder { color: var(--text-slate-400); }
        .pp-kbd {
          font-size: 10.5px; font-weight: 600; color: var(--text-slate-400);
          background: var(--bg-slate-50); border: 1px solid var(--border-slate-200);
          border-radius: 5px; padding: 1px 6px;
        }
        .pp-ghost-btn {
          width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border-slate-200);
          background: var(--bg-slate-50); color: var(--text-slate-700); cursor: pointer; font-size: 14px;
          display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s;
        }
        .pp-ghost-btn:hover { color: #3B82F6; border-color: #bfdbfe; }
        .pp-ghost-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Stat cards */
        .pp-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 14px; }
        .pp-stat-card {
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
          border-radius: 0; padding: 12px 14px; min-height: 92px;
          display: flex; flex-direction: column; justify-content: space-between; gap: 10px;
          box-shadow: 0 1px 2px rgba(15,23,42,0.04);
        }
        .pp-stat-top { display: flex; align-items: center; justify-content: space-between; }
        .pp-stat-left { display: flex; align-items: center; gap: 8px; }
        .pp-stat-icon { width: 26px; height: 26px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; }
        .pp-stat-label { font-size: 12px; font-weight: 600; color: var(--text-slate-600); }
        .pp-stat-delta {
          display: inline-flex; align-items: center; gap: 2px; font-size: 10.5px; font-weight: 700;
          color: #10b981; background: rgba(16,185,129,0.10); border-radius: 6px; padding: 1px 6px;
        }
        .pp-stat-bottom { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; }
        .pp-stat-value-wrap { display: flex; align-items: baseline; gap: 6px; }
        .pp-stat-value { font-size: 23px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1; }
        .pp-stat-period { font-size: 11px; color: var(--text-slate-400); font-weight: 500; }
        .pp-stat-spark { opacity: 0.95; }

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

        /* ── Stat Cards (Proposals Style) ─────────────────────── */
        .sp-stat-card {
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 0;
          padding: 12px 14px;
          min-height: 92px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 10px;
          box-shadow: 0 1px 2px rgba(15,23,42,0.04);
          transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
        }
        .sp-stat-card:hover {
          border-color: var(--border-slate-300, #cbd5e1);
          box-shadow: 0 6px 20px rgba(15, 23, 42, 0.07);
          transform: translateY(-1px);
        }
        [data-theme='dark'] .sp-stat-card {
          background: #161b22 !important;
          border-color: #1f2937 !important;
        }
        [data-theme='dark'] .sp-stat-card:hover {
          border-color: #374151 !important;
        }
        .sp-stat-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .sp-stat-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .sp-stat-icon {
          width: 26px;
          height: 26px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
        }
        .sp-stat-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-slate-600);
        }
        [data-theme='dark'] .sp-stat-label { color: #94a3b8 !important; }
        .sp-stat-pulse {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 0 0 rgba(16,185,129,0.7);
          animation: sp-pulse 2s infinite;
        }
        .sp-stat-bottom {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 8px;
        }
        .sp-stat-value-wrap {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }
        .sp-stat-value {
          font-size: 23px;
          font-weight: 800;
          color: var(--text-slate-900);
          letter-spacing: -0.02em;
          line-height: 1;
        }
        [data-theme='dark'] .sp-stat-value { color: #f1f5f9 !important; }
        .sp-stat-period {
          font-size: 11px;
          color: var(--text-slate-400);
          font-weight: 500;
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
        .premium-search-input{
          border-radius: 6px !important;
          height: 32px !important;
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
        .sp-status-dot.active { background: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.15); }
        .sp-status-dot.planning { background: #f59e0b; }
        .sp-status-dot.completed { background: #10b981; }
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

        /* ── Table shell (transparent — rows provide chrome) ───── */
        .sp-table-card {
          background: transparent;
          border: none;
          border-radius: 0;
          overflow: visible;
          box-shadow: none;
        }
        [data-theme='dark'] .sp-table-card {
          background: transparent !important;
          border-color: transparent !important;
        }
        .sp-table-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 4px 4px 10px;
          border-bottom: none;
          background: transparent;
        }
        [data-theme='dark'] .sp-table-toolbar {
          background: transparent !important;
          border-bottom-color: transparent !important;
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

        /* ─── Table view (expandable child rows) ─── */
        .sp-tbl-wrap {
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 0;
          overflow: hidden;
        }
        [data-theme='dark'] .sp-tbl-wrap {
          background: #0f1620 !important;
          border-color: #243042 !important;
        }
        .sp-tbl-head,
        .sp-tbl-row {
          display: grid;
          grid-template-columns: minmax(180px, 1fr) 110px 122px 92px 168px 152px;
          align-items: center;
          gap: 12px;
          padding: 0 16px;
        }
        .sp-tbl-head {
          height: 34px;
          background: var(--bg-slate-50);
          border-bottom: 1px solid var(--border-slate-200);
        }
        [data-theme='dark'] .sp-tbl-head {
          background: #131c28 !important;
          border-bottom-color: #243042 !important;
        }
        .sp-tbl-th {
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--text-slate-500);
        }
        .sp-tbl-col-tickets,
        .sp-tbl-col-actions { text-align: right; justify-self: end; }

        .sp-tbl-group { border-bottom: 1px solid var(--border-slate-100); }
        .sp-tbl-group:last-child { border-bottom: none; }
        [data-theme='dark'] .sp-tbl-group { border-bottom-color: #1c2733 !important; }
        .sp-tbl-row {
          min-height: 46px;
          position: relative;
          transition: background 0.15s ease;
        }
        .sp-tbl-row::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 3px;
          background: var(--row-accent, transparent);
          opacity: 0;
          transition: opacity 0.15s ease;
        }
        .sp-tbl-row:hover { background: var(--bg-slate-50); }
        .sp-tbl-row.is-open { background: var(--bg-slate-50); }
        .sp-tbl-row.is-open::before,
        .sp-tbl-row:hover::before { opacity: 1; }
        [data-theme='dark'] .sp-tbl-row:hover,
        [data-theme='dark'] .sp-tbl-row.is-open { background: #131c28 !important; }
        .sp-tbl-td { display: flex; align-items: center; min-width: 0; }

        .sp-tbl-col-name { gap: 10px; }
        .sp-tbl-expand {
          flex-shrink: 0;
          width: 22px; height: 22px;
          display: inline-flex; align-items: center; justify-content: center;
          border: none; background: transparent; cursor: pointer;
          color: var(--text-slate-400);
          border-radius: 6px;
          transition: transform 0.18s ease, background 0.15s ease, color 0.15s ease;
        }
        .sp-tbl-expand:hover:not(:disabled) { background: rgba(59,130,246,0.1); color: #3b82f6; }
        .sp-tbl-expand.is-open { transform: rotate(90deg); color: #3b82f6; }
        .sp-tbl-avatar {
          flex-shrink: 0;
          width: 26px; height: 26px;
          border-radius: 7px;
          display: inline-flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, var(--row-accent, #3b82f6), color-mix(in srgb, var(--row-accent, #3b82f6) 70%, #000));
          color: #fff;
        }
        .sp-tbl-name-block { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .sp-tbl-name {
          border: none; background: transparent; padding: 0; cursor: pointer; text-align: left;
          font-size: 13px; font-weight: 700; color: var(--text-slate-900);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;
        }
        .sp-tbl-name:hover { color: #3b82f6; }
        [data-theme='dark'] .sp-tbl-name { color: #f1f5f9; }
        .sp-tbl-project {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 11px; font-weight: 500; color: var(--text-slate-500);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;
        }

        .sp-tbl-progress { display: flex; align-items: center; gap: 8px; width: 100%; }
        .sp-tbl-progress-bar {
          flex: 1; height: 6px; border-radius: 999px;
          background: var(--bg-slate-100); overflow: hidden;
        }
        [data-theme='dark'] .sp-tbl-progress-bar { background: #1c2733; }
        .sp-tbl-progress-fill { display: block; height: 100%; border-radius: 999px; }
        .sp-tbl-progress-pct { font-size: 11.5px; font-weight: 800; min-width: 34px; text-align: right; }

        .sp-tbl-tickets-chip {
          font-size: 11.5px; font-weight: 600; color: var(--text-slate-500);
          padding: 2px 9px; border-radius: 999px;
          background: var(--bg-slate-50); border: 1px solid var(--border-slate-200);
        }
        .sp-tbl-tickets-chip b { color: var(--text-slate-900); }
        [data-theme='dark'] .sp-tbl-tickets-chip { background: #1c232e; border-color: #2d3748; color: #cbd5e1; }
        [data-theme='dark'] .sp-tbl-tickets-chip b { color: #f1f5f9; }

        .sp-tbl-col-timeline { flex-direction: column; align-items: flex-start; gap: 3px; padding-left: 24px; }
        .sp-tbl-dates {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 11.5px; font-weight: 600; color: var(--text-slate-700);
        }
        [data-theme='dark'] .sp-tbl-dates { color: #cbd5e1; }
        .sp-tbl-phase-text {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 10.5px; font-weight: 700; letter-spacing: 0;
        }

        .sp-tbl-col-actions { gap: 0; }

        /* Compact status tag inside the table */
        .sp-tbl-col-status .sp-plist-status {
          font-size: 9.5px;
          padding: 1px 7px;
          gap: 4px;
          line-height: 1.6;
        }
        .sp-tbl-col-status .sp-plist-status-dot { width: 5px; height: 5px; }

        /* Child row — details panel */
        .sp-tbl-children {
          background: var(--bg-slate-50);
          border-top: 1px solid var(--border-slate-200);
          padding: 14px 16px 16px 48px;
        }
        [data-theme='dark'] .sp-tbl-children { background: #0c121b !important; border-top-color: #1c2733 !important; }
        .sp-tbl-detail-goal {
          display: flex; align-items: flex-start; gap: 8px;
          font-size: 12.5px; font-weight: 500; color: var(--text-slate-600);
          margin-bottom: 12px; line-height: 1.5;
        }
        .sp-tbl-detail-goal b { color: var(--text-slate-800); font-weight: 700; }
        [data-theme='dark'] .sp-tbl-detail-goal { color: #cbd5e1; }
        [data-theme='dark'] .sp-tbl-detail-goal b { color: #f1f5f9; }
        .sp-tbl-detail-row {
          display: flex;
          align-items: center;
          gap: 0;
          flex-wrap: wrap;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 10px;
          padding: 12px 16px;
        }
        [data-theme='dark'] .sp-tbl-detail-row {
          background: #131c28 !important;
          border-color: #243042 !important;
        }
        .sp-tbl-detail-item {
          display: flex; flex-direction: column; gap: 4px; min-width: 0;
          padding: 0 16px;
          border-left: 1px solid var(--border-slate-200);
        }
        .sp-tbl-detail-item:first-of-type { padding-left: 0; border-left: none; }
        [data-theme='dark'] .sp-tbl-detail-item { border-left-color: #243042; }
        .sp-tbl-detail-label {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 9.5px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;
          color: var(--text-slate-400);
        }
        .sp-tbl-detail-value {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 12.5px; font-weight: 700; color: var(--text-slate-800);
          white-space: nowrap;
        }
        [data-theme='dark'] .sp-tbl-detail-value { color: #e2e8f0; }
        .sp-tbl-detail-creator { display: inline-flex; align-items: center; gap: 6px; }
        .sp-tbl-detail-avatar {
          flex-shrink: 0; width: 20px; height: 20px; border-radius: 50%;
          display: inline-flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, #64748b, #475569); color: #fff;
          font-size: 9px;
        }
        .sp-tbl-detail-report {
          margin-left: auto;
          display: inline-flex; align-items: center; gap: 6px;
          height: 30px; padding: 0 14px;
          border: 1px solid rgba(99,102,241,0.25);
          background: rgba(99,102,241,0.08);
          color: #6366f1;
          font-size: 12px; font-weight: 700;
          border-radius: 7px; cursor: pointer;
          transition: background 0.15s ease, border-color 0.15s ease;
        }
        .sp-tbl-detail-report:hover {
          background: rgba(99,102,241,0.16);
          border-color: rgba(99,102,241,0.45);
        }

        @media (max-width: 900px) {
          .sp-tbl-head { display: none; }
          .sp-tbl-row { grid-template-columns: 1fr auto; grid-auto-rows: min-content; gap: 8px; padding: 12px 16px; }
          .sp-tbl-col-progress, .sp-tbl-col-timeline { grid-column: 1 / -1; }
          .sp-tbl-children { padding-left: 16px; }
          .sp-tbl-detail-row { gap: 10px 0; }
          .sp-tbl-detail-report { margin-left: 0; }
        }

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
          gap: 5px;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-slate-600);
          background: transparent;
          border: none;
          padding: 0;
          border-radius: 0;
          line-height: 1.5;
          max-width: 180px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          letter-spacing: -0.005em;
        }
        [data-theme='dark'] .sp-row-meta-chip {
          background: transparent !important;
          border-color: transparent !important;
          color: #cbd5e1 !important;
        }
        .sp-row-meta-chip-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          flex-shrink: 0;
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
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 14px;
          border: 1px solid;
          flex-shrink: 0;
          position: relative;
          overflow: hidden;
          letter-spacing: -0.02em;
        }
        .sp-row-avatar-letter {
          position: relative;
          z-index: 1;
          line-height: 1;
        }
        .sp-row-avatar::after {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 70% 0%, rgba(255,255,255,0.18), transparent 55%),
            radial-gradient(circle at 0% 100%, rgba(0,0,0,0.05), transparent 55%);
          pointer-events: none;
        }
        .sp-row-avatar-ring {
          position: absolute;
          inset: 3px;
          border-radius: 7px;
          border: 1px solid;
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .sp-card-row:hover .sp-row-avatar-ring,
        .sp-card-row.expanded .sp-row-avatar-ring {
          opacity: 0.35;
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

        .sp-custom-avatar{
          background: #3b82f6 !important;
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
          background: linear-gradient(135deg, rgba(59,130,246,0.14), rgba(37,99,235,0.14));
          border: 1px solid rgba(59,130,246,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        [data-theme='dark'] .sp-view-icon-box {
          background: linear-gradient(135deg, rgba(59,130,246,0.18), rgba(37,99,235,0.18)) !important;
          border-color: rgba(59,130,246,0.3) !important;
        }
        /* ── Sprint detail drawer header ───────────────────────── */
        .sp-detail-drawer .ant-drawer-header {
          flex-wrap: wrap;
        }
        .sp-detail-head {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }
        .sp-detail-head .sp-view-icon-box { width: 44px; height: 44px; }
        .sp-detail-head-text { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: 3px; }
        .sp-detail-head-eyebrow { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .sp-detail-head-kicker {
          font-size: 10px; font-weight: 800; color: var(--text-slate-400);
          text-transform: uppercase; letter-spacing: 0.08em;
        }
        .sp-detail-head-title { font-size: 18px !important; line-height: 1.2 !important; }
        .sp-detail-head-meta { display: flex; align-items: center; gap: 6px 14px; margin-top: 4px; flex-wrap: wrap; }
        .sp-head-stat {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 11.5px; font-weight: 600; color: var(--text-slate-500);
          white-space: nowrap;
        }
        .sp-head-stat b { font-weight: 800; color: var(--text-slate-800); }
        [data-theme='dark'] .sp-head-stat b { color: #f1f5f9; }
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
          border-radius: 0px;
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
          padding: 16px 16px 24px 20px;
          border-right: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white);
          display: flex;
          flex-direction: column;
          gap: 12px;
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

        /* ── Compact / minimized drawer view ───────────────────── */
        .sp-detail-shell.compact {
          grid-template-columns: 1fr !important;
        }
        .sp-detail-shell.compact .sp-detail-mid,
        .sp-detail-shell.compact .sp-detail-right {
          display: none !important;
        }
        .sp-detail-shell.compact .sp-detail-left {
          padding: 16px 18px 24px;
          border-right: none !important;
          gap: 12px;
        }
        .sp-detail-shell.compact .sp-detail-card {
          padding: 14px 16px;
        }
        .sp-detail-shell.compact .sp-detail-banner {
          padding: 10px 14px;
        }
        .sp-detail-shell.compact .sp-detail-hero-row {
          gap: 14px;
        }
        .sp-detail-shell.compact .sp-view-ring,
        .sp-detail-shell.compact .sp-detail-ring {
          width: 92px !important;
          height: 92px !important;
        }
        .sp-detail-shell.compact .sp-view-ring-label > div:first-child {
          font-size: 20px !important;
        }
        .sp-detail-shell.compact .sp-view-ring-label > div:last-child {
          font-size: 8.5px !important;
        }
        .sp-detail-shell.compact .sp-mini-stat-grid {
          grid-template-columns: repeat(2, 1fr) !important;
          gap: 8px !important;
        }
        .sp-detail-shell.compact .sp-mini-stat {
          padding: 7px 9px !important;
        }
        .sp-detail-shell.compact .sp-mini-stat-icon {
          width: 24px !important;
          height: 24px !important;
        }
        .sp-detail-shell.compact .sp-mini-stat-value {
          font-size: 16px !important;
        }
        .sp-detail-shell.compact .sp-mini-stat-label {
          font-size: 9.5px !important;
        }
        .sp-detail-shell.compact .sp-stack-bar {
          height: 6px !important;
        }
        .sp-detail-shell.compact .sp-pace-row {
          padding: 7px 10px !important;
        }
        .sp-detail-shell.compact .sp-card-header {
          margin-bottom: 8px !important;
        }
        .sp-detail-shell.compact .sp-card-title {
          font-size: 11px !important;
        }
        .sp-detail-shell.compact .sp-tl-grid {
          gap: 8px !important;
        }
        .sp-detail-shell.compact .sp-tl-stat {
          padding: 8px 10px !important;
        }
        .sp-detail-shell.compact .sp-tl-stat-value {
          font-size: 12.5px !important;
        }
        .sp-detail-shell.compact .sp-tl-stat-sub {
          font-size: 10px !important;
        }
        .sp-detail-shell.compact .sp-view-timeline-bar {
          height: 4px !important;
        }
        .sp-detail-shell.compact .sp-prio-row {
          padding: 4px 0 !important;
        }
        .sp-detail-shell.compact .sp-prio-bar {
          height: 5px !important;
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
          border-radius: 0px;
          padding: 14px 16px;
          box-shadow: 0 1px 2px rgba(15,23,42,0.02);
        }
        [data-theme='dark'] .sp-detail-card {
          background: #161b22 !important;
          border-color: #1f2937 !important;
        }
        .sp-card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }
        .sp-card-title {
          font-size: 10.5px !important;
          font-weight: 800 !important;
          color: var(--text-slate-700) !important;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        [data-theme='dark'] .sp-card-title { color: #cbd5e1 !important; }

        /* Banner */
        .sp-detail-banner {
          padding: 10px 14px;
          border-radius: 0px;
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
          border-radius: 0px;
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
        .sp-priority-medium { background: rgba(59,130,246,0.1); color: #2563eb; }
        .sp-priority-low { background: rgba(16,185,129,0.1); color: #059669; }

        /* Hero ring + mini stats */
        .sp-detail-hero-row {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          gap: 10px;
          margin-bottom: 10px;
        }
        .sp-detail-ring {
          width: 96px;
          height: 96px;
          align-self: center;
        }
        .sp-detail-ring .sp-view-ring-label > div:first-child {
          font-size: 20px !important;
        }
        .sp-detail-ring .sp-view-ring-label > div:first-child > span {
          font-size: 11px !important;
        }
        .sp-detail-ring .sp-view-ring-label > div:last-child {
          font-size: 8.5px !important;
          margin-top: 2px !important;
        }
        .sp-mini-stat-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 6px;
          width: 100%;
        }
        .sp-mini-stat {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 10px;
          background: var(--bg-slate-50);
          border-radius: 0px;
          border: 1px solid var(--border-slate-200);
          min-width: 0;
        }
        [data-theme='dark'] .sp-mini-stat {
          background: #1c232e !important;
          border-color: #2d3748 !important;
        }
        .sp-mini-stat-icon {
          width: 24px;
          height: 24px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          flex-shrink: 0;
        }
        .sp-mini-stat-text { min-width: 0; }
        .sp-mini-stat-value {
          font-size: 15px;
          font-weight: 800;
          color: var(--text-slate-900);
          line-height: 1;
          letter-spacing: -0.02em;
        }
        [data-theme='dark'] .sp-mini-stat-value { color: #f1f5f9 !important; }
        .sp-mini-stat-label {
          font-size: 9.5px;
          color: var(--text-slate-500);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 2px;
          white-space: nowrap;
        }

        /* Stacked composition bar */
        .sp-stack-bar {
          display: flex;
          height: 6px;
          background: var(--bg-slate-50);
          border-radius: 999px;
          overflow: hidden;
          margin-bottom: 10px;
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
          padding: 7px 10px;
          background: var(--bg-slate-50);
          border-radius: 0px;
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
          gap: 8px;
        }
        .sp-tl-stat {
          padding: 9px 10px;
          background: var(--bg-slate-50);
          border-radius: 0px;
          border: 1px solid var(--border-slate-200);
        }
        [data-theme='dark'] .sp-tl-stat {
          background: #1c232e !important;
          border-color: #2d3748 !important;
        }
        .sp-tl-stat-label {
          font-size: 9.5px;
          color: var(--text-slate-500);
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 3px;
        }
        .sp-tl-stat-value {
          font-size: 12.5px;
          font-weight: 700;
          color: var(--text-slate-900);
          letter-spacing: -0.01em;
        }
        [data-theme='dark'] .sp-tl-stat-value { color: #f1f5f9 !important; }
        .sp-tl-stat-sub {
          font-size: 10.5px;
          color: var(--text-slate-500);
          font-weight: 500;
          margin-top: 2px;
        }
        .sp-tl-tags {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-top: 10px;
        }
        .sp-tl-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          background: var(--bg-slate-50);
          border: 1px solid var(--border-slate-200);
          border-radius: 999px;
          font-size: 10.5px;
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
          gap: 6px;
        }
        .sp-contrib-row-card {
          display: grid;
          grid-template-columns: 34px 1fr 56px;
          align-items: center;
          gap: 12px;
          padding: 9px 14px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 10px;
          transition: border-color 0.16s ease, box-shadow 0.16s ease;
        }
        .sp-contrib-row-card:hover {
          border-color: var(--contrib-accent, #3b82f6);
          box-shadow: 0 1px 6px rgba(15,23,42,0.06);
        }
        [data-theme='dark'] .sp-contrib-row-card {
          background: #161b22 !important;
          border-color: #1f2937 !important;
        }
        [data-theme='dark'] .sp-contrib-row-card:hover {
          background: #1c232e !important;
        }
        .sp-contrib-rank {
          font-size: 10.5px;
          font-weight: 800;
          color: var(--text-slate-400);
          font-variant-numeric: tabular-nums;
          flex-shrink: 0;
        }
        .sp-contrib-meta {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .sp-contrib-name-row {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
        }
        .sp-contrib-name {
          font-size: 12.5px !important;
          font-weight: 700;
          color: var(--text-slate-900) !important;
          letter-spacing: -0.01em;
          min-width: 0;
        }
        [data-theme='dark'] .sp-contrib-name { color: #f1f5f9 !important; }
        .sp-contrib-statline {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-slate-400);
          white-space: nowrap;
        }
        .sp-contrib-statline b { font-weight: 800; font-variant-numeric: tabular-nums; }
        .sp-contrib-stat-total { color: var(--text-slate-600); }
        [data-theme='dark'] .sp-contrib-stat-total { color: #cbd5e1; }
        .sp-contrib-stat-sep { color: var(--text-slate-300); }
        .sp-contrib-stat.g { color: #10b981; }
        .sp-contrib-stat.b { color: #3b82f6; }
        .sp-contrib-stat.m { color: #64748b; }
        [data-theme='dark'] .sp-contrib-stat.m { color: #94a3b8; }
        .sp-contrib-stack {
          margin: 2px 0 0 !important;
          height: 4px !important;
        }
        .sp-contrib-share {
          text-align: right;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 1px;
        }
        .sp-contrib-share-pct {
          font-size: 17px;
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1;
          font-variant-numeric: tabular-nums;
        }
        .sp-contrib-share-pct-unit {
          font-size: 10px;
          font-weight: 700;
          opacity: 0.7;
          margin-left: 1px;
        }
        .sp-contrib-share-label {
          font-size: 8.5px;
          color: var(--text-slate-400);
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        @media (max-width: 600px) {
          .sp-contrib-statline { flex-wrap: wrap; white-space: normal; }
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
          background: linear-gradient(135deg, #10b981, #059669);
          color: #fff;
          font-size: 9.5px;
          font-weight: 800;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          box-shadow: 0 2px 6px rgba(16,185,129,0.3);
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

        /* ── Two-column shell ─────────────────────────────────── */
        .sp-page-root {
          background: #f8fafc;
        }
        [data-theme='dark'] .sp-page-root {
          background: var(--bg-pure-white) !important;
        }
        .sp-shell-wrap {
        }
        .sp-shell {
          display: grid;
          grid-template-columns: 240px minmax(0, 1fr);
          gap: 0;
          align-items: stretch;
          min-height: calc(100vh - 54px);
        }
        .sp-main {
          min-width: 0;
          padding: 14px 20px 28px;
          background: #f8fafc;
          display: flex;
          flex-direction: column;
        }
        [data-theme='dark'] .sp-main {
          background: transparent !important;
        }

        /* ── Sidebar (full-height left rail) ──────────────────── */
        .sp-sidebar {
          background: var(--bg-secondary);
          border-right: 1px solid var(--border-slate-200) !important;
          position: sticky;
          top: 0;
          height: calc(100vh - 54px);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          align-self: flex-start;
          z-index: 10;
        }
        .sp-sidebar-top {
          padding: 14px 14px 12px 18px;
        }
        .sp-sidebar-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          padding-bottom: 14px;
          margin-bottom: 10px;
          border-bottom: 1px solid var(--border-slate-100);
        }
        .sp-sidebar-title {
          margin: 0;
          font-size: 15px;
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1.1;
          color: var(--text-slate-900);
        }
        .sp-sidebar-subtitle {
          font-size: 10.5px;
          color: var(--text-slate-400);
          font-weight: 700;
          margin-top: 4px;
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }
        .sp-hero-icon-box {
          width: 36px; height: 36px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          border: none;
          flex-shrink: 0;
        }
        /* removed dark override */
        .sp-side-create {
          height: 36px !important;
          border-radius: 6px !important;
          font-weight: 600 !important;
          background: linear-gradient(135deg, #3980f2 0%, #3980f2 100%) !important;
          border: none !important;
          // box-shadow: 0 4px 12px rgba(59, 130, 246, 0.28), inset 0 1px 0 rgba(255,255,255,0.18) !important;
        }
        .sp-sidebar-scroll {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 10px 10px 6px 16px;
        }
        [data-theme='dark'] .sp-sidebar {
          background: #0f1419 !important;
          border-right-color: #1f2937 !important;
        }
        .sp-sidebar-scroll::-webkit-scrollbar { width: 0; height: 0; display: none; }
        .sp-sidebar-section {
          padding: 4px 2px;
          margin-bottom: 13px;
        }
        .dh-side-label {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 8px;
          margin-bottom: 8px;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-slate-400);
        }
        .sp-sidebar-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .sp-sidebar-item {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 7px 10px;
          border: none;
          background: transparent;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          font-family: inherit;
          font-weight: 500;
          color: var(--text-slate-600);
          text-align: left;
          transition: background 0.15s, color 0.15s;
        }
        .sp-sidebar-item:hover {
          background: var(--bg-slate-100);
          color: var(--text-slate-900);
        }
        [data-theme='dark'] .sp-sidebar-item {
          color: #cbd5e1 !important;
        }
        [data-theme='dark'] .sp-sidebar-item:hover {
          background: #1c232e !important;
        }
        .sp-sidebar-item.active {
          background: rgba(59, 130, 246, 0.08);
          color: var(--text-slate-900);
          font-weight: 700;
        }
        .sp-sidebar-item.active .sp-sidebar-item-avatar-all {
          color: #3b82f6 !important;
          border-color: #3b82f6 !important;
        }
        [data-theme='dark'] .sp-sidebar-item.active {
          background: rgba(59, 130, 246, 0.18) !important;
          color: #f1f5f9 !important;
        }
        [data-theme='dark'] .sp-sidebar-item.active .sp-sidebar-item-avatar-all {
          color: #60a5fa !important;
          border-color: #60a5fa !important;
        }
        .sp-sidebar-status-chip {
          width: 22px;
          height: 22px;
          border-radius: 6px;
          border: 1px solid;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .sp-sidebar-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .sp-sidebar-status-dot.pulse {
          animation: sp-pulse-dot 2s infinite;
        }
        .sp-sidebar-item-avatar {
          width: 22px;
          height: 22px;
          border-radius: 6px;
          border: 1px solid;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 800;
          flex-shrink: 0;
          letter-spacing: -0.01em;
        }
        .sp-sidebar-item-avatar-all {
          background: var(--bg-slate-50);
          border-color: var(--border-slate-200);
          color: var(--text-slate-600);
        }
        [data-theme='dark'] .sp-sidebar-item-avatar-all {
          background: #1c232e !important;
          border-color: #2d3748 !important;
          color: #94a3b8 !important;
        }
        .sp-sidebar-item-label {
          flex: 1;
          font-size: 12.5px;
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          letter-spacing: -0.005em;
        }
        .sp-sidebar-item-count {
          font-size: 10.5px;
          font-weight: 700;
          color: var(--text-slate-500);
          font-variant-numeric: tabular-nums;
          background: var(--bg-slate-50);
          border-radius: 6px;
          padding: 0 6px;
          line-height: 1.6;
          flex-shrink: 0;
        }
        [data-theme='dark'] .sp-sidebar-item-count {
          background: #1c232e !important;
          border-color: #2d3748 !important;
          color: #94a3b8 !important;
        }
        .sp-sidebar-item.active .sp-sidebar-item-count {
          background: rgba(59,130,246,0.14) !important;
          border-color: rgba(59,130,246,0.25) !important;
          color: #3b82f6 !important;
          padding: 1px 7px !important;
        }
        [data-theme='dark'] .sp-sidebar-item.active .sp-sidebar-item-count {
          background: rgba(59,130,246,0.2) !important;
          border-color: rgba(59,130,246,0.35) !important;
          color: #60a5fa !important;
        }
        .sp-sidebar-divider {
          height: 1px;
          background: var(--border-slate-200);
          margin: 8px 6px;
        }
        [data-theme='dark'] .sp-sidebar-divider {
          background: #1f2937 !important;
        }
        .sp-sidebar-empty {
          padding: 10px 8px;
          font-size: 11px;
          color: var(--text-slate-400);
          font-style: italic;
        }
        .sp-sidebar-toggle {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          margin: 4px 8px 0;
          padding: 5px 8px;
          background: transparent;
          border: none;
          font-size: 11px;
          font-weight: 700;
          color: #3b82f6;
          cursor: pointer;
          font-family: inherit;
          border-radius: 6px;
          align-self: flex-start;
          transition: background 0.15s ease, color 0.15s ease;
          letter-spacing: -0.005em;
        }
        .sp-sidebar-toggle:hover {
          background: rgba(59,130,246,0.08);
          color: #1d4ed8;
        }
        [data-theme='dark'] .sp-sidebar-toggle {
          color: #60a5fa;
        }
        [data-theme='dark'] .sp-sidebar-toggle:hover {
          background: rgba(59,130,246,0.15);
        }
        .sp-sidebar-clear {
          display: inline-flex; align-items: center; gap: 5px; align-self: flex-start;
          background: none; border: none; cursor: pointer; padding: 3px;
          font-size: 12px; font-weight: 600; color: #ef4444; margin-top: 6px;
        }
        .sp-sidebar-clear:hover {
          opacity: 0.8;
        }
        [data-theme='dark'] .sp-sidebar-clear {
          color: #ef4444 !important;
        }

        /* ── Compact metric strip ─────────────────────────────── */
        .sp-metric-strip {
          display: flex;
          align-items: stretch;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 12px;
          padding: 6px 2px;
          margin-bottom: 12px;
          box-shadow: 0 1px 2px rgba(15,23,42,0.02);
          overflow: hidden;
        }
        [data-theme='dark'] .sp-metric-strip {
          background: #161b22 !important;
          border-color: #1f2937 !important;
        }
        .sp-metric {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 14px;
          position: relative;
          min-width: 0;
        }
        .sp-metric-icon {
          width: 28px;
          height: 28px;
          border-radius: 7px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .sp-metric-icon.blue { background: rgba(59,130,246,0.10); color: #3b82f6; }
        .sp-metric-icon.amber { background: rgba(245,158,11,0.10); color: #f59e0b; }
        .sp-metric-icon.emerald { background: rgba(16,185,129,0.10); color: #10b981; }
        .sp-metric-icon.violet { background: rgba(139,92,246,0.10); color: #8b5cf6; }
        .sp-metric-body {
          min-width: 0;
          line-height: 1.2;
        }
        .sp-metric-val {
          font-size: 18px;
          font-weight: 800;
          color: var(--text-slate-900);
          letter-spacing: -0.025em;
          line-height: 1.1;
          font-variant-numeric: tabular-nums;
        }
        [data-theme='dark'] .sp-metric-val { color: #f1f5f9 !important; }
        .sp-metric-sub {
          font-size: 10.5px;
          color: var(--text-slate-500);
          font-weight: 600;
          margin-left: 6px;
          letter-spacing: 0;
        }
        [data-theme='dark'] .sp-metric-sub { color: #94a3b8 !important; }
        .sp-metric-pct {
          font-size: 12px;
          color: var(--text-slate-400);
          font-weight: 700;
          margin-left: 1px;
        }
        .sp-metric-label {
          font-size: 9.5px;
          font-weight: 800;
          color: var(--text-slate-500);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-top: 2px;
        }
        [data-theme='dark'] .sp-metric-label { color: #94a3b8 !important; }
        .sp-metric-pulse {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 0 0 rgba(16,185,129,0.7);
          animation: sp-pulse 2s infinite;
        }
        .sp-metric-divider {
          width: 1px;
          background: var(--border-slate-100);
          margin: 8px 0;
        }
        [data-theme='dark'] .sp-metric-divider { background: #1f2937 !important; }

        /* ── Main Topbar ──────────────────────────────────────── */
        .sp-main-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 6px 20px;
          position: sticky;
          top: 0;
          z-index: 20;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border-slate-200);
          margin: -24px -24px 16px -21px;
          border-left: 1px solid var(--border-slate-200);
        }
        [data-theme='dark'] .sp-main-topbar {
          background: rgba(15, 20, 25, 0.85);
          border-bottom-color: #1f2937;
        }
        .sp-main-search {
          flex: 0 0 auto;
        }
        .sp-main-stats {
          flex: 1 1 auto;
          display: flex;
          align-items: center;
          font-size: 13px;
          color: var(--text-slate-500);
        }
        .sp-main-controls {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .sp-pulse-dot {
          width: 6px; height: 6px; border-radius: 9999px;
          background: #10b981;
          box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.55);
          animation: sp-pulse 2s infinite;
        }
        .sp-search-kbd {
          display: inline-block;
          font-size: 10px;
          font-weight: 600;
          padding: 1px 4px;
          border-radius: 4px;
          background: var(--bg-slate-100);
          color: var(--text-slate-400);
          border: 1px solid var(--border-slate-200);
          font-family: inherit;
        }
        [data-theme='dark'] .sp-search-kbd {
          background: #1f2937;
          border-color: #374151;
        }
        .sp-premium-select .ant-select-selector {
          border: 1px solid var(--border-slate-200) !important;
          border-radius: 10px !important;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.02) !important;
          padding-left: 12px !important;
          font-weight: 500 !important;
          background: var(--bg-pure-white) !important;
        }
        [data-theme='dark'] .sp-premium-select .ant-select-selector {
          background: #161b22 !important;
          border-color: #2d3748 !important;
        }
        /* ── Responsive ───────────────────────────────────────── */
        @media (max-width: 1024px) {
          .sp-shell {
            grid-template-columns: 1fr;
            gap: 0;
            min-height: 0;
          }
          .sp-sidebar {
            position: static;
            height: auto;
            border-right: none;
            border-bottom: 1px solid var(--border-slate-200);
          }
          [data-theme='dark'] .sp-sidebar {
            border-bottom-color: #1f2937 !important;
          }
          .sp-metric-strip {
            overflow-x: auto;
          }
          .sp-metric {
            flex: 1 0 160px;
          }
        }
        @media (max-width: 900px) {
          .sp-main-stats {
            display: none !important;
          }
        }
        @media (max-width: 640px) {
          .sp-main-topbar {
            flex-wrap: wrap;
          }
          .sp-main-search {
            width: 100%;
          }
          .sp-main-controls {
            width: 100%;
            justify-content: space-between;
          }
        }

        /* ── Card-as-row table ────────────────────────────────── */
        .sp-card-table-header {
          display: grid;
          grid-template-columns: minmax(280px, 1.6fr) 130px minmax(140px, 0.7fr) minmax(140px, 0.55fr) 160px;
          gap: 16px;
          padding: 4px 18px 8px;
          font-size: 10.5px;
          font-weight: 800;
          color: var(--text-slate-500);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        [data-theme='dark'] .sp-card-table-header {
          color: #94a3b8 !important;
        }
        .sp-card-col-actions {
          text-align: right;
        }
        .sp-card-table-body {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .sp-card-row {
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 12px;
          position: relative;
          transition: border-color 0.15s ease, background 0.15s ease;
          overflow: hidden;
        }
        [data-theme='dark'] .sp-card-row {
          background: #161b22 !important;
          border-color: #1f2937 !important;
        }
        .sp-card-row:hover {
          border-color: var(--row-accent, #3b82f6);
        }
        .sp-card-row.expanded {
          border-color: var(--row-accent, #3b82f6);
        }
        .sp-card-row-grid {
          display: grid;
          grid-template-columns: minmax(280px, 1.6fr) 130px minmax(140px, 0.7fr) minmax(140px, 0.55fr) 160px;
          gap: 16px;
          align-items: center;
          padding: 14px 18px;
        }
        .sp-card-row-accent {
          position: absolute;
          left: 0;
          top: 14px;
          bottom: 14px;
          width: 3px;
          border-radius: 0 999px 999px 0;
          opacity: 0;
          transition: opacity 0.15s ease;
        }
        .sp-card-row:hover .sp-card-row-accent,
        .sp-card-row.expanded .sp-card-row-accent {
          opacity: 1;
        }

        /* ── Expanded child panel (actual dates) ──────────────── */
        .sp-card-row-expand {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          padding: 14px 18px;
          background: var(--bg-slate-50);
          border-top: 1px dashed var(--border-slate-200);
        }
        [data-theme='dark'] .sp-card-row-expand {
          background: #0f1419 !important;
          border-top-color: #2d3748 !important;
        }
        .sp-expand-cell {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 8px 12px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 8px;
        }
        [data-theme='dark'] .sp-expand-cell {
          background: #161b22 !important;
          border-color: #1f2937 !important;
        }
        .sp-expand-label {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 9.5px;
          font-weight: 800;
          color: var(--text-slate-500);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        [data-theme='dark'] .sp-expand-label { color: #94a3b8 !important; }
        .sp-expand-value {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-slate-900);
          letter-spacing: -0.005em;
          font-variant-numeric: tabular-nums;
        }
        [data-theme='dark'] .sp-expand-value { color: #f1f5f9 !important; }
        .sp-expand-muted {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-slate-400);
          font-style: italic;
        }
        .sp-expand-muted-inline {
          font-size: 11px;
          font-weight: 500;
          color: var(--text-slate-400);
          margin-left: 4px;
        }
        .sp-expand-variance {
          font-size: 10px;
          font-weight: 700;
          padding: 1px 7px;
          border-radius: 999px;
          align-self: flex-start;
          letter-spacing: 0.01em;
          border: 1px solid;
        }
        .sp-expand-variance.late {
          color: #b45309;
          background: rgba(245,158,11,0.08);
          border-color: rgba(245,158,11,0.2);
        }
        .sp-expand-variance.early,
        .sp-expand-variance.on-time {
          color: #047857;
          background: rgba(16,185,129,0.08);
          border-color: rgba(16,185,129,0.2);
        }
        .sp-expand-variance.neutral {
          color: var(--text-slate-600);
          background: var(--bg-slate-50);
          border-color: var(--border-slate-200);
        }
        [data-theme='dark'] .sp-expand-variance.neutral {
          color: #94a3b8 !important;
          background: #1c232e !important;
          border-color: #2d3748 !important;
        }
        .sp-expand-creator {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          min-width: 0;
        }
        .sp-expand-avatar {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f59e0b1f 0%, #f59e0b33 100%);
          color: #b45309;
          border: 1px solid #f59e0b40;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 800;
          flex-shrink: 0;
          letter-spacing: -0.01em;
        }
        [data-theme='dark'] .sp-expand-avatar {
          color: #fbbf24 !important;
          border-color: #f59e0b66 !important;
        }
        .sp-expand-creator-name {
          font-size: 12.5px;
          font-weight: 700;
          color: var(--text-slate-900);
          letter-spacing: -0.005em;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        [data-theme='dark'] .sp-expand-creator-name { color: #f1f5f9 !important; }

        @media (max-width: 1100px) {
          .sp-card-row-expand {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 860px) {
          .sp-card-row-expand {
            grid-template-columns: 1fr;
          }
        }
        .sp-card-col {
          min-width: 0;
        }
        .sp-card-col-actions {
          display: flex;
          justify-content: flex-end;
        }
        .sp-card-row .sp-row-actions {
          opacity: 1;
        }
        .sp-card-loading {
          display: flex;
          justify-content: center;
          padding: 60px 0;
        }
        .sp-card-pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 24px;
          margin: auto -20px -28px -20px;
          flex-wrap: wrap;
          position: sticky;
          bottom: 0;
          background: var(--bg-pure-white);
          border-top: 1px solid var(--border-slate-200);
          z-index: 10;
          box-shadow: 0 -4px 16px rgba(15, 23, 42, 0.04);
        }
        [data-theme='dark'] .sp-card-pagination {
          background: #161b22 !important;
          border-top-color: #1f2937 !important;
        }

        /* Custom Pagination Styles */
        .sp-card-pagination .ant-pagination-item,
        .sp-card-pagination .ant-pagination-prev .ant-pagination-item-link,
        .sp-card-pagination .ant-pagination-next .ant-pagination-item-link {
          border: 1px solid var(--border-slate-200) !important;
          border-radius: 6px !important;
          background: transparent !important;
          color: var(--text-slate-500) !important;
        }
        .sp-card-pagination .ant-pagination-item-active {
          background: #3b82f6 !important;
          border-color: #3b82f6 !important;
        }
        .sp-card-pagination .ant-pagination-item-active a {
          color: #fff !important;
        }
        .sp-card-pagination .ant-select-selector {
          border: 1px solid var(--border-slate-200) !important;
          border-radius: 6px !important;
          color: var(--text-slate-500) !important;
        }

        @media (max-width: 1100px) {
          .sp-card-table-header,
          .sp-card-row-grid {
            grid-template-columns: minmax(220px, 1.6fr) 120px minmax(130px, 0.7fr) minmax(130px, 0.5fr) 150px;
            gap: 12px;
            padding-left: 14px;
            padding-right: 14px;
          }
        }
        @media (max-width: 860px) {
          .sp-card-table-header {
            display: none;
          }
          .sp-card-row-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .sp-card-col-actions {
            justify-content: flex-start;
          }
        }

        /* ── Premium status pill ──────────────────────────────── */
        .sp-status-pill-premium {
          padding: 5px 11px 5px 9px;
          font-size: 10.5px;
          letter-spacing: 0.02em;
          font-weight: 700;
          text-transform: none;
        }
        .sp-status-pill-premium .sp-status-pill-dot {
          width: 7px;
          height: 7px;
        }

        /* ── Premium progress ─────────────────────────────────── */
        .sp-progress-wrap {
          width: 100%;
        }
        .sp-progress-head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 7px;
        }
        .sp-progress-pct {
          display: inline-flex;
          align-items: baseline;
          gap: 1px;
        }
        .sp-progress-pct-num {
          font-size: 15px;
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1;
          font-variant-numeric: tabular-nums;
        }
        .sp-progress-pct-unit {
          font-size: 9.5px;
          font-weight: 700;
          opacity: 0.7;
          margin-left: 1px;
        }
        .sp-progress-count {
          font-size: 10.5px;
          font-weight: 600;
          color: var(--text-slate-500);
          font-variant-numeric: tabular-nums;
          letter-spacing: 0.01em;
          display: inline-flex;
          align-items: baseline;
          gap: 1px;
        }
        [data-theme='dark'] .sp-progress-count { color: #94a3b8 !important; }
        .sp-progress-count b {
          color: var(--text-slate-900);
          font-weight: 700;
        }
        [data-theme='dark'] .sp-progress-count b { color: #f1f5f9 !important; }
        .sp-progress-count-sep {
          opacity: 0.5;
          margin: 0 1px;
        }
        .sp-progress-track-premium {
          height: 6px;
          background: var(--bg-slate-50);
          border-radius: 999px;
          overflow: hidden;
          position: relative;
        }
        [data-theme='dark'] .sp-progress-track-premium {
          background: #1c232e !important;
        }
        .sp-progress-track-premium::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 999px;
          border: 1px solid rgba(15,23,42,0.04);
          pointer-events: none;
        }
        [data-theme='dark'] .sp-progress-track-premium::after {
          border-color: rgba(255,255,255,0.04);
        }
        .sp-progress-track-premium .sp-progress-fill {
          position: relative;
          height: 100%;
          border-radius: 999px;
        }
        .sp-progress-track-premium .sp-progress-fill::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(255,255,255,0.25), transparent 60%);
          border-radius: 999px;
        }

        /* ── Premium timeline ─────────────────────────────────── */
        .sp-timeline-wrap {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .sp-timeline-range {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .sp-timeline-date {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-slate-900);
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.01em;
        }
        [data-theme='dark'] .sp-timeline-date { color: #f1f5f9 !important; }
        .sp-timeline-link {
          width: 30px;
          height: 2px;
          background: var(--border-slate-200);
          border-radius: 999px;
          position: relative;
          flex-shrink: 0;
          overflow: hidden;
        }
        [data-theme='dark'] .sp-timeline-link {
          background: #2d3748 !important;
        }
        .sp-timeline-link-fill {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          border-radius: 999px;
        }
        .sp-timeline-meta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .sp-timeline-cycle {
          font-size: 10.5px;
          font-weight: 600;
          color: var(--text-slate-400);
          letter-spacing: 0.02em;
        }
        [data-theme='dark'] .sp-timeline-cycle { color: #64748b !important; }
        .sp-phase-chip-premium {
          padding: 2px 8px 2px 7px;
          font-size: 9.5px;
          font-weight: 800;
          border-radius: 5px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          border-width: 1px;
          border-style: solid;
        }
        .sp-phase-chip-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        /* ── Premium row actions ──────────────────────────────── */
        .sp-card-row .sp-row-action-btn {
          width: 28px;
          height: 28px;
          border-radius: 7px !important;
          color: var(--text-slate-500);
          transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
          border: 1px solid transparent;
        }
        .sp-card-row .sp-row-action-btn:hover {
          background: var(--bg-slate-50) !important;
          border-color: var(--border-slate-200);
          transform: none;
        }
        [data-theme='dark'] .sp-card-row .sp-row-action-btn:hover {
          background: #1c232e !important;
          border-color: #2d3748 !important;
        }
        .sp-card-row .sp-row-action-details.is-active {
          background: rgba(59,130,246,0.1) !important;
          border-color: rgba(59,130,246,0.3);
        }
        [data-theme='dark'] .sp-card-row .sp-row-action-details.is-active {
          background: rgba(59,130,246,0.18) !important;
          border-color: rgba(59,130,246,0.4) !important;
        }

        /* ── View toggle (List / Calendar) ────────────────────── */
        .sp-view-toggle {
          display: inline-flex;
          padding: 2px;
          background: transparent;
          border: none;
          border-radius: 8px;
          gap: 2px;
        }
        [data-theme='dark'] .sp-view-toggle {
          background: #1c232e !important;
          border-color: #2d3748 !important;
        }
        .sp-view-toggle-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 11px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 700;
          color: var(--text-slate-500);
          cursor: pointer;
          font-family: inherit;
          letter-spacing: -0.005em;
          transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
        }
        .sp-view-toggle-btn:hover {
          color: var(--text-slate-900);
        }
        [data-theme='dark'] .sp-view-toggle-btn:hover {
          color: #f1f5f9;
        }
        .sp-view-toggle-btn.active {
          background: var(--bg-slate-100);
          color: var(--text-slate-700);
          border-color: transparent;
        }
        [data-theme='dark'] .sp-view-toggle-btn.active {
          background: #161b22 !important;
          color: #60a5fa !important;
          border-color: #2d3748 !important;
        }

        /* ── Calendar view ────────────────────────────────────── */
        .sp-cal-card {
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 0;
          position: relative;
          flex: 1;
        }
        [data-theme='dark'] .sp-cal-card {
          background: #161b22 !important;
          border-color: #1f2937 !important;
        }
        .sp-cal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 18px;
          border-bottom: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white);
          gap: 12px;
          position: sticky;
          top: 52px;
          z-index: 5;
          border-radius: 0;
        }
        [data-theme='dark'] .sp-cal-header {
          background: #161b22 !important;
          border-bottom-color: #1f2937 !important;
        }
        .sp-cal-title-block {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .sp-cal-title {
          font-size: 18px !important;
          font-weight: 800 !important;
          color: var(--text-slate-900) !important;
          letter-spacing: -0.02em;
          line-height: 1.1;
        }
        [data-theme='dark'] .sp-cal-title { color: #f1f5f9 !important; }
        .sp-cal-subtitle {
          font-size: 11px !important;
          font-weight: 600 !important;
          color: var(--text-slate-500) !important;
          letter-spacing: 0.01em;
        }
        [data-theme='dark'] .sp-cal-subtitle { color: #94a3b8 !important; }
        .sp-cal-stat-row {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 2px;
        }
        .sp-cal-stat {
          display: inline-flex;
          align-items: baseline;
          gap: 4px;
        }
        .sp-cal-stat-num {
          font-size: 12.5px;
          font-weight: 800;
          color: var(--text-slate-900);
          letter-spacing: -0.02em;
          font-variant-numeric: tabular-nums;
        }
        [data-theme='dark'] .sp-cal-stat-num { color: #f1f5f9 !important; }
        .sp-cal-stat-label {
          font-size: 10.5px;
          font-weight: 700;
          color: var(--text-slate-500);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        [data-theme='dark'] .sp-cal-stat-label { color: #94a3b8 !important; }
        .sp-cal-stat-sep {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: var(--text-slate-300);
        }
        [data-theme='dark'] .sp-cal-stat-sep { background: #475569; }
        .sp-cal-nav {
          display: inline-flex;
          gap: 4px;
        }
        .sp-cal-nav-btn {
          border-radius: 8px !important;
          height: 32px !important;
          font-weight: 700 !important;
        }
        .sp-cal-nav-today {
          padding: 0 12px !important;
          font-size: 11.5px !important;
        }
        .sp-cal-body {
          display: flex;
          flex-direction: column;
        }
        .sp-cal-body-weeks {
          gap: 0;
          background: var(--bg-slate-50);
        }
        [data-theme='dark'] .sp-cal-body-weeks {
          background: #0b0f1a !important;
        }

        /* Week section — each week is its own labeled block */
        .sp-cal-week-section {
          background: var(--bg-pure-white);
          border-bottom: 1px solid var(--border-slate-200);
        }
        [data-theme='dark'] .sp-cal-week-section {
          background: #161b22 !important;
          border-bottom-color: #1f2937 !important;
        }
        .sp-cal-week-section:last-child { border-bottom: none; }
        .sp-cal-week-section.has-today {
          background: linear-gradient(180deg, rgba(59,130,246,0.025), var(--bg-pure-white));
        }
        [data-theme='dark'] .sp-cal-week-section.has-today {
          background: linear-gradient(180deg, rgba(59,130,246,0.06), #161b22) !important;
        }

        .sp-cal-week-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 18px;
          background: var(--bg-slate-50);
          border-bottom: 1px solid var(--border-slate-200);
          gap: 12px;
        }
        [data-theme='dark'] .sp-cal-week-label {
          background: #0f1419 !important;
          border-bottom-color: #1f2937 !important;
        }
        .sp-cal-week-section.has-today .sp-cal-week-label {
          background: rgba(59,130,246,0.06);
          border-bottom-color: rgba(59,130,246,0.2);
        }
        [data-theme='dark'] .sp-cal-week-section.has-today .sp-cal-week-label {
          background: rgba(59,130,246,0.12) !important;
          border-bottom-color: rgba(59,130,246,0.3) !important;
        }
        .sp-cal-week-label-left {
          display: inline-flex;
          align-items: baseline;
          gap: 10px;
          min-width: 0;
        }
        .sp-cal-week-num {
          font-size: 11px;
          font-weight: 800;
          color: var(--text-slate-700);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-variant-numeric: tabular-nums;
        }
        [data-theme='dark'] .sp-cal-week-num { color: #cbd5e1 !important; }
        .sp-cal-week-section.has-today .sp-cal-week-num {
          color: #1d4ed8;
        }
        [data-theme='dark'] .sp-cal-week-section.has-today .sp-cal-week-num {
          color: #60a5fa !important;
        }
        .sp-cal-week-range {
          font-size: 11.5px;
          font-weight: 600;
          color: var(--text-slate-500);
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.005em;
        }
        [data-theme='dark'] .sp-cal-week-range { color: #94a3b8 !important; }
        .sp-cal-week-count {
          font-size: 10.5px;
          font-weight: 700;
          color: var(--text-slate-500);
          letter-spacing: 0.01em;
        }
        [data-theme='dark'] .sp-cal-week-count { color: #94a3b8 !important; }

        .sp-cal-week-grid {
          position: relative;
        }
        .sp-cal-week-days {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          background: var(--bg-pure-white);
        }
        [data-theme='dark'] .sp-cal-week-days {
          background: #161b22 !important;
        }
        .sp-cal-week-ribbons {
          position: relative;
          padding: 0 0 12px;
          background: var(--bg-pure-white);
        }
        [data-theme='dark'] .sp-cal-week-ribbons {
          background: #161b22 !important;
        }
        .sp-cal-week-empty {
          padding: 14px 18px;
          font-size: 11.5px;
          font-weight: 500;
          color: var(--text-slate-400);
          font-style: italic;
          background: var(--bg-pure-white);
        }
        [data-theme='dark'] .sp-cal-week-empty {
          color: #64748b !important;
          background: #161b22 !important;
        }

        .sp-cal-day-cell {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 8px 12px;
          border-right: 1px solid var(--border-slate-100);
          background: transparent;
        }
        [data-theme='dark'] .sp-cal-day-cell {
          background: #161b22 !important;
          border-right-color: #1f2937 !important;
        }
        .sp-cal-day-cell:last-child { border-right: none; }
        .sp-cal-day-cell.outside .sp-cal-day-weekday,
        .sp-cal-day-cell.outside .sp-cal-day-num {
          opacity: 0.45;
        }
        .sp-cal-day-weekday {
          font-size: 9.5px;
          font-weight: 800;
          color: var(--text-slate-500);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        [data-theme='dark'] .sp-cal-day-weekday { color: #94a3b8 !important; }
        .sp-cal-day-cell.today .sp-cal-day-weekday {
          color: #1d4ed8;
        }
        [data-theme='dark'] .sp-cal-day-cell.today .sp-cal-day-weekday {
          color: #60a5fa !important;
        }
        .sp-cal-day-cell.weekend:not(.outside) {
          background: linear-gradient(180deg, rgba(148,163,184,0.04), transparent);
        }
        .sp-cal-day-cell.today {
          background: rgba(59,130,246,0.04);
        }
        [data-theme='dark'] .sp-cal-day-cell.today {
          background: rgba(59,130,246,0.1) !important;
        }
        .sp-cal-day-num {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-slate-700);
          font-variant-numeric: tabular-nums;
        }
        [data-theme='dark'] .sp-cal-day-num { color: #cbd5e1 !important; }
        .sp-cal-day-cell.outside .sp-cal-day-num {
          color: var(--text-slate-400);
          font-weight: 600;
        }
        .sp-cal-day-num.today {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 20px;
          height: 20px;
          padding: 0 6px;
          background: #3b82f6;
          color: #fff !important;
          border-radius: 999px;
          font-weight: 800;
          letter-spacing: -0.01em;
        }

        .sp-cal-ribbons {
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
          pointer-events: none;
        }
        .sp-cal-week-ribbons .sp-cal-ribbon { pointer-events: auto; }
        .sp-cal-ribbon {
          position: absolute;
          height: 22px;
          padding: 0 8px;
          border-radius: 5px;
          border: 1px solid;
          background: transparent;
          font-family: inherit;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: -0.005em;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          overflow: hidden;
          white-space: nowrap;
          text-align: left;
          transition: filter 0.15s ease, transform 0.15s ease;
          pointer-events: auto;
        }
        .sp-cal-ribbon:hover {
          filter: brightness(1.08);
          transform: translateY(-1px);
        }
        .sp-cal-ribbon.cont-left {
          border-top-left-radius: 0;
          border-bottom-left-radius: 0;
          border-left: none;
          padding-left: 6px;
        }
        .sp-cal-ribbon.cont-right {
          border-top-right-radius: 0;
          border-bottom-right-radius: 0;
          border-right: none;
          padding-right: 6px;
        }
        .sp-cal-ribbon-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .sp-cal-ribbon-dot.pulse {
          animation: sp-pulse-dot 2s infinite;
        }
        .sp-cal-ribbon-name {
          overflow: hidden;
          text-overflow: ellipsis;
          flex-shrink: 1;
        }
        .sp-cal-ribbon-proj {
          opacity: 0.75;
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          flex-shrink: 1;
        }

        .sp-cal-legend {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 18px;
          flex-wrap: wrap;
          border-top: 1px solid var(--border-slate-200);
          background: var(--bg-slate-50);
          position: sticky;
          bottom: 0;
          z-index: 5;
          border-radius: 0 0 12px 12px;
        }
        [data-theme='dark'] .sp-cal-legend {
          background: #0f1419 !important;
          border-top-color: #1f2937 !important;
        }
        .sp-cal-legend-label {
          font-size: 10px;
          font-weight: 800;
          color: var(--text-slate-500);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-right: 4px;
        }
        [data-theme='dark'] .sp-cal-legend-label { color: #94a3b8 !important; }
        .sp-cal-legend-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 9px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-slate-700);
          cursor: pointer;
          font-family: inherit;
          transition: border-color 0.15s ease, color 0.15s ease, opacity 0.15s ease;
          max-width: 180px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          letter-spacing: -0.005em;
        }
        .sp-cal-legend-chip:hover {
          border-color: var(--text-slate-400);
        }
        .sp-cal-legend-chip.muted {
          opacity: 0.4;
        }
        [data-theme='dark'] .sp-cal-legend-chip {
          background: #161b22 !important;
          border-color: #2d3748 !important;
          color: #cbd5e1 !important;
        }
        .sp-cal-legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .sp-cal-legend-more {
          font-size: 10.5px;
          font-weight: 700;
          color: var(--text-slate-500);
        }
        .sp-cal-legend-toggle {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          background: transparent;
          border: 1px dashed var(--border-slate-300, #cbd5e1);
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          color: #3b82f6;
          cursor: pointer;
          font-family: inherit;
          letter-spacing: -0.005em;
          transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
        }
        .sp-cal-legend-toggle:hover {
          background: rgba(59,130,246,0.08);
          border-color: rgba(59,130,246,0.4);
          color: #1d4ed8;
        }
        [data-theme='dark'] .sp-cal-legend-toggle {
          color: #60a5fa;
          border-color: #2d3748;
        }
        [data-theme='dark'] .sp-cal-legend-toggle:hover {
          background: rgba(59,130,246,0.15);
          border-color: rgba(59,130,246,0.45);
        }

        @media (max-width: 900px) {
          .sp-cal-day-cell { padding: 4px 6px; min-height: 24px; }
          .sp-cal-ribbon { font-size: 9.5px; padding: 0 5px; height: 20px; }
          .sp-cal-ribbon-proj { display: none; }
        }

        /* ── Calendar ribbon hover card (premium) ─────────────── */
        .sp-cal-tooltip-wrap .ant-tooltip-arrow { display: none !important; }
        .sp-cal-tooltip-wrap .ant-tooltip-inner {
          background: transparent !important;
          padding: 0 !important;
          box-shadow: none !important;
          min-width: 320px !important;
          max-width: 360px !important;
        }
        .sp-cal-tooltip {
          width: 320px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 12px;
          padding: 14px 16px 12px 18px;
          position: relative;
          overflow: hidden;
          color: var(--text-slate-900);
          font-family: inherit;
        }
        [data-theme='dark'] .sp-cal-tooltip {
          background: #161b22 !important;
          border-color: #2d3748 !important;
          color: #f1f5f9 !important;
        }
        .sp-cal-tooltip-accent {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
        }
        .sp-cal-tooltip-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }
        .sp-cal-tooltip-title-block {
          min-width: 0;
          flex: 1;
        }
        .sp-cal-tooltip-name {
          font-size: 14px;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: var(--text-slate-900);
          line-height: 1.3;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          word-break: break-word;
        }
        [data-theme='dark'] .sp-cal-tooltip-name { color: #f1f5f9 !important; }
        .sp-cal-tooltip-project {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 600;
          color: var(--text-slate-600);
          margin-top: 4px;
          letter-spacing: -0.005em;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        [data-theme='dark'] .sp-cal-tooltip-project { color: #cbd5e1 !important; }
        .sp-cal-tooltip-project-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .sp-cal-tooltip-badges {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
          flex-shrink: 0;
        }
        .sp-cal-tooltip-status {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 2px 9px;
          font-size: 9.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          border-radius: 999px;
          border: 1px solid;
          line-height: 1.5;
        }
        .sp-cal-tooltip-status-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
        }
        .sp-cal-tooltip-status-dot.pulse {
          animation: sp-pulse-dot 2s infinite;
        }
        .sp-cal-tooltip-prio {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 1px 7px;
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-radius: 4px;
          line-height: 1.6;
        }
        .sp-cal-tooltip-prio-high { color: #dc2626; background: rgba(239,68,68,0.1); }
        .sp-cal-tooltip-prio-medium { color: #d97706; background: rgba(245,158,11,0.1); }
        .sp-cal-tooltip-prio-low { color: #059669; background: rgba(16,185,129,0.1); }
        [data-theme='dark'] .sp-cal-tooltip-prio-high { color: #f87171; background: rgba(239,68,68,0.15); }
        [data-theme='dark'] .sp-cal-tooltip-prio-medium { color: #fbbf24; background: rgba(245,158,11,0.15); }
        [data-theme='dark'] .sp-cal-tooltip-prio-low { color: #34d399; background: rgba(16,185,129,0.15); }
        .sp-cal-tooltip-divider {
          height: 1px;
          background: var(--border-slate-100);
          margin: 12px 0 10px;
        }
        [data-theme='dark'] .sp-cal-tooltip-divider { background: #1f2937 !important; }
        .sp-cal-tooltip-stats {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 16px;
        }
        .sp-cal-tooltip-stat-label {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 9px;
          font-weight: 800;
          color: var(--text-slate-500);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 5px;
        }
        [data-theme='dark'] .sp-cal-tooltip-stat-label { color: #94a3b8 !important; }
        .sp-cal-tooltip-stat-value {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-slate-900);
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.005em;
          display: inline-flex;
          align-items: baseline;
          gap: 5px;
          flex-wrap: wrap;
        }
        [data-theme='dark'] .sp-cal-tooltip-stat-value { color: #f1f5f9 !important; }
        .sp-cal-tooltip-stat-arrow {
          color: var(--text-slate-400);
          font-weight: 600;
        }
        [data-theme='dark'] .sp-cal-tooltip-stat-arrow { color: #64748b !important; }
        .sp-cal-tooltip-pct {
          font-size: 19px;
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1;
        }
        .sp-cal-tooltip-pct-unit {
          font-size: 10px;
          font-weight: 700;
          opacity: 0.7;
          margin-left: 1px;
        }
        .sp-cal-tooltip-stat-sub {
          font-size: 10.5px;
          font-weight: 600;
          color: var(--text-slate-500);
          margin-top: 4px;
          font-variant-numeric: tabular-nums;
          letter-spacing: 0.01em;
        }
        [data-theme='dark'] .sp-cal-tooltip-stat-sub { color: #94a3b8 !important; }
        .sp-cal-tooltip-stat-sub b {
          color: var(--text-slate-900);
          font-weight: 800;
        }
        [data-theme='dark'] .sp-cal-tooltip-stat-sub b { color: #f1f5f9 !important; }
        .sp-cal-tooltip-bar {
          height: 5px;
          background: var(--bg-slate-50);
          border-radius: 999px;
          overflow: hidden;
          margin: 12px 0 4px;
          position: relative;
        }
        [data-theme='dark'] .sp-cal-tooltip-bar { background: #1c232e !important; }
        .sp-cal-tooltip-bar-fill {
          height: 100%;
          border-radius: 999px;
          position: relative;
        }
        .sp-cal-tooltip-bar-fill::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(255,255,255,0.25), transparent 60%);
          border-radius: 999px;
        }
        .sp-cal-tooltip-actuals {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 8px;
        }
        .sp-cal-tooltip-actual {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10.5px;
          font-weight: 600;
          color: var(--text-slate-500);
          letter-spacing: -0.005em;
        }
        [data-theme='dark'] .sp-cal-tooltip-actual { color: #94a3b8 !important; }
        .sp-cal-tooltip-actual b {
          color: var(--text-slate-900);
          font-weight: 700;
          margin-left: 2px;
        }
        [data-theme='dark'] .sp-cal-tooltip-actual b { color: #f1f5f9 !important; }
        .sp-cal-tooltip-goal-text {
          font-size: 11.5px;
          font-weight: 500;
          color: var(--text-slate-600);
          line-height: 1.55;
          letter-spacing: -0.005em;
        }
        [data-theme='dark'] .sp-cal-tooltip-goal-text { color: #cbd5e1 !important; }
        .sp-cal-tooltip-footer {
          margin-top: 12px;
          padding-top: 9px;
          border-top: 1px dashed var(--border-slate-200);
          font-size: 9.5px;
          font-weight: 800;
          color: var(--text-slate-400);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        [data-theme='dark'] .sp-cal-tooltip-footer {
          border-top-color: #2d3748 !important;
          color: #64748b !important;
        }

        /* ── Premium list view (card stack) ──────────────────── */
        .sp-plist {
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
        }
        .sp-plist-card {
          position: relative;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 0px;
          padding: 2px 16px 6px 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          overflow: hidden;
          transition: border-color 0.2s ease, background 0.2s ease;
        }
        // [data-theme='dark'] .sp-plist-card {
        //   background: #161b22 !important;
        //   border-color: #1f2937 !important;
        // }
        // .sp-plist-card:hover {
        //   background: #f8fafc !important;
        //   border-color: #cbd5e1 !important;
        // }
        //   .sp-plist-card:hover .sp-plist-block{
        //   background: #ffffff !important;
        // }
        // [data-theme='dark'] .sp-plist-card:hover {
        //   background: #1c232e !important;
        // }
        //     [data-theme='dark'] .sp-plist-card:hover .sp-plist-block{
        //   background: #1f2937 !important;
        // }

        .sp-plist-card:hover {
          border-color: #cbd5e1 !important;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12), 0 8px 24px rgba(0, 0, 0, 0.08) !important;
        }
        [data-theme='dark'] .sp-plist-card:hover {
          background: #1c232e !important;
          border-color: #1f2937 !important;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12), 0 8px 24px rgba(0, 0, 0, 0.15) !important;
        }

        .sp-plist-stripe {
          position: absolute;
          left: 0;
          top: 18px;
          bottom: 18px;
          width: 3px;
          border-radius: 0 999px 999px 0;
          opacity: 0.85;
        }

        /* Header — single horizontal row */
        .sp-plist-head {
          display: flex;
          align-items: center;
        }
        .sp-plist-row {
          display: flex;
          align-items: center;
          gap: 14px;
          flex: 1;
          min-width: 0;
          cursor: pointer;
          background: transparent;
          border: none;
          padding: 0;
          text-align: left;
          font-family: inherit;
          outline: none;
        }
        .sp-plist-row:focus-visible {
          outline: 2px solid rgba(59,130,246,0.3);
          outline-offset: 4px;
          border-radius: 8px;
        }
        .sp-plist-row-segments {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          flex-wrap: wrap;
        }
        .sp-plist-row-div {
          width: 1px;
          height: 18px;
          background: var(--border-slate-200);
          flex-shrink: 0;
        }
        [data-theme='dark'] .sp-plist-row-div {
          background: #2d3748 !important;
        }
        .sp-plist-seg {
          display: inline-flex;
          align-items: center;
          min-width: 0;
          padding: 0px 2px;
        }
        .sp-plist-seg-project {
          gap: 6px;
          flex-shrink: 0;
        }
        .sp-plist-seg-label {
          font-size: 10px;
          font-weight: 600;
          color: var(--text-slate-400);
          text-transform: capitalize;
          letter-spacing: 0.05em;
        }
        [data-theme='dark'] .sp-plist-seg-label { color: #94a3b8 !important; }
        .sp-plist-seg-value {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-slate-700);
          letter-spacing: -0.01em;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        [data-theme='dark'] .sp-plist-seg-value { color: #cbd5e1 !important; }
        .sp-plist-seg-value.muted {
          color: var(--text-slate-400);
          font-style: italic;
          font-weight: 600;
        }
        .sp-plist-creator-avatar-sm {
          width: 22px;
          height: 22px;
          border-radius: 6px;
          border: 0.5px solid transparent;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 800;
          position: relative;
          overflow: hidden;
        }
        .sp-plist-creator-avatar-sm::after {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 75% 0%, rgba(255,255,255,0.2), transparent 55%),
            radial-gradient(circle at 0% 100%, rgba(0,0,0,0.06), transparent 55%);
          pointer-events: none;
        }
        .sp-plist-seg-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .sp-plist-seg-name {
          flex: 1;
          min-width: 0;
          font-size: 13px;
          font-weight: 700;
          color: var(--text-slate-900);
          letter-spacing: -0.01em;
          line-height: 1.25;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        [data-theme='dark'] .sp-plist-seg-name { color: #f1f5f9 !important; }
        .sp-plist-row:hover .sp-plist-seg-name {
          color: #2563eb;
        }
        [data-theme='dark'] .sp-plist-row:hover .sp-plist-seg-name {
          color: #60a5fa !important;
        }

        /* Goal on its own row */
        .sp-plist-goal-row {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin: -6px 0 0;
          padding: 6px 10px 6px 8px;
          font-size: 12px;
          font-weight: 500;
          color: var(--text-slate-600);
          letter-spacing: -0.005em;
          background: var(--bg-slate-50);
          border: 1px dashed var(--border-slate-200);
          border-radius: 6px;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          line-height: 1.5;
          align-self: flex-start;
        }
        [data-theme='dark'] .sp-plist-goal-row {
          color: #cbd5e1 !important;
          background: #1c232e !important;
          border-color: #2d3748 !important;
        }
        .sp-plist-avatar {
          width: 38px;
          height: 38px;
          border-radius: 11px;
          border: 1px solid transparent;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          font-weight: 800;
          letter-spacing: -0.025em;
          flex-shrink: 0;
          position: relative;
          overflow: hidden;
          background: #3b82f6 !important;
        }
        .sp-plist-avatar::after {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 75% 0%, rgba(255,255,255,0.2), transparent 55%),
            radial-gradient(circle at 0% 100%, rgba(0,0,0,0.06), transparent 55%);
          pointer-events: none;
        }
        .sp-plist-avatar-letter {
          position: relative;
          z-index: 1;
          line-height: 1;
          color: #fff !important;
        }
        .sp-plist-identity-text {
          min-width: 0;
          flex: 1;
        }
        .sp-plist-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 800;
          color: var(--text-slate-500);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        [data-theme='dark'] .sp-plist-eyebrow { color: #94a3b8 !important; }
        .sp-plist-eyebrow-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
        }
        .sp-plist-eyebrow-proj {
          color: var(--text-slate-700);
          max-width: 240px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        [data-theme='dark'] .sp-plist-eyebrow-proj { color: #cbd5e1 !important; }
        .sp-plist-eyebrow-proj.muted {
          color: var(--text-slate-400);
          font-style: italic;
          font-weight: 600;
        }
        .sp-plist-eyebrow-sep {
          opacity: 0.45;
        }
        .sp-plist-title {
          margin: 4px 0 0;
          font-size: 16px;
          font-weight: 800;
          color: var(--text-slate-900);
          letter-spacing: -0.025em;
          line-height: 1.25;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          word-break: break-word;
        }
        [data-theme='dark'] .sp-plist-title { color: #f1f5f9 !important; }
        .sp-plist-identity:hover .sp-plist-title {
          color: #2563eb;
        }
        [data-theme='dark'] .sp-plist-identity:hover .sp-plist-title {
          color: #60a5fa !important;
        }
        .sp-plist-goal {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin: 6px 0 0;
          font-size: 12px;
          font-weight: 500;
          color: var(--text-slate-500);
          letter-spacing: -0.005em;
          max-width: 560px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          line-height: 1.5;
        }
        [data-theme='dark'] .sp-plist-goal { color: #94a3b8 !important; }

        .sp-plist-badges {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
          flex-shrink: 0;
        }
        .sp-plist-status {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 4px 12px 4px 10px;
          font-size: 11px;
          font-weight: 800;
          border-radius: 999px;
          border: 1px solid;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          line-height: 1.4;
        }
        .sp-plist-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .sp-plist-status-dot.pulse {
          animation: sp-pulse-dot 2s infinite;
        }
        .sp-plist-prio {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          font-size: 9.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          border-radius: 4px;
          line-height: 1.6;
        }
        .sp-plist-prio-high { color: #dc2626; background: rgba(239,68,68,0.1); }
        .sp-plist-prio-medium { color: #d97706; background: rgba(245,158,11,0.1); }
        .sp-plist-prio-low { color: #059669; background: rgba(16,185,129,0.1); }
        [data-theme='dark'] .sp-plist-prio-high { color: #f87171; background: rgba(239,68,68,0.15); }
        [data-theme='dark'] .sp-plist-prio-medium { color: #fbbf24; background: rgba(245,158,11,0.15); }
        [data-theme='dark'] .sp-plist-prio-low { color: #34d399; background: rgba(16,185,129,0.15); }

        /* Body — 2 column stat blocks */
        .sp-plist-body {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .sp-plist-block {
          padding: 2px 12px 2px;
          background: var(--bg-slate-50);
          border: 1px solid var(--border-slate-100);
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        [data-theme='dark'] .sp-plist-block {
          background: #1c232e !important;
          border-color: #2d3748 !important;
        }
        .sp-plist-block-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 4px;
        }
        .sp-plist-block-label {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 9px;
          font-weight: 800;
          color: var(--text-slate-500);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        [data-theme='dark'] .sp-plist-block-label { color: #94a3b8 !important; }
        .sp-plist-block-pct {
          display: inline-flex;
          align-items: baseline;
          gap: 1px;
        }
        .sp-plist-block-pct-num {
          font-size: 16px;
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1;
          font-variant-numeric: tabular-nums;
        }
        .sp-plist-block-pct-unit {
          font-size: 11px;
          font-weight: 700;
          opacity: 0.7;
          margin-left: 1px;
        }
        .sp-plist-cycle {
          font-size: 10px;
          font-weight: 700;
          color: var(--text-slate-600);
          letter-spacing: 0.01em;
          text-transform: uppercase;
        }
        [data-theme='dark'] .sp-plist-cycle { color: #cbd5e1 !important; }

        /* Progress bar */
        .sp-plist-bar {
          height: 5px;
          background: var(--bg-pure-white);
          border-radius: 999px;
          overflow: hidden;
          position: relative;
          margin-bottom: 4px;
          border: 1px solid rgba(15,23,42,0.04);
        }
        [data-theme='dark'] .sp-plist-bar {
          background: #0f1419 !important;
          border-color: rgba(255,255,255,0.04);
        }
        .sp-plist-bar-fill {
          height: 100%;
          border-radius: 999px;
          position: relative;
        }
        .sp-plist-bar-fill::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(255,255,255,0.25), transparent 60%);
          border-radius: 999px;
        }
        .sp-plist-chips {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .sp-plist-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          font-size: 12px;
          font-weight: 600;
          border-radius: 6px;
          border: 1px solid;
          letter-spacing: -0.005em;
          line-height: 1.6;
          font-variant-numeric: tabular-nums;
        }
        .sp-plist-chip b { font-weight: 800; }
        .sp-plist-chip-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }
        .sp-plist-chip.done {
          color: #047857;
          background: rgba(16,185,129,0.08);
          border-color: rgba(16,185,129,0.22);
        }
        [data-theme='dark'] .sp-plist-chip.done {
          color: #34d399;
          background: rgba(16,185,129,0.12);
          border-color: rgba(16,185,129,0.35);
        }
        .sp-plist-chip.total {
          color: var(--text-slate-600);
          background: var(--bg-pure-white);
          border-color: var(--border-slate-200);
        }
        [data-theme='dark'] .sp-plist-chip.total {
          color: #cbd5e1;
          background: #161b22;
          border-color: #2d3748;
        }

        /* Timeline block */
        .sp-plist-dates {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-bottom: 6px;
        }
        .sp-plist-date-cell {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex-shrink: 0;
        }
        .sp-plist-date-cell-right {
          align-items: flex-end;
        }
        .sp-plist-date-label {
          font-size: 6px;
          font-weight: 800;
          color: var(--text-slate-500);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        [data-theme='dark'] .sp-plist-date-label { color: #94a3b8 !important; }
        .sp-plist-date-value {
          font-size: 10px;
          font-weight: 800;
          color: var(--text-slate-900);
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.015em;
        }
        [data-theme='dark'] .sp-plist-date-value { color: #f1f5f9 !important; }
        .sp-plist-date-link {
          flex: 1;
          height: 2px;
          background: var(--border-slate-200);
          border-radius: 999px;
          position: relative;
          overflow: hidden;
          min-width: 24px;
        }
        [data-theme='dark'] .sp-plist-date-link {
          background: #2d3748 !important;
        }
        .sp-plist-date-link-fill {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          border-radius: 999px;
        }
        .sp-plist-phase-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .sp-plist-phase {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 2px 9px;
          font-size: 9.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          border-radius: 5px;
          border: 1px solid;
          line-height: 1.6;
        }
        .sp-plist-phase-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
        }

        /* Footer — single inline meta line */
        .sp-plist-foot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding-top: 0px;
          border-top: 1px dashed var(--border-slate-100);
        }
        [data-theme='dark'] .sp-plist-foot {
          border-top-color: #1f2937 !important;
        }
        .sp-plist-foot-inline {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
          flex: 1;
          min-width: 0;
        }
        .sp-plist-foot-item {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11.5px;
          font-weight: 600;
          color: var(--text-slate-500);
          letter-spacing: -0.005em;
          font-variant-numeric: tabular-nums;
        }
        [data-theme='dark'] .sp-plist-foot-item { color: #94a3b8 !important; }
        .sp-plist-foot-item b {
          color: var(--text-slate-900);
          font-weight: 700;
          margin-left: 2px;
        }
        [data-theme='dark'] .sp-plist-foot-item b { color: #f1f5f9 !important; }
        .sp-plist-foot-label {
          font-size: 10px;
          font-weight: 600;
          color: var(--text-slate-600);
          text-transform: capitalize;
          letter-spacing: 0.04em;
        }
        [data-theme='dark'] .sp-plist-foot-label { color: #94a3b8 !important; }
        .sp-plist-foot-div {
          width: 1px;
          height: 14px;
          background: var(--border-slate-200);
          flex-shrink: 0;
        }
        [data-theme='dark'] .sp-plist-foot-div {
          background: #2d3748 !important;
        }
        .sp-plist-foot-muted {
          color: var(--text-slate-400);
          font-style: italic;
          font-weight: 600;
        }
        .sp-plist-foot-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          border: 1px solid transparent;
          padding: 2px 8px 2px 7px;
          font-family: inherit;
          font-size: 11.5px;
          font-weight: 800;
          color: #6366f1;
          cursor: pointer;
          letter-spacing: 0.01em;
          border-radius: 5px;
          transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
        }
        .sp-plist-foot-link:hover {
          background: rgba(99,102,241,0.08);
          border-color: rgba(99,102,241,0.25);
          color: #4f46e5;
        }
        [data-theme='dark'] .sp-plist-foot-link {
          color: #818cf8;
        }
        [data-theme='dark'] .sp-plist-foot-link:hover {
          background: rgba(99,102,241,0.15);
          border-color: rgba(99,102,241,0.35);
          color: #a5b4fc;
        }
        .sp-plist-creator-mini {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .sp-plist-creator-avatar-sm {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(245,158,11,0.18), rgba(245,158,11,0.4));
          color: #b45309;
          border: 1px solid rgba(245,158,11,0.45);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: -0.01em;
          flex-shrink: 0;
        }
        [data-theme='dark'] .sp-plist-creator-avatar-sm {
          color: #fbbf24 !important;
          border-color: rgba(245,158,11,0.55) !important;
        }
        .sp-plist-variance {
          padding: 0 5px;
          font-size: 9.5px;
          font-weight: 800;
          border-radius: 3px;
          margin-left: 4px;
          letter-spacing: 0.02em;
          font-variant-numeric: tabular-nums;
        }
        .sp-plist-variance.late {
          color: #b45309;
          background: rgba(245,158,11,0.12);
        }
        .sp-plist-variance.early {
          color: #047857;
          background: rgba(16,185,129,0.12);
        }
        [data-theme='dark'] .sp-plist-variance.late {
          color: #fbbf24;
          background: rgba(245,158,11,0.18);
        }
        [data-theme='dark'] .sp-plist-variance.early {
          color: #34d399;
          background: rgba(16,185,129,0.18);
        }

        .sp-plist-actions {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          flex-shrink: 0;
        }
        .sp-plist-action-btn {
          width: 30px !important;
          height: 30px !important;
          border-radius: 8px !important;
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
          border: 1px solid transparent !important;
          transition: background 0.15s ease, border-color 0.15s ease;
        }
        .sp-plist-action-btn:hover {
          background: var(--bg-slate-50) !important;
          border-color: var(--border-slate-200) !important;
        }
        /* removed sp-plist-action-btn:hover override */

        .sp-foot-btn {
          display: inline-flex !important;
          align-items: center;
          gap: 6px;
          height: 28px !important;
          padding: 0 10px !important;
          border-radius: 7px !important;
          border: 1px solid var(--border-slate-200) !important;
          background: var(--bg-pure-white) !important;
          color: var(--text-slate-700) !important;
          font-size: 11.5px !important;
          font-weight: 700 !important;
          letter-spacing: 0.005em;
          transition: border-color 0.12s ease, color 0.12s ease, background 0.12s ease;
        }
        .sp-foot-btn:hover:not(:disabled) {
          border-color: #8b5cf6 !important;
          color: #8b5cf6 !important;
          background: var(--bg-slate-50) !important;
        }
        .sp-foot-btn:disabled {
          background: var(--bg-slate-50) !important;
          color: var(--text-slate-400) !important;
        }
        [data-theme="dark"] .sp-foot-btn {
          background: var(--bg-pure-white) !important;
          border-color: var(--border-slate-200) !important;
          color: var(--text-slate-700) !important;
        }

        .sp-foot-btn-start {
          background: var(--bg-green-50, #ecfdf5) !important;
          border-color: var(--border-green-200, #a7f3d0) !important;
          color: #10b981 !important;
          margin-right: 10px !important;
        }

        .sp-foot-btn-start:hover:not(:disabled) {
          background: #d1fae5 !important;
          border-color: #10b981 !important;
          color: #059669 !important;
        }

        /* removed sp-foot-btn-start dark override */

        .sp-foot-btn-view {
          background: rgba(100, 116, 139, 0.08) !important;
          border-color: rgba(100, 116, 139, 0.3) !important;
          color: #64748b !important;
        }

        .sp-foot-btn-view:hover:not(:disabled) {
          background: rgba(100, 116, 139, 0.15) !important;
          border-color: #64748b !important;
          color: #64748b !important;
        }

        /* removed sp-foot-btn-view dark override */

        .sp-foot-btn-complete {
          background: var(--bg-blue-50) !important;
          border-color: var(--border-blue-200, #bfdbfe) !important;
          color: #3b82f6 !important;
          margin-right: 10px !important;
        }

        .sp-foot-btn-complete:hover:not(:disabled) {
          background: #dbeafe !important;
          border-color: #3b82f6 !important;
          color: #2563eb !important;
        }

        /* removed sp-foot-btn-complete dark override */

        @media (max-width: 900px) {
          .sp-plist-body {
            grid-template-columns: 1fr;
          }
          .sp-plist-foot {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }
          .sp-plist-actions {
            justify-content: flex-end;
          }
          .sp-plist-row-segments {
            gap: 8px;
          }
          .sp-plist-seg-name {
            font-size: 14px;
          }
          .sp-detail-drawer .ant-drawer-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
            padding: 16px 20px !important;
          }
          .sp-detail-drawer .ant-drawer-header-title {
            width: 100% !important;
            flex: none !important;
          }
          .sp-detail-drawer .ant-drawer-extra {
            width: 100% !important;
            justify-content: flex-start !important;
            margin-left: 0 !important;
            padding-left: 0 !important;
          }
        }
      `}</style>
      </div>
    </div>
  );
}
