"use client";

import React, { useState } from "react";
import { Typography, Space, Tabs } from "antd";
import {
  SettingOutlined,
  BankOutlined,
  FileTextOutlined,
  UserOutlined,
  DollarOutlined,
  AuditOutlined,
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
          <SalaryStructureList
            onCreate={() => {
              setEditingId(null);
              setSalaryMode("form");
            }}
            onEdit={(id: number) => {
              setEditingId(id);
              setSalaryMode("form");
            }}
          />
        ) : (
          <NewSalaryStructure
            mode={editingId ? "edit" : "create"}
            editingId={editingId}
            onBack={() => setSalaryMode("list")}
            onPreview={openPreview} // 👈 important
          />
        );

      case "company":
        return <CompanyConfiguration onPreview={openPreview} />;

      case "payslip":
        return <PayslipSettings onPreview={openPreview} />;

      case "employee":
        return <EmployeeSettings onPreview={openPreview} />;

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
        {/* <div
          style={{
            position: "fixed",
            top: 64, // ⬅️ MainLayout header height (adjust if needed)
            zIndex: 100,
            background: "#fff",
            paddingTop: 4,
            paddingBottom: 4,
          }}
        > */}
          <Tabs
            style={{ marginTop: 5, fontSize: 20 }}
            activeKey={activeKey}
            onChange={(key) => setActiveKey(key as any)}
            // type="card"
            tabBarStyle={{
              background: "#f5f8ff",
              padding: 6,
              borderRadius: 12,
              fontSize: 16,
             
            }}
            // Blue color for all tabs
            tabBarGutter={24}
            items={[
              {
                key: "company",
                label: (
                  <span>
                    <BankOutlined /> Company Configuration
                  </span>
                ),
              },
              {
                key: "payslip",
                label: (
                  <span>
                    <FileTextOutlined /> Payslip Configuration
                  </span>
                ),
              },
              {
                key: "employee",
                label: (
                  <span>
                    <UserOutlined /> Employee Configuration
                  </span>
                ),
              },
              {
                key: "allowance",
                label: (
                  <span>
                    <AuditOutlined />
                    Salary Components
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
            ]}
          />
        {/* </div> */}

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
