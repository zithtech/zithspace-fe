'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Settings, Menu, X } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/common/ProtectedRoute';

const NAV_ITEMS = [
  { key: 'candidates', label: 'Candidates', href: '/pipeline/candidates', icon: <Users size={16} /> },
  { key: 'configs', label: 'Configurations', href: '/pipeline/configurations', icon: <Settings size={16} /> },
];

export default function PipelineLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="pl-shell">
          {isMobileOpen && (
            <div className="pl-sidebar-backdrop" onClick={() => setIsMobileOpen(false)} />
          )}

          <aside className={`pl-sidebar ${isMobileOpen ? 'is-open' : ''}`}>
            <div className="pl-side-head">
              <div className="pl-side-logo"><Users size={22} /></div>
              <div className="pl-side-head-text">
                <div className="pl-side-title">Recruitment Pipeline</div>
                <div className="pl-side-subtitle">Candidates · Offers</div>
              </div>
              <button className="pl-sidebar-close" onClick={() => setIsMobileOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="pl-side-scroll">
              <div className="pl-side-section-label">Menu</div>
              <div className="pl-side-list">
                {NAV_ITEMS.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={`pl-view-item ${active ? 'is-active' : ''}`}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      <span className="pl-view-icon" style={{ color: active ? 'var(--blue-500)' : 'var(--text-slate-400)' }}>
                        {item.icon}
                      </span>
                      <span className="pl-view-label">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </aside>

          <main className="pl-main">
            <div className="pl-mobile-header">
              <button className="pl-mobile-toggle" onClick={() => setIsMobileOpen(true)}>
                <Menu size={20} />
              </button>
              <div className="pl-mobile-title">Recruitment Pipeline</div>
            </div>
            <div className="pl-content">{children}</div>
          </main>
        </div>

        <style jsx global>{`
          .pl-shell {
            display: flex;
            margin: 0 -8px;
            min-height: calc(100vh - 64px);
            background: var(--bg-pure-white);
          }
          .pl-sidebar {
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
          .pl-side-head {
            display: flex; align-items: center; gap: 12px; padding: 2px 2px 14px; margin-bottom: 6px;
            border-bottom: 1px solid var(--border-slate-100);
          }
          .pl-side-logo { flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: var(--text-slate-900); }
          .pl-side-head-text { display: flex; flex-direction: column; min-width: 0; }
          .pl-side-title { font-size: 16px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.025em; line-height: 1.1; }
          .pl-side-subtitle {
            font-size: 10.5px; color: var(--text-slate-400); font-weight: 700; margin-top: 4px;
            text-transform: uppercase; letter-spacing: 0.07em;
          }
          .pl-side-scroll { flex: 1; overflow-y: auto; overflow-x: hidden; margin: 0 -5px; padding: 0 5px; }
          .pl-side-scroll::-webkit-scrollbar { width: 5px; }
          .pl-side-scroll::-webkit-scrollbar-thumb { background: var(--border-slate-200); border-radius: 3px; }
          .pl-side-section-label {
            font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em;
            color: var(--text-slate-400); padding: 0 8px; margin: 16px 0 6px;
          }
          .pl-side-list { display: flex; flex-direction: column; gap: 1px; }
          .pl-view-item {
            display: flex; align-items: center; gap: 10px; width: 100%;
            padding: 8px 10px; border-radius: 8px; border: none; background: transparent;
            cursor: pointer; transition: background .12s ease; text-align: left;
            text-decoration: none;
          }
          .pl-view-item:hover { background: var(--bg-slate-50); }
          .pl-view-item.is-active { background: var(--bg-blue-50); }
          .pl-view-item.is-active .pl-view-label { color: var(--text-slate-900); font-weight: 600; }
          .pl-view-icon { width: 16px; display: inline-flex; justify-content: center; align-items: center; }
          .pl-view-label { flex: 1; font-size: 13px; font-weight: 500; color: var(--text-slate-700); }
          .pl-main { flex: 1; min-width: 0; padding: 8px 0 0; display: flex; flex-direction: column; }
          .pl-content { flex: 1; min-height: 0; padding: 4px 32px 0; display: flex; flex-direction: column; }
          
          .pl-content > * > [class*="-header"],
          .pl-content > * > [class*="-footer"] {
            margin-left: -32px !important;
            margin-right: -32px !important;
            padding-left: 32px !important;
            padding-right: 32px !important;
          }

          .pl-topbar { 
            display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
            position: sticky; top: 0; z-index: 30;
            background: var(--bg-pure-white);
            margin: -4px -32px 8px -32px;
            padding: 8px 32px 8px 32px;
            border-bottom: 1px solid var(--border-slate-200);
          }
          .pl-search-wrap {
            position: relative; flex: 1; max-width: 520px; min-width: 240px; display: flex; align-items: center;
            height: 32px; border-radius: 8px; background: var(--bg-pure-white);
            border: 1px solid var(--border-slate-200); padding: 0 10px;
          }
          .pl-search-wrap:focus-within { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.10); }
          .pl-search-icon { color: var(--text-slate-400); font-size: 14px; }
          .pl-search {
            flex: 1; border: none; outline: none; background: transparent; margin-left: 9px;
            font-size: 13px; color: var(--text-slate-900);
          }
          .pl-search::placeholder { color: var(--text-slate-400); }
          .pl-topbar-meta { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--text-slate-500); white-space: nowrap; }
          .pl-topbar-meta strong { color: var(--text-slate-700); font-weight: 700; }
          .pl-pulse { width: 6px; height: 6px; border-radius: 50%; background: #10b981; display: inline-block; box-shadow: 0 0 0 3px rgba(16,185,129,0.18); margin-right: 5px; }
          .pl-topbar-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
          .pl-divider { display: none; }
          
          .pl-body { flex: 1 0 auto; padding-bottom: 60px; min-width: 0; }

          /* Footer + pager */
          .pl-footer {
            display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
            padding: 10px 14px; border-top: 1px solid var(--border-slate-200);
          }
          .pl-footer--sticky {
            position: sticky; bottom: 0; z-index: 30;
            margin: 8px -32px 0 -32px;
            padding: 0 32px 0 32px;
            background: var(--bg-pure-white);
            box-shadow: 0 -4px 14px rgba(15,23,42,0.05);
            height: 45px;
          }
          .pl-footer-info { font-size: 12px; color: var(--text-slate-500); }
          .pl-footer-info strong { color: var(--text-slate-700); font-weight: 700; }
          .pl-pager { display: flex; align-items: center; gap: 3px; }
          .pl-pager-btn, .pl-pager-num {
            min-width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border-slate-200);
            background: var(--bg-pure-white); color: var(--text-slate-600); cursor: pointer; font-size: 12.5px; font-weight: 600;
          }
          .pl-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
          .pl-pager-num.is-active { background: #3B82F6; border-color: #3B82F6; color: #fff; }
          .pl-pagesize { margin-left: 5px; }
          .pl-pagesize .ant-select-selector { border-radius: 7px !important; height: 28px !important; }

          .pl-sidebar-backdrop { display: none; }
          .pl-sidebar-close { display: none; background: transparent; border: none; color: var(--text-slate-500); cursor: pointer; padding: 4px; margin-left: auto; }
          .pl-mobile-header { display: none; align-items: center; gap: 12px; padding: 6px 0 10px 0; margin-bottom: 8px; border-bottom: 1px solid var(--border-slate-100); }
          .pl-mobile-toggle { background: transparent; border: none; color: var(--text-slate-700); cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 4px; }
          .pl-mobile-title { font-size: 16px; font-weight: 700; color: var(--text-slate-900); }

          @media (max-width: 1024px) {
            .pl-sidebar {
              position: fixed; left: 0; top: 0; height: 100vh; z-index: 1000;
              transform: translateX(-100%); transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: none;
            }
            .pl-sidebar.is-open { transform: translateX(0); box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15); }
            .pl-sidebar-backdrop { display: block; position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); z-index: 999; backdrop-filter: blur(2px); }
            .pl-sidebar-close { display: flex; }
            .pl-mobile-header { display: flex; }
            .pl-main { padding: 4px 0 0; }
            .pl-content { padding: 4px 16px 0; }
            .pl-content > * > [class*="-header"],
            .pl-content > * > [class*="-footer"] {
              margin-left: -16px !important; margin-right: -16px !important; padding-left: 16px !important; padding-right: 16px !important;
            }
          }
        `}</style>
      </MainLayout>
    </ProtectedRoute>
  );
}
