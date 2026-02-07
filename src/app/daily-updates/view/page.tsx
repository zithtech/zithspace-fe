"use client";

import React, { useState, useEffect } from "react";
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
  notification,
  Segmented,
  Tag,
} from "antd";
import {
  PlusCircleOutlined,
  ReloadOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import dayjs, { Dayjs } from "dayjs";
import MainLayout from "@/components/layout/MainLayout";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import UpdateCard from "@/components/daily-updates/UpdateCard";
import UpdateTable from "@/components/daily-updates/UpdateTable";
import UpdateDetailsDrawer from "@/components/daily-updates/UpdateDetailsDrawer";
import DailyUpdateService from "@/services/dailyUpdateService";
import { ProjectService } from "@/services/projectService";
import { DailyStatusUpdate } from "@/types/dailyUpdate";
import { useAuth } from "@/context/AuthContext";

const { Title, Text } = Typography;

type ViewMode = "card" | "list";

export default function ViewDailyUpdatesPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <MainLayout>
        <LoadingSpinner message="Loading..." />
      </MainLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <MainLayout>
      <ViewDailyUpdatesContent />
    </MainLayout>
  );
}

function ViewDailyUpdatesContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [api, contextHolder] = notification.useNotification();
  const [loading, setLoading] = useState(true);
  const [updates, setUpdates] = useState<DailyStatusUpdate[]>([]);
  // 🔹 Delete a daily update and remove it from the UI
  const handleDeleteUpdate = async (updateId: string) => {
    try {
      console.log("updateId", updateId);
      await DailyUpdateService.deleteUpdate(updateId);

      // Remove the card from the UI
      setUpdates((prev) => prev.filter((u) => u.id !== updateId));

      api.success({
        message: "Deleted",
        description: "Daily update deleted successfully",
      });
    } catch (error: any) {
      api.error({
        message: "Error",
        description: error.message || "Failed to delete update",
      });
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

  const canViewTeam =
    user?.role === "super_admin" || user?.position === "Project Manager";

  useEffect(() => {
    fetchProjects();
    fetchUpdates();
  }, [dateRange, selectedProject, selectedUser]);

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
      };

      // Use date range if available
      if (dateRange && dateRange[0] && dateRange[1]) {
        filters.startDate = dateRange[0].format("YYYY-MM-DD");
        filters.endDate = dateRange[1].format("YYYY-MM-DD");
      }

      if (canViewTeam) {
        const teamUpdates = await DailyUpdateService.getTeamUpdates(filters);
        setUpdates(teamUpdates);
      } else {
        const myUpdates = await DailyUpdateService.getMyUpdates(filters);
        setUpdates(myUpdates);
      }
    } catch (error) {
      console.error("Failed to fetch updates:", error);
      api.error({
        message: "Error",
        description: "Failed to load daily updates",
        placement: "bottomRight",
        duration: 4,
      });
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
    <>
      {contextHolder}
      <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header */}
        <Row
          justify="space-between"
          align="middle"
          style={{ marginBottom: 24 }}
        >
          <Col>
            <Title
              level={3}
              style={{ margin: 0, fontSize: 24, fontWeight: 600 }}
            >
              Daily Status Updates
            </Title>
            <Text type="secondary" style={{ fontSize: 14 }}>
              {canViewTeam ? "Team Updates" : "My Updates"}
            </Text>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={loading}
              >
                Refresh
              </Button>
              <Button
                type="primary"
                icon={<PlusCircleOutlined />}
                onClick={handleSubmitNew}
              >
                Submit Update
              </Button>
            </Space>
          </Col>
        </Row>

        <Card
          style={{
            marginBottom: 20,
            boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
          }}
          // bodyStyle={{
          //   padding: "10px 12px", // 👈 left = right equal
          // }}
        >
          <Row
            gutter={[16, 16]}
            align="top"
            style={{ display: "flex", flexWrap: "wrap" }}
          >
            <Col flex="1 1 260px">
              <Space direction="vertical" style={{ width: "100%" }} size={4}>
                <Text strong style={{ fontSize: 13 }}>
                  Date Range
                </Text>
                <DatePicker.RangePicker
                  value={dateRange}
                  onChange={handleDateRangeChange}
                  style={{ width: "100%" }}
                  format="YYYY-MM-DD"
                  placeholder={["Start Date", "End Date"]}
                />
              </Space>
            </Col>

            {canViewTeam && (
              <>
                <Col flex="1 1 220px">
                  <Space
                    direction="vertical"
                    style={{ width: "100%" }}
                    size={4}
                  >
                    <Text strong style={{ fontSize: 13 }}>
                      Project
                    </Text>
                    <Select
                      placeholder="All Projects"
                      style={{ width: "100%" }}
                      value={selectedProject}
                      onChange={setSelectedProject}
                      allowClear
                      options={projects}
                    />
                  </Space>
                </Col>

                <Col flex="1 1 220px">
                  <Space
                    direction="vertical"
                    style={{ width: "100%" }}
                    size={4}
                  >
                    <Text strong style={{ fontSize: 13 }}>
                      User
                    </Text>
                    <Select
                      placeholder="All Users"
                      style={{ width: "100%" }}
                      value={selectedUser}
                      onChange={setSelectedUser}
                      allowClear
                      options={uniqueUsers}
                    />
                  </Space>
                </Col>
              </>
            )}
            {/* <div style={{ display: "flex", justifyContent: "flex-end" }}> */}
              <Col style={{marginLeft:"auto",flex:"0 0 200px" }}>
                <Space direction="vertical"  size={4}>
                  <Text strong style={{ fontSize: 13 }}>
                    View
                  </Text>
                  <Segmented
                    value={viewMode}
                    onChange={(value) => setViewMode(value as ViewMode)}
                    options={[
                      {
                        label: "Cards",
                        value: "card",
                        icon: <AppstoreOutlined />,
                      },
                      {
                        label: "List",
                        value: "list",
                        icon: <UnorderedListOutlined />,
                      },
                    ]}
                    style={{ width: "100%"}}
                  />
                </Space>
              </Col>
            {/* </div> */}
          </Row>
        </Card>

        {/* Content Area */}
        {loading ? (
          <Card>
            <div style={{ textAlign: "center", padding: 60 }}>
              <Spin size="large" />
              <div style={{ marginTop: 16 }}>
                <Text type="secondary">Loading updates...</Text>
              </div>
            </div>
          </Card>
        ) : updates.length === 0 ? (
          <Card>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <Text type="secondary" style={{ fontSize: 14 }}>
                    No updates found for this date
                  </Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {canViewTeam
                      ? "No team members have submitted updates yet"
                      : "You haven't submitted an update for this date"}
                  </Text>
                </div>
              }
            >
              <Button
                type="primary"
                onClick={handleSubmitNew}
                style={{ marginTop: 16 }}
              >
                Submit Update
              </Button>
            </Empty>
          </Card>
        ) : viewMode === "card" ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 16,
            }}
            className="updates-grid"
          >
            {updates.map((update) => (
              <UpdateCard
                key={update.id}
                update={update}
                onOpen={() => handleViewDetails(update)} // 🔓 drawer
                onDelete={handleRefresh} // 🔹 delete handler
              />
            ))}
          </div>
        ) : (
          <UpdateTable
            updates={updates}
            loading={false}
            onViewDetails={handleViewDetails}
          />
        )}

        {/* Details Drawer */}
        <UpdateDetailsDrawer
          update={selectedUpdate}
          open={detailsModalOpen}
          onClose={handleCloseDetails}
        />
      </div>
    </>
  );
}
