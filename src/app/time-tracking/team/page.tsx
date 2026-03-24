"use client";

import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Typography, Button, Space } from "antd";
import { TeamTimeTracker } from "@/components/time-tracking/TeamTimeTracker";
import { useTimeTrackerStore } from "@/store/useTimeTrackerStore";
import { ManageTimeModal } from "@/components/time-tracking/ManageTimeModal";

import { ClockCircleOutlined, TeamOutlined } from "@ant-design/icons";
const { Title, Text } = Typography;

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
      <div style={{ padding: "32px 48px", minHeight: '100vh', background: '#fff' }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
              <div style={{ background: '#f8fafc', padding: 10, borderRadius: 12, color: '#6366f1', display: 'flex', border: '1px solid #f1f5f9' }}>
                <TeamOutlined style={{ fontSize: 24 }} />
              </div>
              <div>
                <Title level={2} style={{ margin: 0 }}>Team View</Title>
              </div>
            </div>
            <Text style={{ color: '#64748b', fontSize: 14, marginLeft: 58, display: 'block' }}>Monitor team productivity, work sessions, and daily capacity in real-time.</Text>
          </div>
          <Space size="middle" style={{ marginTop: 8 }}>
            <Button size="large" onClick={() => setIsManageModalOpen(true)} style={{ borderRadius: 8 }}>Manage Time</Button>
            <Button size="large" type="primary" onClick={() => setPopoverOpen(true)} style={{ borderRadius: 8, background: '#6366f1' }}>Add Time</Button>
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
