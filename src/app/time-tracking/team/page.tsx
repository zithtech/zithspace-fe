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
        padding: "24px 32px", 
        background: "var(--bg-pure-white)", 
        minHeight: "calc(100vh - 64px)" 
      }}>
        {/* Header Section */}
        <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: 'wrap', gap: 20 }}>
          <div style={{ flex: 1 }}>
            <Space size={12} align="center">
              <div style={{ 
                background: "var(--bg-blue-50)", 
                padding: 10, 
                borderRadius: 12, 
                color: "var(--text-blue-600)",
                display: "flex"
              }}>
                <TeamOutlined style={{ fontSize: 24 }} />
              </div>
              <div>
                <Title level={2} style={{ margin: 0, fontWeight: 700, color: "var(--text-slate-900)" }}>Team View</Title>
                <Text style={{ color: "var(--text-slate-600)", fontSize: 15 }}>Monitor team productivity, work sessions, and daily capacity in real-time.</Text>
              </div>
            </Space>
          </div>
          
          <Space size={12} style={{ alignItems: 'center' }}>
            <Button 
              size="large" 
              onClick={() => setIsManageModalOpen(true)} 
              style={{ height: 44, borderRadius: 10, fontWeight: 500, padding: '0 20px', background: 'var(--bg-pure-white)', border: '1px solid var(--border-slate-200)' }}
            >
              Manage Time
            </Button>
            <Button 
              size="large" 
              type="primary" 
              onClick={() => setPopoverOpen(true)} 
              style={{ 
                height: 44, 
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
