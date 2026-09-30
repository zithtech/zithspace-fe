'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LineChart, Menu, X } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { PR_NAV_ITEMS, canAccessPRItem } from '@/components/performance-report/navItems';

// Shared master-detail shell for every /performance-report/* route. The left
// rail is rendered here once; sub-route pages render into {children}. Active
// state is derived from the URL (not local state), and items are filtered by
// permission.
export default function PerformanceReportLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, hasAnySubscriptionFeature } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const perms = usePermission() as unknown as Record<string, any>;
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const visibleItems = useMemo(
    () => PR_NAV_ITEMS.filter((item) => canAccessPRItem(perms, item, hasAnySubscriptionFeature)),
    [perms, hasAnySubscriptionFeature]
  );

  // Base guard: redirect if no items are accessible, or if the current tab is invalid.
  useEffect(() => {
    if (isLoading || !pathname) return;

    if (visibleItems.length === 0) {
      router.replace('/dashboard');
      return;
    }

    const currentAllowed = visibleItems.some((item) =>
      pathname === item.href || pathname.startsWith(item.href + '/')
    );
    if (!currentAllowed) {
      router.replace(visibleItems[0].href);
    }
  }, [isLoading, pathname, visibleItems, router]);

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="pr-shell">
          {/* ============================ MOBILE BACKDROP ============================ */}
          {isMobileOpen && (
            <div
              className="pr-sidebar-backdrop"
              onClick={() => setIsMobileOpen(false)}
            />
          )}

          {/* ============================ SIDEBAR ============================ */}
          <aside className={`pr-sidebar ${isMobileOpen ? 'is-open' : ''}`}>
            <div className="pr-side-head">
              <div className="pr-side-logo"><LineChart size={22} /></div>
              <div className="pr-side-head-text">
                <div className="pr-side-title">Performance Report</div>
                <div className="pr-side-subtitle">Scores · KPIs · monthly</div>
              </div>
              <button className="pr-sidebar-close" onClick={() => setIsMobileOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="pr-side-scroll">
              <div className="pr-side-section-label">Pages</div>
              <div className="pr-side-list">
                {visibleItems.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={`pr-view-item ${active ? 'is-active' : ''}`}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      <span
                        className="pr-view-icon"
                        style={{ color: active ? item.color : 'var(--text-slate-400)' }}
                      >
                        {item.icon}
                      </span>
                      <span className="pr-view-label">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* ============================ MAIN ============================ */}
          <main className="pr-main">
            <div className="pr-mobile-header">
              <button
                className="pr-mobile-toggle"
                onClick={() => setIsMobileOpen(true)}
              >
                <Menu size={20} />
              </button>
              <div className="pr-mobile-title">Performance Report</div>
            </div>
            <div className="pr-content">{children}</div>
          </main>
        </div>

        <style jsx global>{`
          .pr-shell {
            display: flex;
            margin: 0 -8px;
            min-height: calc(100vh - 64px);
            background: var(--bg-pure-white);
          }
          /* ---------------- Sidebar ---------------- */
          .pr-sidebar {
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
          .pr-side-head {
            display: flex; align-items: center; gap: 12px; padding: 2px 2px 14px; margin-bottom: 6px;
            border-bottom: 1px solid var(--border-slate-100);
          }
          .pr-side-logo { flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: var(--text-slate-900); }
          .pr-side-head-text { display: flex; flex-direction: column; min-width: 0; }
          .pr-side-title { font-size: 16px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.025em; line-height: 1.1; }
          .pr-side-subtitle {
            font-size: 10.5px; color: var(--text-slate-400); font-weight: 700; margin-top: 4px;
            text-transform: uppercase; letter-spacing: 0.07em;
          }
          .pr-side-scroll { flex: 1; overflow-y: auto; overflow-x: hidden; margin: 0 -5px; padding: 0 5px; }
          .pr-side-scroll::-webkit-scrollbar { width: 5px; }
          .pr-side-scroll::-webkit-scrollbar-thumb { background: var(--border-slate-200); border-radius: 3px; }
          .pr-side-section-label {
            font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em;
            color: var(--text-slate-400); padding: 0 8px; margin: 16px 0 6px;
          }
          .pr-side-scroll > .pr-side-section-label:first-child { margin-top: 6px; }
          .pr-side-list { display: flex; flex-direction: column; gap: 1px; }
          .pr-view-item {
            display: flex; align-items: center; gap: 10px; width: 100%;
            padding: 8px 10px; border-radius: 8px; border: none; background: transparent;
            cursor: pointer; transition: background .12s ease; text-align: left;
            text-decoration: none;
          }
          .pr-view-item:hover { background: var(--bg-slate-50); }
          .pr-view-item.is-active { background: var(--bg-blue-50); }
          .pr-view-item.is-active .pr-view-label { color: var(--text-slate-900); font-weight: 600; }
          .pr-view-icon { width: 16px; display: inline-flex; justify-content: center; align-items: center; }
          .pr-view-label { flex: 1; font-size: 13px; font-weight: 500; color: var(--text-slate-700); }
          /* ---------------- Main ---------------- */
          .pr-main { flex: 1; min-width: 0; padding: 0; display: flex; flex-direction: column; }
          .pr-content { flex: 1; min-height: 0; padding: 0; display: flex; flex-direction: column; position: relative; }
          .pr-content > div { flex: 1; display: flex; flex-direction: column; min-height: 0; }
          
          /* Stretch panel headers to the edges and make them sticky/flush */
          .pr-content > * > [class*="-header"]:not([class*="-header-"]),
          .pr-content [class*="-header"]:not([class*="-header-"]) {
            margin-top: 0 !important;
            margin-bottom: 0 !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
            padding-left: 24px !important;
            padding-right: 24px !important;
            padding-top: 14px !important;
            padding-bottom: 14px !important;
            position: sticky;
            top: 0;
            z-index: 20;
            background: var(--bg-pure-white);
            border-bottom: 1px solid var(--border-slate-200);
          }
          .pr-content > * > [class*="-footer"],
          .pr-content [class*="-footer"] {
            margin-left: 0 !important;
            margin-right: 0 !important;
            padding-left: 24px !important;
            padding-right: 24px !important;
          }

          /* ---------------- Responsive Styles ---------------- */
          .pr-sidebar-backdrop {
            display: none;
          }
          .pr-sidebar-close {
            display: none;
            background: transparent;
            border: none;
            color: var(--text-slate-500);
            cursor: pointer;
            padding: 4px;
            margin-left: auto;
          }
          .pr-mobile-header {
            display: none;
            align-items: center;
            gap: 12px;
            padding: 6px 0 10px 0;
            margin-bottom: 8px;
            border-bottom: 1px solid var(--border-slate-100);
          }
          .pr-mobile-toggle {
            background: transparent;
            border: none;
            color: var(--text-slate-700);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 4px;
          }
          .pr-mobile-title {
            font-size: 16px;
            font-weight: 700;
            color: var(--text-slate-900);
          }

          @media (max-width: 1024px) {
            .pr-sidebar {
              position: fixed;
              left: 0;
              top: 0;
              height: 100vh;
              z-index: 1000;
              transform: translateX(-100%);
              transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
              box-shadow: none;
            }
            .pr-sidebar.is-open {
              transform: translateX(0);
              box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
            }
            .pr-sidebar-backdrop {
              display: block;
              position: fixed;
              inset: 0;
              background: rgba(15, 23, 42, 0.4);
              z-index: 999;
              backdrop-filter: blur(2px);
            }
            .pr-sidebar-close {
              display: flex;
            }
            .pr-mobile-header {
              display: flex;
            }
            .pr-main {
              padding: 0;
            }
            .pr-content {
              padding: 0;
            }
            .pr-content > * > [class*="-header"]:not([class*="-header-"]),
            .pr-content [class*="-header"]:not([class*="-header-"]) {
              margin-left: 0 !important;
              margin-right: 0 !important;
              padding-left: 16px !important;
              padding-right: 16px !important;
              padding-top: 12px !important;
              padding-bottom: 12px !important;
            }
            .pr-content > * > [class*="-footer"],
            .pr-content [class*="-footer"] {
              margin-left: 0 !important;
              margin-right: 0 !important;
              padding-left: 16px !important;
              padding-right: 16px !important;
            }
          }
        `}</style>
      </MainLayout>
    </ProtectedRoute>
  );
}
