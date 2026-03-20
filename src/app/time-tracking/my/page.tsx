"use client";

import React, { useState, useCallback } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Typography, Button, Space, DatePicker, Row, Col } from "antd";
import { MyTimeTracker } from "@/components/time-tracking/MyTimeTracker";
import { ManageTimeModal } from "@/components/time-tracking/ManageTimeModal";
import { TimeSummary7Days } from "@/components/time-tracking/TimeSummary7Days";
import { useTimeTrackerStore } from "@/store/useTimeTrackerStore";
import dayjs from "dayjs";

const { Title } = Typography;

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
      <div style={{ padding: "24px", maxWidth: 1600, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <Space align="center" size="middle" wrap>
            <Title level={2} style={{ margin: 0, marginRight: 8 }}>My Time Tracking</Title>
            <div style={{ padding: '4px 12px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '6px', color: '#0369a1', fontWeight: 600 }}>
              Day Total: {formatTotal(totalSeconds)}
            </div>
            <DatePicker
              value={selectedDate}
              onChange={(date) => setSelectedDate(date || dayjs())}
              allowClear={false}
              format="MMM DD, YYYY"
              style={{ minWidth: 150 }}
            />
            {/* <Button onClick={() => setManageModalOpen(true)}>Manage Time</Button> */}
            <Button type="primary" onClick={() => setPopoverOpen(true)}>Add Time</Button>
          </Space>
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
