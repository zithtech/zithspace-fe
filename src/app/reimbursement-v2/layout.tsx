'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { HandCoins, Menu, X } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import {
  REIMBURSEMENT_NAV_ITEMS,
  canAccessReimbursementItem,
} from '@/components/reimbursement-v2/navItems';

// Shared master-detail shell for every /reimbursement-v2/* route. The left rail
// is rendered here once; sub-route pages render into {children}. Active state is
// derived from the URL, and items are filtered by permission.
export default function ReimbursementV2Layout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const perms = usePermission() as unknown as Record<string, any>;
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const visibleItems = useMemo(
    () => REIMBURSEMENT_NAV_ITEMS.filter((item) => canAccessReimbursementItem(perms, item)),
    [perms]
  );

  // Base guard: must be able to read or manage reimbursements at all.
  useEffect(() => {
    if (!isLoading && !perms.canReadReimbursement && !perms.canManageReimbursements) {
      router.push('/dashboard');
    }
  }, [isLoading, perms.canReadReimbursement, perms.canManageReimbursements, router]);

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="rv-shell">
          {isMobileOpen && (
            <div className="rv-sidebar-backdrop" onClick={() => setIsMobileOpen(false)} />
          )}

          <aside className={`rv-sidebar ${isMobileOpen ? 'is-open' : ''}`}>
            <div className="rv-side-head">
              <div className="rv-side-logo"><HandCoins size={22} /></div>
              <div className="rv-side-head-text">
                <div className="rv-side-title">Reimbursement</div>
                <div className="rv-side-subtitle">Claims · advances · budgets</div>
              </div>
              <button className="rv-sidebar-close" onClick={() => setIsMobileOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="rv-side-scroll">
              <div className="rv-side-section-label">Pages</div>
              <div className="rv-side-list">
                {visibleItems.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={`rv-view-item ${active ? 'is-active' : ''}`}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      <span
                        className="rv-view-icon"
                        style={{ color: active ? item.color : 'var(--text-slate-400)' }}
                      >
                        {item.icon}
                      </span>
                      <span className="rv-view-label">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </aside>

          <main className="rv-main">
            <div className="rv-mobile-header">
              <button className="rv-mobile-toggle" onClick={() => setIsMobileOpen(true)}>
                <Menu size={20} />
              </button>
              <div className="rv-mobile-title">Reimbursement</div>
            </div>
            <div className="rv-content">{children}</div>
          </main>
        </div>

        <style jsx global>{`
          .rv-shell {
            display: flex;
            margin: 0 -8px;
            min-height: calc(100vh - 64px);
            background: var(--bg-pure-white);
          }
          .rv-sidebar {
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
          .rv-side-head {
            display: flex; align-items: center; gap: 12px; padding: 2px 2px 14px; margin-bottom: 6px;
            border-bottom: 1px solid var(--border-slate-100);
          }
          .rv-side-logo { flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: var(--text-slate-900); }
          .rv-side-head-text { display: flex; flex-direction: column; min-width: 0; }
          .rv-side-title { font-size: 16px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.025em; line-height: 1.1; }
          .rv-side-subtitle {
            font-size: 10.5px; color: var(--text-slate-400); font-weight: 700; margin-top: 4px;
            text-transform: uppercase; letter-spacing: 0.07em;
          }
          .rv-side-scroll { flex: 1; overflow-y: auto; overflow-x: hidden; margin: 0 -5px; padding: 0 5px; }
          .rv-side-scroll::-webkit-scrollbar { width: 5px; }
          .rv-side-scroll::-webkit-scrollbar-thumb { background: var(--border-slate-200); border-radius: 3px; }
          .rv-side-section-label {
            font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em;
            color: var(--text-slate-400); padding: 0 8px; margin: 16px 0 6px;
          }
          .rv-side-scroll > .rv-side-section-label:first-child { margin-top: 6px; }
          .rv-side-list { display: flex; flex-direction: column; gap: 1px; }
          .rv-view-item {
            display: flex; align-items: center; gap: 10px; width: 100%;
            padding: 8px 10px; border-radius: 8px; border: none; background: transparent;
            cursor: pointer; transition: background .12s ease; text-align: left; text-decoration: none;
          }
          .rv-view-item:hover { background: var(--bg-slate-50); }
          .rv-view-item.is-active { background: var(--bg-blue-50); }
          .rv-view-item.is-active .rv-view-label { color: var(--text-slate-900); font-weight: 600; }
          .rv-view-icon { width: 16px; display: inline-flex; justify-content: center; align-items: center; }
          .rv-view-label { flex: 1; font-size: 13px; font-weight: 500; color: var(--text-slate-700); }
          .rv-main { flex: 1; min-width: 0; padding: 8px 0 0; display: flex; flex-direction: column; }
          .rv-content { flex: 1; min-height: 0; padding: 4px 32px 0; display: flex; flex-direction: column; }
          .rv-content > * > [class*="-header"] {
            margin-left: -32px !important;
            margin-right: -32px !important;
            padding-left: 32px !important;
            padding-right: 32px !important;
          }
          .rv-sidebar-backdrop { display: none; }
          .rv-sidebar-close {
            display: none; background: transparent; border: none; color: var(--text-slate-500);
            cursor: pointer; padding: 4px; margin-left: auto;
          }
          .rv-mobile-header {
            display: none; align-items: center; gap: 12px; padding: 6px 0 10px 0; margin-bottom: 8px;
            border-bottom: 1px solid var(--border-slate-100);
          }
          .rv-mobile-toggle {
            background: transparent; border: none; color: var(--text-slate-700); cursor: pointer;
            display: flex; align-items: center; justify-content: center; padding: 4px;
          }
          .rv-mobile-title { font-size: 16px; font-weight: 700; color: var(--text-slate-900); }
          @media (max-width: 1024px) {
            .rv-sidebar {
              position: fixed; left: 0; top: 0; height: 100vh; z-index: 1000;
              transform: translateX(-100%); transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: none;
            }
            .rv-sidebar.is-open { transform: translateX(0); box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15); }
            .rv-sidebar-backdrop {
              display: block; position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4);
              z-index: 999; backdrop-filter: blur(2px);
            }
            .rv-sidebar-close { display: flex; }
            .rv-mobile-header { display: flex; }
            .rv-main { padding: 4px 0 0; }
            .rv-content { padding: 4px 16px 0; }
            .rv-content > * > [class*="-header"] {
              margin-left: -16px !important; margin-right: -16px !important;
              padding-left: 16px !important; padding-right: 16px !important;
            }
          }
        `}</style>
      </MainLayout>
    </ProtectedRoute>
  );
}
