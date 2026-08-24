"use client";
import ZukvoLoader from "@/components/common/ZukvoLoader";


import { useActivitySource } from '@/hooks/useActivitySource';
import React, { useEffect, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Form, Switch, Button, Row, Col, Typography, message, notification, theme, Divider, Menu, App } from "antd";
import { dashboardService } from "@/services/dashboardService";
import {
  ME_METRICS,
  ME_CARDS,
  ORG_METRICS,
  ORG_CARDS,
  DEFAULT_SETTINGS,
} from "@/components/dashboard/launchpad/dashboardCards";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { Folder, Building, RotateCw } from "lucide-react";

const { Title, Text } = Typography;

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
  const { user, hasAnySubscriptionFeature } = useAuth();
  const { canUpdateSettings } = usePermission();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeMenu, setActiveMenu] = useState("me");


  const fetchSettings = async () => {
    if (!user) return;
    try {
      const data = await dashboardService.getSettings();
      form.setFieldsValue({
        ...DEFAULT_SETTINGS,
        ...(data?.visibleCards || {})
      });
    } catch (error) {
      console.error("Failed to fetch dashboard settings", error);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchSettings();
    } catch (error) {
      console.error("Refresh failed", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      await fetchSettings();
      setLoading(false);
    };
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Button
                type="default"
                icon={<RotateCw size={14} className={refreshing ? 'animate-spin' : ''} />}
                onClick={handleRefresh}
                disabled={refreshing || loading}
                title="Refresh settings"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, padding: 0, borderRadius: 8 }}
              />
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
                        {ME_METRICS.filter(m => !m.requiredFeatures || hasAnySubscriptionFeature(...m.requiredFeatures)).map((card) => (
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
                        {ME_CARDS.filter(c => !c.requiredFeatures || hasAnySubscriptionFeature(...c.requiredFeatures)).map((card) => (
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
                        {ORG_METRICS.filter(m => !m.requiredFeatures || hasAnySubscriptionFeature(...m.requiredFeatures)).map((card) => (
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
                        {ORG_CARDS.filter(c => !c.requiredFeatures || hasAnySubscriptionFeature(...c.requiredFeatures)).map((card) => (
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