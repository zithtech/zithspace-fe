"use client";

import React, { useState, useEffect } from "react";
import { Typography, Card, Layout, theme, Button, Row, Col, Space, Skeleton } from "antd";
import { PlusOutlined, TeamOutlined, DollarOutlined, LineChartOutlined, UserOutlined } from "@ant-design/icons";
import SalaryManagementTable from "../../../components/salary/SalaryManagementTable";
import MainLayout from "@/components/layout/MainLayout";
import AddSalaryDrawer from "../../../components/salary/AddSalaryDrawer";
import { salaryService } from "../../../services/salaryService";

const { Title, Text } = Typography;
const { Content } = Layout;

interface DashboardData {
  totalEmployees: number;
  activeCount: number;
  monthlyPayroll: number;
  averageCTC: number;
  vpfActiveCount: number;
}

export default function SalaryManagementPage() {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const [addDrawerVisible, setAddDrawerVisible] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const data = await salaryService.fetchSalaryDashboard();
      setDashboardData(data);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [refreshTrigger]);

  const formatCurrency = (amount?: number) => {
    if (amount === undefined) return "₹0";
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return amount.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    });
  };

  return (
    <MainLayout>
      <div style={{ padding: 20 }}>
        {/* Header section */}
        <div style={{ marginBottom: 20 }}>
          <Space
            align="center"
            style={{ width: "100%", justifyContent: "space-between" }}
          >
            <Space align="center">
              <DollarOutlined style={{ fontSize: 24, color: "#1677ff" }} />
              <div>
                <Title level={3} style={{ margin: 0 }}>
                  Salary Management
                </Title>
              </div>
            </Space>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => setAddDrawerVisible(true)}
              style={{ borderRadius: 6, fontWeight: 500 }}
            >
              Add Salary for Employee
            </Button>
          </Space>
        </div>

        {/* Stats Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} bodyStyle={{ padding: '20px' }} style={{ borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              {loading ? <Skeleton active paragraph={{ rows: 1 }} /> : (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                   <div style={{ padding: '8px', backgroundColor: '#e6f4ff', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                     <TeamOutlined style={{ fontSize: '20px', color: '#1677ff' }} />
                   </div>
                   <div>
                     <Text type="secondary" style={{ fontSize: '13px' }}>Total Employees</Text>
                     <div style={{ fontSize: '24px', fontWeight: 600, marginTop: '4px' }}>
                       {dashboardData?.totalEmployees || 0}
                     </div>
                     <Text type="secondary" style={{ fontSize: '12px' }}>
                       {dashboardData?.activeCount || 0} active
                     </Text>
                   </div>
                </div>
              )}
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} bodyStyle={{ padding: '20px' }} style={{ borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              {loading ? <Skeleton active paragraph={{ rows: 1 }} /> : (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                   <div style={{ padding: '8px', backgroundColor: '#f6ffed', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                     <DollarOutlined style={{ fontSize: '20px', color: '#52c41a' }} />
                   </div>
                   <div>
                     <Text type="secondary" style={{ fontSize: '13px' }}>Monthly Payroll</Text>
                     <div style={{ fontSize: '24px', fontWeight: 600, marginTop: '4px' }}>
                       {formatCurrency(dashboardData?.monthlyPayroll)}
                     </div>
                     <Text type="secondary" style={{ fontSize: '12px' }}>Active employees</Text>
                   </div>
                </div>
              )}
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} bodyStyle={{ padding: '20px' }} style={{ borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              {loading ? <Skeleton active paragraph={{ rows: 1 }} /> : (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                   <div style={{ padding: '8px', backgroundColor: '#fff7e6', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                     <LineChartOutlined style={{ fontSize: '20px', color: '#fa8c16' }} />
                   </div>
                   <div>
                     <Text type="secondary" style={{ fontSize: '13px' }}>Average CTC</Text>
                     <div style={{ fontSize: '24px', fontWeight: 600, marginTop: '4px' }}>
                       {formatCurrency(dashboardData?.averageCTC)}
                     </div>
                     <Text type="secondary" style={{ fontSize: '12px' }}>Per annum</Text>
                   </div>
                </div>
              )}
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} bodyStyle={{ padding: '20px' }} style={{ borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              {loading ? <Skeleton active paragraph={{ rows: 1 }} /> : (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                   <div style={{ padding: '8px', backgroundColor: '#f9f0ff', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                     <UserOutlined style={{ fontSize: '20px', color: '#722ed1' }} />
                   </div>
                   <div>
                     <Text type="secondary" style={{ fontSize: '13px' }}>VPF Active</Text>
                     <div style={{ fontSize: '24px', fontWeight: 600, marginTop: '4px' }}>
                       {dashboardData?.vpfActiveCount || 0}
                     </div>
                     <Text type="secondary" style={{ fontSize: '12px' }}>
                       of {dashboardData?.activeCount || 0} active
                     </Text>
                   </div>
                </div>
              )}
            </Card>
          </Col>
        </Row>

        {/* Main card containing the table */}
        <Card
          style={{
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            border: "none",
          }}
          bodyStyle={{ padding: "0" }}
        >
          <SalaryManagementTable 
            refreshTrigger={refreshTrigger} 
            onRefresh={() => setRefreshTrigger(prev => prev + 1)}
          />
        </Card>
      </div>
      <AddSalaryDrawer 
        visible={addDrawerVisible} 
        onClose={(refresh) => {
          setAddDrawerVisible(false);
          if (refresh) setRefreshTrigger(prev => prev + 1);
        }} 
      />
    </MainLayout>
  );
}
