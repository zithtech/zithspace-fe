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
        background: "#ffffff", 
        minHeight: "calc(100vh - 64px)" 
      }}>
        {/* Header Section */}
        <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: 'wrap', gap: 20 }}>
          <div style={{ flex: 1 }}>
            <Space size={12} align="center">
              <div style={{ 
                background: "#eff6ff", 
                padding: 10, 
                borderRadius: 12, 
                color: "#2563eb",
                display: "flex"
              }}>
                <ClockCircleOutlined style={{ fontSize: 24 }} />
              </div>
              <div>
                <Title level={2} style={{ margin: 0, fontWeight: 700, color: "#1e293b" }}>My Time Tracking</Title>
                <Text style={{ color: "#64748b", fontSize: 15 }}>Monitor and manage your daily task sessions and work logs.</Text>
              </div>
            </Space>
          </div>
          
          <div style={{ display: "flex", gap: 12, alignItems: 'center' }}>
            <div style={{ 
              padding: '8px 16px', 
              background: '#f0f9ff', 
              border: '1px solid #bae6fd', 
              borderRadius: '10px', 
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              height: 44
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0ea5e9' }} />
              <span style={{ fontSize: 13, color: '#0369a1', fontWeight: 600 }}>Day Total:</span>
              <span style={{ fontSize: 15, color: '#0c4a6e', fontWeight: 700 }}>{formatTotal(totalSeconds)}</span>
            </div>

            <DatePicker
              value={selectedDate}
              onChange={(date) => setSelectedDate(date || dayjs())}
              allowClear={false}
              format="MMM DD, YYYY"
              style={{ 
                height: 44, 
                borderRadius: 10, 
                border: '1px solid #e2e8f0',
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
