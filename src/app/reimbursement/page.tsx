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
                  <ApartmentOutlined /> Reimbursement Configuration
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
