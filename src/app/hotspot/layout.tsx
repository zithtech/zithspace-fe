'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Flame, X } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { HOTSPOT_NAV_ITEMS } from '@/components/hotspot/navItems';
import { usePermission } from '@/hooks/usePermission';

// Shared shell for every /hotspot/* route. The left rail is rendered here once;
// sub-route pages render into {children}. Active state is derived from the URL.
//
// The rail mirrors the Opening Management shell (class prefix `hs-` instead of
// `om-`) so the two modules feel like one product, and so the panel headers get
// the same edge-to-edge stretch. Below 1024px it collapses to an off-canvas
// drawer opened by the hamburger in PanelHeader.
export default function HotspotLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { can } = usePermission();

  useEffect(() => {
    const handler = () => setIsMobileOpen(true);
    window.addEventListener('open-hotspot-sidebar', handler);
    return () => window.removeEventListener('open-hotspot-sidebar', handler);
  }, []);

  const visibleItems = HOTSPOT_NAV_ITEMS.filter(item => !item.permission || can(item.permission));

  return (
    <ProtectedRoute>
      <MainLayout hideSideNav>
        <div className="hs-shell">
          {isMobileOpen && (
            <div className="hs-sidebar-backdrop" onClick={() => setIsMobileOpen(false)} />
          )}

          <aside className={`hs-sidebar ${isMobileOpen ? 'is-open' : ''}`}>
            <div className="hs-side-head">
              <div className="hs-side-logo"><Flame size={22} /></div>
              <div className="hs-side-head-text">
                <div className="hs-side-title">Hotspot</div>
                <div className="hs-side-subtitle">Internal · company-wide</div>
              </div>
              <button className="hs-sidebar-close" onClick={() => setIsMobileOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="hs-side-scroll">
              <div className="hs-side-section-label">Pages</div>
              <div className="hs-side-list">
                {visibleItems.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={`hs-view-item ${active ? 'is-active' : ''}`}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      <span
                        className="hs-view-icon"
                        style={{ color: active ? item.color : 'var(--text-slate-400)' }}
                      >
                        {item.icon}
                      </span>
                      <span className="hs-view-text">
                        <span className="hs-view-label">{item.label}</span>
                        <span className="hs-view-hint">{item.hint}</span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </aside>

          <main className="hs-main">
            <div className="hs-content">{children}</div>
          </main>
        </div>

        <style jsx global>{`
          .hs-shell {
            display: flex;
            margin: 0 -8px;
            min-height: calc(100vh - 64px);
            background: var(--bg-pure-white);
          }
          .hs-sidebar {
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
          .hs-side-head {
            display: flex; align-items: center; gap: 12px; padding: 2px 2px 14px; margin-bottom: 6px;
            border-bottom: 1px solid var(--border-slate-100);
          }
          .hs-side-logo { flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: var(--text-slate-900); }
          .hs-side-head-text { display: flex; flex-direction: column; min-width: 0; }
          .hs-side-title { font-size: 16px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.025em; line-height: 1.1; }
          .hs-side-subtitle {
            font-size: 10.5px; color: var(--text-slate-400); font-weight: 700; margin-top: 4px;
            text-transform: uppercase; letter-spacing: 0.07em;
          }
          .hs-side-scroll { flex: 1; overflow-y: auto; overflow-x: hidden; margin: 0 -5px; padding: 0 5px; }
          .hs-side-scroll::-webkit-scrollbar { width: 5px; }
          .hs-side-scroll::-webkit-scrollbar-thumb { background: var(--border-slate-200); border-radius: 3px; }
          .hs-side-section-label {
            font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em;
            color: var(--text-slate-400); padding: 0 8px; margin: 16px 0 6px;
          }
          .hs-side-scroll > .hs-side-section-label:first-child { margin-top: 6px; }
          .hs-side-list { display: flex; flex-direction: column; gap: 1px; }
          .hs-view-item {
            display: flex; align-items: flex-start; gap: 10px; width: 100%;
            padding: 8px 10px; border-radius: 8px; border: none; background: transparent;
            cursor: pointer; transition: background .12s ease; text-align: left; text-decoration: none;
          }
          .hs-view-item:hover { background: var(--bg-slate-50); }
          .hs-view-item.is-active { background: var(--bg-blue-50); }
          .hs-view-item.is-active .hs-view-label { color: var(--text-slate-900); font-weight: 600; }
          .hs-view-icon { width: 16px; display: inline-flex; justify-content: center; align-items: center; margin-top: 2px; }
          .hs-view-text { display: flex; flex-direction: column; min-width: 0; }
          .hs-view-label { font-size: 13px; font-weight: 500; color: var(--text-slate-700); line-height: 1.3; }
          .hs-view-hint {
            font-size: 10.5px; color: var(--text-slate-400); font-weight: 500; margin-top: 2px;
            overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          }
          .hs-main { flex: 1; min-width: 0; padding: 0; display: flex; flex-direction: column; }
          .hs-content { flex: 1; min-height: 0; padding: 0 16px 0; display: flex; flex-direction: column; }
          .hs-content > * > [class*="-header"] {
            margin-left: -16px !important;
            margin-right: -16px !important;
            padding-left: 16px !important;
            padding-right: 16px !important;
          }

          .hs-sidebar-backdrop { display: none; }
          .hs-sidebar-close {
            display: none; background: transparent; border: none; color: var(--text-slate-500);
            cursor: pointer; padding: 4px; margin-left: auto;
          }

          @media (max-width: 1024px) {
            .hs-sidebar {
              position: fixed; left: 0; top: 0; height: 100vh; z-index: 1000;
              transform: translateX(-100%); transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: none;
            }
            .hs-sidebar.is-open { transform: translateX(0); box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15); }
            .hs-sidebar-backdrop {
              display: block; position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4);
              z-index: 999; backdrop-filter: blur(2px);
            }
            .hs-sidebar-close { display: flex; }
            .hs-main { padding: 0; }
            .hs-content { padding: 0 16px 0; }
          }
        `}</style>
      </MainLayout>
    </ProtectedRoute>
  );
}
