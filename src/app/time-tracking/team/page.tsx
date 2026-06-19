"use client";

import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button, Result, App } from "antd";
import { TeamTimeTracker } from "@/components/time-tracking/TeamTimeTracker";
import { PerformanceTracker } from "@/components/time-tracking/PerformanceTracker";
import { useTimeTrackerStore } from "@/store/useTimeTrackerStore";
import { ManageTimeModal } from "@/components/time-tracking/ManageTimeModal";

import { TeamOutlined, PlusOutlined, EditOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useActivitySource } from "@/hooks/useActivitySource";
import { History, Menu, Gauge, Users } from "lucide-react";
import TransactionHistoryDrawer from "@/components/common/TransactionHistoryDrawer";
import { useTheme } from "@/context/ThemeContext";

export default function TeamTimePage() {
  useActivitySource({ section: "WORK", module: "TimeTracking", page: "TimeTrackingTeam" });
  const { message } = App.useApp();
  const { setPopoverOpen } = useTimeTrackerStore();
  const [isManageModalOpen, setIsManageModalOpen] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [showPerformance, setShowPerformance] = React.useState(false);

  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);

  const {
    canReadTimeTrackingTeam,
    canCreateTimeTracking,
    canManageTimeTrackingTime,
    canReadActivityLog
  } = usePermission();
  const { isLoading } = useAuth();
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
    message.success("Time logged successfully");
  };

  if (isLoading) return null;

  if (!canReadTimeTrackingTeam) {
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
                <TeamOutlined style={{ fontSize: 18, color: isDark ? '#ffffff' : '#3b82f6' }} />
              </div>
              <div className="min-w-0">
                <h1 className="dh-sidebar-title">Team Tracking</h1>
                <p className="dh-sidebar-subtitle">Track team productivity, sessions, and capacity</p>
              </div>
            </div>


            {canManageTimeTrackingTime && (
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => setIsManageModalOpen(true)}
                block
                className="dh-side-create w-full"
                style={{
                  marginTop: 10,
                  height: 38,
                  borderRadius: 6,
                  fontWeight: 700,
                  fontSize: 13,
                  boxShadow: 'none',
                  background: '#3B82F6',
                  border: 'none',
                  color: '#fff'
                }}
              >
                Manage Time
              </Button>
            )}
          </div>
          <div className="dh-sidebar-scroll" style={{ paddingTop: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>

              <div style={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  Views
                </div>
                <div
                  role="button"
                  tabIndex={0}
                  className={`tt-nav-row ${!showPerformance ? 'is-active' : ''}`}
                  onClick={() => setShowPerformance(false)}
                >
                  <Users size={15} />
                  <span>Team Activity</span>
                </div>
                <div
                  role="button"
                  tabIndex={0}
                  className={`tt-nav-row ${showPerformance ? 'is-active' : ''}`}
                  onClick={() => setShowPerformance(true)}
                >
                  <Gauge size={15} />
                  <span>Performance Tracker</span>
                </div>
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
                      borderRadius: 0,
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
            </div>

            <div id="team-sidebar-filters-portal"></div>
          </div>
        </aside>

        <main className="dh-main">
          <div className="dh-main-topbar">
            <Button
              className="dh-mobile-menu-btn"
              type="text"
              icon={<Menu size={18} />}
              onClick={() => setMobileSidebarOpen((v) => !v)}
              aria-label="Open menu"
              style={{ height: 38, width: 38, borderRadius: 10 }}
            />
          </div>

          <div className="dh-main-scroll">
            <div className="dh-main-body">
              <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', flex: 1 }}>
                {showPerformance ? (
                  <PerformanceTracker refreshKey={refreshKey} />
                ) : (
                  <TeamTimeTracker refreshKey={refreshKey} />
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      <ManageTimeModal
        open={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        onSuccess={handleSuccess}
        selectedDate={dayjs()}
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

        /* ----------------------- Sidebar view nav ----------------------- */
        .tt-nav-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
          transition: background 0.15s ease, color 0.15s ease;
          user-select: none;
        }
        .tt-nav-row:hover { background: var(--bg-slate-50); color: var(--text-slate-900); }
        .tt-nav-row.is-active {
          background: rgba(59, 130, 246, 0.10);
          color: #2563eb;
          font-weight: 600;
        }
        [data-theme='dark'] .tt-nav-row:hover { background: rgba(255,255,255,0.04); }
        [data-theme='dark'] .tt-nav-row.is-active { background: rgba(59, 130, 246, 0.16); color: #93c5fd; }

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
            display: block; position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(2px);
            z-index: 998; opacity: 0; pointer-events: none; transition: opacity 0.3s;
          }
          .dh-sidebar-backdrop.is-open { opacity: 1; pointer-events: auto; }
          .dh-sidebar {
            position: fixed; top: 0; left: -320px; bottom: 0;
            z-index: 999; height: 100vh; max-height: none; width: 280px;
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
