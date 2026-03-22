"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { Space, Typography, Tabs, Spin } from "antd";
import Link from "next/link";
import {
  UserOutlined,
  TeamOutlined,
  DollarOutlined,
  SettingOutlined,
  PlusOutlined,
  ApartmentOutlined 
} from "@ant-design/icons";

import EmployeeTab from "@/components/reimbursement/EmployeeTab";
import FinanceTab from "@/components/reimbursement/FinanceTab";
import ManagerTab from "@/components/reimbursement/ManagerTab";
import SettingsTab from "@/components/reimbursement/settingsTab";
import ReimbursementTab from "@/components/reimbursement/ReimbursementTab";


const { Title } = Typography;

export default function ReimbursementPage() {
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();
  const { canReadReimbursement, canCreateReimbursement, canApproveReimbursement } = usePermission();

  // Route guard
  useEffect(() => {
    if (!authLoading && !canReadReimbursement) {
      router.push('/dashboard');
    }
  }, [authLoading, canReadReimbursement, router]);

  // Loading state
  if (authLoading) {
    return (
      <MainLayout>
        <div style={{ padding: 24, textAlign: 'center' }}>
        <div style={{ padding: 100, textAlign: 'center' }}>
          <Spin size="large" tip="Loading">
            <div style={{ padding: 20 }} />
          </Spin>
        </div>
        </div>
      </MainLayout>
    );
  }

  // Permission check
  if (!canReadReimbursement) {
    return null;
  }

  return (
    <MainLayout>
      <Link href="/reimburseCreate"></Link>

      <div style={{ padding: 10 }}>

        {/* Tabs */}
        <Tabs
          defaultActiveKey="employee"
          items={[
            {
              key: "employee",
              label: (
                <Space>
                  <UserOutlined /> My Reimbursements
                </Space>
              ),
              children: <EmployeeTab />,
            },
            // {
            //   key: "manager",
            //   label: (
            //     <Space>
            //       <TeamOutlined /> Manager
            //     </Space>
            //   ),
            //   children: <ManagerTab />,
            // },
            {
              key: "finance",
              label: (
                <Space>
                  <DollarOutlined /> Approvals
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
             {
              key: "reimbursement configuration",
              label: (
                <Space>
                  <ApartmentOutlined /> Reimbursement Policy
                </Space>
              ),
              children: <ReimbursementTab />,
            },
          ]}
        />
      </div>
    </MainLayout>
  );
}
