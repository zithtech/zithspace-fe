"use client";
import ZukvoLoader from "@/components/common/ZukvoLoader";


import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { Space, Typography, Tabs } from "antd";
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
  const {
    canReadReimbursement,
    canReadReimbursementMy,
    canReadReimbursementApproval,
    canReadReimbursementSetting,
    canReadReimbursementPolicy
  } = usePermission();

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
            <ZukvoLoader size="lg" message="Loading" />
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
            canReadReimbursementMy && {
              key: "employee",
              label: (
                <Space>
                  <UserOutlined /> My Reimbursements
                </Space>
              ),
              children: <EmployeeTab />,
            },
            canReadReimbursementApproval && {
              key: "finance",
              label: (
                <Space>
                  <DollarOutlined /> Approvals
                </Space>
              ),
              children: <FinanceTab />,
            },
            canReadReimbursementSetting && {
              key: "settings",
              label: (
                <Space>
                  <SettingOutlined /> Settings
                </Space>
              ),
              children: <SettingsTab />,
            },
            canReadReimbursementPolicy && {
              key: "reimbursement configuration",
              label: (
                <Space>
                  <ApartmentOutlined /> Reimbursement Policy
                </Space>
              ),
              children: <ReimbursementTab />,
            },
          ].filter(Boolean) as any[]}
        />
      </div>
    </MainLayout>
  );
}
