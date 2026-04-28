"use client";

import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Typography, Button, Space } from "antd";
import { TeamTimeTracker } from "@/components/time-tracking/TeamTimeTracker";
import { useTimeTrackerStore } from "@/store/useTimeTrackerStore";
import { ManageTimeModal } from "@/components/time-tracking/ManageTimeModal";

import { ClockCircleOutlined, TeamOutlined, PlusOutlined } from "@ant-design/icons";
const { Title, Text } = Typography;
import dayjs from "dayjs";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";

export default function TeamTimePage() {
  const { setPopoverOpen } = useTimeTrackerStore();
  const [isManageModalOpen, setIsManageModalOpen] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const handleSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <MainLayout>
      <div style={{
        margin: "0 -24px",
        background: "var(--bg-pure-white)",
        minHeight: "calc(100vh - 64px)"
      }}>
        <TimeTrackingHeader
          icon={<TeamOutlined style={{ fontSize: 18, color: '#8b5cf6' }} />}
          title="Team View"
          description="Monitor team productivity, work sessions, and daily capacity in real-time."
          extra={
            <>
              <Button
                size="large"
                onClick={() => setIsManageModalOpen(true)}
                style={{ height: 38, borderRadius: 10, fontWeight: 500, padding: '0 20px', background: 'var(--bg-pure-white)', border: '1px solid var(--border-slate-200)' }}
              >
                Manage Time
              </Button>
              <Button
                size="large"
                type="primary"
                onClick={() => setPopoverOpen(true)}
                style={{
                  height: 38,
                  borderRadius: 10,
                  fontWeight: 600,
                  padding: '0 24px',
                  background: '#1677ff',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center'
                }}
                icon={<PlusOutlined />}
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
