"use client";

import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Typography, Button, Space } from "antd";
import { MyTimeTracker } from "@/components/time-tracking/MyTimeTracker";
import { useTimeTrackerStore } from "@/store/useTimeTrackerStore";

const { Title } = Typography;

export default function MyTimePage() {
  const { setPopoverOpen } = useTimeTrackerStore();

  return (
    <MainLayout>
      <div style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0 }}>My Time Tracking</Title>
          <Space>
            <Button type="primary" onClick={() => setPopoverOpen(true)}>Add Time</Button>
          </Space>
        </div>
        <MyTimeTracker />
      </div>
    </MainLayout>
  );
}
