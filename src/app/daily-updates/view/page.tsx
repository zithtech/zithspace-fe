"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import SearchableDropdown from "@/components/common/SearchableDropdown";
import { usePermission } from "@/hooks/usePermission";
import { useRouter } from "next/navigation";
import {
  Card,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Select,
  DatePicker,
  Empty,
  Spin,
  App,
  Segmented,
  Tag,
  Pagination,
  Avatar,
} from "antd";
import {
  PlusCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  FilterOutlined,
  CalendarOutlined,
  SearchOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import {
  Plus,
  RefreshCw,
  LayoutGrid,
  List as ListIcon,
  Zap,
  Clock,
  Users,
  Filter,
  Calendar as CalendarIcon,
  ChevronRight,
  Activity,
  FileText,
  History,
  Menu
} from "lucide-react";
import dayjs, { Dayjs } from "dayjs";
import MainLayout from "@/components/layout/MainLayout";
import UpdateCard from "@/components/daily-updates/UpdateCard";
import DailyUpdatesDashboard from "@/components/daily-updates/DailyUpdatesDashboard";
import UpdateTable from "@/components/daily-updates/UpdateTable";
import UpdateDetailsDrawer from "@/components/daily-updates/UpdateDetailsDrawer";
import ManageTimeDrawer from "@/components/daily-updates/ManageTimeDrawer";
import DailyUpdateService from "@/services/dailyUpdateService";
import { ProjectService } from "@/services/projectService";
import { DailyStatusUpdate } from "@/types/dailyUpdate";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";
import { useActivitySource } from "@/hooks/useActivitySource";
import TransactionHistoryDrawer from "@/components/common/TransactionHistoryDrawer";

const { Title, Text } = Typography;

type ViewMode = "card" | "list";

export default function ViewDailyUpdatesPage() {
  useActivitySource({ section: "WORK", module: "DailyUpdates", page: "DailyUpdatesView" });
  const { user, isLoading: authLoading } = useAuth();
  const { canReadDailyUpdate } = usePermission();
  const router = useRouter();

  // Route guard
  useEffect(() => {
    if (!authLoading && !canReadDailyUpdate) {
      router.push('/dashboard');
    }
  }, [authLoading, canReadDailyUpdate, router]);

  // Loading state
  if (authLoading) {
    return (
      <MainLayout>
        <div style={{ padding: 24, textAlign: 'center' }}>
          <Spin size="large" tip="Loading">
            <div style={{ padding: 100, textAlign: 'center' }}>
              <div style={{ padding: 20 }} />
            </div>
          </Spin>
        </div>
      </MainLayout>
    );
  }

  // Permission check
  if (!canReadDailyUpdate) {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <MainLayout noPadding>
      <ViewDailyUpdatesContent user={user} />
    </MainLayout>
  );
}

function ViewDailyUpdatesContent({ user }: { user: any }) {
  const router = useRouter();
  const { canCreateDailyUpdate, canUpdateDailyUpdate, canDeleteDailyUpdate, canManageDailyUpdateTime, canReadActivityLog, canReadDailyUpdate } = usePermission();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { message: messageApi } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [updates, setUpdates] = useState<DailyStatusUpdate[]>([]);
  const [counts, setCounts] = useState({ today: 0, week: 0, month: 0 });
  const [selectedUpdateType, setSelectedUpdateType] = useState<
    "BOD" | "EOD" | undefined
  >(undefined);

  const fetchCounts = async () => {
    try {
      const now = dayjs();
      
      const todayStart = now.startOf('day').format("YYYY-MM-DD");
      const todayEnd = now.endOf('day').format("YYYY-MM-DD");
      
      const weekStart = now.startOf('week').format("YYYY-MM-DD");
      const weekEnd = now.endOf('week').format("YYYY-MM-DD");
      
      const monthStart = now.startOf('month').format("YYYY-MM-DD");
      const monthEnd = now.endOf('month').format("YYYY-MM-DD");
      
      const baseFilters: any = {
        projectId: selectedProject,
        userId: selectedUser,
        updateType: selectedUpdateType,
      };

      const fetchFn = canViewTeam ? DailyUpdateService.getTeamUpdates : DailyUpdateService.getMyUpdates;

      const [todayRes, weekRes, monthRes] = await Promise.all([
        fetchFn({ ...baseFilters, startDate: todayStart, endDate: todayEnd }),
        fetchFn({ ...baseFilters, startDate: weekStart, endDate: weekEnd }),
        fetchFn({ ...baseFilters, startDate: monthStart, endDate: monthEnd })
      ]);

      setCounts({
        today: todayRes.length,
        week: weekRes.length,
        month: monthRes.length
      });
    } catch (error) {
      console.error("Failed to fetch counts:", error);
    }
  };

  // 🔹 Delete a daily update and remove it from the UI
  const handleDeleteUpdate = async (updateId: string) => {
    if (!canDeleteDailyUpdate) {
      messageApi.error("You don't have permission to delete updates");
      return;
    }
    try {
      console.log("updateId", updateId);
      await DailyUpdateService.deleteUpdate(updateId);

      // Remove the card from the UI
      setUpdates((prev) => prev.filter((u) => u.id !== updateId));
      fetchCounts();

      messageApi.success("Daily update deleted successfully");
    } catch (error: any) {
      messageApi.error(error.message || "Failed to delete update");
    }
  };

  const [projects, setProjects] = useState<
    Array<{ value: string; label: string }>
  >([]);


  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>([
    dayjs().subtract(1, "day"),
    dayjs(),
  ]);
  const [selectedProject, setSelectedProject] = useState<string | undefined>(
    undefined,
  );
  const [selectedUser, setSelectedUser] = useState<string | undefined>(
    undefined,
  );
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [selectedUpdate, setSelectedUpdate] =
    useState<DailyStatusUpdate | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [manageTimeOpen, setManageTimeOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [cardPage, setCardPage] = useState(1);
  const [cardPageSize, setCardPageSize] = useState(20);
  
  useEffect(() => {
    setCardPage(1);
  }, [updates]);

  const totalCards = updates.length;
  const pageCount = Math.ceil(totalCards / cardPageSize);
  const pageStart = totalCards === 0 ? 0 : (cardPage - 1) * cardPageSize + 1;
  const pageEnd = Math.min(cardPage * cardPageSize, totalCards);
  const currentCardUpdates = updates.slice((cardPage - 1) * cardPageSize, cardPage * cardPageSize);
  const canViewTeam = canReadDailyUpdate;
  useEffect(() => {
    fetchProjects();
    fetchUpdates();
  }, [dateRange, selectedProject, selectedUser, selectedUpdateType]);

  useEffect(() => {
    fetchCounts();
  }, [canViewTeam, selectedProject, selectedUser, selectedUpdateType]);



  const fetchProjects = async () => {
    try {
      const projectsData = await ProjectService.getUserProjects();
      setProjects(projectsData);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  };

  const fetchUpdates = async () => {
    try {
      setLoading(true);

      let filters: any = {
        projectId: selectedProject,
        userId: selectedUser,
        updateType: selectedUpdateType,
      };

      // Use date range if available
      if (dateRange && dateRange[0] && dateRange[1]) {
        filters.startDate = dateRange[0].format("YYYY-MM-DD");
        filters.endDate = dateRange[1].format("YYYY-MM-DD");
      }
      console.log("TEAM?", canViewTeam, "Filters:", filters);

      if (canViewTeam) {
        const teamUpdates = await DailyUpdateService.getTeamUpdates(filters);
        setUpdates(teamUpdates);
      } else {
        const myUpdates = await DailyUpdateService.getMyUpdates(filters);
        setUpdates(myUpdates);
      }
    } catch (error) {
      console.error("Failed to fetch updates:", error);
      messageApi.error("Failed to load daily updates");
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (
    dates: [Dayjs | null, Dayjs | null] | null,
  ) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]]);
    } else {
      setDateRange(null);
    }
  };

  const isPresetActive = (preset: 'today' | 'week' | 'month') => {
    if (!dateRange) return false;
    const [start, end] = dateRange;
    const now = dayjs();
    if (preset === 'today') return start.isSame(now, 'day') && end.isSame(now, 'day');
    if (preset === 'week') return start.isSame(now.startOf('week'), 'day') && end.isSame(now.endOf('week'), 'day');
    if (preset === 'month') return start.isSame(now.startOf('month'), 'day') && end.isSame(now.endOf('month'), 'day');
    return false;
  };

  const handlePresetClick = (preset: 'today' | 'week' | 'month') => {
    const now = dayjs();
    if (preset === 'today') setDateRange([now.startOf('day'), now.endOf('day')]);
    if (preset === 'week') setDateRange([now.startOf('week'), now.endOf('week')]);
    if (preset === 'month') setDateRange([now.startOf('month'), now.endOf('month')]);
  };

  const handleRefresh = () => {
    fetchUpdates();
    fetchCounts();
  };

  const handleSubmitNew = () => {
    router.push("/daily-updates/submit");
  };

  const handleViewDetails = (update: DailyStatusUpdate) => {
    setSelectedUpdate(update);
    setDetailsModalOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsModalOpen(false);
    setSelectedUpdate(null);
  };

  const uniqueUsers = Array.from(
    new Set(updates.map((update) => update.user?.name).filter(Boolean)),
  ).map((name) => {
    const update = updates.find((u) => u.user?.name === name);
    return {
      label: name as string,
      value: update?.userId as string,
      badge: (
        <Avatar
          src={update?.user?.avatarUrl || undefined}
          size={20}
          style={{
            background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
            fontSize: 9,
            fontWeight: 800,
          }}
        >
          {((name as string) || "?").charAt(0).toUpperCase()}
        </Avatar>
      )
    };
  });

  return (
    <div className="du-shell">
      <style dangerouslySetInnerHTML={{
        __html: `
        /* Shell and Sidebar styles ported from documenthub */
        .du-shell {
          margin: 0;
          display: flex;
          align-items: stretch;
          min-height: calc(100vh - 54px);
          background: var(--bg-pure-white);
          overflow: hidden;
        }

        .du-sidebar {
          position: sticky;
          top: 0;
          align-self: flex-start;
          height: calc(100vh - 54px);
          width: 240px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          background: var(--bg-secondary);
          border-right: 1px solid var(--border-slate-200);
        }

        .du-sidebar-top {
          padding: 14px 14px 12px 18px;
          border-bottom: 1px solid var(--border-slate-200);
        }

        .du-sidebar-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }

        .du-hero-icon-box {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(22, 119, 255, 0.1);
        }

        .du-sidebar-title {
          margin: 0;
          font-size: 15px;
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1.1;
          color: var(--text-slate-900);
        }

        .du-sidebar-subtitle {
          margin: 2px 0 0 0;
          font-size: 11px;
          font-weight: 500;
          color: var(--text-slate-500);
        }

        .du-side-create {
          height: 36px !important;
          border-radius: 6px !important;
          font-weight: 600 !important;
          background: #3B82F6 !important;
          border: none !important;
          transition: background 0.2s ease !important;
        }
        .du-side-create:hover {
          background: #2563EB !important;
        }

        .du-sidebar-scroll {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 10px 10px 6px 16px;
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }

        .du-sidebar-scroll::-webkit-scrollbar { 
          width: 0px !important; 
          height: 0px !important; 
          display: none !important; 
          background: transparent !important;
        }

        .du-side-group { margin-bottom: 13px; }

        .du-side-label {
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

        .du-side-view {
          display: flex;
          align-items: center;
          gap: 9px;
          width: 100%;
          height: 32px;
          padding: 0 10px;
          border: none;
          background: transparent;
          border-radius: 9px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-slate-600);
          transition: background 0.15s, color 0.15s;
        }

        .du-side-view:hover { background: var(--bg-slate-100); color: var(--text-slate-900); }
        .du-side-view.active {
          color: var(--text-slate-900);
          font-weight: 600;
        }

        .du-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          height: calc(100vh - 54px);
          overflow: hidden;
        }

        .du-main-header {
          position: sticky;
          top: 0;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          height: 52px;
          border-bottom: 1px solid var(--border-slate-200);
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        [data-theme='dark'] .du-main-header {
          background: rgba(15, 23, 42, 0.85);
        }

        .du-main-scroll {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 0 24px 0 24px;
          display: flex;
          flex-direction: column;
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        .du-main-scroll::-webkit-scrollbar { 
          width: 0px !important; 
          height: 0px !important; 
          display: none !important; 
          background: transparent !important;
        }

        .premium-update-card:hover { 
          box-shadow: 0 3px 12px rgba(15,23,42,0.06) !important; 
          border-color: #cbd5e1 !important; 
        }

        .updates-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-bottom: 24px;
        }
        
        @media (max-width: 820px) {
          .updates-grid {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-bottom: 24px;
          }
          .updates-grid > * {
            flex: 1 1 auto;
            width: 100%;
          }
        }

        .du-sidebar-backdrop { display: none; }
        .mobile-menu-btn { display: none !important; }

        @media (max-width: 991px) {
          .du-sidebar { width: 228px; }
        }

        @media (max-width: 820px) {
          .btn-text-mobile-hide { display: none; }
          .du-main-header { padding: 12px 16px !important; }
          .du-main-scroll { padding: 0 16px 0 16px !important; }
          .du-footer--sticky { margin-left: -16px !important; margin-right: -16px !important; padding: 12px 16px !important; }
          .mobile-menu-btn { display: inline-flex !important; align-items: center; justify-content: center; color: var(--text-slate-700); }
          .du-sidebar {
            position: fixed;
            top: 0;
            left: -320px;
            height: 100vh;
            width: 280px;
            z-index: 1000;
            transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            background: var(--bg-pure-white);
            border-right: 1px solid var(--border-slate-200);
            box-shadow: 4px 0 24px rgba(0,0,0,0.08);
          }
          .du-sidebar.is-mobile-open { left: 0; }
          
          .du-sidebar-backdrop {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.4);
            backdrop-filter: blur(2px);
            z-index: 999;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s;
          }
          .du-sidebar-backdrop.is-open { opacity: 1; pointer-events: auto; }
        }

        .du-footer--sticky {
          position: sticky; bottom: 0; z-index: 30; 
          margin-top: auto; margin-right: -24px; margin-bottom: 0; margin-left: -24px;
          padding: 12px 24px;
          background: var(--bg-pure-white);
          box-shadow: 0 -4px 14px rgba(15,23,42,0.05);
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
          border-top: 1px solid var(--border-slate-200);
        }
        .du-footer-info { font-size: 12px; color: var(--text-slate-500); }
        .du-footer-info strong { color: var(--text-slate-700); font-weight: 700; }
        .du-pager { display: flex; align-items: center; gap: 3px; }
        .du-pager-btn, .du-pager-num {
          min-width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white); color: var(--text-slate-600); cursor: pointer; font-size: 12.5px; font-weight: 600;
        }
        .du-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .du-pager-num.is-active { background: #3B82F6; border-color: #3B82F6; color: #fff; }
        .du-pagesize { margin-left: 5px; }
        .du-pagesize .ant-select-selector { border-radius: 7px !important; height: 28px !important; }
        .du-side-group .sd-trigger { border-radius: 8px !important; }

        /* Dark-mode surfaces to match Proposal page */
        [data-theme="dark"] .du-shell { background: #0B0F1A; }
        [data-theme="dark"] .du-sidebar {
          background: #0B0F1A !important;
          border-right-color: #374151 !important;
        }
        [data-theme="dark"] .du-sidebar-top {
          border-bottom-color: #374151 !important;
        }
        [data-theme="dark"] .du-sidebar-title {
          color: #FFFFFF !important;
        }
        [data-theme="dark"] .du-sidebar-subtitle {
          color: #94A3B8 !important;
        }
        [data-theme="dark"] .du-side-label {
          color: #64748B !important;
        }
        [data-theme="dark"] .du-side-view {
          color: #94A3B8 !important;
        }
        [data-theme="dark"] .du-side-view:hover {
          background: #161B22 !important;
          color: #FFFFFF !important;
        }
        [data-theme="dark"] .du-sidebar-scroll {
          background: #0B0F1A !important;
        }
        [data-theme="dark"] .du-sidebar-scroll span {
          color: #94A3B8 !important;
        }
        [data-theme="dark"] .du-sidebar-scroll strong {
          color: #FFFFFF !important;
        }
        [data-theme="dark"] .du-main {
          background: #0B0F1A;
        }
        [data-theme="dark"] .du-main-header {
          background: #0B0F1A !important;
          border-bottom-color: #374151 !important;
        }
        [data-theme="dark"] .du-main-header span,
        [data-theme="dark"] .du-main-header label {
          color: #94A3B8 !important;
        }
        [data-theme="dark"] .du-main-header .dud-divider {
          background: #374151 !important;
        }
        
        /* Dropdown filters and pickers */
        [data-theme='dark'] .du-sidebar .ant-select-selector,
        [data-theme='dark'] .du-sidebar .ant-picker,
        [data-theme='dark'] .du-sidebar .sd-trigger,
        [data-theme='dark'] .du-main-header .ant-select-selector,
        [data-theme='dark'] .du-main-header .ant-picker,
        [data-theme='dark'] .du-main-header .sd-trigger {
          background: #0B0F1A !important;
          border-color: #374151 !important;
          color: #F1F5F9 !important;
        }
        [data-theme='dark'] .du-sidebar .ant-select-arrow,
        [data-theme='dark'] .du-sidebar .ant-picker-suffix,
        [data-theme='dark'] .du-main-header .ant-select-arrow,
        [data-theme='dark'] .du-main-header .ant-picker-suffix {
          color: #94A3B8 !important;
        }

        /* Pager & Sticky Footer */
        [data-theme='dark'] .du-footer--sticky {
          background: #0B0F1A !important;
          border-top-color: #374151 !important;
        }
        [data-theme='dark'] .du-footer-info {
          color: #94A3B8 !important;
        }
        [data-theme='dark'] .du-footer-info strong {
          color: #FFFFFF !important;
        }
        [data-theme='dark'] .du-pager-btn, [data-theme='dark'] .du-pager-num {
          background: rgba(255,255,255,0.03) !important;
          border-color: #374151 !important;
          color: #94A3B8 !important;
        }
        [data-theme='dark'] .du-pager-num.is-active {
          background: #3B82F6 !important;
          color: white !important;
          border-color: #3B82F6 !important;
        }
        
        /* UpdateCard overrides */
        [data-theme='dark'] .premium-update-card {
          background: #0B0F1A !important;
          border-color: #374151 !important;
        }
        [data-theme='dark'] .premium-update-card .ant-card-body > div:first-child {
          background: #0B0F1A !important;
        }
        [data-theme='dark'] .premium-update-card .ant-card-body > div:last-child {
          background: #161B22 !important;
          border-top-color: #374151 !important;
        }
        [data-theme='dark'] .premium-update-card .ant-card-body > div:last-child > div:last-child {
          border-top-color: #374151 !important;
        }
        [data-theme='dark'] .premium-update-card span {
          color: #94A3B8 !important;
        }
        [data-theme='dark'] .premium-update-card strong {
          color: #FFFFFF !important;
        }
        
        /* Stats Dashboard cards */
        [data-theme='dark'] .du-stats-card {
          background: #0B0F1A !important;
          border-color: #374151 !important;
        }
        [data-theme='dark'] .du-stats-card span {
          color: #94A3B8 !important;
        }
        [data-theme='dark'] .du-stats-card .text-\[26px\] {
          color: #FFFFFF !important;
        }

        /* Premium action dropdown (proposal style) */
        .du-action-pop .ant-dropdown-menu {
          padding: 6px !important; border-radius: 0px !important; min-width: 236px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-100) !important;
          box-shadow: 0 16px 40px rgba(15,23,42,0.18), 0 2px 8px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.03) !important;
        }
        .du-action-pop .ant-dropdown-menu::-webkit-scrollbar { display: none !important; }
        .du-action-pop,
        .du-action-pop * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
        .du-action-pop ::-webkit-scrollbar { display: none !important; }
        .du-action-pop .ant-dropdown-menu-item {
          padding: 0 !important; border-radius: 0px !important; margin: 1px 0 !important;
          transition: background .12s ease;
        }
        .du-action-pop .ant-dropdown-menu-item:hover { background: var(--bg-slate-50) !important; }
        .du-action-pop .ant-dropdown-menu-item-divider { margin: 5px 8px !important; background: var(--border-slate-100); }
        .du-action-pop .ant-dropdown-menu-title-content { line-height: 1.2; }
        .du-menu-item { display: flex; align-items: center; gap: 11px; padding: 7px 9px; }
        .du-menu-ic {
          width: 30px; height: 30px; border-radius: 0; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center; font-size: 14px;
        }
        .du-menu-text { display: flex; flex-direction: column; min-width: 0; }
        .du-menu-title { font-size: 13px; font-weight: 600; color: var(--text-slate-900); letter-spacing: -0.01em; }
        .du-menu-desc { font-size: 11px; color: var(--text-slate-400); margin-top: 1px; }
        .du-action-pop .ant-dropdown-menu-item-danger:hover { background: rgba(239,68,68,0.08) !important; }
        .du-action-pop .ant-dropdown-menu-item-danger .du-menu-title { color: #ef4444; }
        .du-action-pop .ant-dropdown-menu-item-disabled { opacity: 0.45; }
        .du-action-pop .ant-dropdown-menu-item-disabled:hover { background: transparent !important; }

        .du-icon-btn { color: var(--text-slate-400) !important; width: 26px !important; height: 26px !important; min-width: 26px !important; padding: 0 !important; }
        .du-icon-btn:hover { color: var(--text-slate-900) !important; background: var(--bg-slate-100) !important; }

        /* Dark theme overrides for du-action-pop */
        [data-theme='dark'] .du-action-pop .ant-dropdown-menu,
        [data-theme="dark"] .du-action-pop .ant-dropdown-menu {
          background-color: #0B0F1A !important;
          border-color: #1F2937 !important;
        }
        [data-theme='dark'] .du-action-pop .ant-dropdown-menu-item:hover,
        [data-theme="dark"] .du-action-pop .ant-dropdown-menu-item:hover {
          background: #161B22 !important;
        }
        [data-theme='dark'] .du-action-pop .du-menu-title,
        [data-theme="dark"] .du-action-pop .du-menu-title {
          color: #FFFFFF !important;
        }
        [data-theme='dark'] .du-action-pop .du-menu-desc,
        [data-theme="dark"] .du-action-pop .du-menu-desc {
          color: #94A3B8 !important;
        }
        [data-theme='dark'] .du-action-pop .ant-dropdown-menu-item-divider,
        [data-theme="dark"] .du-action-pop .ant-dropdown-menu-item-divider {
          background: #1F2937 !important;
        }
        [data-theme='dark'] .du-action-pop .ant-dropdown-menu-item-danger:hover,
        [data-theme="dark"] .du-action-pop .ant-dropdown-menu-item-danger:hover {
          background: rgba(239, 68, 68, 0.15) !important;
        }
        [data-theme='dark'] .du-icon-btn:hover {
          color: #FFFFFF !important;
          background: #161B22 !important;
        }
        `
      }} />

      {/* Mobile drawer backdrop */}
      <div
        className={`du-sidebar-backdrop ${mobileSidebarOpen ? 'is-open' : ''}`}
        onClick={() => setMobileSidebarOpen(false)}
        aria-hidden
      />

      <aside className={`du-sidebar ${mobileSidebarOpen ? 'is-mobile-open' : ''}`}>
        <div className="du-sidebar-top">
          <div className="du-sidebar-brand">
            <div className="du-hero-icon-box">
              <FileText size={16} color={isDark ? '#ffffff' : '#1677ff'} />
            </div>
            <div className="min-w-0">
              <h1 className="du-sidebar-title">Daily Updates</h1>
              <p className="du-sidebar-subtitle">{canViewTeam ? "Team Overview" : "Personal Log"}</p>
            </div>
          </div>

          {canManageDailyUpdateTime && (
            <Button type="primary" icon={<Clock size={16} />} className="du-side-create" onClick={() => setManageTimeOpen(true)} block>
              Manage Time
            </Button>
          )}
        </div>

        <div className="du-sidebar-scroll">
          <div className="du-side-group">
            <div className="du-side-label">Views</div>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => handlePresetClick('today')}
                className="flex items-center gap-2 w-full text-left px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors hover:bg-slate-100"
                style={{
                  background: isPresetActive('today') ? "var(--bg-slate-100)" : "transparent",
                  color: isPresetActive('today') ? "var(--text-slate-900)" : "var(--text-slate-600)"
                }}
              >
                <CalendarIcon size={14} color="var(--text-slate-400)" />
                <span className="flex-1">Today</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-slate-400)" }}>{counts.today}</span>
              </button>
              <button
                onClick={() => handlePresetClick('week')}
                className="flex items-center gap-2 w-full text-left px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors hover:bg-slate-100"
                style={{
                  background: isPresetActive('week') ? "var(--bg-slate-100)" : "transparent",
                  color: isPresetActive('week') ? "var(--text-slate-900)" : "var(--text-slate-600)"
                }}
              >
                <CalendarIcon size={14} color="var(--text-slate-400)" />
                <span className="flex-1">This Week</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-slate-400)" }}>{counts.week}</span>
              </button>
              <button
                onClick={() => handlePresetClick('month')}
                className="flex items-center gap-2 w-full text-left px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors hover:bg-slate-100"
                style={{
                  background: isPresetActive('month') ? "var(--bg-slate-100)" : "transparent",
                  color: isPresetActive('month') ? "var(--text-slate-900)" : "var(--text-slate-600)"
                }}
              >
                <CalendarIcon size={14} color="var(--text-slate-400)" />
                <span className="flex-1">This Month</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-slate-400)" }}>{counts.month}</span>
              </button>
            </div>
          </div>

          {canViewTeam && (
            <div className="du-side-group">
              <div className="du-side-label">Filters</div>
              <div className="flex flex-col gap-2">
                <>
                  <SearchableDropdown
                    placeholder="Project"
                    style={{ width: "100%" }}
                    value={selectedProject || undefined}
                    onChange={setSelectedProject}
                    options={projects as any[]}
                    itemNoun="projects"
                    allowClear
                  />
                  <SearchableDropdown
                    placeholder="Team Member"
                    style={{ width: "100%" }}
                    value={selectedUser || undefined}
                    onChange={setSelectedUser}
                    options={uniqueUsers as any[]}
                    itemNoun="users"
                    allowClear
                  />
                  <SearchableDropdown
                    placeholder="Type"
                    style={{ width: "100%" }}
                    value={selectedUpdateType || undefined}
                    onChange={setSelectedUpdateType}
                    options={[
                      { label: "BOD", value: "BOD" },
                      { label: "EOD", value: "EOD" },
                    ]}
                    itemNoun="types"
                    allowClear
                  />
                </>
              </div>
            </div>
          )}
        </div>
      </aside>

      <main className="du-main">
        <header className="du-main-header" style={{ height: 'auto', minHeight: 52, flexWrap: 'wrap', gap: '12px 16px' }}>
          <div className="flex items-center gap-4 flex-wrap" style={{ flex: '1 1 280px' }}>
            <div className="flex items-center gap-3">
              <Button
                type="text"
                icon={<Menu size={18} />}
                className="mobile-menu-btn"
                onClick={() => setMobileSidebarOpen(true)}
                style={{ padding: '0 8px', marginLeft: -8 }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                <Text style={{ fontSize: 13, fontWeight: 600, color: "var(--text-slate-700)" }}>
                  {updates.length} {updates.length === 1 ? 'Update' : 'Updates'}
                </Text>
              </div>
            </div>

            <div style={{ width: 1, height: 16, background: "var(--border-slate-200)" }} className="hidden sm:block" />

            <DatePicker.RangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              style={{ width: '100%', maxWidth: 270, borderRadius: 6, height: 30 }}
              format="YYYY-MM-DD"
              placeholder={["Start Date", "End Date"]}
            />
            {canReadActivityLog && (
              <Button
                icon={<History size={14} />}
                onClick={() => setHistoryOpen(true)}
                size="small"
                style={{ height: 30, width: 30, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}
              />
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            
            <div style={{
              display: "flex",
              alignItems: "center",
              background: "var(--bg-pure-white)",
              border: "1px solid var(--border-slate-200)",
              borderRadius: 12,
              padding: 2,
              gap: 2
            }}>
              <button
                type="button"
                onClick={() => setViewMode('card')}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 36,
                  height: 28,
                  borderRadius: 10,
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  background: viewMode === 'card' ? "var(--bg-sky-50)" : "transparent",
                  color: viewMode === 'card' ? "#1677ff" : "var(--text-slate-400)"
                }}
              >
                <LayoutGrid size={14} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 36,
                  height: 28,
                  borderRadius: 10,
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  background: viewMode === 'list' ? "var(--bg-sky-50)" : "transparent",
                  color: viewMode === 'list' ? "#1677ff" : "var(--text-slate-400)"
                }}
              >
                <ListIcon size={14} />
              </button>
            </div>

            <Button
              icon={<RefreshCw size={16} />}
              onClick={handleRefresh}
              loading={loading}
              style={{
                width: 34,
                height: 34,
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--bg-pure-white)",
                border: "1px solid var(--border-slate-200)",
                borderRadius: 12,
                color: "var(--text-slate-600)",
                boxShadow: "none"
              }}
            />
          </div>
        </header>

        <div className="px-6 pt-4">
          <DailyUpdatesDashboard updates={updates} isLoading={loading} />
        </div>

        <div className="du-main-scroll">
          <div style={{ display: "flex", flexDirection: "column", flex: 1, width: "100%", maxWidth: 1400, margin: "0 auto" }}>
            {/* Content Loading/Empty States */}
            {loading ? (
              <div style={{ padding: "100px 0", textAlign: "center" }}>
                <Spin size="large" />
                <div style={{ marginTop: 16, color: "var(--text-slate-400)", fontWeight: 500 }}>Fetching status updates...</div>
              </div>
            ) : updates.length === 0 ? (
              <Card style={{ borderRadius: 16, border: "1px solid var(--border-slate-200)", background: "var(--bg-pure-white)", textAlign: "center", padding: "60px 0" }}>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <Space direction="vertical" size={2}>
                      <Text strong style={{ color: "var(--text-slate-700)", fontSize: 15 }}>No updates found</Text>
                      <Text style={{ color: "var(--text-slate-400)" }}>Try adjusting your filters or date range</Text>
                    </Space>
                  }
                >
                  {canCreateDailyUpdate && (
                    <Button type="primary" onClick={handleSubmitNew} style={{ borderRadius: 8, marginTop: 8 }}>
                      Submit First Update
                    </Button>
                  )}
                </Empty>
              </Card>
            ) : viewMode === "card" ? (
              <>
                <div className="updates-grid">
                  {currentCardUpdates.map((update) => (
                    <UpdateCard
                      key={update.id}
                      update={update}
                      onOpen={() => handleViewDetails(update)}
                      onDelete={handleRefresh}
                    />
                  ))}
                </div>
                {totalCards > 0 && (
                  <div className="du-footer--sticky" style={{ marginTop: "auto" }}>
                    <div className="du-footer-info">
                      Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{totalCards}</strong>
                    </div>
                    <div className="du-pager">
                      <button type="button" className="du-pager-btn" disabled={cardPage <= 1} onClick={() => setCardPage((p) => Math.max(1, p - 1))}>‹</button>
                      {Array.from({ length: pageCount }, (_, i) => i + 1).slice(Math.max(0, cardPage - 3), Math.max(0, cardPage - 3) + 5).map((p) => (
                        <button key={p} type="button" className={`du-pager-num ${p === cardPage ? 'is-active' : ''}`} onClick={() => setCardPage(p)}>{p}</button>
                      ))}
                      <button type="button" className="du-pager-btn" disabled={cardPage >= pageCount} onClick={() => setCardPage((p) => Math.min(pageCount, p + 1))}>›</button>
                      <Select
                        className="du-pagesize"
                        value={cardPageSize}
                        onChange={(v) => { setCardPageSize(v); setCardPage(1); }}
                        options={[10, 20, 25, 50, 100].map((n) => ({ value: n, label: `${n} / page` }))}
                        popupMatchSelectWidth={120}
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <UpdateTable
                updates={updates}
                loading={false}
                onViewDetails={handleViewDetails}
                onDeleteUpdate={handleDeleteUpdate}
              />
            )}
          </div>
        </div>
      </main>

      <UpdateDetailsDrawer
        update={selectedUpdate}
        open={detailsModalOpen}
        onClose={handleCloseDetails}
      />
      <ManageTimeDrawer
        open={manageTimeOpen}
        onClose={() => setManageTimeOpen(false)}
        onSuccess={handleRefresh}
      />
      <TransactionHistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        module="DailyUpdates"
      />
    </div>
  );
}
