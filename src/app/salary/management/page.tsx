"use client";

import React, { useState } from "react";
import { Typography, Card, Layout, theme, Button, Row, Col, Space } from "antd";
import { PlusOutlined, TeamOutlined, DollarOutlined, LineChartOutlined, UserOutlined } from "@ant-design/icons";
import SalaryManagementTable from "../../../components/salary/SalaryManagementTable";
import MainLayout from "@/components/layout/MainLayout";
import AddSalaryDrawer from "../../../components/salary/AddSalaryDrawer";

const { Title, Text } = Typography;
const { Content } = Layout;

export default function SalaryManagementPage() {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const [addDrawerVisible, setAddDrawerVisible] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
                {/* <Text type="secondary" style={{ fontSize: 13 }}>
                  Manage employee compensation & benefits
                </Text> */}
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
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                 <div style={{ padding: '8px', backgroundColor: '#f0f2f5', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                   <TeamOutlined style={{ fontSize: '20px', color: '#595959' }} />
                 </div>
                 <div>
                   <Text type="secondary" style={{ fontSize: '13px' }}>Total Employees</Text>
                   <div style={{ fontSize: '24px', fontWeight: 600, marginTop: '4px' }}>6</div>
                   <Text type="secondary" style={{ fontSize: '12px' }}>5 active</Text>
                 </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} bodyStyle={{ padding: '20px' }} style={{ borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                 <div style={{ padding: '8px', backgroundColor: '#f0f2f5', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                   <DollarOutlined style={{ fontSize: '20px', color: '#595959' }} />
                 </div>
                 <div>
                   <Text type="secondary" style={{ fontSize: '13px' }}>Monthly Payroll</Text>
                   <div style={{ fontSize: '24px', fontWeight: 600, marginTop: '4px' }}>₹8.5L</div>
                   <Text type="secondary" style={{ fontSize: '12px' }}>Active employees</Text>
                 </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} bodyStyle={{ padding: '20px' }} style={{ borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                 <div style={{ padding: '8px', backgroundColor: '#f0f2f5', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                   <LineChartOutlined style={{ fontSize: '20px', color: '#595959' }} />
                 </div>
                 <div>
                   <Text type="secondary" style={{ fontSize: '13px' }}>Average CTC</Text>
                   <div style={{ fontSize: '24px', fontWeight: 600, marginTop: '4px' }}>₹20.4L</div>
                   <Text type="secondary" style={{ fontSize: '12px' }}>Per annum</Text>
                 </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} bodyStyle={{ padding: '20px' }} style={{ borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                 <div style={{ padding: '8px', backgroundColor: '#f0f2f5', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                   <UserOutlined style={{ fontSize: '20px', color: '#595959' }} />
                 </div>
                 <div>
                   <Text type="secondary" style={{ fontSize: '13px' }}>VPF Active</Text>
                   <div style={{ fontSize: '24px', fontWeight: 600, marginTop: '4px' }}>2</div>
                   <Text type="secondary" style={{ fontSize: '12px' }}>of 5 active</Text>
                 </div>
              </div>
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
          <SalaryManagementTable refreshTrigger={refreshTrigger} />
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
