'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CalendarRange, Menu, X } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { LEAVE_NAV_ITEMS, canAccessLeaveItem } from '@/components/leaves-v2/navItems';

// Shared master-detail shell for every /leaves-v2/* route. The left rail is
// rendered here once; sub-route pages render into {children}. Active state is
// derived from the URL (not local state), and items are filtered by permission.
export default function LeavesV2Layout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const perms = usePermission() as unknown as Record<string, any>;
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const visibleItems = useMemo(
    () => LEAVE_NAV_ITEMS.filter((item) => canAccessLeaveItem(perms, item)),
    [perms]
  );

  // Close sidebar on navigation
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleOpenSidebar = () => setIsMobileOpen(true);
    window.addEventListener('open-lv-sidebar', handleOpenSidebar);
    return () => window.removeEventListener('open-lv-sidebar', handleOpenSidebar);
  }, []);

  // Base guard: must be able to read or manage leaves at all.
  useEffect(() => {
    if (!isLoading && !perms.canReadLeave && !perms.canManageLeaves) {
      router.push('/dashboard');
    }
  }, [isLoading, perms.canReadLeave, perms.canManageLeaves, router]);

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="lv-shell">
          {/* ============================ MOBILE BACKDROP ============================ */}
          {isMobileOpen && (
            <div
              className="lv-sidebar-backdrop"
              onClick={() => setIsMobileOpen(false)}
            />
          )}

          {/* ============================ SIDEBAR ============================ */}
          <aside className={`lv-sidebar ${isMobileOpen ? 'is-open' : ''}`}>
            <div className="lv-side-head">
              <div className="lv-side-logo"><CalendarRange size={22} /></div>
              <div className="lv-side-head-text">
                <div className="lv-side-title">Leaves</div>
                <div className="lv-side-subtitle">Time off · balances</div>
              </div>
              <button className="lv-sidebar-close" onClick={() => setIsMobileOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="lv-side-scroll">
              <div className="lv-side-section-label">Pages</div>
              <div className="lv-side-list">
                {visibleItems.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={`lv-view-item ${active ? 'is-active' : ''}`}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      <span
                        className="lv-view-icon"
                        style={{ color: active ? item.color : 'var(--text-slate-400)' }}
                      >
                        {item.icon}
                      </span>
                      <span className="lv-view-label">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* ============================ MAIN ============================ */}
          <main className="lv-main">
            <div className="lv-content">{children}</div>
          </main>
        </div>

        <style jsx global>{`
          .lv-shell {
            display: flex;
            margin: 0 -8px;
            min-height: calc(100vh - 64px);
            background: var(--bg-pure-white);
          }
          /* ---------------- Sidebar ---------------- */
          .lv-sidebar {
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
          .lv-side-head {
            display: flex; align-items: center; gap: 12px; padding: 2px 2px 14px; margin-bottom: 6px;
            border-bottom: 1px solid var(--border-slate-100);
          }
          .lv-side-logo { flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: var(--text-slate-900); }
          .lv-side-head-text { display: flex; flex-direction: column; min-width: 0; }
          .lv-side-title { font-size: 16px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.025em; line-height: 1.1; }
          .lv-side-subtitle {
            font-size: 10.5px; color: var(--text-slate-400); font-weight: 700; margin-top: 4px;
            text-transform: uppercase; letter-spacing: 0.07em;
          }
          .lv-side-scroll { flex: 1; overflow-y: auto; overflow-x: hidden; margin: 0 -5px; padding: 0 5px; }
          .lv-side-scroll::-webkit-scrollbar { width: 5px; }
          .lv-side-scroll::-webkit-scrollbar-thumb { background: var(--border-slate-200); border-radius: 3px; }
          .lv-side-section-label {
            font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em;
            color: var(--text-slate-400); padding: 0 8px; margin: 16px 0 6px;
          }
          .lv-side-scroll > .lv-side-section-label:first-child { margin-top: 6px; }
          .lv-side-list { display: flex; flex-direction: column; gap: 1px; }
          .lv-view-item {
            display: flex; align-items: center; gap: 10px; width: 100%;
            padding: 8px 10px; border-radius: 8px; border: none; background: transparent;
            cursor: pointer; transition: background .12s ease; text-align: left;
            text-decoration: none;
          }
          .lv-view-item:hover { background: var(--bg-slate-50); }
          .lv-view-item.is-active { background: var(--bg-blue-50); }
          .lv-view-item.is-active .lv-view-label { color: var(--text-slate-900); font-weight: 600; }
          .lv-view-icon { width: 16px; display: inline-flex; justify-content: center; align-items: center; }
          .lv-view-label { flex: 1; font-size: 13px; font-weight: 500; color: var(--text-slate-700); }
          /* ---------------- Main ---------------- */
          .lv-main { flex: 1; min-width: 0; padding: 0; display: flex; flex-direction: column; }
          .lv-content { flex: 1; min-height: 0; padding: 0 32px; display: flex; flex-direction: column; position: relative; }
          
          /* Stretch panel headers to the edges and make them sticky */
          .lv-content > * > [class*="-header"] {
            margin-left: -32px !important;
            margin-right: -32px !important;
            padding-left: 32px !important;
            padding-right: 32px !important;
            position: sticky;
            top: 0;
            z-index: 98;
            background: var(--bg-pure-white);
            padding-top: 12px !important;
            margin-top: 0 !important;
            margin-bottom: 0 !important;
          }

          /* Restore the gap below the header that was removed by margin-bottom: 0 */
          .lv-content > * > [class*="-header"] + * {
            margin-top: 16px !important;
          }

          /* ---------------- Responsive Styles ---------------- */
          .lv-sidebar-backdrop {
            display: none;
          }
          .lv-sidebar-close {
            display: none;
            background: transparent;
            border: none;
            color: var(--text-slate-500);
            cursor: pointer;
            padding: 4px;
            margin-left: auto;
          }
          .lv-mobile-menu-btn {
            display: none;
          }

          @media (max-width: 1024px) {
            .lv-sidebar {
              position: fixed;
              left: 0;
              top: 0;
              height: 100vh;
              z-index: 1000;
              transform: translateX(-100%);
              transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
              box-shadow: none;
            }
            .lv-sidebar.is-open {
              transform: translateX(0);
              box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
            }
            .lv-sidebar-backdrop {
              display: block;
              position: fixed;
              inset: 0;
              background: rgba(15, 23, 42, 0.4);
              z-index: 999;
              backdrop-filter: blur(2px);
            }
            .lv-sidebar-close {
              display: flex;
            }
            .lv-mobile-menu-btn {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 36px;
              height: 36px;
              border-radius: 8px;
              background: var(--bg-slate-50);
              border: 1px solid var(--border-slate-200);
              color: var(--text-slate-700);
              cursor: pointer;
              margin-right: 12px;
            }
            .lv-mobile-menu-btn:hover {
              background: var(--bg-slate-100);
            }
            .lv-main {
              padding: 0;
            }
            .lv-content {
              padding: 0 16px;
            }
            .lv-content > * > [class*="-header"] {
              margin-left: -16px !important;
              margin-right: -16px !important;
              padding-left: 16px !important;
              padding-right: 16px !important;
              padding-top: 8px !important;
            }
          }
        `}</style>
      </MainLayout>
    </ProtectedRoute>
  );
}
