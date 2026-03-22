"use client";
//Bello
import { Tabs, Spin } from "antd";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import DashboardTab from "@/components/timesheet/DashboardTab";
import SubmittimesheetTab from "@/components/timesheet/SubmittimesheetTab";
import TimesheetsTab from "@/components/timesheet/TimesheetsTab";
import TeamsTab from "@/components/timesheet/TeamsTab";
import {
  DashboardOutlined,
  EditOutlined,
  FileTextOutlined,
  TeamOutlined,
} from "@ant-design/icons";

export default function TimesheetContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { isLoading: authLoading } = useAuth();
  const { canReadTimesheet, canCreateTimesheet, canUpdateTimesheet, canApproveTimesheet } = usePermission();

  // Route guard
  useEffect(() => {
    if (!authLoading && !canReadTimesheet) {
      router.push('/dashboard');
    }
  }, [authLoading, canReadTimesheet, router]);

  const [activeTab, setActiveTab] = useState("dashboard");

  const goToSubmitTimesheet = (
    id?: string,
    mode: "edit" | "resubmit" | "create" = "edit",
  ) => {
    setActiveTab("submittimesheet");

    if (id) {
      router.push(`?id=${id}&mode=${mode}`);
    } else {
      router.push(`?mode=create`);
    }
  };

  useEffect(() => {
    const tab = searchParams.get("tab");
    const mode = searchParams.get("mode");

    if (tab) {
      setActiveTab(tab);
    } else if (mode) {
      setActiveTab("submittimesheet");
    }
  }, [searchParams]);

  // Loading & permission check
  if (authLoading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <div style={{ padding: 100, textAlign: 'center' }}>
          <Spin size="large" tip="Loading">
            <div style={{ padding: 20 }} />
          </Spin>
        </div>
      </div>
    );
  }

  if (!canReadTimesheet) {
    return null;
  }

  return (
    <div>
      <div
        style={{
          position: "sticky",
          top: 64,
          zIndex: 100,
          padding: "8px 16px",
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key);

            if (key === "dashboard") {
              router.push(pathname);
            }

            if (key === "timesheets") {
              router.push(`${pathname}?tab=timesheets`);
            }

            if (key === "teams") {
              router.push(`${pathname}?tab=teams`);
            }

            if (key === "submittimesheet") {
              router.push(`${pathname}?tab=submittimesheet&mode=create`);
            }
          }}
          tabBarStyle={{
            margin: 0,
            paddingLeft: 24,
            paddingRight: 50,
            top: 10,
          }}
          items={[
            {
              key: "dashboard",
              label: (
                <span
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <DashboardOutlined />
                  Dashboard
                </span>
              ),
              children: <DashboardTab />,
            },
            {
              key: "timesheets",
              label: (
                <span
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <FileTextOutlined />
                  Timesheets
                </span>
              ),
              children: (
                <TimesheetsTab goToSubmitTimesheet={goToSubmitTimesheet} />
              ),
            },
            ...(canCreateTimesheet ? [{
              key: "submittimesheet",
              label: (
                <span
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <EditOutlined />
                  Submit timesheet
                </span>
              ),
              children: (
                <div
                  style={{
                    flex: 1,
                    height: "calc(100vh - 64px - 48px)",
                    overflowY: "auto",
                    overflowX: "hidden",
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                  }}
                  className="hide-scrollbar"
                >
                  <SubmittimesheetTab
                    key={activeTab}
                    onSubmitted={() => setActiveTab("timesheets")}
                  />
                </div>
              ),
            }] : []),
            ...(canApproveTimesheet ? [{
              key: "teams",
              label: (
                <span
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <TeamOutlined />
                  Teams
                </span>
              ),
              children: (
                <TeamsTab
                  goToSubmitTimesheet={goToSubmitTimesheet}
                  onActionCompleted={() => setActiveTab("timesheets")}
                />
              ),
            }] : []),
          ]}
        />
      </div>
    </div>
  );
}
