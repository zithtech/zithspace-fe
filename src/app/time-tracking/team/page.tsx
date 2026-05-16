"use client";

import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "antd";
import { TeamTimeTracker } from "@/components/time-tracking/TeamTimeTracker";
import { useTimeTrackerStore } from "@/store/useTimeTrackerStore";
import { ManageTimeModal } from "@/components/time-tracking/ManageTimeModal";

import { TeamOutlined, PlusOutlined, EditOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/context/AuthContext";
import { Result } from "antd";
import { useRouter } from "next/navigation";

export default function TeamTimePage() {
  const { setPopoverOpen } = useTimeTrackerStore();
  const [isManageModalOpen, setIsManageModalOpen] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const { canReadTimeTrackingTeam } = usePermission();
  const { isLoading } = useAuth();
  const router = useRouter();

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  if (isLoading) return null;

  if (!canReadTimeTrackingTeam) {
    return (
      <MainLayout>
        <div style={{ padding: "100px 0", background: "var(--bg-pure-white)", minHeight: "calc(100vh - 64px)" }}>
          <Result
            status="403"
            title="403"
            subTitle="Sorry, you are not authorized to access this page."
            extra={<Button type="primary" onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>}
          />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div
        style={{
          margin: "0 -24px",
          background: "var(--bg-primary)",
          minHeight: "calc(100vh - 64px)",
        }}
      >
        <TimeTrackingHeader
          style={{
            position: "sticky",
            top: 0,
            zIndex: 1000,
            background: "var(--bg-primary)",
            padding: "9.5px 32px",
            borderBottom: "1px solid var(--border-slate-200)",
            marginBottom: 20,
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
          icon={<TeamOutlined style={{ fontSize: 18, color: "#8b5cf6" }} />}
          title="Team Tracking"
          description="Monitor team productivity, work sessions, and daily capacity in real-time."
          extra={
            <>
              <Button
                onClick={() => setIsManageModalOpen(true)}
                icon={<EditOutlined />}
                style={{
                  height: 38,
                  borderRadius: 10,
                  fontWeight: 500,
                  padding: "0 18px",
                  background: "var(--bg-pure-white)",
                  border: "1px solid var(--border-slate-200)",
                }}
              >
                Manage Time
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setPopoverOpen(true)}
                className="mtt-add-time-btn"
              >
                Add Time
              </Button>
            </>
          }
        />

        <div style={{ padding: "0 32px 32px 32px" }}>
          <TeamTimeTracker refreshKey={refreshKey} />
          <ManageTimeModal
            open={isManageModalOpen}
            onClose={() => setIsManageModalOpen(false)}
            onSuccess={handleSuccess}
            selectedDate={dayjs()}
          />
        </div>
      </div>
    </MainLayout>
  );
}
