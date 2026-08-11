"use client";

import { useActivitySource } from '@/hooks/useActivitySource';
import React, { useEffect, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Form, Switch, Button, Row, Col, Typography, message, notification, theme, Divider, Menu, App } from "antd";
import { dashboardService } from "@/services/dashboardService";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import {

  Clock,
  Timer,
  Users,
  LayoutDashboard,
  Zap,
  Ticket,
  Megaphone,
  FileText,
  CalendarDays,
  CalendarClock,
  Gift,
  Folder,
  Building,
  Activity,
  Lightbulb,
  History,
  BarChart
} from "lucide-react";
import ZukvoLoader from "@/components/common/ZukvoLoader";

const { Title, Text } = Typography;

const ME_METRICS = [
  {
    name: "metricDailyUpdates",
    title: "Daily Updates",
    description: "Overview of BOD and EOD submission status.",
    icon: Zap,
    color: "#3B82F6"
  },
  {
    name: "metricAvgHours",
    title: "Avg Hours",
    description: "Average working hours over the last 5 days.",
    icon: Clock,
    color: "#10B981"
  },
  {
    name: "metricMyTickets",
    title: "My Tickets",
    description: "Your open and closed tickets progress.",
    icon: Ticket,
    color: "#F59E0B"
  },
  {
    name: "metricTeamToday",
    title: "Team Today",
    description: "Quick look at team members on leave or working today.",
    icon: Users,
    color: "#8B5CF6"
  }
];

const ME_CARDS = [
  {
    name: "heroSection",
    title: "Hero Section",
    description: "Display a personalized greeting and live pulse.",
    icon: LayoutDashboard,
    color: "#8B5CF6"
  },
  {
    name: "dailyAttendanceCard",
    title: "Daily Attendance",
    description: "Time tracker and daily attendance logs.",
    icon: CalendarClock,
    color: "#3B82F6"
  },
  {
    name: "quickActions",
    title: "Quick Actions",
    description: "Shortcuts for clocking in, submitting updates, or creating tickets.",
    icon: Zap,
    color: "#EC4899"
  },
  {
    name: "recentTickets",
    title: "Recent Tickets",
    description: "Ticket resolution times, volume, and customer satisfaction.",
    icon: Ticket,
    color: "#F43F5E"
  },
  {
    name: "myTicketsProgress",
    title: "My Tickets",
    description: "Your open and closed tickets progress.",
    icon: Ticket,
    color: "#F59E0B"
  },
  {
    name: "calendar",
    title: "Calendar",
    description: "Upcoming meetings and calendar schedule.",
    icon: CalendarDays,
    color: "#6366F1"
  },

  {
    name: "cardSalarySlip",
    title: "Salary Slip",
    description: "Download your monthly salary slips.",
    icon: FileText,
    color: "#10B981"
  }
];

const ORG_METRICS = [
  {
    name: "metricTotalMembers",
    title: "Total Members",
    description: "Number of active team members in the organization.",
    icon: Users,
    color: "#3B82F6"
  },
  {
    name: "metricActiveProjects",
    title: "Active Projects",
    description: "Number of currently active projects.",
    icon: Folder,
    color: "#F59E0B"
  },
  {
    name: "metricOrgTickets",
    title: "Tickets",
    description: "Overview of open and resolved tickets.",
    icon: Ticket,
    color: "#10B981"
  },
  {
    name: "metricOrgTeamToday",
    title: "Team Today",
    description: "Quick look at team members on leave or working today.",
    icon: Users,
    color: "#8B5CF6"
  },
];

const ORG_CARDS = [
  {
    name: "cardProjectPulse",
    title: "Project Pulse",
    description: "Real-time tracking of project health and velocity.",
    icon: Activity,
    color: "#0EA5E9"
  },

  {
    name: "upcomingBirthdays",
    title: "Upcoming Birthdays",
    description: "Track upcoming birthdays across the organization.",
    icon: Gift,
    color: "#F59E0B"
  },
  {
    name: "cardTodayLeaves",
    title: "Today's Leaves",
    description: "See who is on leave or working from home today.",
    icon: CalendarClock,
    color: "#EC4899"
  },

  {
    name: "cardRecentActivities",
    title: "Recent Activities",
    description: "Log of recent actions across the organization.",
    icon: History,
    color: "#6366F1"
  }
];

