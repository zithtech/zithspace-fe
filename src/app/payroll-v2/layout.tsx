'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Banknote, X } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { PAYROLL_NAV_ITEMS, canAccessPayrollItem } from '@/components/payroll-v2/navItems';

// Shared master-detail shell for every /payroll-v2/* route. The left rail is
// rendered here once; sub-route pages render into {children}. Active state is
// derived from the URL (not local state), and items are filtered by permission.
// Mirrors the Leaves 2.0 shell so the two modules feel identical.
export default function PayrollV2Layout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const perms = usePermission() as unknown as Record<string, any>;
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const visibleItems = useMemo(
    () => PAYROLL_NAV_ITEMS.filter((item) => canAccessPayrollItem(perms, item)),
    [perms]
  );

  // Close sidebar on navigation
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleOpenSidebar = () => setIsMobileOpen(true);
    window.addEventListener('open-pv-sidebar', handleOpenSidebar);
    return () => window.removeEventListener('open-pv-sidebar', handleOpenSidebar);
  }, []);

  // Base guard: redirect only if there's nothing the user can access. Self-
  // service items (My Payslips) are always visible, so any authenticated user
  // can reach the module; admin pages remain individually permission-gated.
  useEffect(() => {
    if (!isLoading && visibleItems.length === 0) {
      router.push('/dashboard');
    }
  }, [isLoading, visibleItems.length, router]);

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="pv-shell">
          {/* ============================ MOBILE BACKDROP ============================ */}
          {isMobileOpen && (
            <div
              className="pv-sidebar-backdrop"
              onClick={() => setIsMobileOpen(false)}
            />
          )}

          {/* ============================ SIDEBAR ============================ */}
          <aside className={`pv-sidebar ${isMobileOpen ? 'is-open' : ''}`}>
            <div className="pv-side-head">
              <div className="pv-side-logo"><Banknote size={22} /></div>
              <div className="pv-side-head-text">
                <div className="pv-side-title">Payroll</div>
                <div className="pv-side-subtitle">Pay · components · statutory</div>
              </div>
              <button className="pv-sidebar-close" onClick={() => setIsMobileOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="pv-side-scroll">
              <div className="pv-side-section-label">Settings &amp; Configuration</div>
              <div className="pv-side-list">
                {visibleItems.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + '/');
                  if (item.comingSoon) {
                    return (
                      <div key={item.key} className="pv-view-item is-soon" title="Coming soon">
                        <span className="pv-view-icon" style={{ color: 'var(--text-slate-400)' }}>
                          {item.icon}
                        </span>
                        <span className="pv-view-label">{item.label}</span>
                        <span className="pv-soon-tag">Soon</span>
                      </div>
                    );
                  }
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={`pv-view-item ${active ? 'is-active' : ''}`}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      <span
                        className="pv-view-icon"
                        style={{ color: active ? item.color : 'var(--text-slate-400)' }}
                      >
                        {item.icon}
                      </span>
                      <span className="pv-view-label">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* ============================ MAIN ============================ */}
          <main className="pv-main">
            <div className="pv-content">{children}</div>
          </main>
        </div>

        <style jsx global>{`
          .pv-shell {
            display: flex;
            margin: 0 -8px;
            min-height: calc(100vh - 64px);
            background: var(--bg-pure-white);
          }
          /* ---------------- Sidebar ---------------- */
          .pv-sidebar {
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
          .pv-side-head {
            display: flex; align-items: center; gap: 12px; padding: 2px 2px 14px; margin-bottom: 6px;
            border-bottom: 1px solid var(--border-slate-100);
          }
          .pv-side-logo { flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: var(--text-slate-900); }
          .pv-side-head-text { display: flex; flex-direction: column; min-width: 0; }
          .pv-side-title { font-size: 16px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.025em; line-height: 1.1; }
          .pv-side-subtitle {
            font-size: 10.5px; color: var(--text-slate-400); font-weight: 700; margin-top: 4px;
            text-transform: uppercase; letter-spacing: 0.07em;
          }
          .pv-side-scroll { flex: 1; overflow-y: auto; overflow-x: hidden; margin: 0 -5px; padding: 0 5px; }
          .pv-side-scroll::-webkit-scrollbar { width: 5px; }
          .pv-side-scroll::-webkit-scrollbar-thumb { background: var(--border-slate-200); border-radius: 3px; }
          .pv-side-section-label {
            font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em;
            color: var(--text-slate-400); padding: 0 8px; margin: 16px 0 6px;
          }
          .pv-side-scroll > .pv-side-section-label:first-child { margin-top: 6px; }
          .pv-side-list { display: flex; flex-direction: column; gap: 1px; }
          .pv-view-item {
            display: flex; align-items: center; gap: 10px; width: 100%;
            padding: 8px 10px; border-radius: 8px; border: none; background: transparent;
            cursor: pointer; transition: background .12s ease; text-align: left;
            text-decoration: none;
          }
          .pv-view-item:hover { background: var(--bg-slate-50); }
          .pv-view-item.is-active { background: var(--bg-blue-50); }
          .pv-view-item.is-active .pv-view-label { color: var(--text-slate-900); font-weight: 600; }
          .pv-view-item.is-soon { cursor: default; opacity: 0.6; }
          .pv-view-item.is-soon:hover { background: transparent; }
          .pv-view-icon { width: 16px; display: inline-flex; justify-content: center; align-items: center; }
          .pv-view-label { flex: 1; font-size: 13px; font-weight: 500; color: var(--text-slate-700); }
          .pv-soon-tag {
            font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
            color: var(--text-slate-400); background: var(--bg-slate-50);
            border: 1px solid var(--border-slate-200); border-radius: 5px; padding: 1px 5px;
          }
          /* ---------------- Main ---------------- */
          .pv-main { flex: 1; min-width: 0; padding: 8px 18px 0; display: flex; flex-direction: column; }
          .pv-content { flex: 1; min-height: 0; padding: 4px 4px 0; display: flex; flex-direction: column; }

          /* Every payroll-v2 page header sticks to the top of the scroll area so
             the title + Reset/Save actions stay visible while the body scrolls.
             Panels only style their header's layout/border — position, background
             and z-index live here so all pages behave identically. */
          .pv-header, .pvpb-header, .pvw-header, .pvep-header, .pvg-header,
          .pvr-header, .pvss-header, .rpt-header, .pvs-header, .pvc-header,
          .pvst-header, .mps-header {
            position: sticky;
            top: 0;
            z-index: 20;
            background: var(--bg-pure-white);
            box-shadow: 0 6px 16px -14px rgba(15, 23, 42, 0.4);
          }
          
          /* ---------------- Mobile ---------------- */
          .pv-mobile-menu-btn {
            display: none;
          }
          .pv-sidebar-close {
            display: none;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            border-radius: 6px;
            background: transparent;
            border: none;
            color: var(--text-slate-500);
            cursor: pointer;
            margin-left: auto;
          }
          .pv-sidebar-close:hover {
            background: var(--bg-slate-50);
            color: var(--text-slate-900);
          }

          @media (max-width: 900px) {
            .pv-sidebar {
              position: fixed;
              left: 0;
              top: 0;
              height: 100vh;
              z-index: 1000;
              transform: translateX(-100%);
              transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
              box-shadow: none;
            }
            .pv-sidebar.is-open {
              transform: translateX(0);
              box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
            }
            .pv-sidebar-backdrop {
              display: block;
              position: fixed;
              inset: 0;
              background: rgba(15, 23, 42, 0.4);
              z-index: 999;
              backdrop-filter: blur(2px);
            }
            .pv-sidebar-close {
              display: flex;
            }
            .pv-mobile-menu-btn {
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
            .pv-mobile-menu-btn:hover {
              background: var(--bg-slate-100);
            }
            .pv-main {
              padding: 0;
            }
            .pv-content {
              padding: 0 16px;
            }
            .pv-content > * > [class*="-header"] {
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
