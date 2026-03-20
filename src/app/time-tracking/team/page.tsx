"use client";

import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Typography, Button, Space } from "antd";
import { TeamTimeTracker } from "@/components/time-tracking/TeamTimeTracker";
import { useTimeTrackerStore } from "@/store/useTimeTrackerStore";
import { ManageTimeModal } from "@/components/time-tracking/ManageTimeModal";

const { Title } = Typography;

import dayjs from "dayjs";

export default function TeamTimePage() {
  const { setPopoverOpen } = useTimeTrackerStore();
  const [isManageModalOpen, setIsManageModalOpen] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const handleSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <MainLayout>
      <div style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0 }}>Team View</Title>
          <Space>
            <Button onClick={() => setIsManageModalOpen(true)}>Manage Time</Button>
            <Button type="primary" onClick={() => setPopoverOpen(true)}>Add Time</Button>
          </Space>
        </div>
        <TeamTimeTracker refreshKey={refreshKey} />
        <ManageTimeModal 
          open={isManageModalOpen} 
          onClose={() => setIsManageModalOpen(false)} 
          onSuccess={handleSuccess}
          selectedDate={dayjs()}
        />
      </div>
    </MainLayout>
  );
}
