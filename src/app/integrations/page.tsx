
"use client";

import { useActivitySource } from '@/hooks/useActivitySource';
import React, { useEffect, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Space, Typography, Card, Button, Badge, Row, Col, message, Modal, Input, Tabs, Tag, Dropdown, Avatar, Tooltip, App } from "antd";
const { Title, Text, Paragraph } = Typography;
import {
  GoogleOutlined,
  WindowsOutlined,
  CalendarOutlined,
  DisconnectOutlined,
  LinkOutlined
} from "@ant-design/icons";
import { Blocks, Search, Users, CheckCircle2, Link2, Plug, ChevronDown } from "lucide-react";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";
import { useAuth } from "@/context/AuthContext";

// StatCard removed
import { CalendarService, CalendarProvider, CalendarStatus } from "@/services/calendarService";
import { LinearService } from "@/services/linearService";
import { useRouter, useSearchParams } from "next/navigation";

interface ProviderConfig {
  key: CalendarProvider;
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

const PROVIDERS: ProviderConfig[] = [
  {
    key: "GOOGLE",
    name: "Google Workspace",
    icon: <GoogleOutlined />,
    color: "#4285F4",
    description: "Sync your Google Workspace emails and calendar meetings."
  },
  {
    key: "ZOHO",
    name: "Zoho Workspace",
    icon: <CalendarOutlined />,
    color: "#F44336",
    description: "Manage Zoho emails and events within Zukvo."
  },
  {
    key: "MICROSOFT",
    name: "Microsoft 365",
    icon: <WindowsOutlined />,
    color: "#00A4EF",
    description: "Unified schedule and emails with Microsoft 365."
  }
];

import { usePermission } from "@/hooks/usePermission";
import { AlertCircle } from "lucide-react";
import ZukvoLoader from '@/components/common/ZukvoLoader';

export default function IntegrationPage() {
  useActivitySource({ section: "HOME", module: "Integrations", page: "IntegrationPage" });
  const { modal, message: messageApi } = App.useApp();
  const { canReadMail, canReadCalendar } = usePermission();
  const { user, isLoading: authLoading } = useAuth();
  const [statuses, setStatuses] = useState<Record<string, CalendarStatus | null>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [searchText, setSearchText] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchStatuses();
    } catch (error) {
      console.error("Failed to refresh statuses:", error);
    } finally {
      setRefreshing(false);
    }
  };
  const [activeTab, setActiveTab] = useState("all");

  const userName = user?.name || "You";
  const userInitial = userName.charAt(0).toUpperCase();

  const mockConnectedUsers = [
    {
      key: '1',
      label: (
        <Space style={{ padding: '4px 0', alignItems: 'center' }}>
          <Avatar size="small" style={{ backgroundColor: '#1677ff', fontSize: 12 }}>{userInitial}</Avatar>
          <Text style={{ fontSize: 13, fontWeight: 500 }}>{userName}</Text>
        </Space>
      ),
    }
  ];

  const fetchStatuses = async () => {
    const newStatuses: Record<string, CalendarStatus | null> = {};
    for (const provider of PROVIDERS) {
      try {
        const status = await CalendarService.getStatus(provider.key);
        newStatuses[provider.key] = status;
      } catch (error) {
        newStatuses[provider.key] = { connected: false, provider: provider.key, lastSync: null };
      }
    }
    setStatuses(newStatuses);
    
    // Fetch Linear status
    try {
      const linearStatus = await LinearService.getStatus();
      setLinearConnected(linearStatus.connected);
    } catch (error) {
      console.error("Failed to fetch Linear status:", error);
      setLinearConnected(false);
    }
  };

  useEffect(() => {
    if (canReadMail || canReadCalendar) {
      fetchStatuses();
    }
  }, [canReadMail, canReadCalendar]);

  const router = useRouter();
  const searchParams = useSearchParams();
  const [linearConnected, setLinearConnected] = useState(false);
  const [linearLoading, setLinearLoading] = useState(false);

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    
    if (success === "linear_connected") {
      messageApi.success("Successfully connected to Linear!");
      router.replace("/integrations");
    } else if (error) {
      messageApi.error(`Failed to connect to Linear: ${error}`);
      router.replace("/integrations");
    }
  }, [searchParams, messageApi, router]);

  const hasShownError = React.useRef(false);
  useEffect(() => {
    if (!authLoading && user && !canReadMail && !canReadCalendar && !hasShownError.current) {
      messageApi.error("Access Denied: You don't have the required permissions (Mail or Calendar) to manage integrations. Please contact your administrator.");
      hasShownError.current = true;
    }
  }, [canReadMail, canReadCalendar, authLoading, user, messageApi]);

  const handleConnect = async (provider: CalendarProvider) => {
    // Check for both mail and calendar permissions as integrations usually cover both
    if (!canReadCalendar && !canReadMail) {
      messageApi.error("Permission Denied: You don't have the required permissions (Mail or Calendar) to connect this integration.");
      return;
    }

    if (!canReadCalendar) {
      messageApi.error("Calendar Permission Required: You don't have permission to connect calendars.");
      return;
    }
    const token = localStorage.getItem('accessToken');
    if (!token) {
      messageApi.warning('Please log in to connect your calendar');
      window.location.href = '/login?redirect=/integrations';
      return;
    }

    const anyConnected = Object.values(statuses).some(s => s?.connected);
    const currentProviderConnected = statuses[provider]?.connected;

    if (currentProviderConnected) {
      messageApi.info(`${provider} is already connected`);
      return;
    }

    if (anyConnected) {
      Modal.confirm({
        title: 'Switch Calendar Provider?',
        content: 'Connecting a new provider will disconnect the current one. Continue?',
        okText: 'Yes, Switch',
        cancelText: 'No',
        onOk: async () => {
          performConnection(provider);
        }
      });
    } else {
      performConnection(provider);
    }
  };

  const performConnection = async (provider: CalendarProvider) => {
    setLoading(prev => ({ ...prev, [provider]: true }));
    try {
      const url = await CalendarService.getConnectUrl(provider);
      window.location.href = url;
    } catch (error: any) {
      messageApi.error(error.message || `Failed to connect to ${provider}`);
      setLoading(prev => ({ ...prev, [provider]: false }));
    }
  };

  const handleDisconnect = async (provider: CalendarProvider) => {
    if (!canReadCalendar && !canReadMail) {
      messageApi.error("Permission Denied: You don't have permission to manage integrations.");
      return;
    }
    setLoading(prev => ({ ...prev, [provider]: true }));
    try {
      await CalendarService.disconnect(provider);
      messageApi.success(`${provider} disconnected successfully`);
      await fetchStatuses();
    } catch (error: any) {
      messageApi.error(error.message || `Failed to disconnect ${provider}`);
    } finally {
      setLoading(prev => ({ ...prev, [provider]: false }));
    }
  };

  const handleLinearConnect = async () => {
    setLinearLoading(true);
    try {
      const url = await LinearService.getConnectUrl();
      window.location.href = url;
    } catch (error: any) {
      messageApi.error(error.message || "Failed to connect to Linear");
      setLinearLoading(false);
    }
  };

  const handleLinearDisconnect = async () => {
    setLinearLoading(true);
    try {
      await LinearService.disconnect();
      messageApi.success("Linear disconnected successfully");
      await fetchStatuses();
    } catch (error: any) {
      messageApi.error(error.message || "Failed to disconnect Linear");
    } finally {
      setLinearLoading(false);
    }
  };

  const connectedCount = Object.values(statuses).filter(s => s?.connected).length;
  const filteredProviders = PROVIDERS.filter((provider) => {
    const matchesSearch = provider.name.toLowerCase().includes(searchText.toLowerCase()) || provider.description.toLowerCase().includes(searchText.toLowerCase());
    const isConnected = statuses[provider.key]?.connected;

    if (activeTab === "connected") return matchesSearch && isConnected;
    if (activeTab === "disconnected") return matchesSearch && !isConnected;
    return matchesSearch;
  });

  if (authLoading) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <ZukvoLoader size="lg" message="Loading permissions..." />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div style={{
        margin: "0 -24px",
        background: "var(--bg-pure-white)",
        minHeight: "calc(100vh - 64px)"
      }}>
        <TimeTrackingHeader
          icon={<Blocks size={20} color="#8b5cf6" />}
          title="Integrations"
          description="Connect your favorite tools to Zukvo to streamline your workflow and sync your schedule."
          onRefresh={handleRefresh}
          refreshing={refreshing}
          extra={
            <Input
              placeholder="Search integrations..."
              prefix={<Search size={16} style={{ color: "var(--text-slate-400)" }} />}
              style={{ width: 280, borderRadius: 10, height: 38, background: "var(--bg-secondary)", border: "1px solid var(--border-color)" }}
              onChange={(e) => setSearchText(e.target.value)}
            />
          }
        />

        <div style={{ padding: "0 32px 32px 32px" }}>

          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            style={{ marginBottom: 24 }}
            items={[
              { key: "all", label: "All Integrations" },
              { key: "connected", label: "Connected" },
              { key: "disconnected", label: "Disconnected" }
            ]}
          />

          <div>
            <Title level={5} style={{ marginBottom: 20, color: "var(--text-primary)" }}>Mail & Calendar Integrations</Title>

            <Row gutter={[16, 16]} justify="start">
              {filteredProviders.map((provider) => {
                const status = statuses[provider.key];
                const isConnected = status?.connected;
                const isLoading = loading[provider.key];

                // Check if ANY provider is connected
                const anyProviderConnected = Object.values(statuses).some(s => s?.connected);

                return (
                  <Col xs={24} sm={24} md={12} lg={8} key={provider.key}>
                    <Card
                      hoverable
                      style={{
                        borderRadius: 12,
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-pure-white)',
                        height: '100%',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                      }}
                      styles={{ body: { padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' } }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 24 }}>
                        <div style={{
                          width: 48,
                          height: 48,
                          borderRadius: 12,
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 24,
                          marginRight: 16,
                          color: provider.color
                        }}>
                          {provider.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <Title level={5} style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
                            {provider.name}
                          </Title>
                          <Text style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                            {provider.description}
                          </Text>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px 8px', marginTop: 'auto' }}>
                        {isConnected ? (
                          <Dropdown
                            menu={{ items: mockConnectedUsers }}
                            trigger={['click']}
                            placement="bottomLeft"
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, cursor: 'pointer', padding: '4px', borderRadius: '4px', transition: 'background 0.2s' }} className="connected-users-hover">
                              <Users size={16} />
                              <span>1 Connected</span>
                              <ChevronDown size={14} />
                            </div>
                          </Dropdown>
                        ) : (
                          <Tag color="warning" style={{ borderRadius: 12, padding: '4px 12px', fontWeight: 600, fontSize: 12, margin: 0, border: 'none' }}>
                            No accounts
                          </Tag>
                        )}
                        <div style={{ display: 'flex', gap: 8 }}>
                          {isConnected ? (
                            <Button
                              onClick={() => handleDisconnect(provider.key)}
                              loading={isLoading}
                              size="small"
                              style={{
                                borderRadius: 6,
                                fontWeight: 500,
                                height: 28,
                                padding: '0 12px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                color: '#ef4444',
                                borderColor: 'transparent'
                              }}
                            >
                              Disconnect
                            </Button>
                          ) : (
                            <Button
                              type={anyProviderConnected ? "default" : "primary"}
                              icon={<Plug size={14} />}
                              onClick={() => handleConnect(provider.key)}
                              loading={isLoading}
                              size="small"
                              style={{
                                borderRadius: 6,
                                fontWeight: 500,
                                background: anyProviderConnected ? 'var(--bg-primary)' : provider.color,
                                color: anyProviderConnected ? 'var(--text-primary)' : '#fff',
                                borderColor: anyProviderConnected ? 'var(--border-color)' : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                height: 28,
                                padding: '0 12px'
                              }}
                            >
                              {anyProviderConnected ? 'Switch' : 'Connect'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </div>
          
          {(() => {
            const linearName = "Linear";
            const linearDesc = "Connect Linear to sync and manage tickets in Zukvo";
            const matchesSearch = linearName.toLowerCase().includes(searchText.toLowerCase()) || linearDesc.toLowerCase().includes(searchText.toLowerCase());
            const shouldShow = (activeTab === "all" && matchesSearch) || (activeTab === "disconnected" && matchesSearch && !linearConnected) || (activeTab === "connected" && matchesSearch && linearConnected);
            
            if (!shouldShow) return null;

            return (
              <div style={{ marginTop: 40 }}>
                <Title level={5} style={{ marginBottom: 20, color: "var(--text-primary)" }}>Ticket Integration</Title>
                <Row gutter={[16, 16]} justify="start">
                  <Col xs={24} sm={24} md={12} lg={8}>
                    <Card
                      hoverable
                      style={{
                        borderRadius: 12,
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-pure-white)',
                        height: '100%',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                      }}
                      styles={{ body: { padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' } }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 24 }}>
                        <div style={{
                          width: 48,
                          height: 48,
                          borderRadius: 12,
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 24,
                          marginRight: 16,
                          color: '#5E6AD2'
                        }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" clipRule="evenodd" d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM8.97541 16.4813L15.6888 7.31826L14.498 6.45264L7.78457 15.6157L8.97541 16.4813Z" fill="currentColor"/>
                          </svg>
                        </div>
                        <div style={{ flex: 1 }}>
                          <Title level={5} style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
                            Linear
                          </Title>
                          <Text style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                            Connect Linear to sync and manage tickets in Zukvo
                          </Text>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px 8px', marginTop: 'auto' }}>
                        {linearConnected ? (
                          <Dropdown
                            menu={{ items: mockConnectedUsers }}
                            trigger={['click']}
                            placement="bottomLeft"
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, cursor: 'pointer', padding: '4px', borderRadius: '4px', transition: 'background 0.2s' }} className="connected-users-hover">
                              <Users size={16} />
                              <span>1 Connected</span>
                              <ChevronDown size={14} />
                            </div>
                          </Dropdown>
                        ) : (
                          <Tag color="warning" style={{ borderRadius: 12, padding: '4px 12px', fontWeight: 600, fontSize: 12, margin: 0, border: 'none' }}>
                            No accounts
                          </Tag>
                        )}
                        <div style={{ display: 'flex', gap: 8 }}>
                          {linearConnected ? (
                            <Button
                              onClick={handleLinearDisconnect}
                              loading={linearLoading}
                              size="small"
                              style={{
                                borderRadius: 6,
                                fontWeight: 500,
                                height: 28,
                                padding: '0 12px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                color: '#ef4444',
                                borderColor: 'transparent'
                              }}
                            >
                              Disconnect
                            </Button>
                          ) : (
                            <Button
                              type="primary"
                              icon={<Plug size={14} />}
                              size="small"
                              onClick={handleLinearConnect}
                              loading={linearLoading}
                              style={{
                                borderRadius: 6,
                                fontWeight: 500,
                                background: '#5E6AD2',
                                color: '#fff',
                                borderColor: 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                height: 28,
                                padding: '0 12px'
                              }}
                            >
                              Connect
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Col>
                </Row>
              </div>
            );
          })()}
        </div>
        <style dangerouslySetInnerHTML={{
          __html: `
          .connected-users-hover:hover {
            background: var(--bg-primary);
          }
        `}} />
      </div>
    </MainLayout>
  );
}