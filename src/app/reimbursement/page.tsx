"use client";

import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Space, Typography, Tabs, Button, Row, Col } from "antd";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  TransactionOutlined,
  UserOutlined,
  TeamOutlined,
  DollarOutlined,
  SettingOutlined,
  PlusOutlined,
} from "@ant-design/icons";

import EmployeeTab from "@/components/reimbursement/EmployeeTab";
import FinanceTab from "@/components/reimbursement/FinanceTab";
import ManagerTab from "@/components/reimbursement/ManagerTab";
import SettingsTab from "@/components/reimbursement/settingsTab";

const { Title } = Typography;

export default function ReimbursementPage() {
  const router = useRouter();

  return (
    <MainLayout>
      <Link href="/reimburseCreate"></Link>

      <div style={{ padding: 10 }}>
      
        <div className="px-5 py-4 bg-white">
          <Row justify="space-between" align="middle">
          
            <Col>
              <Space align="center" size={8}>
                <TransactionOutlined className="text-lg text-blue-600" />
                <Title level={4} style={{ margin: 0 }}>
                  Reimbursement Portal
                </Title>
              </Space>
            </Col>

     
            <Col>
              <Button
                type="primary"
                size="middle"
                icon={<PlusOutlined />}
                className="h-auto px-3 py-1.5"
                onClick={() => router.push("/reimburseCreate")}
              >
                Create
              </Button>
            </Col>
          </Row>
        </div>

        {/* Tabs */}
        <Tabs
          defaultActiveKey="employee"
          items={[
            {
              key: "employee",
              label: (
                <Space>
                  <UserOutlined /> Employee
                </Space>
              ),
              children: <EmployeeTab />,
            },
            {
              key: "manager",
              label: (
                <Space>
                  <TeamOutlined /> Manager
                </Space>
              ),
              children: <ManagerTab />,
            },
            {
              key: "finance",
              label: (
                <Space>
                  <DollarOutlined /> Finance
                </Space>
              ),
              children: <FinanceTab />,
            },
            {
              key: "settings",
              label: (
                <Space>
                  <SettingOutlined /> Settings
                </Space>
              ),
              children: <SettingsTab />,
            },
          ]}
        />
      </div>
    </MainLayout>
  );
}
