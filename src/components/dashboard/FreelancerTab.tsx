"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Space,
  Button,
  List,
  Avatar,
  Tag,
  Tooltip,
  Skeleton,
  Empty,
  theme,
  Progress,
  Divider,
  Statistic,
  Alert,
} from "antd";
import {
  TrophyOutlined,
  ClockCircleOutlined,
  VideoCameraOutlined,
  FileTextOutlined,
  PlusOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  ArrowRightOutlined,
  UserOutlined,
  AlertOutlined,
  ThunderboltOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { useAuth } from "@/context/AuthContext";
import TicketService from "@/services/ticketService";
import { useCalendar } from "@/hooks/useCalendar";
import LeadService, { Lead } from "@/services/leadService";
import InvoiceService, { Invoice } from "@/services/invoiceService";
import { dashboardService, DashboardData } from "@/services/dashboardService";

const { Title, Text } = Typography;

const FreelancerTab = () => {
  const { token } = theme.useToken();
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [myTicketsStats, setMyTicketsStats] = useState({
    open: 0,
    closed: 0,
    total: 0,
  });

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    events: calendarEvents,
    loading: calendarLoading,
  } = useCalendar();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const [ticketsRes, invoicesRes, leadsRes] = await Promise.all([
          TicketService.getMyTickets({ limit: 10 }),
          InvoiceService.getInvoices({ limit: 5 }),
          LeadService.getAll(),
        ]);

        setTickets(ticketsRes.data);
        setInvoices(invoicesRes.data || []);
        setLeads(Array.isArray(leadsRes) ? leadsRes.slice(0, 5) : []);

        // Stats
        const [all, completed, live] = await Promise.all([
          TicketService.getMyTickets({ limit: 1 }),
          TicketService.getMyTickets({ status: "completed", limit: 1 }),
          TicketService.getMyTickets({ status: "live", limit: 1 }),
        ]);

        const total = all.pagination.total;
        const closedCount = completed.pagination.total + live.pagination.total;
        const open = total - closedCount;
        setMyTicketsStats({ open, closed: closedCount, total });

      } catch (error: any) {
        console.error("Failed to fetch freelancer data:", error);
        setError(error.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    const fetchDashboardStats = async () => {
      try {
        const summary = await dashboardService.getDashboardSummary();
        setDashboardData(summary);
      } catch (err) {
        console.error("Failed to fetch statistics:", err);
      }
    };

    fetchData();
    fetchDashboardStats();
  }, [user]);

  // Filter today's meetings
  const todaysMeetings = calendarEvents.filter((event: any) => {
    const isUserAttendee = event.attendees?.includes(user?.email) || event.userId === user?.id;
    if (!isUserAttendee) return false;
    return dayjs(event.startTime).isSame(dayjs(), "day");
  });

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high": return "#ff4d4f";
      case "medium": return "#faad14";
      case "low": return "#52c41a";
      default: return token.colorTextDescription;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = dayjs(dateString);
    const now = dayjs();
    const diffMins = now.diff(date, "minute");
    const diffHours = now.diff(date, "hour");
    const diffDays = now.diff(date, "day");

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const renderTicketList = (data: any[], title: string, emptyMsg: string, onViewAll: () => void) => (
    <Card
      title={
        <Space>
          <FileTextOutlined style={{ color: token.colorPrimary }} />
          <span style={{ fontSize: 15, fontWeight: 600 }}>{title}</span>
        </Space>
      }
      size="small"
      extra={<Button type="link" size="small" onClick={onViewAll}>View All</Button>}
      style={{ height: "320px", borderRadius: "16px", boxShadow: "none", border: `1px solid ${token.colorBorderSecondary}` }}
      styles={{ body: { padding: 0, overflowY: "auto", height: "270px" } }}
    >
      {loading ? (
        <div style={{ padding: 16 }}><Skeleton active /></div>
      ) : data.length > 0 ? (
        <List
          dataSource={data}
          renderItem={(item) => (
            <List.Item
              onClick={() => router.push(`/tickets/${item.id}`)}
              style={{ padding: "10px 16px", cursor: "pointer", borderBottom: `1px solid ${token.colorBorderSecondary}` }}
              className="hover-bg"
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
                <div style={{ width: 4, height: 32, borderRadius: 2, background: getPriorityColor(item.priority) }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <Text type="secondary" style={{ fontSize: 10 }}>{item.ticketNumber}</Text>
                    <Text type="secondary" style={{ fontSize: 10 }}>{formatTimeAgo(item.createdAt)}</Text>
                  </div>
                  <Text strong ellipsis style={{ fontSize: 13, display: "block" }}>{item.title}</Text>
                </div>
              </div>
            </List.Item>
          )}
        />
      ) : (
        <Empty description={emptyMsg} image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: 40 }} />
      )}
    </Card>
  );

  const unbilledCount = invoices.filter(inv => inv.status === 'DRAFT').length;

  const stats = dashboardData
    ? [
      {
        title: "Assigned / Closed Tickets",
        value: `${myTicketsStats.total} / ${myTicketsStats.closed}`,
        icon: <UserOutlined style={{ color: "#8c8c8c" }} />,
        color: "#1677ff",
        change: dashboardData.trends.ticketCompletionRate,
      },
      {
        title: "Unbilled Work",
        value: unbilledCount,
        icon: <FileTextOutlined style={{ color: "#8c8c8c" }} />,
        color: "#faad14",
        change: "Draft invoices",
      },
      {
        title: "Today's Schedule",
        value: todaysMeetings.length,
        icon: <CalendarOutlined style={{ color: "#8c8c8c" }} />,
        color: "#fa541c",
        change: "Meetings today",
      },
      {
        title: "New Opportunities",
        value: leads.length,
        icon: <ThunderboltOutlined style={{ color: "#faad14" }} />,
        color: "#faad14",
        change: "Recent leads",
      },
    ]
    : [];

  return (
    <div style={{ animation: "fadeIn 0.5s ease-in-out" }}>
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          closable
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Statistics Cards Row */}
      {!loading && dashboardData && (
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          {stats.map((stat, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <Card
                size="small"
                style={{
                  height: "100%",
                  borderRadius: "16px",
                  border: `1px solid ${token.colorBorderSecondary}`,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                  background: token.colorBgContainer
                }}
                styles={{ body: { padding: 16 } }}
              >
                <Space direction="vertical" size={4} style={{ width: "100%" }}>
                  <Space align="center" style={{ width: "100%", justifyContent: "space-between" }}>
                    <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>{stat.title}</Text>
                    {stat.icon}
                  </Space>
                  <Space align="baseline">
                    <Statistic
                      value={stat.value}
                      valueStyle={{ fontSize: 24, fontWeight: 600, color: token.colorText, lineHeight: 1 }}
                    />
                    <Tag
                      color="green"
                      style={{ fontSize: 10, padding: "0 4px", margin: 0, border: "none" }}
                    >
                      {stat.change}
                    </Tag>
                  </Space>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      )}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {/* Recent Invoices Section */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <DollarOutlined style={{ color: token.colorPrimary }} />
                <span style={{ fontSize: 15, fontWeight: 600 }}>Created Invoices</span>
              </Space>
            }
            size="small"
            extra={
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => router.push("/invoice/newinvoice")}
              >
                New
              </Button>
            }
            style={{
              height: "260px",
              borderRadius: "16px",
              boxShadow: "none",
              border: `1px solid ${token.colorBorderSecondary}`
            }}
            styles={{ body: { padding: 0, overflowY: "auto", height: "210px" } }}
          >
            {loading ? (
              <div style={{ padding: 16 }}><Skeleton active /></div>
            ) : invoices.length > 0 ? (
              <List
                dataSource={invoices}
                renderItem={(invoice) => (
                  <List.Item
                    onClick={() => router.push(`/invoice/invoices/view/${invoice.invoiceNumber}`)}
                    style={{ padding: "10px 16px", cursor: "pointer", borderBottom: `1px solid ${token.colorBorderSecondary}` }}
                    className="hover-bg"
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                      <div>
                        <Text strong style={{ fontSize: 13, display: "block" }}>{invoice.invoiceNumber}</Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>{dayjs(invoice.invoiceDate).format("MMM DD, YYYY")}</Text>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <Text strong style={{ fontSize: 13, display: "block" }}>{invoice.currency} {invoice.grandTotal.toLocaleString()}</Text>
                        <Tag color={invoice.status === 'PAID' ? 'success' : 'processing'} style={{ fontSize: 9, margin: 0, borderRadius: 4 }}>
                          {invoice.status}
                        </Tag>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="No invoices created" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: 20 }} />
            )}
          </Card>
        </Col>

        {/* My Tickets Summary */}
        <Col xs={24} lg={8}>
          <Card
            title={<span style={{ fontSize: 15, fontWeight: 600 }}>Ticket Progress</span>}
            size="small"
            style={{ height: "260px", borderRadius: "16px", boxShadow: "none", border: `1px solid ${token.colorBorderSecondary}` }}
          >
            <div style={{ textAlign: "center", padding: "10px 0" }}>
              <Progress
                type="dashboard"
                percent={myTicketsStats.total > 0 ? Math.round((myTicketsStats.closed / myTicketsStats.total) * 100) : 0}
                strokeColor={token.colorPrimary}
                width={110}
              />
              <div style={{ marginTop: 8, display: "flex", justifyContent: "space-around" }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 10, display: "block" }}>OPEN</Text>
                  <Text strong style={{ fontSize: 16 }}>{myTicketsStats.open}</Text>
                </div>
                <Divider type="vertical" style={{ height: 24 }} />
                <div>
                  <Text type="secondary" style={{ fontSize: 10, display: "block" }}>CLOSED</Text>
                  <Text strong style={{ fontSize: 16 }}>{myTicketsStats.closed}</Text>
                </div>
                <Divider type="vertical" style={{ height: 24 }} />
                <div>
                  <Text type="secondary" style={{ fontSize: 10, display: "block" }}>TOTAL</Text>
                  <Text strong style={{ fontSize: 16 }}>{myTicketsStats.total}</Text>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        {/* Today's Meetings */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <VideoCameraOutlined style={{ color: "#fa541c" }} />
                <span style={{ fontSize: 15, fontWeight: 600 }}>Today's Meetings</span>
              </Space>
            }
            size="small"
            style={{ height: "260px", borderRadius: "16px", boxShadow: "none", border: `1px solid ${token.colorBorderSecondary}` }}
            styles={{ body: { padding: 0 } }}
          >
            {calendarLoading ? (
              <div style={{ padding: 16 }}><Skeleton active /></div>
            ) : todaysMeetings.length > 0 ? (
              <div style={{ height: "210px", overflowY: "auto" }}>
                <List
                  dataSource={todaysMeetings}
                  renderItem={(meeting: any) => (
                    <List.Item style={{ padding: "12px 16px" }}>
                      <List.Item.Meta
                        avatar={<Avatar icon={<VideoCameraOutlined />} style={{ backgroundColor: "#fa541c" }} />}
                        title={<Text strong style={{ fontSize: 13 }}>{meeting.title}</Text>}
                        description={
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            <ClockCircleOutlined style={{ marginRight: 4 }} />
                            {dayjs(meeting.startTime).format("hh:mm A")}
                          </Text>
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <VideoCameraOutlined style={{ fontSize: 32, color: token.colorTextDisabled, marginBottom: 12 }} />
                <Text type="secondary" style={{ display: "block" }}>No meetings today</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Recent Tickets Section (Main) */}
        <Col xs={24} lg={12}>
          {renderTicketList(tickets, "Recent Tickets", "No tickets in progress", () => router.push("/projects/tickets"))}
        </Col>

        {/* Leads Section */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <RocketOutlined style={{ color: "#722ed1" }} />
                <span style={{ fontSize: 15, fontWeight: 600 }}>Recent Leads</span>
              </Space>
            }
            size="small"
            extra={<Button type="link" size="small" onClick={() => router.push("/leads")}>View All</Button>}
            style={{ height: "320px", borderRadius: "16px", boxShadow: "none", border: `1px solid ${token.colorBorderSecondary}` }}
            styles={{ body: { padding: 0, overflowY: "auto", height: "270px" } }}
          >
            {loading ? (
              <div style={{ padding: 16 }}><Skeleton active /></div>
            ) : leads.length > 0 ? (
              <List
                dataSource={leads}
                renderItem={(lead) => (
                  <List.Item
                    onClick={() => router.push(`/leads/view/${lead.id}`)}
                    style={{ padding: "12px 16px", cursor: "pointer", borderBottom: `1px solid ${token.colorBorderSecondary}` }}
                  >
                    <div style={{ width: "100%" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                        <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
                          <Tag color="purple" style={{ fontSize: 10, margin: "0 8px 4px 0", verticalAlign: 'middle' }}>
                            {lead.platform || "Upwork"}
                          </Tag>
                          <Text strong style={{ fontSize: 13, color: token.colorText, verticalAlign: 'middle' }}>
                            {lead.title}
                          </Text>
                        </div>
                        <Text type="secondary" style={{ fontSize: 10, flexShrink: 0, paddingTop: 2 }}>
                          {formatTimeAgo(lead.created_at)}
                        </Text>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          ${lead.hour_based_amount}/hr
                        </Text>
                        <ArrowRightOutlined style={{ fontSize: 12, color: token.colorPrimary }} />
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="No new leads" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: 40 }} />
            )}
          </Card>
        </Col>
      </Row>

      <style jsx global>{`
        .hover-bg:hover {
          background-color: ${token.colorFillAlter};
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default FreelancerTab;
