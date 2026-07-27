'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, X } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { EXIT_NAV_ITEMS, canAccessExitItem } from '@/components/employee-exit/navItems';
import { ConfigProvider, theme } from 'antd';
import './exit-theme.css';

// Shared master-detail shell for every /employee-exit/* route.
// Matches the pv-shell aesthetic from Payroll.
export default function EmployeeExitLayout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const perms = usePermission() as unknown as Record<string, any>;
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const visibleItems = useMemo(
    () => EXIT_NAV_ITEMS.filter((item) => canAccessExitItem(perms, item)),
    [perms]
  );

  // Close sidebar on navigation
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleOpenSidebar = () => setIsMobileOpen(true);
    window.addEventListener('open-ee-sidebar', handleOpenSidebar);
    return () => window.removeEventListener('open-ee-sidebar', handleOpenSidebar);
  }, []);

  useEffect(() => {
    if (!isLoading && visibleItems.length === 0) {
      router.push('/dashboard');
    }
  }, [isLoading, visibleItems.length, router]);

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="pv-shell exit-theme">
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
              <div className="pv-side-logo"><LogOut size={22} /></div>
              <div className="pv-side-head-text">
                <div className="pv-side-title">Employee Exit</div>
                <div className="pv-side-subtitle">Offboarding & Clearances</div>
              </div>
              <button className="pv-sidebar-close" onClick={() => setIsMobileOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="pv-side-scroll">
              <div className="pv-side-section-label">Exit Management</div>
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

          {/* ============================ MAIN CONTENT ============================ */}
          <main className="pv-main">
            <header className="pv-mobile-header">
              <button className="pv-mobile-menu-btn" onClick={() => setIsMobileOpen(true)}>
                <LogOut size={20} />
              </button>
              <div className="pv-mobile-title">Employee Exit</div>
            </header>
            <div className="pv-content">
              {children}
            </div>
          </main>
        </div>

        <style jsx global>{`
          /* =====================================================================
             MASTER-DETAIL SHELL CSS (Cloned from Payroll)
             ===================================================================== */
          .pv-shell {
            display: flex;
            height: calc(100vh - var(--header-height, 60px));
            background: var(--bg-slate-50);
            overflow: hidden;
            position: relative;
          }

          /* --- SIDEBAR --- */
          .pv-sidebar {
            width: 260px;
            background: var(--bg-pure-white);
            border-right: 1px solid var(--border-slate-200);
            display: flex;
            flex-direction: column;
            flex-shrink: 0;
            z-index: 20;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .pv-side-head {
            height: 64px;
            padding: 0 20px;
            display: flex;
            align-items: center;
            gap: 12px;
            border-bottom: 1px solid var(--border-slate-100);
            flex-shrink: 0;
          }

          .pv-side-logo {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            background: linear-gradient(135deg, #0ea5e9, #0284c7);
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 6px rgba(14, 165, 233, 0.25);
          }

          .pv-side-head-text {
            display: flex;
            flex-direction: column;
          }

          .pv-side-title {
            font-size: 15px;
            font-weight: 700;
            color: var(--text-slate-900);
            line-height: 1.2;
            letter-spacing: -0.01em;
          }

          .pv-side-subtitle {
            font-size: 12px;
            color: var(--text-slate-500);
            font-weight: 500;
          }

          .pv-sidebar-close {
            display: none;
            margin-left: auto;
            background: none;
            border: none;
            color: var(--text-slate-400);
            padding: 4px;
            cursor: pointer;
          }

          .pv-side-scroll {
            flex: 1;
            overflow-y: auto;
            padding: 20px 12px;
          }

          .pv-side-section-label {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: var(--text-slate-400);
            margin: 0 0 8px 12px;
          }

          .pv-side-list {
            display: flex;
            flex-direction: column;
            gap: 4px;
            margin-bottom: 24px;
          }

          .pv-view-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px 12px;
            border-radius: 8px;
            text-decoration: none;
            color: var(--text-slate-700);
            transition: all 0.2s ease;
            cursor: pointer;
          }

          .pv-view-item:hover:not(.is-soon) {
            background: var(--bg-slate-50);
            color: var(--text-slate-900);
          }

          .pv-view-item.is-active {
            background: #f0f9ff;
            color: #0369a1;
            font-weight: 600;
          }

          .pv-view-icon {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .pv-view-label {
            font-size: 14px;
            line-height: 1.4;
          }

          .pv-view-item.is-soon {
            cursor: not-allowed;
            opacity: 0.6;
          }
          
          .pv-soon-tag {
            margin-left: auto;
            font-size: 10px;
            font-weight: 600;
            background: var(--bg-slate-100);
            color: var(--text-slate-500);
            padding: 2px 6px;
            border-radius: 4px;
            text-transform: uppercase;
          }

          /* --- MAIN CONTENT --- */
          .pv-main {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-width: 0;
            background: var(--bg-slate-50);
            overflow: hidden;
          }

          .pv-mobile-header {
            display: none;
            height: 56px;
            background: var(--bg-pure-white);
            border-bottom: 1px solid var(--border-slate-200);
            align-items: center;
            padding: 0 16px;
            gap: 12px;
            flex-shrink: 0;
          }

          .pv-mobile-menu-btn {
            background: none;
            border: none;
            color: var(--text-slate-600);
            padding: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .pv-mobile-title {
            font-size: 16px;
            font-weight: 600;
            color: var(--text-slate-900);
          }

          .pv-content {
            flex: 1;
            overflow-y: auto;
            position: relative;
            display: flex;
            flex-direction: column;
          }

          /* --- RESPONSIVE (MOBILE) --- */
          @media (max-width: 768px) {
            .pv-sidebar {
              position: absolute;
              top: 0;
              left: 0;
              bottom: 0;
              transform: translateX(-100%);
              box-shadow: 4px 0 24px rgba(0,0,0,0.1);
            }
            .pv-sidebar.is-open {
              transform: translateX(0);
            }
            .pv-sidebar-close {
              display: block;
            }
            .pv-mobile-header {
              display: flex;
            }
            .pv-sidebar-backdrop {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: rgba(15, 23, 42, 0.4);
              z-index: 10;
              backdrop-filter: blur(2px);
            }
          }
        `}</style>
      </MainLayout>
    </ProtectedRoute>
  );
}
