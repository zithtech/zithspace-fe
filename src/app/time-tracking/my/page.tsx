"use client";

import React, { useState, useCallback } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button, DatePicker, Row, Col } from "antd";
import { MyTimeTracker } from "@/components/time-tracking/MyTimeTracker";
import { ManageTimeModal } from "@/components/time-tracking/ManageTimeModal";
import { TimeSummary7Days } from "@/components/time-tracking/TimeSummary7Days";
import { MyTimeStatsStrip } from "@/components/time-tracking/MyTimeStatsStrip";
import { useTimeTrackerStore } from "@/store/useTimeTrackerStore";
import dayjs from "dayjs";
import { ClockCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/context/AuthContext";
import { Result } from "antd";
import { useRouter } from "next/navigation";

export default function MyTimePage() {
  const { setPopoverOpen } = useTimeTrackerStore();
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [, setTotalSeconds] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [manageModalOpen, setManageModalOpen] = useState(false);

  const { canReadTimeTracking } = usePermission();
  const { isLoading } = useAuth();
  const router = useRouter();

  const handleTotalChange = useCallback((total: number) => {
    setTotalSeconds(total);
  }, []);

  const isToday = selectedDate.isSame(dayjs(), "day");

  if (isLoading) return null;

  if (!canReadTimeTracking) {
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
          icon={<ClockCircleOutlined style={{ fontSize: 18, color: "#8b5cf6" }} />}
          title="My Time Tracking"
          description="Monitor and manage your daily task sessions and work logs."
          extra={
            <>
              <DatePicker
                value={selectedDate}
                onChange={(date) => setSelectedDate(date || dayjs())}
                allowClear={false}
                format="MMM DD, YYYY"
                suffixIcon={<ClockCircleOutlined style={{ color: "var(--text-slate-400)" }} />}
                style={{
                  height: 38,
                  borderRadius: 10,
                  background: "var(--bg-pure-white)",
                  border: "1px solid var(--border-slate-200)",
                  minWidth: 170,
                  fontWeight: 500,
                }}
              />
              {!isToday && (
                <Button
                  onClick={() => setSelectedDate(dayjs())}
                  style={{
                    height: 38,
                    borderRadius: 10,
                    fontWeight: 500,
                    border: "1px solid var(--border-slate-200)",
                    background: "var(--bg-pure-white)",
                  }}
                >
                  Today
                </Button>
              )}
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
          <MyTimeStatsStrip refreshKey={refreshKey} />

          <Row gutter={24} align="stretch" style={{ marginTop: 20 }}>
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
            onSuccess={() => setRefreshKey((prev) => prev + 1)}
            selectedDate={selectedDate}
          />
        </div>
      </div>
    </MainLayout>
  );
}
