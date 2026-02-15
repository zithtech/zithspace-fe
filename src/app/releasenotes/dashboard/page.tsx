
"use client";

import MainLayout from "@/components/layout/MainLayout";
import {
  Space,
  Typography,
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  List,
  Avatar,
  Tag,
  Button,
  Tooltip,
  Empty,
  Spin,
  Dropdown,
  Segmented,
  Select,
  Badge,
  theme,
  Flex,
} from "antd";
const { Title, Text } = Typography;
const { useToken } = theme;
import {
  RocketOutlined,
  FileTextOutlined,
  BugOutlined,
  ApiOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CalendarOutlined,
  ProjectOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  TeamOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  MoreOutlined,
  DownloadOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  BranchesOutlined,
  TagOutlined,
  UserOutlined,
  ClockCircleOutlined,
  GithubOutlined,
  PullRequestOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useReleaseNotes } from "@/hooks/usereleasenotes";
import { ProjectService } from "@/services/projectService";
import dayjs from "dayjs";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

export default function Dashboard() {
  const { token } = useToken();
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("month");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  // Fetch all release notes (without project filter for overall stats)
  const { data: allReleases, isLoading: releasesLoading } = useReleaseNotes({
    limit: 1000,
    sortBy: "releaseDate",
    sortOrder: "desc",
  });

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await ProjectService.getProjects();
        setProjects(response.data || []);
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  // Calculate statistics from release data
  useEffect(() => {
    if (!allReleases?.data) return;

    const releases = allReleases.data;

    // Filter by project if selected
    const filteredReleases =
      selectedProject === "all"
        ? releases
        : releases.filter((r: any) => r.projectId === selectedProject);

    // Calculate metrics
    const totalReleases = filteredReleases.length;
    const releasedCount = filteredReleases.filter(
      (r: any) => r.status === "RELEASED",
    ).length;
    const draftCount = filteredReleases.filter(
      (r: any) => r.status === "DRAFT",
    ).length;

    // Environment distribution
    const prodReleases = filteredReleases.filter(
      (r: any) => r.environment === "PROD",
    ).length;
    const qaReleases = filteredReleases.filter(
      (r: any) => r.environment === "QA",
    ).length;
    const devReleases = filteredReleases.filter(
      (r: any) => r.environment === "DEV",
    ).length;

    // Release frequency by month
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = dayjs().subtract(i, "month");
      return d.format("MMM YYYY");
    }).reverse();

    const releasesByMonth = last6Months.map((month) => {
      const count = filteredReleases.filter(
        (r: any) => dayjs(r.releaseDate).format("MMM YYYY") === month,
      ).length;
      return { month, count };
    });

    // Version distribution
    const versionCounts = filteredReleases.reduce(
      (acc: any, r: any) => {
        const major = r.version?.split(".")[0] || "unknown";
        acc[major] = (acc[major] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const versionData = Object.entries(versionCounts).map(
      ([version, count]) => ({
        version,
        count,
      }),
    );

    // Visibility distribution
    const visibilityCounts = filteredReleases.reduce(
      (acc: any, r: any) => {
        r.visibility?.forEach((v: string) => {
          acc[v] = (acc[v] || 0) + 1;
        });
        return acc;
      },
      {} as Record<string, number>,
    );

    const visibilityData = Object.entries(visibilityCounts).map(
      ([type, count]) => ({
        type,
        count,
      }),
    );

    // Linked items stats
    const totalTickets = filteredReleases.reduce(
      (acc: number, r: any) => acc + (r.linkedTickets?.length || 0),
      0,
    );
    const totalPRs = filteredReleases.reduce(
      (acc: number, r: any) => acc + (r.pullRequests?.length || 0),
      0,
    );
    const totalRepos = filteredReleases.reduce(
      (acc: number, r: any) => acc + (r.repositories?.length || 0),
      0,
    );

    // Content stats
    const releasesWithSummary = filteredReleases.filter(
      (r: any) => r.summary && Object.keys(r.summary).length > 0,
    ).length;
    const releasesWithFeatures = filteredReleases.filter(
      (r: any) => r.newFeatures && Object.keys(r.newFeatures).length > 0,
    ).length;
    const releasesWithBugFixes = filteredReleases.filter(
      (r: any) => r.bugFixes && Object.keys(r.bugFixes).length > 0,
    ).length;
    const releasesWithBreaking = filteredReleases.filter(
      (r: any) =>
        r.breakingChanges && Object.keys(r.breakingChanges).length > 0,
    ).length;

    // Recent releases
    const recentReleases = [...filteredReleases]
      .sort(
        (a: any, b: any) =>
          dayjs(b.releaseDate).unix() - dayjs(a.releaseDate).unix(),
      )
      .slice(0, 5);

    // Project distribution (for all projects view)
    const projectStats = projects
      .map((p) => {
        const count = releases.filter((r: any) => r.projectId === p.id).length;
        return { name: p.name, count };
      })
      .filter((p) => p.count > 0);

    setStats({
      totalReleases,
      releasedCount,
      draftCount,
      releaseRate: totalReleases
        ? ((releasedCount / totalReleases) * 100).toFixed(1)
        : 0,
      prodReleases,
      qaReleases,
      devReleases,
      releasesByMonth,
      versionData,
      visibilityData,
      totalTickets,
      totalPRs,
      totalRepos,
      releasesWithSummary,
      releasesWithFeatures,
      releasesWithBugFixes,
      releasesWithBreaking,
      recentReleases,
      projectStats,
      completionRate: totalReleases ? (releasedCount / totalReleases) * 100 : 0,
      avgReleasesPerMonth:
        releasesByMonth.reduce((acc: number, m: any) => acc + m.count, 0) / 6,
    });
  }, [allReleases, selectedProject, projects]);

  // Colors for charts
  const COLORS = [
    "#1890ff",
    "#52c41a",
    "#722ed1",
    "#faad14",
    "#ff4d4f",
    "#13c2c2",
  ];
  const STATUS_COLORS: Record<string, string> = {
    RELEASED: "#52c41a",
    DRAFT: "#faad14",
  };
  const ENV_COLORS: Record<string, string> = {
    PROD: "#ff4d4f",
    QA: "#fa8c16",
    DEV: "#1890ff",
  };

  if (loading || releasesLoading) {
    return (
      <MainLayout>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "80vh",
          }}
        >
          <Spin size="large" tip="Loading dashboard..." />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Header Section - Made more compact */}
      <div
        style={{
          padding: "12px 20px",
          background: "white",
          borderRadius: "16px",
          marginBottom: 20,
          marginTop: 10,
          marginLeft: 30,
          marginRight: 30,
          color: "black",
          boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
        }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col flex="auto">
            <Space direction="vertical" size={2}>
              <Space align="center" size={8}>
                <BarChartOutlined style={{ fontSize: 28, color: "black" }} />
                <Title
                  level={3}
                  style={{ margin: 0, color: "black", fontWeight: 600 }}
                >
                  Analytics Dashboard
                </Title>
              </Space>
              <Text style={{ color: "black", fontSize: 14,marginLeft:"35px"}}>
                Release insights and metrics
              </Text>
            </Space>
          </Col>
          <Col>
            <Space size={8}>
              <Select
                value={selectedProject}
                onChange={setSelectedProject}
                style={{ width: 160 }}
                dropdownStyle={{ background: "white" }}
                options={[
                  { value: "all", label: "All Projects" },
                  ...projects.map((p) => ({ value: p.id, label: p.name })),
                ]}
                size="small"
              />
              <Segmented
                value={timeRange}
                onChange={setTimeRange}
                options={[
                  { value: "week", label: "Week" },
                  { value: "month", label: "Month" },
                  { value: "quarter", label: "Quarter" },
                  { value: "year", label: "Year" },
                ]}
                size="small"
                style={{ background: "rgba(255,255,255,0.2)" }}
              />
              <Button
                icon={<ReloadOutlined />}
                size="small"
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "none",
                  color: "white",
                }}
              />
              <Button
                icon={<DownloadOutlined />}
                size="small"
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "none",
                  color: "white",
                }}
              />
            </Space>
          </Col>
        </Row>
      </div>

      <div style={{ padding: "0 24px 24px" }}>
        {/* Key Metrics Cards - Reduced width and made more compact */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {/* Total Releases Card */}
          <Col xs={24} sm={12} lg={8}>
            <Card
              style={{
                borderRadius: 12,
                boxShadow:
                  "0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
                border: "1px solid #f0f0f0",
                background: "#ffffff",
                transition: "all 0.2s ease",
                cursor: "pointer",
                height: "100%",
              }}
              bodyStyle={{ padding: "16px" }}
              hoverable={false}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)";
              }}
            >
              <Flex vertical gap={8} style={{ height: "100%" }}>
                <Flex align="center" justify="space-between">
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: "#8c8c8c",
                    }}
                  >
                    Total Releases
                  </Text>
                  <div
                    style={{
                      background: "#f5f5f5",
                      borderRadius: 8,
                      width: 28,
                      height: 28,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FileTextOutlined
                      style={{ fontSize: 14, color: "#1890ff" }}
                    />
                  </div>
                </Flex>

                <Flex align="baseline" justify="space-between">
                  <Text
                    style={{ fontSize: 28, fontWeight: 600, lineHeight: 1.2 }}
                  >
                    {stats?.totalReleases || 0}
                  </Text>
                  <Text
                    style={{ fontSize: 12, color: "#52c41a", fontWeight: 500 }}
                  >
                    +12%
                  </Text>
                </Flex>

                <Flex gap={12} wrap="wrap">
                  <Text style={{ fontSize: 11, color: "#8c8c8c" }}>
                    Released:{" "}
                    <span style={{ color: "#52c41a", fontWeight: 600 }}>
                      {stats?.releasedCount || 0}
                    </span>
                  </Text>
                  <Text style={{ fontSize: 11, color: "#8c8c8c" }}>
                    Drafts:{" "}
                    <span style={{ color: "#faad14", fontWeight: 600 }}>
                      {stats?.draftCount || 0}
                    </span>
                  </Text>
                </Flex>
              </Flex>
            </Card>
          </Col>

          {/* Release Rate Card */}
          <Col xs={24} sm={12} lg={8}>
            <Card
              style={{
                borderRadius: 12,
                boxShadow:
                  "0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
                border: "1px solid #f0f0f0",
                background: "#ffffff",
                transition: "all 0.2s ease",
                cursor: "pointer",
                height: "100%",
              }}
              bodyStyle={{ padding: "16px" }}
              hoverable={false}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)";
              }}
            >
              <Flex vertical gap={8} style={{ height: "100%" }}>
                <Flex align="center" justify="space-between">
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: "#8c8c8c",
                    }}
                  >
                    Release Rate
                  </Text>
                  <div
                    style={{
                      background: "#f5f5f5",
                      borderRadius: 8,
                      width: 28,
                      height: 28,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <RocketOutlined
                      style={{ fontSize: 14, color: "#52c41a" }}
                    />
                  </div>
                </Flex>

                <Flex align="baseline" justify="space-between">
                  <Text
                    style={{ fontSize: 28, fontWeight: 600, lineHeight: 1.2 }}
                  >
                    {stats?.releaseRate || 0}%
                  </Text>
                  <Text
                    style={{ fontSize: 12, color: "#52c41a", fontWeight: 500 }}
                  >
                    +5%
                  </Text>
                </Flex>

                <Flex gap={8} align="center">
                  <Progress
                    percent={Number(stats?.releaseRate) || 0}
                    showInfo={false}
                    strokeColor="#52c41a"
                    trailColor="#f0f0f0"
                    size={["100%", 4]}
                    style={{ flex: 1 }}
                  />
                  <Text style={{ fontSize: 11, color: "#8c8c8c" }}>
                    {stats?.completionRate?.toFixed(1) || 0}%
                  </Text>
                </Flex>
              </Flex>
            </Card>
          </Col>

          {/* Linked Items Card */}
          <Col xs={24} sm={12} lg={8}>
            <Card
              style={{
                borderRadius: 12,
                boxShadow:
                  "0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
                border: "1px solid #f0f0f0",
                background: "#ffffff",
                transition: "all 0.2s ease",
                cursor: "pointer",
                height: "100%",
              }}
              bodyStyle={{ padding: "16px" }}
              hoverable={false}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)";
              }}
            >
              <Flex vertical gap={8} style={{ height: "100%" }}>
                <Flex align="center" justify="space-between">
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: "#8c8c8c",
                    }}
                  >
                    Linked Items
                  </Text>
                  <div
                    style={{
                      background: "#f5f5f5",
                      borderRadius: 8,
                      width: 28,
                      height: 28,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <LinkOutlined style={{ fontSize: 14, color: "#faad14" }} />
                  </div>
                </Flex>

                <Flex align="baseline" justify="space-between">
                  <Flex gap={16}>
                    <div>
                      <Text
                        style={{
                          fontSize: 20,
                          fontWeight: 600,
                          color: "#1890ff",
                        }}
                      >
                        {stats?.totalTickets || 0}
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          color: "#8c8c8c",
                          display: "block",
                        }}
                      >
                        Tickets
                      </Text>
                    </div>
                    <div>
                      <Text
                        style={{
                          fontSize: 20,
                          fontWeight: 600,
                          color: "#52c41a",
                        }}
                      >
                        {stats?.totalPRs || 0}
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          color: "#8c8c8c",
                          display: "block",
                        }}
                      >
                        PRs
                      </Text>
                    </div>
                    <div>
                      <Text
                        style={{
                          fontSize: 20,
                          fontWeight: 600,
                          color: "#722ed1",
                        }}
                      >
                        {stats?.totalRepos || 0}
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          color: "#8c8c8c",
                          display: "block",
                        }}
                      >
                        Repos
                      </Text>
                    </div>
                  </Flex>

                  <Badge
                    count={`${(((stats?.totalTickets || 0) / ((stats?.totalTickets || 0) + (stats?.totalPRs || 0) + (stats?.totalRepos || 0) || 1)) * 100).toFixed(0)}%`}
                    style={{ backgroundColor: "#faad14", fontSize: 10 }}
                    size="small"
                  />
                </Flex>
              </Flex>
            </Card>
          </Col>
        </Row>

        {/* Charts Row - Made more compact */}
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          <Col xs={24} lg={16}>
            <Card
              title={
                <Space size={4}>
                  <LineChartOutlined
                    style={{ color: token.colorPrimary, fontSize: 16 }}
                  />
                  <span style={{ fontWeight: 500, fontSize: 14 }}>
                    Release Frequency
                  </span>
                </Space>
              }
              extra={
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Last 6 months
                </Text>
              }
              style={{
                borderRadius: 12,
                boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                border: "1px solid #f0f0f0",
              }}
              headStyle={{ padding: "12px 16px", minHeight: 48 }}
              bodyStyle={{ padding: "16px" }}
              size="small"
            >
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.releasesByMonth || []}>
                    <defs>
                      <linearGradient
                        id="colorCount"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#1890ff"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#1890ff"
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                    <XAxis
                      dataKey="month"
                      stroke="#999"
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis stroke="#999" tick={{ fontSize: 11 }} />
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        fontSize: 12,
                        padding: "8px 12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#1890ff"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorCount)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <ClockCircleOutlined
                    style={{ marginRight: 4, fontSize: 11 }}
                  />
                  Avg: {stats?.avgReleasesPerMonth?.toFixed(1) || 0}/month
                </Text>
                <Button
                  type="link"
                  size="small"
                  onClick={() => router.push("/releasenotes")}
                  style={{ fontSize: 12 }}
                >
                  View →
                </Button>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card
              title={
                <Space size={4}>
                  <PieChartOutlined
                    style={{ color: token.colorPrimary, fontSize: 16 }}
                  />
                  <span style={{ fontWeight: 500, fontSize: 14 }}>
                    Version Distribution
                  </span>
                </Space>
              }
              style={{
                borderRadius: 12,
                boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                border: "1px solid #f0f0f0",
                height: "100%",
              }}
              headStyle={{ padding: "12px 16px", minHeight: 48 }}
              bodyStyle={{ padding: "16px" }}
              size="small"
            >
              <div style={{ height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats?.versionData || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      fill="#8884d8"
                      paddingAngle={4}
                      dataKey="count"
                      label={({ version, percent }) => `${version}`}
                      labelLine={false}
                      fontSize={10}
                    >
                      {(stats?.versionData || []).map(
                        (entry: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ),
                      )}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value: any) => [`${value} releases`, "Count"]}
                      contentStyle={{ fontSize: 12, padding: "4px 8px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 4,
                  justifyContent: "center",
                }}
              >
                {(stats?.versionData || []).map((item: any, index: number) => (
                  <Tag
                    key={item.version}
                    color={COLORS[index % COLORS.length]}
                    style={{ fontSize: 10, padding: "0 6px" }}
                  >
                    v{item.version}: {item.count}
                  </Tag>
                ))}
              </div>
            </Card>
          </Col>
        </Row>

        {/* Content Quality & Project Distribution - Made more compact */}
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space size={4}>
                  <CheckCircleOutlined
                    style={{ color: token.colorPrimary, fontSize: 16 }}
                  />
                  <span style={{ fontWeight: 500, fontSize: 14 }}>
                    Content Quality
                  </span>
                </Space>
              }
              extra={
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Coverage
                </Text>
              }
              style={{
                borderRadius: 12,
                boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                border: "1px solid #f0f0f0",
              }}
              headStyle={{ padding: "12px 16px", minHeight: 48 }}
              bodyStyle={{ padding: "16px" }}
              size="small"
            >
              <Row gutter={[8, 8]}>
                <Col span={12}>
                  <div
                    style={{
                      background: "#f8f9fa",
                      borderRadius: 8,
                      padding: "8px",
                    }}
                  >
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      Summary
                    </Text>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        justifyContent: "space-between",
                      }}
                    >
                      <Title level={4} style={{ margin: 0, fontSize: 18 }}>
                        {stats?.releasesWithSummary || 0}
                      </Title>
                      <Text type="secondary" style={{ fontSize: 10 }}>
                        / {stats?.totalReleases || 0}
                      </Text>
                    </div>
                    <Progress
                      percent={
                        stats?.totalReleases
                          ? (stats.releasesWithSummary / stats.totalReleases) *
                            100
                          : 0
                      }
                      size="small"
                      strokeColor="#1890ff"
                      showInfo={false}
                      style={{ marginTop: 4 }}
                    />
                  </div>
                </Col>
                <Col span={12}>
                  <div
                    style={{
                      background: "#f8f9fa",
                      borderRadius: 8,
                      padding: "8px",
                    }}
                  >
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      Features
                    </Text>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        justifyContent: "space-between",
                      }}
                    >
                      <Title level={4} style={{ margin: 0, fontSize: 18 }}>
                        {stats?.releasesWithFeatures || 0}
                      </Title>
                      <Text type="secondary" style={{ fontSize: 10 }}>
                        / {stats?.totalReleases || 0}
                      </Text>
                    </div>
                    <Progress
                      percent={
                        stats?.totalReleases
                          ? (stats.releasesWithFeatures / stats.totalReleases) *
                            100
                          : 0
                      }
                      size="small"
                      strokeColor="#52c41a"
                      showInfo={false}
                      style={{ marginTop: 4 }}
                    />
                  </div>
                </Col>
                <Col span={12}>
                  <div
                    style={{
                      background: "#f8f9fa",
                      borderRadius: 8,
                      padding: "8px",
                    }}
                  >
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      Bug Fixes
                    </Text>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        justifyContent: "space-between",
                      }}
                    >
                      <Title level={4} style={{ margin: 0, fontSize: 18 }}>
                        {stats?.releasesWithBugFixes || 0}
                      </Title>
                      <Text type="secondary" style={{ fontSize: 10 }}>
                        / {stats?.totalReleases || 0}
                      </Text>
                    </div>
                    <Progress
                      percent={
                        stats?.totalReleases
                          ? (stats.releasesWithBugFixes / stats.totalReleases) *
                            100
                          : 0
                      }
                      size="small"
                      strokeColor="#ff4d4f"
                      showInfo={false}
                      style={{ marginTop: 4 }}
                    />
                  </div>
                </Col>
                <Col span={12}>
                  <div
                    style={{
                      background: "#f8f9fa",
                      borderRadius: 8,
                      padding: "8px",
                    }}
                  >
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      Breaking
                    </Text>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        justifyContent: "space-between",
                      }}
                    >
                      <Title level={4} style={{ margin: 0, fontSize: 18 }}>
                        {stats?.releasesWithBreaking || 0}
                      </Title>
                      <Text type="secondary" style={{ fontSize: 10 }}>
                        / {stats?.totalReleases || 0}
                      </Text>
                    </div>
                    <Progress
                      percent={
                        stats?.totalReleases
                          ? (stats.releasesWithBreaking / stats.totalReleases) *
                            100
                          : 0
                      }
                      size="small"
                      strokeColor="#faad14"
                      showInfo={false}
                      style={{ marginTop: 4 }}
                    />
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <ProjectOutlined style={{ color: token.colorPrimary }} />
                  <span style={{ fontWeight: 600 }}>Project Distribution</span>
                </Space>
              }
              style={{
                borderRadius: 16,
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                border: "none",
              }}
            >
              <div style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.projectStats || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#999" />
                    <YAxis stroke="#999" />
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      }}
                    />
                    <Bar dataKey="count" fill="#1890ff" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Recent Releases & Visibility - Made more compact */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card
              title={
                <Space size={4}>
                  <RocketOutlined
                    style={{ color: token.colorPrimary, fontSize: 16 }}
                  />
                  <span style={{ fontWeight: 500, fontSize: 14 }}>
                    Recent Releases
                  </span>
                </Space>
              }
              extra={
                <Button
                  type="link"
                  size="small"
                  onClick={() => router.push("/releasenotes")}
                  style={{ fontSize: 12 }}
                >
                  View all
                </Button>
              }
              style={{
                borderRadius: 12,
                boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                border: "1px solid #f0f0f0",
              }}
              headStyle={{ padding: "12px 16px", minHeight: 48 }}
              bodyStyle={{ padding: "8px 16px" }}
              size="small"
            >
              <List
                size="small"
                itemLayout="horizontal"
                dataSource={stats?.recentReleases || []}
                renderItem={(release: any) => (
                  <List.Item
                    actions={[
                      <Tag
                        color={
                          STATUS_COLORS[
                            release.status as keyof typeof STATUS_COLORS
                          ]
                        }
                        style={{ fontSize: 10, padding: "0 6px" }}
                      >
                        {release.status}
                      </Tag>,
                    ]}
                    style={{ padding: "8px 0" }}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          size={28}
                          style={{
                            background:
                              ENV_COLORS[
                                release.environment as keyof typeof ENV_COLORS
                              ],
                          }}
                          icon={
                            <EnvironmentOutlined style={{ fontSize: 14 }} />
                          }
                        />
                      }
                      title={
                        <Space size={4} style={{ fontSize: 13 }}>
                          <span style={{ fontWeight: 500 }}>
                            {release.title}
                          </span>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            v{release.version}
                          </Text>
                        </Space>
                      }
                      description={
                        <Space
                          size={8}
                          split={
                            <Text type="secondary" style={{ fontSize: 10 }}>
                              •
                            </Text>
                          }
                        >
                          <Space size={2}>
                            <CalendarOutlined style={{ fontSize: 10 }} />
                            <Text type="secondary" style={{ fontSize: 10 }}>
                              {dayjs(release.releaseDate).format("MMM D")}
                            </Text>
                          </Space>
                          <Space size={2}>
                            <ProjectOutlined style={{ fontSize: 10 }} />
                            <Text type="secondary" style={{ fontSize: 10 }}>
                              {release.project?.name}
                            </Text>
                          </Space>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card
              title={
                <Space>
                  <EyeOutlined style={{ color: token.colorPrimary }} />
                  <span style={{ fontWeight: 600 }}>Visibility</span>
                </Space>
              }
              style={{
                borderRadius: 16,
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                border: "none",
                height: "100%",
              }}
            >
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats?.visibilityData || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="count"
                      label={({ name, value, percent }) => {
                        // Use the entry's type field from your data
                        const entry = stats?.visibilityData?.find(
                          (d: any) => d.count === value,
                        );
                        const type = entry?.type || name || "Unknown";
                        const percentValue = percent || 0;
                        return `${type}: ${(percentValue * 100).toFixed(0)}%`;
                      }}
                    >
                      {(stats?.visibilityData || []).map(
                        (entry: any, index: number) => {
                          let color = "#1890ff";
                          if (entry.type === "INTERNAL") color = "#1890ff";
                          if (entry.type === "CLIENT") color = "#52c41a";
                          if (entry.type === "PUBLIC") color = "#722ed1";
                          return <Cell key={`cell-${index}`} fill={color} />;
                        },
                      )}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value: any, name: any, props: any) => {
                        const entry = props.payload;
                        return [`${value} releases`, entry?.type || "Unknown"];
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  justifyContent: "center",
                  gap: 16,
                }}
              >
                <Space>
                  <Badge color="#1890ff" />
                  <Text>Internal</Text>
                </Space>
                <Space>
                  <Badge color="#52c41a" />
                  <Text>Client</Text>
                </Space>
                <Space>
                  <Badge color="#722ed1" />
                  <Text>Public</Text>
                </Space>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </MainLayout>
  );
}
