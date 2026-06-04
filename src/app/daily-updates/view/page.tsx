"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
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
} from "antd";
import {
  PlusCircleOutlined,
  ReloadOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  FilterOutlined,
  CalendarOutlined,
  SearchOutlined,
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
  History
} from "lucide-react";
import dayjs, { Dayjs } from "dayjs";
import MainLayout from "@/components/layout/MainLayout";
import UpdateCard from "@/components/daily-updates/UpdateCard";
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
    <MainLayout>
      <ViewDailyUpdatesContent user={user} />
    </MainLayout>
  );
}

function ViewDailyUpdatesContent({ user }: { user: any }) {
  const router = useRouter();
  const { canCreateDailyUpdate, canUpdateDailyUpdate, canDeleteDailyUpdate, canManageDailyUpdateTime, canReadActivityLog } = usePermission();

  const { message: messageApi } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [updates, setUpdates] = useState<DailyStatusUpdate[]>([]);
  const [selectedUpdateType, setSelectedUpdateType] = useState<
    "BOD" | "EOD" | undefined
  >(undefined);

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

  const canViewTeam = canManageDailyUpdateTime || user?.position === "Project Manager";

  useEffect(() => {
    fetchProjects();
    fetchUpdates();
  }, [dateRange, selectedProject, selectedUser, selectedUpdateType]);

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

  const handleRefresh = () => {
    fetchUpdates();
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
    };
  });

  return (
    <div
      style={{
        margin: "0 -24px",
        height: "calc(100vh - 72px)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        backgroundColor: "var(--bg-pure-white)"
      }}
    >

      <style dangerouslySetInnerHTML={{
        __html: `
        .daily-view-scroll-area::-webkit-scrollbar {
          display: none;
        }
        .daily-view-scroll-area {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .premium-filter-card {
          border: 1px solid var(--border-slate-200) !important;
          border-radius: 12px !important;
          background: var(--bg-pure-white) !important;
          margin-bottom: 20px !important;
        }
        .updates-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 16px;
        }
        @keyframes dudPulseDot {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
      `}} />

      <TimeTrackingHeader
        style={{ 
          padding: '3px 32px', 
          borderBottom: '1px solid var(--border-slate-200)',
          marginBottom: 20
        }}
        icon={<FileText size={20} color="#8b5cf6" />}
        title="Daily Status Updates"
        subTitle={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Text style={{ fontSize: 12, color: "var(--text-slate-600)", fontWeight: 500 }}>
              {canViewTeam ? "Team Overview" : "Personal Log"}
            </Text>
          </div>
        }
        description="Review team updates and track daily work statuses."
        extra={
          <Space size="middle" align="center">
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 4 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "#10b981",
                  boxShadow: "0 0 0 0 rgba(16, 185, 129, 0.7)",
                  animation: "dudPulseDot 2s infinite"
                }}
              />
              <Text style={{ fontSize: 13, fontWeight: 600, color: "var(--text-slate-700)" }}>
                {updates.length} Updates found
              </Text>
            </div>
            {canViewTeam && (
              <Button
                icon={<Clock size={16} />}
                onClick={() => setManageTimeOpen(true)}
                style={{ 
                  borderRadius: 10, 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 8,
                  height: 38,
                  background: "var(--bg-sky-50)",
                  color: "var(--text-blue-700)",
                  border: "1px solid var(--border-blue-200)"
                }}
              >
                Manage Time
              </Button>
            )}
            <Button
              icon={<RefreshCw size={16} />}
              onClick={handleRefresh}
              loading={loading}
              style={{ height: 38, borderRadius: 10, display: "flex", alignItems: "center", gap: 8 }}
            >
              Refresh
            </Button>
            {canReadActivityLog && (
              <Button
                icon={<History size={16} />}
                onClick={() => setHistoryOpen(true)}
                style={{ height: 38, borderRadius: 10, display: "flex", alignItems: "center", gap: 8 }}
              >
                History
              </Button>
            )}
            {canCreateDailyUpdate && (
              <Button
                type="primary"
                icon={<Plus size={16} />}
                onClick={handleSubmitNew}
                style={{
                  height: 38,
                  padding: "0 20px",
                  borderRadius: 10,
                  fontWeight: 600,
                  background: '#1677ff',
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  border: 'none'
                }}
              >
                Submit Update
              </Button>
            )}
          </Space>
        }
      />

      {/* Internal Scroll Area */}
      <div className="daily-view-scroll-area" style={{
        flex: 1,
        overflowY: "auto",
        padding: "0 32px 32px"
      }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>

          {/* Compact Filters Card */}
          <Card className="premium-filter-card" bodyStyle={{ padding: "12px 20px" }}>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 240px" }}>
                <Text strong style={{ fontSize: 11, color: "var(--text-slate-400)", display: "block", marginBottom: 4, textTransform: "uppercase" }}>
                  Date Range
                </Text>
                <DatePicker.RangePicker
                  value={dateRange}
                  onChange={handleDateRangeChange}
                  style={{ width: "100%", borderRadius: 8 }}
                  format="YYYY-MM-DD"
                  placeholder={["Start Date", "End Date"]}
                />
              </div>

              {canViewTeam && (
                <>
                  <div style={{ flex: "1 1 200px" }}>
                    <Text strong style={{ fontSize: 11, color: "var(--text-slate-400)", display: "block", marginBottom: 4, textTransform: "uppercase" }}>
                      Project
                    </Text>
                    <Select
                      placeholder="All Projects"
                      style={{ width: "100%" }}
                      value={selectedProject}
                      onChange={setSelectedProject}
                      showSearch
                      allowClear
                      options={projects}
                      size="middle"
                      filterOption={(input, option) =>
                        String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                      }
                    />
                  </div>
                  <div style={{ flex: "1 1 200px" }}>
                    <Text strong style={{ fontSize: 11, color: "var(--text-slate-400)", display: "block", marginBottom: 4, textTransform: "uppercase" }}>
                      Team Member
                    </Text>
                    <Select
                      placeholder="All Users"
                      style={{ width: "100%" }}
                      value={selectedUser}
                      onChange={setSelectedUser}
                      showSearch
                      allowClear
                      options={uniqueUsers}
                      size="middle"
                      filterOption={(input, option) =>
                        String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                      }
                    />
                  </div>
                  <div style={{ flex: "1 1 120px" }}>
                    <Text strong style={{ fontSize: 11, color: "var(--text-slate-400)", display: "block", marginBottom: 4, textTransform: "uppercase" }}>
                      Type
                    </Text>
                    <Select
                      placeholder="All"
                      style={{ width: "100%" }}
                      value={selectedUpdateType}
                      onChange={setSelectedUpdateType}
                      allowClear
                      options={[
                        { label: "BOD", value: "BOD" },
                        { label: "EOD", value: "EOD" },
                      ]}
                      size="middle"
                    />
                  </div>
                </>
              )}

              <div style={{ borderLeft: "1px solid var(--border-slate-200)", paddingLeft: 16, display: "flex", flexDirection: "column", gap: 4 }}>
                <Text strong style={{ fontSize: 11, color: "var(--text-slate-400)", display: "block", textTransform: "uppercase" }}>
                  View
                </Text>
                <Segmented
                  value={viewMode}
                  onChange={(value) => setViewMode(value as ViewMode)}
                  options={[
                    {
                      label: (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 4px" }}>
                          <LayoutGrid size={14} />
                          <span>Cards</span>
                        </div>
                      ),
                      value: "card"
                    },
                    {
                      label: (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 4px" }}>
                          <ListIcon size={14} />
                          <span>List</span>
                        </div>
                      ),
                      value: "list"
                    },
                  ]}
                  style={{ borderRadius: 8, padding: 3 }}
                />
              </div>
            </div>
          </Card>

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
            <div className="updates-grid">
              {updates.map((update) => (
                <UpdateCard
                  key={update.id}
                  update={update}
                  onOpen={() => handleViewDetails(update)}
                  onDelete={handleRefresh}
                />
              ))}
            </div>
          ) : (
            <div style={{ background: "var(--bg-pure-white)", borderRadius: 16, border: "1px solid var(--border-slate-200)", overflow: "hidden" }}>
              <UpdateTable
                updates={updates}
                loading={false}
                onViewDetails={handleViewDetails}
                onDeleteUpdate={handleDeleteUpdate}
              />
            </div>
          )}

          {/* Extra Spacing Bottom */}
          <div style={{ height: 40 }} />
        </div>
      </div>

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
