'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CalendarCheck, Menu, X } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { ATTENDANCE_NAV_ITEMS, canAccessAttendanceItem } from '@/components/attendance/navItems';

// Shared master-detail shell for every /attendance/* route. The left rail is
// rendered here once; sub-route pages render into {children}. Active state is
// derived from the URL (not local state), and items are filtered by permission.
export default function AttendanceLayout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const perms = usePermission() as unknown as Record<string, any>;
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const visibleItems = useMemo(
    () => ATTENDANCE_NAV_ITEMS.filter((item) => canAccessAttendanceItem(perms, item)),
    [perms]
  );

  // Base guard: must be able to touch attendance in some way.
  const canViewAttendance =
    !!perms.canReadAttendanceDashboard ||
    !!perms.canClockInOut ||
    !!perms.canManageAttendance ||
    !!perms.canReadAttendance;

  useEffect(() => {
    if (!isLoading && !canViewAttendance) {
      router.push('/dashboard');
    }
  }, [isLoading, canViewAttendance, router]);

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="att-shell">
          {/* ============================ MOBILE BACKDROP ============================ */}
          {isMobileOpen && (
            <div
              className="att-sidebar-backdrop"
              onClick={() => setIsMobileOpen(false)}
            />
          )}

          {/* ============================ SIDEBAR ============================ */}
          <aside className={`att-sidebar ${isMobileOpen ? 'is-open' : ''}`}>
            <div className="att-side-head">
              <div className="att-side-logo"><CalendarCheck size={22} /></div>
              <div className="att-side-head-text">
                <div className="att-side-title">Attendance</div>
                <div className="att-side-subtitle">Time · presence</div>
              </div>
              <button className="att-sidebar-close" onClick={() => setIsMobileOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="att-side-scroll">
              <div className="att-side-section-label">Pages</div>
              <div className="att-side-list">
                {visibleItems.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={`att-view-item ${active ? 'is-active' : ''}`}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      <span
                        className="att-view-icon"
                        style={{ color: active ? item.color : 'var(--text-slate-400)' }}
                      >
                        {item.icon}
                      </span>
                      <span className="att-view-label">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* ============================ MAIN ============================ */}
          <main className="att-main">
            <div className="att-mobile-header">
              <button
                className="att-mobile-toggle"
                onClick={() => setIsMobileOpen(true)}
              >
                <Menu size={20} />
              </button>
              <div className="att-mobile-title">Attendance</div>
            </div>
            <div className="att-content">{children}</div>
          </main>
        </div>

        <style jsx global>{`
          .att-shell {
            display: flex;
            margin: 0;
            height: calc(100vh - 64px);
            background: var(--bg-pure-white);
            overflow: hidden;
          }
          /* ---------------- Sidebar ---------------- */
          .att-sidebar {
            width: 240px;
            flex-shrink: 0;
            border-right: 1px solid var(--border-slate-200);
            background: var(--bg-pure-white);
            display: flex;
            flex-direction: column;
            padding: 14px 14px 0;
            position: sticky;
            top: 0;
            height: calc(100vh - 54px);
          }
          .att-side-head {
            display: flex; align-items: center; gap: 12px; padding: 2px 2px 14px; margin-bottom: 6px;
            border-bottom: 1px solid var(--border-slate-100);
          }
          .att-side-logo { flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: var(--text-slate-900); }
          .att-side-head-text { display: flex; flex-direction: column; min-width: 0; }
          .att-side-title { font-size: 16px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.025em; line-height: 1.1; }
          .att-side-subtitle {
            font-size: 10.5px; color: var(--text-slate-400); font-weight: 700; margin-top: 4px;
            text-transform: uppercase; letter-spacing: 0.07em;
          }
          .att-side-scroll { flex: 1; overflow-y: auto; overflow-x: hidden; margin: 0 -5px; padding: 0 5px; }
          .att-side-scroll::-webkit-scrollbar { width: 5px; }
          .att-side-scroll::-webkit-scrollbar-thumb { background: var(--border-slate-200); border-radius: 3px; }
          .att-side-section-label {
            font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em;
            color: var(--text-slate-400); padding: 0 8px; margin: 16px 0 6px;
          }
          .att-side-scroll > .att-side-section-label:first-child { margin-top: 6px; }
          .att-side-list { display: flex; flex-direction: column; gap: 1px; }
          .att-view-item {
            display: flex; align-items: center; gap: 10px; width: 100%;
            padding: 8px 10px; border-radius: 8px; border: none; background: transparent;
            cursor: pointer; transition: background .12s ease; text-align: left;
            text-decoration: none;
          }
          .att-view-item:hover { background: var(--bg-slate-50); }
          .att-view-item.is-active { background: var(--bg-blue-50); }
          .att-view-item.is-active .att-view-label { color: var(--text-slate-900); font-weight: 600; }
          .att-view-icon { width: 16px; display: inline-flex; justify-content: center; align-items: center; }
          .att-view-label { flex: 1; font-size: 13px; font-weight: 500; color: var(--text-slate-700); }
          /* ---------------- Main ---------------- */
          .att-main { flex: 1; min-width: 0; padding: 8px 0 0; display: flex; flex-direction: column; overflow: hidden; }
          .att-content { flex: 1; min-height: 0; padding: 0 32px; display: flex; flex-direction: column; overflow-y: auto; overflow-x: auto; scrollbar-width: none; }
          .att-content::-webkit-scrollbar { display: none; }
          /* Stretch panel headers to the edges (overriding content padding) */
          .adb-header,
          .cio-header,
          .att-header {
            margin-left: -32px !important;
            margin-right: -32px !important;
            padding-left: 32px !important;
            padding-right: 32px !important;
            padding-top: 4px !important;
            position: sticky !important;
            top: 0;
            z-index: 100;
            background: var(--bg-pure-white) !important;
            box-shadow: 0 1px 2px rgba(0,0,0,0.03);
          }

          /* Dark Mode Overrides */
          [data-theme="dark"] .att-shell,
          [data-theme="dark"] .att-sidebar {
            background: var(--bg-primary, #0f172a) !important;
          }
          [data-theme="dark"] .adb-header,
          [data-theme="dark"] .cio-header,
          [data-theme="dark"] .att-header {
            background: var(--bg-primary, #0f172a) !important;
            box-shadow: 0 1px 2px rgba(0,0,0,0.2);
          }

          /* ---------------- Responsive Styles ---------------- */
          .att-sidebar-backdrop {
            display: none;
          }
          .att-sidebar-close {
            display: none;
            background: transparent;
            border: none;
            color: var(--text-slate-500);
            cursor: pointer;
            padding: 4px;
            margin-left: auto;
          }
          .att-mobile-header {
            display: none;
            align-items: center;
            gap: 12px;
            padding: 6px 0 10px 0;
            margin-bottom: 8px;
            border-bottom: 1px solid var(--border-slate-100);
          }
          .att-mobile-toggle {
            background: transparent;
            border: none;
            color: var(--text-slate-700);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 4px;
          }
          .att-mobile-title {
            font-size: 16px;
            font-weight: 700;
            color: var(--text-slate-900);
          }

          @media (max-width: 1024px) {
            .att-sidebar {
              position: fixed;
              left: 0;
              top: 0;
              height: 100vh;
              z-index: 1000;
              transform: translateX(-100%);
              transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
              box-shadow: none;
            }
            .att-sidebar.is-open {
              transform: translateX(0);
              box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
            }
            .att-sidebar-backdrop {
              display: block;
              position: fixed;
              inset: 0;
              background: rgba(15, 23, 42, 0.4);
              z-index: 999;
              backdrop-filter: blur(2px);
            }
            .att-sidebar-close {
              display: flex;
            }
            .att-mobile-header {
              display: flex;
            }
            .att-main {
              padding: 4px 0 0;
            }
            .att-content {
              padding: 4px 16px 0;
            }
            .adb-header,
            .cio-header,
            .att-header {
              margin-left: -16px !important;
              margin-right: -16px !important;
              padding-left: 16px !important;
              padding-right: 16px !important;
            }
          }
        `}</style>
      </MainLayout>
    </ProtectedRoute>
  );
}
