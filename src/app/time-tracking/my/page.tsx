"use client";

import React, { useState, useCallback } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Typography, Button, Space, DatePicker, Row, Col } from "antd";
import { MyTimeTracker } from "@/components/time-tracking/MyTimeTracker";
import { ManageTimeModal } from "@/components/time-tracking/ManageTimeModal";
import { TimeSummary7Days } from "@/components/time-tracking/TimeSummary7Days";
import { useTimeTrackerStore } from "@/store/useTimeTrackerStore";
import dayjs from "dayjs";
import { ClockCircleOutlined, PlusOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export default function MyTimePage() {
  const { setPopoverOpen } = useTimeTrackerStore();
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [manageModalOpen, setManageModalOpen] = useState(false);

  const handleTotalChange = useCallback((total: number) => {
    setTotalSeconds(total);
  }, []);

  const formatTotal = (total: number) => {
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    return `${h}h ${m}m`;
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
                <ClockCircleOutlined style={{ fontSize: 24 }} />
              </div>
              <div>
                <Title level={2} style={{ margin: 0, fontWeight: 700, color: "var(--text-slate-900)" }}>My Time Tracking</Title>
                <Text style={{ color: "var(--text-slate-600)", fontSize: 15 }}>Monitor and manage your daily task sessions and work logs.</Text>
              </div>
            </Space>
          </div>
          
          <div style={{ display: "flex", gap: 12, alignItems: 'center' }}>
            <div style={{ 
              padding: '8px 16px', 
              background: 'var(--bg-sky-50)', 
              border: '1px solid var(--border-blue-200)', 
              borderRadius: '10px', 
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              height: 44
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-sky-500)' }} />
              <span style={{ fontSize: 13, color: 'var(--text-sky-700)', fontWeight: 600 }}>Day Total:</span>
              <span style={{ fontSize: 15, color: 'var(--text-sky-900)', fontWeight: 700 }}>{formatTotal(totalSeconds)}</span>
            </div>

            <DatePicker
              value={selectedDate}
              onChange={(date) => setSelectedDate(date || dayjs())}
              allowClear={false}
              format="MMM DD, YYYY"
              style={{ 
                height: 44, 
                borderRadius: 10, 
                background: "var(--bg-pure-white)",
                border: '1px solid var(--border-slate-200)',
                minWidth: 160,
                fontWeight: 500
              }}
            />
            <Button 
              type="primary" 
              size="large"
              icon={<PlusOutlined />}
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
            >
              Add Time
            </Button>
          </div>
        </div>

        <Row gutter={24} align="stretch">
          <Col xs={24} lg={17}>
            <MyTimeTracker
              selectedDate={selectedDate}
              refreshKey={refreshKey}
              onTotalChange={handleTotalChange}
            />
          </Col>
          <Col xs={24} lg={7}>
            <TimeSummary7Days refreshKey={refreshKey} />
          </Col>
        </Row>

        <ManageTimeModal
          open={manageModalOpen}
          onClose={() => setManageModalOpen(false)}
          onSuccess={() => setRefreshKey(prev => prev + 1)}
          selectedDate={selectedDate}
        />
      </div>
    </MainLayout>
  );
}
