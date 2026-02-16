"use client";

import React, { useState } from "react";
import { Typography, Space, Tabs } from "antd";
import {
  SettingOutlined,
  BankOutlined,
  FileTextOutlined,
  UserOutlined,
  DollarOutlined,
} from "@ant-design/icons";

import MainLayout from "@/components/layout/MainLayout";
import SalaryStructureList from "./salaryStructure/page"; // LIST VIEW
import NewSalaryStructure from "./salaryStructure/NewSalaryStructure"; // FORM VIEW
import CompanyConfiguration from "./company/page";
import EmployeeSettings from "./employee/page";
import PayslipSettings from "./payslip/page";
import AllowanceSettings from "./allowance/page";
import PreviewDrawer from "./PreviewDrawer"; // adjust path if needed
import { PreviewType } from "@/types/salary";

const { Title, Text } = Typography;

const SettingsPage = () => {
  const [activeKey, setActiveKey] = useState<
    "company" | "payslip" | "employee" | "salary" | "allowance"
  >("company");

  // For Salary Structure internal tab
  const [salaryMode, setSalaryMode] = useState<"list" | "form">("list");
  const [editingId, setEditingId] = useState<number | null>(null);

  // Render content based on active tab
  // const renderContent = () => {
  //   switch (activeKey) {
  //     case "salary":
  //       return salaryMode === "list" ? (
  //         <SalaryStructureList
  //           onCreate={() => {
  //             setEditingId(null);
  //             setSalaryMode("form");
  //           }}
  //           onEdit={(id: number) => {
  //             setEditingId(id);
  //             setSalaryMode("form");
  //           }}
  //         />
  //       ) : (
  //         <NewSalaryStructure
  //           mode={editingId ? "edit" : "create"}
  //           editingId={editingId}
  //           onBack={() => setSalaryMode("list")}
  //         />
  //       );

  //     case "company":
  //       return <CompanyConfiguration />;
  //     case "payslip":
  //       return <PayslipSettings />;
  //     case "employee":
  //       return <EmployeeSettings />;
  //     default:
  //       return <div>Company settings content</div>;
  //   }
  // };

  // Preview drawer state
  // Preview drawer state (single source of truth)
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewType, setPreviewType] = useState<PreviewType>(null);
  const [previewData, setPreviewData] = useState({
    company: null,
    payslip: null,
    employee: null,
    salary: null,
  });

  const openPreview = (
    type: "company" | "payslip" | "employee" | "salary",
    data: any,
  ) => {
    setPreviewData((prev) => ({
      ...prev,
      [type]: data,
    }));
    setPreviewOpen(true); // 👈 drawer open
  };

  const renderContent = () => {
    switch (activeKey) {
      case "salary":
        return salaryMode === "list" ? (
          <SalaryStructureList />
        ) : (
          <NewSalaryStructure
            mode={editingId ? "edit" : "create"}
            editingId={editingId}
            onBack={() => setSalaryMode("list")}
            onPreview={openPreview} // 👈 important
          />
        );

      case "company":
        return <CompanyConfiguration />;

      case "payslip":
        return <PayslipSettings />;

      case "employee":
        return <EmployeeSettings />;

      case "allowance":
        return <AllowanceSettings />;

      default:
        return <div>Company settings content</div>;
    }
  };

  return (
    <MainLayout>
      <div style={{ padding: 0 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: "#e6f4ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginLeft: 8, // 👉 right-ku move
            }}
          >
            <SettingOutlined style={{ fontSize: 24, color: "#1677ff" }} />
          </div>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              Settings
            </Title>
            <Text type="secondary" style={{ fontSize: 14 }}>
              Manage application settings
            </Text>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          style={{ marginTop: 5 }}
          activeKey={activeKey}
          onChange={(key) => setActiveKey(key as any)}
          type="card"
          tabBarStyle={{
            background: "#f5f8ff",
            padding: 6,
            borderRadius: 12,
          }}
          items={[
            {
              key: "company",
              label: (
                <span>
                  <BankOutlined /> Company configuration
                </span>
              ),
            },
            {
              key: "payslip",
              label: (
                <span>
                  <FileTextOutlined /> Payslip configuration
                </span>
              ),
            },
            {
              key: "employee",
              label: (
                <span>
                  <UserOutlined /> Employee Details
                </span>
              ),
            },
            {
              key: "salary",
              label: (
                <span>
                  <DollarOutlined /> Salary Structure
                </span>
              ),
            },
            {
              key: "allowance",
              label: (
                <span>
                  <DollarOutlined /> salary component 
                </span>
              ),
            },
          ]}
        />

        {/* Dynamic Content */}
        <div style={{ marginTop: 5 }}>{renderContent()}</div>
        <PreviewDrawer
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          data={{
            payslip: previewData.payslip,
            company: previewData.company,
            employee: previewData.employee,
            salary: previewData.salary,
          }}
        />
      </div>
    </MainLayout>
  );
};

export default SettingsPage;
