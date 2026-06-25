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
import { ClockCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useActivitySource } from "@/hooks/useActivitySource";
import { History, Menu } from "lucide-react";
import TransactionHistoryDrawer from "@/components/common/TransactionHistoryDrawer";
import { useTheme } from "@/context/ThemeContext";

export default function MyTimePage() {
  useActivitySource({ section: "WORK", module: "TimeTracking", page: "TimeTrackingMy" });
  const { setPopoverOpen } = useTimeTrackerStore();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>([
    dayjs().startOf('day'),
    dayjs().endOf('day')
  ]);
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
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const handleTotalChange = useCallback((total: number) => {
    setTotalSeconds(total);
  }, []);

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
            <div className="pp-side-head">
              <div className="pp-side-logo">
                <ClockCircleOutlined />
              </div>
              <div className="pp-side-head-text">
                <h1 className="pp-side-title">My Time Tracking</h1>
                <p className="pp-side-subtitle">Daily task sessions</p>
              </div>
            </div>

            {canCreateTimeTracking && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setPopoverOpen(true)}
                className="pp-create-btn"
                block
              >
                Add Time
              </Button>
            )}
          </div>
          <div className="dh-sidebar-scroll" style={{ paddingTop: 10 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
              {canReadActivityLog && (
                <div style={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
                  <div className="pp-side-section-label" style={{ margin: "6px 0 6px" }}>
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

              <div style={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
                <div className="pp-side-section-label" style={{ margin: "6px 0 6px" }}>
                  Weekly Summary
                </div>
                <TimeSummary7Days refreshKey={refreshKey} />
              </div>
            </div>
          </div>
        </aside>

        <main className="dh-main">
          <div className="dh-main-topbar">
            <Tooltip title="Menu">
              <Button
                className="dh-mobile-menu-btn"
                type="text"
                icon={<Menu size={18} />}
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

              <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', flex: 1 }}>
                <MyTimeTracker
                  dateRange={dateRange}
                  setDateRange={setDateRange}
                  refreshKey={refreshKey}
                  onTotalChange={handleTotalChange}
                />
              </div>
            </div>
          </div>
        </main>
      </div>

      <ManageTimeModal
        open={manageModalOpen}
        onClose={() => setManageModalOpen(false)}
        onSuccess={() => setRefreshKey((prev) => prev + 1)}
        selectedDate={dateRange?.[0] || dayjs()}
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
          width: 240px;
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
          display: flex;
          flex-direction: column;
        }
        .dh-main-controls {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .dh-main-body {
          padding: 12px 20px 14px 20px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

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
          .dh-sidebar { width: 220px; }
        }
        @media (max-width: 1100px) {
          .dh-sidebar { width: 200px; }
        }
        @media (max-width: 820px) {
          .dh-shell { flex-direction: column; display: flex; margin: 0; padding-left: 0; gap: 0; }
          .dh-sidebar-backdrop {
            display: block; position: fixed; top: 60px; left: 0; right: 0; bottom: 0;
            background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(2px);
            z-index: 998; opacity: 0; pointer-events: none; transition: opacity 0.3s;
          }
          .dh-sidebar-backdrop.is-open { opacity: 1; pointer-events: auto; }
          .dh-sidebar {
            position: fixed; top: 60px; left: -320px; bottom: 0;
            z-index: 999; height: calc(100vh - 60px); max-height: none; width: 280px;
            border-right: 1px solid var(--border-slate-200); border-bottom: 0; border-radius: 0;
            display: flex; flex-direction: column; align-items: stretch;
            background: var(--bg-pure-white); box-sizing: border-box;
            transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 4px 0 24px rgba(0,0,0,0.08); margin: 0; transform: none;
          }
          .dh-sidebar.is-mobile-open { left: 0; transform: none; }
          .dh-main { height: auto; min-height: calc(100vh - 54px); overflow: visible; }
          .dh-main-scroll { overflow: visible; }
          .dh-main-topbar { display: flex; flex-wrap: wrap; padding: 8px 14px; min-height: 0; }
          .dh-mobile-menu-btn {
            display: inline-flex !important; align-items: center; justify-content: center;
            background: transparent; border: none; color: var(--text-slate-700); order: 0;
          }
          .dh-main-controls { order: 2; margin-left: auto; }
        }
        @media (max-width: 560px) {
          .dh-main-body { padding: 8px 12px 14px 12px; }
        }

        /* Dark-mode surfaces */
        [data-theme="dark"] .dh-shell { background: #0B0F1A; }
        [data-theme="dark"] .dh-main { background: #0B0F1A; }
        [data-theme="dark"] .dh-main-topbar {
          background: #0B0F1A !important;
          border-bottom-color: #1F2937 !important;
        }
        [data-theme="dark"] .dh-sidebar {
          background: #0B0F1A !important;
          border-right-color: #1F2937 !important;
        }
        [data-theme="dark"] .dh-sidebar-top {
          border-bottom-color: #1F2937 !important;
        }
        [data-theme="dark"] .dh-sidebar-title {
          color: #FFFFFF !important;
        }
        [data-theme="dark"] .dh-sidebar-subtitle {
          color: #94A3B8 !important;
        }
        [data-theme="dark"] .dh-mobile-menu-btn {
          background: #161B22 !important;
          border-color: #1F2937 !important;
          color: #94A3B8 !important;
        }
        [data-theme="dark"] .dh-sidebar-scroll { background: #0B0F1A; }

        /* --- Proposals sidebar head & items styling --- */
        .pp-side-head {
          display: flex; align-items: center; gap: 12px; padding: 2px 2px 14px; margin-bottom: 6px;
          border-bottom: 1px solid var(--border-slate-100);
          width: 100%;
        }
        .pp-side-logo {
          flex-shrink: 0; display: flex; align-items: center; justify-content: center;
        }
        .pp-side-logo .anticon { font-size: 24px !important; color: var(--text-slate-900) !important; }
        .pp-side-head-text { display: flex; flex-direction: column; min-width: 0; }
        .pp-side-title { font-size: 16px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.025em; line-height: 1.1; margin: 0; }
        .pp-side-subtitle {
          font-size: 10.5px; color: var(--text-slate-400); font-weight: 700; margin-top: 4px;
          text-transform: uppercase; letter-spacing: 0.07em; margin: 0;
        }
        .pp-create-btn {
          height: 35px !important; border-radius: 8px !important; font-weight: 600 !important; font-size: 12.5px !important;
          background: #3B82F6 !important;
          border: none !important; box-shadow: none !important;
          margin-bottom: 12px;
          color: #fff !important;
          width: 100%;
        }
        .pp-create-btn:hover { background: #2563EB !important; }
        .pp-create-btn .anticon { font-size: 12px !important; }
        
        .pp-side-section-label {
          font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em;
          color: var(--text-slate-400); padding: 0 8px; margin: 16px 0 6px;
        }
        .pp-view-item {
          display: flex; align-items: center; gap: 10px; width: 100%;
          padding: 7px 10px; border-radius: 8px; border: none; background: transparent;
          cursor: pointer; transition: background .12s ease; text-align: left;
        }
        .pp-view-item:hover { background: var(--bg-slate-50); }
        .pp-view-item.is-active { background: var(--bg-blue-50); }
        .pp-view-item.is-active .pp-view-label { color: var(--text-slate-900); font-weight: 600; }
        .pp-view-icon { font-size: 14px; width: 16px; display: inline-flex; justify-content: center; align-items: center; }
        .pp-view-label { flex: 1; font-size: 13px; font-weight: 500; color: var(--text-slate-700); }
        
        [data-theme='dark'] .pp-side-logo .anticon { color: #fff !important; }
        [data-theme='dark'] .pp-side-title { color: #fff !important; }
        [data-theme='dark'] .pp-side-head { border-bottom-color: #1F2937 !important; }
        [data-theme='dark'] .pp-view-item:hover { background: rgba(255,255,255,0.04) !important; }
        [data-theme='dark'] .pp-view-item.is-active { background: rgba(59, 130, 246, 0.15) !important; }
        [data-theme='dark'] .pp-view-item.is-active .pp-view-label { color: #fff !important; }
        [data-theme='dark'] .pp-view-label { color: #94A3B8 !important; }
      `}
      </style>
    </MainLayout>
  );
}
