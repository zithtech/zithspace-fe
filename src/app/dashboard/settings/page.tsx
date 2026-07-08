"use client";

import React, { useEffect, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Form, Switch, Button, Card, Row, Col, Typography, message, theme } from "antd";
import { dashboardService } from "@/services/dashboardService";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";

const { Title, Text } = Typography;

export default function DashboardSettingsPage() {
  const { token } = theme.useToken();
  const { user } = useAuth();
  const { canUpdateSettings } = usePermission();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      if (user) {
        try {
          const data = await dashboardService.getSettings();
          if (data && data.visibleCards) {
            form.setFieldsValue(data.visibleCards);
          } else {
            form.setFieldsValue({
              heroSection: true,
              quickActions: true,
              attendanceStats: true,
              myTicketsProgress: true,
              recentTickets: true,
              freelancerStats: true,
              recentLeads: true,
              recentInvoices: true,
              calendar: true,
            });
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
      message.success('Dashboard settings updated successfully!');
    } catch (error) {
      console.error('Failed to update dashboard settings:', error);
      message.error('Failed to update dashboard settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout>
      <div style={{ padding: "24px", maxWidth: 800, margin: "0 auto", marginTop: 24 }}>
        <div style={{ marginBottom: 24 }}>
          <Title level={3} style={{ margin: 0, fontWeight: 700, color: token.colorTextHeading }}>
            Dashboard Settings
          </Title>
          <Text style={{ color: token.colorTextSecondary }}>
            Control which cards are visible on the main dashboard for all users in the tenant.
          </Text>
        </div>

        <Card loading={loading} style={{ borderRadius: 12, border: `1px solid ${token.colorBorderSecondary}` }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Row gutter={[24, 24]}>
              <Col span={12}>
                <Form.Item name="heroSection" valuePropName="checked" label="Hero Section (Greeting & Pulse)">
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="quickActions" valuePropName="checked" label="Quick Actions">
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="attendanceStats" valuePropName="checked" label="Attendance Stats (Worked Time, Today's Updates)">
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="myTicketsProgress" valuePropName="checked" label="My Tickets Progress">
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="recentTickets" valuePropName="checked" label="Recent Tickets">
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="freelancerStats" valuePropName="checked" label="Freelancer Stats">
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="recentLeads" valuePropName="checked" label="Recent Leads">
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="recentInvoices" valuePropName="checked" label="Recent Invoices">
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="calendar" valuePropName="checked" label="Calendar & Upcoming Meetings">
                  <Switch />
                </Form.Item>
              </Col>
            </Row>

            {canUpdateSettings && (
              <div style={{ marginTop: 24, textAlign: 'right' }}>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={saving}
                  style={{ borderRadius: 8, height: 40, fontWeight: 600, padding: '0 24px' }}
                >
                  Save Changes
                </Button>
              </div>
            )}
          </Form>
        </Card>
      </div>
    </MainLayout>
  );
}
