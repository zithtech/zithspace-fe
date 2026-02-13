"use client";

import MainLayout from "@/components/layout/MainLayout";
import { Space, Typography } from "antd";
const { Title } = Typography;
import { Tabs } from "antd";
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
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams, usePathname } from "next/navigation";

export default function MyTimesheetsPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("dashboard");
  // const goToSubmitTimesheet = (
  //   id?: string,
  //   mode: "edit" | "resubmit" | "view" = "edit",
  // ) => {
  //   setActiveTab("submittimesheet");

  //   if (id) {
  //     router.push(`?id=${id}&mode=${mode}`);
  //   } else {
  //     router.push(`?mode=create`);
  //   }
  // };

  //   const goToSubmitTimesheet = (
  //   id?: string,
  //   mode: "edit" | "resubmit" | "view" | "create" = "create", // default create
  // ) => {
  //   setActiveTab("submittimesheet");

  //   if (id) {
  //     // Only go to edit/resubmit/view if id is provided
  //     router.push(`?id=${id}&mode=${mode}`);
  //   } else {
  //     // For create, always force mode=create
  //     router.push(`${pathname}?tab=submittimesheet&mode=create`);
  //   }
  // };

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
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode"); // edit | resubmit | view | create

  const pathname = usePathname();
  useEffect(() => {
    const tab = searchParams.get("tab");
    const mode = searchParams.get("mode");

    if (tab) {
      setActiveTab(tab);
    } else if (mode) {
      setActiveTab("submittimesheet");
    }
  }, [searchParams]);

  return (
    <MainLayout>
      <div>
        <div
          style={{
            position: "sticky",
            top: 64,
            zIndex: 100,
            //background: "#fff",
            padding: "8px 16px",
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <Tabs
            // defaultActiveKey="dashboard"
            activeKey={activeTab}
            // onChange={setActiveTab}
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
              {
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
                    {/* <SubmittimesheetTab
                      onSubmitted={() => setActiveTab("timesheets")} // ✅ switch tab
                    /> */}
                    <SubmittimesheetTab
                      key={activeTab} // 🔥 force reset when tab changes
                      onSubmitted={() => setActiveTab("timesheets")}
                    />
                  </div>
                ),
              },

              {
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
                  // <TeamsTab goToSubmitTimesheet={goToSubmitTimesheet} />
                  <TeamsTab
                    goToSubmitTimesheet={goToSubmitTimesheet}
                    onActionCompleted={() => setActiveTab("timesheets")}
                  />
                ),
              },
            ]}
          />
        </div>
      </div>
    </MainLayout>
  );
}
