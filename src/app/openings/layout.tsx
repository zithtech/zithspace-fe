'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Briefcase, X } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { OPENING_NAV_ITEMS, canAccessOpeningItem } from '@/components/openings/navItems';

// Shared master-detail shell for every /openings/* route. The left rail is
// rendered here once; sub-route pages render into {children}. Active state is
// derived from the URL, and items are filtered by permission.
export default function OpeningsLayout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const perms = usePermission() as unknown as Record<string, any>;
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const visibleItems = useMemo(
    () => OPENING_NAV_ITEMS.filter((item) => canAccessOpeningItem(perms, item)),
    [perms]
  );

  // Base guard: must be able to read or manage openings at all.
  useEffect(() => {
    if (!isLoading && !perms.canReadOpening && !perms.canManageOpenings) {
      router.push('/dashboard');
    }
  }, [isLoading, perms.canReadOpening, perms.canManageOpenings, router]);

  useEffect(() => {
    const handler = () => setIsMobileOpen(true);
    window.addEventListener('open-openings-sidebar', handler);
    return () => window.removeEventListener('open-openings-sidebar', handler);
  }, []);

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="om-shell">
          {isMobileOpen && (
            <div className="om-sidebar-backdrop" onClick={() => setIsMobileOpen(false)} />
          )}

          <aside className={`om-sidebar ${isMobileOpen ? 'is-open' : ''}`}>
            <div className="om-side-head">
              <div className="om-side-logo"><Briefcase size={22} /></div>
              <div className="om-side-head-text">
                <div className="om-side-title">Openings</div>
                <div className="om-side-subtitle">Requisitions · hiring</div>
              </div>
              <button className="om-sidebar-close" onClick={() => setIsMobileOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="om-side-scroll">
              <div className="om-side-section-label">Pages</div>
              <div className="om-side-list">
                {visibleItems.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={`om-view-item ${active ? 'is-active' : ''}`}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      <span
                        className="om-view-icon"
                        style={{ color: active ? item.color : 'var(--text-slate-400)' }}
                      >
                        {item.icon}
                      </span>
                      <span className="om-view-label">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </aside>

          <main className="om-main">
            <div className="om-content">{children}</div>
          </main>
        </div>

        <style jsx global>{`
          .om-shell {
            display: flex;
            margin: 0 -8px;
            min-height: calc(100vh - 64px);
            background: var(--bg-pure-white);
          }
          .om-sidebar {
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
          .om-side-head {
            display: flex; align-items: center; gap: 12px; padding: 2px 2px 14px; margin-bottom: 6px;
            border-bottom: 1px solid var(--border-slate-100);
          }
          .om-side-logo { flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: var(--text-slate-900); }
          .om-side-head-text { display: flex; flex-direction: column; min-width: 0; }
          .om-side-title { font-size: 16px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.025em; line-height: 1.1; }
          .om-side-subtitle {
            font-size: 10.5px; color: var(--text-slate-400); font-weight: 700; margin-top: 4px;
            text-transform: uppercase; letter-spacing: 0.07em;
          }
          .om-side-scroll { flex: 1; overflow-y: auto; overflow-x: hidden; margin: 0 -5px; padding: 0 5px; }
          .om-side-scroll::-webkit-scrollbar { width: 5px; }
          .om-side-scroll::-webkit-scrollbar-thumb { background: var(--border-slate-200); border-radius: 3px; }
          .om-side-section-label {
            font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em;
            color: var(--text-slate-400); padding: 0 8px; margin: 16px 0 6px;
          }
          .om-side-scroll > .om-side-section-label:first-child { margin-top: 6px; }
          .om-side-list { display: flex; flex-direction: column; gap: 1px; }
          .om-view-item {
            display: flex; align-items: center; gap: 10px; width: 100%;
            padding: 8px 10px; border-radius: 8px; border: none; background: transparent;
            cursor: pointer; transition: background .12s ease; text-align: left; text-decoration: none;
          }
          .om-view-item:hover { background: var(--bg-slate-50); }
          .om-view-item.is-active { background: var(--bg-blue-50); }
          .om-view-item.is-active .om-view-label { color: var(--text-slate-900); font-weight: 600; }
          .om-view-icon { width: 16px; display: inline-flex; justify-content: center; align-items: center; }
          .om-view-label { flex: 1; font-size: 13px; font-weight: 500; color: var(--text-slate-700); }
          .om-main { flex: 1; min-width: 0; padding: 0; display: flex; flex-direction: column; }
          .om-content { flex: 1; min-height: 0; padding: 0 16px 0; display: flex; flex-direction: column; }
          .om-content > * > [class*="-header"] {
            margin-left: -16px !important;
            margin-right: -16px !important;
            padding-left: 16px !important;
            padding-right: 16px !important;
          }

          .om-sidebar-backdrop { display: none; }
          .om-sidebar-close {
            display: none; background: transparent; border: none; color: var(--text-slate-500);
            cursor: pointer; padding: 4px; margin-left: auto;
          }

          @media (max-width: 1024px) {
            .om-sidebar {
              position: fixed; left: 0; top: 0; height: 100vh; z-index: 1000;
              transform: translateX(-100%); transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: none;
            }
            .om-sidebar.is-open { transform: translateX(0); box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15); }
            .om-sidebar-backdrop {
              display: block; position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4);
              z-index: 999; backdrop-filter: blur(2px);
            }
            .om-sidebar-close { display: flex; }
            .om-main { padding: 0; }
            .om-content { padding: 0 16px 0; }
            .om-content > * > [class*="-header"] {
              margin-left: -16px !important; margin-right: -16px !important;
              padding-left: 16px !important; padding-right: 16px !important;
            }
          }
        `}</style>
      </MainLayout>
    </ProtectedRoute>
  );
}
