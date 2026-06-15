"use client";

import React, { useState, useCallback } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button, DatePicker, Row, Col, Tooltip, Space, Result } from "antd";
import { MyTimeTracker } from "@/components/time-tracking/MyTimeTracker";
import { ManageTimeModal } from "@/components/time-tracking/ManageTimeModal";
import { TimeSummary7Days } from "@/components/time-tracking/TimeSummary7Days";
import { MyTimeStatsStrip } from "@/components/time-tracking/MyTimeStatsStrip";
import { useTimeTrackerStore } from "@/store/useTimeTrackerStore";
import dayjs from "dayjs";
import { ClockCircleOutlined, PlusOutlined, MenuOutlined } from "@ant-design/icons";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useActivitySource } from "@/hooks/useActivitySource";
import { History } from "lucide-react";
import TransactionHistoryDrawer from "@/components/common/TransactionHistoryDrawer";

export default function MyTimePage() {
  useActivitySource({ section: "WORK", module: "TimeTracking", page: "TimeTrackingMy" });
  const { setPopoverOpen } = useTimeTrackerStore();
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [, setTotalSeconds] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const {
    canReadTimeTracking,
    canCreateTimeTracking,
    canDeleteTimeTracking,
    canManageTimeTrackingTime,
    canReadActivityLog
  } = usePermission();
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
    <MainLayout noPadding>
      <div className="dh-shell">
        <div
          className={`dh-sidebar-backdrop ${mobileSidebarOpen ? 'is-open' : ''}`}
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden
        />

        <aside className={`dh-sidebar ${mobileSidebarOpen ? 'is-mobile-open' : ''}`}>
          <div className="dh-sidebar-top">
            <div className="dh-sidebar-brand">
              <div className="dh-hero-icon-box">
                <ClockCircleOutlined style={{ fontSize: 18, color: '#3b82f6' }} />
              </div>
              <div className="min-w-0">
                <h1 className="dh-sidebar-title">My Time Tracking</h1>
                <p className="dh-sidebar-subtitle">Monitor and manage your daily task sessions and work logs.</p>
              </div>
            </div>

            {canCreateTimeTracking && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setPopoverOpen(true)}
                className="dh-side-create w-full"
                style={{
                  height: 38,
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 13,
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.28)',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  border: 'none',
                  color: '#fff'
                }}
              >
                Add Time
              </Button>
            )}
          </div>
          <div className="dh-sidebar-scroll" style={{ paddingTop: 20 }}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <div style={{ display: 'flex', gap: 4, flexDirection: 'column' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Date Selection
                </div>
                <DatePicker
                  value={selectedDate}
                  onChange={(date) => setSelectedDate(date || dayjs())}
                  allowClear={false}
                  format="MMM DD, YYYY"
                  suffixIcon={<ClockCircleOutlined style={{ color: "var(--text-slate-400)" }} />}
                  style={{
                    height: 38,
                    borderRadius: 6,
                    background: "var(--bg-pure-white)",
                    border: "1px solid var(--border-slate-200)",
                    width: '100%',
                    fontWeight: 500,
                  }}
                />
                {!isToday && (
                  <Button
                    onClick={() => setSelectedDate(dayjs())}
                    block
                    style={{
                      height: 38,
                      borderRadius: 6,
                      fontWeight: 500,
                      border: "1px solid var(--border-slate-200)",
                      background: "var(--bg-pure-white)",
                    }}
                  >
                    Today
                  </Button>
                )}
              </div>

              {canReadActivityLog && (
                <div style={{ display: 'flex', gap: 4, flexDirection: 'column' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Activity
                  </div>
                  <Button
                    icon={<History size={15} />}
                    onClick={() => setHistoryOpen(true)}
                    block
                    style={{
                      height: 38,
                      borderRadius: 6,
                      fontWeight: 500,
                      border: "1px solid var(--border-slate-200)",
                      background: "var(--bg-pure-white)",
                      color: "var(--text-secondary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      paddingLeft: 14,
                      gap: 8,
                    }}
                  >
                    History
                  </Button>
                </div>
              )}

              <div style={{ display: 'flex', gap: 4, flexDirection: 'column' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Weekly Summary
                </div>
                <TimeSummary7Days refreshKey={refreshKey} />
              </div>
            </Space>
          </div>
        </aside>

        <main className="dh-main">
          <div className="dh-main-topbar">
            <Tooltip title="Menu">
              <Button
                className="dh-mobile-menu-btn"
                icon={<MenuOutlined />}
                onClick={() => setMobileSidebarOpen((v) => !v)}
                aria-label="Open menu"
                style={{ height: 38, width: 38, borderRadius: 10 }}
              />
            </Tooltip>
            
            <div className="dh-main-controls">
              {/* Controls moved to sidebar */}
            </div>
          </div>

          <div className="dh-main-scroll">
            <div className="dh-main-body">
              <div style={{ marginTop: 4 }}>
                <MyTimeStatsStrip refreshKey={refreshKey} />
              </div>

              <Row gutter={[24, 20]} align="stretch" style={{ marginTop: 20 }}>
                <Col xs={24} lg={24}>
                  <MyTimeTracker
                    selectedDate={selectedDate}
                    refreshKey={refreshKey}
                    onTotalChange={handleTotalChange}
                  />
                </Col>
              </Row>
            </div>
          </div>
        </main>
      </div>

      <ManageTimeModal
        open={manageModalOpen}
        onClose={() => setManageModalOpen(false)}
        onSuccess={() => setRefreshKey((prev) => prev + 1)}
        selectedDate={selectedDate}
      />
      <TransactionHistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        module="TimeTracking"
      />

      <style jsx global>{`
        /* ===================== Side-layout shell ===================== */
        .dh-shell {
          margin: 0;
          display: flex;
          align-items: stretch;
          min-height: calc(100vh - 54px);
          background: var(--bg-pure-white);
        }

        /* ----------------------- Sidebar ----------------------- */
        .dh-sidebar {
          position: sticky;
          top: 0;
          align-self: flex-start;
          height: calc(100vh - 54px);
          width: 272px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          background: var(--bg-secondary);
          border-right: 1px solid var(--border-slate-200);
        }
        .dh-sidebar-top {
          padding: 14px 14px 12px 18px;
          border-bottom: 1px solid var(--border-slate-200);
        }
        .dh-sidebar-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }
        .dh-sidebar-title {
          margin: 0;
          font-size: 15px;
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1.1;
          color: var(--text-slate-900);
        }
        .dh-sidebar-subtitle {
          margin: 2px 0 0 0;
          font-size: 11px;
          font-weight: 500;
          color: var(--text-slate-500);
        }
        .dh-side-create {
          height: 36px !important;
          border-radius: 6px !important;
          font-weight: 600 !important;
          border: none !important;
        }
        .dh-sidebar-scroll {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 10px 10px 6px 16px;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .dh-sidebar-scroll::-webkit-scrollbar { width: 0; height: 0; display: none; }

        /* ----------------------- Main pane ----------------------- */
        .dh-main {
          flex: 1;
          min-width: 0;
          height: calc(100vh - 54px);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: var(--bg-pure-white);
        }
        .dh-main-topbar {
          display: none;
          flex-shrink: 0;
          z-index: 60;
          align-items: center;
          gap: 14px;
          padding: 4px 20px;
          min-height: 50px;
          background: var(--bg-pure-white);
          border-bottom: 1px solid var(--border-slate-200);
        }
        .dh-main-scroll {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
        }
        .dh-main-controls {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .dh-main-body { padding: 12px 20px 14px 20px; }

        /* Hero icon box */
        .dh-hero-icon-box {
          width: 38px; height: 38px;
          background: rgba(59, 130, 246, 0.10);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid rgba(59, 130, 246, 0.18);
          flex-shrink: 0;
        }
        [data-theme='dark'] .dh-hero-icon-box {
          background: rgba(59, 130, 246, 0.16);
          border-color: rgba(59, 130, 246, 0.28);
        }

        /* Mobile drawer pieces (inert on desktop) */
        .dh-mobile-menu-btn { display: none !important; }
        .dh-sidebar-backdrop { display: none; }

        /* ---------- Responsive ---------- */
        @media (max-width: 1280px) {
          .dh-sidebar { width: 244px; }
        }
        @media (max-width: 1100px) {
          .dh-sidebar { width: 228px; }
        }
        @media (max-width: 860px) {
          .dh-shell {
            display: block;
            margin: 0;
            padding-left: 0;
            gap: 0;
          }
          /* Sidebar becomes a slide-in drawer */
          .dh-sidebar {
            position: fixed;
            top: 54px; left: 0; bottom: 0;
            height: auto;
            width: 286px;
            max-width: 86vw;
            margin: 0;
            border-radius: 0 18px 18px 0;
            border-left: none;
            transform: translateX(-103%);
            transition: transform 0.26s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 1200;
          }
          .dh-sidebar.is-mobile-open {
            transform: translateX(0);
            box-shadow: 0 24px 60px rgba(15, 23, 42, 0.28);
          }
          .dh-sidebar-backdrop {
            display: block;
            position: fixed;
            inset: 54px 0 0 0;
            background: rgba(15, 23, 42, 0.45);
            backdrop-filter: blur(2px);
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.26s ease;
            z-index: 1150;
          }
          .dh-sidebar-backdrop.is-open { opacity: 1; pointer-events: auto; }
          .dh-main {
            height: auto;
            min-height: calc(100vh - 54px);
            overflow: visible;
          }
          .dh-main-scroll { overflow: visible; }
          .dh-main-topbar { display: flex; flex-wrap: wrap; padding: 8px 14px; min-height: 0; }
          .dh-mobile-menu-btn {
            display: inline-flex !important;
            align-items: center;
            justify-content: center;
            background: var(--bg-slate-50);
            border: 1px solid var(--border-slate-200);
            color: var(--text-slate-700);
            order: 0;
          }
          .dh-main-controls { order: 2; margin-left: auto; }
        }
        @media (max-width: 560px) {
          .dh-main-body { padding: 8px 12px 14px 12px; }
        }

        /* Dark-mode surfaces */
        [data-theme="dark"] .dh-shell,
        [data-theme="dark"] .dh-main { background: var(--bg-pure-white); }
        [data-theme="dark"] .dh-mobile-menu-btn {
          background: var(--bg-slate-50) !important;
          border-color: var(--border-slate-200) !important;
          color: var(--text-slate-700) !important;
        }
      `}
      </style>
    </MainLayout>
  );
}