const SettingRow = ({ title, description, icon: Icon, color, formItemName }: any) => {
  const { token } = theme.useToken();
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        backgroundColor: token.colorBgContainer,
        border: `1px solid ${token.colorBorderSecondary}`,
        borderRadius: 8,
        marginBottom: 8,
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          backgroundColor: `${color}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color,
          flexShrink: 0
        }}>
          <Icon size={16} strokeWidth={2} />
        </div>
        <div>
          <div style={{ fontWeight: 500, fontSize: 14, color: token.colorText, marginBottom: 2 }}>{title}</div>
          <div style={{ fontSize: 12, color: token.colorTextSecondary }}>{description}</div>
        </div>
      </div>
      <Form.Item name={formItemName} valuePropName="checked" style={{ margin: 0, marginLeft: 16 }}>
        <Switch size="small" />
      </Form.Item>
    </div>
  )
}

export default function DashboardSettingsPage() {
  useActivitySource({ section: "HOME", module: "Dashboard", page: "DashboardSettings" });
  const { message: messageApi } = App.useApp();
  const { token } = theme.useToken();
  const { user } = useAuth();
  const { canUpdateSettings } = usePermission();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeMenu, setActiveMenu] = useState("me");

  useEffect(() => {
    const fetchSettings = async () => {
      if (user) {
        try {
          const DEFAULT_SETTINGS = {
            // Me Dashboard
            heroSection: true,
            quickActions: true,
            dailyAttendanceCard: true,
            recentTickets: true,
            calendar: true,
            upcomingBirthdays: true,
            cardTodayLeaves: true,
            cardSalarySlip: true,
            metricDailyUpdates: true,
            metricAvgHours: true,
            metricMyTickets: true,
            metricTeamToday: true,
            // Organization Dashboard
            metricTotalMembers: true,
            metricActiveProjects: true,
            metricOrgTickets: true,
            metricOrgTeamToday: true,
            cardProjectPulse: true,
            cardTodaysPulse: true,
            cardOrgUpcomingBirthdays: true,
            cardTeamInsights: true,
            cardRecentActivities: true
          };

          const data = await dashboardService.getSettings();
          if (data && data.visibleCards) {
            form.setFieldsValue({
              ...DEFAULT_SETTINGS,
              ...data.visibleCards
            });
          } else {
            form.setFieldsValue(DEFAULT_SETTINGS);
          }
        } catch (error) {
          console.error("Failed to fetch dashboard settings", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchSettings();
  }, [user, form]);

  const handleSubmit = async (values: any) => {
    try {
      setSaving(true);
      await dashboardService.updateSettings(values);
      messageApi.success('Setting saved');
    } catch (error) {
      console.error('Failed to update dashboard settings:', error);
      messageApi.error('Failed to update dashboard settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout noPadding>
      <div style={{ display: 'flex', height: 'calc(100vh - 60px)', overflow: 'hidden', background: token.colorBgContainer }}>

        {/* Left Sidebar */}
        <div style={{ width: 260, borderRight: `1px solid ${token.colorBorderSecondary}`, display: 'flex', flexDirection: 'column', backgroundColor: token.colorBgContainer, overflowY: 'auto' }}>

          {/* Sidebar Header */}
          <div style={{ padding: '24px 20px' }}>
            <Title level={4} style={{ margin: 0, fontWeight: 700, color: token.colorText }}>Settings</Title>
            <Text style={{ fontSize: 11, fontWeight: 700, color: token.colorTextSecondary, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              DASHBOARD & UI
            </Text>
          </div>

          <div style={{ padding: '0 12px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: token.colorTextTertiary, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12, paddingLeft: 12 }}>
              VIEWS
            </div>

            <div
              onClick={() => setActiveMenu('me')}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                borderRadius: 6, cursor: 'pointer', marginBottom: 4,
                backgroundColor: activeMenu === 'me' ? token.colorPrimaryBg : 'transparent',
                color: activeMenu === 'me' ? token.colorPrimary : token.colorTextSecondary,
                fontWeight: activeMenu === 'me' ? 600 : 500,
                transition: 'all 0.2s'
              }}
            >
              <Folder size={18} />
              <span>Me Dashboard</span>
            </div>

            <div
              onClick={() => setActiveMenu('organization')}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                borderRadius: 6, cursor: 'pointer',
                backgroundColor: activeMenu === 'organization' ? token.colorPrimaryBg : 'transparent',
                color: activeMenu === 'organization' ? token.colorPrimary : token.colorTextSecondary,
                fontWeight: activeMenu === 'organization' ? 600 : 500,
                transition: 'all 0.2s'
              }}
            >
              <Building size={18} />
              <span>Organization</span>
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: token.colorBgLayout, position: 'relative', overflowY: 'auto' }}>

          {/* Top Header inside Content */}
          <div style={{ padding: '16px 32px', backgroundColor: token.colorBgContainer, borderBottom: `1px solid ${token.colorBorderSecondary}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
            <div>
              <Title level={5} style={{ margin: 0, fontWeight: 600, color: token.colorText }}>
                {activeMenu === 'me' ? 'Me Dashboard' : 'Organization Dashboard'}
              </Title>
              <Text style={{ fontSize: 13, color: token.colorTextSecondary }}>
                Control which cards and metrics are visible for this segment.
              </Text>
            </div>
            {canUpdateSettings && (
              <Button
                type="primary"
                loading={saving}
                onClick={() => form.submit()}
                style={{ borderRadius: 6, fontWeight: 600, height: 36, padding: '0 20px' }}
              >
                Save Changes
              </Button>
            )}
          </div>

          {/* Main Content scrollable area */}
          <div style={{ flex: 1, padding: '32px' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                <ZukvoLoader size="lg" />
              </div>
            ) : (
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
              >
                <div className="fade-in" style={{ display: activeMenu === 'me' ? 'block' : 'none' }}>
                  <div style={{ marginBottom: 32 }}>
                    <Title level={5} style={{ marginBottom: 16, color: token.colorTextHeading, fontWeight: 600 }}>
                      Status Cards
                    </Title>
                    <Row gutter={[16, 0]}>
                      {ME_METRICS.map((card) => (
                        <Col xs={24} lg={12} key={card.name}>
                          <SettingRow {...card} formItemName={card.name} />
                        </Col>
                      ))}
                    </Row>
                  </div>

                  <div style={{ marginBottom: 32 }}>
                    <Title level={5} style={{ marginBottom: 16, color: token.colorTextHeading, fontWeight: 600 }}>
                      Dashboard Cards
                    </Title>
                    <Row gutter={[16, 0]}>
                      {ME_CARDS.map((card) => (
                        <Col xs={24} lg={12} key={card.name}>
                          <SettingRow {...card} formItemName={card.name} />
                        </Col>
                      ))}
                    </Row>
                  </div>
                </div>

                <div className="fade-in" style={{ display: activeMenu === 'organization' ? 'block' : 'none' }}>
                  <div style={{ marginBottom: 32 }}>
                    <Title level={5} style={{ marginBottom: 16, color: token.colorTextHeading, fontWeight: 600 }}>
                      Status Cards
                    </Title>
                    <Row gutter={[16, 0]}>
                      {ORG_METRICS.map((card) => (
                        <Col xs={24} lg={12} key={card.name}>
                          <SettingRow {...card} formItemName={card.name} />
                        </Col>
                      ))}
                    </Row>
                  </div>

                  <div style={{ marginBottom: 32 }}>
                    <Title level={5} style={{ marginBottom: 16, color: token.colorTextHeading, fontWeight: 600 }}>
                      Dashboard Cards
                    </Title>
                    <Row gutter={[16, 0]}>
                      {ORG_CARDS.map((card) => (
                        <Col xs={24} lg={12} key={card.name}>
                          <SettingRow {...card} formItemName={card.name} />
                        </Col>
                      ))}
                    </Row>
                  </div>
                </div>
              </Form>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}